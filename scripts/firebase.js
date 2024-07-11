import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";
import { getStorage } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-storage.js';

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyA_HFiiSvkhxg6HLkTq9NUSuIdWxesBx1U",
    authDomain: "chazi-b7b36.firebaseapp.com",
    projectId: "chazi-b7b36",
    storageBucket: "chazi-b7b36.appspot.com",
    messagingSenderId: "311506313557",
    appId: "1:311506313557:web:149a36a6aa605e2ff44fdc",
    measurementId: "G-LJ7CW4QYTT"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const firestore = getFirestore(app);
const storage = getStorage(app);


export { auth, firestore, storage };