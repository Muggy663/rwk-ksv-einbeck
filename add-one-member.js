// Node.js Script zum Hinzufügen eines Test-Mitglieds
// Führe aus mit: node add-one-member.js

const admin = require('firebase-admin');

// Firebase Admin SDK initialisieren
// Du musst den Service Account Key haben oder Admin SDK konfigurieren
try {
  admin.initializeApp({
    // Hier würde normalerweise der Service Account stehen
    // Alternativ: Führe das über Firebase CLI aus
  });
} catch (error) {
  console.log('Firebase Admin bereits initialisiert oder Fehler:', error.message);
}

const db = admin.firestore();

async function addTestMember() {
  try {
    // Test-Mitglied: Bernhard Drewes
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
      clubId: "1icqJ91FFStTBn6ORukx", // Deine SGi Einbeck Club-ID
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    // Füge zu shooters Collection hinzu
    const docRef = await db.collection('shooters').add(testMember);
    
    console.log('✅ Test-Mitglied erfolgreich hinzugefügt!');
    console.log('📄 Document ID:', docRef.id);
    console.log('👤 Name:', testMember.name);
    console.log('🏠 Adresse:', `${testMember.strasse}, ${testMember.plz} ${testMember.ort}`);
    console.log('🏢 Club:', testMember.clubId);
    console.log('🔢 Mitgl.-Nr.:', testMember.mitgliedsnummer);
    
    console.log('\n🚀 Jetzt prüfen:');
    console.log('   http://localhost:3002/vereinssoftware/mitglieder');
    
  } catch (error) {
    console.error('❌ Fehler beim Hinzufügen:', error);
  }
}

addTestMember();