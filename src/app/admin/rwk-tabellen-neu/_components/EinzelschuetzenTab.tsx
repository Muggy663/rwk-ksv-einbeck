"use client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NativeSelect } from "@/components/ui/native-select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MobileShooterCards } from '@/components/ui/mobile-shooter-cards';
import { User, Trophy, Medal, AlertTriangle, LineChart as LineChartIcon, FileDown } from 'lucide-react';
import type { LeagueDisplay } from '@/types/rwk';
import { downloadGesamtlistePDF } from '../_lib/pdf-downloads';
import type { useRwkTabellenData } from '../_hooks/useRwkTabellenData';

type RwkData = ReturnType<typeof useRwkTabellenData>;

export function EinzelschuetzenTab({ data }: { data: RwkData }) {
  const {
    router, needsSpecialTouch,
    selectedCompetition, teamData, filteredIndividualData,
    topMaleShooter, topFemaleShooter,
    selectedIndividualLeagueFilter, setSelectedIndividualLeagueFilter,
    shooterSearchTerm, setShooterSearchTerm,
    showOutOfCompetitionShooters, setShowOutOfCompetitionShooters,
    loadingData, error, currentNumRoundsState, useMobileCards,
    handleShooterNameClick, pageTitle, availableLeaguesForIndividualFilter, toast,
  } = data;
  if (!selectedCompetition) return null;
  return (
    <>
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
    </>
  );
}
