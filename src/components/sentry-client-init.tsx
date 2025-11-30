"use client";
import { useEffect } from 'react';
import { logError, logWarn, logInfo, logDebug } from '@/lib/utils/secure-logger';

export function SentryClientInit() {
  useEffect(() => {
    // Sentry wird bereits über sentry.client.config.ts initialisiert
    // Komponente dient nur als Platzhalter für Layout-Integration
  }, []);

  return null;
}
