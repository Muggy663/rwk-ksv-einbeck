/**
 * Sicheres Logging-System für RWK Einbeck App
 * Verhindert Log Injection und Data Exposure
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: string;
}

class SecureLogger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  /**
   * Sanitisiert Log-Nachrichten um Injection zu verhindern
   */
  private sanitize(input: any): string {
    if (typeof input === 'string') {
      return input
        .replace(/[\r\n\t]/g, ' ') // Entferne Zeilenumbrüche
        .replace(/[<>]/g, '') // Entferne HTML-Tags
        .substring(0, 500); // Begrenze Länge
    }
    
    if (typeof input === 'object') {
      return '[Object]'; // Keine sensitive Objekt-Details
    }
    
    return String(input).substring(0, 100);
  }

  /**
   * Erstellt sichere Log-Einträge
   */
  private createLogEntry(level: LogLevel, message: string, context?: string): LogEntry {
    return {
      level,
      message: this.sanitize(message),
      timestamp: new Date().toISOString(),
      context: context ? this.sanitize(context) : undefined
    };
  }

  /**
   * Info-Level Logging
   */
  info(message: string, context?: string): void {
    const entry = this.createLogEntry('info', message, context);
    console.log(`[INFO] ${entry.timestamp}: ${entry.message}`);
  }

  /**
   * Warning-Level Logging
   */
  warn(message: string, context?: string): void {
    const entry = this.createLogEntry('warn', message, context);
    console.warn(`[WARN] ${entry.timestamp}: ${entry.message}`);
  }

  /**
   * Error-Level Logging (ohne sensitive Details)
   */
  error(message: string, context?: string): void {
    const entry = this.createLogEntry('error', message, context);
    console.error(`[ERROR] ${entry.timestamp}: ${entry.message}`);
  }

  /**
   * Debug-Level Logging (nur in Development)
   */
  debug(message: string, context?: string): void {
    if (this.isDevelopment) {
      const entry = this.createLogEntry('debug', message, context);
      console.debug(`[DEBUG] ${entry.timestamp}: ${entry.message}`);
    }
  }

  /**
   * Sichere Fehler-Behandlung ohne sensitive Daten
   */
  logError(error: Error | unknown, context?: string): void {
    const safeMessage = error instanceof Error 
      ? `Error occurred: ${error.name}` 
      : 'Unknown error occurred';
    
    this.error(safeMessage, context);
  }
}

export const secureLogger = new SecureLogger();