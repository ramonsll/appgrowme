import { auth, db } from "./firebase.js";

import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    GoogleAuthProvider,
    OAuthProvider,
    signInWithPopup
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
    doc,
    setDoc,
    updateDoc,
    getDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
// auth.js - DEIXE APENAS ESTA FUNÇÃO
// auth.js - FUNÇÃO COMPLETA E CORRETA
async function salvarUsuario(user) {
    const ref = doc(db, "users", user.uid);
    const snap = await getDoc(ref);

    // ESTRUTURA VAZIA DE METAS
    const estruturaMetas = {
        domingo: [],
        segunda: [],
        terca: [],
        quarta: [],
        quinta: [],
        sexta: [],
        sabado: []
    };

    if (!snap.exists()) {
        // USUÁRIO NOVO - criar com tudo
        await setDoc(ref, {
            uid: user.uid,
            nome: user.displayName || user.email?.split('@')[0] || "Usuário",
            email: user.email,
            foto: user.photoURL || "",
            criadoEm: serverTimestamp(),
            provider: user.providerData[0]?.providerId || "google.com",
            metas: estruturaMetas,
            pet: { nome: "", nivel: 1, pontos: 0 },  // ← ADICIONE
            configuracoes: { tema: "claro", notificacoes: true }  // ← ADICIONE
        });
        console.log("✅ Novo usuário criado:", user.email);
        
    } else {
        // USUÁRIO JÁ EXISTE - só garantir que tem metas
        const data = snap.data();
        if (!data.metas) {
            await updateDoc(ref, {
                metas: estruturaMetas
            });
            console.log("✅ Usuário existente atualizado com metas:", user.email);
        } else {
            console.log("✅ Usuário já tem metas:", user.email);
        }
    }
}


// CADASTRO
window.cadastrar = async () => {

    if (cadSenha.value !== cadConfirmar.value) {
        alert("Senhas não batem. Tente novamente.");
        return;
    }

    try {
        const res = await createUserWithEmailAndPassword(
            auth,
            cadEmail.value,
            cadSenha.value
        );

        await salvarUsuario(res.user);

        location.href = "./pet.html";

    } catch (e) {
        alert(e.message);
    }
};


// GOOGLE
window.loginGoogle = async () => {

    const provider = new GoogleAuthProvider();

    provider.setCustomParameters({
        prompt: "select_account"
    });


    try {
        const res = await signInWithPopup(auth, provider);

        await salvarUsuario(res.user);

        location.href = "./pet.html";

    } catch (e) {
        alert(e.message);
    }
};
// auth.js - ADICIONE ESTA FUNÇÃO NO FINAL DO ARQUIVO

// LOGOUT
window.logout = async () => {
    try {
        await auth.signOut();
        console.log("✅ Usuário deslogado com sucesso");
        
        // Redirecionar para a home
        location.href = "home.html";
        
    } catch (e) {
        console.error("Erro ao fazer logout:", e);
        alert("Erro ao fazer logout. Tente novamente.");
    }
};
// auth.js - ATUALIZAR função salvarUsuario
// auth.js - FUNÇÃO ATUALIZADA
// auth.js - FUNÇÃO COMPLETA ATUALIZADA
