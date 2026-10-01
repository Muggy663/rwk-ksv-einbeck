// src/app/km-orga/startlisten/_lib/startlisten-positionen.ts
// Pure Berechnungslogik für Startlisten-Positionen (Stand, Startzeit, Durchgang).
// Bewusst ohne React/Firebase, damit die Logik isoliert testbar ist.

/** Die für die Positionsberechnung relevanten Teile einer Startlisten-Konfiguration. */
export interface PositionsKonfiguration {
  /** Verfügbare Stände, z. B. [1,2,3,4,5,6]. */
  staende?: number[];
  /** Dauer eines Durchgangs in Minuten. */
  durchgang?: number;
  /** Wechselzeit zwischen zwei Durchgängen in Minuten. */
  wechsel?: number;
  /** Startzeit des ersten Durchgangs im Format "HH:MM". */
  startzeit?: string;
}

/** Ein Starter mit den Feldern, die bei der Positionsberechnung gesetzt werden. */
export interface PositionsStarter {
  stand?: string | number;
  startzeit?: string;
  durchgang?: number;
  [key: string]: any;
}

// Defaults entsprechen dem bisherigen Verhalten der v2-Übersicht.
const DEFAULT_STAENDE = [1, 2, 3, 4, 5, 6, 7, 8, 9];
const DEFAULT_DURCHGANG_MIN = 50;
const DEFAULT_WECHSEL_MIN = 10;
const DEFAULT_STARTZEIT = '14:00';

/**
 * Formatiert einen Minuten-Offset ab der Startzeit als "HH:MM" (24h, deutsche Notation).
 * Reine Zeitarithmetik ohne Datum, damit zeitzonenunabhängig.
 */
function formatStartzeit(startzeit: string, minutesOffset: number): string {
  const [hStr, mStr] = (startzeit || DEFAULT_STARTZEIT).split(':');
  const basisMinuten = (parseInt(hStr, 10) || 0) * 60 + (parseInt(mStr, 10) || 0);
  const gesamt = basisMinuten + minutesOffset;
  // Auf 24h begrenzen (falls die Startliste über Mitternacht hinausginge).
  const normalisiert = ((gesamt % (24 * 60)) + 24 * 60) % (24 * 60);
  const stunden = Math.floor(normalisiert / 60);
  const minuten = normalisiert % 60;
  return `${String(stunden).padStart(2, '0')}:${String(minuten).padStart(2, '0')}`;
}

/**
 * Verteilt die Starter in Reihenfolge auf die konfigurierten Stände und berechnet
 * für jeden Starter Stand, Durchgangsnummer und Startzeit.
 *
 * Regel: Die ersten `maxStaende` Starter bilden Durchgang 1 (verteilt auf die
 * Stände in gegebener Reihenfolge), die nächsten `maxStaende` Durchgang 2 usw.
 * Jeder weitere Durchgang startet um (durchgang + wechsel) Minuten später.
 *
 * Verändert das übergebene Array nicht (gibt neue Objekte zurück).
 */
export function recalculateAllPositions<T extends PositionsStarter>(
  startliste: T[],
  konfiguration?: PositionsKonfiguration | null
): T[] {
  const konfigurierteStaende =
    konfiguration?.staende && konfiguration.staende.length > 0
      ? konfiguration.staende
      : DEFAULT_STAENDE;
  const maxStaende = konfigurierteStaende.length;
  const durchgangMin = konfiguration?.durchgang ?? DEFAULT_DURCHGANG_MIN;
  const wechselMin = konfiguration?.wechsel ?? DEFAULT_WECHSEL_MIN;
  const startzeit = konfiguration?.startzeit || DEFAULT_STARTZEIT;

  return startliste.map((starter, index) => {
    const durchgangNr = Math.floor(index / maxStaende) + 1;
    const standNr = konfigurierteStaende[index % maxStaende];
    const minutesOffset = (durchgangNr - 1) * (durchgangMin + wechselMin);

    return {
      ...starter,
      stand: standNr.toString(),
      startzeit: formatStartzeit(startzeit, minutesOffset),
      durchgang: durchgangNr,
    };
  });
}
