"use client";

import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Clock } from 'lucide-react';

interface MaintenanceBannerProps {
  show?: boolean;
  message?: string;
  type?: 'warning' | 'info' | 'maintenance';
}

export function MaintenanceBanner({ 
  show = false, 
  message = "Wartungsarbeiten geplant",
  type = 'warning'
}: MaintenanceBannerProps) {
  if (!show) return null;

  const getIcon = () => {
    switch (type) {
      case 'maintenance': return <Clock className="h-4 w-4" />;
      case 'info': return <Clock className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getStyles = () => {
    switch (type) {
      case 'maintenance': return 'border-blue-500 bg-blue-50 text-blue-800';
      case 'info': return 'border-blue-500 bg-blue-50 text-blue-800';
      default: return 'border-orange-500 bg-orange-50 text-orange-800';
    }
  };

  return (
    <Alert className={`mb-4 ${getStyles()}`}>
      {getIcon()}
      <AlertDescription className="font-medium">
        {message}
      </AlertDescription>
    </Alert>
  );
}