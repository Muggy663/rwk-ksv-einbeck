// src/components/ui/substitution-badge.tsx
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { UserPlus } from 'lucide-react';

interface SubstitutionBadgeProps {
  isSubstitute?: boolean;
  substitutionInfo?: {
    originalShooterName: string;
    fromRound: number;
    reason?: string;
    type: 'individual_to_team' | 'new_shooter';
  };
  className?: string;
}

export function SubstitutionBadge({ 
  isSubstitute, 
  substitutionInfo, 
  className 
}: SubstitutionBadgeProps) {
  if (!isSubstitute || !substitutionInfo) return null;

  const tooltipText = `Ersatzschütze ab DG${substitutionInfo.fromRound} für ${substitutionInfo.originalShooterName}${
    substitutionInfo.reason ? ` (${substitutionInfo.reason})` : ''
  }${
    substitutionInfo.type === 'individual_to_team' ? ' - Ergebnisse übertragen' : ''
  }`;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant="outline" 
            className={`text-xs bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100 cursor-help ${className}`}
          >
            <UserPlus className="h-3 w-3 mr-1" />
            Ersatz ab DG{substitutionInfo.fromRound}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs max-w-xs">{tooltipText}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}