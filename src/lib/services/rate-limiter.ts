/**
 * Einfacher In-Memory Rate Limiter für Gemini-Fragen
 */
class RateLimiter {
  private dailyUsage = new Map<string, { count: number; date: string }>();
  private todayCache: string | null = null;
  
  private getToday(): string {
    if (!this.todayCache || this.todayCache !== new Date().toDateString()) {
      this.todayCache = new Date().toDateString();
    }
    return this.todayCache;
  }
  
  canMakeRequest(ip: string, maxPerDay: number = 5): boolean {
    const today = this.getToday();
    const usage = this.dailyUsage.get(ip);
    
    if (!usage || usage.date !== today) {
      this.dailyUsage.set(ip, { count: 0, date: today });
      return true;
    }
    
    return usage.count < maxPerDay;
  }
  
  recordRequest(ip: string): void {
    const today = this.getToday();
    const usage = this.dailyUsage.get(ip) || { count: 0, date: today };
    
    if (usage.date === today) {
      usage.count++;
    } else {
      usage.count = 1;
      usage.date = today;
    }
    
    this.dailyUsage.set(ip, usage);
  }
  
  getRemainingRequests(ip: string, maxPerDay: number = 5): number {
    const today = this.getToday();
    const usage = this.dailyUsage.get(ip);
    
    if (!usage || usage.date !== today) {
      return maxPerDay;
    }
    
    return Math.max(0, maxPerDay - usage.count);
  }
}

export const rateLimiter = new RateLimiter();
