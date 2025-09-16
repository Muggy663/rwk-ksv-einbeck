// src/hooks/useClubPermissions.ts
import { useAuthContext } from '@/components/auth/AuthContext';
import { useClubId } from '@/hooks/useClubId';

export type ClubRole = 'SPORTLEITER' | 'VORSTAND' | 'KASSENWART' | 'SCHRIFTFUEHRER' | 'JUGENDWART' | 'DAMENWART' | 'ZEUGWART' | 'PRESSEWART' | 'TRAINER' | 'AUSBILDER' | 'VEREINSSCHUETZE' | 'EHRENMITGLIED';

// Helper function for consistent license checking
const hasValidLicense = (licenseValue: any): boolean => {
  return licenseValue === true || licenseValue === 'true' || licenseValue === 1 || licenseValue === '1';
};

export function useClubPermissions() {
  const { user, userAppPermissions } = useAuthContext();
  const { clubId } = useClubId();
  const activeClubId = clubId;

  // Superadmin hat immer Zugriff
  const isSuperAdmin = user?.email === 'admin@rwk-einbeck.de' || userAppPermissions?.role === 'superadmin';

  // Club-Rollen prüfen
  const clubRoles = userAppPermissions?.clubRoles || {};
  const userClubRole = activeClubId ? clubRoles[activeClubId] : null;

  // Berechtigungsprüfung
  const hasClubRole = (allowedRoles: ClubRole[]): boolean => {
    if (isSuperAdmin) return true;
    return userClubRole ? allowedRoles.includes(userClubRole as ClubRole) : false;
  };

  // Spezifische Berechtigungen
  const canAccessFinances = hasClubRole(['VORSTAND', 'KASSENWART']);
  const canAccessMembers = hasClubRole(['VORSTAND', 'KASSENWART', 'SCHRIFTFUEHRER', 'SPORTLEITER']);
  const canAccessProtocols = hasClubRole(['VORSTAND', 'SCHRIFTFUEHRER']);
  const canAccessTasks = hasClubRole(['VORSTAND']);
  const canAccessLicenses = hasClubRole(['VORSTAND', 'TRAINER', 'AUSBILDER']);
  const canAccessJubilees = hasClubRole(['VORSTAND', 'SCHRIFTFUEHRER']);

  // Vereinssoftware-Lizenz prüfen (Kaufprodukt) - konsistente Prüfung
  const hasVereinssoftwareLicense = hasValidLicense(userAppPermissions?.vereinssoftwareLicense);
  
  // Allgemeiner Vereinssoftware-Zugriff (nur mit Lizenz)
  const canAccessClubArea = () => {
    return (isSuperAdmin || hasVereinssoftwareLicense) && 
           (hasClubRole(['SPORTLEITER', 'VORSTAND', 'KASSENWART', 'SCHRIFTFUEHRER']) ||
            userAppPermissions?.role === 'vereinsvertreter' || 
            userAppPermissions?.role === 'vereinsvorstand');
  };

  return {
    isSuperAdmin,
    userClubRole,
    hasClubRole,
    hasVereinssoftwareLicense,
    canAccessFinances,
    canAccessMembers,
    canAccessProtocols,
    canAccessTasks,
    canAccessLicenses,
    canAccessJubilees,
    canAccessClubArea,
    // Legacy-Support
    hasLegacyAccess: userAppPermissions?.role === 'vereinsvertreter' || userAppPermissions?.role === 'vereinsvorstand'
  };
}