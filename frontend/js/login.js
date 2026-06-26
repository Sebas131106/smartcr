// ============================================================
// js/login.js — Lógica de inicio de sesión
// ============================================================

document.getElementById("btnLogin").addEventListener("click", iniciarSesion);

document.getElementById("contrasena").addEventListener("keydown", function(e) {
    if (e.key === "Enter") iniciarSesion();
});

async function iniciarSesion() {

    const correo     = document.getElementById("correo").value.trim();
    const contrasena = document.getElementById("contrasena").value;
    const btnLogin   = document.getElementById("btnLogin");
    const errorDiv   = document.getElementById("mensajeError");
    const textoError = document.getElementById("textoError");

    // Validar campos
    if (!correo || !contrasena) {
        textoError.textContent = "Por favor complete todos los campos.";
        errorDiv.style.display = "flex";
        return;
    }

    // Estado cargando
    btnLogin.disabled     = true;
    btnLogin.textContent  = "Ingresando...";
    errorDiv.style.display = "none";

    try {
        const respuesta = await fetch("http://localhost:3000/api/login", {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify({ correo, contrasena })
        });

        const datos = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(datos.mensaje || "Credenciales incorrectas");
        }

        // Guardar datos del usuario en localStorage
        localStorage.setItem("smartcr_usuario", JSON.stringify(datos.usuario));

        // Redirigir al dashboard
        window.location.href = "Dashboard.html";

    } catch (error) {
        textoError.textContent  = error.message;
        errorDiv.style.display  = "flex";
        btnLogin.disabled       = false;
        btnLogin.textContent    = "Iniciar sesión";
    }
}
