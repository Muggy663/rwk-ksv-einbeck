import { describe, it, expect } from 'vitest';
import { recalculateAllPositions, type PositionsStarter } from './startlisten-positionen';

function starter(name: string): PositionsStarter {
  return { name };
}

describe('recalculateAllPositions', () => {
  const konfig = { staende: [1, 2, 3], durchgang: 50, wechsel: 10, startzeit: '14:00' };

  it('verteilt Starter rundenweise auf die konfigurierten Stände', () => {
    const liste = ['A', 'B', 'C', 'D', 'E'].map(starter);
    const result = recalculateAllPositions(liste, konfig);
    expect(result.map((s) => s.stand)).toEqual(['1', '2', '3', '1', '2']);
  });

  it('setzt die Durchgangsnummer passend zur vollen Standbelegung', () => {
    const liste = ['A', 'B', 'C', 'D', 'E'].map(starter);
    const result = recalculateAllPositions(liste, konfig);
    // Erste 3 = DG1, nächste 2 = DG2
    expect(result.map((s) => s.durchgang)).toEqual([1, 1, 1, 2, 2]);
  });

  it('berechnet die Startzeit je Durchgang (durchgang + wechsel Minuten später)', () => {
    const liste = ['A', 'B', 'C', 'D'].map(starter);
    const result = recalculateAllPositions(liste, konfig);
    // DG1 um 14:00, DG2 um 14:00 + (50+10) = 15:00
    expect(result[0].startzeit).toBe('14:00');
    expect(result[3].startzeit).toBe('15:00');
  });

  it('verändert die Eingabeliste nicht', () => {
    const liste = ['A', 'B'].map(starter);
    const copy = JSON.parse(JSON.stringify(liste));
    recalculateAllPositions(liste, konfig);
    expect(liste).toEqual(copy);
  });

  it('nutzt Defaults, wenn keine Konfiguration übergeben wird', () => {
    const liste = Array.from({ length: 10 }, (_, i) => starter(`S${i}`));
    const result = recalculateAllPositions(liste);
    // Default: 9 Stände -> der 10. Starter beginnt Durchgang 2 an Stand 1
    expect(result[8].durchgang).toBe(1);
    expect(result[8].stand).toBe('9');
    expect(result[9].durchgang).toBe(2);
    expect(result[9].stand).toBe('1');
  });

  it('fällt bei leerer Ständeliste auf die Defaults zurück', () => {
    const liste = ['A', 'B'].map(starter);
    const result = recalculateAllPositions(liste, { staende: [] });
    expect(result.map((s) => s.stand)).toEqual(['1', '2']);
  });

  it('normalisiert eine Startzeit über Mitternacht hinaus', () => {
    // Startzeit 23:30, großer DG+Wechsel -> DG2 über Mitternacht
    const liste = ['A', 'B'].map(starter);
    const result = recalculateAllPositions(liste, {
      staende: [1],
      durchgang: 40,
      wechsel: 10,
      startzeit: '23:30',
    });
    expect(result[0].startzeit).toBe('23:30');
    // 23:30 + 50 min = 00:20 des Folgetags
    expect(result[1].startzeit).toBe('00:20');
  });

  it('gibt bei leerer Liste eine leere Liste zurück', () => {
    expect(recalculateAllPositions([], konfig)).toEqual([]);
  });

  it('erhält zusätzliche Starter-Felder', () => {
    const liste: PositionsStarter[] = [{ name: 'A', verein: 'SV Einbeck', anmerkung: 'x' }];
    const result = recalculateAllPositions(liste, konfig);
    expect(result[0].verein).toBe('SV Einbeck');
    expect(result[0].anmerkung).toBe('x');
  });
});
