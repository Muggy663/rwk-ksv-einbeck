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
import { uiDisciplineFilterOptions } from '@/types/rwk'; 

import { Skeleton } from '@/components/ui/skeleton';
import { db } from '@/lib/firebase/config';
import { collection, doc, getDoc, getDocs, query, where, orderBy, limit } from 'firebase/firestore'; // Added limit here

const TEAM_SIZE_FOR_SCORING = 3;
const EXCLUDED_TEAM_NAME = "SV Dörrigsen Einzel";

const AVAILABLE_YEARS: number[] = [2025]; 

const AVAILABLE_UI_DISCIPLINES: { value: UIDisciplineSelection, label: string }[] = [
  { value: 'KK', label: 'Kleinkaliber (KK)' },
  { value: 'LD', label: 'Luftdruck (LG/LP)' },
];


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
    if (seasonsSnapshot.empty) {
      console.warn(`>>> RWK-TABLE: No 'Laufend' seasons found for year ${config.year} and UI discipline ${config.discipline}.`);
      return { id: `${config.year}-${config.discipline}`, config, leagues: [] };
    }
    const laufendeSeasons = seasonsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Season));
    const laufendeSeasonIds = laufendeSeasons.map(s => s.id);
    console.log(`>>> RWK-TABLE: Found ${laufendeSeasonIds.length} 'Laufend' season(s) matching criteria:`, laufendeSeasonIds);

    const selectedUIDiscOption = uiDisciplineFilterOptions.find(opt => opt.value === config.discipline);
    if (!selectedUIDiscOption) {
        console.warn(`>>> RWK-TABLE: No UI discipline option found for '${config.discipline}'. Cannot determine Firestore types.`);
        return { id: `${config.year}-${config.discipline}`, config, leagues: [] };
    }
    const firestoreDisciplinesToQuery: FirestoreLeagueSpecificDiscipline[] = selectedUIDiscOption.firestoreTypes;


    if (firestoreDisciplinesToQuery.length === 0) {
        console.warn(`>>> RWK-TABLE: No specific Firestore disciplines to query for UI discipline '${config.discipline}'.`);
        return { id: `${config.year}-${config.discipline}`, config, leagues: [] };
    }
    console.log(`>>> RWK-TABLE: Firestore specific disciplines to query: ${firestoreDisciplinesToQuery.join(', ')} for UI ${config.discipline}`);

    const leaguesColRef = collection(db, "rwk_leagues");
    const qLeagues = query(leaguesColRef,
      where("seasonId", "in", laufendeSeasonIds),
      where("type", "in", firestoreDisciplinesToQuery),
      orderBy("order", "asc")
    );
    const leaguesSnapshot = await getDocs(qLeagues);
    const fetchedLeaguesData: LeagueDisplay[] = [];

    if (leaguesSnapshot.empty) {
      console.warn(`>>> RWK-TABLE: No leagues found for 'Laufend' seasons and specified Firestore disciplines.`);
      return { id: `${config.year}-${config.discipline}`, config, leagues: [] };
    }
    console.log(`>>> RWK-TABLE: Found ${leaguesSnapshot.docs.length} leagues.`);

    const clubCache = new Map<string, string>();
    const shooterCache = new Map<string, Shooter>();
    const scoresCache = new Map<string, ScoreEntry[]>(); // Cache scores per teamId

    for (const leagueDoc of leaguesSnapshot.docs) {
      const leagueData = leagueDoc.data() as Omit<League, 'id' | 'teams'>;
      const league: LeagueDisplay = {
        id: leagueDoc.id,
        ...leagueData,
        teams: [],
      };
      let teamDisplays: TeamDisplay[] = [];

      const teamsColRef = collection(db, "rwk_teams");
      // Ensure that 'competitionYear' for teams matches the config year.
      // This is important if a leagueId could theoretically span multiple competitionYears (unlikely in this model but good for robustness).
      const qTeams = query(teamsColRef,
        where("leagueId", "==", league.id),
        where("competitionYear", "==", config.year) 
      );
      const teamsSnapshot = await getDocs(qTeams);
      console.log(`>>> RWK-TABLE: League '${league.name}' (${league.id}) has ${teamsSnapshot.docs.length} teams for year ${config.year}.`);


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
              }
            } catch (clubError) { console.error(`Error fetching club ${teamData.clubId}:`, clubError); }
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

        // Initialize ShooterDisplayResults for all shooters in the team
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
                  console.warn(`Shooter with ID ${shooterId} not found in rwk_shooters for team ${team.id}`);
                }
             } catch (shooterError) { console.error(`Error fetching shooter ${shooterId}:`, shooterError); }
           }
           const shooterName = shooterInfo?.name || `Schütze ${shooterId.substring(0,5)}`;

           const sResults: ShooterDisplayResults = {
             shooterId: shooterId,
             shooterName: shooterName,
             results: {}, // Initialized with empty results
             average: null,
             total: 0,
             roundsShot: 0,
             teamId: team.id,
             leagueId: league.id,
             competitionYear: team.competitionYear,
           };
           for (let r = 1; r <= numRoundsForCompetition; r++) sResults.results[`dg${r}`] = null; // Explicitly null
           shooterResultsMap.set(shooterId, sResults);
        }
        
        // Fetch scores for all shooters of this team in one go
        let teamScores: ScoreEntry[] = [];
        if (scoresCache.has(team.id)) {
            teamScores = scoresCache.get(team.id)!;
        } else if (shooterIdsForTeam.length > 0) { 
             // Query for scores where shooterId is one of the team's shooters
            const teamScoresQuery = query(collection(db, "rwk_scores"),
              where("teamId", "==", team.id), // Ensure scores are for this specific team context
              where("competitionYear", "==", team.competitionYear), // And this competition year
              where("leagueId", "==", team.leagueId), // And this league
              where("shooterId", "in", shooterIdsForTeam) // Scores for any of the team's shooters
            );
            const teamScoresSnap = await getDocs(teamScoresQuery);
            teamScores = teamScoresSnap.docs.map(d => ({id: d.id, ...d.data()} as ScoreEntry));
            scoresCache.set(team.id, teamScores); // Cache the fetched scores for this team
            console.log(`>>> RWK-TABLE: Fetched ${teamScores.length} scores for team ${team.name} (ID: ${team.id})`);
        }


        // Populate results for each shooter
        teamScores.forEach(score => {
          if (shooterResultsMap.has(score.shooterId)) {
            const sr = shooterResultsMap.get(score.shooterId)!;
            if (score.durchgang >= 1 && score.durchgang <= numRoundsForCompetition) {
              const roundKey = `dg${score.durchgang}`;
              // Accumulate if multiple scores per round per shooter (though typically there'd be one)
              sr.results[roundKey] = (sr.results[roundKey] === null ? 0 : sr.results[roundKey] || 0) + score.totalRinge; 
              if (score.totalRinge !== null) {
                sr.total = (sr.total || 0) + score.totalRinge;
              }
            }
          } else {
            // This case should ideally not happen if shooterIdsForTeam is the source of truth
            console.warn(`Score found for shooter ${score.shooterId} not listed in team ${team.id}. Score:`, score);
          }
        });
        

        // Calculate average and rounds shot for each shooter
        shooterResultsMap.forEach(sr => {
            let roundsShotCount = 0;
            for (let r = 1; r <= numRoundsForCompetition; r++) {
                if (sr.results[`dg${r}`] !== null && sr.results[`dg${r}`] !== undefined) {
                    roundsShotCount++;
                }
            }
            sr.roundsShot = roundsShotCount;
            if (sr.roundsShot > 0 && sr.total !== null) {
                sr.average = parseFloat((sr.total / sr.roundsShot).toFixed(2));
            }
            team.shootersResults.push(sr);
        });
        // Sort shooters within the team by total score, then by name
        team.shootersResults.sort((a, b) => (b.total || 0) - (a.total || 0) || a.shooterName.localeCompare(b.shooterName) );


        // Calculate team round results based on top N shooters
        for (let r = 1; r <= numRoundsForCompetition; r++) {
          const roundKey = `dg${r}`;
          const scoresForRoundFromShooters = team.shootersResults
            .map(sr => sr.results[roundKey])
            .filter(score => score !== null && score !== undefined) as number[]; // Ensure only numbers
          
          scoresForRoundFromShooters.sort((a, b) => b - a); // Sort descending

          if (scoresForRoundFromShooters.length >= TEAM_SIZE_FOR_SCORING) {
            team.roundResults[roundKey] = scoresForRoundFromShooters
              .slice(0, TEAM_SIZE_FOR_SCORING)
              .reduce((sum, score) => sum + score, 0);
          } else {
            // If not enough scores for a full team result, set to null
            // Or, if you want to sum available scores even if less than TEAM_SIZE_FOR_SCORING:
            // team.roundResults[roundKey] = scoresForRoundFromShooters.reduce((sum, score) => sum + score, 0);
            // For now, let's stick to requiring a full team for a round score:
            team.roundResults[roundKey] = null;
          }
        }

        // Calculate team total and average
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
      
      // Sort teams within the league by total score, then average, then name
      teamDisplays.sort((a, b) => (b.totalScore ?? 0) - (a.totalScore ?? 0) || (b.averageScore ?? 0) - (a.averageScore ?? 0) || a.clubName.localeCompare(b.clubName) || a.name.localeCompare(b.name) );
      teamDisplays.forEach((team, index) => { team.rank = index + 1; });
      league.teams = teamDisplays;
      fetchedLeaguesData.push(league);
    }
    console.log(">>> RWK-TABLE: Successfully fetched and processed team data.");
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
    if (!selectedUIDiscOption) {
        console.warn(`>>> RWK-TABLE: No UI discipline option found for '${config.discipline}' (fetchIndividual). Cannot determine Firestore types.`);
        return [];
    }
    const firestoreDisciplinesToQuery: FirestoreLeagueSpecificDiscipline[] = selectedUIDiscOption.firestoreTypes;
    
    if (firestoreDisciplinesToQuery.length === 0) {
        console.warn(`>>> RWK-TABLE: No specific Firestore disciplines to query for UI discipline '${config.discipline}' (fetchIndividual).`);
        return [];
    }

    const leaguesColRef = collection(db, "rwk_leagues");
    // Query for leagues matching the season and the specific firestore discipline types
    const qLeaguesForDiscipline = query(leaguesColRef,
      where("seasonId", "in", laufendeSeasonIds),
      where("type", "in", firestoreDisciplinesToQuery)
    );
    const leaguesSnap = await getDocs(qLeaguesForDiscipline);
    if (leaguesSnap.empty) {
      console.warn(`>>> RWK-TABLE: No leagues found for 'Laufend' seasons and specified disciplines (fetchIndividual).`);
      return [];
    }
    const relevantLeagueIds = leaguesSnap.docs.map(doc => doc.id);
    console.log(`>>> RWK-TABLE: Relevant league IDs for individual scores: ${relevantLeagueIds.join(', ')}`);

    const scoresColRef = collection(db, "rwk_scores");
    // Ensure we only fetch scores for the relevant competitionYear and from the relevant leagues
    const qScores = query(scoresColRef,
      where("competitionYear", "==", config.year),
      where("leagueId", "in", relevantLeagueIds) 
    );
    const scoresSnapshot = await getDocs(qScores);
    const allScores: ScoreEntry[] = scoresSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as ScoreEntry));
    console.log(`>>> RWK-TABLE: Fetched ${allScores.length} score entries for relevant leagues (fetchIndividual).`);

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
          shooterGender: score.shooterGender, 
          teamName: score.teamName || "Unbek. Team",
          results: initialResults,
          totalScore: 0,
          averageScore: null,
          roundsShot: 0,
        });
      }

      const shooterData = shootersMap.get(score.shooterId)!;
      // Consistently use names from the first encountered score or update if current is better
      if ((shooterData.shooterName === "Unbek. Schütze" || !shooterData.shooterName) && score.shooterName) shooterData.shooterName = score.shooterName;
      if ((shooterData.teamName === "Unbek. Team" || !shooterData.teamName) && score.teamName) shooterData.teamName = score.teamName;
      
      // Consolidate gender: if any record says 'female', it's female. Otherwise, if any says 'male', it's male.
      if (score.shooterGender) {
        const newGender = score.shooterGender.toLowerCase();
        if (newGender === 'female' || newGender === 'w') {
            shooterData.shooterGender = 'female'; // Prioritize female if ever encountered
        } else if ((newGender === 'male' || newGender === 'm') && shooterData.shooterGender !== 'female') {
            // Only set to male if not already set to female
            shooterData.shooterGender = 'male';
        } else if (!shooterData.shooterGender) { // If not set at all, take the current value
             shooterData.shooterGender = score.shooterGender;
        }
      }


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
      .sort((a, b) => (b.totalScore ?? 0) - (a.totalScore ?? 0) || (b.averageScore ?? 0) - (a.averageScore ?? 0) || a.shooterName.localeCompare(b.shooterName));
    rankedShooters.forEach((shooter, index) => { shooter.rank = index + 1; });
    console.log(`>>> RWK-TABLE: Processed ${rankedShooters.length} individual shooters.`);
    return rankedShooters;
  } catch (error) {
    console.error(">>> RWK-TABLE: Error fetching individual shooter data:", error);
    throw error;
  }
}

export default function RwkTabellenPage() {
  const [pageTitle, setPageTitle] = useState<string>("Rundenwettkampf");
  const [selectedCompetition, setSelectedCompetition] = useState<CompetitionDisplayConfig>(() => {
    const initialYear = AVAILABLE_YEARS[0];
    const initialDiscipline = AVAILABLE_UI_DISCIPLINES[0].value;
    const initialDisciplineLabel = AVAILABLE_UI_DISCIPLINES.find(d => d.value === initialDiscipline)?.label || initialDiscipline;
    return {
      year: initialYear,
      discipline: initialDiscipline,
      displayName: `RWK ${initialYear} ${initialDisciplineLabel}`
    };
  });
  const [activeTab, setActiveTab] = useState<"mannschaften" | "einzelschützen">("mannschaften");
  
  const [teamData, setTeamData] = useState<AggregatedCompetitionData | null>(null);
  const [individualData, setIndividualData] = useState<IndividualShooterDisplayData[]>([]);
  const [topMaleShooter, setTopMaleShooter] = useState<IndividualShooterDisplayData | null>(null);
  const [topFemaleShooter, setTopFemaleShooter] = useState<IndividualShooterDisplayData | null>(null);
  
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [openTeamDetails, setOpenTeamDetails] = useState<Record<string, boolean>>({});
  const [currentNumRoundsState, setCurrentNumRoundsState] = useState<number>(5); // Default to 5 (KK)

  useEffect(() => {
    const loadData = async () => {
      console.log(`>>> RWK-TABLE: useEffect triggered. Active tab: ${activeTab}, Year: ${selectedCompetition.year}, Discipline: ${selectedCompetition.discipline}`);
      setLoading(true);
      setError(null);
      
      const currentDisciplineLabel = AVAILABLE_UI_DISCIPLINES.find(d => d.value === selectedCompetition.discipline)?.label || selectedCompetition.discipline;
      const dynamicDisplayName = `RWK ${selectedCompetition.year} ${currentDisciplineLabel}`;
      
      if (pageTitle !== dynamicDisplayName) {
        setPageTitle(dynamicDisplayName);
      }
      
      // Determine number of rounds based on selected UI discipline
      // This part assumes 'LD' generally means 4 rounds, 'KK' means 5.
      // A more robust way would be to fetch a league of that type for the season and check its specific discipline.
      let numRoundsForCurrentCompetition = 5; // Default for KK
      
      // Attempt to fetch a representative league to determine number of rounds
      const seasonForRoundsQuery = query(collection(db, "seasons"),
        where("competitionYear", "==", selectedCompetition.year),
        where("type", "==", selectedCompetition.discipline), // Use UI discipline type for season query
        where("status", "==", "Laufend")
      );
      try {
        const seasonsSnapForRounds = await getDocs(seasonForRoundsQuery);
        if (!seasonsSnapForRounds.empty) {
            const firstSeasonDocId = seasonsSnapForRounds.docs[0].id;
            // Get Firestore specific types for the selected UI discipline
            const uiDiscOption = uiDisciplineFilterOptions.find(opt => opt.value === selectedCompetition.discipline);
            const firestoreTypesForUIDisc = uiDiscOption ? uiDiscOption.firestoreTypes : [];

            if (firestoreTypesForUIDisc.length > 0) {
                const leagueForRoundsQuery = query(collection(db, "rwk_leagues"), 
                    where("seasonId", "==", firstSeasonDocId),
                    where("type", "in", firestoreTypesForUIDisc), // Query for any of the specific types
                    limit(1) // We only need one league to check its type
                );
                const leagueSnap = await getDocs(leagueForRoundsQuery);
                if(!leagueSnap.empty){
                    const leagueData = leagueSnap.docs[0].data() as League;
                    const lgLpTypes: FirestoreLeagueSpecificDiscipline[] = ['LG', 'LGA', 'LP', 'LPA'];
                    if (lgLpTypes.includes(leagueData.type)) { // Check if the specific type is an air rifle/pistol type
                        numRoundsForCurrentCompetition = 4;
                    } else { // KKG, KKP etc.
                        numRoundsForCurrentCompetition = 5;
                    }
                } else {
                     // Fallback if no league found for the season with specific types, use UI discipline type
                    numRoundsForCurrentCompetition = selectedCompetition.discipline === 'LD' ? 4 : 5;
                    console.warn(`>>> RWK-TABLE: No leagues found for season ${firstSeasonDocId} with types [${firestoreTypesForUIDisc.join(', ')}]. Defaulting rounds based on UI discipline.`);
                }
            } else {
                 numRoundsForCurrentCompetition = selectedCompetition.discipline === 'LD' ? 4 : 5;
                 console.warn(`>>> RWK-TABLE: No Firestore specific types for UI discipline ${selectedCompetition.discipline}. Defaulting rounds based on UI discipline.`);
            }
        } else {
           console.warn(`>>> RWK-TABLE: No 'Laufend' season found to determine numRounds for ${selectedCompetition.year} ${selectedCompetition.discipline}. Defaulting rounds based on UI discipline.`);
           numRoundsForCurrentCompetition = selectedCompetition.discipline === 'LD' ? 4 : 5;
        }
      } catch(e) {
        console.error("Error fetching season/league for rounds count", e);
        numRoundsForCurrentCompetition = selectedCompetition.discipline === 'LD' ? 4 : 5; // Fallback
      }
      setCurrentNumRoundsState(numRoundsForCurrentCompetition);
      console.log(`>>> RWK-TABLE: Number of rounds for this competition set to: ${numRoundsForCurrentCompetition}`);

      try {
        if (activeTab === "mannschaften") {
          console.log(`>>> RWK-TABLE: Fetching TEAM data for: ${dynamicDisplayName}`);
          const data = await fetchCompetitionTeamData(selectedCompetition, numRoundsForCurrentCompetition);
          setTeamData(data);
          console.log(">>> RWK-TABLE: Team data successfully loaded:", data ? data.leagues.length + " leagues" : "null");
        } else if (activeTab === "einzelschützen") {
          console.log(`>>> RWK-TABLE: Fetching INDIVIDUAL data for: ${dynamicDisplayName}`);
          const individuals = await fetchIndividualShooterData(selectedCompetition, numRoundsForCurrentCompetition);
          setIndividualData(individuals);

          if (individuals.length > 0) {
            const males = individuals.filter(s => s.shooterGender && (s.shooterGender.toLowerCase() === 'male' || s.shooterGender.toLowerCase() === 'm'));
            setTopMaleShooter(males.length > 0 ? males.sort((a, b) => (b.totalScore ?? 0) - (a.totalScore ?? 0) || (b.averageScore ?? 0) - (a.averageScore ?? 0))[0] : null);
            
            const females = individuals.filter(s => s.shooterGender && (s.shooterGender.toLowerCase() === 'female' || s.shooterGender.toLowerCase() === 'w'));
            setTopFemaleShooter(females.length > 0 ? females.sort((a,b) => (b.totalScore ?? 0) - (a.totalScore ?? 0) || (b.averageScore ?? 0) - (a.averageScore ?? 0))[0] : null);
          } else {
            setTopMaleShooter(null);
            setTopFemaleShooter(null);
          }
          console.log(">>> RWK-TABLE: Individual data successfully loaded:", individuals.length + " shooters");
        }
      } catch (err) {
        console.error(`>>> RWK-TABLE: Failed to load RWK data for ${activeTab}:`, err);
        setError(err as Error);
      } finally {
        setLoading(false);
        console.log(">>> RWK-TABLE: Loading finished.");
      }
    };
    loadData();
  }, [selectedCompetition.year, selectedCompetition.discipline, activeTab, pageTitle]); // Removed pageTitle as direct dependency

  const handleYearChange = (yearString: string) => {
    const year = parseInt(yearString, 10);
    setSelectedCompetition(prev => {
      const newDisplayName = `RWK ${year} ${AVAILABLE_UI_DISCIPLINES.find(d => d.value === prev.discipline)?.label || prev.discipline}`;
      return {...prev, year, displayName: newDisplayName};
    });
  };

  const handleDisciplineChange = (discipline: UIDisciplineSelection) => {
     setSelectedCompetition(prev => {
      const newDisplayName = `RWK ${prev.year} ${AVAILABLE_UI_DISCIPLINES.find(d => d.value === discipline)?.label || discipline}`;
      return {...prev, discipline, displayName: newDisplayName };
    });
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
              <p className="text-lg">Lade Tabellendaten für {pageTitle}...</p>
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
            <Card className="shadow-lg"><CardHeader><CardTitle className="text-accent">Keine Ligen für {pageTitle}</CardTitle></CardHeader>
              <CardContent className="text-center py-12 p-6">
                <p className="text-lg text-muted-foreground">
                    {teamData === null && !loading ? `Keine Daten für ${pageTitle} gefunden oder keine Saisons mit Status 'Laufend'.` : 
                     `Für ${pageTitle} wurden keine Ligen gefunden, die den Status "Laufend" haben, oder es sind keine Ergebnisse vorhanden.`}
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
                                    <button onClick={() => toggleTeamDetails(team.id)} className="p-1 hover:bg-accent/20 rounded-md text-muted-foreground hover:text-accent" aria-expanded={!!openTeamDetails[team.id]} aria-controls={`team-details-${team.id}`}>
                                      <ChevronDown className={`h-5 w-5 transition-transform ${openTeamDetails[team.id] ? 'rotate-180' : ''}`} /><span className="sr-only">Details</span>
                                    </button>
                                  </TableCell>
                                
                              </TableRow>
                              {openTeamDetails[team.id] && (
                                 <TableRow id={`team-details-${team.id}`} className="bg-muted/5 hover:bg-muted/10 transition-colors">
                                   <TableCell colSpan={currentNumRoundsState + 5} className="p-0"> {/* Adjusted colSpan */}
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
          {loading && renderLoadingSkeleton()}
          {!loading && !error && individualData.length === 0 && (
            <Card className="shadow-lg">
                <CardHeader><CardTitle className="text-accent">Keine Einzelschützen</CardTitle></CardHeader>
              <CardContent className="text-center py-12 p-6">
                <p className="text-lg text-muted-foreground">
                    Für {pageTitle} wurden keine Einzelschützenergebnisse gefunden oder es gibt keine Saisons mit Status "Laufend".
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
                {!topMaleShooter && !loading && activeTab === "einzelschützen" && (
                  <Card className="shadow-lg"><CardContent className="pt-6 text-muted-foreground">Kein bester Schütze ermittelt.</CardContent></Card>
                )}
                {!topFemaleShooter && !loading && activeTab === "einzelschützen" && (
                  <Card className="shadow-lg"><CardContent className="pt-6 text-muted-foreground">Keine beste Dame ermittelt.</CardContent></Card>
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
                          {[...Array(currentNumRoundsState)].map((_, i) => (<TableHead key={`ind-dg${i + 1}`} className="text-center">DG {i + 1}</TableHead>))}
                          <TableHead className="text-center font-semibold">Gesamt</TableHead>
                          <TableHead className="text-center font-semibold">Schnitt</TableHead>
                        
                      </TableRow></TableHeader>
                      <TableBody>
                        {individualData.map(shooter => (
                          <TableRow key={shooter.shooterId} className="hover:bg-secondary/20 transition-colors">
                            
                              <TableCell className="text-center font-medium">{shooter.rank}</TableCell>
                              <TableCell className="font-medium text-foreground">{shooter.shooterName}</TableCell>
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
    </div>
  );
}
