/**
 * Virtualisierte Tabelle für Schützenergebnisse
 */
"use client";

import React, { UIEvent } from 'react';
import { useVirtualizedData } from '@/hooks/use-virtualized-data';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';

interface Shooter {
  shooterId: string;
  shooterName: string;
  results: Record<string, number | null>;
  total?: number;
  average?: number;
  [key: string]: any;
}

interface VirtualizedShooterTableProps {
  shooters: Shooter[];
  numRounds?: number;
  onShooterClick?: (shooter: Shooter) => void;
  className?: string;
}

/**
 * Virtualisierte Tabelle für Schützenergebnisse
 */
export function VirtualizedShooterTable({
  shooters = [],
  numRounds = 5,
  onShooterClick,
  className = '',
}: VirtualizedShooterTableProps) {
  const {
    containerRef,
    visibleData,
    totalHeight,
    handleScroll,
    startOffset
  } = useVirtualizedData<Shooter>(shooters, {
    itemHeight: 40,
    overscan: 5
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
      className={`overflow-auto max-h-[400px] ${className}`}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ position: 'absolute', top: startOffset, width: '100%' }}>
          <Table>
            <TableHeader>
              <TableRow className="text-xs border-b-0">
                <TableHead className="pl-3 pr-1 py-1.5 text-muted-foreground font-normal whitespace-nowrap">
                  Schütze
                </TableHead>
                {roundHeaders}
                <TableHead className="px-1 py-1.5 text-center text-xs font-medium text-muted-foreground whitespace-nowrap">
                  Gesamt
                </TableHead>
                <TableHead className="pl-1 pr-3 py-1.5 text-center text-xs font-medium text-muted-foreground whitespace-nowrap">
                  Schnitt
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleData.map(shooter => (
                <TableRow 
                  key={`shooter-${shooter.shooterId}`} 
                  className="text-sm border-b-0 hover:bg-background/40"
                >
                  <TableCell className="font-medium pl-3 pr-1 py-1.5 whitespace-nowrap">
                    <Button
                      variant="link"
                      className="p-0 h-auto text-sm text-left hover:text-primary whitespace-normal text-wrap"
                      onClick={() => onShooterClick && onShooterClick(shooter)}
                    >
                      {shooter.shooterName}
                    </Button>
                  </TableCell>
                  
                  {Array.from({ length: numRounds }, (_, i) => (
                    <TableCell 
                      key={`shooter-dg${i + 1}-${shooter.shooterId}`} 
                      className="px-1 py-1.5 text-center"
                    >
                      {shooter.results?.[`dg${i + 1}`] ?? '-'}
                    </TableCell>
                  ))}
                  
                  <TableCell className="px-1 py-1.5 text-center font-medium">
                    {shooter.total ?? '-'}
                  </TableCell>
                  <TableCell className="pl-1 pr-3 py-1.5 text-center font-medium">
                    {shooter.average != null ? shooter.average.toFixed(2) : '-'}
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
