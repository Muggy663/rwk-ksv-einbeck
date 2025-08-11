// KI-Service für Startlisten-Analyse und Optimierung

export interface KIKonflikt {
  titel: string;
  beschreibung: string;
  betroffeneStarter?: string[];
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
      konflikte.push({
        titel: 'Stand-Zeit-Konflikt',
        beschreibung: `${starterIds.length} Starter haben gleichen Stand zur gleichen Zeit: ${zeitStand}`,
        betroffeneStarter: starterIds
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