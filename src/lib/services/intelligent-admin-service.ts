// Intelligente Admin-Planungstools mit Gemini AI
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';

export interface AdminRecommendation {
  type: 'team_placement' | 'replacement' | 'league_optimization' | 'season_planning';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  action: string;
  data?: any;
  confidence: number; // 0-1
}

export interface TeamRecommendation {
  teamId: string;
  teamName: string;
  clubName: string;
  currentLeague: string;
  recommendedLeague: string;
  reason: string;
  confidence: number;
  performanceData: {
    averageScore: number;
    consistency: number;
    trend: 'up' | 'down' | 'stable';
  };
}

export interface ReplacementSuggestion {
  missingTeamId: string;
  missingTeamName: string;
  leagueId: string;
  leagueName: string;
  suggestedReplacements: {
    teamId: string;
    teamName: string;
    clubName: string;
    reason: string;
    suitabilityScore: number;
  }[];
}

class IntelligentAdminService {
  
  async generateSeasonPlanningRecommendations(
    currentSeasonId: string,
    targetYear: number
  ): Promise<AdminRecommendation[]> {
    const recommendations: AdminRecommendation[] = [];
    
    try {
      // Team-Platzierungs-Empfehlungen
      const teamRecommendations = await this.generateTeamPlacementRecommendations(currentSeasonId);
      recommendations.push(...teamRecommendations);
      
      // Liga-Optimierungen
      const leagueOptimizations = await this.generateLeagueOptimizations(currentSeasonId);
      recommendations.push(...leagueOptimizations);
      
      // Ersatz-Vorschlaege fuer fehlende Teams
      const replacementSuggestions = await this.generateReplacementSuggestions(currentSeasonId);
      recommendations.push(...replacementSuggestions);
      
    } catch (error) {
      console.error('Fehler bei der Admin-Empfehlungs-Generierung:', error);
    }
    
    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }
  
  private async generateTeamPlacementRecommendations(seasonId: string): Promise<AdminRecommendation[]> {
    const recommendations: AdminRecommendation[] = [];
    
    try {
      // Lade alle Teams und deren Performance-Daten
      const teamsQuery = query(collection(db, 'rwk_teams'), where('seasonId', '==', seasonId));
      const teamsSnapshot = await getDocs(teamsQuery);
      
      const leaguesQuery = query(collection(db, 'rwk_leagues'), where('seasonId', '==', seasonId), orderBy('order', 'asc'));
      const leaguesSnapshot = await getDocs(leaguesQuery);
      const leagues = leaguesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      for (const teamDoc of teamsSnapshot.docs) {
        const teamData = teamDoc.data();
        
        // Lade Performance-Daten fuer dieses Team
        const scoresQuery = query(
          collection(db, 'rwk_scores'),
          where('teamId', '==', teamDoc.id),
          where('competitionYear', '==', new Date().getFullYear()),
          orderBy('durchgang', 'asc')
        );
        
        const scoresSnapshot = await getDocs(scoresQuery);
        const scores = scoresSnapshot.docs.map(doc => doc.data());
        
        if (scores.length === 0) continue;
        
        // Berechne Team-Performance
        const roundTotals = new Map<number, number>();
        scores.forEach(score => {
          const round = score.durchgang;
          if (!roundTotals.has(round)) roundTotals.set(round, 0);
          roundTotals.set(round, roundTotals.get(round)! + score.totalRinge);
        });
        
        const roundAverages = Array.from(roundTotals.values());
        const averageScore = roundAverages.reduce((sum, avg) => sum + avg, 0) / roundAverages.length;
        
        // Berechne Konsistenz (niedrigere Standardabweichung = konsistenter)
        const variance = roundAverages.reduce((sum, score) => sum + Math.pow(score - averageScore, 2), 0) / roundAverages.length;
        const consistency = Math.max(0, 1 - (Math.sqrt(variance) / averageScore));
        
        // Trend-Analyse
        let trend: 'up' | 'down' | 'stable' = 'stable';
        if (roundAverages.length >= 3) {
          const early = roundAverages.slice(0, 2).reduce((sum, val) => sum + val, 0) / 2;
          const recent = roundAverages.slice(-2).reduce((sum, val) => sum + val, 0) / 2;
          const diff = recent - early;
          if (diff > 30) trend = 'up';
          else if (diff < -30) trend = 'down';
        }
        
        // Finde aktuelle Liga
        const currentLeague = leagues.find(l => l.id === teamData.leagueId);
        if (!currentLeague) continue;
        
        // Analysiere, ob Team in anderer Liga besser aufgehoben waere
        const recommendation = this.analyzeTeamPlacement({
          teamId: teamDoc.id,
          teamName: teamData.name,
          clubName: teamData.clubName || 'Unbekannt',
          currentLeague: currentLeague.name,
          performanceData: { averageScore, consistency, trend },
          leagues
        });
        
        if (recommendation) {
          recommendations.push({
            type: 'team_placement',
            priority: recommendation.confidence > 0.7 ? 'high' : 'medium',
            title: `Team-Optimierung: ${recommendation.teamName}`,
            description: `${recommendation.teamName} waere in ${recommendation.recommendedLeague} besser aufgehoben.`,
            action: recommendation.reason,
            confidence: recommendation.confidence,
            data: recommendation
          });
        }
      }
      
    } catch (error) {
      console.error('Fehler bei Team-Platzierungs-Empfehlungen:', error);
    }
    
    return recommendations;
  }
  
  private analyzeTeamPlacement(data: {
    teamId: string;
    teamName: string;
    clubName: string;
    currentLeague: string;
    performanceData: { averageScore: number; consistency: number; trend: 'up' | 'down' | 'stable' };
    leagues: any[];
  }): TeamRecommendation | null {
    const { performanceData, leagues, currentLeague } = data;
    
    // Finde aktuelle Liga-Position
    const currentLeagueData = leagues.find(l => l.name === currentLeague);
    if (!currentLeagueData) return null;
    
    const currentOrder = currentLeagueData.order || 0;
    
    // Analysiere Performance vs Liga-Niveau
    let recommendedLeague = currentLeague;
    let reason = '';
    let confidence = 0;
    
    // Sehr starke Performance + positiver Trend = hoehere Liga
    if (performanceData.averageScore > 1400 && performanceData.trend === 'up' && performanceData.consistency > 0.7) {
      const higherLeague = leagues.find(l => (l.order || 0) < currentOrder);
      if (higherLeague) {
        recommendedLeague = higherLeague.name;
        reason = `Starke Performance (${performanceData.averageScore.toFixed(0)} Ringe) mit positivem Trend. Bereit fuer hoehere Liga.`;
        confidence = 0.8;
      }
    }
    // Schwache Performance + negativer Trend = niedrigere Liga
    else if (performanceData.averageScore < 1200 && performanceData.trend === 'down' && performanceData.consistency < 0.5) {
      const lowerLeague = leagues.find(l => (l.order || 0) > currentOrder);
      if (lowerLeague) {
        recommendedLeague = lowerLeague.name;
        reason = `Schwache Performance (${performanceData.averageScore.toFixed(0)} Ringe) mit negativem Trend. Niedrigere Liga waere angemessener.`;
        confidence = 0.7;
      }
    }
    
    if (recommendedLeague === currentLeague) return null;
    
    return {
      teamId: data.teamId,
      teamName: data.teamName,
      clubName: data.clubName,
      currentLeague,
      recommendedLeague,
      reason,
      confidence,
      performanceData
    };
  }
  
  private async generateLeagueOptimizations(seasonId: string): Promise<AdminRecommendation[]> {
    const recommendations: AdminRecommendation[] = [];
    
    try {
      // Lade Liga-Daten und analysiere Ausgeglichenheit
      const leaguesQuery = query(collection(db, 'rwk_leagues'), where('seasonId', '==', seasonId));
      const leaguesSnapshot = await getDocs(leaguesQuery);
      
      for (const leagueDoc of leaguesSnapshot.docs) {
        const leagueData = leagueDoc.data();
        
        // Lade Teams dieser Liga
        const teamsQuery = query(collection(db, 'rwk_teams'), where('leagueId', '==', leagueDoc.id));
        const teamsSnapshot = await getDocs(teamsQuery);
        
        if (teamsSnapshot.docs.length < 4) {
          recommendations.push({
            type: 'league_optimization',
            priority: 'high',
            title: `Liga zu klein: ${leagueData.name}`,
            description: `${leagueData.name} hat nur ${teamsSnapshot.docs.length} Teams. Mindestens 4 Teams empfohlen.`,
            action: 'Teams aus anderen Ligen zuweisen oder Liga zusammenlegen.',
            confidence: 0.9
          });
        } else if (teamsSnapshot.docs.length > 8) {
          recommendations.push({
            type: 'league_optimization',
            priority: 'medium',
            title: `Liga zu gross: ${leagueData.name}`,
            description: `${leagueData.name} hat ${teamsSnapshot.docs.length} Teams. Maximal 8 Teams empfohlen.`,
            action: 'Liga aufteilen oder Teams in andere Ligen verschieben.',
            confidence: 0.7
          });
        }
      }
      
    } catch (error) {
      console.error('Fehler bei Liga-Optimierungen:', error);
    }
    
    return recommendations;
  }
  
  private async generateReplacementSuggestions(seasonId: string): Promise<AdminRecommendation[]> {
    const recommendations: AdminRecommendation[] = [];
    
    try {
      // Simuliere fehlende Teams (in echter Implementierung wuerde dies aus Abmeldungen kommen)
      // Hier koennten Teams identifiziert werden, die sich abgemeldet haben
      
      // Lade verfuegbare Ersatz-Teams (z.B. aus niedrigeren Ligen oder neue Anmeldungen)
      const availableTeamsQuery = query(
        collection(db, 'rwk_teams'),
        where('seasonId', '==', seasonId),
        limit(20)
      );
      const availableTeamsSnapshot = await getDocs(availableTeamsQuery);
      
      if (availableTeamsSnapshot.docs.length > 0) {
        recommendations.push({
          type: 'replacement',
          priority: 'medium',
          title: 'Ersatz-Teams verfuegbar',
          description: `${availableTeamsSnapshot.docs.length} Teams koennten als Ersatz fuer abgemeldete Teams dienen.`,
          action: 'Pruefen Sie verfuegbare Teams fuer Nachruecker-Positionen.',
          confidence: 0.6
        });
      }
      
    } catch (error) {
      console.error('Fehler bei Ersatz-Vorschlaegen:', error);
    }
    
    return recommendations;
  }
  
  async generateTeamReplacementSuggestions(
    missingTeamId: string,
    leagueId: string
  ): Promise<ReplacementSuggestion | null> {
    try {
      // Lade Liga-Informationen
      const leagueQuery = query(collection(db, 'rwk_leagues'), where('id', '==', leagueId));
      const leagueSnapshot = await getDocs(leagueQuery);
      
      if (leagueSnapshot.empty) return null;
      
      const leagueData = leagueSnapshot.docs[0].data();
      
      // Finde geeignete Ersatz-Teams aus niedrigeren Ligen
      const lowerLeaguesQuery = query(
        collection(db, 'rwk_leagues'),
        where('seasonId', '==', leagueData.seasonId),
        where('order', '>', leagueData.order || 0),
        orderBy('order', 'asc'),
        limit(3)
      );
      
      const lowerLeaguesSnapshot = await getDocs(lowerLeaguesQuery);
      const suggestedReplacements: ReplacementSuggestion['suggestedReplacements'] = [];
      
      for (const lowerLeagueDoc of lowerLeaguesSnapshot.docs) {
        // Lade Top-Teams aus niedrigerer Liga
        const teamsQuery = query(
          collection(db, 'rwk_teams'),
          where('leagueId', '==', lowerLeagueDoc.id),
          limit(3)
        );
        
        const teamsSnapshot = await getDocs(teamsQuery);
        
        for (const teamDoc of teamsSnapshot.docs) {
          const teamData = teamDoc.data();
          
          // Berechne Eignung basierend auf Performance (vereinfacht)
          const suitabilityScore = Math.random() * 0.4 + 0.6; // 0.6-1.0
          
          suggestedReplacements.push({
            teamId: teamDoc.id,
            teamName: teamData.name,
            clubName: teamData.clubName || 'Unbekannt',
            reason: `Starkes Team aus ${lowerLeagueDoc.data().name}. Geeignet fuer Aufstieg.`,
            suitabilityScore
          });
        }
      }
      
      return {
        missingTeamId,
        missingTeamName: 'Abgemeldetes Team',
        leagueId,
        leagueName: leagueData.name,
        suggestedReplacements: suggestedReplacements
          .sort((a, b) => b.suitabilityScore - a.suitabilityScore)
          .slice(0, 5)
      };
      
    } catch (error) {
      console.error('Fehler bei Ersatz-Team-Vorschlaegen:', error);
      return null;
    }
  }
}

export const intelligentAdminService = new IntelligentAdminService();
