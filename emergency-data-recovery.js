// NOTFALL: Datenrettung für verlorene KM-Meldungen
// Suche in allen möglichen Collections nach Spuren

const { adminDb } = require('./src/lib/firebase/admin');

async function searchAllCollections() {
  console.log('🔍 Suche nach verlorenen Meldungen...');
  
  const collections = [
    'km_meldungen_2026_ld',
    'km_meldungen_2026_kk', 
    'km_meldungen_2026_kkp',
    'km_meldungen',
    'km_meldungen_backup',
    'km_meldungen_deleted'
  ];
  
  for (const collName of collections) {
    try {
      const snapshot = await adminDb.collection(collName).get();
      console.log(`📁 ${collName}: ${snapshot.docs.length} Dokumente`);
      
      if (snapshot.docs.length > 0) {
        snapshot.docs.forEach(doc => {
          const data = doc.data();
          if (data.verschobenVon === 'km_meldungen_2026_kkp' || 
              data.urspruenglicheMeldungId) {
            console.log(`🔍 GEFUNDEN: ${doc.id}`, data);
          }
        });
      }
    } catch (e) {
      console.log(`❌ ${collName}: Nicht verfügbar`);
    }
  }
}

// Ausführen
searchAllCollections().catch(console.error);