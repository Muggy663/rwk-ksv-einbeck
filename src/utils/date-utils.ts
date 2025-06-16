/**
 * Utility-Funktionen für die Arbeit mit Datumswerten
 */
import { format, parseISO, isValid, differenceInDays, addDays, isBefore, isAfter } from 'date-fns';
import { de } from 'date-fns/locale';

/**
 * Formatiert ein Datum in ein lesbares Format
 * @param date Das zu formatierende Datum
 * @param formatStr Das Format-String (date-fns Format)
 * @returns Das formatierte Datum als String
 */
export function formatDate(date: Date | string | number, formatStr: string = 'dd.MM.yyyy'): string {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : new Date(date);
    if (!isValid(dateObj)) return 'Ungültiges Datum';
    return format(dateObj, formatStr, { locale: de });
  } catch (error) {
    console.error('Fehler beim Formatieren des Datums:', error);
    return 'Fehler';
  }
}

/**
 * Formatiert ein Datum mit Uhrzeit
 * @param date Das zu formatierende Datum
 * @returns Das formatierte Datum mit Uhrzeit als String
 */
export function formatDateTime(date: Date | string | number): string {
  return formatDate(date, 'dd.MM.yyyy HH:mm');
}

/**
 * Prüft, ob ein Datum in der Vergangenheit liegt
 * @param date Das zu prüfende Datum
 * @returns true, wenn das Datum in der Vergangenheit liegt
 */
export function isPastDate(date: Date | string | number): boolean {
  const dateObj = typeof date === 'string' ? parseISO(date) : new Date(date);
  return isBefore(dateObj, new Date());
}

/**
 * Prüft, ob ein Datum in der Zukunft liegt
 * @param date Das zu prüfende Datum
 * @returns true, wenn das Datum in der Zukunft liegt
 */
export function isFutureDate(date: Date | string | number): boolean {
  const dateObj = typeof date === 'string' ? parseISO(date) : new Date(date);
  return isAfter(dateObj, new Date());
}

/**
 * Berechnet die Anzahl der Tage zwischen zwei Daten
 * @param startDate Das Startdatum
 * @param endDate Das Enddatum
 * @returns Die Anzahl der Tage zwischen den beiden Daten
 */
export function daysBetween(startDate: Date | string | number, endDate: Date | string | number): number {
  const start = typeof startDate === 'string' ? parseISO(startDate) : new Date(startDate);
  const end = typeof endDate === 'string' ? parseISO(endDate) : new Date(endDate);
  return differenceInDays(end, start);
}

/**
 * Erzeugt ein Array mit Daten für einen bestimmten Zeitraum
 * @param startDate Das Startdatum
 * @param days Die Anzahl der Tage
 * @returns Ein Array mit Daten
 */
export function getDateRange(startDate: Date | string | number, days: number): Date[] {
  const start = typeof startDate === 'string' ? parseISO(startDate) : new Date(startDate);
  const result: Date[] = [];
  
  for (let i = 0; i < days; i++) {
    result.push(addDays(start, i));
  }
  
  return result;
}