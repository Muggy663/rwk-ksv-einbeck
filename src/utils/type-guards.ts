/**
 * Type-Guard-Funktionen für sichere Typprüfungen
 */

/**
 * Prüft, ob ein Wert nicht null oder undefined ist
 */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * Prüft, ob ein Wert ein String ist
 */
export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

/**
 * Prüft, ob ein Wert eine Zahl ist
 */
export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

/**
 * Prüft, ob ein Wert ein Array ist
 */
export function isArray<T>(value: unknown): value is Array<T> {
  return Array.isArray(value);
}

/**
 * Prüft, ob ein Wert ein Objekt ist (und kein Array oder null)
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Prüft, ob ein Objekt eine bestimmte Eigenschaft hat
 */
export function hasProperty<K extends string>(
  obj: unknown,
  prop: K
): obj is Record<K, unknown> {
  return isObject(obj) && prop in obj;
}

/**
 * Prüft, ob ein Wert ein gültiges Datum ist
 */
export function isValidDate(value: unknown): value is Date {
  return value instanceof Date && !isNaN(value.getTime());
}