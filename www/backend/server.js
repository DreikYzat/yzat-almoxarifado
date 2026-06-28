const express = require("express");
const cors = require("cors");
const pool = require("./database");
const bcrypt = require("bcryptjs");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

function formatarData(data) {
    return new Date(data).toLocaleString("pt-BR", {
        timeZone: "America/Sao_Paulo"
    });
}

async function registrarHistorico(tipo, descricao) {
    await pool.query(
        "INSERT INTO historico (tipo, descricao) VALUES ($1, $2)",
        [tipo, descricao]
    );
}

app.get("/", (req, res) => {
    res.json({
        mensagem: "API YZAT Almoxarifado com PostgreSQL funcionando 🚀",
        versao: "3.1"
    });
});

/* LOGIN */

app.post("/login", async (req, res) => {
    const { usuario, senha } = req.body;

    if (!usuario || !senha) {
        return res.status(400).json({
            mensagem: "Usuário e senha são obrigatórios."
        });
    }

    const resultado = await pool.query(
        "SELECT * FROM usuarios WHERE usuario = $1 AND ativo = true",
        [usuario]
    );

    if (resultado.rows.length === 0) {
        return res.status(401).json({
            mensagem: "Usuário ou senha incorretos."
        });
    }

    const user = resultado.rows[0];
    const senhaCorreta = await bcrypt.compare(senha, user.senha);

    if (!senhaCorreta) {
        return res.status(401).json({
            mensagem: "Usuário ou senha incorretos."
        });
    }

    res.json({
        mensagem: "Login realizado com sucesso",
        usuario: {
            id: user.id,
            nome: user.nome,
            usuario: user.usuario,
            cargo: user.cargo
        }
    });
});

/* USUÁRIOS */

app.get("/usuarios", async (req, res) => {
    const resultado = await pool.query(`
        SELECT id, nome, usuario, cargo, ativo, criado_em
        FROM usuarios
        ORDER BY id ASC
    `);

    res.json(resultado.rows);
});

app.post("/usuarios", async (req, res) => {
    const { nome, usuario, senha, cargo } = req.body;

    if (!nome || !usuario || !senha || !cargo) {
        return res.status(400).json({
            mensagem: "Preencha todos os campos."
        });
    }

    const existe = await pool.query(
        "SELECT id FROM usuarios WHERE usuario = $1",
        [usuario]
    );

    if (existe.rows.length > 0) {
        return res.status(400).json({
            mensagem: "Usuário já existe."
        });
    }

    const senhaHash = await bcrypt.hash(senha, 10);

    const resultado = await pool.query(
        `
        INSERT INTO usuarios (nome, usuario, senha, cargo)
        VALUES ($1, $2, $3, $4)
        RETURNING id, nome, usuario, cargo, ativo
        `,
        [nome, usuario, senhaHash, cargo]
    );

    res.status(201).json({
        mensagem: "Usuário cadastrado com sucesso.",
        usuario: resultado.rows[0]
    });
});

app.put("/usuarios/:id", async (req, res) => {
    const id = Number(req.params.id);
    const { nome, usuario, cargo } = req.body;

    if (!nome || !usuario || !cargo) {
        return res.status(400).json({
            mensagem: "Preencha todos os campos."
        });
    }

    const usuarioExiste = await pool.query(
        "SELECT id FROM usuarios WHERE usuario = $1 AND id <> $2",
        [usuario, id]
    );

    if (usuarioExiste.rows.length > 0) {
        return res.status(400).json({
            mensagem: "Este nome de usuário já está em uso."
        });
    }

    const resultado = await pool.query(
        `
        UPDATE usuarios
        SET nome = $1, usuario = $2, cargo = $3
        WHERE id = $4
        RETURNING id, nome, usuario, cargo, ativo
        `,
        [nome, usuario, cargo, id]
    );

    if (resultado.rows.length === 0) {
        return res.status(404).json({
            mensagem: "Usuário não encontrado."
        });
    }

    res.json({
        mensagem: "Usuário atualizado com sucesso.",
        usuario: resultado.rows[0]
    });
});

app.put("/usuarios/:id/status", async (req, res) => {
    const id = Number(req.params.id);

    const usuarioAtual = await pool.query(
        "SELECT ativo FROM usuarios WHERE id = $1",
        [id]
    );

    if (usuarioAtual.rows.length === 0) {
        return res.status(404).json({
            mensagem: "Usuário não encontrado."
        });
    }

    const novoStatus = !usuarioAtual.rows[0].ativo;

    const resultado = await pool.query(
        `
        UPDATE usuarios
        SET ativo = $1
        WHERE id = $2
        RETURNING id, nome, usuario, cargo, ativo
        `,
        [novoStatus, id]
    );

    res.json({
        mensagem: novoStatus ? "Usuário ativado." : "Usuário desativado.",
        usuario: resultado.rows[0]
    });
});

app.delete("/usuarios/:id", async (req, res) => {
    const id = Number(req.params.id);

    const resultado = await pool.query(
        "DELETE FROM usuarios WHERE id = $1 RETURNING id, nome",
        [id]
    );

    if (resultado.rows.length === 0) {
        return res.status(404).json({
            mensagem: "Usuário não encontrado."
        });
    }

    res.json({
        mensagem: "Usuário removido com sucesso."
    });
});

/* PRODUTOS */

app.get("/produtos", async (req, res) => {
    const resultado = await pool.query("SELECT * FROM produtos ORDER BY id ASC");
    res.json(resultado.rows);
});

app.post("/produtos", async (req, res) => {
    const { nome, quantidade, localizacao } = req.body;

    const resultado = await pool.query(
        "INSERT INTO produtos (nome, quantidade, localizacao) VALUES ($1, $2, $3) RETURNING *",
        [nome, quantidade, localizacao]
    );

    const produto = resultado.rows[0];

    await registrarHistorico(
        "cadastro",
        `Produto cadastrado: ${produto.nome} | Quantidade: ${produto.quantidade} | Localização: ${produto.localizacao}`
    );

    res.status(201).json({
        mensagem: "Produto cadastrado com sucesso",
        produto
    });
});

app.put("/produtos/:id", async (req, res) => {
    const id = Number(req.params.id);
    const { nome, quantidade, localizacao } = req.body;

    const resultado = await pool.query(
        `
        UPDATE produtos
        SET nome = $1, quantidade = $2, localizacao = $3
        WHERE id = $4
        RETURNING *
        `,
        [nome, quantidade, localizacao, id]
    );

    if (resultado.rows.length === 0) {
        return res.status(404).json({
            mensagem: "Produto não encontrado"
        });
    }

    const produto = resultado.rows[0];

    await registrarHistorico(
        "edicao",
        `Produto editado: ${produto.nome} | Quantidade: ${produto.quantidade} | Localização: ${produto.localizacao}`
    );

    res.json({
        mensagem: "Produto atualizado",
        produto
    });
});

app.put("/produtos/entrada/:id", async (req, res) => {
    const id = Number(req.params.id);
    const quantidade = Number(req.body.quantidade);

    const existe = await pool.query(
        "SELECT * FROM produtos WHERE id = $1",
        [id]
    );

    if (existe.rows.length === 0) {
        return res.status(404).json({
            mensagem: "Produto não encontrado"
        });
    }

    const produtoAtual = existe.rows[0];
    const novaQuantidade = Number(produtoAtual.quantidade) + quantidade;

    const resultado = await pool.query(
        "UPDATE produtos SET quantidade = $1 WHERE id = $2 RETURNING *",
        [novaQuantidade, id]
    );

    const produto = resultado.rows[0];

    await registrarHistorico(
        "entrada",
        `Entrada de ${quantidade} unidade(s) em ${produto.nome}. Estoque atual: ${produto.quantidade}`
    );

    res.json({
        mensagem: "Entrada registrada",
        produto
    });
});

app.put("/produtos/saida/:id", async (req, res) => {
    const id = Number(req.params.id);
    const quantidade = Number(req.body.quantidade);

    const existe = await pool.query(
        "SELECT * FROM produtos WHERE id = $1",
        [id]
    );

    if (existe.rows.length === 0) {
        return res.status(404).json({
            mensagem: "Produto não encontrado"
        });
    }

    const produtoAtual = existe.rows[0];

    if (Number(produtoAtual.quantidade) < quantidade) {
        return res.status(400).json({
            mensagem: "Estoque insuficiente"
        });
    }

    const novaQuantidade = Number(produtoAtual.quantidade) - quantidade;

    const resultado = await pool.query(
        "UPDATE produtos SET quantidade = $1 WHERE id = $2 RETURNING *",
        [novaQuantidade, id]
    );

    const produto = resultado.rows[0];

    await registrarHistorico(
        "saida",
        `Saída de ${quantidade} unidade(s) em ${produto.nome}. Estoque atual: ${produto.quantidade}`
    );

    res.json({
        mensagem: "Saída registrada",
        produto
    });
});

app.delete("/produtos/:id", async (req, res) => {
    const id = Number(req.params.id);

    const resultado = await pool.query(
        "DELETE FROM produtos WHERE id = $1 RETURNING *",
        [id]
    );

    if (resultado.rows.length === 0) {
        return res.status(404).json({
            mensagem: "Produto não encontrado"
        });
    }

    const produto = resultado.rows[0];

    await registrarHistorico(
        "exclusao",
        `Produto excluído: ${produto.nome} | Quantidade: ${produto.quantidade} | Localização: ${produto.localizacao}`
    );

    res.json({
        mensagem: "Produto removido",
        produto
    });
});

/* HISTÓRICO */

app.get("/historico", async (req, res) => {
    const resultado = await pool.query(`
        SELECT id, tipo, descricao, data
        FROM historico
        ORDER BY id DESC
    `);

    const historico = resultado.rows.map(item => ({
        ...item,
        data: formatarData(item.data)
    }));

    res.json(historico);
});

app.listen(PORT, () => {
    console.log(`Servidor PostgreSQL rodando na porta ${PORT}`);
});