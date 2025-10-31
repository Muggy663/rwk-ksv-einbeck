"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight, LineChart as LineChartIcon } from 'lucide-react';
import { TeamStatusBadge } from '@/components/ui/team-status-badge';
import { SubstitutionBadge } from '@/components/ui/substitution-badge';
import { cn } from '@/lib/utils';

interface MobileTeamCardsProps {
  teams: any[];
  numRounds: number;
  onShooterClick: (shooterData: any) => void;
  teamSubstitutions: Map<string, any>;
  expandedTeams: string[];
  onToggleTeam: (teamId: string) => void;
  loadingTeams: Set<string>;
  onLoadTeamShooters: (teamId: string, teamData: any, numRounds: number) => void;
}

export const MobileTeamCards: React.FC<MobileTeamCardsProps> = ({
  teams,
  numRounds,
  onShooterClick,
  teamSubstitutions,
  expandedTeams,
  onToggleTeam,
  loadingTeams,
  onLoadTeamShooters
}) => {
  return (
    <div className="space-y-4">
      {teams.map((team) => (
        <Card key={team.id} className="">
          <CardHeader 
            className="cursor-pointer hover:bg-muted/50 transition-colors pb-3"
            onClick={() => {
              onToggleTeam(team.id);
              if (!expandedTeams.includes(team.id)) {
                onLoadTeamShooters(team.id, team, numRounds);
              }
            }}
          >
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm">
                  {team.outOfCompetition ? 'AK' : team.rank}
                </div>
                <div>
                  <div className="font-semibold text-foreground">{team.name}</div>
                  <div className="text-sm text-muted-foreground">{team.clubName}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <div className="font-bold text-primary">{team.totalScore || 0}</div>
                  <div className="text-xs text-muted-foreground">
                    {team.averageScore ? team.averageScore.toFixed(1) : '-'}
                  </div>
                </div>
                {expandedTeams.includes(team.id) ? 
                  <ChevronDown className="h-5 w-5 text-muted-foreground" /> : 
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                }
              </div>
            </CardTitle>
            <div className="flex items-center gap-2 mt-2">
              <TeamStatusBadge 
                outOfCompetition={team.outOfCompetition} 
                reason={team.outOfCompetitionReason} 
              />
              <div className="flex gap-1">
                {[...Array(numRounds)].map((_, i) => (
                  <div key={i} className="text-xs bg-muted px-2 py-1 rounded">
                    DG{i+1}: {team.roundResults?.[`dg${i + 1}`] ?? '-'}
                  </div>
                ))}
              </div>
            </div>
          </CardHeader>
          
          {expandedTeams.includes(team.id) && (
            <CardContent className="pt-0">
              {loadingTeams.has(team.id) ? (
                <div className="text-center py-4 text-muted-foreground">
                  Lade Schützen...
                </div>
              ) : (
                <div className="space-y-3">
                  {team.shootersResults?.map((shooter: any) => (
                    <div key={shooter.shooterId} className="border rounded-lg p-3 bg-muted/20">
                      <div className="flex items-center justify-between mb-2">
                        <Button
                          variant="link"
                          className="p-0 h-auto text-left font-semibold text-foreground hover:text-primary"
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
                        <LineChartIcon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      
                      <SubstitutionBadge
                        isSubstitute={teamSubstitutions.has(`${team.id}-${shooter.shooterId}`)}
                        substitutionInfo={teamSubstitutions.get(`${team.id}-${shooter.shooterId}`)}
                      />
                      
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {[...Array(numRounds)].map((_, i) => (
                          <div key={i} className="flex justify-between text-sm">
                            <span className="text-muted-foreground">DG {i + 1}:</span>
                            <span className="font-mono">
                              {shooter.results?.[`dg${i + 1}`] !== null ? 
                                shooter.results?.[`dg${i + 1}`] : 
                                <span className="text-muted-foreground">-</span>
                              }
                            </span>
                          </div>
                        ))}
                        <div className="col-span-2 flex justify-between text-sm font-semibold border-t pt-2 mt-1">
                          <span className="text-primary">Gesamt:</span>
                          <span className="text-primary">{shooter.total ?? '-'}</span>
                        </div>
                      </div>
                    </div>
                  )) || (
                    <div className="text-center py-4 text-muted-foreground">
                      Keine Schützen-Daten verfügbar
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );
};