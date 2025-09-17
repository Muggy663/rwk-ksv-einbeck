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
        // Prüfe zuerst Support-Zugang oder Dev-Zugang für Super-Admin
        if (currentUser.email === 'admin@rwk-einbeck.de') {
          const { doc, getDoc, collection, getDocs, query, limit } = await import('firebase/firestore');
          const { db } = await import('@/lib/firebase/config');
          
          const userPermissionsDoc = await getDoc(doc(db, 'user_permissions', currentUser.uid));
          if (userPermissionsDoc.exists()) {
            const data = userPermissionsDoc.data();
            
            // Support-Zugang prüfen
            if (data.supportClubAccess && data.supportClubAccess.expiresAt.toDate() > new Date()) {
              setClubId(data.supportClubAccess.clubId);
              setLoading(false);
              return;
            }
            
            // Entwicklungs-Zugang für Super-Admin
            if (data.devClubId) {
              setClubId(data.devClubId);
              setLoading(false);
              return;
            }
          }
          
          // Kein Zugang verfügbar
          setClubId(null);
          setLoading(false);
          return;
        }
        
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