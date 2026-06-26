// ============================================================
// routes/productos.js — CRUD completo (categoría y proveedor opcionales)
// ============================================================

const express = require("express");
const router  = express.Router();
const db      = require("../config/db");

// GET / — Listar todos los productos activos
router.get("/", async (req, res) => {
    try {
        const [productos] = await db.query(`
            SELECT
                p.id_producto,
                p.nombre,
                p.descripcion,
                p.precio_compra,
                p.precio_venta,
                p.stock_actual,
                p.stock_minimo,
                c.nombre  AS categoria,
                pr.nombre AS proveedor
            FROM productos p
            LEFT JOIN categorias  c  ON p.id_categoria = c.id_categoria
            LEFT JOIN proveedores pr ON p.id_proveedor  = pr.id_proveedor
            WHERE p.activo = 1
            ORDER BY p.nombre ASC
        `);
        res.json(productos);
    } catch (error) {
        console.error("Error al listar productos:", error);
        res.status(500).json({ mensaje: "Error al obtener productos" });
    }
});

// GET /categorias — Listar categorías para el selector
router.get("/categorias", async (req, res) => {
    try {
        const [cats] = await db.query(`SELECT id_categoria, nombre FROM categorias ORDER BY nombre`);
        res.json(cats);
    } catch (error) {
        res.status(500).json({ mensaje: "Error al obtener categorías" });
    }
});

// GET /proveedores — Listar proveedores para el selector
router.get("/proveedores", async (req, res) => {
    try {
        const [provs] = await db.query(`SELECT id_proveedor, nombre FROM proveedores WHERE activo = 1 ORDER BY nombre`);
        res.json(provs);
    } catch (error) {
        res.status(500).json({ mensaje: "Error al obtener proveedores" });
    }
});

// GET /:id — Obtener un producto
router.get("/:id", async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT * FROM productos WHERE id_producto = ? AND activo = 1`,
            [req.params.id]
        );
        if (rows.length === 0) return res.status(404).json({ mensaje: "Producto no encontrado" });
        res.json(rows[0]);
    } catch (error) {
        console.error("Error al obtener producto:", error);
        res.status(500).json({ mensaje: "Error al obtener el producto" });
    }
});

// POST / — Crear producto
// Categoría y proveedor son OPCIONALES — se guardan como NULL si no se envían
router.post("/", async (req, res) => {
    try {
        const {
            nombre,
            descripcion,
            precioCompra,
            precioVenta,
            stock,
            stockMinimo,
            id_categoria,   // puede venir vacío
            id_proveedor    // puede venir vacío
        } = req.body;

        if (!nombre || !precioVenta) {
            return res.status(400).json({ mensaje: "Nombre y precio de venta son requeridos" });
        }

        // Convertir vacío o undefined a NULL para evitar errores de FK
        const categoriaVal = id_categoria ? parseInt(id_categoria) : null;
        const proveedorVal = id_proveedor ? parseInt(id_proveedor) : null;

        await db.query(`
            INSERT INTO productos
                (nombre, descripcion, precio_compra, precio_venta,
                 stock_actual, stock_minimo, id_categoria, id_proveedor)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            nombre,
            descripcion || null,
            parseFloat(precioCompra) || 0,
            parseFloat(precioVenta),
            parseInt(stock)        || 0,
            parseInt(stockMinimo)  || 5,
            categoriaVal,
            proveedorVal
        ]);

        res.json({ mensaje: "Producto agregado correctamente" });

    } catch (error) {
        console.error("Error al crear producto:", error);
        res.status(500).json({ mensaje: "Error al agregar producto: " + error.message });
    }
});

// PUT /:id — Actualizar producto
router.put("/:id", async (req, res) => {
    try {
        const {
            nombre, descripcion, precioCompra, precioVenta,
            stock, stockMinimo, id_categoria, id_proveedor
        } = req.body;

        if (!nombre || !precioVenta) {
            return res.status(400).json({ mensaje: "Nombre y precio de venta son requeridos" });
        }

        const categoriaVal = id_categoria ? parseInt(id_categoria) : null;
        const proveedorVal = id_proveedor ? parseInt(id_proveedor) : null;

        const [result] = await db.query(`
            UPDATE productos SET
                nombre        = ?,
                descripcion   = ?,
                precio_compra = ?,
                precio_venta  = ?,
                stock_actual  = ?,
                stock_minimo  = ?,
                id_categoria  = ?,
                id_proveedor  = ?
            WHERE id_producto = ? AND activo = 1
        `, [
            nombre,
            descripcion || null,
            parseFloat(precioCompra) || 0,
            parseFloat(precioVenta),
            parseInt(stock)       || 0,
            parseInt(stockMinimo) || 5,
            categoriaVal,
            proveedorVal,
            req.params.id
        ]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ mensaje: "Producto no encontrado" });
        }

        res.json({ mensaje: "Producto actualizado correctamente" });

    } catch (error) {
        console.error("Error al actualizar producto:", error);
        res.status(500).json({ mensaje: "Error al actualizar producto: " + error.message });
    }
});

// DELETE /:id — Eliminación lógica
router.delete("/:id", async (req, res) => {
    try {
        const [result] = await db.query(
            `UPDATE productos SET activo = 0 WHERE id_producto = ?`,
            [req.params.id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ mensaje: "Producto no encontrado" });
        }
        res.json({ mensaje: "Producto eliminado correctamente" });
    } catch (error) {
        console.error("Error al eliminar producto:", error);
        res.status(500).json({ mensaje: "Error al eliminar producto" });
    }
});

module.exports = router;
