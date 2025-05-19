// src/app/rwk-tabellen/page.tsx
"use client";
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { ChevronDown, TableIcon, Loader2, AlertTriangle, InfoIcon } from 'lucide-react';
import type { League, LeagueDisplay, Team, TeamDisplay, Club, Shooter, ScoreEntry, ShooterDisplayResults } from '@/types/rwk';
import { Skeleton } from '@/components/ui/skeleton';
import { db } from '@/lib/firebase/config';
import { collection, doc, getDoc, getDocs, query, where, orderBy } from 'firebase/firestore';

const NUM_ROUNDS = 5;
const TARGET_COMPETITION_YEAR = 2025; // Festes Wettkampfjahr
const SEASON_DISPLAY_NAME = `RWK ${TARGET_COMPETITION_YEAR} KK`; // Angezeigter Name
const TEAM_SIZE_FOR_SCORING = 3; // Anzahl der Schützen, die für eine gültige Mannschaftswertung benötigt werden

interface AggregatedSeasonData {
  id: string;
  name: string;
  year: number;
  leagues: LeagueDisplay[];
}

async function fetchCompetitionData(year: number): Promise<AggregatedSeasonData | null> {
  try {
    console.log(`Fetching data for competition year: ${year}`);

    const leaguesColRef = collection(db, "rwk_leagues");
    const qLeagues = query(leaguesColRef, where("competitionYear", "==", year), orderBy("order", "asc"));
    const leaguesSnapshot = await getDocs(qLeagues);
    const leagueDisplays: LeagueDisplay[] = [];

    if (leaguesSnapshot.empty) {
      console.warn(`No leagues found for competitionYear '${year}' in 'rwk_leagues'.`);
      return {
        id: year.toString(),
        name: SEASON_DISPLAY_NAME,
        year: year,
        leagues: [],
      };
    }
    console.log(`Found ${leaguesSnapshot.docs.length} leagues for year ${year}.`);

    for (const leagueDoc of leaguesSnapshot.docs) {
      const leagueData = leagueDoc.data() as Omit<League, 'id' | 'teams'>;
      const league: League = { id: leagueDoc.id, ...leagueData, teams: [] }; // Initialize teams array
      let teamDisplays: TeamDisplay[] = [];
      console.log(`Fetching teams for league '${league.name}' (ID: ${league.id}).`);

      const teamsColRef = collection(db, "rwk_teams");
      const qTeams = query(teamsColRef, where("leagueId", "==", league.id), where("competitionYear", "==", year));
      const teamsSnapshot = await getDocs(qTeams);

      if (teamsSnapshot.empty) {
        console.warn(`No teams found for leagueId '${league.id}' and competitionYear '${year}'.`);
      }

      for (const teamDoc of teamsSnapshot.docs) {
        const teamData = teamDoc.data() as Omit<Team, 'id' | 'shootersResults' | 'roundResults' | 'totalScore' | 'averageScore' | 'numScoredRounds'>;
        
        // Filter out "SV Dörrigsen Einzel"
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
            if (clubSnap.exists()) {
              clubName = (clubSnap.data() as Club).name || clubName;
            } else {
              console.warn(`Club with ID '${team.clubId}' for team '${team.name}' not found.`);
            }
          } catch (clubError) {
            console.error(`Error fetching club ${team.clubId}:`, clubError);
          }
        } else {
           console.warn(`Team '${team.name}' (ID: ${team.id}) has no clubId.`);
        }

        const shooterResultsDisplay: ShooterDisplayResults[] = [];
        const teamRoundResults: { [key: string]: number | null } = {};
        for (let r = 1; r <= NUM_ROUNDS; r++) teamRoundResults[`dg${r}`] = null;

        const scoresColRef = collection(db, "rwk_scores");
        const qScoresForTeamYear = query(scoresColRef,
            where("teamId", "==", team.id),
            where("competitionYear", "==", year)
        );
        const teamYearScoresSnapshot = await getDocs(qScoresForTeamYear);
        const allTeamYearScores: ScoreEntry[] = teamYearScoresSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as ScoreEntry));

        if (allTeamYearScores.length === 0) {
          console.warn(`No scores found in 'rwk_scores' for teamId '${team.id}' and year '${year}'.`);
        }
        
        const uniqueShooterIdsInTeamScores = Array.from(new Set(allTeamYearScores.map(s => s.shooterId)));

        for (const shooterId of uniqueShooterIdsInTeamScores) {
          let shooterName = "Unbek. Schütze";
          try {
            const shooterDocRef = doc(db, "rwk_shooters", shooterId);
            const shooterSnap = await getDoc(shooterDocRef);
            if (shooterSnap.exists()) {
              shooterName = (shooterSnap.data() as Shooter).name || shooterName;
            } else {
              const scoreWithName = allTeamYearScores.find(s => s.shooterId === shooterId && s.shooterName);
              if (scoreWithName) shooterName = scoreWithName.shooterName!;
              else console.warn(`Shooter with ID '${shooterId}' for team '${team.name}' not found in 'rwk_shooters' and no shooterName in scores.`);
            }
          } catch (shooterError) {
            console.error(`Error fetching shooter ${shooterId}:`, shooterError);
          }
          
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
            average: roundsCount > 0 ? parseFloat((totalIndividualScore / roundsCount).toFixed(2)) : 0,
            teamId: team.id, // reference back to team
            leagueId: league.id, // reference back to league
            competitionYear: year, // reference back to competition year
          });
        }

        // Calculate team results per round
        for (let r = 1; r <= NUM_ROUNDS; r++) {
          const roundKey = `dg${r}`;
          // Get scores for this specific round for this team
          const scoresForRound = allTeamYearScores.filter(s => s.durchgang === r);
          
          // Get unique shooter IDs who have scores in this round for this team
          const uniqueShootersInRound = Array.from(new Set(scoresForRound.map(s => s.shooterId)));

          // Only calculate team score if exactly TEAM_SIZE_FOR_SCORING shooters have results for this round
          if (uniqueShootersInRound.length === TEAM_SIZE_FOR_SCORING) {
            // Sort scores for this round in descending order to pick the top N if more than N shooters,
            // though the condition above ensures we have exactly TEAM_SIZE_FOR_SCORING.
            const topScores = scoresForRound
              .sort((a, b) => b.totalRinge - a.totalRinge)
              .slice(0, TEAM_SIZE_FOR_SCORING); // Ensure we only consider up to TEAM_SIZE_FOR_SCORING

            // Double check if we actually have enough scores after slicing (in case some had null/0 and were filtered)
            // The primary check is uniqueShootersInRound.length === TEAM_SIZE_FOR_SCORING
            if (topScores.length === TEAM_SIZE_FOR_SCORING) {
                 teamRoundResults[roundKey] = topScores.reduce((sum, score) => sum + score.totalRinge, 0);
            } else {
                 console.warn(`Team ${team.name} has scores from ${uniqueShootersInRound.length} shooters for round ${r}, but only ${topScores.length} scores considered valid for summation. Setting to null.`);
                 teamRoundResults[roundKey] = null;
            }
          } else {
            if (uniqueShootersInRound.length > 0) { // Only log if there were some scores, but not enough
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
          averageScore: numScoredRounds > 0 ? parseFloat((teamTotalScore / numScoredRounds).toFixed(2)) : 0,
          numScoredRounds: numScoredRounds,
        });
      }
      
      teamDisplays.sort((a, b) => {
        if ((b.totalScore ?? 0) !== (a.totalScore ?? 0)) {
          return (b.totalScore ?? 0) - (a.totalScore ?? 0);
        }
        return (b.averageScore ?? 0) - (a.averageScore ?? 0);
      });

      teamDisplays.forEach((team, index) => {
        team.rank = index + 1;
      });

      leagueDisplays.push({ ...league, teams: teamDisplays });
    }

    return {
      id: year.toString(),
      name: SEASON_DISPLAY_NAME,
      year: year,
      leagues: leagueDisplays
    };

  } catch (error) {
    console.error("Error fetching competition data from Firestore:", error);
    throw error; 
  }
}


export default function RwkTabellenPage() {
  const [competitionData, setCompetitionData] = useState<AggregatedSeasonData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [openTeamDetails, setOpenTeamDetails] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        console.log(`Attempting to fetch data for competition year: ${TARGET_COMPETITION_YEAR}`);
        const data = await fetchCompetitionData(TARGET_COMPETITION_YEAR);
        setCompetitionData(data);
        if (data) {
          console.log("Competition data successfully loaded and processed:", data);
        } else {
          console.warn("fetchCompetitionData returned null. This might indicate no season document found or other issues.");
        }
      } catch (err) {
        console.error("Failed to load RWK data in useEffect:", err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const toggleTeamDetails = (teamId: string) => {
    setOpenTeamDetails(prev => ({ ...prev, [teamId]: !prev[teamId] }));
  };
  
  if (loading) {
    return (
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
                <p className="text-lg">Lade Tabellendaten...</p>
             </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-3">
          <TableIcon className="h-8 w-8 text-destructive" />
          <h1 className="text-3xl font-bold text-destructive">Fehler beim Laden der Tabellen</h1>
        </div>
        <Card className="shadow-lg border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center">
                <AlertTriangle className="mr-2 h-5 w-5" />
                Daten konnten nicht geladen werden
            </CardTitle>
          </CardHeader>
          <CardContent className="text-destructive-foreground bg-destructive/10 p-6">
            <p>Es gab ein Problem beim Abrufen der Daten von der Datenbank.</p>
            <p className="text-sm mt-2">Fehlermeldung: {error.message}. Überprüfen Sie die Browser-Konsole für detailliertere Fehlermeldungen von Firebase und die Firestore-Sicherheitsregeln.</p>
             <p className="text-sm mt-2">Stellen Sie sicher, dass Ihre Firestore-Sicherheitsregeln Lesezugriffe auf die Collections 'rwk_leagues', 'rwk_teams', 'clubs', 'rwk_shooters' und 'rwk_scores' erlauben.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!competitionData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-3">
          <InfoIcon className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-primary">Keine Wettkampfdaten</h1>
        </div>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Keine Wettkampfdaten gefunden</CardTitle>
          </CardHeader>
          <CardContent className="p-6 text-muted-foreground">
            <p>
              Für das Wettkampfjahr <code className="font-mono bg-muted px-1 py-0.5 rounded-sm">{TARGET_COMPETITION_YEAR}</code> konnten keine Daten geladen werden.
              Dies kann bedeuten, dass keine Ligen für dieses Jahr existieren oder andere benötigte Daten fehlen.
            </p>
             <p className="mt-2">Bitte überprüfen Sie die Konsolenausgaben auf spezifische Fehler beim Datenabruf und die Datenintegrität in Firestore.</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (competitionData && competitionData.leagues.length === 0) {
    return (
      <div className="space-y-8">
        <div className="flex items-center space-x-3">
          <TableIcon className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-primary">{competitionData.name}</h1>
        </div>
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="text-accent">Keine Ligen für {TARGET_COMPETITION_YEAR}</CardTitle>
            </CardHeader>
            <CardContent className="text-center py-12 p-6">
                <p className="text-lg text-muted-foreground">Für das Wettkampfjahr {TARGET_COMPETITION_YEAR} wurden keine Ligen in der Collection <code className="font-mono bg-muted px-1 py-0.5 rounded-sm">rwk_leagues</code> gefunden, die das Feld <code className="font-mono bg-muted px-1 py-0.5 rounded-sm">competitionYear: {TARGET_COMPETITION_YEAR}</code> enthalten.</p>
                <p className="text-muted-foreground mt-2">Bitte überprüfen Sie Ihre Daten in Firestore.</p>
            </CardContent>
        </Card>
      </div>
    );
  }


  return (
    <div className="space-y-8">
      <div className="flex items-center space-x-3">
        <TableIcon className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold text-primary">{competitionData.name}</h1>
      </div>

      <Accordion type="multiple" defaultValue={competitionData.leagues.map(l => l.id)} className="w-full space-y-4">
        {competitionData.leagues.map((league) => (
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
                        {[...Array(NUM_ROUNDS)].map((_, i) => (
                          <TableHead key={`dg${i + 1}`} className="text-center">DG {i + 1}</TableHead>
                        ))}
                        <TableHead className="text-center font-semibold">Gesamt</TableHead>
                        <TableHead className="text-center font-semibold">Schnitt</TableHead>
                        <TableHead className="w-[50px]"></TableHead>{/* For expand icon */}
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
                            {[...Array(NUM_ROUNDS)].map((_, i) => (
                              <TableCell key={`dg${i + 1}-${team.id}`} className="text-center">
                                {team.roundResults?.[`dg${i + 1}`] ?? '-'}
                              </TableCell>
                            ))}
                            <TableCell className="text-center font-semibold text-primary">{team.totalScore ?? '-'}</TableCell>
                            <TableCell className="text-center font-medium text-muted-foreground">
                                {team.numScoredRounds && team.numScoredRounds > 0 && team.averageScore != null ? team.averageScore.toFixed(2) : '-'}
                            </TableCell>
                            <TableCell className="text-center">
                              {(team.shootersResults && team.shootersResults.length > 0) ? (
                                <button
                                  onClick={() => toggleTeamDetails(team.id)}
                                  className="p-1 hover:bg-accent/20 rounded-md text-muted-foreground hover:text-accent"
                                  aria-expanded={!!openTeamDetails[team.id]}
                                  aria-controls={`team-details-${team.id}`}
                                >
                                  <ChevronDown className={`h-5 w-5 transition-transform ${openTeamDetails[team.id] ? 'rotate-180' : ''}`} />
                                  <span className="sr-only">Details anzeigen</span>
                                </button>
                              ) : null}
                            </TableCell>
                          </React.Fragment>
                        </TableRow>
                        {team.shootersResults && team.shootersResults.length > 0 && openTeamDetails[team.id] && (
                           <TableRow id={`team-details-${team.id}`} className="bg-muted/5 hover:bg-muted/10 transition-colors">
                             <React.Fragment>
                              <TableCell colSpan={NUM_ROUNDS + 5} className="p-0">
                                <div className="px-4 py-2">
                                  <Table>
                                    <TableHeader>
                                      <TableRow className="border-b-0 bg-transparent">
                                        <React.Fragment>
                                          <TableHead className="text-foreground/80">Schütze</TableHead>
                                          {[...Array(NUM_ROUNDS)].map((_, i) => (
                                            <TableHead key={`shooter-dg${i + 1}`} className="text-center text-foreground/80">DG {i + 1}</TableHead>
                                          ))}
                                          <TableHead className="text-center font-semibold text-foreground/80">Schnitt</TableHead>
                                        </React.Fragment>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {team.shootersResults.map(shooterRes => (
                                        <TableRow key={shooterRes.shooterId} className="border-b-0 hover:bg-accent/5">
                                          <React.Fragment>
                                            <TableCell className="font-medium">{shooterRes.shooterName || shooterRes.shooterId}</TableCell>
                                            {[...Array(NUM_ROUNDS)].map((_, i) => (
                                               <TableCell key={`shooter-dg${i + 1}-${shooterRes.shooterId}`} className="text-center">
                                                {shooterRes.results?.[`dg${i + 1}`] ?? '-'}
                                               </TableCell>
                                            ))}
                                            <TableCell className="text-center font-semibold text-primary">
                                              {shooterRes.average != null ? shooterRes.average.toFixed(2) : '-'}
                                            </TableCell>
                                          </React.Fragment>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </div>
                              </TableCell>
                            </React.Fragment>
                          </TableRow>
                        )}
                      </React.Fragment>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {league.teams.length === 0 && (
                <p className="p-4 text-center text-muted-foreground">Keine Mannschaften in dieser Liga für das Wettkampfjahr {TARGET_COMPETITION_YEAR} vorhanden (oder alle wurden herausgefiltert).</p>
              )}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
