import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Suas chaves reais do projeto "La Vie Coiffeur"
const firebaseConfig = {
  apiKey: "AIzaSyDRA7NAyVY6Su6fWPFw9zju0XjeV8d92Q8",
  authDomain: "la-vie---coiffeur.firebaseapp.com",
  projectId: "la-vie---coiffeur",
  storageBucket: "la-vie---coiffeur.firebasestorage.app",
  messagingSenderId: "359423432028",
  appId: "1:359423432028:web:9566575a6a995759a55d99",
  measurementId: "G-4WWSHD9HV9"
};

// 1. Inicializa o App
const app = initializeApp(firebaseConfig);

// 2. Inicializa o Banco de Dados (Firestore) e exporta para usar no App.jsx
export const db = getFirestore(app);