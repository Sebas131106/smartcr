// ============================================================
// routes/ventas.js — Registro y consulta de ventas
// ============================================================

const express = require("express");
const router  = express.Router();
const db      = require("../config/db");

// GET / — Historial de ventas
router.get("/", async (req, res) => {
    try {
        const [ventas] = await db.query(`
            SELECT v.id_venta, v.total, v.fecha_venta, v.estado,
                   u.nombre AS cajero
            FROM ventas v
            JOIN usuarios u ON v.id_usuario = u.id_usuario
            ORDER BY v.fecha_venta DESC
            LIMIT 100
        `);
        res.json(ventas);
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: "Error al obtener ventas" });
    }
});

// GET /:id — Detalle de una venta
router.get("/:id", async (req, res) => {
    try {
        const [venta] = await db.query(
            `SELECT v.*, u.nombre AS cajero FROM ventas v
             JOIN usuarios u ON v.id_usuario = u.id_usuario
             WHERE v.id_venta = ?`,
            [req.params.id]
        );
        if (venta.length === 0) return res.status(404).json({ mensaje: "Venta no encontrada" });

        const [detalle] = await db.query(
            `SELECT dv.cantidad, dv.precio_unitario, dv.subtotal, p.nombre AS producto
             FROM detalle_ventas dv
             JOIN productos p ON dv.id_producto = p.id_producto
             WHERE dv.id_venta = ?`,
            [req.params.id]
        );

        res.json({ ...venta[0], detalle });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: "Error al obtener detalle de venta" });
    }
});

// POST / — Registrar nueva venta
// Body: { id_usuario: 1, items: [{ id_producto, cantidad }] }
router.post("/", async (req, res) => {
    const { id_usuario, items } = req.body;

    if (!items || items.length === 0) {
        return res.status(400).json({ mensaje: "La venta debe tener al menos un producto" });
    }

    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        let total = 0;

        // Validar stock y calcular total
        for (const item of items) {
            const [rows] = await conn.query(
                `SELECT precio_venta, stock_actual FROM productos WHERE id_producto = ? AND activo = 1`,
                [item.id_producto]
            );
            if (rows.length === 0) throw new Error(`Producto ${item.id_producto} no encontrado`);
            if (rows[0].stock_actual < item.cantidad) throw new Error(`Stock insuficiente para producto ${item.id_producto}`);

            item.precio_unitario = rows[0].precio_venta;
            item.subtotal = rows[0].precio_venta * item.cantidad;
            total += item.subtotal;
        }

        // Crear encabezado de venta
        const [ventaResult] = await conn.query(
            `INSERT INTO ventas (id_usuario, total) VALUES (?, ?)`,
            [id_usuario || 1, total]
        );
        const id_venta = ventaResult.insertId;

        // Insertar detalle (el trigger actualiza el stock automáticamente)
        for (const item of items) {
            await conn.query(
                `INSERT INTO detalle_ventas (id_venta, id_producto, cantidad, precio_unitario, subtotal)
                 VALUES (?, ?, ?, ?, ?)`,
                [id_venta, item.id_producto, item.cantidad, item.precio_unitario, item.subtotal]
            );
        }

        await conn.commit();
        res.json({ mensaje: "Venta registrada correctamente", id_venta, total });

    } catch (error) {
        await conn.rollback();
        console.error(error);
        res.status(400).json({ mensaje: error.message || "Error al registrar venta" });
    } finally {
        conn.release();
    }
});

module.exports = router;
