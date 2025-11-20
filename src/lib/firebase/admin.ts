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

// Admin Services exportieren
export const adminDb = getFirestore();

// Admin Auth für API-Auth Helper
import { getAuth } from 'firebase-admin/auth';
export const adminAuth = getAuth();
export const admin = {
  auth: () => getAuth(),
  firestore: () => getFirestore()
};
