// perfil.js - VERSÃO ATUALIZADA COM FIRESTORE
import { userDataManager } from "./user-data.js";

// Elementos da página
const spanNome = document.getElementById('nome-usuario');
const btnEditar = document.getElementById('btn-editar-nome');
const contadorCadastradas = document.getElementById('contador-cadastradas');
const contadorConcluidas = document.getElementById('contador-concluidas');

// Função para atualizar a interface com os dados do usuário
function atualizarInterface(dadosUsuario) {
    if (!dadosUsuario) return;

    // 1. Atualizar nome
    if (spanNome) {
        spanNome.textContent = dadosUsuario.nome || "Usuário";
    }

    // 2. Atualizar contadores pelo HISTÓRICO
    if (contadorCadastradas || contadorConcluidas) {

        const historico = dadosUsuario.historicoMetas || {
            totalCriadas: 0,
            totalConcluidas: 0
        };

        const total = historico.totalCriadas;
        const concluidas = historico.totalConcluidas;

        if (contadorCadastradas) {
            contadorCadastradas.textContent = total;
        }

        if (contadorConcluidas) {
            contadorConcluidas.textContent = concluidas;
        }
    }
}


// Função para editar nome
function ativarEdicaoNome() {
    if (!spanNome) return;

    const nomeAtual = spanNome.textContent;

    // Criar input para edição
    const input = document.createElement('input');
    input.type = 'text';
    input.value = nomeAtual;
    input.classList.add('input-nome-edicao');
    input.spellcheck = false;

    // Ajustar largura
    input.style.width = (nomeAtual.length + 1) + "ch";
    input.addEventListener('input', () => {
        input.style.width = (input.value.length + 1) + "ch";
    });

    // Substituir span por input
    spanNome.innerHTML = '';
    spanNome.appendChild(input);
    input.focus();

    // Salvar ao pressionar Enter
    input.addEventListener('keydown', async (e) => {
        if (e.key === 'Enter') {
            const novoNome = input.value.trim();
            await userDataManager.atualizarNome(novoNome || "Usuário");
            input.blur();
        }
    });

    // Salvar ao clicar fora
    input.addEventListener('blur', async () => {
        const novoNome = input.value.trim();
        await userDataManager.atualizarNome(novoNome || "Usuário");
    });
}

// Configurar botão de edição
if (btnEditar) {
    btnEditar.addEventListener('click', (e) => {
        e.preventDefault();
        ativarEdicaoNome();
    });
}

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    // Escutar atualizações dos dados
    userDataManager.adicionarListener(atualizarInterface);

    // Verificar autenticação
    setTimeout(() => {
        if (!userDataManager.userId) {
            console.warn("Usuário não autenticado. Redirecionando...");
            window.location.href = "home.html";
        }
    }, 1000);
});

// Exportar para uso no HTML
window.ativarEdicaoNome = ativarEdicaoNome;
