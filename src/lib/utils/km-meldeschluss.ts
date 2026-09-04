// src/lib/utils/km-meldeschluss.ts
// Zentrale Logik rund um den KM-Meldeschluss.
// Ersetzt die zuvor mehrfach duplizierte Parsing-/Ablauf-/Sortier-Logik,
// damit alle KM-Seiten den Meldeschluss identisch behandeln.

export interface SaisonLike {
  id?: string;
  name?: string;
  jahr?: number;
  meldeschluss?: string; // "01.11.2025" (vollständig) oder "15.12." (Tag.Monat.)
  disziplinTyp?: string;
  [key: string]: any;
}

/**
 * Parst einen Meldeschluss-String in ein Date.
 * Unterstützt "DD.MM.YYYY" und "DD.MM." (dann aktuelles Jahr).
 * Gibt null zurück, wenn kein/kein gültiger Meldeschluss vorliegt.
 */
export function parseMeldeschluss(meldeschluss?: string | null): Date | null {
  if (!meldeschluss || typeof meldeschluss !== 'string') return null;

  // ISO-Format "YYYY-MM-DD" (z. B. RWK-Meldeschluss aus der Saisonverwaltung)
  const iso = meldeschluss.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) {
    const [, jahrStr, monatStr, tagStr] = iso;
    return new Date(parseInt(jahrStr, 10), parseInt(monatStr, 10) - 1, parseInt(tagStr, 10), 23, 59, 59, 999);
  }

  const teile = meldeschluss.split('.').map((t) => t.trim()).filter((t) => t !== '');
  if (teile.length < 2) return null;

  const tag = parseInt(teile[0], 10);
  const monat = parseInt(teile[1], 10);
  if (isNaN(tag) || isNaN(monat)) return null;

  const jahr = teile.length >= 3 && teile[2] ? parseInt(teile[2], 10) : new Date().getFullYear();
  if (isNaN(jahr)) return null;

  // Ende des Meldeschluss-Tags (23:59:59), damit der Tag selbst noch gültig ist.
  return new Date(jahr, monat - 1, tag, 23, 59, 59, 999);
}

/**
 * Prüft, ob der Meldeschluss einer Saison abgelaufen ist.
 * Ohne (gültigen) Meldeschluss gilt: nicht abgelaufen.
 */
export function istMeldeschlussAbgelaufen(saison: SaisonLike | null | undefined, jetzt: Date = new Date()): boolean {
  const deadline = parseMeldeschluss(saison?.meldeschluss);
  if (!deadline) return false;
  return jetzt.getTime() > deadline.getTime();
}

/**
 * Sortiert Saisons: aktive (Meldeschluss offen) zuerst, dann nach Jahr absteigend,
 * zuletzt alphabetisch nach Name. Verändert das übergebene Array nicht.
 */
export function sortiereSaisons<T extends SaisonLike>(saisons: T[], jetzt: Date = new Date()): T[] {
  return [...saisons].sort((a, b) => {
    const aAbgelaufen = istMeldeschlussAbgelaufen(a, jetzt);
    const bAbgelaufen = istMeldeschlussAbgelaufen(b, jetzt);
    if (aAbgelaufen !== bAbgelaufen) return aAbgelaufen ? 1 : -1; // aktive zuerst
    const jahrDiff = (b.jahr || 0) - (a.jahr || 0);
    if (jahrDiff !== 0) return jahrDiff;
    return (a.name || '').localeCompare(b.name || '');
  });
}

/**
 * Anzeigetext für eine Saison im Dropdown, inkl. Disziplin-Typ und
 * optionalem Hinweis, wenn der Meldeschluss vorbei ist.
 */
export function saisonAnzeigeText(saison: SaisonLike, jetzt: Date = new Date()): string {
  const basis = saison.disziplinTyp ? `${saison.name} (${saison.disziplinTyp})` : (saison.name || 'Saison');
  return istMeldeschlussAbgelaufen(saison, jetzt) ? `${basis} — Meldeschluss vorbei` : basis;
}
