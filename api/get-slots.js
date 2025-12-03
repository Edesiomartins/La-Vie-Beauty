// api/get-slots.js
import { google } from 'googleapis';
import dotenv from 'dotenv';

// Carrega variáveis
dotenv.config({ path: '.env.local' });
dotenv.config();

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });

  const { googleCalendarId, date } = req.body;

  if (!googleCalendarId || !date) {
    return res.status(400).json({ error: 'Faltando ID da agenda ou data' });
  }

  try {
    // 1. Autenticação (A mesma que funcionou no teste)
    let privateKey = process.env.GOOGLE_PRIVATE_KEY;
    if (privateKey.startsWith('"') && privateKey.endsWith('"')) privateKey = privateKey.slice(1, -1);
    privateKey = privateKey.replace(/\\n/g, '\n');

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: privateKey,
      },
      scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
    });

    const calendar = google.calendar({ version: 'v3', auth });

    // 2. Consulta (FreeBusy) das 08h as 20h
    const timeMin = new Date(`${date}T08:00:00-03:00`).toISOString();
    const timeMax = new Date(`${date}T20:00:00-03:00`).toISOString();

    const response = await calendar.freebusy.query({
      resource: {
        timeMin,
        timeMax,
        timeZone: 'America/Sao_Paulo',
        items: [{ id: googleCalendarId }],
      },
    });

    const busySlots = response.data.calendars[googleCalendarId].busy;
    
    // 3. Formata para devolver apenas a lista de horários simples
    // Ex: ['14:00', '15:00'] (Formato HH:MM consistente)
    const busyTimes = busySlots.map(slot => {
        const dateObj = new Date(slot.start);
        const hours = String(dateObj.getHours()).padStart(2, '0');
        const minutes = String(dateObj.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
    });

    return res.status(200).json({ busy: busyTimes, raw: busySlots });

  } catch (error) {
    console.error('Erro ao ler slots do Google:', error);
    return res.status(500).json({ error: error.message });
  }
}