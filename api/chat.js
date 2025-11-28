// api/chat.js
import { GoogleGenerativeAI } from '@google/generative-ai';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, getDoc } from 'firebase/firestore';

// --- Configuração Firebase (Client SDK) ---
// Certifique-se que estas variáveis de ambiente estão configuradas no Vercel
// VITE_FIREBASE_API_KEY
// VITE_FIREBASE_AUTH_DOMAIN
// VITE_FIREBASE_PROJECT_ID
// VITE_FIREBASE_STORAGE_BUCKET
// VITE_FIREBASE_MESSAGING_SENDER_ID
// VITE_FIREBASE_APP_ID
// VITE_FIREBASE_MEASUREMENT_ID
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || "la-vie---coiffeur.firebaseapp.com",
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || "la-vie---coiffeur",
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || "la-vie---coiffeur.firebasestorage.app",
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "359423432028",
  appId: process.env.VITE_FIREBASE_APP_ID || "1:359423432028:web:9566575a6a995759a55d99",
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID || "G-4WWSHD9HV9"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- Configuração Gemini ---
// Certifique-se que GEMINI_API_KEY está configurada no Vercel
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' }); // Usando gemini-2.5-pro

export default async function handler(req, res) {
  // --- CORS Headers ---
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { message, clientId, salonId, conversationId, history } = req.body;

  if (!message || !clientId || !salonId) {
    return res.status(400).json({ message: 'Missing required fields (message, clientId, salonId)' });
  }

  let availableServices = [];
  let salonInfo = null;

  try {
    // --- Buscar dados do Salão ---
    const salonDocRef = doc(db, 'salonIds', salonId); // Assumindo salonId é o ID do documento
    const salonDocSnap = await getDoc(salonDocRef);
    if (salonDocSnap.exists()) {
      salonInfo = salonDocSnap.data();
    } else {
      console.warn(`⚠️ Aviso: Salão com ID ${salonId} não encontrado.`);
    }

    // --- Buscar Serviços do Firestore ---
    const servicesSnapshot = await getDocs(collection(db, 'services'));
    availableServices = servicesSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.nome || data.name || '',
        description: data.descricao || data.description || '',
        price: data.preco || data.price || 0,
        duration: data.duracao || data.duration_minutes || 0,
      };
    });
  } catch (firestoreError) {
    console.error('❌ Erro ao buscar dados do Firestore:', firestoreError);
    // Continuar mesmo se houver erro no Firestore, mas com dados vazios
  }

  const serviceNames = availableServices.map(s => s.name).join(', ') || 'diversos serviços de beleza';
  const salonName = salonInfo?.name || 'nosso salão';
  const salonPhone = salonInfo?.phone || 'nosso telefone';
  const salonAddress = salonInfo?.address || 'nosso endereço';
  const salonWhatsapp = salonInfo?.whatsapp || 'nosso WhatsApp';

  // --- Construir histórico do chat para Gemini ---
  const chatHistory = history.map(msg => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.content }],
  }));

  // --- Lógica de Cumprimento Inicial ---
  let initialGreeting = '';
  if (chatHistory.length === 0) { // Primeira mensagem da conversa
    const hour = new Date().getHours();
    if (hour < 12) initialGreeting = 'Bom dia';
    else if (hour < 18) initialGreeting = 'Boa tarde';
    else initialGreeting = 'Boa noite';
    initialGreeting += `! Seja bem-vinda(o) a ${salonName}.`;
  }

  // --- Prompt do Bot (Juliana) ---
  const systemPrompt = `
Você é Juliana, uma consultora de beleza do salão ${salonName}.
Sua personalidade: acolhedora, profissional, delicada, humana e simpática.
Seu objetivo: ajudar a cliente a encontrar o serviço perfeito e agendar.

Serviços disponíveis no salão: ${serviceNames}.
Informações do salão:
- Nome: ${salonName}
- Telefone: ${salonPhone}
- Endereço: ${salonAddress}
- WhatsApp para agendamento: ${salonWhatsapp}

Regras de interação:
1. Responda SEMPRE em português.
2. Mantenha as respostas concisas (máximo 3 linhas).
3. Se for a primeira mensagem da cliente, use o cumprimento inicial: "${initialGreeting}". Após isso, interaja naturalmente sem repetir cumprimentos.
4. Mantenha o contexto da conversa.
5. Se a cliente perguntar sobre serviços, use a lista de serviços disponíveis para recomendar.
6. Se a cliente perguntar sobre o salão (endereço, telefone, contato), forneça as informações.
7. Se a cliente expressar interesse em agendar, colete as seguintes informações:
   - Qual serviço deseja?
   - Qual a data preferida?
   - Qual o horário preferido?
   Após coletar essas informações, você DEVE retornar uma mensagem amigável e incluir um bloco JSON no final da sua resposta para que o sistema possa processar o agendamento.

Formato do bloco JSON para ações (booking ou info):
- Para agendamento: [ACTION_DATA]{"action": "booking", "service": "nome do serviço", "date": "AAAA-MM-DD", "time": "HH:MM", "client_name": "Nome da Cliente"}[/ACTION_DATA]
- Para informações do salão: [ACTION_DATA]{"action": "info", "type": "contact"}[/ACTION_DATA]
- Se não houver ação específica, não inclua o bloco JSON.

Exemplo de resposta para agendamento:
"Que ótimo! Para confirmar seu agendamento de [serviço] para [data] às [hora], por favor, clique no link do WhatsApp ou ligue para nós. Estamos ansiosas para te receber! [ACTION_DATA]{"action": "booking", "service": "Corte", "date": "2025-12-25", "time": "10:00", "client_name": "Maria"}[/ACTION_DATA]"

Exemplo de resposta para informações:
"Claro! Nosso endereço é ${salonAddress} e o telefone é ${salonPhone}. Se preferir, pode nos chamar no WhatsApp ${salonWhatsapp}. [ACTION_DATA]{"action": "info", "type": "contact"}[/ACTION_DATA]"
    `;

  try {
    const chat = model.startChat({ history: chatHistory });
    const result = await chat.sendMessage(systemPrompt + "\n" + message); // Adiciona o prompt do sistema à mensagem
    const botResponseRaw = result.response.text();

    let finalResponse = botResponseRaw;
    let action = 'none';
    let bookingData = null;

    // --- Extrair bloco JSON da resposta do bot ---
    const actionDataRegex = /\[ACTION_DATA\](.*?)\[\/ACTION_DATA\]/s;
    const match = botResponseRaw.match(actionDataRegex);

    if (match && match[1]) {
      try {
        const parsedActionData = JSON.parse(match[1]);
        action = parsedActionData.action || 'none';

        if (action === 'booking') {
          bookingData = {
            client_name: parsedActionData.client_name || clientId, // Usar clientId como fallback
            service: parsedActionData.service || '',
            date: parsedActionData.date || '',
            time: parsedActionData.time || '',
            salon_name: salonName,
            salon_phone: salonPhone,
            salon_address: salonAddress,
            whatsapp_link: `https://wa.me/${salonWhatsapp}?text=Olá! Gostaria de agendar um ${parsedActionData.service || ''} para o dia ${parsedActionData.date || ''} às ${parsedActionData.time || ''}. Meu nome é ${parsedActionData.client_name || clientId}.`
          };
        } else if (action === 'info' && parsedActionData.type === 'contact') {
          bookingData = { // Reutilizando bookingData para info de contato
            salon_name: salonName,
            salon_phone: salonPhone,
            salon_address: salonAddress,
            whatsapp_link: `https://wa.me/${salonWhatsapp}?text=Olá! Gostaria de mais informações sobre o salão.`
          };
        }
        // Remover o bloco JSON da resposta final para a cliente
        finalResponse = botResponseRaw.replace(actionDataRegex, '').trim();

      } catch (jsonParseError) {
        console.error('❌ Erro ao parsear JSON do bot:', jsonParseError);
        // Se o JSON estiver malformado, apenas use a resposta crua
      }
    }

    // Se for a primeira mensagem e não houver ação, adicione o cumprimento inicial
    if (chatHistory.length === 0 && !action) {
        finalResponse = initialGreeting + " " + finalResponse;
    }


    return res.status(200).json({
      response: finalResponse,
      action: action,
      bookingData: bookingData
    });

  } catch (error) {
    console.error('❌ Erro na API do Gemini:', error);
    return res.status(500).json({
      response: 'Desculpe, Juliana está um pouco ocupada agora. Por favor, tente novamente mais tarde.',
      action: 'none',
      bookingData: null,
      error: error.message,
      details: error.toString()
    });
  }
}