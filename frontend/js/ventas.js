// ============================================================
// js/ventas.js — Registro y consulta de ventas
// ============================================================

let todasLasVentas = [];
let productosDisponibles = [];
let carrito = [];

document.addEventListener("DOMContentLoaded", () => {
    cargarVentas();
    cargarProductosParaVenta();
});

// ── Cargar ventas ────────────────────────────────────────────
async function cargarVentas() {
    try {
        todasLasVentas = await apiRequest("/ventas");
        renderizarVentas(todasLasVentas);
        calcularMetricas(todasLasVentas);
    } catch (error) {
        mostrarToast("Error al cargar ventas: " + error.message, "error");
    }
}

function renderizarVentas(lista) {
    const tbody = document.getElementById("tablaVentas");

    if (lista.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--texto-muted);padding:30px;">No hay ventas registradas</td></tr>`;
        return;
    }

    tbody.innerHTML = lista.map(v => `
        <tr>
            <td class="texto-muted fw-600">#${v.id_venta}</td>
            <td>${v.cajero}</td>
            <td class="fw-600">${formatColones(v.total)}</td>
            <td>${v.estado === "completada"
                ? '<span class="badge badge-exito">Completada</span>'
                : '<span class="badge badge-peligro">Anulada</span>'}</td>
            <td style="color:var(--texto-muted);font-size:12px;">${formatFecha(v.fecha_venta)}</td>
            <td>
                <button class="btn btn-ghost btn-sm" onclick="verDetalle(${v.id_venta})">
                    <i class="ti ti-eye"></i> Ver
                </button>
            </td>
        </tr>
    `).join("");
}

function calcularMetricas(lista) {
    const hoy = new Date().toDateString();
    const ventasHoy = lista.filter(v => new Date(v.fecha_venta).toDateString() === hoy);
    const monto = ventasHoy.reduce((acc, v) => acc + Number(v.total), 0);

    document.getElementById("ventasHoy").textContent  = ventasHoy.length;
    document.getElementById("montoHoy").textContent   = formatColones(monto);
    document.getElementById("totalVentas").textContent = lista.length;
}

// ── Cargar productos para el selector ───────────────────────
async function cargarProductosParaVenta() {
    try {
        productosDisponibles = await apiRequest("/productos");
        const select = document.getElementById("selectProducto");
        select.innerHTML = `<option value="">Seleccione un producto...</option>` +
            productosDisponibles.map(p =>
                `<option value="${p.id_producto}" data-precio="${p.precio_venta}" data-stock="${p.stock_actual}">
                    ${p.nombre} — ${formatColones(p.precio_venta)} (stock: ${p.stock_actual})
                </option>`
            ).join("");
    } catch (error) {
        mostrarToast("Error al cargar productos: " + error.message, "error");
    }
}

// ── Modal nueva venta ────────────────────────────────────────
function abrirModalVenta() {
    carrito = [];
    renderizarCarrito();
    document.getElementById("modalVenta").classList.add("abierto");
}

function cerrarModalVenta() {
    document.getElementById("modalVenta").classList.remove("abierto");
    carrito = [];
}

function agregarAlCarrito() {
    const select   = document.getElementById("selectProducto");
    const cantidad = parseInt(document.getElementById("cantidadProducto").value);
    const id       = parseInt(select.value);

    if (!id || !cantidad || cantidad < 1) {
        mostrarToast("Seleccione un producto y una cantidad válida", "error");
        return;
    }

    const option = select.options[select.selectedIndex];
    const precio = parseFloat(option.getAttribute("data-precio"));
    const stock  = parseInt(option.getAttribute("data-stock"));
    const nombre = productosDisponibles.find(p => p.id_producto === id)?.nombre || "";

    // Verificar stock disponible
    const enCarrito = carrito.find(c => c.id_producto === id);
    const cantidadTotal = (enCarrito?.cantidad || 0) + cantidad;

    if (cantidadTotal > stock) {
        mostrarToast(`Stock insuficiente. Disponible: ${stock}`, "error");
        return;
    }

    if (enCarrito) {
        enCarrito.cantidad += cantidad;
        enCarrito.subtotal  = enCarrito.cantidad * precio;
    } else {
        carrito.push({ id_producto: id, nombre, precio_unitario: precio, cantidad, subtotal: precio * cantidad });
    }

    renderizarCarrito();
    document.getElementById("selectProducto").value     = "";
    document.getElementById("cantidadProducto").value   = "1";
}

function quitarDelCarrito(id) {
    carrito = carrito.filter(c => c.id_producto !== id);
    renderizarCarrito();
}

function renderizarCarrito() {
    const tbody = document.getElementById("carritoVenta");
    const totalEl = document.getElementById("totalVentaModal");

    if (carrito.length === 0) {
        tbody.innerHTML = `<tr id="carritoVacio"><td colspan="5" style="text-align:center;color:var(--texto-muted);padding:16px;">Agregue productos a la venta</td></tr>`;
        totalEl.textContent = "₡0";
        return;
    }

    tbody.innerHTML = carrito.map(item => `
        <tr>
            <td class="fw-600">${item.nombre}</td>
            <td>${formatColones(item.precio_unitario)}</td>
            <td>${item.cantidad}</td>
            <td>${formatColones(item.subtotal)}</td>
            <td>
                <button class="btn btn-peligro btn-sm" onclick="quitarDelCarrito(${item.id_producto})">
                    <i class="ti ti-trash"></i>
                </button>
            </td>
        </tr>
    `).join("");

    const total = carrito.reduce((acc, c) => acc + c.subtotal, 0);
    totalEl.textContent = formatColones(total);
}

async function confirmarVenta() {
    if (carrito.length === 0) {
        mostrarToast("Agregue al menos un producto a la venta", "error");
        return;
    }

    const usuario = JSON.parse(localStorage.getItem("smartcr_usuario") || "{}");
    const items   = carrito.map(c => ({ id_producto: c.id_producto, cantidad: c.cantidad }));

    try {
        const res = await apiRequest("/ventas", "POST", {
            id_usuario: usuario.id_usuario || 1,
            items
        });
        mostrarToast(`Venta #${res.id_venta} registrada — Total: ${formatColones(res.total)}`, "exito");
        cerrarModalVenta();
        cargarVentas();
    } catch (error) {
        mostrarToast("Error al registrar venta: " + error.message, "error");
    }
}

// ── Detalle de venta ─────────────────────────────────────────
async function verDetalle(id) {
    const contenido = document.getElementById("contenidoDetalle");
    contenido.innerHTML = "Cargando...";
    document.getElementById("modalDetalle").classList.add("abierto");

    try {
        const v = await apiRequest(`/ventas/${id}`);
        contenido.innerHTML = `
            <div style="margin-bottom:14px;">
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px;">
                    <div><span class="texto-muted">Venta #</span><strong>${v.id_venta}</strong></div>
                    <div><span class="texto-muted">Cajero:</span> ${v.cajero}</div>
                    <div><span class="texto-muted">Fecha:</span> ${formatFecha(v.fecha_venta)}</div>
                    <div><span class="texto-muted">Estado:</span> ${v.estado}</div>
                </div>
                <div class="tabla-wrapper">
                    <table class="tabla">
                        <thead><tr><th>Producto</th><th>Cant.</th><th>Precio</th><th>Subtotal</th></tr></thead>
                        <tbody>
                            ${v.detalle.map(d => `
                                <tr>
                                    <td>${d.producto}</td>
                                    <td>${d.cantidad}</td>
                                    <td>${formatColones(d.precio_unitario)}</td>
                                    <td>${formatColones(d.subtotal)}</td>
                                </tr>
                            `).join("")}
                        </tbody>
                    </table>
                </div>
                <div style="text-align:right;margin-top:14px;font-size:18px;font-weight:700;color:var(--verde);">
                    Total: ${formatColones(v.total)}
                </div>
            </div>
        `;
    } catch (error) {
        contenido.innerHTML = `<p style="color:var(--rojo);">Error al cargar el detalle.</p>`;
    }
}

function cerrarModalDetalle() {
    document.getElementById("modalDetalle").classList.remove("abierto");
}
