/**
 * Optimierte Ansicht für Ligen mit virtualisiertem Scrollen
 */
"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { PDFExportButton } from '@/components/pdf-export-button';
import { VirtualizedTeamTable } from './virtualized-team-table';
import { VirtualizedShooterTable } from './virtualized-shooter-table';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { AriaLive } from '@/components/ui/aria-live';

interface Shooter {
  shooterId: string;
  shooterName: string;
  results: Record<string, number | null>;
  total?: number;
  average?: number;
  [key: string]: any;
}

interface Team {
  id: string;
  name: string;
  rank: number;
  totalScore?: number;
  averageScore?: number;
  roundResults?: Record<string, number | null>;
  outOfCompetition?: boolean;
  outOfCompetitionReason?: string;
  shootersResults: Shooter[];
  leagueType?: string;
  [key: string]: any;
}

interface League {
  id: string;
  name: string;
  shortName?: string;
  teams: Team[];
  individualLeagueShooters: Shooter[];
  [key: string]: any;
}

interface OptimizedLeagueViewProps {
  leagues: League[];
  numRounds?: number;
  competitionYear: number;
  openAccordionItems: string[];
  onAccordionChange: (value: string[]) => void;
  onShooterClick: (shooter: Shooter & { teamName: string; leagueId: string; leagueType?: string; competitionYear: number }) => void;
}

/**
 * Optimierte Ansicht für Ligen mit virtualisiertem Scrollen
 */
export function OptimizedLeagueView({
  leagues = [],
  numRounds = 5,
  competitionYear,
  openAccordionItems = [],
  onAccordionChange,
  onShooterClick,
}: OptimizedLeagueViewProps) {
  const [expandedTeamIds, setExpandedTeamIds] = useState<string[]>([]);
  const [loadingState, setLoadingState] = useState({
    isLoading: false,
    message: ''
  });
  
  // Toggle Team-Expansion
  const toggleTeamExpansion = (teamId: string) => {
    setExpandedTeamIds(prev => 
      prev.includes(teamId) 
        ? prev.filter(id => id !== teamId) 
        : [...prev, teamId]
    );
  };
  
  if (leagues.length === 0) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-accent">Keine Ligen gefunden</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-12 p-6">
          <p className="text-lg text-muted-foreground">
            Für die aktuelle Auswahl wurden keine Ligen gefunden.
          </p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <ErrorBoundary>
      <AriaLive 
        message={loadingState.isLoading ? loadingState.message : ''} 
        politeness="polite"
      />
      
      <Accordion 
        type="multiple" 
        value={openAccordionItems} 
        onValueChange={onAccordionChange} 
        className="w-full space-y-4"
      >
        {leagues.map(league => (
          <AccordionItem 
            value={league.id} 
            key={league.id} 
            className="border bg-card shadow-lg rounded-lg overflow-hidden"
          >
            <AccordionTrigger 
              className="bg-accent/10 hover:bg-accent/20 px-6 py-4 text-xl font-semibold text-accent data-[state=open]:border-b data-[state=open]:border-border/50"
              aria-label={`Liga ${league.name} ${openAccordionItems.includes(league.id) ? 'einklappen' : 'ausklappen'}`}
            >
              {league.name} {league.shortName && `(${league.shortName})`}
            </AccordionTrigger>
            <AccordionContent className="pt-0 data-[state=closed]:pb-0 data-[state=open]:pb-0">
              <div className="flex justify-end space-x-2 p-2 bg-muted/10">
                <PDFExportButton 
                  league={league} 
                  numRounds={numRounds} 
                  competitionYear={competitionYear} 
                  type="teams"
                  className="mr-2"
                />
                {league.individualLeagueShooters.length > 0 && (
                  <PDFExportButton 
                    league={league} 
                    numRounds={numRounds} 
                    competitionYear={competitionYear} 
                    type="shooters"
                  />
                )}
              </div>
              
              {league.teams.length > 0 ? (
                <div className="overflow-x-auto">
                  <VirtualizedTeamTable 
                    teams={league.teams}
                    numRounds={numRounds}
                    expandedTeamIds={expandedTeamIds}
                    onToggleTeam={toggleTeamExpansion}
                  />
                  
                  {expandedTeamIds.map(teamId => {
                    const team = league.teams.find(t => t.id === teamId);
                    if (!team) return null;
                    
                    return (
                      <div key={`team-details-${teamId}`} className="p-0 border-t-0">
                        <VirtualizedShooterTable 
                          shooters={team.shootersResults}
                          numRounds={numRounds}
                          onShooterClick={(shooter) => {
                            const shooterWithContext = {
                              ...shooter,
                              teamName: team.name,
                              leagueId: league.id,
                              leagueType: team.leagueType,
                              competitionYear
                            };
                            onShooterClick(shooterWithContext);
                          }}
                          className="bg-muted/20 rounded-b-md shadow-inner"
                        />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="p-4 text-center text-muted-foreground">
                  Keine Mannschaften in dieser Liga vorhanden.
                </p>
              )}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </ErrorBoundary>
  );
}