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
import { ChevronDown, TableIcon, Loader2, AlertTriangle } from 'lucide-react';
import type { Season, League, Team, Club, Shooter, ShooterRoundResults, SeasonDisplay, LeagueDisplay, TeamDisplay, ShooterDisplayResults } from '@/types/rwk';
import { Skeleton } from '@/components/ui/skeleton';
import { db } from '@/lib/firebase/config';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';

const NUM_ROUNDS = 5;
const TARGET_SEASON_ID = 's2025'; // Hardcoded for now, "RWK 2025 KK"

async function fetchSeasonData(seasonId: string): Promise<SeasonDisplay | null> {
  try {
    const seasonDocRef = doc(db, "seasons", seasonId);
    const seasonSnap = await getDoc(seasonDocRef);

    if (!seasonSnap.exists()) {
      console.error(`Season with ID ${seasonId} not found.`);
      return null;
    }
    const season = { id: seasonSnap.id, ...seasonSnap.data() } as Season;

    // Fetch leagues for this season
    const leaguesColRef = collection(db, "leagues");
    const qLeagues = query(leaguesColRef, where("seasonId", "==", seasonId));
    const leaguesSnapshot = await getDocs(qLeagues);
    const leagueDisplays: LeagueDisplay[] = [];

    for (const leagueDoc of leaguesSnapshot.docs) {
      const league = { id: leagueDoc.id, ...leagueDoc.data() } as League;
      const teamDisplays: TeamDisplay[] = [];

      // Fetch teams for this league and season
      const teamsColRef = collection(db, "teams");
      const qTeams = query(teamsColRef, where("leagueId", "==", league.id), where("seasonId", "==", seasonId));
      const teamsSnapshot = await getDocs(qTeams);

      for (const teamDoc of teamsSnapshot.docs) {
        const teamData = teamDoc.data() as Omit<Team, 'id'>; // Raw data from Firestore
        const team: Team = { id: teamDoc.id, ...teamData };

        // Fetch club name
        let clubName = "Unbekannter Verein";
        if (team.clubId) {
          const clubDocRef = doc(db, "clubs", team.clubId);
          const clubSnap = await getDoc(clubDocRef);
          if (clubSnap.exists()) {
            clubName = (clubSnap.data() as Club).name;
          }
        }

        // Fetch shooter results for this team
        const shooterResultsDisplay: ShooterDisplayResults[] = [];
        if (team.shooterIds && team.shooterIds.length > 0) {
          for (const shooterId of team.shooterIds) {
            const shooterDocRef = doc(db, "shooters", shooterId);
            const shooterSnap = await getDoc(shooterDocRef);
            const shooterName = shooterSnap.exists() ? `${(shooterSnap.data() as Shooter).firstName} ${(shooterSnap.data() as Shooter).lastName}` : "Unbekannter Schütze";

            const shooterResultDocRef = doc(db, "teams", team.id, "shooterResults", shooterId);
            const shooterResultSnap = await getDoc(shooterResultDocRef);
            
            let results: { [key: string]: number | null } = {};
            let firestoreShooterRoundResults: Partial<ShooterRoundResults> = {};

            if (shooterResultSnap.exists()) {
                 firestoreShooterRoundResults = shooterResultSnap.data() as ShooterRoundResults;
                 results = firestoreShooterRoundResults.results || {};
            } else {
                // Fill with nulls if no results doc exists
                for (let i = 1; i <= NUM_ROUNDS; i++) {
                    results[`dg${i}`] = null;
                }
            }
            
            let totalScore = 0;
            let roundsCount = 0;
            Object.values(results).forEach(score => {
              if (score !== null) {
                totalScore += score;
                roundsCount++;
              }
            });
            const average = roundsCount > 0 ? totalScore / roundsCount : 0;

            shooterResultsDisplay.push({
              id: shooterResultSnap.id || shooterId, // Use shooterId as fallback if snap doesn't exist
              shooterId: shooterId,
              teamId: team.id,
              leagueId: league.id,
              seasonId: season.id,
              shooterName: shooterName,
              results: results,
              average: average,
            });
          }
        }
        
        // Calculate team's total score from its roundResults
        let teamTotalScore = 0;
        if (team.roundResults) {
            Object.values(team.roundResults).forEach(score => {
                if (typeof score === 'number') {
                    teamTotalScore += score;
                }
            });
        }


        teamDisplays.push({
          ...team, // Spread raw team data first
          id: team.id, // Ensure id is from team.id
          clubName: clubName,
          shootersResults: shooterResultsDisplay,
          totalScore: teamTotalScore, // Calculated from team.roundResults
          // Rank will be calculated later
        });
      }
      
      // Calculate ranks for teams within the league
      teamDisplays.sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0));
      teamDisplays.forEach((team, index) => {
        team.rank = index + 1;
      });

      leagueDisplays.push({ ...league, teams: teamDisplays });
    }
    // Sort leagues by name (optional, or by a predefined order if needed)
    leagueDisplays.sort((a, b) => a.name.localeCompare(b.name));


    return { ...season, leagues: leagueDisplays };

  } catch (error) {
    console.error("Error fetching season data:", error);
    throw error; // Re-throw to be caught by calling useEffect
  }
}


export default function RwkTabellenPage() {
  const [selectedSeason, setSelectedSeason] = useState<SeasonDisplay | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [openTeamDetails, setOpenTeamDetails] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const seasonData = await fetchSeasonData(TARGET_SEASON_ID);
        setSelectedSeason(seasonData);
      } catch (err) {
        setError(err as Error);
        console.error("Failed to load RWK data:", err);
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
          <CardContent className="pt-6"> {/* Adjusted padding */}
             <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-lg">Lade Tabellendaten...</p>
             </div>
            {/* Keep skeleton for accordion structure if preferred while loading actual structure */}
            {/* <Accordion type="multiple" className="w-full">
              {[1, 2, 3, 4].map(i => (
                <AccordionItem value={`loader-league-${i}`} key={i} className="border-b-0 mb-4">
                  <AccordionTrigger className="bg-secondary/50 hover:bg-secondary/70 px-4 py-3 rounded-t-md">
                     <Skeleton className="h-5 w-1/2 rounded-md" />
                  </AccordionTrigger>
                  <AccordionContent className="pt-0 bg-card border border-t-0 rounded-b-md p-4">
                    <Skeleton className="h-40 w-full rounded-md" />
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion> */}
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
            <p className="text-sm mt-2">Fehlermeldung: {error.message}</p>
            <p className="text-sm mt-2">Bitte versuchen Sie es später erneut oder kontaktieren Sie den Administrator.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!selectedSeason) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-3">
          <TableIcon className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-primary">RWK Tabellen</h1>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Keine Saisondaten verfügbar</CardTitle>
          </CardHeader>
          <CardContent className="p-6"> {/* Adjusted padding */}
            <p className="text-muted-foreground">Für die ausgewählte Saison (ID: {TARGET_SEASON_ID}) konnten keine Daten gefunden werden oder es sind keine Ligen vorhanden.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center space-x-3">
        <TableIcon className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold text-primary">RWK Tabellen - {selectedSeason.name}</h1>
      </div>

      {selectedSeason.leagues.length === 0 && (
         <Card className="shadow-lg">
            <CardContent className="text-center py-12 p-6"> {/* Adjusted padding */}
                <p className="text-lg text-muted-foreground">Keine Ligen für diese Saison ({selectedSeason.name}) gefunden.</p>
            </CardContent>
        </Card>
      )}

      <Accordion type="multiple" defaultValue={selectedSeason.leagues.map(l => l.id)} className="w-full space-y-4">
        {selectedSeason.leagues.map((league) => (
          <AccordionItem value={league.id} key={league.id} className="border bg-card shadow-lg rounded-lg overflow-hidden">
            <AccordionTrigger className="bg-accent/10 hover:bg-accent/20 px-6 py-4 text-xl font-semibold text-accent data-[state=open]:border-b">
              {league.name} {league.shortName && `(${league.shortName})`}
            </AccordionTrigger>
            <AccordionContent className="pt-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <>
                        <TableHead className="w-[40px] text-center">#</TableHead>
                        <TableHead>Mannschaft</TableHead>
                        {[...Array(NUM_ROUNDS)].map((_, i) => (
                          <TableHead key={`dg${i + 1}`} className="text-center">DG {i + 1}</TableHead>
                        ))}
                        <TableHead className="text-center font-semibold">Gesamt</TableHead>
                        <TableHead className="w-[50px]"></TableHead>{/* For expand icon */}
                      </>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {league.teams.sort((a,b) => (a.rank || 99) - (b.rank || 99)).map((team, index) => (
                      <React.Fragment key={team.id}>
                        <TableRow className="hover:bg-secondary/20 transition-colors">
                          <>
                            <TableCell className="text-center font-medium">{team.rank || index + 1}</TableCell>
                            <TableCell className="font-medium text-foreground">{team.name} <span className="text-xs text-muted-foreground">({team.clubName})</span></TableCell>
                            {[...Array(NUM_ROUNDS)].map((_, i) => (
                              <TableCell key={`dg${i + 1}-${team.id}`} className="text-center">
                                {team.roundResults?.[`dg${i + 1}` as keyof Team['roundResults']] ?? '-'}
                              </TableCell>
                            ))}
                            <TableCell className="text-center font-semibold text-primary">{team.totalScore ?? '-'}</TableCell>
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
                          </>
                        </TableRow>
                        {team.shootersResults && team.shootersResults.length > 0 && openTeamDetails[team.id] && (
                           <TableRow id={`team-details-${team.id}`} className="bg-muted/10 hover:bg-muted/20">
                             <>
                              <TableCell colSpan={3 + NUM_ROUNDS + 1} className="p-0"> {/* Adjusted colSpan */}
                                <div className="p-4 space-y-3">
                                  <h4 className="text-md font-semibold text-accent-foreground">Einzelergebnisse für {team.name}</h4>
                                  <Table className="bg-background rounded-md shadow-sm">
                                    <TableHeader>
                                      <TableRow className="bg-secondary/30">
                                        <>
                                          <TableHead>Schütze</TableHead>
                                          {[...Array(NUM_ROUNDS)].map((_, i) => (
                                            <TableHead key={`shooter-dg${i + 1}`} className="text-center">DG {i + 1}</TableHead>
                                          ))}
                                          <TableHead className="text-center font-semibold">Schnitt</TableHead>
                                        </>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {team.shootersResults.map(shooterRes => (
                                        <TableRow key={shooterRes.shooterId}>
                                          <>
                                            <TableCell className="font-medium">{shooterRes.shooterName || shooterRes.shooterId}</TableCell>
                                            {[...Array(NUM_ROUNDS)].map((_, i) => (
                                               <TableCell key={`shooter-dg${i + 1}-${shooterRes.shooterId}`} className="text-center">
                                                {shooterRes.results?.[`dg${i + 1}` as keyof typeof shooterRes.results] ?? '-'}
                                               </TableCell>
                                            ))}
                                            <TableCell className="text-center font-semibold text-primary">
                                              {shooterRes.average?.toFixed(2) || '-'}
                                            </TableCell>
                                          </>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </div>
                              </TableCell>
                            </>
                          </TableRow>
                        )}
                      </React.Fragment>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {league.teams.length === 0 && (
                <p className="p-4 text-center text-muted-foreground">Keine Mannschaften in dieser Liga für die Saison {selectedSeason.name} vorhanden.</p>
              )}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
