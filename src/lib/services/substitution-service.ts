// src/lib/services/substitution-service.ts
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs } from 'firebase/firestore';
import type { ScoreEntry } from '@/types/rwk';
import { logDebug, logError } from '@/lib/utils/secure-logger';

/**
 * Substitution-Information aus Datenbank
 */
export interface SubstitutionInfo {
  teamId: string;
  originalShooterId: string;
  replacementShooterId: string;
  originalShooterName: string;
  replacementShooterName?: string;
  fromRound: number;
  reason?: string;
  type: 'replaced_shooter' | 'new_shooter';
}

/**
 * Zentraler Service für Ersatzschützen-Verwaltung
 * Single Source of Truth: team_substitutions Collection
 */
export class SubstitutionService {
  
  /**
   * Lädt alle Substitutions für ein bestimmtes Jahr
   * 
   * @param competitionYear - Wettkampfjahr
   * @returns Map mit Key: "teamId-shooterId" -> SubstitutionInfo
   */
  static async loadSubstitutions(competitionYear: number): Promise<Map<string, SubstitutionInfo>> {
    const substitutionsMap = new Map<string, SubstitutionInfo>();
    
    try {
      const substitutionsQuery = query(
        collection(db, 'team_substitutions'),
        where('competitionYear', '==', competitionYear)
      );
      
      const snapshot = await getDocs(substitutionsQuery);
      
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        
        // Key für Ersatzschützen (neue Schützen)
        const replacementKey = `${data.teamId}-${data.replacementShooterId}`;
        substitutionsMap.set(replacementKey, {
          teamId: data.teamId,
          originalShooterId: data.originalShooterId,
          replacementShooterId: data.replacementShooterId,
          originalShooterName: data.originalShooterName,
          replacementShooterName: data.replacementShooterName,
          fromRound: data.fromRound,
          reason: data.reason,
          type: data.type || 'new_shooter'
        });
        
        // Key für ersetzte Schützen (alte Schützen)
        const originalKey = `${data.teamId}-${data.originalShooterId}`;
        substitutionsMap.set(originalKey, {
          teamId: data.teamId,
          originalShooterId: data.originalShooterId,
          replacementShooterId: data.replacementShooterId,
          originalShooterName: data.originalShooterName,
          replacementShooterName: data.replacementShooterName,
          fromRound: data.fromRound,
          reason: data.reason,
          type: 'replaced_shooter'
        });
      });
      
      logDebug(`Substitutions geladen: ${substitutionsMap.size} Einträge für Jahr ${competitionYear}`);
      
    } catch (error) {
      logError('Fehler beim Laden der Substitutions:', error);
      // Rückgabe leere Map bei Fehler (Substitutions sind optional)
    }
    
    return substitutionsMap;
  }
  
  /**
   * Filtert Scores für Team-Wertung (berücksichtigt Ersatzschützen)
   * 
   * Regeln:
   * - Ersetzte Schützen: Nur Ergebnisse VOR fromRound zählen
   * - Ersatzschützen: Nur Ergebnisse AB fromRound zählen
   * - isSubstitutionCopy Scores werden ignoriert
   * 
   * @param scores - Alle Scores des Teams
   * @param substitutions - Substitution-Map
   * @param teamId - Team-ID für Lookup
   * @returns Gefilterte Scores für Team-Berechnung
   */
  static filterScoresForTeamCalculation(
    scores: ScoreEntry[],
    substitutions: Map<string, SubstitutionInfo>,
    teamId: string
  ): ScoreEntry[] {
    return scores.filter(score => {
      // Ignoriere Substitution-Kopien
      if (score.isSubstitutionCopy === true) {
        return false;
      }
      
      const key = `${teamId}-${score.shooterId}`;
      const substitution = substitutions.get(key);
      
      if (!substitution) {
        return true; // Kein Ersatz, Score zählt
      }
      
      // Ersetzter Schütze: Nur Scores VOR fromRound
      if (substitution.type === 'replaced_shooter') {
        return score.durchgang < substitution.fromRound;
      }
      
      // Ersatzschütze: Nur Scores AB fromRound
      if (substitution.type === 'new_shooter') {
        return score.durchgang >= substitution.fromRound;
      }
      
      return true;
    });
  }
  
  /**
   * Filtert Scores für Einzelwertung (berücksichtigt Ersatzschützen)
   * 
   * Regeln:
   * - Ersetzte Schützen werden komplett ausgeblendet
   * - Ersatzschützen: Nur Ergebnisse AB fromRound zählen
   * - isSubstitutionCopy Scores werden ignoriert
   * 
   * @param scores - Alle Scores
   * @param substitutions - Substitution-Map
   * @returns Gefilterte Scores für Einzelrangliste
   */
  static filterScoresForIndividualRanking(
    scores: ScoreEntry[],
    substitutions: Map<string, SubstitutionInfo>
  ): ScoreEntry[] {
    return scores.filter(score => {
      // Ignoriere Substitution-Kopien
      if (score.isSubstitutionCopy === true) {
        return false;
      }
      
      const key = `${score.teamId}-${score.shooterId}`;
      const substitution = substitutions.get(key);
      
      if (!substitution) {
        return true; // Kein Ersatz, Score zählt
      }
      
      // Ersetzte Schützen komplett ausblenden
      if (substitution.type === 'replaced_shooter') {
        return false;
      }
      
      // Ersatzschütze: Nur Scores AB fromRound
      if (substitution.type === 'new_shooter') {
        return score.durchgang >= substitution.fromRound;
      }
      
      return true;
    });
  }
  
  /**
   * Gibt Set aller ersetzten Schützen-IDs zurück
   * 
   * @param substitutions - Substitution-Map
   * @returns Set von Schützen-IDs die ersetzt wurden
   */
  static getReplacedShooterIds(substitutions: Map<string, SubstitutionInfo>): Set<string> {
    const replacedIds = new Set<string>();
    
    substitutions.forEach(sub => {
      if (sub.type === 'replaced_shooter') {
        replacedIds.add(sub.originalShooterId);
      }
    });
    
    return replacedIds;
  }
  
  /**
   * Prüft ob ein Schütze in einem Team ersetzt wurde
   * 
   * @param teamId - Team-ID
   * @param shooterId - Schützen-ID
   * @param substitutions - Substitution-Map
   * @returns true wenn Schütze ersetzt wurde
   */
  static isReplacedShooter(
    teamId: string,
    shooterId: string,
    substitutions: Map<string, SubstitutionInfo>
  ): boolean {
    const key = `${teamId}-${shooterId}`;
    const substitution = substitutions.get(key);
    return substitution?.type === 'replaced_shooter';
  }
  
  /**
   * Prüft ob ein Schütze ein Ersatzschütze ist
   * 
   * @param teamId - Team-ID
   * @param shooterId - Schützen-ID
   * @param substitutions - Substitution-Map
   * @returns SubstitutionInfo wenn Ersatzschütze, sonst null
   */
  static getSubstitutionInfo(
    teamId: string,
    shooterId: string,
    substitutions: Map<string, SubstitutionInfo>
  ): SubstitutionInfo | null {
    const key = `${teamId}-${shooterId}`;
    const substitution = substitutions.get(key);
    return substitution?.type === 'new_shooter' ? substitution : null;
  }
}
