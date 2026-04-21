// ============================================
// TechOL — Firebase Configuration (MODULAR SDK)
// ============================================
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

export const firebaseConfig = {
  apiKey: "AIzaSyD4HI9f3OAoPXrKxNDJkBCBJy_G1TA4yts",
  authDomain: "techol-10e4b.firebaseapp.com",
  projectId: "techol-10e4b",
  storageBucket: "techol-10e4b.firebasestorage.app",
  messagingSenderId: "650843617448",
  appId: "1:650843617448:web:e5a11d5c694cf6aae4aa9d"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Global access for legacy parts (optional but helpful during transition)
window.fbAuth = auth;
window.fbDb = db;
window.fbStorage = storage;

console.log('✅ TechOL: Firebase Modular SDK Initialized (Project:', firebaseConfig.projectId, ')');
