/**
 * XSS Protection Utilities - Verhindert Cross-Site Scripting (CWE-79, CWE-80)
 * Sanitisiert Benutzereingaben und verhindert XSS-Angriffe
 */

/**
 * HTML-Entities escapen
 */
export function escapeHtml(unsafe: string): string {
  if (typeof unsafe !== 'string') {
    return String(unsafe);
  }
  
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/\//g, '&#x2F;');
}

/**
 * JavaScript-String escapen
 */
export function escapeJavaScript(unsafe: string): string {
  if (typeof unsafe !== 'string') {
    return String(unsafe);
  }
  
  return unsafe
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t')
    .replace(/\f/g, '\\f')
    .replace(/\v/g, '\\v')
    .replace(/\0/g, '\\0');
}

/**
 * URL-Parameter sanitisieren
 */
export function sanitizeUrlParam(param: string): string {
  if (typeof param !== 'string') {
    return '';
  }
  
  // Nur alphanumerische Zeichen, Bindestriche und Unterstriche erlauben
  return param.replace(/[^a-zA-Z0-9\-_]/g, '');
}

/**
 * Dateinamen sanitisieren
 */
export function sanitizeFileName(fileName: string): string {
  if (typeof fileName !== 'string') {
    return 'unnamed';
  }
  
  return fileName
    .replace(/[^a-zA-Z0-9\-_\.]/g, '_')
    .replace(/\.{2,}/g, '.')
    .substring(0, 255);
}

/**
 * Benutzereingaben für Anzeige sanitisieren
 */
export function sanitizeUserInput(input: string, maxLength = 1000): string {
  if (typeof input !== 'string') {
    return '';
  }
  
  return escapeHtml(input.trim().substring(0, maxLength));
}

/**
 * Email-Adressen validieren und sanitisieren
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function sanitizeEmail(email: string): string {
  if (typeof email !== 'string') {
    return '';
  }
  
  const trimmed = email.trim().toLowerCase();
  
  if (!EMAIL_REGEX.test(trimmed)) {
    return '';
  }
  
  return trimmed;
}

/**
 * Telefonnummern sanitisieren
 */
export function sanitizePhoneNumber(phone: string): string {
  if (typeof phone !== 'string') {
    return '';
  }
  
  // Nur Zahlen, Leerzeichen, Bindestriche und Klammern erlauben
  return phone.replace(/[^0-9\s\-\(\)\+]/g, '').trim();
}

/**
 * Schützen-Namen sanitisieren
 */
export function sanitizeShooterName(name: string): string {
  if (typeof name !== 'string') {
    return 'Unbekannt';
  }
  
  return name
    .replace(/[^a-zA-ZäöüÄÖÜß\s.\-]/g, '')
    .trim()
    .substring(0, 100);
}

/**
 * Vereinsnamen sanitisieren
 */
export function sanitizeClubName(name: string): string {
  if (typeof name !== 'string') {
    return 'Unbekannter Verein';
  }
  
  return name
    .replace(/[^a-zA-Z0-9äöüÄÖÜß\s.()\-]/g, '')
    .trim()
    .substring(0, 200);
}

/**
 * Kommentare/Notizen sanitisieren
 */
export function sanitizeComment(comment: string): string {
  if (typeof comment !== 'string') {
    return '';
  }
  
  return sanitizeUserInput(comment, 2000);
}

/**
 * Firestore Document IDs validieren
 */
const FIRESTORE_ID_REGEX = /^[^\/]{1,1500}$/;

export function validateFirestoreId(id: string): boolean {
  if (typeof id !== 'string') {
    return false;
  }
  
  // Firestore ID Regeln: 1-1500 Zeichen, keine Schrägstriche
  return FIRESTORE_ID_REGEX.test(id);
}

/**
 * Sichere String-Interpolation für Templates
 */
export function safeTemplate(template: string, values: Record<string, any>): string {
  let result = template;
  
  for (const [key, value] of Object.entries(values)) {
    const sanitizedValue = sanitizeUserInput(String(value));
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), sanitizedValue);
  }
  
  return result;
}

/**
 * Content Security Policy Helper
 */
export function generateCSPNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Sichere JSON-Serialisierung
 */
export function safeJsonStringify(obj: any): string {
  try {
    return JSON.stringify(obj, (key, value) => {
      if (typeof value === 'string') {
        return escapeHtml(value);
      }
      return value;
    });
  } catch (error) {
    return '{}';
  }
}