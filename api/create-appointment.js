// api/create-appointment.js
import { google } from 'googleapis';
import dotenv from 'dotenv';

// Carrega variáveis de ambiente (local ou servidor)
dotenv.config({ path: '.env.local' });
dotenv.config();

export default async function handler(req, res) {
  // CORS Setup
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });

  const { 
    serviceName, 
    date, 
    time, 
    duration, 
    clientName, 
    clientPhone, 
    googleCalendarId 
  } = req.body;

  // VALIDAÇÃO: Cliente DEVE ter nome
  if (!clientName || clientName.trim() === '') {
    return res.status(400).json({ error: 'Nome do cliente é obrigatório para criar evento no Google Calendar' });
  }

  // Se não tiver ID da agenda, apenas confirma (salva só no App)
  if (!googleCalendarId) {
    return res.status(200).json({ message: 'Salvo apenas no App (Sem ID Google)' });
  }

  try {
    // --- VERIFICAÇÃO DE SEGURANÇA ---
    if (!process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
        throw new Error("CONFIGURAÇÃO: As chaves do Google (Email ou Private Key) não estão configuradas no Painel da Vercel.");
    }

    // 1. Configurar Autenticação
    let privateKey = process.env.GOOGLE_PRIVATE_KEY;
    // O erro acontecia aqui embaixo, agora protegemos com o 'if' acima
    if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
        privateKey = privateKey.slice(1, -1);
    }
    privateKey = privateKey.replace(/\\n/g, '\n');

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: privateKey,
      },
      scopes: ['https://www.googleapis.com/auth/calendar'], // Escopo de escrita
    });

    const calendar = google.calendar({ version: 'v3', auth });

    // 2. Calcular Horário de Início e Fim
    const startDateTime = new Date(`${date}T${time}:00-03:00`); // Horário Brasília
    
    // Adiciona duração (em minutos) ao horário inicial
    const endDateTime = new Date(startDateTime.getTime() + (duration || 60) * 60000);

    // 3. Criar o Evento no Google
    // Garantir que o nome do cliente sempre apareça no título e descrição
    const clientNameFormatted = (clientName || 'Cliente').trim();
    const event = {
      summary: `💅 ${serviceName} - ${clientNameFormatted}`,
      description: `Cliente: ${clientNameFormatted}\nTelefone: ${clientPhone || 'Não informado'}\nServiço: ${serviceName}`,
      start: {
        dateTime: startDateTime.toISOString(),
        timeZone: 'America/Sao_Paulo',
      },
      end: {
        dateTime: endDateTime.toISOString(),
        timeZone: 'America/Sao_Paulo',
      },
    };

    const response = await calendar.events.insert({
      calendarId: googleCalendarId,
      resource: event,
    });

    return res.status(200).json({ 
      message: 'Agendado no Google com sucesso!', 
      googleEventId: response.data.id,
      link: response.data.htmlLink
    });

  } catch (error) {
    console.error('Erro ao criar evento no Google:', error);
    // Não vamos quebrar o app se o Google falhar, apenas avisar
    return res.status(500).json({ error: 'Erro na integração Google', details: error.message });
  }
}