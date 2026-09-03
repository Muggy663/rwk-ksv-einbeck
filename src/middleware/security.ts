/**
 * Sicherheits-Middleware für RWK Einbeck App
 * Implementiert Security Headers und Rate Limiting
 */

import { NextRequest, NextResponse } from 'next/server';
import { logError, logWarn } from '@/lib/utils/secure-logger';

export function securityMiddleware(_request: NextRequest) {
  try {
    const response = NextResponse.next();
    
    // Security Headers setzen
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    
    // CSP Header für XSS-Schutz
    const cspHeader = [
      "default-src 'self'",
      // amazonq-ignore-next-line
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.google.com https://www.gstatic.com https://apis.google.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' data: https://fonts.gstatic.com",
      "img-src 'self' data: blob: https:",
      "connect-src 'self' https://*.googleapis.com https://*.google.com https://*.firebaseio.com https://*.firebaseapp.com https://firebase.googleapis.com https://firebasestorage.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://fcmregistrations.googleapis.com https://generativelanguage.googleapis.com https://api.gemini.google.com https://vision.googleapis.com https://resend.com https://sentry.io https://*.sentry.io wss://*.firebaseio.com",
      "frame-src 'self' https://www.google.com https://*.firebaseapp.com",
      "worker-src 'self' blob:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'"
    ].join('; ');
    
    try {
      response.headers.set('Content-Security-Policy', cspHeader);
    } catch (error) {
      logWarn('Fehler beim Setzen des CSP Headers', { error });
    }
    
    return response;
  } catch (error) {
    logError('Security middleware error:', error);
    return NextResponse.next();
  }
}

/**
 * Rate Limiting für API-Endpunkte
 */
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();
const MAX_RATE_LIMIT_ENTRIES = 10000;

export function rateLimit(ip: string, limit: number = 100, windowMs: number = 60000): boolean {
  try {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    const record = rateLimitMap.get(ip);
    
    if (!record || record.lastReset < windowStart) {
      if (rateLimitMap.size >= MAX_RATE_LIMIT_ENTRIES) {
        const oldestKey = Array.from(rateLimitMap.entries())
          .sort((a, b) => a[1].lastReset - b[1].lastReset)[0][0];
        rateLimitMap.delete(oldestKey);
      }
      rateLimitMap.set(ip, { count: 1, lastReset: now });
      return true;
    }
    
    if (record.count >= limit) {
      return false;
    }
    
    record.count++;
    return true;
  } catch (error) {
    logWarn('Rate limit check failed', { error, ip });
    return true;
  }
}

/**
 * Bot-Schutz durch User-Agent-Analyse
 */
const suspiciousPatterns = [
  /bot/i,
  /crawler/i,
  /spider/i,
  /scraper/i,
  /curl/i,
  /wget/i,
  /python/i,
  /java/i
];

export function isSuspiciousBot(userAgent: string): boolean {
  if (!userAgent) return true;
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(userAgent)) return true;
  }
  return false;
}
