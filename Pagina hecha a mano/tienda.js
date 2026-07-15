// ===== Estado del carrito =====
// El carrito es un array de objetos. Se carga desde localStorage al iniciar.
let carrito = JSON.parse(localStorage.getItem("carrito")) || [];

// Guardamos aquí todos los productos traidos de la API para poder filtrarlos.
let todosLosProductos = [];

// ===== Carga de productos =====
async function cargarProductos() {

    const mensajeProductos = document.getElementById("mensajeProductos");

    try {
        const respuesta = await fetch("https://fakestoreapi.com/products");
        if (!respuesta.ok) {
            throw new Error("No se pudieron cargar los productos.");
        }
        todosLosProductos = await respuesta.json();
        mostrarProductos(todosLosProductos);
    } catch (error) {
        mensajeProductos.textContent = "Error al cargar los productos desde la API.";
    }
}

// Recibe una lista de productos y los dibuja en pantalla.
function mostrarProductos(productos) {

    const contenedor = document.getElementById("productos");
    const mensajeProductos = document.getElementById("mensajeProductos");
    contenedor.innerHTML = "";

    if (productos.length === 0) {
        mensajeProductos.textContent = "No hay productos disponibles.";
        return;
    }

    mensajeProductos.textContent = "";

    productos.forEach(producto => {

        const tarjeta = document.createElement("article");
        tarjeta.className = "producto";

        tarjeta.innerHTML = `
            <img src="${producto.image}">
            <h2>${producto.title}</h2>
            <p class="categoria">${producto.category}</p>
            <p class="precio">$${producto.price}</p>
            <div class="btnCarrito">Agregar al carrito</div>
        `;

        const btnCarrito = tarjeta.querySelector(".btnCarrito");

        btnCarrito.addEventListener("click", () => {
            agregarAlCarrito(producto);
        });

        contenedor.appendChild(tarjeta);
    });
}

// ===== Categorías (para el filtro) =====
async function cargarCategorias() {

    try {
        const respuesta = await fetch("https://fakestoreapi.com/products/categories");
        if (!respuesta.ok) {
            throw new Error("No se pudieron cargar las categorías.");
        }
        const categorias = await respuesta.json();

        const filtro = document.getElementById("filtroCategoria");

        categorias.forEach(categoria => {
            const opcion = document.createElement("option");
            opcion.value = categoria;
            opcion.textContent = categoria;
            filtro.appendChild(opcion);
        });
    } catch (error) {
        // Si fallan las categorías, el filtro simplemente queda con "Todas".
    }
}

// ===== Búsqueda y filtro combinados =====
function aplicarFiltros() {

    const texto = document.getElementById("buscador").value.trim().toLowerCase();
    const categoria = document.getElementById("filtroCategoria").value;

    let filtrados = todosLosProductos;

    if (categoria !== "all") {
        filtrados = filtrados.filter(producto => producto.category === categoria);
    }

    if (texto !== "") {
        filtrados = filtrados.filter(producto =>
            producto.title.toLowerCase().includes(texto)
        );
    }

    mostrarProductos(filtrados);
}

// ===== Carrito =====
// Agrega un producto: si ya existe suma cantidad, si no lo crea.
function agregarAlCarrito(producto) {

    const existente = carrito.find(item => item.id === producto.id);

    if (existente) {
        existente.cantidad++;
    } else {
        carrito.push({
            id: producto.id,
            title: producto.title,
            price: producto.price,
            cantidad: 1
        });
    }

    guardarCarrito();
    renderizarCarrito();
}

// Cambia la cantidad de un producto. Si llega a 0, se elimina.
function cambiarCantidad(id, delta) {

    const item = carrito.find(item => item.id === id);
    if (!item) return;

    item.cantidad += delta;

    if (item.cantidad <= 0) {
        eliminarDelCarrito(id);
        return;
    }

    guardarCarrito();
    renderizarCarrito();
}

// Elimina por completo un producto del carrito.
function eliminarDelCarrito(id) {
    carrito = carrito.filter(item => item.id !== id);
    guardarCarrito();
    renderizarCarrito();
}

// Guarda el carrito en localStorage (persistencia).
function guardarCarrito() {
    localStorage.setItem("carrito", JSON.stringify(carrito));
}

// Dibuja el carrito completo: lista, subtotales, cantidad y total.
function renderizarCarrito() {

    const lista = document.getElementById("lista-carrito");
    const cantidad = document.getElementById("cantidad");
    const total = document.getElementById("total");

    lista.innerHTML = "";

    let cantidadTotal = 0;
    let totalGeneral = 0;

    carrito.forEach(item => {

        const subtotal = item.price * item.cantidad;
        cantidadTotal += item.cantidad;
        totalGeneral += subtotal;

        const li = document.createElement("li");
        li.innerHTML = `
            <span class="item-nombre">${item.title}</span>
            <span class="item-controles">
                <button class="btn-menos">-</button>
                <span class="item-cant">${item.cantidad}</span>
                <button class="btn-mas">+</button>
                <span class="item-subtotal">$${subtotal.toFixed(2)}</span>
                <button class="btn-eliminar">🗑</button>
            </span>
        `;

        li.querySelector(".btn-menos").addEventListener("click", () => cambiarCantidad(item.id, -1));
        li.querySelector(".btn-mas").addEventListener("click", () => cambiarCantidad(item.id, 1));
        li.querySelector(".btn-eliminar").addEventListener("click", () => eliminarDelCarrito(item.id));

        lista.appendChild(li);
    });

    cantidad.textContent = cantidadTotal;
    total.textContent = totalGeneral.toFixed(2);
}

// ===== Eventos =====
document.getElementById("buscador").addEventListener("input", aplicarFiltros);
document.getElementById("filtroCategoria").addEventListener("change", aplicarFiltros);

const btnFinishBuy = document.getElementById("FinishBuy");

btnFinishBuy.addEventListener("click", () => {
    const cantidad = document.getElementById("cantidad");
    const total = document.getElementById("total");

    if (Number(cantidad.textContent) > 0) {
        // Efecto: el botón se rellena de verde de izquierda a derecha.
        btnFinishBuy.classList.add("comprado");
        setTimeout(() => btnFinishBuy.classList.remove("comprado"), 700);

        carrito = [];
        guardarCarrito();
        renderizarCarrito();
    } else {
        alert("No hay productos en el carrito.");
    }
});

const sesion = document.getElementById("sesion");

sesion.addEventListener("click", (event) => {
    localStorage.removeItem("token");
    window.location.href = "index.html";
});

// ===== Perfil del usuario =====
const usuario = JSON.parse(localStorage.getItem("usuario"));

if (usuario) {
    document.getElementById("userSpan").textContent = usuario.username;
    document.getElementById("nombreSpan").textContent = `${usuario.name.firstname} ${usuario.name.lastname}`;
    document.getElementById("correoSpan").textContent = usuario.email;
    document.getElementById("telefonoSpan").textContent = usuario.phone;
}

// ===== Inicio =====
cargarProductos();
cargarCategorias();
renderizarCarrito();