// ============================================================
// js/inventario.js — Control de inventario y movimientos
// ============================================================

let todosLosProductos = [];

document.addEventListener("DOMContentLoaded", () => {
    cargarInventario();
    cargarMovimientos();
});

// ── Cargar inventario ────────────────────────────────────────
async function cargarInventario() {
    try {
        todosLosProductos = await apiRequest("/productos");
        renderizarInventario(todosLosProductos);
        actualizarMetricas(todosLosProductos);
        poblarSelectAjuste(todosLosProductos);
    } catch (error) {
        mostrarToast("Error al cargar inventario: " + error.message, "error");
    }
}

function renderizarInventario(lista) {
    const tbody   = document.getElementById("tablaInventario");
    const contador = document.getElementById("contadorItems");
    contador.textContent = `${lista.length} productos`;

    if (lista.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--texto-muted);padding:30px;">No hay productos</td></tr>`;
        return;
    }

    tbody.innerHTML = lista.map(p => `
        <tr>
            <td class="fw-600">${p.nombre}</td>
            <td>${p.categoria ?? '<span class="texto-muted">—</span>'}</td>
            <td>
                <span class="fw-600" style="font-size:16px;">${p.stock_actual}</span>
                <span class="texto-muted" style="font-size:12px;"> unidades</span>
            </td>
            <td>${p.stock_minimo ?? 5}</td>
            <td>${badgeStock(p.stock_actual, p.stock_minimo)}</td>
            <td>
                <button class="btn btn-ghost btn-sm" onclick="abrirModalAjusteProducto(${p.id_producto})">
                    <i class="ti ti-adjustments"></i> Ajustar
                </button>
            </td>
        </tr>
    `).join("");
}

function actualizarMetricas(lista) {
    const total   = lista.length;
    const bajo    = lista.filter(p => p.stock_actual > 0 && p.stock_actual <= (p.stock_minimo ?? 5)).length;
    const agotado = lista.filter(p => p.stock_actual === 0).length;
    const normal  = total - bajo - agotado;

    document.getElementById("totalProductos").textContent = total;
    document.getElementById("stockNormal").textContent    = normal;
    document.getElementById("stockBajo").textContent      = bajo;
    document.getElementById("agotados").textContent       = agotado;
}

// ── Filtros ──────────────────────────────────────────────────
function filtrarTabla() {
    const texto  = document.getElementById("inputBusqueda").value.toLowerCase();
    const estado = document.getElementById("filtroEstado").value;

    const filtrado = todosLosProductos.filter(p => {
        const coincideTexto  = p.nombre.toLowerCase().includes(texto);
        const stockActual    = p.stock_actual;
        const stockMinimo    = p.stock_minimo ?? 5;

        let coincideEstado = true;
        if (estado === "normal")  coincideEstado = stockActual > stockMinimo;
        if (estado === "bajo")    coincideEstado = stockActual > 0 && stockActual <= stockMinimo;
        if (estado === "agotado") coincideEstado = stockActual === 0;

        return coincideTexto && coincideEstado;
    });

    renderizarInventario(filtrado);
}

// ── Cargar historial de movimientos ─────────────────────────
async function cargarMovimientos() {
    try {
        const movimientos = await apiRequest("/inventario/movimientos");
        const tbody = document.getElementById("tablaMovimientos");

        if (movimientos.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:var(--texto-muted);padding:20px;">Sin movimientos registrados</td></tr>`;
            return;
        }

        tbody.innerHTML = movimientos.map(m => `
            <tr>
                <td>${badgeTipo(m.tipo_movimiento)}</td>
                <td>${m.producto}</td>
                <td>${m.cantidad}</td>
                <td>${m.stock_anterior}</td>
                <td>${m.stock_nuevo}</td>
                <td>${m.motivo ?? "—"}</td>
                <td style="color:var(--texto-muted);font-size:12px;">${formatFecha(m.fecha)}</td>
            </tr>
        `).join("");
    } catch (_) {
        document.getElementById("tablaMovimientos").innerHTML =
            `<tr><td colspan="7" style="text-align:center;color:var(--texto-muted);padding:20px;">Sin movimientos registrados</td></tr>`;
    }
}

function badgeTipo(tipo) {
    const mapa = {
        entrada: '<span class="badge badge-exito">Entrada</span>',
        salida:  '<span class="badge badge-peligro">Salida</span>',
        ajuste:  '<span class="badge badge-advertencia">Ajuste</span>'
    };
    return mapa[tipo] || tipo;
}

// ── Modal ajuste ─────────────────────────────────────────────
function poblarSelectAjuste(lista) {
    const select = document.getElementById("ajusteProducto");
    select.innerHTML = `<option value="">Seleccione un producto...</option>` +
        lista.map(p => `<option value="${p.id_producto}">${p.nombre} (stock: ${p.stock_actual})</option>`).join("");
}

function abrirModalAjuste() {
    document.getElementById("ajusteCantidad").value = "";
    document.getElementById("ajusteMotivo").value   = "";
    document.getElementById("modalAjuste").classList.add("abierto");
}

function abrirModalAjusteProducto(id) {
    const select = document.getElementById("ajusteProducto");
    select.value = id;
    document.getElementById("ajusteCantidad").value = "";
    document.getElementById("ajusteMotivo").value   = "";
    document.getElementById("modalAjuste").classList.add("abierto");
}

function cerrarModalAjuste() {
    document.getElementById("modalAjuste").classList.remove("abierto");
}

async function guardarAjuste() {
    const id_producto = document.getElementById("ajusteProducto").value;
    const tipo        = document.getElementById("ajusteTipo").value;
    const cantidad    = parseInt(document.getElementById("ajusteCantidad").value);
    const motivo      = document.getElementById("ajusteMotivo").value.trim();

    if (!id_producto || !cantidad || cantidad < 1) {
        mostrarToast("Seleccione un producto e ingrese una cantidad válida", "error");
        return;
    }

    try {
        await apiRequest("/inventario/ajuste", "POST", { id_producto, tipo, cantidad, motivo });
        mostrarToast("Ajuste registrado correctamente", "exito");
        cerrarModalAjuste();
        cargarInventario();
        cargarMovimientos();
    } catch (error) {
        mostrarToast("Error: " + error.message, "error");
    }
}
