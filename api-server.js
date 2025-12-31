// api-server.js
import 'dotenv/config'; 
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import express from 'express';
import cors from 'cors';

// Importa os handlers
import chatHandler from './api/chat.js';
import appointmentHandler from './api/create-appointment.js';
import slotsHandler from './api/get-slots.js';
import syncHandler from './api/sync-status.js';
import checkoutHandler from './api/create-checkout.js';
import webhookHandler from './api/webhook-asaas.js';
import shortenUrlHandler from './api/shorten-url.js';
import getWebhookLogsHandler from './api/get-webhook-logs.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => res.send('✅ Backend La Vie Rodando!'));

// Rotas
app.post('/api/chat', async (req, res) => {
    try { await chatHandler(req, res); } 
    catch (e) { console.error(e); res.status(500).json({error: e.message}); }
});

app.post('/api/create-appointment', async (req, res) => {
    console.log("📅 Criando agendamento...");
    try { await appointmentHandler(req, res); } 
    catch (e) { console.error(e); res.status(500).json({error: e.message}); }
});

// --- NOVA ROTA PARA LER HORÁRIOS ---
app.post('/api/get-slots', async (req, res) => {
    console.log("🔎 Verificando horários no Google...");
    try { await slotsHandler(req, res); } 
    catch (e) { console.error(e); res.status(500).json({error: e.message}); }
});

// --- ROTA DE SINCRONIZAÇÃO ---
app.post('/api/sync-status', async (req, res) => {
    console.log("🔄 Sincronizando com Google...");
    try { await syncHandler(req, res); } 
    catch (e) { res.status(500).json({error: e.message}); }
});

// --- ROTA 3: PAGAMENTO ASAAS ---
app.post('/api/create-checkout', async (req, res) => {
    console.log("💰 Iniciando checkout Asaas...");
    try { await checkoutHandler(req, res); } 
    catch (e) { res.status(500).json({error: e.message}); }
});

// --- ROTA 4: WEBHOOK ASAAS ---
app.post('/api/webhook-asaas', async (req, res) => {
    console.log("🔔 Webhook Asaas recebido...");
    try { await webhookHandler(req, res); } 
    catch (e) { res.status(500).json({error: e.message}); }
});

// --- ROTA 5: ENCURTAR URL (TinyURL) ---
app.post('/api/shorten-url', async (req, res) => {
    console.log("🔗 Encurtando URL...");
    try { await shortenUrlHandler(req, res); } 
    catch (e) { res.status(500).json({error: e.message}); }
});

// --- ROTA 6: VISUALIZAR LOGS DO WEBHOOK (substitui logs do Vercel) ---
app.get('/api/webhook-logs', async (req, res) => {
    console.log("📋 Buscando logs do webhook...");
    try { await getWebhookLogsHandler(req, res); } 
    catch (e) { res.status(500).json({error: e.message}); }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`   - Chat: OK`);
  console.log(`   - Agenda (Escrever): OK`);
  console.log(`   - Slots (Ler): OK`);
});