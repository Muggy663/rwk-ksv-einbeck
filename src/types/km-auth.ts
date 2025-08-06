// src/types/km-auth.ts - KM-spezifische Benutzerrollen

export interface KMUserPermission {
  uid: string;
  email: string;
  displayName?: string;
  role: 'km_admin' | 'km_organizer' | 'verein_vertreter';
  clubId?: string; // Für Vereinsvertreter (einzelner Verein)
  clubIds?: string[]; // Für Multi-Verein-Verwaltung
  isActive: boolean;
  createdAt: Date;
  lastLogin?: Date;
}

export const KM_ROLES = {
  KM_ADMIN: 'km_admin',           // Vollzugriff KM + RWK
  KM_ORGANIZER: 'km_organizer',   // Nur KM-Admin-Bereich
  VEREIN_VERTRETER: 'verein_vertreter' // Nur eigene Meldungen
} as const;
