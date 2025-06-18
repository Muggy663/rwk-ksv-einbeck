"use client";

import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HelpTooltipProps {
  text: string;
  className?: string;
  iconClassName?: string;
}

export function HelpTooltip({ text, className, iconClassName }: HelpTooltipProps) {
  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <button 
            className={cn("inline-flex focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-full", className)} 
            type="button"
            aria-label="Hilfe"
          >
            <HelpCircle className={cn("h-4 w-4 text-muted-foreground", iconClassName)} />
          </button>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <p>{text}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}