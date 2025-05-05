// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
// Analytics is not used currently, removed import
// import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// IMPORTANT: Storing API keys directly in the code is a major security risk.
// Consider using environment variables (.env.local) and accessing them via process.env.
// Example: process.env.NEXT_PUBLIC_FIREBASE_API_KEY
const firebaseConfig = {
  apiKey: "AIzaSyDvKhzHTcSmj3Z64oePRGP2TeEd_5A4RVU", // WARNING: Hardcoded API Key
  authDomain: "authentication-c6c71.firebaseapp.com",
  projectId: "authentication-c6c71",
  storageBucket: "authentication-c6c71.firebasestorage.app",
  messagingSenderId: "707906547881",
  appId: "1:707906547881:web:55c67cf3e7e867951c39b8",
  measurementId: "G-ZKY9SXX8N8" // Optional
};

// Initialize Firebase
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const db = getFirestore(app);
const auth = getAuth(app); // Initialize Firebase Auth
// const analytics = getAnalytics(app); // Analytics initialization removed as it's not used

export { app, db, auth }; // Export auth as well
