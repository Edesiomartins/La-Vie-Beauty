// api-server.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Importa os manipuladores (handlers)
import chatHandler from './api/chat.js';
import appointmentHandler from './api/create-appointment.js'; // <--- O SERVIDOR PRECISA DISSO

// Tenta carregar .env.local primeiro, depois .env
dotenv.config({ path: '.env.local' });
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Rota de Teste
app.get('/', (req, res) => {
  res.send('✅ Servidor Backend La Vie está rodando!');
});

// --- ROTA 1: CHAT (Juliana) ---
app.post('/api/chat', async (req, res) => {
  try {
    await chatHandler(req, res);
  } catch (error) {
    console.error('Erro no Chat:', error);
    res.status(500).json({ error: 'Erro interno no servidor de chat' });
  }
});

// --- ROTA 2: AGENDAMENTO (Google Agenda) ---
// Essa é a parte que estava faltando no seu arquivo atual
app.post('/api/create-appointment', async (req, res) => {
  console.log("📅 NOVO PEDIDO: Agendando para", req.body.clientName);
  try {
    await appointmentHandler(req, res);
  } catch (error) {
    console.error('Erro no Agendamento:', error);
    res.status(500).json({ error: 'Erro interno no servidor de agendamento' });
  }
});

// Inicia o servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor Backend rodando em http://localhost:${PORT}`);
  console.log(`✨ Rota de Chat ATIVA: http://localhost:${PORT}/api/chat`);
  console.log(`📅 Rota de Agenda ATIVA: http://localhost:${PORT}/api/create-appointment`);
});