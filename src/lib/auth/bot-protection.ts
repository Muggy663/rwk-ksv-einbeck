/**
 * Bot Protection für Login-Formulare
 * Verhindert automatisierte Angriffe
 */

const loginTimers = new Map<string, number>();

export const BotProtection = {
  startLoginTimer: (sessionId: string) => {
    loginTimers.set(sessionId, Date.now());
  },
  
  validateLoginTiming: (sessionId: string): boolean => {
    const startTime = loginTimers.get(sessionId);
    if (!startTime) return false;
    
    const elapsed = Date.now() - startTime;
    const MIN_TIME = 2000; // Mindestens 2 Sekunden
    const MAX_TIME = 300000; // Maximal 5 Minuten
    
    return elapsed >= MIN_TIME && elapsed <= MAX_TIME;
  },
  
  validateHoneypot: (value: string): boolean => {
    // Honeypot sollte leer bleiben
    return value === '';
  }
};