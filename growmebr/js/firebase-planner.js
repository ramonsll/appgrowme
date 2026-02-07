// firebase-planner.js - VERSÃO CORRETA
import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
    doc,
    getDoc,
    updateDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Gerenciador de metas no Firestore
class PlannerFirestore {
    constructor() {
        this.userId = null;
        this.metas = null;
        
        // Escutar mudanças de autenticação
        onAuthStateChanged(auth, (user) => {
            if (user) {
                this.userId = user.uid;
                console.log("👤 PlannerFirestore: Usuário autenticado", user.email);
            } else {
                this.userId = null;
                this.metas = null;
            }
        });
    }
    
    // Carregar metas do Firestore
    async carregarMetas() {
        if (!this.userId) {
            console.log("PlannerFirestore: Nenhum usuário autenticado");
            return null;
        }
        
        try {
            const userRef = doc(db, "users", this.userId);
            const userSnap = await getDoc(userRef);
            
            if (userSnap.exists()) {
                const data = userSnap.data();
                
                // Verificar se tem metas
                if (data.metas) {
                    this.metas = data.metas;
                    return this.metas;
                } else {
                    // Se não tiver metas, criar estrutura vazia
                    this.metas = this.criarEstruturaVazia();
                    // Salvar a estrutura vazia
                    await updateDoc(userRef, {
                        metas: this.metas
                    });
                    return this.metas;
                }
            } else {
                console.error("PlannerFirestore: Documento do usuário não encontrado");
                return null;
            }
        } catch (error) {
            console.error("PlannerFirestore: Erro ao carregar metas:", error);
            return null;
        }
    }
    
    // Salvar metas no Firestore
    async salvarMetas() {
        if (!this.userId) {
            console.error("PlannerFirestore: Nenhum usuário autenticado");
            return false;
        }
        
        try {
            const userRef = doc(db, "users", this.userId);
            await updateDoc(userRef, {
                metas: this.metas
            });
            console.log("PlannerFirestore: Metas salvas para", this.userId);
            return true;
        } catch (error) {
            console.error("PlannerFirestore: Erro ao salvar metas:", error);
            return false;
        }
    }
    
    // Adicionar uma meta
    async adicionarMeta(dia, texto, concluida = false) {
        if (!this.metas) {
            this.metas = await this.carregarMetas();
            if (!this.metas) {
                this.metas = this.criarEstruturaVazia();
            }
        }
        
        // Garantir que o dia existe
        if (!this.metas[dia]) {
            this.metas[dia] = [];
        }
        
        // Criar ID único
        const timestamp = Date.now();
        const random = Math.random().toString(36).substr(2, 9);
        const metaId = `${timestamp}-${random}`;
        
        const novaMeta = {
            id: metaId,
            texto: texto,
            concluida: concluida,
            criadaEm: new Date().toISOString()
        };
        
        this.metas[dia].push(novaMeta);
        const sucesso = await this.salvarMetas();
        
        return sucesso ? novaMeta : null;
    }
    
    // Atualizar uma meta (marcar como concluída/não concluída)
    async atualizarMeta(dia, metaId, concluida) {
        if (!this.metas || !this.metas[dia]) {
            console.error("PlannerFirestore: Não há metas para este dia");
            return false;
        }
        
        // Encontrar a meta
        const index = this.metas[dia].findIndex(meta => meta.id === metaId);
        if (index === -1) {
            console.error("PlannerFirestore: Meta não encontrada", metaId);
            return false;
        }
        
        // Atualizar
        this.metas[dia][index].concluida = concluida;
        const sucesso = await this.salvarMetas();
        
        if (sucesso) {
            console.log(`PlannerFirestore: Meta ${metaId} ${concluida ? 'concluída' : 'desmarcada'}`);
        }
        
        return sucesso;
    }
    
    // Remover uma meta
    async removerMeta(dia, metaId) {
        if (!this.metas || !this.metas[dia]) {
            console.error("PlannerFirestore: Não há metas para este dia");
            return false;
        }
        
        // Filtrar removendo a meta
        const antes = this.metas[dia].length;
        this.metas[dia] = this.metas[dia].filter(meta => meta.id !== metaId);
        const depois = this.metas[dia].length;
        
        if (antes === depois) {
            console.error("PlannerFirestore: Meta não encontrada para remover", metaId);
            return false;
        }
        
        const sucesso = await this.salvarMetas();
        
        if (sucesso) {
            console.log("PlannerFirestore: Meta removida", metaId);
        }
        
        return sucesso;
    }
    
    // Criar estrutura vazia de metas
    criarEstruturaVazia() {
        return {
            domingo: [],
            segunda: [],
            terca: [],
            quarta: [],
            quinta: [],
            sexta: [],
            sabado: []
        };
    }
    
    // Obter contadores (para perfil/pet)
    getContadores() {
        if (!this.metas) {
            return { total: 0, concluidas: 0 };
        }
        
        let total = 0;
        let concluidas = 0;
        
        Object.values(this.metas).forEach(dia => {
            if (Array.isArray(dia)) {
                total += dia.length;
                concluidas += dia.filter(meta => meta.concluida).length;
            }
        });
        
        return { total, concluidas };
    }
}

// Criar e exportar instância única
const plannerFirestore = new PlannerFirestore();
export { plannerFirestore };
