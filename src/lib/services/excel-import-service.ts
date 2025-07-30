// src/lib/services/excel-import-service.ts
import { db } from '@/lib/firebase/config';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';

// Erweiterte Geschlechts-Erkennung basierend auf Vornamen
const MALE_NAMES = [
  'alexander', 'andreas', 'christian', 'daniel', 'david', 'frank', 'hans', 'jürgen', 'klaus', 'manfred', 'martin', 'michael', 'peter', 'stefan', 'thomas', 'uwe', 'wolfgang',
  'bernd', 'otto', 'helmut', 'werner', 'günter', 'horst', 'dieter', 'gerhard', 'rolf', 'herbert', 'walter', 'rainer', 'norbert', 'jörg', 'detlef', 'reinhard', 'gerd', 'hartmut', 'volker', 'axel',
  'dirk', 'rüdiger', 'friedhelm', 'wilfried', 'siegfried', 'alfred', 'ernst', 'georg', 'heinrich', 'hermann', 'kurt', 'ludwig', 'rudolf', 'wilhelm', 'johann', 'josef', 'richard', 'robert', 'willi',
  'lars', 'marcel', 'markus', 'matthias', 'oliver', 'ralf', 'roland', 'sebastian', 'thorsten', 'tobias', 'jan', 'jens', 'kai', 'marco', 'sven', 'tim', 'tom', 'björn', 'carsten', 'dennis'
];

const FEMALE_NAMES = [
  'andrea', 'angela', 'anna', 'barbara', 'birgit', 'brigitte', 'christine', 'claudia', 'doris', 'elisabeth', 'gabi', 'heike', 'ingrid', 'karin', 'martina', 'monika', 'petra', 'sabine', 'susanne', 'ursula',
  'maria', 'eva', 'lisa', 'sarah', 'renate', 'christa', 'helga', 'inge', 'margot', 'ruth', 'edith', 'elfriede', 'erna', 'gerda', 'gertrud', 'gisela', 'hannelore', 'hedwig', 'herta', 'hildegard',
  'alexandra', 'antje', 'astrid', 'beate', 'bettina', 'cornelia', 'dagmar', 'diana', 'elke', 'franziska', 'gabriela', 'iris', 'jasmin', 'julia', 'katja', 'katrin', 'manuela', 'melanie', 'nadine', 'nicole',
  'silke', 'simone', 'stefanie', 'tanja', 'ute', 'vanessa', 'yvonne', 'angelika', 'anke', 'annette', 'bärbel', 'christiane', 'daniela', 'jutta', 'michaela', 'regina', 'silvia', 'sonja', 'ulrike'
];

function guessGender(vorname: string): 'male' | 'female' | 'unknown' {
  const name = vorname.toLowerCase().trim();
  
  // Exakte Übereinstimmung zuerst
  if (MALE_NAMES.includes(name)) return 'male';
  if (FEMALE_NAMES.includes(name)) return 'female';
  
  // Teilstring-Suche
  if (MALE_NAMES.some(n => name.includes(n) || n.includes(name))) return 'male';
  if (FEMALE_NAMES.some(n => name.includes(n) || n.includes(name))) return 'female';
  
  // Endungen-basierte Erkennung
  if (name.endsWith('a') && !name.endsWith('cha') && !name.endsWith('sha')) return 'female';
  if (name.endsWith('e') && name.length > 3 && !name.endsWith('ke') && !name.endsWith('le')) return 'female';
  if (name.endsWith('ine') || name.endsWith('ina') || name.endsWith('ela')) return 'female';
  if (name.endsWith('er') || name.endsWith('en') || name.endsWith('us') || name.endsWith('an')) return 'male';
  
  return 'unknown';
}

export interface ExcelMember {
  mitgliedsnummer: string;
  verein: string;
  name: string;
  vorname: string;
  geburtsdatum: string;
}

export async function importMembersFromExcel(members: ExcelMember[]) {
  console.log('importMembersFromExcel gestartet mit', members.length, 'Mitgliedern');
  
  const results = {
    imported: 0,
    skipped: 0,
    errors: [] as string[]
  };

  // Lade bestehende Vereine
  console.log('Lade bestehende Vereine...');
  const clubsSnapshot = await getDocs(collection(db, 'clubs'));
  const existingClubs = new Map(
    clubsSnapshot.docs.map(doc => [doc.data().name, doc.id])
  );
  console.log('Gefundene Vereine:', existingClubs.size);

  for (let i = 0; i < members.length; i++) {
    const member = members[i];
    console.log(`Verarbeite Mitglied ${i + 1}/${members.length}:`, member.vorname, member.name);
    
    try {
      // Überspringe leere oder ungültige Zeilen
      if (!member.name || !member.vorname || 
          member.name.trim() === '' || member.vorname.trim() === '' ||
          member.name === 'Name' || member.vorname === 'Vorname') {
        console.log('Zeile übersprungen (leer/ungültig)');
        results.skipped++;
        continue;
      }

      // Finde oder erstelle Verein
      let clubId = existingClubs.get(member.verein);
      if (!clubId) {
        const clubDoc = await addDoc(collection(db, 'clubs'), {
          name: member.verein,
          createdAt: new Date(),
          isActive: true
        });
        clubId = clubDoc.id;
        existingClubs.set(member.verein, clubId);
      }

      // Berechne Geburtsjahr mit besserer Validierung
      let birthYear = null;
      if (member.geburtsdatum && member.geburtsdatum.trim() !== '') {
        const date = new Date(member.geburtsdatum);
        if (!isNaN(date.getTime()) && date.getFullYear() > 1920 && date.getFullYear() < 2020) {
          birthYear = date.getFullYear();
        }
      }

      // Geschlechts-Erkennung
      const gender = guessGender(member.vorname);

      // Erstelle Schütze mit getrennter KM-Vereinszuordnung
      console.log('Erstelle Schütze in Firebase...');
      const docRef = await addDoc(collection(db, 'rwk_shooters'), {
        name: `${member.vorname} ${member.name}`,
        kmClubId: clubId,        // Für Kreismeisterschaft
        rwkClubId: null,         // Nicht automatisch für RWK
        birthYear,
        gender: gender === 'unknown' ? null : gender,
        mitgliedsnummer: member.mitgliedsnummer,
        isActive: true,
        createdAt: new Date(),
        importedAt: new Date(),
        genderGuessed: gender === 'unknown'
      });
      console.log('Schütze erstellt mit ID:', docRef.id);

      results.imported++;
    } catch (error) {
      results.errors.push(`${member.vorname} ${member.name}: ${error}`);
    }
  }

  return results;
}