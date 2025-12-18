/**
 * js/home.js
 * Renderiza os cards com layout moderno.
 */
import { getGlamourPartners } from "./firestoreService.js";

const elLoading = document.getElementById("loading");
const elError = document.getElementById("error");
const elEmpty = document.getElementById("empty");
const elGrid = document.getElementById("grid");
const elCountBadge = document.getElementById("countBadge");

const inputs = {
  name: document.getElementById("searchName"),
  city: document.getElementById("searchCity")
};
const btns = {
  search: document.getElementById("btnSearch"),
  clear: document.getElementById("btnClear")
};

let allItems = [];

// Helper para pegar imagem (real ou placeholder bonito)
function getCoverImage(item, index) {
  if (item.fotoCapa) return item.fotoCapa;
  
  // Keywords para variar as imagens placeholder
  const keywords = ["salon", "makeup", "hairstyle", "nails", "spa", "barber"];
  const key = keywords[index % keywords.length];
  // Unsplash Source aleatório mas consistente por reload
  return `https://source.unsplash.com/600x400/?${key},beauty&sig=${index}`;
}

function cardTemplate(item, index) {
  const nome = item.nome || "Parceiro La Vie";
  const cidade = item.cidade || "Localização não informada";
  const categoria = item.categoria || "Beleza";
  
  const imgUrl = getCoverImage(item, index);
  const link = `/pages/salao.php?id=${item.id}`;

  return `
    <article class="salon-card group">
      <div class="card-image-wrap">
        <img src="${imgUrl}" alt="${nome}" class="card-image" loading="lazy" />
        <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60"></div>
        <span class="card-badge">✨ Glamour</span>
      </div>
      
      <div class="card-body">
        <div class="flex justify-between items-start">
          <div>
            <span class="text-xs font-bold text-rose-500 uppercase tracking-wide mb-1 block">${categoria}</span>
            <h3 class="card-title group-hover:text-rose-600 transition-colors">${nome}</h3>
          </div>
        </div>
        
        <div class="mt-auto pt-4 space-y-2">
          <p class="card-info">
            <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
            ${cidade}
          </p>
          
          <a href="${link}" class="mt-4 w-full btn-outline text-center justify-center group-hover:bg-rose-600 group-hover:border-rose-600 group-hover:text-white">
            Ver Perfil
          </a>
        </div>
      </div>
    </article>
  `;
}

function render(list) {
  elGrid.innerHTML = list.map((item, i) => cardTemplate(item, i)).join("");
  elCountBadge.textContent = `${list.length} encontrados`;
}

function filter() {
  const termName = inputs.name.value.toLowerCase();
  const termCity = inputs.city.value.toLowerCase();

  const filtered = allItems.filter(i => {
    const n = (i.nome || "").toLowerCase();
    const c = (i.cidade || "").toLowerCase();
    return n.includes(termName) && c.includes(termCity);
  });

  filtered.length ? elEmpty.classList.add("hidden") : elEmpty.classList.remove("hidden");
  render(filtered);
}

// Inicialização
(async () => {
  try {
    allItems = await getGlamourPartners();
    elLoading.classList.add("hidden");
    
    if(!allItems.length) {
      elEmpty.classList.remove("hidden");
      elCountBadge.textContent = "0";
      return;
    }
    
    render(allItems);
  } catch (err) {
    elLoading.classList.add("hidden");
    elError.textContent = "Erro ao carregar: " + err.message;
    elError.classList.remove("hidden");
  }
})();

// Event Listeners
btns.search.addEventListener("click", filter);
btns.clear.addEventListener("click", () => {
  inputs.name.value = "";
  inputs.city.value = "";
  filter();
});
Object.values(inputs).forEach(el => el.addEventListener("keyup", (e) => {
  if(e.key === "Enter") filter();
}));