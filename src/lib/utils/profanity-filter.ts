/**
 * Schimpfwortfilter für Beschreibungstexte
 */

const FORBIDDEN_WORDS = [
  'drogen',
  'droge',
  'kokain',
  'heroin',
  'cannabis',
  'marihuana',
  'ecstasy',
  'lsd',
  'amphetamin',
  'methamphetamin',
  'crystal',
  'crack',
  'scheiße',
  'scheiss',
  'fuck',
  'ficken',
  'arschloch',
  'hurensohn',
  'fotze',
  'nutte',
  'hure',
  'porno',
  'sex',
  'nazi',
  'hitler',
  'holocaust',
  'terror',
  'bomb',
  'waffe',
  'gewalt',
  'mord',
  'töten',
  'kill',
  'suicide',
  'selbstmord'
];

/**
 * Prüft Text auf verbotene Wörter
 * @param text Der zu prüfende Text
 * @returns true wenn verbotene Wörter gefunden wurden
 */
export function containsProfanity(text: string): boolean {
  if (!text) return false;
  
  const normalizedText = text.toLowerCase().trim();
  
  return FORBIDDEN_WORDS.some(word => 
    normalizedText.includes(word.toLowerCase())
  );
}

/**
 * Gibt die gefundenen verbotenen Wörter zurück
 * @param text Der zu prüfende Text
 * @returns Array der gefundenen verbotenen Wörter
 */
export function findProfanity(text: string): string[] {
  if (!text) return [];
  
  const normalizedText = text.toLowerCase().trim();
  
  return FORBIDDEN_WORDS.filter(word => 
    normalizedText.includes(word.toLowerCase())
  );
}
