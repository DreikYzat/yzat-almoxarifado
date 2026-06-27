const express = require("express");
const cors = require("cors");
const fs = require("fs");

const app = express();
const PORT = 3000;
const DB_PATH = "./db.json";

app.use(cors());
app.use(express.json());

function lerBanco() {
    return JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
}

function salvarBanco(banco) {
    fs.writeFileSync(DB_PATH, JSON.stringify(banco, null, 2));
}

function registrarHistorico(banco, tipo, descricao) {
    if (!banco.historico) {
        banco.historico = [];
    }

    banco.historico.unshift({
        id: Date.now(),
        tipo,
        descricao,
        data: new Date().toLocaleString("pt-BR")
    });
}

app.get("/", (req, res) => {
    res.json({
        mensagem: "API YZAT Almoxarifado funcionando 🚀",
        versao: "2.1"
    });
});

app.get("/produtos", (req, res) => {
    const banco = lerBanco();
    res.json(banco.produtos);
});

app.get("/historico", (req, res) => {
    const banco = lerBanco();
    res.json(banco.historico || []);
});

app.post("/produtos", (req, res) => {
    const { nome, quantidade, localizacao } = req.body;

    if (!nome || !localizacao || quantidade <= 0) {
        return res.status(400).json({
            mensagem: "Dados inválidos."
        });
    }

    const banco = lerBanco();

    const novoProduto = {
        id: Date.now(),
        nome,
        quantidade: Number(quantidade),
        localizacao
    };

    banco.produtos.push(novoProduto);

    registrarHistorico(
        banco,
        "cadastro",
        `Produto cadastrado: ${nome} | Quantidade: ${quantidade} | Localização: ${localizacao}`
    );

    salvarBanco(banco);

    res.status(201).json({
        mensagem: "Produto cadastrado com sucesso",
        produto: novoProduto
    });
});

app.put("/produtos/entrada/:id", (req, res) => {
    const id = Number(req.params.id);
    const { quantidade } = req.body;

    if (!quantidade || quantidade <= 0) {
        return res.status(400).json({
            mensagem: "Quantidade inválida."
        });
    }

    const banco = lerBanco();
    const produto = banco.produtos.find(p => Number(p.id) === id);

    if (!produto) {
        return res.status(404).json({
            mensagem: "Produto não encontrado"
        });
    }

    produto.quantidade += Number(quantidade);

    registrarHistorico(
        banco,
        "entrada",
        `Entrada de ${quantidade} unidade(s) em ${produto.nome}. Estoque atual: ${produto.quantidade}`
    );

    salvarBanco(banco);

    res.json({
        mensagem: "Entrada registrada com sucesso",
        produto
    });
});

app.put("/produtos/saida/:id", (req, res) => {
    const id = Number(req.params.id);
    const { quantidade } = req.body;

    if (!quantidade || quantidade <= 0) {
        return res.status(400).json({
            mensagem: "Quantidade inválida."
        });
    }

    const banco = lerBanco();
    const produto = banco.produtos.find(p => Number(p.id) === id);

    if (!produto) {
        return res.status(404).json({
            mensagem: "Produto não encontrado"
        });
    }

    if (produto.quantidade < quantidade) {
        return res.status(400).json({
            mensagem: "Estoque insuficiente"
        });
    }

    produto.quantidade -= Number(quantidade);

    registrarHistorico(
        banco,
        "saida",
        `Saída de ${quantidade} unidade(s) em ${produto.nome}. Estoque atual: ${produto.quantidade}`
    );

    salvarBanco(banco);

    res.json({
        mensagem: "Saída registrada com sucesso",
        produto
    });
});

app.put("/produtos/:id", (req, res) => {
    const id = Number(req.params.id);
    const { nome, quantidade, localizacao } = req.body;

    if (!nome || !localizacao || quantidade < 0) {
        return res.status(400).json({
            mensagem: "Dados inválidos."
        });
    }

    const banco = lerBanco();
    const produto = banco.produtos.find(p => Number(p.id) === id);

    if (!produto) {
        return res.status(404).json({
            mensagem: "Produto não encontrado"
        });
    }

    const nomeAntigo = produto.nome;
    const quantidadeAntiga = produto.quantidade;
    const localizacaoAntiga = produto.localizacao;

    produto.nome = nome;
    produto.quantidade = Number(quantidade);
    produto.localizacao = localizacao;

    registrarHistorico(
        banco,
        "edicao",
        `Produto editado: ${nomeAntigo} → ${nome} | Quantidade: ${quantidadeAntiga} → ${quantidade} | Localização: ${localizacaoAntiga} → ${localizacao}`
    );

    salvarBanco(banco);

    res.json({
        mensagem: "Produto atualizado com sucesso",
        produto
    });
});

app.delete("/produtos/:id", (req, res) => {
    const id = Number(req.params.id);
    const banco = lerBanco();

    const produto = banco.produtos.find(p => Number(p.id) === id);

    if (!produto) {
        return res.status(404).json({
            mensagem: "Produto não encontrado"
        });
    }

    banco.produtos = banco.produtos.filter(p => Number(p.id) !== id);

    registrarHistorico(
        banco,
        "exclusao",
        `Produto excluído: ${produto.nome} | Quantidade: ${produto.quantidade} | Localização: ${produto.localizacao}`
    );

    salvarBanco(banco);

    res.json({
        mensagem: "Produto removido",
        produto
    });
});

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});