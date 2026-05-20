/**
 * Secure Logger - Verhindert Log Injection (CWE-117)
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogContext {
  component?: string;
  userId?: string;
  action?: string;
  [key: string]: any;
}

type LogContextArg = LogContext | string | number | boolean | undefined;

class SecureLogger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  private sanitizeString(value: any): string {
    if (typeof value !== 'string') return String(value);
    return value
      .replace(/[\r\n\t]/g, ' ')
      .replace(/[<>'"&]/g, '_')
      .substring(0, 500);
  }

  private sanitizeObject(obj: any, maxDepth = 3, currentDepth = 0): any {
    if (currentDepth >= maxDepth) return '[Object too deep]';
    if (obj === null || obj === undefined) return obj;
    if (typeof obj === 'string') return this.sanitizeString(obj);
    if (typeof obj === 'number' || typeof obj === 'boolean') return obj;

    if (obj instanceof Error) {
      return {
        name: this.sanitizeString(obj.name),
        message: this.sanitizeString(obj.message),
        code: (obj as any).code ? this.sanitizeString(String((obj as any).code)) : undefined,
        stack: obj.stack ? this.sanitizeString(obj.stack.substring(0, 200)) : undefined
      };
    }

    if (Array.isArray(obj)) {
      if (obj.length > 10) return `[Array with ${obj.length} items]`;
      return obj.slice(0, 10).map(item => this.sanitizeObject(item, maxDepth, currentDepth + 1));
    }

    if (typeof obj === 'object') {
      const sanitized: any = {};
      const keys = Object.keys(obj).slice(0, 10);
      for (const key of keys) {
        const sanitizedKey = this.sanitizeString(key);
        sanitized[sanitizedKey] = this.isSensitiveKey(sanitizedKey)
          ? '[REDACTED]'
          : this.sanitizeObject(obj[key], maxDepth, currentDepth + 1);
      }
      if (Object.keys(obj).length > 10) sanitized['...'] = `[${Object.keys(obj).length - 10} more keys]`;
      return sanitized;
    }

    return this.sanitizeString(obj);
  }

  private isSensitiveKey(key: string): boolean {
    const sensitiveKeys = ['password', 'token', 'secret', 'key', 'auth', 'credential', 'email', 'phone', 'address', 'ssn', 'credit', 'card'];
    return sensitiveKeys.some(s => key.toLowerCase().includes(s));
  }

  private normalizeContext(context?: LogContextArg): LogContext | undefined {
    if (context === undefined) return undefined;
    if (typeof context === 'string' || typeof context === 'number' || typeof context === 'boolean') {
      return { value: String(context) };
    }
    return context as LogContext;
  }

  private createLogMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const sanitizedMessage = this.sanitizeString(message);
    let logMessage = `[${timestamp}] ${level.toUpperCase()}: ${sanitizedMessage}`;
    if (context) {
      const contextStr = JSON.stringify(this.sanitizeObject(context)).replace(/[\r\n\t]/g, ' ');
      logMessage += ` | Context: ${contextStr}`;
    }
    return logMessage;
  }

  info(message: string, context?: LogContextArg): void {
    if (this.isDevelopment) {
      console.info(this.createLogMessage('info', message, this.normalizeContext(context)));
    }
  }

  warn(message: string, context?: LogContextArg): void {
    console.warn(this.createLogMessage('warn', message, this.normalizeContext(context)));
  }

  error(message: string, error?: Error, context?: LogContextArg): void {
    if (error && typeof error === 'object' && 'code' in error) {
      if (String((error as any).code) === '5') {
        this.warn(`Firestore NOT_FOUND (Build-Zeit): ${message}`, context);
        return;
      }
    }
    const errorContext = error ? { error: this.sanitizeObject(error), ...this.normalizeContext(context) } : this.normalizeContext(context);
    console.error(this.createLogMessage('error', message, errorContext));
  }

  debug(message: string, context?: LogContextArg): void {
    if (this.isDevelopment) {
      console.debug(this.createLogMessage('debug', message, this.normalizeContext(context)));
    }
  }

  performance(operation: string, duration: number, context?: LogContextArg): void {
    if (this.isDevelopment) {
      const sanitizedOperation = this.sanitizeString(operation);
      const sanitizedDuration = Math.max(0, Math.floor(Number(duration) || 0));
      this.info(`Performance: ${sanitizedOperation} took ${sanitizedDuration}ms`, context);
    }
  }
}

export const secureLogger = new SecureLogger();

export const logInfo = (message: string, context?: LogContextArg) => secureLogger.info(message, context);
export const logWarn = (message: string, context?: LogContextArg) => secureLogger.warn(message, context);
export const logError = (message: string, error?: unknown, context?: LogContextArg) =>
  secureLogger.error(message, error instanceof Error ? error : error !== undefined ? new Error(String(error)) : undefined, context);
export const logDebug = (message: string, context?: LogContextArg) => {
  try {
    secureLogger.debug(message, context);
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      const sanitizedError = err instanceof Error ? err.message.replace(/[\r\n\t<>'"&]/g, '_') : String(err).replace(/[\r\n\t<>'"&]/g, '_');
      console.warn('logDebug error:', sanitizedError);
    }
  }
};
export const logPerformance = (operation: string, duration: number, context?: LogContextArg) => {
  const sanitizedOperation = String(operation).replace(/[\r\n\t<>'"&]/g, '_').substring(0, 200);
  secureLogger.performance(sanitizedOperation, duration, context);
};

/**
 * Hilfsfunktion: Extrahiert eine lesbare Fehlermeldung aus einem unknown catch-Wert.
 * Verhindert TS18046-Fehler bei `catch (error) { error.message }`.
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message: unknown }).message);
  }
  return String(error);
}
