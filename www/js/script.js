if (localStorage.getItem("yzatLogado") !== "sim") {
    window.location.href = "login.html";
}

const API = "https://yzat-almoxarifado.onrender.com";

let graficoEstoque = null;
let produtoSelecionado = null;
let tipoMovimentacao = null;
let produtoEditando = null;
let produtoExcluindo = null;

function obterCargo() {
    return localStorage.getItem("yzatCargo");
}

function ehAdmin() {
    return obterCargo() === "admin";
}

function ehSupervisor() {
    return obterCargo() === "supervisor";
}

function ehAlmoxarife() {
    return obterCargo() === "almoxarife";
}

function abrirMenu() {
    document.getElementById("menuLateral").classList.add("ativo");
}

function fecharMenu() {
    document.getElementById("menuLateral").classList.remove("ativo");
}

function configurarMenuPorCargo() {
    const menuUsuarios = document.getElementById("menuUsuarios");

    if (menuUsuarios && !ehAdmin()) {
        menuUsuarios.style.display = "none";
    }
}

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

    const botaoEditar = ehAdmin() || ehSupervisor()
        ? `<button class="btn-editar" onclick="editarProduto(${produto.id})">✏️ Editar</button>`
        : "";

    const botaoExcluir = ehAdmin()
        ? `<button class="btn-excluir" onclick="excluirProduto(${produto.id})">🗑️ Excluir</button>`
        : "";

    return `
        <div class="produto ${status.classe}">
            <h3>📦 ${produto.nome}</h3>

            <p class="status-estoque">${status.texto}</p>

            <p><strong>Quantidade:</strong> ${produto.quantidade}</p>

            <p><strong>Localização:</strong> ${produto.localizacao}</p>

            <div class="acoes">
                ${botaoEditar}

                <button class="btn-entrada" onclick="abrirModalEstoque(${produto.id}, 'entrada')">
                    ➕ Entrada
                </button>

                <button class="btn-saida" onclick="abrirModalEstoque(${produto.id}, 'saida')">
                    ➖ Saída
                </button>

                ${botaoExcluir}
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
    if (!(ehAdmin() || ehSupervisor())) {
        alert("Você não tem permissão para editar produtos.");
        return;
    }

    const produtos = await buscarProdutos();
    const produto = produtos.find(p => Number(p.id) === Number(id));

    if (!produto) {
        alert("Produto não encontrado.");
        return;
    }

    produtoEditando = id;

    document.getElementById("editarNome").value = produto.nome;
    document.getElementById("editarQuantidade").value = produto.quantidade;
    document.getElementById("editarLocalizacao").value = produto.localizacao;

    document.getElementById("modalEditar").classList.add("ativo");
}

function fecharModalEditar() {
    document.getElementById("modalEditar").classList.remove("ativo");
    produtoEditando = null;
}

async function salvarEdicao() {
    if (!(ehAdmin() || ehSupervisor())) {
        alert("Você não tem permissão para editar produtos.");
        return;
    }

    const nome = document.getElementById("editarNome").value.trim();
    const quantidade = Number(document.getElementById("editarQuantidade").value);
    const localizacao = document.getElementById("editarLocalizacao").value.trim();

    if (nome === "" || quantidade < 0 || localizacao === "") {
        alert("Preencha todos os campos corretamente.");
        return;
    }

    await fetch(`${API}/produtos/${produtoEditando}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            nome,
            quantidade,
            localizacao
        })
    });

    fecharModalEditar();
    atualizarTudo();
}

async function excluirProduto(id) {
    if (!ehAdmin()) {
        alert("Apenas administradores podem excluir produtos.");
        return;
    }

    const produtos = await buscarProdutos();
    const produto = produtos.find(p => Number(p.id) === Number(id));

    if (!produto) {
        alert("Produto não encontrado.");
        return;
    }

    produtoExcluindo = id;

    document.getElementById("textoExcluir").innerText =
        `Deseja realmente excluir o produto "${produto.nome}"?\n\nQuantidade: ${produto.quantidade}\nLocalização: ${produto.localizacao}`;

    document.getElementById("modalExcluir").classList.add("ativo");
}

function fecharModalExcluir() {
    document.getElementById("modalExcluir").classList.remove("ativo");
    produtoExcluindo = null;
}

async function confirmarExclusao() {
    if (!ehAdmin()) {
        alert("Apenas administradores podem excluir produtos.");
        return;
    }

    await fetch(`${API}/produtos/${produtoExcluindo}`, {
        method: "DELETE"
    });

    fecharModalExcluir();
    atualizarTudo();
}

async function abrirModalEstoque(id, tipo) {
    const produtos = await buscarProdutos();
    const produto = produtos.find(p => Number(p.id) === Number(id));

    if (!produto) {
        alert("Produto não encontrado.");
        return;
    }

    produtoSelecionado = id;
    tipoMovimentacao = tipo;

    document.getElementById("modalQuantidade").value = "";

    document.getElementById("modalTitulo").innerText =
        tipo === "entrada"
            ? "Entrada de Estoque"
            : "Saída de Estoque";

    document.getElementById("modalProduto").innerText =
        `📦 ${produto.nome}`;

    document.getElementById("modalEstoque").classList.add("ativo");
}

function fecharModalEstoque() {
    document.getElementById("modalEstoque").classList.remove("ativo");
}

async function confirmarMovimentacao() {
    const quantidade = Number(
        document.getElementById("modalQuantidade").value
    );

    if (!quantidade || quantidade <= 0) {
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
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                quantidade
            })
        }
    );

    if (!resposta.ok) {
        const erro = await resposta.json();
        alert(erro.mensagem);
        return;
    }

    fecharModalEstoque();
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

function sair() {
    localStorage.removeItem("yzatLogado");
    localStorage.removeItem("yzatUsuario");
    localStorage.removeItem("yzatCargo");
    window.location.href = "login.html";
}

function mostrarUsuarioLogado() {
    const usuario = localStorage.getItem("yzatUsuario");
    const cargo = localStorage.getItem("yzatCargo");

    if (usuario) {
        document.getElementById("usuarioLogado").innerText =
            `👤 Bem-vindo, ${usuario} | Cargo: ${cargo}`;
    }
}

mostrarUsuarioLogado();
configurarMenuPorCargo();
atualizarTudo();