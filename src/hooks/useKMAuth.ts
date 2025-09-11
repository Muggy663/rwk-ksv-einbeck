// src/hooks/useKMAuth.ts
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';

export function useKMAuth() {
  const { user, loading: authLoading, userAppPermissions } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      setLoading(false);
    }
  }, [authLoading]);

  // Multi-Role-System: Prüfe sowohl alte Rolle als auch neue Rollen-Array
  const hasKMAccess = !authLoading && (
    user?.email === 'admin@rwk-einbeck.de' ||
    userAppPermissions?.role === 'vereinsvertreter' ||
    userAppPermissions?.role === 'vereinsvorstand' ||
    userAppPermissions?.role === 'km_organisator' ||
    userAppPermissions?.roles?.includes('km_access') ||
    userAppPermissions?.roles?.includes('vereinsvertreter')
  );

  const userRole = user?.email === 'admin@rwk-einbeck.de' ? 'admin' : userAppPermissions?.role || '';
  
  // Für km_organisator: Alle Vereine, für vereinsvertreter: Nur zugewiesene
  let userClubIds = [];
  if (userRole === 'admin' || userRole === 'km_organisator') {
    // Admin und KM-Organisator sehen alle Vereine - keine Filterung
    userClubIds = [];
  } else {
    // Vereinsvertreter: Verwende representedClubs, clubIds oder clubId
    userClubIds = userAppPermissions?.representedClubs || 
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
    isKMOrganisator: userRole === 'km_organisator',
    hasFullAccess: userRole === 'admin' || userRole === 'km_organisator',
    // Für KM-Übersicht Kompatibilität
    userPermission: {
      role: userRole,
      clubIds: userClubIds
    }
  };
}