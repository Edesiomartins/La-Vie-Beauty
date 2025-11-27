# Configuração da API de Chat com IA

## ⚠️ IMPORTANTE: Diferença entre Firebase Client SDK e Admin SDK

- **Firebase Client SDK** (frontend): Já configurado em `src/firebaseConfig.js`
  - Usa: `apiKey`, `authDomain`, `projectId`, etc.
  - Para uso no navegador/app mobile

- **Firebase Admin SDK** (backend/API): Precisa de credenciais diferentes
  - Usa: `projectId`, `clientEmail`, `privateKey` (Service Account)
  - Para uso em Serverless Functions (Vercel)

## 📋 Configuração do Firebase Admin SDK

A API suporta **duas formas** de configuração:

### Opção 1: Arquivo JSON (Desenvolvimento Local) ⭐ Recomendado para testes

1. Baixe o arquivo JSON da Service Account do Firebase
2. Renomeie para `serviceAccountKey.json`
3. Coloque na **raiz do projeto** (mesmo nível do `package.json`)
4. O arquivo já está no `.gitignore` (não será commitado)

```
La_Vie_Coiffeur/
├── serviceAccountKey.json  ← Coloque aqui
├── api/
│   └── chat.js
└── ...
```

### Opção 2: Variáveis de Ambiente (Produção Vercel)

Crie um arquivo `.env.local` na raiz do projeto (não será commitado):

```env
# Firebase Admin SDK
FIREBASE_ADMIN_PROJECT_ID=la-vie---coiffeur
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxxxx@la-vie---coiffeur.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Google Gemini API
GEMINI_API_KEY=sua-chave-api-gemini
```

**Nota:** A API tentará primeiro usar o arquivo JSON, depois as variáveis de ambiente.

### Para Produção (Vercel) - OBRIGATÓRIO

⚠️ **ATENÇÃO:** Você já tem as variáveis do Firebase Client SDK (`REACT_APP_FIREBASE_*`), mas precisa adicionar as variáveis do **Firebase Admin SDK** (são diferentes!).

Configure no painel do Vercel:

1. Acesse: https://vercel.com/dashboard
2. Selecione seu projeto
3. Vá em: **Settings → Environment Variables**
4. Adicione as **4 novas variáveis** abaixo (além das que já existem):

```
FIREBASE_ADMIN_PROJECT_ID=la-vie---coiffeur
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxxxx@la-vie---coiffeur.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GEMINI_API_KEY=sua-chave-api-gemini
```

## 🔑 Como obter as credenciais:

### 1. Firebase Admin SDK (Service Account)

1. Acesse: https://console.firebase.google.com/
2. Selecione o projeto: **la-vie---coiffeur**
3. Vá em: **⚙️ Configurações do Projeto → Contas de Serviço**
4. Clique em **"Gerar nova chave privada"**
5. Baixe o arquivo JSON (ex: `la-vie---coiffeur-firebase-adminsdk-xxxxx.json`)
6. Abra o JSON e use os valores:
   - `project_id` → `FIREBASE_ADMIN_PROJECT_ID` (já sabemos: `la-vie---coiffeur`)
   - `client_email` → `FIREBASE_ADMIN_CLIENT_EMAIL`
   - `private_key` → `FIREBASE_ADMIN_PRIVATE_KEY` (mantenha as quebras de linha `\n`)

### 2. Google Gemini API

1. Acesse: https://makersuite.google.com/app/apikey
2. Clique em **"Criar chave"**
3. Copie a chave gerada para `GEMINI_API_KEY`

## 🚀 Deploy no Vercel

Após configurar as variáveis de ambiente:

1. Faça commit e push das mudanças:
   ```bash
   git add .
   git commit -m "feat: adicionar API de chat com IA"
   git push origin main
   ```

2. O Vercel detectará automaticamente a pasta `api/` e criará a Serverless Function

3. Aguarde o deploy completar

4. Teste a API em: `https://seu-dominio.vercel.app/api/chat`

## Estrutura de Pastas:

```
La_Vie_Coiffeur/
├── api/
│   └── chat.js          ← API Serverless Function
├── src/
│   └── Chat.jsx         ← Componente do Chat
└── ...
```

## Endpoint da API:

A API estará disponível em: `https://seu-dominio.vercel.app/api/chat`

