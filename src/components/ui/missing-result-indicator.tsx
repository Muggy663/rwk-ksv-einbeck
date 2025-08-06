import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface MissingResultIndicatorProps {
  shooterName: string;
  teamName: string;
  round: number;
  className?: string;
}

export function MissingResultIndicator({ 
  shooterName, 
  teamName, 
  round, 
  className = '' 
}: MissingResultIndicatorProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`inline-flex items-center gap-1 text-amber-600 ${className}`}>
            <AlertTriangle className="h-3.5 w-3.5" />
            <span className="text-xs font-medium">Fehlendes Ergebnis</span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-sm">
            <strong>{shooterName}</strong> hat kein Ergebnis für Durchgang {round} in Team <strong>{teamName}</strong>.
          </p>
          <p className="text-xs mt-1 text-muted-foreground">
            Dies kann die Gesamtwertung beeinflussen.
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
