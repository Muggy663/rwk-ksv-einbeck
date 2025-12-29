// src/lib/firebase/config.ts
import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { logError, logWarn, logInfo, logDebug } from '@/lib/utils/secure-logger';
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getFunctions, Functions } from "firebase/functions";
import { getStorage, FirebaseStorage } from "firebase/storage"; // Hinzugefügt für Firebase Storage

// IMPORTANT: In a production environment, these values should ideally be set
// as environment variables and not be directly in the code.
// For local development, you can create a .env.local file with these values.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Validate required environment variables
if (!firebaseConfig.apiKey || !firebaseConfig.authDomain || !firebaseConfig.projectId) {
  throw new Error('Missing required Firebase environment variables. Check your .env.local file.');
}

let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

const auth: Auth = getAuth(app);
// Initialisiere Firestore mit spezifischer Datenbank
const databaseId = process.env.FIREBASE_DATABASE_ID || process.env.NEXT_PUBLIC_FIREBASE_DATABASE_ID || 'restored-main';
const db: Firestore = getFirestore(app, databaseId);
const functions: Functions = getFunctions(app, 'europe-west1');
const storage: FirebaseStorage = getStorage(app); // Firebase Storage initialisieren

// Debug-Info für Datenbank (nur in Development)
if (typeof window === 'undefined' && process.env.NODE_ENV === 'development') {
  console.log('🔥 Firebase Datenbank:', databaseId);
}

// Alle Offline-Funktionen wurden deaktiviert, um Probleme zu vermeiden

export { app, auth, db, functions, storage }; // Storage exportieren
