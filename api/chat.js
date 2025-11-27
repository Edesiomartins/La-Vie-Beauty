// api/chat.js

import { GoogleGenerativeAI } from '@google/generative-ai';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';

// --- 1. Configuração Firebase (Client SDK) ---
// Certifique-se que estas variáveis estão no seu .env.local e no Vercel
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: "la-vie---coiffeur.firebaseapp.com", // Verifique se este é o seu authDomain real
  projectId: "la-vie---coiffeur", // Verifique se este é o seu projectId real
  storageBucket: "la-vie---coiffeur.firebasestorage.app",
  messagingSenderId: "359423432028",
  appId: "1:359423432028:web:9566575a6a995759a55d99",
  measurementId: "G-4WWSHD9HV9"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- 2. Configuração Gemini ---
// Certifique-se que GEMINI_API_KEY está no seu .env.local e no Vercel
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' }); // Usando 2.0-flash para agilidade

export default async function handler(req, res) {
  // --- 3. Configuração CORS ---
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { message, clientId, salonId, conversationId, history } = req.body;

  if (!message || !clientId || !salonId || !conversationId) {
    console.error('❌ Erro: Campos obrigatórios faltando na requisição.');
    return res.status(400).json({ message: 'Missing required fields: message, clientId, salonId, conversationId' });
  }

  try {
    // --- 4. Buscar serviços REAIS do Firestore ---
    let availableServices = [];
    try {
      const servicesSnapshot = await getDocs(collection(db, 'services'));
      availableServices = servicesSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          nome: data.nome || '',
          descricao: data.descricao || '',
          preco: data.preco || 0,
          duracao: data.duracao || 0, // em minutos
        };
      });
      console.log(`✅ Serviços do Firestore carregados: ${availableServices.length}`);
    } catch (err) {
      console.error('⚠️ Erro ao buscar serviços do Firestore:', err);
      // Continuar mesmo sem serviços, mas o bot não poderá mencioná-los
      availableServices = [];
    }

    // Selecionar 2-3 serviços para exemplos
    const exampleServices = availableServices
      .sort(() => 0.5 - Math.random()) // Embaralha
      .slice(0, 3) // Pega os 3 primeiros
      .map(s => s.nome)
      .join(', ');

    const serviceListText = availableServices.map(s => s.nome).join(', ') || 'diversos serviços de beleza';

    // --- 5. Cumprimento personalizado (Bom dia/tarde/noite) ---
    const now = new Date();
    const hour = now.getHours();
    let greetingTime;
    if (hour >= 5 && hour < 12) {
      greetingTime = "Bom dia";
    } else if (hour >= 12 && hour < 18) {
      greetingTime = "Boa tarde";
    } else {
      greetingTime = "Boa noite";
    }

    // --- 6. Construir histórico do chat para Gemini ---
    const chatHistory = history.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }));

    // --- 7. Prompt do Bot (Marina) ---
    const systemPrompt = `
Você é Juliana, uma assistente elegante e delicada do salão La Vie Beauty.
Você é educada, atenciosa, profissional e acolhedora.
Seu objetivo é ajudar clientes a agendar serviços com elegância.

SERVIÇOS DISPONÍVEIS NO SALÃO: ${serviceListText}.

COMPORTAMENTO:
- Cumprimente com "${greetingTime}! Olá! Sou a Juliana."
- Seja acolhedora e delicada em todas as suas interações.
- Pergunte: "Em que posso ajudá-la hoje?"
- Mencione 2-3 serviços como exemplos para inspirar a cliente, como: ${exampleServices || 'corte, coloração ou hidratação'}.
- Mantenha suas respostas CURTAS, diretas e elegantes (máximo 3 linhas).
- NUNCA invente serviços que não estão na lista de SERVIÇOS DISPONÍVEIS. Se um serviço não for encontrado, diga que não o oferece e sugira outros.
- Se a cliente disser o que deseja (serviço, data e hora), confirme os detalhes e pergunte se pode agendar.
- Se você tiver todas as informações necessárias para um agendamento (nome do serviço, data e hora), responda APENAS com um objeto JSON no formato:
  \`\`\`json
  {
    "action": "book",
    "serviceName": "[Nome do Serviço Exato]",
    "date": "[Data no formato YYYY-MM-DD]",
    "time": "[Hora no formato HH:MM]"
  }
  \`\`\`
  Exemplo: \`{"action": "book", "serviceName": "Corte Feminino", "date": "2025-12-25", "time": "14:00"}\`
- Se não tiver todas as informações para agendar, continue a conversa como Marina, perguntando o que falta.
- Seja sempre profissional e elegante.
    `;

    // --- 8. Chamar Gemini ---
    const chat = model.startChat({ history: chatHistory });
    const result = await chat.sendMessage(systemPrompt + "\n\n" + message);
    const geminiResponseText = result.response.text();
    console.log('🤖 Resposta bruta do Gemini:', geminiResponseText);

    let botResponse = geminiResponseText;
    let action = 'none';
    let bookingData = null;

    // --- 9. Tentar parsear resposta para agendamento ---
    try {
      const parsedResponse = JSON.parse(geminiResponseText);
      if (parsedResponse.action === 'book' && parsedResponse.serviceName && parsedResponse.date && parsedResponse.time) {
        // Encontrar o ID do serviço
        const serviceToBook = availableServices.find(s => s.nome.toLowerCase() === parsedResponse.serviceName.toLowerCase());

        if (serviceToBook) {
          // Agendar no Firestore
          const newAppointment = {
            clientId: clientId,
            salonId: salonId,
            servicoId: serviceToBook.id,
            data: parsedResponse.date,
            hora: parsedResponse.time,
            status: 'pendente', // Ou 'confirmado', dependendo da sua lógica
            createdAt: serverTimestamp(),
          };

          const docRef = await addDoc(collection(db, 'appointments'), newAppointment);
          console.log('✅ Agendamento salvo no Firestore com ID:', docRef.id);

          botResponse = `Perfeito! Seu agendamento de ${serviceToBook.nome} para o dia ${parsedResponse.date} às ${parsedResponse.time} foi registrado com sucesso. Mal posso esperar para recebê-la!`;
          action = 'booked';
          bookingData = { ...newAppointment, id: docRef.id };
        } else {
          botResponse = `Desculpe, não consegui encontrar o serviço "${parsedResponse.serviceName}" na nossa lista. Poderia escolher um dos serviços disponíveis?`;
          action = 'none';
        }
      }
    } catch (parseError) {
      // Não é um JSON de agendamento, continuar com a resposta normal do Gemini
      console.log('ℹ️ Resposta do Gemini não é JSON de agendamento, continuando com texto normal.');
    }

    return res.status(200).json({
      response: botResponse,
      action: action,
      bookingData: bookingData
    });

  } catch (error) {
    console.error('❌ Erro geral na API:', error);
    return res.status(500).json({
      message: 'Erro interno do servidor ao processar mensagem.',
      error: error.message,
      details: error.toString()
    });
  }
}