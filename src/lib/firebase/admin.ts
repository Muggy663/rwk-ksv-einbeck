// src/lib/firebase/admin.ts
// Firebase Admin SDK - NUR für Server-Side API Routes!
if (typeof window !== 'undefined') {
  throw new Error('Firebase Admin SDK kann nur server-seitig verwendet werden!');
}

import { initializeApp, getApps, getApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount),
    projectId: process.env.FIREBASE_PROJECT_ID,
  });
}

const app = getApp();
const databaseId = process.env.FIREBASE_DATABASE_ID || 'restored-main';
export const adminDb = getFirestore(app, databaseId);

import { getAuth } from 'firebase-admin/auth';
export const adminAuth = getAuth(app);
export const admin = {
  auth: () => getAuth(app),
  firestore: () => getFirestore(app, databaseId)
};
