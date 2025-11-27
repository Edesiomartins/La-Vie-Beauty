// api/chat.js - VERSÃO ULTRA SIMPLIFICADA (SEM FIREBASE)
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { message, history } = req.body;

  if (!message) {
    return res.status(400).json({ message: 'Missing message' });
  }

  try {
    console.log('📨 Mensagem recebida:', message);

    // Construir histórico
    const chatHistory = (history || []).map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }));

    // Prompt do bot
    const systemPrompt = `Você é um assistente amigável para o salão La Vie Beauty.
Ajude clientes a agendar serviços de beleza.
Mantenha respostas concisas em português.
Seja prestativo e profissional.`;

    // Chamar Gemini
    const chat = model.startChat({ history: chatHistory }).sendMessage(message);
    const result = await chat;
    const botResponse = result.response.text();

    console.log('✅ Resposta Gemini:', botResponse);

    return res.status(200).json({
      response: botResponse,
      action: 'none',
      bookingData: null
    });

  } catch (error) {
    console.error('❌ Erro:', error.message);
    return res.status(500).json({
      message: 'Erro ao processar',
      error: error.message
    });
  }
}