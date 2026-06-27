function fazerLogin() {
    const usuario = document.getElementById("usuario").value.trim();
    const senha = document.getElementById("senha").value.trim();
    const erro = document.getElementById("erroLogin");

    if (usuario === "admin" && senha === "1234") {
        localStorage.setItem("yzatLogado", "sim");
        localStorage.setItem("yzatUsuario", usuario);

        window.location.href = "index.html";
    } else {
        erro.innerText = "Usuário ou senha incorretos.";
    }
}