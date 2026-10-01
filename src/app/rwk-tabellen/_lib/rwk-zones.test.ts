import { describe, it, expect } from 'vitest';
import type { TeamDisplay, IndividualShooterDisplayData } from '@/types/rwk';
import {
  getRwkZone,
  determineLeagueCompleteRound,
  istOffeneKlasse,
  berechnePrognose,
  sortTeamsAndAssignRanks,
  sortShootersAndAssignRanks,
} from './rwk-zones';

/**
 * Baut ein minimales TeamDisplay für die Tests. Nur die Felder, die die
 * getesteten Funktionen verwenden, werden gesetzt; der Rest ist für die
 * reine Berechnungslogik irrelevant.
 */
function makeTeam(partial: Partial<TeamDisplay> & { name: string }): TeamDisplay {
  return {
    id: partial.name,
    clubId: '',
    clubName: '',
    leagueId: '',
    competitionYear: 2026,
    shooterIds: [],
    shootersResults: [],
    roundResults: {},
    totalScore: null,
    averageScore: null,
    numScoredRounds: 0,
    leagueType: 'LGA',
    ...partial,
  } as TeamDisplay;
}

// Erzeugt roundResults { dg1: x, dg2: y, ... } aus einer Ringe-Liste.
const rounds = (...werte: (number | null)[]): { [k: string]: number | null } => {
  const r: { [k: string]: number | null } = {};
  werte.forEach((w, i) => { r[`dg${i + 1}`] = w; });
  return r;
};

describe('getRwkZone', () => {
  it('gibt null für fehlenden/ungültigen Rang', () => {
    expect(getRwkZone(null, 8)).toBeNull();
    expect(getRwkZone(0, 8)).toBeNull();
    expect(getRwkZone(undefined, 8)).toBeNull();
  });

  it('markiert Platz 1 als gold und Platz 2 als silber', () => {
    expect(getRwkZone(1, 8)).toBe('gold');
    expect(getRwkZone(2, 8)).toBe('silber');
  });

  it('markiert den letzten Platz als abstieg und den vorletzten als kampf', () => {
    expect(getRwkZone(8, 8)).toBe('abstieg');
    expect(getRwkZone(7, 8)).toBe('kampf');
  });

  it('gibt für Mittelfeld-Plätze null', () => {
    expect(getRwkZone(4, 8)).toBeNull();
    expect(getRwkZone(5, 8)).toBeNull();
  });

  it('behandelt eine 1er-Liga: nur Platz 1 = gold, sonst null', () => {
    expect(getRwkZone(1, 1)).toBe('gold');
    expect(getRwkZone(2, 1)).toBeNull();
  });

  it('priorisiert bei kleinen Ligen oben (gold/silber) vor unten (abstieg/kampf)', () => {
    // 2er-Liga: Platz 1 = gold, Platz 2 = silber (silber-Prüfung hat Vorrang vor abstieg).
    expect(getRwkZone(1, 2)).toBe('gold');
    expect(getRwkZone(2, 2)).toBe('silber');
    // 3er-Liga: 1 gold, 2 silber, 3 abstieg
    expect(getRwkZone(1, 3)).toBe('gold');
    expect(getRwkZone(2, 3)).toBe('silber');
    expect(getRwkZone(3, 3)).toBe('abstieg');
  });
});

describe('determineLeagueCompleteRound', () => {
  it('liefert 0 bei leerer Liga', () => {
    expect(determineLeagueCompleteRound([], 5)).toBe(0);
  });

  it('nimmt das Minimum des lückenlosen Fortschritts über alle Teams', () => {
    const teams = [
      makeTeam({ name: 'A', roundResults: rounds(100, 100, 100) }),       // bis DG3
      makeTeam({ name: 'B', roundResults: rounds(100, 100, null) }),      // bis DG2
    ];
    expect(determineLeagueCompleteRound(teams, 5)).toBe(2);
  });

  it('ignoriert Teams außer Konkurrenz und Einzelwertung', () => {
    const teams = [
      makeTeam({ name: 'A', roundResults: rounds(100, 100, 100) }),
      makeTeam({ name: 'Einzel', roundResults: rounds(null), istEinzelwertung: true }),
      makeTeam({ name: 'AK', roundResults: rounds(null), outOfCompetition: true }),
    ];
    expect(determineLeagueCompleteRound(teams, 5)).toBe(3);
  });

  it('erkennt eine Lücke korrekt (DG1 da, DG2 fehlt → vollständig bis 1)', () => {
    const teams = [makeTeam({ name: 'A', roundResults: rounds(100, null, 100) })];
    expect(determineLeagueCompleteRound(teams, 5)).toBe(1);
  });
});

describe('istOffeneKlasse', () => {
  it('erkennt offene Klassen (LG Freihand, Luftpistole, KK-Sportpistole)', () => {
    expect(istOffeneKlasse({ type: 'LG' })).toBe(true);
    expect(istOffeneKlasse({ type: 'LGS' })).toBe(true);
    expect(istOffeneKlasse({ type: 'LP' })).toBe(true);
    expect(istOffeneKlasse({ type: 'KKP' })).toBe(true);
    expect(istOffeneKlasse({ name: 'Luftpistole Offene Gruppe' })).toBe(true);
  });

  it('erkennt Auflage-Klassen NICHT als offen (die haben Auf-/Abstieg)', () => {
    expect(istOffeneKlasse({ type: 'LGA' })).toBe(false);
    expect(istOffeneKlasse({ type: 'LPA' })).toBe(false);
    expect(istOffeneKlasse({ name: 'Luftgewehr Auflage' })).toBe(false);
  });

  it('gibt false für null/leer', () => {
    expect(istOffeneKlasse(null)).toBe(false);
    expect(istOffeneKlasse(undefined)).toBe(false);
    expect(istOffeneKlasse({})).toBe(false);
  });
});

describe('berechnePrognose', () => {
  const numRounds = 5;

  it('gibt leere Prognose für Teams ohne Rang / außer Wertung', () => {
    const t = makeTeam({ name: 'X', rank: null });
    expect(berechnePrognose(t, [t], null, null, numRounds).typ).toBeNull();
  });

  it('Zweiter mit mehr Ringen als Vorletzter der oberen Liga → Aufstieg möglich (laufend)', () => {
    const zweiter = makeTeam({ name: 'Wir II', rank: 2, roundResults: rounds(560, 560) });
    const eigene = [
      makeTeam({ name: 'Wir I', rank: 1, roundResults: rounds(580, 580) }),
      zweiter,
      makeTeam({ name: 'Wir III', rank: 3, roundResults: rounds(500, 500) }),
    ];
    // Obere Liga: Vorletzter hat weniger als unser Zweiter
    const obere = [
      makeTeam({ name: 'Oben I', rank: 1, roundResults: rounds(600, 600) }),
      makeTeam({ name: 'Oben Vorletzter', rank: 2, roundResults: rounds(500, 500) }),
      makeTeam({ name: 'Oben Letzter', rank: 3, roundResults: rounds(480, 480) }),
    ];
    const p = berechnePrognose(zweiter, eigene, obere, null, numRounds);
    expect(p.typ).toBe('aufstieg_moeglich');
    expect(p.text).toContain('Aufstieg möglich');
  });

  it('Zweiter mit weniger Ringen → Aufstieg fraglich (laufend)', () => {
    const zweiter = makeTeam({ name: 'Wir II', rank: 2, roundResults: rounds(400, 400) });
    const eigene = [
      makeTeam({ name: 'Wir I', rank: 1, roundResults: rounds(580, 580) }),
      zweiter,
      makeTeam({ name: 'Wir III', rank: 3, roundResults: rounds(300, 300) }),
    ];
    const obere = [
      makeTeam({ name: 'Oben I', rank: 1, roundResults: rounds(600, 600) }),
      makeTeam({ name: 'Oben Vorletzter', rank: 2, roundResults: rounds(560, 560) }),
      makeTeam({ name: 'Oben Letzter', rank: 3, roundResults: rounds(480, 480) }),
    ];
    const p = berechnePrognose(zweiter, eigene, obere, null, numRounds);
    expect(p.typ).toBe('aufstieg_fraglich');
  });

  it('nach letztem Durchgang: Zweiter unterlegen → neutral (kein negativer Hinweis)', () => {
    const voll = (n: number) => rounds(n, n, n, n, n); // alle 5 DG
    const zweiter = makeTeam({ name: 'Wir II', rank: 2, roundResults: voll(400) });
    const eigene = [
      makeTeam({ name: 'Wir I', rank: 1, roundResults: voll(580) }),
      zweiter,
      makeTeam({ name: 'Wir III', rank: 3, roundResults: voll(300) }),
    ];
    const obere = [
      makeTeam({ name: 'Oben I', rank: 1, roundResults: voll(600) }),
      makeTeam({ name: 'Oben Vorletzter', rank: 2, roundResults: voll(560) }),
      makeTeam({ name: 'Oben Letzter', rank: 3, roundResults: voll(480) }),
    ];
    // Aufstieg verpasst → bewusst neutral statt "fraglich"
    expect(berechnePrognose(zweiter, eigene, obere, null, numRounds).typ).toBeNull();
  });

  it('Vorletzter mit weniger Ringen als Zweiter der unteren Liga → Abstieg droht (laufend)', () => {
    const vorletzter = makeTeam({ name: 'Wir Vorletzter', rank: 3, roundResults: rounds(400, 400) });
    const eigene = [
      makeTeam({ name: 'Wir I', rank: 1, roundResults: rounds(580, 580) }),
      makeTeam({ name: 'Wir II', rank: 2, roundResults: rounds(500, 500) }),
      vorletzter,
      makeTeam({ name: 'Wir Letzter', rank: 4, roundResults: rounds(300, 300) }),
    ];
    const untere = [
      makeTeam({ name: 'Unten I', rank: 1, roundResults: rounds(600, 600) }),
      makeTeam({ name: 'Unten Zweiter', rank: 2, roundResults: rounds(560, 560) }),
      makeTeam({ name: 'Unten III', rank: 3, roundResults: rounds(400, 400) }),
    ];
    const p = berechnePrognose(vorletzter, eigene, null, untere, numRounds);
    expect(p.typ).toBe('abstieg_droht');
  });

  it('Vorletzter mit mehr Ringen → Klassenerhalt (laufend)', () => {
    const vorletzter = makeTeam({ name: 'Wir Vorletzter', rank: 3, roundResults: rounds(600, 600) });
    const eigene = [
      makeTeam({ name: 'Wir I', rank: 1, roundResults: rounds(650, 650) }),
      makeTeam({ name: 'Wir II', rank: 2, roundResults: rounds(620, 620) }),
      vorletzter,
      makeTeam({ name: 'Wir Letzter', rank: 4, roundResults: rounds(300, 300) }),
    ];
    const untere = [
      makeTeam({ name: 'Unten I', rank: 1, roundResults: rounds(590, 590) }),
      makeTeam({ name: 'Unten Zweiter', rank: 2, roundResults: rounds(500, 500) }),
      makeTeam({ name: 'Unten III', rank: 3, roundResults: rounds(400, 400) }),
    ];
    const p = berechnePrognose(vorletzter, eigene, null, untere, numRounds);
    expect(p.typ).toBe('klassenerhalt');
  });

  it('gibt leere Prognose, wenn der 1. Durchgang noch nicht komplett ist', () => {
    const zweiter = makeTeam({ name: 'Wir II', rank: 2, roundResults: rounds(null) });
    const eigene = [
      makeTeam({ name: 'Wir I', rank: 1, roundResults: rounds(null) }),
      zweiter,
    ];
    const obere = [
      makeTeam({ name: 'Oben I', rank: 1, roundResults: rounds(600) }),
      makeTeam({ name: 'Oben II', rank: 2, roundResults: rounds(500) }),
    ];
    expect(berechnePrognose(zweiter, eigene, obere, null, numRounds).typ).toBeNull();
  });
});

// Minimaler Schütze für die Sortier-Tests.
function makeShooter(
  partial: Partial<IndividualShooterDisplayData> & { shooterName: string }
): IndividualShooterDisplayData {
  return {
    shooterId: partial.shooterName,
    shooterGender: 'unknown',
    teamName: '',
    results: {},
    totalScore: 0,
    averageScore: null,
    roundsShot: 0,
    ...partial,
  } as IndividualShooterDisplayData;
}

describe('sortTeamsAndAssignRanks', () => {
  it('sortiert nach Sortier-Score absteigend und vergibt fortlaufende Ränge', () => {
    const teams = [
      makeTeam({ name: 'B', clubName: 'CB', roundResults: rounds(280, 285) }),
      makeTeam({ name: 'A', clubName: 'CA', roundResults: rounds(290, 288) }),
      makeTeam({ name: 'C', clubName: 'CC', roundResults: rounds(270, 275) }),
    ];
    const result = sortTeamsAndAssignRanks(teams, 2);
    expect(result.map((t) => t.name)).toEqual(['A', 'B', 'C']);
    expect(result.map((t) => t.rank)).toEqual([1, 2, 3]);
  });

  it('rechnet den Sortier-Score nur bis zum liga-vollständigen Durchgang', () => {
    // Team X hat in DG3 ein hohes Ergebnis, das aber nicht zählen darf (completeRound=2).
    const teams = [
      makeTeam({ name: 'X', clubName: 'CX', roundResults: rounds(280, 280, 999) }),
      makeTeam({ name: 'Y', clubName: 'CY', roundResults: rounds(285, 285, 0) }),
    ];
    const result = sortTeamsAndAssignRanks(teams, 2);
    // Nur DG1+DG2: Y (570) vor X (560)
    expect(result.map((t) => t.name)).toEqual(['Y', 'X']);
  });

  it('stellt Teams außer Wertung ans Ende und vergibt ihnen keinen Rang', () => {
    const teams = [
      makeTeam({ name: 'AK', clubName: 'CA', roundResults: rounds(300, 300), outOfCompetition: true }),
      makeTeam({ name: 'Normal', clubName: 'CB', roundResults: rounds(250, 250) }),
      makeTeam({ name: 'Einzel', clubName: 'CC', roundResults: rounds(295, 295), istEinzelwertung: true }),
    ];
    const result = sortTeamsAndAssignRanks(teams, 2);
    expect(result[0].name).toBe('Normal');
    expect(result[0].rank).toBe(1);
    // AK und Einzel ohne Rang, egal wie hoch ihr Score ist
    const ak = result.find((t) => t.name === 'AK');
    const einzel = result.find((t) => t.name === 'Einzel');
    expect(ak?.rank).toBeNull();
    expect(einzel?.rank).toBeNull();
  });

  it('nutzt bei Score-Gleichstand den Vereins- dann Teamnamen', () => {
    const teams = [
      makeTeam({ name: 'Zeta', clubName: 'SV Zeta', roundResults: rounds(280, 280) }),
      makeTeam({ name: 'Alpha', clubName: 'SV Alpha', roundResults: rounds(280, 280) }),
    ];
    const result = sortTeamsAndAssignRanks(teams, 2);
    expect(result.map((t) => t.clubName)).toEqual(['SV Alpha', 'SV Zeta']);
  });
});

describe('sortShootersAndAssignRanks', () => {
  it('sortiert nach Durchschnitt absteigend und vergibt Ränge', () => {
    const shooters = [
      makeShooter({ shooterName: 'B', averageScore: 94, totalScore: 282 }),
      makeShooter({ shooterName: 'A', averageScore: 96, totalScore: 288 }),
      makeShooter({ shooterName: 'C', averageScore: 90, totalScore: 270 }),
    ];
    const result = sortShootersAndAssignRanks(shooters, 3);
    expect(result.map((s) => s.shooterName)).toEqual(['A', 'B', 'C']);
    expect(result.map((s) => s.rank)).toEqual([1, 2, 3]);
  });

  it('nutzt bei gleichem Schnitt die Gesamtpunkte als Tiebreaker', () => {
    const shooters = [
      makeShooter({ shooterName: 'Wenig', averageScore: 95, totalScore: 190 }),
      makeShooter({ shooterName: 'Viel', averageScore: 95, totalScore: 285 }),
    ];
    const result = sortShootersAndAssignRanks(shooters, 3);
    expect(result.map((s) => s.shooterName)).toEqual(['Viel', 'Wenig']);
  });

  it('entscheidet bei Gleichstand per Stichentscheid vom letzten zum ersten Durchgang', () => {
    const shooters = [
      makeShooter({ shooterName: 'Früh', averageScore: 95, totalScore: 285, results: rounds(100, 95, 90) }),
      makeShooter({ shooterName: 'Spät', averageScore: 95, totalScore: 285, results: rounds(90, 95, 100) }),
    ];
    const result = sortShootersAndAssignRanks(shooters, 3);
    // Letzter DG höher -> "Spät" vorne
    expect(result.map((s) => s.shooterName)).toEqual(['Spät', 'Früh']);
  });

  it('stellt ersetzte Schützen ans Ende', () => {
    const shooters = [
      makeShooter({ shooterName: 'Ersetzt', averageScore: 99, totalScore: 297, isReplacedShooter: true }),
      makeShooter({ shooterName: 'Normal', averageScore: 80, totalScore: 240 }),
    ];
    const result = sortShootersAndAssignRanks(shooters, 3);
    expect(result[0].shooterName).toBe('Normal');
    expect(result[1].shooterName).toBe('Ersetzt');
  });

  it('vergibt keinen Rang für außer-Konkurrenz-Schützen', () => {
    const shooters = [
      makeShooter({ shooterName: 'AK', averageScore: 98, totalScore: 294, teamOutOfCompetition: true }),
      makeShooter({ shooterName: 'Normal', averageScore: 90, totalScore: 270 }),
    ];
    const result = sortShootersAndAssignRanks(shooters, 3);
    const normal = result.find((s) => s.shooterName === 'Normal');
    const ak = result.find((s) => s.shooterName === 'AK');
    expect(normal?.rank).toBe(1);
    expect(ak?.rank).toBeNull();
  });
});
