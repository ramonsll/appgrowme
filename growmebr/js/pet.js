// pet.js - VERSÃO ATUALIZADA COM FIRESTORE
import { userDataManager } from "./user-data.js";

// Elementos da página
const spanPontos = document.getElementById('pontos-pet');
const barraProgresso = document.getElementById('progresso-pet'); // Use o ID do HTML
const textoNivel = document.querySelector('.container-nivel span.d-block'); // Pega o "Nível 1"
const imgPinguim = document.querySelector('.pinguin');

// IDs extras para os números embaixo da barra (vamos atualizar eles também)
// Se quiser que eles mudem, adicione IDs no HTML ou use seletores de posição:
const metaInferior = document.querySelector('.container-nivel .justify-content-between span:first-child');
const metaSuperior = document.querySelector('.container-nivel .justify-content-between span:last-child');

// Configurações do sistema de níveis
const METAS_NIVEIS = [100, 300, 500, 750, 1000];
const IMAGENS_NIVEIS = {
    1: "../img/babypinguin.png",
    2: "pinguim_nivel2.png",
    3: "pinguim_nivel3.png",
    4: "pinguim_nivel4.png",  // Adicione suas imagens
    5: "pinguim_nivel5.png",  // Adicione suas imagens
    max: "pinguim_maximo.png"  // Adicione sua imagem
};

// Calcular nível baseado nos pontos
function calcularNivel(pontos) {
    let nivel = 1;
    let pontosBaseAnterior = 0;
    let pontosProximoNivel = METAS_NIVEIS[0];

    for (let i = 0; i < METAS_NIVEIS.length; i++) {
        if (pontos >= METAS_NIVEIS[i]) {
            nivel = i + 2;
            pontosBaseAnterior = METAS_NIVEIS[i];
            pontosProximoNivel = METAS_NIVEIS[i + 1] || METAS_NIVEIS[i];
        } else {
            pontosProximoNivel = METAS_NIVEIS[i];
            break;
        }
    }

    // Calcular progresso no nível atual
    let progresso = 0;
    if (nivel > 5) {
        progresso = 100;
        nivel = "max";
    } else {
        const totalParaSubir = pontosProximoNivel - pontosBaseAnterior;
        const progressoRelativo = pontos - pontosBaseAnterior;
        progresso = (progressoRelativo / totalParaSubir) * 100;
    }

    return { nivel, progresso, pontos };
}

// Atualizar interface do pet
function atualizarInterfacePet(dadosUsuario) {
    if (!dadosUsuario) return;

    // Atualizar nome do pet (mantenha sua lógica)
    if (spanNomePet) {
        spanNomePet.textContent = dadosUsuario.pet?.nome || "Clique para definir";
    }

    // Obter pontos totais
    let pontos = dadosUsuario.historicoMetas?.totalConcluidas || 0;

    // Calcular nível e os limites para a barra
    const { nivel, progresso } = calcularNivel(pontos);
    
    // Descobrir quais são os limites de pontos para este nível específico
    let minPontos = 0;
    let maxPontos = METAS_NIVEIS[0];
    
    if (nivel !== "max") {
        const indexNivel = (nivel === "max" ? 5 : nivel) - 1;
        minPontos = indexNivel === 0 ? 0 : METAS_NIVEIS[indexNivel - 1];
        maxPontos = METAS_NIVEIS[indexNivel] || METAS_NIVEIS[METAS_NIVEIS.length - 1];
    }

    // --- ATUALIZAÇÃO DA INTERFACE ---
    
    if (spanPontos) spanPontos.textContent = pontos;

    // AQUI ESTAVA O ERRO: Atualizando a largura da barra do Bootstrap
    if (barraProgresso) {
        barraProgresso.style.width = `${progresso}%`;
        barraProgresso.setAttribute('aria-valuenow', Math.floor(progresso));
    }

    // Atualiza o texto "Nível X" em cima da barra
    if (textoNivel) {
        textoNivel.textContent = nivel === "max" ? "NÍVEL MÁXIMO" : `NÍVEL ${nivel}`;
    }

    // Atualiza os números 0 e 100 para os valores reais do nível atual
    if (metaInferior) metaInferior.textContent = minPontos;
    if (metaSuperior) metaSuperior.textContent = nivel === "max" ? "∞" : maxPontos;

    // Atualizar imagem do pinguim
    if (imgPinguim) {
        const imagemNivel = IMAGENS_NIVEIS[nivel] || IMAGENS_NIVEIS[1];
        if (imgPinguim.src !== imagemNivel) {
            imgPinguim.src = imagemNivel;
            // Efeito de animação
            imgPinguim.classList.add('animar-pulo');
            setTimeout(() => {
                imgPinguim.classList.remove('animar-pulo');
            }, 500);
        }
    }
    console.log("METAS:", metas);
}

// ====== EDITAR NOME DO PET ======

const spanNomePet = document.getElementById("nome-pet");
const btnEditarPet = document.getElementById("btnEditarPet");

function ativarEdicaoPet() {
    if (!spanNomePet || spanNomePet.querySelector('input')) return;

    const nomeAtual = spanNomePet.textContent.trim();
    
    // Criar input para edição
    const input = document.createElement('input');
    input.type = 'text';
    // Se for o texto padrão, limpa o input para o usuário digitar do zero
    input.value = (nomeAtual === "Clique para alterar o nome" || nomeAtual === "Clique para definir") ? "" : nomeAtual;
    input.classList.add('input-nome-edicao');
    input.spellcheck = false;

    // Ajustar largura dinâmica (igual ao perfil)
    input.style.width = (input.value.length + 1) + "ch";
    input.addEventListener('input', () => {
        input.style.width = (input.value.length + 1) + "ch";
    });

    // Limpar span e injetar input
    spanNomePet.innerHTML = '';
    spanNomePet.appendChild(input);
    input.focus();

    // Função interna para salvar e encerrar edição
    const encerrarEdicao = async () => {
        const novoNome = input.value.trim() || "Meu Pet";
        await userDataManager.atualizarNomePet(novoNome);
        
        // O onSnapshot do userDataManager vai atualizar o texto via atualizarInterfacePet,
        // mas vamos limpar o input agora para uma transição fluida
        spanNomePet.textContent = novoNome;
    };

    // Salvar ao pressionar Enter
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            encerrarEdicao();
        }
    });

    // Salvar ao clicar fora
    input.addEventListener('blur', encerrarEdicao);
}

// Configurar ouvintes de clique
if (btnEditarPet) {
    btnEditarPet.addEventListener('click', (e) => {
        e.preventDefault();
        ativarEdicaoPet();
    });
}

// Permitir clique direto no nome também
if (spanNomePet) {
    spanNomePet.addEventListener('click', ativarEdicaoPet);
}

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    // Escutar atualizações dos dados
    userDataManager.adicionarListener(atualizarInterfacePet);

    // Verificar autenticação
    setTimeout(() => {
        if (!userDataManager.userId) {
            console.warn("Usuário não autenticado. Redirecionando...");
            window.location.href = "home.html";
        }
    }, 1000);
});


