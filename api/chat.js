// api/chat.js
import { GoogleGenerativeAI } from '@google/generative-ai';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { google } from 'googleapis';
import dotenv from 'dotenv';

// Garante que o .env.local seja lido
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

// Inicializa a IA com a chave
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// --- Configuração Google Agenda ---
let calendar = null;
if (process.env.GOOGLE_CLIENT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
  try {
    let privateKey = process.env.GOOGLE_PRIVATE_KEY;
    if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
        privateKey = privateKey.slice(1, -1);
    }
    privateKey = privateKey.replace(/\\n/g, '\n');

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: privateKey,
      },
      scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
    });
    calendar = google.calendar({ version: 'v3', auth });
  } catch (e) {
    console.error("Erro ao iniciar Calendar:", e);
  }
}

// --- Definição das Ferramentas (Tools) ---
const tools = [
  {
    functionDeclarations: [
      {
        name: "check_availability",
        description: "Verifica a disponibilidade na agenda do Google de uma profissional.",
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

// --- Funções Auxiliares ---
async function getProfessionalCalendarId(salonId, professionalName) {
  try {
    const collabsRef = collection(db, "salons", salonId, "collaborators");
    const snapshot = await getDocs(collabsRef);
    const search = professionalName.toLowerCase();
    const found = snapshot.docs.find(doc => {
        const data = doc.data();
        return data.name && data.name.toLowerCase().includes(search);
    });
    if (found) return found.data().googleCalendarId || null;
    return null;
  } catch (error) { return null; }
}

async function checkGoogleCalendarAvailability(salonId, date, professionalName) {
  if (!calendar) return { error: "Erro no servidor de agenda." };
  const calendarId = await getProfessionalCalendarId(salonId, professionalName);
  
  if (!calendarId) return { error: `Agenda não conectada para ${professionalName}.` };

  const timeMin = new Date(`${date}T08:00:00-03:00`).toISOString();
  const timeMax = new Date(`${date}T20:00:00-03:00`).toISOString();

  try {
    const res = await calendar.freebusy.query({
      resource: { timeMin, timeMax, timeZone: 'America/Sao_Paulo', items: [{ id: calendarId }] },
    });
    const busySlots = res.data.calendars[calendarId].busy;
    
    if (!busySlots || busySlots.length === 0) return { status: "livre", message: "Livre o dia todo!" };
    
    const busyFormatted = busySlots.map(slot => {
        const start = new Date(slot.start).toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'});
        const end = new Date(slot.end).toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'});
        return `${start}-${end}`;
    });
    return { status: "parcial", busy_times: busyFormatted };
  } catch (error) { return { error: "Erro técnico na agenda." }; }
}

// --- Handler Principal ---
export default async function handler(req, res) {
  // Configuração CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });

  const { message, clientId, salonId, history } = req.body;

  try {
    // Data Atual
    const now = new Date();
    const currentDateTime = now.toLocaleString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });

    // Dados do Firestore
    const salonDoc = await getDoc(doc(db, 'salons', salonId));
    const salonInfo = salonDoc.exists() ? salonDoc.data() : {};
    
    const [servicesSnap, collabsSnap] = await Promise.all([
        getDocs(collection(db, 'salons', salonId, 'services')),
        getDocs(collection(db, 'salons', salonId, 'collaborators'))
    ]);
    
    const serviceNames = servicesSnap.docs.map(d => d.data().name).join(', ') || "vários";
    const collabNames = collabsSnap.docs.map(d => d.data().name).join(', ') || "equipe";

    const chatHistory = (history || []).map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }));

    const systemPrompt = `
      Você é Juliana, IA do salão ${salonInfo.name || "La Vie"}.
      HOJE É: ${currentDateTime}.
      DADOS: Serviços: ${serviceNames}. Equipe: ${collabNames}. Endereço: ${salonInfo.address}.
      
      REGRAS:
      1. Use a ferramenta 'check_availability' se pedirem horário específico.
      2. Se não disserem profissional, pergunte: "Com quem prefere? Temos: ${collabNames}".
      3. A ferramenta retorna horários OCUPADOS. Ofereça os LIVRES (09h-18h).
      
      JSON FINAL (Só quando confirmar):
      [ACTION_DATA]{"action": "booking", "service": "...", "date": "YYYY-MM-DD", "time": "HH:MM", "professional": "...", "client_name": "${clientId}"}[/ACTION_DATA]
    `;

    // --- AQUI ESTÁ O MODELO QUE FUNCIONOU NO SEU CURL ---
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash', 
      systemInstruction: systemPrompt,
      tools: tools
    });

    const chat = model.startChat({ history: chatHistory });
    let result = await chat.sendMessage(message);
    let response = await result.response;
    let text = response.text();

    // Tools
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
        text = result.response.text();
      }
    }

    // JSON Parsing
    let action = 'none';
    let bookingData = null;
    const match = text.match(/\[ACTION_DATA\](.*?)\[\/ACTION_DATA\]/s);
    if (match && match[1]) {
        try {
            const parsed = JSON.parse(match[1]);
            action = parsed.action;
            text = text.replace(/\[ACTION_DATA\].*?\[\/ACTION_DATA\]/s, '').trim();
            if (action === 'booking') {
                bookingData = { ...parsed, whatsapp_link: `https://wa.me/${salonInfo.phone?.replace(/\D/g,'')}` };
            }
        } catch (e) {}
    }

    return res.status(200).json({ response: text, action, bookingData });

  } catch (error) {
    console.error('❌ Erro API:', error);
    return res.status(500).json({ error: error.message });
  }
}