"use client";

import React, { forwardRef } from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface A11yButtonProps extends ButtonProps {
  ariaLabel?: string;
  tooltipText?: string;
  keyboardShortcut?: string;
}

export const A11yButton = forwardRef<HTMLButtonElement, A11yButtonProps>(
  ({ className, children, ariaLabel, tooltipText, keyboardShortcut, ...props }, ref) => {
    const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
      // Verbesserte Tastaturunterstützung
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        e.currentTarget.click();
      }
    };

    return (
      <Button
        ref={ref}
        className={cn(
          'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
          'transition-all duration-200',
          'aria-disabled:opacity-50 aria-disabled:cursor-not-allowed',
          className
        )}
        aria-label={ariaLabel}
        title={tooltipText || ariaLabel}
        data-keyboard-shortcut={keyboardShortcut}
        onKeyDown={handleKeyDown}
        {...props}
      >
        {children}
        {keyboardShortcut && (
          <span className="sr-only"> (Tastaturkürzel: {keyboardShortcut})</span>
        )}
      </Button>
    );
  }
);