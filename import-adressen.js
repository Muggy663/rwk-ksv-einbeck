// Import-Script für Adressen aus Adressen.txt
// Dieses Script parst die Adressdaten und bereitet sie für Firebase vor

const fs = require('fs');
const path = require('path');

// Lese die Adressdatei
const adressenPath = path.join(__dirname, 'Adressen.txt');
const content = fs.readFileSync(adressenPath, 'utf-8');

// Parse die Daten
const lines = content.split('\n').filter(line => line.trim() && !line.startsWith('Anrede'));

const parsedMembers = [];

lines.forEach((line, index) => {
  const parts = line.split('\t');
  if (parts.length >= 4) {
    const anrede = parts[0]?.trim();
    const nameField = parts[1]?.trim();
    const strasse = parts[2]?.trim();
    const plzOrt = parts[3]?.trim();
    const email = parts[4]?.trim();

    // Parse Name
    let vorname = '';
    let nachname = '';
    let geschlecht = 'unknown';

    if (nameField) {
      // Entferne Präfixe wie "Herrn", "Frau", etc.
      let cleanName = nameField.replace(/^(Herrn|Frau|Frl\.|Fam\.|Herr)\s+/, '');
      
      // Bestimme Geschlecht
      if (anrede.includes('Herrn') || anrede.includes('Herr')) {
        geschlecht = 'male';
      } else if (anrede.includes('Frau') || anrede.includes('Frl.')) {
        geschlecht = 'female';
      }

      // Parse Vor- und Nachname
      const nameParts = cleanName.split(' ');
      if (nameParts.length >= 2) {
        vorname = nameParts[0];
        nachname = nameParts.slice(1).join(' ');
      } else {
        nachname = cleanName;
      }
    }

    // Parse PLZ/Ort
    let plz = '';
    let ort = '';
    if (plzOrt) {
      const plzOrtMatch = plzOrt.match(/^(\d{5})\s+(.+)$/);
      if (plzOrtMatch) {
        plz = plzOrtMatch[1];
        ort = plzOrtMatch[2];
      }
    }

    // Nur hinzufügen wenn Name vorhanden
    if (vorname || nachname) {
      parsedMembers.push({
        id: `import_${index + 1}`,
        firstName: vorname,
        lastName: nachname,
        name: `${vorname} ${nachname}`.trim(),
        strasse: strasse || '',
        plz: plz,
        ort: ort,
        email: email || '',
        gender: geschlecht,
        isActive: true,
        // Felder die noch ergänzt werden müssen:
        birthYear: null,
        mitgliedsnummer: null,
        telefon: '',
        mobil: '',
        eintrittsdatum: null,
        // Wird automatisch berechnet:
        alter: 0
      });
    }
  }
});

// Ausgabe der geparsten Daten
console.log(`${parsedMembers.length} Mitglieder geparst:`);
console.log('\nBeispiel-Einträge:');
parsedMembers.slice(0, 5).forEach(member => {
  console.log(`- ${member.name} | ${member.strasse} | ${member.plz} ${member.ort} | ${member.email}`);
});

// Speichere als JSON für weitere Verarbeitung
fs.writeFileSync('parsed-adressen.json', JSON.stringify(parsedMembers, null, 2));
console.log('\nDaten gespeichert in: parsed-adressen.json');

console.log('\nNächste Schritte:');
console.log('1. Überprüfe parsed-adressen.json');
console.log('2. Ergänze fehlende Daten (Geburtsjahr, Mitgliedsnummer, etc.)');
console.log('3. Importiere in Firebase');