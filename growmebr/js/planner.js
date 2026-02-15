// planner.js - VERSÃO FINAL
import { plannerFirestore } from "./firebase-planner.js";
import { userDataManager } from "./user-data.js";

// Variáveis globais
let totalMetas = 0;
let totalConcluidas = 0;

// Inicializar quando a página carregar
document.addEventListener('DOMContentLoaded', async () => {
    console.log("Planner carregado, aguardando Firebase...");
    
    // Aguardar um pouco para o Firebase inicializar
    setTimeout(async () => {
        await inicializarPlanner();
    }, 1000);
});

async function inicializarPlanner() {
    console.log("Inicializando planner...");
    
    // Carregar metas do Firestore
    const metas = await plannerFirestore.carregarMetas();
    
    if (metas) {
        console.log("Metas carregadas:", metas);
        exibirMetasNaTela(metas);
        calcularContadores(metas);
        atualizarContadores();
    } else {
        console.log("Nenhuma meta carregada ou usuário não autenticado");
        // Mostrar mensagem se não estiver logado
        if (!plannerFirestore.userId) {
            alert("Você precisa fazer login para usar o planner!");
            window.location.href = "home.html";
        }
    }
}

// Exibir metas na tela
function exibirMetasNaTela(metas) {
    // Limpar todas as áreas de metas
    document.querySelectorAll('.metas').forEach(area => {
        area.innerHTML = '';
    });
    
    // Para cada dia, criar as metas
    Object.entries(metas).forEach(([dia, listaMetas]) => {
        const area = document.getElementById(`metas-${dia}`);
        if (area && Array.isArray(listaMetas)) {
            listaMetas.forEach(meta => {
                criarMetaNaTela(meta.texto, meta.concluida, dia, meta.id, area);
            });
        }
    });
}

// Criar uma meta na interface
function criarMetaNaTela(textoMeta, estaConcluida, dia, metaId, area) {
    const metaDiv = document.createElement("div");
    metaDiv.classList.add("meta");
    metaDiv.dataset.metaId = metaId;
    metaDiv.dataset.dia = dia;
    
    if (estaConcluida) {
        metaDiv.classList.add("concluida");
    }
    
    const icone = document.createElement("i");
    icone.className = estaConcluida ? "mdi mdi-check-circle" : "mdi mdi-circle-outline";
    
    const texto = document.createElement("h1");
    texto.textContent = textoMeta;
    
    metaDiv.appendChild(icone);
    metaDiv.appendChild(texto);
    area.appendChild(metaDiv);
    
    // Adicionar eventos
    metaDiv.addEventListener('click', async () => {
        const novaConclusao = !metaDiv.classList.contains("concluida");
        metaDiv.classList.toggle("concluida");
        icone.className = novaConclusao ? "mdi mdi-check-circle" : "mdi mdi-circle-outline";
        
        // Atualizar no Firestore
        const sucesso = await plannerFirestore.atualizarMeta(dia, metaId, novaConclusao);
        
        if (sucesso) {
            // Atualizar contadores
            if (novaConclusao) {
                totalConcluidas++;
            } else {
                totalConcluidas--;
            }
            atualizarContadores();
            
            // Sincronizar com outras páginas (perfil/pet)
            await sincronizarComUserData();
        }
    });
    
    metaDiv.addEventListener('contextmenu', async (e) => {
        e.preventDefault();
        if (confirm("Deseja excluir esta meta?")) {
            // Remover do Firestore
            if (sucesso) {
                // Remover da tela
                metaDiv.remove();
                // Sincronizar com outras páginas (perfil/pet)
                await sincronizarComUserData();
            }
        }
    });
}

// Calcular contadores a partir das metas
function calcularContadores(metas) {
    totalMetas = 0;
    totalConcluidas = 0;
    
    Object.values(metas).forEach(listaMetas => {
        if (Array.isArray(listaMetas)) {
            totalMetas += listaMetas.length;
            totalConcluidas += listaMetas.filter(meta => meta.concluida).length;
        }
    });
}

// Atualizar contadores na tela
function atualizarContadores() {
    const elementosCadastrados = document.getElementById('contador-cadastradas');
    const elementosConcluidos = document.getElementById('contador-concluidas');
    
    if (elementosCadastrados) {
        elementosCadastrados.textContent = totalMetas;
    }
    if (elementosConcluidos) {
        elementosConcluidos.textContent = totalConcluidas;
    }
}

// Sincronizar com UserDataManager (para perfil/pet)
async function sincronizarComUserData() {
    try {
        if (userDataManager && userDataManager.userId) {
            // Carregar metas atualizadas
            const metasAtualizadas = await plannerFirestore.carregarMetas();
            if (metasAtualizadas) {
                await userDataManager.atualizarMetas(metasAtualizadas);
                console.log("✅ Dados sincronizados com perfil/pet");
            }
        }
    } catch (error) {
        console.warn("Não foi possível sincronizar:", error);
    }
}

// FUNÇÃO PARA ADICIONAR NOVA META
async function addMeta(dia) {
    // Verificar se usuário está autenticado
    if (!plannerFirestore.userId) {
        alert("Faça login primeiro!");
        window.location.href = "home.html";
        return;
    }
    
    const area = document.getElementById(`metas-${dia}`);
    if (!area) return;
    
    // Criar elemento temporário para entrada de texto
    const tempDiv = document.createElement("div");
    tempDiv.classList.add("meta", "editando");
    
    const tempIcone = document.createElement("i");
    tempIcone.className = "mdi mdi-circle-outline";
    
    const textarea = document.createElement("textarea");
    textarea.placeholder = "Digite sua meta...";
    textarea.classList.add("input-meta");
    textarea.style.width = "100%";
    textarea.style.minHeight = "30px";
    
    tempDiv.appendChild(tempIcone);
    tempDiv.appendChild(textarea);
    area.appendChild(tempDiv);
    textarea.focus();
    
    // Função para salvar a meta
    const salvarMeta = async () => {
        const texto = textarea.value.trim();
        if (texto) {
            // Salvar no Firestore
            const novaMeta = await plannerFirestore.adicionarMeta(dia, texto, false);
            if (novaMeta) {
                // Sincronizar com outras páginas
                await sincronizarComUserData();
                
                // Remover o elemento de edição
                tempDiv.remove();
                
                // Adicionar a meta real na tela
                criarMetaNaTela(texto, false, dia, novaMeta.id, area);
                
                // Atualizar contadores
                totalMetas++;
                atualizarContadores();
                
                return true;
            }
        } else {
            // Se estiver vazio, remover
            tempDiv.remove();
        }
        return false;
    };
    
    // Evento para salvar com Enter
    textarea.addEventListener('keydown', async (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            await salvarMeta();
        }
    });
    
    // Evento para salvar quando perder o foco
    textarea.addEventListener('blur', async () => {
        setTimeout(async () => {
            if (document.body.contains(textarea)) {
                await salvarMeta();
            }
        }, 200);
    });
}

// Tornar a função global para ser chamada do HTML
window.addMeta = addMeta;
