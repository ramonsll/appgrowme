// planner.js - VERSÃO COM HISTÓRICO DE CONTADORES
import { plannerFirestore } from "./firebase-planner.js";
import { userDataManager } from "./user-data.js";

// Variáveis globais (mantêm o estado da sessão)
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
        
        // No carregamento inicial, calculamos o que existe no banco
        calcularContadores(metas);
        atualizarContadores();
    } else {
        console.log("Nenhuma meta carregada ou usuário não autenticado");
        if (!plannerFirestore.userId) {
            alert("Você precisa fazer login para usar o planner!");
            window.location.href = "home.html";
        }
    }
}

// Exibir metas na tela
function exibirMetasNaTela(metas) {
    document.querySelectorAll('.metas').forEach(area => {
        area.innerHTML = '';
    });
    
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
    
    // EVENTO: CLICAR (CONCLUIR)
    metaDiv.addEventListener('click', async () => {
        const novaConclusao = !metaDiv.classList.contains("concluida");
        metaDiv.classList.toggle("concluida");
        icone.className = novaConclusao ? "mdi mdi-check-circle" : "mdi mdi-circle-outline";
        
        // Atualizar no Firestore
        const sucesso = await plannerFirestore.atualizarMeta(dia, metaId, novaConclusao);
        
        if (sucesso) {
            // Se concluiu, sobe o contador. Se desmarcou, desce (opcional, mas evita spam de pontos)
            if (novaConclusao) {
                totalConcluidas++;
            } else {
                totalConcluidas--;
            }
            atualizarContadores();
            await sincronizarComUserData();
        }
    });
    
    // EVENTO: CONTEXT MENU (APAGAR)
    metaDiv.addEventListener('contextmenu', async (e) => {
        e.preventDefault();
        if (confirm("Deseja excluir esta meta?")) {
            // Remover do Firestore
            const sucesso = await plannerFirestore.removerMeta(dia, metaId);
            if (sucesso) {
                // APENAS remove da tela. 
                // NÃO decrementamos totalMetas nem totalConcluidas aqui.
                metaDiv.remove();
                
                // Sincroniza sem recalcular do zero para não perder o histórico da sessão
                await sincronizarComUserData();
                console.log("Meta removida da visualização, mas mantida no contador.");
            }
        }
    });
}

// Calcular contadores (Usa-se apenas no carregamento inicial da página)
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

// Sincronizar com UserDataManager
async function sincronizarComUserData() {
    try {
        if (userDataManager && userDataManager.userId) {
            // Enviamos os totais atuais da sessão para o manager de perfil/pet
            // Isso garante que o pet/perfil receba o bônus mesmo que a meta tenha sido apagada
            await userDataManager.atualizarMetas({
                totalCadastradas: totalMetas,
                totalConcluidas: totalConcluidas
            });
            console.log("✅ Dados sincronizados com perfil/pet");
        }
    } catch (error) {
        console.warn("Não foi possível sincronizar:", error);
    }
}

// FUNÇÃO PARA ADICIONAR NOVA META
async function addMeta(dia) {
    if (!plannerFirestore.userId) {
        alert("Faça login primeiro!");
        window.location.href = "home.html";
        return;
    }
    
    const area = document.getElementById(`metas-${dia}`);
    if (!area) return;
    
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
    
    const salvarMeta = async () => {
        const texto = textarea.value.trim();
        if (texto) {
            const novaMeta = await plannerFirestore.adicionarMeta(dia, texto, false);
            if (novaMeta) {
                tempDiv.remove();
                criarMetaNaTela(texto, false, dia, novaMeta.id, area);
                
                // Incrementa o contador de cadastradas
                totalMetas++;
                atualizarContadores();
                
                await sincronizarComUserData();
                return true;
            }
        } else {
            tempDiv.remove();
        }
        return false;
    };
    
    textarea.addEventListener('keydown', async (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            await salvarMeta();
        }
    });
    
    textarea.addEventListener('blur', async () => {
        setTimeout(async () => {
            if (document.body.contains(textarea)) {
                await salvarMeta();
            }
        }, 200);
    });
}

window.addMeta = addMeta;
