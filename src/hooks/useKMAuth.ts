// src/hooks/useKMAuth.ts
import { useState, useEffect } from 'react';
import { useAuthContext } from '@/components/auth/AuthContext';
import { kmAuthService } from '@/lib/services/km-auth-service';

export function useKMAuth() {
  const { user, loading: authLoading } = useAuthContext();
  const [kmPermission, setKmPermission] = useState(false);
  const [userClubIds, setUserClubIds] = useState<string[]>([]);
  const [userRole, setUserRole] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadKMPermissions = async () => {
      if (!user?.uid || authLoading) {
        setLoading(authLoading);
        return;
      }

      try {
        const permission = await kmAuthService.checkKMPermission(user.uid);
        console.log('useKMAuth result:', {
          kmPermission: permission.hasAccess,
          loading: false,
          hasKMAccess: permission.hasAccess,
          isActive: permission.isActive,
          userRole: permission.role,
          userClubIds: permission.clubIds
        });
        
        setKmPermission(permission.hasAccess);
        setUserClubIds(permission.clubIds || []);
        setUserRole(permission.role || '');
      } catch (error) {
        console.error('Error loading KM permissions:', error);
        setKmPermission(false);
        setUserClubIds([]);
        setUserRole('');
      } finally {
        setLoading(false);
      }
    };

    loadKMPermissions();
  }, [user?.uid, authLoading]);

  return {
    kmPermission,
    hasKMAccess: kmPermission,
    userClubIds,
    userRole,
    loading,
    isActive: kmPermission,
    // Admin-spezifische Checks
    isKMAdmin: userRole === 'admin',
    isKMOrganisator: userRole === 'km_organisator',
    hasFullAccess: userRole === 'admin' || userRole === 'km_organisator'
  };
}