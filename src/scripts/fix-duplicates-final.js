import { logInfo, logWarn, logError, logDebug } from '@/lib/utils/secure-logger';
const admin = require('firebase-admin');

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

async function fixDuplicates() {
  logInfo('🔧 Finale Duplikat-Bereinigung...');
  
  try {
    // Lade alle rwk_scores
    const scoresSnapshot = await db.collection('rwk_scores').get();
    logInfo(`📊 Gefunden: ${scoresSnapshot.size} rwk_scores`);
    
    // Gruppiere nach Schütze-Team-Durchgang
    const groups = new Map();
    
    scoresSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const key = `${data.shooterName}-${data.teamName}-${data.durchgang}-2025`;
      
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key).push({ id: doc.id, ...data });
    });
    
    logInfo(`🔍 Gefunden: ${groups.size} eindeutige Kombinationen`);
    
    let totalDeleted = 0;
    
    // Finde und lösche Duplikate
    for (const [key, entries] of groups) {
      if (entries.length > 1) {
        logInfo(`\n🚨 Duplikat: ${key} (${entries.length} Einträge)`);
        
        // Behalte den neuesten
        const keepEntry = entries.reduce((latest, current) => {
          const latestTime = latest.entryTimestamp?.seconds || 0;
          const currentTime = current.entryTimestamp?.seconds || 0;
          return currentTime > latestTime ? current : latest;
        });
        
        logInfo(`✅ Behalte: ${keepEntry.id}`);
        
        // Lösche alle anderen
        for (const entry of entries) {
          if (entry.id !== keepEntry.id) {
            try {
              await db.collection('rwk_scores').doc(entry.id).delete();
              logInfo(`🗑️ Gelöscht: ${entry.id}`);
              totalDeleted++;
            } catch (error) {
              logError(`❌ Fehler: ${entry.id}`, error);
            }
          }
        }
      }
    }
    
    logInfo(`\n🎉 Fertig! ${totalDeleted} Duplikate entfernt`);
    
  } catch (error) {
    logError('❌ Fehler:', error);
  }
}

fixDuplicates().then(() => process.exit(0));