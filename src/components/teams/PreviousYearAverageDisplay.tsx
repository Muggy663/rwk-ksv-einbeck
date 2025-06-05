"use client";

import React from 'react';
import { PreviousYearAverage } from '@/components/stats/PreviousYearAverage';
import { HelpTooltip } from '@/components/ui/help-tooltip';
import { InfoIcon } from 'lucide-react';

interface PreviousYearAverageDisplayProps {
  shooterId: string;
  currentYear: number;
  currentAverage?: number | null;
  leagueType?: string;
  className?: string;
  showLabel?: boolean;
}

export function PreviousYearAverageDisplay({
  shooterId,
  currentYear,
  currentAverage,
  leagueType,
  className = '',
  showLabel = true
}: PreviousYearAverageDisplayProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {showLabel && (
        <div className="flex items-center">
          <span className="text-sm text-muted-foreground mr-1">Vorjahr:</span>
          <HelpTooltip content="Durchschnitt des Schützen aus dem Vorjahr in dieser Disziplin">
            <InfoIcon className="h-4 w-4 text-muted-foreground" />
          </HelpTooltip>
        </div>
      )}
      <PreviousYearAverage
        shooterId={shooterId}
        currentYear={currentYear}
        currentAverage={currentAverage}
        leagueType={leagueType}
      />
    </div>
  );
}