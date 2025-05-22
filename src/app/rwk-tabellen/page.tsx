
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
import { Label } from '@/components/ui/label';
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
import { uiDisciplineFilterOptions, getUIDisciplineValueFromSpecificType } from '@/types/rwk';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { db } from '@/lib/firebase/config';
import { collection, doc, getDoc, getDocs, query, where, orderBy, Timestamp, limit } from 'firebase/firestore';
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line, ReferenceLine } from 'recharts';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const TEAM_SIZE_FOR_SCORING = 3;
const EXCLUDED_TEAM_NAME_PART = "einzel";

async function fetchAvailableYearsFromSeasons(): Promise<number[]> {
  try {
    const seasonsColRef = collection(db, "seasons");
    const qSeasons = query(seasonsColRef, orderBy("competitionYear", "desc"));
    const seasonsSnapshot = await getDocs(qSeasons);
    
    if (seasonsSnapshot.empty) {
      console.warn("RWK-TABLE: No seasons found in database. Defaulting to current year.");
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
      where("type", "==", config.discipline), // 'KK', 'LD', 'SP' from UIDisciplineSelection
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
        console.warn(`RWK-TABLE: No specific Firestore disciplines to query for UI discipline '${config.discipline}'. Returning empty leagues.`);
        return { id: `${config.year}-${config.discipline}`, config, leagues: [] };
    }

    console.log(`RWK-TABLE: Querying leagues with Firestore types: ${firestoreDisciplinesToQuery.join(', ')} for season IDs: ${laufendeSeasonIds.join(', ')}`);

    const leaguesColRef = collection(db, "rwk_leagues");
    let fetchedLeaguesData: LeagueDisplay[] = [];
    
    const MAX_IN_ITEMS = 10;
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
            where("type", "in", discChunk), 
            orderBy("order", "asc")
        );
        const leaguesSnapshot = await getDocs(qLeagues);
        console.log(`RWK-TABLE: Fetched ${leaguesSnapshot.docs.length} leagues for a chunk.`);

        const clubCache = new Map<string, string>();
        const shooterCache = new Map<string, Shooter>();
      
        for (const leagueDoc of leaguesSnapshot.docs) {
          const leagueData = leagueDoc.data() as Omit<League, 'id' | 'teams' | 'individualLeagueShooters'>;
          const league: LeagueDisplay = {
            id: leagueDoc.id,
            name: leagueData.name,
            shortName: leagueData.shortName,
            seasonId: leagueData.seasonId,
            competitionYear: leagueData.competitionYear,
            type: leagueData.type, 
            order: leagueData.order,
            teams: [],
            individualLeagueShooters: [], 
          };
          let teamDisplays: TeamDisplay[] = [];
          
          const teamsColRef = collection(db, "rwk_teams");
          const qTeams = query(teamsColRef,
            where("leagueId", "==", league.id),
            where("competitionYear", "==", config.year) // Ensure teams match the competition year
          );
          const teamsSnapshot = await getDocs(qTeams);

          for (const teamDoc of teamsSnapshot.docs) {
            const teamData = teamDoc.data() as Team;
             if (teamData.name && teamData.name.toLowerCase().includes(EXCLUDED_TEAM_NAME_PART)) {
                console.log("RWK-TABLE: Excluding team from Mannschaftsrangliste:", teamData.name);
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
                const validShooterIds = shooterIdsForTeam.filter(id => id && typeof id === 'string' && id.trim() !== '');
                if (validShooterIds.length > 0) {
                    const shooterIdChunksForScores: string[][] = [];
                    for (let i = 0; i < validShooterIds.length; i += MAX_IN_ITEMS) {
                        shooterIdChunksForScores.push(validShooterIds.slice(i, i + MAX_IN_ITEMS));
                    }

                    const teamScoresSnapshots = await Promise.all(
                        shooterIdChunksForScores.map(chunk => 
                            getDocs(query(collection(db, "rwk_scores"),
                                where("teamId", "==", team.id), 
                                where("competitionYear", "==", team.competitionYear), 
                                where("shooterId", "in", chunk) 
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

                    for (const shooterId of validShooterIds) {
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

              if (contributingScoresCount >= TEAM_SIZE_FOR_SCORING) {
                  team.roundResults[roundKey] = roundSum;
              } else if (contributingScoresCount > 0 && contributingScoresCount < TEAM_SIZE_FOR_SCORING) {
                  team.roundResults[roundKey] = null; 
              } else {
                team.roundResults[roundKey] = null;
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
          teamDisplays.sort((a, b) => (b.totalScore ?? 0) - (a.totalScore ?? 0) || (b.averageScore ?? 0) - (a.averageScore ?? 0) || a.clubName.localeCompare(b.clubName) || a.name.localeCompare(b.name) );
          teamDisplays.forEach((team, index) => { team.rank = index + 1; });
          league.teams = teamDisplays;
          
          const leagueShootersMap = new Map<string, ShooterDisplayResults>();
          league.teams.forEach(team => {
            team.shootersResults.forEach(sr => {
              if (leagueShootersMap.has(sr.shooterId)) {
                const existing = leagueShootersMap.get(sr.shooterId)!;
                if ((sr.roundsShot || 0) > (existing.roundsShot || 0)) { 
                    leagueShootersMap.set(sr.shooterId, sr);
                }
              } else {
                leagueShootersMap.set(sr.shooterId, sr);
              }
            });
          });
          league.individualLeagueShooters = Array.from(leagueShootersMap.values())
            .sort((a,b) => (b.total || 0) - (a.total || 0) || (b.average || 0) - (a.average || 0) || a.shooterName.localeCompare(b.shooterName));
          league.individualLeagueShooters.forEach((shooter, index) => { (shooter as any).rank = index + 1; });

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

async function fetchIndividualShooterData(
    config: CompetitionDisplayConfig, 
    numRoundsForCompetition: number,
    filterByLeagueId?: string | null 
): Promise<IndividualShooterDisplayData[]> {
  console.log(`RWK-TABLE: fetchIndividualShooterData for year ${config.year}, UI disc ${config.discipline}, League Filter: ${filterByLeagueId || 'ALL'}`);
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
    
    const selectedUIDiscOption = uiDisciplineFilterOptions.find(opt => opt.value === config.discipline);
    const firestoreDisciplinesToQuery: FirestoreLeagueSpecificDiscipline[] = selectedUIDiscOption ? selectedUIDiscOption.firestoreTypes : [];
    
    if (firestoreDisciplinesToQuery.length === 0 && config.discipline !== 'SP') {
        console.warn(`RWK-TABLE: fetchIndividualShooterData - No specific Firestore disciplines for UI discipline '${config.discipline}'.`);
        return [];
    }

    const scoresColRef = collection(db, "rwk_scores");
    let scoresQueryConstraints: any[] = [where("competitionYear", "==", config.year)];

    if (filterByLeagueId) {
        scoresQueryConstraints.push(where("leagueId", "==", filterByLeagueId));
    } else if (firestoreDisciplinesToQuery.length > 0) {
        // If no specific league is selected, filter by all relevant league types for the UI discipline.
        scoresQueryConstraints.push(where("leagueType", "in", firestoreDisciplinesToQuery));
    } else {
        console.warn("RWK-TABLE: fetchIndividualShooterData - Cannot effectively filter scores without a league or discipline types.");
        return [];
    }
    
    const scoresQuery = query(scoresColRef, ...scoresQueryConstraints);
    const scoresSnapshot = await getDocs(scoresQuery);
    const allScores: ScoreEntry[] = [];
    scoresSnapshot.docs.forEach(d => {
        const scoreData = d.data() as ScoreEntry;
        allScores.push({ id: d.id, ...scoreData });
    });
    
    const shootersMap = new Map<string, IndividualShooterDisplayData>();
    for (const score of allScores) {
      if (!score.shooterId) continue; 
      
      let shooterGenderToSet: 'male' | 'female' | 'unknown' = 'unknown';
      if (score.shooterGender) {
        const genderLower = score.shooterGender.toLowerCase();
        if (genderLower === 'female' || genderLower === 'w') {
          shooterGenderToSet = 'female';
        } else if (genderLower === 'male' || genderLower === 'm') {
          shooterGenderToSet = 'male';
        }
      }

      if (!shootersMap.has(score.shooterId)) {
        const initialResults: { [key: string]: number | null } = {};
        for (let r = 1; r <= numRoundsForCompetition; r++) initialResults[`dg${r}`] = null;
        
        shootersMap.set(score.shooterId, {
          shooterId: score.shooterId,
          shooterName: score.shooterName || "Unbek. Schütze",
          shooterGender: shooterGenderToSet,
          teamName: score.teamName || "Unbek. Team",
          results: initialResults,
          totalScore: 0,
          averageScore: null,
          roundsShot: 0,
          competitionYear: score.competitionYear,
          leagueId: score.leagueId,
        });
      }

      const shooterData = shootersMap.get(score.shooterId)!;
      // Prioritize 'female' if found in any record for this shooter
      if (shooterGenderToSet === 'female') {
        shooterData.shooterGender = 'female';
      } else if (shooterGenderToSet === 'male' && shooterData.shooterGender === 'unknown') {
        shooterData.shooterGender = 'male';
      }
      // Ensure teamName and shooterName are consistent if multiple entries exist
      if (score.teamName && shooterData.teamName === "Unbek. Team") shooterData.teamName = score.teamName;
      if (score.shooterName && shooterData.shooterName === "Unbek. Schütze") shooterData.shooterName = score.shooterName;


      if (score.durchgang >= 1 && score.durchgang <= numRoundsForCompetition && typeof score.totalRinge === 'number') {
        shooterData.results[`dg${score.durchgang}`] = score.totalRinge;
      }
    }

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

    const rankedShooters = Array.from(shootersMap.values())
      .filter(s => s.roundsShot > 0)
      .sort((a, b) => (b.totalScore ?? 0) - (a.totalScore ?? 0) || (b.averageScore ?? 0) - (a.averageScore ?? 0) || a.shooterName.localeCompare(b.shooterName));
    
    rankedShooters.forEach((shooter, index) => { shooter.rank = index + 1; });
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
    parentTeam: TeamDisplay, 
    onShooterClick: (shooterData: IndividualShooterDisplayData) => void 
}> = ({ shootersResults, numRounds, parentTeam, onShooterClick }) => {
  if (!shootersResults || shootersResults.length === 0) {
    return <p className="p-3 text-sm text-center text-muted-foreground bg-muted/10">Keine Schützen für dieses Team erfasst oder Ergebnisse vorhanden.</p>;
  }
  return (
    <div className="overflow-x-auto bg-background/30 p-2 rounded-md">
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
            const shooterDataForModal: IndividualShooterDisplayData = {
                shooterId: shooterRes.shooterId,
                shooterName: shooterRes.shooterName,
                shooterGender: shooterRes.shooterGender,
                teamName: parentTeam.name, 
                results: shooterRes.results,
                totalScore: shooterRes.total || 0,
                averageScore: shooterRes.average,
                roundsShot: shooterRes.roundsShot,
                competitionYear: parentTeam.competitionYear,
                leagueId: parentTeam.leagueId,
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
  const validResults = [];
  for (let i = 1; i <= numRounds; i++) {
    const scoreValue = shooterData.results[`dg${i}`];
    chartData.push({ name: `DG ${i}`, Ringe: typeof scoreValue === 'number' ? scoreValue : null });
    if(typeof scoreValue === 'number') validResults.push(scoreValue);
  }
  const dataMin = validResults.length > 0 ? Math.min(...validResults) : 0;
  const defaultMax = numRounds === 4 ? 400 : 300; 
  const dataMax = validResults.length > 0 ? Math.max(...validResults) : defaultMax;
  
  const yAxisDomainMin = Math.max(0, Math.floor((dataMin - 20) / 10) * 10);
  const yAxisDomainMax = Math.ceil((dataMax + 20) / 10) * 10;

  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-2xl text-primary">{shooterData.shooterName}</DialogTitle>
        <DialogDescription>
          {shooterData.teamName} - Ergebnisse der Saison {shooterData.competitionYear || ""} 
          {shooterData.rank && ` (Rang: ${shooterData.rank} in der aktuellen Filteransicht)`}
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
        {chartData.some(d => d.Ringe !== null && d.Ringe > 0) && (
          <div>
            <h3 className="text-lg font-semibold mb-3 text-accent">Leistungsdiagramm</h3>
            <div className="h-[300px] w-full bg-muted/30 p-4 rounded-lg shadow-inner">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 30, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                  <YAxis 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} 
                    domain={[yAxisDomainMin, yAxisDomainMax]} 
                    allowDecimals={false} 
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', borderRadius: 'var(--radius)'}}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                    formatter={(value: any) => value === null ? "-" : value}
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
  const [selectedIndividualLeagueFilter, setSelectedIndividualLeagueFilter] = useState<string>(""); 

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const [currentNumRoundsState, setCurrentNumRoundsState] = useState<number>(5); 
  const [openAccordionItems, setOpenAccordionItems] = useState<string[]>([]); 
  const [expandedTeamIds, setExpandedTeamIds] = useState<string[]>([]); 

  const [isShooterDetailModalOpen, setIsShooterDetailModalOpen] = useState(false);
  const [selectedShooterForDetail, setSelectedShooterForDetail] = useState<IndividualShooterDisplayData | null>(null);
  const [isLoadingInitialYears, setIsLoadingInitialYears] = useState(true);

  const calculateNumRounds = useCallback(async (year: number, uiDiscipline: UIDisciplineSelection): Promise<number> => {
    console.log(`RWK-TABLE: Calculating num rounds for ${year} ${uiDiscipline}`);
    try {
      const seasonsQuery = query(collection(db, "seasons"),
        where("competitionYear", "==", year),
        where("type", "==", uiDiscipline),
        where("status", "==", "Laufend"),
        orderBy("name"), // Added orderBy as it's often required with where
        limit(1)
      );
      const seasonsSnapForRounds = await getDocs(seasonsQuery);
      if (!seasonsSnapForRounds.empty) {
          const firstSeasonDocId = seasonsSnapForRounds.docs[0].id;
          const leagueForRoundsQuery = query(collection(db, "rwk_leagues"), 
            where("seasonId", "==", firstSeasonDocId),
            limit(1) 
          );
          const leagueSnap = await getDocs(leagueForRoundsQuery);
          if(!leagueSnap.empty){
              const leagueData = leagueSnap.docs[0].data() as League;
              const specificType = leagueData.type;
              const fourRoundDisciplines: FirestoreLeagueSpecificDiscipline[] = ['LGA', 'LG', 'LPA', 'LP'];
              if (fourRoundDisciplines.includes(specificType)) {
                console.log(`RWK-TABLE: Specific league type ${specificType} means 4 rounds.`);
                return 4;
              }
          }
      }
    } catch (err) {
        console.error("RWK-TABLE: Error in calculateNumRounds, defaulting to 5:", err);
    }
    console.log(`RWK-TABLE: Defaulting to 5 rounds for ${year} ${uiDiscipline}`);
    return 5; 
  }, []);

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
        initialYear = dbYears[0]; 
      } else {
        initialYear = currentActualYear; 
      }
      
      let initialUIDiscipline: UIDisciplineSelection = 
        paramDiscipline && uiDisciplineFilterOptions.some(d => d.value === paramDiscipline)
        ? paramDiscipline
        : uiDisciplineFilterOptions[0]?.value || 'KK'; 
      
      const currentUrlYear = searchParams.get('year');
      const currentUrlDiscipline = searchParams.get('discipline');
      const currentUrlLeague = searchParams.get('league');

      if (String(initialYear) !== currentUrlYear || initialUIDiscipline !== currentUrlDiscipline || (paramLeague && !currentUrlLeague)) {
         if (!paramYearStr && !paramDiscipline && !paramLeague) {
            router.replace(`/rwk-tabellen?year=${initialYear}&discipline=${initialUIDiscipline}`, { scroll: false });
         } else if(paramYearStr && paramDiscipline && paramLeague) {
            // If all params are present, we likely came from a link, don't replace unless they are invalid defaults
         } else {
            // If some params are missing or different from derived defaults, update URL
            router.replace(`/rwk-tabellen?year=${initialYear}&discipline=${initialUIDiscipline}${paramLeague ? `&league=${paramLeague}` : ''}`, { scroll: false });
         }
      }
            
      const disciplineLabelObj = uiDisciplineFilterOptions.find(d => d.value === initialUIDiscipline);
      const disciplineLabel = disciplineLabelObj ? disciplineLabelObj.label.replace(/\s*\(.*\)\s*$/, '').trim() : initialUIDiscipline;
            
      setSelectedCompetition({ year: initialYear, discipline: initialUIDiscipline, displayName: `RWK ${initialYear} ${disciplineLabel}` });
      
      if (paramLeague) { // Only set openAccordionItems if league is in URL
        setOpenAccordionItems([paramLeague]);
      }
      setIsLoadingInitialYears(false);
    }).catch(err => {
      if(isMounted) {
        console.error("RWK-TABLE: Error in initial year/discipline setup:", err);
        setError("Fehler beim Initialisieren der Jahresauswahl.");
        setIsLoadingInitialYears(false);
        const fallbackYear = new Date().getFullYear();
        const fallbackDiscipline = uiDisciplineFilterOptions[0]?.value || 'KK';
        const fallbackLabelObj = uiDisciplineFilterOptions.find(d => d.value === fallbackDiscipline);
        const fallbackLabel = fallbackLabelObj ? fallbackLabelObj.label.replace(/\s*\(.*\)\s*$/, '').trim() : fallbackDiscipline;
        setSelectedCompetition({ year: fallbackYear, discipline: fallbackDiscipline, displayName: `RWK ${fallbackYear} ${fallbackLabel}` });
      }
    });
    return () => { isMounted = false; };
  }, [searchParams, router]); 

  useEffect(() => {
    let isMounted = true;
    if (!selectedCompetition || isLoadingInitialYears) {
      if (isMounted && !isLoadingInitialYears) setLoading(false); 
      return;
    }

    const loadData = async () => {
      if(!isMounted) return;
      console.log("RWK-TABLE: LoadData useEffect triggered for competition:", selectedCompetition, "tab:", activeTab, "individualLeagueFilter:", selectedIndividualLeagueFilter);
      setLoading(true);
      setError(null);
      setExpandedTeamIds([]); 
      
      try {
        const numRoundsForCurrentCompetition = await calculateNumRounds(selectedCompetition.year, selectedCompetition.discipline);
        if (!isMounted) return;
        setCurrentNumRoundsState(numRoundsForCurrentCompetition);

        const fetchedTeamData = await fetchCompetitionTeamData(selectedCompetition, numRoundsForCurrentCompetition);
        if (!isMounted) return;
        setTeamData(fetchedTeamData);

        if (fetchedTeamData && fetchedTeamData.leagues && fetchedTeamData.leagues.length > 0) {
            const leagueParamFromUrl = searchParams.get('league');
            if (leagueParamFromUrl && fetchedTeamData.leagues.some(l => l.id === leagueParamFromUrl)) {
                setOpenAccordionItems([leagueParamFromUrl]);
            } else {
                setOpenAccordionItems(fetchedTeamData.leagues.map(league => league.id)); // Open all by default
            }
        } else {
            setOpenAccordionItems([]);
        }

        const individuals = await fetchIndividualShooterData(selectedCompetition, numRoundsForCurrentCompetition, selectedIndividualLeagueFilter || null);
        if (!isMounted) return;
        setIndividualData(individuals);
        if (individuals.length > 0) {
            const males = individuals.filter(s => s.shooterGender === 'male');
            if(isMounted) setTopMaleShooter(males.length > 0 ? males.sort((a,b) => (b.totalScore ?? 0) - (a.totalScore ?? 0))[0] : null); 
            
            const females = individuals.filter(s => s.shooterGender === 'female');
            if(isMounted) setTopFemaleShooter(females.length > 0 ? females.sort((a,b) => (b.totalScore ?? 0) - (a.totalScore ?? 0))[0] : null); 
        } else {
            if(isMounted){
                setTopMaleShooter(null);
                setTopFemaleShooter(null);
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
  }, [selectedCompetition, activeTab, calculateNumRounds, isLoadingInitialYears, searchParams, selectedIndividualLeagueFilter, router]);

  const handleYearChange = useCallback(async (yearString: string) => {
    const year = parseInt(yearString, 10);
    if (!selectedCompetition || selectedCompetition.year === year || isNaN(year)) return;
    
    const newDiscipline = selectedCompetition.discipline; 
    const newPath = `/rwk-tabellen?year=${year}&discipline=${newDiscipline}`;
    router.push(newPath, { scroll: false });
    setSelectedIndividualLeagueFilter(""); 
    setOpenAccordionItems([]); // Reset open leagues when year changes
  }, [selectedCompetition, router]);

  const handleDisciplineChange = useCallback(async (discipline: UIDisciplineSelection) => {
     if (!selectedCompetition || selectedCompetition.discipline === discipline) return;
     const newYear = selectedCompetition.year;
     const newPath = `/rwk-tabellen?year=${newYear}&discipline=${discipline}`;
     router.push(newPath, { scroll: false });
     setSelectedIndividualLeagueFilter(""); 
     setOpenAccordionItems([]); // Reset open leagues when discipline changes
  }, [selectedCompetition, router]);
  
  const handleAccordionValueChange = (value: string[]) => {
    setOpenAccordionItems(value);
    // If user manually changes accordion, clear league from URL
    if (searchParams.get('league')) {
        const newParams = new URLSearchParams(searchParams.toString());
        newParams.delete('league');
        router.replace(`/rwk-tabellen?${newParams.toString()}`, { scroll: false });
    }
  };

  const toggleTeamExpansion = (teamId: string) => {
    setExpandedTeamIds(prev => 
      prev.includes(teamId) ? prev.filter(id => id !== teamId) : [...prev, teamId]
    );
  };

  const handleShooterNameClick = (shooter: IndividualShooterDisplayData | ShooterDisplayResults) => {
    let detailData: IndividualShooterDisplayData;
    if ('teamName' in shooter && shooter.teamName && 'shooterGender' in shooter) { 
        detailData = shooter as IndividualShooterDisplayData;
    } else { 
        const sdr = shooter as ShooterDisplayResults;
        let parentTeam: TeamDisplay | undefined;
        teamData?.leagues.find(league => {
            const foundTeam = league.teams.find(t => t.id === sdr.teamId);
            if (foundTeam) {
                parentTeam = foundTeam;
                return true;
            }
            return false;
        });

        detailData = {
            shooterId: sdr.shooterId,
            shooterName: sdr.shooterName,
            shooterGender: sdr.shooterGender,
            teamName: parentTeam?.name || "Team nicht gefunden",
            results: sdr.results,
            totalScore: sdr.total || 0,
            averageScore: sdr.average,
            roundsShot: sdr.roundsShot,
            competitionYear: parentTeam?.competitionYear || selectedCompetition?.year,
            leagueId: parentTeam?.leagueId,
        };
    }
    setSelectedShooterForDetail(detailData);
    setIsShooterDetailModalOpen(true);
  };

  const pageTitle = useMemo(() => {
      if (!selectedCompetition) return "RWK Tabellen";
      const discLabelObj = uiDisciplineFilterOptions.find(opt => opt.value === selectedCompetition.discipline);
      const discLabel = discLabelObj ? discLabelObj.label.replace(/\s*\(.*\)\s*$/, "").trim() : selectedCompetition.discipline;
      return `RWK ${selectedCompetition.year} ${discLabel}`;
  },[selectedCompetition]);

  const availableLeaguesForIndividualFilter = useMemo(() => {
    if (!teamData || !teamData.leagues) return [];
    return teamData.leagues
        .filter(league => league && typeof league.id === 'string' && league.id.trim() !== "")
        .map(league => ({ id: league.id, name: league.name }));
  }, [teamData]);

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
                : <SelectItem value="NO_YEARS_PLACEHOLDER_RWK_TABLE" disabled>Keine Saisons aktiv</SelectItem>
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
            <Card className="shadow-lg"><CardHeader><CardTitle className="text-accent">Keine Ligen für {selectedCompetition?.displayName || pageTitle}</CardTitle></CardHeader>
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
                                    <TableCell colSpan={6 + currentNumRoundsState} className="p-0 border-t-0"> 
                                    <div className="p-2 bg-muted/20 rounded-b-md">
                                    <TeamShootersTable 
                                        shootersResults={team.shootersResults} 
                                        numRounds={currentNumRoundsState} 
                                        parentTeam={team}
                                        onShooterClick={handleShooterNameClick}
                                    />
                                    </div>
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
            </CardContent>
            </Card>
          )}
          
          {!loading && !error && (
             <div className="mb-4">
                <Label htmlFor="individualLeagueFilter" className="text-sm font-medium">Nach Liga filtern:</Label>
                <Select 
                    value={selectedIndividualLeagueFilter} 
                    onValueChange={(value) => setSelectedIndividualLeagueFilter(value === "ALL_LEAGUES_IND_FILTER" ? "" : value)}
                    disabled={loading || !teamData || availableLeaguesForIndividualFilter.length === 0}
                >
                    <SelectTrigger id="individualLeagueFilter" className="w-full sm:w-[300px] mt-1 shadow-sm">
                        <SelectValue placeholder="Alle Ligen anzeigen" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL_LEAGUES_IND_FILTER">Alle Ligen</SelectItem>
                        {availableLeaguesForIndividualFilter
                            .filter(l => l && typeof l.id === 'string' && l.id.trim() !== "")
                            .map(league => (
                                <SelectItem key={league.id} value={league.id}>{league.name}</SelectItem>
                        ))}
                        {availableLeaguesForIndividualFilter.filter(l => l && typeof l.id === 'string' && l.id.trim() !== "").length === 0 && 
                         <SelectItem value="NO_LEAGUES_FOR_IND_FILTER_PLACEHOLDER_RWK" disabled>Keine Ligen für Filter</SelectItem>
                        }
                    </SelectContent>
                </Select>
            </div>
          )}

          {!loading && !error && individualData.length === 0 && (
            <Card className="shadow-lg">
                <CardHeader><CardTitle className="text-accent">Keine Einzelschützen für {pageTitle} {selectedIndividualLeagueFilter && teamData?.leagues.find(l=>l.id===selectedIndividualLeagueFilter) ? `(Liga: ${teamData.leagues.find(l=>l.id===selectedIndividualLeagueFilter)?.name})`: ''}</CardTitle></CardHeader>
                <CardContent className="text-center py-12 p-6">
                <AlertTriangle className="mx-auto h-10 w-10 mb-3 text-primary/70" />
                <p className="text-lg text-muted-foreground">
                    Für die aktuelle Auswahl wurden keine Einzelschützenergebnisse gefunden oder es gibt keine Saisons mit Status "Laufend".
                </p>
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
                  <CardTitle className="text-xl text-accent">Einzelrangliste {selectedIndividualLeagueFilter && teamData?.leagues.find(l=>l.id===selectedIndividualLeagueFilter) ? `(Liga: ${teamData.leagues.find(l=>l.id===selectedIndividualLeagueFilter)?.name})`: '(Alle Ligen der Disziplin)'}</CardTitle>
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

const RwkTabellenPageLoadingSkeleton: React.FC<{ title?: string, specificFor?: string }> = ({ title, specificFor }) => {
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
      <div className="grid w-full grid-cols-2 md:w-1/2 lg:w-1/3 mb-6 shadow-md">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
      <Card className="shadow-lg">
        <CardHeader>
            <Skeleton className="h-7 w-3/4 mb-1" />
            <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => ( 
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
    <Suspense fallback={<RwkTabellenPageLoadingSkeleton title="RWK Tabellen laden..." />}>
      <RwkTabellenPageComponent />
    </Suspense>
  );
}
