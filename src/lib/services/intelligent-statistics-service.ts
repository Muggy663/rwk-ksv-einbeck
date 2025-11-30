// Intelligente Statistik-Analyse mit Gemini AI
import { db } from '@/lib/firebase/config';
import { logError, logWarn, logInfo, logDebug } from '@/lib/utils/secure-logger';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';

export interface StatisticsInsight {
  type: 'prognose' | 'trend' | 'performance' | 'anomaly';
  title: string;
  message: string;
  confidence: 'high' | 'medium' | 'low';
  data?: any;
}

export interface TeamPerformanceData {
  teamId: string;
  teamName: string;
  currentPoints: number;
  averagePerRound: number;
  trend: 'up' | 'down' | 'stable';
  roundsPlayed: number;
  position: number;
  totalTeams: number;
}

export interface LeagueAnalysisData {
  leagueId: string;
  leagueName: string;
  teams: TeamPerformanceData[];
  competitiveness: number; // 0-1, wie ausgeglichen die Liga ist
  averageScore: number;
  roundsCompleted: number;
}

class IntelligentStatisticsService {
  
  async generateInsights(
    seasonId: string,
    leagueId?: string,
    clubId?: string
  ): Promise<StatisticsInsight[]> {
    const insights: StatisticsInsight[] = [];
    
    try {
      // Lade Liga-Daten für Analyse
      const leagueData = await this.getLeagueAnalysisData(seasonId, leagueId);
      
      if (leagueData) {
        // Prognose-Texte generieren
        const prognoseInsights = this.generatePrognoseInsights(leagueData);
        insights.push(...prognoseInsights);
        
        // Trend-Analyse
        const trendInsights = this.generateTrendInsights(leagueData);
        insights.push(...trendInsights);
        
        // Performance-Insights
        const performanceInsights = this.generatePerformanceInsights(leagueData);
        insights.push(...performanceInsights);
      }
      
      // Durchgangs-Analyse (übergreifend)
      const roundInsights = await this.generateRoundInsights(seasonId, leagueId);
      insights.push(...roundInsights);
      
    } catch (error) {
      logError('Fehler bei der Insight-Generierung:', error);
    }
    
    return insights;
  }
  
  private async getLeagueAnalysisData(seasonId: string, leagueId?: string): Promise<LeagueAnalysisData | null> {
    try {
      // Lade Teams und deren aktuelle Ergebnisse
      const teamsQuery = leagueId 
        ? query(collection(db, 'rwk_teams'), where('leagueId', '==', leagueId))
        : query(collection(db, 'rwk_teams'), where('seasonId', '==', seasonId), limit(20));
      
      const teamsSnapshot = await getDocs(teamsQuery);
      const teams: TeamPerformanceData[] = [];
      
      for (const teamDoc of teamsSnapshot.docs) {
        const teamData = teamDoc.data();
        
        // Lade Ergebnisse für dieses Team
        const scoresQuery = query(
          collection(db, 'rwk_scores'),
          where('teamId', '==', teamDoc.id),
          where('competitionYear', '==', new Date().getFullYear()),
          orderBy('durchgang', 'asc')
        );
        
        const scoresSnapshot = await getDocs(scoresQuery);
        const scores = scoresSnapshot.docs.map(doc => doc.data());
        
        // Berechne Team-Performance
        const roundTotals = new Map<number, number>();
        scores.forEach(score => {
          const round = score.durchgang;
          if (!roundTotals.has(round)) roundTotals.set(round, 0);
          roundTotals.set(round, roundTotals.get(round)! + score.totalRinge);
        });
        
        const roundAverages = Array.from(roundTotals.values());
        const currentPoints = roundAverages.reduce((sum, avg) => sum + avg, 0);
        const averagePerRound = roundAverages.length > 0 ? currentPoints / roundAverages.length : 0;
        
        // Trend berechnen (letzte 2 vs erste 2 Durchgänge)
        let trend: 'up' | 'down' | 'stable' = 'stable';
        if (roundAverages.length >= 3) {
          const early = roundAverages.slice(0, 2).reduce((sum, val) => sum + val, 0) / 2;
          const recent = roundAverages.slice(-2).reduce((sum, val) => sum + val, 0) / 2;
          const diff = recent - early;
          if (diff > 20) trend = 'up';
          else if (diff < -20) trend = 'down';
        }
        
        teams.push({
          teamId: teamDoc.id,
          teamName: teamData.name,
          currentPoints,
          averagePerRound,
          trend,
          roundsPlayed: roundAverages.length,
          position: 0, // Wird später gesetzt
          totalTeams: 0 // Wird später gesetzt
        });
      }
      
      // Sortiere Teams nach Punkten und setze Positionen
      teams.sort((a, b) => b.currentPoints - a.currentPoints);
      teams.forEach((team, index) => {
        team.position = index + 1;
        team.totalTeams = teams.length;
      });
      
      // Berechne Liga-Ausgeglichenheit
      const scores = teams.map(t => t.currentPoints).filter(s => s > 0);
      const avgScore = scores.reduce((sum, s) => sum + s, 0) / scores.length;
      const variance = scores.reduce((sum, s) => sum + Math.pow(s - avgScore, 2), 0) / scores.length;
      const competitiveness = Math.max(0, 1 - (Math.sqrt(variance) / avgScore));
      
      return {
        leagueId: leagueId || 'mixed',
        leagueName: 'Liga',
        teams,
        competitiveness,
        averageScore: avgScore,
        roundsCompleted: Math.max(...teams.map(t => t.roundsPlayed))
      };
      
    } catch (error) {
      logError('Fehler beim Laden der Liga-Daten:', error);
      return null;
    }
  }
  
  private generatePrognoseInsights(leagueData: LeagueAnalysisData): StatisticsInsight[] {
    const insights: StatisticsInsight[] = [];
    
    // Aufstiegs-/Abstiegsprognosen
    const topTeams = leagueData.teams.slice(0, 2);
    const bottomTeams = leagueData.teams.slice(-2);
    
    topTeams.forEach(team => {
      if (team.trend === 'up' && team.roundsPlayed >= 3) {
        insights.push({
          type: 'prognose',
          title: '📈 Aufstiegskandidat',
          message: `Basierend auf der aktuellen Form steigt ${team.teamName} wahrscheinlich auf. Starker Trend mit ${team.averagePerRound.toFixed(0)} Ringen pro Durchgang.`,
          confidence: 'high'
        });
      }
    });
    
    bottomTeams.forEach(team => {
      if (team.trend === 'down' && team.position > leagueData.teams.length * 0.8) {
        insights.push({
          type: 'prognose',
          title: '📉 Abstiegsgefahr',
          message: `${team.teamName} ist abstiegsgefährdet. Negativer Trend auf Platz ${team.position} von ${team.totalTeams}.`,
          confidence: 'medium'
        });
      }
    });
    
    return insights;
  }
  
  private generateTrendInsights(leagueData: LeagueAnalysisData): StatisticsInsight[] {
    const insights: StatisticsInsight[] = [];
    
    // Liga-Ausgeglichenheit
    if (leagueData.competitiveness > 0.8) {
      insights.push({
        type: 'trend',
        title: '⚖️ Ausgeglichene Liga',
        message: `${leagueData.leagueName} ist dieses Jahr besonders ausgeglichen. Nur ${Math.round((1 - leagueData.competitiveness) * 100)}% Leistungsunterschied zwischen den Teams.`,
        confidence: 'high'
      });
    } else if (leagueData.competitiveness < 0.4) {
      insights.push({
        type: 'trend',
        title: '📊 Dominante Teams',
        message: `Klare Hierarchie in ${leagueData.leagueName}. Große Leistungsunterschiede zwischen Spitze und Tabellenmitte.`,
        confidence: 'high'
      });
    }
    
    // Trend-Teams identifizieren
    const upwardTeams = leagueData.teams.filter(t => t.trend === 'up').length;
    const downwardTeams = leagueData.teams.filter(t => t.trend === 'down').length;
    
    if (upwardTeams > leagueData.teams.length * 0.6) {
      insights.push({
        type: 'trend',
        title: '🚀 Leistungssteigerung',
        message: `${upwardTeams} von ${leagueData.teams.length} Teams zeigen einen positiven Trend. Allgemeine Leistungssteigerung in der Liga.`,
        confidence: 'medium'
      });
    }
    
    return insights;
  }
  
  private generatePerformanceInsights(leagueData: LeagueAnalysisData): StatisticsInsight[] {
    const insights: StatisticsInsight[] = [];
    
    // Durchschnitts-Analyse
    const highPerformers = leagueData.teams.filter(t => t.averagePerRound > leagueData.averageScore * 1.1);
    const lowPerformers = leagueData.teams.filter(t => t.averagePerRound < leagueData.averageScore * 0.9);
    
    if (highPerformers.length > 0) {
      const bestTeam = highPerformers[0];
      insights.push({
        type: 'performance',
        title: '🏆 Spitzenleistung',
        message: `${bestTeam.teamName} dominiert mit ${bestTeam.averagePerRound.toFixed(0)} Ringen pro Durchgang (${((bestTeam.averagePerRound / leagueData.averageScore - 1) * 100).toFixed(1)}% über Ligaschnitt).`,
        confidence: 'high'
      });
    }
    
    return insights;
  }
  
  private async generateRoundInsights(seasonId: string, leagueId?: string): Promise<StatisticsInsight[]> {
    const insights: StatisticsInsight[] = [];
    
    try {
      // Lade alle Ergebnisse für Durchgangs-Analyse
      const scoresQuery = leagueId
        ? query(collection(db, 'rwk_scores'), where('leagueId', '==', leagueId), where('competitionYear', '==', new Date().getFullYear()))
        : query(collection(db, 'rwk_scores'), where('competitionYear', '==', new Date().getFullYear()), limit(1000));
      
      const scoresSnapshot = await getDocs(scoresQuery);
      const scores = scoresSnapshot.docs.map(doc => doc.data());
      
      // Gruppiere nach Durchgängen
      const roundAverages = new Map<number, number[]>();
      scores.forEach(score => {
        const round = score.durchgang;
        if (!roundAverages.has(round)) roundAverages.set(round, []);
        roundAverages.get(round)!.push(score.totalRinge);
      });
      
      // Berechne Durchschnitts-Performance pro Durchgang
      const roundStats = Array.from(roundAverages.entries()).map(([round, ringzahlen]) => ({
        round,
        average: ringzahlen.reduce((sum, r) => sum + r, 0) / ringzahlen.length,
        count: ringzahlen.length
      })).filter(stat => stat.count >= 10); // Mindestens 10 Ergebnisse
      
      if (roundStats.length >= 3) {
        // Finde schwächsten Durchgang
        const weakestRound = roundStats.reduce((min, current) => 
          current.average < min.average ? current : min
        );
        
        // Finde stärksten Durchgang
        const strongestRound = roundStats.reduce((max, current) => 
          current.average > max.average ? current : max
        );
        
        if (weakestRound.round !== strongestRound.round) {
          insights.push({
            type: 'performance',
            title: '🎯 Durchgangs-Analyse',
            message: `Durchgang ${weakestRound.round} ist traditionell der schwächste (${weakestRound.average.toFixed(1)} Ringe Ø), Durchgang ${strongestRound.round} der stärkste (${strongestRound.average.toFixed(1)} Ringe Ø).`,
            confidence: 'medium'
          });
        }
      }
      
    } catch (error) {
      logError('Fehler bei der Durchgangs-Analyse:', error);
    }
    
    return insights;
  }
}

export const intelligentStatisticsService = new IntelligentStatisticsService();
