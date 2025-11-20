/**
 * HTML-Sanitizer für RWK Einbeck App
 * Verhindert XSS-Angriffe durch sichere HTML-Bereinigung
 */

export class HtmlSanitizer {
  
  /**
   * Entfernt alle HTML-Tags und gefährliche Zeichen
   */
  static sanitizeText(input: any): string {
    if (typeof input !== 'string') {
      return String(input || '').substring(0, 1000);
    }
    
    return input
      .replace(/<[^>]*>/g, '') // Entferne HTML-Tags
      .replace(/[<>'"&]/g, '') // Entferne gefährliche Zeichen
      .replace(/javascript:/gi, '') // Entferne JavaScript-URLs
      .replace(/on\w+=/gi, '') // Entferne Event-Handler
      .substring(0, 1000); // Begrenze Länge
  }
  
  /**
   * Sanitisiert Dateinamen für sichere Verwendung
   */
  static sanitizeFilename(filename: string): string {
    return filename
      .replace(/[^a-zA-Z0-9._-]/g, '_') // Nur sichere Zeichen
      .replace(/_{2,}/g, '_') // Mehrfache Unterstriche reduzieren
      .substring(0, 100); // Länge begrenzen
  }
  
  /**
   * Sanitisiert URLs für sichere Verwendung
   */
  static sanitizeUrl(url: string): string {
    if (!url || typeof url !== 'string') return '';
    
    // Nur HTTP/HTTPS URLs erlauben
    if (!url.match(/^https?:\/\//)) {
      return '';
    }
    
    return url.substring(0, 500);
  }
  
  /**
   * Sanitisiert Objekte rekursiv
   */
  static sanitizeObject(obj: any): any {
    if (typeof obj === 'string') {
      return this.sanitizeText(obj);
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item));
    }
    
    if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        const safeKey = this.sanitizeText(key);
        sanitized[safeKey] = this.sanitizeObject(value);
      }
      return sanitized;
    }
    
    return obj;
  }
}
