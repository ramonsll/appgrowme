// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDmWJAueqrbYmcmm7HOefKahZN3gftPzrE",
  authDomain: "growme-197a2.firebaseapp.com",
  projectId: "growme-197a2",
  storageBucket: "growme-197a2.firebasestorage.app",
  messagingSenderId: "629715227481",
  appId: "1:629715227481:web:16b5ba08eb4b0b72b5b248"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
