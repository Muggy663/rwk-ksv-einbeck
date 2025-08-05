/**
 * Optimierte Ansicht für Einzelschützen mit virtualisiertem Scrollen
 */
"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useVirtualizedData } from '@/hooks/use-virtualized-data';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { AlertTriangle, Trophy, Medal } from 'lucide-react';

interface Shooter {
  shooterId: string;
  shooterName: string;
  teamName: string;
  rank: number;
  totalScore?: number;
  averageScore?: number;
  results: Record<string, number | null>;
  teamOutOfCompetition?: boolean;
  teamOutOfCompetitionReason?: string;
  roundsShot?: number;
  [key: string]: any;
}

interface TopShooters {
  male: Shooter | null;
  female: Shooter | null;
}

interface OptimizedShooterViewProps {
  shooters: Shooter[];
  numRounds?: number;
  topShooters?: TopShooters;
  leagueFilter?: string;
  onShooterClick?: (shooter: Shooter) => void;
}

/**
 * Optimierte Ansicht für Einzelschützen mit virtualisiertem Scrollen
 */
export function OptimizedShooterView({
  shooters = [],
  numRounds = 5,
  topShooters = { male: null, female: null },
  leagueFilter = '',
  onShooterClick,
}: OptimizedShooterViewProps) {
  const {
    containerRef,
    visibleData,
    totalHeight,
    handleScroll,
    startOffset
  } = useVirtualizedData<Shooter>(shooters, {
    itemHeight: 48,
    overscan: 5
  });
  
  // Generiere Spaltenüberschriften für die Durchgänge
  const roundHeaders = Array.from({ length: numRounds }, (_, i) => (
    <TableHead 
      key={`ind-dg-header-${i + 1}`} 
      className="px-1 py-1.5 text-center text-xs text-muted-foreground font-normal"
    >
      DG {i + 1}
    </TableHead>
  ));
  
  if (shooters.length === 0) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-accent">Keine Einzelschützen gefunden</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-12 p-6">
          <AlertTriangle className="mx-auto h-10 w-10 mb-3 text-primary/70" />
          <p className="text-lg text-muted-foreground">
            Für die aktuelle Auswahl wurden keine Einzelschützenergebnisse gefunden.
          </p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <ErrorBoundary>
      <div className="space-y-6">
        {/* Top-Schützen-Karten */}
        <div className="grid md:grid-cols-2 gap-6">
          {topShooters.male && (
            <Card className="shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-medium text-primary">Bester Schütze</CardTitle>
                <Trophy className="h-5 w-5 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {topShooters.male.title && <span className="text-sm text-gray-500">{topShooters.male.title} </span>}
                  <span>{(topShooters.male.firstName || '') + ' ' + (topShooters.male.lastName || topShooters.male.shooterName || '')}</span>
                </div>
                <p className="text-sm text-muted-foreground">{topShooters.male.teamName}</p>
                <p className="text-lg">Gesamt: <span className="font-semibold">{topShooters.male.totalScore}</span> Ringe</p>
                <p className="text-sm">
                  Schnitt: {topShooters.male.averageScore != null ? topShooters.male.averageScore.toFixed(2) : '-'} 
                  ({topShooters.male.roundsShot} DG)
                </p>
              </CardContent>
            </Card>
          )}
          
          {topShooters.female && (
            <Card className="shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-medium text-primary">Beste Dame</CardTitle>
                <Medal className="h-5 w-5 text-pink-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {topShooters.female.title && <span className="text-sm text-gray-500">{topShooters.female.title} </span>}
                  <span>{(topShooters.female.firstName || '') + ' ' + (topShooters.female.lastName || topShooters.female.shooterName || '')}</span>
                </div>
                <p className="text-sm text-muted-foreground">{topShooters.female.teamName}</p>
                <p className="text-lg">Gesamt: <span className="font-semibold">{topShooters.female.totalScore}</span> Ringe</p>
                <p className="text-sm">
                  Schnitt: {topShooters.female.averageScore != null ? topShooters.female.averageScore.toFixed(2) : '-'} 
                  ({topShooters.female.roundsShot} DG)
                </p>
              </CardContent>
            </Card>
          )}
        </div>
        
        {/* Virtualisierte Tabelle */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl text-accent">
              Einzelrangliste {leagueFilter ? `(Liga: ${leagueFilter})` : '(Alle Ligen der Disziplin)'}
            </CardTitle>
            <CardDescription>
              Alle Schützen sortiert nach Gesamtergebnis.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div 
              ref={containerRef}
              className="overflow-x-auto max-h-[600px]"
              onScroll={handleScroll}
              aria-label="Einzelschützen-Rangliste"
            >
              <div style={{ height: totalHeight, position: 'relative' }}>
                <div style={{ position: 'absolute', top: startOffset, width: '100%' }}>
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="w-[40px] text-center">#</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Mannschaft</TableHead>
                        {roundHeaders}
                        <TableHead className="text-center font-semibold px-1 py-1.5 text-xs text-muted-foreground whitespace-nowrap">
                          Gesamt
                        </TableHead>
                        <TableHead className="text-center font-semibold px-1 py-1.5 text-xs text-muted-foreground whitespace-nowrap">
                          Schnitt
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {visibleData.map(shooter => (
                        <TableRow 
                          key={`ind-${shooter.shooterId}`} 
                          className="hover:bg-secondary/20 transition-colors"
                        >
                          <TableCell className="text-center font-medium">
                            {shooter.rank}
                          </TableCell>
                          <TableCell className="font-medium text-foreground">
                            <Button 
                              variant="link" 
                              className="p-0 h-auto text-base text-left hover:text-primary whitespace-normal text-wrap" 
                              onClick={() => onShooterClick && onShooterClick(shooter)}
                            >
                              <div>
                                {shooter.title && <span className="text-xs text-gray-500">{shooter.title} </span>}
                                <span>{(shooter.firstName || '') + ' ' + (shooter.lastName || shooter.shooterName || '')}</span>
                              </div>
                            </Button>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
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
                          
                          {Array.from({ length: numRounds }, (_, i) => (
                            <TableCell 
                              key={`ind-dg-val-${i + 1}-${shooter.shooterId}`} 
                              className="text-center px-1 py-2"
                            >
                              {shooter.results?.[`dg${i + 1}`] ?? '-'}
                            </TableCell>
                          ))}
                          
                          <TableCell className="text-center font-semibold text-primary">
                            {shooter.totalScore}
                          </TableCell>
                          <TableCell className="text-center font-medium text-muted-foreground">
                            {shooter.averageScore != null ? shooter.averageScore.toFixed(2) : '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ErrorBoundary>
  );
}