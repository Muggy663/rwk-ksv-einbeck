type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogData {
  [key: string]: any;
}

export const safeLog = {
  info: (message: string, data?: LogData) => {
    logSafely('info', message, data);
  },
  
  warn: (message: string, data?: LogData) => {
    logSafely('warn', message, data);
  },
  
  error: (message: string, error?: any) => {
    const errorData = error instanceof Error 
      ? { message: error.message, stack: error.stack }
      : { error };
    logSafely('error', message, errorData);
  },
  
  debug: (message: string, data?: LogData) => {
    if (process.env.NODE_ENV === 'development') {
      logSafely('debug', message, data);
    }
  }
};

function logSafely(level: LogLevel, message: string, data?: LogData) {
  const sanitizedData = data ? sanitizeLogData(data) : undefined;
  
  switch (level) {
    case 'info':
      console.log(`[INFO] ${message}`, sanitizedData);
      break;
    case 'warn':
      console.warn(`[WARN] ${message}`, sanitizedData);
      break;
    case 'error':
      console.error(`[ERROR] ${message}`, sanitizedData);
      break;
    case 'debug':
      console.debug(`[DEBUG] ${message}`, sanitizedData);
      break;
  }
}

function sanitizeLogData(data: LogData): LogData {
  const sensitiveFields = [
    'email', 'phone', 'password', 'token', 'secret',
    'apiKey', 'privateKey', 'ssn', 'creditCard'
  ];
  
  const sanitized = { ...data };
  
  Object.keys(sanitized).forEach(key => {
    const lowerKey = key.toLowerCase();
    
    if (sensitiveFields.some(field => lowerKey.includes(field))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeLogData(sanitized[key]);
    }
  });
  
  return sanitized;
}

export const authLogger = {
  loginAttempt: (success: boolean, userId?: string) => {
    safeLog.info(`Login attempt: ${success ? 'success' : 'failed'}`, {
      userId: userId ? hashUserId(userId) : undefined,
      timestamp: new Date().toISOString()
    });
  },
  
  sessionExpired: (userId: string) => {
    safeLog.info('Session expired', {
      userId: hashUserId(userId),
      timestamp: new Date().toISOString()
    });
  }
};

function hashUserId(userId: string): string {
  return btoa(userId).substring(0, 8);
}