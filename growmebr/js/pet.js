// pet.js - VERSÃO ATUALIZADA COM FIRESTORE
import { userDataManager } from "./user-data.js";

// Elementos da página
const spanPontos = document.getElementById('pontos-pet');
const barraProgresso = document.querySelector('.progresso');
const textoNivel = document.querySelector('.textoNivel');
const imgPinguim = document.querySelector('.pinguin');

// Configurações do sistema de níveis
const METAS_NIVEIS = [100, 300, 500, 750, 1000];
const IMAGENS_NIVEIS = {
    1: "babypinguin.png",
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
    
    // Obter pontos das metas concluídas
    const metas = dadosUsuario.metas || {};
    let pontos = 0;
    
    Object.values(metas).forEach(dia => {
        if (Array.isArray(dia)) {
            pontos += dia.filter(meta => meta.concluida).length;
        }
    });
    
    // Atualizar dados do pet (se necessário)
    const dadosPetAtuais = dadosUsuario.pet || { nome: "", nivel: 1, pontos: 0 };
    if (dadosPetAtuais.pontos !== pontos) {
        userDataManager.atualizarPet({
            ...dadosPetAtuais,
            pontos: pontos
        });
    }
    
    // Calcular nível
    const { nivel, progresso } = calcularNivel(pontos);
    
    // Atualizar elementos da tela
    if (spanPontos) spanPontos.textContent = pontos;
    if (barraProgresso) barraProgresso.style.width = `${progresso}%`;
    
    if (textoNivel) {
        if (nivel === "max") {
            textoNivel.textContent = "NÍVEL MÁXIMO";
        } else {
            textoNivel.textContent = `NÍVEL ${nivel}`;
        }
    }
    
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