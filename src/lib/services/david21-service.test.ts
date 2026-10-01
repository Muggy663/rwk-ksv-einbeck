import { describe, it, expect } from 'vitest';
import { David21Service, type David21StartlistEntry } from './david21-service';

function entry(partial: Partial<David21StartlistEntry>): David21StartlistEntry {
  return {
    startNummer: 1,
    nachname: 'Mustermann',
    vorname: 'Max',
    vereinsNummer: 8,
    vereinsName: 'SV Einbeck',
    geburtsjahr: 1990,
    geschlecht: 'M',
    wettkampfklasse: 'Herren I',
    disziplin: 'Luftgewehr',
    ...partial,
  };
}

describe('David21Service.generateStartlist', () => {
  it('sortiert nach Startnummer und erzeugt eine Zeile pro Starter', () => {
    const content = David21Service.generateStartlist([
      entry({ startNummer: 3, nachname: 'C' }),
      entry({ startNummer: 1, nachname: 'A' }),
      entry({ startNummer: 2, nachname: 'B' }),
    ]);
    const lines = content.trim().split('\r\n');
    expect(lines).toHaveLength(3);
    // Reihenfolge nach Startnummer
    expect(lines[0]).toContain('"A, Max"');
    expect(lines[1]).toContain('"B, Max"');
    expect(lines[2]).toContain('"C, Max"');
  });

  it('verwendet Tab als Trennzeichen und CRLF als Zeilenende', () => {
    const content = David21Service.generateStartlist([entry({})]);
    expect(content.endsWith('\r\n')).toBe(true);
    expect(content.split('\r\n')[0].split('\t').length).toBeGreaterThanOrEqual(12);
  });

  it('stellt dem Vereinsnamen immer "08 " voran', () => {
    const content = David21Service.generateStartlist([entry({ vereinsName: 'SV Einbeck' })]);
    expect(content).toContain('"08 SV Einbeck"');
  });

  it('nutzt die Default-Klassen-ID 10, wenn keine gesetzt ist', () => {
    const content = David21Service.generateStartlist([entry({ klassenId: undefined })]);
    const felder = content.split('\r\n')[0].split('\t');
    expect(felder[6]).toBe('10'); // Klassen-ID an Position 7 (Index 6)
  });

  it('übernimmt eine gesetzte Klassen-ID', () => {
    const content = David21Service.generateStartlist([entry({ klassenId: 42 })]);
    const felder = content.split('\r\n')[0].split('\t');
    expect(felder[6]).toBe('42');
  });
});

describe('David21Service.generateFilename', () => {
  it('baut den Dateinamen aus Wettkampf-ID, Code, Datum und Zeit', () => {
    const name = David21Service.generateFilename(
      'W111',
      'K72',
      new Date(2026, 7, 31), // 31.08.2026
      '14:00',
      'TXT'
    );
    expect(name).toBe('W111_K72_260831_1400.TXT');
  });

  it('verwendet die passende Dateiendung', () => {
    const name = David21Service.generateFilename('W1', 'K1', new Date(2026, 0, 5), '09:30', 'CTL');
    expect(name).toBe('W1_K1_260105_0930.CTL');
  });
});

describe('David21Service.parseResults', () => {
  it('aggregiert Meyton-Schüsse pro Startnummer zu Ringen und Zehnteln', () => {
    // MEYT-Zeilen: Felder tab-getrennt, Index 3 = Startnr, Index 6 = Ring
    const content = [
      'MEYT\t?\t?\t1\t?\t?\t10,5',
      'MEYT\t?\t?\t1\t?\t?\t9,2',
      'MEYT\t?\t?\t1\t?\t?\t10,0',
    ].join('\n');
    const results = David21Service.parseResults(content);
    expect(results).toHaveLength(1);
    const r = results[0];
    expect(r.startNummer).toBe(1);
    // Summe 29,7 -> 29 Ringe, 7 Zehntel
    expect(r.ringe).toBe(29);
    expect(r.zehntel).toBe(7);
    // Inner-Zehner: Werte >= 10.0 -> 10,5 und 10,0
    expect(r.innerZehner).toBe(2);
  });

  it('ignoriert Zeilen, die nicht mit MEYT beginnen', () => {
    const content = ['# Kommentar', 'MEYT\t?\t?\t5\t?\t?\t9,0', ''].join('\n');
    const results = David21Service.parseResults(content);
    expect(results).toHaveLength(1);
    expect(results[0].startNummer).toBe(5);
  });

  it('gruppiert mehrere Startnummern getrennt und sortiert aufsteigend', () => {
    const content = [
      'MEYT\t?\t?\t2\t?\t?\t8,0',
      'MEYT\t?\t?\t1\t?\t?\t9,0',
    ].join('\n');
    const results = David21Service.parseResults(content);
    expect(results.map((r) => r.startNummer)).toEqual([1, 2]);
  });
});

describe('David21Service.convertKMToStartlist', () => {
  it('verknüpft Meldungen mit Schütze, Verein, Disziplin und Klasse', () => {
    const meldungen = [{ schuetzeId: 's1', disziplinId: 'd1', wettkampfklasseId: 'w1' }];
    const schuetzen = [
      { id: 's1', nachname: 'Test', vorname: 'Tim', vereinId: 'v1', geburtsjahr: 1990, geschlecht: 'male' },
    ];
    const vereine = [{ id: 'v1', name: 'SV Einbeck', nummer: 8 }];
    const disziplinen = [{ id: 'd1', name: 'Luftgewehr' }];
    const wettkampfklassen = [{ id: 'w1', name: 'Herren I' }];

    const entries = David21Service.convertKMToStartlist(
      meldungen,
      schuetzen,
      vereine,
      disziplinen,
      wettkampfklassen
    );
    expect(entries).toHaveLength(1);
    expect(entries[0].startNummer).toBe(1);
    expect(entries[0].nachname).toBe('Test');
    expect(entries[0].geschlecht).toBe('M');
    expect(entries[0].vereinsName).toBe('SV Einbeck');
    expect(entries[0].wettkampfklasse).toBe('Herren I');
  });

  it('überspringt Meldungen mit fehlenden Referenzen', () => {
    const entries = David21Service.convertKMToStartlist(
      [{ schuetzeId: 'unbekannt', disziplinId: 'd1', wettkampfklasseId: 'w1' }],
      [],
      [],
      [],
      []
    );
    expect(entries).toHaveLength(0);
  });
});
