"use client";

import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { LineChart as LineChartIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNativeApp } from '@/components/ui/native-app-detector';
import { SubstitutionBadge } from '@/components/ui/substitution-badge';
import { hasLaterRoundsButMissingEarlier } from '@/lib/services/missing-results-checker';
import type { ShooterDisplayResults, IndividualShooterDisplayData, TeamDisplay } from '@/types/rwk';

interface TeamShootersTableProps {
  shootersResults: ShooterDisplayResults[];
  numRounds: number;
  parentTeam: TeamDisplay; // Pass the whole parent team for context
  onShooterClick: (shooterData: IndividualShooterDisplayData) => void;
  teamSubstitutions: Map<string, any>;
}

export const TeamShootersTable: React.FC<TeamShootersTableProps> = ({
  shootersResults,
  numRounds,
  parentTeam,
  onShooterClick,
  teamSubstitutions,
}) => {
  const { isNativeApp } = useNativeApp();
  if (!shootersResults || shootersResults.length === 0) {
    return (
      <div className="p-3 text-sm text-center text-muted-foreground bg-muted/30 rounded-b-md">
        Keine Schützen für dieses Team erfasst oder Ergebnisse vorhanden.
      </div>
    );
  }
  return (
    <div className="p-2 bg-muted/20 rounded-b-md shadow-inner overflow-x-auto" style={{ 
      touchAction: "manipulation",
      WebkitOverflowScrolling: "touch",
      transform: "translateZ(0)",
      WebkitTransform: "translateZ(0)",
      overflowX: "scroll",
      overflowY: "hidden",
      willChange: "scroll-position"
    }}>
      <Table className="min-w-full responsive-card-table" style={{ 
        touchAction: "auto",
        transform: "translateZ(0)"
      }}>
        <TableHeader>
          <TableRow className="text-xs border-b-0">
            <TableHead className="pl-3 pr-1 py-1.5 text-muted-foreground font-normal whitespace-nowrap">Schütze</TableHead>
            {[...Array(numRounds)].map((_, i) => (
              <TableHead key={`shooter-dg${i + 1}`} className="px-1 py-1.5 text-center text-xs text-muted-foreground font-normal">DG {i + 1}</TableHead>
            ))}
            <TableHead className="px-1 py-1.5 text-center text-xs font-medium text-muted-foreground whitespace-nowrap">Gesamt</TableHead>
            {!isNativeApp && <TableHead className="pl-1 pr-3 py-1.5 text-center text-xs font-medium text-muted-foreground whitespace-nowrap">Schnitt</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {shootersResults.map(shooterRes => {
            const shooterDataForModal: IndividualShooterDisplayData = {
              shooterId: shooterRes.shooterId,
              shooterName: shooterRes.shooterName,
              shooterGender: shooterRes.shooterGender,
              teamName: parentTeam.name,
              results: shooterRes.results,
              totalScore: shooterRes.total || 0,
              averageScore: shooterRes.average,
              roundsShot: shooterRes.roundsShot,
              // Pass league context for the modal if available/needed
              leagueId: parentTeam.leagueId,
              leagueType: parentTeam.leagueType,
              competitionYear: parentTeam.competitionYear,
              // Pass team competition status
              teamOutOfCompetition: parentTeam.outOfCompetition || false,
              teamOutOfCompetitionReason: parentTeam.outOfCompetitionReason,
            };
            return (
              <TableRow key={`ts-${shooterRes.shooterId}`} className="text-sm border-b-0 hover:bg-background/40">
                <TableCell className="font-medium pl-3 pr-1 py-1.5 whitespace-nowrap" data-label="Schütze">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="link"
                        className={cn(
                          "p-0 text-left text-primary dark:text-foreground hover:text-primary dark:hover:text-primary whitespace-normal text-wrap justify-start font-normal",
                          isNativeApp ? "text-[10px] leading-tight h-4 min-h-4" : "text-xs h-auto"
                        )}
                        onClick={() => onShooterClick(shooterDataForModal)}
                      >
                        {shooterRes.shooterName}
                      </Button>
                      <span title="Klicken Sie auf den Namen für Statistik-Diagramm"><LineChartIcon className="h-3 w-3 text-muted-foreground" /></span>
                      {hasLaterRoundsButMissingEarlier(shooterRes.results, numRounds) && (
                        <span className="bg-amber-100 text-amber-700 text-xs px-1.5 py-0.5 rounded-sm" title="Spätere Durchgänge geschossen, aber frühere fehlen">
                          Lücken
                        </span>
                      )}
                    </div>
                    <div className="flex justify-start">
                      <SubstitutionBadge
                        isSubstitute={teamSubstitutions.has(`${parentTeam.id}-${shooterRes.shooterId}`)}
                        substitutionInfo={teamSubstitutions.get(`${parentTeam.id}-${shooterRes.shooterId}`)}
                      />
                    </div>
                  </div>
                </TableCell>
                {[...Array(numRounds)].map((_, i) => (
                  <TableCell key={`shooter-dg${i + 1}-${shooterRes.shooterId}`} className="px-1 py-1.5 text-center" data-label={`DG ${i + 1}`}>
                    {shooterRes.results?.[`dg${i + 1}`] !== null ? (
                      shooterRes.results?.[`dg${i + 1}`]
                    ) : (
                      // Prüfe, ob ein späterer Durchgang Ergebnisse hat
                      Object.entries(shooterRes.results || {}).some(([key, value]) => 
                        key.startsWith('dg') && 
                        parseInt(key.substring(2)) > (i + 1) && 
                        value !== null
                      ) ? (
                        <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-md font-bold" title="Fehlendes Ergebnis">FEHLT</span>
                      ) : (
                        <span className="text-muted-foreground" title="Durchgang noch nicht begonnen">-</span>
                      )
                    )}
                  </TableCell>
                ))}
                <TableCell className="px-1 py-1.5 text-center font-medium" data-label="Gesamt">{shooterRes.total ?? '-'}</TableCell>
                {!isNativeApp && <TableCell className="pl-1 pr-3 py-1.5 text-center font-medium" data-label="Schnitt">
                  {(() => {
                    // Prüfe ob Schütze ersetzt wurde (hat Substitution-Info)
                    const substitutionInfo = teamSubstitutions.get(`${parentTeam.id}-${shooterRes.shooterId}`);
                    const isReplacedShooter = substitutionInfo && substitutionInfo.type === 'replaced_shooter';
                    
                    // Für ersetzte Schützen: Zeige Gesamt statt Durchschnitt
                    if (isReplacedShooter) {
                      return <span className="text-orange-600 font-medium" title="Ersetzt - Gesamtwertung">{shooterRes.total ?? '-'}</span>;
                    }
                    
                    // Normale Durchschnittswertung
                    return shooterRes.average != null ? shooterRes.average.toFixed(2) : '-';
                  })()
                }
                </TableCell>}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
