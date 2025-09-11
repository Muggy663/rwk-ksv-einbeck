// src/hooks/useClubId.ts
import { useState, useEffect } from 'react';
import { auth } from '@/lib/firebase/config';
import { onAuthStateChanged, User } from 'firebase/auth';
import { getUserClubId } from '@/lib/utils/club-utils';

/**
 * Hook zum Abrufen der Club-ID des aktuell eingeloggten Benutzers
 */
export function useClubId() {
  const [user, setUser] = useState<User | null>(null);
  const [clubId, setClubId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (!currentUser) {
        setClubId(null);
        setLoading(false);
        return;
      }

      try {
        const userClubId = await getUserClubId(currentUser.uid);
        setClubId(userClubId);
      } catch (error) {
        console.error('Fehler beim Laden der Club-ID:', error);
        setClubId(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return {
    clubId,
    loading,
    user
  };
}