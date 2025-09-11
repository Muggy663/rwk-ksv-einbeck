// Parser für das neue Adressformat
const fs = require('fs');
const path = require('path');

// Lese die überarbeitete Adressdatei
const adressenPath = path.join(__dirname, 'Adressen.txt');
const content = fs.readFileSync(adressenPath, 'utf-8');

// Parse die Daten - jede Zeile ist ein Mitglied
const lines = content.split('\n').filter(line => line.trim());

const parsedMembers = [];

lines.forEach((line, index) => {
  const cleanLine = line.trim();
  if (!cleanLine) return;

  // Parse das Format: "Name, Adresse, PLZ Ort, email"
  const parts = cleanLine.split(',').map(p => p.trim());
  
  if (parts.length >= 3) {
    let fullName = parts[0];
    const strasse = parts[1];
    const plzOrt = parts[2];
    const email = parts[3] || '';

    // Entferne Präfixe und Zusätze
    fullName = fullName.replace(/^(Herr|Frau|Frl\.)\s+/, '');
    fullName = fullName.replace(/\s*\([^)]*\)$/, ''); // Entferne (SPARKASSE EINBECK)

    // Parse Vor- und Nachname
    let vorname = '';
    let nachname = '';
    
    const nameParts = fullName.split(' ');
    if (nameParts.length >= 2) {
      vorname = nameParts[0];
      nachname = nameParts.slice(1).join(' ');
    } else {
      nachname = fullName;
    }

    // Parse PLZ/Ort
    let plz = '';
    let ort = '';
    const plzOrtMatch = plzOrt.match(/^(\d{5})\s+(.+)$/);
    if (plzOrtMatch) {
      plz = plzOrtMatch[1];
      ort = plzOrtMatch[2];
    } else {
      ort = plzOrt;
    }

    // Bestimme Geschlecht basierend auf Namen (einfache Heuristik)
    let geschlecht = 'unknown';
    const femaleNames = ['Beate', 'Ursula', 'Monika', 'Inge', 'Lisa', 'Lucia', 'Stephanie', 'Nathalie', 'Patricia', 'Kerstin', 'Olivia', 'Sara', 'Sigrid', 'Ulrike', 'Annika', 'Daniela', 'Martina', 'Regine', 'Antonia', 'Carolin', 'Cecile', 'Ronja', 'Ingrid'];
    const maleNames = ['Bernhard', 'Hans-Gert', 'Ingo', 'Horst', 'Eckhard', 'Uwe', 'Reiner', 'Elias', 'Paul', 'Frank', 'Friedel', 'Helmut', 'Jens', 'Erik', 'Patrick', 'Julien', 'Karl-Arthur', 'Karsten', 'Klaus', 'Alexander', 'Martin', 'Leon', 'Wilfried', 'Marcel', 'Nikita', 'Sven', 'Michael', 'Julius', 'Harald', 'Thomas', 'Stefan', 'Ludwig', 'Dirk', 'Hans-Jürgen', 'Andrej'];
    
    if (femaleNames.includes(vorname)) {
      geschlecht = 'female';
    } else if (maleNames.includes(vorname)) {
      geschlecht = 'male';
    }

    // Nur hinzufügen wenn Name vorhanden
    if (vorname || nachname) {
      parsedMembers.push({
        id: `member_${String(index + 1).padStart(3, '0')}`,
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
        mitgliedsnummer: String(index + 1).padStart(3, '0'), // Automatische Nummerierung
        telefon: '',
        mobil: '',
        eintrittsdatum: null,
        // Wird automatisch berechnet:
        alter: 0,
        clubId: 'SGi_Einbeck' // Feste Club-ID
      });
    }
  }
});

// Ausgabe der geparsten Daten
console.log(`${parsedMembers.length} Mitglieder geparst:`);
console.log('\nBeispiel-Einträge:');
parsedMembers.slice(0, 5).forEach(member => {
  console.log(`- ${member.name} (${member.gender}) | ${member.strasse} | ${member.plz} ${member.ort} | ${member.email}`);
});

// Statistiken
const male = parsedMembers.filter(m => m.gender === 'male').length;
const female = parsedMembers.filter(m => m.gender === 'female').length;
const unknown = parsedMembers.filter(m => m.gender === 'unknown').length;

console.log(`\nStatistiken:`);
console.log(`- Männer: ${male}`);
console.log(`- Frauen: ${female}`);
console.log(`- Unbekannt: ${unknown}`);
console.log(`- Mit E-Mail: ${parsedMembers.filter(m => m.email).length}`);

// Speichere als JSON für weitere Verarbeitung
fs.writeFileSync('final-members.json', JSON.stringify(parsedMembers, null, 2));
console.log('\nDaten gespeichert in: final-members.json');
console.log('\nBereit für sicheren Test-Import!');