// Einfache Bot-Protection ohne nerviges Captcha

export class BotProtection {
  private static loginStartTimes = new Map<string, number>();
  
  // Honeypot-Validierung
  static validateHoneypot(honeypotValue: string): boolean {
    // Wenn Honeypot-Feld ausgefüllt ist = Bot
    return honeypotValue === '' || honeypotValue === undefined;
  }
  
  // Timing-Validierung
  static startLoginTimer(sessionId: string): void {
    this.loginStartTimes.set(sessionId, Date.now());
  }
  
  static validateLoginTiming(sessionId: string): boolean {
    const startTime = this.loginStartTimes.get(sessionId);
    if (!startTime) return true; // Kein Timer = OK
    
    const duration = Date.now() - startTime;
    this.loginStartTimes.delete(sessionId);
    
    // Zu schnell (< 2 Sekunden) = verdächtig
    // Zu langsam (> 10 Minuten) = Timeout
    return duration >= 2000 && duration <= 600000;
  }
  
  // Einfache mathematische Aufgabe (nur bei verdächtigen IPs)
  static generateSimpleMath(): { question: string, answer: number } {
    const a = Math.floor(Math.random() * 10) + 1;
    const b = Math.floor(Math.random() * 10) + 1;
    return {
      question: `${a} + ${b} = ?`,
      answer: a + b
    };
  }
  
  static validateMathAnswer(userAnswer: string, correctAnswer: number): boolean {
    return parseInt(userAnswer) === correctAnswer;
  }
}