// Test-Update für einen einzelnen Mitarbeiter: Bernhard Drewes
const admin = require('firebase-admin');

// Firebase Admin initialisieren (falls noch nicht geschehen)
try {
  admin.initializeApp();
} catch (error) {
  console.log('Firebase bereits initialisiert');
}

const db = admin.firestore();

async function testBernhardUpdate() {
  try {
    console.log('🔍 Suche nach Bernhard Drewes in SGi Einbeck...');
    
    // Test-Daten für Bernhard Drewes
    const testMember = {
      firstName: "Bernhard",
      lastName: "Drewes",
      strasse: "Domeierstr. 19",
      plz: "37574", 
      ort: "Einbeck",
      email: "",
      mitgliedsnummer: "001"
    };
    
    // Suche nach Bernhard Drewes
    const query = db.collection('shooters')
      .where('clubId', '==', '1icqJ91FFStTBn6ORukx')
      .where('firstName', '==', testMember.firstName)
      .where('lastName', '==', testMember.lastName);
    
    console.log('📋 Query-Parameter:');
    console.log(`   clubId: "1icqJ91FFStTBn6ORukx"`);
    console.log(`   firstName: "${testMember.firstName}"`);
    console.log(`   lastName: "${testMember.lastName}"`);
    
    const snapshot = await query.get();
    
    if (snapshot.empty) {
      console.log('❌ Bernhard Drewes NICHT gefunden!');
      console.log('\n🔍 Mögliche Gründe:');
      console.log('   - Name ist anders geschrieben in Firebase');
      console.log('   - ClubId stimmt nicht');
      console.log('   - Mitglied existiert nicht');
      
      console.log('\n💡 Prüfe manuell in Firebase Console:');
      console.log('   1. Gehe zu shooters Collection');
      console.log('   2. Filter: clubId == "1icqJ91FFStTBn6ORukx"');
      console.log('   3. Suche nach "Bernhard" oder "Drewes"');
      
    } else {
      console.log('✅ Bernhard Drewes GEFUNDEN!');
      console.log(`📄 Document ID: ${snapshot.docs[0].id}`);
      
      const currentData = snapshot.docs[0].data();
      console.log('\n📊 Aktuelle Daten:');
      console.log(`   Name: ${currentData.firstName} ${currentData.lastName}`);
      console.log(`   Strasse: ${currentData.strasse || 'LEER'}`);
      console.log(`   PLZ: ${currentData.plz || 'LEER'}`);
      console.log(`   Ort: ${currentData.ort || 'LEER'}`);
      console.log(`   Email: ${currentData.email || 'LEER'}`);
      console.log(`   Mitgl.-Nr.: ${currentData.mitgliedsnummer || 'LEER'}`);
      
      // Führe das Update durch
      console.log('\n🔄 Führe Update durch...');
      
      await snapshot.docs[0].ref.update({
        strasse: testMember.strasse,
        plz: testMember.plz,
        ort: testMember.ort,
        email: testMember.email,
        mitgliedsnummer: testMember.mitgliedsnummer,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      console.log('✅ UPDATE ERFOLGREICH!');
      console.log('\n📊 Neue Daten:');
      console.log(`   Strasse: ${testMember.strasse}`);
      console.log(`   PLZ: ${testMember.plz}`);
      console.log(`   Ort: ${testMember.ort}`);
      console.log(`   Mitgl.-Nr.: ${testMember.mitgliedsnummer}`);
      
      console.log('\n🚀 Jetzt in Vereinssoftware prüfen:');
      console.log('   http://localhost:3002/vereinssoftware/mitglieder');
      console.log('   → Bernhard Drewes sollte jetzt Adresse haben!');
    }
    
  } catch (error) {
    console.error('❌ Fehler beim Test:', error);
  }
}

testBernhardUpdate();