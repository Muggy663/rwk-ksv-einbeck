import React from 'react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface TeamStatusBadgeProps {
  outOfCompetition?: boolean;
  className?: string;
  showTooltip?: boolean;
}

/**
 * Eine Komponente, die den "Außer Konkurrenz"-Status eines Teams anzeigt
 */
export function TeamStatusBadge({ 
  outOfCompetition, 
  className,
  showTooltip = true
}: TeamStatusBadgeProps) {
  if (!outOfCompetition) return null;
  
  const badge = (
    <span 
      className={cn(
        "text-xs bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-medium",
        className
      )}
    >
      AK
    </span>
  );
  
  if (showTooltip && outOfCompetition) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {badge}
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-sm">Außer Konkurrenz</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  
  return badge;
}
