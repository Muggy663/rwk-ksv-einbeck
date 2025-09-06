// src/components/ui/responsive-dialog.tsx
"use client";

import React, { ReactNode } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, ChevronLeft } from 'lucide-react';
import { useMobileDetection } from '@/hooks/use-mobile-detection';
import { cn } from '@/lib/utils';

interface ResponsiveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export function ResponsiveDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  className
}: ResponsiveDialogProps) {
  const { isMobile, isTablet } = useMobileDetection();

  if (isMobile) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent 
          className={cn(
            "fixed inset-0 z-50 bg-background",
            "pt-safe-area-top pb-safe-area-bottom",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
            "duration-300 ease-out",
            "flex flex-col h-screen overflow-hidden",
            className
          )}
          hideCloseButton
        >
          {/* Mobile Header */}
          <div className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur-sm shrink-0 z-10">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-9 w-9"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1 text-center">
              <h2 className="text-lg font-semibold truncate">{title}</h2>
              {description && (
                <p className="text-sm text-muted-foreground truncate">{description}</p>
              )}
            </div>
            <div className="w-9" /> {/* Spacer for centering */}
          </div>

          {/* Mobile Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {children}
          </div>

          {/* Mobile Footer */}
          {footer && (
            <div className="border-t bg-background/95 backdrop-blur-sm p-4 sticky bottom-0">
              {footer}
            </div>
          )}
        </DialogContent>
      </Dialog>
    );
  }

  if (isTablet) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent 
          className={cn(
            "max-w-2xl max-h-[85vh] flex flex-col",
            className
          )}
        >
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto pr-2">
            {children}
          </div>
          
          {footer && (
            <div className="border-t pt-4 mt-4">
              {footer}
            </div>
          )}
        </DialogContent>
      </Dialog>
    );
  }

  // Desktop
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn("max-w-4xl max-h-[90vh] flex flex-col", className)}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto pr-2">
          {children}
        </div>
        
        {footer && (
          <div className="border-t pt-6 mt-6">
            {footer}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}