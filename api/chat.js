import { GoogleGenerativeAI } from '@google/generative-ai';
import admin from 'firebase-admin';

// Variáveis globais para cache da conexão (Serverless Best Practice)
let db;
let firebaseInitError = null;

function initializeFirebase() {
  // 1. Se já estiver conectado, retorna
  if (admin.apps.length > 0) {
    db = admin.firestore();
    return;
  }

  try {
    const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || 'la-vie---coiffeur';
    const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL || process.env.FIREBASE_CLIENT_EMAIL;
    const privateKeyRaw = process.env.FIREBASE_ADMIN_PRIVATE_KEY || process.env.FIREBASE_PRIVATE_KEY;

    // Verificação detalhada
    if (!projectId) throw new Error('PROJECT_ID não encontrado nas variáveis de ambiente.');
    if (!clientEmail) throw new Error('CLIENT_EMAIL não encontrado nas variáveis de ambiente.');
    if (!privateKeyRaw) throw new Error('PRIVATE_KEY não encontrada nas variáveis de ambiente.');

    // --- CORREÇÃO NUCLEAR DA CHAVE PRIVADA ---
    // O erro "DECODER routines::unsupported" acontece porque o cabeçalho PEM está sujo.
    // Esta estratégia remove tudo e reconstrói a chave perfeitamente.
    
    // 1. Remove cabeçalhos antigos, aspas, espaços e quebras de linha literais
    const keyContent = privateKeyRaw
      .replace(/-----BEGIN PRIVATE KEY-----/g, '')
      .replace(/-----END PRIVATE KEY-----/g, '')
      .replace(/\\n/g, '') // remove \n literais
      .replace(/"/g, '')   // remove aspas duplas
      .replace(/'/g, '')   // remove aspas simples
      .replace(/\s+/g, ''); // remove qualquer espaço em branco ou quebra de linha real

    // 2. Reconstrói a chave no formato PEM exato que o Node.js exige
    const privateKey = `-----BEGIN PRIVATE KEY-----\n${keyContent}\n-----END PRIVATE KEY-----\n`;

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });

    db = admin.firestore();
    console.log('✅ Firebase Admin inicializado com sucesso.');

  } catch (error) {
    console.error('❌ Erro na inicialização do Firebase:', error);
    firebaseInitError = error; // Salva o erro para retornar ao cliente
  }
}

// Inicializa a IA fora do handler
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export default async function handler(req, res) {
  // CORS Setup
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });

  // Tenta inicializar o Firebase a cada requisição (se já não estiver pronto)
  initializeFirebase();

  // SE HOUVE ERRO NA INICIALIZAÇÃO, RETORNA 500 COM DETALHES
  if (firebaseInitError) {
    return res.status(500).json({
      message: 'Erro Crítico de Configuração do Backend (Firebase)',
      error: firebaseInitError.message,
      details: 'Verifique se as variáveis de ambiente no Vercel estão corretas.'
    });
  }

  try {
    const { message, history, clientId } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY ausente.');
    }

    if (!message) {
      return res.status(400).json({ message: 'Mensagem vazia.' });
    }

    // 1. Buscar Serviços (Contexto)
    let servicesText = "Serviços indisponíveis para consulta no momento.";
    try {
      if (db) {
        // Tenta buscar, mas captura erros específicos de autenticação aqui também
        const servicesRef = db.collection('services');
        const snapshot = await servicesRef.get();
        if (!snapshot.empty) {
          const servicesList = snapshot.docs.map(doc => {
            const data = doc.data();
            return `- ${data.name || data.nome} (R$ ${data.price || data.preco})`;
          });
          servicesText = servicesList.join('\n');
        }
      }
    } catch (dbError) {
      console.warn('⚠️ Aviso: Não foi possível ler os serviços do Firestore:', dbError.message);
      // Se o erro for de autenticação, logamos mas deixamos o chat continuar sem contexto
      // para não travar a experiência do usuário
      servicesText = "Não foi possível carregar a lista de serviços automaticamente. Pergunte ao cliente o que ele deseja.";
    }

    // 2. Chamada ao Gemini
    // Usando modelo padrão
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });

    const systemInstruction = `
      Você é a "Vie", assistente do salão La Vie Coiffeur.
      Seja breve e elegante.
      
      SERVIÇOS DO SALÃO (Referência):
      ${servicesText}
      
      REGRAS:
      1. Se o cliente quiser agendar, pergunte o serviço e o horário.
      2. Se confirmar horário, responda ocultamente: @AGENDAR|{"service": "...", "date": "...", "time": "..."}
      3. ID do Cliente: ${clientId}
    `;

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

    return res.status(200).json({
      role: 'assistant',
      content: responseText
    });

  } catch (error) {
    console.error('❌ Erro no Handler:', error);
    return res.status(500).json({
      message: 'Erro interno no processamento da mensagem.',
      error: error.message
    });
  }
}