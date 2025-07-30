// src/hooks/useKMAuth.ts
import { useState, useEffect } from 'react';
import { useAuthContext } from '@/components/auth/AuthContext';
import { getKMUserPermission, hasKMAdminAccess, hasKMOrganizerAccess } from '@/lib/services/km-auth-service';
import type { KMUserPermission } from '@/types/km-auth';

export function useKMAuth() {
  const { user } = useAuthContext();
  const [kmPermission, setKmPermission] = useState<KMUserPermission | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadKMPermission = async () => {
      if (!user?.uid) {
        setKmPermission(null);
        setLoading(false);
        return;
      }

      try {
        const permission = await getKMUserPermission(user.uid);
        setKmPermission(permission);
      } catch (error) {
        console.error('Fehler beim Laden der KM-Berechtigung:', error);
        setKmPermission(null);
      } finally {
        setLoading(false);
      }
    };

    loadKMPermission();
  }, [user?.uid]);

  const result = {
    kmPermission,
    loading,
    hasKMAdminAccess: hasKMAdminAccess(kmPermission),
    hasKMOrganizerAccess: hasKMOrganizerAccess(kmPermission),
    hasKMAccess: kmPermission?.isActive || false,
    userClubId: kmPermission?.clubId || null,
    userClubIds: kmPermission?.clubIds || (kmPermission?.clubId ? [kmPermission.clubId] : []),
    isMultiClub: (kmPermission?.clubIds?.length || 0) > 1
  };
  
  console.log('useKMAuth result:', {
    kmPermission: !!kmPermission,
    loading,
    hasKMAccess: result.hasKMAccess,
    isActive: kmPermission?.isActive
  });
  
  return result;
}