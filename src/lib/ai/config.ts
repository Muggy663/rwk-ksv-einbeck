// src/lib/ai/config.ts
// Zentrale AI-Konfiguration — bei Modell-Updates nur hier ändern

export const AI_CONFIG = {
  /** Gemini Model Version — z.B. 'gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-3.0-flash' */
  model: 'gemini-2.5-flash',
  /** Maximale Bildgröße für OCR in Bytes (5MB) */
  maxImageSize: 5 * 1024 * 1024,
};
