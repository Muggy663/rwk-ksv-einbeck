// Automatisches Update der Adressdaten für SGi Einbeck Mitglieder
const admin = require('firebase-admin');
const fs = require('fs');

// Firebase Admin initialisieren (falls noch nicht geschehen)
try {
  admin.initializeApp();
} catch (error) {
  console.log('Firebase bereits initialisiert');
}

const db = admin.firestore();

async function updateAddresses() {
  try {
    // Lade die 60 Mitglieder mit Adressen
    const addressData = JSON.parse(fs.readFileSync('final-members.json', 'utf-8'));
    
    console.log('🔍 Starte Address-Update für SGi Einbeck...');
    console.log(`📊 ${addressData.length} Mitglieder mit Adressen`);
    
    let updated = 0;
    let notFound = 0;
    let errors = 0;
    
    // Für jedes Mitglied mit Adresse
    for (const member of addressData) {
      try {
        // Suche in shooters nach Name + Club
        const query = db.collection('shooters')
          .where('clubId', '==', '1icqJ91FFStTBn6ORukx')
          .where('firstName', '==', member.firstName)
          .where('lastName', '==', member.lastName);
        
        const snapshot = await query.get();
        
        if (!snapshot.empty) {
          // Mitglied gefunden - Update Adressdaten
          const doc = snapshot.docs[0];
          
          await doc.ref.update({
            strasse: member.strasse || '',
            plz: member.plz || '',
            ort: member.ort || '',
            email: member.email || '',
            mitgliedsnummer: member.mitgliedsnummer || '',
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
          
          console.log(`✅ ${member.name} - Adresse aktualisiert`);
          updated++;
          
        } else {
          console.log(`❓ ${member.name} - Nicht gefunden`);
          notFound++;
        }
        
        // Kurze Pause zwischen Updates
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`❌ ${member.name} - Fehler:`, error.message);
        errors++;
      }
    }
    
    console.log('\n📊 Update-Statistik:');
    console.log(`✅ Aktualisiert: ${updated}`);
    console.log(`❓ Nicht gefunden: ${notFound}`);
    console.log(`❌ Fehler: ${errors}`);
    
    if (notFound > 0) {
      console.log('\n💡 Nicht gefundene Mitglieder könnten:');
      console.log('   - Andere Namen in Firebase haben');
      console.log('   - Noch nicht in shooters sein');
      console.log('   - Als neue Mitglieder hinzugefügt werden');
    }
    
  } catch (error) {
    console.error('❌ Hauptfehler:', error);
  }
}

// Sicherheitsabfrage
console.log('⚠️  ACHTUNG: Dieses Script wird Adressdaten in der shooters Collection aktualisieren!');
console.log('📋 Es werden nur Adressfelder ergänzt, keine anderen Daten geändert.');
console.log('🎯 Ziel: 97 SGi Einbeck Mitglieder mit Adressen versorgen');
console.log('\n▶️  Zum Starten: updateAddresses() aufrufen');

// Exportiere Funktion für manuellen Aufruf
module.exports = { updateAddresses };