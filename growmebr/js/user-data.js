// user-data.js - GERENCIADOR CENTRAL DE DADOS DO USUÁRIO
import { auth, db } from "./firebase.js";
import { 
    doc, 
    getDoc, 
    updateDoc,
    onSnapshot 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

class UserDataManager {
    constructor() {
        this.userId = null;
        this.userData = null;
        this.listeners = [];
        
        // Escutar mudanças de autenticação
        auth.onAuthStateChanged((user) => {
            if (user) {
                this.userId = user.uid;
                this.carregarDadosUsuario();
                console.log("👤 UserDataManager: Usuário autenticado", user.email);
            } else {
                this.userId = null;
                this.userData = null;
                this.notificarListeners();
            }
        });
    }
    
    // Carregar dados do usuário do Firestore
    async carregarDadosUsuario() {
        if (!this.userId) return;
        
        try {
            const userRef = doc(db, "users", this.userId);
            const userSnap = await getDoc(userRef);
            
            if (userSnap.exists()) {
                this.userData = userSnap.data();
                console.log("📊 UserDataManager: Dados carregados", this.userData);
            } else {
                // Criar estrutura inicial
                this.userData = this.criarEstruturaInicial();
                await this.salvarDados();
            }
            
            this.notificarListeners();
            
            // Escutar atualizações em tempo real
            this.iniciarListenerTempoReal();
            
        } catch (error) {
            console.error("❌ UserDataManager erro ao carregar:", error);
        }
    }
    
    // Criar estrutura inicial de dados
    criarEstruturaInicial() {
        return {
            nome: "",
            metas: {
                domingo: [], segunda: [], terca: [], quarta: [],
                quinta: [], sexta: [], sabado: []
            },
            pet: {
                nome: "",
                nivel: 1,
                pontos: 0
            },
            configuracoes: {
                tema: "claro",
                notificacoes: true
            }
        };
    }
    
    // Salvar dados no Firestore
    async salvarDados() {
        if (!this.userId || !this.userData) return false;
        
        try {
            const userRef = doc(db, "users", this.userId);
            await updateDoc(userRef, this.userData);
            console.log("💾 UserDataManager: Dados salvos");
            return true;
        } catch (error) {
            console.error("❌ UserDataManager erro ao salvar:", error);
            return false;
        }
    }
    
    // Iniciar listener em tempo real
    iniciarListenerTempoReal() {
        if (!this.userId) return;
        
        const userRef = doc(db, "users", this.userId);
        
        // Escutar mudanças em tempo real
        this.unsubscribe = onSnapshot(userRef, (snap) => {
            if (snap.exists()) {
                this.userData = snap.data();
                this.notificarListeners();
                console.log("🔄 UserDataManager: Dados atualizados em tempo real");
            }
        });
    }
    
    // Adicionar listener para atualizações
    adicionarListener(callback) {
        this.listeners.push(callback);
        // Notificar imediatamente se já temos dados
        if (this.userData) {
            callback(this.userData);
        }
    }
    
    // Notificar todos os listeners
    notificarListeners() {
        this.listeners.forEach(callback => {
            if (typeof callback === 'function') {
                callback(this.userData);
            }
        });
    }
    
    // ===== GETTERS =====
    
    // Obter nome do usuário
    getNome() {
        return this.userData?.nome || "Usuário";
    }
    
    // Obter contadores de metas
    getContadoresMetas() {
        if (!this.userData?.metas) return { total: 0, concluidas: 0 };
        
        let total = 0;
        let concluidas = 0;
        
        Object.values(this.userData.metas).forEach(dia => {
            if (Array.isArray(dia)) {
                total += dia.length;
                concluidas += dia.filter(meta => meta.concluida).length;
            }
        });
        
        return { total, concluidas };
    }
    
    // Obter dados do pet
    getDadosPet() {
        return this.userData?.pet || { nome: "", nivel: 1, pontos: 0 };
    }
    
    // ===== SETTERS =====
    
    // Atualizar nome
    async atualizarNome(novoNome) {
        if (!this.userData) return false;
        
        this.userData.nome = novoNome;
        return await this.salvarDados();
    }
    
    // Atualizar pet
    async atualizarPet(dadosPet) {
        if (!this.userData) return false;
        
        this.userData.pet = { ...this.userData.pet, ...dadosPet };
        return await this.salvarDados();
    }
    
    // Atualizar metas (usado pelo planner)
    async atualizarMetas(metas) {
        if (!this.userData) return false;
        
        this.userData.metas = metas;
        return await this.salvarDados();
    }
    
    // Destruir listener
    destruir() {
        if (this.unsubscribe) {
            this.unsubscribe();
        }
    }
}

// Exportar instância única
const userDataManager = new UserDataManager();
export { userDataManager };