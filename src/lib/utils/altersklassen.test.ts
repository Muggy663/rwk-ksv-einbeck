import { describe, it, expect } from 'vitest';
import {
  ermittleEinzelklasse,
  ermittleMannschaftsgruppe,
  getShooterClubId,
  formatGender,
  type KmAltersklasse,
} from './altersklassen';

// Realistische, vereinfachte Altersklassen-Tabelle (wie aus km_altersklassen).
// geschlecht: 0 = weiblich, 1 = männlich, 2 = gemischt
const KLASSEN: KmAltersklasse[] = [
  // Junge Klassen (gelten für Auflage und Freihand)
  { name: 'Schüler m', minAlter: 12, maxAlter: 14, geschlecht: 1 },
  { name: 'Schüler w', minAlter: 12, maxAlter: 14, geschlecht: 0 },
  { name: 'Jugend m', minAlter: 15, maxAlter: 16, geschlecht: 1 },
  { name: 'Jugend w', minAlter: 15, maxAlter: 16, geschlecht: 0 },
  { name: 'Junioren II m', minAlter: 17, maxAlter: 18, geschlecht: 1 },
  // Freihand-Reihe (Herren/Damen)
  { name: 'Herren I', minAlter: 21, maxAlter: 40, geschlecht: 1 },
  { name: 'Damen I', minAlter: 21, maxAlter: 40, geschlecht: 0 },
  { name: 'Herren II', minAlter: 41, maxAlter: 50, geschlecht: 1 },
  // Auflage-Reihe (Senioren/Seniorinnen) überlappt altersmäßig mit Freihand
  { name: 'Senioren 0', minAlter: 41, maxAlter: 50, geschlecht: 2 },
  { name: 'Senioren I m', minAlter: 51, maxAlter: 60, geschlecht: 1 },
  { name: 'Seniorinnen I', minAlter: 51, maxAlter: 60, geschlecht: 0 },
];

describe('ermittleEinzelklasse – null-Fälle', () => {
  const base = { auflage: false, saisonJahr: 2026, altersklassen: KLASSEN };

  it('gibt null ohne Geburtsjahr', () => {
    expect(ermittleEinzelklasse({ ...base, gender: 'male' })).toBeNull();
  });

  it('gibt null bei unbekanntem Geschlecht', () => {
    expect(ermittleEinzelklasse({ ...base, birthYear: 1990, gender: 'unknown' })).toBeNull();
  });

  it('gibt null bei leerer Klassenliste', () => {
    expect(
      ermittleEinzelklasse({ auflage: false, saisonJahr: 2026, altersklassen: [], birthYear: 1990, gender: 'male' })
    ).toBeNull();
  });

  it('gibt null, wenn kein Altersband passt (zu jung)', () => {
    // 8 Jahre alt -> keine Klasse ab 12
    expect(ermittleEinzelklasse({ ...base, birthYear: 2018, gender: 'male' })).toBeNull();
  });
});

describe('ermittleEinzelklasse – Freihand', () => {
  const base = { auflage: false, saisonJahr: 2026, altersklassen: KLASSEN };

  it('ordnet einen 30-Jährigen Mann der Herren I zu', () => {
    expect(ermittleEinzelklasse({ ...base, birthYear: 1996, gender: 'male' })).toBe('Herren I');
  });

  it('ordnet eine 30-jährige Frau der Damen I zu', () => {
    expect(ermittleEinzelklasse({ ...base, birthYear: 1996, gender: 'female' })).toBe('Damen I');
  });

  it('bevorzugt die junge Klasse (Schüler) vor Freihand', () => {
    // 13 Jahre -> Schüler m
    expect(ermittleEinzelklasse({ ...base, birthYear: 2013, gender: 'male' })).toBe('Schüler m');
  });

  it('respektiert das Geschlecht bei der Zuordnung', () => {
    expect(ermittleEinzelklasse({ ...base, birthYear: 2013, gender: 'female' })).toBe('Schüler w');
  });
});

describe('ermittleEinzelklasse – Auflage', () => {
  const base = { auflage: true, saisonJahr: 2026, altersklassen: KLASSEN };

  it('ordnet einen 55-Jährigen der Senioren-Reihe zu, nicht Freihand', () => {
    expect(ermittleEinzelklasse({ ...base, birthYear: 1971, gender: 'male' })).toBe('Senioren I m');
  });

  it('ordnet junge Schützen auch bei Auflage der jungen Klasse zu', () => {
    expect(ermittleEinzelklasse({ ...base, birthYear: 2013, gender: 'male' })).toBe('Schüler m');
  });

  it('gibt null, wenn bei Auflage keine startberechtigte Klasse existiert (30 J. ohne kreisinterne Ausnahme)', () => {
    // 30-Jähriger, Auflage, aber spoNummer passt nicht zur Ausnahme -> keine Auflage-Klasse
    expect(ermittleEinzelklasse({ ...base, birthYear: 1996, gender: 'male', spoNummer: '1.60' })).toBeNull();
  });

  it('kreisinterne Ausnahme: 1.41, 30 Jahre -> Herren I (Freihand-Reihe)', () => {
    expect(
      ermittleEinzelklasse({ ...base, birthYear: 1996, gender: 'male', spoNummer: '1.41' })
    ).toBe('Herren I');
  });

  it('kreisinterne Ausnahme gilt auch für 1.11', () => {
    expect(
      ermittleEinzelklasse({ ...base, birthYear: 1996, gender: 'female', spoNummer: '1.11' })
    ).toBe('Damen I');
  });
});

describe('ermittleEinzelklasse – Altersgenehmigung', () => {
  const base = { auflage: false, saisonJahr: 2026, altersklassen: KLASSEN };

  it('behandelt einen 11-Jährigen mit Genehmigung wie 12 (Schülerklasse)', () => {
    // geboren 2015 -> 11 Jahre; ohne Genehmigung keine Klasse (ab 12)
    expect(ermittleEinzelklasse({ ...base, birthYear: 2015, gender: 'male' })).toBeNull();
    expect(
      ermittleEinzelklasse({ ...base, birthYear: 2015, gender: 'male', altersgenehmigung: true })
    ).toBe('Schüler m');
  });
});

describe('ermittleMannschaftsgruppe', () => {
  const kombinationen = {
    'Herren I-III': ['Herren I', 'Herren II', 'Herren III'],
    'Senioren': ['Senioren 0', 'Senioren I m'],
  };

  it('findet die Gruppe, die die Einzelklasse enthält', () => {
    expect(ermittleMannschaftsgruppe('Herren II', kombinationen)).toBe('Herren I-III');
  });

  it('gibt die Einzelklasse zurück, wenn sie in keiner Gruppe ist', () => {
    expect(ermittleMannschaftsgruppe('Damen I', kombinationen)).toBe('Damen I');
  });

  it('gibt die Einzelklasse zurück, wenn keine Kombinationen vorliegen', () => {
    expect(ermittleMannschaftsgruppe('Herren II', null)).toBe('Herren II');
    expect(ermittleMannschaftsgruppe('Herren II', undefined)).toBe('Herren II');
  });
});

describe('getShooterClubId', () => {
  it('priorisiert clubId', () => {
    expect(getShooterClubId({ clubId: 'A', kmClubId: 'B' })).toBe('A');
  });

  it('fällt auf kmClubId zurück, wenn clubId fehlt', () => {
    expect(getShooterClubId({ kmClubId: 'B' })).toBe('B');
  });

  it('ignoriert leere Strings', () => {
    expect(getShooterClubId({ clubId: '   ', kmClubId: 'B' })).toBe('B');
  });

  it('gibt undefined, wenn keine Club-ID vorliegt', () => {
    expect(getShooterClubId({})).toBeUndefined();
  });
});

describe('formatGender', () => {
  it('formatiert male/female/sonstiges', () => {
    expect(formatGender('male')).toBe('M');
    expect(formatGender('female')).toBe('W');
    expect(formatGender(undefined)).toBe('?');
    expect(formatGender('x')).toBe('?');
  });
});
