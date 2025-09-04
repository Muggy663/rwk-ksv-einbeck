// src/components/ui/pull-to-refresh.tsx
"use client";

import React, { ReactNode } from 'react';
import { usePullToRefresh } from '@/hooks/use-pull-to-refresh';
import { Loader2, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PullToRefreshProps {
  onRefresh: () => Promise<void> | void;
  children: ReactNode;
  className?: string;
  threshold?: number;
  disabled?: boolean;
}

export function PullToRefresh({
  onRefresh,
  children,
  className,
  threshold = 80,
  disabled = false
}: PullToRefreshProps) {
  const {
    isRefreshing,
    isPulling,
    pullDistance,
    containerRef,
    shouldShowIndicator
  } = usePullToRefresh({
    onRefresh,
    threshold,
    enabled: !disabled
  });

  const progress = Math.min(pullDistance / threshold, 1);
  const rotation = progress * 180;

  return (
    <div 
      ref={containerRef}
      className={cn("relative overflow-auto", className)}
      style={{ 
        transform: isPulling ? `translateY(${Math.min(pullDistance * 0.5, 40)}px)` : 'translateY(0)',
        transition: isPulling ? 'none' : 'transform 0.3s ease'
      }}
    >
      {/* Pull-to-Refresh Indikator */}
      {shouldShowIndicator && (
        <div 
          className="absolute top-0 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-200"
          style={{
            transform: `translateX(-50%) translateY(${isPulling ? Math.min(pullDistance * 0.3, 30) : 0}px)`,
            opacity: isPulling || isRefreshing ? 1 : 0
          }}
        >
          <div className="bg-background border border-border rounded-full p-3 shadow-lg">
            {isRefreshing ? (
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            ) : (
              <RotateCcw 
                className="h-5 w-5 text-primary transition-transform duration-200" 
                style={{ 
                  transform: `rotate(${rotation}deg)`,
                  color: progress >= 1 ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))'
                }}
              />
            )}
          </div>
          
          {/* Progress Ring */}
          <svg 
            className="absolute inset-0 w-full h-full -rotate-90" 
            viewBox="0 0 50 50"
          >
            <circle
              cx="25"
              cy="25"
              r="20"
              fill="none"
              stroke="hsl(var(--border))"
              strokeWidth="2"
            />
            <circle
              cx="25"
              cy="25"
              r="20"
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="2"
              strokeDasharray={`${2 * Math.PI * 20}`}
              strokeDashoffset={`${2 * Math.PI * 20 * (1 - progress)}`}
              className="transition-all duration-200"
            />
          </svg>
        </div>
      )}

      {/* Content */}
      <div className={cn(
        "transition-all duration-200",
        isPulling && "transform-gpu"
      )}>
        {children}
      </div>
    </div>
  );
}