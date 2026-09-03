import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface TeamStatusBadgeProps {
  outOfCompetition?: boolean;
  reason?: string;
  className?: string;
  showTooltip?: boolean;
}

/**
 * Eine Komponente, die den "Außer Konkurrenz"-Status eines Teams anzeigt
 */
export function TeamStatusBadge({ 
  outOfCompetition, 
  reason,
  className,
  showTooltip = true
}: TeamStatusBadgeProps) {
  if (!outOfCompetition) return null;
  
  const badge = (
    <span 
      className={cn(
        "text-xs bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100 px-1.5 py-0.5 rounded font-medium",
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
            <p className="text-sm">{reason || 'Außer Konkurrenz'}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  
  return badge;
}
