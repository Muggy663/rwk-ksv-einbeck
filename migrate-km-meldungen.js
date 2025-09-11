// Migration Script: km_meldungen → km_meldungen_2026_kk
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, addDoc, deleteDoc, doc } = require('firebase/firestore');

const firebaseConfig = {
  // Deine Firebase Config hier einfügen
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function migrateKMMeldungen() {
  try {
    console.log('🚀 Starte Migration...');
    
    // 1. Lade alle Dokumente aus km_meldungen
    const oldCollection = collection(db, 'km_meldungen');
    const snapshot = await getDocs(oldCollection);
    
    console.log(`📄 Gefunden: ${snapshot.docs.length} Dokumente`);
    
    // 2. Kopiere alle Dokumente nach km_meldungen_2026_kk
    let copied = 0;
    for (const docSnapshot of snapshot.docs) {
      const data = docSnapshot.data();
      
      // Füge zu neuer Collection hinzu
      await addDoc(collection(db, 'km_meldungen_2026_kk'), data);
      copied++;
      
      console.log(`✅ Kopiert: ${copied}/${snapshot.docs.length}`);
    }
    
    console.log('🎉 Migration abgeschlossen!');
    console.log(`📊 ${copied} Dokumente erfolgreich kopiert`);
    
    // Optional: Alte Collection löschen (auskommentiert für Sicherheit)
    // console.log('🗑️ Lösche alte Collection...');
    // for (const docSnapshot of snapshot.docs) {
    //   await deleteDoc(doc(db, 'km_meldungen', docSnapshot.id));
    // }
    
  } catch (error) {
    console.error('❌ Fehler:', error);
  }
}

migrateKMMeldungen();