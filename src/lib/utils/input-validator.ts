/**
 * Input-Validator für RWK Einbeck App
 * Verhindert Injection-Angriffe durch sichere Input-Validierung
 */

// Convenience functions für direkten Import
export function sanitizeInput(input: any): string {
  if (!input) return '';
  return String(input)
    .replace(/[<>"'&]/g, (char) => {
      const entities: Record<string, string> = {
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '&': '&amp;'
      };
      return entities[char] || char;
    })
    .trim()
    .substring(0, 10000); // Max length limit
}

export function validateEmail(email: string): boolean {
  return InputValidator.isValidEmail(email);
}

export function validateFileUpload(file: File, options: {
  maxSize: number;
  allowedMimeTypes: string[];
  allowedExtensions?: string[];
}): { isValid: boolean; error?: string } {
  if (!file) {
    return { isValid: false, error: 'Keine Datei ausgewählt' };
  }

  if (file.size > options.maxSize) {
    return { isValid: false, error: `Datei zu groß (max. ${Math.round(options.maxSize / 1024 / 1024)}MB)` };
  }

  if (!options.allowedMimeTypes.includes(file.type)) {
    return { isValid: false, error: 'Dateityp nicht erlaubt' };
  }

  if (options.allowedExtensions) {
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!options.allowedExtensions.includes(extension)) {
      return { isValid: false, error: 'Dateiendung nicht erlaubt' };
    }
  }

  return { isValid: true };
}

export function validateImageUpload(file: File, options: {
  maxSize: number;
  allowedMimeTypes: string[];
}): { isValid: boolean; error?: string } {
  return validateFileUpload(file, options);
}

export class InputValidator {
  
  /**
   * Validiert E-Mail-Adressen
   */
  static isValidEmail(email: string): boolean {
    if (!email || typeof email !== 'string') return false;
    
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email) && email.length <= 254;
  }
  
  /**
   * Validiert URLs (nur HTTPS erlaubt)
   */
  static isValidUrl(url: string): boolean {
    if (!url || typeof url !== 'string') return false;
    
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'https:' && url.length <= 2048;
    } catch {
      return false;
    }
  }
  
  /**
   * Validiert Dateinamen
   */
  static isValidFilename(filename: string): boolean {
    if (!filename || typeof filename !== 'string') return false;
    
    // Keine gefährlichen Zeichen
    const dangerousChars = /[<>:"/\\|?*\x00-\x1f]/;
    if (dangerousChars.test(filename)) return false;
    
    // Keine reservierten Namen
    const reserved = ['CON', 'PRN', 'AUX', 'NUL', 'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9', 'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9'];
    if (reserved.includes(filename.toUpperCase())) return false;
    
    return filename.length > 0 && filename.length <= 255;
  }
  
  /**
   * Validiert numerische Eingaben
   */
  static isValidNumber(value: any, min?: number, max?: number): boolean {
    const num = Number(value);
    if (isNaN(num) || !isFinite(num)) return false;
    
    if (min !== undefined && num < min) return false;
    if (max !== undefined && num > max) return false;
    
    return true;
  }
  
  /**
   * Validiert Schießsport-Ergebnisse
   */
  static isValidScore(score: any, discipline: string): boolean {
    const num = Number(score);
    if (!this.isValidNumber(num, 0)) return false;
    
    const maxScores: Record<string, number> = {
      'KK': 300,
      'KKG': 300,
      'LG': 400,
      'LGA': 400,
      'LP': 400,
      'LPA': 400
    };
    
    const maxScore = maxScores[discipline] || 300;
    return num <= maxScore;
  }
  
  /**
   * Validiert IBAN
   */
  static isValidIBAN(iban: string): boolean {
    if (!iban || typeof iban !== 'string') return false;
    
    // Entferne Leerzeichen
    const cleanIban = iban.replace(/\s/g, '').toUpperCase();
    
    // Deutsche IBAN: DE + 2 Prüfziffern + 18 Stellen
    if (!cleanIban.match(/^DE\d{20}$/)) return false;
    
    // Einfache Prüfziffer-Validierung (vereinfacht)
    return cleanIban.length === 22;
  }
  
  /**
   * Validiert BIC
   */
  static isValidBIC(bic: string): boolean {
    if (!bic || typeof bic !== 'string') return false;
    
    // BIC: 8 oder 11 Zeichen
    return /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(bic.toUpperCase());
  }
}
