// test-calendar.js (Versão Final - Lê .env.local)
import { google } from 'googleapis';
import dotenv from 'dotenv';
import fs from 'fs';

// 1. FORÇA A LEITURA DO .ENV.LOCAL
// Verifica se o arquivo existe antes de tentar ler
if (fs.existsSync('.env.local')) {
    console.log("📂 Arquivo .env.local encontrado. Carregando variáveis...");
    dotenv.config({ path: '.env.local' });
} else {
    console.log("⚠️ Arquivo .env.local não encontrado, tentando .env padrão...");
    dotenv.config();
}

// SEU ID DA AGENDA (O que você mandou)
const CALENDAR_ID = "kamillasrb@gmail.com";
const DATE_TO_TEST = "2025-11-29"; // Hoje

async function testConnection() {
  console.log("🤖 Iniciando teste de conexão...");

  // Debug: Mostra se carregou (escondendo parte da chave por segurança)
  const hasEmail = !!process.env.GOOGLE_CLIENT_EMAIL;
  const hasKey = !!process.env.GOOGLE_PRIVATE_KEY;
  console.log(`- Email carregado? ${hasEmail ? "✅ Sim" : "❌ Não"}`);
  console.log(`- Chave carregada? ${hasKey ? "✅ Sim" : "❌ Não"}`);

  if (!hasEmail || !hasKey) {
    console.error("❌ PARANDO: As chaves não foram lidas do .env.local");
    return;
  }

  try {
    // --- TRATAMENTO ROBUSTO DA CHAVE ---
    let privateKey = process.env.GOOGLE_PRIVATE_KEY;
    // Remove aspas extras se houver (comum ao copiar do .env)
    if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
        privateKey = privateKey.slice(1, -1);
    }
    // Converte os \n literais em quebras de linha reais
    privateKey = privateKey.replace(/\\n/g, '\n');

    // --- AUTENTICAÇÃO ---
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: privateKey,
      },
      scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
    });

    const calendar = google.calendar({ version: 'v3', auth });
    console.log("✅ Autenticação configurada. Consultando Google...");

    // Consulta horário
    const timeMin = new Date(`${DATE_TO_TEST}T11:00:00-03:00`).toISOString();
    const timeMax = new Date(`${DATE_TO_TEST}T22:00:00-03:00`).toISOString();

    const res = await calendar.freebusy.query({
      resource: {
        timeMin: timeMin,
        timeMax: timeMax,
        timeZone: 'America/Sao_Paulo',
        items: [{ id: CALENDAR_ID }],
      },
    });

    const calendarData = res.data.calendars[CALENDAR_ID];
    
    if (calendarData.errors) {
      console.error("❌ ERRO DE PERMISSÃO NA AGENDA:");
      console.error(calendarData.errors);
    } else {
      const busySlots = calendarData.busy;
      console.log("\n🎉 SUCESSO TOTAL! Conexão estabelecida.");
      if (busySlots.length === 0) {
        console.log("⚪ Status: Agenda LIVRE neste período.");
      } else {
        console.log("🔴 Status: Agenda OCUPADA nos horários:");
        busySlots.forEach(slot => {
            console.log(`   ⛔ ${new Date(slot.start).toLocaleTimeString()} até ${new Date(slot.end).toLocaleTimeString()}`);
        });
      }
    }

  } catch (error) {
    console.error("❌ ERRO TÉCNICO:");
    console.error(error.message);
  }
}

testConnection();