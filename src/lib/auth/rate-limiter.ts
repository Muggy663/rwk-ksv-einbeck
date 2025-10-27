const failedAttempts = new Map<string, { count: number, lastAttempt: number }>();

export function checkRateLimit(email: string): boolean {
  const now = Date.now();
  const attempts = failedAttempts.get(email);
  
  if (!attempts) return true;
  
  // Reset nach 15 Minuten
  if (now - attempts.lastAttempt > 15 * 60 * 1000) {
    failedAttempts.delete(email);
    return true;
  }
  
  return attempts.count < 5;
}

export function recordFailedAttempt(email: string) {
  const now = Date.now();
  const current = failedAttempts.get(email) || { count: 0, lastAttempt: now };
  failedAttempts.set(email, { 
    count: current.count + 1, 
    lastAttempt: now 
  });
}

export function clearFailedAttempts(email: string) {
  failedAttempts.delete(email);
}