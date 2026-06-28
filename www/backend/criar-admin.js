const pool = require("./database");
const bcrypt = require("bcryptjs");

async function criarAdmin() {
    try {
        const nome = "Dreik";
        const usuario = "admin";
        const senhaOriginal = "1234";
        const cargo = "admin";

        const senhaCriptografada = await bcrypt.hash(senhaOriginal, 10);

        const resultado = await pool.query(
            `
            INSERT INTO usuarios (nome, usuario, senha, cargo)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (usuario) DO NOTHING
            RETURNING id, nome, usuario, cargo
            `,
            [nome, usuario, senhaCriptografada, cargo]
        );

        if (resultado.rows.length === 0) {
            console.log("⚠️ Usuário admin já existe.");
        } else {
            console.log("✅ Admin criado com sucesso:");
            console.log(resultado.rows[0]);
        }

        process.exit();
    } catch (erro) {
        console.error("❌ Erro ao criar admin:", erro);
        process.exit(1);
    }
}

criarAdmin();