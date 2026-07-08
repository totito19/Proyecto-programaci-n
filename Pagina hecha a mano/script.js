const carrito = document.getElementById("carrito");
const cantidad = document.getElementById("cantidad");

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
        `;

        tarjeta.addEventListener("click", () => {

            cantidad.textContent = parseInt(cantidad.textContent) + 1;

        });

        contenedor.appendChild(tarjeta);

    });

}

cargarProductos();