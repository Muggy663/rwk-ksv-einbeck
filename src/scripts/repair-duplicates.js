import { logInfo, logWarn, logError, logDebug } from '@/lib/utils/secure-logger';
// Reparatur-Script für doppelte Schützen-Einträge
// Ausführung: node src/scripts/repair-duplicates.js

const admin = require('firebase-admin');

// Firebase Admin initialisieren
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
    })
  });
}

const db = admin.firestore();

// Bekannte Duplikate definieren
const DUPLICATES_TO_FIX = [
  {
    name: "Jürgen Wauker",
    team: "SV Lauenberg I",
    keepId: "18", // Vollständige Ergebnisse
    removeId: "68" // Unvollständige Ergebnisse
  },
  {
    name: "Jan Greve", 
    team: "LSV Lüthorst II",
    keepId: "49",
    removeId: "50"
  },
  {
    name: "Detlef Christian",
    team: "SV Markoldendorf II", 
    keepId: "21",
    removeId: "22"
  }
];

async function repairDuplicates() {
  logInfo('🔧 Starte Duplikat-Reparatur...');
  
  for (const duplicate of DUPLICATES_TO_FIX) {
    try {
      logInfo(`\n📝 Repariere: ${duplicate.name} (${duplicate.team})`);
      
      // Beide Einträge laden
      const keepDoc = await db.collection('rwk_results_2025').doc(duplicate.keepId).get();
      const removeDoc = await db.collection('rwk_results_2025').doc(duplicate.removeId).get();
      
      if (!keepDoc.exists) {
        logInfo(`❌ Keep-Dokument ${duplicate.keepId} nicht gefunden`);
        continue;
      }
      
      if (!removeDoc.exists) {
        logInfo(`⚠️ Remove-Dokument ${duplicate.removeId} bereits gelöscht`);
        continue;
      }
      
      const keepData = keepDoc.data();
      const removeData = removeDoc.data();
      
      logInfo(`📊 Keep (${duplicate.keepId}):`, { data: keepData.results || 'Keine Ergebnisse' });
      logInfo(`📊 Remove (${duplicate.removeId}):`, { data: removeData.results || 'Keine Ergebnisse' });
      
      // Duplikat löschen
      await db.collection('rwk_results_2025').doc(duplicate.removeId).delete();
      logInfo(`✅ Duplikat ${duplicate.removeId} gelöscht`);
      
    } catch (error) {
      logError(`❌ Fehler bei ${duplicate.name}:`, error.message);
    }
  }
  
  logInfo('\n🎉 Duplikat-Reparatur abgeschlossen!');
}

// Script ausführen
repairDuplicates().catch(console.error);