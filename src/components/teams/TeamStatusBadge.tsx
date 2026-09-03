import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface TeamStatusBadgeProps {
  outOfCompetition?: boolean;
  reason?: string;
  className?: string;
}

export function TeamStatusBadge({ outOfCompetition, reason, className = '' }: TeamStatusBadgeProps) {
  if (!outOfCompetition) {
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
            {reason || 'Außer Konkurrenz'}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
