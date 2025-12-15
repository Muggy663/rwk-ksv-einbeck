/**
 * Safe Logger für Authentication Events
 * Verhindert Log Injection und Information Disclosure
 */
import { logDebug } from './secure-logger';

export const authLogger = {
  loginAttempt: (success: boolean) => {
    const timestamp = new Date().toISOString();
    const status = success ? 'SUCCESS' : 'FAILED';
    
    // Sichere Logs ohne sensitive Daten
    logDebug(`[AUTH] ${timestamp} Login attempt: ${status}`);
  },
  
  rateLimitHit: () => {
    const timestamp = new Date().toISOString();
    logDebug(`[AUTH] ${timestamp} Rate limit exceeded`);
  },
  
  botDetected: () => {
    const timestamp = new Date().toISOString();
    logDebug(`[AUTH] ${timestamp} Bot activity detected`);
  }
};
