// api/get-slots.js
import { google } from 'googleapis';
import dotenv from 'dotenv';

// Tenta carregar .env.local (ambiente de desenvolvimento)
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
    return res.status(400).json({ error: 'Faltando ID ou Data' });
  }

  try {
    if (!process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
        throw new Error("Chaves do Google não configuradas.");
    }

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

    // Busca o dia inteiro (00:00 às 23:59)
    const timeMin = new Date(`${date}T00:00:00-03:00`).toISOString();
    const timeMax = new Date(`${date}T23:59:59-03:00`).toISOString();

    const response = await calendar.freebusy.query({
      resource: {
        timeMin,
        timeMax,
        timeZone: 'America/Sao_Paulo',
        items: [{ id: googleCalendarId }],
      },
    });

    const calendarData = response.data.calendars[googleCalendarId];
    
    if (calendarData.errors) {
        console.error("Erro Google:", calendarData.errors);
        return res.status(200).json({ busy: [], error: "Erro de permissão" });
    }

    // Retorna a lista crua de intervalos ocupados: [{ start: '...', end: '...' }]
    return res.status(200).json({ busy: calendarData.busy });

  } catch (error) {
    console.error('Erro API Slots:', error.message);
    return res.status(500).json({ error: error.message });
  }
}