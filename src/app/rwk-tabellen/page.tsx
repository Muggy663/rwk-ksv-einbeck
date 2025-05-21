
// src/app/rwk-tabellen/page.tsx
"use client";
import React, { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ChevronDown, ChevronRight, TableIcon, Loader2, AlertTriangle, User, Users, Trophy, Medal } from 'lucide-react';
import type {
  Season,
  League,
  Team,
  Club,
  Shooter,
  ScoreEntry,
  CompetitionDisplayConfig,
  FirestoreLeagueSpecificDiscipline,
  UIDisciplineSelection,
  AggregatedCompetitionData,
  IndividualShooterDisplayData,
  LeagueDisplay,
  TeamDisplay,
  ShooterDisplayResults
} from '@/types/rwk';
import { uiDisciplineFilterOptions, AVAILABLE_UI_DISCIPLINES, getUIDisciplineValueFromSpecificType } from '@/types/rwk';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { db } from '@/lib/firebase/config';
import { collection, doc, getDoc, getDocs, query, where, orderBy, limit, Timestamp } from 'firebase/firestore';
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line, ReferenceLine } from 'recharts';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const TEAM_SIZE_FOR_SCORING = 3;
const EXCLUDED_TEAM_NAME = "SV Dörrigsen Einzel";

async function fetchAvailableYearsFromSeasons(): Promise<number[]> {
  console.log("RWK-TABLE: fetchAvailableYearsFromSeasons called");
  try {
    const seasonsColRef = collection(db, "seasons");
    const qSeasons = query(seasonsColRef, orderBy("competitionYear", "desc"));
    const seasonsSnapshot = await getDocs(qSeasons);
    
    if (seasonsSnapshot.empty) {
      console.warn("RWK-TABLE: No seasons found in DB. Defaulting to current year.");
      return [new Date().getFullYear()];
    }
    
    const years = new Set<number>();
    seasonsSnapshot.forEach(doc => {
      const seasonData = doc.data() as Season;
      if (seasonData.competitionYear) {
        years.add(seasonData.competitionYear);
      }
    });
    const sortedYears = Array.from(years).sort((a, b) => b - a); 
    console.log("RWK-TABLE: Available years from DB (sorted desc):", sortedYears);
    return sortedYears.length > 0 ? sortedYears : [new Date().getFullYear()];
  } catch (error) {
    console.error("RWK-TABLE: Error fetching available years from seasons:", error);
    return [new Date().getFullYear()];
  }
}

async function fetchCompetitionTeamData(config: CompetitionDisplayConfig, numRoundsForCompetition: number): Promise<AggregatedCompetitionData | null> {
  console.log(`RWK-TABLE: fetchCompetitionTeamData for year ${config.year}, UI discipline ${config.discipline}`);
  try {
    const seasonsColRef = collection(db, "seasons");
    const qSeasons = query(seasonsColRef,
      where("competitionYear", "==", config.year),
      where("type", "==", config.discipline), // type 'KK', 'LD', 'SP'
      where("status", "==", "Laufend")
    );
    const seasonsSnapshot = await getDocs(qSeasons);
    console.log(`RWK-TABLE: Found ${seasonsSnapshot.docs.length} 'Laufend' season(s) matching criteria:`, seasonsSnapshot.docs.map(d => d.id));

    if (seasonsSnapshot.empty) {
      console.warn(`RWK-TABLE: No 'Laufend' seasons found for year ${config.year} and UI discipline ${config.discipline}.`);
      return { id: `${config.year}-${config.discipline}`, config, leagues: [] };
    }
    const laufendeSeasonIds = seasonsSnapshot.docs.map(sDoc => sDoc.id);

    const selectedUIDiscOption = uiDisciplineFilterOptions.find(opt => opt.value === config.discipline);
    const firestoreDisciplinesToQuery: FirestoreLeagueSpecificDiscipline[] = selectedUIDiscOption ? selectedUIDiscOption.firestoreTypes : [];

    if (firestoreDisciplinesToQuery.length === 0) {
        console.warn(`RWK-TABLE: No specific Firestore disciplines to query for UI discipline '${config.discipline}'.`);
        return { id: `${config.year}-${config.discipline}`, config, leagues: [] };
    }
    console.log(`RWK-TABLE: Querying leagues with Firestore types: ${firestoreDisciplinesToQuery.join(', ')} for season IDs: ${laufendeSeasonIds.join(', ')}`);

    const leaguesColRef = collection(db, "rwk_leagues");
     if (laufendeSeasonIds.length === 0) { 
        return { id: `${config.year}-${config.discipline}`, config, leagues: [] };
    }
    
    const qLeagues = query(leaguesColRef,
        where("seasonId", "in", laufendeSeasonIds.length > 0 ? laufendeSeasonIds.slice(0,30) : ["dummy_id_to_avoid_empty_in"]),
        where("type", "in", firestoreDisciplinesToQuery.length > 0 ? firestoreDisciplinesToQuery.slice(0,30) : ["dummy_type_to_avoid_empty_in"]),
        orderBy("order", "asc")
    );
    const leaguesSnapshot = await getDocs(qLeagues);
    let fetchedLeaguesData: LeagueDisplay[] = [];
    console.log(`RWK-TABLE: Fetched ${leaguesSnapshot.docs.length} leagues for running seasons and disciplines.`);

    if (leaguesSnapshot.empty) {
      console.warn(`RWK-TABLE: No leagues found for 'Laufend' seasons and specified Firestore disciplines.`);
      return { id: `${config.year}-${config.discipline}`, config, leagues: [] };
    }

    const clubCache = new Map<string, string>();
    const shooterCache = new Map<string, Shooter>();
   
    for (const leagueDoc of leaguesSnapshot.docs) {
      const leagueData = leagueDoc.data() as Omit<League, 'id' | 'teams'>; // Typ anpassen, da 'teams' hier noch nicht drin ist
      const league: LeagueDisplay = {
        id: leagueDoc.id,
        name: leagueData.name,
        shortName: leagueData.shortName,
        seasonId: leagueData.seasonId,
        competitionYear: leagueData.competitionYear,
        type: leagueData.type,
        order: leagueData.order,
        teams: [],
      };
      let teamDisplays: TeamDisplay[] = [];

      const teamsColRef = collection(db, "rwk_teams");
      const qTeams = query(teamsColRef,
        where("leagueId", "==", league.id),
        where("competitionYear", "==", config.year)
      );
      const teamsSnapshot = await getDocs(qTeams);

      for (const teamDoc of teamsSnapshot.docs) {
        const teamData = teamDoc.data() as Team;
        
        if (teamData.name === EXCLUDED_TEAM_NAME) {
          console.log(`RWK-TABLE: Filtering out team: ${teamData.name}`);
          continue;
        }

        let clubName = "Unbek. Verein";
        if (teamData.clubId) {
          if (clubCache.has(teamData.clubId)) {
            clubName = clubCache.get(teamData.clubId)!;
          } else {
            try {
              const clubDocRef = doc(db, "clubs", teamData.clubId);
              const clubSnap = await getDoc(clubDocRef);
              if (clubSnap.exists()) {
                clubName = (clubSnap.data() as Club).name || clubName;
                clubCache.set(teamData.clubId, clubName);
              } else {
                 console.warn(`RWK-TABLE: Club with ID ${teamData.clubId} not found for team ${teamData.name}`);
              }
            } catch (clubError) { console.error(`RWK-TABLE: Error fetching club ${teamData.clubId}:`, clubError); }
          }
        }
        
        const team: TeamDisplay = {
          id: teamDoc.id,
          name: teamData.name,
          clubId: teamData.clubId,
          leagueId: teamData.leagueId,
          seasonId: teamData.seasonId, // Hinzugefügt
          competitionYear: teamData.competitionYear,
          shooterIds: teamData.shooterIds || [],
          captainName: teamData.captainName,
          captainEmail: teamData.captainEmail,
          captainPhone: teamData.captainPhone,
          clubName: clubName,
          shootersResults: [],
          roundResults: {},
          totalScore: 0,
          averageScore: null,
          numScoredRounds: 0
        };
        
        const shooterIdsForTeam = teamData.shooterIds || [];
        if (shooterIdsForTeam.length > 0) {
            // Um das "IN"-Query Limit von 30 zu umgehen, falls ein Team mehr als 30 Schützen hat (unwahrscheinlich, aber sicher ist sicher)
            const shooterIdChunks: string[][] = [];
            for (let i = 0; i < shooterIdsForTeam.length; i += 30) { // Firestore 'in' query supports up to 30 items
                shooterIdChunks.push(shooterIdsForTeam.slice(i, i + 30));
            }

            const teamScoresSnapshots = await Promise.all(
                shooterIdChunks.map(chunk => 
                    getDocs(query(collection(db, "rwk_scores"),
                        where("teamId", "==", team.id),
                        where("competitionYear", "==", team.competitionYear),
                        where("shooterId", "in", chunk.length > 0 ? chunk : ["dummy_id_to_avoid_empty_in_clause"]) // Firestore 'in' query cannot be empty
                    ))
                )
            );
            
            const allTeamScoresDocs = teamScoresSnapshots.flatMap(snap => snap.docs);

            const scoresByShooter = new Map<string, ScoreEntry[]>();
            allTeamScoresDocs.forEach(scoreDoc => {
                const score = scoreDoc.data() as ScoreEntry;
                if (!scoresByShooter.has(score.shooterId)) {
                    scoresByShooter.set(score.shooterId, []);
                }
                scoresByShooter.get(score.shooterId)!.push(score);
            });

            for (const shooterId of shooterIdsForTeam) {
                let shooterInfo = shooterCache.get(shooterId);
                if (!shooterInfo) {
                    try {
                        const shooterDocRef = doc(db, "rwk_shooters", shooterId);
                        const shooterSnap = await getDoc(shooterDocRef);
                        if (shooterSnap.exists()) {
                            shooterInfo = {id: shooterSnap.id, ...shooterSnap.data()} as Shooter;
                            shooterCache.set(shooterId, shooterInfo);
                        } else {
                            console.warn(`RWK-TABLE: Shooter with ID ${shooterId} not found for team ${team.name}`);
                        }
                    } catch (shooterError) { console.error(`RWK-TABLE: Error fetching shooter ${shooterId}:`, shooterError); }
                }
                const shooterName = shooterInfo?.name || `Schütze ${shooterId.substring(0,5)}`;
                const shooterGender = shooterInfo?.gender || 'unknown'; // Default if not found

                const sResults: ShooterDisplayResults = {
                    shooterId: shooterId,
                    shooterName: shooterName,
                    shooterGender: shooterGender,
                    results: {}, // z.B. { dg1: 280, dg2: 275 }
                    average: null,
                    total: 0,
                    roundsShot: 0,
                    teamId: team.id,
                    leagueId: league.id,
                    competitionYear: team.competitionYear, // Hinzugefügt
                };
                for (let r = 1; r <= numRoundsForCompetition; r++) sResults.results[`dg${r}`] = null;

                const shooterScores = scoresByShooter.get(shooterId) || [];
                shooterScores.forEach(score => {
                    if (score.durchgang >= 1 && score.durchgang <= numRoundsForCompetition) {
                        const roundKey = `dg${score.durchgang}`;
                        sResults.results[roundKey] = typeof score.totalRinge === 'number' ? score.totalRinge : 0;
                    }
                });
                
                let currentTotal = 0;
                let roundsShotCount = 0;
                Object.values(sResults.results).forEach(res => {
                    if (res !== null && typeof res === 'number') {
                        currentTotal += res;
                        roundsShotCount++;
                    }
                });
                sResults.total = currentTotal;
                sResults.roundsShot = roundsShotCount;
                if (sResults.roundsShot > 0 && sResults.total !== null) { // Sicherstellen, dass total nicht null ist
                    sResults.average = parseFloat((sResults.total / sResults.roundsShot).toFixed(2));
                }
                team.shootersResults.push(sResults);
            }
             // Schützen innerhalb des Teams nach Gesamtringzahl sortieren
             team.shootersResults.sort((a, b) => (b.total ?? 0) - (a.total ?? 0) || a.shooterName.localeCompare(b.shooterName) );
        }

        // Mannschaftsergebnisse pro Durchgang berechnen (Top 3 Schützen)
        let roundResultsTemp: { [key: string]: number[] } = {};
        for (let r = 1; r <= numRoundsForCompetition; r++) {
          roundResultsTemp[`dg${r}`] = [];
        }

        team.shootersResults.forEach(sr => {
          for (let r = 1; r <= numRoundsForCompetition; r++) {
            const roundKey = `dg${r}`;
            if (sr.results[roundKey] !== null && typeof sr.results[roundKey] === 'number') {
              roundResultsTemp[roundKey].push(sr.results[roundKey] as number);
            }
          }
        });
        
        for (let r = 1; r <= numRoundsForCompetition; r++) {
          const roundKey = `dg${r}`;
          const scoresForRound = roundResultsTemp[roundKey].sort((a, b) => b - a); // Höchste zuerst
          if (scoresForRound.length >= TEAM_SIZE_FOR_SCORING) {
            team.roundResults[roundKey] = scoresForRound
              .slice(0, TEAM_SIZE_FOR_SCORING)
              .reduce((sum, scoreVal) => sum + scoreVal, 0);
          } else if (scoresForRound.length > 0 && scoresForRound.length < TEAM_SIZE_FOR_SCORING) {
            // Wenn weniger als TEAM_SIZE_FOR_SCORING Schützen Ergebnisse haben, aber mindestens einer,
            // dann wird die Summe der vorhandenen Ergebnisse genommen.
             team.roundResults[roundKey] = scoresForRound.reduce((sum, scoreVal) => sum + scoreVal, 0);
          }
           else {
            team.roundResults[roundKey] = null; // Kein Ergebnis, wenn keine Schützen für diesen Durchgang
          }
        }

        let teamTotalScore = 0;
        let numScoredRoundsForAvg = 0;
        Object.values(team.roundResults).forEach(scoreVal => {
          if (scoreVal !== null && typeof scoreVal === 'number') {
            teamTotalScore += scoreVal;
            if(scoreVal > 0) numScoredRoundsForAvg++; // Nur Runden mit >0 Ergebnis für Schnitt zählen
          }
        });
        team.totalScore = teamTotalScore;
        team.numScoredRounds = numScoredRoundsForAvg;
        team.averageScore = numScoredRoundsForAvg > 0 ? parseFloat((teamTotalScore / numScoredRoundsForAvg).toFixed(2)) : null;

        teamDisplays.push(team);
      }
      
      // Mannschaften innerhalb der Liga sortieren
      teamDisplays.sort((a, b) => (b.totalScore ?? 0) - (a.totalScore ?? 0) || (b.averageScore ?? 0) - (a.averageScore ?? 0) || a.clubName.localeCompare(b.clubName) || a.name.localeCompare(b.name) );
      teamDisplays.forEach((team, index) => { team.rank = index + 1; }); // Rangzuweisung
      league.teams = teamDisplays;
      fetchedLeaguesData.push(league);
    }
    console.log(`RWK-TABLE: fetchCompetitionTeamData returning ${fetchedLeaguesData.length} leagues for config`, config);
    return { id: `${config.year}-${config.discipline}`, config, leagues: fetchedLeaguesData };
  } catch (error) {
    console.error("RWK-TABLE: Error fetching team data:", error);
    throw error; // Fehler weiterwerfen, damit er im aufrufenden Code behandelt werden kann
  }
}


async function fetchIndividualShooterData(config: CompetitionDisplayConfig, numRoundsForCompetition: number): Promise<IndividualShooterDisplayData[]> {
  console.log(`RWK-TABLE: fetchIndividualShooterData for year ${config.year}, UI discipline ${config.discipline}`);
  try {
    const seasonsColRef = collection(db, "seasons");
    const qSeasons = query(seasonsColRef,
      where("competitionYear", "==", config.year),
      where("type", "==", config.discipline),
      where("status", "==", "Laufend")
    );
    const seasonsSnapshot = await getDocs(qSeasons);

    if (seasonsSnapshot.empty) {
      console.warn(`RWK-TABLE: No 'Laufend' seasons found for year ${config.year} and UI discipline ${config.discipline} (fetchIndividual).`);
      return [];
    }
    const laufendeSeasonIds = seasonsSnapshot.docs.map(s => s.id);

    const selectedUIDiscOption = uiDisciplineFilterOptions.find(opt => opt.value === config.discipline);
    const firestoreDisciplinesToQuery: FirestoreLeagueSpecificDiscipline[] = selectedUIDiscOption ? selectedUIDiscOption.firestoreTypes : [];
    
    if (firestoreDisciplinesToQuery.length === 0) {
        console.warn(`RWK-TABLE: No specific Firestore disciplines to query for UI discipline '${config.discipline}' (fetchIndividual).`);
        return [];
    }

    const leaguesColRef = collection(db, "rwk_leagues");
    if (laufendeSeasonIds.length === 0) return [];

    const qLeaguesForDiscipline = query(leaguesColRef,
        where("seasonId", "in", laufendeSeasonIds.length > 0 ? laufendeSeasonIds.slice(0,30) : ["dummy_id_to_avoid_empty_in"]),
        where("type", "in", firestoreDisciplinesToQuery.length > 0 ? firestoreDisciplinesToQuery.slice(0,30) : ["dummy_type_to_avoid_empty_in"])
    );
    const leaguesSnap = await getDocs(qLeaguesForDiscipline);
    if (leaguesSnap.empty) {
        console.warn(`RWK-TABLE: No leagues found for 'Laufend' seasons and specified disciplines (fetchIndividual).`);
        return [];
    }
    const relevantLeagueIds = leaguesSnap.docs.map(lDoc => lDoc.id);
    if (relevantLeagueIds.length === 0) return [];

    const scoresColRef = collection(db, "rwk_scores");
    // Um das "IN"-Query Limit von 30 zu umgehen
    const MAX_IN_FILTER_ITEMS = 30; 
    let allScores: ScoreEntry[] = [];

    const relevantLeagueIdChunks: string[][] = [];
    for (let i = 0; i < relevantLeagueIds.length; i += MAX_IN_FILTER_ITEMS) {
        relevantLeagueIdChunks.push(relevantLeagueIds.slice(i, i + MAX_IN_FILTER_ITEMS));
    }

    for (const chunk of relevantLeagueIdChunks) {
        if (chunk.length > 0) {
            const scoresQuery = query(scoresColRef,
                where("competitionYear", "==", config.year),
                where("leagueId", "in", chunk), 
            );
            const scoresSnapshot = await getDocs(scoresQuery);
            scoresSnapshot.docs.forEach(d => allScores.push({ id: d.id, ...d.data() } as ScoreEntry));
        }
    }
    
    const shootersMap = new Map<string, IndividualShooterDisplayData>();

    for (const score of allScores) {
      // Mannschaft "SV Dörrigsen Einzel" ausschließen
      if (score.teamName === EXCLUDED_TEAM_NAME) continue;

      if (!shootersMap.has(score.shooterId)) {
        // Initialisiere Schützendaten, wenn er zum ersten Mal auftaucht
        const initialResults: { [key: string]: number | null } = {};
        for (let r = 1; r <= numRoundsForCompetition; r++) {
          initialResults[`dg${r}`] = null;
        }
        shootersMap.set(score.shooterId, {
          shooterId: score.shooterId,
          shooterName: score.shooterName || "Unbek. Schütze",
          shooterGender: 'unknown', // Start mit unknown, wird verfeinert
          teamName: score.teamName || "Unbek. Team",
          results: initialResults,
          totalScore: 0,
          averageScore: null,
          roundsShot: 0,
        });
      }

      const shooterData = shootersMap.get(score.shooterId)!;
      // Namen und Teamnamen aktualisieren, falls sie vorher "Unbekannt" waren
      if ((!shooterData.shooterName || shooterData.shooterName === "Unbek. Schütze") && score.shooterName) shooterData.shooterName = score.shooterName;
      if ((!shooterData.teamName || shooterData.teamName === "Unbek. Team") && score.teamName) shooterData.teamName = score.teamName;
      
      // Geschlecht verfeinern: 'female' hat Priorität
      const currentScoreGender = score.shooterGender?.toLowerCase();
      if (currentScoreGender === 'female' || currentScoreGender === 'w') {
        shooterData.shooterGender = 'female';
      } else if ((shooterData.shooterGender === 'unknown' || !shooterData.shooterGender) && (currentScoreGender === 'male' || currentScoreGender === 'm')) {
        shooterData.shooterGender = 'male';
      } else if (shooterData.shooterGender === 'unknown' && score.shooterGender) {
        // Fallback, falls weder 'female' noch 'male' aber etwas anderes angegeben wurde
        shooterData.shooterGender = score.shooterGender;
      }


      // Ergebnis für den Durchgang eintragen
      if (score.durchgang >= 1 && score.durchgang <= numRoundsForCompetition && score.totalRinge !== null && typeof score.totalRinge === 'number') {
        const roundKey = `dg${score.durchgang}`;
        shooterData.results[roundKey] = score.totalRinge;
      }
    }

    // Gesamt, Schnitt und Rundenzahl für jeden Schützen berechnen
    shootersMap.forEach(shooterData => {
      let currentTotal = 0;
      let roundsShotCount = 0;
      Object.values(shooterData.results).forEach(res => {
        if (res !== null && typeof res === 'number') {
          currentTotal += res;
          roundsShotCount++;
        }
      });
      shooterData.totalScore = currentTotal;
      shooterData.roundsShot = roundsShotCount;
      if (shooterData.roundsShot > 0) {
        shooterData.averageScore = parseFloat((shooterData.totalScore / shooterData.roundsShot).toFixed(2));
      }
    });

    // Schützen sortieren
    const rankedShooters = Array.from(shootersMap.values())
      .sort((a, b) => (b.totalScore ?? 0) - (a.totalScore ?? 0) || (b.averageScore ?? 0) - (a.averageScore ?? 0) || a.shooterName.localeCompare(b.shooterName));
    
    // Rangzuweisung
    rankedShooters.forEach((shooter, index) => { shooter.rank = index + 1; });
    return rankedShooters;
  } catch (error) {
    console.error("RWK-TABLE: Error fetching individual shooter data:", error);
    throw error;
  }
}


const TeamShootersTable: React.FC<{ shootersResults: ShooterDisplayResults[], numRounds: number }> = ({ shootersResults, numRounds }) => {
  if (!shootersResults || shootersResults.length === 0) {
    return <p className="p-3 text-sm text-center text-muted-foreground bg-muted/10">Keine Schützen für dieses Team erfasst oder Ergebnisse vorhanden.</p>;
  }
  return (
    <div className="overflow-x-auto bg-muted/20 p-2 rounded-md">
      <Table className="min-w-full">
        <TableHeader>
          <TableRow className="text-xs border-b-0">
            <TableHead className="pl-3 pr-1 py-1.5 text-muted-foreground font-normal whitespace-nowrap">Schütze</TableHead>
            {[...Array(numRounds)].map((_, i) => (
              <TableHead key={`shooter-dg${i + 1}`} className="px-1 py-1.5 text-center text-muted-foreground font-normal">DG {i + 1}</TableHead>
            ))}
            <TableHead className="px-1 py-1.5 text-center font-medium text-muted-foreground whitespace-nowrap">Gesamt</TableHead>
            <TableHead className="pl-1 pr-3 py-1.5 text-center font-medium text-muted-foreground whitespace-nowrap">Schnitt</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {shootersResults.map(shooterRes => (
            <TableRow key={shooterRes.shooterId} className="text-sm border-b-0 hover:bg-muted/40">
              <TableCell className="font-medium pl-3 pr-1 py-1.5 whitespace-nowrap">{shooterRes.shooterName}</TableCell>
              {[...Array(numRounds)].map((_, i) => (
                <TableCell key={`shooter-dg${i + 1}-${shooterRes.shooterId}`} className="px-1 py-1.5 text-center">
                  {shooterRes.results?.[`dg${i + 1}`] ?? '-'}
                </TableCell>
              ))}
              <TableCell className="px-1 py-1.5 text-center font-medium">{shooterRes.total ?? '-'}</TableCell>
              <TableCell className="pl-1 pr-3 py-1.5 text-center font-medium">
                {shooterRes.average != null ? shooterRes.average.toFixed(2) : '-'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};


const ShooterDetailModalContent: React.FC<{ shooterData: IndividualShooterDisplayData | null, numRounds: number }> = ({ shooterData, numRounds }) => {
  if (!shooterData) return null;

  const chartData = [];
  for (let i = 1; i <= numRounds; i++) {
    const scoreValue = shooterData.results[`dg${i}`];
    chartData.push({
      name: `DG ${i}`,
      Ringe: typeof scoreValue === 'number' ? scoreValue : null, // Recharts kann null für fehlende Punkte handhaben
    });
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-2xl text-primary">{shooterData.shooterName}</DialogTitle>
        <DialogDescription>
          {shooterData.teamName} - Ergebnisse der Saison {shooterData.results?.competitionYear || ""} 
        </DialogDescription>
      </DialogHeader>
      <div className="mt-4 grid gap-6">
        <div>
          <h3 className="text-lg font-semibold mb-2 text-accent-foreground">Ergebnisübersicht</h3>
          <Table>
            <TableHeader>
              <TableRow>
                {[...Array(numRounds)].map((_, i) => (
                  <TableHead key={`detail-dg${i + 1}`} className="text-center">DG {i + 1}</TableHead>
                ))}
                <TableHead className="text-center font-semibold">Gesamt</TableHead>
                <TableHead className="text-center font-semibold">Schnitt</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                {[...Array(numRounds)].map((_, i) => (
                  <TableCell key={`detail-val-dg${i + 1}`} className="text-center">{shooterData.results[`dg${i + 1}`] ?? '-'}</TableCell>
                ))}
                <TableCell className="text-center font-semibold text-primary">{shooterData.totalScore}</TableCell>
                <TableCell className="text-center font-medium text-muted-foreground">{shooterData.averageScore != null ? shooterData.averageScore.toFixed(2) : '-'} </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
        {chartData.some(d => d.Ringe !== null && d.Ringe > 0) && ( // Nur Diagramm zeigen, wenn es Daten gibt
          <div>
            <h3 className="text-lg font-semibold mb-3 text-accent-foreground">Leistungsdiagramm</h3>
            <div className="h-[300px] w-full bg-muted/30 p-4 rounded-lg shadow-inner">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} domain={['dataMin - 5', 'dataMax + 5']} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      borderColor: 'hsl(var(--border))',
                      borderRadius: 'var(--radius)',
                    }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                    formatter={(value: any) => value === null ? "-" : value} // Umgang mit null-Werten im Tooltip
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Line type="monotone" dataKey="Ringe" stroke="hsl(var(--primary))" strokeWidth={2} name="Ringe" dot={{ r: 4, fill: 'hsl(var(--primary))' }} activeDot={{ r: 6 }} connectNulls={false} />
                  {shooterData.averageScore !== null && shooterData.averageScore > 0 && (
                    <ReferenceLine y={shooterData.averageScore} label={{ value: `Schnitt: ${shooterData.averageScore.toFixed(2)}`, position: 'insideTopRight', fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} stroke="hsl(var(--accent))" strokeDasharray="3 3" />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

function RwkTabellenPageComponent() { // Umbenannt, um Suspense zu ermöglichen
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [availableYearsFromDb, setAvailableYearsFromDb] = useState<number[]>([]);
  const [pageTitle, setPageTitle] = useState<string>("RWK Tabellen");
  const [selectedCompetition, setSelectedCompetition] = useState<CompetitionDisplayConfig | null>(null);
  const [activeTab, setActiveTab] = useState<"mannschaften" | "einzelschützen">("mannschaften");

  const [teamData, setTeamData] = useState<AggregatedCompetitionData | null>(null);
  const [individualData, setIndividualData] = useState<IndividualShooterDisplayData[]>([]);
  const [topMaleShooter, setTopMaleShooter] = useState<IndividualShooterDisplayData | null>(null);
  const [topFemaleShooter, setTopFemaleShooter] = useState<IndividualShooterDisplayData | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const [currentNumRoundsState, setCurrentNumRoundsState] = useState<number>(5); // Default KK
  
  const [openAccordionItems, setOpenAccordionItems] = useState<string[]>([]); // Für kontrolliertes Akkordeon
  const [expandedTeamIds, setExpandedTeamIds] = useState<string[]>([]); // Für manuelles Aufklappen der Teams

  const [isShooterDetailModalOpen, setIsShooterDetailModalOpen] = useState(false);
  const [selectedShooterForDetail, setSelectedShooterForDetail] = useState<IndividualShooterDisplayData | null>(null);
  const [isLoadingInitialYears, setIsLoadingInitialYears] = useState(true);

  const calculateNumRounds = useCallback(async (year: number, uiDiscipline: UIDisciplineSelection): Promise<number> => {
    console.log(`RWK-TABLE: calculateNumRounds for ${year} ${uiDiscipline}`);
    try {
      const seasonsQuery = query(
        collection(db, "seasons"),
        where("competitionYear", "==", year),
        where("type", "==", uiDiscipline),
        where("status", "==", "Laufend"),
        limit(1) 
      );
      const seasonsSnapForRounds = await getDocs(seasonsQuery);
      if (!seasonsSnapForRounds.empty) {
          // const firstSeasonDoc = seasonsSnapForRounds.docs[0].data() as Season; // Nicht direkt benötigt
          // Um den spezifischen Typ zu bekommen, müssen wir eine Liga dieser Saison finden
          const leagueForRoundsQuery = query(collection(db, "rwk_leagues"), where("seasonId", "==", seasonsSnapForRounds.docs[0].id), limit(1));
          const leagueSnap = await getDocs(leagueForRoundsQuery);
          if(!leagueSnap.empty){
              const leagueData = leagueSnap.docs[0].data() as League;
              const specificType = leagueData.type; // KKG, LGA, LP etc.
              console.log("RWK-TABLE: Specific league type for numRounds calculation:", specificType);
              const lgLpTypes: FirestoreLeagueSpecificDiscipline[] = ['LG', 'LGA', 'LP', 'LPA'];
              if (lgLpTypes.includes(specificType)) return 4;
          } else {
               console.warn(`RWK-TABLE: No leagues found for season ${seasonsSnapForRounds.docs[0].id} and its specific types to determine numRounds. Defaulting.`);
          }
      } else {
          console.warn(`RWK-TABLE: No 'Laufend' season found for ${year} ${uiDiscipline} to determine numRounds. Defaulting.`);
      }
    } catch (err) {
        console.error("RWK-TABLE: Error in calculateNumRounds:", err);
    }
    return 5; // Default auf 5 (z.B. für KK)
  }, []);


  // Initialisierung der Jahre und der Standardauswahl
  useEffect(() => {
    let isMounted = true;
    console.log("RWK-TABLE: Initializing component with searchParams:", searchParams.toString());
    setIsLoadingInitialYears(true);
    
    fetchAvailableYearsFromSeasons().then(dbYears => {
      if (!isMounted) return;
      setAvailableYearsFromDb(dbYears);
      console.log("RWK-TABLE: Years from DB for dropdown:", dbYears);

      const paramYearStr = searchParams.get('year');
      const paramDiscipline = searchParams.get('discipline') as UIDisciplineSelection | null;
      const paramLeagueId = searchParams.get('league');

      let initialYear: number;
      const currentActualYear = new Date().getFullYear();

      if (paramYearStr && !isNaN(parseInt(paramYearStr)) && dbYears.includes(parseInt(paramYearStr))) {
        initialYear = parseInt(paramYearStr);
      } else if (dbYears.includes(currentActualYear)) {
        initialYear = currentActualYear;
      } else if (dbYears.length > 0) {
        initialYear = dbYears[0]; // Nimm das neueste Jahr aus der DB, wenn aktuelles nicht dabei ist
      } else {
        initialYear = currentActualYear; // Fallback, wenn DB keine Jahre liefert
      }

      const initialDiscipline: UIDisciplineSelection = 
        paramDiscipline && AVAILABLE_UI_DISCIPLINES.some(d => d.value === paramDiscipline)
        ? paramDiscipline
        : AVAILABLE_UI_DISCIPLINES[0]?.value || 'KK'; // Fallback auf erste verfügbare Disziplin
            
      const disciplineLabelObj = AVAILABLE_UI_DISCIPLINES.find(d => d.value === initialDiscipline);
      const disciplineLabel = disciplineLabelObj ? disciplineLabelObj.label.replace(/\s*\(.*\)\s*$/, '').trim() : initialDiscipline;
            
      const newSelectedCompetition: CompetitionDisplayConfig = {
          year: initialYear,
          discipline: initialDiscipline,
          displayName: `RWK ${initialYear} ${disciplineLabel}`
      };
      setSelectedCompetition(newSelectedCompetition);
      
      if (paramLeagueId) {
        // Wir setzen den initialen League-Tab für das Akkordeon.
        // Das Akkordeon erwartet ein Array von Strings.
        setOpenAccordionItems([paramLeagueId]);
      } else {
        setOpenAccordionItems([]); // Kein spezifischer Tab soll offen sein
      }
      setIsLoadingInitialYears(false);

    }).catch(err => {
      if(isMounted) {
        console.error("RWK-TABLE: Error in initial year/discipline setup:", err);
        setError("Fehler beim Initialisieren der Jahresauswahl.");
        // Fallback-Selektion
        const fallbackYear = new Date().getFullYear();
        const fallbackDiscipline = AVAILABLE_UI_DISCIPLINES[0]?.value || 'KK';
        const fallbackLabelObj = AVAILABLE_UI_DISCIPLINES.find(d => d.value === fallbackDiscipline);
        const fallbackLabel = fallbackLabelObj ? fallbackLabelObj.label.replace(/\s*\(.*\)\s*$/, '').trim() : fallbackDiscipline;
        setSelectedCompetition({ year: fallbackYear, discipline: fallbackDiscipline, displayName: `RWK ${fallbackYear} ${fallbackLabel}` });
        setIsLoadingInitialYears(false);
      }
    });
    return () => { isMounted = false; };
  }, [searchParams]); // Nur ausführen, wenn sich searchParams ändern


  // Daten laden, wenn selectedCompetition oder activeTab sich ändern
  useEffect(() => {
    let isMounted = true;
    if (!selectedCompetition || isLoadingInitialYears) {
      // Wenn noch keine Auswahl getroffen oder Jahre noch laden, nicht fortfahren oder Ladezustand setzen
      if (isMounted && !isLoadingInitialYears) setLoading(false); // Setze loading false, wenn Jahre geladen, aber keine Competition gewählt
      return;
    }

    const loadData = async () => {
      if(!isMounted) return;
      console.log(`RWK-TABLE: useEffect for data loading triggered. Active tab: ${activeTab}, Competition:`, selectedCompetition);
      setLoading(true);
      setError(null);
      setPageTitle(selectedCompetition.displayName); // Setze den Seitentitel basierend auf der Auswahl

      try {
        const numRoundsForCurrentCompetition = await calculateNumRounds(selectedCompetition.year, selectedCompetition.discipline);
        if (!isMounted) return;
        setCurrentNumRoundsState(numRoundsForCurrentCompetition);
        console.log("RWK-TABLE: numRoundsForCompetition set to", numRoundsForCurrentCompetition, "for", selectedCompetition.displayName);

        if (activeTab === "mannschaften") {
          if(isMounted) setIndividualData([]); // Reset other tab data
          const data = await fetchCompetitionTeamData(selectedCompetition, numRoundsForCurrentCompetition);
          if (!isMounted) return;
          setTeamData(data);
          console.log(`RWK-TABLE: Team data successfully loaded for ${selectedCompetition.displayName}:`, data?.leagues?.length || 0, "leagues");
          // Wenn eine LeagueId durch URL-Parameter vorgegeben war, und die Daten jetzt geladen sind,
          // sollte das Akkordeon diese LeagueId im openAccordionItems State haben.
          const leagueFromParam = searchParams.get('league');
          if (leagueFromParam && data?.leagues.some(l => l.id === leagueFromParam) && !openAccordionItems.includes(leagueFromParam)) {
            // Manchmal muss man es hier nochmal setzen, falls das Timing nicht passte
            setOpenAccordionItems(prev => [...prev, leagueFromParam].filter((v,i,a) => a.indexOf(v)===i)); // Eindeutig machen
          }

        } else if (activeTab === "einzelschützen") {
          if(isMounted) setTeamData(null); // Reset other tab data
          const individuals = await fetchIndividualShooterData(selectedCompetition, numRoundsForCurrentCompetition);
          if (!isMounted) return;
          setIndividualData(individuals);
          console.log(`RWK-TABLE: Individual data successfully loaded for ${selectedCompetition.displayName}:`, individuals.length, "shooters");

          // Beste Schützen ermitteln
          if (individuals.length > 0) {
            const males = individuals.filter(s => s.shooterGender && (s.shooterGender.toLowerCase() === 'male' || s.shooterGender.toLowerCase() === 'm'));
            if(isMounted) setTopMaleShooter(males.length > 0 ? males.sort((a,b) => (b.totalScore ?? 0) - (a.totalScore ?? 0) || (b.averageScore ?? 0) - (a.averageScore ?? 0) )[0] : null);
            
            const females = individuals.filter(s => s.shooterGender && (s.shooterGender.toLowerCase() === 'female' || s.shooterGender.toLowerCase() === 'w'));
            if(isMounted) setTopFemaleShooter(females.length > 0 ? females.sort((a,b) => (b.totalScore ?? 0) - (a.totalScore ?? 0) || (b.averageScore ?? 0) - (a.averageScore ?? 0) )[0] : null);
          } else {
             if(isMounted){
                setTopMaleShooter(null);
                setTopFemaleShooter(null);
            }
          }
        }
      } catch (err) {
        console.error(`RWK-TABLE: Failed to load RWK data for ${activeTab}:`, err);
        if(isMounted) setError((err as Error).message || "Unbekannter Fehler beim Laden der Daten.");
        if (activeTab === "mannschaften" && isMounted) setTeamData(null);
        if (activeTab === "einzelschützen" && isMounted) setIndividualData([]);
      } finally {
        if(isMounted) setLoading(false);
        console.log("RWK-TABLE: Data loading finished.");
      }
    };

    loadData();
    return () => { isMounted = false; };
  }, [selectedCompetition, activeTab, calculateNumRounds, isLoadingInitialYears, searchParams, openAccordionItems]); // `openAccordionItems` als Abhängigkeit für den Fall, dass es sich durch URL-Params ändert

  const handleYearChange = useCallback(async (yearString: string) => {
    const year = parseInt(yearString, 10);
    if (!selectedCompetition || selectedCompetition.year === year || isNaN(year)) return;
    
    // Behalte die aktuelle Disziplin bei, ändere nur das Jahr
    const currentDiscLabelObj = AVAILABLE_UI_DISCIPLINES.find(d => d.value === selectedCompetition.discipline);
    const currentDiscLabel = currentDiscLabelObj ? currentDiscLabelObj.label.replace(/\s*\(.*\)\s*$/, '').trim() : selectedCompetition.discipline;
          
    // URL aktualisieren, ohne league Parameter, da dieser nicht mehr relevant ist bei Jahreswechsel
    router.push(`/rwk-tabellen?year=${year}&discipline=${selectedCompetition.discipline}`, { scroll: false });
    // setSelectedCompetition aktualisiert sich durch den useEffect auf searchParams
    setOpenAccordionItems([]); // Akkordeon schließen, wenn Jahr oder Disziplin geändert wird
    setExpandedTeamIds([]);   // Team-Details schließen
  }, [selectedCompetition, router]);

  const handleDisciplineChange = useCallback(async (discipline: UIDisciplineSelection) => {
     if (!selectedCompetition || selectedCompetition.discipline === discipline) return;

     // Behalte aktuelles Jahr, ändere Disziplin
     const currentDiscLabelObj = AVAILABLE_UI_DISCIPLINES.find(d => d.value === discipline);
     const currentDiscLabel = currentDiscLabelObj ? currentDiscLabelObj.label.replace(/\s*\(.*\)\s*$/, '').trim() : discipline;
     
     // URL aktualisieren
     router.push(`/rwk-tabellen?year=${selectedCompetition.year}&discipline=${discipline}`, { scroll: false });
     // setSelectedCompetition aktualisiert sich durch den useEffect auf searchParams
     setOpenAccordionItems([]); 
     setExpandedTeamIds([]);   
  }, [selectedCompetition, router]);
  
  // Handler für das kontrollierte Akkordeon (Ligen)
  const handleAccordionValueChange = (value: string[]) => {
    setOpenAccordionItems(value);
    // Wenn der Benutzer das Akkordeon manuell ändert, wollen wir den `league` URL-Parameter entfernen,
    // da die URL nicht mehr den Zustand des Akkordeons widerspiegelt.
    if (searchParams.get('league') && selectedCompetition) { // Nur wenn ein league-Param da war
        router.push(`/rwk-tabellen?year=${selectedCompetition.year}&discipline=${selectedCompetition.discipline}`, { scroll: false });
    }
  };

  // Handler für das manuelle Aufklappen der Team-Details
  const toggleTeamExpansion = (teamId: string) => {
    setExpandedTeamIds(prev => 
      prev.includes(teamId) ? prev.filter(id => id !== teamId) : [...prev, teamId]
    );
  };

  // Handler für Klick auf Schützenname (öffnet Modal)
  const handleShooterNameClick = (shooter: IndividualShooterDisplayData) => {
    setSelectedShooterForDetail(shooter);
    setIsShooterDetailModalOpen(true);
  };

  const renderLoadingSkeleton = useCallback((forTab: "mannschaften" | "einzelschützen") => (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <Skeleton className="h-8 w-8 rounded-md" />
        <Skeleton className="h-8 w-1/3 rounded-md" />
      </div>
      <Card className="shadow-lg">
        <CardHeader>
          <Skeleton className="h-6 w-1/4 rounded-md" />
          <Skeleton className="h-4 w-1/2 rounded-md mt-1" />
        </CardHeader>
        <CardContent className="pt-6">
           <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <p className="text-lg">Lade Tabellendaten für {pageTitle} ({forTab})...</p>
           </div>
        </CardContent>
      </Card>
    </div>
  ), [pageTitle]);


  if (isLoadingInitialYears || (!selectedCompetition && !error)) {
     // Zeige ein umfassenderes Skeleton, während Jahre und erste Auswahl geladen werden
     return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex items-center space-x-3">
                <TableIcon className="h-8 w-8 text-primary" />
                <Skeleton className="h-8 w-48" />
                </div>
                 <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <Skeleton className="h-10 w-full sm:w-[180px]" />
                    <Skeleton className="h-10 w-full sm:w-[220px]" />
                </div>
            </div>
            {renderLoadingSkeleton(activeTab)}
        </div>
     );
  }
  
  if (error && !loading) { // Zeige Fehler nur, wenn nicht aktiv geladen wird
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-3">
          <TableIcon className="h-8 w-8 text-destructive" />
          <h1 className="text-3xl font-bold text-destructive">Fehler beim Laden der Tabellen</h1>
        </div>
        <Card className="shadow-lg border-destructive">
          <CardHeader><CardTitle className="text-destructive flex items-center"><AlertTriangle className="mr-2 h-5 w-5" />Daten konnten nicht geladen werden</CardTitle></CardHeader>
          <CardContent className="text-destructive-foreground bg-destructive/10 p-6">
            <p>Es gab ein Problem beim Abrufen der Daten für {pageTitle}.</p>
            <p className="text-sm mt-2">Fehlermeldung: {error}.</p>
            <p className="text-sm mt-2">Überprüfen Sie die Browser-Konsole für Details und die Firestore-Sicherheitsregeln, insbesondere ob Indizes fehlen.</p>
            <p className="text-xs mt-1">Stellen Sie sicher, dass Saisons für das gewählte Jahr und die Disziplin existieren und den Status "Laufend" haben.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center space-x-3">
          <TableIcon className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-primary">{pageTitle}</h1>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Select 
            value={selectedCompetition?.year.toString() || ""} 
            onValueChange={handleYearChange}
            disabled={availableYearsFromDb.length === 0 || loading}
          >
            <SelectTrigger className="w-full sm:w-[180px] shadow-md">
              <SelectValue placeholder={isLoadingInitialYears && availableYearsFromDb.length === 0 ? "Lade Jahre..." : "Jahr wählen"} />
            </SelectTrigger>
            <SelectContent>
              {availableYearsFromDb.length > 0 ? 
                availableYearsFromDb.map(year => (<SelectItem key={year} value={year.toString()}>{year}</SelectItem>))
                : <SelectItem value="NO_YEARS_PLACEHOLDER_RWK_TABLE" disabled>Keine Jahre verfügbar</SelectItem>
              }
            </SelectContent>
          </Select>
          <Select 
            value={selectedCompetition?.discipline || ""} 
            onValueChange={(value) => handleDisciplineChange(value as UIDisciplineSelection)}
            disabled={!selectedCompetition || loading}
          >
            <SelectTrigger className="w-full sm:w-[220px] shadow-md">
              <SelectValue placeholder="Disziplin wählen" />
            </SelectTrigger>
            <SelectContent>
              {AVAILABLE_UI_DISCIPLINES.map(disc => (
                <SelectItem key={disc.value} value={disc.value}>{disc.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "mannschaften" | "einzelschützen")} className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:w-1/2 lg:w-1/3 mb-6 shadow-md">
          <TabsTrigger value="mannschaften" className="py-2.5"><Users className="mr-2 h-5 w-5" />Mannschaften</TabsTrigger>
          <TabsTrigger value="einzelschützen" className="py-2.5"><User className="mr-2 h-5 w-5" />Einzelschützen</TabsTrigger>
        </TabsList>

        <TabsContent value="mannschaften">
          {loading && !teamData && renderLoadingSkeleton("mannschaften")}
          {!loading && !error && (!teamData || teamData.leagues.length === 0) && (
            <Card className="shadow-lg"><CardHeader><CardTitle className="text-accent">Keine Ligen für {pageTitle}</CardTitle></CardHeader>
              <CardContent className="text-center py-12 p-6">
                 <AlertTriangle className="mx-auto h-10 w-10 mb-3 text-primary/70" />
                <p className="text-lg text-muted-foreground">
                    Für {selectedCompetition?.displayName || pageTitle} wurden keine Ligen mit Status "Laufend" gefunden, oder es sind keine Ergebnisse vorhanden.
                </p>
                 <p className="text-sm mt-1">Bitte überprüfen Sie den Status der Saison in der <Link href="/admin/seasons" className="underline hover:text-primary">Saisonverwaltung</Link>.</p>
              </CardContent>
            </Card>
          )}
          {!loading && !error && teamData && teamData.leagues.length > 0 && (
            <Accordion 
              type="multiple" 
              value={openAccordionItems} 
              onValueChange={handleAccordionValueChange} 
              className="w-full space-y-4"
            >
              {teamData.leagues.map((league) => (
                <AccordionItem value={league.id} key={league.id} className="border bg-card shadow-lg rounded-lg overflow-hidden">
                  <AccordionTrigger className="bg-accent/10 hover:bg-accent/20 px-6 py-4 text-xl font-semibold text-accent data-[state=open]:border-b">
                    {league.name} {league.shortName && `(${league.shortName})`}
                  </AccordionTrigger>
                  <AccordionContent className="pt-0"> {/* AccordionContent rendert das div für pb-4 pt-0 schon */}
                    {league.teams.length > 0 ? (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted/50">
                                <TableHead className="w-[50px] text-center">#</TableHead>
                                <TableHead className="min-w-[150px]">Mannschaft</TableHead>
                                {[...Array(currentNumRoundsState)].map((_, i) => (<TableHead key={`dg${i + 1}`} className="text-center w-[60px]">DG {i + 1}</TableHead>))}
                                <TableHead className="text-center font-semibold w-[80px]">Gesamt</TableHead>
                                <TableHead className="text-center font-semibold w-[80px]">Schnitt</TableHead>
                                <TableHead className="w-[60px] text-right pr-4"></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {league.teams.sort((a,b) => (a.rank || 999) - (b.rank || 999)).map((team) => (
                              <React.Fragment key={team.id}>
                                <TableRow className="hover:bg-secondary/20 transition-colors">
                                    <TableCell className="text-center font-medium">{team.rank}</TableCell>
                                    <TableCell className="font-medium text-foreground">{team.name}</TableCell>
                                    {[...Array(currentNumRoundsState)].map((_, i) => (<TableCell key={`dg${i + 1}-${team.id}`} className="text-center">{(team.roundResults as any)?.[`dg${i + 1}`] ?? '-'}</TableCell>))}
                                    <TableCell className="text-center font-semibold text-primary">{team.totalScore ?? '-'}</TableCell>
                                    <TableCell className="text-center font-medium text-muted-foreground">{team.averageScore != null ? team.averageScore.toFixed(2) : '-'}</TableCell>
                                    <TableCell className="text-right pr-4">
                                      <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        onClick={() => toggleTeamExpansion(team.id)}
                                        aria-label={`Details für ${team.name} ${expandedTeamIds.includes(team.id) ? 'ausblenden' : 'anzeigen'}`}
                                        className="hover:bg-accent/20 rounded-md"
                                      >
                                        {expandedTeamIds.includes(team.id) ? <ChevronDown className="h-5 w-5 transition-transform duration-200 rotate-180" /> : <ChevronRight className="h-5 w-5 transition-transform duration-200" />}
                                      </Button>
                                    </TableCell>
                                </TableRow>
                                {expandedTeamIds.includes(team.id) && (
                                  <TableRow className="bg-background/5 hover:bg-background/10 border-b">
                                    <TableCell colSpan={6 + currentNumRoundsState} className="p-0 border-t-0">
                                      <TeamShootersTable shootersResults={team.shootersResults} numRounds={currentNumRoundsState} />
                                    </TableCell>
                                  </TableRow>
                                )}
                              </React.Fragment>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <p className="p-4 text-center text-muted-foreground">Keine Mannschaften in dieser Liga für {pageTitle} vorhanden.</p>
                    )}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </TabsContent>

        <TabsContent value="einzelschützen">
          {loading && !individualData.length && renderLoadingSkeleton("einzelschützen")}
          {!loading && !error && individualData.length === 0 && (
            <Card className="shadow-lg">
                <CardHeader><CardTitle className="text-accent">Keine Einzelschützen für {pageTitle}</CardTitle></CardHeader>
              <CardContent className="text-center py-12 p-6">
                 <AlertTriangle className="mx-auto h-10 w-10 mb-3 text-primary/70" />
                <p className="text-lg text-muted-foreground">
                    Für {pageTitle} wurden keine Einzelschützenergebnisse gefunden oder es gibt keine Saisons mit Status "Laufend".
                </p>
                <p className="text-sm mt-1">Bitte überprüfen Sie den Status der Saison in der <Link href="/admin/seasons" className="underline hover:text-primary">Saisonverwaltung</Link>.</p>
              </CardContent>
            </Card>
          )}
          {!loading && !error && individualData.length > 0 && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {topMaleShooter && (
                  <Card className="shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-lg font-medium text-primary">Bester Schütze</CardTitle>
                      <Trophy className="h-5 w-5 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">{topMaleShooter.shooterName}</p>
                      <p className="text-sm text-muted-foreground">{topMaleShooter.teamName}</p>
                      <p className="text-lg">Gesamt: <span className="font-semibold">{topMaleShooter.totalScore}</span> Ringe</p>
                      <p className="text-sm">Schnitt: {topMaleShooter.averageScore != null ? topMaleShooter.averageScore.toFixed(2) : '-'} ({topMaleShooter.roundsShot} DG)</p>
                    </CardContent>
                  </Card>
                )}
                 {topFemaleShooter && (
                  <Card className="shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-lg font-medium text-primary">Beste Dame</CardTitle>
                      <Medal className="h-5 w-5 text-pink-500" />
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">{topFemaleShooter.shooterName}</p>
                      <p className="text-sm text-muted-foreground">{topFemaleShooter.teamName}</p>
                      <p className="text-lg">Gesamt: <span className="font-semibold">{topFemaleShooter.totalScore}</span> Ringe</p>
                      <p className="text-sm">Schnitt: {topFemaleShooter.averageScore != null ? topFemaleShooter.averageScore.toFixed(2) : '-'} ({topFemaleShooter.roundsShot} DG)</p>
                    </CardContent>
                  </Card>
                )}
                 {(!topMaleShooter && !topFemaleShooter && !loading) && (
                     <Card className="shadow-lg md:col-span-2">
                        <CardHeader><CardTitle className="text-accent">Keine Top-Schützen</CardTitle></CardHeader>
                        <CardContent><p className="text-muted-foreground">Für die aktuelle Auswahl konnten keine besten Schützen ermittelt werden.</p></CardContent>
                     </Card>
                 )}
              </div>

              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-xl text-accent">Einzelrangliste</CardTitle>
                  <CardDescription>Alle Schützen sortiert nach Gesamtergebnis für {pageTitle}.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader><TableRow className="bg-muted/50">
                          <TableHead className="w-[40px] text-center">#</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Mannschaft</TableHead>
                          {[...Array(currentNumRoundsState)].map((_, i) => (<TableHead key={`ind-dg${i + 1}`} className="text-center w-[60px]">DG {i + 1}</TableHead>))}
                          <TableHead className="text-center font-semibold w-[80px]">Gesamt</TableHead>
                          <TableHead className="text-center font-semibold w-[80px]">Schnitt</TableHead>
                      </TableRow></TableHeader>
                      <TableBody>
                        {individualData.map(shooter => (
                          <TableRow key={shooter.shooterId} className="hover:bg-secondary/20 transition-colors">
                              <TableCell className="text-center font-medium">{shooter.rank}</TableCell>
                              <TableCell className="font-medium text-foreground">
                                <Button variant="link" className="p-0 h-auto text-base text-left hover:text-primary whitespace-normal text-wrap" onClick={() => handleShooterNameClick(shooter)}>
                                  {shooter.shooterName}
                                </Button>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">{shooter.teamName}</TableCell>
                              {[...Array(currentNumRoundsState)].map((_, i) => (<TableCell key={`ind-dg${i + 1}-${shooter.shooterId}`} className="text-center">{shooter.results?.[`dg${i + 1}`] ?? '-'}</TableCell>))}
                              <TableCell className="text-center font-semibold text-primary">{shooter.totalScore}</TableCell>
                              <TableCell className="text-center font-medium text-muted-foreground">{shooter.averageScore != null ? shooter.averageScore.toFixed(2) : '-'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={isShooterDetailModalOpen} onOpenChange={setIsShooterDetailModalOpen}>
        <DialogContent className="sm:max-w-2xl">
            {selectedShooterForDetail && (
                 <ShooterDetailModalContent
                    shooterData={selectedShooterForDetail}
                    numRounds={currentNumRoundsState}
                />
            )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Suspense Boundary für die gesamte Seite, da useSearchParams verwendet wird
export default function RwkTabellenPage() {
  return (
    <Suspense fallback={<RwkTabellenPageLoadingSkeleton />}>
      <RwkTabellenPageComponent />
    </Suspense>
  );
}

// Eine einfache Skeleton-Komponente für den Ladezustand der gesamten Seite
const RwkTabellenPageLoadingSkeleton = () => {
  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center space-x-3">
          <TableIcon className="h-8 w-8 text-primary" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Skeleton className="h-10 w-full sm:w-[180px]" />
          <Skeleton className="h-10 w-full sm:w-[220px]" />
        </div>
      </div>
      <div className="grid w-full grid-cols-2 md:w-1/2 lg:w-1/3 mb-6">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
      <Card className="shadow-lg">
        <CardHeader>
          <Skeleton className="h-7 w-1/2" />
          <Skeleton className="h-4 w-3/4 mt-2" />
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="ml-3 text-lg">Lade Tabellendaten...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

    