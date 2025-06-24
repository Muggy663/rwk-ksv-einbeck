// src/lib/firebase/config.ts
import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getFunctions, Functions } from "firebase/functions";
import { getStorage, FirebaseStorage } from "firebase/storage"; // Hinzugefügt für Firebase Storage

// IMPORTANT: In a production environment, these values should ideally be set
// as environment variables and not be directly in the code.
// For local development, you can create a .env.local file with these values.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyBlcJpndITalBIoqtXSOvefgfRQoBl6_0c",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "ksv-einbeck-app.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "ksv-einbeck-app",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "ksv-einbeck-app.appspot.com", // Corrected from firebasestorage.app
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "110556513204",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:110556513204:web:a78cd3a6c92d27e825a8e1",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-00PLTVKPF8" // Optional, if you use Analytics
};

let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);
const functions: Functions = getFunctions(app, 'europe-west1');
const storage: FirebaseStorage = getStorage(app); // Firebase Storage initialisieren

// Aktiviere Offline Persistence (einmalig)
if (typeof window !== 'undefined') {
  import('firebase/firestore').then(({ enableIndexedDbPersistence }) => {
    enableIndexedDbPersistence(db).catch((err) => {
      if (err.code === 'failed-precondition') {
        console.log('Persistence failed: Multiple tabs open');
      } else if (err.code === 'unimplemented') {
        console.log('Persistence not supported');
      }
    });
  });
}

export { app, auth, db, functions, storage }; // Storage exportieren