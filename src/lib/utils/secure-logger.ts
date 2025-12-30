/**
 * Secure Logger - Verhindert Log Injection (CWE-117)
 * Sanitisiert alle Log-Ausgaben und verhindert XSS in Logs
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogContext {
  component?: string;
  userId?: string;
  action?: string;
  [key: string]: any;
}

class SecureLogger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  /**
   * Sanitisiert Strings für sichere Log-Ausgabe
   */
  private sanitizeString(value: any): string {
    if (typeof value !== 'string') {
      return String(value);
    }
    
    // Entferne potentiell gefährliche Zeichen
    return value
      .replace(/[\r\n\t]/g, ' ') // Zeilenumbrüche entfernen
      .replace(/[<>'"&]/g, '_') // HTML/Script-Zeichen ersetzen
      .substring(0, 500); // Länge begrenzen
  }

  /**
   * Sanitisiert Objekte für sichere Log-Ausgabe
   */
  private sanitizeObject(obj: any, maxDepth = 3, currentDepth = 0): any {
    if (currentDepth >= maxDepth) {
      return '[Object too deep]';
    }

    if (obj === null || obj === undefined) {
      return obj;
    }

    if (typeof obj === 'string') {
      return this.sanitizeString(obj);
    }

    if (typeof obj === 'number' || typeof obj === 'boolean') {
      return obj;
    }

    if (obj instanceof Error) {
      return {
        name: this.sanitizeString(obj.name),
        message: this.sanitizeString(obj.message),
        code: obj.code ? this.sanitizeString(obj.code) : undefined,
        stack: obj.stack ? this.sanitizeString(obj.stack.substring(0, 200)) : undefined
      };
    }

    if (Array.isArray(obj)) {
      if (obj.length > 10) {
        return `[Array with ${obj.length} items]`;
      }
      return obj.slice(0, 10).map(item => this.sanitizeObject(item, maxDepth, currentDepth + 1));
    }

    if (typeof obj === 'object') {
      const sanitized: any = {};
      const keys = Object.keys(obj).slice(0, 10); // Nur erste 10 Keys
      
      for (const key of keys) {
        const sanitizedKey = this.sanitizeString(key);
        
        // Sensible Daten ausschließen
        if (this.isSensitiveKey(sanitizedKey)) {
          sanitized[sanitizedKey] = '[REDACTED]';
        } else {
          sanitized[sanitizedKey] = this.sanitizeObject(obj[key], maxDepth, currentDepth + 1);
        }
      }
      
      if (Object.keys(obj).length > 10) {
        sanitized['...'] = `[${Object.keys(obj).length - 10} more keys]`;
      }
      
      return sanitized;
    }

    return this.sanitizeString(obj);
  }

  /**
   * Prüft ob ein Key sensible Daten enthält
   */
  private isSensitiveKey(key: string): boolean {
    const sensitiveKeys = [
      'password', 'token', 'secret', 'key', 'auth', 'credential',
      'email', 'phone', 'address', 'ssn', 'credit', 'card'
    ];
    
    const lowerKey = key.toLowerCase();
    return sensitiveKeys.some(sensitive => lowerKey.includes(sensitive));
  }

  /**
   * Erstellt sichere Log-Nachricht
   */
  private createLogMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const sanitizedMessage = this.sanitizeString(message);
    
    let logMessage = `[${timestamp}] ${level.toUpperCase()}: ${sanitizedMessage}`;
    
    if (context) {
      const sanitizedContext = this.sanitizeObject(context);
      logMessage += ` | Context: ${JSON.stringify(sanitizedContext)}`;
    }
    
    return logMessage;
  }

  /**
   * Info-Level Logging
   */
  info(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      const logMessage = this.createLogMessage('info', message, context);
      console.info(logMessage);
    }
  }

  /**
   * Warning-Level Logging
   */
  warn(message: string, context?: LogContext): void {
    const logMessage = this.createLogMessage('warn', message, context);
    console.warn(logMessage);
  }

  /**
   * Error-Level Logging
   */
  error(message: string, error?: Error, context?: LogContext): void {
    // Globaler NOT_FOUND Abfang - stumm schalten für Build-Zeit
    if (error && typeof error === 'object' && 'code' in error && error.code === '5') {
      // NOT_FOUND Fehler während Build - nur als Warning loggen
      this.warn(`Firestore NOT_FOUND (Build-Zeit): ${message}`, context);
      return;
    }
    
    const errorContext = error ? { error: this.sanitizeObject(error), ...context } : context;
    const logMessage = this.createLogMessage('error', message, errorContext);
    console.error(logMessage);
  }

  /**
   * Debug-Level Logging (nur in Development)
   */
  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      const logMessage = this.createLogMessage('debug', message, context);
      console.debug(logMessage);
    }
    // In production: no-op (empty function to prevent errors)
  }

  /**
   * Performance Logging
   */
  performance(operation: string, duration: number, context?: LogContext): void {
    if (this.isDevelopment) {
      this.info(`Performance: ${operation} took ${duration}ms`, context);
    }
  }
}

// Singleton Instance
export const secureLogger = new SecureLogger();

// Convenience exports
export const logInfo = (message: string, context?: LogContext) => secureLogger.info(message, context);
export const logWarn = (message: string, context?: LogContext) => secureLogger.warn(message, context);
export const logError = (message: string, error?: Error, context?: LogContext) => secureLogger.error(message, error, context);
export const logDebug = (message: string, context?: LogContext) => {
  try {
    secureLogger.debug(message, context);
  } catch (error) {
    // Fallback: silent fail in production
    if (process.env.NODE_ENV === 'development') {
      console.warn('logDebug error:', error);
    }
  }
};
export const logPerformance = (operation: string, duration: number, context?: LogContext) => secureLogger.performance(operation, duration, context);