// api/create-checkout.js

import dotenv from 'dotenv';

// Tenta carregar localmente se existir, mas na Vercel usa as Vars de Ambiente

dotenv.config({ path: '.env.local' });

dotenv.config();

export default async function handler(req, res) {

  // CORS

  res.setHeader('Access-Control-Allow-Origin', '*');

  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });

  const { name, email, phone, cpfCnpj, planType } = req.body;

  if (!process.env.ASAAS_API_KEY) {

    return res.status(500).json({ error: 'Chave Asaas não configurada na Vercel' });

  }

  // DEFINIÇÃO DOS VALORES (R$)

  const PLANS = {

    'shine': { value: 49.90, name: 'Plano Shine (La Vie)' },

    'glamour': { value: 89.90, name: 'Plano Glamour (La Vie)' }

  };

  const selectedPlan = PLANS[planType];

  if (!selectedPlan) return res.status(400).json({ error: 'Plano inválido' });

  // Limpa caracteres especiais do CPF para enviar só números

  const cleanCpfCnpj = cpfCnpj ? cpfCnpj.replace(/\D/g, '') : null;

  if (!cleanCpfCnpj) {

      return res.status(400).json({ error: 'CPF/CNPJ é obrigatório' });

  }

  try {

    const ASAAS_URL = 'https://www.asaas.com/api/v3'; 

    const headers = {

      'Content-Type': 'application/json',

      'access_token': process.env.ASAAS_API_KEY

    };

    // 1. Verificar se o cliente já existe

    const searchRes = await fetch(`${ASAAS_URL}/customers?email=${encodeURIComponent(email)}`, { headers });

    const searchData = await searchRes.json();

    

    let customerId;

    if (searchData.data && searchData.data.length > 0) {

      // --- CENÁRIO A: Cliente já existe ---

      customerId = searchData.data[0].id;

      console.log(`Cliente encontrado (${customerId}). Atualizando CPF...`);

      // CORREÇÃO CRUCIAL: Atualiza o cadastro existente com o CPF novo

      const updateRes = await fetch(`${ASAAS_URL}/customers/${customerId}`, {

        method: 'POST', // No Asaas, update é POST na rota do ID

        headers,

        body: JSON.stringify({

            cpfCnpj: cleanCpfCnpj,

            mobilePhone: phone,

            name: name // Atualiza nome também caso tenha mudado

        })

      });

      

      if (!updateRes.ok) {

          const updateErr = await updateRes.json();

          console.error("Erro ao atualizar cliente:", updateErr);

          // Não paramos aqui, tentamos criar a assinatura mesmo assim, 

          // mas o log acima vai ajudar se der erro de novo.

      }

    } else {

      // --- CENÁRIO B: Cliente novo ---

      console.log("Cliente novo. Criando...");

      const createRes = await fetch(`${ASAAS_URL}/customers`, {

        method: 'POST',

        headers,

        body: JSON.stringify({

          name,

          email,

          mobilePhone: phone,

          cpfCnpj: cleanCpfCnpj

        })

      });

      const createData = await createRes.json();

      

      if (createData.errors) {

          throw new Error(createData.errors[0].description);

      }

      

      customerId = createData.id;

    }

    if (!customerId) throw new Error("Falha ao obter ID do cliente no Asaas");

    // 2. Criar a Assinatura

    const subRes = await fetch(`${ASAAS_URL}/subscriptions`, {

      method: 'POST',

      headers,

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

    if (subData.errors) {

      console.error("Erro Asaas Subscription:", subData.errors);

      throw new Error(subData.errors[0].description);

    }

    return res.status(200).json({ 

      paymentUrl: subData.invoiceUrl, 

      subscriptionId: subData.id 

    });

  } catch (error) {

    console.error('Erro Checkout:', error);

    return res.status(500).json({ error: error.message });

  }

}
