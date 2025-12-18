/**
 * firestoreService.js
 * Centraliza toda comunicação com o Firestore.
 * Usamos Firebase Web SDK (módulos) para facilitar.
 *
 * Também inclui um exemplo com "fetch" via API REST do Firestore (opcional).
 */

import { firebaseConfig } from "./firebaseConfig.js";

// Firebase v10+ (modular)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

// Inicializa Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/**
 * Ajuste o nome da coleção para bater com o seu Firestore.
 * Exemplos: "saloes", "profissionais", "parceiros"
 */
const COLLECTION_NAME = "parceiros";

/**
 * Busca todos os parceiros com plano glamour ativo.
 * Você pode adaptar os campos conforme seu modelo.
 *
 * Campos esperados (exemplo):
 * - nome
 * - endereco
 * - cidade
 * - telefone
 * - plano (string: "glamour")
 * - planoAtivo (boolean)
 * - categoria ("Salao" / "Profissional")
 * - descricao
 * - appLink (opcional)
 */
export async function getGlamourPartners() {
  // Query: plano == "glamour" e planoAtivo == true
  const q = query(
    collection(db, COLLECTION_NAME),
    where("plano", "==", "glamour"),
    where("planoAtivo", "==", true)
  );

  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/**
 * Busca um parceiro por ID do documento.
 */
export async function getPartnerById(id) {
  const ref = doc(db, COLLECTION_NAME, id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

/**
 * ✅ EXTRA: Exemplo de "fetch" (REST API do Firestore)
 * Útil para você entender o formato. Só funciona se suas regras permitirem leitura
 * e se você montar o endpoint certo.
 *
 * OBS: A API REST do Firestore pode exigir autenticação dependendo das regras.
 */
export async function fetchGlamourPartnersREST() {
  const projectId = firebaseConfig.projectId;
  const apiKey = firebaseConfig.apiKey;

  // Endpoint REST para listar docs da coleção
  const url =
    `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${COLLECTION_NAME}?key=${apiKey}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error("Falha no fetch REST do Firestore");

  const data = await res.json();

  // Converte estrutura REST (fields) para objeto simples
  const docs = (data.documents || []).map(docu => {
    const nameParts = docu.name.split("/");
    const id = nameParts[nameParts.length - 1];
    const fields = docu.fields || {};

    // Helper para ler tipos (stringValue, booleanValue etc.)
    const read = (f) => {
      if (!f) return null;
      if ("stringValue" in f) return f.stringValue;
      if ("booleanValue" in f) return f.booleanValue;
      if ("integerValue" in f) return Number(f.integerValue);
      if ("doubleValue" in f) return Number(f.doubleValue);
      return null;
    };

    return {
      id,
      nome: read(fields.nome),
      endereco: read(fields.endereco),
      cidade: read(fields.cidade),
      telefone: read(fields.telefone),
      plano: read(fields.plano),
      planoAtivo: read(fields.planoAtivo),
      categoria: read(fields.categoria),
      descricao: read(fields.descricao),
      appLink: read(fields.appLink)
    };
  });

  // Filtra glamour ativo no front (caso seu endpoint retorne tudo)
  return docs.filter(d => d.plano === "glamour" && d.planoAtivo === true);
}
