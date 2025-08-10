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

  // Vereinsvertreter und km_organisator haben KM-Zugriff
  const hasKMAccess = !authLoading && (
    user?.email === 'admin@rwk-einbeck.de' ||
    userAppPermissions?.role === 'vereinsvertreter' ||
    userAppPermissions?.role === 'km_organisator'
  );

  const userRole = user?.email === 'admin@rwk-einbeck.de' ? 'admin' : userAppPermissions?.role || '';
  const userClubIds = userAppPermissions?.clubId ? [userAppPermissions.clubId] : [];

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