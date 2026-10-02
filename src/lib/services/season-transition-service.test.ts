import { describe, it, expect } from 'vitest';
import {
  istOffeneKlasse,
  berechneLigaAusgleich,
  ermittleTeamAufAbstieg,
  type AusgleichTeam,
  type AusgleichLiga,
  type AufAbstiegInput,
} from './season-transition-service';

describe('istOffeneKlasse', () => {
  it('erkennt offene Klassen (Freihand/Pistole/KK-Sportpistole)', () => {
    expect(istOffeneKlasse({ type: 'LG' })).toBe(true);
    expect(istOffeneKlasse({ type: 'LGS' })).toBe(true);
    expect(istOffeneKlasse({ type: 'LP' })).toBe(true);
    expect(istOffeneKlasse({ type: 'KKP' })).toBe(true);
    expect(istOffeneKlasse({ name: 'Luftgewehr Freihand' })).toBe(true);
    expect(istOffeneKlasse({ name: 'Sportpistole' })).toBe(true);
  });

  it('erkennt Auflage-Ligen als NICHT offen (mit Auf-/Abstieg)', () => {
    expect(istOffeneKlasse({ type: 'LGA' })).toBe(false);
    expect(istOffeneKlasse({ type: 'LPA' })).toBe(false);
    expect(istOffeneKlasse({ name: 'LG Auflage Kreisoberliga' })).toBe(false);
  });

  it('Auflage hat Vorrang vor dem Freihand-Namensindiz', () => {
    // Name enthält "auflage" -> nicht offen, auch wenn sonst nach LG aussieht
    expect(istOffeneKlasse({ type: 'LGA', name: 'Luftgewehr Auflage' })).toBe(false);
  });

  it('gibt false für null/undefined', () => {
    expect(istOffeneKlasse(null)).toBe(false);
    expect(istOffeneKlasse(undefined)).toBe(false);
    expect(istOffeneKlasse({})).toBe(false);
  });
});

describe('berechneLigaAusgleich', () => {
  // 3 LGA-Ligen: Kreisoberliga (0), Kreisliga (1), Kreisklasse (2)
  const ligen: AusgleichLiga[] = [
    { id: 'KOL', name: 'Kreisoberliga', type: 'LGA', order: 0 },
    { id: 'KL', name: 'Kreisliga', type: 'LGA', order: 1 },
    { id: 'KK', name: 'Kreisklasse', type: 'LGA', order: 2 },
  ];

  const team = (
    docId: string,
    name: string,
    clubId: string,
    leagueId: string | null,
    ringe: number | null
  ): AusgleichTeam => ({ docId, name, clubId, leagueId, leagueType: 'LGA', ringe });

  it('gibt leere Vorschläge bei weniger als 2 LGA-Ligen', () => {
    const teams = [team('t1', 'A I', 'A', null, 1000)];
    expect(berechneLigaAusgleich(teams, [ligen[0]])).toEqual([]);
  });

  it('lässt eine bereits ausgeglichene Verteilung unverändert', () => {
    // Genau 6 in KOL, Rest passt -> keine Vorschläge
    const teams: AusgleichTeam[] = [];
    for (let i = 0; i < 6; i++) teams.push(team(`kol${i}`, `KOL${i} I`, `c${i}`, 'KOL', 2900 - i));
    for (let i = 0; i < 2; i++) teams.push(team(`kl${i}`, `KL${i} I`, `d${i}`, 'KL', 2700 - i));
    const result = berechneLigaAusgleich(teams, ligen);
    expect(result).toEqual([]);
  });

  it('rückt eine überzählige schwächste Mannschaft nach unten', () => {
    // 7 Teams in KOL (Ziel 6) -> schwächstes muss runter nach KL
    const teams: AusgleichTeam[] = [];
    for (let i = 0; i < 7; i++) teams.push(team(`kol${i}`, `Team${i} I`, `c${i}`, 'KOL', 2900 - i * 10));
    const result = berechneLigaAusgleich(teams, ligen);
    // Das schwächste (kol6, 2840 Ringe) rückt ab
    const abgerueckt = result.find((v) => v.docId === 'kol6');
    expect(abgerueckt).toBeDefined();
    expect(abgerueckt?.nachLigaId).toBe('KL');
  });

  it('ordnet neue Mannschaften ohne Vorjahr in die unterste Liga ein', () => {
    const teams: AusgleichTeam[] = [
      team('neu', 'Neu I', 'N', null, null), // kein Vorjahr, nicht zugewiesen
    ];
    // nur 1 Team -> landet in unterster Liga (KK), Grund "Neue Mannschaft ohne Vorjahr"
    const result = berechneLigaAusgleich(teams, ligen);
    const v = result.find((x) => x.docId === 'neu');
    expect(v).toBeDefined();
    expect(v?.grund).toContain('Neue Mannschaft ohne Vorjahr');
  });

  it('wahrt "I nie tiefer als II" innerhalb eines Vereins', () => {
    // Verein X hat I und II. Konstruiere eine Lage, in der ohne Korrektur II höher
    // stünde als I; nach der Korrektur muss I mindestens so hoch wie II sein.
    const teams: AusgleichTeam[] = [
      team('x1', 'X I', 'X', 'KL', 2500),   // I schwächer eingetragen
      team('x2', 'X II', 'X', 'KOL', 2900), // II stärker, steht oben
    ];
    // Fülle KOL/KL mit Statisten, damit beide Ligen bestehen bleiben
    for (let i = 0; i < 5; i++) teams.push(team(`a${i}`, `A${i} I`, `a${i}`, 'KOL', 2800 - i));
    for (let i = 0; i < 5; i++) teams.push(team(`b${i}`, `B${i} I`, `b${i}`, 'KL', 2600 - i));
    const result = berechneLigaAusgleich(teams, ligen);

    // Finale Ligen rekonstruieren: Startliga + evtl. Vorschlag
    const ligaVon = (docId: string, start: string) =>
      result.find((v) => v.docId === docId)?.nachLigaId ?? start;
    const orderOf = (id: string) => ligen.find((l) => l.id === id)!.order;
    const iOrder = orderOf(ligaVon('x1', 'KL'));
    const iiOrder = orderOf(ligaVon('x2', 'KOL'));
    // I darf nicht tiefer (größere order) als II stehen
    expect(iOrder).toBeLessThanOrEqual(iiOrder);
  });
});

describe('ermittleTeamAufAbstieg', () => {
  // Standard: Mittelfeld-Liga mit höherer und niedrigerer Liga, keine Verkleinerung.
  const base: AufAbstiegInput = {
    position: 5,
    totalTeams: 8,
    totalScore: 2800,
    istOffen: false,
    istHoechsteLiga: false,
    istNiedrigsteLiga: false,
    hatHoehereLiga: true,
    hatNiedrigereLiga: true,
    abgemeldet: false,
    ringeVorletzterHoehere: 2850,
    ringeZweiterNiedrigere: 2750,
    sizeReduction: 0,
  };

  it('Meister steigt auf', () => {
    const r = ermittleTeamAufAbstieg({ ...base, position: 1 });
    expect(r.action).toBe('promote');
  });

  it('Meister der höchsten Liga verbleibt', () => {
    const r = ermittleTeamAufAbstieg({ ...base, position: 1, istHoechsteLiga: true });
    expect(r.action).toBe('stay');
  });

  it('Letzter steigt ab', () => {
    const r = ermittleTeamAufAbstieg({ ...base, position: 8 });
    expect(r.action).toBe('relegate');
  });

  it('Letzter der niedrigsten Liga verbleibt', () => {
    const r = ermittleTeamAufAbstieg({ ...base, position: 8, istNiedrigsteLiga: true });
    expect(r.action).toBe('stay');
  });

  it('offene Klasse: weder Auf- noch Abstieg (Meister und Letzter bleiben)', () => {
    expect(ermittleTeamAufAbstieg({ ...base, position: 1, istOffen: true }).action).toBe('stay');
    expect(ermittleTeamAufAbstieg({ ...base, position: 8, istOffen: true }).action).toBe('stay');
  });

  it('Zweiter steigt auf, wenn besser als Vorletzter der höheren Liga', () => {
    const r = ermittleTeamAufAbstieg({ ...base, position: 2, totalScore: 2900, ringeVorletzterHoehere: 2850 });
    expect(r.action).toBe('promote');
  });

  it('Zweiter verbleibt bei Gleichstand mit dem Vorletzten oben (zugunsten höherklassig)', () => {
    const r = ermittleTeamAufAbstieg({ ...base, position: 2, totalScore: 2850, ringeVorletzterHoehere: 2850 });
    expect(r.action).toBe('stay');
  });

  it('Vorletzter steigt ab, wenn Zweiter der niedrigeren Liga besser/gleich ist (Kehrseite)', () => {
    // Vorletzter = Platz totalTeams-1 = 7
    const r = ermittleTeamAufAbstieg({ ...base, position: 7, totalScore: 2700, ringeZweiterNiedrigere: 2750 });
    expect(r.action).toBe('relegate');
  });

  it('Vorletzter verbleibt, wenn er besser ist als der Zweite unten', () => {
    const r = ermittleTeamAufAbstieg({ ...base, position: 7, totalScore: 2800, ringeZweiterNiedrigere: 2750 });
    expect(r.action).toBe('stay');
  });

  it('abgemeldetes Team steigt automatisch ab (RWK §16)', () => {
    const r = ermittleTeamAufAbstieg({ ...base, position: 1, abgemeldet: true });
    expect(r.action).toBe('relegate');
    expect(r.reason).toContain('abgemeldet');
  });

  it('abgemeldetes Team in niedrigster Liga verbleibt (kein tieferer Platz)', () => {
    const r = ermittleTeamAufAbstieg({ ...base, position: 3, abgemeldet: true, hatNiedrigereLiga: false });
    expect(r.action).toBe('stay');
  });

  it('Mittelfeld-Team verbleibt', () => {
    const r = ermittleTeamAufAbstieg({ ...base, position: 4 });
    expect(r.action).toBe('stay');
  });

  it('Ligaverkleinerung: zusätzlicher Absteiger von unten', () => {
    // Platz 6 ist kein Letzter/Vorletzter; bei sizeReduction 3 steigen die unteren
    // 3 Plätze (6,7,8) zusätzlich ab.
    const r = ermittleTeamAufAbstieg({ ...base, position: 6, totalTeams: 8, sizeReduction: 3 });
    expect(r.action).toBe('relegate');
    expect(r.reason).toContain('Ligaverkleinerung');
  });

  it('Zweiter ohne Vergleichsteam (keine höhere Liga vorhanden) verbleibt', () => {
    const r = ermittleTeamAufAbstieg({ ...base, position: 2, hatHoehereLiga: false });
    expect(r.action).toBe('stay');
  });
});
