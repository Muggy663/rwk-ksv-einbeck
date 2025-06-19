import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { fetchShooterPerformanceData } from '@/lib/services/statistics-service';

/**
 * Lädt Top-Schützen mit Trendanalyse
 * @param seasonId - ID der Saison
 * @param leagueId - ID der Liga (optional)
 * @param clubId - ID des Vereins (optional)
 * @param limit - Maximale Anzahl der Schützen (optional)
 * @returns Array von Schützen mit Trendanalyse
 */
export async function fetchTopShootersWithTrend(
  seasonId: string,
  leagueId?: string,
  clubId?: string,
  limit: number = 20
) {
  try {
    // Verwende die bestehende fetchShooterPerformanceData Funktion
    const shooterPerformanceData = await fetchShooterPerformanceData(
      seasonId,
      leagueId,
      clubId
    );
    
    // Berechne Trends für jeden Schützen
    const shootersWithTrend = shooterPerformanceData.map(shooter => {
      // Extrahiere die Durchgangsergebnisse
      const scores: number[] = [];
      for (let dg = 1; dg <= 5; dg++) {
        const key = `dg${dg}`;
        if (shooter.results[key]) {
          scores.push(shooter.results[key]);
        }
      }
      
      if (scores.length < 2) {
        return {
          shooterId: shooter.shooterId,
          shooterName: shooter.shooterName,
          teamName: shooter.teamName,
          averageScore: shooter.averageScore,
          trend: 'stable' as const,
          trendValue: 0
        };
      }
      
      // Berechne Trend: Vergleiche erste und letzte Hälfte der Scores
      const midpoint = Math.floor(scores.length / 2);
      const firstHalf = scores.slice(0, midpoint);
      const secondHalf = scores.slice(midpoint);
      
      const firstHalfAvg = firstHalf.reduce((sum, score) => sum + score, 0) / firstHalf.length;
      const secondHalfAvg = secondHalf.reduce((sum, score) => sum + score, 0) / secondHalf.length;
      
      const difference = secondHalfAvg - firstHalfAvg;
      
      // Definiere Schwellenwerte für Trend
      let trend: 'rising' | 'stable' | 'falling' = 'stable';
      if (difference > 1.5) {
        trend = 'rising';
      } else if (difference < -1.5) {
        trend = 'falling';
      }
      
      return {
        shooterId: shooter.shooterId,
        shooterName: shooter.shooterName,
        teamName: shooter.teamName,
        averageScore: shooter.averageScore,
        trend,
        trendValue: difference
      };
    });
    
    // Sortiere nach Durchschnitt
    shootersWithTrend.sort((a, b) => b.averageScore - a.averageScore);
    
    // Begrenze die Anzahl der Schützen
    return shootersWithTrend.slice(0, limit);
  } catch (error) {
    console.error('Fehler beim Laden der Schützen mit Trendanalyse:', error);
    throw error;
  }
}