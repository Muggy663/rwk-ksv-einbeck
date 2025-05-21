// src/app/rwk-tabellen/page.tsx
"use client";
import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
import { ChevronDown, TableIcon, Loader2, AlertTriangle, User, Users, Trophy, Medal } from 'lucide-react';
import type {
  Season,
  League, Team, Club, Shooter, ScoreEntry, ShooterDisplayResults,
  CompetitionDisplayConfig, FirestoreLeagueSpecificDiscipline, UIDisciplineSelection, AggregatedCompetitionData, IndividualShooterDisplayData
} from '@/types/rwk';
import { uiDisciplineFilterOptions, AVAILABLE_UI_DISCIPLINES, getDisciplineCategory } from '@/types/rwk'; // Import getDisciplineCategory
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { db } from '@/lib/firebase/config';
import { collection, doc, getDoc, getDocs, query, where, orderBy, limit, Timestamp, DocumentData } from 'firebase/firestore';
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line, ReferenceLine } from 'recharts';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

const TEAM_SIZE_FOR_SCORING = 3;
const EXCLUDED_TEAM_NAME = "SV Dörrigsen Einzel"; // Mannschaft, die nicht in Tabellen erscheinen soll

interface LeagueDisplay extends League {
  teams: TeamDisplay[];
}

interface TeamDisplay extends Team {
  clubName: string;
  rank?: number;
  shootersResults: ShooterDisplayResults[];
  roundResults: { [key: string]: number | null };
  totalScore: number;
  averageScore: number | null;
  numScoredRounds: number;
}

async function fetchAvailableYearsFromSeasons(): Promise<number[]> {
  console.log(">>> RWK-TABLE: fetchAvailableYearsFromSeasons called");
  try {
    const seasonsColRef = collection(db, "seasons");
    const qSeasons = query(seasonsColRef, orderBy("competitionYear", "desc"));
    const seasonsSnapshot = await getDocs(qSeasons);
    
    if (seasonsSnapshot.empty) {
      console.warn(">>> RWK-TABLE: No seasons found in database to determine available years.");
      return [new Date().getFullYear()]; // Fallback auf aktuelles Jahr
    }
    
    const years = new Set<number>();
    seasonsSnapshot.forEach(doc => {
      const seasonData = doc.data() as Season;
      if (seasonData.competitionYear) {
        years.add(seasonData.competitionYear);
      }
    });
    const sortedYears = Array.from(years).sort((a, b) => b - a); // Neuestes Jahr zuerst
    console.log(">>> RWK-TABLE: Available years from DB (sorted desc):", sortedYears);
    return sortedYears.length > 0 ? sortedYears : [new Date().getFullYear()];
  } catch (error) {
    console.error(">>> RWK-TABLE: Error fetching available years from seasons:", error);
    return [new Date().getFullYear()]; // Fallback
  }
}

async function fetchCompetitionTeamData(config: CompetitionDisplayConfig, numRoundsForCompetition: number): Promise<AggregatedCompetitionData | null> {
  console.log(`>>> RWK-TABLE: fetchCompetitionTeamData for year ${config.year}, UI discipline ${config.discipline}`);
  try {
    const seasonsColRef = collection(db, "seasons");
    const qSeasons = query(seasonsColRef,
      where("competitionYear", "==", config.year),
      where("type", "==", config.discipline),
      where("status", "==", "Laufend")
    );
    const seasonsSnapshot = await getDocs(qSeasons);
    console.log(`>>> RWK-TABLE: Found ${seasonsSnapshot.docs.length} 'Laufend' season(s) matching criteria:`, seasonsSnapshot.docs.map(d => d.id));

    if (seasonsSnapshot.empty) {
      console.warn(`>>> RWK-TABLE: No 'Laufend' seasons found for year ${config.year} and UI discipline ${config.discipline}.`);
      return { id: `${config.year}-${config.discipline}`, config, leagues: [] };
    }
    const laufendeSeasonIds = seasonsSnapshot.docs.map(sDoc => sDoc.id);

    const selectedUIDiscOption = uiDisciplineFilterOptions.find(opt => opt.value === config.discipline);
    const firestoreDisciplinesToQuery: FirestoreLeagueSpecificDiscipline[] = selectedUIDiscOption ? selectedUIDiscOption.firestoreTypes : [];

    if (firestoreDisciplinesToQuery.length === 0) {
        console.warn(`>>> RWK-TABLE: No specific Firestore disciplines to query for UI discipline '${config.discipline}'.`);
        return { id: `${config.year}-${config.discipline}`, config, leagues: [] };
    }

    const leaguesColRef = collection(db, "rwk_leagues");
    // Da Firestore keine direkte OR-Abfrage über verschiedene Felder unterstützt,
    // und eine "IN"-Abfrage auf 'type' nur bis zu 30 Werte erlaubt, ist der aktuelle Ansatz,
    // alle Ligen der Saison zu laden und client-seitig zu filtern, wenn die Anzahl der firestoreDisciplinesToQuery klein ist.
    // Alternativ: mehrere Queries pro firestoreDisciplineType und dann mergen.
    // Für jetzt: Laden aller Ligen der Saison und client-seitiges Filtern, wenn firestoreDisciplinesToQuery mehrere spezifische Typen enthält.
    // Oder, wenn firestoreDisciplinesToQuery immer nur die Typen sind, die unter die UIDisciplineSelection fallen:
    const qLeagues = query(leaguesColRef,
      where("seasonId", "in", laufendeSeasonIds),
      where("type", "in", firestoreDisciplinesToQuery),
      orderBy("order", "asc")
    );
    const leaguesSnapshot = await getDocs(qLeagues);
    let fetchedLeaguesData: LeagueDisplay[] = [];
    console.log(`>>> RWK-TABLE: Fetched ${leaguesSnapshot.docs.length} leagues for running seasons and disciplines.`);

    if (leaguesSnapshot.empty) {
      console.warn(`>>> RWK-TABLE: No leagues found for 'Laufend' seasons and specified Firestore disciplines.`);
      return { id: `${config.year}-${config.discipline}`, config, leagues: [] };
    }

    const clubCache = new Map<string, string>();
    const shooterCache = new Map<string, Shooter>();
   
    for (const leagueDoc of leaguesSnapshot.docs) {
      const leagueData = leagueDoc.data() as Omit<League, 'id' | 'teams'>;
      const league: LeagueDisplay = {
        id: leagueDoc.id,
        ...leagueData,
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
        const teamData = teamDoc.data() as Omit<Team, 'id' | 'clubName' | 'rank' | 'shootersResults' | 'roundResults' | 'totalScore' | 'averageScore' | 'numScoredRounds'>;
        
        if (teamData.name === EXCLUDED_TEAM_NAME) {
          console.log(`>>> RWK-TABLE: Filtering out team: ${teamData.name}`);
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
                 console.warn(`>>> RWK-TABLE: Club with ID ${teamData.clubId} not found for team ${teamData.name}`);
              }
            } catch (clubError) { console.error(`>>> RWK-TABLE: Error fetching club ${teamData.clubId}:`, clubError); }
          }
        } else {
          const clubNameMatch = teamData.name?.match(/^([^\sI]+(?:\s+[^\sI]+)*)/);
          clubName = clubNameMatch ? clubNameMatch[1].trim() : teamData.name || "Unbek. Verein";
        }
        
        const team: TeamDisplay = {
          id: teamDoc.id,
          ...teamData,
          clubName: clubName,
          shootersResults: [],
          roundResults: {},
          totalScore: 0,
          averageScore: null,
          numScoredRounds: 0
        };
        
        const shooterIdsForTeam = teamData.shooterIds || [];
        const shooterResultsMap = new Map<string, ShooterDisplayResults>();

        for (const shooterId of shooterIdsForTeam) {
           let shooterInfo = shooterCache.get(shooterId);
           if (!shooterInfo) {
             try {
                const shooterDocRef = doc(db, "rwk_shooters", shooterId);
                const shooterSnap = await getDoc(shooterDocRef);
                if (shooterSnap.exists()) {
                    shooterInfo = shooterSnap.data() as Shooter;
                    shooterCache.set(shooterId, shooterInfo);
                } else {
                  console.warn(`>>> RWK-TABLE: Shooter with ID ${shooterId} not found in rwk_shooters for team ${team.name}`);
                }
             } catch (shooterError) { console.error(`>>> RWK-TABLE: Error fetching shooter ${shooterId}:`, shooterError); }
           }
           const shooterName = shooterInfo?.name || `Schütze ${shooterId.substring(0,5)}`;

           const sResults: ShooterDisplayResults = {
             shooterId: shooterId,
             shooterName: shooterName,
             results: {}, 
             average: null,
             total: 0,
             roundsShot: 0,
             teamId: team.id,
             leagueId: league.id,
             competitionYear: team.competitionYear,
           };
           for (let r = 1; r <= numRoundsForCompetition; r++) sResults.results[`dg${r}`] = null;
           shooterResultsMap.set(shooterId, sResults);
        }
        
        const scoresQuery = query(collection(db, "rwk_scores"),
          where("teamId", "==", team.id),
          where("competitionYear", "==", team.competitionYear),
          where("leagueId", "==", team.leagueId)
        );
        const teamScoresSnap = await getDocs(scoresQuery);
        const teamScores = teamScoresSnap.docs.map(d => ({id: d.id, ...d.data()} as ScoreEntry));

        teamScores.forEach(score => {
          if (shooterResultsMap.has(score.shooterId)) {
            const sr = shooterResultsMap.get(score.shooterId)!;
            if (score.durchgang >= 1 && score.durchgang <= numRoundsForCompetition) {
              const roundKey = `dg${score.durchgang}`;
              sr.results[roundKey] = (sr.results[roundKey] === null ? 0 : sr.results[roundKey] || 0) + score.totalRinge;
              if (score.totalRinge !== null) { 
                sr.total = (sr.total || 0) + score.totalRinge;
              }
            }
          }
        });
        
        shooterResultsMap.forEach(sr => {
            let roundsShotCount = 0;
            Object.values(sr.results).forEach(res => {
              if (res !== null && res !== undefined) roundsShotCount++;
            });
            sr.roundsShot = roundsShotCount;
            if (sr.roundsShot > 0 && sr.total !== null) {
                sr.average = parseFloat((sr.total / sr.roundsShot).toFixed(2));
            }
            team.shootersResults.push(sr);
        });
        team.shootersResults.sort((a, b) => (b.total || 0) - (a.total || 0) || a.shooterName.localeCompare(b.shooterName) );

        for (let r = 1; r <= numRoundsForCompetition; r++) {
          const roundKey = `dg${r}`;
          const scoresForRoundFromShooters = team.shootersResults
            .map(sr => sr.results[roundKey])
            .filter(scoreVal => scoreVal !== null && scoreVal !== undefined && scoreVal > 0) as number[];
          
          scoresForRoundFromShooters.sort((a, b) => b - a); 

          if (scoresForRoundFromShooters.length >= TEAM_SIZE_FOR_SCORING) {
            team.roundResults[roundKey] = scoresForRoundFromShooters
              .slice(0, TEAM_SIZE_FOR_SCORING)
              .reduce((sum, scoreVal) => sum + scoreVal, 0);
          } else {
            team.roundResults[roundKey] = null;
          }
        }

        let teamTotalScore = 0;
        let numScoredRounds = 0;
        Object.values(team.roundResults).forEach(scoreVal => {
          if (scoreVal !== null) {
            teamTotalScore += scoreVal;
            numScoredRounds++;
          }
        });
        team.totalScore = teamTotalScore;
        team.numScoredRounds = numScoredRounds;
        team.averageScore = numScoredRounds > 0 ? parseFloat((teamTotalScore / numScoredRounds).toFixed(2)) : null;

        teamDisplays.push(team);
      }
      
      teamDisplays.sort((a, b) => (b.totalScore ?? 0) - (a.totalScore ?? 0) || (b.averageScore ?? 0) - (a.averageScore ?? 0) || a.clubName.localeCompare(b.clubName) || a.name.localeCompare(b.name) );
      teamDisplays.forEach((team, index) => { team.rank = index + 1; });
      league.teams = teamDisplays;
      fetchedLeaguesData.push(league);
    }
    console.log(`>>> RWK-TABLE: fetchCompetitionTeamData returning ${fetchedLeaguesData.length} leagues for config`, config);
    return { id: `${config.year}-${config.discipline}`, config, leagues: fetchedLeaguesData };
  } catch (error) {
    console.error(">>> RWK-TABLE: Error fetching team data:", error);
    throw error;
  }
}

async function fetchIndividualShooterData(config: CompetitionDisplayConfig, numRoundsForCompetition: number): Promise<IndividualShooterDisplayData[]> {
  console.log(`>>> RWK-TABLE: fetchIndividualShooterData for year ${config.year}, UI discipline ${config.discipline}`);
  try {
    const seasonsColRef = collection(db, "seasons");
    const qSeasons = query(seasonsColRef,
      where("competitionYear", "==", config.year),
      where("type", "==", config.discipline),
      where("status", "==", "Laufend")
    );
    const seasonsSnapshot = await getDocs(qSeasons);

    if (seasonsSnapshot.empty) {
      console.warn(`>>> RWK-TABLE: No 'Laufend' seasons found for year ${config.year} and UI discipline ${config.discipline} (fetchIndividual).`);
      return [];
    }
    const laufendeSeasonIds = seasonsSnapshot.docs.map(s => s.id);

    const selectedUIDiscOption = uiDisciplineFilterOptions.find(opt => opt.value === config.discipline);
    const firestoreDisciplinesToQuery: FirestoreLeagueSpecificDiscipline[] = selectedUIDiscOption ? selectedUIDiscOption.firestoreTypes : [];
    
    if (firestoreDisciplinesToQuery.length === 0) {
        console.warn(`>>> RWK-TABLE: No specific Firestore disciplines to query for UI discipline '${config.discipline}' (fetchIndividual).`);
        return [];
    }

    const leaguesColRef = collection(db, "rwk_leagues");
    const qLeaguesForDiscipline = query(leaguesColRef,
      where("seasonId", "in", laufendeSeasonIds),
      where("type", "in", firestoreDisciplinesToQuery)
    );
    const leaguesSnap = await getDocs(qLeaguesForDiscipline);
    if (leaguesSnap.empty) {
      console.warn(`>>> RWK-TABLE: No leagues found for 'Laufend' seasons and specified disciplines (fetchIndividual).`);
      return [];
    }
    const relevantLeagueIds = leaguesSnap.docs.map(lDoc => lDoc.id);

    if (relevantLeagueIds.length === 0) return [];

    const scoresColRef = collection(db, "rwk_scores");
    const qScores = query(scoresColRef,
      where("competitionYear", "==", config.year),
      where("leagueId", "in", relevantLeagueIds)
    );
    const scoresSnapshot = await getDocs(qScores);
    const allScores: ScoreEntry[] = scoresSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as ScoreEntry));
    
    const shootersMap = new Map<string, IndividualShooterDisplayData>();

    for (const score of allScores) {
      if (score.teamName === EXCLUDED_TEAM_NAME) continue;

      if (!shootersMap.has(score.shooterId)) {
        const initialResults: { [key: string]: number | null } = {};
        for (let r = 1; r <= numRoundsForCompetition; r++) {
          initialResults[`dg${r}`] = null;
        }
        shootersMap.set(score.shooterId, {
          shooterId: score.shooterId,
          shooterName: score.shooterName || "Unbek. Schütze",
          shooterGender: score.shooterGender || 'unknown',
          teamName: score.teamName || "Unbek. Team",
          results: initialResults,
          totalScore: 0,
          averageScore: null,
          roundsShot: 0,
        });
      }

      const shooterData = shootersMap.get(score.shooterId)!;
      if ((!shooterData.shooterName || shooterData.shooterName === "Unbek. Schütze") && score.shooterName) shooterData.shooterName = score.shooterName;
      if ((!shooterData.teamName || shooterData.teamName === "Unbek. Team") && score.teamName) shooterData.teamName = score.teamName;
      
      const currentScoreGender = score.shooterGender?.toLowerCase();
      if (currentScoreGender === 'female' || currentScoreGender === 'w') {
          shooterData.shooterGender = 'female';
      } else if ((currentScoreGender === 'male' || currentScoreGender === 'm') && shooterData.shooterGender !== 'female') {
          shooterData.shooterGender = 'male';
      } else if (shooterData.shooterGender === 'unknown' && score.shooterGender) {
           shooterData.shooterGender = score.shooterGender;
      }

      if (score.durchgang >= 1 && score.durchgang <= numRoundsForCompetition && score.totalRinge !== null) {
        const roundKey = `dg${score.durchgang}`;
        shooterData.results[roundKey] = (shooterData.results[roundKey] || 0) + score.totalRinge;
        shooterData.totalScore += score.totalRinge;
      }
    }

    shootersMap.forEach(shooterData => {
      let roundsShotCount = 0;
      Object.values(shooterData.results).forEach(res => {
        if (res !== null && res !== undefined) roundsShotCount++;
      });
      shooterData.roundsShot = roundsShotCount;
      if (shooterData.roundsShot > 0) {
        shooterData.averageScore = parseFloat((shooterData.totalScore / shooterData.roundsShot).toFixed(2));
      }
    });

    const rankedShooters = Array.from(shootersMap.values())
      .sort((a, b) => (b.totalScore ?? 0) - (a.totalScore ?? 0) || (b.averageScore ?? 0) - (a.averageScore ?? 0) || a.shooterName.localeCompare(b.shooterName));
    
    rankedShooters.forEach((shooter, index) => { shooter.rank = index + 1; });
    return rankedShooters;
  } catch (error) {
    console.error(">>> RWK-TABLE: Error fetching individual shooter data:", error);
    throw error;
  }
}

const ShooterDetailModalContent = ({ shooterData, numRounds }: { shooterData: IndividualShooterDisplayData | null, numRounds: number }) => {
  if (!shooterData) return null;

  const chartData = [];
  for (let i = 1; i <= numRounds; i++) {
    chartData.push({
      name: `DG ${i}`,
      score: shooterData.results[`dg${i}`] ?? 0,
    });
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-2xl text-primary">{shooterData.shooterName}</DialogTitle>
        <DialogDescription>
          {shooterData.teamName} - Ergebnisse der Saison
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
                <TableCell className="text-center font-medium text-muted-foreground">{shooterData.averageScore?.toFixed(2) ?? '-'}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
        {chartData.some(d => d.score > 0) && (
        <div>
          <h3 className="text-lg font-semibold mb-3 text-accent-foreground">Leistungsdiagramm</h3>
           <div className="h-[300px] w-full bg-muted/30 p-4 rounded-lg shadow-inner">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} domain={['auto', 'auto']} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    borderColor: 'hsl(var(--border))',
                    borderRadius: 'var(--radius)',
                  }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={2} name="Ringe" dot={{ r: 4, fill: 'hsl(var(--primary))' }} activeDot={{ r: 6 }} />
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

export default function RwkTabellenPage() {
  const [availableYearsFromDb, setAvailableYearsFromDb] = useState<number[]>([]);
  const [pageTitle, setPageTitle] = useState<string>("RWK Tabellen");
  const [selectedCompetition, setSelectedCompetition] = useState<CompetitionDisplayConfig | null>(null);
  const [activeTab, setActiveTab] = useState<"mannschaften" | "einzelschützen">("mannschaften");

  const [teamData, setTeamData] = useState<AggregatedCompetitionData | null>(null);
  const [individualData, setIndividualData] = useState<IndividualShooterDisplayData[]>([]);
  const [topMaleShooter, setTopMaleShooter] = useState<IndividualShooterDisplayData | null>(null);
  const [topFemaleShooter, setTopFemaleShooter] = useState<IndividualShooterDisplayData | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [openTeamDetails, setOpenTeamDetails] = useState<Record<string, boolean>>({});
  const [currentNumRoundsState, setCurrentNumRoundsState] = useState<number>(5);

  const [isShooterDetailModalOpen, setIsShooterDetailModalOpen] = useState(false);
  const [selectedShooterForDetail, setSelectedShooterForDetail] = useState<IndividualShooterDisplayData | null>(null);

  useEffect(() => {
    const initPage = async () => {
      setLoading(true); // Start loading
      console.log(">>> RWK-TABLE: initPage - Fetching available years...");
      const yearsFromDb = await fetchAvailableYearsFromSeasons();
      setAvailableYearsFromDb(yearsFromDb);
      console.log(">>> RWK-TABLE: initPage - Years from DB:", yearsFromDb);

      if (yearsFromDb.length > 0) {
        const currentActualYear = new Date().getFullYear();
        let initialYearToSet = yearsFromDb[0]; // Default to the newest year from DB

        if (yearsFromDb.includes(currentActualYear)) {
          initialYearToSet = currentActualYear;
          console.log(">>> RWK-TABLE: initPage - Current actual year", currentActualYear, "found in DB years. Setting as initial.");
        } else {
          console.log(">>> RWK-TABLE: initPage - Current actual year", currentActualYear, "NOT in DB years. Defaulting to newest year from DB:", initialYearToSet);
        }
        
        const initialDiscipline = AVAILABLE_UI_DISCIPLINES[0].value;
        const initialDisciplineLabel = AVAILABLE_UI_DISCIPLINES.find(d => d.value === initialDiscipline)?.label.replace(/\s*\(.*\)\s*$/, '') || initialDiscipline;
        
        console.log(">>> RWK-TABLE: initPage - Setting initial competition to Year:", initialYearToSet, "Discipline:", initialDiscipline);
        setSelectedCompetition({
          year: initialYearToSet,
          discipline: initialDiscipline,
          displayName: `RWK ${initialYearToSet} ${initialDisciplineLabel}`
        });
      } else {
        // Fallback if no years/seasons found in DB
        const currentYear = new Date().getFullYear();
        const initialDiscipline = AVAILABLE_UI_DISCIPLINES[0].value;
        const initialDisciplineLabel = AVAILABLE_UI_DISCIPLINES.find(d => d.value === initialDiscipline)?.label.replace(/\s*\(.*\)\s*$/, '') || initialDiscipline;
        console.warn(">>> RWK-TABLE: initPage - No years from DB, defaulting to current year:", currentYear);
        setSelectedCompetition({
            year: currentYear,
            discipline: initialDiscipline,
            displayName: `RWK ${currentYear} ${initialDisciplineLabel}`
        });
      }
      // setLoading(false) will be handled by the data loading useEffect
    };
    initPage();
  }, []);


  useEffect(() => {
    if (!selectedCompetition) {
      setLoading(false); 
      return;
    }

    const loadData = async () => {
      console.log(`>>> RWK-TABLE: useEffect for data loading triggered. Active tab: ${activeTab}, Year: ${selectedCompetition.year}, Discipline: ${selectedCompetition.discipline}`);
      setLoading(true);
      setError(null);
      setPageTitle(selectedCompetition.displayName); 

      let numRoundsForCurrentCompetition = 5; 
      const seasonsSnapForRounds = await getDocs(query(collection(db, "seasons"), 
        where("competitionYear", "==", selectedCompetition.year),
        where("type", "==", selectedCompetition.discipline), // 'KK', 'LD', 'SP'
        where("status", "==", "Laufend"),
        limit(1)
      ));
      if (!seasonsSnapForRounds.empty) {
          const firstSeasonDoc = seasonsSnapForRounds.docs[0].data() as Season;
          // Annahme: Die Anzahl der Runden wird durch den league type bestimmt.
          // Wir müssen eine Liga dieser Saison laden, um ihren Typ zu bekommen.
          const leagueForRoundsQuery = query(collection(db, "rwk_leagues"), where("seasonId", "==", seasonsSnapForRounds.docs[0].id), limit(1));
          const leagueSnap = await getDocs(leagueForRoundsQuery);
          if(!leagueSnap.empty){
              const leagueData = leagueSnap.docs[0].data() as League;
              const specificLeagueType = leagueData.type; // z.B. KKG, LGA, LP etc.
              const lgLpTypes: FirestoreLeagueSpecificDiscipline[] = ['LG', 'LGA', 'LP', 'LPA'];
              if (lgLpTypes.includes(specificLeagueType)) {
                numRoundsForCurrentCompetition = 4;
              }
          } else {
            console.warn(">>> RWK-TABLE: No league found for season to determine rounds, defaulting to 5 for KK-like.");
          }
      } else {
        console.warn(`>>> RWK-TABLE: No 'Laufend' season found for ${selectedCompetition.year}/${selectedCompetition.discipline} to determine rounds, defaulting to 5.`);
      }
      setCurrentNumRoundsState(numRoundsForCurrentCompetition);
      console.log(`>>> RWK-TABLE: Number of rounds for ${selectedCompetition.discipline} set to ${numRoundsForCurrentCompetition}`);

      try {
        if (activeTab === "mannschaften") {
          setIndividualData([]); 
          const data = await fetchCompetitionTeamData(selectedCompetition, numRoundsForCurrentCompetition);
          setTeamData(data);
          console.log(`>>> RWK-TABLE: Team data successfully loaded for ${selectedCompetition.displayName}:`, data);
        } else if (activeTab === "einzelschützen") {
          setTeamData(null); 
          const individuals = await fetchIndividualShooterData(selectedCompetition, numRoundsForCurrentCompetition);
          setIndividualData(individuals);
           console.log(`>>> RWK-TABLE: Individual data successfully loaded for ${selectedCompetition.displayName}:`, individuals.length, "shooters");

          if (individuals.length > 0) {
            const males = individuals.filter(s => s.shooterGender && (s.shooterGender.toLowerCase() === 'male' || s.shooterGender.toLowerCase() === 'm'));
            setTopMaleShooter(males.length > 0 ? males.sort((a,b) => (b.totalScore ?? 0) - (a.totalScore ?? 0) || (b.averageScore ?? 0) - (a.averageScore ?? 0) )[0] : null);
            
            const females = individuals.filter(s => s.shooterGender && (s.shooterGender.toLowerCase() === 'female' || s.shooterGender.toLowerCase() === 'w'));
            setTopFemaleShooter(females.length > 0 ? females.sort((a,b) => (b.totalScore ?? 0) - (a.totalScore ?? 0) || (b.averageScore ?? 0) - (a.averageScore ?? 0) )[0] : null);
          } else {
            setTopMaleShooter(null);
            setTopFemaleShooter(null);
          }
        }
      } catch (err) {
        console.error(`>>> RWK-TABLE: Failed to load RWK data for ${activeTab}:`, err);
        setError(err as Error);
        if (activeTab === "mannschaften") setTeamData(null);
        if (activeTab === "einzelschützen") setIndividualData([]);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [selectedCompetition, activeTab]);

  const handleYearChange = (yearString: string) => {
    const year = parseInt(yearString, 10);
    setSelectedCompetition(prev => {
      if (!prev) return null; 
      const currentDiscLabel = AVAILABLE_UI_DISCIPLINES.find(d => d.value === prev.discipline)?.label.replace(/\s*\(.*\)\s*$/, '') || prev.discipline;
      const newDisplayName = `RWK ${year} ${currentDiscLabel}`;
      return {...prev, year, displayName: newDisplayName};
    });
  };

  const handleDisciplineChange = (discipline: UIDisciplineSelection) => {
     setSelectedCompetition(prev => {
      if (!prev) return null;
      const currentDiscLabel = AVAILABLE_UI_DISCIPLINES.find(d => d.value === discipline)?.label.replace(/\s*\(.*\)\s*$/, '') || discipline;
      const newDisplayName = `RWK ${prev.year} ${currentDiscLabel}`;
      return {...prev, discipline, displayName: newDisplayName };
    });
  };

  const toggleTeamDetails = (teamId: string) => {
    setOpenTeamDetails(prev => ({ ...prev, [teamId]: !prev[teamId] }));
  };

  const handleShooterNameClick = (shooter: IndividualShooterDisplayData) => {
    setSelectedShooterForDetail(shooter);
    setIsShooterDetailModalOpen(true);
  };

  const renderLoadingSkeleton = (forTab: "mannschaften" | "einzelschützen") => (
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
  );

  if (error) {
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
            <p className="text-sm mt-2">Fehlermeldung: {(error as Error).message || "Unbekannter Fehler"}.</p>
            <p className="text-sm mt-2">Überprüfen Sie die Browser-Konsole für Details und die Firestore-Sicherheitsregeln, insbesondere ob Indizes fehlen.</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (!selectedCompetition || (loading && availableYearsFromDb.length === 0)) { // Initial load state for years
     return renderLoadingSkeleton("mannschaften"); 
  }


  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center space-x-3">
          <TableIcon className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-primary">{selectedCompetition?.displayName || pageTitle}</h1>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Select 
            value={selectedCompetition?.year.toString() || ""} 
            onValueChange={handleYearChange}
            disabled={availableYearsFromDb.length === 0 || loading}
          >
            <SelectTrigger className="w-full sm:w-[180px] shadow-md">
              <SelectValue placeholder={loading && availableYearsFromDb.length === 0 ? "Lade Jahre..." : "Jahr wählen"} />
            </SelectTrigger>
            <SelectContent>
              {availableYearsFromDb.length > 0 ? 
                availableYearsFromDb.map(year => (<SelectItem key={year} value={year.toString()}>{year}</SelectItem>))
                : <SelectItem value="no-years-placeholder" disabled>Keine Jahre</SelectItem>
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
          {loading && renderLoadingSkeleton("mannschaften")}
          {!loading && !error && (!teamData || teamData.leagues.length === 0) && (
            <Card className="shadow-lg"><CardHeader><CardTitle className="text-accent">Keine Ligen für {selectedCompetition?.displayName || pageTitle}</CardTitle></CardHeader>
              <CardContent className="text-center py-12 p-6">
                 <AlertTriangle className="mx-auto h-10 w-10 mb-3 text-primary/70" />
                <p className="text-lg text-muted-foreground">
                    Für {selectedCompetition?.displayName || pageTitle} wurden keine Ligen mit Status "Laufend" gefunden, oder es sind keine Ergebnisse vorhanden.
                </p>
                 <p className="text-sm mt-1">Bitte überprüfen Sie den Status der Saison in der <a href="/admin/seasons" className="underline hover:text-primary">Saisonverwaltung</a>.</p>
              </CardContent>
            </Card>
          )}
          {!loading && !error && teamData && teamData.leagues.length > 0 && (
            <Accordion type="multiple" defaultValue={teamData.leagues.map(l => l.id)} className="w-full space-y-4">
              {teamData.leagues.map((league) => (
                <AccordionItem value={league.id} key={league.id} className="border bg-card shadow-lg rounded-lg overflow-hidden">
                  <AccordionTrigger className="bg-accent/10 hover:bg-accent/20 px-6 py-4 text-xl font-semibold text-accent data-[state=open]:border-b">
                    {league.name} {league.shortName && `(${league.shortName})`}
                  </AccordionTrigger>
                  <AccordionContent className="pt-0">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50">
                              <TableHead className="w-[40px] text-center">#</TableHead>
                              <TableHead>Mannschaft</TableHead>
                              {[...Array(currentNumRoundsState)].map((_, i) => (<TableHead key={`dg${i + 1}`} className="text-center">DG {i + 1}</TableHead>))}
                              <TableHead className="text-center font-semibold">Gesamt</TableHead>
                              <TableHead className="text-center font-semibold">Schnitt</TableHead>
                              <TableHead className="w-[50px]"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {league.teams.sort((a,b) => (a.rank || 999) - (b.rank || 999)).map((team) => (
                            <React.Fragment key={team.id}>
                              <TableRow className="hover:bg-secondary/20 transition-colors">
                                  <TableCell className="text-center font-medium">{team.rank}</TableCell>
                                  <TableCell className="font-medium text-foreground">{team.name}</TableCell>
                                  {[...Array(currentNumRoundsState)].map((_, i) => (
                                    <TableCell key={`dg${i + 1}-${team.id}`} className="text-center">{(team.roundResults as any)?.[`dg${i + 1}`] ?? '-'}</TableCell>
                                  ))}
                                  <TableCell className="text-center font-semibold text-primary">{team.totalScore ?? '-'}</TableCell>
                                  <TableCell className="text-center font-medium text-muted-foreground">{team.averageScore != null ? team.averageScore.toFixed(2) : '-'}</TableCell>
                                  <TableCell className="text-center">
                                    <Button variant="ghost" size="icon" onClick={() => toggleTeamDetails(team.id)} className="p-1 hover:bg-accent/20 rounded-md text-muted-foreground hover:text-accent" aria-expanded={!!openTeamDetails[team.id]} aria-controls={`team-details-${team.id}`}>
                                      <ChevronDown className={`h-5 w-5 transition-transform ${openTeamDetails[team.id] ? 'rotate-180' : ''}`} /><span className="sr-only">Details</span>
                                    </Button>
                                  </TableCell>
                              </TableRow>
                              {openTeamDetails[team.id] && (
                                 <TableRow id={`team-details-${team.id}`} className="bg-muted/5 hover:bg-muted/10 transition-colors">
                                   <TableCell colSpan={currentNumRoundsState + 5} className="p-0">
                                      <div className="px-2 py-1 md:px-4 md:py-2 bg-secondary/10">
                                        {(team.shootersResults && team.shootersResults.length > 0) ? (
                                          <Table>
                                            <TableHeader><TableRow className="border-b-0 bg-transparent">
                                                <TableHead className="text-foreground/80 font-normal pl-2">Schütze</TableHead>
                                                {[...Array(currentNumRoundsState)].map((_, i) => (<TableHead key={`shooter-dg${i + 1}`} className="text-center text-foreground/80 font-normal">DG {i + 1}</TableHead>))}
                                                <TableHead className="text-center font-semibold text-foreground/80">Gesamt</TableHead>
                                                <TableHead className="text-center font-semibold text-foreground/80 pr-2">Schnitt</TableHead>
                                            </TableRow></TableHeader>
                                            <TableBody>
                                              {team.shootersResults.map(shooterRes => (
                                                <TableRow key={shooterRes.shooterId} className="border-b-0 hover:bg-accent/5">
                                                    <TableCell className="font-medium pl-2">{shooterRes.shooterName || shooterRes.shooterId}</TableCell>
                                                    {[...Array(currentNumRoundsState)].map((_, i) => (<TableCell key={`shooter-dg${i + 1}-${shooterRes.shooterId}`} className="text-center">{shooterRes.results?.[`dg${i + 1}`] ?? '-'}</TableCell>))}
                                                    <TableCell className="text-center font-medium">{shooterRes.total ?? '-'}</TableCell>
                                                    <TableCell className="text-center font-semibold text-primary pr-2">{shooterRes.average != null ? shooterRes.average.toFixed(2) : '-'}</TableCell>
                                                </TableRow>
                                              ))}
                                            </TableBody>
                                          </Table>
                                        ) : (
                                          <p className="p-3 text-center text-sm text-muted-foreground">Keine Schützen für dieses Team erfasst oder Ergebnisse vorhanden.</p>
                                        )}
                                      </div>
                                    </TableCell>
                                </TableRow>
                              )}
                            </React.Fragment>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    {league.teams.length === 0 && (<p className="p-4 text-center text-muted-foreground">Keine Mannschaften in dieser Liga für {pageTitle} vorhanden.</p>)}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </TabsContent>

        <TabsContent value="einzelschützen">
          {loading && renderLoadingSkeleton("einzelschützen")}
          {!loading && !error && individualData.length === 0 && (
            <Card className="shadow-lg">
                <CardHeader><CardTitle className="text-accent">Keine Einzelschützen für {selectedCompetition?.displayName || pageTitle}</CardTitle></CardHeader>
              <CardContent className="text-center py-12 p-6">
                 <AlertTriangle className="mx-auto h-10 w-10 mb-3 text-primary/70" />
                <p className="text-lg text-muted-foreground">
                    Für {selectedCompetition?.displayName || pageTitle} wurden keine Einzelschützenergebnisse gefunden oder es gibt keine Saisons mit Status "Laufend".
                </p>
                <p className="text-sm mt-1">Bitte überprüfen Sie den Status der Saison in der <a href="/admin/seasons" className="underline hover:text-primary">Saisonverwaltung</a>.</p>
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
                      <p className="text-sm">Schnitt: {topMaleShooter.averageScore?.toFixed(2)} ({topMaleShooter.roundsShot} DG)</p>
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
                      <p className="text-sm">Schnitt: {topFemaleShooter.averageScore?.toFixed(2)} ({topFemaleShooter.roundsShot} DG)</p>
                    </CardContent>
                  </Card>
                )}
              </div>

              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-xl text-accent">Einzelrangliste</CardTitle>
                  <CardDescription>Alle Schützen sortiert nach Gesamtergebnis für {selectedCompetition?.displayName || pageTitle}.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader><TableRow className="bg-muted/50">
                          <TableHead className="w-[40px] text-center">#</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Mannschaft</TableHead>
                          {[...Array(currentNumRoundsState)].map((_, i) => (<TableHead key={`ind-dg${i + 1}`} className="text-center">DG {i + 1}</TableHead>))}
                          <TableHead className="text-center font-semibold">Gesamt</TableHead>
                          <TableHead className="text-center font-semibold">Schnitt</TableHead>
                      </TableRow></TableHeader>
                      <TableBody>
                        {individualData.map(shooter => (
                          <TableRow key={shooter.shooterId} className="hover:bg-secondary/20 transition-colors">
                              <TableCell className="text-center font-medium">{shooter.rank}</TableCell>
                              <TableCell className="font-medium text-foreground">
                                <Button variant="link" className="p-0 h-auto text-base text-left" onClick={() => handleShooterNameClick(shooter)}>
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
