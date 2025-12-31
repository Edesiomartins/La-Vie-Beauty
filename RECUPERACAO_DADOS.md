# 🚨 GUIA DE RECUPERAÇÃO DE DADOS PERDIDOS

## ⚠️ PROBLEMA IDENTIFICADO

Se os dados de um salão foram perdidos, pode ter sido causado por:

1. **Uso incorreto de `setDoc`** - Substitui completamente o documento (já corrigido)
2. **Múltiplos webhooks processando** - Já corrigido com idempotência
3. **Bug no cadastro** - Já adicionada proteção

## ✅ CORREÇÕES APLICADAS

### 1. Webhook Mais Seguro (`api/webhook-asaas.js`)
- ✅ Logs detalhados antes e depois de atualizar
- ✅ Verificação de preservação de dados
- ✅ Idempotência (não processa mesmo pagamento duas vezes)
- ✅ Não reseta para 'free' quando valor inválido

### 2. Proteção no Cadastro (`src/App.jsx`)
- ✅ Verifica se salão já existe antes de criar
- ✅ Usa `merge: false` para garantir que só cria novos documentos

## 🔍 COMO VERIFICAR OS DADOS

### Opção 1: Script de Verificação

Execute o script de recuperação:

```bash
node api/recover-salon-data.js <SALON_ID>
```

Exemplo:
```bash
node api/recover-salon-data.js kamilla-salon-1234567890
```

O script mostrará:
- ✅ Dados principais do salão
- ✅ Lista de clientes
- ✅ Lista de colaboradores
- ✅ Lista de agendamentos
- ✅ Lista de serviços

### Opção 2: Verificar no Firebase Console

1. Acesse: https://console.firebase.google.com/
2. Selecione o projeto: `la-vie---coiffeur`
3. Vá em **Firestore Database**
4. Procure a coleção `salons`
5. Encontre o documento com o ID do salão da Kamilla
6. Verifique:
   - Se o documento existe
   - Quais campos estão presentes
   - Se há subcoleções (clients, collaborators, appointments)

## 🔧 COMO RECUPERAR DADOS

### Se o Documento do Salão Existe mas Está Incompleto:

1. **Verificar logs do webhook** (Vercel):
   - Acesse o dashboard do Vercel
   - Vá em **Functions** → **api/webhook-asaas**
   - Verifique os logs para ver o que foi atualizado

2. **Verificar histórico do Firebase**:
   - O Firebase não tem histórico automático
   - Mas você pode verificar se há backups

3. **Restaurar manualmente**:
   - Se você tiver backup dos dados
   - Use o Firebase Console para editar o documento
   - Ou use o script de recuperação para ver o que está faltando

### Se o Documento Foi Deletado Completamente:

1. **Verificar se há backup**:
   - Firebase não faz backup automático
   - Verifique se há exportações manuais

2. **Recriar o salão**:
   - Se os dados foram completamente perdidos
   - Será necessário recadastrar
   - Mas agora está protegido contra perda de dados

## 🛡️ PREVENÇÃO FUTURA

### O que foi implementado:

1. ✅ **Webhook seguro**: Só atualiza campos de pagamento, preserva tudo
2. ✅ **Logs detalhados**: Tudo é registrado antes e depois
3. ✅ **Idempotência**: Não processa mesmo pagamento duas vezes
4. ✅ **Proteção no cadastro**: Não sobrescreve salões existentes
5. ✅ **Verificação pós-atualização**: Confirma que dados foram preservados

### Recomendações:

1. **Fazer backup regular**:
   ```bash
   # Exportar dados do Firebase (requer Firebase CLI)
   firebase firestore:export gs://[BUCKET]/backup-$(date +%Y%m%d)
   ```

2. **Monitorar logs do Vercel**:
   - Verificar regularmente os logs do webhook
   - Procurar por erros ou avisos

3. **Testar antes de deploy**:
   - Sempre testar em ambiente de desenvolvimento primeiro

## 📞 CONTATO PARA RECUPERAÇÃO

Se os dados foram realmente perdidos e não há backup:

1. Verifique os logs do Vercel para entender o que aconteceu
2. Execute o script de verificação para ver o estado atual
3. Se necessário, entre em contato com suporte técnico

## 🔍 IDENTIFICAR O SALON_ID DA KAMILLA

Para encontrar o ID do salão da Kamilla:

1. **No Firebase Console**:
   - Procure por salões com nome contendo "Kamilla"
   - Ou procure por email da Kamilla no campo `email`

2. **Nos logs do webhook**:
   - Procure por `externalReference` com `LAVIE_` seguido do ID
   - Exemplo: `LAVIE_kamilla-salon-1234567890`

3. **No código**:
   - O ID é gerado como: `nome.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Date.now()`
   - Exemplo: "kamilla-beauty" + "-" + timestamp
