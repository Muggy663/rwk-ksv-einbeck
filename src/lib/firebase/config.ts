// src/lib/firebase/config.ts
import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";

// IMPORTANT: Replace with your Firebase project's configuration
// You can find this in your Firebase project settings:
// Project Settings > General > Your apps > Web app > Firebase SDK snippet > Config
const firebaseConfig = {
  apiKey: "AIzaSyBlcJpndITalBIoqtXSOvefgfRQoBl6_0c",
  authDomain: "ksv-einbeck-app.firebaseapp.com",
  projectId: "ksv-einbeck-app",
  storageBucket: "ksv-einbeck-app.firebasestorage.app",
  messagingSenderId: "110556513204",
  appId: "1:110556513204:web:a78cd3a6c92d27e825a8e1",
  measurementId: "G-00PLTVKPF8"

};

let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);

export { app, auth, db };
