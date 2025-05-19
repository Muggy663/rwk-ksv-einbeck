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
import type { Season, League, Team, Club, Shooter, ShooterRoundResults, SeasonDisplay, LeagueDisplay, TeamDisplay, ShooterDisplayResults } from '@/types/rwk';
import { Skeleton } from '@/components/ui/skeleton';
import { db } from '@/lib/firebase/config';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';

const NUM_ROUNDS = 5;
const TARGET_SEASON_ID = 's2025'; // Hardcoded for now, expected to be "RWK 2025 KK"

async function fetchSeasonData(seasonId: string): Promise<SeasonDisplay | null> {
  try {
    const seasonDocRef = doc(db, "seasons", seasonId);
    const seasonSnap = await getDoc(seasonDocRef);

    if (!seasonSnap.exists()) {
      console.error(`Season document with ID '${seasonId}' not found in 'seasons' collection.`);
      return null;
    }
    const season = { id: seasonSnap.id, ...seasonSnap.data() } as Season;
    console.log(`Season '${season.name}' (ID: ${season.id}) found.`);

    // Fetch leagues for this season
    const leaguesColRef = collection(db, "rwk_leagues");
    const qLeagues = query(leaguesColRef, where("seasonId", "==", seasonId));
    const leaguesSnapshot = await getDocs(qLeagues);
    const leagueDisplays: LeagueDisplay[] = [];

    if (leaguesSnapshot.empty) {
        console.warn(`No leagues found with seasonId '${seasonId}' in 'rwk_leagues' collection.`);
    }

    for (const leagueDoc of leaguesSnapshot.docs) {
      const league = { id: leagueDoc.id, ...leagueDoc.data() } as League;
      const teamDisplays: TeamDisplay[] = [];
      console.log(`Fetching teams for league '${league.name}' (ID: ${league.id})...`);

      // Fetch teams for this league and season
      const teamsColRef = collection(db, "rwk_teams");
      const qTeams = query(teamsColRef, where("leagueId", "==", league.id), where("seasonId", "==", seasonId));
      const teamsSnapshot = await getDocs(qTeams);
      
      if (teamsSnapshot.empty) {
        console.warn(`No teams found for leagueId '${league.id}' and seasonId '${seasonId}' in 'rwk_teams' collection.`);
      }

      for (const teamDoc of teamsSnapshot.docs) {
        const teamData = teamDoc.data() as Omit<Team, 'id'>;
        const team: Team = { id: teamDoc.id, ...teamData };

        let clubName = "Unbekannter Verein";
        if (team.clubId) {
          const clubDocRef = doc(db, "clubs", team.clubId);
          const clubSnap = await getDoc(clubDocRef);
          if (clubSnap.exists()) {
            clubName = (clubSnap.data() as Club).name;
          } else {
            console.warn(`Club with ID '${team.clubId}' for team '${team.name}' not found.`);
          }
        }

        const shooterResultsDisplay: ShooterDisplayResults[] = [];
        if (team.shooterIds && team.shooterIds.length > 0) {
          for (const shooterId of team.shooterIds) {
            const shooterDocRef = doc(db, "rwk_shooters", shooterId);
            const shooterSnap = await getDoc(shooterDocRef);
            const shooterName = shooterSnap.exists() ? `${(shooterSnap.data() as Shooter).firstName} ${(shooterSnap.data() as Shooter).lastName}` : "Unbekannter Schütze";
            if (!shooterSnap.exists()) {
                 console.warn(`Shooter with ID '${shooterId}' for team '${team.name}' not found in 'rwk_shooters'.`);
            }

            const shooterResultDocRef = doc(db, "rwk_teams", team.id, "shooterResults", shooterId);
            const shooterResultSnap = await getDoc(shooterResultDocRef);
            
            let results: { [key: string]: number | null } = {};
            if (shooterResultSnap.exists()) {
                 results = (shooterResultSnap.data() as ShooterRoundResults).results || {};
            } else {
                console.warn(`No shooterResults found for shooter ID '${shooterId}' in team '${team.id}'. Filling with nulls.`);
                for (let i = 1; i <= NUM_ROUNDS; i++) {
                    results[`dg${i}`] = null;
                }
            }
            
            let totalScore = 0;
            let roundsCount = 0;
            Object.values(results).forEach(score => {
              if (score !== null && typeof score === 'number') {
                totalScore += score;
                roundsCount++;
              }
            });
            const average = roundsCount > 0 ? totalScore / roundsCount : 0;

            shooterResultsDisplay.push({
              id: shooterResultSnap.id || shooterId,
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
        
        let teamTotalScore = 0;
        if (team.roundResults) {
            Object.values(team.roundResults).forEach(score => {
                if (typeof score === 'number') {
                    teamTotalScore += score;
                }
            });
        } else {
            console.warn(`Team '${team.name}' (ID: ${team.id}) has no 'roundResults' field.`);
        }


        teamDisplays.push({
          ...team,
          id: team.id,
          clubName: clubName,
          shootersResults: shooterResultsDisplay,
          totalScore: teamTotalScore,
        });
      }
      
      teamDisplays.sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0));
      teamDisplays.forEach((team, index) => {
        team.rank = index + 1;
      });

      leagueDisplays.push({ ...league, teams: teamDisplays });
    }
    leagueDisplays.sort((a, b) => a.name.localeCompare(b.name));

    return { ...season, leagues: leagueDisplays };

  } catch (error) {
    console.error("Error fetching season data from Firestore:", error);
    // Ensure a null is returned or error is re-thrown to be caught by caller
    // Depending on how the calling useEffect handles it, this might be sufficient
    // to set the error state in the component.
    throw error; // Re-throw so the component's catch block can handle it.
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
        console.log(`Attempting to fetch data for season ID: ${TARGET_SEASON_ID}`);
        const seasonData = await fetchSeasonData(TARGET_SEASON_ID);
        setSelectedSeason(seasonData);
        if (seasonData) {
          console.log("Season data successfully loaded and processed:", seasonData);
        } else {
          console.warn("fetchSeasonData returned null, indicating season was not found.");
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
            <p className="text-sm mt-2">Stellen Sie sicher, dass die Firestore Sicherheitsregeln korrekt konfiguriert sind und die Collection-Namen übereinstimmen.</p>
            <p className="text-sm mt-2">Fehlermeldung: {error.message}</p>
            <p className="text-sm mt-2">Bitte versuchen Sie es später erneut oder kontaktieren Sie den Administrator. Überprüfen Sie auch die Browser-Konsole auf detailliertere Fehlermeldungen von Firebase.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!selectedSeason) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-3">
          <InfoIcon className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-primary">Keine Saisondaten</h1>
        </div>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Saison nicht gefunden</CardTitle>
          </CardHeader>
          <CardContent className="p-6 text-muted-foreground">
            <p>
              Das Saison-Dokument mit der ID <code className="font-mono bg-muted px-1 py-0.5 rounded-sm">{TARGET_SEASON_ID}</code> wurde nicht in der Firestore-Collection <code className="font-mono bg-muted px-1 py-0.5 rounded-sm">seasons</code> gefunden.
            </p>
            <p className="mt-2">
              Bitte überprüfen Sie Folgendes:
            </p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>Ist die Saison-ID <code className="font-mono bg-muted px-1 py-0.5 rounded-sm">{TARGET_SEASON_ID}</code> korrekt?</li>
              <li>Existiert ein Dokument mit genau dieser ID in der <code className="font-mono bg-muted px-1 py-0.5 rounded-sm">seasons</code> Collection in Ihrer Firestore-Datenbank?</li>
              <li>Sind Ihre Firestore-Sicherheitsregeln so konfiguriert, dass Lesezugriff auf die <code className="font-mono bg-muted px-1 py-0.5 rounded-sm">seasons</code> Collection erlaubt ist?</li>
            </ul>
            <p className="mt-3">Ohne ein gültiges Saison-Dokument können keine weiteren Daten (Ligen, Mannschaften, Ergebnisse) geladen werden.</p>
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
            <CardHeader>
                <CardTitle className="text-accent">Keine Ligen</CardTitle>
            </CardHeader>
            <CardContent className="text-center py-12 p-6">
                <p className="text-lg text-muted-foreground">Für die Saison "{selectedSeason.name}" wurden keine Ligen in der Collection <code className="font-mono bg-muted px-1 py-0.5 rounded-sm">rwk_leagues</code> gefunden, die auf die Saison-ID <code className="font-mono bg-muted px-1 py-0.5 rounded-sm">{selectedSeason.id}</code> verweisen.</p>
                <p className="text-muted-foreground mt-2">Bitte überprüfen Sie, ob Ligadokumente mit dem Feld <code className="font-mono bg-muted px-1 py-0.5 rounded-sm">seasonId: "{selectedSeason.id}"</code> existieren.</p>
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
                      <React.Fragment>
                        <TableHead className="w-[40px] text-center">#</TableHead>
                        <TableHead>Mannschaft</TableHead>
                        {[...Array(NUM_ROUNDS)].map((_, i) => (
                          <TableHead key={`dg${i + 1}`} className="text-center">DG {i + 1}</TableHead>
                        ))}
                        <TableHead className="text-center font-semibold">Gesamt</TableHead>
                        <TableHead className="w-[50px]"></TableHead>{/* For expand icon */}
                      </React.Fragment>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {league.teams.sort((a,b) => (a.rank || 999) - (b.rank || 999)).map((team, index) => ( // Sort by rank
                      <React.Fragment key={team.id}>
                        <TableRow className="hover:bg-secondary/20 transition-colors">
                          <React.Fragment>
                            <TableCell className="text-center font-medium">{team.rank || index + 1}</TableCell>
                            <TableCell className="font-medium text-foreground">{team.name} <span className="text-xs text-muted-foreground">({team.clubName || 'N/A'})</span></TableCell>
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
                          </React.Fragment>
                        </TableRow>
                        {team.shootersResults && team.shootersResults.length > 0 && openTeamDetails[team.id] && (
                           <TableRow id={`team-details-${team.id}`} className="bg-muted/10 hover:bg-muted/20">
                             <React.Fragment>
                              <TableCell colSpan={3 + NUM_ROUNDS + 1} className="p-0">
                                <div className="p-4 space-y-3">
                                  <h4 className="text-md font-semibold text-accent-foreground">Einzelergebnisse für {team.name}</h4>
                                  <Table className="bg-background rounded-md shadow-sm">
                                    <TableHeader>
                                      <TableRow className="bg-secondary/30">
                                        <React.Fragment>
                                          <TableHead>Schütze</TableHead>
                                          {[...Array(NUM_ROUNDS)].map((_, i) => (
                                            <TableHead key={`shooter-dg${i + 1}`} className="text-center">DG {i + 1}</TableHead>
                                          ))}
                                          <TableHead className="text-center font-semibold">Schnitt</TableHead>
                                        </React.Fragment>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {team.shootersResults.sort((a,b) => (a.shooterName || '').localeCompare(b.shooterName || '')).map(shooterRes => ( // Sort shooters by name
                                        <TableRow key={shooterRes.shooterId}>
                                          <React.Fragment>
                                            <TableCell className="font-medium">{shooterRes.shooterName || shooterRes.shooterId}</TableCell>
                                            {[...Array(NUM_ROUNDS)].map((_, i) => (
                                               <TableCell key={`shooter-dg${i + 1}-${shooterRes.shooterId}`} className="text-center">
                                                {shooterRes.results?.[`dg${i + 1}` as keyof typeof shooterRes.results] ?? '-'}
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
                <p className="p-4 text-center text-muted-foreground">Keine Mannschaften in dieser Liga für die Saison {selectedSeason.name} vorhanden.</p>
              )}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}

