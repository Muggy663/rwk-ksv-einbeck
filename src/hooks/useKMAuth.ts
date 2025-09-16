// src/hooks/useKMAuth.ts
import { useState, useEffect } from 'react';
import { useAuthContext } from '@/components/auth/AuthContext';

export function useKMAuth() {
  const { user, loading: authLoading, userAppPermissions } = useAuthContext();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      setLoading(false);
    }
  }, [authLoading]);

  // Neue 3-Ebenen-Rollen-System
  const clubRoles = userAppPermissions?.clubRoles || {};
  const kvRoles = userAppPermissions?.kvRoles || {};
  const platformRole = userAppPermissions?.platformRole;
  
  const hasClubRole = Object.keys(clubRoles).length > 0;
  const isSportleiter = Object.values(clubRoles).includes('SPORTLEITER');
  const isVorstand = Object.values(clubRoles).includes('VORSTAND');
  
  // KV-Rollen prüfen
  const isKVWettkampfleiter = Object.values(kvRoles).includes('KV_WETTKAMPFLEITER');
  const isKVKmOrga = Object.values(kvRoles).includes('KV_KM_ORGA');
  

  
  const hasKMAccess = !authLoading && (
    user?.email === 'admin@rwk-einbeck.de' ||
    platformRole === 'SUPER_ADMIN' ||
    userAppPermissions?.role === 'superadmin' ||
    isKVWettkampfleiter || // KV-Wettkampfleiter
    isKVKmOrga || // KV-KM-Orga
    userAppPermissions?.role === 'km_organisator' ||
    isSportleiter || // Club-Sportleiter
    isVorstand || // Club-Vorstand
    // Legacy-Fallback
    userAppPermissions?.role === 'vereinsvertreter' ||
    userAppPermissions?.role === 'vereinsvorstand'
  );

  const userRole = user?.email === 'admin@rwk-einbeck.de' ? 'admin' : 
                   platformRole === 'SUPER_ADMIN' ? 'admin' :
                   userAppPermissions?.role === 'superadmin' ? 'admin' :
                   isKVWettkampfleiter ? 'km_organisator' :
                   isKVKmOrga ? 'km_organisator' :
                   isSportleiter || isVorstand ? 'verein' :
                   // Legacy-Fallback
                   userAppPermissions?.role === 'vereinsvertreter' ? 'verein' :
                   userAppPermissions?.role === 'vereinsvorstand' ? 'verein' :
                   userAppPermissions?.role || '';
  
  // Für km_organisator: Alle Vereine, für vereinsvertreter: Nur zugewiesene
  let userClubIds = [];
  if (userRole === 'admin' || userRole === 'km_organisator') {
    // Admin und KM-Organisator sehen alle Vereine - keine Filterung
    userClubIds = [];
  } else {
    // Vereinsvertreter: Verwende representedClubs, clubRoles, clubIds oder clubId
    userClubIds = userAppPermissions?.representedClubs || 
                  Object.keys(clubRoles) ||
                  userAppPermissions?.clubIds || 
                  (userAppPermissions?.clubId ? [userAppPermissions.clubId] : []);
  }
  


  return {
    hasKMAccess,
    isActive: hasKMAccess,
    loading,
    userClubIds,
    userRole,
    // Admin-spezifische Checks
    isKMAdmin: userRole === 'admin',
    isKMOrganisator: isKVWettkampfleiter || userRole === 'km_organisator',
    hasFullAccess: userRole === 'admin' || isKVWettkampfleiter || userRole === 'km_organisator',
    // Für KM-Übersicht Kompatibilität
    userPermission: {
      role: userRole,
      clubIds: userClubIds
    }
  };
}