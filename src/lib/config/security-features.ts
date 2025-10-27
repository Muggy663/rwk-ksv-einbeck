// Security Feature Flags für schrittweise Aktivierung
export const SECURITY_FEATURES = {
  RATE_LIMITING: process.env.NEXT_PUBLIC_ENABLE_RATE_LIMITING === 'true',
  SESSION_TIMEOUT: process.env.NEXT_PUBLIC_ENABLE_SESSION_TIMEOUT === 'true',
  UPLOAD_LIMITS: process.env.NEXT_PUBLIC_ENABLE_UPLOAD_LIMITS === 'true',
  SAFE_LOGGING: process.env.NEXT_PUBLIC_ENABLE_SAFE_LOGGING === 'true',
  SECURITY_HEADERS: process.env.NEXT_PUBLIC_ENABLE_SECURITY_HEADERS === 'true',
  BOT_PROTECTION: process.env.NEXT_PUBLIC_ENABLE_BOT_PROTECTION === 'true'
} as const;

// Helper für Feature-Check
export function isSecurityFeatureEnabled(feature: keyof typeof SECURITY_FEATURES): boolean {
  return SECURITY_FEATURES[feature] || false;
}