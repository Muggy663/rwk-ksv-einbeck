// KI-Service für Startlisten-Analyse und Optimierung

export interface KIKonflikt {
  titel: string;
  beschreibung: string;
  betroffeneStarter?: string[];
  loesungsvorschlaege?: string[];
}

export interface KIEmpfehlung {
  titel: string;
  beschreibung: string;
}

export interface KIOptimierung {
  titel: string;
  beschreibung: string;
}

export interface KIAnalyse {
  score: number;
  konflikte: KIKonflikt[];
  empfehlungen: KIEmpfehlung[];
  optimierungen: KIOptimierung[];
}

export function analyzeStartlist(meldungen: any[], startliste: any[], config: any): KIAnalyse {
  const konflikte: KIKonflikt[] = [];
  const empfehlungen: KIEmpfehlung[] = [];
  const optimierungen: KIOptimierung[] = [];

  // Prüfe auf Stand-Zeit-Konflikte
  const zeitStandMap = new Map<string, string[]>();
  startliste.forEach(starter => {
    const key = `${starter.stand}-${starter.startzeit}`;
    if (!zeitStandMap.has(key)) zeitStandMap.set(key, []);
    zeitStandMap.get(key)!.push(starter.id);
  });

  zeitStandMap.forEach((starterIds, zeitStand) => {
    if (starterIds.length > 1) {
      const [stand, zeit] = zeitStand.split('-');
      const betroffeneNamen = starterIds.map(id => {
        const starter = startliste.find(s => s.id === id);
        return starter?.name || 'Unbekannt';
      });
      
      konflikte.push({
        titel: 'Stand-Zeit-Konflikt',
        beschreibung: `${starterIds.length} Starter haben gleichen Stand zur gleichen Zeit: ${zeitStand}`,
        betroffeneStarter: starterIds,
        loesungsvorschlaege: [
          `Verschieben Sie einen der Starter auf einen anderen Stand (${config.verfuegbareStaende?.filter(s => s !== stand).slice(0, 3).join(', ')})`,
          `Ändern Sie die Startzeit für einen Starter (z.B. +${config.durchgangsDauer + config.wechselzeit} Min)`,
          `Betroffene Starter: ${betroffeneNamen.join(', ')}`,
          'Klicken Sie auf die Dropdown-Felder um Stand oder Zeit zu ändern'
        ]
      });
    }
  });

  // Prüfe Gewehr-Sharing
  const gewehrSharing = startliste.filter(s => s.hinweise === 'Gewehr geteilt');
  if (gewehrSharing.length > 0) {
    optimierungen.push({
      titel: 'Gewehr-Sharing erkannt',
      beschreibung: `${gewehrSharing.length} Starter teilen sich Gewehre - Zeiten automatisch angepasst`
    });
  }

  // Berechne Score
  let score = 100;
  score -= konflikte.length * 20;
  score -= empfehlungen.length * 5;
  score = Math.max(0, score);

  return { score, konflikte, empfehlungen, optimierungen };
}

export function optimizeStartlist(startliste: any[], config: any): any[] {
  // Einfache Optimierung: Sortiere nach Namen
  return startliste.sort((a, b) => a.name.localeCompare(b.name));
}