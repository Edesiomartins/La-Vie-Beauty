// api/create-checkout.js
import dotenv from 'dotenv';

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
    return res.status(500).json({ error: 'Chave Asaas não configurada' });
  }

  // DEFINIÇÃO DOS VALORES (R$)
  const PLANS = {
    'shine': { value: 49.90, name: 'Plano Shine (La Vie)' },
    'glamour': { value: 89.90, name: 'Plano Glamour (La Vie)' }
  };

  const selectedPlan = PLANS[planType];
  if (!selectedPlan) return res.status(400).json({ error: 'Plano inválido' });

  try {
    const ASAAS_URL = 'https://www.asaas.com/api/v3'; // Use 'https://sandbox.asaas.com/api/v3' se for chave de teste
    const headers = {
      'Content-Type': 'application/json',
      'access_token': process.env.ASAAS_API_KEY
    };

    // 1. Criar ou Recuperar Cliente no Asaas
    // Primeiro buscamos se já existe pelo email
    const searchRes = await fetch(`${ASAAS_URL}/customers?email=${email}`, { headers });
    const searchData = await searchRes.json();
    
    let customerId;

    if (searchData.data && searchData.data.length > 0) {
      customerId = searchData.data[0].id;
    } else {
      // Cria novo cliente
      const createRes = await fetch(`${ASAAS_URL}/customers`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name,
          email,
          mobilePhone: phone,
          cpfCnpj: cpfCnpj || undefined // Opcional se não tiver
        })
      });
      const createData = await createRes.json();
      customerId = createData.id;
    }

    if (!customerId) throw new Error("Falha ao criar cliente no Asaas");

    // 2. Criar a Assinatura (Cobrança Recorrente)
    const subRes = await fetch(`${ASAAS_URL}/subscriptions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        customer: customerId,
        billingType: 'UNDEFINED', // Deixa o cliente escolher (Pix, Cartão, Boleto)
        value: selectedPlan.value,
        nextDueDate: new Date().toISOString().split('T')[0], // Cobra hoje
        cycle: 'MONTHLY',
        description: selectedPlan.name
      })
    });

    const subData = await subRes.json();

    if (subData.errors) {
      console.error("Erro Asaas:", subData.errors);
      throw new Error(subData.errors[0].description);
    }

    // Retorna o link para o usuário pagar
    return res.status(200).json({ 
      paymentUrl: subData.invoiceUrl, // Link direto para o pagamento
      subscriptionId: subData.id 
    });

  } catch (error) {
    console.error('Erro Checkout:', error);
    return res.status(500).json({ error: error.message });
  }
}