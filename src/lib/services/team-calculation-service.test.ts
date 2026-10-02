import { describe, it, expect } from 'vitest';
import { TeamCalculationService } from './team-calculation-service';
import type { ScoreEntry } from '@/types/rwk';
import type { SubstitutionInfo } from './substitution-service';

// Minimaler ScoreEntry für die Berechnung. Nur die Felder, die der Service nutzt.
function score(shooterId: string, durchgang: number, totalRinge: number): ScoreEntry {
  return {
    shooterId,
    durchgang,
    totalRinge,
    competitionYear: 2026,
    leagueType: 'LGA',
  } as ScoreEntry;
}

const noSubs = () => new Map<string, SubstitutionInfo>();

describe('TeamCalculationService.calculateTeamResults – echte Mannschaft (Default beste 3)', () => {
  it('wertet einen Durchgang nur, wenn 3 Schützen geschossen haben', () => {
    const scores = [
      score('a', 1, 280),
      score('b', 1, 285),
      // nur 2 Schützen in DG1
    ];
    const result = TeamCalculationService.calculateTeamResults('team1', scores, 5, noSubs(), 'Team 1');
    expect(result.roundResults.dg1).toBeNull();
  });

  it('summiert die besten 3 bei genau 3 Schützen', () => {
    const scores = [score('a', 1, 280), score('b', 1, 285), score('c', 1, 290)];
    const result = TeamCalculationService.calculateTeamResults('team1', scores, 5, noSubs(), 'Team 1');
    expect(result.roundResults.dg1).toBe(855);
  });

  it('nimmt bei 4 Schützen nur die besten 3', () => {
    const scores = [
      score('a', 1, 280),
      score('b', 1, 285),
      score('c', 1, 290),
      score('d', 1, 270), // schlechtester fällt raus
    ];
    const result = TeamCalculationService.calculateTeamResults('team1', scores, 5, noSubs(), 'Team 1');
    expect(result.roundResults.dg1).toBe(855);
  });
});

describe('TeamCalculationService.calculateTeamResults – Einzelwertung', () => {
  it('wertet DG1 für einen einzelnen Schützen (Regressionsfall Harald Müller)', () => {
    // 1 Schütze, nur DG1 geschossen -> DG1 muss 281 zeigen, nicht null
    const scores = [score('harald', 1, 281)];
    const result = TeamCalculationService.calculateTeamResults(
      'einzel-salzderhelden',
      scores,
      5,
      noSubs(),
      'SV Salzderhelden Einzel',
      1 // Einzelwertung: 1 gemeldeter Schütze
    );
    expect(result.roundResults.dg1).toBe(281);
    expect(result.roundResults.dg2).toBeNull();
    expect(result.totalScore).toBe(281);
    expect(result.averageScore).toBe(281);
    expect(result.numScoredRounds).toBe(1);
  });

  it('wertet einen Durchgang bei zwei Einzelschützen erst, wenn beide geschossen haben', () => {
    const nurEiner = [score('x', 1, 290)];
    const r1 = TeamCalculationService.calculateTeamResults('e2', nurEiner, 5, noSubs(), 'Zwei-Einzel', 2);
    expect(r1.roundResults.dg1).toBeNull(); // erst 1 von 2

    const beide = [score('x', 1, 290), score('y', 1, 285)];
    const r2 = TeamCalculationService.calculateTeamResults('e2', beide, 5, noSubs(), 'Zwei-Einzel', 2);
    expect(r2.roundResults.dg1).toBe(575); // beide -> Summe
  });

  it('erzeugt keine Falsch-Warnung "zu wenige Schützen" bei korrekter Einzelwertung', () => {
    const scores = [score('harald', 1, 281)];
    const result = TeamCalculationService.calculateTeamResults('e1', scores, 5, noSubs(), 'Einzel', 1);
    const zuWenig = result.warnings.filter((w) => w.includes('Nur') && w.includes('Ergebnis gesetzt'));
    expect(zuWenig).toHaveLength(0);
  });
});
