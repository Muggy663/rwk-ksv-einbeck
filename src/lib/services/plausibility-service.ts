// Live-Plausibilitätsprüfung für Ergebniserfassung
import { db } from '@/lib/firebase/config';
import { logError } from '@/lib/utils/secure-logger';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { getSeasonSpecificScoresCollection } from '@/lib/utils/collection-names';

export interface PlausibilityWarning {
  type: 'impossible' | 'anomaly' | 'consistency' | 'info';
  severity: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  suggestion?: string;
}

export interface ShooterHistory {
  shooterId: string;
  shooterName: string;
  averageScore: number;
  bestScore: number;
  worstScore: number;
  recentScores: number[];
  totalRounds: number;
}

export interface TeamHistory {
  teamId: string;
  teamName: string;
  averageTeamScore: number;
  bestTeamScore: number;
  worstTeamScore: number;
  recentTeamScores: number[];
  totalRounds: number;
}

class PlausibilityService {
  private shooterHistoryCache = new Map<string, ShooterHistory>();
  private teamHistoryCache = new Map<string, TeamHistory>();
  private cacheExpiry = 5 * 60 * 1000; // 5 Minuten
  private lastCacheUpdate = new Map<string, number>();

  async checkScorePlausibility(
    shooterId: string,
    shooterName: string,
    teamId: string,
    teamName: string,
    score: number,
    leagueType: string,
    competitionYear: number
  ): Promise<PlausibilityWarning[]> {
    const warnings: PlausibilityWarning[] = [];

    try {
      // 1. Unmögliche Werte prüfen
      const impossibleCheck = this.checkImpossibleValues(score, leagueType);
      if (impossibleCheck) warnings.push(impossibleCheck);

      // 2. Schützen-Konsistenz prüfen
      const shooterHistory = await this.getShooterHistory(shooterId, leagueType, competitionYear);
      const consistencyCheck = this.checkShooterConsistency(shooterName, score, shooterHistory);
      if (consistencyCheck) warnings.push(consistencyCheck);

      // 3. Team-Anomalie prüfen
      const teamHistory = await this.getTeamHistory(teamId, leagueType, competitionYear);
      const anomalyCheck = this.checkTeamAnomaly(teamName, score, teamHistory);
      if (anomalyCheck) warnings.push(anomalyCheck);

      // 4. Positive Bestätigung bei guten Werten
      const positiveCheck = this.checkPositiveIndicators(score, shooterHistory, teamHistory);
      if (positiveCheck) warnings.push(positiveCheck);
    } catch (error) {
      logError('Fehler bei Plausibilitätsprüfung:', error);
      warnings.push({
        type: 'info',
        severity: 'info',
        title: 'ℹ️ Hinweis',
        message: 'Plausibilitätsprüfung konnte nicht vollständig durchgeführt werden.',
        suggestion: 'Bitte prüfen Sie die Eingabe manuell.'
      });
    }

    return warnings;
  }

  private checkImpossibleValues(score: number, leagueType: string): PlausibilityWarning | null {
    const maxScores: Record<string, number> = {
      'KK': 300, 'KKG': 300,
      'LG': 400, 'LGA': 400,
      'LP': 400, 'LPA': 400
    };

    const maxScore = maxScores[leagueType] || 300;
    const lowScoreThreshold = 0.5;

    if (score < 0) {
      return {
        type: 'impossible',
        severity: 'critical',
        title: '❌ Unmöglicher Wert',
        message: 'Negative Ringzahlen sind nicht möglich.',
        suggestion: 'Bitte geben Sie eine positive Zahl ein.'
      };
    }

    if (score > maxScore) {
      return {
        type: 'impossible',
        severity: 'critical',
        title: '❌ Unmöglicher Wert',
        message: `Maximum für ${leagueType} ist ${maxScore} Ringe.`,
        suggestion: `Bitte korrigieren Sie auf maximal ${maxScore} Ringe.`
      };
    }

    // Sehr niedrige Werte (unter 50% des Maximums)
    if (score < maxScore * lowScoreThreshold) {
      return {
        type: 'anomaly',
        severity: 'warning',
        title: '⚠️ Sehr niedriger Wert',
        message: `${score} Ringe ist ungewöhnlich niedrig für ${leagueType}.`,
        suggestion: 'Bitte prüfen Sie die Eingabe auf Tippfehler.'
      };
    }

    return null;
  }

  private checkShooterConsistency(
    shooterName: string,
    score: number,
    history: ShooterHistory | null
  ): PlausibilityWarning | null {
    if (!history || history.totalRounds < 3) return null;

    const deviation = Math.abs(score - history.averageScore);
    const threshold = Math.max(30, history.averageScore * 0.15); // Mindestens 30 Ringe oder 15% Abweichung

    if (deviation > threshold) {
      const isLower = score < history.averageScore;
      return {
        type: 'consistency',
        severity: isLower ? 'warning' : 'info',
        title: isLower ? '🤔 Ungewöhnlich schwach' : '🎯 Ungewöhnlich stark',
        message: `${shooterName} schießt normalerweise ~${Math.round(history.averageScore)} Ringe, heute ${score}.`,
        suggestion: isLower 
          ? 'Möglicher Tippfehler? Oder schlechter Tag?'
          : 'Starke Leistung! Bitte nochmals prüfen.'
      };
    }

    return null;
  }

  private checkTeamAnomaly(
    teamName: string,
    score: number,
    history: TeamHistory | null
  ): PlausibilityWarning | null {
    if (!history || history.totalRounds < 2) return null;

    // Prüfe ob der Einzelwert extrem vom Team-Durchschnitt abweicht
    const shootersPerTeam = 5; // Annahme: 5 Schützen pro Team
    const teamAvgPerShooter = history.averageTeamScore / shootersPerTeam;
    const deviation = Math.abs(score - teamAvgPerShooter);
    const deviationThreshold = 0.2; // 20% Abweichung
    const threshold = teamAvgPerShooter * deviationThreshold;

    if (deviation > threshold && deviation > 40) {
      return {
        type: 'anomaly',
        severity: 'warning',
        title: '📊 Team-Anomalie',
        message: `${teamName} schießt normalerweise ~${Math.round(teamAvgPerShooter)} Ringe pro Schütze.`,
        suggestion: `${score} Ringe weicht stark ab - bitte prüfen.`
      };
    }

    return null;
  }

  private checkPositiveIndicators(
    score: number,
    shooterHistory: ShooterHistory | null,
    _teamHistory: TeamHistory | null
  ): PlausibilityWarning | null {
    // Sehr gute Werte bestätigen
    if (score >= 350) {
      return {
        type: 'info',
        severity: 'info',
        title: '🎯 Ausgezeichnetes Ergebnis',
        message: `${score} Ringe ist eine sehr starke Leistung!`,
        suggestion: 'Glückwunsch zum tollen Ergebnis.'
      };
    }

    // Verbesserung gegenüber Durchschnitt
    const improvementThreshold = 20;
    if (shooterHistory && score > shooterHistory.averageScore + improvementThreshold) {
      return {
        type: 'info',
        severity: 'info',
        title: '📈 Starke Verbesserung',
        message: `Deutlich über dem Durchschnitt von ${Math.round(shooterHistory.averageScore)} Ringen.`,
        suggestion: 'Tolle Leistungssteigerung!'
      };
    }

    return null;
  }

  private async getShooterHistory(
    shooterId: string,
    leagueType: string,
    competitionYear: number
  ): Promise<ShooterHistory | null> {
    const cacheKey = `${shooterId}-${leagueType}-${competitionYear}`;
    
    // Cache prüfen
    if (this.shooterHistoryCache.has(cacheKey)) {
      const lastUpdate = this.lastCacheUpdate.get(cacheKey) || 0;
      if (Date.now() - lastUpdate < this.cacheExpiry) {
        return this.shooterHistoryCache.get(cacheKey) || null;
      }
    }

    try {
      // Letzte 20 Ergebnisse des Schützen in dieser Disziplin laden
      const collectionName = getSeasonSpecificScoresCollection(competitionYear, leagueType as any);
      const scoresQuery = query(
        collection(db, collectionName),
        where('shooterId', '==', shooterId),
        where('leagueType', '==', leagueType),
        where('competitionYear', '>=', competitionYear - 1), // Aktuelle und letzte Saison
        orderBy('entryTimestamp', 'desc'),
        limit(20)
      );

      const snapshot = await getDocs(scoresQuery);
      const scores = snapshot.docs.map(doc => doc.data().totalRinge as number);

      if (scores.length === 0) return null;

      const history: ShooterHistory = {
        shooterId,
        shooterName: snapshot.docs[0]?.data().shooterName || 'Unbekannt',
        averageScore: scores.reduce((sum, score) => sum + score, 0) / scores.length,
        bestScore: Math.max(...scores),
        worstScore: Math.min(...scores),
        recentScores: scores.slice(0, 5), // Letzte 5 Ergebnisse
        totalRounds: scores.length
      };

      // Cache aktualisieren
      this.shooterHistoryCache.set(cacheKey, history);
      this.lastCacheUpdate.set(cacheKey, Date.now());

      return history;
    } catch (error) {
      logError('Fehler beim Laden der Schützen-Historie:', error);
      return null;
    }
  }

  private async getTeamHistory(
    teamId: string,
    leagueType: string,
    competitionYear: number
  ): Promise<TeamHistory | null> {
    const cacheKey = `${teamId}-${leagueType}-${competitionYear}`;
    
    // Cache prüfen
    if (this.teamHistoryCache.has(cacheKey)) {
      const lastUpdate = this.lastCacheUpdate.get(cacheKey) || 0;
      if (Date.now() - lastUpdate < this.cacheExpiry) {
        return this.teamHistoryCache.get(cacheKey) || null;
      }
    }

    try {
      // Team-Ergebnisse der letzten Durchgänge laden
      const collectionName = getSeasonSpecificScoresCollection(competitionYear, leagueType as any);
      const scoresQuery = query(
        collection(db, collectionName),
        where('teamId', '==', teamId),
        where('leagueType', '==', leagueType),
        where('competitionYear', '>=', competitionYear - 1),
        orderBy('entryTimestamp', 'desc'),
        limit(50) // Mehr Daten für Team-Analyse
      );

      const snapshot = await getDocs(scoresQuery);
      
      if (snapshot.empty) return null;

      // Gruppiere nach Durchgängen
      const roundScores = new Map<number, number[]>();
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        const round = data.durchgang;
        if (!roundScores.has(round)) {
          roundScores.set(round, []);
        }
        const scores = roundScores.get(round);
        if (scores) {
          scores.push(data.totalRinge);
        }
      });

      // Berechne Team-Summen pro Durchgang
      const teamTotals: number[] = [];
      roundScores.forEach(scores => {
        teamTotals.push(scores.reduce((sum, score) => sum + score, 0));
      });

      if (teamTotals.length === 0) return null;

      const history: TeamHistory = {
        teamId,
        teamName: snapshot.docs[0]?.data().teamName || 'Unbekannt',
        averageTeamScore: teamTotals.reduce((sum, total) => sum + total, 0) / teamTotals.length,
        bestTeamScore: Math.max(...teamTotals),
        worstTeamScore: Math.min(...teamTotals),
        recentTeamScores: teamTotals.slice(0, 3),
        totalRounds: teamTotals.length
      };

      // Cache aktualisieren
      this.teamHistoryCache.set(cacheKey, history);
      this.lastCacheUpdate.set(cacheKey, Date.now());

      return history;
    } catch (error) {
      logError('Fehler beim Laden der Team-Historie:', error);
      return null;
    }
  }

  // Cache leeren (für Tests oder bei Bedarf)
  clearCache(): void {
    this.shooterHistoryCache.clear();
    this.teamHistoryCache.clear();
    this.lastCacheUpdate.clear();
  }
}

export const plausibilityService = new PlausibilityService();
