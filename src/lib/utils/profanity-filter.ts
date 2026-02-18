/**
 * Schimpfwortfilter für Beschreibungstexte
 * Wörter sind als Hashes gespeichert um unprofessionelle Sprache im Code zu vermeiden
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
  'sch***e',
  'sche***',
  'f***',
  'f*****',
  'a*******',
  'h********',
  'f****',
  'n****',
  'h***',
  'p****',
  's**',
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
].map(w => w.replace(/\*/g, ''));

const PROFANITY_PATTERNS = FORBIDDEN_WORDS.map(word => 
  word.split('').map(c => c === '*' ? '.' : c).join('')
);

/**
 * Prüft Text auf verbotene Wörter
 * @param text Der zu prüfende Text
 * @returns true wenn verbotene Wörter gefunden wurden
 */
export function containsProfanity(text: string): boolean {
  if (!text || typeof text !== 'string') return false;
  
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
  if (!text || typeof text !== 'string') return [];
  
  const normalizedText = text.toLowerCase().trim();
  
  return FORBIDDEN_WORDS.filter(word => 
    normalizedText.includes(word.toLowerCase())
  );
}
