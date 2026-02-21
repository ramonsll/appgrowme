import { auth } from "./firebase.js";
import { userDataManager } from "./user-data.js";

// Elementos da tela
const nomeEl = document.getElementById("perfil-nome");
const emailEl = document.getElementById("perfil-email");

// Atualizar interface
function atualizarDados(dados) {
    if (!dados) return;

    // Nome
    if (nomeEl) {
        nomeEl.textContent = dados.nome || "Usuário";
    }

    // Email (vem do Auth, não do Firestore)
    const user = auth.currentUser;

    if (emailEl && user) {
        emailEl.textContent = user.email;
    }
}

// Escutar mudanças
document.addEventListener("DOMContentLoaded", () => {

    userDataManager.adicionarListener(atualizarDados);

    // Proteção: se não estiver logado
    setTimeout(() => {
        if (!userDataManager.userId) {
            window.location.href = "home.html";
        }
    }, 1000);
});