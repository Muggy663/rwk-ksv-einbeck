// src/components/ui/android-button.tsx
"use client";

import React, { forwardRef } from 'react';
import { Button, ButtonProps } from './button';
import { useMobileDetection } from '@/hooks/use-mobile-detection';
import { cn } from '@/lib/utils';

interface AndroidButtonProps extends ButtonProps {
  touchOptimized?: boolean;
  ripple?: boolean;
}

export const AndroidButton = forwardRef<HTMLButtonElement, AndroidButtonProps>(
  ({ className, touchOptimized = true, ripple = true, children, ...props }, ref) => {
    const { isMobile, isAndroid } = useMobileDetection();

    const androidClasses = isMobile ? {
      // Touch-optimierte Größen
      base: touchOptimized ? 'min-h-[48px] min-w-[48px] px-4 py-3 text-base' : '',
      // Ripple-Effekt
      ripple: ripple ? 'ripple' : '',
      // Android-spezifische Styles
      android: isAndroid ? 'touch-manipulation select-none' : '',
    } : {};

    return (
      <Button
        ref={ref}
        className={cn(
          androidClasses.base,
          androidClasses.ripple,
          androidClasses.android,
          className
        )}
        {...props}
      >
        {children}
      </Button>
    );
  }
);

AndroidButton.displayName = "AndroidButton";