// src/components/ui/mobile-form-wrapper.tsx
"use client";

import React, { ReactNode } from 'react';
import { Button } from './button';
import { useMobileDetection } from '@/hooks/use-mobile-detection';
import { cn } from '@/lib/utils';

interface MobileFormWrapperProps {
  children: ReactNode;
  onSubmit?: (e: React.FormEvent) => void;
  submitText?: string;
  cancelText?: string;
  onCancel?: () => void;
  isSubmitting?: boolean;
  className?: string;
  formId?: string;
}

export function MobileFormWrapper({
  children,
  onSubmit,
  submitText = "Speichern",
  cancelText = "Abbrechen", 
  onCancel,
  isSubmitting = false,
  className,
  formId
}: MobileFormWrapperProps) {
  const { isMobile } = useMobileDetection();

  if (isMobile) {
    return (
      <div className="flex flex-col h-full">
        <form 
          id={formId}
          onSubmit={onSubmit} 
          className={cn("flex-1 overflow-y-auto", className)}
        >
          {children}
        </form>
        
        {(onSubmit || onCancel) && (
          <div className="border-t bg-background p-4 pb-safe sticky bottom-0">
            <div className="flex gap-2">
              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  {cancelText}
                </Button>
              )}
              {onSubmit && (
                <Button
                  type="submit"
                  form={formId}
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  {submitText}
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Desktop: Standard Form
  return (
    <form onSubmit={onSubmit} className={className} id={formId}>
      {children}
    </form>
  );
}