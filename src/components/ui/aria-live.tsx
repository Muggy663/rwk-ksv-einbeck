"use client";

import React, { useState, useEffect } from 'react';
import { logError, logWarn, logInfo, logDebug } from '@/lib/utils/secure-logger';
import { cn } from '@/lib/utils';

interface AriaLiveProps {
  message: string;
  assertive?: boolean;
  clearAfter?: number; // Zeit in Millisekunden, nach der die Nachricht gelöscht wird
  className?: string;
}

export function AriaLive({
  message,
  assertive = false,
  clearAfter,
  className,
}: AriaLiveProps) {
  const [liveMessage, setLiveMessage] = useState(message);

  useEffect(() => {
    setLiveMessage(message);

    if (clearAfter && message) {
      const timer = setTimeout(() => {
        setLiveMessage('');
      }, clearAfter);

      return () => clearTimeout(timer);
    }
  }, [message, clearAfter]);

  return (
    <div
      className={cn('sr-only', className)}
      aria-live={assertive ? 'assertive' : 'polite'}
      aria-atomic="true"
    >
      {liveMessage}
    </div>
  );
}
