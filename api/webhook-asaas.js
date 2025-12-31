// api/webhook-asaas.js
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, getDoc, updateDoc, doc, addDoc, serverTimestamp } from 'firebase/firestore';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config();

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || "la-vie---coiffeur.firebaseapp.com",
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || "la-vie---coiffeur",
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || "la-vie---coiffeur.firebasestorage.app",
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "359423432028",
  appId: process.env.VITE_FIREBASE_APP_ID || "1:359423432028:web:9566575a6a995759a55d99",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Função auxiliar para salvar log no Firebase (não bloqueia se falhar)
async function saveWebhookLog(logData) {
  try {
    await addDoc(collection(db, 'webhook_logs'), {
      ...logData,
      timestamp: serverTimestamp(),
      createdAt: new Date().toISOString()
    });
  } catch (error) {
    // Não falhar se não conseguir salvar o log (apenas logar o erro)
    console.error('⚠️ Erro ao salvar log (não crítico):', error.message);
    // Não relança o erro para não bloquear o processamento do webhook
  }
}

export default async function handler(req, res) {
  const requestId = `webhook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const startTime = Date.now();
  
  // Log inicial da requisição
  await saveWebhookLog({
    requestId,
    type: 'webhook_received',
    method: req.method,
    body: JSON.stringify(req.body || {}),
    headers: JSON.stringify(req.headers || {}),
    status: 'processing'
  });

  // Webhooks geralmente são POST
  if (req.method !== 'POST') {
    await saveWebhookLog({
      requestId,
      type: 'webhook_rejected',
      reason: 'method_not_allowed',
      method: req.method
    });
    return res.status(200).json({ ok: true }); // Sempre 200
  }

  try {
    const payload = req.body || {};
    const { event, payment } = payload;

    // Blindagem: Verificar externalReference (só aceita La-Vie)
    const externalRef = payment?.externalReference || '';
    
    if (!externalRef.startsWith('LAVIE_')) {
      const logData = {
        requestId,
        type: 'webhook_ignored',
        reason: 'invalid_external_reference',
        externalRef,
        event,
        paymentId: payment?.id
      };
      await saveWebhookLog(logData);
      console.log(`⚠️ Webhook ignorado: externalReference não é La-Vie (${externalRef})`);
      return res.status(200).json({ ignored: true }); // Sempre 200, mas ignora
    }

    // Só nos interessa pagamento confirmado
    if (event !== 'PAYMENT_RECEIVED' && event !== 'PAYMENT_CONFIRMED') {
      await saveWebhookLog({
        requestId,
        type: 'webhook_ignored',
        reason: 'event_not_relevant',
        event,
        paymentId: payment?.id
      });
      return res.status(200).json({ received: true }); // Ignora outros eventos
    }

    console.log(`🔔 Webhook Asaas: Pagamento ${payment.id} confirmado! Valor: ${payment.value} | Ref: ${externalRef}`);

    const customerId = payment.customer;
    const value = parseFloat(payment.value) || 0;
    const paymentId = payment.id;

    // 1. Descobrir qual Plano é baseado no valor (APENAS se for um valor válido de plano pago)
    let newPlan = null; // null = não atualizar o plano
    if (value >= 49.00 && value < 80.00) {
      newPlan = 'pro'; // Shine (mapeado como 'pro' no frontend)
    } else if (value >= 89.00) {
      newPlan = 'premium'; // Glamour (mapeado como 'premium' no frontend)
    }
    
    // Se não for um plano pago válido, ignora (não reseta para free)
    if (!newPlan) {
      const logData = {
        requestId,
        type: 'webhook_ignored',
        reason: 'invalid_plan_value',
        value,
        paymentId,
        externalRef
      };
      await saveWebhookLog(logData);
      console.log(`⚠️ Valor ${value} não corresponde a um plano pago. Ignorando atualização.`);
      return res.status(200).json({ ok: true, ignored: 'invalid_plan_value' });
    }

    // 2. Extrair salonId do externalReference
    const salonId = externalRef.replace('LAVIE_', '');

    // 3. Achar o Salão no Firebase pelo salonId (direto) ou pelo asaasCustomerId (fallback)
    let salonRef;
    let salonData;
    
    if (salonId) {
      // Tenta pelo salonId primeiro (mais direto e rápido)
      salonRef = doc(db, 'salons', salonId);
      const salonSnap = await getDoc(salonRef);
      
      if (salonSnap.exists()) {
        salonData = salonSnap.data();
      } else {
        // Fallback: busca pelo asaasCustomerId
        const salonsRef = collection(db, 'salons');
        const q = query(salonsRef, where('asaasCustomerId', '==', customerId));
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) {
          const logData = {
            requestId,
            type: 'webhook_error',
            reason: 'salon_not_found',
            salonId,
            customerId,
            paymentId
          };
          await saveWebhookLog(logData);
          console.error(`❌ Salão não encontrado: ID=${salonId}, Customer=${customerId}`);
          return res.status(200).json({ ok: true }); // Sempre 200, mesmo se não encontrar
        }
        
        salonRef = doc(db, 'salons', snapshot.docs[0].id);
        salonData = snapshot.docs[0].data();
      }
    } else {
      // Fallback: busca pelo asaasCustomerId
      const salonsRef = collection(db, 'salons');
      const q = query(salonsRef, where('asaasCustomerId', '==', customerId));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        const logData = {
          requestId,
          type: 'webhook_error',
          reason: 'salon_not_found_by_customer',
          customerId,
          paymentId
        };
        await saveWebhookLog(logData);
        console.error(`❌ Salão não encontrado para o cliente Asaas: ${customerId}`);
        return res.status(200).json({ ok: true }); // Sempre 200, mesmo se não encontrar
      }
      
      salonRef = doc(db, 'salons', snapshot.docs[0].id);
      salonData = snapshot.docs[0].data();
    }

    // 4. Verificar se já processou este pagamento (idempotência)
    // Evita processar o mesmo pagamento múltiplas vezes
    const lastProcessedPayment = salonData?.lastProcessedPaymentId;
    if (lastProcessedPayment === paymentId) {
      const logData = {
        requestId,
        type: 'webhook_ignored',
        reason: 'already_processed',
        paymentId,
        salonId,
        salonName: salonData?.name
      };
      await saveWebhookLog(logData);
      console.log(`⚠️ Pagamento ${paymentId} já foi processado anteriormente. Ignorando.`);
      return res.status(200).json({ ok: true, ignored: 'already_processed' });
    }

    // 5. BACKUP: Log completo dos dados antes de atualizar (para debug)
    const beforeUpdate = {
      name: salonData?.name || 'N/A',
      plan: salonData?.plan || 'N/A',
      email: salonData?.email || 'N/A',
      phone: salonData?.phone || 'N/A',
      address: salonData?.address || 'N/A',
      googleCalendarId: salonData?.googleCalendarId || 'N/A',
      status: salonData?.status || 'N/A',
      allFields: Object.keys(salonData || {})
    };

    console.log(`📋 BACKUP ANTES DE ATUALIZAR - Salão ID: ${salonId}`);
    console.log(`   Nome: ${beforeUpdate.name}`);
    console.log(`   Plano Atual: ${beforeUpdate.plan}`);
    console.log(`   Email: ${beforeUpdate.email}`);
    console.log(`   Telefone: ${beforeUpdate.phone}`);
    console.log(`   Endereço: ${beforeUpdate.address}`);
    console.log(`   Google Calendar ID: ${beforeUpdate.googleCalendarId}`);
    console.log(`   Status: ${beforeUpdate.status}`);
    console.log(`   Campos adicionais:`, beforeUpdate.allFields);

    // 6. Atualizar APENAS os campos de pagamento (preserva todos os outros campos)
    // O updateDoc do Firebase preserva automaticamente todos os campos existentes
    const updateData = {
      plan: newPlan,
      lastPaymentDate: new Date().toISOString(),
      lastProcessedPaymentId: paymentId, // Marca como processado
      status: 'active'
    };

    // Garantir que campos críticos não sejam sobrescritos
    // Se algum campo crítico estiver faltando, preservar do estado atual
    if (!salonData?.name) {
      console.warn(`⚠️ ATENÇÃO: Salão sem nome! ID: ${salonId}`);
    }
    if (!salonData?.email) {
      console.warn(`⚠️ ATENÇÃO: Salão sem email! ID: ${salonId}`);
    }

    // 6.1. Tentar atualizar o salão (com tratamento de erro específico)
    try {
      await updateDoc(salonRef, updateData);
    } catch (updateError) {
      // Se der erro de permissão, logar mas continuar
      if (updateError.code === 'permission-denied' || updateError.message?.includes('PERMISSION_DENIED')) {
        console.error('❌ ERRO DE PERMISSÃO ao atualizar salão:', updateError.message);
        await saveWebhookLog({
          requestId,
          type: 'webhook_error',
          status: 'permission_denied',
          error: updateError.message,
          salonId,
          paymentId
        });
        // Retornar erro específico para o usuário saber que precisa configurar regras
        return res.status(200).json({ 
          ok: false, 
          error: 'PERMISSION_DENIED',
          message: 'Configure as regras do Firestore para permitir atualização de salões pelo webhook. Veja firestore.rules'
        });
      }
      // Se for outro erro, relançar
      throw updateError;
    }

    // 7. Verificar se os dados foram preservados após atualização
    const verifySnap = await getDoc(salonRef);
    const verifyData = verifySnap.exists() ? verifySnap.data() : null;
    
    const afterUpdate = {
      name: verifyData?.name || 'N/A',
      email: verifyData?.email || 'N/A',
      phone: verifyData?.phone || 'N/A',
      plan: verifyData?.plan || 'N/A'
    };

    const dataPreserved = {
      name: !!(salonData?.name && verifyData?.name),
      email: !!(salonData?.email && verifyData?.email),
      phone: !!(salonData?.phone && verifyData?.phone)
    };

    if (verifyData) {
      console.log(`✅ VERIFICAÇÃO PÓS-ATUALIZAÇÃO - Salão ID: ${salonId}`);
      console.log(`   Nome preservado: ${dataPreserved.name ? '✅' : '❌'} ${afterUpdate.name}`);
      console.log(`   Email preservado: ${dataPreserved.email ? '✅' : '❌'} ${afterUpdate.email}`);
      console.log(`   Telefone preservado: ${dataPreserved.phone ? '✅' : '❌'} ${afterUpdate.phone}`);
      console.log(`   Novo Plano: ${afterUpdate.plan}`);
      
      // Alertar se algum campo crítico foi perdido
      if (salonData?.name && !verifyData?.name) {
        console.error(`❌ ERRO CRÍTICO: Nome do salão foi perdido!`);
      }
      if (salonData?.email && !verifyData?.email) {
        console.error(`❌ ERRO CRÍTICO: Email do salão foi perdido!`);
      }
    }

    // 8. Salvar log completo do processamento
    const processingTime = Date.now() - startTime;
    await saveWebhookLog({
      requestId,
      type: 'webhook_processed',
      status: 'success',
      salonId,
      salonName: salonData?.name,
      paymentId,
      customerId,
      value,
      newPlan,
      beforeUpdate,
      afterUpdate,
      dataPreserved,
      processingTimeMs: processingTime
    });

    console.log(`✅ SUCESSO: Salão "${salonData?.name || salonId}" atualizado para o plano ${newPlan}! (Pagamento: ${paymentId})`);

    return res.status(200).json({ ok: true });

  } catch (error) {
    // Nunca deixar erro subir - sempre retorna 200
    const processingTime = Date.now() - startTime;
    await saveWebhookLog({
      requestId,
      type: 'webhook_error',
      status: 'error',
      error: error.message,
      stack: error.stack,
      processingTimeMs: processingTime
    });
    console.error('❌ Erro Webhook (ignorado):', error);
    return res.status(200).json({ ok: true });
  }
}
