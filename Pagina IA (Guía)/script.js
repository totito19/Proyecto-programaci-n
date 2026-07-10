"use strict";
/* ----------------------------------------------------------
   CONSTANTES GLOBALES
   ----------------------------------------------------------
   Las constantes son valores que no cambian nunca.
   Las ponemos arriba para que sean fáciles de encontrar y
   modificar si cambia la URL de la API, por ejemplo.
---------------------------------------------------------- */
const URL_API    = "https://fakestoreapi.com"; // base de todos los endpoints
const CLAVE_TOKEN   = "ns_token";  // nombre de la clave en localStorage para el token
const CLAVE_CARRITO = "ns_carrito"; // nombre de la clave en localStorage para el carrito


/* ----------------------------------------------------------
   VARIABLES GLOBALES DE ESTADO
   ----------------------------------------------------------
   Estas variables guardan el "estado" de la aplicación.
   Toda la lógica las lee y modifica según las acciones del usuario.
---------------------------------------------------------- */
let todosLosProductos = []; // array con TODOS los productos que trajo la API
let carrito = [];
/*
  El carrito es un array de objetos. Cada objeto tiene esta forma:
  {
    id:     1,
    titulo: "Nombre del producto",
    precio: 29.99,
    imagen: "https://...",
    cantidad: 2
  }
*/


/* ----------------------------------------------------------
   PUNTO DE ENTRADA: DOMContentLoaded
   ----------------------------------------------------------
   Este evento se dispara cuando el navegador terminó de leer
   y construir todo el HTML. Recién ahí podemos buscar elementos
   del DOM con getElementById, etc.

   Si intentáramos acceder a elementos antes de este evento,
   obtendrías "null" porque el HTML todavía no fue procesado.
---------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", function () {

  // Chequeamos si ya hay un token guardado de una sesión anterior
  const tokenGuardado = localStorage.getItem(CLAVE_TOKEN);

  if (tokenGuardado) {
    // Si hay token, el usuario ya inició sesión antes → mostramos la tienda directo
    mostrarTienda();
    cargarPerfil();
    cargarCatalogo();
  }
  // Si no hay token, el login ya está visible por defecto en el HTML

  // Cargamos el carrito que puede haber quedado guardado en localStorage
  cargarCarritoDeStorage();
});


/* ============================================================
   LOGIN Y SESIÓN
   ============================================================ */

/*
  iniciarSesion() — se llama desde el onclick del botón "Entrar".

  Flujo:
  1. Leemos usuario y contraseña del HTML
  2. Validamos que no estén vacíos
  3. Hacemos un POST a la API con fetch
  4. Si la API responde OK, guardamos el token y mostramos la tienda
  5. Si hay error, mostramos el mensaje de error
*/
async function iniciarSesion() {
  /*
    "async" convierte esta función en asíncrona.
    Eso nos permite usar "await" adentro, que pausa la ejecución
    hasta que una operación lenta (como fetch) termine.
    Sin async/await, necesitaríamos callbacks o .then() encadenados.
  */

  // Leemos los valores de los campos del HTML
  const usuario    = document.getElementById("campo-usuario").value.trim();
  const contrasena = document.getElementById("campo-contrasena").value.trim();
  const cajError   = document.getElementById("login-error");

  // Ocultamos error anterior
  cajError.classList.add("oculto");

  // Validación básica antes de llamar a la API
  if (!usuario || !contrasena) {
    cajError.textContent = "Completá usuario y contraseña.";
    cajError.classList.remove("oculto");
    return; // "return" corta la función acá, no sigue ejecutando
  }

  try {
    /*
      fetch() hace una petición HTTP.
      Por defecto hace GET. Para POST necesitamos el segundo argumento
      con method, headers y body.

      El body debe ser un string JSON, por eso usamos JSON.stringify().
    */
    const respuesta = await fetch(URL_API + "/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json" // le decimos a la API que mandamos JSON
      },
      body: JSON.stringify({ username: usuario, password: contrasena })
    });

    // respuesta.ok es true si el código HTTP es 200-299
    if (!respuesta.ok) {
      throw new Error("Usuario o contraseña incorrectos.");
      // throw "lanza" un error que es capturado por el bloque catch de abajo
    }

    // Convertimos la respuesta a objeto JavaScript
    const datos = await respuesta.json();
    /*
      datos.token es el token JWT que devuelve la API.
      Lo guardamos en localStorage para que persista al recargar la página.
      localStorage guarda strings, así que el token (que ya es un string) entra directo.
    */
    localStorage.setItem(CLAVE_TOKEN, datos.token);

    // Mostramos la tienda y cargamos datos
    mostrarTienda();
    cargarPerfil();
    cargarCatalogo();

  } catch (error) {
    /*
      catch atrapa cualquier error:
      - errores de red (sin internet)
      - el throw que hicimos arriba
      - errores de JSON.parse
    */
    cajError.textContent = error.message;
    cajError.classList.remove("oculto");
  }
}


/*
  mostrarTienda() — oculta el login y muestra la sección de la tienda.
  classList.add / classList.remove manipulan las clases CSS de un elemento.
*/
function mostrarTienda() {
  document.getElementById("login-section").classList.add("oculto");
  document.getElementById("tienda-section").classList.remove("oculto");
}


/*
  cerrarSesion() — se llama desde el onclick del botón "Cerrar sesión".
  Borra el token y vuelve a mostrar el login.
*/
function cerrarSesion() {
  localStorage.removeItem(CLAVE_TOKEN); // borramos el token guardado
  document.getElementById("tienda-section").classList.add("oculto");
  document.getElementById("login-section").classList.remove("oculto");
  // Limpiamos los campos por seguridad
  document.getElementById("campo-usuario").value = "";
  document.getElementById("campo-contrasena").value = "";
}


/* ============================================================
   PERFIL DE USUARIO
   ============================================================ */

/*
  cargarPerfil() — trae los datos del usuario desde la API y los muestra.

  Usamos /users/1 porque la Fake Store API tiene un usuario de prueba
  con ID 1 que coincide con las credenciales johnd.
*/
async function cargarPerfil() {
  const elCargando = document.getElementById("perfil-cargando");
  const laTarjeta  = document.getElementById("tarjeta-perfil");
  const elError    = document.getElementById("perfil-error");

  // Mostramos "cargando" y ocultamos lo demás
  elCargando.classList.remove("oculto");
  laTarjeta.classList.add("oculto");
  elError.classList.add("oculto");

  try {
    const respuesta = await fetch(URL_API + "/users/1");
    if (!respuesta.ok) throw new Error("Error al cargar perfil.");

    const usuario = await respuesta.json();
    /*
      La API devuelve un objeto como este:
      {
        id: 1,
        email: "john@gmail.com",
        username: "johnd",
        password: "...",
        name: { firstname: "john", lastname: "doe" },
        phone: "1-570-236-7033",
        ...
      }
    */

    // Armamos el nombre completo capitalizando la primera letra
    const nombreCompleto =
      capitalizar(usuario.name.firstname) + " " + capitalizar(usuario.name.lastname);

    // Escribimos los datos en el HTML usando textContent
    // (textContent es más seguro que innerHTML para datos de la API)
    document.getElementById("perfil-nombre").textContent   = nombreCompleto;
    document.getElementById("perfil-usuario").textContent  = usuario.username;
    document.getElementById("perfil-email").textContent    = usuario.email;
    document.getElementById("perfil-telefono").textContent = usuario.phone;

    // Ocultamos "cargando" y mostramos la tarjeta con los datos
    elCargando.classList.add("oculto");
    laTarjeta.classList.remove("oculto");

  } catch (error) {
    elCargando.classList.add("oculto");
    elError.classList.remove("oculto");
  }
}


/* ============================================================
   CATÁLOGO DE PRODUCTOS
   ============================================================ */

/*
  cargarCatalogo() — trae productos y categorías de la API.

  Usamos Promise.all para hacer las dos peticiones en paralelo
  en lugar de una después de la otra. Esto lo hace más rápido.
*/
async function cargarCatalogo() {
  const elCargando = document.getElementById("catalogo-cargando");
  const elError    = document.getElementById("catalogo-error");

  elCargando.classList.remove("oculto");
  elError.classList.add("oculto");

  try {
    /*
      Promise.all recibe un array de promesas y espera a que TODAS terminen.
      Devuelve un array con los resultados en el mismo orden.
      Si cualquiera falla, el catch lo atrapa.
    */
    const [respProductos, respCategorias] = await Promise.all([
      fetch(URL_API + "/products"),
      fetch(URL_API + "/products/categories")
    ]);

    if (!respProductos.ok || !respCategorias.ok) {
      throw new Error("Error al cargar datos.");
    }

    // Convertimos ambas respuestas a objetos JS
    todosLosProductos = await respProductos.json();
    const categorias  = await respCategorias.json();
    /*
      categorias es un array simple de strings:
      ["electronics", "jewelery", "men's clothing", "women's clothing"]
    */

    // Construimos el dropdown de categorías con los datos de la API
    construirFiltroCategoria(categorias);

    // Mostramos todos los productos
    mostrarProductos(todosLosProductos);

    elCargando.classList.add("oculto");

  } catch (error) {
    elCargando.classList.add("oculto");
    elError.classList.remove("oculto");
  }
}


/*
  construirFiltroCategoria() — genera dinámicamente los <option> del <select>.
  Recibe un array de strings (los nombres de las categorías).
*/
function construirFiltroCategoria(categorias) {
  const select = document.getElementById("filtro-categoria");

  // Para cada categoría de la API, creamos un <option> y lo agregamos al <select>
  categorias.forEach(function (cat) {
    const opcion = document.createElement("option");
    opcion.value       = cat;       // el valor que usamos para filtrar
    opcion.textContent = capitalizar(cat); // el texto que ve el usuario
    select.appendChild(opcion); // lo agregamos al final del <select>
  });
}


/*
  mostrarProductos() — genera el HTML de las tarjetas de productos.
  Recibe un array de productos (puede ser todos o un subconjunto filtrado).
*/
function mostrarProductos(productos) {
  const grilla        = document.getElementById("grilla-productos");
  const sinResultados = document.getElementById("sin-resultados");

  // Borramos las tarjetas anteriores antes de dibujar las nuevas
  grilla.innerHTML = "";

  // Si no hay productos, mostramos el mensaje "sin resultados"
  if (productos.length === 0) {
    sinResultados.classList.remove("oculto");
    return; // salimos de la función, no hay nada más que hacer
  }
  sinResultados.classList.add("oculto");

  /*
    Para cada producto creamos un elemento article del DOM
    y lo insertamos en la grilla.

    Usamos article porque es un elemento semántico apropiado
    para un bloque de contenido independiente y reutilizable.
  */
  productos.forEach(function (producto) {
    const articulo = document.createElement("article");
    articulo.className = "tarjeta-producto";

    /*
      innerHTML nos permite escribir HTML directamente como string.
      Usamos template literals (backticks) para interpolar variables con ${}.
      
      IMPORTANTE: en producción real habría que sanitizar los datos
      de la API para evitar ataques XSS. Para este proyecto académico está bien.
    */
    articulo.innerHTML = `
      <div class="imagen-wrap">
        <img src="${producto.image}" alt="${producto.title}" loading="lazy" />
      </div>
      <div class="info">
        <span class="categoria">${producto.category}</span>
        <p class="nombre">${producto.title}</p>
        <p class="precio">$${producto.price.toFixed(2)}</p>
      </div>
      <div class="footer-tarjeta">
        <button onclick="agregarAlCarrito(${producto.id})">
          + Agregar al carrito
        </button>
      </div>
    `;
    /*
      Nota sobre producto.price.toFixed(2):
      toFixed(2) convierte el número a string con exactamente 2 decimales.
      Ejemplo: 9.9 → "9.90"  |  12.345 → "12.35"
    */

    grilla.appendChild(articulo); // añadimos la tarjeta al DOM
  });
}


/*
  filtrarProductos() — se llama cuando el usuario escribe en el buscador
  o cambia la categoría seleccionada.

  Lee los valores actuales de los controles y filtra el array
  todosLosProductos (que siempre tiene todos los productos originales).
*/
function filtrarProductos() {
  const textoBusqueda = document.getElementById("buscador").value.toLowerCase().trim();
  const categoriaElegida = document.getElementById("filtro-categoria").value;

  /*
    Array.filter() devuelve un NUEVO array con los elementos
    que pasan la condición. No modifica el array original.

    Para cada producto, chequeamos DOS condiciones:
    1. ¿El nombre incluye el texto buscado?
    2. ¿La categoría coincide con el filtro?

    Si no hay texto o no hay categoría elegida, la condición es true
    (no filtra nada en esa dimensión).
  */
  const productosFiltrados = todosLosProductos.filter(function (producto) {
    const coincideBusqueda  = !textoBusqueda    || producto.title.toLowerCase().includes(textoBusqueda);
    const coincideCategoria = !categoriaElegida || producto.category === categoriaElegida;
    return coincideBusqueda && coincideCategoria;
  });

  // Mostramos solo los productos que pasaron el filtro
  mostrarProductos(productosFiltrados);
}


/* ============================================================
   CARRITO DE COMPRAS
   ============================================================ */

/*
  cargarCarritoDeStorage() — recupera el carrito guardado en localStorage.
  Se llama al inicio para restaurar el carrito de la sesión anterior.
*/
function cargarCarritoDeStorage() {
  try {
    const carritoGuardado = localStorage.getItem(CLAVE_CARRITO);
    /*
      localStorage solo guarda strings. Entonces:
      - Para guardar: JSON.stringify(array) → convierte array a string
      - Para recuperar: JSON.parse(string)  → convierte string a array
    */
    carrito = carritoGuardado ? JSON.parse(carritoGuardado) : [];
  } catch (e) {
    // Si el JSON está corrupto por alguna razón, empezamos con carrito vacío
    carrito = [];
  }
  actualizarInterfazCarrito(); // reflejamos en pantalla lo que cargamos
}


/*
  guardarCarritoEnStorage() — guarda el array carrito en localStorage.
  Se llama cada vez que el carrito cambia.
*/
function guardarCarritoEnStorage() {
  localStorage.setItem(CLAVE_CARRITO, JSON.stringify(carrito));
}


/*
  agregarAlCarrito() — se llama desde el onclick de cada tarjeta de producto.
  Recibe el ID del producto y busca el objeto completo en todosLosProductos.
*/
function agregarAlCarrito(idProducto) {
  /*
    Array.find() devuelve el PRIMER elemento que cumple la condición,
    o undefined si no encuentra ninguno.
  */
  const producto = todosLosProductos.find(function (p) {
    return p.id === idProducto;
  });

  if (!producto) return; // por seguridad, aunque no debería pasar

  /*
    Buscamos si ese producto ya está en el carrito.
    Si está, incrementamos la cantidad.
    Si no está, lo agregamos como nuevo objeto.
  */
  const itemExistente = carrito.find(function (item) {
    return item.id === idProducto;
  });

  if (itemExistente) {
    // Ya está en el carrito → solo sumamos 1 a la cantidad
    itemExistente.cantidad++;
  } else {
    // No está → lo agregamos como nuevo item al array
    carrito.push({
      id:       producto.id,
      titulo:   producto.title,
      precio:   producto.price,
      imagen:   producto.image,
      cantidad: 1
    });
    /*
      Array.push() agrega un elemento al FINAL del array.
      Es uno de los métodos más comunes para agregar a arrays.
    */
  }

  guardarCarritoEnStorage();   // persistimos el cambio
  actualizarInterfazCarrito(); // actualizamos lo visual
}


/*
  cambiarCantidad() — aumenta o disminuye la cantidad de un producto.
  Recibe el id del producto y la dirección (+1 o -1).
*/
function cambiarCantidad(idProducto, direccion) {
  const item = carrito.find(function (i) { return i.id === idProducto; });
  if (!item) return;

  item.cantidad += direccion; // suma o resta 1

  // Si la cantidad llega a 0, eliminamos el producto del carrito
  if (item.cantidad <= 0) {
    eliminarDelCarrito(idProducto);
    return; // ya no necesitamos seguir
  }

  guardarCarritoEnStorage();
  actualizarInterfazCarrito();
}


/*
  eliminarDelCarrito() — quita completamente un producto del carrito.
  Array.filter() crea un nuevo array SIN el elemento que queremos borrar.
*/
function eliminarDelCarrito(idProducto) {
  carrito = carrito.filter(function (item) {
    return item.id !== idProducto; // mantenemos todos MENOS el que queremos borrar
  });
  guardarCarritoEnStorage();
  actualizarInterfazCarrito();
}


/*
  vaciarCarrito() — borra todos los productos del carrito.
*/
function vaciarCarrito() {
  carrito = []; // simplemente reemplazamos por un array vacío
  guardarCarritoEnStorage();
  actualizarInterfazCarrito();
}


/*
  actualizarInterfazCarrito() — redibuja TODO el carrito en pantalla.
  Se llama después de cualquier cambio en el array carrito.
*/
function actualizarInterfazCarrito() {
  const listaEl   = document.getElementById("lista-carrito");
  const vacioEl   = document.getElementById("carrito-vacio");
  const pieEl     = document.getElementById("pie-carrito");
  const contadorEl= document.getElementById("contador-carrito");

  // Calculamos la cantidad total de items (sumando todas las cantidades)
  const cantidadTotal = carrito.reduce(function (acumulador, item) {
    return acumulador + item.cantidad;
  }, 0);
  /*
    Array.reduce() recorre el array y va acumulando un valor.
    Empieza con 0 (el segundo argumento) y por cada item suma su cantidad.
    Ejemplo: [{cantidad:2}, {cantidad:3}] → 0 + 2 + 3 = 5
  */

  // Mostramos el contador en el botón del header
  contadorEl.textContent = cantidadTotal;

  // Limpiamos la lista antes de redibujar
  listaEl.innerHTML = "";

  if (carrito.length === 0) {
    // Carrito vacío: mostramos mensaje y ocultamos el pie
    vacioEl.classList.remove("oculto");
    pieEl.classList.add("oculto");
    return;
  }

  // Hay productos: ocultamos el mensaje y mostramos el pie
  vacioEl.classList.add("oculto");
  pieEl.classList.remove("oculto");

  // Generamos un <li> por cada producto en el carrito
  carrito.forEach(function (item) {
    const subtotal = (item.precio * item.cantidad).toFixed(2);

    const li = document.createElement("li");
    li.className = "item-carrito";
    li.innerHTML = `
      <img src="${item.imagen}" alt="${item.titulo}" />
      <div>
        <p class="nombre-item">${item.titulo}</p>
        <div class="controles-item">
          <button class="btn-cantidad" onclick="cambiarCantidad(${item.id}, -1)">−</button>
          <span class="cantidad-display">${item.cantidad}</span>
          <button class="btn-cantidad" onclick="cambiarCantidad(${item.id}, +1)">+</button>
          <span class="subtotal-item">$${subtotal}</span>
          <button class="btn-eliminar" onclick="eliminarDelCarrito(${item.id})">✕</button>
        </div>
      </div>
    `;
    listaEl.appendChild(li);
  });

  // Calculamos y mostramos el total general
  const total = carrito.reduce(function (acum, item) {
    return acum + item.precio * item.cantidad;
  }, 0);

  document.getElementById("total-carrito").textContent = "$" + total.toFixed(2);
}


/*
  abrirCarrito() / cerrarCarrito() — muestran y ocultan el panel aside.
*/
function abrirCarrito() {
  document.getElementById("panel-carrito").classList.remove("oculto");
}

function cerrarCarrito() {
  document.getElementById("panel-carrito").classList.add("oculto");
}


/* ============================================================
   FUNCIONES UTILITARIAS
   ============================================================ */

/*
  capitalizar() — convierte "electronics" en "Electronics".
  Toma el primer caracter, lo pone en mayúscula, y concatena el resto.
*/
function capitalizar(texto) {
  if (!texto) return texto; // si viene vacío, lo devolvemos tal cual
  return texto.charAt(0).toUpperCase() + texto.slice(1);
  /*
    charAt(0)   → primer caracter
    toUpperCase() → lo convierte a mayúscula
    slice(1)    → el resto del string desde la posición 1
  */
}
