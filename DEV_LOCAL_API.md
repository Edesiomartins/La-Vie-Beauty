# 🚀 Como Rodar a API Localmente

## Problema

Em desenvolvimento local, o Vite não serve automaticamente as funções serverless do Vercel. Por isso, você precisa rodar um servidor separado para a API.

## Solução

Criamos um servidor Express local que roda a API em `http://localhost:3000`.

## 📋 Como Usar

### Opção 1: Rodar tudo junto (Recomendado)

```bash
npm run dev:all
```

Isso roda:
- Vite (frontend) em `http://localhost:5173`
- API Server em `http://localhost:3000`

### Opção 2: Rodar separadamente

**Terminal 1 - Frontend:**
```bash
npm run dev
```

**Terminal 2 - API:**
```bash
npm run dev:api
```

## ✅ Verificação

1. Frontend rodando: http://localhost:5173
2. API rodando: http://localhost:3000/api/chat
3. Teste o chat no app

## 📝 Notas

- O servidor de API usa as variáveis do `.env.local`
- Certifique-se de que o `.env.local` está configurado corretamente
- Em produção (Vercel), a API roda automaticamente

## 🐛 Troubleshooting

### Erro: "Cannot find module"
```bash
npm install
```

### Erro: "Port 3000 already in use"
Altere a porta no `api-server.js` ou pare o processo que está usando a porta 3000.

### API não responde
Verifique se:
1. O `.env.local` está na raiz do projeto
2. As variáveis estão configuradas corretamente
3. O servidor está rodando (veja os logs no terminal)

