if (localStorage.getItem("yzatLogado") !== "sim") {
    window.location.href = "login.html";
}

const API = "http://127.0.0.1:3000";
let graficoEstoque = null;

function obterStatusEstoque(quantidade) {
    const qtd = Number(quantidade);

    if (qtd <= 5) {
        return {
            texto: "🔴 Estoque crítico",
            classe: "estoque-critico"
        };
    }

    if (qtd <= 15) {
        return {
            texto: "🟡 Estoque baixo",
            classe: "estoque-baixo"
        };
    }

    return {
        texto: "🟢 Estoque normal",
        classe: "estoque-normal"
    };
}

function criarCardProduto(produto) {
    const status = obterStatusEstoque(produto.quantidade);

    return `
        <div class="produto ${status.classe}">
            <h3>📦 ${produto.nome}</h3>

            <p class="status-estoque">${status.texto}</p>

            <p><strong>Quantidade:</strong> ${produto.quantidade}</p>

            <p><strong>Localização:</strong> ${produto.localizacao}</p>

            <div class="acoes">
                <button class="btn-editar" onclick="editarProduto(${produto.id})">
                    ✏️ Editar
                </button>

                <button class="btn-entrada" onclick="abrirModalEstoque(${produto.id}, 'entrada')">
                    ➕ Entrada
                </button>

                <button class="btn-saida" onclick="abrirModalEstoque(${produto.id}, 'saida')">
                    ➖ Saída
                </button>

                <button class="btn-excluir" onclick="excluirProduto(${produto.id})">
                    🗑️ Excluir
                </button>
            </div>
        </div>
    `;
}

function atualizarDashboard(produtos) {
    let totalEstoque = 0;
    const locais = new Set();

    produtos.forEach(produto => {
        totalEstoque += Number(produto.quantidade);
        locais.add(produto.localizacao);
    });

    document.getElementById("totalProdutos").innerText = produtos.length;
    document.getElementById("totalEstoque").innerText = totalEstoque;
    document.getElementById("totalLocais").innerText = locais.size;
}

function mostrarProdutos(produtos) {
    const lista = document.getElementById("listaProdutos");
    lista.innerHTML = "";

    if (produtos.length === 0) {
        lista.innerHTML = `<p class="vazio">Nenhum produto encontrado.</p>`;
        atualizarDashboard(produtos);
        return;
    }

    produtos.forEach(produto => {
        lista.innerHTML += criarCardProduto(produto);
    });

    atualizarDashboard(produtos);
}

async function buscarProdutos() {
    const resposta = await fetch(`${API}/produtos`);
    return await resposta.json();
}

async function carregarProdutos() {
    const produtos = await buscarProdutos();
    mostrarProdutos(produtos);
    atualizarGrafico(produtos);
}

async function atualizarTudo() {
    await carregarProdutos();
    await carregarHistorico();
}

async function cadastrarProduto() {
    const nome = document.getElementById("nome").value.trim();
    const quantidade = Number(document.getElementById("quantidade").value);
    const localizacao = document.getElementById("localizacao").value.trim();

    if (nome === "" || quantidade <= 0 || localizacao === "") {
        alert("Preencha todos os campos corretamente.");
        return;
    }

    await fetch(`${API}/produtos`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            nome,
            quantidade,
            localizacao
        })
    });

    document.getElementById("nome").value = "";
    document.getElementById("quantidade").value = "";
    document.getElementById("localizacao").value = "";

    atualizarTudo();
}

async function pesquisarProduto() {
    const texto = document
        .getElementById("pesquisa")
        .value
        .toLowerCase()
        .trim();

    const produtos = await buscarProdutos();

    const produtosFiltrados = produtos.filter(produto =>
        produto.nome.toLowerCase().includes(texto)
    );

    mostrarProdutos(produtosFiltrados);
}

async function editarProduto(id) {
    const produtos = await buscarProdutos();
    const produto = produtos.find(p => Number(p.id) === Number(id));

    if (!produto) {
        alert("Produto não encontrado.");
        return;
    }

    const novoNome = prompt("Nome do produto:", produto.nome);
    if (novoNome === null) return;

    const novaQuantidade = Number(prompt("Quantidade:", produto.quantidade));
    if (isNaN(novaQuantidade) || novaQuantidade < 0) {
        alert("Quantidade inválida.");
        return;
    }

    const novaLocalizacao = prompt("Localização:", produto.localizacao);
    if (novaLocalizacao === null) return;

    if (novoNome.trim() === "" || novaLocalizacao.trim() === "") {
        alert("Nome e localização não podem ficar vazios.");
        return;
    }

    await fetch(`${API}/produtos/${id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            nome: novoNome.trim(),
            quantidade: novaQuantidade,
            localizacao: novaLocalizacao.trim()
        })
    });

    atualizarTudo();
}

async function excluirProduto(id) {
    const confirmar = confirm("Deseja realmente excluir este produto?");

    if (!confirmar) return;

    await fetch(`${API}/produtos/${id}`, {
        method: "DELETE"
    });

    atualizarTudo();
}

async function entradaEstoque(id) {
    const quantidade = Number(prompt("Quantas unidades deseja adicionar?"));

    if (!quantidade || quantidade <= 0) {
        alert("Digite uma quantidade válida.");
        return;
    }

    await fetch(`${API}/produtos/entrada/${id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ quantidade })
    });

    atualizarTudo();
}

async function saidaEstoque(id) {
    const quantidade = Number(prompt("Quantas unidades deseja retirar?"));

    if (!quantidade || quantidade <= 0) {
        alert("Digite uma quantidade válida.");
        return;
    }

    const resposta = await fetch(`${API}/produtos/saida/${id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ quantidade })
    });

    if (!resposta.ok) {
        const erro = await resposta.json();
        alert(erro.mensagem);
        return;
    }

    atualizarTudo();
}

async function carregarHistorico() {
    const resposta = await fetch(`${API}/historico`);
    const historico = await resposta.json();

    const lista = document.getElementById("listaHistorico");
    lista.innerHTML = "";

    if (historico.length === 0) {
        lista.innerHTML = `
            <div class="historico-item">
                Nenhuma movimentação encontrada.
            </div>
        `;
        return;
    }

    historico.forEach(item => {
        lista.innerHTML += `
            <div class="historico-item historico-${item.tipo}">
                <strong>${item.data}</strong>
                <br>
                <span>${item.descricao}</span>
            </div>
        `;
    });
}
function abrirModalEstoque(id, tipo){

    produtoSelecionado = id;
    tipoMovimentacao = tipo;

    document.getElementById("modalQuantidade").value = "";

    document.getElementById("modalTitulo").innerText =
        tipo === "entrada"
        ? "Entrada de Estoque"
        : "Saída de Estoque";

    document.getElementById("modalProduto").innerText =
        "Informe a quantidade da movimentação";

    document
        .getElementById("modalEstoque")
        .classList
        .add("ativo");
}

function fecharModalEstoque(){
    document
        .getElementById("modalEstoque")
        .classList
        .remove("ativo");
}

async function confirmarMovimentacao(){

    const quantidade = Number(
        document.getElementById("modalQuantidade").value
    );

    if(!quantidade || quantidade <= 0){
        alert("Digite uma quantidade válida.");
        return;
    }

    const rota =
        tipoMovimentacao === "entrada"
        ? "entrada"
        : "saida";

    const resposta = await fetch(
        `${API}/produtos/${rota}/${produtoSelecionado}`,
        {
            method:"PUT",
            headers:{
                "Content-Type":"application/json"
            },
            body:JSON.stringify({
                quantidade
            })
        }
    );

    if(!resposta.ok){
        const erro = await resposta.json();
        alert(erro.mensagem);
        return;
    }

    fecharModalEstoque();

    atualizarTudo();

}

function sair() {
    localStorage.removeItem("yzatLogado");
    localStorage.removeItem("yzatUsuario");
    window.location.href = "login.html";
}

function mostrarUsuarioLogado() {
    const usuario = localStorage.getItem("yzatUsuario");

    if (usuario) {
        document.getElementById("usuarioLogado").innerText =
            `👤 Bem-vindo, ${usuario}`;
    }
}

async function exportarPDF() {
    const produtos = await buscarProdutos();

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF();

    let y = 20;

    pdf.setFontSize(18);
    pdf.text("YZAT Almoxarifado", 20, y);

    y += 10;

    pdf.setFontSize(12);
    pdf.text("Relatório de Estoque", 20, y);

    y += 10;

    pdf.text(`Data: ${new Date().toLocaleString("pt-BR")}`, 20, y);

    y += 15;

    if (produtos.length === 0) {
        pdf.text("Nenhum produto cadastrado.", 20, y);
    } else {
        produtos.forEach((produto, index) => {
            if (y > 270) {
                pdf.addPage();
                y = 20;
            }

            pdf.text(`${index + 1}. ${produto.nome}`, 20, y);
            y += 7;
            pdf.text(`Quantidade: ${produto.quantidade}`, 25, y);
            y += 7;
            pdf.text(`Localização: ${produto.localizacao}`, 25, y);
            y += 10;
        });
    }

    pdf.save("relatorio-yzat-almoxarifado.pdf");
}

function atualizarGrafico(produtos) {
    const canvas = document.getElementById("graficoEstoque");

    if (!canvas) return;

    const nomes = produtos.map(produto => produto.nome);
    const quantidades = produtos.map(produto => Number(produto.quantidade));

    if (graficoEstoque) {
        graficoEstoque.destroy();
    }

    graficoEstoque = new Chart(canvas, {
        type: "bar",
        data: {
            labels: nomes,
            datasets: [{
                label: "Quantidade em estoque",
                data: quantidades
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    labels: {
                        color: "#ffffff"
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: "#cbd5e1"
                    }
                },
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: "#cbd5e1"
                    }
                }
            }
        }
    });
}

mostrarUsuarioLogado();
atualizarTudo();