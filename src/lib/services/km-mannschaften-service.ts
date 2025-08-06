// src/lib/services/km-mannschaften-service.ts
import { db } from '@/lib/firebase/config';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { kannMannschaftBilden } from '@/types/mannschaftsregeln';
import { calculateKMWettkampfklasse } from '@/types/km';
import type { KMMannschaft, KMMeldung, Shooter } from '@/types';

const KM_MANNSCHAFTEN_COLLECTION = 'km_mannschaften';

export async function generateMannschaftenForVerein(
  vereinId: string, 
  disziplinId: string,
  saison: string = '2026'
): Promise<KMMannschaft[]> {
  
  // Lade alle Meldungen des Vereins für diese Disziplin
  const meldungenQuery = query(
    collection(db, 'km_meldungen'),
    where('saison', '==', saison)
  );
  
  const meldungenSnapshot = await getDocs(meldungenQuery);
  const alleMeldungen = meldungenSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as KMMeldung[];
  
  // Filtere nach Verein und Disziplin
  const vereinsMeldungen = alleMeldungen.filter(m => {
    // TODO: Verein über Schütze ermitteln
    return m.disziplinId === disziplinId;
  });
  
  // Lade Schützen-Daten
  const schuetzenQuery = query(
    collection(db, 'rwk_shooters'),
    where('clubId', '==', vereinId)
  );
  
  const schuetzenSnapshot = await getDocs(schuetzenQuery);
  const schuetzen = schuetzenSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Shooter[];
  
  // Gruppiere Meldungen nach Wettkampfklassen
  const klassenGruppen = new Map<string, {
    meldungen: KMMeldung[];
    schuetzen: Shooter[];
    wettkampfklassen: string[];
  }>();
  
  for (const meldung of vereinsMeldungen) {
    const schuetze = schuetzen.find(s => s.id === meldung.schuetzeId);
    if (!schuetze || !schuetze.birthYear || !schuetze.gender) continue;
    
    const wettkampfklasse = calculateKMWettkampfklasse(
      schuetze.birthYear, 
      schuetze.gender as 'male' | 'female', 
      2026
    );
    
    // Finde passende Regel für diese Wettkampfklasse
    let gruppenKey = wettkampfklasse;
    
    // Spezielle Gruppierungen für gemischte Senioren
    if (wettkampfklasse.includes('Senioren I') || wettkampfklasse.includes('Senioren II')) {
      gruppenKey = 'Senioren_I_II';
    } else if (wettkampfklasse.includes('Senioren III') || wettkampfklasse.includes('Senioren IV') || 
               wettkampfklasse.includes('Senioren V') || wettkampfklasse.includes('Senioren VI')) {
      gruppenKey = 'Senioren_III_VI';
    } else if (wettkampfklasse.includes('Schüler')) {
      gruppenKey = 'Schueler';
    } else if (wettkampfklasse.includes('Jugend')) {
      gruppenKey = 'Jugend';
    }
    
    if (!klassenGruppen.has(gruppenKey)) {
      klassenGruppen.set(gruppenKey, {
        meldungen: [],
        schuetzen: [],
        wettkampfklassen: []
      });
    }
    
    const gruppe = klassenGruppen.get(gruppenKey)!;
    gruppe.meldungen.push(meldung);
    gruppe.schuetzen.push(schuetze);
    if (!gruppe.wettkampfklassen.includes(wettkampfklasse)) {
      gruppe.wettkampfklassen.push(wettkampfklasse);
    }
  }
  
  // Erstelle Mannschaften (3er-Teams)
  const mannschaften: KMMannschaft[] = [];
  
  for (const [gruppenKey, gruppe] of klassenGruppen) {
    const { schuetzen: gruppenSchuetzen, wettkampfklassen } = gruppe;
    
    // Prüfe ob Mannschaftsbildung erlaubt ist
    const geschlechter = gruppenSchuetzen.map(s => s.gender as 'male' | 'female');
    const { erlaubt } = kannMannschaftBilden(wettkampfklassen, geschlechter);
    
    if (!erlaubt) continue;
    
    // Sortiere Schützen nach VM-Ergebnissen (stärkste zuerst)
    const sortierteSchuetzen = gruppenSchuetzen.sort((a, b) => {
      const aRinge = a.vmErgebnis?.ringe || 0;
      const bRinge = b.vmErgebnis?.ringe || 0;
      return bRinge - aRinge; // Absteigend sortieren
    });
    
    // Bilde 3er-Teams (stärkste zusammen)
    for (let i = 0; i < sortierteSchuetzen.length; i += 3) {
      const teamSchuetzen = sortierteSchuetzen.slice(i, i + 3);
      if (teamSchuetzen.length === 3) {
        
        const mannschaft: Omit<KMMannschaft, 'id'> = {
          vereinId,
          disziplinId,
          wettkampfklassen,
          saison,
          schuetzenIds: teamSchuetzen.map(s => s.id),
          geschlechtGemischt: new Set(teamSchuetzen.map(s => s.gender)).size > 1
        };
        
        const docRef = await addDoc(collection(db, KM_MANNSCHAFTEN_COLLECTION), mannschaft);
        mannschaften.push({ id: docRef.id, ...mannschaft });
      }
    }
  }
  
  return mannschaften;
}

export async function getMannschaftenForVerein(
  vereinId: string,
  saison: string = '2026'
): Promise<KMMannschaft[]> {
  const snapshot = await getDocs(
    query(
      collection(db, KM_MANNSCHAFTEN_COLLECTION),
      where('vereinId', '==', vereinId),
      where('saison', '==', saison)
    )
  );
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as KMMannschaft[];
}
