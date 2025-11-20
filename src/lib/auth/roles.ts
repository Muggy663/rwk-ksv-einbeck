// src/lib/auth/roles.ts
// Vollständiges Rollen-System für alle Nutzertypen

export type PlatformRole = 
  | 'SUPER_ADMIN'      // Entwickler/Betreiber - Vollzugriff
  | 'SYSTEM_ADMIN'     // System-Administration
  | 'DATA_MANAGER';    // Daten-Import/Export

export type KvRole = 
  | 'KV_WETTKAMPFLEITER'  // Vollzugriff RWK & KM
  | 'KV_KM_ORGA'          // KM-Vollzugriff
  | 'KV_PRESSEWART'       // News schreiben
  | 'KV_KAMPFRICHTER';    // KM-Ergebnisse

export type ClubRole = 
  | 'SPORTLEITER'      // RWK/KM Vollzugriff
  | 'MANNSCHAFTSFUEHRER'; // Ergebnisse eingeben

// Nutzertypen für Schießnachweis
export type UserType = 
  | 'CLUB_MEMBER'      // Vereinsmitglied (hat Club-Rolle)
  | 'INDIVIDUAL'       // Einzelschütze (nur Schießnachweis)
  | 'GUEST';           // Gast (nur öffentliche Bereiche)

// Legacy-Rollen (für Übergangszeit)
export type LegacyRole = 
  | 'vereinsvertreter'
  | 'vereinsvorstand'
  | 'mannschaftsfuehrer'
  | 'km_orga';  // Wird zu KV_KM_ORGA migriert

// Zugriffslevel für verschiedene Bereiche
export interface AccessLevels {
  rwk: boolean;           // RWK-Tabellen ansehen
  km: boolean;            // KM-Bereiche ansehen
  schiessnachweis: boolean; // Schießnachweis nutzen
  premiumFeatures: boolean; // Premium-Features
  vereinssoftware: boolean; // Vereinssoftware
  admin: boolean;         // Admin-Bereiche
}

export const getAccessLevels = (permissions: UserPermissions, clubId?: string): AccessLevels => {
  return {
    rwk: canAccessRWK(permissions),
    km: canAccessKM(permissions),
    schiessnachweis: canAccessSchiessnachweis(permissions),
    premiumFeatures: canAccessPremiumFeatures(permissions),
    vereinssoftware: clubId ? canAccessVereinssoftware(permissions, clubId) : false,
    admin: permissions.platformRole === 'SUPER_ADMIN'
  };
};

export interface UserPermissions {
  // Neue Struktur
  platformRole?: PlatformRole;
  kvRoles?: Record<string, KvRole>;     // { 'kvId': 'KV_WETTKAMPFLEITER' }
  clubRoles?: Record<string, ClubRole>; // { 'clubId': 'SPORTLEITER' }
  
  // Nutzertyp
  userType: UserType;
  
  // Premium-Status (für Schießnachweis)
  isPremium?: boolean;
  premiumUntil?: Date;
  
  // Legacy (für Migration)
  role?: LegacyRole;
  clubId?: string;
  assignedClubId?: string;
  
  // Meta
  uid: string;
  email?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Berechtigungsprüfungen
export const hasClubAccess = (permissions: UserPermissions, clubId: string): boolean => {
  if (permissions.platformRole === 'SUPER_ADMIN') return true;
  if (permissions.clubRoles?.[clubId]) return true;
  
  // Legacy-Support
  if (permissions.role === 'vereinsvertreter' && 
      (permissions.clubId === clubId || permissions.assignedClubId === clubId)) {
    return true;
  }
  
  return false;
};

export const hasClubRole = (permissions: UserPermissions, clubId: string, role: ClubRole): boolean => {
  if (permissions.platformRole === 'SUPER_ADMIN') return true;
  return permissions.clubRoles?.[clubId] === role;
};

export const canDeleteShooter = (permissions: UserPermissions, shooterClubId: string): boolean => {
  if (permissions.platformRole === 'SUPER_ADMIN') return true;
  
  // Neue Rollen
  const clubRole = permissions.clubRoles?.[shooterClubId];
  if (clubRole && ['VORSTAND', 'SPORTLEITER'].includes(clubRole)) return true;
  
  // Legacy
  if (permissions.role === 'vereinsvertreter' && 
      (permissions.clubId === shooterClubId || permissions.assignedClubId === shooterClubId)) {
    return true;
  }
  
  return false;
};

export const canAccessVereinssoftware = (permissions: UserPermissions, clubId: string): boolean => {
  if (permissions.platformRole === 'SUPER_ADMIN') return true;
  
  // Neue Rollen - alle Club-Rollen haben Zugriff
  if (permissions.clubRoles?.[clubId]) return true;
  
  // Legacy
  if (permissions.role === 'vereinsvertreter' && 
      (permissions.clubId === clubId || permissions.assignedClubId === clubId)) {
    return true;
  }
  
  return false;
};

// RWK/KM Zugriffskontrolle
export const canAccessRWK = (permissions: UserPermissions): boolean => {
  if (permissions.platformRole === 'SUPER_ADMIN') return true;
  if (permissions.kvRoles && Object.keys(permissions.kvRoles).length > 0) return true;
  if (permissions.clubRoles && Object.keys(permissions.clubRoles).length > 0) return true;
  if (permissions.role === 'vereinsvertreter') return true;
  return false;
};

export const canAccessKM = (permissions: UserPermissions): boolean => {
  if (permissions.platformRole === 'SUPER_ADMIN') return true;
  if (permissions.kvRoles && Object.keys(permissions.kvRoles).length > 0) return true;
  if (permissions.clubRoles && Object.keys(permissions.clubRoles).length > 0) return true;
  if (permissions.role === 'vereinsvertreter') return true;
  return false;
};

// Schießnachweis Zugriffskontrolle
export const canAccessSchiessnachweis = (permissions: UserPermissions): boolean => {
  // Alle registrierten Nutzer können Schießnachweis nutzen
  return permissions.userType !== 'GUEST';
};

export const canAccessPremiumFeatures = (permissions: UserPermissions): boolean => {
  if (permissions.platformRole === 'SUPER_ADMIN') return true;
  if (!permissions.isPremium) return false;
  if (permissions.premiumUntil && permissions.premiumUntil < new Date()) return false;
  return true;
};

// Nutzertyp bestimmen
export const determineUserType = (permissions: UserPermissions): UserType => {
  if (permissions.clubRoles && Object.keys(permissions.clubRoles).length > 0) {
    return 'CLUB_MEMBER';
  }
  if (permissions.kvRoles && Object.keys(permissions.kvRoles).length > 0) {
    return 'CLUB_MEMBER'; // KV-Rollen sind auch Vereinsmitglieder
  }
  if (permissions.role === 'vereinsvertreter') {
    return 'CLUB_MEMBER'; // Legacy
  }
  return 'INDIVIDUAL';
};
