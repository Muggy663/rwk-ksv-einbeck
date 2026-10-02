import { describe, it, expect } from 'vitest';
import {
  disziplinKategorie,
  kannAusrichten,
  berechneAusrichterReihenfolge,
  type AusrichterEintrag,
} from './ausrichter-service';

describe('disziplinKategorie', () => {
  it('ordnet KKP, KK/KKG und LG-Varianten korrekt zu', () => {
    expect(disziplinKategorie('KKP')).toBe('KKP');
    expect(disziplinKategorie('KK')).toBe('KKG');
    expect(disziplinKategorie('KKG')).toBe('KKG');
    expect(disziplinKategorie('LGA')).toBe('LG');
    expect(disziplinKategorie('LP')).toBe('LG');
    expect(disziplinKategorie(null)).toBe('LG'); // Default
  });
});

describe('kannAusrichten', () => {
  it('erlaubt alles, wenn keine Disziplinen gepflegt sind', () => {
    expect(kannAusrichten(undefined, 'LGA')).toBe(true);
    expect(kannAusrichten([], 'KK')).toBe(true);
  });

  it('prüft die Disziplin-Kategorie, wenn gepflegt', () => {
    expect(kannAusrichten(['LG'], 'LGA')).toBe(true); // LGA -> LG
    expect(kannAusrichten(['KKG'], 'LGA')).toBe(false);
    expect(kannAusrichten(['KKG', 'LG'], 'KK')).toBe(true);
  });
});

describe('berechneAusrichterReihenfolge', () => {
  const hist = (clubId: string, jahr: number, leagueId = 'L1'): AusrichterEintrag =>
    ({ leagueId, competitionYear: jahr, ausrichterClubId: clubId } as AusrichterEintrag);

  it('stellt den am längsten nicht Ausrichtenden nach vorne', () => {
    const mannschaften = [
      { clubId: 'A', teamName: 'A I' },
      { clubId: 'B', teamName: 'B I' },
      { clubId: 'C', teamName: 'C I' },
    ];
    const historie = [hist('A', 2025), hist('B', 2023), hist('C', 2024)];
    const result = berechneAusrichterReihenfolge('L1', 'LGA', 2026, mannschaften, historie);
    // B (2023) am längsten her -> zuerst, dann C (2024), dann A (2025)
    expect(result.map((k) => k.clubId)).toEqual(['B', 'C', 'A']);
  });

  it('priorisiert Vereine, die noch nie ausgerichtet haben', () => {
    const mannschaften = [
      { clubId: 'Alt', teamName: 'Alt I' },
      { clubId: 'Neu', teamName: 'Neu I' },
    ];
    const historie = [hist('Alt', 2024)];
    const result = berechneAusrichterReihenfolge('L1', 'LGA', 2026, mannschaften, historie);
    // Neu (letztesJahr 0) kommt vor Alt
    expect(result[0].clubId).toBe('Neu');
    expect(result[0].letztesJahr).toBe(0);
  });

  it('stellt nicht-fähige Vereine (Standkapazität) ans Ende', () => {
    const mannschaften = [
      { clubId: 'Faehig', teamName: 'Faehig I', ausrichterDisziplinen: ['LG'] },
      { clubId: 'Unfaehig', teamName: 'Unfaehig I', ausrichterDisziplinen: ['KKG'] },
    ];
    const result = berechneAusrichterReihenfolge('L1', 'LGA', 2026, mannschaften, []);
    expect(result[0].clubId).toBe('Faehig');
    expect(result[1].faehig).toBe(false);
  });

  it('ignoriert Historie aus dem aktuellen und zukünftigen Jahren', () => {
    const mannschaften = [{ clubId: 'A', teamName: 'A I' }];
    // Eintrag im aktuellen Jahr darf letztesJahr nicht setzen
    const result = berechneAusrichterReihenfolge('L1', 'LGA', 2026, mannschaften, [hist('A', 2026)]);
    expect(result[0].letztesJahr).toBe(0);
    expect(result[0].anzahl).toBe(0);
  });
});
