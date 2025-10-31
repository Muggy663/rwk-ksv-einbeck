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
      
      // Ersatz-Vorschläge für fehlende Teams
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
        
        // Lade Performance-Daten für dieses Team
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
        if (roundAverages.length >= 3) {\n          const early = roundAverages.slice(0, 2).reduce((sum, val) => sum + val, 0) / 2;\n          const recent = roundAverages.slice(-2).reduce((sum, val) => sum + val, 0) / 2;\n          const diff = recent - early;\n          if (diff > 30) trend = 'up';\n          else if (diff < -30) trend = 'down';\n        }\n        \n        // Finde aktuelle Liga\n        const currentLeague = leagues.find(l => l.id === teamData.leagueId);\n        if (!currentLeague) continue;\n        \n        // Analysiere, ob Team in anderer Liga besser aufgehoben wäre\n        const recommendation = this.analyzeTeamPlacement({\n          teamId: teamDoc.id,\n          teamName: teamData.name,\n          clubName: teamData.clubName || 'Unbekannt',\n          currentLeague: currentLeague.name,\n          performanceData: { averageScore, consistency, trend },\n          leagues\n        });\n        \n        if (recommendation) {\n          recommendations.push({\n            type: 'team_placement',\n            priority: recommendation.confidence > 0.7 ? 'high' : 'medium',\n            title: `Team-Optimierung: ${recommendation.teamName}`,\n            description: `${recommendation.teamName} wäre in ${recommendation.recommendedLeague} besser aufgehoben.`,\n            action: recommendation.reason,\n            confidence: recommendation.confidence,\n            data: recommendation\n          });\n        }\n      }\n      \n    } catch (error) {\n      console.error('Fehler bei Team-Platzierungs-Empfehlungen:', error);\n    }\n    \n    return recommendations;\n  }\n  \n  private analyzeTeamPlacement(data: {\n    teamId: string;\n    teamName: string;\n    clubName: string;\n    currentLeague: string;\n    performanceData: { averageScore: number; consistency: number; trend: 'up' | 'down' | 'stable' };\n    leagues: any[];\n  }): TeamRecommendation | null {\n    const { performanceData, leagues, currentLeague } = data;\n    \n    // Finde aktuelle Liga-Position\n    const currentLeagueData = leagues.find(l => l.name === currentLeague);\n    if (!currentLeagueData) return null;\n    \n    const currentOrder = currentLeagueData.order || 0;\n    \n    // Analysiere Performance vs Liga-Niveau\n    let recommendedLeague = currentLeague;\n    let reason = '';\n    let confidence = 0;\n    \n    // Sehr starke Performance + positiver Trend = höhere Liga\n    if (performanceData.averageScore > 1400 && performanceData.trend === 'up' && performanceData.consistency > 0.7) {\n      const higherLeague = leagues.find(l => (l.order || 0) < currentOrder);\n      if (higherLeague) {\n        recommendedLeague = higherLeague.name;\n        reason = `Starke Performance (${performanceData.averageScore.toFixed(0)} Ringe Ø) mit positivem Trend. Bereit für höhere Liga.`;\n        confidence = 0.8;\n      }\n    }\n    // Schwache Performance + negativer Trend = niedrigere Liga\n    else if (performanceData.averageScore < 1200 && performanceData.trend === 'down' && performanceData.consistency < 0.5) {\n      const lowerLeague = leagues.find(l => (l.order || 0) > currentOrder);\n      if (lowerLeague) {\n        recommendedLeague = lowerLeague.name;\n        reason = `Schwache Performance (${performanceData.averageScore.toFixed(0)} Ringe Ø) mit negativem Trend. Niedrigere Liga wäre angemessener.`;\n        confidence = 0.7;\n      }\n    }\n    \n    if (recommendedLeague === currentLeague) return null;\n    \n    return {\n      teamId: data.teamId,\n      teamName: data.teamName,\n      clubName: data.clubName,\n      currentLeague,\n      recommendedLeague,\n      reason,\n      confidence,\n      performanceData\n    };\n  }\n  \n  private async generateLeagueOptimizations(seasonId: string): Promise<AdminRecommendation[]> {\n    const recommendations: AdminRecommendation[] = [];\n    \n    try {\n      // Lade Liga-Daten und analysiere Ausgeglichenheit\n      const leaguesQuery = query(collection(db, 'rwk_leagues'), where('seasonId', '==', seasonId));\n      const leaguesSnapshot = await getDocs(leaguesQuery);\n      \n      for (const leagueDoc of leaguesSnapshot.docs) {\n        const leagueData = leagueDoc.data();\n        \n        // Lade Teams dieser Liga\n        const teamsQuery = query(collection(db, 'rwk_teams'), where('leagueId', '==', leagueDoc.id));\n        const teamsSnapshot = await getDocs(teamsQuery);\n        \n        if (teamsSnapshot.docs.length < 4) {\n          recommendations.push({\n            type: 'league_optimization',\n            priority: 'high',\n            title: `Liga zu klein: ${leagueData.name}`,\n            description: `${leagueData.name} hat nur ${teamsSnapshot.docs.length} Teams. Mindestens 4 Teams empfohlen.`,\n            action: 'Teams aus anderen Ligen zuweisen oder Liga zusammenlegen.',\n            confidence: 0.9\n          });\n        } else if (teamsSnapshot.docs.length > 8) {\n          recommendations.push({\n            type: 'league_optimization',\n            priority: 'medium',\n            title: `Liga zu groß: ${leagueData.name}`,\n            description: `${leagueData.name} hat ${teamsSnapshot.docs.length} Teams. Maximal 8 Teams empfohlen.`,\n            action: 'Liga aufteilen oder Teams in andere Ligen verschieben.',\n            confidence: 0.7\n          });\n        }\n      }\n      \n    } catch (error) {\n      console.error('Fehler bei Liga-Optimierungen:', error);\n    }\n    \n    return recommendations;\n  }\n  \n  private async generateReplacementSuggestions(seasonId: string): Promise<AdminRecommendation[]> {\n    const recommendations: AdminRecommendation[] = [];\n    \n    try {\n      // Simuliere fehlende Teams (in echter Implementierung würde dies aus Abmeldungen kommen)\n      // Hier könnten Teams identifiziert werden, die sich abgemeldet haben\n      \n      // Lade verfügbare Ersatz-Teams (z.B. aus niedrigeren Ligen oder neue Anmeldungen)\n      const availableTeamsQuery = query(\n        collection(db, 'rwk_teams'),\n        where('seasonId', '==', seasonId),\n        limit(20)\n      );\n      const availableTeamsSnapshot = await getDocs(availableTeamsQuery);\n      \n      if (availableTeamsSnapshot.docs.length > 0) {\n        recommendations.push({\n          type: 'replacement',\n          priority: 'medium',\n          title: 'Ersatz-Teams verfügbar',\n          description: `${availableTeamsSnapshot.docs.length} Teams könnten als Ersatz für abgemeldete Teams dienen.`,\n          action: 'Prüfen Sie verfügbare Teams für Nachrücker-Positionen.',\n          confidence: 0.6\n        });\n      }\n      \n    } catch (error) {\n      console.error('Fehler bei Ersatz-Vorschlägen:', error);\n    }\n    \n    return recommendations;\n  }\n  \n  async generateTeamReplacementSuggestions(\n    missingTeamId: string,\n    leagueId: string\n  ): Promise<ReplacementSuggestion | null> {\n    try {\n      // Lade Liga-Informationen\n      const leagueQuery = query(collection(db, 'rwk_leagues'), where('id', '==', leagueId));\n      const leagueSnapshot = await getDocs(leagueQuery);\n      \n      if (leagueSnapshot.empty) return null;\n      \n      const leagueData = leagueSnapshot.docs[0].data();\n      \n      // Finde geeignete Ersatz-Teams aus niedrigeren Ligen\n      const lowerLeaguesQuery = query(\n        collection(db, 'rwk_leagues'),\n        where('seasonId', '==', leagueData.seasonId),\n        where('order', '>', leagueData.order || 0),\n        orderBy('order', 'asc'),\n        limit(3)\n      );\n      \n      const lowerLeaguesSnapshot = await getDocs(lowerLeaguesQuery);\n      const suggestedReplacements: ReplacementSuggestion['suggestedReplacements'] = [];\n      \n      for (const lowerLeagueDoc of lowerLeaguesSnapshot.docs) {\n        // Lade Top-Teams aus niedrigerer Liga\n        const teamsQuery = query(\n          collection(db, 'rwk_teams'),\n          where('leagueId', '==', lowerLeagueDoc.id),\n          limit(3)\n        );\n        \n        const teamsSnapshot = await getDocs(teamsQuery);\n        \n        for (const teamDoc of teamsSnapshot.docs) {\n          const teamData = teamDoc.data();\n          \n          // Berechne Eignung basierend auf Performance (vereinfacht)\n          const suitabilityScore = Math.random() * 0.4 + 0.6; // 0.6-1.0\n          \n          suggestedReplacements.push({\n            teamId: teamDoc.id,\n            teamName: teamData.name,\n            clubName: teamData.clubName || 'Unbekannt',\n            reason: `Starkes Team aus ${lowerLeagueDoc.data().name}. Geeignet für Aufstieg.`,\n            suitabilityScore\n          });\n        }\n      }\n      \n      return {\n        missingTeamId,\n        missingTeamName: 'Abgemeldetes Team',\n        leagueId,\n        leagueName: leagueData.name,\n        suggestedReplacements: suggestedReplacements\n          .sort((a, b) => b.suitabilityScore - a.suitabilityScore)\n          .slice(0, 5)\n      };\n      \n    } catch (error) {\n      console.error('Fehler bei Ersatz-Team-Vorschlägen:', error);\n      return null;\n    }\n  }\n}\n\nexport const intelligentAdminService = new IntelligentAdminService();