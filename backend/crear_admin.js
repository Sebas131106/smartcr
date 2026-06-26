// ============================================================
// crear_admin.js
// Ejecutar UNA SOLA VEZ desde la carpeta backend:
//   node crear_admin.js
//
// Este script hace 3 cosas:
// 1. Genera el hash bcrypt de la contraseña
// 2. Actualiza el usuario admin@smartcr.com en la BD
// 3. Si no existe, lo crea
// ============================================================

require("dotenv").config();
const bcrypt = require("bcryptjs");
const mysql  = require("mysql2/promise");

// ── Configuración del usuario admin ──────────────────────────
const ADMIN = {
    nombre:    "Administrador SmartCR",
    correo:    "admin@smartcr.com",
    contrasena: "Admin1234",   // ← Cambia esto si quieres otra contraseña
    id_rol:    1
};

async function main() {
    console.log("\n🔐 Generando hash de contraseña...");
    const hash = await bcrypt.hash(ADMIN.contrasena, 10);
    console.log("✅ Hash generado:", hash);

    // Conectar a la BD
    const db = await mysql.createConnection({
        host:     process.env.DB_HOST     || "localhost",
        user:     process.env.DB_USER     || "root",
        password: process.env.DB_PASSWORD || "",
        database: process.env.DB_NAME     || "smartcr_db",
        port:     process.env.DB_PORT     || 3306
    });

    console.log("✅ Conectado a MySQL\n");

    // Verificar si el usuario ya existe
    const [rows] = await db.execute(
        "SELECT id_usuario FROM usuarios WHERE correo = ?",
        [ADMIN.correo]
    );

    if (rows.length > 0) {
        // Actualizar contraseña
        await db.execute(
            "UPDATE usuarios SET contrasena = ?, activo = 1, nombre = ? WHERE correo = ?",
            [hash, ADMIN.nombre, ADMIN.correo]
        );
        console.log(`✅ Contraseña actualizada para: ${ADMIN.correo}`);
    } else {
        // Crear usuario nuevo
        await db.execute(
            "INSERT INTO usuarios (nombre, correo, contrasena, id_rol, activo) VALUES (?, ?, ?, ?, 1)",
            [ADMIN.nombre, ADMIN.correo, hash, ADMIN.id_rol]
        );
        console.log(`✅ Usuario creado: ${ADMIN.correo}`);
    }

    // Mostrar resumen
    const [usuario] = await db.execute(
        `SELECT u.id_usuario, u.nombre, u.correo, u.activo, r.nombre_rol
         FROM usuarios u JOIN roles r ON u.id_rol = r.id_rol
         WHERE u.correo = ?`,
        [ADMIN.correo]
    );

    console.log("\n📋 Usuario en la base de datos:");
    console.table(usuario);

    console.log("─────────────────────────────────────");
    console.log("🚀 Ahora puedes iniciar sesión con:");
    console.log(`   Correo:     ${ADMIN.correo}`);
    console.log(`   Contraseña: ${ADMIN.contrasena}`);
    console.log("─────────────────────────────────────\n");

    await db.end();
}

main().catch(err => {
    console.error("\n❌ Error:", err.message);
    process.exit(1);
});
