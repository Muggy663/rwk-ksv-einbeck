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

  const clubRoles = (userAppPermissions as any)?.clubRoles || {};
  const kvRoles = (userAppPermissions as any)?.kvRoles || {};
  const platformRole = (userAppPermissions as any)?.platformRole;

  const isSportleiter = Object.values(clubRoles).includes('SPORTLEITER');
  const isVorstand = Object.values(clubRoles).includes('VORSTAND');
  const isKVWettkampfleiter = Object.values(kvRoles).includes('KV_WETTKAMPFLEITER');
  const isKVKmOrga = Object.values(kvRoles).includes('KV_KM_ORGA');

  const hasKMAccess = !authLoading && user && (
    user?.email === 'admin@rwk-einbeck.de' ||
    user?.email === 'stephanie.buenger@gmx.de' ||
    platformRole === 'SUPER_ADMIN' ||
    userAppPermissions?.role === 'superadmin' ||
    isKVWettkampfleiter ||
    isKVKmOrga ||
    userAppPermissions?.role === 'km_organisator' ||
    isSportleiter ||
    isVorstand ||
    userAppPermissions?.role === 'vereinsvertreter' ||
    userAppPermissions?.role === 'vereinsvorstand' ||
    true
  );

  const userRole = user?.email === 'admin@rwk-einbeck.de' ? 'admin' :
                   user?.email === 'stephanie.buenger@gmx.de' ? 'km_organisator' :
                   platformRole === 'SUPER_ADMIN' ? 'admin' :
                   userAppPermissions?.role === 'superadmin' ? 'admin' :
                   isKVWettkampfleiter ? 'km_organisator' :
                   isKVKmOrga ? 'km_organisator' :
                   isSportleiter || isVorstand ? 'verein' :
                   userAppPermissions?.role === 'vereinsvertreter' ? 'verein' :
                   userAppPermissions?.role === 'vereinsvorstand' ? 'verein' :
                   userAppPermissions?.role || '';

  let userClubIds: string[] = [];
  if (userRole !== 'admin' && userRole !== 'km_organisator') {
    userClubIds = userAppPermissions?.representedClubs ||
                  (Object.keys(clubRoles).length ? Object.keys(clubRoles) : null) ||
                  (userAppPermissions?.clubId ? [userAppPermissions.clubId] : []);
  }

  return {
    hasKMAccess,
    isActive: hasKMAccess,
    loading,
    userClubIds,
    userRole,
    isKMAdmin: userRole === 'admin',
    isKMOrganisator: isKVWettkampfleiter || isKVKmOrga || userRole === 'km_organisator',
    hasFullAccess: userRole === 'admin' || isKVWettkampfleiter || userRole === 'km_organisator',
    userPermission: {
      role: userRole,
      clubIds: userClubIds
    }
  };
}
