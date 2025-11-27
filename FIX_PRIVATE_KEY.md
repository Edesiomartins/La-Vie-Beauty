# 🔧 Como Corrigir o Erro de Chave Privada no Vercel

## ❌ Erro

```
DECODER routines::unsupported
Getting metadata from plugin failed with error
```

## 🔍 Causa

A chave privada do Firebase Admin está mal formatada no Vercel. A chave precisa estar em **UMA ÚNICA LINHA** com `\n` para representar quebras de linha.

## ✅ Solução

### Passo 1: Obter a chave privada correta

1. Abra o arquivo `serviceAccountKey.json`
2. Copie o valor do campo `private_key` (está entre aspas)
3. A chave deve começar com `-----BEGIN PRIVATE KEY-----` e terminar com `-----END PRIVATE KEY-----`

### Passo 2: Formatar para o Vercel

A chave deve estar em **UMA LINHA** com `\n` literal. Exemplo:

```
"-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCbo/Wi6ug97kEJ\nL60v7RZiwPhAmomK+zCjyDdCbnlbPVq9O3SZZfYAuV9U8AAdT1TnQaKsgQI5RQOL\n...\n-----END PRIVATE KEY-----\n"
```

### Passo 3: Configurar no Vercel

1. Acesse: https://vercel.com/dashboard
2. Seu Projeto → **Settings → Environment Variables**
3. Encontre `FIREBASE_ADMIN_PRIVATE_KEY`
4. **Delete** a variável atual
5. **Crie novamente** com:
   - **Nome**: `FIREBASE_ADMIN_PRIVATE_KEY`
   - **Valor**: Cole a chave completa em UMA LINHA (com `\n`)
   - **IMPORTANTE**: Não use quebras de linha reais, use `\n` literal
6. Salve

### Passo 4: Fazer novo deploy

Após atualizar a variável, faça um novo deploy:
- Vercel Dashboard → Deployments → Clique nos 3 pontos → **Redeploy**

## 🔍 Verificação

Após o deploy, verifique os logs:
- Vercel Dashboard → Functions → `api/chat.js` → Logs
- Deve aparecer: `✅ Firebase Admin inicializado via variáveis de ambiente (Vercel)`

## ⚠️ Formato Correto

✅ **CORRETO** (uma linha com \n):
```
"-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n"
```

❌ **ERRADO** (múltiplas linhas):
```
-----BEGIN PRIVATE KEY-----
MIIE...
-----END PRIVATE KEY-----
```

## 📝 Script para Converter

Se você tem a chave em múltiplas linhas, use este comando PowerShell:

```powershell
$key = Get-Content serviceAccountKey.json | ConvertFrom-Json
$key.private_key -replace "`n", "\n"
```

Copie o resultado e cole no Vercel.

