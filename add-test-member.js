// Füge ein Test-Mitglied zur shooters Collection hinzu
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc } = require('firebase/firestore');

// Firebase Config (aus deiner App)
const firebaseConfig = {
  apiKey: "AIzaSyA8N0-2uFhGjhOIIFhOIFhOIFhOIFhOIFhO", // Placeholder - echte Config aus deiner App
  authDomain: "rwk-einbeck.firebaseapp.com",
  projectId: "rwk-einbeck",
  storageBucket: "rwk-einbeck.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdefghijklmnop"
};

// Firebase initialisieren
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function addTestMember() {
  try {
    // Test-Mitglied aus deiner Liste
    const testMember = {
      firstName: "Bernhard",
      lastName: "Drewes",
      name: "Bernhard Drewes",
      strasse: "Domeierstr. 19",
      plz: "37574",
      ort: "Einbeck",
      email: "",
      telefon: "",
      mobil: "",
      mitgliedsnummer: "001",
      gender: "male",
      isActive: true,
      birthYear: null,
      alter: 0,
      eintrittsdatum: null,
      clubId: "SGi_Einbeck", // Deine Club-ID
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Füge zu shooters Collection hinzu
    const docRef = await addDoc(collection(db, 'shooters'), testMember);
    
    console.log('✅ Test-Mitglied erfolgreich hinzugefügt!');
    console.log('📄 Document ID:', docRef.id);
    console.log('👤 Name:', testMember.name);
    console.log('🏠 Adresse:', `${testMember.strasse}, ${testMember.plz} ${testMember.ort}`);
    console.log('🔢 Mitgl.-Nr.:', testMember.mitgliedsnummer);
    
    console.log('\n🚀 Jetzt in der Vereinssoftware prüfen:');
    console.log('   http://localhost:3002/vereinssoftware/mitglieder');
    
  } catch (error) {
    console.error('❌ Fehler beim Hinzufügen:', error);
  }
}

addTestMember();