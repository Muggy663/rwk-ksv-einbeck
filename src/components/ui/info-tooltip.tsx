// src/components/ui/info-tooltip.tsx
"use client";

import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';

interface InfoTooltipProps {
  content: string;
  children?: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
}

export function InfoTooltip({ content, children, side = 'top' }: InfoTooltipProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {children || (
            <Info className="h-4 w-4 text-muted-foreground hover:text-foreground cursor-help" />
          )}
        </TooltipTrigger>
        <TooltipContent side={side} className="max-w-xs">
          <p className="text-sm">{content}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}