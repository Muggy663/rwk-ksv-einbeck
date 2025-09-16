// src/lib/auth/roles.ts
// Neue 3-Ebenen-Rollen-Architektur für Wartungsarbeiten 15.09.2025

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
  | 'VORSTAND'         // Vollzugriff alle Module
  | 'SPORTLEITER'      // RWK/KM-Meldungen
  | 'KASSENWART'       // Finanzen & Mitglieder
  | 'SCHRIFTFUEHRER'   // Protokolle & Mitglieder-Lesezugriff
  | 'JUGENDWART'       // Jugend-Mitglieder
  | 'DAMENWART'        // Damen-Events
  | 'ZEUGWART'         // Waffen & Inventar
  | 'PRESSEWART'       // Vereins-News
  | 'TRAINER'          // Ausbildungen
  | 'AUSBILDER'        // Fortgeschrittene Schulungen
  | 'VEREINSSCHUETZE'  // Basis-Mitglied
  | 'EHRENMITGLIED';   // Lesezugriff Geschichte

// Legacy-Rollen (für Übergangszeit)
export type LegacyRole = 
  | 'vereinsvertreter'
  | 'vereinsvorstand'
  | 'mannschaftsfuehrer'
  | 'km_orga';

export interface UserPermissions {
  // Neue Struktur
  platformRole?: PlatformRole;
  kvRoles?: Record<string, KvRole>;     // { 'kvId': 'KV_WETTKAMPFLEITER' }
  clubRoles?: Record<string, ClubRole>; // { 'clubId': 'SPORTLEITER' }
  
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