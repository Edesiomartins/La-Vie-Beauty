import { GoogleGenerativeAI } from '@google/generative-ai';
import admin from 'firebase-admin';

// CONFIGURAÇÃO DO FIREBASE ADMIN
// Verifica se já existe uma instância para evitar erro de "Duplicate App" no hot-reload
if (!admin.apps.length) {
  try {
    // AJUSTADO: Agora busca tanto com o prefixo _ADMIN quanto sem, para garantir compatibilidade com sua Vercel
    const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || 'la-vie---coiffeur';
    const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL || process.env.FIREBASE_CLIENT_EMAIL;
    const privateKeyRaw = process.env.FIREBASE_ADMIN_PRIVATE_KEY || process.env.FIREBASE_PRIVATE_KEY;

    // Verificação crítica das variáveis
    if (!clientEmail || !privateKeyRaw) {
      throw new Error('Faltam credenciais do Firebase (FIREBASE_ADMIN_CLIENT_EMAIL ou FIREBASE_ADMIN_PRIVATE_KEY)');
    }

    // TRATAMENTO DA CHAVE PRIVADA (A parte mais importante para o erro DECODER)
    // 1. Remove aspas duplas no início e fim, se houver (comum ao copiar de .env)
    let privateKey = privateKeyRaw.replace(/^"|"$/g, '');
    
    // 2. Substitui o literal "\n" por quebras de linha reais
    // Isso conserta o erro "DECODER routines::unsupported"
    if (privateKey.includes('\\n')) {
      privateKey = privateKey.replace(/\\n/g, '\n');
    }

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: projectId,
        clientEmail: clientEmail,
        privateKey: privateKey,
      }),
    });
    
    console.log('✅ Firebase Admin inicializado com sucesso!');

  } catch (error) {
    console.error('❌ Erro fatal na inicialização do Firebase Admin:', error.message);
    // Não damos throw aqui para permitir que a função retorne um erro 500 JSON limpo
  }
}

const db = admin.firestore();

// CONFIGURAÇÃO GEMINI
// Inicializa fora do handler para reutilizar conexão se possível
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export default async function handler(req, res) {
  // 1. Configuração de CORS (Essencial para o frontend chamar esta API)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Responde imediatamente a requisições pre-flight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  try {
    // 2. Validações Iniciais
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY não configurada no servidor.');
    }
    
    // Se o Firebase falhou ao iniciar lá em cima
    if (!admin.apps.length) {
      throw new Error('Firebase Admin não foi inicializado corretamente. Verifique os logs do servidor.');
    }

    const { message, history, salonId, clientId, conversationId } = req.body;

    if (!message) {
      return res.status(400).json({ message: 'Mensagem é obrigatória.' });
    }

    // conversationId é opcional, mas útil para logs
    if (conversationId) {
      console.log(`💬 Conversa: ${conversationId}, Cliente: ${clientId}, Salão: ${salonId}`);
    }

    // 3. Buscar Contexto (Serviços) no Firestore
    // Usamos um array vazio como fallback se o banco falhar, para o chat não travar
    let servicesText = "Serviços indisponíveis no momento.";
    let servicesList = [];
    
    try {
      const servicesRef = db.collection('services'); // Ajuste se sua coleção tiver outro nome
      const snapshot = await servicesRef.get();
      
      if (!snapshot.empty) {
        servicesList = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                name: data.name || data.nome,
                price: data.price || data.preco,
                duration: data.duration || data.duracao
            };
        });
        
        servicesText = servicesList.map(s => 
          `- ${s.name} (R$ ${s.price}, ${s.duration} min)`
        ).join('\n');
      }
    } catch (dbError) {
      console.error('⚠️ Erro ao buscar serviços (continuando sem contexto):', dbError.message);
    }

    // 4. Montar o Prompt para o Gemini
    // Usando gemini-1.5-flash que é mais rápido e eficiente para chat
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' }); 

    const systemInstruction = `
      Você é a "Vie", assistente virtual do salão de beleza La Vie Coiffeur.
      Seu tom é elegante, acolhedor e profissional.
      
      CONTEXTO DO SALÃO:
      Serviços disponíveis:
      ${servicesText}

      REGRAS:
      1. Se o cliente quiser agendar, pergunte: Qual serviço? Qual data/horário preferido?
      2. Se o cliente confirmar um horário explicitamente, responda com um JSON oculto para o frontend processar.
         Formato: @AGENDAR|{"service": "Nome", "date": "YYYY-MM-DD", "time": "HH:mm"}
      3. Responda de forma concisa (máximo 2 ou 3 frases por vez).
      4. O cliente atual tem o ID: ${clientId}.
    `;

    // Converte histórico simples para formato do Gemini
    // Nota: O Gemini espera { role: 'user' | 'model', parts: [{ text: '...' }] }
    const chatHistory = (history || []).map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    const chat = model.startChat({
      history: chatHistory,
      systemInstruction: systemInstruction 
    });

    const result = await chat.sendMessage(message);
    const responseText = result.response.text();

    // 5. Processar resposta para detectar ações (ex: agendamento)
    let action = null;
    let bookingData = null;
    
    // Verificar se a resposta contém comando de agendamento
    const bookingMatch = responseText.match(/@AGENDAR\|({.*?})/);
    if (bookingMatch) {
      try {
        bookingData = JSON.parse(bookingMatch[1]);
        action = 'suggest_booking';
        console.log('📅 Agendamento sugerido:', bookingData);
      } catch (e) {
        console.error('Erro ao parsear JSON de agendamento:', e);
      }
    }

    // 6. Retorno
    return res.status(200).json({
      role: 'assistant',
      content: responseText,
      ...(action && { action }),
      ...(bookingData && { bookingData })
    });

  } catch (error) {
    console.error('❌ Erro na API Chat:', error);
    return res.status(500).json({ 
      message: 'Erro interno ao processar mensagem.',
      error: error.message 
    });
  }
}