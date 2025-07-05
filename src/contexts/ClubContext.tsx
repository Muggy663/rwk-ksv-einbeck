"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase/config';
import { doc, getDoc } from 'firebase/firestore';

interface Club {
  id: string;
  name: string;
}

interface ClubContextType {
  representedClubs: Club[];
  activeClubId: string | null;
  setActiveClubId: (clubId: string) => void;
  isLoading: boolean;
}

const ClubContext = createContext<ClubContextType>({
  representedClubs: [],
  activeClubId: null,
  setActiveClubId: () => {},
  isLoading: true,
});

export const useClubContext = () => useContext(ClubContext);

interface ClubProviderProps {
  children: ReactNode;
}

export function ClubProvider({ children }: ClubProviderProps) {
  const { user } = useAuth();
  const [representedClubs, setRepresentedClubs] = useState<Club[]>([]);
  const [activeClubId, setActiveClubIdState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUserClubs = async () => {
      if (!user?.uid) {
        setRepresentedClubs([]);
        setActiveClubId(null);
        setIsLoading(false);
        return;
      }

      try {
        const userPermDoc = await getDoc(doc(db, 'user_permissions', user.uid));
        
        if (userPermDoc.exists()) {
          const userData = userPermDoc.data();
          // Backward compatibility: representedClubs oder fallback auf clubId
          const clubIds = userData.representedClubs && userData.representedClubs.length > 0 
            ? userData.representedClubs 
            : [userData.clubId].filter(Boolean);
          
          // Lade Club-Details
          const clubs: Club[] = [];
          for (const clubId of clubIds) {
            const clubDoc = await getDoc(doc(db, 'clubs', clubId));
            if (clubDoc.exists()) {
              clubs.push({ id: clubDoc.id, ...clubDoc.data() } as Club);
            }
          }
          
          setRepresentedClubs(clubs);
          
              // Setze ersten Verein als aktiv wenn noch keiner gewählt
          if (!activeClubId && clubs.length > 0) {
            console.log('ClubContext: Setting first club as active:', clubs[0].id, clubs[0].name);
            setActiveClubId(clubs[0].id);
          }
        }
      } catch (error) {
        console.error('Fehler beim Laden der Verein-Daten:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserClubs();
  }, [user?.uid]);

  const setActiveClubId = (clubId: string) => {
    console.log('ClubContext: setActiveClubId called with:', clubId);
    setActiveClubIdState(clubId);
    if (typeof window !== 'undefined') {
      localStorage.setItem('activeClubId', clubId);
    }
  };

  // Lade gespeicherten aktiven Verein
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedClubId = localStorage.getItem('activeClubId');
      if (savedClubId && representedClubs.some(c => c.id === savedClubId)) {
        setActiveClubIdState(savedClubId);
      }
    }
  }, [representedClubs]);

  return (
    <ClubContext.Provider value={{
      representedClubs,
      activeClubId,
      setActiveClubId,
      isLoading,
    }}>
      {children}
    </ClubContext.Provider>
  );
}