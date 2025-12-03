/**
 * Sanitisiert HTML-Content für sichere Anzeige
 */
export const sanitizeHtml = (html: string): string => {
  // Nur client-side DOMPurify laden
  if (typeof window !== 'undefined') {
    const DOMPurify = require('isomorphic-dompurify');
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li'],
      ALLOWED_ATTR: []
    });
  }
  // Server-side: einfaches escaping
  return escapeHtml(html);
};

/**
 * Escaped HTML-Zeichen für Text-Ausgabe
 */
export const escapeHtml = (text: string): string => {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
};

/**
 * Validiert und bereinigt User-Input
 */
export const sanitizeInput = (input: string): string => {
  return input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
};
