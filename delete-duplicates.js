// Einfaches Node.js Script zum Löschen der Duplikate
// Ausführung: node delete-duplicates.js

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, deleteDoc } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyBkQZ8QZ8QZ8QZ8QZ8QZ8QZ8QZ8QZ8QZ8Q",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "rwk-einbeck.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "rwk-einbeck",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "rwk-einbeck.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:123456789:web:abcdef"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const IDS_TO_DELETE = [
  'bU6uW8ee6b86cyaN7txc', // Jürgen Wauker Duplikat
];

async function deleteDuplicates() {
  console.log('🗑️ Lösche Duplikate...');
  
  for (const id of IDS_TO_DELETE) {
    try {
      await deleteDoc(doc(db, 'rwk_scores', id));
      console.log(`✅ Gelöscht: ${id}`);
    } catch (error) {
      console.log(`❌ Fehler bei ${id}:`, error.message);
    }
  }
  
  console.log('🎉 Fertig!');
  process.exit(0);
}

deleteDuplicates();