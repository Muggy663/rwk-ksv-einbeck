// src/hooks/useKMAuth.ts
import { useState, useEffect } from 'react';
import { useAuthContext } from '@/components/auth/AuthContext';
import { deriveUserClubIds } from '@/lib/clubs/userClubs';

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
  const isKVWettkampfleiter = Object.values(kvRoles).includes('KV_WETTKAMPFLEITER');
  const isKVKmOrga = Object.values(kvRoles).includes('KV_KM_ORGA');

  // KM-Zugang ist auf drei Gruppen beschränkt: Admin/Superadmin, KM-Orga
  // (Kreis-Wettkampfleiter / KM-Organisator) und Sportleiter des Vereins.
  // WICHTIG: Hier stand früher ein abschließendes „|| true", wodurch JEDER
  // eingeloggte Nutzer Zugang bekam und alle Rollenprüfungen wirkungslos waren.
  // Vorstand, einfache Vereinsvertreter und Mannschaftsführer haben KEINEN
  // KM-Zugang.
  const hasKMAccess = Boolean(
    !authLoading && user && (
      platformRole === 'SUPER_ADMIN' ||
      userAppPermissions?.role === 'superadmin' ||
      (userAppPermissions?.role as any) === 'admin' ||
      isKVWettkampfleiter ||
      isKVKmOrga ||
      (userAppPermissions?.role as any) === 'km_organisator' ||
      isSportleiter
    )
  );

  const userRole = platformRole === 'SUPER_ADMIN' ? 'admin' :
                   userAppPermissions?.role === 'superadmin' ? 'admin' :
                   (userAppPermissions?.role as any) === 'admin' ? 'admin' :
                   isKVWettkampfleiter ? 'km_organisator' :
                   isKVKmOrga ? 'km_organisator' :
                   (userAppPermissions?.role as any) === 'km_organisator' ? 'km_organisator' :
                   isSportleiter ? 'verein' :
                   '';

  let userClubIds: string[] = [];
  if (userRole !== 'admin' && userRole !== 'km_organisator') {
    // Zentrale, einheitliche Vereins-Ableitung.
    userClubIds = deriveUserClubIds(userAppPermissions);
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
