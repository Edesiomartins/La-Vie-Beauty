# 🔒 Configurar Regras do Firestore para Webhooks

## ⚠️ Problema

O erro `PERMISSION_DENIED: Missing or insufficient permissions` ocorre porque as regras do Firestore estão bloqueando a escrita do webhook.

## ✅ Solução

### Passo 1: Acessar Firebase Console

1. Acesse: https://console.firebase.google.com/
2. Selecione o projeto: `la-vie---coiffeur`
3. Vá em **Firestore Database**
4. Clique na aba **Regras** (Rules)

### Passo 2: Copiar e Colar as Regras

Copie o conteúdo do arquivo `firestore.rules` e cole no Firebase Console:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Regras para Salões
    match /salons/{salonId} {
      // Permitir leitura pública (para clientes acessarem)
      allow read: if true;
      
      // Permitir escrita (webhooks do servidor precisam disso)
      allow write: if true;
      
      // Subcoleções de Salões
      match /clients/{clientId} {
        allow read, write: if true;
      }
      
      match /collaborators/{collaboratorId} {
        allow read, write: if true;
      }
      
      match /appointments/{appointmentId} {
        allow read, write: if true;
      }
      
      match /services/{serviceId} {
        allow read, write: if true;
      }
    }
    
    // Regras para Logs de Webhook (permitir escrita do servidor)
    match /webhook_logs/{logId} {
      // Permitir leitura pública (para debug)
      allow read: if true;
      
      // Permitir escrita (webhooks do servidor)
      allow write: if true;
    }
    
    // Regras para Serviços Globais
    match /global_services/{serviceId} {
      allow read: if true;
      allow write: if false; // Apenas admin pode escrever
    }
    
    // Regras padrão: negar tudo que não foi explicitamente permitido
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

### Passo 3: Publicar as Regras

1. Clique em **Publicar** (Publish)
2. Aguarde a confirmação

## ⚠️ Segurança

**NOTA IMPORTANTE**: As regras acima são **permissivas** para permitir que os webhooks funcionem. 

Para produção, você pode tornar mais restritivo:

1. **Usar Firebase Admin SDK** no servidor (recomendado):
   - Admin SDK ignora as regras do Firestore
   - Mais seguro para operações do servidor
   - Requer configuração de service account

2. **Restringir por IP ou token**:
   - Adicionar validação de origem no webhook
   - Verificar token secreto do Asaas

3. **Regras mais específicas**:
   - Validar estrutura dos dados antes de permitir escrita
   - Limitar quais campos podem ser atualizados

## 🔧 Alternativa: Usar Firebase Admin SDK

Se preferir usar Admin SDK (mais seguro):

1. Baixar service account key do Firebase
2. Configurar no servidor
3. Usar Admin SDK em vez de Client SDK no webhook

Exemplo:
```javascript
import admin from 'firebase-admin';

const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
```

## ✅ Testar

Após configurar as regras:

1. Faça um teste de pagamento
2. Verifique se o webhook processa sem erro
3. Verifique os logs em `/api/webhook-logs`

## 📝 Arquivo de Regras

O arquivo `firestore.rules` foi criado no projeto. Você pode:
- Usar o Firebase CLI para deploy: `firebase deploy --only firestore:rules`
- Ou copiar manualmente no console
