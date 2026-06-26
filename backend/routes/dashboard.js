// ============================================================
// routes/dashboard.js — Métricas del panel principal
// ============================================================

const express = require("express");
const router  = express.Router();
const db      = require("../config/db");

router.get("/", async (req, res) => {
    try {
        const [[{ total_productos }]] = await db.query(
            `SELECT COUNT(*) AS total_productos FROM productos WHERE activo = 1`
        );

        const [[ventasHoy]] = await db.query(`
            SELECT COUNT(*) AS total_ventas, COALESCE(SUM(total), 0) AS monto_total
            FROM ventas
            WHERE estado = 'completada' AND DATE(fecha_venta) = CURDATE()
        `);

        const [[{ stock_bajo }]] = await db.query(
            `SELECT COUNT(*) AS stock_bajo FROM productos WHERE stock_actual <= stock_minimo AND activo = 1`
        );

        const [[{ agotados }]] = await db.query(
            `SELECT COUNT(*) AS agotados FROM productos WHERE stock_actual = 0 AND activo = 1`
        );

        const [mas_vendidos] = await db.query(`
            SELECT p.nombre, SUM(dv.cantidad) AS total_vendido, SUM(dv.subtotal) AS ingreso_total
            FROM detalle_ventas dv
            JOIN productos p ON dv.id_producto = p.id_producto
            JOIN ventas v    ON dv.id_venta    = v.id_venta
            WHERE v.estado = 'completada'
            GROUP BY p.id_producto, p.nombre
            ORDER BY total_vendido DESC
            LIMIT 5
        `);

        const [movimientos] = await db.query(`
            SELECT m.tipo_movimiento, m.cantidad, m.fecha,
                   p.nombre AS producto, u.nombre AS usuario
            FROM movimientos_inventario m
            JOIN productos p ON m.id_producto = p.id_producto
            JOIN usuarios  u ON m.id_usuario  = u.id_usuario
            ORDER BY m.fecha DESC
            LIMIT 8
        `);

        res.json({
            total_productos,
            ventas_hoy: {
                cantidad:    ventasHoy.total_ventas,
                monto_total: ventasHoy.monto_total
            },
            stock_bajo,
            agotados,
            mas_vendidos,
            movimientos_recientes: movimientos
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: "Error al obtener datos del dashboard" });
    }
});

module.exports = router;
