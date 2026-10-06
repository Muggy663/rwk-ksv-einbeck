import { describe, it, expect } from 'vitest';
import { getLeagueShotConfig, getDefaultShotConfigForType } from './league-shot-config';
import type { FirestoreLeagueSpecificDiscipline } from '@/types/rwk';

/**
 * Tests für die zentrale Schuss-/Ring-Konfiguration.
 *
 * Die Fallback-Kette ist: shotSettings → Default je league.type → SAFE_FALLBACK (600/40).
 * Hier wird jeder Pfad einzeln und in Kombination getestet.
 */
describe('getLeagueShotConfig', () => {
  // ── 1) shotSettings vorhanden ──
  it('nutzt shotSettings.maxRings und shotSettings.shotCount wenn vorhanden', () => {
    const league = {
      type: 'LG' as FirestoreLeagueSpecificDiscipline,
      shotSettings: { discipline: 'Luftgewehr Freihand', shotCount: 20, maxRings: 200 },
    };
    expect(getLeagueShotConfig(league)).toEqual({ maxRings: 200, shotCount: 20 });
  });

  it('ignoriert shotSettings mit maxRings = 0 und fällt auf type-Default', () => {
    const league = {
      type: 'KK' as FirestoreLeagueSpecificDiscipline,
      shotSettings: { discipline: 'Kleinkaliber', shotCount: 0, maxRings: 0 },
    };
    // Beide Werte <=0 → Fallback auf KK-Default
    expect(getLeagueShotConfig(league)).toEqual({ maxRings: 300, shotCount: 30 });
  });

  it('mischt: shotSettings.maxRings gültig, shotCount fehlt → shot-Default aus type', () => {
    const league = {
      type: 'LGA' as FirestoreLeagueSpecificDiscipline,
      shotSettings: { discipline: 'Luftgewehr Auflage', shotCount: 0, maxRings: 350 },
    };
    expect(getLeagueShotConfig(league)).toEqual({ maxRings: 350, shotCount: 40 });
  });

  // ── 2) Kein shotSettings → type-Default ──
  it('LG-Gruppe (LG) → 400/40', () => {
    expect(getLeagueShotConfig({ type: 'LG' })).toEqual({ maxRings: 400, shotCount: 40 });
  });

  it('LG-Gruppe (LGS) → 400/40', () => {
    expect(getLeagueShotConfig({ type: 'LGS' })).toEqual({ maxRings: 400, shotCount: 40 });
  });

  it('LG-Gruppe (LP) → 400/40', () => {
    expect(getLeagueShotConfig({ type: 'LP' })).toEqual({ maxRings: 400, shotCount: 40 });
  });

  it('LG-Gruppe (LPA) → 400/40', () => {
    expect(getLeagueShotConfig({ type: 'LPA' })).toEqual({ maxRings: 400, shotCount: 40 });
  });

  it('LG-Gruppe (LD) → 400/40', () => {
    expect(getLeagueShotConfig({ type: 'LD' })).toEqual({ maxRings: 400, shotCount: 40 });
  });

  it('KK-Gruppe (KK) → 300/30', () => {
    expect(getLeagueShotConfig({ type: 'KK' })).toEqual({ maxRings: 300, shotCount: 30 });
  });

  it('KK-Gruppe (KKP) → 300/30', () => {
    expect(getLeagueShotConfig({ type: 'KKP' })).toEqual({ maxRings: 300, shotCount: 30 });
  });

  it('KK-Gruppe (KKG) → 300/30', () => {
    expect(getLeagueShotConfig({ type: 'KKG' })).toEqual({ maxRings: 300, shotCount: 30 });
  });

  // ── 3) null/undefined → SAFE_FALLBACK ──
  it('null → 600/40 (sicherer Fallback)', () => {
    expect(getLeagueShotConfig(null)).toEqual({ maxRings: 600, shotCount: 40 });
  });

  it('undefined → 600/40 (sicherer Fallback)', () => {
    expect(getLeagueShotConfig(undefined)).toEqual({ maxRings: 600, shotCount: 40 });
  });

  it('kein Argument → 600/40 (sicherer Fallback)', () => {
    expect(getLeagueShotConfig()).toEqual({ maxRings: 600, shotCount: 40 });
  });

  it('unbekannter Typ (nicht im Enum) → 600/40', () => {
    // Theoretisch nicht möglich, aber trotzdem abgesichert.
    expect(getLeagueShotConfig({ type: 'XYZ' as FirestoreLeagueSpecificDiscipline })).toEqual({
      maxRings: 600,
      shotCount: 40,
    });
  });
});

describe('getDefaultShotConfigForType', () => {
  it('LG → 400/40', () => {
    expect(getDefaultShotConfigForType('LG')).toEqual({ maxRings: 400, shotCount: 40 });
  });

  it('KKP → 300/30', () => {
    expect(getDefaultShotConfigForType('KKP')).toEqual({ maxRings: 300, shotCount: 30 });
  });

  it('undefined → 600/40 Fallback', () => {
    expect(getDefaultShotConfigForType(undefined)).toEqual({ maxRings: 600, shotCount: 40 });
  });
});
