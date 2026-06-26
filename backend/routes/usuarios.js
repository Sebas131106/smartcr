// ============================================================
// routes/usuarios.js — Gestión de usuarios
// ============================================================

const express  = require("express");
const router   = express.Router();
const db       = require("../config/db");
const bcrypt   = require("bcryptjs");

// GET / — Listar usuarios
router.get("/", async (req, res) => {
    try {
        const [usuarios] = await db.query(`
            SELECT u.id_usuario, u.nombre, u.correo, u.activo,
                   u.fecha_creacion, r.nombre_rol AS rol
            FROM usuarios u
            JOIN roles r ON u.id_rol = r.id_rol
            ORDER BY u.nombre
        `);
        res.json(usuarios);
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: "Error al obtener usuarios" });
    }
});

// POST / — Crear usuario
router.post("/", async (req, res) => {
    const { nombre, correo, contrasena, id_rol } = req.body;

    if (!nombre || !correo || !contrasena || !id_rol) {
        return res.status(400).json({ mensaje: "Todos los campos son requeridos" });
    }

    try {
        const hash = await bcrypt.hash(contrasena, 10);
        await db.query(
            `INSERT INTO usuarios (nombre, correo, contrasena, id_rol) VALUES (?, ?, ?, ?)`,
            [nombre, correo, hash, id_rol]
        );
        res.json({ mensaje: "Usuario creado correctamente" });
    } catch (error) {
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(400).json({ mensaje: "El correo ya está registrado" });
        }
        console.error(error);
        res.status(500).json({ mensaje: "Error al crear usuario" });
    }
});

// PUT /:id — Actualizar usuario
router.put("/:id", async (req, res) => {
    const { nombre, correo, id_rol } = req.body;
    try {
        await db.query(
            `UPDATE usuarios SET nombre = ?, correo = ?, id_rol = ? WHERE id_usuario = ?`,
            [nombre, correo, id_rol, req.params.id]
        );
        res.json({ mensaje: "Usuario actualizado correctamente" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: "Error al actualizar usuario" });
    }
});

// DELETE /:id — Desactivar usuario
router.delete("/:id", async (req, res) => {
    try {
        await db.query(`UPDATE usuarios SET activo = 0 WHERE id_usuario = ?`, [req.params.id]);
        res.json({ mensaje: "Usuario desactivado correctamente" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: "Error al desactivar usuario" });
    }
});

module.exports = router;
