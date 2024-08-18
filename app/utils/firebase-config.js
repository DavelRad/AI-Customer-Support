// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDh4ujJ__RLaelZppKethcurforts3Y58g",
  authDomain: "ai-customer-10f52.firebaseapp.com",
  projectId: "ai-customer-10f52",
  storageBucket: "ai-customer-10f52.appspot.com",
  messagingSenderId: "1074525719232",
  appId: "1:1074525719232:web:30d3c5c2c092949c717b25",
  measurementId: "G-N2F32XSKHN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app)
const db = getFirestore(app)
const storage = getStorage(app);

export { auth, db, storage }