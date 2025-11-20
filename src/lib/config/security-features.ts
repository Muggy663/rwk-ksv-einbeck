/**
 * Security Features Configuration
 * Zentrale Konfiguration für Sicherheitsfeatures
 */

export const SECURITY_FEATURES = {
  RATE_LIMITING: true,
  BOT_PROTECTION: true,
  SAFE_LOGGING: true,
  RECAPTCHA: process.env.NODE_ENV === 'production',
  CSRF_PROTECTION: true,
  XSS_PROTECTION: true,
  INPUT_VALIDATION: true,
  SECURE_HEADERS: true
};
