/**
 * Utility-Funktionen für die Arbeit mit Strings
 */

/**
 * Kürzt einen String auf eine bestimmte Länge und fügt Auslassungspunkte hinzu
 * @param str Der zu kürzende String
 * @param maxLength Die maximale Länge des Strings
 * @returns Der gekürzte String
 */
export function truncateString(str: string, maxLength: number): string {
  if (!str) return '';
  if (str.length <= maxLength) return str;
  return `${str.substring(0, maxLength)}...`;
}

/**
 * Konvertiert einen String in Camel Case
 * @param str Der zu konvertierende String
 * @returns Der String in Camel Case
 */
export function toCamelCase(str: string): string {
  if (!str) return '';
  try {
    return str
      .toLowerCase()
      .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase());
  } catch (error) {
    return str;
  }
}

/**
 * Konvertiert einen String in Pascal Case
 * @param str Der zu konvertierende String
 * @returns Der String in Pascal Case
 */
export function toPascalCase(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase())
    .replace(/^./, (chr) => chr.toUpperCase());
}

/**
 * Konvertiert einen String in Kebab Case
 * @param str Der zu konvertierende String
 * @returns Der String in Kebab Case
 */
export function toKebabCase(str: string): string {
  if (!str) return '';
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
}

/**
 * Entfernt Sonderzeichen aus einem String
 * @param str Der zu bereinigende String
 * @returns Der bereinigte String
 */
export function removeSpecialChars(str: string): string {
  if (!str) return '';
  return str.replace(/[^\w\s]/gi, '');
}

/**
 * Entfernt Umlaute aus einem String
 * @param str Der zu bereinigende String
 * @returns Der bereinigte String
 */
export function removeUmlauts(str: string): string {
  if (!str) return '';
  return str
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/Ä/g, 'Ae')
    .replace(/Ö/g, 'Oe')
    .replace(/Ü/g, 'Ue')
    .replace(/ß/g, 'ss');
}

/**
 * Generiert einen zufälligen String
 * @param length Die Länge des zu generierenden Strings
 * @returns Der generierte String
 * @throws {Error} Wenn length negativ oder keine Zahl ist
 */
export function generateRandomString(length: number): string {
  if (length < 0 || !Number.isFinite(length)) {
    throw new Error('Length must be a non-negative finite number');
  }
  
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charsLength = chars.length;
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * charsLength));
  }
  return result;
}
