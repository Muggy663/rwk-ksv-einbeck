// src/lib/services/season-transition-service.ts
import { db } from '@/lib/firebase/config';
import { logError, logWarn, logDebug } from '@/lib/utils/secure-logger';
import { collection, getDocs, query, where, doc, writeBatch } from 'firebase/firestore';
import { SubstitutionService } from './substitution-service';
import { TeamCalculationService } from './team-calculation-service';
import { getDisciplineCategory } from '@/types/rwk';

export interface TeamStanding {
  teamId: string;
  teamName: string;
  clubId: string;
  clubName: string;
  leagueId: string;
  leagueName: string;
  position: number;
  totalScore: number;
  averageScore: number;
  roundsPlayed: number;
}

export interface PromotionRelegationRule {
  teamId: string;
  teamName: string;
  clubName: string;
  currentLeague: string;
  currentPosition: number;
  action: 'promote' | 'relegate' | 'stay' | 'compare';
  targetLeague?: string;
  reason: string;
  confirmed: boolean;
  compareWith?: {
    teamId: string;
    teamName: string;
    league: string;
    position: number;
    score: number;
  };
}

/**
 * Berechnet die aktuellen Tabellenstände für eine Liga
 */
export async function calculateLeagueStandings(leagueId: string, competitionYear: number): Promise<TeamStanding[]> {
  try {
    // Teams der Liga laden (nur Mannschaften, keine Einzelschützen)
    const teamsQuery = query(
      collection(db, 'rwk_teams'),
      where('leagueId', '==', leagueId),
      where('competitionYear', '==', competitionYear)
    );
    const teamsSnapshot = await getDocs(teamsQuery);
    
    // Filtere Einzelschützen aus (Teams ohne shooterIds oder mit weniger als 3 Schützen)
    const mannschaftsTeams = teamsSnapshot.docs.filter(doc => {
      const team = doc.data();
      const shooterCount = team.shooterIds?.length || 0;
      return shooterCount >= 3; // Nur echte Mannschaften (mind. 3 Schützen)
    });
    
    // Clubs für Namen laden
    const clubsQuery = query(collection(db, 'clubs'));
    const clubsSnapshot = await getDocs(clubsQuery);
    const clubsMap = new Map();
    clubsSnapshot.docs.forEach(doc => {
      clubsMap.set(doc.id, doc.data().name);
    });

    // Liga-Info laden
    const leagueDoc = await getDocs(query(collection(db, 'rwk_leagues'), where('__name__', '==', leagueId)));
    const leagueData = leagueDoc.docs[0]?.data();
    const leagueName = leagueData?.name || 'Unbekannte Liga';

    const standings: TeamStanding[] = [];

    for (const teamDoc of mannschaftsTeams) {
      const team = teamDoc.data();
      
      // Verwende leagueType vom Team, nicht seasonType!
      const teamLeagueType = team.leagueType || leagueData?.type || 'KKG';
      
      // Normalisiere für Collection-Namen
      let collectionSuffix = 'KK';
      if (['KK', 'KKG'].includes(teamLeagueType)) collectionSuffix = 'KK';
      else if (['LG', 'LGA', 'LP', 'LPA', 'LD'].includes(teamLeagueType)) collectionSuffix = 'LD';
      else if (teamLeagueType === 'KKP') collectionSuffix = 'KKP';
      
      const collectionName = `rwk_scores_${competitionYear}_${collectionSuffix}`;
      const numRoundsForCompetition = 5;
      
      logDebug(`Team ${team.name}: Collection ${collectionName} (LeagueType: ${teamLeagueType})`);
      
      // Ergebnisse für das Team laden
      const scoresQuery = query(
        collection(db, collectionName),
        where('teamId', '==', teamDoc.id)
      );
      const scoresSnapshot = await getDocs(scoresQuery);
      const teamScoresRaw = scoresSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as unknown as import('@/types/rwk').ScoreEntry[];
      
      logDebug(`Team ${team.name}: ${teamScoresRaw.length} Ergebnisse`);
      
      const substitutions = await SubstitutionService.loadSubstitutions(competitionYear);
      const teamScores = teamScoresRaw;
      
      // Team-Berechnung über zentralen Service
      const calculationResult = TeamCalculationService.calculateTeamResults(
        teamDoc.id,
        teamScores,
        numRoundsForCompetition,
        substitutions,
        team.name
      );
      
      // Warnings ausgeben falls vorhanden
      if (calculationResult.warnings.length > 0) {
        logWarn(`Team ${team.name}`, { warnings: calculationResult.warnings });
      }
      
      // Debug-Ausgabe
      logDebug(`Team ${team.name}: GESAMT = ${calculationResult.totalScore} Ringe (${calculationResult.numScoredRounds} Durchgänge, Schnitt ${calculationResult.averageScore})`);
      
      const totalScore = calculationResult.totalScore;
      const averageScore = calculationResult.averageScore || 0;
      const roundsPlayed = calculationResult.numScoredRounds;

      standings.push({
        teamId: teamDoc.id,
        teamName: team.name,
        clubId: team.clubId,
        clubName: clubsMap.get(team.clubId) || 'Unbekannt',
        leagueId,
        leagueName,
        position: 0, // Wird nach Sortierung gesetzt
        totalScore,
        averageScore,
        roundsPlayed
      });
    }

    // Nach Gesamtergebnis sortieren (höchste zuerst)
    standings.sort((a, b) => b.totalScore - a.totalScore);
    
    // Positionen setzen
    standings.forEach((team, index) => {
      team.position = index + 1;
    });

    return standings;
  } catch (error) {
    logError('Error calculating league standings:', error);
    throw error;
  }
}

/**
 * Bestimmt, ob eine Liga eine "offene Klasse" ohne Auf-/Abstieg ist.
 * Laut RWK-Ordnung §6/§16: LG Freihand, Luftpistole (LP/LPA) und KK-Sportpistole
 * sind offene Klassen. LG AUFLAGE (LGA) und KK-Gewehr Auflage (Ligen mit
 * Kreisoberliga/Kreisliga/Kreisklassen) haben SEHR WOHL Auf-/Abstieg.
 *
 * Wichtig: Nicht allein am Namen "luftgewehr" festmachen — sonst würde die
 * LG-Auflage-Liga fälschlich als offene Klasse behandelt.
 */
function istOffeneKlasse(league: { type?: string; name?: string } | null | undefined): boolean {
  if (!league) return false;
  const type = (league.type || '').toUpperCase();
  const name = (league.name || '').toLowerCase();

  // Auflage-Ligen haben immer Auf-/Abstieg (Kreisoberliga/Kreisliga/Kreisklassen).
  const istAuflage = type === 'LGA' || type === 'LPA' || name.includes('auflage');
  if (istAuflage) return false;

  // Echte offene Klassen: Luftgewehr Freihand, Luftpistole, KK-Sportpistole.
  if (type === 'LG' || type === 'LGS' || type === 'LP' || type === 'KKP') return true;
  if (name.includes('freihand')) return true;
  if (name.includes('pistole')) return true;

  return false;
}

/**
 * Generiert Auf-/Abstiegsvorschläge basierend auf RWK-Ordnung §16
 * Berücksichtigt Abmeldungen und Ligagrößen-Anpassungen
 */
export async function generatePromotionRelegationSuggestions(
  leagueId: string, 
  competitionYear: number,
  allLeagues: any[],
  withdrawnTeams: string[] = [], // Abgemeldete Teams
  targetLeagueSizes: Map<string, number> = new Map(), // Gewünschte Ligagrößen
  _newClubs: string[] = [] // Neue Vereine (starten in niedrigster Liga)
): Promise<PromotionRelegationRule[]> {
  try {
    const standings = await calculateLeagueStandings(leagueId, competitionYear);
    const currentLeague = allLeagues.find(l => l.id === leagueId);
    
    if (!currentLeague || standings.length === 0) {
      return [];
    }

    const suggestions: PromotionRelegationRule[] = [];
    const totalTeams = standings.length;

    // Ligen nach Hierarchie sortieren (order-Feld)
    const sortedLeagues = [...allLeagues].sort((a, b) => (a.order || 0) - (b.order || 0));
    const currentLeagueIndex = sortedLeagues.findIndex(l => l.id === leagueId);
    
    const higherLeague = currentLeagueIndex > 0 ? sortedLeagues[currentLeagueIndex - 1] : null;
    const lowerLeague = currentLeagueIndex < sortedLeagues.length - 1 ? sortedLeagues[currentLeagueIndex + 1] : null;

    // Prüfe auf Abmeldungen in dieser Liga
    const withdrawnInThisLeague = standings.filter(team => withdrawnTeams.includes(team.teamId));
    
    // Berechne verfügbare Plätze basierend auf Abmeldungen aus höheren Ligen
    const withdrawnFromHigherLeagues = allLeagues
      .filter(league => (league.order || 0) < (currentLeague.order || 0))
      .reduce((count) => {
        // Hier würde man die Abmeldungen aus höheren Ligen zählen
        return count;
      }, 0);
    
    const additionalPromotionSlots = withdrawnFromHigherLeagues;
    const targetSize = targetLeagueSizes.get(leagueId) || totalTeams;
    const sizeReduction = totalTeams - targetSize;

    // Pre-load league standings for comparisons to avoid repeated queries
    const higherLeagueStandings = higherLeague ? await calculateLeagueStandings(higherLeague.id, competitionYear) : [];
    const lowerLeagueStandings = lowerLeague ? await calculateLeagueStandings(lowerLeague.id, competitionYear) : [];

    for (const team of standings) {
      let action: 'promote' | 'relegate' | 'stay' | 'compare' = 'stay';
      let reason = 'Verbleibt in aktueller Liga';
      let targetLeague = undefined;

      // Abgemeldete Teams automatisch absteigen lassen
      if (withdrawnTeams.includes(team.teamId)) {
        if (lowerLeague) {
          action = 'relegate';
          reason = 'Nach Meldeschluss abgemeldet - steigt automatisch ab (RWK-Ordnung §16)';
          targetLeague = lowerLeague.name;
        } else {
          reason = 'Nach Meldeschluss abgemeldet - verbleibt (niedrigste Liga)';
        }
      }
      // Meister steigt auf (außer höchste Liga oder offene Klassen)
      else if (team.position === 1) {
        const isOpenGroup = istOffeneKlasse(currentLeague);
        if (isOpenGroup) {
          reason = 'Meister - verbleibt (offene Gruppe, keine Auf-/Abstiege)';
        } else if (higherLeague && !currentLeague.name.includes('Kreisoberliga')) {
          action = 'promote';
          reason = 'Meister - steigt automatisch auf';
          targetLeague = higherLeague.name;
        } else {
          reason = 'Meister - verbleibt (höchste Liga)';
        }
      } else if (team.position === totalTeams) {
        // Letzter steigt ab (außer bei Ligaverkleinerung, offene Klassen oder niedrigste Liga)
        const isOpenGroup = istOffeneKlasse(currentLeague);
        if (isOpenGroup) {
          reason = 'Letzter Platz - verbleibt (offene Gruppe, keine Auf-/Abstiege)';
        } else if (currentLeague.name.toLowerCase().includes('2. kreisklasse')) {
          reason = 'Letzter Platz - verbleibt (niedrigste Liga)';
        } else if (lowerLeague && sizeReduction === 0) {
          action = 'relegate';
          reason = 'Letzter Platz - steigt automatisch ab';
          targetLeague = lowerLeague.name;
        } else if (sizeReduction > 0) {
          action = 'relegate';
          reason = `Letzter Platz - steigt ab (Ligaverkleinerung um ${sizeReduction} Teams)`;
          targetLeague = lowerLeague?.name || 'Niedrigere Liga';
        } else {
          reason = 'Letzter Platz - verbleibt (niedrigste Liga)';
        }
      } else if (team.position === 2 && higherLeague) {
        const isOpenGroup = istOffeneKlasse(currentLeague);
        if (isOpenGroup) {
          reason = 'Zweiter - verbleibt (offene Gruppe, keine Auf-/Abstiege)';
        } else {
        // Zweiter: Vergleich mit Vorletztem der höheren Liga
        if (additionalPromotionSlots > 0) {
          action = 'promote';
          reason = 'Zweiter - steigt auf (zusätzlicher Platz durch Abmeldung aus höherer Liga)';
          targetLeague = higherLeague.name;
        } else {
          // Vorletzten der höheren Liga finden und vergleichen
          const penultimateTeam = higherLeagueStandings.find(t => t.position === higherLeagueStandings.length - 1);
          
          if (penultimateTeam && team.totalScore > penultimateTeam.totalScore) {
            action = 'promote';
            reason = `Zweiter - steigt auf (${team.totalScore} > ${penultimateTeam.totalScore} Ringe vs. ${penultimateTeam.teamName})`;
            targetLeague = higherLeague.name;
          } else if (penultimateTeam) {
            reason = `Zweiter - verbleibt (${team.totalScore} <= ${penultimateTeam.totalScore} Ringe vs. ${penultimateTeam.teamName})`;
          } else {
            reason = 'Zweiter - verbleibt (kein Vergleichsteam gefunden)';
          }
        }
        }
      } else if (team.position === totalTeams - 1 && lowerLeague) {
        const isOpenGroup = istOffeneKlasse(currentLeague);
        const isLowestLeague = currentLeague.name.toLowerCase().includes('2. kreisklasse');
        if (isOpenGroup || isLowestLeague) {
          reason = isOpenGroup ? 'Vorletzter - verbleibt (offene Gruppe, keine Auf-/Abstiege)' : 'Vorletzter - verbleibt (niedrigste Liga)';
        } else {
        // Vorletzter: Vergleich mit Zweitem der niedrigeren Liga
        const secondTeam = lowerLeagueStandings.find(t => t.position === 2);
        
        if (secondTeam && team.totalScore > secondTeam.totalScore) {
          reason = `Vorletzter - verbleibt (${team.totalScore} > ${secondTeam.totalScore} Ringe vs. ${secondTeam.teamName})`;
        } else if (secondTeam) {
          action = 'relegate';
          reason = `Vorletzter - steigt ab (${team.totalScore} <= ${secondTeam.totalScore} Ringe vs. ${secondTeam.teamName})`;
          targetLeague = lowerLeague.name;
        } else {
          reason = 'Vorletzter - verbleibt (kein Vergleichsteam gefunden)';
        }
        }
      } else if (sizeReduction > 0 && team.position > totalTeams - sizeReduction) {
        // Zusätzliche Absteiger bei Ligaverkleinerung
        action = 'relegate';
        reason = `Platz ${team.position} - steigt ab (Ligaverkleinerung: ${sizeReduction} weniger Teams)`;
        targetLeague = lowerLeague?.name || 'Niedrigere Liga';
      } else if (additionalPromotionSlots > 1 && team.position <= 2 + additionalPromotionSlots - 1) {
        // Zusätzliche Aufsteiger bei vielen Abmeldungen aus höheren Ligen
        action = 'promote';
        reason = `Platz ${team.position} - steigt auf (${additionalPromotionSlots} zusätzliche Plätze durch Abmeldungen)`;
        targetLeague = higherLeague?.name || 'Höhere Liga';
      }

      suggestions.push({
        teamId: team.teamId,
        teamName: team.teamName,
        clubName: team.clubName,
        currentLeague: currentLeague.name,
        currentPosition: team.position,
        action,
        targetLeague,
        reason,
        confirmed: false
      });
    }
    
    // Zusätzliche Hinweise für Liga-Anpassungen
    if (withdrawnInThisLeague.length > 0) {
      logDebug(`Liga ${currentLeague.name}: ${withdrawnInThisLeague.length} Teams abgemeldet`);
    }
    if (sizeReduction > 0) {
      logDebug(`Liga ${currentLeague.name}: Verkleinerung um ${sizeReduction} Teams geplant`);
    }
    if (additionalPromotionSlots > 0) {
      logDebug(`Liga ${currentLeague.name}: ${additionalPromotionSlots} zusätzliche Aufstiegsplätze verfügbar`);
    }

    return suggestions;
  } catch (error) {
    logError('Error generating promotion/relegation suggestions:', error);
    throw error;
  }
}

/**
 * Erstellt eine neue Saison basierend auf einer bestehenden
 * Berücksichtigt neue Vereine (RWK-Ordnung §7)
 */
export async function createNewSeason(
  sourceSeasonId: string,
  targetYear: number,
  targetType: 'KK' | 'LD',
  newClubs: string[] = [] // Neue Vereine, die in niedrigster Liga starten
): Promise<string> {
  try {
    const batch = writeBatch(db);
    
    // Neue Saison erstellen
    const seasonName = `RWK ${targetYear} ${targetType === 'KK' ? 'Kleinkaliber' : 'Luftdruck'}`;
    const newSeasonRef = doc(collection(db, 'seasons'));
    
    batch.set(newSeasonRef, {
      competitionYear: targetYear,
      type: targetType,
      status: 'Vorbereitung',
      name: seasonName
    });

    // Ligen kopieren
    const sourceLeaguesQuery = query(
      collection(db, 'rwk_leagues'),
      where('seasonId', '==', sourceSeasonId)
    );
    const sourceLeaguesSnapshot = await getDocs(sourceLeaguesQuery);
    
    const leagueMapping = new Map(); // Alte ID -> Neue ID
    
    // Merkt sich je Quell-Liga-ID die order (Liga-Rang), damit Teams später ihren
    // vorherigen Rang kennen (für die Auf-/Abstiegs-Anwendung).
    const leagueOrderMap = new Map<string, number>();

    for (const leagueDoc of sourceLeaguesSnapshot.docs) {
      const leagueData = leagueDoc.data();
      const newLeagueRef = doc(collection(db, 'rwk_leagues'));
      
      batch.set(newLeagueRef, {
        ...leagueData,
        seasonId: newSeasonRef.id,
        competitionYear: targetYear
      });
      
      leagueMapping.set(leagueDoc.id, newLeagueRef.id);
      leagueOrderMap.set(leagueDoc.id, (leagueData as any).order ?? 0);
    }

    // Teams kopieren (ohne Ergebnisse)
    const sourceTeamsQuery = query(
      collection(db, 'rwk_teams'),
      where('seasonId', '==', sourceSeasonId)
    );
    const sourceTeamsSnapshot = await getDocs(sourceTeamsQuery);
    
    // Finde niedrigste Liga für neue Vereine (RWK-Ordnung §7)
    const lowestLeague = sourceLeaguesSnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() } as { id: string; order?: number }))
      .sort((a, b) => (b.order || 0) - (a.order || 0))[0]; // Höchste order = niedrigste Liga
    
    const lowestLeagueNewId = leagueMapping.get(lowestLeague?.id);
    
    for (const teamDoc of sourceTeamsSnapshot.docs) {
      const teamData = teamDoc.data();
      const newTeamRef = doc(collection(db, 'rwk_teams'));
      let newLeagueId = leagueMapping.get(teamData.leagueId);
      
      // Neue Vereine müssen in niedrigster Liga starten (RWK-Ordnung §7)
      if (newClubs.includes(teamData.clubId) && lowestLeagueNewId) {
        newLeagueId = lowestLeagueNewId;
      }
      
      if (newLeagueId) {
        batch.set(newTeamRef, {
          ...teamData,
          seasonId: newSeasonRef.id,
          leagueId: newLeagueId,
          competitionYear: targetYear,
          isNewClub: newClubs.includes(teamData.clubId), // Markierung für neue Vereine
          // Rückverweise für die spätere Auf-/Abstiegs-Anwendung:
          sourceTeamId: teamDoc.id,                                // Team-ID aus der Quell-Saison
          previousOrder: leagueOrderMap.get(teamData.leagueId) ?? null, // Liga-Rang der Vorsaison
        });
      }
    }
    
    // Zusätzliche Teams für komplett neue Vereine erstellen
    for (const clubId of newClubs) {
      // Prüfen ob Verein bereits Teams hat
      const existingTeam = sourceTeamsSnapshot.docs.find(doc => doc.data().clubId === clubId);
      
      if (!existingTeam && lowestLeagueNewId) {
        const newTeamRef = doc(collection(db, 'rwk_teams'));
        
        let clubName = 'Neuer Verein';
        try {
          const clubDoc = await getDocs(query(collection(db, 'clubs'), where('__name__', '==', clubId)));
          clubName = clubDoc.docs[0]?.data()?.name || 'Neuer Verein';
        } catch (clubError) {
          logWarn(`Failed to load club data for ${clubId}:`, clubError instanceof Error ? clubError.message : String(clubError));
        }
        
        batch.set(newTeamRef, {
          name: `${clubName} I`,
          clubId: clubId,
          clubName: clubName,
          seasonId: newSeasonRef.id,
          leagueId: lowestLeagueNewId,
          competitionYear: targetYear,
          shooterIds: [],
          isNewClub: true
        });
      }
    }

    await batch.commit();
    return newSeasonRef.id;
  } catch (error) {
    logError('Error creating new season:', error);
    throw new Error(`Failed to create new season: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export interface ApplyResult {
  moved: number;                 // erfolgreich verschobene Teams
  skipped: string[];             // Vorschläge, die nicht angewendet werden konnten (mit Grund)
}

/**
 * Wendet bestätigte Auf-/Abstiegsvorschläge auf die ZIEL-Saison an.
 *
 * Voraussetzung: Die Ziel-Saison wurde per createNewSeason erstellt, d. h. ihre
 * Teams tragen `sourceTeamId` (Verweis auf das Team der Quell-Saison) und stehen
 * zunächst in derselben Liga wie in der Vorsaison. Diese Funktion verschiebt die
 * bestätigten Teams um genau eine Liga-Stufe (Rang über `order`):
 *   promote  -> nächsthöhere Liga (order - 1)
 *   relegate -> nächstniedrigere Liga (order + 1)
 *
 * Matching:
 *   Team    : Ziel-Team mit sourceTeamId === suggestion.teamId
 *   Zielliga: Nachbarliga über order (nicht über den Namen, robuster)
 */
export async function applyPromotionRelegation(
  suggestions: PromotionRelegationRule[],
  targetSeasonId: string
): Promise<ApplyResult> {
  if (!targetSeasonId) {
    throw new Error('Keine Ziel-Saison angegeben.');
  }

  try {
    const confirmed = suggestions.filter(
      (s) => s.confirmed && (s.action === 'promote' || s.action === 'relegate')
    );
    const result: ApplyResult = { moved: 0, skipped: [] };
    if (confirmed.length === 0) {
      return result;
    }

    // Ziel-Ligen laden (nach order sortiert = höchste zuerst)
    const leaguesSnap = await getDocs(
      query(collection(db, 'rwk_leagues'), where('seasonId', '==', targetSeasonId))
    );
    const targetLeagues = leaguesSnap.docs
      .map((d) => ({ id: d.id, name: (d.data() as any).name as string, type: (d.data() as any).type as string, order: (d.data() as any).order ?? 0 }))
      .sort((a, b) => a.order - b.order);

    // Disziplin-Kategorie (KK vs. LG/LP) einer Liga, damit Auf-/Abstieg nur
    // innerhalb derselben Disziplin erfolgt und nicht versehentlich in eine
    // benachbarte Liga einer anderen Disziplin springt.
    const kategorie = (type?: string): string => getDisciplineCategory(type as any) || 'unbekannt';

    // Ziel-Teams laden. Es werden AUSSCHLIESSLICH die real in der Ziel-Saison
    // vorhandenen (= gemeldeten) Mannschaften berücksichtigt. Diese Funktion
    // aktualisiert nur deren Liga-Zuordnung (update) — sie legt KEINE Teams an
    // und löscht keine. Nicht gemeldete Vorjahres-Teams werden übersprungen.
    const teamsSnap = await getDocs(
      query(collection(db, 'rwk_teams'), where('seasonId', '==', targetSeasonId))
    );
    // Nur echte Mannschaften (>=3 Schützen) — Einzelschützen ignorieren.
    interface ZielTeam { docId: string; leagueId: string | null }
    const bySourceId = new Map<string, ZielTeam>();       // primär: sourceTeamId-Verweis
    const byName = new Map<string, ZielTeam>();            // Fallback: normalisierter Mannschaftsname
    const normName = (n?: string) => (n || '').trim().toLowerCase().replace(/\s+/g, ' ');
    teamsSnap.docs.forEach((d) => {
      const data = d.data() as any;
      if ((data.shooterIds?.length || 0) < 3) return; // keine echte Mannschaft
      const eintrag: ZielTeam = { docId: d.id, leagueId: data.leagueId ?? null };
      if (data.sourceTeamId) bySourceId.set(data.sourceTeamId, eintrag);
      const key = normName(data.name);
      if (key && !byName.has(key)) byName.set(key, eintrag);
    });

    const batch = writeBatch(db);

    for (const s of confirmed) {
      // 1. Match über sourceTeamId (eindeutig, wenn Ziel-Saison per Saisonwechsel entstand)
      // 2. Fallback: Match über den Mannschaftsnamen (für bereits gemeldete Ziel-Saisons)
      const targetTeam = bySourceId.get(s.teamId) || byName.get(normName(s.teamName));
      if (!targetTeam) {
        // Team der Vorsaison ist in der Ziel-Saison NICHT gemeldet -> nicht anfassen.
        result.skipped.push(`${s.teamName}: in Ziel-Saison nicht gemeldet – übersprungen`);
        continue;
      }
      // Aktuelle Liga (und deren order) des Ziel-Teams bestimmen
      const currentLeague = targetLeagues.find((l) => l.id === targetTeam.leagueId);
      if (!currentLeague) {
        result.skipped.push(`${s.teamName}: aktuelle Liga in Ziel-Saison nicht gefunden`);
        continue;
      }
      // Nächste Liga GLEICHER Disziplin-Kategorie in Auf-/Abstiegsrichtung suchen.
      // promote = nächstkleinere order (höhere Liga), relegate = nächstgrößere order.
      const cat = kategorie(currentLeague.type);
      const kandidaten = targetLeagues.filter((l) => kategorie(l.type) === cat);
      const zielLiga =
        s.action === 'promote'
          ? [...kandidaten].reverse().find((l) => l.order < currentLeague.order) // höchste order unterhalb → nächsthöhere Liga
          : kandidaten.find((l) => l.order > currentLeague.order);               // kleinste order oberhalb → nächstniedrigere Liga
      if (!zielLiga) {
        result.skipped.push(
          `${s.teamName}: keine ${s.action === 'promote' ? 'höhere' : 'niedrigere'} Liga vorhanden`
        );
        continue;
      }

      batch.update(doc(db, 'rwk_teams', targetTeam.docId), {
        leagueId: zielLiga.id,
        leagueType: zielLiga.type,
      });
      result.moved += 1;
      logDebug(`${s.action}: ${s.teamName} -> ${zielLiga.name}`);
    }

    if (result.moved > 0) {
      await batch.commit();
    }
    return result;
  } catch (error) {
    logError('Error applying promotion/relegation:', error);
    throw error;
  }
}


