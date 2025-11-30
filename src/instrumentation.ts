import * as Sentry from '@sentry/nextjs';
import { logError, logWarn, logInfo, logDebug } from '@/lib/utils/secure-logger';

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('../sentry.server.config');
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('../sentry.edge.config');
  }
}

export const onRequestError = Sentry.captureRequestError;
