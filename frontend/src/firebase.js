// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCuIF4pPplZek8nMerrDhc_VsobCyTP_GU",
  authDomain: "hackwithbs-quiz.firebaseapp.com",
  projectId: "hackwithbs-quiz",
  storageBucket: "hackwithbs-quiz.firebasestorage.app",
  messagingSenderId: "137965438783",
  appId: "1:137965438783:web:1285f32aed0a9d1ccab58a"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Realtime Database and get a reference to the service
export const database = getDatabase(app);
