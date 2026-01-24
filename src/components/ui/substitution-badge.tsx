// src/components/ui/substitution-badge.tsx
import React from 'react';
import { logError, logWarn, logInfo, logDebug } from '@/lib/utils/secure-logger';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { UserPlus } from 'lucide-react';

interface SubstitutionBadgeProps {
  isSubstitute?: boolean;
  substitutionInfo?: {
    originalShooterName: string;
    replacementShooterName?: string;
    fromRound: number;
    reason?: string;
    type: 'individual_to_team' | 'new_shooter' | 'replaced_shooter';
  };
  className?: string;
}

export function SubstitutionBadge({ 
  isSubstitute, 
  substitutionInfo, 
  className 
}: SubstitutionBadgeProps) {
  if (!isSubstitute || !substitutionInfo) return null;

  // Spezielle Behandlung für ersetzte Schützen
  const isReplacedShooter = substitutionInfo.type === 'replaced_shooter';
  
  const tooltipText = isReplacedShooter 
    ? `Ersetzt ab DG${substitutionInfo.fromRound} durch ${substitutionInfo.replacementShooterName || 'Ersatzschütze'}${
        substitutionInfo.reason ? ` (${substitutionInfo.reason})` : ''
      }`
    : `Ersatzschütze ab DG${substitutionInfo.fromRound} für ${substitutionInfo.originalShooterName}${
        substitutionInfo.reason ? ` (${substitutionInfo.reason})` : ''
      }${
        substitutionInfo.type === 'individual_to_team' ? ' - Ergebnisse übertragen' : ''
      }`;

  const badgeText = isReplacedShooter 
    ? `Ersetzt ab DG${substitutionInfo.fromRound}`
    : `Ersatz ab DG${substitutionInfo.fromRound} für ${substitutionInfo.originalShooterName}`;

  const badgeColor = isReplacedShooter 
    ? "text-xs bg-orange-50 text-orange-700 border-orange-300 hover:bg-orange-100"
    : "text-xs bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100";

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <Badge 
            variant="outline" 
            className={`${badgeColor} cursor-help inline-flex items-center w-fit ${className}`}
          >
            <UserPlus className="h-3 w-3 mr-1" />
            {badgeText}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs max-w-xs">{tooltipText}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
