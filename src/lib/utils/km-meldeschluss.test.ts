import { describe, it, expect } from 'vitest';
import {
  parseMeldeschluss,
  istMeldeschlussAbgelaufen,
  sortiereSaisons,
  saisonAnzeigeText,
  type SaisonLike,
} from './km-meldeschluss';

describe('parseMeldeschluss', () => {
  it('gibt null bei fehlendem oder leerem Wert', () => {
    expect(parseMeldeschluss(undefined)).toBeNull();
    expect(parseMeldeschluss(null)).toBeNull();
    expect(parseMeldeschluss('')).toBeNull();
    expect(parseMeldeschluss('   ')).toBeNull();
  });

  it('parst ISO-Format YYYY-MM-DD als Ende des Tages in UTC', () => {
    const d = parseMeldeschluss('2026-11-01');
    expect(d).not.toBeNull();
    // Ende des Kalendertags in UTC
    expect(d!.getUTCFullYear()).toBe(2026);
    expect(d!.getUTCMonth()).toBe(10); // November = Index 10
    expect(d!.getUTCDate()).toBe(1);
    expect(d!.getUTCHours()).toBe(23);
    expect(d!.getUTCMinutes()).toBe(59);
    expect(d!.getUTCSeconds()).toBe(59);
  });

  it('parst deutsches Format DD.MM.YYYY', () => {
    const d = parseMeldeschluss('01.11.2025');
    expect(d).not.toBeNull();
    expect(d!.getUTCFullYear()).toBe(2025);
    expect(d!.getUTCMonth()).toBe(10);
    expect(d!.getUTCDate()).toBe(1);
    expect(d!.getUTCHours()).toBe(23);
  });

  it('nutzt bei DD.MM. ohne Jahr das aktuelle Jahr', () => {
    const jahr = new Date().getFullYear();
    const d = parseMeldeschluss('15.12.');
    expect(d).not.toBeNull();
    expect(d!.getUTCFullYear()).toBe(jahr);
    expect(d!.getUTCMonth()).toBe(11); // Dezember
    expect(d!.getUTCDate()).toBe(15);
  });

  it('toleriert Leerzeichen in den Teilen', () => {
    const d = parseMeldeschluss(' 05 . 03 . 2026 ');
    expect(d).not.toBeNull();
    expect(d!.getUTCDate()).toBe(5);
    expect(d!.getUTCMonth()).toBe(2); // März
    expect(d!.getUTCFullYear()).toBe(2026);
  });

  it('gibt null bei unbrauchbaren Werten', () => {
    expect(parseMeldeschluss('abc')).toBeNull();
    expect(parseMeldeschluss('32')).toBeNull(); // nur ein Teil
    expect(parseMeldeschluss('xx.yy.')).toBeNull();
  });
});

describe('istMeldeschlussAbgelaufen', () => {
  it('ist false ohne gültigen Meldeschluss', () => {
    expect(istMeldeschlussAbgelaufen({})).toBe(false);
    expect(istMeldeschlussAbgelaufen(null)).toBe(false);
    expect(istMeldeschlussAbgelaufen({ meldeschluss: '' })).toBe(false);
  });

  it('ist false am Meldeschluss-Tag selbst (Ende des Tages)', () => {
    const saison: SaisonLike = { meldeschluss: '2026-11-01' };
    // Mittags am Stichtag → noch nicht abgelaufen
    const jetzt = new Date(Date.UTC(2026, 10, 1, 12, 0, 0));
    expect(istMeldeschlussAbgelaufen(saison, jetzt)).toBe(false);
  });

  it('ist true am Tag nach dem Meldeschluss', () => {
    const saison: SaisonLike = { meldeschluss: '2026-11-01' };
    const jetzt = new Date(Date.UTC(2026, 10, 2, 0, 0, 1));
    expect(istMeldeschlussAbgelaufen(saison, jetzt)).toBe(true);
  });
});

describe('sortiereSaisons', () => {
  const jetzt = new Date(Date.UTC(2026, 5, 1)); // 1. Juni 2026

  it('verändert das Eingabe-Array nicht', () => {
    const input: SaisonLike[] = [
      { name: 'B', jahr: 2025 },
      { name: 'A', jahr: 2026 },
    ];
    const copy = [...input];
    sortiereSaisons(input, jetzt);
    expect(input).toEqual(copy);
  });

  it('listet aktive (Meldeschluss offen) vor abgelaufenen', () => {
    const aktiv: SaisonLike = { name: 'Aktiv', jahr: 2026, meldeschluss: '2026-12-31' };
    const abgelaufen: SaisonLike = { name: 'Alt', jahr: 2026, meldeschluss: '2026-01-01' };
    const sortiert = sortiereSaisons([abgelaufen, aktiv], jetzt);
    expect(sortiert[0].name).toBe('Aktiv');
    expect(sortiert[1].name).toBe('Alt');
  });

  it('sortiert innerhalb gleicher Aktivität nach Jahr absteigend', () => {
    const a: SaisonLike = { name: 'A', jahr: 2024 };
    const b: SaisonLike = { name: 'B', jahr: 2026 };
    const c: SaisonLike = { name: 'C', jahr: 2025 };
    const sortiert = sortiereSaisons([a, b, c], jetzt);
    expect(sortiert.map((s) => s.jahr)).toEqual([2026, 2025, 2024]);
  });

  it('sortiert bei gleichem Jahr alphabetisch nach Name', () => {
    const sortiert = sortiereSaisons(
      [
        { name: 'Zebra', jahr: 2026 },
        { name: 'Alpha', jahr: 2026 },
      ],
      jetzt
    );
    expect(sortiert.map((s) => s.name)).toEqual(['Alpha', 'Zebra']);
  });
});

describe('saisonAnzeigeText', () => {
  const jetzt = new Date(Date.UTC(2026, 5, 1));

  it('zeigt Name mit Disziplin-Typ', () => {
    expect(saisonAnzeigeText({ name: 'Saison 2026', disziplinTyp: 'KK' }, jetzt)).toBe(
      'Saison 2026 (KK)'
    );
  });

  it('zeigt nur den Namen ohne Disziplin-Typ', () => {
    expect(saisonAnzeigeText({ name: 'Saison 2026' }, jetzt)).toBe('Saison 2026');
  });

  it('hängt Hinweis an, wenn Meldeschluss vorbei ist', () => {
    const text = saisonAnzeigeText(
      { name: 'Saison 2026', meldeschluss: '2026-01-01' },
      jetzt
    );
    expect(text).toContain('Meldeschluss vorbei');
  });
});
