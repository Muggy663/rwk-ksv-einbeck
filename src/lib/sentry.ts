// src/lib/sentry.ts
import * as Sentry from "@sentry/nextjs";

export function initSentry() {
  if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      environment: process.env.NODE_ENV || 'development',
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0,
      debug: process.env.NODE_ENV === 'development',
      beforeSend(event) {
        // Keine sensiblen Daten senden
        if (event.user) {
          delete event.user.email;
          delete event.user.ip_address;
        }
        
        // Filtere bekannte harmlose Fehler
        if (event.exception?.values?.[0]?.value?.includes('ResizeObserver loop limit exceeded')) {
          return null;
        }
        
        return event;
      },
    });

  }
}

// Manuell Fehler loggen
export function logError(error: Error, context?: Record<string, any>) {
  console.error('Error:', error);
  
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    Sentry.captureException(error, {
      tags: {
        component: context?.component || 'unknown',
        feature: context?.feature || 'unknown'
      },
      extra: context,
    });
  }
}

// User Context setzen
export function setUserContext(user: { id: string; role?: string }) {
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    Sentry.setUser({
      id: user.id,
      role: user.role
    });
  }
}

// Performance Monitoring
export function startTransaction(name: string) {
  return Sentry.startTransaction({ name });
}
