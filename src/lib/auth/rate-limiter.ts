/**
 * Rate Limiter für Login-Versuche
 * Verhindert Brute-Force-Angriffe
 */

interface FailedAttempt {
  count: number;
  lastAttempt: number;
  blockedUntil?: number;
}

const failedAttempts = new Map<string, FailedAttempt>();

const MAX_ATTEMPTS = 5;
const BLOCK_DURATION = 15 * 60 * 1000; // 15 Minuten
const ATTEMPT_WINDOW = 60 * 60 * 1000; // 1 Stunde

export function checkRateLimit(email: string): boolean {
  const now = Date.now();
  const attempt = failedAttempts.get(email);
  
  if (!attempt) {
    return true; // Keine vorherigen Versuche
  }
  
  // Prüfe ob noch blockiert
  if (attempt.blockedUntil && now < attempt.blockedUntil) {
    return false;
  }
  
  // Prüfe ob Zeitfenster abgelaufen
  if (now - attempt.lastAttempt > ATTEMPT_WINDOW) {
    failedAttempts.delete(email);
    return true;
  }
  
  return attempt.count < MAX_ATTEMPTS;
}

export function recordFailedAttempt(email: string): void {
  const now = Date.now();
  const attempt = failedAttempts.get(email) || { count: 0, lastAttempt: 0 };
  
  // Reset wenn Zeitfenster abgelaufen
  if (now - attempt.lastAttempt > ATTEMPT_WINDOW) {
    attempt.count = 0;
  }
  
  attempt.count++;
  attempt.lastAttempt = now;
  
  // Blockiere wenn zu viele Versuche
  if (attempt.count >= MAX_ATTEMPTS) {
    attempt.blockedUntil = now + BLOCK_DURATION;
  }
  
  failedAttempts.set(email, attempt);
}

export function clearFailedAttempts(email: string): void {
  failedAttempts.delete(email);
}

// Cleanup alte Einträge alle 10 Minuten
setInterval(() => {
  const now = Date.now();
  for (const [email, attempt] of failedAttempts.entries()) {
    if (now - attempt.lastAttempt > ATTEMPT_WINDOW) {
      failedAttempts.delete(email);
    }
  }
}, 10 * 60 * 1000);
