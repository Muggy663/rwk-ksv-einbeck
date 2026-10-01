import { describe, it, expect } from 'vitest';
import { getSeasonSpecificScoresCollection, getScoresCollectionName } from './collection-names';

/**
 * Tests für die Collection-Namens-Bildung. Diese Logik war Quelle zweier echter
 * Bugs (LP/Luftpistole und LGS/Luftgewehr-Freihand landeten fälschlich in
 * rwk_scores_JAHR_UNKNOWN statt _LD). Die Tests sichern die korrekte
 * Normalisierung dauerhaft ab.
 */
describe('getSeasonSpecificScoresCollection', () => {
  it('normalisiert Kleinkaliber-Gewehr-Typen auf KK', () => {
    expect(getSeasonSpecificScoresCollection(2026, 'KK')).toBe('rwk_scores_2026_KK');
    expect(getSeasonSpecificScoresCollection(2026, 'KKG')).toBe('rwk_scores_2026_KK');
  });

  it('hält Kleinkaliber-Pistole als KKP eigenständig', () => {
    expect(getSeasonSpecificScoresCollection(2026, 'KKP')).toBe('rwk_scores_2026_KKP');
  });

  it('normalisiert ALLE Luftdruck-Typen auf LD (inkl. der gefixten LGS/LP-Fälle)', () => {
    expect(getSeasonSpecificScoresCollection(2026, 'LG')).toBe('rwk_scores_2026_LD');
    expect(getSeasonSpecificScoresCollection(2026, 'LGA')).toBe('rwk_scores_2026_LD');
    expect(getSeasonSpecificScoresCollection(2026, 'LGS')).toBe('rwk_scores_2026_LD'); // Freihand-Fix
    expect(getSeasonSpecificScoresCollection(2026, 'LP')).toBe('rwk_scores_2026_LD');  // Luftpistole-Fix
    expect(getSeasonSpecificScoresCollection(2026, 'LPA')).toBe('rwk_scores_2026_LD');
  });

  it('bildet den Collection-Namen mit dem übergebenen Jahr', () => {
    expect(getSeasonSpecificScoresCollection(2025, 'KK')).toBe('rwk_scores_2025_KK');
    expect(getSeasonSpecificScoresCollection(2027, 'LP')).toBe('rwk_scores_2027_LD');
  });

  it('fällt bei unbekanntem Typ auf UNKNOWN zurück', () => {
    expect(getSeasonSpecificScoresCollection(2026, 'XYZ' as any)).toBe('rwk_scores_2026_UNKNOWN');
  });
});

describe('getScoresCollectionName', () => {
  it('nutzt die saison-spezifische Collection, wenn Jahr und Typ vorhanden sind', () => {
    expect(getScoresCollectionName(2026, 'LP')).toBe('rwk_scores_2026_LD');
  });

  it('fällt auf die alte Sammel-Collection zurück, wenn Jahr oder Typ fehlen', () => {
    expect(getScoresCollectionName()).toBe('rwk_scores');
    expect(getScoresCollectionName(2026)).toBe('rwk_scores');
    expect(getScoresCollectionName(undefined, 'LP')).toBe('rwk_scores');
  });
});
