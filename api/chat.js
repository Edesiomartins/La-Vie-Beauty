// api/chat.js
import { GoogleGenerativeAI } from '@google/generative-ai';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { google } from 'googleapis';

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

// --- Config Google Calendar ---
const privateKey = process.env.GOOGLE_PRIVATE_KEY 
  ? process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n') 
  : undefined;

let calendar = null;
if (process.env.GOOGLE_CLIENT_EMAIL && privateKey) {
  const auth = new google.auth.JWT(
    process.env.GOOGLE_CLIENT_EMAIL,
    null,
    privateKey,
    ['https://www.googleapis.com/auth/calendar.readonly']
  );
  calendar = google.calendar({ version: 'v3', auth });
}

// --- Tools ---
const tools = [
  {
    functionDeclarations: [
      {
        name: "check_availability",
        description: "Verifica a disponibilidade na agenda do Google de uma profissional específica.",
        parameters: {
          type: "OBJECT",
          properties: {
            date: { type: "STRING", description: "Data formato YYYY-MM-DD" },
            professionalName: { type: "STRING", description: "Nome da profissional" }
          },
          required: ["date", "professionalName"],
        },
      },
    ],
  },
];

// --- Busca ID da Agenda ---
async function getProfessionalCalendarId(salonId, professionalName) {
  try {
    const collabsRef = collection(db, "salons", salonId, "collaborators");
    const snapshot = await getDocs(collabsRef);
    
    const search = professionalName.toLowerCase();
    const found = snapshot.docs.find(doc => {
        const data = doc.data();
        return data.name && data.name.toLowerCase().includes(search);
    });

    if (found) {
        return found.data().googleCalendarId || null;
    }
    return null;
  } catch (error) {
    console.error("Erro ao buscar colaborador:", error);
    return null;
  }
}

// --- Consulta Google ---
async function checkGoogleCalendarAvailability(salonId, date, professionalName) {
  if (!calendar) return { error: "Erro: Chaves do Google Calendar não configuradas no .env." };

  const calendarId = await getProfessionalCalendarId(salonId, professionalName);
  
  if (!calendarId) {
    return { error: `Não encontrei a agenda conectada para ${professionalName}.` };
  }

  const timeMin = new Date(`${date}T08:00:00-03:00`).toISOString();
  const timeMax = new Date(`${date}T19:00:00-03:00`).toISOString();

  try {
    const res = await calendar.freebusy.query({
      resource: {
        timeMin: timeMin,
        timeMax: timeMax,
        timeZone: 'America/Sao_Paulo',
        items: [{ id: calendarId }],
      },
    });

    const busySlots = res.data.calendars[calendarId].busy;

    if (!busySlots || busySlots.length === 0) {
      return { status: "livre", message: `A agenda da ${professionalName} está totalmente livre!` };
    }

    const busyFormatted = busySlots.map(slot => {
        const start = new Date(slot.start).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'});
        const end = new Date(slot.end).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'});
        return `${start}-${end}`;
    });

    return { 
      status: "parcial", 
      busy_times: busyFormatted, 
      info: `Horários OCUPADOS da ${professionalName}. O resto está livre.` 
    };

  } catch (error) {
    console.error("Erro Google:", error);
    return { error: "Erro técnico ao ler a agenda." };
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });

  const { message, clientId, salonId, history } = req.body;

  try {
    const salonDoc = await getDoc(doc(db, 'salons', salonId));
    const salonInfo = salonDoc.exists() ? salonDoc.data() : {};
    
    const servicesSnap = await getDocs(collection(db, 'salons', salonId, 'services'));
    const serviceNames = servicesSnap.docs.map(d => d.data().name).join(', ') || "vários serviços";

    const collabSnap = await getDocs(collection(db, 'salons', salonId, 'collaborators'));
    const collabNames = collabSnap.docs.map(d => d.data().name).join(', ') || "nossa equipe";

    const chatHistory = (history || []).map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }));

    // --- CORREÇÃO AQUI: Pegar a data e hora atual do servidor ---
    const now = new Date();
    const currentDateTime = now.toLocaleString('pt-BR', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
    });

    const systemPrompt = `
      Você é Juliana, assistente do salão ${salonInfo.name || "La Vie"}.
      
      CONTEXTO DE TEMPO (MUITO IMPORTANTE):
      Hoje é: ${currentDateTime}
      
      DADOS:
      - Serviços: ${serviceNames}
      - Equipe: ${collabNames}
      - Endereço: ${salonInfo.address}
      
      REGRAS:
      1. Pergunte: Serviço, Profissional, Data e Hora.
      2. Se a cliente disser "amanhã" ou "sexta", calcule a data baseada em "Hoje é ${currentDateTime}".
      3. Use a ferramenta 'check_availability' com a data no formato YYYY-MM-DD.
      4. Se não disser o profissional, liste: ${collabNames}.
      5. JSON FINAL: [ACTION_DATA]{"action": "booking", ...}[/ACTION_DATA]
    `;

    // Pode usar 'gemini-1.5-flash' (estável) ou o seu 'gemini-2.0-flash-exp' se estiver funcionando
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash', 
      systemInstruction: systemPrompt,
      tools: tools
    });

    const chat = model.startChat({ history: chatHistory });
    let result = await chat.sendMessage(message);
    let response = await result.response;
    let text = response.text();

    const functionCalls = response.functionCalls();
    if (functionCalls && functionCalls.length > 0) {
      const call = functionCalls[0];
      if (call.name === "check_availability") {
        const { date, professionalName } = call.args;
        const apiResponse = await checkGoogleCalendarAvailability(salonId, date, professionalName);
        
        const functionResponse = [{
            functionResponse: { name: "check_availability", response: apiResponse }
        }];
        
        result = await chat.sendMessage(functionResponse);
        response = await result.response;
        text = response.text();
      }
    }

    let action = 'none';
    let bookingData = null;
    const actionDataRegex = /\[ACTION_DATA\](.*?)\[\/ACTION_DATA\]/s;
    const match = text.match(actionDataRegex);

    if (match && match[1]) {
        try {
            const parsed = JSON.parse(match[1]);
            action = parsed.action;
            text = text.replace(actionDataRegex, '').trim();
            if (action === 'booking') {
                bookingData = {
                    ...parsed,
                    whatsapp_link: `https://wa.me/${salonInfo.phone?.replace(/\D/g,'')}?text=Confirmo: ${parsed.service} com ${parsed.professional} dia ${parsed.date} às ${parsed.time}`
                };
            }
        } catch (e) {}
    }

    return res.status(200).json({ response: text, action, bookingData });

  } catch (error) {
    console.error('❌ Erro API:', error);
    return res.status(500).json({ error: error.message });
  }
}