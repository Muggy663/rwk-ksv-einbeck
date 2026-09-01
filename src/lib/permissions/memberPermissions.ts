// src/lib/permissions/memberPermissions.ts
// Zentrale Rechte-Logik für die Mitgliederverwaltung (RWK + KM).
// Bewusst unabhängig von der bekannten useKMAuth-Schwäche (hasKMAccess endet mit "|| true").
// Der Server (getServerMemberPermissions) ist für die Autorisierung maßgeblich;
// die Client-Variante (getMemberPermissions) steuert nur die UI-Sichtbarkeit.

export type MemberRole = 'admin' | 'km_orga' | 'sportleiter' | 'mannschaftsfuehrer' | 'none';

export interface MemberPermissions {
  role: MemberRole;
  canViewMembers: boolean; // Admin, KM-Orga, Sportleiter
  canEdit: boolean; // Admin, KM-Orga, Sportleiter (für erlaubte Vereine)
  canViewAllClubs: boolean; // Admin, KM-Orga
  allowedClubIds: string[]; // relevant nur wenn canViewAllClubs === false
}

// Minimale Form der Berechtigungsdaten, wie sie sowohl im Client-AuthContext
// als auch serverseitig im user_permissions-Dokument vorliegen.
export interface PermissionSource {
  email?: string | null;
  role?: string | null;
  roles?: string[];
  clubId?: string | null;
  clubIds?: string[];
  representedClubs?: string[];
  platformRole?: string;
  kvRoles?: Record<string, string>;
  clubRoles?: Record<string, string>;
}

const ADMIN_EMAIL = 'admin@rwk-einbeck.de';
const KM_ORGA_EMAIL = 'stephanie.buenger@gmx.de';

function values(obj?: Record<string, string>): string[] {
  return obj ? Object.values(obj) : [];
}

/**
 * Leitet die konkreten Mitglieder-Rechte aus den Berechtigungsdaten ab.
 * Reine Funktion – für Client und Server identisch nutzbar.
 */
export function derivePermissions(
  p: PermissionSource | null | undefined,
  email?: string | null
): MemberPermissions {
  const mail = (email ?? p?.email ?? '').toLowerCase();
  const clubRoleList = values(p?.clubRoles);
  const kvRoleList = values(p?.kvRoles);

  const isAdmin =
    mail === ADMIN_EMAIL ||
    p?.platformRole === 'SUPER_ADMIN' ||
    p?.role === 'superadmin';

  const isKmOrga =
    !isAdmin &&
    (mail === KM_ORGA_EMAIL ||
      kvRoleList.includes('KV_KM_ORGA') ||
      kvRoleList.includes('KV_WETTKAMPFLEITER') ||
      p?.role === 'km_organisator');

  const isSportleiter = !isAdmin && !isKmOrga && clubRoleList.includes('SPORTLEITER');

  const isMannschaftsfuehrer =
    !isAdmin &&
    !isKmOrga &&
    !isSportleiter &&
    (clubRoleList.includes('MANNSCHAFTSFUEHRER') || p?.role === 'mannschaftsfuehrer');

  // Zugeordnete Vereine (nur für Sportleiter relevant)
  const allowedClubIds: string[] = (() => {
    if (p?.representedClubs && p.representedClubs.length) return [...p.representedClubs];
    const clubRoleKeys = p?.clubRoles ? Object.keys(p.clubRoles) : [];
    if (clubRoleKeys.length) return clubRoleKeys;
    if (p?.clubIds && p.clubIds.length) return [...p.clubIds];
    if (p?.clubId) return [p.clubId];
    return [];
  })();

  if (isAdmin || isKmOrga) {
    return {
      role: isAdmin ? 'admin' : 'km_orga',
      canViewMembers: true,
      canEdit: true,
      canViewAllClubs: true,
      allowedClubIds: [],
    };
  }

  if (isSportleiter) {
    return {
      role: 'sportleiter',
      canViewMembers: true,
      canEdit: true,
      canViewAllClubs: false,
      allowedClubIds,
    };
  }

  if (isMannschaftsfuehrer) {
    return {
      role: 'mannschaftsfuehrer',
      canViewMembers: false,
      canEdit: false,
      canViewAllClubs: false,
      allowedClubIds: [],
    };
  }

  return {
    role: 'none',
    canViewMembers: false,
    canEdit: false,
    canViewAllClubs: false,
    allowedClubIds: [],
  };
}

/**
 * Client-Variante: nimmt userAppPermissions aus dem AuthContext + Login-Email.
 */
export function getMemberPermissions(
  userAppPermissions: PermissionSource | null | undefined,
  email?: string | null
): MemberPermissions {
  return derivePermissions(userAppPermissions, email);
}

/**
 * Prüft, ob ein bestimmter Verein für die gegebenen Rechte erlaubt ist.
 */
export function isClubAllowed(perms: MemberPermissions, clubId: string | null | undefined): boolean {
  if (perms.canViewAllClubs) return true;
  if (!clubId) return false;
  return perms.allowedClubIds.includes(clubId);
}
