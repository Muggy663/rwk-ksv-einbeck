/**
 * Safe Logger für Authentication Events
 * Verhindert Log Injection und Information Disclosure
 */

export const authLogger = {
  loginAttempt: (success: boolean) => {
    const timestamp = new Date().toISOString();
    const status = success ? 'SUCCESS' : 'FAILED';
    
    // Sichere Logs ohne sensitive Daten
    console.log(`[AUTH] ${timestamp} Login attempt: ${status}`);
  },
  
  rateLimitHit: () => {
    const timestamp = new Date().toISOString();
    console.log(`[AUTH] ${timestamp} Rate limit exceeded`);
  },
  
  botDetected: () => {
    const timestamp = new Date().toISOString();
    console.log(`[AUTH] ${timestamp} Bot activity detected`);
  }
};