// api/get-webhook-logs.js
// Endpoint para visualizar logs do webhook (já que Vercel free não mantém logs)
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, orderBy, limit, getDocs, where } from 'firebase/firestore';
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
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const { salonId, limit: limitParam = 50, type } = req.query;

    const logsRef = collection(db, 'webhook_logs');
    let q = query(logsRef, orderBy('createdAt', 'desc'), limit(parseInt(limitParam)));

    // Filtrar por salonId se fornecido
    if (salonId) {
      q = query(logsRef, where('salonId', '==', salonId), orderBy('createdAt', 'desc'), limit(parseInt(limitParam)));
    }

    // Filtrar por tipo se fornecido
    if (type) {
      q = query(logsRef, where('type', '==', type), orderBy('createdAt', 'desc'), limit(parseInt(limitParam)));
    }

    const snapshot = await getDocs(q);
    const logs = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate?.()?.toISOString() || doc.data().createdAt
    }));

    return res.status(200).json({
      success: true,
      count: logs.length,
      logs: logs
    });

  } catch (error) {
    console.error('Erro ao buscar logs:', error);
    return res.status(500).json({ 
      error: 'Erro ao buscar logs',
      message: error.message 
    });
  }
}
