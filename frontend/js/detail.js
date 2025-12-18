/**
 * js/detail.js
 */
import { getPartnerById } from "./firestoreService.js";
import { APP_LINK_DEFAULT } from "./firebaseConfig.js";

const ui = {
  loading: document.getElementById("loading"),
  error: document.getElementById("error"),
  content: document.getElementById("content"),
  cover: document.getElementById("heroCover"),
  avatarEmoji: document.getElementById("avatarEmoji"),
  
  nome: document.getElementById("nome"),
  categoria: document.getElementById("categoria"),
  cidade: document.getElementById("cidade"),
  descricao: document.getElementById("descricao"),
  endereco: document.getElementById("endereco"),
  telefone: document.getElementById("telefone"),
  plano: document.getElementById("plano"),
  
  btnApp: document.getElementById("btnApp"),
  btnWhats: document.getElementById("btnWhats"),
  btnMaps: document.getElementById("btnMaps")
};

function safe(val) { return (val || "").toString().trim(); }

function setCover(categoria) {
  // Define uma imagem de capa baseada na categoria se não houver foto específica
  let term = "beauty,salon";
  const c = safe(categoria).toLowerCase();
  if(c.includes("nail") || c.includes("unha")) term = "nails";
  if(c.includes("barb")) term = "barbershop";
  if(c.includes("estet")) term = "spa";
  
  // Usando Unsplash Source
  const url = `https://source.unsplash.com/1600x900/?${term}`;
  ui.cover.style.backgroundImage = `url('${url}')`;
}

async function init() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  if (!id) {
    ui.loading.classList.add("hidden");
    ui.error.textContent = "ID não especificado.";
    ui.error.classList.remove("hidden");
    return;
  }

  try {
    const item = await getPartnerById(id);
    ui.loading.classList.add("hidden");

    if (!item) {
      ui.error.textContent = "Parceiro não encontrado.";
      ui.error.classList.remove("hidden");
      return;
    }

    // Preenche UI
    ui.nome.textContent = safe(item.nome);
    ui.categoria.textContent = safe(item.categoria) || "Parceiro";
    ui.cidade.textContent = safe(item.cidade) || "-";
    ui.descricao.textContent = safe(item.descricao) || "Sem descrição disponível.";
    ui.endereco.textContent = safe(item.endereco) || "Endereço não informado";
    ui.telefone.textContent = safe(item.telefone) || "-";
    ui.plano.textContent = safe(item.plano) || "Glamour";

    // Avatar Emoji Lógica
    const cat = safe(item.categoria).toLowerCase();
    ui.avatarEmoji.textContent = cat.includes("cabel") ? "💇‍♀️" : (cat.includes("unha") ? "💅" : "✨");

    // Imagem Capa
    if (item.fotoCapa) {
        ui.cover.style.backgroundImage = `url('${item.fotoCapa}')`;
    } else {
        setCover(item.categoria);
    }

    // Botões
    const appLink = safe(item.appLink) || APP_LINK_DEFAULT; // Certifique-se que essa var existe no config ou string fixa
    ui.btnApp.href = appLink;
    
    // Zap
    const phoneClean = safe(item.telefone).replace(/\D/g, "");
    if(phoneClean) {
       ui.btnWhats.href = `https://wa.me/55${phoneClean}`;
    } else {
       ui.btnWhats.classList.add("hidden");
    }

    // Maps
    const query = encodeURIComponent(`${safe(item.endereco)} ${safe(item.cidade)}`);
    ui.btnMaps.href = `https://www.google.com/maps/search/?api=1&query=${query}`;

    ui.content.classList.remove("hidden");

  } catch (err) {
    ui.loading.classList.add("hidden");
    ui.error.textContent = "Erro: " + err.message;
    ui.error.classList.remove("hidden");
  }
}

init();