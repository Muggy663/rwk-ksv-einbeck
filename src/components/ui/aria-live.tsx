/**
 * Komponente für barrierefreie Live-Ankündigungen
 */
"use client";

import React, { useEffect, useState } from 'react';

type PolitenessLevel = 'polite' | 'assertive' | 'off';

interface AriaLiveProps {
  message?: string;
  politeness?: PolitenessLevel;
  timeout?: number;
  className?: string;
}

/**
 * Komponente für barrierefreie Live-Ankündigungen
 */
export function AriaLive({
  message,
  politeness = 'polite',
  timeout = 5000,
  className = 'sr-only', // Screen-Reader-only by default
}: AriaLiveProps) {
  const [announcement, setAnnouncement] = useState<string>('');
  
  useEffect(() => {
    if (!message) return;
    
    // Setze die Nachricht
    setAnnouncement(message);
    
    // Entferne die Nachricht nach dem Timeout
    if (timeout > 0) {
      const timer = setTimeout(() => {
        setAnnouncement('');
      }, timeout);
      
      return () => clearTimeout(timer);
    }
    
    return undefined;
  }, [message, timeout]);
  
  if (!announcement) return null;
  
  return (
    <div 
      aria-live={politeness}
      aria-atomic="true"
      className={className}
    >
      {announcement}
    </div>
  );
}