// Servidor local para desenvolvimento da API
// Execute: npm run dev:api
// A API estará disponível em http://localhost:3000/api/chat

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config({ path: '.env.local' });

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Importar e usar a função handler da API
const loadHandler = async () => {
  try {
    const chatModule = await import('./api/chat.js');
    const handler = chatModule.default;

    app.all('/api/chat', async (req, res) => {
      try {
        await handler(req, res);
      } catch (error) {
        console.error('❌ Erro no handler:', error);
        if (!res.headersSent) {
          res.status(500).json({ 
            message: 'Erro interno', 
            error: error.message 
          });
        }
      }
    });

    app.listen(PORT, () => {
      console.log(`🚀 Servidor de API rodando em http://localhost:${PORT}`);
      console.log(`📡 API disponível em http://localhost:${PORT}/api/chat`);
      console.log(`💡 Certifique-se de que o Vite está rodando em http://localhost:5173`);
      console.log(`📝 Variáveis de ambiente carregadas do .env.local`);
    });
  } catch (error) {
    console.error('❌ Erro ao carregar a API:', error);
    process.exit(1);
  }
};

loadHandler();

