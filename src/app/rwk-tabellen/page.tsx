
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
import { uiDisciplineFilterOptions, getUIDisciplineValueFromSpecificType, leagueDisciplineOptions } from '@/types/rwk';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { db } from '@/lib/firebase/config';
import { collection, doc, getDoc, getDocs, query, where, orderBy, limit as firestoreLimit } from 'firebase/firestore';
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line, ReferenceLine } from 'recharts';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const TEAM_SIZE_FOR_SCORING = 3;
const EXCLUDED_TEAM_NAME = "SV Dörrigsen Einzel"; // Mannschaft, die nicht in Tabellen erscheinen soll

async function fetchAvailableYearsFromSeasons(): Promise<number[]> {
  console.log("RWK-TABLE: fetchAvailableYearsFromSeasons called");
  try {
    const seasonsColRef = collection(db, "seasons");
    // Lade alle Saisons, um die Jahre für das Dropdown zu bekommen, unabhängig vom Status
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
    return [new Date().getFullYear()]; // Fallback
  }
}

async function fetchCompetitionTeamData(config: CompetitionDisplayConfig, numRoundsForCompetition: number): Promise<AggregatedCompetitionData | null> {
  console.log(`RWK-TABLE: fetchCompetitionTeamData for year ${config.year}, UI discipline ${config.discipline}`);
  try {
    const seasonsColRef = collection(db, "seasons");
    const qSeasons = query(seasonsColRef,
      where("competitionYear", "==", config.year),
      where("type", "==", config.discipline),
      where("status", "==", "Laufend") // Nur laufende Saisons für die Tabellenansicht
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
    let fetchedLeaguesData: LeagueDisplay[] = [];
    
    // Firestore 'in' query has a limit of 30 items for array comparisons.
    // Chunking season IDs and discipline types if necessary, though usually not for this scenario.
    const MAX_IN_ITEMS = 30; 
    const seasonIdChunks: string[][] = [];
    for (let i = 0; i < laufendeSeasonIds.length; i += MAX_IN_ITEMS) {
        seasonIdChunks.push(laufendeSeasonIds.slice(i, i + MAX_IN_ITEMS));
    }
    const disciplineChunks: FirestoreLeagueSpecificDiscipline[][] = [];
     for (let i = 0; i < firestoreDisciplinesToQuery.length; i += MAX_IN_ITEMS) {
        disciplineChunks.push(firestoreDisciplinesToQuery.slice(i, i + MAX_IN_ITEMS));
    }

    for (const seasonChunk of seasonIdChunks) {
      for (const discChunk of disciplineChunks) {
        if (seasonChunk.length === 0 || discChunk.length === 0) continue;

        const qLeagues = query(leaguesColRef,
            where("seasonId", "in", seasonChunk),
            where("type", "in", discChunk), // Filtert nach spezifischen Disziplinen der UI Auswahl
            orderBy("order", "asc")
        );
        const leaguesSnapshot = await getDocs(qLeagues);
        console.log(`RWK-TABLE: Fetched ${leaguesSnapshot.docs.length} leagues for a chunk (Season IDs: ${seasonChunk.join(',')}, Disc Types: ${discChunk.join(',')}).`);

        const clubCache = new Map<string, string>();
        const shooterCache = new Map<string, Shooter>();
      
        for (const leagueDoc of leaguesSnapshot.docs) {
          const leagueData = leagueDoc.data() as Omit<League, 'id' | 'teams'>;
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
            where("competitionYear", "==", config.year) // Zusätzliche Sicherheit, obwohl seasonId das schon abdeckt
          );
          const teamsSnapshot = await getDocs(qTeams);

          for (const teamDoc of teamsSnapshot.docs) {
            const teamData = teamDoc.data() as Team;
            if (teamData.name === EXCLUDED_TEAM_NAME) continue;

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
                  }
                } catch (clubError) { console.error(`RWK-TABLE: Error fetching club ${teamData.clubId}:`, clubError); }
              }
            }
            
            const team: TeamDisplay = {
              id: teamDoc.id,
              name: teamData.name,
              clubId: teamData.clubId,
              leagueId: teamData.leagueId,
              seasonId: teamData.seasonId, 
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
              numScoredRounds: 0,
            };
            
            const shooterIdsForTeam = teamData.shooterIds || [];
            if (shooterIdsForTeam.length > 0) {
                const shooterIdChunksForScores: string[][] = [];
                for (let i = 0; i < shooterIdsForTeam.length; i += MAX_IN_ITEMS) { // Max 30 IDs pro 'in' query
                    shooterIdChunksForScores.push(shooterIdsForTeam.slice(i, i + MAX_IN_ITEMS));
                }

                const teamScoresSnapshots = await Promise.all(
                    shooterIdChunksForScores.map(chunk => 
                        getDocs(query(collection(db, "rwk_scores"),
                            where("teamId", "==", team.id), 
                            where("competitionYear", "==", team.competitionYear), 
                            where("shooterId", "in", chunk.length > 0 ? chunk : ["_dummy_"]) // Firestore 'in' needs non-empty array
                        ))
                    )
                );
                
                const allTeamScoresDocs = teamScoresSnapshots.flatMap(snap => snap.docs);
                const scoresByShooter = new Map<string, ScoreEntry[]>();
                allTeamScoresDocs.forEach(scoreDoc => {
                    const score = scoreDoc.data() as ScoreEntry;
                    if (!scoresByShooter.has(score.shooterId)) scoresByShooter.set(score.shooterId, []);
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
                              console.warn(`Shooter with ID ${shooterId} not found in rwk_shooters for team ${team.name}`);
                            }
                        } catch (shooterError) { console.error(`Error fetching shooter ${shooterId}:`, shooterError); }
                    }
                    const shooterName = shooterInfo?.name || `Schütze ${shooterId.substring(0,5)}`;
                    const shooterGender = shooterInfo?.gender || 'unknown';

                    const sResults: ShooterDisplayResults = {
                        shooterId: shooterId, shooterName: shooterName, shooterGender: shooterGender,
                        results: {}, average: null, total: 0, roundsShot: 0,
                        teamId: team.id, leagueId: league.id, competitionYear: team.competitionYear,
                    };
                    for (let r = 1; r <= numRoundsForCompetition; r++) sResults.results[`dg${r}`] = null;

                    (scoresByShooter.get(shooterId) || []).forEach(score => {
                        if (score.durchgang >= 1 && score.durchgang <= numRoundsForCompetition && typeof score.totalRinge === 'number') {
                            sResults.results[`dg${score.durchgang}`] = score.totalRinge;
                        }
                    });
                    
                    let currentTotal = 0; let roundsShotCount = 0;
                    Object.values(sResults.results).forEach(res => {
                        if (res !== null && typeof res === 'number') { currentTotal += res; roundsShotCount++; }
                    });
                    sResults.total = currentTotal; sResults.roundsShot = roundsShotCount;
                    if (sResults.roundsShot > 0 && sResults.total !== null) {
                        sResults.average = parseFloat((sResults.total / sResults.roundsShot).toFixed(2));
                    }
                    team.shootersResults.push(sResults);
                }
                 team.shootersResults.sort((a, b) => (b.total ?? 0) - (a.total ?? 0) || a.shooterName.localeCompare(b.shooterName) );
            }

            let roundResultsTemp: { [key: string]: number[] } = {};
            for (let r = 1; r <= numRoundsForCompetition; r++) roundResultsTemp[`dg${r}`] = [];

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
              const scoresForRound = roundResultsTemp[roundKey].sort((a, b) => b - a); 
              let roundSum = 0;
              let contributingScoresCount = 0;
              for (let scoreIdx = 0; scoreIdx < Math.min(scoresForRound.length, TEAM_SIZE_FOR_SCORING); scoreIdx++) {
                  roundSum += scoresForRound[scoreIdx];
                  contributingScoresCount++;
              }

              if (contributingScoresCount === TEAM_SIZE_FOR_SCORING) { // Ergebnis nur gültig, wenn 3 Schützen gewertet wurden
                  team.roundResults[roundKey] = roundSum;
              } else if (contributingScoresCount > 0 && contributingScoresCount < TEAM_SIZE_FOR_SCORING) {
                  team.roundResults[roundKey] = null; // Oder einen Indikator für "unvollständig"
              } else {
                team.roundResults[roundKey] = null; // Keine Ergebnisse für diese Runde
              }
            }

            let teamTotalScore = 0; let numScoredRoundsForAvg = 0;
            Object.values(team.roundResults).forEach(scoreVal => {
              if (scoreVal !== null && typeof scoreVal === 'number') { teamTotalScore += scoreVal; if(scoreVal > 0) numScoredRoundsForAvg++; }
            });
            team.totalScore = teamTotalScore; team.numScoredRounds = numScoredRoundsForAvg;
            team.averageScore = numScoredRoundsForAvg > 0 ? parseFloat((teamTotalScore / numScoredRoundsForAvg).toFixed(2)) : null;
            teamDisplays.push(team);
          }
          // Sort teams within a league by totalScore, then averageScore
          teamDisplays.sort((a, b) => (b.totalScore ?? 0) - (a.totalScore ?? 0) || (b.averageScore ?? 0) - (a.averageScore ?? 0) || a.clubName.localeCompare(b.clubName) || a.name.localeCompare(b.name) );
          teamDisplays.forEach((team, index) => { team.rank = index + 1; }); // Assign rank
          league.teams = teamDisplays;
          fetchedLeaguesData.push(league);
        }
      }
    }
    
    console.log(`RWK-TABLE: fetchCompetitionTeamData returning ${fetchedLeaguesData.length} leagues for config`, config);
    return { id: `${config.year}-${config.discipline}`, config, leagues: fetchedLeaguesData };
  } catch (error) {
    console.error("RWK-TABLE: Error fetching team data:", error);
    throw error; 
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
        console.warn(`RWK-TABLE: No 'Laufend' seasons for individual data: year ${config.year}, disc ${config.discipline}`);
        return [];
    }
    const laufendeSeasonIds = seasonsSnapshot.docs.map(s => s.id);

    const selectedUIDiscOption = uiDisciplineFilterOptions.find(opt => opt.value === config.discipline);
    const firestoreDisciplinesToQuery: FirestoreLeagueSpecificDiscipline[] = selectedUIDiscOption ? selectedUIDiscOption.firestoreTypes : [];
    if (firestoreDisciplinesToQuery.length === 0) {
        console.warn(`RWK-TABLE: No specific Firestore disciplines for individual data: UI disc ${config.discipline}`);
        return [];
    }

    const leaguesColRef = collection(db, "rwk_leagues");
    let relevantLeagueIds: string[] = [];
    // Chunking for 'in' queries if many season IDs or discipline types (though usually not an issue here)
    const MAX_IN_ITEMS = 30;
    const seasonIdChunks: string[][] = [];
    for (let i = 0; i < laufendeSeasonIds.length; i += MAX_IN_ITEMS) {
        seasonIdChunks.push(laufendeSeasonIds.slice(i, i + MAX_IN_ITEMS));
    }
    const disciplineChunks: FirestoreLeagueSpecificDiscipline[][] = [];
     for (let i = 0; i < firestoreDisciplinesToQuery.length; i += MAX_IN_ITEMS) {
        disciplineChunks.push(firestoreDisciplinesToQuery.slice(i, i + MAX_IN_ITEMS));
    }

    for (const seasonChunk of seasonIdChunks) {
      for (const discChunk of disciplineChunks) {
        if (seasonChunk.length > 0 && discChunk.length > 0) {
          const qLeaguesForDiscipline = query(leaguesColRef,
              where("seasonId", "in", seasonChunk),
              where("type", "in", discChunk)
          );
          const leaguesSnap = await getDocs(qLeaguesForDiscipline);
          leaguesSnap.docs.forEach(lDoc => relevantLeagueIds.push(lDoc.id));
        }
      }
    }
    relevantLeagueIds = Array.from(new Set(relevantLeagueIds)); // Make unique
    if (relevantLeagueIds.length === 0) {
        console.warn(`RWK-TABLE: No relevant league IDs for individual data based on UI disc ${config.discipline} and its specific types.`);
        return [];
    }
    console.log(`RWK-TABLE: Relevant league IDs for individual data: ${relevantLeagueIds.join(', ')}`);


    const scoresColRef = collection(db, "rwk_scores");
    let allScores: ScoreEntry[] = [];
    // Chunking for the 'in' query on leagueId
    const leagueIdChunksForScores: string[][] = [];
    for (let i = 0; i < relevantLeagueIds.length; i += MAX_IN_ITEMS) {
        leagueIdChunksForScores.push(relevantLeagueIds.slice(i, i + MAX_IN_ITEMS));
    }

    for (const chunk of leagueIdChunksForScores) {
        if (chunk.length > 0) { // Ensure chunk is not empty before querying
            const scoresQuery = query(scoresColRef, 
                where("competitionYear", "==", config.year), 
                where("leagueId", "in", chunk) 
                // orderBy("shooterId"), orderBy("durchgang") // Optional: For more structured processing if needed
            );
            const scoresSnapshot = await getDocs(scoresQuery);
            scoresSnapshot.docs.forEach(d => {
                const scoreData = d.data() as ScoreEntry;
                if (scoreData.teamName !== EXCLUDED_TEAM_NAME) { // Exclude specific team's scores
                    allScores.push({ id: d.id, ...scoreData });
                }
            });
        }
    }
    
    const shootersMap = new Map<string, IndividualShooterDisplayData>();
    // Populate shooter data from scores
    for (const score of allScores) {
      if (!shootersMap.has(score.shooterId)) {
        const initialResults: { [key: string]: number | null } = {};
        for (let r = 1; r <= numRoundsForCompetition; r++) initialResults[`dg${r}`] = null;
        
        shootersMap.set(score.shooterId, {
          shooterId: score.shooterId,
          shooterName: score.shooterName || "Unbek. Schütze",
          shooterGender: score.shooterGender ? score.shooterGender.toLowerCase() : 'unknown',
          teamName: score.teamName || "Unbek. Team", // Use teamName from the score entry
          results: initialResults,
          totalScore: 0,
          averageScore: null,
          roundsShot: 0,
          competitionYear: score.competitionYear,
        });
      }

      const shooterData = shootersMap.get(score.shooterId)!;
       // Prioritize 'female' if found in any score for that shooter
      if (score.shooterGender && (score.shooterGender.toLowerCase() === 'female' || score.shooterGender.toLowerCase() === 'w')) {
        shooterData.shooterGender = 'female';
      } else if (shooterData.shooterGender === 'unknown' && score.shooterGender && (score.shooterGender.toLowerCase() === 'male' || score.shooterGender.toLowerCase() === 'm')) {
        shooterData.shooterGender = 'male';
      } else if (shooterData.shooterGender === 'unknown' && score.shooterGender) {
        shooterData.shooterGender = score.shooterGender; // Fallback for other gender values
      }


      if (score.durchgang >= 1 && score.durchgang <= numRoundsForCompetition && typeof score.totalRinge === 'number') {
        shooterData.results[`dg${score.durchgang}`] = score.totalRinge;
      }
    }

    // Calculate totals and averages
    shootersMap.forEach(shooterData => {
      let currentTotal = 0; let roundsShotCount = 0;
      Object.values(shooterData.results).forEach(res => {
        if (res !== null && typeof res === 'number') { currentTotal += res; roundsShotCount++; }
      });
      shooterData.totalScore = currentTotal; shooterData.roundsShot = roundsShotCount;
      if (shooterData.roundsShot > 0) {
        shooterData.averageScore = parseFloat((shooterData.totalScore / shooterData.roundsShot).toFixed(2));
      }
    });

    // Filter out shooters with no rounds shot and then sort
    const rankedShooters = Array.from(shootersMap.values())
      .filter(s => s.roundsShot > 0) // Only include shooters who have shot at least one round
      .sort((a, b) => (b.totalScore ?? 0) - (a.totalScore ?? 0) || (b.averageScore ?? 0) - (a.averageScore ?? 0) || a.shooterName.localeCompare(b.shooterName));
    
    rankedShooters.forEach((shooter, index) => { shooter.rank = index + 1; }); // Assign rank
    console.log(`RWK-TABLE: fetchIndividualShooterData returning ${rankedShooters.length} shooters.`);
    return rankedShooters;
  } catch (error) {
    console.error("RWK-TABLE: Error fetching individual shooter data:", error);
    throw error; 
  }
}


const TeamShootersTable: React.FC<{ 
    shootersResults: ShooterDisplayResults[], 
    numRounds: number, 
    parentTeam: TeamDisplay, // Pass the parent team for context
    onShooterClick: (shooterData: IndividualShooterDisplayData) => void // Callback to open modal
}> = ({ shootersResults, numRounds, parentTeam, onShooterClick }) => {
  if (!shootersResults || shootersResults.length === 0) {
    return <p className="p-3 text-sm text-center text-muted-foreground bg-muted/10">Keine Schützen für dieses Team erfasst oder Ergebnisse vorhanden.</p>;
  }
  return (
    <div className="overflow-x-auto bg-secondary/20 p-2 rounded-md">
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
          {shootersResults.map(shooterRes => {
             // Prepare data for the modal click
            const shooterDataForModal: IndividualShooterDisplayData = {
                shooterId: shooterRes.shooterId,
                shooterName: shooterRes.shooterName,
                shooterGender: shooterRes.shooterGender,
                teamName: parentTeam.name, // Use parent team's name
                results: shooterRes.results,
                totalScore: shooterRes.total || 0,
                averageScore: shooterRes.average,
                roundsShot: shooterRes.roundsShot,
                competitionYear: parentTeam.competitionYear, // Use parent team's year
                rank: undefined, // Rank is not relevant for this modal view from team table
            };
            return (
                <TableRow key={shooterRes.shooterId} className="text-sm border-b-0 hover:bg-muted/40">
                <TableCell className="font-medium pl-3 pr-1 py-1.5 whitespace-nowrap">
                    <Button 
                        variant="link" 
                        className="p-0 h-auto text-sm text-left hover:text-primary whitespace-normal text-wrap"
                        onClick={() => onShooterClick(shooterDataForModal)}
                    >
                        {shooterRes.shooterName}
                    </Button>
                </TableCell>
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
            );
          })}
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
    chartData.push({ name: `DG ${i}`, Ringe: typeof scoreValue === 'number' ? scoreValue : null });
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-2xl text-primary">{shooterData.shooterName}</DialogTitle>
        <DialogDescription>
          {shooterData.teamName} - Ergebnisse der Saison {shooterData.competitionYear || ""} 
          {shooterData.rank && ` (Rang: ${shooterData.rank})`}
        </DialogDescription>
      </DialogHeader>
      <div className="mt-4 grid gap-6">
        <div>
          <h3 className="text-lg font-semibold mb-2 text-accent">Ergebnisübersicht</h3>
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
        {chartData.some(d => d.Ringe !== null && d.Ringe > 0) && ( // Only show chart if there's data
          <div>
            <h3 className="text-lg font-semibold mb-3 text-accent">Leistungsdiagramm</h3>
            <div className="h-[300px] w-full bg-muted/30 p-4 rounded-lg shadow-inner">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} domain={['dataMin - 5', 'dataMax + 5']} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', borderRadius: 'var(--radius)'}}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                    formatter={(value: any) => value === null ? "-" : value} // Handle null for tooltip
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


function RwkTabellenPageComponent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [availableYearsFromDb, setAvailableYearsFromDb] = useState<number[]>([]);
  const [selectedCompetition, setSelectedCompetition] = useState<CompetitionDisplayConfig | null>(null);
  const [activeTab, setActiveTab] = useState<"mannschaften" | "einzelschützen">("mannschaften");

  const [teamData, setTeamData] = useState<AggregatedCompetitionData | null>(null);
  const [individualData, setIndividualData] = useState<IndividualShooterDisplayData[]>([]);
  const [topMaleShooter, setTopMaleShooter] = useState<IndividualShooterDisplayData | null>(null);
  const [topFemaleShooter, setTopFemaleShooter] = useState<IndividualShooterDisplayData | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const [currentNumRoundsState, setCurrentNumRoundsState] = useState<number>(5); // Default to KK rounds
  const [openAccordionItems, setOpenAccordionItems] = useState<string[]>([]); 
  const [expandedTeamIds, setExpandedTeamIds] = useState<string[]>([]); 

  const [isShooterDetailModalOpen, setIsShooterDetailModalOpen] = useState(false);
  const [selectedShooterForDetail, setSelectedShooterForDetail] = useState<IndividualShooterDisplayData | null>(null);
  const [isLoadingInitialYears, setIsLoadingInitialYears] = useState(true);


  useEffect(() => {
    let isMounted = true;
    setIsLoadingInitialYears(true);
    console.log("RWK-TABLE: Initial useEffect for years and params.");

    fetchAvailableYearsFromSeasons().then(dbYears => {
      if (!isMounted) return;
      setAvailableYearsFromDb(dbYears);
      console.log("RWK-TABLE: Available years from DB after fetch:", dbYears);

      const paramYearStr = searchParams.get('year');
      const paramDiscipline = searchParams.get('discipline') as UIDisciplineSelection | null;
      const paramLeague = searchParams.get('league');

      let initialYear: number;
      const currentActualYear = new Date().getFullYear();

      if (paramYearStr && !isNaN(parseInt(paramYearStr)) && dbYears.includes(parseInt(paramYearStr))) {
        initialYear = parseInt(paramYearStr);
      } else if (dbYears.includes(currentActualYear)) {
        initialYear = currentActualYear;
      } else if (dbYears.length > 0) {
        initialYear = dbYears[0]; // Fallback to the latest year from DB if current year not found
      } else {
        initialYear = currentActualYear; // Ultimate fallback
      }
      console.log("RWK-TABLE: Determined initialYear:", initialYear);

      const initialDiscipline: UIDisciplineSelection = 
        paramDiscipline && uiDisciplineFilterOptions.some(d => d.value === paramDiscipline)
        ? paramDiscipline
        : uiDisciplineFilterOptions[0]?.value || 'KK'; // Fallback to first UI discipline
      
      const disciplineLabelObj = uiDisciplineFilterOptions.find(d => d.value === initialDiscipline);
      const disciplineLabel = disciplineLabelObj ? disciplineLabelObj.label.replace(/\s*\(.*\)\s*$/, '').trim() : initialDiscipline;
            
      setSelectedCompetition({ year: initialYear, discipline: initialDiscipline, displayName: `RWK ${initialYear} ${disciplineLabel}` });
      
      if (paramLeague && typeof paramLeague === 'string') {
        console.log("RWK-TABLE: League param found in URL, setting for accordion:", paramLeague);
        setOpenAccordionItems([paramLeague]); // Set initial league to open if passed in URL
      }
      setIsLoadingInitialYears(false);
    }).catch(err => {
      if(isMounted) {
        console.error("RWK-TABLE: Error in initial year/discipline setup:", err);
        setError("Fehler beim Initialisieren der Jahresauswahl.");
        setIsLoadingInitialYears(false);
        // Fallback selection
        const fallbackYear = new Date().getFullYear();
        const fallbackDiscipline = uiDisciplineFilterOptions[0]?.value || 'KK';
        const fallbackLabelObj = uiDisciplineFilterOptions.find(d => d.value === fallbackDiscipline);
        const fallbackLabel = fallbackLabelObj ? fallbackLabelObj.label.replace(/\s*\(.*\)\s*$/, '').trim() : fallbackDiscipline;
        setSelectedCompetition({ year: fallbackYear, discipline: fallbackDiscipline, displayName: `RWK ${fallbackYear} ${fallbackLabel}` });
      }
    });
    return () => { isMounted = false; };
  }, [searchParams]); // searchParams is the key dependency here for reacting to URL changes


  const calculateNumRounds = useCallback(async (year: number, uiDiscipline: UIDisciplineSelection): Promise<number> => {
    console.log("RWK-TABLE: Calculating numRounds for year:", year, "discipline:", uiDiscipline);
    try {
      // Find a season matching year and UI discipline to infer round count from one of its leagues
      const seasonsQuery = query(collection(db, "seasons"),
        where("competitionYear", "==", year),
        where("type", "==", uiDiscipline), 
        where("status", "==", "Laufend"),
        firestoreLimit(1) 
      );
      const seasonsSnapForRounds = await getDocs(seasonsQuery);
      if (!seasonsSnapForRounds.empty) {
          const firstSeasonDocId = seasonsSnapForRounds.docs[0].id;
          // Get any league from this season to check its specific type
          const leagueForRoundsQuery = query(collection(db, "rwk_leagues"), 
            where("seasonId", "==", firstSeasonDocId), 
            firestoreLimit(1)
          );
          const leagueSnap = await getDocs(leagueForRoundsQuery);
          if(!leagueSnap.empty){
              const leagueData = leagueSnap.docs[0].data() as League;
              const specificType = leagueData.type; // This is FirestoreLeagueSpecificDiscipline ('KKG', 'LGA', etc.)
              // Define which specific types use 4 rounds
              const fourRoundDisciplines: FirestoreLeagueSpecificDiscipline[] = ['LG', 'LGA', 'LP', 'LPA'];
              if (fourRoundDisciplines.includes(specificType)) {
                console.log("RWK-TABLE: NumRounds set to 4 for LD type:", specificType);
                return 4;
              }
          }
      }
    } catch (err) {
        console.error("RWK-TABLE: Error in calculateNumRounds, defaulting to 5:", err);
    }
    console.log("RWK-TABLE: NumRounds defaulting/set to 5 for KK or other types.");
    return 5; // Default for KK or if specific type not found/matched
  }, []);

  useEffect(() => {
    let isMounted = true;
    if (!selectedCompetition || isLoadingInitialYears) {
      if (isMounted && !isLoadingInitialYears) setLoading(false); 
      return;
    }

    const loadData = async () => {
      if(!isMounted) return;
      console.log("RWK-TABLE: LoadData useEffect triggered for competition:", selectedCompetition, "tab:", activeTab);
      setLoading(true);
      setError(null);
      // setExpandedTeamIds([]); // Reset expanded teams on tab or filter change
      
      try {
        const numRoundsForCurrentCompetition = await calculateNumRounds(selectedCompetition.year, selectedCompetition.discipline);
        if (!isMounted) return;
        setCurrentNumRoundsState(numRoundsForCurrentCompetition);
        console.log("RWK-TABLE: Number of rounds for current competition set to:", numRoundsForCurrentCompetition);

        if (activeTab === "mannschaften") {
          if(isMounted) setIndividualData([]); // Clear other tab's data
          const data = await fetchCompetitionTeamData(selectedCompetition, numRoundsForCurrentCompetition);
          if (!isMounted) return;
          setTeamData(data);
          // Open all leagues by default if no specific league was targeted by URL
          if (data && data.leagues && data.leagues.length > 0 && openAccordionItems.length === 0) {
             setOpenAccordionItems(data.leagues.map(league => league.id));
             console.log("RWK-TABLE: Defaulting to all leagues open.");
          } else if (data && (!data.leagues || data.leagues.length === 0)) {
             setOpenAccordionItems([]); // No leagues, so no open items.
          }
        } else if (activeTab === "einzelschützen") {
          if(isMounted) setTeamData(null); // Clear other tab's data
          const individuals = await fetchIndividualShooterData(selectedCompetition, numRoundsForCurrentCompetition);
          if (!isMounted) return;
          setIndividualData(individuals);
          if (individuals.length > 0) {
            const males = individuals.filter(s => s.shooterGender && (s.shooterGender.toLowerCase() === 'male' || s.shooterGender.toLowerCase() === 'm'));
            if(isMounted) setTopMaleShooter(males.length > 0 ? males[0] : null); 
            
            const females = individuals.filter(s => s.shooterGender && (s.shooterGender.toLowerCase() === 'female' || s.shooterGender.toLowerCase() === 'w'));
            if(isMounted) setTopFemaleShooter(females.length > 0 ? females[0] : null); 
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
      } finally {
        if(isMounted) setLoading(false);
      }
    };

    loadData();
    return () => { isMounted = false; };
  }, [selectedCompetition, activeTab, calculateNumRounds, isLoadingInitialYears, openAccordionItems]); // Added openAccordionItems


  const handleYearChange = useCallback(async (yearString: string) => {
    const year = parseInt(yearString, 10);
    if (!selectedCompetition || selectedCompetition.year === year || isNaN(year)) return;
    
    const newDiscipline = selectedCompetition.discipline; // Keep current discipline
    const newDisplayName = `RWK ${year} ${uiDisciplineFilterOptions.find(d => d.value === newDiscipline)?.label.replace(/\s*\(.*\)\s*$/, '').trim() || newDiscipline}`;
    
    // Update URL without league param, this will trigger initial useEffect
    router.push(`/rwk-tabellen?year=${year}&discipline=${newDiscipline}`, { scroll: false });
    setOpenAccordionItems([]); // Reset open leagues on year change
    setExpandedTeamIds([]); // Reset expanded teams
    // selectedCompetition will be updated by the main useEffect reacting to searchParams
  }, [selectedCompetition, router]);

  const handleDisciplineChange = useCallback(async (discipline: UIDisciplineSelection) => {
     if (!selectedCompetition || selectedCompetition.discipline === discipline) return;

     const newYear = selectedCompetition.year; // Keep current year
     const newDisplayName = `RWK ${newYear} ${uiDisciplineFilterOptions.find(d => d.value === discipline)?.label.replace(/\s*\(.*\)\s*$/, '').trim() || discipline}`;
     
     router.push(`/rwk-tabellen?year=${newYear}&discipline=${discipline}`, { scroll: false });
     setOpenAccordionItems([]); // Reset open leagues
     setExpandedTeamIds([]); // Reset expanded teams
     // selectedCompetition will be updated by the main useEffect reacting to searchParams
  }, [selectedCompetition, router]);
  
  const handleAccordionValueChange = (value: string[]) => {
    setOpenAccordionItems(value);
    const paramLeague = searchParams.get('league');
    // If user manually closes the league that was opened by URL param, remove it from URL
    if (paramLeague && !value.includes(paramLeague) && selectedCompetition) {
        router.push(`/rwk-tabellen?year=${selectedCompetition.year}&discipline=${selectedCompetition.discipline}`, { scroll: false });
    }
  };

  const toggleTeamExpansion = (teamId: string) => {
    setExpandedTeamIds(prev => 
      prev.includes(teamId) ? prev.filter(id => id !== teamId) : [...prev, teamId]
    );
  };

  const handleShooterNameClick = (shooter: IndividualShooterDisplayData) => {
    setSelectedShooterForDetail(shooter);
    setIsShooterDetailModalOpen(true);
  };

  const pageTitle = useMemo(() => {
      if (!selectedCompetition) return "RWK Tabellen";
      // Use uiDisciplineFilterOptions to get the label
      const discLabelObj = uiDisciplineFilterOptions.find(opt => opt.value === selectedCompetition.discipline);
      const discLabel = discLabelObj ? discLabelObj.label.replace(/\s*\(.*\)\s*$/, "").trim() : selectedCompetition.discipline;
      return `RWK ${selectedCompetition.year} ${discLabel}`;
  },[selectedCompetition]);


  if (isLoadingInitialYears || (!selectedCompetition && !error && availableYearsFromDb.length === 0)) { 
     return <RwkTabellenPageLoadingSkeleton title="RWK Tabellen laden..." />;
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
              <SelectValue placeholder={isLoadingInitialYears && availableYearsFromDb.length === 0 ? "Lade Jahre..." : (availableYearsFromDb.length === 0 ? "Keine Jahre" : "Jahr wählen")} />
            </SelectTrigger>
            <SelectContent>
              {availableYearsFromDb.length > 0 ? 
                availableYearsFromDb.map(year => (<SelectItem key={year} value={year.toString()}>{year}</SelectItem>))
                : <SelectItem value="NO_YEARS_PLACEHOLDER_RWK_TABLE_2" disabled>Keine Saisons aktiv</SelectItem> // Unique value
              }
            </SelectContent>
          </Select>
          <Select 
            value={selectedCompetition?.discipline || ""} 
            onValueChange={(value) => handleDisciplineChange(value as UIDisciplineSelection)}
            disabled={!selectedCompetition || loading || uiDisciplineFilterOptions.length === 0}
          >
            <SelectTrigger className="w-full sm:w-[220px] shadow-md">
              <SelectValue placeholder={uiDisciplineFilterOptions.length === 0 ? "Keine Disziplinen" : "Disziplin wählen"} />
            </SelectTrigger>
            <SelectContent>
              {uiDisciplineFilterOptions.map(disc => (
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
          {loading && <RwkTabellenPageLoadingSkeleton specificFor="Mannschaften" title={pageTitle} />}
          {!loading && error && (
            <Card className="shadow-lg border-destructive"><CardHeader><CardTitle className="text-destructive flex items-center"><AlertTriangle className="mr-2 h-5 w-5" />Daten konnten nicht geladen werden</CardTitle></CardHeader>
              <CardContent className="text-destructive-foreground bg-destructive/10 p-6">
                <p>Es gab ein Problem: {error}.</p>
                <p className="text-sm mt-1">Bitte sicherstellen, dass Saisons für das gewählte Jahr/Disziplin existieren, Status "Laufend" haben und alle Firestore-Indizes korrekt sind (siehe Browser-Konsole).</p>
              </CardContent>
            </Card>
          )}
          {!loading && !error && (!teamData || teamData.leagues.length === 0) && (
            <Card className="shadow-lg"><CardHeader><CardTitle className="text-accent">Keine Ligen für {pageTitle}</CardTitle></CardHeader>
              <CardContent className="text-center py-12 p-6">
                 <AlertTriangle className="mx-auto h-10 w-10 mb-3 text-primary/70" />
                <p className="text-lg text-muted-foreground">
                    Für {selectedCompetition?.displayName || pageTitle} wurden keine Ligen mit Status "Laufend" gefunden oder es sind keine Ergebnisse vorhanden.
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
                  <AccordionContent className="pt-0 data-[state=closed]:pb-0 data-[state=open]:pb-2">
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
                            {league.teams.map((team) => (
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
                                  <TableRow className="bg-transparent hover:bg-transparent border-b-0">
                                    <TableCell colSpan={6 + currentNumRoundsState} className="p-0 border-t-0"> {/* colSpan anpassen */}
                                      <TeamShootersTable 
                                        shootersResults={team.shootersResults} 
                                        numRounds={currentNumRoundsState} 
                                        parentTeam={team}
                                        onShooterClick={handleShooterNameClick}
                                      />
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
          {loading && <RwkTabellenPageLoadingSkeleton specificFor="Einzelschützen" title={pageTitle} />}
           {!loading && error && ( 
            <Card className="shadow-lg border-destructive"><CardHeader><CardTitle className="text-destructive flex items-center"><AlertTriangle className="mr-2 h-5 w-5" />Daten konnten nicht geladen werden</CardTitle></CardHeader>
              <CardContent className="text-destructive-foreground bg-destructive/10 p-6">
                <p>Es gab ein Problem: {error}.</p>
                 <p className="text-sm mt-1">Bitte sicherstellen, dass Saisons für das gewählte Jahr/Disziplin existieren, Status "Laufend" haben und alle Firestore-Indizes korrekt sind.</p>
              </CardContent>
            </Card>
          )}
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
        <DialogContent className="sm:max-w-2xl"> {/* Increased width for better chart display */}
            {selectedShooterForDetail && ( // Ensure data is present before rendering content
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


// Loading Skeleton Component
const RwkTabellenPageLoadingSkeleton: React.FC<{ title?: string, specificFor?: string }> = ({ title, specificFor }) => {
  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center space-x-3">
          <TableIcon className="h-8 w-8 text-primary" />
          <Skeleton className="h-8 w-48" /> {/* Placeholder for title */}
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Skeleton className="h-10 w-full sm:w-[180px]" /> {/* Placeholder for year select */}
          <Skeleton className="h-10 w-full sm:w-[220px]" /> {/* Placeholder for discipline select */}
        </div>
      </div>
      {/* Placeholder for TabsList */}
      <div className="grid w-full grid-cols-2 md:w-1/2 lg:w-1/3 mb-6 shadow-md">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
      
      {/* Placeholder for Content Area (e.g., Accordion or Table) */}
      <Card className="shadow-lg">
        <CardHeader>
            <Skeleton className="h-7 w-3/4 mb-1" /> {/* Placeholder for CardTitle */}
            <Skeleton className="h-4 w-1/2" /> {/* Placeholder for CardDescription */}
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => ( // Simulate a few loading items
                <div key={i} className="space-y-2">
                    <Skeleton className="h-6 w-1/3" /> 
                    <Skeleton className="h-10 w-full" /> 
                    <Skeleton className="h-10 w-full" />
                </div>
            ))}
          </div>
           <div className="flex flex-col items-center justify-center py-10 text-muted-foreground mt-6">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-lg">Lade Tabellendaten für {title || 'RWK Tabellen'}{specificFor ? ` (${specificFor})` : ''}...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};


export default function RwkTabellenPage() {
  return (
    <Suspense fallback={<RwkTabellenPageLoadingSkeleton title="RWK Tabellen" />}>
      <RwkTabellenPageComponent />
    </Suspense>
  );
}

    