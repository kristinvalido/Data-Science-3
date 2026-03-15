// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth"; // <--- Add getAuth here!
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyC5WHvAsEy9yBfb4yFAyIdbDCN-r5X0JgY",
  authDomain: "titan-tunes-37528.firebaseapp.com",
  projectId: "titan-tunes-37528",
  storageBucket: "titan-tunes-37528.firebasestorage.app",
  messagingSenderId: "937496667736",
  appId: "1:937496667736:web:0d2757e39a9df1b8bc0c2d",
  measurementId: "G-VR0GEX07VP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app); // Initialize Auth service
export const googleProvider = new GoogleAuthProvider(); // For CSUF Login
export const db = getFirestore(app);
googleProvider.setCustomParameters({
  prompt: 'select_account' 
});
