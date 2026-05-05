// src/config/firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth"; // 1. Add the Auth import

const firebaseConfig = {
    apiKey: "AIzaSyAD8N2WN1PvHNct7rjfM1Tu4uylT8KKCQw",
    authDomain: "sipat-bcd07.firebaseapp.com",
    projectId: "sipat-bcd07",
    storageBucket: "sipat-bcd07.firebasestorage.app",
    messagingSenderId: "782861420113",
    appId: "1:782861420113:web:93a95e849ba8bef5649a70",
    // 2. Removed Analytics measurementId to keep it lightweight
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// 3. Initialize Auth and export it so Login.tsx can use it
export const auth = getAuth(app);