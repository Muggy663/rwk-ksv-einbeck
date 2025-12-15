// Korrektur für Disziplin 11.11 - muss Auflage sein
const admin = require('firebase-admin');

// Firebase Admin initialisieren (falls noch nicht geschehen)
if (!admin.apps.length) {
  const serviceAccount = require('./serviceAccountKey.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function fixDisziplin1111() {
  try {
    // Finde Disziplin 11.11
    const disziplinRef = db.collection('km_disziplinen').doc('Zlnqwo6I1KYyOzeO0CPU');
    
    // Update auflage auf true
    await disziplinRef.update({
      auflage: true
    });
    
    console.log('✅ Disziplin 11.11 erfolgreich auf auflage: true gesetzt');
  } catch (error) {
    console.error('❌ Fehler:', error);
  }
}

fixDisziplin1111();