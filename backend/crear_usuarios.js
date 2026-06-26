// ============================================================
// crear_usuarios.js
// Crea o actualiza TODOS los usuarios con contraseñas hasheadas
// Ejecutar desde la carpeta backend:
//   node crear_usuarios.js
// ============================================================

require("dotenv").config();
const bcrypt = require("bcryptjs");
const mysql  = require("mysql2/promise");

// ── Lista de usuarios a crear / actualizar ───────────────────
// Puedes agregar más usuarios aquí
const USUARIOS = [
    {
        nombre:     "Administrador SmartCR",
        correo:     "admin@smartcr.com",
        contrasena: "Admin1234",
        id_rol:     1   // 1 = Administrador
    },
    {
        nombre:     "Cajero Principal",
        correo:     "cajero@smartcr.com",
        contrasena: "Cajero1234",
        id_rol:     2   // 2 = Cajero
    }
];

async function main() {
    const db = await mysql.createConnection({
        host:     process.env.DB_HOST     || "localhost",
        user:     process.env.DB_USER     || "root",
        password: process.env.DB_PASSWORD || "",
        database: process.env.DB_NAME     || "smartcr_db",
        port:     process.env.DB_PORT     || 3306
    });

    console.log("✅ Conectado a MySQL\n");
    console.log("👤 Procesando usuarios...\n");

    for (const u of USUARIOS) {
        const hash = await bcrypt.hash(u.contrasena, 10);

        const [rows] = await db.execute(
            "SELECT id_usuario FROM usuarios WHERE correo = ?",
            [u.correo]
        );

        if (rows.length > 0) {
            await db.execute(
                "UPDATE usuarios SET nombre = ?, contrasena = ?, id_rol = ?, activo = 1 WHERE correo = ?",
                [u.nombre, hash, u.id_rol, u.correo]
            );
            console.log(`🔄 Actualizado:  ${u.correo}  →  contraseña: ${u.contrasena}`);
        } else {
            await db.execute(
                "INSERT INTO usuarios (nombre, correo, contrasena, id_rol, activo) VALUES (?, ?, ?, ?, 1)",
                [u.nombre, u.correo, hash, u.id_rol]
            );
            console.log(`✅ Creado:       ${u.correo}  →  contraseña: ${u.contrasena}`);
        }
    }

    // Mostrar tabla final
    const [todos] = await db.execute(
        `SELECT u.id_usuario, u.nombre, u.correo, u.activo, r.nombre_rol AS rol
         FROM usuarios u JOIN roles r ON u.id_rol = r.id_rol
         ORDER BY u.id_usuario`
    );

    console.log("\n📋 Usuarios en la base de datos:");
    console.table(todos);

    console.log("\n✅ Listo. Usa estas credenciales para entrar:\n");
    USUARIOS.forEach(u => {
        console.log(`   ${u.correo}  /  ${u.contrasena}`);
    });
    console.log("");

    await db.end();
}

main().catch(err => {
    console.error("\n❌ Error:", err.message);
    process.exit(1);
});
