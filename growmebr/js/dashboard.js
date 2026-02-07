// dashboard.js - VERSÃO CORRIGIDA
import { auth, db } from "./firebase.js";
import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    // Se não está na home.html, redireciona
    if (!window.location.href.includes("home.html")) {
      location.href = "home.html";
    }
    return;
  }

  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    const data = snap.data();
    
    // VERIFICAR SE OS ELEMENTOS EXISTEM ANTES DE MODIFICAR
    const nomeElement = document.getElementById("nome");
    const emailElement = document.getElementById("email");
    const fotoElement = document.getElementById("foto");
    
    if (nomeElement) nomeElement.innerText = data.nome || data.email;
    if (emailElement) emailElement.innerText = data.email;
    if (fotoElement && data.foto) fotoElement.src = data.foto;
  }
});