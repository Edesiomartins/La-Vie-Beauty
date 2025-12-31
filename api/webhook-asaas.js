// api/webhook-asaas.js
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, getDoc, updateDoc, doc } from 'firebase/firestore';
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

export default async function handler(req, res) {
  // Webhooks geralmente são POST
  if (req.method !== 'POST') {
    return res.status(200).json({ ok: true }); // Sempre 200
  }

  try {
    const payload = req.body || {};
    const { event, payment } = payload;

    // Blindagem: Verificar externalReference (só aceita La-Vie)
    const externalRef = payment?.externalReference || '';
    
    if (!externalRef.startsWith('LAVIE_')) {
      console.log(`⚠️ Webhook ignorado: externalReference não é La-Vie (${externalRef})`);
      return res.status(200).json({ ignored: true }); // Sempre 200, mas ignora
    }

    // Só nos interessa pagamento confirmado
    if (event !== 'PAYMENT_RECEIVED' && event !== 'PAYMENT_CONFIRMED') {
      return res.status(200).json({ received: true }); // Ignora outros eventos
    }

    console.log(`🔔 Webhook Asaas: Pagamento ${payment.id} confirmado! Valor: ${payment.value} | Ref: ${externalRef}`);

    const customerId = payment.customer;
    const value = payment.value;

    // 1. Descobrir qual Plano é baseado no valor
    let newPlan = 'free';
    if (value >= 49.00 && value < 80.00) newPlan = 'shine'; // Shine
    if (value >= 89.00) newPlan = 'glamour'; // Glamour

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
        console.error(`❌ Salão não encontrado para o cliente Asaas: ${customerId}`);
        return res.status(200).json({ ok: true }); // Sempre 200, mesmo se não encontrar
      }
      
      salonRef = doc(db, 'salons', snapshot.docs[0].id);
      salonData = snapshot.docs[0].data();
    }

    // 4. Atualizar o Plano
    await updateDoc(salonRef, {
      plan: newPlan,
      lastPaymentDate: new Date().toISOString(),
      status: 'active'
    });

    console.log(`✅ SUCESSO: Salão "${salonData?.name || salonId}" atualizado para o plano ${newPlan}!`);

    return res.status(200).json({ ok: true });

  } catch (error) {
    // Nunca deixar erro subir - sempre retorna 200
    console.error('❌ Erro Webhook (ignorado):', error);
    return res.status(200).json({ ok: true });
  }
}