import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Kombiniert CSS-Klassen mit Tailwind-Merge
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formatiert eine Zahl als Währung
 * @param value - Der zu formatierende Wert
 * @param options - Formatierungsoptionen
 */
export function formatCurrency(
  value: number,
  options: Intl.NumberFormatOptions = {}
): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    ...options,
  }).format(value);
}

/**
 * Berechnet den Durchschnitt eines Arrays von Zahlen
 * @param scores - Array mit Zahlen
 * @param excludeZeros - Ob Nullwerte ausgeschlossen werden sollen
 * @returns Durchschnitt oder null bei leeren Arrays
 */
export function calculateAverage(
  scores: number[],
  excludeZeros: boolean = false
): number | null {
  if (!scores || scores.length === 0) return null;
  
  const validScores = excludeZeros 
    ? scores.filter(score => score !== 0)
    : scores;
    
  if (validScores.length === 0) return null;
  
  const sum = validScores.reduce((acc, score) => acc + score, 0);
  return parseFloat((sum / validScores.length).toFixed(2));
}

/**
 * Verzögert die Ausführung einer Funktion
 * @param func - Die zu verzögernde Funktion
 * @param delay - Verzögerung in Millisekunden
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  
  return function(...args: Parameters<T>) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

/**
 * Kürzt einen Text auf eine bestimmte Länge
 * @param text - Der zu kürzende Text
 * @param maxLength - Maximale Länge
 * @param suffix - Suffix für gekürzte Texte
 */
export function truncateText(
  text: string,
  maxLength: number = 100,
  suffix: string = "..."
): string {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength - suffix.length) + suffix;
}
