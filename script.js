/* ============================================================
   NightShop — script.js
   Login · Perfil · Catálogo · Búsqueda/Filtros · Carrito
   ============================================================ */

"use strict";

/* ---------------------------------------------------------- */
/* CONSTANTES                                                  */
/* ---------------------------------------------------------- */
const API_BASE   = "https://fakestoreapi.com";
const TOKEN_KEY  = "ns_token";
const CART_KEY   = "ns_cart";

/* ---------------------------------------------------------- */
/* ESTADO                                                      */
/* ---------------------------------------------------------- */
let allProducts  = [];   // todos los productos cargados
let cart         = [];   // array de objetos { id, title, price, image, qty }

/* ---------------------------------------------------------- */
/* HELPERS DE DOM                                             */
/* ---------------------------------------------------------- */
const $  = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

function show(el)  { el.classList.remove("hidden"); }
function hide(el)  { el.classList.add("hidden"); }

/* ---------------------------------------------------------- */
/* BOOTSTRAP                                                   */
/* ---------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    showStore();
    loadProfile();
    loadCatalog();
  }

  // Cargar carrito guardado
  loadCartFromStorage();

  // ---- Eventos Login ----
  $("#login-btn").addEventListener("click", handleLogin);
  $("input#username").addEventListener("keydown", e => { if (e.key === "Enter") handleLogin(); });
  $("input#password").addEventListener("keydown", e => { if (e.key === "Enter") handleLogin(); });

  // ---- Eventos Logout ----
  $("#logout-btn").addEventListener("click", handleLogout);

  // ---- Eventos Carrito ----
  $("#cart-toggle-btn").addEventListener("click", openCart);
  $("#cart-close-btn").addEventListener("click", closeCart);
  $("#cart-overlay").addEventListener("click", closeCart);
  $("#cart-clear-btn").addEventListener("click", clearCart);

  // ---- Búsqueda / Filtro ----
  $("#search-input").addEventListener("input", filterProducts);
  $("#category-filter").addEventListener("change", filterProducts);
});

/* ---------------------------------------------------------- */
/* LOGIN                                                       */
/* ---------------------------------------------------------- */
async function handleLogin() {
  const username  = $("#username").value.trim();
  const password  = $("#password").value.trim();
  const errorBox  = $("#login-error");
  const btnText   = $("#login-btn-text");
  const spinner   = $("#login-spinner");

  hide(errorBox);

  if (!username || !password) {
    showError(errorBox, "Por favor completá usuario y contraseña.");
    return;
  }

  // Estado de carga
  btnText.textContent = "Ingresando…";
  show(spinner);
  $("#login-btn").disabled = true;

  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (!res.ok) throw new Error("Credenciales incorrectas.");

    const data = await res.json();
    localStorage.setItem(TOKEN_KEY, data.token);

    showStore();
    loadProfile();
    loadCatalog();
  } catch (err) {
    showError(errorBox, err.message || "Error al conectar con el servidor.");
  } finally {
    btnText.textContent = "Iniciar sesión";
    hide(spinner);
    $("#login-btn").disabled = false;
  }
}

function showStore() {
  hide($("#login-section"));
  show($("#store-section"));
}

function showLogin() {
  show($("#login-section"));
  hide($("#store-section"));
}

function handleLogout() {
  localStorage.removeItem(TOKEN_KEY);
  showLogin();
  // Limpiar UI
  $("#username").value = "";
  $("#password").value = "";
  hide($("#login-error"));
}

/* ---------------------------------------------------------- */
/* PERFIL                                                      */
/* ---------------------------------------------------------- */
async function loadProfile() {
  const loading  = $("#profile-loading");
  const card     = $("#profile-card");
  const errorBox = $("#profile-error");

  show(loading);
  hide(card);
  hide(errorBox);

  try {
    const res = await fetch(`${API_BASE}/users/1`);
    if (!res.ok) throw new Error("No se pudo cargar el perfil.");
    const u = await res.json();

    const fullName = `${capitalize(u.name.firstname)} ${capitalize(u.name.lastname)}`;
    const initials = (u.name.firstname[0] + u.name.lastname[0]).toUpperCase();

    $("#profile-initials").textContent = initials;
    $("#profile-name").textContent     = fullName;
    $("#profile-username").textContent = u.username;
    $("#profile-email").textContent    = u.email;
    $("#profile-phone").textContent    = u.phone;

    hide(loading);
    show(card);
  } catch (err) {
    hide(loading);
    showError(errorBox, "No se pudo cargar el perfil de usuario.");
  }
}

/* ---------------------------------------------------------- */
/* CATÁLOGO                                                    */
/* ---------------------------------------------------------- */
async function loadCatalog() {
  const loading  = $("#catalog-loading");
  const errorBox = $("#catalog-error");

  show(loading);
  hide(errorBox);
  hide($("#no-results"));

  try {
    // Productos y categorías en paralelo
    const [prodRes, catRes] = await Promise.all([
      fetch(`${API_BASE}/products`),
      fetch(`${API_BASE}/products/categories`),
    ]);

    if (!prodRes.ok || !catRes.ok) throw new Error("Error al cargar datos.");

    allProducts = await prodRes.json();
    const categories = await catRes.json();

    buildCategoryFilter(categories);
    renderProducts(allProducts);

    hide(loading);
  } catch (err) {
    hide(loading);
    showError(errorBox, "No se pudieron cargar los productos. Intentá recargar la página.");
  }
}

function buildCategoryFilter(categories) {
  const select = $("#category-filter");
  // Limpiar opciones excepto la primera
  while (select.options.length > 1) select.remove(1);

  categories.forEach(cat => {
    const opt = document.createElement("option");
    opt.value = cat;
    opt.textContent = capitalize(cat);
    select.appendChild(opt);
  });
}

function renderProducts(products) {
  const grid      = $("#products-grid");
  const noResults = $("#no-results");

  grid.innerHTML = "";

  if (products.length === 0) {
    show(noResults);
    return;
  }
  hide(noResults);

  products.forEach(p => {
    const article = document.createElement("article");
    article.className = "product-card";
    article.setAttribute("role", "listitem");
    article.setAttribute("aria-label", p.title);
    article.innerHTML = `
      <div class="product-card__img-wrap">
        <img src="${p.image}" alt="${escapeHtml(p.title)}" loading="lazy" />
      </div>
      <div class="product-card__body">
        <span class="product-card__category">${escapeHtml(p.category)}</span>
        <h3 class="product-card__name">${escapeHtml(p.title)}</h3>
        <p class="product-card__price">$${p.price.toFixed(2)}</p>
      </div>
      <div class="product-card__footer">
        <button class="btn btn--primary btn--full add-to-cart-btn"
          data-id="${p.id}"
          data-title="${escapeHtml(p.title)}"
          data-price="${p.price}"
          data-image="${p.image}"
          aria-label="Agregar ${escapeHtml(p.title)} al carrito">
          + Agregar al carrito
        </button>
      </div>
    `;
    grid.appendChild(article);
  });

  // Delegar eventos en el grid (más eficiente)
  grid.addEventListener("click", onAddToCart);
}

function filterProducts() {
  const query    = $("#search-input").value.toLowerCase().trim();
  const category = $("#category-filter").value;

  const filtered = allProducts.filter(p => {
    const matchSearch   = !query    || p.title.toLowerCase().includes(query);
    const matchCategory = !category || p.category === category;
    return matchSearch && matchCategory;
  });

  renderProducts(filtered);
}

/* ---------------------------------------------------------- */
/* CARRITO                                                     */
/* ---------------------------------------------------------- */
function loadCartFromStorage() {
  try {
    const stored = localStorage.getItem(CART_KEY);
    cart = stored ? JSON.parse(stored) : [];
  } catch {
    cart = [];
  }
  updateCartUI();
}

function saveCartToStorage() {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

/* Agrega producto o incrementa cantidad */
function onAddToCart(e) {
  const btn = e.target.closest(".add-to-cart-btn");
  if (!btn) return;

  const id    = Number(btn.dataset.id);
  const title = btn.dataset.title;
  const price = parseFloat(btn.dataset.price);
  const image = btn.dataset.image;

  const existing = cart.find(item => item.id === id);
  if (existing) {
    existing.qty++;
  } else {
    cart.push({ id, title, price, image, qty: 1 });
  }

  saveCartToStorage();
  updateCartUI();
  flashBtn(btn);
}

function updateCartUI() {
  // Conteo en header
  const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
  $("#cart-count").textContent = totalQty;

  // Lista
  const listEl   = $("#cart-items");
  const emptyEl  = $("#cart-empty");
  const footerEl = $("#cart-footer");

  listEl.innerHTML = "";

  if (cart.length === 0) {
    show(emptyEl);
    hide(footerEl);
    return;
  }

  hide(emptyEl);
  show(footerEl);

  cart.forEach(item => {
    const subtotal = (item.price * item.qty).toFixed(2);
    const li = document.createElement("li");
    li.className = "cart-item";
    li.dataset.id = item.id;
    li.innerHTML = `
      <img class="cart-item__img" src="${item.image}" alt="${escapeHtml(item.title)}" />
      <div class="cart-item__info">
        <p class="cart-item__name">${escapeHtml(item.title)}</p>
        <p class="cart-item__price">$${item.price.toFixed(2)} / u</p>
        <div class="cart-item__controls">
          <button class="qty-btn" data-action="dec" data-id="${item.id}" aria-label="Quitar uno">−</button>
          <span class="qty-display" aria-label="Cantidad: ${item.qty}">${item.qty}</span>
          <button class="qty-btn" data-action="inc" data-id="${item.id}" aria-label="Agregar uno">+</button>
          <span class="cart-item__subtotal">$${subtotal}</span>
          <button class="remove-btn" data-action="remove" data-id="${item.id}" aria-label="Eliminar producto">✕</button>
        </div>
      </div>
    `;
    listEl.appendChild(li);
  });

  // Total
  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  $("#cart-total").textContent = `$${total.toFixed(2)}`;

  // Eventos de la lista
  listEl.addEventListener("click", onCartAction);
}

function onCartAction(e) {
  const btn = e.target.closest("[data-action]");
  if (!btn) return;

  const action = btn.dataset.action;
  const id     = Number(btn.dataset.id);
  const item   = cart.find(i => i.id === id);
  if (!item) return;

  if (action === "inc") {
    item.qty++;
  } else if (action === "dec") {
    item.qty--;
    if (item.qty <= 0) cart = cart.filter(i => i.id !== id);
  } else if (action === "remove") {
    cart = cart.filter(i => i.id !== id);
  }

  saveCartToStorage();
  updateCartUI();
}

function clearCart() {
  cart = [];
  saveCartToStorage();
  updateCartUI();
}

function openCart() {
  const panel = $("#cart-panel");
  panel.classList.add("open");
  panel.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeCart() {
  const panel = $("#cart-panel");
  panel.classList.remove("open");
  panel.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

/* ---------------------------------------------------------- */
/* UTILIDADES                                                  */
/* ---------------------------------------------------------- */
function showError(el, msg) {
  el.textContent = msg;
  show(el);
}

function capitalize(str) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : str;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Feedback visual al agregar al carrito
function flashBtn(btn) {
  const original = btn.textContent;
  btn.textContent = "✓ Agregado";
  btn.style.background = "var(--success)";
  btn.disabled = true;
  setTimeout(() => {
    btn.textContent = original;
    btn.style.background = "";
    btn.disabled = false;
  }, 900);
}
