import { getGlamourSalons } from "./firestore.js";

const grid = document.querySelector(".salon-grid");
const input = document.querySelector(".search-box input");

let salons = [];

function render(list) {
  grid.innerHTML = list.map(s => `
    <a href="/pages/detalhes.php?id=${s.id}" class="salon-card">
      <div class="card-img" style="background-image:url('${s.image || 'https://source.unsplash.com/600x400/?salon'}')">
        <div class="rating">✨ Glamour</div>
      </div>
      <div class="card-body">
        <h3>${s.name}</h3>
        <p>📍 ${s.city}</p>
        <p>📞 ${s.phone || '-'}</p>
        <span class="tag">Plano Glamour</span>
      </div>
    </a>
  `).join("");
}

input.addEventListener("input", () => {
  const q = input.value.toLowerCase();
  render(salons.filter(s =>
    s.name.toLowerCase().includes(q) ||
    s.city.toLowerCase().includes(q)
  ));
});

(async () => {
  salons = await getGlamourSalons();
  render(salons);
})();
