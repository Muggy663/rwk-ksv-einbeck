// src/app/rwk-tabellen/page.tsx
"use client";
import { useState, useEffect } from 'react';
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
import { ChevronDown, TableIcon } from 'lucide-react';
import type { SeasonDisplay, LeagueDisplay, TeamDisplay, ShooterDisplayResults } from '@/types/rwk';
import { Skeleton } from '@/components/ui/skeleton';

// Dummy Data - Replace with actual data fetching
const DUMMY_SEASONS: SeasonDisplay[] = [
  {
    id: 's2024',
    name: 'Rundenwettkampf 2024/2025',
    year: 2024,
    leagues: [
      {
        id: 'kol',
        name: 'Kreisoberliga 2024/2025',
        shortName: 'KOL',
        teams: [
          { id: 't1', name: 'SV Musterstadt 1', clubId: 'c1', leagueId: 'kol', seasonId: 's2024', shooterIds: ['sh1', 'sh2', 'sh3'], roundResults: { dg1: 280, dg2: 275, dg3: 282, dg4: 0, dg5: 0 }, totalScore: 837, clubName: 'SV Musterstadt', rank: 1, 
            shootersResults: [
              { id: 'sh1', shooterId: 'sh1', teamId: 't1', leagueId: 'kol', seasonId: 's2024', shooterName: 'Max Mustermann', results: { dg1: 95, dg2: 92, dg3: 96, dg4: null, dg5: null }, average: 94.33 },
              { id: 'sh2', shooterId: 'sh2', teamId: 't1', leagueId: 'kol', seasonId: 's2024', shooterName: 'Erika Mustermann', results: { dg1: 92, dg2: 93, dg3: 91, dg4: null, dg5: null }, average: 92.00 },
              { id: 'sh3', shooterId: 'sh3', teamId: 't1', leagueId: 'kol', seasonId: 's2024', shooterName: 'Peter Beispiel', results: { dg1: 93, dg2: 90, dg3: 95, dg4: null, dg5: null }, average: 92.67 },
            ]
          },
          { id: 't2', name: 'SG Altdorf II', clubId: 'c2', leagueId: 'kol', seasonId: 's2024', shooterIds: ['sh4', 'sh5', 'sh6'], roundResults: { dg1: 270, dg2: 271, dg3: 268, dg4: 0, dg5: 0 }, totalScore: 809, clubName: 'SG Altdorf', rank: 2 },
          // Add 4 more dummy teams for Kreisoberliga
          { id: 't3', name: 'BSG Neustadt', clubId: 'c3', leagueId: 'kol', seasonId: 's2024', shooterIds: [], roundResults: { dg1: 260, dg2: 265, dg3: 262, dg4: 0, dg5: 0 }, totalScore: 787, clubName: 'BSG Neustadt', rank: 3 },
          { id: 't4', name: 'Freischütz Hütte', clubId: 'c4', leagueId: 'kol', seasonId: 's2024', shooterIds: [], roundResults: { dg1: 255, dg2: 250, dg3: 258, dg4: 0, dg5: 0 }, totalScore: 763, clubName: 'Freischütz Hütte', rank: 4 },
          { id: 't5', name: 'Tell Dorfmark', clubId: 'c5', leagueId: 'kol', seasonId: 's2024', shooterIds: [], roundResults: { dg1: 250, dg2: 245, dg3: 252, dg4: 0, dg5: 0 }, totalScore: 747, clubName: 'Tell Dorfmark', rank: 5 },
          { id: 't6', name: 'Einigkeit Wald', clubId: 'c6', leagueId: 'kol', seasonId: 's2024', shooterIds: [], roundResults: { dg1: 240, dg2: 235, dg3: 242, dg4: 0, dg5: 0 }, totalScore: 717, clubName: 'Einigkeit Wald', rank: 6 },
        ],
      },
      {
        id: 'kl',
        name: 'Kreisliga 2024/2025',
        shortName: 'KL',
        teams: [
          { id: 't7', name: 'SV Musterstadt 2', clubId: 'c1', leagueId: 'kl', seasonId: 's2024', shooterIds: [], roundResults: { dg1: 265, dg2: 260, dg3: 270, dg4: 0, dg5: 0 }, totalScore: 795, clubName: 'SV Musterstadt', rank: 1 },
           // Add 5 more dummy teams for Kreisliga
          { id: 't8', name: 'SG Altdorf III', clubId: 'c2', leagueId: 'kl', seasonId: 's2024', shooterIds: [], roundResults: { dg1: 250, dg2: 255, dg3: 252, dg4: 0, dg5: 0 }, totalScore: 757, clubName: 'SG Altdorf', rank: 2 },
          { id: 't9', name: 'BSG Neustadt II', clubId: 'c3', leagueId: 'kl', seasonId: 's2024', shooterIds: [], roundResults: { dg1: 240, dg2: 245, dg3: 242, dg4: 0, dg5: 0 }, totalScore: 727, clubName: 'BSG Neustadt', rank: 3 },
          { id: 't10', name: 'Freischütz Hütte II', clubId: 'c4', leagueId: 'kl', seasonId: 's2024', shooterIds: [], roundResults: { dg1: 235, dg2: 230, dg3: 238, dg4: 0, dg5: 0 }, totalScore: 703, clubName: 'Freischütz Hütte', rank: 4 },
          { id: 't11', name: 'Tell Dorfmark II', clubId: 'c5', leagueId: 'kl', seasonId: 's2024', shooterIds: [], roundResults: { dg1: 230, dg2: 225, dg3: 232, dg4: 0, dg5: 0 }, totalScore: 687, clubName: 'Tell Dorfmark', rank: 5 },
          { id: 't12', name: 'Einigkeit Wald II', clubId: 'c6', leagueId: 'kl', seasonId: 's2024', shooterIds: [], roundResults: { dg1: 220, dg2: 215, dg3: 222, dg4: 0, dg5: 0 }, totalScore: 657, clubName: 'Einigkeit Wald', rank: 6 },
        ],
      },
      // Add more leagues (e.g., 1. Kreisklasse)
      {
        id: 'kk1',
        name: '1. Kreisklasse 2024/2025',
        shortName: '1.KK',
        teams: [
           { id: 't13', name: 'SV Musterstadt 3', clubId: 'c1', leagueId: 'kk1', seasonId: 's2024', shooterIds: [], roundResults: { dg1: 245, dg2: 250, dg3: 255, dg4: 0, dg5: 0 }, totalScore: 750, clubName: 'SV Musterstadt', rank: 1 },
           { id: 't14', name: 'SG Altdorf IV', clubId: 'c2', leagueId: 'kk1', seasonId: 's2024', shooterIds: [], roundResults: { dg1: 230, dg2: 235, dg3: 232, dg4: 0, dg5: 0 }, totalScore: 697, clubName: 'SG Altdorf', rank: 2 },
           { id: 't15', name: 'BSG Neustadt III', clubId: 'c3', leagueId: 'kk1', seasonId: 's2024', shooterIds: [], roundResults: { dg1: 220, dg2: 225, dg3: 222, dg4: 0, dg5: 0 }, totalScore: 667, clubName: 'BSG Neustadt', rank: 3 },
           { id: 't16', name: 'Freischütz Hütte III', clubId: 'c4', leagueId: 'kk1', seasonId: 's2024', shooterIds: [], roundResults: { dg1: 215, dg2: 210, dg3: 218, dg4: 0, dg5: 0 }, totalScore: 643, clubName: 'Freischütz Hütte', rank: 4 },
           { id: 't17', name: 'Tell Dorfmark III', clubId: 'c5', leagueId: 'kk1', seasonId: 's2024', shooterIds: [], roundResults: { dg1: 210, dg2: 205, dg3: 212, dg4: 0, dg5: 0 }, totalScore: 627, clubName: 'Tell Dorfmark', rank: 5 },
           { id: 't18', name: 'Einigkeit Wald III', clubId: 'c6', leagueId: 'kk1', seasonId: 's2024', shooterIds: [], roundResults: { dg1: 200, dg2: 195, dg3: 202, dg4: 0, dg5: 0 }, totalScore: 597, clubName: 'Einigkeit Wald', rank: 6 },
        ]
      }
    ],
  },
];

const NUM_ROUNDS = 5;

export default function RwkTabellenPage() {
  const [selectedSeason, setSelectedSeason] = useState<SeasonDisplay | null>(DUMMY_SEASONS[0] || null);
  const [loading, setLoading] = useState<boolean>(true);
  const [openTeamDetails, setOpenTeamDetails] = useState<Record<string, boolean>>({});


  useEffect(() => {
    // Simulate data fetching
    const timer = setTimeout(() => {
      // In a real app, fetch data here and update selectedSeason
      // For now, just use dummy data
      setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const toggleTeamDetails = (teamId: string) => {
    setOpenTeamDetails(prev => ({ ...prev, [teamId]: !prev[teamId] }));
  };
  
  // TODO: Add season selection later (e.g., with a Select component)

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
          <CardContent>
            <Accordion type="multiple" className="w-full">
              {[1, 2].map(i => (
                <AccordionItem value={`loader-league-${i}`} key={i} className="border-b-0 mb-4">
                  <AccordionTrigger className="bg-secondary/50 hover:bg-secondary/70 px-4 py-3 rounded-t-md">
                     <Skeleton className="h-5 w-1/2 rounded-md" />
                  </AccordionTrigger>
                  <AccordionContent className="pt-0 bg-card border border-t-0 rounded-b-md p-4">
                    <Skeleton className="h-40 w-full rounded-md" />
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      </div>
    )
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
            <CardTitle>Keine Saison ausgewählt</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Bitte wählen Sie eine Saison aus, um die Tabellen anzuzeigen.</p>
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

      <Accordion type="multiple" defaultValue={selectedSeason.leagues.map(l => l.id)} className="w-full space-y-4">
        {selectedSeason.leagues.map((league) => (
          <AccordionItem value={league.id} key={league.id} className="border bg-card shadow-lg rounded-lg overflow-hidden">
            <AccordionTrigger className="bg-accent/10 hover:bg-accent/20 px-6 py-4 text-xl font-semibold text-accent data-[state=open]:border-b">
              {league.name}
            </AccordionTrigger>
            <AccordionContent className="pt-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-[40px] text-center">#</TableHead>
                      <TableHead>Mannschaft</TableHead>
                      {[...Array(NUM_ROUNDS)].map((_, i) => (
                        <TableHead key={`dg${i + 1}`} className="text-center">DG {i + 1}</TableHead>
                      ))}
                      <TableHead className="text-center font-semibold">Gesamt</TableHead>
                      <TableHead className="w-[50px]"></TableHead> {/* For expand icon */}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {league.teams.sort((a,b) => (a.rank || 99) - (b.rank || 99)).map((team, index) => (
                      <>
                        <TableRow key={team.id} className="hover:bg-secondary/20 transition-colors">
                          <TableCell className="text-center font-medium">{team.rank || index + 1}</TableCell>
                          <TableCell className="font-medium text-foreground">{team.name} <span className="text-xs text-muted-foreground">({team.clubName})</span></TableCell>
                          {[...Array(NUM_ROUNDS)].map((_, i) => (
                            <TableCell key={`dg${i + 1}-${team.id}`} className="text-center">
                              {team.roundResults?.[`dg${i + 1}`] || '-'}
                            </TableCell>
                          ))}
                          <TableCell className="text-center font-semibold text-primary">{team.totalScore || '-'}</TableCell>
                          <TableCell className="text-center">
                            {team.shootersResults && team.shootersResults.length > 0 && (
                              <button
                                onClick={() => toggleTeamDetails(team.id)}
                                className="p-1 hover:bg-accent/20 rounded-md text-muted-foreground hover:text-accent"
                                aria-expanded={!!openTeamDetails[team.id]}
                                aria-controls={`team-details-${team.id}`}
                              >
                                <ChevronDown className={`h-5 w-5 transition-transform ${openTeamDetails[team.id] ? 'rotate-180' : ''}`} />
                                <span className="sr-only">Details anzeigen</span>
                              </button>
                            )}
                          </TableCell>
                        </TableRow>
                        {team.shootersResults && team.shootersResults.length > 0 && openTeamDetails[team.id] && (
                           <TableRow id={`team-details-${team.id}`} className="bg-muted/10 hover:bg-muted/20">
                            <TableCell colSpan={3 + NUM_ROUNDS + 1} className="p-0"> {/* Adjusted colSpan */}
                              <div className="p-4 space-y-3">
                                <h4 className="text-md font-semibold text-accent-foreground">Einzelergebnisse für {team.name}</h4>
                                <Table className="bg-background rounded-md shadow-sm">
                                  <TableHeader>
                                    <TableRow className="bg-secondary/30">
                                      <TableHead>Schütze</TableHead>
                                      {[...Array(NUM_ROUNDS)].map((_, i) => (
                                        <TableHead key={`shooter-dg${i + 1}`} className="text-center">DG {i + 1}</TableHead>
                                      ))}
                                      <TableHead className="text-center font-semibold">Schnitt</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {team.shootersResults.map(shooterRes => (
                                      <TableRow key={shooterRes.shooterId}>
                                        <TableCell className="font-medium">{shooterRes.shooterName || shooterRes.shooterId}</TableCell>
                                        {[...Array(NUM_ROUNDS)].map((_, i) => (
                                           <TableCell key={`shooter-dg${i + 1}-${shooterRes.shooterId}`} className="text-center">
                                            {shooterRes.results?.[`dg${i + 1}`] ?? '-'}
                                           </TableCell>
                                        ))}
                                        <TableCell className="text-center font-semibold text-primary">
                                          {shooterRes.average?.toFixed(2) || '-'}
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {league.teams.length === 0 && (
                <p className="p-4 text-center text-muted-foreground">Keine Mannschaften in dieser Liga vorhanden.</p>
              )}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
      {selectedSeason.leagues.length === 0 && (
         <Card className="shadow-lg">
            <CardContent className="text-center py-12">
                <p className="text-lg text-muted-foreground">Keine Ligen für diese Saison gefunden.</p>
            </CardContent>
        </Card>
      )}
    </div>
  );
}
