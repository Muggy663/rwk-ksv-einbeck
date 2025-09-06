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
    if (!open) return null;
    
    return (
      <>
        {/* Overlay */}
        <div 
          className="fixed inset-0 z-40 bg-black/50" 
          onClick={() => onOpenChange(false)}
        />
        
        {/* Mobile Dialog */}
        <div className={cn(
          "fixed inset-0 z-50 bg-background",
          "flex flex-col overflow-hidden",
          "pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]",
          className
        )}>
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
                <div className="text-xs text-muted-foreground">
                  {description.split('. ').map((part, index) => (
                    <div key={index} className="truncate">{part}{index === 0 ? '' : ''}</div>
                  ))}
                </div>
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
        </div>
      </>
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