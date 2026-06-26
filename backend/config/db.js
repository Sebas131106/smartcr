// ============================================================
// config/db.js — Conexión a MySQL usando pool de conexiones
// ============================================================

const mysql = require("mysql2/promise");
require("dotenv").config();

const pool = mysql.createPool({
    host:             process.env.DB_HOST     || "localhost",
    user:             process.env.DB_USER     || "root",
    password:         process.env.DB_PASSWORD || "",
    database:         process.env.DB_NAME     || "smartcr_db",
    port:             process.env.DB_PORT     || 3306,
    waitForConnections: true,
    connectionLimit:    10,
});

// Verificar conexión al iniciar
pool.getConnection()
    .then(conn => {
        console.log("Conexión a MySQL establecida");
        conn.release();
    })
    .catch(err => {
        console.error("Error conectando a MySQL:", err.message);
        process.exit(1);
    });

module.exports = pool;
