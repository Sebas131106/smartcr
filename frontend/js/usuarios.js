// ============================================================
// js/usuarios.js — Gestión de usuarios
// ============================================================

let todosLosUsuarios = [];
let idEliminar = null;

document.addEventListener("DOMContentLoaded", cargarUsuarios);

async function cargarUsuarios() {
    try {
        todosLosUsuarios = await apiRequest("/usuarios");
        renderizarTabla(todosLosUsuarios);
    } catch (error) {
        mostrarToast("Error al cargar usuarios: " + error.message, "error");
    }
}

function renderizarTabla(lista) {
    const tbody = document.getElementById("tablaUsuarios");

    if (lista.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--texto-muted);padding:30px;">No hay usuarios registrados</td></tr>`;
        return;
    }

    tbody.innerHTML = lista.map(u => `
        <tr>
            <td class="fw-600">${u.nombre}</td>
            <td>${u.correo}</td>
            <td><span class="badge ${u.rol === 'Administrador' ? 'badge-info' : 'badge-gris'}">${u.rol}</span></td>
            <td>${u.activo
                ? '<span class="badge badge-exito">Activo</span>'
                : '<span class="badge badge-peligro">Inactivo</span>'}</td>
            <td style="color:var(--texto-muted);font-size:12px;">${formatFecha(u.fecha_creacion)}</td>
            <td>
                <div class="d-flex gap-2">
                    <button class="btn btn-ghost btn-sm" onclick="abrirModalEditar(${u.id_usuario})">
                        <i class="ti ti-pencil"></i> Editar
                    </button>
                    <button class="btn btn-peligro btn-sm" onclick="abrirModalEliminar(${u.id_usuario}, '${u.nombre.replace(/'/g,"\\'")}')">
                        <i class="ti ti-user-off"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join("");
}

function filtrarUsuarios(texto) {
    const filtrado = todosLosUsuarios.filter(u =>
        u.nombre.toLowerCase().includes(texto.toLowerCase()) ||
        u.correo.toLowerCase().includes(texto.toLowerCase())
    );
    renderizarTabla(filtrado);
}

// ── Modal: Crear ─────────────────────────────────────────────
function abrirModalCrear() {
    document.getElementById("modalTitulo").textContent    = "Nuevo usuario";
    document.getElementById("usuarioId").value            = "";
    document.getElementById("inputNombre").value          = "";
    document.getElementById("inputCorreo").value          = "";
    document.getElementById("inputContrasena").value      = "";
    document.getElementById("inputRol").value             = "2";
    document.getElementById("grupoContrasena").style.display = "block";
    document.getElementById("modalUsuario").classList.add("abierto");
}

// ── Modal: Editar ────────────────────────────────────────────
function abrirModalEditar(id) {
    const u = todosLosUsuarios.find(x => x.id_usuario === id);
    if (!u) return;

    document.getElementById("modalTitulo").textContent    = "Editar usuario";
    document.getElementById("usuarioId").value            = u.id_usuario;
    document.getElementById("inputNombre").value          = u.nombre;
    document.getElementById("inputCorreo").value          = u.correo;
    document.getElementById("inputContrasena").value      = "";
    document.getElementById("inputRol").value             = u.rol === "Administrador" ? "1" : "2";
    document.getElementById("grupoContrasena").style.display = "none";
    document.getElementById("modalUsuario").classList.add("abierto");
}

function cerrarModal() {
    document.getElementById("modalUsuario").classList.remove("abierto");
}

// ── Guardar ──────────────────────────────────────────────────
async function guardarUsuario() {
    const id         = document.getElementById("usuarioId").value;
    const nombre     = document.getElementById("inputNombre").value.trim();
    const correo     = document.getElementById("inputCorreo").value.trim();
    const contrasena = document.getElementById("inputContrasena").value;
    const id_rol     = document.getElementById("inputRol").value;

    if (!nombre || !correo || (!id && !contrasena)) {
        mostrarToast("Complete todos los campos requeridos", "error");
        return;
    }

    try {
        if (id) {
            await apiRequest(`/usuarios/${id}`, "PUT", { nombre, correo, id_rol });
            mostrarToast("Usuario actualizado correctamente", "exito");
        } else {
            await apiRequest("/usuarios", "POST", { nombre, correo, contrasena, id_rol });
            mostrarToast("Usuario creado correctamente", "exito");
        }
        cerrarModal();
        cargarUsuarios();
    } catch (error) {
        mostrarToast("Error: " + error.message, "error");
    }
}

// ── Modal: Eliminar ──────────────────────────────────────────
function abrirModalEliminar(id, nombre) {
    idEliminar = id;
    document.getElementById("nombreEliminar").textContent = nombre;
    document.getElementById("modalEliminar").classList.add("abierto");
}

function cerrarModalEliminar() {
    document.getElementById("modalEliminar").classList.remove("abierto");
    idEliminar = null;
}

async function confirmarEliminar() {
    try {
        await apiRequest(`/usuarios/${idEliminar}`, "DELETE");
        mostrarToast("Usuario desactivado correctamente", "exito");
        cerrarModalEliminar();
        cargarUsuarios();
    } catch (error) {
        mostrarToast("Error: " + error.message, "error");
    }
}
