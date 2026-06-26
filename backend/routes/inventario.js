// ============================================================
// routes/inventario.js — Movimientos y ajustes de inventario
// ============================================================

const express = require("express");
const router  = express.Router();
const db      = require("../config/db");

// GET /movimientos — Historial completo de movimientos
router.get("/movimientos", async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT m.id_movimiento, m.tipo_movimiento, m.cantidad,
                   m.stock_anterior, m.stock_nuevo, m.motivo, m.fecha,
                   p.nombre AS producto, u.nombre AS usuario
            FROM movimientos_inventario m
            JOIN productos p ON m.id_producto = p.id_producto
            JOIN usuarios  u ON m.id_usuario  = u.id_usuario
            ORDER BY m.fecha DESC
            LIMIT 100
        `);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: "Error al obtener movimientos" });
    }
});

// POST /ajuste — Registrar entrada o ajuste manual de stock
router.post("/ajuste", async (req, res) => {
    const { id_producto, tipo, cantidad, motivo } = req.body;

    if (!id_producto || !tipo || !cantidad || cantidad < 1) {
        return res.status(400).json({ mensaje: "Datos incompletos para el ajuste" });
    }

    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        // Obtener stock actual
        const [[producto]] = await conn.query(
            `SELECT stock_actual FROM productos WHERE id_producto = ? AND activo = 1`,
            [id_producto]
        );

        if (!producto) throw new Error("Producto no encontrado");

        const stockAnterior = producto.stock_actual;
        const stockNuevo    = tipo === "entrada"
            ? stockAnterior + parseInt(cantidad)
            : parseInt(cantidad); // En ajuste manual, el valor es el stock nuevo directo

        // Actualizar stock
        await conn.query(
            `UPDATE productos SET stock_actual = ? WHERE id_producto = ?`,
            [stockNuevo, id_producto]
        );

        // Registrar movimiento (id_usuario 1 = admin por defecto si no hay sesión)
        await conn.query(`
            INSERT INTO movimientos_inventario
                (id_producto, id_usuario, tipo_movimiento, cantidad, stock_anterior, stock_nuevo, motivo)
            VALUES (?, 1, ?, ?, ?, ?, ?)
        `, [id_producto, tipo, cantidad, stockAnterior, stockNuevo, motivo || "Ajuste manual"]);

        await conn.commit();
        res.json({ mensaje: "Ajuste registrado correctamente", stock_nuevo: stockNuevo });

    } catch (error) {
        await conn.rollback();
        console.error(error);
        res.status(500).json({ mensaje: error.message || "Error al registrar ajuste" });
    } finally {
        conn.release();
    }
});

module.exports = router;
