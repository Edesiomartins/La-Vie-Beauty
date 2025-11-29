// api/chat.js
import { GoogleGenerativeAI } from '@google/generative-ai';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { google } from 'googleapis';
import dotenv from 'dotenv';

// Garante leitura das variáveis locais se estiver rodando local
dotenv.config({ path: '.env.local' });
dotenv.config();

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
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// --- 1. CONFIGURAÇÃO DA AGENDA (Lógica "Vencedora" do Teste) ---
let calendar = null;

if (process.env.GOOGLE_CLIENT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
  try {
    // Tratamento robusto da chave (remove aspas e corrige quebras de linha)
    let privateKey = process.env.GOOGLE_PRIVATE_KEY;
    if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
        privateKey = privateKey.slice(1, -1);
    }
    privateKey = privateKey.replace(/\\n/g, '\n');

    // Usa GoogleAuth (igual ao script de teste que funcionou)
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: privateKey,
      },
      scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
    });

    calendar = google.calendar({ version: 'v3', auth });
    console.log("✅ API Chat: Conexão com Google Calendar iniciada.");
  } catch (err) {
    console.error("❌ API Chat: Erro ao configurar Google Calendar:", err.message);
  }
}

// --- 2. DEFINIÇÃO DAS FERRAMENTAS (Tools) ---
const tools = [
  {
    functionDeclarations: [
      {
        name: "check_availability",
        description: "Verifica a disponibilidade na agenda do Google de uma profissional específica.",
        parameters: {
          type: "OBJECT",
          properties: {
            date: { type: "STRING", description: "Data no formato YYYY-MM-DD" },
            professionalName: { type: "STRING", description: "Primeiro nome da profissional (ex: Juliana)" }
          },
          required: ["date", "professionalName"],
        },
      },
    ],
  },
];

// --- 3. FUNÇÕES AUXILIARES ---

// Busca o ID da Agenda no Firebase (campo googleCalendarId do colaborador)
async function getProfessionalCalendarId(salonId, professionalName) {
  try {
    const collabsRef = collection(db, "salons", salonId, "collaborators");
    const snapshot = await getDocs(collabsRef);
    
    // Busca "fuzzy" (insensível a maiúsculas/minúsculas)
    const search = professionalName.toLowerCase();
    const found = snapshot.docs.find(doc => {
        const data = doc.data();
        // Verifica se o nome bate
        return data.name && data.name.toLowerCase().includes(search);
    });

    if (found) {
        const data = found.data();
        // Retorna o ID que colamos no cadastro (prioridade) ou email
        return data.googleCalendarId || data.email || null;
    }
    return null;
  } catch (error) {
    console.error("Erro ao buscar colaborador no Firebase:", error);
    return null;
  }
}

// Consulta o Google Calendar (Ação Real)
async function checkGoogleCalendarAvailability(salonId, date, professionalName) {
  if (!calendar) return { error: "Sistema de agenda temporariamente indisponível (Erro de Configuração)." };

  const calendarId = await getProfessionalCalendarId(salonId, professionalName);
  
  if (!calendarId) {
    return { error: `Não encontrei a agenda conectada para a profissional ${professionalName}. Verifique o cadastro.` };
  }

  // Define horário comercial (08:00 às 20:00) para a busca
  const timeMin = new Date(`${date}T08:00:00-03:00`).toISOString();
  const timeMax = new Date(`${date}T20:00:00-03:00`).toISOString();

  try {
    const res = await calendar.freebusy.query({
      resource: {
        timeMin: timeMin,
        timeMax: timeMax,
        timeZone: 'America/Sao_Paulo',
        items: [{ id: calendarId }],
      },
    });

    // Verifica erros específicos da agenda (ex: permissão negada)
    const calData = res.data.calendars[calendarId];
    if (calData.errors) {
        console.error("Erro Google:", calData.errors);
        return { error: "Erro de permissão na agenda. O robô precisa ser adicionado nas configurações do Google Calendar." };
    }

    const busySlots = calData.busy;

    if (!busySlots || busySlots.length === 0) {
      return { status: "livre", message: `A agenda da ${professionalName} está totalmente livre neste dia!` };
    }

    // Formata a resposta para a IA entender
    const busyFormatted = busySlots.map(slot => {
        const start = new Date(slot.start).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'});
        const end = new Date(slot.end).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'});
        return `${start}-${end}`;
    });

    return { 
      status: "parcial", 
      busy_times: busyFormatted, 
      info: `Horários OCUPADOS da ${professionalName}: ${busyFormatted.join(', ')}. Os outros horários (entre 09h e 18h) estão livres.` 
    };

  } catch (error) {
    console.error("Erro API Google:", error);
    return { error: "Erro técnico ao consultar a agenda." };
  }
}

// --- 4. HANDLER PRINCIPAL ---
export default async function handler(req, res) {
  // Configuração de CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });

  const { message, clientId, salonId, history } = req.body;

  try {
    // --- Contexto de Data/Hora (CRUCIAL PARA A IA NÃO SE PERDER) ---
    const now = new Date();
    const currentDateTime = now.toLocaleString('pt-BR', { 
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' 
    });

    // --- Busca Dados do Salão ---
    const salonDoc = await getDoc(doc(db, 'salons', salonId));
    const salonInfo = salonDoc.exists() ? salonDoc.data() : {};
    
    const servicesSnap = await getDocs(collection(db, 'salons', salonId, 'services'));
    const serviceNames = servicesSnap.docs.map(d => d.data().name).join(', ') || "vários serviços";

    const collabSnap = await getDocs(collection(db, 'salons', salonId, 'collaborators'));
    const collabNames = collabSnap.docs.map(d => d.data().name).join(', ') || "nossa equipe";

    // --- Monta Histórico ---
    const chatHistory = (history || []).map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }));

    // --- Prompt do Sistema ---
    const systemPrompt = `
      Você é Juliana, a IA de atendimento do salão ${salonInfo.name || "La Vie"}.
      
      IMPORTANTE:
      - Hoje é: ${currentDateTime}
      - Use essa data como referência quando a cliente disser "hoje", "amanhã", "sexta", etc.
      
      DADOS DO SALÃO:
      - Profissionais: ${collabNames}
      - Serviços: ${serviceNames}
      - Endereço: ${salonInfo.address || "Endereço não cadastrado"}
      
      INSTRUÇÕES:
      1. Pergunte o que a cliente deseja (Serviço, Profissional, Dia).
      2. Se ela escolher data e profissional, CHAME A FERRAMENTA 'check_availability' imediatamente.
      3. A ferramenta vai te devolver os horários OCUPADOS. Sua missão é calcular os LIVRES (o salão abre das 09:00 às 18:00) e oferecer à cliente.
      4. Se ela não disser o profissional, liste os disponíveis e peça para escolher.
      5. Seja simpática, breve e use emojis.

      QUANDO CONFIRMAR O AGENDAMENTO:
      Retorne o JSON especial no final da mensagem:
      [ACTION_DATA]{"action": "booking", "service": "...", "date": "YYYY-MM-DD", "time": "HH:MM", "professional": "...", "client_name": "${clientId}"}[/ACTION_DATA]
    `;

    // Inicializa Modelo (Flash é rápido e bom para Tools)
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-exp', 
      systemInstruction: systemPrompt,
      tools: tools
    });

    const chat = model.startChat({ history: chatHistory });
    let result = await chat.sendMessage(message);
    let response = await result.response;
    let text = response.text();

    // --- Processamento de Tools (Function Calling) ---
    const functionCalls = response.functionCalls();
    
    if (functionCalls && functionCalls.length > 0) {
      const call = functionCalls[0];
      
      if (call.name === "check_availability") {
        const { date, professionalName } = call.args;
        
        // Chama a função real que conecta no Google
        const apiResponse = await checkGoogleCalendarAvailability(salonId, date, professionalName);
        
        // Devolve a resposta do Google para a IA gerar o texto final
        const functionResponse = [{
            functionResponse: {
                name: "check_availability",
                response: apiResponse
            }
        }];
        
        result = await chat.sendMessage(functionResponse);
        response = await result.response;
        text = response.text();
      }
    }

    // --- Processamento de JSON Final (Agendamento) ---
    let action = 'none';
    let bookingData = null;
    const actionDataRegex = /\[ACTION_DATA\](.*?)\[\/ACTION_DATA\]/s;
    const match = text.match(actionDataRegex);

    if (match && match[1]) {
        try {
            const parsed = JSON.parse(match[1]);
            action = parsed.action;
            text = text.replace(actionDataRegex, '').trim(); // Remove o JSON da mensagem visível
            
            if (action === 'booking') {
                bookingData = {
                    ...parsed,
                    whatsapp_link: `https://wa.me/${salonInfo.phone?.replace(/\D/g,'')}?text=Confirmo agendamento: ${parsed.service} com ${parsed.professional} dia ${parsed.date} às ${parsed.time}`
                };
            }
        } catch (e) { console.error("Erro JSON IA:", e); }
    }

    return res.status(200).json({
      response: text,
      action: action,
      bookingData: bookingData
    });

  } catch (error) {
    console.error('❌ Erro Fatal API:', error);
    return res.status(500).json({ 
        response: 'Desculpe, tive um problema técnico momentâneo. Pode tentar novamente?', 
        error: error.message 
    });
  }
}