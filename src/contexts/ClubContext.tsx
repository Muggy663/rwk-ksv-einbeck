'use client';

// src/contexts/ClubContext.tsx
// Single Source of Truth für den "aktiven Verein" der gesamten App.
// Nutzt die zentrale Ableitung deriveUserClubIds und EINEN localStorage-Key.
// VereinContext und KMContext docken intern hier an (behalten aber ihre Hook-Namen).

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { logError } from '@/lib/utils/secure-logger';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import { deriveUserClubIds } from '@/lib/clubs/userClubs';

interface Club {
  id: string;
  name: string;
}

interface ClubContextType {
  /** Vereins-Objekte (id + name) der zugeordneten Vereine */
  representedClubs: Club[];
  /** Nur die IDs der zugeordneten Vereine (zentral abgeleitet) */
  clubIds: string[];
  /** Aktuell aktiver Verein (oder null) */
  activeClubId: string | null;
  /** Aktiven Verein setzen (nur erlaubte IDs; persistiert in localStorage) */
  setActiveClubId: (clubId: string) => void;
  /** Alias zu setActiveClubId für konsistente Benennung mit den Alt-Hooks */
  switchClub: (clubId: string) => void;
  isLoading: boolean;
}

const STORAGE_KEY = 'activeClubId';

const ClubContext = createContext<ClubContextType>({
  representedClubs: [],
  clubIds: [],
  activeClubId: null,
  setActiveClubId: () => {},
  switchClub: () => {},
  isLoading: true,
});

export const useClubContext = () => useContext(ClubContext);

interface ClubProviderProps {
  children: ReactNode;
}

export function ClubProvider({ children }: ClubProviderProps) {
  const { user, userAppPermissions } = useAuth();
  const [representedClubs, setRepresentedClubs] = useState<Club[]>([]);
  const [clubIds, setClubIds] = useState<string[]>([]);
  const [activeClubId, setActiveClubIdState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Aktiven Verein setzen (nur erlaubte IDs) + persistieren.
  const setActiveClubId = useCallback(
    (clubId: string) => {
      setActiveClubIdState(clubId);
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, clubId);
      }
    },
    []
  );

  useEffect(() => {
    let cancelled = false;

    const loadUserClubs = async () => {
      if (!user?.uid) {
        setRepresentedClubs([]);
        setClubIds([]);
        setActiveClubIdState(null);
        setIsLoading(false);
        return;
      }

      try {
        // Vereins-IDs zentral ableiten – bevorzugt aus dem bereits geladenen
        // AuthContext, sonst frisch aus user_permissions.
        let source = userAppPermissions as any;
        if (!source) {
          const snap = await getDoc(doc(db, 'user_permissions', user.uid));
          source = snap.exists() ? snap.data() : null;
        }

        const ids = deriveUserClubIds(source);

        // Club-Namen laden.
        const clubs: Club[] = [];
        for (const clubId of ids) {
          const clubDoc = await getDoc(doc(db, 'clubs', clubId));
          if (clubDoc.exists()) {
            clubs.push({ id: clubDoc.id, name: (clubDoc.data() as any).name });
          }
        }

        if (cancelled) return;

        setClubIds(ids);
        setRepresentedClubs(clubs);

        // Aktiven Verein bestimmen: gespeicherten Wert bevorzugen, sonst ersten.
        const saved =
          typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
        if (saved && ids.includes(saved)) {
          setActiveClubIdState(saved);
        } else if (ids.length > 0) {
          setActiveClubId(ids[0]);
        } else {
          setActiveClubIdState(null);
        }
      } catch (error) {
        logError('Fehler beim Laden der Verein-Daten:', error);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    loadUserClubs();
    return () => {
      cancelled = true;
    };
  }, [user?.uid, userAppPermissions, setActiveClubId]);

  return (
    <ClubContext.Provider
      value={{
        representedClubs,
        clubIds,
        activeClubId,
        setActiveClubId,
        switchClub: setActiveClubId,
        isLoading,
      }}
    >
      {children}
    </ClubContext.Provider>
  );
}
