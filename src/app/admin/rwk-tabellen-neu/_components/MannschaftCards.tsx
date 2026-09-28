"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight, LineChart as LineChartIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TeamStatusBadge } from '@/components/ui/team-status-badge';
import { SubstitutionBadge } from '@/components/ui/substitution-badge';
import { getRwkZone, type Prognose } from '../_lib/rwk-zones';

interface MannschaftCardsProps {
  teams: any[];
  numRounds: number;
  onShooterClick: (shooterData: any) => void;
  teamSubstitutions: Map<string, any>;
  expandedTeams: string[];
  onToggleTeam: (teamId: string) => void;
  loadingTeams: Set<string>;
  onLoadTeamShooters: (teamId: string, teamData: any, numRounds: number) => void;
  leagueCompleteRound?: number;
  wertbareTeams: number;
  getPrognose?: (team: any) => Prognose;
}

/**
 * Moderne, aufgewertete Mannschafts-Karten für schmale Bildschirme (Vorschau).
 * Nutzt die Auf-/Abstiegs-Zonen-Farben, ein Rang-Badge und ein aufgeräumtes Layout.
 */
export const MannschaftCards: React.FC<MannschaftCardsProps> = ({
  teams,
  numRounds,
  onShooterClick,
  teamSubstitutions,
  expandedTeams,
  onToggleTeam,
  loadingTeams,
  onLoadTeamShooters,
  leagueCompleteRound = 0,
  wertbareTeams,
  getPrognose,
}) => {
  return (
    <div className="space-y-3">
      {teams.map((team) => {
        const zone = team.outOfCompetition || team.istEinzelwertung ? null : getRwkZone(team.rank, wertbareTeams);
        const isOpen = expandedTeams.includes(team.id);

        // Wertungs-Score bis zum liga-weit vollständigen Durchgang
        let leagueScore = 0;
        for (let r = 1; r <= leagueCompleteRound; r++) {
          const score = team.roundResults?.[`dg${r}`];
          if (score !== null && score !== undefined) leagueScore += score;
        }
        const showBoth = leagueScore !== team.totalScore;

        return (
          <div
            key={team.id}
            className={cn(
              "rounded-xl border overflow-hidden shadow-sm transition-colors",
              !zone && "bg-card border-border",
              zone === 'gold' && "bg-amber-50 dark:bg-amber-900/15 border-amber-300 dark:border-amber-700",
              zone === 'silber' && "bg-slate-50 dark:bg-slate-800/40 border-slate-300 dark:border-slate-600",
              zone === 'kampf' && "bg-orange-50 dark:bg-orange-900/15 border-orange-300 dark:border-orange-700",
              zone === 'abstieg' && "bg-red-50 dark:bg-red-900/15 border-red-300 dark:border-red-700"
            )}
          >
            <button
              type="button"
              className="w-full flex items-center gap-3 p-3 text-left"
              onClick={() => {
                onToggleTeam(team.id);
                if (!isOpen) onLoadTeamShooters(team.id, team, numRounds);
              }}
            >
              {/* Rang-Badge */}
              <div
                className={cn(
                  "flex items-center justify-center w-9 h-9 rounded-full font-bold text-sm shrink-0",
                  team.outOfCompetition && "bg-amber-200 text-amber-800 dark:bg-amber-500/30 dark:text-amber-200",
                  team.istEinzelwertung && "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
                  zone === 'gold' && "bg-amber-200 text-amber-800 dark:bg-amber-500/30 dark:text-amber-200",
                  zone === 'silber' && "bg-slate-300 text-slate-800 dark:bg-slate-500/40 dark:text-slate-100",
                  zone === 'kampf' && "bg-orange-200 text-orange-800 dark:bg-orange-500/30 dark:text-orange-200",
                  zone === 'abstieg' && "bg-red-200 text-red-800 dark:bg-red-500/30 dark:text-red-200",
                  !zone && !team.outOfCompetition && !team.istEinzelwertung && "bg-muted text-foreground"
                )}
              >
                {team.outOfCompetition ? 'AK' : team.istEinzelwertung ? '—' : team.rank}
              </div>

              {/* Name + Verein */}
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-foreground truncate">{team.name}</div>
                <div className="text-xs text-muted-foreground truncate">{team.clubName}</div>
                <div className="flex flex-wrap items-center gap-1.5 mt-1">
                  <TeamStatusBadge outOfCompetition={team.outOfCompetition} reason={team.outOfCompetitionReason} />
                  {team.istEinzelwertung && (
                    <span className="text-[10px] bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200 px-1.5 py-0.5 rounded font-medium">
                      Einzel (außer Wertung)
                    </span>
                  )}
                </div>
                {(() => {
                  const p = getPrognose?.(team);
                  if (!p || !p.typ) return null;
                  const cls =
                    p.typ === 'aufstieg_moeglich' || p.typ === 'klassenerhalt' ? 'text-green-700 dark:text-green-400' :
                    p.typ === 'abstieg_droht' ? 'text-red-600 dark:text-red-400' :
                    'text-orange-600 dark:text-orange-400';
                  const icon =
                    p.typ === 'aufstieg_moeglich' ? '⬆️' :
                    p.typ === 'aufstieg_fraglich' ? '↗️' :
                    p.typ === 'abstieg_droht' ? '⬇️' : '🛟';
                  return <div className={cn("text-[11px] mt-1 font-medium", cls)}>{icon} {p.text}</div>;
                })()}
              </div>

              {/* Gesamt-Score */}
              <div className="text-right shrink-0">
                <div className="font-bold text-lg text-primary dark:text-foreground leading-tight">{leagueScore}</div>
                {showBoth ? (
                  <div className="text-[10px] text-muted-foreground">({team.totalScore || 0})</div>
                ) : (
                  <div className="text-[10px] text-muted-foreground">Ringe</div>
                )}
              </div>

              {isOpen ? <ChevronDown className="h-5 w-5 text-muted-foreground shrink-0" /> : <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />}
            </button>

            {/* Durchgangs-Chips */}
            <div className="flex flex-wrap gap-1.5 px-3 pb-3">
              {[...Array(numRounds)].map((_, i) => {
                const val = team.roundResults?.[`dg${i + 1}`];
                return (
                  <span
                    key={i}
                    className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-background/70 border border-border text-muted-foreground"
                  >
                    DG{i + 1}: <span className="text-foreground">{val ?? '–'}</span>
                  </span>
                );
              })}
            </div>

            {/* Aufgeklappte Schützen */}
            {isOpen && (
              <div className="border-t border-border/60 bg-background/40 p-3">
                {loadingTeams.has(team.id) ? (
                  <div className="text-center py-3 text-sm text-muted-foreground">Lade Schützen…</div>
                ) : (
                  <div className="space-y-2">
                    {team.shootersResults?.map((shooter: any) => (
                      <div key={shooter.shooterId} className="rounded-lg border border-border/60 bg-card p-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <Button
                            variant="link"
                            className="p-0 h-auto text-left font-medium text-primary dark:text-foreground hover:text-primary dark:hover:text-primary text-sm"
                            onClick={() => onShooterClick({
                              shooterId: shooter.shooterId,
                              shooterName: shooter.shooterName,
                              shooterGender: shooter.shooterGender,
                              teamName: team.name,
                              results: shooter.results,
                              totalScore: shooter.total || 0,
                              averageScore: shooter.average,
                              roundsShot: shooter.roundsShot,
                              leagueId: team.leagueId,
                              leagueType: team.leagueType,
                              competitionYear: team.competitionYear,
                              teamOutOfCompetition: team.outOfCompetition || false,
                              teamOutOfCompetitionReason: team.outOfCompetitionReason,
                            })}
                          >
                            {shooter.shooterName}
                          </Button>
                          <LineChartIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                        </div>
                        <SubstitutionBadge
                          isSubstitute={teamSubstitutions.has(`${team.id}-${shooter.shooterId}`)}
                          substitutionInfo={teamSubstitutions.get(`${team.id}-${shooter.shooterId}`)}
                        />
                        <div className="grid grid-cols-2 gap-x-3 gap-y-1 mt-2 text-xs">
                          {[...Array(numRounds)].map((_, i) => (
                            <div key={i} className="flex justify-between">
                              <span className="text-muted-foreground">DG {i + 1}</span>
                              <span className="font-mono">
                                {shooter.results?.[`dg${i + 1}`] !== null ? shooter.results?.[`dg${i + 1}`] : <span className="text-muted-foreground">–</span>}
                              </span>
                            </div>
                          ))}
                          <div className="col-span-2 flex justify-between border-t border-border/60 pt-1 mt-0.5 font-semibold">
                            <span className="text-primary dark:text-foreground">Gesamt</span>
                            <span className="text-primary dark:text-foreground">{shooter.total ?? '–'}</span>
                          </div>
                          <div className="col-span-2 flex justify-between text-muted-foreground">
                            <span>Schnitt</span>
                            <span>{shooter.average != null ? shooter.average.toFixed(2) : '–'}</span>
                          </div>
                        </div>
                      </div>
                    )) || (
                      <div className="text-center py-3 text-sm text-muted-foreground">Keine Schützen-Daten verfügbar</div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
