// Globale Typdefinitionen für die Anwendung

import { Event } from '@/lib/services/calendar-service';

declare global {
  interface Window {
    nextEvents?: Event[];
  }
}