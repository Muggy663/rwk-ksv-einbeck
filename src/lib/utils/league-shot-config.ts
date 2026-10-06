import type { FirestoreLeagueSpecificDiscipline, League } from '@/types/rwk';
import { getDisciplineCategory } from '@/types/rwk';

/**
 * Auflösung der Schuss-/Ring-Konfiguration einer Liga.
 *
 * EINE zentrale Quelle für "wie viele Ringe sind maximal gültig" und "wie viele
 * Schuss werden geschossen". Wird sowohl bei der Ergebnis-Validierung als auch in
 * der Admin-Seite /admin/league-settings genutzt, damit es keinen Drift gibt.
 */
export interface LeagueShotConfig {
  /** Maximal gültige Ringzahl (obere Validierungsgrenze beim Ergebnis-Eintragen). */
  maxRings: number;
  /** Anzahl der Schuss im Wettkampf. */
  shotCount: number;
}

/**
 * Default-Konfiguration je Disziplin-Gruppe (KK vs. LG). Greift nur, wenn eine
 * Liga (noch) keine eigenen shotSettings hat.
 *
 * - LG-Gruppe (LG/LGA/LGS/LP/LPA/LD): 40 Schuss, max. 400 Ringe
 * - KK-Gruppe (KK/KKP/KKG):           30 Schuss, max. 300 Ringe
 */
const DEFAULTS_BY_CATEGORY: Record<string, LeagueShotConfig> = {
  LG: { maxRings: 400, shotCount: 40 },
  KK: { maxRings: 300, shotCount: 30 },
};

/**
 * Absolut sicherer Fallback, falls weder shotSettings noch eine bekannte
 * Disziplin-Gruppe vorliegen. Bewusst großzügig (600), damit niemals ein
 * gültiges Ergebnis fälschlich blockiert wird. Firestore-Rule (<=600) bleibt
 * als Backstop bestehen.
 */
const SAFE_FALLBACK: LeagueShotConfig = { maxRings: 600, shotCount: 40 };

/**
 * Liefert die wirksame Schuss-/Ring-Konfiguration einer Liga.
 *
 * Fallback-Kette (in dieser Reihenfolge):
 *  1. league.shotSettings (vom Admin konfiguriert) — sofern plausibel (>0)
 *  2. Default je Disziplin-Gruppe (via getDisciplineCategory)
 *  3. SAFE_FALLBACK (maxRings 600 / shotCount 40)
 *
 * Pur und ohne Seiteneffekte, damit testbar.
 */
export function getLeagueShotConfig(
  league?: Pick<League, 'type' | 'shotSettings'> | null,
): LeagueShotConfig {
  const settings = league?.shotSettings;

  const configuredMax =
    typeof settings?.maxRings === 'number' && settings.maxRings > 0
      ? settings.maxRings
      : undefined;
  const configuredShots =
    typeof settings?.shotCount === 'number' && settings.shotCount > 0
      ? settings.shotCount
      : undefined;

  // Default je Disziplin-Gruppe als Zwischenstufe bestimmen.
  const category = getDisciplineCategory(league?.type);
  const categoryDefault = category ? DEFAULTS_BY_CATEGORY[category] : undefined;

  const maxRings =
    configuredMax ?? categoryDefault?.maxRings ?? SAFE_FALLBACK.maxRings;
  const shotCount =
    configuredShots ?? categoryDefault?.shotCount ?? SAFE_FALLBACK.shotCount;

  return { maxRings, shotCount };
}

/**
 * Liefert nur die Default-Konfiguration je league.type (ohne vorhandene
 * shotSettings zu berücksichtigen). Nützlich in der Admin-Seite, um bei Ligen
 * ohne shotSettings einen sinnvollen Vorschlag vorzubelegen.
 */
export function getDefaultShotConfigForType(
  type?: FirestoreLeagueSpecificDiscipline,
): LeagueShotConfig {
  const category = getDisciplineCategory(type);
  const categoryDefault = category ? DEFAULTS_BY_CATEGORY[category] : undefined;
  return categoryDefault ?? SAFE_FALLBACK;
}
