"use client";

// src/contexts/KMContext.tsx
// KM-spezifischer Context – der aktive Verein wird jetzt aus dem gemeinsamen
// ClubContext (Single Source of Truth) bezogen, statt eigenem State/localStorage.
// userClubIds/userRole kommen weiterhin aus der KM-Rollenermittlung (useKMAuth).

import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { useKMAuth } from '@/hooks/useKMAuth';
import { useClubContext } from '@/contexts/ClubContext';

interface KMContextType {
  currentClubId: string | null;
  switchClub: (clubId: string) => void;
  userClubIds: string[];
  userRole: string;
}

const KMContext = createContext<KMContextType | undefined>(undefined);

export const useKMContext = (): KMContextType => {
  const context = useContext(KMContext);
  if (!context) {
    throw new Error('useKMContext must be used within KMProvider');
  }
  return context;
};

interface KMProviderProps {
  children: ReactNode;
}

export const KMProvider: React.FC<KMProviderProps> = ({ children }) => {
  const { userClubIds, userRole } = useKMAuth();
  const { activeClubId, setActiveClubId } = useClubContext();

  // Sicherstellen, dass der gemeinsame aktive Verein zu den KM-Vereinen passt.
  // Zeigt er auf einen Verein außerhalb der KM-Zuordnung (oder ist leer),
  // auf den ersten KM-Verein setzen.
  useEffect(() => {
    if (userClubIds.length === 0) return;
    if (!activeClubId || !userClubIds.includes(activeClubId)) {
      setActiveClubId(userClubIds[0]);
    }
  }, [userClubIds, activeClubId, setActiveClubId]);

  const switchClub = (clubId: string) => {
    if (userClubIds.includes(clubId)) {
      setActiveClubId(clubId);
    }
  };

  // Effektiver aktiver KM-Verein: nur, wenn er zu den KM-Vereinen gehört.
  const currentClubId =
    activeClubId && userClubIds.includes(activeClubId)
      ? activeClubId
      : userClubIds[0] ?? null;

  return (
    <KMContext.Provider value={{ currentClubId, switchClub, userClubIds, userRole }}>
      {children}
    </KMContext.Provider>
  );
};
