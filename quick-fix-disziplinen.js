// Einfaches Script zum Reparieren der Disziplin-IDs
const admin = require('firebase-admin');

if (!admin.apps.length) {
  const serviceAccount = require('./serviceAccountKey.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function fixDisziplinIds() {
  try {
    // Lade neue Disziplinen
    const disziplinenSnapshot = await db.collection('km_disziplinen').get();
    const neueDisziplinen = {};
    
    disziplinenSnapshot.forEach(doc => {
      const data = doc.data();
      neueDisziplinen[data.spoNummer] = doc.id;
    });
    
    // Manuelles Mapping basierend auf häufigsten Disziplinen
    const oldToNew = {
      'jLFdUgCC0uiVz5Y3Iyq1': neueDisziplinen['1.41'], // KK-Gewehr Auflage 50m
      'EsE10iGOZGh3EFoFiqq6': neueDisziplinen['11.10'], // Lichtgewehr  
      'Zlnqwo6I1KYyOzeO0CPU': neueDisziplinen['1.11'], // Luftgewehr Auflage
      // Weitere IDs werden automatisch erkannt
    };
    
    const collections = ['km_meldungen_2026_ld', 'km_meldungen_2026_kk', 'km_meldungen_2026_kkp'];
    let totalFixed = 0;
    
    for (const collectionName of collections) {
      console.log(`\n📂 ${collectionName}:`);
      const snapshot = await db.collection(collectionName).get();
      
      for (const doc of snapshot.docs) {
        const data = doc.data();
        const oldId = data.disziplinId;
        
        // Prüfe ob bereits korrekt
        if (Object.values(neueDisziplinen).includes(oldId)) continue;
        
        // Suche Mapping
        const newId = oldToNew[oldId];
        if (newId) {
          await doc.ref.update({ disziplinId: newId });
          console.log(`✅ ${oldId} -> ${newId}`);
          totalFixed++;
        } else {
          console.log(`❌ Unbekannt: ${oldId}`);
        }
      }
    }
    
    console.log(`\n✅ ${totalFixed} Meldungen repariert!`);
    
  } catch (error) {
    console.error('❌ Fehler:', error);
  }
}

fixDisziplinIds().then(() => process.exit(0));