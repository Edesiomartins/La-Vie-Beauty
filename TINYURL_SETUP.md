# 🔗 Configuração do Encurtador de Links (TinyURL)

## Token Fornecido

```
5rFuiHNPRHDkcL3eudVkD8uyjmwiW6pWE9yLtPbVLw453Hs56TFGhO7Z5a7D
```

## 📋 Configuração

### 1. Adicionar Token no `.env.local`

Adicione a seguinte linha no arquivo `.env.local`:

```env
TINYURL_API_TOKEN=5rFuiHNPRHDkcL3eudVkD8uyjmwiW6pWE9yLtPbVLw453Hs56TFGhO7Z5a7D
```

### 2. Adicionar Token no Vercel (Produção)

1. Acesse seu projeto no Vercel
2. Vá em **Settings** → **Environment Variables**
3. Adicione:
   - **Name:** `TINYURL_API_TOKEN`
   - **Value:** `5rFuiHNPRHDkcL3eudVkD8uyjmwiW6pWE9yLtPbVLw453Hs56TFGhO7Z5a7D`
   - **Environment:** Production, Preview, Development (marque todos)
4. Clique em **Save**

### 3. Reiniciar o Servidor

Após adicionar a variável de ambiente:

```bash
# Parar o servidor (Ctrl+C)
# Iniciar novamente
npm run dev:api
```

## ✅ Testar

Após configurar, teste o encurtamento:

1. Acesse a tela de **Configurações** no app
2. Clique em **"Copiar Link Encurtado"**
3. O link deve ser encurtado e copiado automaticamente
4. Cole o link no navegador e verifique se funciona

## 🆓 Plano Gratuito do TinyURL

- ✅ Até 600 chamadas de API por mês
- ✅ Redirecionamento direto (com token)
- ✅ Links não expiram
- ✅ API completa

## ❓ Problemas Comuns

### Erro: "TINYURL_API_TOKEN não configurado"
- Verifique se adicionou o token no `.env.local`
- Reinicie o servidor após adicionar

### Erro: "Unauthorized" ou "Invalid token"
- Verifique se copiou o token completo
- Certifique-se de que não há espaços extras

