// api/chat.js - Vercel Serverless Function
import { GoogleGenerativeAI } from '@google/generative-ai';
import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { join } from 'path';

// Project ID do Firebase (mesmo do firebaseConfig.js)
const FIREBASE_PROJECT_ID = process.env.FIREBASE_ADMIN_PROJECT_ID || 'la-vie---coiffeur';

// Inicializa Firebase Admin SDK (apenas uma vez)
if (!admin.apps.length) {
  try {
    let credential;

    // Opção 1: Tentar usar arquivo JSON (desenvolvimento local)
    try {
      const serviceAccountPath = join(process.cwd(), 'serviceAccountKey.json');
      const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
      credential = admin.credential.cert(serviceAccount);
      console.log('✅ Firebase Admin inicializado via arquivo JSON (desenvolvimento local)');
    } catch (fileError) {
      // Opção 2: Usar variáveis de ambiente (produção Vercel)
      if (process.env.FIREBASE_ADMIN_CLIENT_EMAIL && process.env.FIREBASE_ADMIN_PRIVATE_KEY) {
        credential = admin.credential.cert({
          projectId: FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n'),
        });
        console.log('✅ Firebase Admin inicializado via variáveis de ambiente (Vercel)');
      } else {
        throw new Error('Firebase Admin: Nenhuma credencial encontrada. Configure serviceAccountKey.json ou variáveis de ambiente.');
      }
    }

    admin.initializeApp({
      credential: credential,
    });
  } catch (error) {
    console.error('❌ Firebase admin initialization error:', error.message);
    throw error;
  }
}

const db = admin.firestore();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

export default async function handler(req, res) {
  // CORS headers para permitir requisições do frontend
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
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    // 1. Buscar serviços do Firestore para contexto da IA
    const servicesSnapshot = await db.collection('services').get();
    const availableServices = servicesSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.nome || data.name || '',
        description: data.descricao || data.description || '',
        price: data.preco || data.price || 0,
        duration: data.duracao || data.duration_minutes || 0,
      };
    });

    const serviceNames = availableServices.map(s => s.name).join(', ');

    // 2. Construir o prompt para o Gemini
    const chatHistory = history.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model', // Gemini usa 'user' e 'model'
      parts: [{ text: msg.content }],
    }));

    const prompt = `
      Você é um assistente de agendamento amigável e prestativo para o salão La Vie Beauty.
      Seu objetivo principal é ajudar os clientes a agendar serviços.
      Serviços disponíveis no salão: ${serviceNames}.
      
      Instruções para a resposta:
      - Se o usuário expressar claramente a intenção de agendar um serviço e você tiver informações suficientes (serviço, data, hora), responda APENAS com um objeto JSON no formato:
        \`\`\`json
        { "action": "suggest_booking", "service": "nome_do_servico", "date": "YYYY-MM-DD", "time": "HH:MM" }
        \`\`\`
        Certifique-se de que o "service" corresponda a um dos serviços disponíveis. Se a data ou hora não forem específicas, peça mais detalhes.
      - Se o usuário perguntar sobre serviços, liste alguns dos serviços disponíveis e seus preços/durações.
      - Se o usuário confirmar um agendamento sugerido, responda APENAS com um objeto JSON no formato:
        \`\`\`json
        { "action": "confirm_booking", "service": "nome_do_servico", "date": "YYYY-MM-DD", "time": "HH:MM" }
        \`\`\`
      - Para outras perguntas ou conversas gerais, responda de forma natural e útil, sempre direcionando para o agendamento de serviços.
      - Mantenha as respostas concisas e em português.
      
      Histórico da conversa:
      ${JSON.stringify(chatHistory)}
      
      Mensagem atual do usuário: "${message}"
    `;

    const result = await model.startChat({ history: chatHistory }).sendMessage(message);
    const geminiResponseText = result.response.text();

    let botResponse = geminiResponseText;
    let action = 'none';
    let bookingData = null;

    // Tentar parsear a resposta como JSON para ações
    try {
      // Extrair JSON do texto se estiver dentro de ```json ... ```
      let jsonText = geminiResponseText;
      const jsonMatch = jsonText.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonText = jsonMatch[1];
      }

      const parsedResponse = JSON.parse(jsonText);
      
      if (parsedResponse.action === 'suggest_booking' || parsedResponse.action === 'confirm_booking') {
        action = parsedResponse.action;
        bookingData = parsedResponse;

        // Validar serviço
        const matchedService = availableServices.find(s => 
          s.name.toLowerCase() === bookingData.service.toLowerCase()
        );

        if (!matchedService) {
          botResponse = `Desculpe, não encontrei o serviço "${bookingData.service}". Os serviços disponíveis são: ${serviceNames}.`;
          action = 'none';
          bookingData = null;
        } else {
          bookingData.serviceId = matchedService.id;

          if (action === 'suggest_booking') {
            botResponse = `Entendi! Você gostaria de agendar "${bookingData.service}" para ${bookingData.date} às ${bookingData.time}? Posso confirmar para você?`;
          } else if (action === 'confirm_booking') {
            // Criar agendamento no Firestore
            // Nota: Ajuste a coleção conforme sua estrutura (pode ser 'salons/{salonId}/appointments')
            const appointmentsRef = db.collection('salons').doc(salonId).collection('appointments');
            const newBookingRef = await appointmentsRef.add({
              clientId,
              salonId,
              serviceId: bookingData.serviceId,
              serviceName: matchedService.name,
              date: bookingData.date,
              time: bookingData.time,
              status: 'confirmado',
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });

            bookingData.id = newBookingRef.id;
            botResponse = `Ótimo! Seu agendamento para "${bookingData.service}" em ${bookingData.date} às ${bookingData.time} foi confirmado com sucesso! ID do agendamento: ${newBookingRef.id}.`;
            action = 'booking_confirmed';
          }
        }
      }
    } catch (e) {
      // Não é um JSON, é uma resposta de texto normal
      console.log('Gemini response was not JSON for action, treating as text.');
    }

    return res.status(200).json({ response: botResponse, action, bookingData });
  } catch (error) {
    console.error('Erro na Vercel Function:', error);
    return res.status(500).json({ 
      message: 'Erro interno do servidor', 
      error: error.message 
    });
  }
}

