// src/app/rwk-tabellen/page.tsx
"use client";
import React, { useState, useEffect, useMemo } from 'react';
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
import { ChevronDown, TableIcon, Loader2, AlertTriangle, InfoIcon, User, Users, Trophy, Medal } from 'lucide-react';
import type {
  League, LeagueDisplay, Team, TeamDisplay, Club, Shooter, ScoreEntry, ShooterDisplayResults,
  CompetitionDisplayConfig, CompetitionDiscipline, AggregatedCompetitionData, IndividualShooterDisplayData
} from '@/types/rwk';
import { Skeleton } from '@/components/ui/skeleton';
import { db } from '@/lib/firebase/config';
import { collection, doc, getDoc, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { Button } from '@/components/ui/button';


const NUM_ROUNDS = 5;
const TEAM_SIZE_FOR_SCORING = 3;

// Verfügbare Wettkampfjahre und Disziplinen (könnte auch dynamisch geladen werden)
const AVAILABLE_YEARS: number[] = [2026, 2025, 2024, 2023]; // Beispiel
const AVAILABLE_DISCIPLINES: { value: CompetitionDiscipline, label: string }[] = [
  { value: 'KK', label: 'Kleinkaliber (KK)' },
  { value: 'LG', label: 'Luftgewehr (LG)' },
  { value: 'LP', label: 'Luftpistole (LP)' },
  { value: 'SP', label: 'Sportpistole (SP)' },
];

async function fetchCompetitionTeamData(config: CompetitionDisplayConfig): Promise<AggregatedCompetitionData | null> {
  try {
    console.log(`Fetching team data for competition: ${config.displayName}`);

    const leaguesColRef = collection(db, "rwk_leagues");
    const qLeagues = query(leaguesColRef,
      where("competitionYear", "==", config.year),
      where("type", "==", config.discipline), // Filter nach Disziplin
      orderBy("order", "asc")
    );
    const leaguesSnapshot = await getDocs(qLeagues);
    const leagueDisplays: LeagueDisplay[] = [];

    if (leaguesSnapshot.empty) {
      console.warn(`No leagues found for year '${config.year}' and discipline '${config.discipline}'.`);
      return {
        id: `${config.year}-${config.discipline}`,
        config: config,
        leagues: [],
      };
    }
    console.log(`Found ${leaguesSnapshot.docs.length} leagues for ${config.displayName}.`);

    for (const leagueDoc of leaguesSnapshot.docs) {
      const leagueData = leagueDoc.data() as Omit<League, 'id' | 'teams'>;
      const league: League = { id: leagueDoc.id, ...leagueData, teams: [] };
      let teamDisplays: TeamDisplay[] = [];

      const teamsColRef = collection(db, "rwk_teams");
      const qTeams = query(teamsColRef,
        where("leagueId", "==", league.id),
        where("competitionYear", "==", config.year)
        // Annahme: Teams sind bereits nach Disziplin durch die Liga-Auswahl gefiltert
      );
      const teamsSnapshot = await getDocs(qTeams);

      for (const teamDoc of teamsSnapshot.docs) {
        const teamData = teamDoc.data() as Omit<Team, 'id' | 'shootersResults' | 'roundResults' | 'totalScore' | 'averageScore' | 'numScoredRounds'>;
        
        if (teamData.name === "SV Dörrigsen Einzel") {
          console.log(`Filtering out team: ${teamData.name}`);
          continue;
        }
        
        const team: Team = { 
          id: teamDoc.id, 
          ...teamData, 
          shootersResults: [], 
          roundResults: {},
          totalScore: 0,
          averageScore: 0,
          numScoredRounds: 0
        };
        
        let clubName = "Unbek. Verein";
        if (team.clubId) {
          try {
            const clubDocRef = doc(db, "clubs", team.clubId);
            const clubSnap = await getDoc(clubDocRef);
            if (clubSnap.exists()) clubName = (clubSnap.data() as Club).name || clubName;
            else console.warn(`Club with ID '${team.clubId}' for team '${team.name}' not found.`);
          } catch (clubError) { console.error(`Error fetching club ${team.clubId}:`, clubError); }
        }

        const shooterResultsDisplay: ShooterDisplayResults[] = [];
        const teamRoundResults: { [key: string]: number | null } = {};
        for (let r = 1; r <= NUM_ROUNDS; r++) teamRoundResults[`dg${r}`] = null;

        const scoresColRef = collection(db, "rwk_scores");
        const qScoresForTeamYear = query(scoresColRef,
            where("teamId", "==", team.id),
            where("competitionYear", "==", config.year),
            where("leagueId", "==", league.id) // sicherstellen, dass Scores zur Liga passen
        );
        const teamYearScoresSnapshot = await getDocs(qScoresForTeamYear);
        const allTeamYearScores: ScoreEntry[] = teamYearScoresSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as ScoreEntry));
        
        const uniqueShooterIdsInTeamScores = Array.from(new Set(allTeamYearScores.map(s => s.shooterId)));

        for (const shooterId of uniqueShooterIdsInTeamScores) {
          let shooterName = "Unbek. Schütze";
          try {
            const shooterDocRef = doc(db, "rwk_shooters", shooterId);
            const shooterSnap = await getDoc(shooterDocRef);
            if (shooterSnap.exists()) shooterName = (shooterSnap.data() as Shooter).name || shooterName;
            else {
              const scoreWithName = allTeamYearScores.find(s => s.shooterId === shooterId && s.shooterName);
              if (scoreWithName) shooterName = scoreWithName.shooterName!;
              else console.warn(`Shooter with ID '${shooterId}' for team '${team.name}' not found.`);
            }
          } catch (shooterError) { console.error(`Error fetching shooter ${shooterId}:`, shooterError); }
          
          const individualResults: { [key: string]: number | null } = {};
          for (let r = 1; r <= NUM_ROUNDS; r++) individualResults[`dg${r}`] = null;
          
          let totalIndividualScore = 0;
          let roundsCount = 0;

          const shooterScoresForTeam = allTeamYearScores.filter(s => s.shooterId === shooterId);
          shooterScoresForTeam.forEach(score => {
            if (score.durchgang >= 1 && score.durchgang <= NUM_ROUNDS) {
              const roundKey = `dg${score.durchgang}`;
              individualResults[roundKey] = (individualResults[roundKey] || 0) + score.totalRinge;
              if (score.totalRinge !== null) {
                totalIndividualScore += score.totalRinge;
                roundsCount++;
              }
            }
          });
          
          shooterResultsDisplay.push({
            shooterId: shooterId,
            shooterName: shooterName,
            results: individualResults,
            average: roundsCount > 0 ? parseFloat((totalIndividualScore / roundsCount).toFixed(2)) : null,
            total: totalIndividualScore,
            roundsShot: roundsCount,
            teamId: team.id,
            leagueId: league.id,
            competitionYear: config.year,
          });
        }

        for (let r = 1; r <= NUM_ROUNDS; r++) {
          const roundKey = `dg${r}`;
          const scoresForRound = allTeamYearScores.filter(s => s.durchgang === r);
          const uniqueShootersInRound = Array.from(new Set(scoresForRound.map(s => s.shooterId)));

          if (uniqueShootersInRound.length === TEAM_SIZE_FOR_SCORING) {
            teamRoundResults[roundKey] = scoresForRound.reduce((sum, score) => sum + score.totalRinge, 0);
          } else {
            if (uniqueShootersInRound.length > 0) {
              console.log(`Team ${team.name} has results from ${uniqueShootersInRound.length} distinct shooters for round ${r}. Need ${TEAM_SIZE_FOR_SCORING}. Setting round result to null.`);
            }
            teamRoundResults[roundKey] = null;
          }
        }
        
        let teamTotalScore = 0;
        let numScoredRounds = 0;
        Object.values(teamRoundResults).forEach(score => {
          if (score !== null) {
            teamTotalScore += score;
            numScoredRounds++;
          }
        });

        teamDisplays.push({
          ...team,
          clubName: clubName,
          shootersResults: shooterResultsDisplay.sort((a, b) => a.shooterName.localeCompare(b.shooterName)),
          roundResults: teamRoundResults,
          totalScore: teamTotalScore,
          averageScore: numScoredRounds > 0 ? parseFloat((teamTotalScore / numScoredRounds).toFixed(2)) : null,
          numScoredRounds: numScoredRounds,
        });
      }
      
      teamDisplays.sort((a, b) => (b.totalScore ?? 0) - (a.totalScore ?? 0) || (b.averageScore ?? 0) - (a.averageScore ?? 0));
      teamDisplays.forEach((team, index) => { team.rank = index + 1; });
      leagueDisplays.push({ ...league, teams: teamDisplays });
    }

    return { id: `${config.year}-${config.discipline}`, config: config, leagues: leagueDisplays };
  } catch (error) {
    console.error("Error fetching competition team data:", error);
    throw error; 
  }
}

async function fetchIndividualShooterData(config: CompetitionDisplayConfig): Promise<IndividualShooterDisplayData[]> {
  try {
    console.log(`Fetching individual shooter data for: ${config.displayName}`);
    const scoresColRef = collection(db, "rwk_scores");
    
    // 1. Relevante Ligen für Jahr und Disziplin finden
    const leaguesCol = collection(db, "rwk_leagues");
    const qLeagues = query(leaguesCol, where("competitionYear", "==", config.year), where("type", "==", config.discipline));
    const leaguesSnap = await getDocs(qLeagues);
    if (leaguesSnap.empty) {
      console.warn(`No leagues found for ${config.year} ${config.discipline} to filter individual scores.`);
      return [];
    }
    const relevantLeagueIds = leaguesSnap.docs.map(doc => doc.id);

    const qScores = query(scoresColRef,
      where("competitionYear", "==", config.year),
      where("leagueId", "in", relevantLeagueIds) // Nur Scores aus Ligen der gewählten Disziplin
    );
    const scoresSnapshot = await getDocs(qScores);
    const allScores: ScoreEntry[] = scoresSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as ScoreEntry));

    const shootersMap = new Map<string, IndividualShooterDisplayData>();

    allScores.forEach(score => {
      if (!shootersMap.has(score.shooterId)) {
        shootersMap.set(score.shooterId, {
          shooterId: score.shooterId,
          shooterName: score.shooterName || "Unbek. Schütze",
          shooterGender: score.shooterGender,
          teamName: score.teamName || "Unbek. Team",
          results: {},
          totalScore: 0,
          averageScore: null,
          roundsShot: 0,
        });
      }

      const shooterData = shootersMap.get(score.shooterId)!;
      if (score.durchgang >= 1 && score.durchgang <= NUM_ROUNDS) {
        const roundKey = `dg${score.durchgang}`;
        shooterData.results[roundKey] = (shooterData.results[roundKey] || 0) + score.totalRinge;
        if (score.totalRinge !== null) { // Nur zählen, wenn es ein Ergebnis gibt
          shooterData.totalScore += score.totalRinge;
          // Nur Runden zählen, für die explizit ein Ergebnis eingetragen wurde (nicht nur 0)
          // Um das richtig zu machen, müssten wir wissen, ob eine Runde "geschossen" wurde.
          // Fürs Erste zählen wir jede Runde mit einem Score-Eintrag.
        }
      }
    });
    
    // Runden zählen und Durchschnitt berechnen
     shootersMap.forEach(shooterData => {
        let roundsShotCount = 0;
        for (let r = 1; r <= NUM_ROUNDS; r++) {
            if (shooterData.results[`dg${r}`] !== undefined && shooterData.results[`dg${r}`] !== null) {
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
    
    console.log(`Processed ${rankedShooters.length} individual shooters for ${config.displayName}.`);
    return rankedShooters;

  } catch (error) {
    console.error("Error fetching individual shooter data:", error);
    throw error;
  }
}


export default function RwkTabellenPage() {
  const [selectedCompetition, setSelectedCompetition] = useState<CompetitionDisplayConfig>({
    year: AVAILABLE_YEARS[0], // Default zum neuesten Jahr
    discipline: AVAILABLE_DISCIPLINES[0].value, // Default zur ersten Disziplin
    displayName: `RWK ${AVAILABLE_YEARS[0]} ${AVAILABLE_DISCIPLINES[0].value}`
  });
  const [activeTab, setActiveTab] = useState<"mannschaften" | "einzelschützen">("mannschaften");
  
  const [teamData, setTeamData] = useState<AggregatedCompetitionData | null>(null);
  const [individualData, setIndividualData] = useState<IndividualShooterDisplayData[]>([]);
  const [bestShooter, setBestShooter] = useState<IndividualShooterDisplayData | null>(null);
  const [bestFemaleShooter, setBestFemaleShooter] = useState<IndividualShooterDisplayData | null>(null);
  
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [openTeamDetails, setOpenTeamDetails] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      setTeamData(null); // Reset data on config change
      setIndividualData([]);
      setBestShooter(null);
      setBestFemaleShooter(null);

      try {
        if (activeTab === "mannschaften") {
          console.log(`Attempting to fetch TEAM data for: ${selectedCompetition.displayName}`);
          const data = await fetchCompetitionTeamData(selectedCompetition);
          setTeamData(data);
          if (data) console.log("Team data successfully loaded:", data);
          else console.warn("fetchCompetitionTeamData returned null.");
        } else if (activeTab === "einzelschützen") {
          console.log(`Attempting to fetch INDIVIDUAL data for: ${selectedCompetition.displayName}`);
          const individuals = await fetchIndividualShooterData(selectedCompetition);
          setIndividualData(individuals);
          if (individuals.length > 0) {
            setBestShooter(individuals[0]); // Erster in der sortierten Liste
            const females = individuals.filter(s => s.shooterGender === 'female' || s.shooterGender === 'w'); // 'w' für weiblich
            setBestFemaleShooter(females.length > 0 ? females[0] : null); // Erste Dame in der sortierten Liste
          }
          console.log("Individual data successfully loaded:", individuals);
        }
      } catch (err) {
        console.error(`Failed to load RWK data for ${activeTab}:`, err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [selectedCompetition, activeTab]);

  const handleYearChange = (yearString: string) => {
    const year = parseInt(yearString, 10);
    setSelectedCompetition(prev => ({
      ...prev,
      year,
      displayName: `RWK ${year} ${prev.discipline}`
    }));
  };

  const handleDisciplineChange = (discipline: CompetitionDiscipline) => {
    setSelectedCompetition(prev => ({
      ...prev,
      discipline,
      displayName: `RWK ${prev.year} ${discipline}`
    }));
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
              <p className="text-lg">Lade Tabellendaten für {selectedCompetition.displayName}...</p>
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
            <p>Es gab ein Problem beim Abrufen der Daten für {selectedCompetition.displayName}. Fehlermeldung: {error.message}.</p>
            <p className="text-sm mt-2">Überprüfen Sie die Browser-Konsole für Details und die Firestore-Sicherheitsregeln.</p>
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
          <h1 className="text-3xl font-bold text-primary">{selectedCompetition.displayName}</h1>
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
          <Select value={selectedCompetition.discipline} onValueChange={(value) => handleDisciplineChange(value as CompetitionDiscipline)}>
            <SelectTrigger className="w-[220px] shadow-md">
              <SelectValue placeholder="Disziplin wählen" />
            </SelectTrigger>
            <SelectContent>
              {AVAILABLE_DISCIPLINES.map(disc => (
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
          {!loading && !error && teamData && teamData.leagues.length === 0 && (
            <Card className="shadow-lg"><CardHeader><CardTitle className="text-accent">Keine Ligen für {selectedCompetition.displayName}</CardTitle></CardHeader>
              <CardContent className="text-center py-12 p-6"><p className="text-lg text-muted-foreground">Für {selectedCompetition.displayName} wurden keine Ligen gefunden.</p></CardContent>
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
                        <TableHeader><TableRow className="bg-muted/50">
                          <TableHead className="w-[40px] text-center">#</TableHead>
                          <TableHead>Mannschaft</TableHead>
                          {[...Array(NUM_ROUNDS)].map((_, i) => (<TableHead key={`dg${i + 1}`} className="text-center">DG {i + 1}</TableHead>))}
                          <TableHead className="text-center font-semibold">Gesamt</TableHead>
                          <TableHead className="text-center font-semibold">Schnitt</TableHead>
                          <TableHead className="w-[50px]"></TableHead>
                        </TableRow></TableHeader>
                        <TableBody>
                          {league.teams.sort((a,b) => (a.rank || 999) - (b.rank || 999)).map((team) => ( 
                            <React.Fragment key={team.id}>
                              <TableRow className="hover:bg-secondary/20 transition-colors">
                                <>
                                  <TableCell className="text-center font-medium">{team.rank}</TableCell>
                                  <TableCell className="font-medium text-foreground">{team.name}</TableCell>
                                  {[...Array(NUM_ROUNDS)].map((_, i) => (
                                    <TableCell key={`dg${i + 1}-${team.id}`} className="text-center">{team.roundResults?.[`dg${i + 1}`] ?? '-'}</TableCell>
                                  ))}
                                  <TableCell className="text-center font-semibold text-primary">{team.totalScore ?? '-'}</TableCell>
                                  <TableCell className="text-center font-medium text-muted-foreground">{team.averageScore != null ? team.averageScore.toFixed(2) : '-'}</TableCell>
                                  <TableCell className="text-center">
                                    {(team.shootersResults && team.shootersResults.length > 0) ? (
                                      <button onClick={() => toggleTeamDetails(team.id)} className="p-1 hover:bg-accent/20 rounded-md text-muted-foreground hover:text-accent" aria-expanded={!!openTeamDetails[team.id]} aria-controls={`team-details-${team.id}`}>
                                        <ChevronDown className={`h-5 w-5 transition-transform ${openTeamDetails[team.id] ? 'rotate-180' : ''}`} /><span className="sr-only">Details</span>
                                      </button>
                                    ) : null}
                                  </TableCell>
                                </>
                              </TableRow>
                              {team.shootersResults && team.shootersResults.length > 0 && openTeamDetails[team.id] && (
                                 <TableRow id={`team-details-${team.id}`} className="bg-muted/5 hover:bg-muted/10 transition-colors">
                                   <TableCell colSpan={NUM_ROUNDS + 5} className="p-0">
                                      <div className="px-4 py-2 bg-secondary/10"> {/* Subtiler Hintergrund für den Schützenbereich */}
                                        <Table>
                                          <TableHeader><TableRow className="border-b-0 bg-transparent">
                                            <TableHead className="text-foreground/80 font-normal">Schütze</TableHead>
                                            {[...Array(NUM_ROUNDS)].map((_, i) => (<TableHead key={`shooter-dg${i + 1}`} className="text-center text-foreground/80 font-normal">DG {i + 1}</TableHead>))}
                                            <TableHead className="text-center font-semibold text-foreground/80">Schnitt</TableHead>
                                          </TableRow></TableHeader>
                                          <TableBody>
                                            {team.shootersResults.map(shooterRes => (
                                              <TableRow key={shooterRes.shooterId} className="border-b-0 hover:bg-accent/5">
                                                <TableCell className="font-medium">{shooterRes.shooterName || shooterRes.shooterId}</TableCell>
                                                {[...Array(NUM_ROUNDS)].map((_, i) => (<TableCell key={`shooter-dg${i + 1}-${shooterRes.shooterId}`} className="text-center">{shooterRes.results?.[`dg${i + 1}`] ?? '-'}</TableCell>))}
                                                <TableCell className="text-center font-semibold text-primary">{shooterRes.average != null ? shooterRes.average.toFixed(2) : '-'}</TableCell>
                                              </TableRow>
                                            ))}
                                          </TableBody>
                                        </Table>
                                      </div>
                                    </TableCell>
                                </TableRow>
                              )}
                            </React.Fragment>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    {league.teams.length === 0 && (<p className="p-4 text-center text-muted-foreground">Keine Mannschaften in dieser Liga für {selectedCompetition.displayName} vorhanden.</p>)}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </TabsContent>

        <TabsContent value="einzelschützen">
          {loading && renderLoadingSkeleton()}
          {!loading && !error && individualData.length === 0 && (
            <Card className="shadow-lg"><CardHeader><CardTitle className="text-accent">Keine Einzelschützen</CardTitle></CardHeader>
              <CardContent className="text-center py-12 p-6"><p className="text-lg text-muted-foreground">Für {selectedCompetition.displayName} wurden keine Einzelschützenergebnisse gefunden.</p></CardContent>
            </Card>
          )}
          {!loading && !error && individualData.length > 0 && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {bestShooter && (
                  <Card className="shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-lg font-medium text-primary">Bester Schütze</CardTitle>
                      <Trophy className="h-5 w-5 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">{bestShooter.shooterName}</p>
                      <p className="text-sm text-muted-foreground">{bestShooter.teamName}</p>
                      <p className="text-lg">Gesamt: <span className="font-semibold">{bestShooter.totalScore}</span> Ringe</p>
                      <p className="text-sm">Schnitt: {bestShooter.averageScore?.toFixed(2)} ({bestShooter.roundsShot} DG)</p>
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
              </div>

              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-xl text-accent">Einzelrangliste</CardTitle>
                  <CardDescription>Alle Schützen sortiert nach Gesamtergebnis.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader><TableRow className="bg-muted/50">
                        <TableHead className="w-[40px] text-center">#</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Verein/Team</TableHead>
                        {[...Array(NUM_ROUNDS)].map((_, i) => (<TableHead key={`ind-dg${i + 1}`} className="text-center">DG {i + 1}</TableHead>))}
                        <TableHead className="text-center font-semibold">Gesamt</TableHead>
                        <TableHead className="text-center font-semibold">Schnitt</TableHead>
                      </TableRow></TableHeader>
                      <TableBody>
                        {individualData.map(shooter => (
                          <TableRow key={shooter.shooterId} className="hover:bg-secondary/20 transition-colors">
                            <TableCell className="text-center font-medium">{shooter.rank}</TableCell>
                            <TableCell className="font-medium text-foreground">{shooter.shooterName}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{shooter.teamName}</TableCell>
                            {[...Array(NUM_ROUNDS)].map((_, i) => (<TableCell key={`ind-dg${i + 1}-${shooter.shooterId}`} className="text-center">{shooter.results?.[`dg${i + 1}`] ?? '-'}</TableCell>))}
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

// Helper: Extrahiert eine Zahl aus einem String, wenn der String eine Zahl enthält
const extractNumber = (str: string | undefined | null): number | null => {
  if (!str) return null;
  const match = str.match(/\d+/);
  return match ? parseInt(match[0], 10) : null;
};
