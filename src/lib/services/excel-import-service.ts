import { db } from '@/lib/firebase/config';
import { logError, logDebug } from '@/lib/utils/secure-logger';
import { collection, addDoc, getDocs } from 'firebase/firestore';

function getShooterClubId(shooter: any): string | null {
  return shooter?.clubId || shooter?.rwkClubId || shooter?.kmClubId || null;
}

const MALE_NAMES = [
  'alexander', 'andreas', 'christian', 'daniel', 'david', 'frank', 'hans', 'juergen', 'klaus', 'manfred', 'martin', 'michael', 'peter', 'stefan', 'thomas', 'uwe', 'wolfgang',
  'bernd', 'otto', 'helmut', 'werner', 'guenter', 'horst', 'dieter', 'gerhard', 'rolf', 'herbert', 'walter', 'rainer', 'norbert', 'joerg', 'detlef', 'reinhard', 'gerd', 'hartmut', 'volker', 'axel',
  'dirk', 'ruediger', 'friedhelm', 'wilfried', 'siegfried', 'alfred', 'ernst', 'georg', 'heinrich', 'hermann', 'kurt', 'ludwig', 'rudolf', 'wilhelm', 'johann', 'josef', 'richard', 'robert', 'willi',
  'lars', 'marcel', 'markus', 'matthias', 'oliver', 'ralf', 'roland', 'sebastian', 'thorsten', 'tobias', 'jan', 'jens', 'kai', 'marco', 'sven', 'tim', 'tom', 'bjoern', 'carsten', 'dennis'
];

const FEMALE_NAMES = [
  'andrea', 'angela', 'anna', 'barbara', 'birgit', 'brigitte', 'christine', 'claudia', 'doris', 'elisabeth', 'gabi', 'heike', 'ingrid', 'karin', 'martina', 'monika', 'petra', 'sabine', 'susanne', 'ursula',
  'maria', 'eva', 'lisa', 'sarah', 'renate', 'christa', 'helga', 'inge', 'margot', 'ruth', 'edith', 'elfriede', 'erna', 'gerda', 'gertrud', 'gisela', 'hannelore', 'hedwig', 'herta', 'hildegard',
  'alexandra', 'antje', 'astrid', 'beate', 'bettina', 'cornelia', 'dagmar', 'diana', 'elke', 'franziska', 'gabriela', 'iris', 'jasmin', 'julia', 'katja', 'katrin', 'manuela', 'melanie', 'nadine', 'nicole',
  'silke', 'simone', 'stefanie', 'tanja', 'ute', 'vanessa', 'yvonne', 'angelika', 'anke', 'annette', 'baerbel', 'christiane', 'daniela', 'jutta', 'michaela', 'regina', 'silvia', 'sonja', 'ulrike'
];

function guessGender(vorname: string): 'male' | 'female' | 'unknown' {
  const name = vorname.toLowerCase().trim();
  if (MALE_NAMES.includes(name)) return 'male';
  if (FEMALE_NAMES.includes(name)) return 'female';
  if (MALE_NAMES.some(n => name.includes(n) || n.includes(name))) return 'male';
  if (FEMALE_NAMES.some(n => name.includes(n) || n.includes(name))) return 'female';
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
  const TARGET_CLUB = 'SV Salzderhelden';
  const results = { imported: 0, skipped: 0, errors: [] as string[] };

  const filteredMembers = members.filter(m => m.verein === TARGET_CLUB);
  logDebug(`Gefiltert: ${filteredMembers.length} von ${members.length}`);

  const clubsSnapshot = await getDocs(collection(db, 'clubs'));
  const existingClubs = new Map(clubsSnapshot.docs.map(doc => [doc.data().name, doc.id]));

  const shootersSnapshot = await getDocs(collection(db, 'shooters'));
  const existingShooters = new Set(
    shootersSnapshot.docs.map(doc => {
      const data = doc.data();
      return `${data.name}_${getShooterClubId(data)}`;
    })
  );

  for (const member of filteredMembers) {
    try {
      if (!member.name?.trim() || !member.vorname?.trim() || member.name === 'Name') {
        results.skipped++;
        continue;
      }

      let clubId = existingClubs.get(member.verein);
      if (!clubId) {
        const clubDoc = await addDoc(collection(db, 'clubs'), { name: member.verein, createdAt: new Date(), isActive: true });
        clubId = clubDoc.id;
        existingClubs.set(member.verein, clubId);
      }

      let birthYear = null;
      if (member.geburtsdatum?.trim()) {
        const date = new Date(member.geburtsdatum);
        if (!isNaN(date.getTime()) && date.getFullYear() > 1920 && date.getFullYear() < 2020) {
          birthYear = date.getFullYear();
        }
      }

      const gender = guessGender(member.vorname);
      const shooterName = `${member.vorname} ${member.name}`;
      const duplicateKey = `${shooterName}_${clubId}`;

      if (existingShooters.has(duplicateKey)) {
        results.skipped++;
        continue;
      }

      await addDoc(collection(db, 'shooters'), {
        firstName: member.vorname,
        lastName: member.name,
        name: shooterName,
        clubId,
        kmClubId: clubId,
        birthYear,
        gender,
        mitgliedsnummer: member.mitgliedsnummer,
        teamIds: [],
        isActive: true,
        createdAt: new Date(),
        importedAt: new Date(),
        source: 'excel_import'
      });

      existingShooters.add(duplicateKey);
      results.imported++;
    } catch (error) {
      logError(`Import Fehler ${member.vorname} ${member.name}:`, error);
      results.errors.push(`${member.vorname} ${member.name}: ${error}`);
    }
  }

  logDebug(`Import: ${results.imported} importiert, ${results.skipped} uebersprungen`);
  return results;
}
