/**
 * js/home.js
 */
import { getGlamourPartners } from "./firestoreService.js";

const els = {
    grid: document.getElementById("grid"),
    loading: document.getElementById("loading"),
    error: document.getElementById("error"),
    empty: document.getElementById("empty"),
    badge: document.getElementById("countBadge"),
    btnSearch: document.getElementById("btnSearch"),
    btnClear: document.getElementById("btnClear"),
    inputName: document.getElementById("searchName"),
    inputCity: document.getElementById("searchCity")
};

let allPartners = [];

// Função para pegar imagem (Foto do Firestore OU Placeholder bonito)
function getCardImage(partner, index) {
    if (partner.fotoCapa && partner.fotoCapa.length > 5) {
        return partner.fotoCapa;
    }
    // Palavras-chave para variar as imagens placeholder
    const types = ["salon", "makeup", "haircut", "nails", "spa", "beauty"];
    const keyword = types[index % types.length];
    // Usa Unsplash com assinatura para garantir imagens diferentes
    return `https://source.unsplash.com/600x400/?${keyword}&sig=${index}`;
}

function renderCard(item, index) {
    const imgUrl = getCardImage(item, index);
    const nome = item.nome || "Salão Parceiro";
    const cidade = item.cidade || "Localização não informada";
    const categoria = item.categoria || "Beleza e Estética";
    const id = item.id;

    return `
    <article class="salon-card group">
        <div class="img-container">
            <img src="${imgUrl}" alt="${nome}" loading="lazy" />
            <div class="absolute top-3 right-3 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-rose-600 shadow-sm uppercase tracking-wider">
                ✨ Glamour
            </div>
        </div>
        
        <div class="p-6">
            <div class="mb-3">
                <span class="text-xs font-bold text-slate-400 uppercase tracking-wide">${categoria}</span>
                <h3 class="text-xl font-serif font-bold text-slate-900 group-hover:text-rose-600 transition-colors truncate">${nome}</h3>
            </div>
            
            <div class="flex items-center text-slate-500 text-sm mb-6">
                <i class="ph-fill ph-map-pin text-rose-400 mr-2"></i>
                <span class="truncate">${cidade}</span>
            </div>

            <a href="/pages/salao.php?id=${id}" class="block w-full text-center py-3 rounded-xl border border-rose-200 text-rose-700 font-bold hover:bg-rose-600 hover:text-white transition-all">
                Ver Detalhes
            </a>
        </div>
    </article>
    `;
}

function render(list) {
    els.grid.innerHTML = list.map((item, i) => renderCard(item, i)).join("");
    els.badge.textContent = `${list.length} encontrados`;
}

function filter() {
    const nameVal = els.inputName.value.toLowerCase();
    const cityVal = els.inputCity.value.toLowerCase();

    const filtered = allPartners.filter(p => {
        const n = (p.nome || "").toLowerCase();
        const c = (p.cidade || "").toLowerCase();
        return n.includes(nameVal) && c.includes(cityVal);
    });

    if (filtered.length === 0) {
        els.grid.innerHTML = "";
        els.empty.classList.remove("hidden");
    } else {
        els.empty.classList.add("hidden");
        render(filtered);
    }
    
    // Mostra botão limpar se tiver busca
    if(nameVal || cityVal) els.btnClear.classList.remove("hidden");
    else els.btnClear.classList.add("hidden");
}

async function init() {
    try {
        allPartners = await getGlamourPartners();
        els.loading.classList.add("hidden");

        if (!allPartners.length) {
            els.empty.classList.remove("hidden");
            els.badge.textContent = "0 encontrados";
            return;
        }

        render(allPartners);

    } catch (err) {
        els.loading.classList.add("hidden");
        els.error.textContent = "Erro ao carregar vitrine: " + err.message;
        els.error.classList.remove("hidden");
    }
}

// Eventos
els.btnSearch.addEventListener("click", filter);
els.btnClear.addEventListener("click", () => {
    els.inputName.value = "";
    els.inputCity.value = "";
    filter();
});
els.inputName.addEventListener("keyup", (e) => e.key === "Enter" && filter());
els.inputCity.addEventListener("keyup", (e) => e.key === "Enter" && filter());

init();