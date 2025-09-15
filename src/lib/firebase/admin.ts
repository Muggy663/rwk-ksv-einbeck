// src/lib/firebase/admin.ts
// Firebase Admin SDK - NUR für Server-Side API Routes!
if (typeof window !== 'undefined') {
  throw new Error('Firebase Admin SDK kann nur server-seitig verwendet werden!');
}

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Service Account aus Environment Variables
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

// Admin App initialisieren (nur einmal)
if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount),
    projectId: process.env.FIREBASE_PROJECT_ID,
  });
}

// Admin Firestore exportieren
export const adminDb = getFirestore();