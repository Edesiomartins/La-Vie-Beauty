import { getSalonById } from "./firestore.js";

const id = new URLSearchParams(window.location.search).get("id");

(async () => {
  const salon = await getSalonById(id);
  if (!salon) return;

  document.getElementById("salon-name").textContent = salon.name;
  document.getElementById("salon-description").textContent = salon.description;
  document.getElementById("salon-address").textContent = salon.address;
  document.getElementById("salon-phone").textContent = salon.phone;
  document.getElementById("salon-email").textContent = salon.email;

  document.querySelector(".hero").style.backgroundImage =
    `url('${salon.image || "https://source.unsplash.com/1920x1080/?beauty"}')`;

  document.getElementById("cta-button").href =
    salon.appLink || "https://app.la-vie-beauty.com.br";
})();
