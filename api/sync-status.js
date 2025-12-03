// api/sync-status.js
import { google } from 'googleapis';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config();

export default async function handler(req, res) {
  // Configuração padrão de CORS e Métodos...
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });

  const { appointments } = req.body; // Recebe lista de agendamentos do Firebase

  if (!appointments || !Array.isArray(appointments)) {
    return res.status(400).json({ error: 'Lista inválida' });
  }

  try {
    // Autenticação Google
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
    const idsToDelete = [];

    // Verifica cada agendamento
    await Promise.all(appointments.map(async (appt) => {
      if (!appt.googleEventId || !appt.googleCalendarId) return;

      try {
        await calendar.events.get({
          calendarId: appt.googleCalendarId,
          eventId: appt.googleEventId,
        });
        // Se não der erro, o evento existe. Não fazemos nada.
      } catch (error) {
        // Se der erro 404 (Not Found) ou 410 (Gone), significa que foi apagado no Google!
        if (error.code === 404 || error.code === 410) {
          idsToDelete.push(appt.id); // Marca para deletar do Firebase
        }
      }
    }));

    return res.status(200).json({ idsToDelete });

  } catch (error) {
    console.error('Erro na sincronização:', error);
    return res.status(500).json({ error: error.message });
  }
}