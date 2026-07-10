const formulario = document.getElementById("loginForm");
const usuarioInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const mensaje = document.getElementById("mensaje");

// Si ya hay una sesión iniciada, ir directamente a la tienda
if (localStorage.getItem("token")) {
    window.location.href = "tienda.html";
}

formulario.addEventListener("submit", login);

async function login(event) {

    event.preventDefault();

    const usuario = usuarioInput.value.trim();
    const password = passwordInput.value.trim();

    try {

        const respuesta = await fetch("https://fakestoreapi.com/auth/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                username: usuario,
                password: password
            })
        });

        if (!respuesta.ok) {
            throw new Error("Usuario o contraseña incorrectos.");
        }

        const datos = await respuesta.json();

        localStorage.setItem("token", datos.token);

        const respuestaUsuario = await fetch("https://fakestoreapi.com/users/1");
        const usuarioData = await respuestaUsuario.json();

        localStorage.setItem("usuario", JSON.stringify(usuarioData));

        window.location.href = "tienda.html";

    } catch (error) {
        mensaje.textContent = error.message;
    }
}