"use client";
import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ManualAccordion } from '../manual-accordion';
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SmartTable } from '@/components/ui/smart-table';
import { TeamStatusBadge } from '@/components/ui/team-status-badge';
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ChevronDown, ChevronRight, Loader2, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getRwkZone, determineLeagueCompleteRound, berechnePrognose, istOffeneKlasse, type Prognose } from '../_lib/rwk-zones';
import { downloadLeagueTeamsPDF, downloadLeagueShootersPDF } from '../_lib/pdf-downloads';
import { TeamShootersTable } from './TeamShootersTable';
import { MannschaftCards } from './MannschaftCards';
import { RWKLegend } from '@/components/ui/rwk-legend';
import type { useRwkTabellenData } from '../_hooks/useRwkTabellenData';

type RwkData = ReturnType<typeof useRwkTabellenData>;

export function MannschaftenTab({ data }: { data: RwkData }) {
  const {
    router, isNativeApp, needsSpecialTouch,
    selectedCompetition, teamData,
    loadingTeamShooters, showOutOfCompetitionTeams, setShowOutOfCompetitionTeams,
    loadingData, error, currentNumRoundsState,
    openAccordionItems, expandedTeamIds, teamSubstitutions, useMobileCards,
    fetchIndividualShooterData, handleAccordionValueChange,
    toggleTeamExpansion, handleShooterNameClick, loadTeamShooters,
    pageTitle, toast,
  } = data;
  if (!selectedCompetition) return null;

  // Ligen nach Hierarchie (order) sortiert -> fuer Nachbarligen-Vergleich der Prognose.
  const sortedLeagues = teamData
    ? [...teamData.leagues].sort((a, b) => ((a as any).order || 0) - ((b as any).order || 0))
    : [];

  // Liefert eine Funktion, die fuer ein Team der gegebenen Liga die Auf-/Abstiegs-Prognose berechnet.
  const prognoseFnFuerLiga = (leagueId: string) => {
    const idx = sortedLeagues.findIndex(l => l.id === leagueId);
    const eigene = sortedLeagues[idx];
    // Offene Klassen (Freihand/Pistole) haben keine Auf-/Abstiege -> keine Prognose.
    if (!eigene || istOffeneKlasse(eigene as any)) {
      const leer: Prognose = { typ: null, text: '' };
      return (_team: any): Prognose => leer;
    }
    // Obere Liga (order-1) nur, wenn sie NICHT offen ist; sonst kein Aufstiegsvergleich.
    const obere = idx > 0 ? sortedLeagues[idx - 1] : null;
    const untere = idx < sortedLeagues.length - 1 ? sortedLeagues[idx + 1] : null;
    const obereTeams = obere && !istOffeneKlasse(obere as any) ? obere.teams : null;
    const untereTeams = untere && !istOffeneKlasse(untere as any) ? untere.teams : null;
    return (team: any) => berechnePrognose(team, eigene.teams, obereTeams, untereTeams, currentNumRoundsState);
  };

  return (
    <>

          
          {!loadingData && !error && (!teamData || teamData.leagues.length === 0) && (
            <Card className="shadow-lg">
                <CardHeader><CardTitle className="text-accent">Keine Ligen für {selectedCompetition.displayName}</CardTitle></CardHeader>
                <CardContent className="text-center py-12 p-6">
                    <AlertTriangle className="mx-auto h-10 w-10 mb-3 text-primary/70" />
                    <p className="text-lg text-muted-foreground">
                        Für {selectedCompetition.displayName} wurden keine Ligen mit Status "Laufend" gefunden, oder es sind keine Mannschaften für diese Ligen vorhanden.
                    </p>
                     <p className="text-sm mt-1">Bitte überprüfen Sie den Status der Saison in der <Link href="/admin/seasons" className="underline hover:text-primary">Saisonverwaltung</Link>.</p>
                </CardContent>
            </Card>
          )}
          {!loadingData && !error && teamData && teamData.leagues.length > 0 && (
            <>
            {/* Zonen-Legende fuer Auf-/Abstieg */}
            <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground px-1">
              <span className="font-medium text-foreground">Platzierung:</span>
              <span className="inline-flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-amber-200 dark:bg-amber-500/30 border border-amber-400" /> Platz 1 (Meister)</span>
              <span className="inline-flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-500/40 border border-slate-400" /> Platz 2 (Aufstieg)</span>
              <span className="inline-flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-orange-200 dark:bg-orange-500/30 border border-orange-400" /> Abstiegskampf</span>
              <span className="inline-flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-200 dark:bg-red-500/30 border border-red-400" /> Abstieg</span>
              <span className="italic">Zonen richten sich nach der Ligagröße.</span>
            </div>
            <ManualAccordion 
              value={openAccordionItems}
              onValueChange={handleAccordionValueChange}
              items={teamData.leagues.map(league => ({
                id: league.id,
                title: <>{league.name} {league.shortName && `(${league.shortName})`}</>,
                content: (
                  <div className="pt-0 pb-0">

                    

                    
                    <div className="flex justify-between items-center gap-2 px-3 py-2 bg-muted/40 rounded-lg mx-1 mt-1 mb-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id={`showOutOfCompetitionTeams-${league.id}`}
                          checked={showOutOfCompetitionTeams}
                          onCheckedChange={(checked) => {
                            setShowOutOfCompetitionTeams(!!checked);
                            const currentParams = new URLSearchParams(window.location.search);
                            currentParams.set('showAK', (!!checked).toString());
                            router.replace(`/rwk-tabellen?${currentParams.toString()}`, { scroll: false });
                          }}
                          className="h-4 w-4"
                        />
                        <Label 
                          htmlFor={`showOutOfCompetitionTeams-${league.id}`}
                          className="text-xs cursor-pointer text-muted-foreground"
                        >
                          Teams außer Konkurrenz anzeigen
                        </Label>
                      </div>
                      
                      {/* PDF Buttons nur auf Desktop */}
                      <div className="hidden lg:flex gap-1.5">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-xs px-2 py-1 bg-background !text-foreground hover:!text-foreground border-primary/40 hover:bg-muted"
                          onClick={() => downloadLeagueTeamsPDF(league, selectedCompetition, currentNumRoundsState, fetchIndividualShooterData, toast)}
                        >
                          Mannschaften als PDF
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-xs px-2 py-1 bg-background !text-foreground hover:!text-foreground border-primary/40 hover:bg-muted"
                          onClick={() => downloadLeagueShootersPDF(league, selectedCompetition, currentNumRoundsState, fetchIndividualShooterData, toast)}
                        >
                          Einzelschützen PDF
                        </Button>
                      </div>
                      
                      {/* Mobile Hinweis */}
                      <div className="lg:hidden text-xs text-muted-foreground">
                        💡 PDF am Desktop
                      </div>
                    </div>
                    {league.teams.length > 0 ? (
                      useMobileCards ? (
                        (() => {
                          // Berechne liga-weit vollständigen Durchgang auch für Mobile
                          const leagueCompleteRound = determineLeagueCompleteRound(league.teams, currentNumRoundsState);
                          const wertbareTeams = league.teams.filter(t => !t.outOfCompetition && !t.istEinzelwertung && t.rank).length;
                          const getPrognose = prognoseFnFuerLiga(league.id);
                          
                          return (
                        <div>
                          <MannschaftCards
                          teams={league.teams.filter(team => showOutOfCompetitionTeams || !team.outOfCompetition)}
                          numRounds={currentNumRoundsState}
                          onShooterClick={handleShooterNameClick}
                          teamSubstitutions={teamSubstitutions}
                          expandedTeams={expandedTeamIds}
                          onToggleTeam={toggleTeamExpansion}
                          loadingTeams={loadingTeamShooters}
                          onLoadTeamShooters={loadTeamShooters}
                          leagueCompleteRound={leagueCompleteRound}
                          wertbareTeams={wertbareTeams}
                          getPrognose={getPrognose}
                        />
                        </div>
                          );
                        })()
                      ) : (
                        (() => {
                          // Berechne liga-weit vollständigen Durchgang
                          const leagueCompleteRound = determineLeagueCompleteRound(league.teams, currentNumRoundsState);
                          // Anzahl wertbarer Teams (mit echtem Rang, ohne AK/Einzel) für die Auf-/Abstiegs-Zonen
                          const wertbareTeams = league.teams.filter(t => !t.outOfCompetition && !t.istEinzelwertung && t.rank).length;
                          const getPrognose = prognoseFnFuerLiga(league.id);
                          
                          return (
                        <div className={needsSpecialTouch ? "overflow-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200" : "overflow-x-auto"} style={needsSpecialTouch ? { 
                          touchAction: 'manipulation', 
                          maxHeight: '70vh',
                          WebkitOverflowScrolling: 'touch',
                          transform: 'translateZ(0)',
                          overflow: 'auto',
                          WebkitTransform: 'translateZ(0)',
                          willChange: 'scroll-position'
                        } : { touchAction: 'pan-x pan-y', overflowX: 'scroll' }}>
                          <SmartTable style={{ 
                            touchAction: 'auto',
                            transform: 'translateZ(0)'
                          }}>
                          <TableHeader>
                            <TableRow className="bg-muted/80 backdrop-blur supports-[backdrop-filter]:bg-muted/60 sticky top-0 z-10">
                              <TableHead className="w-[50px] text-center px-2 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">#</TableHead>
                              <TableHead className="min-w-[150px] px-2 py-2.5 text-sm font-semibold text-muted-foreground">Mannschaft</TableHead>
                              {[...Array(currentNumRoundsState)].map((_, i) => (
                                <TableHead key={`dg-header-${i + 1}`} className="px-1 py-2.5 text-center text-xs text-muted-foreground font-medium">DG {i + 1}</TableHead>
                              ))}
                              <TableHead className="text-center px-1 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground whitespace-nowrap">Gesamt</TableHead>
                              {!isNativeApp && <TableHead className="text-center px-1 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground whitespace-nowrap">Schnitt</TableHead>}
                              {!isNativeApp && <TableHead className="w-[60px] text-right pr-4 px-2 py-2.5"></TableHead>}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {league.teams
                              .filter(team => showOutOfCompetitionTeams || !team.outOfCompetition)
                              .map(team => {
                              const zone = getRwkZone(team.rank, wertbareTeams);
                              return (
                              <React.Fragment key={team.id}>
                                <TableRow
                                  className={cn(
                                    "hover:bg-primary/5 transition-colors cursor-pointer",
                                    !zone && "odd:bg-muted/20",
                                    zone === 'gold' && "bg-amber-50 dark:bg-amber-900/15",
                                    zone === 'silber' && "bg-slate-100/70 dark:bg-slate-700/25",
                                    zone === 'kampf' && "bg-orange-50 dark:bg-orange-900/15",
                                    zone === 'abstieg' && "bg-red-50 dark:bg-red-900/15"
                                  )}
                                  onClick={() => toggleTeamExpansion(team.id)}
                                >
                                  <TableCell className="text-center font-medium px-2 py-2">
                                    {team.outOfCompetition ? 
                                      <span className="text-amber-500 dark:text-amber-400 font-semibold" title="Außer Konkurrenz">AK</span> : 
                                      team.istEinzelwertung ?
                                        <span className="text-slate-500" title="Einzelmeldung – außer Wertung">—</span> :
                                        zone ? (
                                          <span
                                            className={cn(
                                              "inline-flex items-center justify-center w-7 h-7 rounded-full font-bold text-sm",
                                              zone === 'gold' && "bg-amber-200 text-amber-800 dark:bg-amber-500/30 dark:text-amber-200",
                                              zone === 'silber' && "bg-slate-300 text-slate-800 dark:bg-slate-500/40 dark:text-slate-100",
                                              zone === 'kampf' && "bg-orange-200 text-orange-800 dark:bg-orange-500/30 dark:text-orange-200",
                                              zone === 'abstieg' && "bg-red-200 text-red-800 dark:bg-red-500/30 dark:text-red-200"
                                            )}
                                            title={
                                              zone === 'gold' ? `Platz ${team.rank} – Meister / Aufstieg` :
                                              zone === 'silber' ? `Platz ${team.rank} – Aufstieg / Vergleich` :
                                              zone === 'kampf' ? `Platz ${team.rank} – Abstiegskampf` :
                                              `Platz ${team.rank} – Abstieg`
                                            }
                                          >
                                            {team.rank}
                                          </span>
                                        ) :
                                        <span className="text-foreground dark:text-foreground">{team.rank}</span>
                                    }
                                  </TableCell>
                                  <TableCell className="font-medium text-foreground px-2 py-2 text-sm">
                                    {team.name}
                                    <TeamStatusBadge 
                                      outOfCompetition={team.outOfCompetition} 
                                      reason={team.outOfCompetitionReason} 
                                      className="ml-2" 
                                    />
                                    {team.istEinzelwertung && (
                                      <span 
                                        className="ml-2 text-xs bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-medium cursor-help"
                                        title="Einzelmeldung – außer Wertung, zählt nicht für die Mannschaftsplatzierung"
                                      >
                                        Einzel
                                      </span>
                                    )}
                                    {(() => {
                                      const p = getPrognose(team);
                                      if (!p.typ) return null;
                                      const cls =
                                        p.typ === 'aufstieg_moeglich' ? 'text-green-700 dark:text-green-400' :
                                        p.typ === 'klassenerhalt' ? 'text-green-700 dark:text-green-400' :
                                        p.typ === 'abstieg_droht' ? 'text-red-600 dark:text-red-400' :
                                        'text-orange-600 dark:text-orange-400';
                                      const icon =
                                        p.typ === 'aufstieg_moeglich' ? '⬆️' :
                                        p.typ === 'aufstieg_fraglich' ? '↗️' :
                                        p.typ === 'abstieg_droht' ? '⬇️' : '🛟';
                                      return (
                                        <div className={cn("text-[11px] mt-0.5 font-medium", cls)} title={p.text}>
                                          {icon} {p.text}
                                        </div>
                                      );
                                    })()}
                                  </TableCell>
                                  {[...Array(currentNumRoundsState)].map((_, i) => (
                                    <TableCell key={`dg-val-${i + 1}-${team.id}`} className="text-center px-1 py-2">{(team.roundResults as any)?.[`dg${i + 1}`] ?? '-'}</TableCell>
                                  ))}
                                  <TableCell className="text-center px-2 py-2">
                                    {(() => {
                                      // Berechne Wertungs-Score bis zum liga-weiten vollständigen Durchgang
                                      let leagueScore = 0;
                                      for (let r = 1; r <= leagueCompleteRound; r++) {
                                        const score = team.roundResults?.[`dg${r}`];
                                        if (score !== null && score !== undefined) {
                                          leagueScore += score;
                                        }
                                      }
                                      
                                      const showBoth = leagueScore !== team.totalScore;
                                      
                                      return (
                                        <div className="flex flex-col items-center">
                                          <span className="font-bold text-lg text-primary">{leagueScore}</span>
                                          {showBoth && (
                                            <TooltipProvider>
                                              <UITooltip>
                                                <TooltipTrigger asChild>
                                                  <span className="text-xs text-muted-foreground cursor-help">({team.totalScore ?? 0})</span>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                  <p>Vorschau inkl. noch nicht von allen Mannschaften abgeschlossener Durchgänge</p>
                                                </TooltipContent>
                                              </UITooltip>
                                            </TooltipProvider>
                                          )}
                                        </div>
                                      );
                                    })()}
                                  </TableCell>
                                  {!isNativeApp && <TableCell className="text-center font-medium text-muted-foreground px-2 py-2">{(() => {
                                    // Schnitt nur bis zum liga-weiten vollständigen Durchgang
                                    if (leagueCompleteRound === 0) return '-';
                                    let leagueScoreForAvg = 0;
                                    for (let r = 1; r <= leagueCompleteRound; r++) {
                                      const score = team.roundResults?.[`dg${r}`];
                                      if (score !== null && score !== undefined) leagueScoreForAvg += score;
                                    }
                                    return (leagueScoreForAvg / leagueCompleteRound).toFixed(2);
                                  })()}</TableCell>}
                                  {!isNativeApp && <TableCell className="text-right pr-4 px-2 py-2">
                                    <Button variant="ghost" size="icon" onClick={(e) => {e.stopPropagation(); toggleTeamExpansion(team.id);}} aria-label={`Details für ${team.name} ${expandedTeamIds.includes(team.id) ? 'ausblenden' : 'anzeigen'}`} className="hover:bg-accent/20 rounded-md">
                                      {expandedTeamIds.includes(team.id) ? <ChevronDown className="h-5 w-5 transition-transform duration-200 rotate-180" /> : <ChevronRight className="h-5 w-5 transition-transform duration-200" />}
                                    </Button>
                                  </TableCell>}
                                </TableRow>
                                {expandedTeamIds.includes(team.id) && (
                                  <TableRow className="bg-transparent hover:bg-transparent">
                                    <TableCell colSpan={isNativeApp ? 3 + currentNumRoundsState : 5 + currentNumRoundsState + 1} className="p-0 border-t-0 pl-6">
                                      {loadingTeamShooters.has(team.id) ? (
                                        <div className="p-4 text-center">
                                          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                                          <p className="text-sm text-muted-foreground">Lade Schützen...</p>
                                        </div>
                                      ) : (
                                        <TeamShootersTable shootersResults={team.shootersResults} numRounds={currentNumRoundsState} parentTeam={team} onShooterClick={handleShooterNameClick} teamSubstitutions={teamSubstitutions} />
                                      )}
                                    </TableCell>
                                  </TableRow>
                                )}
                              </React.Fragment>
                              );
                            })}
                          </TableBody>
                          </SmartTable>
                        </div>
                          );
                        })()
                      )
                    ) : (<p className="p-4 text-center text-muted-foreground">Keine Mannschaften in dieser Liga für {pageTitle} vorhanden.</p>)}
                    

                  </div>
                )
              }))}
            />
            </>
          )}
          
          {/* RWK Legende am Ende */}
          <div id="rwk-legend" className="mt-12 mb-8">
            <RWKLegend />
          </div>
    </>
  );
}
