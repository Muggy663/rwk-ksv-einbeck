// Script zum Matchen und Updaten der SGi Einbeck Mitglieder
const fs = require('fs');

// Lade die 60 SGi Einbeck Mitglieder mit Adressen
const sgiMembers = JSON.parse(fs.readFileSync('final-members.json', 'utf-8'));

console.log('🔍 Matching-Strategie für SGi Einbeck Mitglieder:');
console.log(`📊 ${sgiMembers.length} Mitglieder mit Adressen gefunden\n`);

// Zeige die Namen für manuelles Matching
console.log('👥 SGi Einbeck Mitglieder zum Matchen:');
sgiMembers.forEach((member, index) => {
  console.log(`${String(index + 1).padStart(2, '0')}. ${member.name} (${member.gender})`);
});

console.log('\n📋 Nächste Schritte:');
console.log('1. In Firebase Console: shooters Collection öffnen');
console.log('2. Nach "SGi Einbeck" oder "1icqJ91FFStTBn6ORukx" filtern');
console.log('3. Bestehende SGi Mitglieder finden');
console.log('4. Namen abgleichen mit obiger Liste');
console.log('5. Adressdaten ergänzen');

console.log('\n🤖 Oder: Automatisches Matching über Namen');
console.log('   → Ich kann ein Update-Script erstellen');
console.log('   → Matcht über firstName + lastName');
console.log('   → Ergänzt nur Adressdaten, ändert nichts anderes');

// Erstelle Update-Queries für Firebase
const updateQueries = sgiMembers.map(member => ({
  // Matching-Kriterien
  where: {
    clubId: '1icqJ91FFStTBn6ORukx',
    firstName: member.firstName,
    lastName: member.lastName
  },
  // Update-Daten
  update: {
    strasse: member.strasse,
    plz: member.plz,
    ort: member.ort,
    email: member.email,
    mitgliedsnummer: member.mitgliedsnummer,
    updatedAt: new Date().toISOString()
  }
}));

fs.writeFileSync('update-queries.json', JSON.stringify(updateQueries, null, 2));
console.log('\n💾 Update-Queries gespeichert in: update-queries.json');