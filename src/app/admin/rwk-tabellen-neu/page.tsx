"use client";
import React, { Suspense } from 'react';
import Link from 'next/link';
import { TeamStatusBadge } from '@/components/ui/team-status-badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ManualAccordion } from './manual-accordion';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { NativeSelect } from "@/components/ui/native-select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { ChevronDown, ChevronRight, TableIcon as TableIconLucide, Loader2, AlertTriangle, User, Users, Trophy, Medal, LineChart as LineChartIcon, FileDown, Info } from 'lucide-react';
import type { LeagueDisplay } from '@/types/rwk';
import { Button } from '@/components/ui/button';
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { BackButton } from '@/components/ui/back-button';
import { RWKLegend } from '@/components/ui/rwk-legend';
import { SmartTable } from '@/components/ui/smart-table';
import { MobileShooterCards } from '@/components/ui/mobile-shooter-cards';
import { getRwkZone, determineLeagueCompleteRound } from './_lib/rwk-zones';
import { TeamShootersTable } from './_components/TeamShootersTable';
import { ShooterDetailModalContent } from './_components/ShooterDetailModalContent';
import { RwkTabellenPageLoadingSkeleton } from './_components/RwkTabellenPageLoadingSkeleton';
import { MannschaftCards } from './_components/MannschaftCards';
import { downloadLeagueTeamsPDF, downloadLeagueShootersPDF, downloadGesamtlistePDF } from './_lib/pdf-downloads';
import { useRwkTabellenData } from './_hooks/useRwkTabellenData';

function RwkTabellenPageComponent() {
  const {
    router, isNativeApp, needsSpecialTouch,
    availableCompetitions, isLoadingInitialCompetitions,
    selectedCompetition, activeTab, setActiveTab,
    teamData, filteredIndividualData,
    loadingTeamShooters,
    topMaleShooter, topFemaleShooter,
    selectedIndividualLeagueFilter, setSelectedIndividualLeagueFilter,
    lastClickedLeagueId, shooterSearchTerm, setShooterSearchTerm,
    showOutOfCompetitionTeams, setShowOutOfCompetitionTeams,
    showOutOfCompetitionShooters, setShowOutOfCompetitionShooters,
    loadingData, error, currentNumRoundsState,
    openAccordionItems, expandedTeamIds,
    isShooterDetailModalOpen, setIsShooterDetailModalOpen,
    selectedShooterForDetail, teamSubstitutions, useMobileCards,
    fetchIndividualShooterData, handleCompetitionChange, handleAccordionValueChange,
    toggleTeamExpansion, handleShooterNameClick, loadTeamShooters,
    pageTitle, availableLeaguesForIndividualFilter, toast,
  } = useRwkTabellenData();

  // Conditional rendering for loading initial config
  if (isLoadingInitialCompetitions || !selectedCompetition) {
    return <RwkTabellenPageLoadingSkeleton title={pageTitle || 'Lade Konfiguration...'} />;
  }

  return (
    <div className="space-y-8" style={{
      touchAction: 'manipulation',
      WebkitOverflowScrolling: 'touch',
      WebkitTransform: 'translateZ(0)',
      willChange: 'scroll-position'
    }}>
      {/* Vorschau-Hinweis - nur in der Admin-Preview-Version */}
      <div className="rounded-lg border-2 border-dashed border-amber-400 bg-amber-50 dark:bg-amber-900/20 px-4 py-3 text-sm text-amber-900 dark:text-amber-100">
        🧪 <strong>Vorschau-Version</strong> der RWK-Tabellen (nur Admin). Diese Seite dient zum Testen des neuen Designs. Die öffentliche Seite unter <code>/rwk-tabellen</code> bleibt unverändert.
      </div>
      {/* Moderner Header mit Gradient */}
      <div className="rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 p-5 sm:p-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <BackButton fallbackHref="/admin" />
            <div className="flex items-center justify-center h-11 w-11 rounded-xl bg-primary text-primary-foreground shrink-0">
              <TableIconLucide className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground truncate">{pageTitle}</h1>
              <p className="text-sm text-muted-foreground">Rundenwettkampf-Tabellen</p>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="ml-auto text-muted-foreground hover:text-primary p-2 shrink-0"
              onClick={() => document.getElementById('rwk-legend')?.scrollIntoView({ behavior: 'smooth' })}
              aria-label="Legende anzeigen"
            >
              <Info className="h-5 w-5" />
            </Button>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
            <label className="text-sm font-semibold text-foreground sm:min-w-[90px]">Wettkampf</label>
            <NativeSelect
              value={selectedCompetition ? `${selectedCompetition.year}-${selectedCompetition.discipline}` : ""}
              onValueChange={(value) => handleCompetitionChange(value)}
              disabled={availableCompetitions.length === 0 || loadingData}
              className="w-full sm:flex-1 sm:max-w-md shadow-sm bg-white dark:bg-gray-800 font-medium"
              placeholder={availableCompetitions.length === 0 ? "Keine Wettkämpfe" : "Wettkampf wählen"}
              options={availableCompetitions.map(comp => ({
                value: `${comp.year}-${comp.discipline}`,
                label: comp.displayName
              }))}
            />
            <Button asChild variant="outline" className="w-full sm:w-auto border-primary/40 bg-background !text-foreground hover:!text-foreground hover:bg-muted">
              <Link href="/statistik" className="flex items-center justify-center !text-foreground">
                <LineChartIcon className="mr-2 h-4 w-4" />
                Statistiken
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => {
        setActiveTab(value as 'mannschaften' | 'einzelschützen');
        // Context-Aware Navigation: Verwende zuletzt geöffnete Liga
        if (value === 'einzelschützen' && lastClickedLeagueId) {
          // Aktualisiere Liga-Filter immer mit zuletzt geöffneter Liga
          if (selectedIndividualLeagueFilter !== lastClickedLeagueId) {
            setSelectedIndividualLeagueFilter(lastClickedLeagueId);

          }
        }
      }} className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:w-1/2 lg:w-1/3 mb-6 shadow-md">
          <TabsTrigger value="mannschaften" className="py-2.5"><Users className="mr-2 h-5 w-5" />Mannschaften</TabsTrigger>
          <TabsTrigger value="einzelschützen" className="py-2.5"><User className="mr-2 h-5 w-5" />Einzelschützen</TabsTrigger>
        </TabsList>

        {loadingData && <div className="flex flex-col items-center justify-center py-10 text-muted-foreground mt-6"><Loader2 className="h-12 w-12 animate-spin text-primary mb-4" /><p className="text-lg">Lade Daten für {selectedCompetition.displayName}...</p></div>}
        
        {!loadingData && error && (
          <Card className="shadow-lg border-destructive"><CardHeader><CardTitle className="text-destructive flex items-center"><AlertTriangle className="mr-2 h-5 w-5" />Fehler beim Laden</CardTitle></CardHeader><CardContent className="text-destructive-foreground bg-destructive/10 p-6"><p>{error}</p><p className="text-sm mt-1">Bitte sicherstellen, dass Saisons für das gewählte Jahr/Disziplin existieren, Status "Laufend" haben und Firestore-Indizes korrekt sind.</p></CardContent></Card>
        )}

        <TabsContent value="mannschaften">

          
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
                            router.replace(`/admin/rwk-tabellen-neu?${currentParams.toString()}`, { scroll: false });
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
        </TabsContent>

        <TabsContent value="einzelschützen">
          {!loadingData && !error && (
             <div className="mb-4 space-y-4">
                <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">🎯 Liga-Auswahl erforderlich</h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                    Bitte wählen Sie eine Liga aus, um die Einzelrangliste anzuzeigen. 
                    Eine übergreifende Anzeige aller Disziplinen ist nicht möglich, 
                    da verschiedene Disziplinen (Pistole, Gewehr, Luftdruck) nicht vergleichbar sind.
                  </p>
                  <div>
                    <Label htmlFor="individualLeagueFilter" className="text-sm font-medium text-blue-900 dark:text-blue-100">Liga auswählen:</Label>
                    <NativeSelect
                      id="individualLeagueFilter"
                      value={selectedIndividualLeagueFilter || ""}
                      onValueChange={(value) => setSelectedIndividualLeagueFilter(value)}
                      disabled={loadingData || !teamData || availableLeaguesForIndividualFilter.length === 0}
                      className="w-full sm:w-[350px] mt-1 shadow-sm border-blue-300"
                      placeholder="-- Bitte Liga auswählen --"
                      options={[
                        ...(selectedCompetition?.discipline === 'KK' ? [{
                          value: "KK_GEWEHR_EHRUNGEN",
                          label: "🏆 Alle KK Gewehr Auflage"
                        }] : []),
                        ...(((selectedCompetition?.discipline as string) === 'LG' || (selectedCompetition?.discipline as string) === 'LP') ? [{
                          value: "LGA_GESAMTLISTE",
                          label: "🏆 Alle Luftdruck Auflage (Gesamtliste)"
                        }] : []),
                        ...availableLeaguesForIndividualFilter
                          .filter(l => l && typeof l.id === 'string' && l.id.trim() !== "")
                          .map(league => {
                            const cleanName = league.name
                              .replace(/\s*\(Gruppe\)\s*/g, '')
                              .replace(/\s+Gruppe\s*$/g, '')
                              .trim();
                            return {
                              value: league.id,
                              label: `${cleanName} (${league.type})`
                            };
                          })
                      ]}
                    />
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="showOutOfCompetitionShootersIndividual"
                      checked={showOutOfCompetitionShooters}
                      onCheckedChange={(checked) => {
                        setShowOutOfCompetitionShooters(!!checked);
                        const currentParams = new URLSearchParams(window.location.search);
                        currentParams.set('showAKShooters', (!!checked).toString());
                        router.replace(`/admin/rwk-tabellen-neu?${currentParams.toString()}`, { scroll: false });
                      }}
                      className="h-5 w-5"
                    />
                    <Label 
                      htmlFor="showOutOfCompetitionShootersIndividual"
                      className="text-xs cursor-pointer"
                    >
                      AK-Schützen anzeigen
                    </Label>
                  </div>
                  {selectedIndividualLeagueFilter && (
                    <div className="flex-1 max-w-xs">
                      <Input 
                        placeholder="Schütze suchen..." 
                        value={shooterSearchTerm}
                        onChange={(e) => setShooterSearchTerm(e.target.value)}
                        className="text-sm"
                      />
                    </div>
                  )}
                </div>
              </div>
          )}
          {!loadingData && !error && !selectedIndividualLeagueFilter && (
            <Card className="shadow-lg border-blue-200">
              <CardHeader>
                <CardTitle className="text-blue-800 dark:text-blue-200 flex items-center">
                  <User className="mr-2 h-5 w-5" />
                  Liga-Auswahl erforderlich
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center py-12 p-6">
                <div className="text-6xl mb-4">🎯</div>
                <p className="text-lg text-blue-700 dark:text-blue-300 mb-4">
                  Bitte wählen Sie oben eine Liga aus, um die Einzelrangliste anzuzeigen.
                </p>
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  Dies verhindert die Vermischung verschiedener Disziplinen in der Rangliste.
                </p>
              </CardContent>
            </Card>
          )}
          {!loadingData && !error && selectedIndividualLeagueFilter && filteredIndividualData.length === 0 && (
            <Card className="shadow-lg"><CardHeader><CardTitle className="text-accent">Keine Einzelschützen für {selectedCompetition?.displayName || pageTitle} {selectedIndividualLeagueFilter && availableLeaguesForIndividualFilter.find(l => l.id === selectedIndividualLeagueFilter) ? `(Liga: ${availableLeaguesForIndividualFilter.find(l => l.id === selectedIndividualLeagueFilter)?.name})` : ''}</CardTitle></CardHeader><CardContent className="text-center py-12 p-6"><AlertTriangle className="mx-auto h-10 w-10 mb-3 text-primary/70" /><p className="text-lg text-muted-foreground">Für die ausgewählte Liga wurden keine Einzelschützenergebnisse gefunden.</p></CardContent></Card>
          )}
          {!loadingData && !error && selectedIndividualLeagueFilter && filteredIndividualData.length > 0 && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {topMaleShooter && (<Card className="shadow-lg border-amber-200 dark:border-amber-800 bg-gradient-to-br from-amber-50 to-transparent dark:from-amber-900/15"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-lg font-medium text-amber-700 dark:text-amber-300 flex items-center gap-2"><Trophy className="h-5 w-5 text-amber-500" />Bester Schütze</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold text-foreground">{topMaleShooter.shooterName}</p><p className="text-sm text-muted-foreground">{topMaleShooter.teamName}</p><p className="text-lg text-foreground">Gesamt: <span className="font-semibold">{topMaleShooter.totalScore}</span> Ringe</p><p className="text-sm text-muted-foreground">Schnitt: {topMaleShooter.averageScore != null ? topMaleShooter.averageScore.toFixed(2) : '-'} ({topMaleShooter.roundsShot} DG)</p></CardContent></Card>)}
                {topFemaleShooter && (<Card className="shadow-lg border-pink-200 dark:border-pink-800 bg-gradient-to-br from-pink-50 to-transparent dark:from-pink-900/15"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-lg font-medium text-pink-700 dark:text-pink-300 flex items-center gap-2"><Medal className="h-5 w-5 text-pink-500" />Beste Dame</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold text-foreground">{topFemaleShooter.shooterName}</p><p className="text-sm text-muted-foreground">{topFemaleShooter.teamName}</p><p className="text-lg text-foreground">Gesamt: <span className="font-semibold">{topFemaleShooter.totalScore}</span> Ringe</p><p className="text-sm text-muted-foreground">Schnitt: {topFemaleShooter.averageScore != null ? topFemaleShooter.averageScore.toFixed(2) : '-'} ({topFemaleShooter.roundsShot} DG)</p></CardContent></Card>)}
                {(!topMaleShooter && !loadingData) && (<Card className="shadow-lg"><CardHeader><CardTitle className="text-accent">Kein Bester Schütze</CardTitle></CardHeader><CardContent><p className="text-muted-foreground">Für die aktuelle Auswahl konnte kein bester Schütze ermittelt werden.</p></CardContent></Card>)}
                {!topFemaleShooter && !loadingData && (<Card className="shadow-lg"><CardHeader><CardTitle className="text-accent">Keine Beste Dame</CardTitle></CardHeader><CardContent><p className="text-muted-foreground">Für die aktuelle Auswahl konnte keine beste Dame ermittelt werden.</p></CardContent></Card>)}
              </div>
              <Card className="shadow-lg">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-xl text-accent">Einzelrangliste {selectedIndividualLeagueFilter === 'KK_GEWEHR_EHRUNGEN' ? '(🏆 Alle KK Gewehr Auflage)' : selectedIndividualLeagueFilter === 'LGA_GESAMTLISTE' ? '(🏆 Alle Luftdruck Auflage)' : selectedIndividualLeagueFilter && availableLeaguesForIndividualFilter.find(l => l.id === selectedIndividualLeagueFilter) ? `(Liga: ${availableLeaguesForIndividualFilter.find(l => l.id === selectedIndividualLeagueFilter)?.name})` : '(Alle Ligen der Disziplin)'}</CardTitle>
                      <CardDescription>Alle Schützen sortiert nach Gesamtergebnis für {pageTitle}.</CardDescription>
                    </div>
                    {/* PDF Button für Gesamtlisten */}
                    {(selectedIndividualLeagueFilter === 'LGA_GESAMTLISTE' || selectedIndividualLeagueFilter === 'KK_GEWEHR_EHRUNGEN') && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-xs px-3 py-2 bg-background !text-foreground hover:!text-foreground border-primary/40 hover:bg-muted"
                        onClick={() => downloadGesamtlistePDF(
                          {
                            id: selectedIndividualLeagueFilter,
                            name: selectedIndividualLeagueFilter === 'LGA_GESAMTLISTE' ? 'Alle Luftdruck Auflage' : 'Alle KK Gewehr Auflage',
                            type: selectedIndividualLeagueFilter === 'LGA_GESAMTLISTE' ? 'LGA' : 'KKG',
                            competitionYear: selectedCompetition.year,
                            individualLeagueShooters: filteredIndividualData.filter(shooter => showOutOfCompetitionShooters || !shooter.teamOutOfCompetition)
                          } as unknown as LeagueDisplay,
                          selectedCompetition,
                          currentNumRoundsState,
                          toast
                        )}
                      >
                        <FileDown className="mr-2 h-4 w-4" />
                        Gesamtliste als PDF
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {useMobileCards ? (
                    <MobileShooterCards
                      shooters={filteredIndividualData
                        .filter(shooter => showOutOfCompetitionShooters || !shooter.teamOutOfCompetition)
                        .filter(shooter => 
                          !shooterSearchTerm || 
                          shooter.shooterName.toLowerCase().includes(shooterSearchTerm.toLowerCase()) ||
                          shooter.teamName.toLowerCase().includes(shooterSearchTerm.toLowerCase())
                        )}
                      numRounds={currentNumRoundsState}
                      onShooterClick={handleShooterNameClick}
                    />
                  ) : (
                    <div className={needsSpecialTouch ? "overflow-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200" : "overflow-x-auto"} style={needsSpecialTouch ? { 
                      touchAction: 'manipulation', 
                      maxHeight: '70vh',
                      WebkitOverflowScrolling: 'touch',
                      transform: 'translateZ(0)',
                      overflow: 'auto',
                      WebkitTransform: 'translateZ(0)',
                      willChange: 'scroll-position'
                    } : { touchAction: 'pan-x pan-y', overflowX: 'scroll' }}>
                      <Table className="responsive-card-table" style={{ 
                        touchAction: 'auto',
                        transform: 'translateZ(0)'
                      }}>
                      <TableHeader className="pwa-table-header"><TableRow className="bg-muted/50">
                          <TableHead className="w-[40px] text-center">#</TableHead><TableHead>Name</TableHead><TableHead>Mannschaft</TableHead>
                          {[...Array(currentNumRoundsState)].map((_, i) => (<TableHead key={`ind-dg-header-${i + 1}`} className="px-1 py-1.5 text-center text-xs text-muted-foreground font-normal">DG {i + 1}</TableHead>))}
                          <TableHead className="text-center font-semibold px-1 py-1.5 text-xs text-muted-foreground whitespace-nowrap">Gesamt</TableHead><TableHead className="text-center font-semibold px-1 py-1.5 text-xs text-muted-foreground whitespace-nowrap">Schnitt</TableHead>
                      </TableRow></TableHeader>
                      <TableBody>
                        {filteredIndividualData
                          .filter(shooter => showOutOfCompetitionShooters || !shooter.teamOutOfCompetition)
                          .filter(shooter => 
                            !shooterSearchTerm || 
                            shooter.shooterName.toLowerCase().includes(shooterSearchTerm.toLowerCase()) ||
                            shooter.teamName.toLowerCase().includes(shooterSearchTerm.toLowerCase())
                          )
                          .map(shooter => (
                          <TableRow key={`ind-${shooter.shooterId}`} className="hover:bg-secondary/20 transition-colors">
                            <TableCell className="text-center font-medium" data-label="Rang">
                              {shooter.teamOutOfCompetition ? 
                                <span className="text-amber-500 dark:text-amber-400" title="Außer Konkurrenz">AK</span> : 
                                <span className="text-foreground dark:text-foreground">{shooter.rank}</span>
                              }
                            </TableCell>
                            <TableCell className="text-foreground" data-label="Name">
                              <div className="flex items-center gap-2">
                                <Button variant="link" className="p-0 h-auto text-sm text-left hover:text-primary whitespace-normal text-wrap font-normal" onClick={() => handleShooterNameClick(shooter)}>
                                  {shooter.shooterName}
                                </Button>
                                <span title="Klicken Sie auf den Namen für Statistik-Diagramm"><LineChartIcon className="h-3 w-3 text-muted-foreground" /></span>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground" data-label="Mannschaft">
                              {shooter.teamName}
                              {shooter.teamOutOfCompetition && (
                                <span 
                                  className="ml-2 text-xs bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-medium cursor-help"
                                  title={shooter.teamOutOfCompetitionReason || 'Außer Konkurrenz'}
                                  aria-label={`Außer Konkurrenz: ${shooter.teamOutOfCompetitionReason || 'Keine Begründung angegeben'}`}
                                >
                                  AK
                                </span>
                              )}
                            </TableCell>
                            {[...Array(currentNumRoundsState)].map((_, i) => (<TableCell key={`ind-dg-val-${i + 1}-${shooter.shooterId}`} className="text-center px-1 py-2" data-label={`DG ${i + 1}`}>{shooter.results?.[`dg${i + 1}`] ?? '-'}</TableCell>))}
                            <TableCell className="text-center font-semibold text-primary" data-label="Gesamt">{shooter.totalScore}</TableCell>
                            <TableCell className="text-center font-medium text-muted-foreground" data-label="Schnitt">
                              {(() => {
                                // Prüfe ob Schütze ersetzt wurde (nur echte Ersetzungen, nicht fehlende Ergebnisse)
                                const isReplacedShooter = shooter.isReplacedShooter;
                                
                                // Für ersetzte Schützen: Zeige Gesamt statt Durchschnitt
                                if (isReplacedShooter) {
                                  return <span className="text-orange-600 font-medium" title="Ersetzt - Gesamtwertung">{shooter.totalScore}</span>;
                                }
                                
                                // Normale Durchschnittswertung
                                return shooter.averageScore != null ? shooter.averageScore.toFixed(2) : '-';
                              })()
                            }
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={isShooterDetailModalOpen} onOpenChange={setIsShooterDetailModalOpen}>
        <DialogContent className="sm:max-w-2xl"> {/* Increased width for better chart display */}
          {selectedShooterForDetail && <ShooterDetailModalContent shooterData={selectedShooterForDetail} numRounds={currentNumRoundsState} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function RwkTabellenPage() {
  return (
    <Suspense fallback={<RwkTabellenPageLoadingSkeleton title="RWK Tabellen laden..." />}>
      <RwkTabellenPageComponent />
    </Suspense>
  );
}
