/**
 * Einmaliger Fix: Führende 0 aus mitgliedsnummer entfernen
 * Ausführen mit: node scripts/fix-mitgliedsnummer.js
 */
require('dotenv').config({ path: '.env.local' });

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Service Account aus Umgebungsvariablen
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function fixMitgliedsnummern() {
  console.log('Suche Schützen mit führender 0 in mitgliedsnummer...');
  
  const snap = await db.collection('shooters').get();
  let fixed = 0;
  let skipped = 0;

  const batch = db.batch();
  let batchCount = 0;

  for (const docSnap of snap.docs) {
    const data = docSnap.data();
    const nr = data.mitgliedsnummer;
    
    if (nr && typeof nr === 'string' && nr.startsWith('0') && nr.length === 9) {
      // z.B. "080170131" → "80170131"
      const fixed_nr = nr.slice(1);
      console.log(`  Fix: ${nr} → ${fixed_nr} (${data.firstName} ${data.lastName})`);
      batch.update(docSnap.ref, { mitgliedsnummer: fixed_nr });
      batchCount++;
      fixed++;

      // Batch max 500
      if (batchCount >= 490) {
        await batch.commit();
        batchCount = 0;
        console.log('Batch committed...');
      }
    } else {
      skipped++;
    }
  }

  if (batchCount > 0) {
    await batch.commit();
  }

  console.log(`\nFertig: ${fixed} korrigiert, ${skipped} übersprungen`);
}

fixMitgliedsnummern().catch(console.error);
