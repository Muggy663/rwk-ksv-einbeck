// src/components/ui/global-responsive-dialog-wrapper.tsx
"use client";

import React, { ReactNode } from 'react';
import { ResponsiveDialog } from './responsive-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './dialog';
import { useMobileDetection } from '@/hooks/use-mobile-detection';

interface GlobalResponsiveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export function GlobalResponsiveDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  className,
  size = 'md'
}: GlobalResponsiveDialogProps) {
  const { isMobile } = useMobileDetection();

  // Auf Mobile immer ResponsiveDialog verwenden
  if (isMobile) {
    return (
      <ResponsiveDialog
        open={open}
        onOpenChange={onOpenChange}
        title={title}
        description={description}
        footer={footer}
        className={className}
      >
        {children}
      </ResponsiveDialog>
    );
  }

  // Desktop: Standard Dialog mit Größen-Varianten
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    full: 'max-w-[95vw]'
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`${sizeClasses[size]} ${className || ''}`}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        
        <div className="space-y-4">
          {children}
        </div>
        
        {footer && (
          <DialogFooter>
            {footer}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}