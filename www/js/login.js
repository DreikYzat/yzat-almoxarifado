async function fazerLogin() {
    const usuario = document.getElementById("usuario").value.trim();
    const senha = document.getElementById("senha").value.trim();
    const erro = document.getElementById("erroLogin");

    erro.innerText = "";

    try {
        const resposta = await fetch("https://yzat-almoxarifado.onrender.com/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                usuario,
                senha
            })
        });

        const dados = await resposta.json();

        if (resposta.ok) {
            localStorage.setItem("yzatLogado", "sim");
            localStorage.setItem("yzatUsuario", dados.usuario.nome);
            localStorage.setItem("yzatCargo", dados.usuario.cargo);
            
            window.location.href = "index.html";
        } else {
            erro.innerText = dados.mensagem;
        }

    } catch {
        erro.innerText = "Erro ao conectar com o servidor.";
    }
}