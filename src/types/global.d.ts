// Globale Typdefinitionen für die Anwendung

import { Event } from '@/lib/services/calendar-service';
import { logError, logWarn, logInfo, logDebug } from '@/lib/utils/secure-logger';

declare global {
  interface Window {
    nextEvents?: Event[];
  }
}
