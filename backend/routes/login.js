// ============================================================
// routes/login.js — Autenticación real con bcrypt
// ============================================================

const express  = require("express");
const router   = express.Router();
const db       = require("../config/db");
const bcrypt   = require("bcryptjs");

// POST /api/login
router.post("/", async (req, res) => {
    const { correo, contrasena } = req.body;

    if (!correo || !contrasena) {
        return res.status(400).json({ mensaje: "Correo y contraseña son requeridos" });
    }

    try {
        const [rows] = await db.query(`
            SELECT u.id_usuario, u.nombre, u.correo, u.contrasena,
                   u.id_rol, r.nombre_rol
            FROM usuarios u
            JOIN roles r ON u.id_rol = r.id_rol
            WHERE u.correo = ? AND u.activo = 1
        `, [correo]);

        if (rows.length === 0) {
            return res.status(401).json({ mensaje: "Credenciales incorrectas" });
        }

        const usuario = rows[0];

        // Comparar contraseña con bcrypt
        const passwordValida = await bcrypt.compare(contrasena, usuario.contrasena);

        if (!passwordValida) {
            return res.status(401).json({ mensaje: "Credenciales incorrectas" });
        }

        res.json({
            mensaje: "Inicio de sesión exitoso",
            usuario: {
                id_usuario: usuario.id_usuario,
                nombre:     usuario.nombre,
                correo:     usuario.correo,
                rol:        usuario.nombre_rol,
                id_rol:     usuario.id_rol
            }
        });

    } catch (error) {
        console.error("Error en login:", error);
        res.status(500).json({ mensaje: "Error interno del servidor" });
    }
});

module.exports = router;
