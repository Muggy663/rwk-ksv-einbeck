"use client";
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { dataCache } from '@/lib/cache/dataCache';

/**
 * Erweiterte Statistik-Funktionen für saisonübergreifende Vergleiche und Trendanalysen
 */

/**
 * Holt die Leistungsdaten eines Schützen über mehrere Saisons hinweg
 * 
 * @param {string} shooterId - ID des Schützen
 * @param {number} numberOfSeasons - Anzahl der zu berücksichtigenden Saisons (Standard: 3)
 * @returns {Promise<Array>} - Array mit Leistungsdaten pro Saison
 */
export async function fetchShooterPerformanceHistory(shooterId, numberOfSeasons = 3) {
  const cacheKey = dataCache.generateKey('shooterHistory', { shooterId, numberOfSeasons });
  const cachedData = dataCache.get(cacheKey);
  
  if (cachedData) {
    return cachedData;
  }
  
  try {
    console.log(`Fetching performance history for shooter ${shooterId}`);
    
    // Hole alle Ergebnisse des Schützen
    const scoresQuery = query(
      collection(db, 'rwk_scores'),
      where('shooterId', '==', shooterId),
      orderBy('timestamp', 'desc')
    );
    
    const scoresSnapshot = await getDocs(scoresQuery);
    console.log(`Found ${scoresSnapshot.size} scores for shooter ${shooterId}`);
    
    // Gruppiere Ergebnisse nach Saison
    const scoresBySeason = {};
    const seasonIds = new Set();
    
    scoresSnapshot.forEach(doc => {
      const scoreData = doc.data();
      const seasonId = scoreData.seasonId;
      
      if (!seasonId) return;
      
      seasonIds.add(seasonId);
      
      if (!scoresBySeason[seasonId]) {
        scoresBySeason[seasonId] = {
          seasonId,
          seasonName: scoreData.seasonName || 'Unbekannte Saison',
          competitionYear: scoreData.competitionYear || 'Unbekanntes Jahr',
          shooterName: scoreData.shooterName || 'Unbekannter Schütze',
          scores: [],
          totalScore: 0,
          roundsShot: 0,
          averageScore: 0
        };
      }
      
      if (scoreData.totalRinge) {
        scoresBySeason[seasonId].scores.push({
          durchgang: scoreData.durchgang,
          totalRinge: scoreData.totalRinge,
          date: scoreData.timestamp ? new Date(scoreData.timestamp.seconds * 1000) : null
        });
        
        scoresBySeason[seasonId].totalScore += scoreData.totalRinge;
        scoresBySeason[seasonId].roundsShot += 1;
      }
    });
    
    // Berechne Durchschnitt für jede Saison
    Object.values(scoresBySeason).forEach(season => {
      season.averageScore = season.roundsShot > 0 ? season.totalScore / season.roundsShot : 0;
      
      // Sortiere Ergebnisse nach Durchgang
      season.scores.sort((a, b) => a.durchgang - b.durchgang);
    });
    
    // Sortiere Saisons nach Jahr (absteigend) und beschränke auf die angegebene Anzahl
    const result = Object.values(scoresBySeason)
      .sort((a, b) => b.competitionYear - a.competitionYear)
      .slice(0, numberOfSeasons);
    
    console.log(`Returning ${result.length} seasons of data for shooter ${shooterId}`);
    
    // Speichere im Cache
    dataCache.set(cacheKey, result, 10 * 60 * 1000); // 10 Minuten TTL
    
    return result;
  } catch (error) {
    console.error('Fehler beim Laden der Schützenhistorie:', error);
    return [];
  }
}

/**
 * Holt die Leistungsdaten einer Mannschaft über mehrere Saisons hinweg
 * 
 * @param {string} teamId - ID der Mannschaft oder Name der Mannschaft
 * @param {string} clubId - ID des Vereins (optional, wenn teamId ein Name ist)
 * @param {number} numberOfSeasons - Anzahl der zu berücksichtigenden Saisons (Standard: 3)
 * @returns {Promise<Array>} - Array mit Leistungsdaten pro Saison
 */
export async function fetchTeamPerformanceHistory(teamId, clubId, numberOfSeasons = 3) {
  const cacheKey = dataCache.generateKey('teamHistory', { teamId, clubId, numberOfSeasons });
  const cachedData = dataCache.get(cacheKey);
  
  if (cachedData) {
    return cachedData;
  }
  
  try {
    // Wenn teamId ein Name ist und clubId vorhanden ist, suche zuerst die Team-ID
    let actualTeamId = teamId;
    let teamName = '';
    
    if (typeof teamId === 'string' && teamId.length > 30 && clubId) {
      const teamsQuery = query(
        collection(db, 'rwk_teams'),
        where('name', '==', teamId),
        where('clubId', '==', clubId)
      );
      
      const teamsSnapshot = await getDocs(teamsQuery);
      
      if (!teamsSnapshot.empty) {
        actualTeamId = teamsSnapshot.docs[0].id;
        teamName = teamsSnapshot.docs[0].data().name || 'Unbekannte Mannschaft';
      }
    }
    
    // Hole alle Ergebnisse der Mannschaft
    const scoresQuery = query(
      collection(db, 'rwk_scores'),
      where('teamId', '==', actualTeamId),
      orderBy('timestamp', 'desc')
    );
    
    const scoresSnapshot = await getDocs(scoresQuery);
    
    // Gruppiere Ergebnisse nach Saison
    const scoresBySeason = {};
    const seasonIds = new Set();
    
    scoresSnapshot.forEach(doc => {
      const scoreData = doc.data();
      const seasonId = scoreData.seasonId;
      
      if (!seasonId) return;
      
      seasonIds.add(seasonId);
      
      if (!scoresBySeason[seasonId]) {
        scoresBySeason[seasonId] = {
          seasonId,
          seasonName: scoreData.seasonName || 'Unbekannte Saison',
          competitionYear: scoreData.competitionYear || 'Unbekanntes Jahr',
          teamName: scoreData.teamName || teamName || 'Unbekannte Mannschaft',
          scores: [],
          totalScore: 0,
          roundsShot: 0,
          averageScore: 0
        };
      }
      
      if (scoreData.totalRinge) {
        scoresBySeason[seasonId].scores.push({
          durchgang: scoreData.durchgang,
          totalRinge: scoreData.totalRinge,
          date: scoreData.timestamp ? new Date(scoreData.timestamp.seconds * 1000) : null
        });
        
        scoresBySeason[seasonId].totalScore += scoreData.totalRinge;
        scoresBySeason[seasonId].roundsShot += 1;
      }
    });
    
    // Berechne Durchschnitt für jede Saison
    Object.values(scoresBySeason).forEach(season => {
      season.averageScore = season.roundsShot > 0 ? season.totalScore / season.roundsShot : 0;
      
      // Sortiere Ergebnisse nach Durchgang
      season.scores.sort((a, b) => a.durchgang - b.durchgang);
    });
    
    // Sortiere Saisons nach Jahr (absteigend) und beschränke auf die angegebene Anzahl
    const result = Object.values(scoresBySeason)
      .sort((a, b) => b.competitionYear - a.competitionYear)
      .slice(0, numberOfSeasons);
    
    // Speichere im Cache
    dataCache.set(cacheKey, result, 10 * 60 * 1000); // 10 Minuten TTL
    
    return result;
  } catch (error) {
    console.error('Fehler beim Laden der Mannschaftshistorie:', error);
    return [];
  }
}

/**
 * Holt die Top-Schützen einer Liga oder eines Vereins mit Trendanalyse
 * 
 * @param {string} seasonId - ID der Saison
 * @param {string} leagueId - ID der Liga (optional)
 * @param {string} clubId - ID des Vereins (optional)
 * @param {number} limit - Maximale Anzahl der zurückgegebenen Schützen (Standard: 10)
 * @returns {Promise<Array>} - Array mit Schützendaten und Trendanalyse
 */
export async function fetchTopShootersWithTrend(seasonId, leagueId, clubId, maxResults = 10) {
  const cacheKey = dataCache.generateKey('topShootersWithTrend', { seasonId, leagueId, clubId, maxResults });
  const cachedData = dataCache.get(cacheKey);
  
  if (cachedData) {
    return cachedData;
  }
  
  try {
    // Baue die Query basierend auf den Parametern
    let scoresQuery;
    
    if (leagueId && clubId) {
      scoresQuery = query(
        collection(db, 'rwk_scores'),
        where('seasonId', '==', seasonId),
        where('leagueId', '==', leagueId),
        where('clubId', '==', clubId)
      );
    } else if (leagueId) {
      scoresQuery = query(
        collection(db, 'rwk_scores'),
        where('seasonId', '==', seasonId),
        where('leagueId', '==', leagueId)
      );
    } else if (clubId) {
      scoresQuery = query(
        collection(db, 'rwk_scores'),
        where('seasonId', '==', seasonId),
        where('clubId', '==', clubId)
      );
    } else {
      scoresQuery = query(
        collection(db, 'rwk_scores'),
        where('seasonId', '==', seasonId)
      );
    }
    
    const scoresSnapshot = await getDocs(scoresQuery);
    
    // Gruppiere Ergebnisse nach Schützen
    const shootersMap = new Map();
    
    scoresSnapshot.forEach(doc => {
      const scoreData = doc.data();
      const shooterId = scoreData.shooterId;
      
      if (!shooterId || !scoreData.totalRinge || !scoreData.durchgang) return;
      
      if (!shootersMap.has(shooterId)) {
        shootersMap.set(shooterId, {
          shooterId,
          shooterName: scoreData.shooterName || 'Unbekannter Schütze',
          teamName: scoreData.teamName || 'Unbekanntes Team',
          clubName: scoreData.clubName || 'Unbekannter Verein',
          gender: scoreData.shooterGender || 'male',
          scores: [],
          totalScore: 0,
          roundsShot: 0,
          averageScore: 0,
          trend: 'stable' // 'improving', 'declining', 'stable'
        });
      }
      
      const shooter = shootersMap.get(shooterId);
      
      shooter.scores.push({
        durchgang: scoreData.durchgang,
        totalRinge: scoreData.totalRinge,
        date: scoreData.timestamp ? new Date(scoreData.timestamp.seconds * 1000) : null
      });
      
      shooter.totalScore += scoreData.totalRinge;
      shooter.roundsShot += 1;
    });
    
    // Berechne Durchschnitt und Trend für jeden Schützen
    shootersMap.forEach(shooter => {
      shooter.averageScore = shooter.roundsShot > 0 ? shooter.totalScore / shooter.roundsShot : 0;
      
      // Sortiere Ergebnisse nach Durchgang
      shooter.scores.sort((a, b) => a.durchgang - b.durchgang);
      
      // Berechne Trend (wenn mindestens 3 Ergebnisse vorhanden sind)
      if (shooter.scores.length >= 3) {
        const firstHalf = shooter.scores.slice(0, Math.floor(shooter.scores.length / 2));
        const secondHalf = shooter.scores.slice(Math.floor(shooter.scores.length / 2));
        
        const firstHalfAvg = firstHalf.reduce((sum, score) => sum + score.totalRinge, 0) / firstHalf.length;
        const secondHalfAvg = secondHalf.reduce((sum, score) => sum + score.totalRinge, 0) / secondHalf.length;
        
        const difference = secondHalfAvg - firstHalfAvg;
        
        if (difference > 2) {
          shooter.trend = 'improving';
        } else if (difference < -2) {
          shooter.trend = 'declining';
        } else {
          shooter.trend = 'stable';
        }
      }
    });
    
    // Sortiere Schützen nach Durchschnitt (absteigend) und beschränke auf die angegebene Anzahl
    const result = Array.from(shootersMap.values())
      .sort((a, b) => b.averageScore - a.averageScore)
      .slice(0, maxResults);
    
    // Speichere im Cache
    dataCache.set(cacheKey, result, 5 * 60 * 1000); // 5 Minuten TTL
    
    return result;
  } catch (error) {
    console.error('Fehler beim Laden der Top-Schützen mit Trend:', error);
    return [];
  }
}

/**
 * Holt die Leistungsdaten für einen saisonübergreifenden Vergleich von Schützen
 * 
 * @param {Array<string>} shooterIds - Array mit Schützen-IDs
 * @param {number} numberOfSeasons - Anzahl der zu berücksichtigenden Saisons (Standard: 3)
 * @returns {Promise<Object>} - Objekt mit Leistungsdaten pro Schütze und Saison
 */
export async function fetchCrossSeasonComparison(shooterIds, numberOfSeasons = 3) {
  const cacheKey = dataCache.generateKey('crossSeasonComparison', { shooterIds: shooterIds.join(','), numberOfSeasons });
  const cachedData = dataCache.get(cacheKey);
  
  if (cachedData) {
    console.log("Returning cached cross-season comparison data");
    return cachedData;
  }
  
  try {
    console.log(`Fetching cross-season comparison for shooters: ${shooterIds.join(', ')}`);
    
    // Hole alle Saisons, sortiert nach Jahr (absteigend)
    const seasonsQuery = query(
      collection(db, 'seasons'),
      orderBy('competitionYear', 'desc'),
      limit(numberOfSeasons)
    );
    
    const seasonsSnapshot = await getDocs(seasonsQuery);
    const seasons = seasonsSnapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name,
      year: doc.data().competitionYear
    }));
    
    console.log(`Found ${seasons.length} seasons`);
    
    // Hole Ergebnisse für jeden Schützen in jeder Saison
    const result = {
      seasons,
      shooters: {},
      comparisonData: []
    };
    
    for (const shooterId of shooterIds) {
      console.log(`Fetching history for shooter ${shooterId}`);
      const shooterHistory = await fetchShooterPerformanceHistory(shooterId, numberOfSeasons);
      
      if (shooterHistory.length > 0) {
        result.shooters[shooterId] = {
          name: shooterHistory[0].shooterName || 'Unbekannter Schütze',
          seasons: {}
        };
        
        shooterHistory.forEach(season => {
          result.shooters[shooterId].seasons[season.seasonId] = {
            averageScore: season.averageScore,
            totalScore: season.totalScore,
            roundsShot: season.roundsShot,
            scores: season.scores
          };
        });
      }
    }
    
    // Erstelle Vergleichsdaten für das Diagramm
    seasons.forEach(season => {
      const dataPoint = {
        name: season.name,
        year: season.year
      };
      
      shooterIds.forEach(shooterId => {
        if (result.shooters[shooterId] && 
            result.shooters[shooterId].seasons[season.id]) {
          dataPoint[shooterId] = result.shooters[shooterId].seasons[season.id].averageScore;
        } else {
          dataPoint[shooterId] = null;
        }
      });
      
      result.comparisonData.push(dataPoint);
    });
    
    console.log(`Comparison data created with ${result.comparisonData.length} data points`);
    
    // Speichere im Cache
    dataCache.set(cacheKey, result, 10 * 60 * 1000); // 10 Minuten TTL
    
    return result;
  } catch (error) {
    console.error('Fehler beim Laden des saisonübergreifenden Vergleichs:', error);
    throw error; // Fehler weitergeben für bessere Diagnose
  }
}