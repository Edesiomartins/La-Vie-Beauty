// uploadServices.js
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, writeBatch } from 'firebase/firestore';

// --- CONFIGURAÇÃO (Usando suas chaves reais direto aqui) ---
const firebaseConfig = {
  apiKey: "AIzaSyDRA7NAyVY6Su6fWPFw9zju0XjeV8d92Q8",
  authDomain: "la-vie---coiffeur.firebaseapp.com",
  projectId: "la-vie---coiffeur",
  storageBucket: "la-vie---coiffeur.firebasestorage.app",
  messagingSenderId: "359423432028",
  appId: "1:359423432028:web:9566575a6a995759a55d99",
  measurementId: "G-4WWSHD9HV9"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- SUA LISTA DE SERVIÇOS ---
const servicesData = [
  // --- CABELOS ---
  {
    id: "cabelo_corte_feminino",
    category: "Cabelos",
    name: "Corte Feminino",
    description: "Corte feminino com técnicas de visagismo e finalização.",
    duration_minutes: 45,
    price: 80,
    tags: ["corte", "feminino"]
  },
  {
    id: "cabelo_corte_masculino",
    category: "Cabelos",
    name: "Corte Masculino",
    description: "Corte masculino moderno com tesoura e máquina.",
    duration_minutes: 30,
    price: 50,
    tags: ["corte", "masculino"]
  },
  {
    id: "cabelo_escova_simples",
    category: "Cabelos",
    name: "Escova Simples",
    description: "Escova rápida com finalização lisa.",
    duration_minutes: 40,
    price: 50,
    tags: ["escova"]
  },
  {
    id: "cabelo_hidratacao_profunda",
    category: "Cabelos",
    name: "Hidratação Profunda",
    description: "Tratamento intensivo com máscaras profissionais.",
    duration_minutes: 45,
    price: 90,
    tags: ["hidratação", "profunda"]
  },
  {
    id: "cabelo_mechas_tradicionais",
    category: "Cabelos",
    name: "Mechas Tradicionais",
    description: "Clareamento com papel alumínio.",
    duration_minutes: 160,
    price: 350,
    tags: ["mechas"]
  },
  {
    id: "cabelo_coloracao_global",
    category: "Cabelos",
    name: "Coloração Global",
    description: "Aplicação de cor em toda a extensão dos fios.",
    duration_minutes: 90,
    price: 160,
    tags: ["coloração"]
  },
  
  // --- MAQUIAGEM ---
  {
    id: "maquiagem_social",
    category: "Maquiagem",
    name: "Maquiagem Social",
    description: "Maquiagem profissional para festas e eventos.",
    duration_minutes: 60,
    price: 150,
    tags: ["maquiagem", "social"]
  },
  {
    id: "maquiagem_noiva",
    category: "Maquiagem",
    name: "Maquiagem de Noiva",
    description: "Pacote premium com preparação especial.",
    duration_minutes: 120,
    price: 600,
    tags: ["maquiagem", "noiva"]
  },

  // --- UNHAS ---
  {
    id: "unhas_manicure",
    category: "Unhas",
    name: "Manicure",
    description: "Corte, lixamento e esmaltação das mãos.",
    duration_minutes: 40,
    price: 30,
    tags: ["unhas", "manicure"]
  },
  {
    id: "unhas_pedicure",
    category: "Unhas",
    name: "Pedicure",
    description: "Cuidados completos com os pés e esmaltação.",
    duration_minutes: 45,
    price: 35,
    tags: ["unhas", "pedicure"]
  },
  {
    id: "unhas_alongamento_gel",
    category: "Unhas",
    name: "Alongamento em Gel",
    description: "Alongamento profissional com gel UV.",
    duration_minutes: 120,
    price: 120,
    tags: ["unhas", "alongamento"]
  },

  // --- SOBRANCELHAS ---
  {
    id: "sobrancelhas_design",
    category: "Estética Facial",
    name: "Design de Sobrancelhas",
    description: "Design personalizado das sobrancelhas.",
    duration_minutes: 30,
    price: 35,
    tags: ["sobrancelha", "design"]
  },
  {
    id: "sobrancelhas_design & Buço",
    category: "Estética Facial",
    name: "Design de Sobrancelhas & Buço",
    description: "Design personalizado das sobrancelhas e buço.",
    duration_minutes: 30,
    price: 35,
    tags: ["sobrancelha", "design", "buço"]
  },
  {
    id: "sobrancelhas_henna",
    category: "Estética Facial",
    name: "Sobrancelha com Henna",
    description: "Pigmentação temporária com henna profissional.",
    duration_minutes: 40,
    price: 45,
    tags: ["sobrancelha", "henna"]
  },

  // --- ESTÉTICA FACIAL ---
  {
    id: "estetica_limpeza_pele_profunda",
    category: "Estética Facial",
    name: "Limpeza de Pele Profunda",
    description: "Extração completa e hidratação profunda.",
    duration_minutes: 90,
    price: 160,
    tags: ["limpeza", "profunda"]
  },
  {
    id: "estetica_jato_de_plasma",
    category: "Estética Facial",
    name: "Jato de Plasma",
    description: "Extração completa de verrugas manchas e rejuvenescimento da pele.",
    duration_minutes: 90,
    price: 160,
    tags: ["jato", "plasma"]
  },
  {
    id: "estetica_microagulhamento",
    category: "Estética Facial",
    name: "Microagulhamento",
    description: "Estimulação de colágeno com roller.",
    duration_minutes: 90,
    price: 300,
    tags: ["microagulhamento"]
  },

  // --- DEPILAÇÃO ---
  {
    id: "depilacao_virilha_completa",
    category: "Depilação",
    name: "Virilha Completa",
    description: "Depilação completa com cera.",
    duration_minutes: 30,
    price: 50,
    tags: ["virilha", "completa"]
  },
  {
    id: "depilacao_laser_axila",
    category: "Depilação",
    name: "Depilação a Laser – Axila",
    description: "Sessão de laser para axilas.",
    duration_minutes: 15,
    price: 80,
    tags: ["laser", "axila"]
  },

  // --- ESTÉTICA CORPORAL ---
  {
    id: "corporal_massagem_relaxante",
    category: "Estética Corporal",
    name: "Massagem Relaxante",
    description: "Massagem com movimentos suaves para relaxamento.",
    duration_minutes: 60,
    price: 150,
    tags: ["massagem", "relaxante"]
  },
  {
    id: "corporal_drenagem_linfatica",
    category: "Estética Corporal",
    name: "Drenagem Linfática",
    description: "Técnica manual para eliminar líquidos.",
    duration_minutes: 60,
    price: 160,
    tags: ["drenagem"]
  },

  // --- PREMIUM ---
  {
    id: "premium_dia_de_foto",
    category: "Premium",
    name: "Day Photo Beauty",
    description: "Preparação completa para ensaios fotográficos.",
    duration_minutes: 180,
    price: 600,
    tags: ["foto", "produção"]
  }
];

async function uploadData() {
  console.log(`🚀 Iniciando upload de ${servicesData.length} serviços...`);
  
  const batch = writeBatch(db);
  let count = 0;

  for (const service of servicesData) {
    const docRef = doc(db, "services", service.id);
    
    // Preparando os dados (Name, Price, Category)
    const servicePayload = {
        name: service.name,                
        description: service.description,  
        price: service.price,              
        duration_minutes: service.duration_minutes, 
        category: service.category,        
        tags: service.tags
    };

    batch.set(docRef, servicePayload);
    count++;
  }

  try {
    await batch.commit();
    console.log(`✅ Sucesso! ${count} serviços enviados para o Firebase.`);
  } catch (error) {
    console.error("❌ Erro ao salvar:", error);
  }
}

uploadData();