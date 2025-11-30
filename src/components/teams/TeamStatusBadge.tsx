import React from 'react';
import { logError, logWarn, logInfo, logDebug } from '@/lib/utils/secure-logger';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { TeamCompetitionStatus } from '@/types/rwk';

interface TeamStatusBadgeProps {
  status: TeamCompetitionStatus;
  className?: string;
}

export function TeamStatusBadge({ status, className = '' }: TeamStatusBadgeProps) {
  if (!status.outOfCompetition) {
    return null;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className={`bg-amber-100 text-amber-800 hover:bg-amber-200 ${className}`}>
            AK
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-sm">
            {status.outOfCompetitionReason || 'Außer Konkurrenz'}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
