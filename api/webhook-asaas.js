// api/webhook-asaas.js
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
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
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });

  const { event, payment } = req.body;

  // Só nos interessa pagamento confirmado
  if (event !== 'PAYMENT_RECEIVED' && event !== 'PAYMENT_CONFIRMED') {
      return res.status(200).json({ received: true }); // Ignora outros eventos
  }

  console.log(`🔔 Webhook Asaas: Pagamento ${payment.id} confirmado! Valor: ${payment.value}`);

  try {
    const customerId = payment.customer;
    const value = payment.value;

    // 1. Descobrir qual Plano é baseado no valor
    let newPlan = 'free';
    if (value >= 49.00 && value < 80.00) newPlan = 'pro'; // Shine
    if (value >= 89.00) newPlan = 'premium'; // Glamour

    // 2. Achar o Salão no Firebase pelo ID do Asaas
    const salonsRef = collection(db, 'salons');
    const q = query(salonsRef, where('asaasCustomerId', '==', customerId));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
        console.error(`❌ Salão não encontrado para o cliente Asaas: ${customerId}`);
        return res.status(404).json({ error: 'Salon not found' });
    }

    // 3. Atualizar o Plano
    const salonDoc = snapshot.docs[0];
    const salonRef = doc(db, 'salons', salonDoc.id);

    await updateDoc(salonRef, {
        plan: newPlan,
        lastPaymentDate: new Date().toISOString(),
        status: 'active'
    });

    console.log(`✅ SUCESSO: Salão "${salonDoc.data().name}" atualizado para o plano ${newPlan}!`);

    return res.status(200).json({ success: true });

  } catch (error) {
    console.error('Erro Webhook:', error);
    return res.status(500).json({ error: error.message });
  }
}