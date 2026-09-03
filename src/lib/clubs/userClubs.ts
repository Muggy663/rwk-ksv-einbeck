// src/lib/clubs/userClubs.ts
// Einzige, zentrale Ableitung der einem Nutzer zugeordneten Vereine.
// Ersetzt die zuvor divergierenden Logiken in verein/layout, ClubContext,
// club-selection, useKMAuth und memberPermissions.
//
// Priorität (bewusst einheitlich):
//   1. representedClubs (explizite Mehrfachzuordnung, z.B. KM-Zugang)
//   2. Object.keys(clubRoles) (rollenbasierte Vereinszuordnung)
//   3. clubIds
//   4. clubId (Einzelverein / Legacy)

export interface UserClubSource {
  clubId?: string | null;
  clubIds?: string[];
  representedClubs?: string[];
  clubRoles?: Record<string, string>;
}

/**
 * Liefert die eindeutige, deduplizierte Liste der Vereins-IDs eines Nutzers.
 * Reihenfolge bleibt stabil (erste Quelle zuerst).
 */
export function deriveUserClubIds(p: UserClubSource | null | undefined): string[] {
  if (!p) return [];

  let ids: string[] = [];

  if (p.representedClubs && p.representedClubs.length > 0) {
    ids = [...p.representedClubs];
  } else if (p.clubRoles && Object.keys(p.clubRoles).length > 0) {
    ids = Object.keys(p.clubRoles);
  } else if (p.clubIds && p.clubIds.length > 0) {
    ids = [...p.clubIds];
  } else if (p.clubId && typeof p.clubId === 'string' && p.clubId.trim() !== '') {
    ids = [p.clubId];
  }

  // Deduplizieren + leere Werte entfernen, Reihenfolge bewahren.
  return Array.from(new Set(ids.filter((id) => id && id.trim() !== '')));
}
