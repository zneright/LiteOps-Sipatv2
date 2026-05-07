import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth"; // Added GoogleAuthProvider

const firebaseConfig = {
    apiKey: "AIzaSyAD8N2WN1PvHNct7rjfM1Tu4uylT8KKCQw",
    authDomain: "sipat-bcd07.firebaseapp.com",
    projectId: "sipat-bcd07",
    storageBucket: "sipat-bcd07.firebasestorage.app",
    messagingSenderId: "782861420113",
    appId: "1:782861420113:web:93a95e849ba8bef5649a70",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider(); // Added this export