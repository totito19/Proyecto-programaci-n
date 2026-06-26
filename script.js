let articulo1 = document.getElementById("articulo1");
let articulo2 = document.getElementById("articulo2");
let articulo3 = document.getElementById("articulo3");

let carrito = document.getElementById("carrito");

const ca

articulo1.addEventListener("click", function() {
    let item = document.createElement("li");
    item.textContent = "Articulo 1";
    carrito.appendChild(item);
});

if (carrito) {
    carrito.addEventListener("click", function(event) {
        createModal(event.target.textContent);
    });
}