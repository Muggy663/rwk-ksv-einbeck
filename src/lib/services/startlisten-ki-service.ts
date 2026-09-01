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

export function analyzeStartlist(_meldungen: any[], startliste: any[], config: any): KIAnalyse {
  const konflikte: KIKonflikt[] = [];
  const optimierungen: KIOptimierung[] = [];

  // Prüfe auf Stand-Zeit-Konflikte (nur bei gleicher Disziplin)
  const zeitStandMap = new Map<string, any[]>();
  startliste.forEach(starter => {
    const key = `${starter.stand}-${starter.startzeit}`;
    if (!zeitStandMap.has(key)) zeitStandMap.set(key, []);
    zeitStandMap.get(key)!.push(starter);
  });

  zeitStandMap.forEach((starter, zeitStand) => {
    if (starter.length > 1) {
      // Prüfe Disziplinen-Kompatibilität
      const disziplinen = [...new Set(starter.map(s => s.disziplin))];
      const lichtpunktStarter = starter.filter(s => s.disziplin?.toLowerCase().includes('licht'));
      
      // Lichtpunkt braucht spezielle Stände (101/102)
      if (lichtpunktStarter.length > 0) {
        const [stand] = zeitStand.split('-');
        if (stand !== '101' && stand !== '102') {
          konflikte.push({
            titel: 'Lichtpunkt-Stand-Konflikt',
            beschreibung: `Lichtpunkt-Schützen benötigen Stand 101 oder 102, nicht Stand ${stand}`,
            betroffeneStarter: lichtpunktStarter.map(s => s.id),
            loesungsvorschlaege: [
              'Lichtpunkt-Schützen auf Stand 101 oder 102 verschieben',
              'Konfiguration um Stände 101/102 erweitern',
              `Betroffene: ${lichtpunktStarter.map(s => s.name).join(', ')}`
            ]
          });
          return;
        }
      }
      
      // Echter Konflikt: Mehrere Starter gleicher Disziplin
      if (starter.length > 1) {
        const [stand] = zeitStand.split('-');
        const betroffeneNamen = starter.map((s: any) => s.name || 'Unbekannt');
        
        konflikte.push({
          titel: 'Stand-Zeit-Konflikt',
          beschreibung: `${starter.length} Starter (${disziplinen[0]}) haben gleichen Stand zur gleichen Zeit: ${zeitStand}`,
          betroffeneStarter: starter.map(s => s.id),
          loesungsvorschlaege: [
            `Verschieben Sie einen der Starter auf einen anderen Stand (${config.verfuegbareStaende?.filter((s: string) => s !== stand).slice(0, 3).join(', ')})`,
            `Ändern Sie die Startzeit für einen Starter (z.B. +${config.durchgangsDauer + config.wechselzeit} Min)`,
            `Betroffene Starter: ${betroffeneNamen.join(', ')}`,
            'Klicken Sie auf die Dropdown-Felder um Stand oder Zeit zu ändern'
          ]
        });
      }
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
  score = Math.max(0, score);

  return { score, konflikte, empfehlungen: [], optimierungen };
}
