// Minimale Sanitization für RWK Einbeck App
// Nur für PDF-Generierung und HTML-Output

/**
 * Bereinigt Text für sichere HTML/PDF-Ausgabe
 * Verhindert XSS durch Escaping von HTML-Zeichen
 */
export const sanitizeHtml = (input: string | null | undefined): string => {
  if (!input) return '';
  
  return String(input)
    .replace(/&/g, '&amp;')   // & muss zuerst escaped werden
    .replace(/</g, '&lt;')    // < zu &lt;
    .replace(/>/g, '&gt;')    // > zu &gt;
    .replace(/"/g, '&quot;')  // " zu &quot;
    .replace(/'/g, '&#x27;'); // ' zu &#x27;
};

/**
 * Bereinigt Text für PDF-Generierung
 * Weniger strikt als HTML, da PDFs meist sicherer sind
 */
export const sanitizeForPdf = (input: string | null | undefined): string => {
  if (!input) return '';
  
  return String(input)
    .replace(/</g, '&lt;')    // Nur < und > escapen für PDF
    .replace(/>/g, '&gt;');
};

/**
 * Bereinigt Dateinamen für sichere Verwendung
 */
export const sanitizeFilename = (filename: string): string => {
  return filename
    .replace(/[^a-zA-Z0-9.-_äöüÄÖÜß]/g, '_')  // Nur sichere Zeichen + deutsche Umlaute
    .replace(/_{2,}/g, '_')                     // Mehrfache _ zu einem
    .substring(0, 100);                         // Länge begrenzen
};

/**
 * Bereinigt E-Mail-Adressen für Logs
 */
export const sanitizeEmail = (email: string): string => {
  // Einfache E-Mail-Validierung und Bereinigung
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return '[invalid-email]';
  }
  return email.toLowerCase().trim();
};

// Entwicklungs-Hinweise
if (process.env.NODE_ENV === 'development') {
  console.log('🧹 Sanitization utilities loaded');
  console.log('Use sanitizeHtml() for HTML output, sanitizeForPdf() for PDF generation');
}