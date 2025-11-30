// Sicherer Logger für RWK Einbeck App
// Verhindert Log Injection Angriffe

/**
 * Bereinigt Input für sichere Logs
 * Entfernt CRLF-Zeichen die für Log Injection genutzt werden können
 */
const sanitizeForLog = (input: any): string => {
  if (input === null || input === undefined) {
    return 'null';
  }
  
  if (typeof input === 'object') {
    try {
      input = JSON.stringify(input);
    } catch {
      input = '[Object]';
    }
  }
  
  const stringInput = String(input);
  
  // Entferne gefährliche Zeichen für Log Injection
  return stringInput
    .replace(/[\r\n\t]/g, ' ')  // CRLF und Tabs zu Leerzeichen
    .replace(/\x00/g, '')       // Null-Bytes entfernen
    .substring(0, 1000);        // Länge begrenzen
};

/**
 * Sicherer Logger - verhindert Log Injection
 * Kann parallel zu bestehenden console.log verwendet werden
 */
export const safeLog = {
  info: (message: string, data?: any) => {
    const safeMessage = sanitizeForLog(message);
    const safeData = data ? sanitizeForLog(data) : '';
    logDebug(`ℹ️ ${safeMessage}`, safeData);
  },
  
  warn: (message: string, data?: any) => {
    const safeMessage = sanitizeForLog(message);
    const safeData = data ? sanitizeForLog(data) : '';
    logWarn(`⚠️ ${safeMessage}`, safeData);
  },
  
  error: (message: string, data?: any) => {
    const safeMessage = sanitizeForLog(message);
    const safeData = data ? sanitizeForLog(data) : '';
    logError(`❌ ${safeMessage}`, safeData);
  },
  
  debug: (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      const safeMessage = sanitizeForLog(message);
      const safeData = data ? sanitizeForLog(data) : '';
      console.debug(`🐛 ${safeMessage}`, safeData);
    }
  }
};

/**
 * Security Audit Logger - für Sicherheitsereignisse
 */
export const securityLog = {
  loginAttempt: (email: string, success: boolean) => {
    safeLog.info('Login attempt', { 
      email: sanitizeForLog(email), 
      success, 
      timestamp: new Date().toISOString() 
    });
  },
  
  unauthorizedAccess: (path: string, userId?: string) => {
    safeLog.warn('Unauthorized access attempt', { 
      path: sanitizeForLog(path), 
      userId: userId ? sanitizeForLog(userId) : 'anonymous',
      timestamp: new Date().toISOString() 
    });
  },
  
  dataAccess: (collection: string, userId: string) => {
    safeLog.info('Data access', { 
      collection: sanitizeForLog(collection), 
      userId: sanitizeForLog(userId),
      timestamp: new Date().toISOString() 
    });
  }
};

// Entwicklungs-Hinweis
if (process.env.NODE_ENV === 'development') {
  logDebug('🔒 Safe Logger initialized - Use safeLog instead of console.log for user input');
}
