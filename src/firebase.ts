// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics"; // Remove if not used
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAAm_YEa-4KMF0zippkYDu5K6B81PbRii4",
  authDomain: "ai-notes-29da7.firebaseapp.com",
  projectId: "ai-notes-29da7",
  storageBucket: "ai-notes-29da7.appspot.com",
  messagingSenderId: "461548028635",
  appId: "1:461548028635:web:7227b19c7d1831d82c82fe",
  measurementId: "G-86HPJQBG22"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Only initialize analytics if running in browser and analytics is supported
// let analytics: ReturnType<typeof getAnalytics> | undefined;
// if (typeof window !== "undefined" && 'measurementId' in firebaseConfig) {
//   try {
//     analytics = getAnalytics(app);
//   } catch (e) {
//     // Ignore analytics errors in dev/local
//     console.warn("Analytics not initialized:", e);
//   }
// }

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };