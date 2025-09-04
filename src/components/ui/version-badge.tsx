import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface VersionBadgeProps {
  variant?: "outline" | "default";
  className?: string;
  children: React.ReactNode;
}

export const VersionBadge = ({ variant = "outline", className, children }: VersionBadgeProps) => (
  <Badge variant={variant} className={cn("text-xs py-1 px-2", className)}>
    {children}
  </Badge>
);

export const LiveBadge = () => (
  <VersionBadge variant="default" className="bg-green-600">
    🌐 Live: rwk-einbeck.de
  </VersionBadge>
);