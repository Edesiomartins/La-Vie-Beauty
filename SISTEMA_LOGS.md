# 📋 Sistema de Logs do Webhook (Substitui Logs do Vercel)

## 🎯 Problema Resolvido

O plano gratuito do Vercel não mantém logs por muito tempo, dificultando o debug de problemas. Agora todos os logs são salvos no **Firebase Firestore** e podem ser consultados a qualquer momento.

## ✅ O que foi implementado

### 1. **Logs Automáticos no Firebase** (`api/webhook-asaas.js`)
- ✅ Todos os webhooks são registrados na coleção `webhook_logs`
- ✅ Logs incluem:
  - Dados antes e depois da atualização
  - Status do processamento
  - Erros (se houver)
  - Tempo de processamento
  - Informações do pagamento

### 2. **Endpoint para Visualizar Logs** (`api/get-webhook-logs.js`)
- ✅ Rota: `GET /api/webhook-logs`
- ✅ Permite filtrar por:
  - `salonId` - Ver logs de um salão específico
  - `type` - Filtrar por tipo de log
  - `limit` - Limitar quantidade de resultados (padrão: 50)

## 📖 Como Usar

### Opção 1: Via API (Recomendado)

#### Ver todos os logs recentes:
```bash
curl https://la-vie-beauty-five.vercel.app/api/webhook-logs
```

#### Ver logs de um salão específico:
```bash
curl "https://la-vie-beauty-five.vercel.app/api/webhook-logs?salonId=kamilla-salon-1234567890"
```

#### Ver apenas erros:
```bash
curl "https://la-vie-beauty-five.vercel.app/api/webhook-logs?type=webhook_error"
```

#### Ver apenas processamentos bem-sucedidos:
```bash
curl "https://la-vie-beauty-five.vercel.app/api/webhook-logs?type=webhook_processed"
```

#### Limitar quantidade:
```bash
curl "https://la-vie-beauty-five.vercel.app/api/webhook-logs?limit=100"
```

### Opção 2: Via Firebase Console

1. Acesse: https://console.firebase.google.com/
2. Selecione o projeto: `la-vie---coiffeur`
3. Vá em **Firestore Database**
4. Procure a coleção `webhook_logs`
5. Os logs estão ordenados por data (mais recentes primeiro)

## 📊 Tipos de Logs

### `webhook_received`
- Quando um webhook é recebido
- Contém: método HTTP, body, headers

### `webhook_ignored`
- Quando um webhook é ignorado (razões):
  - `invalid_external_reference` - Não é do La-Vie
  - `event_not_relevant` - Evento não relevante
  - `invalid_plan_value` - Valor não corresponde a plano pago
  - `already_processed` - Pagamento já foi processado

### `webhook_processed`
- Quando um webhook é processado com sucesso
- Contém:
  - Dados antes da atualização (`beforeUpdate`)
  - Dados depois da atualização (`afterUpdate`)
  - Verificação de preservação de dados (`dataPreserved`)
  - Tempo de processamento

### `webhook_error`
- Quando ocorre um erro
- Contém: mensagem de erro, stack trace

## 🔍 Exemplo de Resposta da API

```json
{
  "success": true,
  "count": 10,
  "logs": [
    {
      "id": "log_123456",
      "requestId": "webhook_1234567890_abc123",
      "type": "webhook_processed",
      "status": "success",
      "salonId": "kamilla-salon-1234567890",
      "salonName": "Kamilla Beauty",
      "paymentId": "pay_123456",
      "customerId": "cus_123456",
      "value": 49.90,
      "newPlan": "pro",
      "beforeUpdate": {
        "name": "Kamilla Beauty",
        "plan": "free",
        "email": "kamilla@example.com",
        "phone": "(11) 99999-9999"
      },
      "afterUpdate": {
        "name": "Kamilla Beauty",
        "plan": "pro",
        "email": "kamilla@example.com",
        "phone": "(11) 99999-9999"
      },
      "dataPreserved": {
        "name": true,
        "email": true,
        "phone": true
      },
      "processingTimeMs": 234,
      "timestamp": "2024-01-15T10:30:00.000Z",
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

## 🛠️ Debug de Problemas

### Verificar se um pagamento foi processado:
```bash
curl "https://la-vie-beauty-five.vercel.app/api/webhook-logs?salonId=SEU_SALON_ID&type=webhook_processed"
```

### Verificar erros recentes:
```bash
curl "https://la-vie-beauty-five.vercel.app/api/webhook-logs?type=webhook_error&limit=20"
```

### Verificar se dados foram preservados:
Procure por logs com `dataPreserved: false`:
```bash
curl "https://la-vie-beauty-five.vercel.app/api/webhook-logs?salonId=SEU_SALON_ID" | grep -A 5 "dataPreserved"
```

## 💡 Vantagens sobre Logs do Vercel

1. ✅ **Persistência**: Logs ficam salvos permanentemente no Firebase
2. ✅ **Acessibilidade**: Pode consultar a qualquer momento
3. ✅ **Filtros**: Pode filtrar por salão, tipo, data
4. ✅ **Detalhes**: Logs incluem dados antes/depois da atualização
5. ✅ **Gratuito**: Firebase tem plano gratuito generoso

## 🔒 Segurança

- Os logs contêm informações sensíveis (emails, telefones)
- Considere adicionar autenticação no endpoint se necessário
- Por enquanto, o endpoint é público (pode ser restringido depois)

## 📝 Notas

- Os logs são salvos automaticamente, não precisa fazer nada
- A coleção `webhook_logs` cresce com o tempo
- Considere criar uma regra de limpeza automática de logs antigos (ex: > 90 dias)
- Os logs usam `serverTimestamp()` do Firebase para ordenação precisa
