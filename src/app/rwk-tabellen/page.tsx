
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
import { ChevronDown, TableIcon, Loader2, AlertTriangle, User, Users, Trophy, Medal } from 'lucide-react';
import type {
  Season,
  League, Team, Club, Shooter, ScoreEntry, ShooterDisplayResults,
  CompetitionDisplayConfig, FirestoreLeagueSpecificDiscipline, UIDisciplineSelection, AggregatedCompetitionData, IndividualShooterDisplayData
} from '@/types/rwk';
import { uiDisciplineFilterOptions } from '@/types/rwk'; // Correctly import uiDisciplineFilterOptions
import { Skeleton } from '@/components/ui/skeleton';
import { db } from '@/lib/firebase/config';
import { collection, doc, getDoc, getDocs, query, where, orderBy } from 'firebase/firestore';

// const NUM_ROUNDS = 5; // Standardmäßig 5, wird ggf. durch Saison-Typ angepasst
const TEAM_SIZE_FOR_SCORING = 3;
const EXCLUDED_TEAM_NAME = "SV Dörrigsen Einzel";

const AVAILABLE_YEARS: number[] = [2025];
const AVAILABLE_UI_DISCIPLINES: { value: UIDisciplineSelection, label: string }[] = [
  { value: 'KK', label: 'Kleinkaliber (KK)' },
  { value: 'LD', label: 'Luftdruck (LG/LP)' },
  { value: 'SP', label: 'Sportpistole' },
];

async function fetchCompetitionTeamData(config: CompetitionDisplayConfig, numRoundsForCompetition: number): Promise<AggregatedCompetitionData | null> {
  console.log(`>>> fetchCompetitionTeamData: Starting for year ${config.year}, UI discipline ${config.discipline}`);
  try {
    const seasonsColRef = collection(db, "seasons");
    const qSeasons = query(seasonsColRef,
      where("competitionYear", "==", config.year),
      where("type", "==", config.discipline),
      where("status", "==", "Laufend")
    );
    const seasonsSnapshot = await getDocs(qSeasons);
    if (seasonsSnapshot.empty) {
      console.warn(`>>> fetchCompetitionTeamData: No 'Laufend' seasons found for year ${config.year} and UI discipline ${config.discipline}.`);
      return { id: `${config.year}-${config.discipline}`, config, leagues: [] };
    }
    const laufendeSeasons = seasonsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Season));
    const laufendeSeasonIds = laufendeSeasons.map(s => s.id);
    console.log(`>>> fetchCompetitionTeamData: Found ${laufendeSeasonIds.length} 'Laufend' season(s) matching criteria:`, laufendeSeasonIds);

    const selectedUIDiscOption = uiDisciplineFilterOptions.find(opt => opt.value === config.discipline);
    const firestoreDisciplinesToQuery = selectedUIDiscOption ? selectedUIDiscOption.firestoreTypes : [];

    if (firestoreDisciplinesToQuery.length === 0) {
        console.warn(`>>> fetchCompetitionTeamData: No specific Firestore disciplines to query for UI discipline '${config.discipline}'.`);
        return { id: `${config.year}-${config.discipline}`, config, leagues: [] };
    }
    console.log(`>>> fetchCompetitionTeamData: Firestore specific disciplines to query: ${firestoreDisciplinesToQuery.join(', ')} for UI ${config.discipline}`);

    const leaguesColRef = collection(db, "rwk_leagues");
    const qLeagues = query(leaguesColRef,
      where("seasonId", "in", laufendeSeasonIds),
      where("type", "in", firestoreDisciplinesToQuery),
      orderBy("order", "asc")
    );
    const leaguesSnapshot = await getDocs(qLeagues);
    const fetchedLeagues: League[] = [];

    if (leaguesSnapshot.empty) {
      console.warn(`>>> fetchCompetitionTeamData: No leagues found for 'Laufend' seasons and specified Firestore disciplines.`);
      return { id: `${config.year}-${config.discipline}`, config, leagues: [] };
    }
    console.log(`>>> fetchCompetitionTeamData: Found ${leaguesSnapshot.docs.length} leagues.`);

    for (const leagueDoc of leaguesSnapshot.docs) {
      const leagueData = leagueDoc.data() as Omit<League, 'id'>;
      const league: League & { teams: TeamDisplay[] } = {
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
      console.log(`>>> fetchCompetitionTeamData: League '${league.name}' (${league.id}) has ${teamsSnapshot.docs.length} teams.`);

      for (const teamDoc of teamsSnapshot.docs) {
        const teamData = teamDoc.data() as Omit<Team, 'id'>;
        if (teamData.name === EXCLUDED_TEAM_NAME) {
          console.log(`>>> fetchCompetitionTeamData: Filtering out team: ${teamData.name}`);
          continue;
        }

        const team: TeamDisplay = {
          id: teamDoc.id,
          ...teamData,
          clubName: "Unbek. Verein",
          shootersResults: [],
          roundResults: {},
          totalScore: 0,
          averageScore: null,
          numScoredRounds: 0
        };

        if (team.clubId) {
          try {
            const clubDocRef = doc(db, "clubs", team.clubId);
            const clubSnap = await getDoc(clubDocRef);
            if (clubSnap.exists()) team.clubName = (clubSnap.data() as Club).name || team.clubName;
          } catch (clubError) { console.error(`Error fetching club ${team.clubId}:`, clubError); }
        } else {
          const clubNameMatch = team.name?.match(/^([^\sI]+(?:\s+[^\sI]+)*)/);
          team.clubName = clubNameMatch ? clubNameMatch[1].trim() : team.name || "Unbek. Verein";
        }
        
        const shooterIdsForTeam = teamData.shooterIds || [];
        
        const allScoresForTeamQuery = query(collection(db, "rwk_scores"),
          where("teamId", "==", team.id),
          where("competitionYear", "==", team.competitionYear), 
          where("leagueId", "==", team.leagueId) 
        );
        const allScoresForTeamSnap = await getDocs(allScoresForTeamQuery);
        const teamScores: ScoreEntry[] = allScoresForTeamSnap.docs.map(d => ({id: d.id, ...d.data()} as ScoreEntry));

        const shooterResultsMap = new Map<string, ShooterDisplayResults>();

        for (const shooterId of shooterIdsForTeam) {
           const shooterDocRef = doc(db, "rwk_shooters", shooterId);
           const shooterSnap = await getDoc(shooterDocRef);
           let shooterName = "Unbek. Schütze";
           if (shooterSnap.exists()) {
               const shooterData = shooterSnap.data() as Shooter;
               shooterName = shooterData.name || `${shooterData.firstName} ${shooterData.lastName}`.trim() || shooterName;
           }

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
        
        teamScores.forEach(score => {
          if (shooterResultsMap.has(score.shooterId)) {
            const sr = shooterResultsMap.get(score.shooterId)!;
            if (score.durchgang >= 1 && score.durchgang <= numRoundsForCompetition) {
              const roundKey = `dg${score.durchgang}`;
              sr.results[roundKey] = (sr.results[roundKey] || 0) + score.totalRinge; // Sum if multiple entries for same shooter/round (should not happen ideally)
              if (score.totalRinge !== null) {
                sr.total = (sr.total || 0) + score.totalRinge;
              }
            }
          }
        });

        shooterResultsMap.forEach(sr => {
            let roundsShotCount = 0;
            for (let r = 1; r <= numRoundsForCompetition; r++) {
                if (sr.results[`dg${r}`] !== null) {
                    roundsShotCount++;
                }
            }
            sr.roundsShot = roundsShotCount;
            if (sr.roundsShot > 0 && sr.total !== null) {
                sr.average = parseFloat((sr.total / sr.roundsShot).toFixed(2));
            }
            team.shootersResults.push(sr);
        });
        team.shootersResults.sort((a, b) => (b.total || 0) - (a.total || 0) || a.shooterName.localeCompare(b.shooterName));

        for (let r = 1; r <= numRoundsForCompetition; r++) {
          const roundKey = `dg${r}`;
          const scoresForRound = teamScores
            .filter(s => s.durchgang === r && s.totalRinge !== null && shooterIdsForTeam.includes(s.shooterId))
            .sort((a, b) => b.totalRinge - a.totalRinge);

          if (scoresForRound.length >= TEAM_SIZE_FOR_SCORING) {
            team.roundResults[roundKey] = scoresForRound
              .slice(0, TEAM_SIZE_FOR_SCORING)
              .reduce((sum, score) => sum + score.totalRinge, 0);
          } else if (scoresForRound.length > 0 && scoresForRound.length < TEAM_SIZE_FOR_SCORING) {
            team.roundResults[roundKey] = null; 
          }
          else {
            team.roundResults[roundKey] = null;
          }
        }

        let teamTotalScore = 0;
        let numScoredRounds = 0;
        Object.values(team.roundResults).forEach(score => {
          if (score !== null) {
            teamTotalScore += score;
            numScoredRounds++;
          }
        });
        team.totalScore = teamTotalScore;
        team.numScoredRounds = numScoredRounds;
        team.averageScore = numScoredRounds > 0 ? parseFloat((teamTotalScore / numScoredRounds).toFixed(2)) : null;

        teamDisplays.push(team);
      }
      
      teamDisplays.sort((a, b) => (b.totalScore ?? 0) - (a.totalScore ?? 0) || (b.averageScore ?? 0) - (a.averageScore ?? 0));
      teamDisplays.forEach((team, index) => { team.rank = index + 1; });
      league.teams = teamDisplays;
      fetchedLeagues.push(league);
    }
    console.log(">>> fetchCompetitionTeamData: Successfully fetched and processed team data:", fetchedLeagues);
    return { id: `${config.year}-${config.discipline}`, config, leagues: fetchedLeagues };
  } catch (error) {
    console.error(">>> fetchCompetitionTeamData: Error fetching data:", error);
    throw error;
  }
}

async function fetchIndividualShooterData(config: CompetitionDisplayConfig, numRoundsForCompetition: number): Promise<IndividualShooterDisplayData[]> {
  console.log(`>>> fetchIndividualShooterData: Starting for year ${config.year}, UI discipline ${config.discipline}`);
  try {
    const seasonsColRef = collection(db, "seasons");
    const qSeasons = query(seasonsColRef,
      where("competitionYear", "==", config.year),
      where("type", "==", config.discipline),
      where("status", "==", "Laufend")
    );
    const seasonsSnapshot = await getDocs(qSeasons);
    if (seasonsSnapshot.empty) {
      console.warn(`>>> fetchIndividualShooterData: No 'Laufend' seasons found for year ${config.year} and UI discipline ${config.discipline}.`);
      return [];
    }
    const laufendeSeasons = seasonsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Season));
    const laufendeSeasonIds = laufendeSeasons.map(s => s.id);
    console.log(`>>> fetchIndividualShooterData: Found ${laufendeSeasonIds.length} 'Laufend' season(s) matching criteria:`, laufendeSeasonIds);

    const selectedUIDiscOption = uiDisciplineFilterOptions.find(opt => opt.value === config.discipline);
    const firestoreDisciplinesToQuery = selectedUIDiscOption ? selectedUIDiscOption.firestoreTypes : [];
    
    if (firestoreDisciplinesToQuery.length === 0) {
        console.warn(`>>> fetchIndividualShooterData: No specific Firestore disciplines to query for UI discipline '${config.discipline}'.`);
        return [];
    }
    console.log(`>>> fetchIndividualShooterData: Firestore specific disciplines to query: ${firestoreDisciplinesToQuery.join(', ')} for UI ${config.discipline}`);

    const leaguesColRef = collection(db, "rwk_leagues");
    const qLeaguesForDiscipline = query(leaguesColRef,
      where("seasonId", "in", laufendeSeasonIds),
      where("type", "in", firestoreDisciplinesToQuery)
    );
    const leaguesSnap = await getDocs(qLeaguesForDiscipline);
    if (leaguesSnap.empty) {
      console.warn(`>>> fetchIndividualShooterData: No leagues found for 'Laufend' seasons and specified disciplines.`);
      return [];
    }
    const relevantLeagueIds = leaguesSnap.docs.map(doc => doc.id);
    console.log(`>>> fetchIndividualShooterData: Relevant league IDs for individual scores: ${relevantLeagueIds.join(', ')}`);

    const scoresColRef = collection(db, "rwk_scores");
    const qScores = query(scoresColRef,
      where("competitionYear", "==", config.year),
      where("leagueId", "in", relevantLeagueIds)
    );
    const scoresSnapshot = await getDocs(qScores);
    const allScores: ScoreEntry[] = scoresSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as ScoreEntry));
    console.log(`>>> fetchIndividualShooterData: Fetched ${allScores.length} score entries for relevant leagues.`);

    const shootersMap = new Map<string, IndividualShooterDisplayData>();

    for (const score of allScores) {
      if (score.teamName === EXCLUDED_TEAM_NAME) continue;

      if (!shootersMap.has(score.shooterId)) {
        let shooterName = score.shooterName || "Unbek. Schütze";
        // Optional: Fetch shooter name from rwk_shooters for consistency if needed, though score.shooterName is available
        // const shooterDocRef = doc(db, "rwk_shooters", score.shooterId);
        // const shooterSnap = await getDoc(shooterDocRef);
        // if (shooterSnap.exists()) {
        //     const shooterData = shooterSnap.data() as Shooter;
        //     shooterName = shooterData.name || `${shooterData.firstName} ${shooterData.lastName}`.trim() || shooterName;
        // }

        const initialResults: { [key: string]: number | null } = {};
        for (let r = 1; r <= numRoundsForCompetition; r++) {
          initialResults[`dg${r}`] = null;
        }

        shootersMap.set(score.shooterId, {
          shooterId: score.shooterId,
          shooterName: shooterName,
          shooterGender: score.shooterGender,
          teamName: score.teamName || "Unbek. Team",
          results: initialResults,
          totalScore: 0,
          averageScore: null,
          roundsShot: 0,
        });
      }

      const shooterData = shootersMap.get(score.shooterId)!;
      if (shooterData.shooterName === "Unbek. Schütze" && score.shooterName) shooterData.shooterName = score.shooterName;
      if (shooterData.teamName === "Unbek. Team" && score.teamName) shooterData.teamName = score.teamName;
      if (!shooterData.shooterGender && score.shooterGender) shooterData.shooterGender = score.shooterGender;

      if (score.durchgang >= 1 && score.durchgang <= numRoundsForCompetition && score.totalRinge !== null) {
        const roundKey = `dg${score.durchgang}`;
        shooterData.results[roundKey] = (shooterData.results[roundKey] || 0) + score.totalRinge;
        shooterData.totalScore += score.totalRinge;
      }
    }

    shootersMap.forEach(shooterData => {
      let roundsShotCount = 0;
      for (let r = 1; r <= numRoundsForCompetition; r++) {
        const roundKey = `dg${r}`;
        if (shooterData.results[roundKey] !== undefined && shooterData.results[roundKey] !== null) {
          roundsShotCount++;
        }
      }
      shooterData.roundsShot = roundsShotCount;
      if (shooterData.roundsShot > 0) {
        shooterData.averageScore = parseFloat((shooterData.totalScore / shooterData.roundsShot).toFixed(2));
      }
    });

    const rankedShooters = Array.from(shootersMap.values())
      .sort((a, b) => (b.totalScore ?? 0) - (a.totalScore ?? 0) || (b.averageScore ?? 0) - (a.averageScore ?? 0));
    rankedShooters.forEach((shooter, index) => { shooter.rank = index + 1; });
    console.log(`>>> fetchIndividualShooterData: Processed ${rankedShooters.length} individual shooters.`);
    return rankedShooters;
  } catch (error) {
    console.error(">>> fetchIndividualShooterData: Error fetching data:", error);
    throw error;
  }
}

export default function RwkTabellenPage() {
  const [pageTitle, setPageTitle] = useState<string>("Rundenwettkampf");
  const [selectedCompetition, setSelectedCompetition] = useState<CompetitionDisplayConfig>({
    year: AVAILABLE_YEARS[0],
    discipline: AVAILABLE_UI_DISCIPLINES[0].value,
    displayName: `RWK ${AVAILABLE_YEARS[0]} ${AVAILABLE_UI_DISCIPLINES.find(d => d.value === AVAILABLE_UI_DISCIPLINES[0].value)?.label || AVAILABLE_UI_DISCIPLINES[0].value}`
  });
  const [activeTab, setActiveTab] = useState<"mannschaften" | "einzelschützen">("mannschaften");
  
  const [teamData, setTeamData] = useState<AggregatedCompetitionData | null>(null);
  const [individualData, setIndividualData] = useState<IndividualShooterDisplayData[]>([]);
  const [bestOverallShooter, setBestOverallShooter] = useState<IndividualShooterDisplayData | null>(null);
  const [bestFemaleShooter, setBestFemaleShooter] = useState<IndividualShooterDisplayData | null>(null);
  
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [openTeamDetails, setOpenTeamDetails] = useState<Record<string, boolean>>({});
  const [currentNumRoundsState, setCurrentNumRoundsState] = useState<number>(5); // Default to 5

  useEffect(() => {
    const loadData = async () => {
      console.log(`>>> RwkTabellenPage/useEffect: Triggered. Active tab: ${activeTab}, Year: ${selectedCompetition.year}, Discipline: ${selectedCompetition.discipline}`);
      setLoading(true);
      setError(null);
      setTeamData(null); 
      setIndividualData([]); 
      
      const currentDisciplineLabel = AVAILABLE_UI_DISCIPLINES.find(d => d.value === selectedCompetition.discipline)?.label || selectedCompetition.discipline;
      const dynamicDisplayName = `RWK ${selectedCompetition.year} ${currentDisciplineLabel}`;
      
      if (selectedCompetition.displayName !== dynamicDisplayName) {
        setSelectedCompetition(prev => ({ ...prev, displayName: dynamicDisplayName })); 
      }
      setPageTitle(dynamicDisplayName); 

      let numRoundsForCurrentCompetition = 5; // Default
      try {
        const seasonsColRef = collection(db, "seasons");
        const qSeasonsForRounds = query(seasonsColRef,
          where("competitionYear", "==", selectedCompetition.year),
          where("type", "==", selectedCompetition.discipline),
          where("status", "==", "Laufend")
        );
        const seasonsSnapForRounds = await getDocs(qSeasonsForRounds);
        if (!seasonsSnapForRounds.empty) {
          const seasonForRounds = seasonsSnapForRounds.docs[0].data() as Season;
          numRoundsForCurrentCompetition = seasonForRounds.type === 'SP' ? 7 : 5;
        } else {
          numRoundsForCurrentCompetition = selectedCompetition.discipline === 'SP' ? 7 : 5;
        }
        setCurrentNumRoundsState(numRoundsForCurrentCompetition);
      } catch (seasonError) {
        console.error("Error determining numRounds from season:", seasonError);
        numRoundsForCurrentCompetition = selectedCompetition.discipline === 'SP' ? 7 : 5; // Fallback
        setCurrentNumRoundsState(numRoundsForCurrentCompetition);
      }

      try {
        if (activeTab === "mannschaften") {
          console.log(`>>> RwkTabellenPage/useEffect: Fetching TEAM data for: ${dynamicDisplayName}`);
          const data = await fetchCompetitionTeamData(selectedCompetition, numRoundsForCurrentCompetition);
          setTeamData(data);
          console.log(">>> RwkTabellenPage/useEffect: Team data successfully loaded:", data ? data.leagues.length + " leagues" : "null");
        } else if (activeTab === "einzelschützen") {
          console.log(`>>> RwkTabellenPage/useEffect: Fetching INDIVIDUAL data for: ${dynamicDisplayName}`);
          const individuals = await fetchIndividualShooterData(selectedCompetition, numRoundsForCurrentCompetition);
          setIndividualData(individuals);
          if (individuals.length > 0) {
            const overallBest = individuals.reduce((prev, current) => (prev.totalScore > current.totalScore) ? prev : current);
            setBestOverallShooter(overallBest);

            const females = individuals.filter(s => s.shooterGender && (s.shooterGender.toLowerCase() === 'female' || s.shooterGender.toLowerCase() === 'w'));
            if (females.length > 0) {
                const bestFemale = females.reduce((prev, current) => (prev.totalScore > current.totalScore) ? prev : current);
                setBestFemaleShooter(bestFemale);
            } else {
                setBestFemaleShooter(null);
            }
          } else {
            setBestOverallShooter(null);
            setBestFemaleShooter(null);
          }
          console.log(">>> RwkTabellenPage/useEffect: Individual data successfully loaded:", individuals.length + " shooters");
        }
      } catch (err) {
        console.error(`>>> RwkTabellenPage/useEffect: Failed to load RWK data for ${activeTab}:`, err);
        setError(err as Error);
      } finally {
        setLoading(false);
        console.log(">>> RwkTabellenPage/useEffect: Loading finished.");
      }
    };
    loadData();
  }, [selectedCompetition.year, selectedCompetition.discipline, activeTab]); // Removed selectedCompetition from deps to avoid re-trigger if only displayName changed by itself

  const handleYearChange = (yearString: string) => {
    const year = parseInt(yearString, 10);
    setSelectedCompetition(prev => ({...prev, year, discipline: prev.discipline}));
  };

  const handleDisciplineChange = (discipline: UIDisciplineSelection) => {
    setSelectedCompetition(prev => ({...prev, discipline, year: prev.year }));
  };

  const toggleTeamDetails = (teamId: string) => {
    setOpenTeamDetails(prev => ({ ...prev, [teamId]: !prev[teamId] }));
  };
  
  const renderLoadingSkeleton = () => (
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
              <p className="text-lg">Lade Tabellendaten für {selectedCompetition.displayName || pageTitle}...</p>
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
            <p>Es gab ein Problem beim Abrufen der Daten für {selectedCompetition.displayName || pageTitle}.</p>
            <p className="text-sm mt-2">Fehlermeldung: {error.message}.</p>
            <p className="text-sm mt-2">Überprüfen Sie die Browser-Konsole für Details und die Firestore-Sicherheitsregeln, insbesondere ob Indizes fehlen.</p>
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
        <div className="flex gap-4">
          <Select value={selectedCompetition.year.toString()} onValueChange={handleYearChange}>
            <SelectTrigger className="w-[180px] shadow-md">
              <SelectValue placeholder="Jahr wählen" />
            </SelectTrigger>
            <SelectContent>
              {AVAILABLE_YEARS.map(year => (
                <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedCompetition.discipline} onValueChange={(value) => handleDisciplineChange(value as UIDisciplineSelection)}>
            <SelectTrigger className="w-[220px] shadow-md">
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
          {loading && renderLoadingSkeleton()}
          {!loading && !error && (!teamData || teamData.leagues.length === 0) && (
            <Card className="shadow-lg"><CardHeader><CardTitle className="text-accent">Keine Ligen für {selectedCompetition.displayName || pageTitle}</CardTitle></CardHeader>
              <CardContent className="text-center py-12 p-6">
                <p className="text-lg text-muted-foreground">
                    {teamData === null && !loading ? `Keine Daten für ${selectedCompetition.displayName || pageTitle} gefunden oder keine Saisons mit Status 'Laufend'.` : 
                     `Für ${selectedCompetition.displayName || pageTitle} wurden keine Ligen gefunden, die den Status "Laufend" haben, oder es sind keine Ergebnisse vorhanden.`}
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
                            <React.Fragment>
                              <TableHead className="w-[40px] text-center">#</TableHead>
                              <TableHead>Mannschaft</TableHead>
                              {[...Array(currentNumRoundsState)].map((_, i) => (<TableHead key={`dg${i + 1}`} className="text-center">DG {i + 1}</TableHead>))}
                              <TableHead className="text-center font-semibold">Gesamt</TableHead>
                              <TableHead className="text-center font-semibold">Schnitt</TableHead>
                              <TableHead className="w-[50px]"></TableHead>
                            </React.Fragment>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {league.teams.sort((a,b) => (a.rank || 999) - (b.rank || 999)).map((team) => ( 
                            <React.Fragment key={team.id}>
                              <TableRow className="hover:bg-secondary/20 transition-colors">
                                <React.Fragment>
                                  <TableCell className="text-center font-medium">{team.rank}</TableCell>
                                  <TableCell className="font-medium text-foreground">{team.name}</TableCell>
                                  {[...Array(currentNumRoundsState)].map((_, i) => (
                                    <TableCell key={`dg${i + 1}-${team.id}`} className="text-center">{(team.roundResults as any)?.[`dg${i + 1}`] ?? '-'}</TableCell>
                                  ))}
                                  <TableCell className="text-center font-semibold text-primary">{team.totalScore ?? '-'}</TableCell>
                                  <TableCell className="text-center font-medium text-muted-foreground">{team.averageScore != null ? team.averageScore.toFixed(2) : '-'}</TableCell>
                                  <TableCell className="text-center">
                                    <button onClick={() => toggleTeamDetails(team.id)} className="p-1 hover:bg-accent/20 rounded-md text-muted-foreground hover:text-accent" aria-expanded={!!openTeamDetails[team.id]} aria-controls={`team-details-${team.id}`}>
                                      <ChevronDown className={`h-5 w-5 transition-transform ${openTeamDetails[team.id] ? 'rotate-180' : ''}`} /><span className="sr-only">Details</span>
                                    </button>
                                  </TableCell>
                                </React.Fragment>
                              </TableRow>
                              {openTeamDetails[team.id] && (
                                 <TableRow id={`team-details-${team.id}`} className="bg-muted/5 hover:bg-muted/10 transition-colors">
                                   <TableCell colSpan={currentNumRoundsState + 5} className="p-0">
                                      <div className="px-2 py-1 md:px-4 md:py-2 bg-secondary/10">
                                        {team.shootersResults && team.shootersResults.length > 0 ? (
                                          <Table>
                                            <TableHeader><TableRow className="border-b-0 bg-transparent">
                                              <React.Fragment>
                                                <TableHead className="text-foreground/80 font-normal pl-2">Schütze</TableHead>
                                                {[...Array(currentNumRoundsState)].map((_, i) => (<TableHead key={`shooter-dg${i + 1}`} className="text-center text-foreground/80 font-normal">DG {i + 1}</TableHead>))}
                                                <TableHead className="text-center font-semibold text-foreground/80">Gesamt</TableHead>
                                                <TableHead className="text-center font-semibold text-foreground/80 pr-2">Schnitt</TableHead>
                                              </React.Fragment>
                                            </TableRow></TableHeader>
                                            <TableBody>
                                              {team.shootersResults.map(shooterRes => (
                                                <TableRow key={shooterRes.shooterId} className="border-b-0 hover:bg-accent/5">
                                                  <React.Fragment>
                                                    <TableCell className="font-medium pl-2">{shooterRes.shooterName || shooterRes.shooterId}</TableCell>
                                                    {[...Array(currentNumRoundsState)].map((_, i) => (<TableCell key={`shooter-dg${i + 1}-${shooterRes.shooterId}`} className="text-center">{shooterRes.results?.[`dg${i + 1}`] ?? '-'}</TableCell>))}
                                                    <TableCell className="text-center font-medium">{shooterRes.total ?? '-'}</TableCell>
                                                    <TableCell className="text-center font-semibold text-primary pr-2">{shooterRes.average != null ? shooterRes.average.toFixed(2) : '-'}</TableCell>
                                                  </React.Fragment>
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
                    {league.teams.length === 0 && (<p className="p-4 text-center text-muted-foreground">Keine Mannschaften in dieser Liga für {selectedCompetition.displayName || pageTitle} vorhanden.</p>)}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </TabsContent>

        <TabsContent value="einzelschützen">
          {loading && renderLoadingSkeleton()}
          {!loading && !error && individualData.length === 0 && (
            <Card className="shadow-lg">
                <CardHeader><CardTitle className="text-accent">Keine Einzelschützen</CardTitle></CardHeader>
              <CardContent className="text-center py-12 p-6">
                <p className="text-lg text-muted-foreground">
                    Für {selectedCompetition.displayName || pageTitle} wurden keine Einzelschützenergebnisse gefunden oder es gibt keine Saisons mit Status "Laufend".
                </p>
                <p className="text-sm mt-1">Bitte überprüfen Sie den Status der Saison in der <a href="/admin/seasons" className="underline hover:text-primary">Saisonverwaltung</a>.</p>
              </CardContent>
            </Card>
          )}
          {!loading && !error && individualData.length > 0 && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {bestOverallShooter && (
                  <Card className="shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-lg font-medium text-primary">Bester Schütze</CardTitle>
                      <Trophy className="h-5 w-5 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">{bestOverallShooter.shooterName}</p>
                      <p className="text-sm text-muted-foreground">{bestOverallShooter.teamName}</p>
                      <p className="text-lg">Gesamt: <span className="font-semibold">{bestOverallShooter.totalScore}</span> Ringe</p>
                      <p className="text-sm">Schnitt: {bestOverallShooter.averageScore?.toFixed(2)} ({bestOverallShooter.roundsShot} DG)</p>
                    </CardContent>
                  </Card>
                )}
                 {bestFemaleShooter && (
                  <Card className="shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-lg font-medium text-primary">Beste Dame</CardTitle>
                      <Medal className="h-5 w-5 text-pink-500" />
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">{bestFemaleShooter.shooterName}</p>
                      <p className="text-sm text-muted-foreground">{bestFemaleShooter.teamName}</p>
                      <p className="text-lg">Gesamt: <span className="font-semibold">{bestFemaleShooter.totalScore}</span> Ringe</p>
                      <p className="text-sm">Schnitt: {bestFemaleShooter.averageScore?.toFixed(2)} ({bestFemaleShooter.roundsShot} DG)</p>
                    </CardContent>
                  </Card>
                )}
                {!bestOverallShooter && !loading && <Card className="shadow-lg"><CardContent className="pt-6 text-muted-foreground">Kein bester Schütze ermittelt.</CardContent></Card>}
                {!bestFemaleShooter && !loading && <Card className="shadow-lg"><CardContent className="pt-6 text-muted-foreground">Keine beste Dame ermittelt.</CardContent></Card>}
              </div>

              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-xl text-accent">Einzelrangliste</CardTitle>
                  <CardDescription>Alle Schützen sortiert nach Gesamtergebnis für {selectedCompetition.displayName}.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader><TableRow className="bg-muted/50">
                        <React.Fragment>
                          <TableHead className="w-[40px] text-center">#</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Mannschaft</TableHead>
                          {[...Array(currentNumRoundsState)].map((_, i) => (<TableHead key={`ind-dg${i + 1}`} className="text-center">DG {i + 1}</TableHead>))}
                          <TableHead className="text-center font-semibold">Gesamt</TableHead>
                          <TableHead className="text-center font-semibold">Schnitt</TableHead>
                        </React.Fragment>
                      </TableRow></TableHeader>
                      <TableBody>
                        {individualData.map(shooter => (
                          <TableRow key={shooter.shooterId} className="hover:bg-secondary/20 transition-colors">
                            <React.Fragment>
                              <TableCell className="text-center font-medium">{shooter.rank}</TableCell>
                              <TableCell className="font-medium text-foreground">{shooter.shooterName}</TableCell>
                              <TableCell className="text-sm text-muted-foreground">{shooter.teamName}</TableCell>
                              {[...Array(currentNumRoundsState)].map((_, i) => (<TableCell key={`ind-dg${i + 1}-${shooter.shooterId}`} className="text-center">{shooter.results?.[`dg${i + 1}`] ?? '-'}</TableCell>))}
                              <TableCell className="text-center font-semibold text-primary">{shooter.totalScore}</TableCell>
                              <TableCell className="text-center font-medium text-muted-foreground">{shooter.averageScore != null ? shooter.averageScore.toFixed(2) : '-'}</TableCell>
                            </React.Fragment>
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
    </div>
  );
}
