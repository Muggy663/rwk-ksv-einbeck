/**
 * Virtualisierte Tabelle für Mannschaftsergebnisse
 */
"use client";

import React from 'react';
import { useVirtualizedData } from '@/hooks/use-virtualized-data';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface Team {
  id: string;
  name: string;
  rank: number;
  totalScore?: number;
  averageScore?: number;
  roundResults?: Record<string, number | null>;
  outOfCompetition?: boolean;
  outOfCompetitionReason?: string;
  [key: string]: any;
}

interface VirtualizedTeamTableProps {
  teams: Team[];
  numRounds?: number;
  expandedTeamIds: string[];
  onToggleTeam?: (teamId: string) => void;
  className?: string;
}

/**
 * Virtualisierte Tabelle für Mannschaftsergebnisse
 */
export function VirtualizedTeamTable({
  teams = [],
  numRounds = 5,
  expandedTeamIds = [],
  onToggleTeam,
  className = '',
}: VirtualizedTeamTableProps) {
  const {
    containerRef,
    visibleData,
    totalHeight,
    handleScroll,
    startOffset
  } = useVirtualizedData<Team>(teams, {
    itemHeight: 48,
    overscan: 3
  });
  
  // Generiere Spaltenüberschriften für die Durchgänge
  const roundHeaders = Array.from({ length: numRounds }, (_, i) => (
    <TableHead 
      key={`dg-${i + 1}`} 
      className="px-1 py-1.5 text-center text-xs text-muted-foreground font-normal"
    >
      DG {i + 1}
    </TableHead>
  ));
  
  return (
    <div 
      ref={containerRef}
      className={`overflow-auto max-h-[600px] ${className}`}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ position: 'absolute', top: startOffset, width: '100%' }}>
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[50px] text-center px-2 py-2 text-xs font-medium text-muted-foreground">
                  #
                </TableHead>
                <TableHead className="min-w-[150px] px-2 py-2 text-xs font-medium text-muted-foreground">
                  Mannschaft
                </TableHead>
                {roundHeaders}
                <TableHead className="text-center px-1 py-1.5 text-xs font-medium text-muted-foreground whitespace-nowrap">
                  Gesamt
                </TableHead>
                <TableHead className="text-center px-1 py-1.5 text-xs font-medium text-muted-foreground whitespace-nowrap">
                  Schnitt
                </TableHead>
                <TableHead className="w-[60px] text-right pr-4 px-2 py-2"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleData.map(team => (
                <TableRow 
                  key={`team-${team.id}`} 
                  className="hover:bg-secondary/20 transition-colors cursor-pointer"
                  onClick={() => onToggleTeam && onToggleTeam(team.id)}
                >
                  <TableCell className="text-center font-medium px-2 py-2">
                    {team.rank}
                  </TableCell>
                  <TableCell className="font-medium text-foreground px-2 py-2">
                    {team.name}
                    {team.outOfCompetition && (
                      <span 
                        className="ml-2 text-xs bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-medium cursor-help"
                        title={team.outOfCompetitionReason || 'Außer Konkurrenz'}
                        aria-label={`Außer Konkurrenz: ${team.outOfCompetitionReason || 'Keine Begründung angegeben'}`}
                      >
                        AK
                      </span>
                    )}
                  </TableCell>
                  
                  {Array.from({ length: numRounds }, (_, i) => (
                    <TableCell 
                      key={`team-dg${i + 1}-${team.id}`} 
                      className="text-center px-1 py-2"
                    >
                      {(team.roundResults)?.[`dg${i + 1}`] ?? '-'}
                    </TableCell>
                  ))}
                  
                  <TableCell className="text-center font-semibold text-primary px-2 py-2">
                    {team.totalScore ?? '-'}
                  </TableCell>
                  <TableCell className="text-center font-medium text-muted-foreground px-2 py-2">
                    {team.averageScore != null ? team.averageScore.toFixed(2) : '-'}
                  </TableCell>
                  <TableCell className="text-right pr-4 px-2 py-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleTeam && onToggleTeam(team.id);
                      }} 
                      aria-label={`Details für ${team.name} ${expandedTeamIds.includes(team.id) ? 'ausblenden' : 'anzeigen'}`} 
                      className="hover:bg-accent/20 rounded-md"
                    >
                      {expandedTeamIds.includes(team.id) ? (
                        <ChevronDown className="h-5 w-5 transition-transform duration-200 rotate-180" />
                      ) : (
                        <ChevronRight className="h-5 w-5 transition-transform duration-200" />
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}