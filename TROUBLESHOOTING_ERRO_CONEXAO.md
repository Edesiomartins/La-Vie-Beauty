# 🔧 Solução para Erro de Conexão ao Acessar como Cliente

## ⚠️ Problema

Ao clicar no link encurtado (TinyURL), o app abre mas aparece erro de conexão ao tentar entrar como cliente.

## ✅ Soluções

### 1. **Verificar se as Regras do Firestore foram Publicadas** (MAIS PROVÁVEL)

As regras do Firestore precisam estar publicadas no Firebase Console:

1. Acesse: https://console.firebase.google.com/
2. Projeto: `la-vie---coiffeur`
3. **Firestore Database** → aba **Regras**
4. Verifique se as regras estão assim:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /salons/{salonId} {
      allow read: if true;  // ← DEVE ESTAR ASSIM
      allow write: if true;
      // ... resto das regras
    }
  }
}
```

5. Se não estiver, copie o conteúdo do arquivo `firestore.rules` e cole
6. Clique em **Publicar**
7. Aguarde a confirmação

### 2. **Verificar se o TinyURL está Preservando o Parâmetro**

O TinyURL pode estar perdendo o parâmetro `salonId` ao redirecionar.

**Teste direto:**
- Acesse o link completo: `https://app.la-vie-beauty.com.br/?salonId=SEU_SALON_ID`
- Se funcionar, o problema é o TinyURL

**Solução:**
- Use o link completo em vez do encurtado
- Ou verifique se o TinyURL está preservando os parâmetros da URL

### 3. **Verificar o Console do Navegador**

Abra o Console do navegador (F12) e verifique:

1. **Erros de permissão:**
   ```
   PERMISSION_DENIED: Missing or insufficient permissions
   ```
   → Significa que as regras não foram publicadas

2. **Erros de rede:**
   ```
   Failed to fetch
   Network error
   ```
   → Problema de conexão ou Firebase offline

3. **Logs de debug:**
   - Procure por: `🔍 Verificando URL`
   - Procure por: `🔍 SalonId limpo`
   - Procure por: `✅ Salão encontrado`

### 4. **Verificar se o Salão Existe no Firebase**

1. Acesse: https://console.firebase.google.com/
2. **Firestore Database**
3. Coleção `salons`
4. Verifique se o salão existe com o ID correto

### 5. **Testar Link Direto**

Teste sem o TinyURL:
```
https://app.la-vie-beauty.com.br/?salonId=SEU_SALON_ID_AQUI
```

Se funcionar, o problema é o encurtador.

## 🔍 Debug Adicionado

O código agora tem logs detalhados:

1. **Console do navegador mostrará:**
   - URL completa
   - Parâmetros da URL
   - SalonId extraído
   - SalonId após limpeza
   - Resultado da busca no Firebase

2. **Mensagens de erro mais específicas:**
   - Erro de permissão → Avisa sobre regras do Firestore
   - Erro de rede → Avisa sobre conexão
   - Salão não encontrado → Mostra o ID buscado

## 📝 Checklist de Verificação

- [ ] Regras do Firestore publicadas no Firebase Console
- [ ] Salão existe no Firebase com o ID correto
- [ ] Link completo funciona (sem TinyURL)
- [ ] Console do navegador não mostra erros de permissão
- [ ] Internet funcionando

## 🚨 Se Nada Funcionar

1. **Verifique os logs no console:**
   - Abra F12 → Console
   - Procure por erros em vermelho
   - Copie a mensagem de erro completa

2. **Teste o link completo:**
   - Sem encurtador
   - Direto: `app.la-vie-beauty.com.br/?salonId=ID`

3. **Verifique o Firebase:**
   - Salão existe?
   - Regras estão publicadas?
   - Projeto está ativo?

## 💡 Dica

Se o problema persistir, desabilite temporariamente o TinyURL e use o link completo. O encurtador pode estar causando problemas com os parâmetros da URL.
