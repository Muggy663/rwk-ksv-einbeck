// src/components/ui/mobile-page-wrapper.tsx
"use client";

import React, { ReactNode } from 'react';
import { useMobileDetection } from '@/hooks/use-mobile-detection';
import { cn } from '@/lib/utils';

interface MobilePageWrapperProps {
  children: ReactNode;
  className?: string;
  title?: string;
  description?: string;
}

export function MobilePageWrapper({ 
  children, 
  className,
  title,
  description 
}: MobilePageWrapperProps) {
  const { isMobile } = useMobileDetection();

  return (
    <div className={cn(
      "container mx-auto",
      isMobile ? "px-4 py-4" : "px-6 py-8",
      className
    )}>
      {title && (
        <div className={cn(
          "mb-6",
          isMobile ? "mb-4" : "mb-8"
        )}>
          <h1 className={cn(
            "font-bold text-primary",
            isMobile ? "text-2xl" : "text-3xl"
          )}>
            {title}
          </h1>
          {description && (
            <p className={cn(
              "text-muted-foreground mt-2",
              isMobile ? "text-sm" : "text-base"
            )}>
              {description}
            </p>
          )}
        </div>
      )}
      {children}
    </div>
  );
}