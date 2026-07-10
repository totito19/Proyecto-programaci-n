async function cargarProductos() {

    const respuesta = await fetch("https://fakestoreapi.com/products");
    const productos = await respuesta.json();

    const contenedor = document.getElementById("productos");

    productos.forEach(producto => {

        const tarjeta = document.createElement("div");
        tarjeta.className = "producto";

        tarjeta.innerHTML = `
            <img src="${producto.image}">
            <h2>${producto.title}</h2>
            <p>$${producto.price}</p>
            <div class="btnCarrito">Agregar al carrito</div>
        `;

        const btnCarrito = tarjeta.querySelector(".btnCarrito");

        btnCarrito.addEventListener("click", () => {
            cantidad.textContent = Number(cantidad.textContent) + 1;
            total.textContent = (
                Number(total.textContent) + producto.price
            ).toFixed(2);
        });

        contenedor.appendChild(tarjeta);
    });
}

cargarProductos();

const btnFinishBuy = document.getElementById("FinishBuy");

btnFinishBuy.addEventListener("click", () => {
    if (Number(cantidad.textContent) > 0) {
        alert(`Compra finalizada. Total: $${total.textContent}`);
        cantidad.textContent = "0";
        total.textContent = "0.00";
    } else {
        alert("No hay productos en el carrito.");
    }
});

const sesion = document.getElementById("sesion");

sesion.addEventListener("click", (event) => {
    localStorage.removeItem("token");
    window.location.href = "index.html";
});
const datosusuario = document.getElementById("userSpan");
username = JSON.parse(localStorage.getItem("usuario"));
datosusuario.textContent = username.username;
