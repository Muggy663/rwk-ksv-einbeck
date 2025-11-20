// src/components/ui/unified-premium-badge.tsx
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Crown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UnifiedPremiumBadgeProps {
  variant?: 'badge' | 'overlay' | 'inline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function UnifiedPremiumBadge({ variant = 'badge', size = 'md', className }: UnifiedPremiumBadgeProps) {
  if (variant === 'overlay') {
    return (
      <div className={cn(
        "absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg backdrop-blur-sm",
        className
      )}>
        <div className="text-center text-white">
          <Crown className="h-8 w-8 mx-auto mb-2 text-yellow-400" />
          <p className="font-semibold">RWK Premium</p>
          <p className="text-sm opacity-90">~3€/Monat</p>
          <p className="text-xs opacity-75">Schießnachweis Cloud-Sync + Social Training</p>
        </div>
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <span className={cn("inline-flex items-center gap-1 text-yellow-600", className)}>
        <Crown className="h-4 w-4" />
        <span className="text-sm font-medium">Premium</span>
      </span>
    );
  }

  return (
    <Badge 
      variant="secondary" 
      className={cn(
        "bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0",
        size === 'sm' && "text-xs px-2 py-0.5",
        size === 'lg' && "text-sm px-3 py-1",
        className
      )}
    >
      <Crown className="h-3 w-3 mr-1" />
Premium
    </Badge>
  );
}