// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyASAnUSv-cmLkleKqdtEMEFD6bVrYRHWnc",
    authDomain: "grafix-print-hub.firebaseapp.com",
    projectId: "grafix-print-hub",
    storageBucket: "grafix-print-hub.firebasestorage.app",
    messagingSenderId: "118425667030",
    appId: "1:118425667030:web:c4040bf9484495aa095077",
    measurementId: "G-C2T7H9Y4X8"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize services
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

console.log("Firebase initialized successfully!");