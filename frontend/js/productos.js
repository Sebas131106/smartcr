// ============================================================
// js/productos.js — CRUD completo con categorías y proveedores
// ============================================================

const API = "http://localhost:3000/api/productos";

let todosLosProductos = [];
let idEliminar = null;

document.addEventListener("DOMContentLoaded", () => {
    cargarProductos();
    cargarSelectores();
});

// ── Cargar productos ─────────────────────────────────────────
async function cargarProductos() {
    try {
        const res = await fetch(API);
        todosLosProductos = await res.json();
        renderizarTabla(todosLosProductos);
    } catch (error) {
        mostrarToast("Error al cargar productos", "error");
    }
}

function renderizarTabla(lista) {
    const tbody   = document.getElementById("tablaProductos");
    const contador = document.getElementById("contadorProductos");
    contador.textContent = `${lista.length} productos`;

    if (lista.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;color:var(--texto-muted);padding:30px;">No hay productos registrados</td></tr>`;
        return;
    }

    tbody.innerHTML = lista.map(p => `
        <tr>
            <td class="texto-muted">#${p.id_producto}</td>
            <td class="fw-600">${p.nombre}</td>
            <td>${p.categoria ?? '<span class="texto-muted">—</span>'}</td>
            <td>${p.proveedor ?? '<span class="texto-muted">—</span>'}</td>
            <td>₡${Number(p.precio_venta).toLocaleString("es-CR")}</td>
            <td>
                <span class="fw-600">${p.stock_actual}</span>
                <span class="texto-muted" style="font-size:12px;"> / mín. ${p.stock_minimo ?? 5}</span>
            </td>
            <td>${badgeStock(p.stock_actual, p.stock_minimo)}</td>
            <td>
                <div class="d-flex gap-2">
                    <button class="btn btn-ghost btn-sm" onclick="abrirModalEditar(${p.id_producto})">
                        <i class="ti ti-pencil"></i> Editar
                    </button>
                    <button class="btn btn-peligro btn-sm" onclick="abrirModalEliminar(${p.id_producto}, '${p.nombre.replace(/'/g,"\\'")}')">
                        <i class="ti ti-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join("");
}

function badgeStock(stock, minimo) {
    const min = minimo ?? 5;
    if (stock === 0)  return '<span class="badge badge-peligro">Agotado</span>';
    if (stock <= min) return '<span class="badge badge-advertencia">Stock bajo</span>';
    return '<span class="badge badge-exito">Normal</span>';
}

// ── Cargar categorías y proveedores en los selects del modal ─
async function cargarSelectores() {
    try {
        const [cats, provs] = await Promise.all([
            fetch(`${API}/categorias`).then(r => r.json()),
            fetch(`${API}/proveedores`).then(r => r.json())
        ]);

        const selectCat  = document.getElementById("selectCategoria");
        const selectProv = document.getElementById("selectProveedor");

        if (selectCat) {
            selectCat.innerHTML = `<option value="">Sin categoría</option>` +
                cats.map(c => `<option value="${c.id_categoria}">${c.nombre}</option>`).join("");
        }

        if (selectProv) {
            selectProv.innerHTML = `<option value="">Sin proveedor</option>` +
                provs.map(p => `<option value="${p.id_proveedor}">${p.nombre}</option>`).join("");
        }

    } catch (_) {
        // Selectores opcionales, no bloquea el flujo
    }
}

// ── Búsqueda ─────────────────────────────────────────────────
function buscarProducto(texto) {
    const filtrado = todosLosProductos.filter(p =>
        p.nombre.toLowerCase().includes(texto.toLowerCase())
    );
    renderizarTabla(filtrado);
}

// ── Modal: Crear ─────────────────────────────────────────────
function abrirModalCrear() {
    document.getElementById("modalTitulo").textContent = "Nuevo producto";
    document.getElementById("productoId").value        = "";
    document.getElementById("nombre").value            = "";
    document.getElementById("descripcion").value       = "";
    document.getElementById("precioCompra").value      = "";
    document.getElementById("precioVenta").value       = "";
    document.getElementById("stock").value             = "";
    document.getElementById("stockMinimo").value       = "5";
    const sc = document.getElementById("selectCategoria");
    const sp = document.getElementById("selectProveedor");
    if (sc) sc.value = "";
    if (sp) sp.value = "";
    document.getElementById("modalProducto").classList.add("abierto");
}

// ── Modal: Editar ────────────────────────────────────────────
function abrirModalEditar(id) {
    const p = todosLosProductos.find(x => x.id_producto === id);
    if (!p) return;

    document.getElementById("modalTitulo").textContent = "Editar producto";
    document.getElementById("productoId").value        = p.id_producto;
    document.getElementById("nombre").value            = p.nombre;
    document.getElementById("descripcion").value       = p.descripcion ?? "";
    document.getElementById("precioCompra").value      = p.precio_compra ?? "";
    document.getElementById("precioVenta").value       = p.precio_venta;
    document.getElementById("stock").value             = p.stock_actual;
    document.getElementById("stockMinimo").value       = p.stock_minimo ?? 5;
    document.getElementById("modalProducto").classList.add("abierto");
}

function cerrarModal() {
    document.getElementById("modalProducto").classList.remove("abierto");
}

// ── Guardar ──────────────────────────────────────────────────
async function guardarProducto() {
    const id     = document.getElementById("productoId").value;
    const nombre = document.getElementById("nombre").value.trim();
    const precio = document.getElementById("precioVenta").value;

    if (!nombre || !precio) {
        mostrarToast("Nombre y precio de venta son obligatorios", "error");
        return;
    }

    const sc = document.getElementById("selectCategoria");
    const sp = document.getElementById("selectProveedor");

    const body = {
        nombre,
        descripcion:  document.getElementById("descripcion").value.trim(),
        precioCompra: parseFloat(document.getElementById("precioCompra").value) || 0,
        precioVenta:  parseFloat(precio),
        stock:        parseInt(document.getElementById("stock").value) || 0,
        stockMinimo:  parseInt(document.getElementById("stockMinimo").value) || 5,
        id_categoria: sc?.value || null,
        id_proveedor: sp?.value || null
    };

    try {
        const url    = id ? `${API}/${id}` : API;
        const method = id ? "PUT" : "POST";

        const res  = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });

        const datos = await res.json();
        if (!res.ok) throw new Error(datos.mensaje || "Error al guardar");

        mostrarToast(datos.mensaje, "exito");
        cerrarModal();
        cargarProductos();

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
        const res   = await fetch(`${API}/${idEliminar}`, { method: "DELETE" });
        const datos = await res.json();
        if (!res.ok) throw new Error(datos.mensaje);
        mostrarToast(datos.mensaje, "exito");
        cerrarModalEliminar();
        cargarProductos();
    } catch (error) {
        mostrarToast("Error: " + error.message, "error");
    }
}

// ── Toast ────────────────────────────────────────────────────
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
