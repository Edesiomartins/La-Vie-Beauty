// test-calendar.js
import { google } from 'googleapis';
import dotenv from 'dotenv';

// Carrega as chaves do .env
dotenv.config({ path: '.env.local' });

// CONFIGURAÇÃO MANUAL PARA TESTE
const CALENDAR_ID = "c1aecb3e7e90ea4a37a6cc8929bae6158f4d7e0b3a6564bbf423eda10e803baf@group.calendar.google.com"; // <--- SUBSTITUA ISSO!
const DATE_TO_TEST = "2025-11-29"; // Coloque a data de HOJE (AAAA-MM-DD)

async function testConnection() {
  console.log("🤖 Iniciando teste de conexão com Google Agenda...");

  // 1. Verifica Chaves
  if (!process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
    console.error("❌ ERRO: Chaves não encontradas no arquivo .env");
    return;
  }
  console.log("✅ Chaves encontradas no .env");

  // 2. Autenticação
  try {
    const privateKey = process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n');
    const auth = new google.auth.JWT(
      process.env.GOOGLE_CLIENT_EMAIL,
      null,
      privateKey,
      ['https://www.googleapis.com/auth/calendar.readonly']
    );
    
    const calendar = google.calendar({ version: 'v3', auth });
    console.log("✅ Autenticação criada com sucesso");

    // 3. Teste de Leitura (FreeBusy)
    console.log(`🔎 Verificando agenda ${CALENDAR_ID} para o dia ${DATE_TO_TEST}...`);
    
    const timeMin = new Date(`${DATE_TO_TEST}T08:00:00-03:00`).toISOString();
    const timeMax = new Date(`${DATE_TO_TEST}T19:00:00-03:00`).toISOString();

    const res = await calendar.freebusy.query({
      resource: {
        timeMin: timeMin,
        timeMax: timeMax,
        timeZone: 'America/Sao_Paulo',
        items: [{ id: CALENDAR_ID }],
      },
    });

    const calendarData = res.data.calendars[CALENDAR_ID];

    if (!calendarData) {
      console.error("❌ ERRO: Calendário não encontrado na resposta! Verifique se o ID está correto.");
      console.log("Resposta bruta:", JSON.stringify(res.data, null, 2));
      return;
    }

    if (calendarData.errors) {
      console.error("❌ ERRO DE PERMISSÃO:");
      console.error(calendarData.errors);
      console.log("\nDICA: Verifique se você compartilhou a agenda com:", process.env.GOOGLE_CLIENT_EMAIL);
      return;
    }

    const busySlots = calendarData.busy;
    console.log("\n📅 RESULTADO:");
    if (busySlots.length === 0) {
      console.log("⚪ Nenhum evento encontrado (Agenda Livre). Se você criou um evento de teste, o robô não está vendo.");
    } else {
      console.log("🔴 Eventos encontrados (Agenda Ocupada):");
      busySlots.forEach(slot => {
        const start = new Date(slot.start).toLocaleTimeString('pt-BR');
        const end = new Date(slot.end).toLocaleTimeString('pt-BR');
        console.log(`   - Ocupado das ${start} às ${end}`);
      });
      console.log("\n✅ SUCESSO! O robô está lendo a agenda corretamente.");
    }

  } catch (error) {
    console.error("❌ ERRO FATAL:");
    console.error(error);
  }
}

testConnection();