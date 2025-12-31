// api/recover-salon-data.js
// Script de emergência para verificar e recuperar dados de salão
// USO: node api/recover-salon-data.js <salonId>

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, collection, getDocs } from 'firebase/firestore';
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

async function recoverSalonData(salonId) {
  console.log(`\n🔍 Verificando salão: ${salonId}\n`);
  
  try {
    // 1. Verificar dados principais do salão
    const salonRef = doc(db, 'salons', salonId);
    const salonSnap = await getDoc(salonRef);
    
    if (!salonSnap.exists()) {
      console.log(`❌ Salão ${salonId} NÃO EXISTE no Firebase!`);
      return;
    }
    
    const salonData = salonSnap.data();
    console.log('📋 DADOS DO SALÃO:');
    console.log(JSON.stringify(salonData, null, 2));
    
    // 2. Verificar clientes
    console.log('\n👥 CLIENTES:');
    const clientsRef = collection(db, 'salons', salonId, 'clients');
    const clientsSnap = await getDocs(clientsRef);
    console.log(`   Total: ${clientsSnap.size}`);
    clientsSnap.forEach((doc) => {
      console.log(`   - ${doc.id}: ${doc.data().name || 'Sem nome'} (${doc.data().phone || 'Sem telefone'})`);
    });
    
    // 3. Verificar colaboradores
    console.log('\n👨‍💼 COLABORADORES:');
    const collabsRef = collection(db, 'salons', salonId, 'collaborators');
    const collabsSnap = await getDocs(collabsRef);
    console.log(`   Total: ${collabsSnap.size}`);
    collabsSnap.forEach((doc) => {
      console.log(`   - ${doc.id}: ${doc.data().name || 'Sem nome'} (${doc.data().phone || 'Sem telefone'})`);
    });
    
    // 4. Verificar agendamentos
    console.log('\n📅 AGENDAMENTOS:');
    const appointmentsRef = collection(db, 'salons', salonId, 'appointments');
    const appointmentsSnap = await getDocs(appointmentsRef);
    console.log(`   Total: ${appointmentsSnap.size}`);
    appointmentsSnap.forEach((doc) => {
      const appt = doc.data();
      console.log(`   - ${doc.id}: ${appt.clientName || 'Sem nome'} - ${appt.date || 'Sem data'} ${appt.time || ''}`);
    });
    
    // 5. Verificar serviços
    console.log('\n💇 SERVIÇOS:');
    const servicesRef = collection(db, 'salons', salonId, 'services');
    const servicesSnap = await getDocs(servicesRef);
    console.log(`   Total: ${servicesSnap.size}`);
    servicesSnap.forEach((doc) => {
      const service = doc.data();
      console.log(`   - ${doc.id}: ${service.name || service.nome || 'Sem nome'}`);
    });
    
    console.log('\n✅ Verificação completa!\n');
    
  } catch (error) {
    console.error('❌ Erro ao verificar salão:', error);
  }
}

// Executar
const salonId = process.argv[2];
if (!salonId) {
  console.log('❌ Uso: node api/recover-salon-data.js <salonId>');
  console.log('   Exemplo: node api/recover-salon-data.js abc123');
  process.exit(1);
}

recoverSalonData(salonId);
