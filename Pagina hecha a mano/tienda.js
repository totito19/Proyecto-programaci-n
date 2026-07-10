const carrito = document.getElementById("carrito");
const cantidad = document.getElementById("cantidad");
const total = document.getElementById("total");

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

        contenedor.appendChild(tarjeta);
    });

}

cargarProductos();