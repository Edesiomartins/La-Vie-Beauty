// api/create-checkout.js
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config();

// --- Configuração Firebase (Para salvar o ID do Asaas) ---
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
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });

  const { salonId, name, email, phone, cpfCnpj, planType } = req.body;

  if (!process.env.ASAAS_API_KEY) return res.status(500).json({ error: 'Chave Asaas ausente' });

  // Valores dos Planos
  const PLANS = {
    'shine': { value: 49.90, name: 'Plano Shine (La Vie)' },
    'glamour': { value: 89.90, name: 'Plano Glamour (La Vie)' }
  };
  const selectedPlan = PLANS[planType];
  
  if (!selectedPlan) return res.status(400).json({ error: 'Plano inválido' });
  
  const cleanCpfCnpj = cpfCnpj ? cpfCnpj.replace(/\D/g, '') : null;

  try {
    const ASAAS_URL = 'https://www.asaas.com/api/v3'; 
    const headers = { 'Content-Type': 'application/json', 'access_token': process.env.ASAAS_API_KEY };

    // 1. Cliente Asaas (Busca ou Cria)
    const searchRes = await fetch(`${ASAAS_URL}/customers?email=${email}`, { headers });
    const searchData = await searchRes.json();
    let customerId;

    if (searchData.data && searchData.data.length > 0) {
      customerId = searchData.data[0].id;
      // Atualiza dados
      await fetch(`${ASAAS_URL}/customers/${customerId}`, {
        method: 'POST', headers,
        body: JSON.stringify({ cpfCnpj: cleanCpfCnpj, mobilePhone: phone, name })
      });
    } else {
      const createRes = await fetch(`${ASAAS_URL}/customers`, {
        method: 'POST', headers,
        body: JSON.stringify({ name, email, mobilePhone: phone, cpfCnpj: cleanCpfCnpj })
      });
      const createData = await createRes.json();
      if (createData.errors) throw new Error(createData.errors[0].description);
      customerId = createData.id;
    }

    // 2. VINCULAR NO FIREBASE (Passo Novo e Crucial)
    // Salvamos o ID do Asaas dentro do salão para o Webhook achar depois
    if (salonId) {
        const salonRef = doc(db, 'salons', salonId);
        await updateDoc(salonRef, {
            asaasCustomerId: customerId // <--- O Vínculo Mágico
        });
        console.log(`✅ Salão ${salonId} vinculado ao cliente Asaas ${customerId}`);
    }

    // 3. Criar Assinatura
    const subRes = await fetch(`${ASAAS_URL}/subscriptions`, {
      method: 'POST', headers,
      body: JSON.stringify({
        customer: customerId,
        billingType: 'UNDEFINED',
        value: selectedPlan.value,
        nextDueDate: new Date().toISOString().split('T')[0],
        cycle: 'MONTHLY',
        description: selectedPlan.name
      })
    });

    const subData = await subRes.json();
    if (subData.errors) throw new Error(subData.errors[0].description);

    // 4. Buscar Link
    const paymentsRes = await fetch(`${ASAAS_URL}/subscriptions/${subData.id}/payments`, { headers });
    const paymentsData = await paymentsRes.json();
    const invoiceUrl = paymentsData.data?.[0]?.invoiceUrl || "https://www.asaas.com";

    return res.status(200).json({ paymentUrl: invoiceUrl });

  } catch (error) {
    console.error('Erro Checkout:', error);
    return res.status(500).json({ error: error.message });
  }
}