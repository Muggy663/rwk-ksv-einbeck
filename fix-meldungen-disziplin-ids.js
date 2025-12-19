// Script zum Reparieren der Disziplin-IDs in Meldungen
const admin = require('firebase-admin');

// Firebase Admin initialisieren
if (!admin.apps.length) {
  const serviceAccount = require('./serviceAccountKey.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function fixMeldungenDisziplinIds() {
  try {
    console.log('🔄 Schritt 1: Lade ALTE Disziplinen aus Backup...');
    
    // Erstelle Mapping von alten IDs zu spoNummern durch Analyse der Meldungen
    const oldDisziplinenMap = {};
    
    console.log('\n🔄 Schritt 2: Lade aktuelle Disziplinen...');
    const neueDisziplinenSnapshot = await db.collection('km_disziplinen').get();
    const neueDisziplinen = {};
    
    neueDisziplinenSnapshot.forEach(doc => {
      const data = doc.data();
      neueDisziplinen[data.spoNummer] = doc.id;
      console.log(`Neue Disziplin: ${data.spoNummer} -> ${doc.id}`);
    });
    
    console.log('\n🔄 Schritt 3: Analysiere Meldungen und erstelle Mapping...');
    
    // Lade alle Meldungen aus allen Collections
    const collections = ['km_meldungen_2026_ld', 'km_meldungen_2026_kk', 'km_meldungen_2026_kkp'];
    
    for (const collectionName of collections) {
      console.log(`\n📂 Verarbeite Collection: ${collectionName}`);
      
      const meldungenSnapshot = await db.collection(collectionName).get();
      console.log(`   Gefunden: ${meldungenSnapshot.size} Meldungen`);
      
      if (meldungenSnapshot.empty) continue;
      
      // Sammle alle einzigartigen alten Disziplin-IDs
      const uniqueOldIds = new Set();
      meldungenSnapshot.forEach(doc => {
        const data = doc.data();
        if (data.disziplinId && !Object.values(neueDisziplinen).includes(data.disziplinId)) {
          uniqueOldIds.add(data.disziplinId);
        }
      });
      
      console.log(`   Gefundene alte IDs: ${uniqueOldIds.size}`);
      
      // Für jede alte ID, versuche die spoNummer zu finden
      for (const oldId of uniqueOldIds) {
        // Suche in alten Disziplinen (falls noch vorhanden)
        try {
          const oldDoc = await db.collection('km_disziplinen_backup').doc(oldId).get();
          if (oldDoc.exists) {
            const spoNummer = oldDoc.data().spoNummer;
            oldDisziplinenMap[oldId] = spoNummer;
            console.log(`   Mapping gefunden: ${oldId} -> ${spoNummer}`);
          }
        } catch (e) {
          // Backup existiert nicht
        }
      }
    }
    
    console.log('\n🔄 Schritt 4: Aktualisiere Meldungen...');
    
    let totalUpdated = 0;
    let totalNotFound = 0;
    let totalAlreadyCorrect = 0;
    
    for (const collectionName of collections) {
      console.log(`\n📂 Aktualisiere Collection: ${collectionName}`);
      
      const meldungenSnapshot = await db.collection(collectionName).get();
      let updated = 0;
      let notFound = 0;
      let alreadyCorrect = 0;
      
      for (const doc of meldungenSnapshot.docs) {
        const data = doc.data();
        const oldDisziplinId = data.disziplinId;
        
        // Prüfe ob die aktuelle ID bereits korrekt ist
        const currentExists = Object.values(neueDisziplinen).includes(oldDisziplinId);
        if (currentExists) {
          alreadyCorrect++;
          continue;
        }
        
        // Suche nach Mapping
        const spoNummer = oldDisziplinenMap[oldDisziplinId];
        if (spoNummer && neueDisziplinen[spoNummer]) {
          const newDisziplinId = neueDisziplinen[spoNummer];
          
          await doc.ref.update({
            disziplinId: newDisziplinId
          });
          
          console.log(`   ✅ ${oldDisziplinId} -> ${newDisziplinId} (${spoNummer})`);
          updated++;
        } else {
          console.log(`   ❌ Nicht gefunden: ${oldDisziplinId}`);
          notFound++;
        }
      }
      
      console.log(`   Ergebnis: ${updated} aktualisiert, ${alreadyCorrect} bereits korrekt, ${notFound} nicht gefunden`);
      totalUpdated += updated;
      totalNotFound += notFound;
      totalAlreadyCorrect += alreadyCorrect;
    }
    
    console.log(`\n✅ FERTIG!`);
    console.log(`   ${totalUpdated} Meldungen aktualisiert`);
    console.log(`   ${totalAlreadyCorrect} bereits korrekt`);
    console.log(`   ${totalNotFound} nicht gefunden`);
    
  } catch (error) {
    console.error('❌ Fehler:', error);
  }
}

fixMeldungenDisziplinIds().then(() => process.exit(0));