// src/lib/services/team-calculation-service.ts
import type { ScoreEntry } from '@/types/rwk';
import { deduplicateScores, groupScoresByRound } from '@/lib/utils/score-deduplication';
import { SubstitutionService, type SubstitutionInfo } from './substitution-service';
import { logDebug, logWarn } from '@/lib/utils/secure-logger';

/** Maximale Anzahl Schützen pro Team (beste 3 zählen) */
const MAX_SHOOTERS_PER_TEAM = 3;

/**
 * Ergebnis der Team-Berechnung
 */
export interface TeamCalculationResult {
  /** Ergebnisse pro Durchgang (dg1, dg2, ...) */
  roundResults: { [key: string]: number | null };
  /** Gesamtpunktzahl über alle Durchgänge */
  totalScore: number;
  /** Durchschnitt pro Durchgang */
  averageScore: number | null;
  /** Anzahl gewerteter Durchgänge */
  numScoredRounds: number;
  /** Punktzahl für Sortierung (bis aktueller vollständiger Durchgang) */
  sortingScore: number;
  /** Durchschnitt für Sortierung */
  sortingAverage: number;
  /** Warnungen bei ungewöhnlichen Konstellationen */
  warnings: string[];
}

/**
 * Zentraler Service für Team-Berechnungen
 * Konsistente Logik für alle Module (RWK-Tabellen, Admin, Season-Transition)
 */
export class TeamCalculationService {
  
  /**
   * Berechnet Team-Ergebnisse basierend auf Scores
   * 
   * @param teamId - Team-ID
   * @param teamScores - Alle Scores des Teams
   * @param numRounds - Anzahl Durchgänge
   * @param substitutions - Substitution-Map
   * @param teamName - Team-Name für Logging (optional)
   * @returns Berechnungsergebnis mit Warnings
   */
  static calculateTeamResults(
    teamId: string,
    teamScores: ScoreEntry[],
    numRounds: number,
    substitutions: Map<string, SubstitutionInfo>,
    teamName?: string
  ): TeamCalculationResult {
    const warnings: string[] = [];
    
    // 1. Deduplizierung (Original bevorzugen, neuestes Timestamp)
    const dedupedScores = deduplicateScores(teamScores, {
      preferOriginalOverCopy: true,
      useLatestTimestamp: true,
      groupBy: 'shooter-round-year-type'
    });
    
    if (dedupedScores.length < teamScores.length) {
      const removed = teamScores.length - dedupedScores.length;
      logDebug(`Team ${teamName || teamId}: ${removed} Duplikate entfernt`);
    }
    
    // 2. Substitutions anwenden (nur relevante Scores für Team-Wertung)
    const filteredScores = SubstitutionService.filterScoresForTeamCalculation(
      dedupedScores,
      substitutions,
      teamId
    );
    
    if (filteredScores.length < dedupedScores.length) {
      const removed = dedupedScores.length - filteredScores.length;
      logDebug(`Team ${teamName || teamId}: ${removed} Scores durch Substitutions gefiltert`);
    }
    
    // 3. Gruppiere nach Durchgang
    const scoresByRound = groupScoresByRound(filteredScores, numRounds);
    
    // 4. Berechne beste 3 pro Durchgang
    const roundResults = this.calculateBestThreePerRound(scoresByRound, numRounds);
    
    // 5. Validierung & Warnings
    this.validateResults(roundResults, scoresByRound, warnings, teamName || teamId);
    
    // 6. Gesamt-Berechnung
    return this.calculateTotals(roundResults, numRounds, warnings);
  }
  
  /**
   * Berechnet beste 3 Schützen pro Durchgang
   * 
   * @param scoresByRound - Gruppierte Scores
   * @param numRounds - Anzahl Durchgänge
   * @returns Durchgangs-Ergebnisse
   */
  private static calculateBestThreePerRound(
    scoresByRound: Map<number, number[]>,
    numRounds: number
  ): { [key: string]: number | null } {
    const results: { [key: string]: number | null } = {};
    
    for (let r = 1; r <= numRounds; r++) {
      const scores = scoresByRound.get(r) || [];
      
      // Filtere und sortiere (beste zuerst)
      const validScores = scores
        .filter(s => typeof s === 'number' && !isNaN(s))
        .sort((a, b) => b - a);
      
      const best3 = validScores.slice(0, MAX_SHOOTERS_PER_TEAM);
      
      // Summiere mit Rundung pro Score (verhindert Fließkomma-Fehler)
      const sum = best3.reduce((total, score) => total + Math.round(score), 0);
      
      // Nur setzen wenn genau 3 Schützen vorhanden
      results[`dg${r}`] = best3.length === MAX_SHOOTERS_PER_TEAM ? sum : null;
    }
    
    return results;
  }
  
  /**
   * Validiert Ergebnisse und sammelt Warnings
   * 
   * @param roundResults - Berechnete Durchgangs-Ergebnisse
   * @param scoresByRound - Gruppierte Scores
   * @param warnings - Array für Warnings
   * @param teamName - Team-Name für Logging
   */
  private static validateResults(
    roundResults: { [key: string]: number | null },
    scoresByRound: Map<number, number[]>,
    warnings: string[],
    teamName: string
  ): void {
    scoresByRound.forEach((scores, round) => {
      const validScores = scores.filter(s => typeof s === 'number' && !isNaN(s));
      const roundKey = `dg${round}`;
      
      // Warnung: Zu viele Schützen
      if (validScores.length > MAX_SHOOTERS_PER_TEAM + 1) {
        const warning = `DG${round}: ${validScores.length} Schützen (erwartet: max 4)`;
        warnings.push(warning);
        logWarn(`Team ${teamName}: ${warning}`);
      }
      
      // Warnung: Zu wenige Schützen aber Ergebnis gesetzt
      if (validScores.length < MAX_SHOOTERS_PER_TEAM && roundResults[roundKey] !== null) {
        const warning = `DG${round}: Nur ${validScores.length} Schützen, aber Ergebnis gesetzt`;
        warnings.push(warning);
        logWarn(`Team ${teamName}: ${warning}`);
      }
      
      // Warnung: Genug Schützen aber kein Ergebnis
      if (validScores.length >= MAX_SHOOTERS_PER_TEAM && roundResults[roundKey] === null) {
        const warning = `DG${round}: ${validScores.length} Schützen vorhanden, aber kein Ergebnis`;
        warnings.push(warning);
        logWarn(`Team ${teamName}: ${warning}`);
      }
    });
  }
  
  /**
   * Berechnet Gesamt-Statistiken
   * 
   * @param roundResults - Durchgangs-Ergebnisse
   * @param numRounds - Anzahl Durchgänge
   * @param warnings - Warnings aus Validierung
   * @returns Vollständiges Berechnungsergebnis
   */
  private static calculateTotals(
    roundResults: { [key: string]: number | null },
    numRounds: number,
    warnings: string[]
  ): TeamCalculationResult {
    let totalScore = 0;
    let numScoredRounds = 0;
    
    // Summiere alle gewerteten Durchgänge
    Object.values(roundResults).forEach(score => {
      if (score !== null) {
        totalScore += score;
        numScoredRounds++;
      }
    });
    
    const averageScore = numScoredRounds > 0 
      ? parseFloat((totalScore / numScoredRounds).toFixed(2)) 
      : null;
    
    // Berechne Sortier-Werte (bis aktueller vollständiger Durchgang)
    const currentRound = this.determineCurrentRound(roundResults, numRounds);
    let sortingScore = 0;
    let sortingRounds = 0;
    
    for (let r = 1; r <= currentRound; r++) {
      const score = roundResults[`dg${r}`];
      if (score !== null) {
        sortingScore += score;
        sortingRounds++;
      }
    }
    
    const sortingAverage = sortingRounds > 0 ? sortingScore / sortingRounds : 0;
    
    return {
      roundResults,
      totalScore,
      averageScore,
      numScoredRounds,
      sortingScore,
      sortingAverage,
      warnings
    };
  }
  
  /**
   * Bestimmt den aktuellen vollständigen Durchgang FÜR DIESES TEAM
   * (Nur Durchgänge wo ALLE 3 Schützen Ergebnisse haben)
   * 
   * @param roundResults - Durchgangs-Ergebnisse
   * @param numRounds - Anzahl Durchgänge
   * @returns Nummer des aktuellen vollständigen Durchgangs
   */
  private static determineCurrentRound(
    roundResults: { [key: string]: number | null },
    numRounds: number
  ): number {
    // Finde letzten LÜCKENLOSEN Durchgang (alle vorherigen müssen auch vollständig sein)
    let lastCompleteRound = 0;
    for (let r = 1; r <= numRounds; r++) {
      if (roundResults[`dg${r}`] !== null) {
        lastCompleteRound = r;
      } else {
        // Sobald eine Lücke kommt, stoppen
        break;
      }
    }
    return lastCompleteRound;
  }
}
