import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyAohpZNf3EdRk840oMhcL4gt6gYTD48DrQ",
    authDomain: "selva-store-c32f4.firebaseapp.com",
    projectId: "selva-store-c32f4",
    storageBucket: "selva-store-c32f4.firebasestorage.app",
    messagingSenderId: "434956243901",
    appId: "1:434956243901:web:3df715dcc12853121238d4",
    measurementId: "G-R0C144JVZB"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
