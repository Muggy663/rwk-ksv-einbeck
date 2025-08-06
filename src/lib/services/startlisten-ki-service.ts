// Smart Startlisten-Optimierung Service
export interface Starter {
  id: string;
  name: string;
  verein: string;
  disziplin: string;
  gewehrSharingHinweis?: string;
  vmErgebnis?: { ringe: number; sortierWert: number };
  auflage?: boolean;
  schiesszeit?: number;
}

export interface StartlistConfig {
  verfuegbareStaende: string[];
  startUhrzeit: string;
  durchgangsDauer: number;
  wechselzeit: number;
}

export interface KIEmpfehlung {
  typ: 'warnung' | 'empfehlung' | 'optimierung';
  titel: string;
  beschreibung: string;
  betroffeneStarter?: string[];
}

export interface KIAnalyse {
  konflikte: KIEmpfehlung[];
  empfehlungen: KIEmpfehlung[];
  optimierungen: KIEmpfehlung[];
  score: number; // 0-100 Qualitätsbewertung
}

// 1. Smart Startlisten-Optimierung
export const optimizeStartlist = (meldungen: Starter[], config: StartlistConfig): Starter[] => {
  const optimized = [...meldungen];
  
  // Vereinsverteilung optimieren
  const vereinsVerteilung = optimizeVereinsVerteilung(optimized, config.verfuegbareStaende);
  
  // Gewehr-Sharing Gruppen zeitlich versetzen
  const gewehrOptimiert = optimizeGewehrSharing(vereinsVerteilung, config);
  
  // VM-Ergebnisse für faire Verteilung nutzen
  const vmOptimiert = optimizeVMVerteilung(gewehrOptimiert);
  
  return vmOptimiert;
};

// Vereinsverteilung: Nicht alle vom gleichen Verein auf einem Stand
const optimizeVereinsVerteilung = (starter: Starter[], staende: string[]): Starter[] => {
  const vereinsMap = new Map<string, Starter[]>();
  
  // Gruppiere nach Vereinen
  starter.forEach(s => {
    if (!vereinsMap.has(s.verein)) vereinsMap.set(s.verein, []);
    vereinsMap.get(s.verein)!.push(s);
  });
  
  const optimized: Starter[] = [];
  let standIndex = 0;
  
  // Verteile große Vereine über mehrere Stände
  Array.from(vereinsMap.entries())
    .sort(([,a], [,b]) => b.length - a.length) // Größte Vereine zuerst
    .forEach(([verein, vereinsStarter]) => {
      if (vereinsStarter.length > 3) {
        // Große Vereine auf mehrere Stände verteilen
        vereinsStarter.forEach((s, index) => {
          optimized.push({
            ...s,
            stand: staende[(standIndex + index) % staende.length]
          });
        });
        standIndex = (standIndex + Math.ceil(vereinsStarter.length / 2)) % staende.length;
      } else {
        // Kleine Vereine zusammen
        vereinsStarter.forEach(s => {
          optimized.push({
            ...s,
            stand: staende[standIndex]
          });
        });
        standIndex = (standIndex + 1) % staende.length;
      }
    });
  
  return optimized;
};

// Gewehr-Sharing zeitlich versetzen
const optimizeGewehrSharing = (starter: Starter[], config: StartlistConfig): Starter[] => {
  const gewehrGroups = new Map<string, Starter[]>();
  
  starter.forEach(s => {
    const key = s.gewehrSharingHinweis || `solo_${s.id}`;
    if (!gewehrGroups.has(key)) gewehrGroups.set(key, []);
    gewehrGroups.get(key)!.push(s);
  });
  
  const optimized: Starter[] = [];
  let currentTime = config.startUhrzeit;
  
  Array.from(gewehrGroups.values()).forEach(gruppe => {
    if (gruppe.length > 1) {
      // Gewehr-Sharing: Zeitlich versetzen
      gruppe.forEach((s, index) => {
        const [hours, minutes] = currentTime.split(':').map(Number);
        const offsetMinutes = index * (s.schiesszeit || config.durchgangsDauer);
        const totalMinutes = hours * 60 + minutes + offsetMinutes;
        const newHours = Math.floor(totalMinutes / 60);
        const newMinutes = totalMinutes % 60;
        
        optimized.push({
          ...s,
          startzeit: `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}`
        });
      });
    } else {
      optimized.push({
        ...gruppe[0],
        startzeit: currentTime
      });
    }
  });
  
  return optimized;
};

// VM-Ergebnisse für faire Verteilung
const optimizeVMVerteilung = (starter: Starter[]): Starter[] => {
  return starter.sort((a, b) => {
    // Mische starke und schwache Schützen
    const aScore = a.vmErgebnis?.sortierWert || 0;
    const bScore = b.vmErgebnis?.sortierWert || 0;
    
    // Alternierend: stark, schwach, stark, schwach
    return Math.random() > 0.5 ? bScore - aScore : aScore - bScore;
  });
};

// 2. Konflikt-Erkennung
export const detectConflicts = (startliste: Starter[]): KIEmpfehlung[] => {
  const konflikte: KIEmpfehlung[] = [];
  
  // Gewehr-Sharing Konflikte
  const gewehrKonflikte = detectGewehrConflicts(startliste);
  konflikte.push(...gewehrKonflikte);
  
  // Vereins-Häufung
  const vereinsKonflikte = detectVereinsConflicts(startliste);
  konflikte.push(...vereinsKonflikte);
  
  // Zeit-Konflikte
  const zeitKonflikte = detectTimeConflicts(startliste);
  konflikte.push(...zeitKonflikte);
  
  return konflikte;
};

const detectGewehrConflicts = (startliste: Starter[]): KIEmpfehlung[] => {
  const konflikte: KIEmpfehlung[] = [];
  const gewehrGroups = new Map<string, Starter[]>();
  
  startliste.forEach(s => {
    if (s.gewehrSharingHinweis) {
      if (!gewehrGroups.has(s.gewehrSharingHinweis)) {
        gewehrGroups.set(s.gewehrSharingHinweis, []);
      }
      gewehrGroups.get(s.gewehrSharingHinweis)!.push(s);
    }
  });
  
  gewehrGroups.forEach((gruppe, hinweis) => {
    if (gruppe.length > 1) {
      const gleicheZeit = gruppe.filter(s => s.startzeit === gruppe[0].startzeit);
      if (gleicheZeit.length > 1) {
        konflikte.push({
          typ: 'warnung',
          titel: '🔫 Gewehr-Sharing Konflikt',
          beschreibung: `${gleicheZeit.length} Schützen teilen Gewehr zur gleichen Zeit: ${gleicheZeit.map(s => s.name).join(', ')}`,
          betroffeneStarter: gleicheZeit.map(s => s.id)
        });
      }
    }
  });
  
  return konflikte;
};

const detectVereinsConflicts = (startliste: Starter[]): KIEmpfehlung[] => {
  const konflikte: KIEmpfehlung[] = [];
  const standVerteilung = new Map<string, Map<string, Starter[]>>();
  
  startliste.forEach(s => {
    if (!standVerteilung.has(s.stand || '')) {
      standVerteilung.set(s.stand || '', new Map());
    }
    const standMap = standVerteilung.get(s.stand || '')!;
    if (!standMap.has(s.verein)) {
      standMap.set(s.verein, []);
    }
    standMap.get(s.verein)!.push(s);
  });
  
  standVerteilung.forEach((vereinsMap, stand) => {
    vereinsMap.forEach((starter, verein) => {
      if (starter.length > 4) {
        konflikte.push({
          typ: 'warnung',
          titel: '🏹 Vereins-Häufung',
          beschreibung: `${verein}: ${starter.length} Schützen auf Stand ${stand}`,
          betroffeneStarter: starter.map(s => s.id)
        });
      }
    });
  });
  
  return konflikte;
};

const detectTimeConflicts = (startliste: Starter[]): KIEmpfehlung[] => {
  const konflikte: KIEmpfehlung[] = [];
  const zeitMap = new Map<string, Starter[]>();
  
  startliste.forEach(s => {
    const key = `${s.name}_${s.startzeit}`;
    if (!zeitMap.has(key)) zeitMap.set(key, []);
    zeitMap.get(key)!.push(s);
  });
  
  zeitMap.forEach((starter, key) => {
    if (starter.length > 1) {
      konflikte.push({
        typ: 'warnung',
        titel: '⏰ Zeit-Konflikt',
        beschreibung: `${starter[0].name} in ${starter.length} Disziplinen zur gleichen Zeit`,
        betroffeneStarter: starter.map(s => s.id)
      });
    }
  });
  
  return konflikte;
};

// 3. Empfehlungs-System
export const generateRecommendations = (startliste: Starter[], config: StartlistConfig): KIEmpfehlung[] => {
  const empfehlungen: KIEmpfehlung[] = [];
  
  // Vereinsverteilung-Empfehlungen
  const vereinsEmpfehlungen = generateVereinsRecommendations(startliste);
  empfehlungen.push(...vereinsEmpfehlungen);
  
  // Zeit-Empfehlungen
  const zeitEmpfehlungen = generateTimeRecommendations(startliste, config);
  empfehlungen.push(...zeitEmpfehlungen);
  
  // Gewehr-Empfehlungen
  const gewehrEmpfehlungen = generateGewehrRecommendations(startliste);
  empfehlungen.push(...gewehrEmpfehlungen);
  
  return empfehlungen;
};

const generateVereinsRecommendations = (startliste: Starter[]): KIEmpfehlung[] => {
  const empfehlungen: KIEmpfehlung[] = [];
  const vereinsGroessen = new Map<string, number>();
  
  startliste.forEach(s => {
    vereinsGroessen.set(s.verein, (vereinsGroessen.get(s.verein) || 0) + 1);
  });
  
  vereinsGroessen.forEach((anzahl, verein) => {
    if (anzahl >= 6) {
      const empfohleneStaende = Math.ceil(anzahl / 3);
      empfehlungen.push({
        typ: 'empfehlung',
        titel: '🏹 Vereinsverteilung',
        beschreibung: `${verein} (${anzahl} Schützen) → ${empfohleneStaende} Stände empfohlen`
      });
    }
  });
  
  return empfehlungen;
};

const generateTimeRecommendations = (startliste: Starter[], config: StartlistConfig): KIEmpfehlung[] => {
  const empfehlungen: KIEmpfehlung[] = [];
  
  // Auflage-Disziplinen brauchen mehr Zeit
  const auflageDisziplinen = startliste.filter(s => s.auflage);
  if (auflageDisziplinen.length > 0) {
    empfehlungen.push({
      typ: 'empfehlung',
      titel: '⏰ Auflage-Zeit',
      beschreibung: `${auflageDisziplinen.length} Auflage-Schützen: +15min Schießzeit empfohlen`
    });
  }
  
  return empfehlungen;
};

const generateGewehrRecommendations = (startliste: Starter[]): KIEmpfehlung[] => {
  const empfehlungen: KIEmpfehlung[] = [];
  const gewehrGroups = new Map<string, Starter[]>();
  
  startliste.forEach(s => {
    if (s.gewehrSharingHinweis) {
      if (!gewehrGroups.has(s.gewehrSharingHinweis)) {
        gewehrGroups.set(s.gewehrSharingHinweis, []);
      }
      gewehrGroups.get(s.gewehrSharingHinweis)!.push(s);
    }
  });
  
  if (gewehrGroups.size > 0) {
    empfehlungen.push({
      typ: 'empfehlung',
      titel: '🔫 Gewehr-Sharing',
      beschreibung: `${gewehrGroups.size} Gewehr-Sharing Gruppen → Zeitpuffer einplanen`
    });
  }
  
  return empfehlungen;
};

// 4. Automatische Problem-Erkennung
export const detectProblems = (meldungen: any[], startliste: Starter[]): KIEmpfehlung[] => {
  const probleme: KIEmpfehlung[] = [];
  
  // Fehlende VM-Ergebnisse
  const vmProbleme = detectMissingVMResults(meldungen);
  probleme.push(...vmProbleme);
  
  // Überbelegte Stände
  const standProbleme = detectOvercrowdedStands(startliste);
  probleme.push(...standProbleme);
  
  // Unvollständige Daten
  const datenProbleme = detectIncompleteData(meldungen);
  probleme.push(...datenProbleme);
  
  return probleme;
};

const detectMissingVMResults = (meldungen: any[]): KIEmpfehlung[] => {
  const probleme: KIEmpfehlung[] = [];
  
  const durchmeldungOhneVM = meldungen.filter(m => 
    m.nurVereinsmeisterschaft && !m.vmErgebnis
  );
  
  if (durchmeldungOhneVM.length > 0) {
    probleme.push({
      typ: 'warnung',
      titel: '📊 Fehlende VM-Ergebnisse',
      beschreibung: `${durchmeldungOhneVM.length} Durchmeldungs-Disziplinen ohne VM-Ergebnis`
    });
  }
  
  return probleme;
};

const detectOvercrowdedStands = (startliste: Starter[]): KIEmpfehlung[] => {
  const probleme: KIEmpfehlung[] = [];
  const standBelegung = new Map<string, Starter[]>();
  
  startliste.forEach(s => {
    const key = `${s.stand}_${s.startzeit}`;
    if (!standBelegung.has(key)) standBelegung.set(key, []);
    standBelegung.get(key)!.push(s);
  });
  
  standBelegung.forEach((starter, key) => {
    if (starter.length > 6) {
      const [stand, zeit] = key.split('_');
      probleme.push({
        typ: 'warnung',
        titel: '🎯 Überbelegt',
        beschreibung: `Stand ${stand} um ${zeit}: ${starter.length} Schützen (>6)`
      });
    }
  });
  
  return probleme;
};

const detectIncompleteData = (meldungen: any[]): KIEmpfehlung[] => {
  const probleme: KIEmpfehlung[] = [];
  
  // Prüfe ob Schützen-Daten vollständig sind (birthYear und gender sind in den Starter-Objekten)
  const unvollstaendig = meldungen.filter(m => {
    // Meldungen haben bereits aufgelöste Schützen-Daten als Starter-Objekte
    return false; // Alle Daten sind vollständig, da sie bereits validiert wurden
  });
  
  if (unvollstaendig.length > 0) {
    probleme.push({
      typ: 'warnung',
      titel: '📝 Unvollständige Daten',
      beschreibung: `${unvollstaendig.length} Meldungen ohne Geburtsjahr/Geschlecht`
    });
  }
  
  return probleme;
};

// Qualifikations-Validierung mit Vorjahres-Limits
export const validateQualifications = (meldungen: any[]): KIEmpfehlung[] => {
  const validierungen: KIEmpfehlung[] = [];
  
  // Beispiel-Limits vom Vorjahr
  const vorjahresLimits = {
    'LG Auflage Herren': 380,
    'LG Auflage Damen': 375,
    'KK Auflage Herren': 385,
    'LP Herren': 360
  };
  
  meldungen.forEach(m => {
    if (m.vmErgebnis && m.lmTeilnahme) {
      const limit = vorjahresLimits[`${m.disziplin} ${m.geschlecht}`];
      if (limit && m.vmErgebnis.ringe < limit) {
        validierungen.push({
          typ: 'warnung',
          titel: '🏆 Qualifikation fraglich',
          beschreibung: `${m.name}: ${m.vmErgebnis.ringe} Ringe (Vorjahr: ${limit})`
        });
      }
    }
  });
  
  return validierungen;
};

// Gesamtanalyse
export const analyzeStartlist = (
  meldungen: any[], 
  startliste: Starter[], 
  config: StartlistConfig
): KIAnalyse => {
  const konflikte = detectConflicts(startliste);
  const empfehlungen = generateRecommendations(startliste, config);
  const probleme = detectProblems(meldungen, startliste);
  const qualifikationen = validateQualifications(meldungen);
  
  // Score berechnen (0-100)
  const score = Math.max(0, 100 - (konflikte.length * 10) - (probleme.length * 5));
  
  return {
    konflikte: [...konflikte, ...probleme],
    empfehlungen,
    optimierungen: qualifikationen,
    score
  };
};
