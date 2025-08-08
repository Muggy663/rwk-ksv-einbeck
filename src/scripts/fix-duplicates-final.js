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
  console.log('🔧 Finale Duplikat-Bereinigung...');
  
  try {
    // Lade alle rwk_scores
    const scoresSnapshot = await db.collection('rwk_scores').get();
    console.log(`📊 Gefunden: ${scoresSnapshot.size} rwk_scores`);
    
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
    
    console.log(`🔍 Gefunden: ${groups.size} eindeutige Kombinationen`);
    
    let totalDeleted = 0;
    
    // Finde und lösche Duplikate
    for (const [key, entries] of groups) {
      if (entries.length > 1) {
        console.log(`\n🚨 Duplikat: ${key} (${entries.length} Einträge)`);
        
        // Behalte den neuesten
        const keepEntry = entries.reduce((latest, current) => {
          const latestTime = latest.entryTimestamp?.seconds || 0;
          const currentTime = current.entryTimestamp?.seconds || 0;
          return currentTime > latestTime ? current : latest;
        });
        
        console.log(`✅ Behalte: ${keepEntry.id}`);
        
        // Lösche alle anderen
        for (const entry of entries) {
          if (entry.id !== keepEntry.id) {
            try {
              await db.collection('rwk_scores').doc(entry.id).delete();
              console.log(`🗑️ Gelöscht: ${entry.id}`);
              totalDeleted++;
            } catch (error) {
              console.error(`❌ Fehler: ${entry.id}`, error);
            }
          }
        }
      }
    }
    
    console.log(`\n🎉 Fertig! ${totalDeleted} Duplikate entfernt`);
    
  } catch (error) {
    console.error('❌ Fehler:', error);
  }
}

fixDuplicates().then(() => process.exit(0));