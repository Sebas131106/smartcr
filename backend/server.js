// ============================================================
// server.js — Servidor principal SmartCR
// ============================================================

require("dotenv").config();

const express = require("express");
const cors    = require("cors");
const path    = require("path");

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middlewares ──────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Archivos estáticos (frontend) ───────────────────────────
app.use(express.static(path.join(__dirname, "../frontend")));

// ── Rutas de la API ──────────────────────────────────────────
app.use("/api/login",      require("./routes/login"));
app.use("/api/dashboard",  require("./routes/dashboard"));
app.use("/api/productos",  require("./routes/productos"));
app.use("/api/ventas",     require("./routes/ventas"));
app.use("/api/usuarios",   require("./routes/usuarios"));
app.use("/api/inventario", require("./routes/inventario"));

// ── Ruta raíz ────────────────────────────────────────────────
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/login.html"));
});

// ── Ruta no encontrada ───────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({ mensaje: "Ruta no encontrada" });
});

// ── Error global ─────────────────────────────────────────────
app.use((err, req, res, next) => {
    console.error("Error no manejado:", err);
    res.status(500).json({ mensaje: "Error interno del servidor" });
});

// ── Iniciar servidor ─────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`\n
        SmartCR corriendo en http://localhost:${PORT}`);
    console.log(`API disponible en http://localhost:${PORT}/api`);
    console.log(`Login en http://localhost:${PORT}/login.html\n`);
});