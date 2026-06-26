// ============================================================
// js/dashboard.js — Carga de métricas del panel principal
// ============================================================

document.addEventListener("DOMContentLoaded", cargarDashboard);

async function cargarDashboard() {
    try {
        const data = await apiRequest("/dashboard");

        // Métricas
        document.getElementById("totalProductos").textContent = data.total_productos;
        document.getElementById("ventasHoy").textContent      = data.ventas_hoy.cantidad;
        document.getElementById("montoHoy").textContent       = formatColones(data.ventas_hoy.monto_total);
        document.getElementById("stockBajo").textContent      = data.stock_bajo;
        document.getElementById("agotados").textContent       = data.agotados;

        // Tabla más vendidos
        const tbMasVendidos = document.getElementById("tablaMasVendidos");
        if (data.mas_vendidos.length === 0) {
            tbMasVendidos.innerHTML = `<tr><td colspan="3" style="text-align:center;color:var(--texto-muted);padding:16px;">Sin ventas aún</td></tr>`;
        } else {
            tbMasVendidos.innerHTML = data.mas_vendidos.map(p => `
                <tr>
                    <td class="fw-600">${p.nombre}</td>
                    <td>${p.total_vendido} uds.</td>
                    <td>${formatColones(p.ingreso_total)}</td>
                </tr>
            `).join("");
        }

        // Tabla movimientos
        const tbMov = document.getElementById("tablaMovimientos");
        if (data.movimientos_recientes.length === 0) {
            tbMov.innerHTML = `<tr><td colspan="4" style="text-align:center;color:var(--texto-muted);padding:16px;">Sin movimientos</td></tr>`;
        } else {
            tbMov.innerHTML = data.movimientos_recientes.map(m => `
                <tr>
                    <td>${badgeTipo(m.tipo_movimiento)}</td>
                    <td>${m.producto}</td>
                    <td>${m.cantidad}</td>
                    <td style="color:var(--texto-muted);font-size:12px;">${formatFecha(m.fecha)}</td>
                </tr>
            `).join("");
        }

    } catch (error) {
        mostrarToast("Error al cargar el dashboard: " + error.message, "error");
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
