"use client";

import React from 'react';
import { logError, logWarn, logInfo, logDebug } from '@/lib/utils/secure-logger';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, AlertTriangle, Info, CheckCircle } from 'lucide-react';
import type { PlausibilityWarning } from '@/lib/services/plausibility-service';

interface PlausibilityAlertProps {
  warnings: PlausibilityWarning[];
  className?: string;
}

export function PlausibilityAlert({ warnings, className = "" }: PlausibilityAlertProps) {
  if (warnings.length === 0) return null;

  // Sortiere Warnungen nach Schweregrad
  const sortedWarnings = [...warnings].sort((a, b) => {
    const severityOrder = { critical: 0, warning: 1, info: 2 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });

  return (
    <div className={`space-y-2 ${className}`}>
      {sortedWarnings.map((warning, index) => {
        const Icon = warning.severity === 'critical' ? AlertCircle :
                   warning.severity === 'warning' ? AlertTriangle :
                   warning.type === 'info' && warning.title.includes('🎯') ? CheckCircle :
                   Info;

        const alertVariant = warning.severity === 'critical' ? 'destructive' :
                           warning.severity === 'warning' ? 'default' :
                           'default';

        const borderColor = warning.severity === 'critical' ? 'border-red-500' :
                          warning.severity === 'warning' ? 'border-yellow-500' :
                          warning.type === 'info' && warning.title.includes('🎯') ? 'border-green-500' :
                          'border-blue-500';

        const bgColor = warning.severity === 'critical' ? 'bg-red-50 dark:bg-red-900/20' :
                       warning.severity === 'warning' ? 'bg-yellow-50 dark:bg-yellow-900/20' :
                       warning.type === 'info' && warning.title.includes('🎯') ? 'bg-green-50 dark:bg-green-900/20' :
                       'bg-blue-50 dark:bg-blue-900/20';

        return (
          <Alert 
            key={index} 
            variant={alertVariant}
            className={`${borderColor} ${bgColor} border-l-4`}
          >
            <Icon className="h-4 w-4" />
            <AlertTitle className="text-sm font-medium">
              {warning.title}
            </AlertTitle>
            <AlertDescription className="text-sm">
              <div className="space-y-1">
                <p>{warning.message}</p>
                {warning.suggestion && (
                  <p className="text-xs opacity-80 italic">
                    💡 {warning.suggestion}
                  </p>
                )}
              </div>
            </AlertDescription>
          </Alert>
        );
      })}
    </div>
  );
}
