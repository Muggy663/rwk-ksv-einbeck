// Korrigiere problematische Mitglieder-Einträge
const fs = require('fs');

// Lade die geparsten Daten
const members = JSON.parse(fs.readFileSync('parsed-adressen.json', 'utf-8'));

// Finde und korrigiere problematische Einträge
const correctedMembers = [];

members.forEach(member => {
  // Spezielle Behandlung für Lachstädter Familie
  if (member.id === 'import_29' && member.lastName === 'Jens und Erik Lachstädter') {
    // Aufteilen in 3 separate Personen
    correctedMembers.push({
      ...member,
      id: 'import_29a',
      firstName: 'Monika',
      lastName: 'Lachstädter',
      name: 'Monika Lachstädter',
      gender: 'female'
    });
    
    correctedMembers.push({
      ...member,
      id: 'import_29b',
      firstName: 'Jens',
      lastName: 'Lachstädter',
      name: 'Jens Lachstädter',
      gender: 'male'
    });
    
    correctedMembers.push({
      ...member,
      id: 'import_29c',
      firstName: 'Erik',
      lastName: 'Lachstädter',
      name: 'Erik Lachstädter',
      gender: 'male'
    });
  }
  // Korrigiere Marcel Bünger (war fälschlich als female markiert)
  else if (member.firstName === 'Marcel' && member.lastName === 'Bünger') {
    correctedMembers.push({
      ...member,
      gender: 'male'
    });
  }
  // Korrigiere andere problematische Geschlechter-Zuordnungen
  else if (member.firstName === 'Stefan' && member.lastName === 'Beumer') {
    correctedMembers.push({
      ...member,
      gender: 'male'
    });
  }
  // Korrigiere Karsten Reinert (war als female markiert)
  else if (member.firstName === 'Karsten' && member.lastName === 'Reinert') {
    correctedMembers.push({
      ...member,
      gender: 'male'
    });
  }
  // Korrigiere Harald Wulff (war als female markiert)
  else if (member.firstName === 'Harald' && member.lastName === 'Wulff') {
    correctedMembers.push({
      ...member,
      gender: 'male'
    });
  }
  // Korrigiere Wilfried Hentschel (war als female markiert)
  else if (member.firstName === 'Wilfried' && member.lastName === 'Hentschel') {
    correctedMembers.push({
      ...member,
      gender: 'male'
    });
  }
  // Korrigiere Sven Buchhage (war als female markiert)
  else if (member.firstName === 'Sven' && member.lastName === 'Buchhage') {
    correctedMembers.push({
      ...member,
      gender: 'male'
    });
  }
  // Korrigiere Marcel Leiding (war als female markiert)
  else if (member.firstName === 'Marcel' && member.lastName === 'Leiding') {
    correctedMembers.push({
      ...member,
      gender: 'male'
    });
  }
  // Korrigiere Hans-Jürgen Reinert (war als female markiert)
  else if (member.firstName === 'Hans-Jürgen' && member.lastName === 'Reinert') {
    correctedMembers.push({
      ...member,
      gender: 'male'
    });
  }
  // Entferne "WhatsApp" E-Mails
  else if (member.email === 'WhatsApp') {
    correctedMembers.push({
      ...member,
      email: ''
    });
  }
  // Entferne problematische E-Mails
  else if (member.email === 'über Jens') {
    correctedMembers.push({
      ...member,
      email: ''
    });
  }
  // Alle anderen Mitglieder unverändert übernehmen
  else {
    correctedMembers.push(member);
  }
});

// Speichere korrigierte Daten
fs.writeFileSync('corrected-members.json', JSON.stringify(correctedMembers, null, 2));

console.log(`Korrigiert: ${members.length} → ${correctedMembers.length} Mitglieder`);
console.log('Korrekturen:');
console.log('- Lachstädter Familie in 3 Personen aufgeteilt');
console.log('- Geschlechter-Zuordnungen korrigiert');
console.log('- "WhatsApp" E-Mails entfernt');
console.log('\nGespeichert in: corrected-members.json');

// Zeige Statistiken
const male = correctedMembers.filter(m => m.gender === 'male').length;
const female = correctedMembers.filter(m => m.gender === 'female').length;
const unknown = correctedMembers.filter(m => m.gender === 'unknown').length;

console.log(`\nStatistiken:`);
console.log(`- Männer: ${male}`);
console.log(`- Frauen: ${female}`);
console.log(`- Unbekannt: ${unknown}`);