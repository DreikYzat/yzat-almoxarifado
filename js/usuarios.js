const API = "https://yzat-almoxarifado.onrender.com";

function mostrarMensagem(texto, tipo = "sucesso") {
    const msg = document.getElementById("msg");

    msg.style.color = tipo === "sucesso" ? "#22c55e" : "#ef4444";
    msg.innerText = texto;

    setTimeout(() => {
        msg.innerText = "";
    }, 3500);
}

async function criarUsuario() {
    const nome = document.getElementById("nome").value.trim();
    const usuario = document.getElementById("usuario").value.trim();
    const senha = document.getElementById("senha").value.trim();
    const cargo = document.getElementById("cargo").value;

    if (!nome || !usuario || !senha || !cargo) {
        mostrarMensagem("Preencha todos os campos.", "erro");
        return;
    }

    try {
        const resposta = await fetch(`${API}/usuarios`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ nome, usuario, senha, cargo })
        });

        const dados = await resposta.json();

        if (resposta.ok) {
            mostrarMensagem(dados.mensagem || "Usuário cadastrado com sucesso.");

            document.getElementById("nome").value = "";
            document.getElementById("usuario").value = "";
            document.getElementById("senha").value = "";
            document.getElementById("cargo").value = "almoxarife";

            carregarUsuarios();
        } else {
            mostrarMensagem(dados.mensagem || "Erro ao cadastrar usuário.", "erro");
        }

    } catch {
        mostrarMensagem("Erro ao conectar com o servidor.", "erro");
    }
}

async function carregarUsuarios() {
    try {
        const resposta = await fetch(`${API}/usuarios`);
        const usuarios = await resposta.json();

        const lista = document.getElementById("listaUsuarios");
        lista.innerHTML = "";

        if (usuarios.length === 0) {
            lista.innerHTML = "<p>Nenhum usuário cadastrado.</p>";
            return;
        }

        usuarios.forEach(user => {
            lista.innerHTML += `
                <div class="usuario-card">
                    <b>${user.nome}</b><br>
                    Usuário: ${user.usuario}<br>
                    Cargo: ${user.cargo}<br>
                    Status: ${user.ativo ? "🟢 Ativo" : "🔴 Inativo"}
                    <br><br>

                <button onclick='abrirModalEditar($
                {JSON.stringify(user)})'>
                        ✏️ Editar
                    </button>

                    <button onclick="alterarStatus(${user.id})">
                        ${user.ativo ? "🔴 Desativar" : "🟢 Ativar"}
                    </button>

                    <button class="btn-excluir" onclick="abrirModalExcluir(${user.id})">
                        🗑 Excluir
                    </button>
                </div>
            `;
        });

    } catch {
        document.getElementById("listaUsuarios").innerHTML =
            "<p>Erro ao carregar usuários.</p>";
    }
}

function abrirModalEditar(id, nome, usuario, cargo) {
    document.getElementById("editId").value = id;
    document.getElementById("editNome").value = nome;
    document.getElementById("editUsuario").value = usuario;
    document.getElementById("editCargo").value = cargo;

    document.getElementById("modalEditar").classList.add("ativo");
}

function fecharModalEditar() {
    document.getElementById("modalEditar").classList.remove("ativo");
}

async function salvarEdicaoUsuario() {
    const id = document.getElementById("editId").value;
    const nome = document.getElementById("editNome").value.trim();
    const usuario = document.getElementById("editUsuario").value.trim();
    const cargo = document.getElementById("editCargo").value;

    if (!nome || !usuario || !cargo) {
        mostrarMensagem("Preencha todos os campos.", "erro");
        return;
    }

    try {
        const resposta = await fetch(`${API}/usuarios/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ nome, usuario, cargo })
        });

        const dados = await resposta.json();

        if (resposta.ok) {
            fecharModalEditar();
            mostrarMensagem(dados.mensagem || "Usuário atualizado com sucesso.");
            carregarUsuarios();
        } else {
            mostrarMensagem(dados.mensagem || "Erro ao editar usuário.", "erro");
        }

    } catch {
        mostrarMensagem("Erro ao conectar com o servidor.", "erro");
    }
}

async function alterarStatus(id) {
    try {
        const resposta = await fetch(`${API}/usuarios/${id}/status`, {
            method: "PUT"
        });

        const dados = await resposta.json();

        if (resposta.ok) {
            mostrarMensagem(dados.mensagem);
            carregarUsuarios();
        } else {
            mostrarMensagem(dados.mensagem || "Erro ao alterar status.", "erro");
        }

    } catch {
        mostrarMensagem("Erro ao conectar com o servidor.", "erro");
    }
}

function abrirModalExcluir(id) {
    document.getElementById("excluirId").value = id;
    document.getElementById("modalExcluir").classList.add("ativo");
}

function fecharModalExcluir() {
    document.getElementById("modalExcluir").classList.remove("ativo");
}

async function confirmarExcluirUsuario() {
    const id = document.getElementById("excluirId").value;

    try {
        const resposta = await fetch(`${API}/usuarios/${id}`, {
            method: "DELETE"
        });

        const dados = await resposta.json();

        if (resposta.ok) {
            fecharModalExcluir();
            mostrarMensagem(dados.mensagem || "Usuário excluído com sucesso.");
            carregarUsuarios();
        } else {
            mostrarMensagem(dados.mensagem || "Erro ao excluir usuário.", "erro");
        }

    } catch {
        mostrarMensagem("Erro ao conectar com o servidor.", "erro");
    }
}

function abrirModalEditar(user) {
    document.getElementById("modalEditar").style.display = "flex";

    document.getElementById("editId").value = user.id;
    document.getElementById("editNome").value = user.nome;
    document.getElementById("editUsuario").value = user.usuario;
    document.getElementById("editCargo").value = user.cargo;
}

function fecharModalEditar() {
    document.getElementById("modalEditar").style.display = "none";
}

async function salvarEdicaoUsuario() {

    const id = document.getElementById("editId").value;
    const nome = document.getElementById("editNome").value.trim();
    const usuario = document.getElementById("editUsuario").value.trim();
    const cargo = document.getElementById("editCargo").value;

    const resposta = await fetch(`${API}/usuarios/${id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            nome,
            usuario,
            cargo
        })
    });

    const dados = await resposta.json();

    if (resposta.ok) {
        mostrarMensagem("Usuário atualizado com sucesso!");
        fecharModalEditar();
        carregarUsuarios();
    } else {
        mostrarMensagem(dados.mensagem || "Erro ao atualizar usuário.", "erro");
    }
}

carregarUsuarios();