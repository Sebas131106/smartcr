// ============================================================
// js/utils.js — Funciones compartidas en todas las páginas
// ============================================================

const API_BASE = "http://localhost:3000/api";

// Petición al backend
async function apiRequest(endpoint, method = "GET", body = null) {
    const opciones = {
        method,
        headers: { "Content-Type": "application/json" }
    };
    if (body) opciones.body = JSON.stringify(body);
    const res  = await fetch(`${API_BASE}${endpoint}`, opciones);
    const data = await res.json();
    if (!res.ok) throw new Error(data.mensaje || "Error en la solicitud");
    return data;
}

// Formato moneda colones
function formatColones(monto) {
    return "₡" + Number(monto).toLocaleString("es-CR", { minimumFractionDigits: 0 });
}

// Formato fecha
function formatFecha(iso) {
    if (!iso) return "—";
    const d = new Date(iso);
    return d.toLocaleDateString("es-CR", { day: "2-digit", month: "2-digit", year: "numeric" })
         + " " + d.toLocaleTimeString("es-CR", { hour: "2-digit", minute: "2-digit" });
}

// Toast de notificación
function mostrarToast(mensaje, tipo = "info") {
    const contenedor = document.getElementById("toastContenedor");
    if (!contenedor) return;
    const iconos = { exito: "ti-circle-check", error: "ti-circle-x", info: "ti-info-circle" };
    const toast  = document.createElement("div");
    toast.className = `toast ${tipo}`;
    toast.innerHTML = `<i class="ti ${iconos[tipo] || iconos.info}"></i> ${mensaje}`;
    contenedor.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
}

// Badge de stock
function badgeStock(stock, minimo) {
    const min = minimo ?? 5;
    if (stock === 0)  return '<span class="badge badge-peligro">Agotado</span>';
    if (stock <= min) return '<span class="badge badge-advertencia">Stock bajo</span>';
    return '<span class="badge badge-exito">Normal</span>';
}

// Cargar datos del usuario en el sidebar
function cargarSidebar() {
    const usuario = JSON.parse(localStorage.getItem("smartcr_usuario") || "{}");
    const nombre  = usuario.nombre || "Usuario";
    const rol     = usuario.rol    || "—";
    const el = (id) => document.getElementById(id);

    if (el("usuarioNombre")) el("usuarioNombre").textContent = nombre;
    if (el("usuarioRol"))    el("usuarioRol").textContent    = rol;
    if (el("avatarIniciales")) {
        const partes = nombre.trim().split(" ");
        el("avatarIniciales").textContent = (partes[0][0] + (partes[1]?.[0] || "")).toUpperCase();
    }
}

// Proteger páginas (redirige si no hay sesión)
function protegerPagina() {
    const usuario = localStorage.getItem("smartcr_usuario");
    if (!usuario) {
        window.location.href = "login.html";
    }
}

// Cerrar sesión
function cerrarSesion() {
    localStorage.removeItem("smartcr_usuario");
    window.location.href = "login.html";
}

// Ejecutar al cargar cualquier página protegida
document.addEventListener("DOMContentLoaded", () => {
    protegerPagina();
    cargarSidebar();

    // Mostrar fecha actual en dashboard
    const el = document.getElementById("fechaHoy");
    if (el) {
        el.textContent = new Date().toLocaleDateString("es-CR", {
            weekday: "long", day: "numeric", month: "long", year: "numeric"
        });
    }
});
