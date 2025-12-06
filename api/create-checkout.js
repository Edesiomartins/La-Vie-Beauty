// api/create-checkout.js

import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

dotenv.config();

export default async function handler(req, res) {

  res.setHeader('Access-Control-Allow-Origin', '*');

  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });

  const { name, email, phone, cpfCnpj, planType } = req.body;

  if (!process.env.ASAAS_API_KEY) return res.status(500).json({ error: 'Chave Asaas não configurada' });

  const PLANS = {

    'shine': { value: 49.90, name: 'Plano Shine (La Vie)' },

    'glamour': { value: 89.90, name: 'Plano Glamour (La Vie)' }

  };

  const selectedPlan = PLANS[planType];

  if (!selectedPlan) return res.status(400).json({ error: 'Plano inválido' });

  const cleanCpfCnpj = cpfCnpj ? cpfCnpj.replace(/\D/g, '') : null;

  if (!cleanCpfCnpj) return res.status(400).json({ error: 'CPF/CNPJ é obrigatório' });

  try {

    const ASAAS_URL = 'https://www.asaas.com/api/v3'; 

    const headers = { 'Content-Type': 'application/json', 'access_token': process.env.ASAAS_API_KEY };

    // 1. Cliente (Busca ou Cria)

    const searchRes = await fetch(`${ASAAS_URL}/customers?email=${encodeURIComponent(email)}`, { headers });

    const searchData = await searchRes.json();

    let customerId;

    if (searchData.data && searchData.data.length > 0) {

      customerId = searchData.data[0].id;

      // Atualiza CPF do cliente existente

      await fetch(`${ASAAS_URL}/customers/${customerId}`, {

        method: 'POST',

        headers,

        body: JSON.stringify({ cpfCnpj: cleanCpfCnpj, mobilePhone: phone, name })

      });

    } else {

      const createRes = await fetch(`${ASAAS_URL}/customers`, {

        method: 'POST',

        headers,

        body: JSON.stringify({ name, email, mobilePhone: phone, cpfCnpj: cleanCpfCnpj })

      });

      const createData = await createRes.json();

      if (createData.errors) throw new Error(createData.errors[0].description);

      customerId = createData.id;

    }

    // 2. Criar a Assinatura

    const subRes = await fetch(`${ASAAS_URL}/subscriptions`, {

      method: 'POST',

      headers,

      body: JSON.stringify({

        customer: customerId,

        billingType: 'UNDEFINED', // <--- ISSO LIBERA: CARTÃO, PIX E BOLETO

        value: selectedPlan.value,

        nextDueDate: new Date().toISOString().split('T')[0],

        cycle: 'MONTHLY',

        description: selectedPlan.name

      })

    });

    const subData = await subRes.json();

    if (subData.errors) throw new Error(subData.errors[0].description);

    // 3. BUSCAR O LINK DE PAGAMENTO

    // A assinatura cria cobranças. Buscamos a primeira para pegar o link visual.

    const paymentsRes = await fetch(`${ASAAS_URL}/subscriptions/${subData.id}/payments`, { headers });

    const paymentsData = await paymentsRes.json();

    let invoiceUrl = null;

    if (paymentsData.data && paymentsData.data.length > 0) {

        invoiceUrl = paymentsData.data[0].invoiceUrl;

    }

    // Retorno final

    return res.status(200).json({ 

      paymentUrl: invoiceUrl || "https://www.asaas.com", 

      subscriptionId: subData.id 

    });

  } catch (error) {

    console.error('Erro Checkout:', error.message);

    return res.status(500).json({ error: error.message });

  }

}
