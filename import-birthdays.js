// Import Geburtstage aus Geburtstage.txt
const fs = require('fs');
const path = require('path');

// Lese die Geburtstage-Datei
const geburtstagsPath = path.join(__dirname, 'Geburtstage.txt');
const content = fs.readFileSync(geburtstagsPath, 'utf-8');

// Parse die Daten
const lines = content.split('\n').filter(line => line.trim());
const parsedBirthdays = [];

// Überspringe Header-Zeile
for (let i = 1; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line) continue;
  
  const parts = line.split('\t');
  if (parts.length >= 3) {
    const nachname = parts[0].trim();
    const vorname = parts[1].trim();
    const geburtsdatum = parts[2].trim();
    
    // Konvertiere deutsches Datum DD.MM.YY zu YYYY-MM-DD
    const dateParts = geburtsdatum.split('.');
    if (dateParts.length === 3) {
      let day = dateParts[0].padStart(2, '0');
      let month = dateParts[1].padStart(2, '0');
      let year = dateParts[2];
      
      // 2-stellige Jahre zu 4-stellig
      if (year.length === 2) {
        const yearNum = parseInt(year);
        // Annahme: 00-30 = 2000-2030, 31-99 = 1931-1999
        year = yearNum <= 30 ? `20${year}` : `19${year}`;
      }
      
      const isoDate = `${year}-${month}-${day}`;
      
      parsedBirthdays.push({
        firstName: vorname,
        lastName: nachname,
        geburtstag: isoDate,
        originalDate: geburtsdatum
      });
    }
  }
}

console.log(`${parsedBirthdays.length} Geburtstage geparst:`);
console.log('\nBeispiel-Einträge:');
parsedBirthdays.slice(0, 10).forEach(member => {
  console.log(`- ${member.firstName} ${member.lastName}: ${member.originalDate} → ${member.geburtstag}`);
});

// Speichere als JSON für Firebase-Import
fs.writeFileSync('birthdays-import.json', JSON.stringify(parsedBirthdays, null, 2));
console.log('\nDaten gespeichert in: birthdays-import.json');
console.log('Bereit für Firebase-Import!');