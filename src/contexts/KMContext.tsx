"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useKMAuth } from '@/hooks/useKMAuth';

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
  const [currentClubId, setCurrentClubId] = useState<string | null>(null);

  useEffect(() => {
    if (userClubIds.length > 0) {
      const savedClubId = localStorage.getItem('kmCurrentClubId');
      if (savedClubId && userClubIds.includes(savedClubId)) {
        setCurrentClubId(savedClubId);
      } else {
        setCurrentClubId(userClubIds[0]);
      }
    }
  }, [userClubIds]);

  const switchClub = (clubId: string) => {
    if (userClubIds.includes(clubId)) {
      setCurrentClubId(clubId);
      localStorage.setItem('kmCurrentClubId', clubId);
    }
  };

  return (
    <KMContext.Provider value={{ currentClubId, switchClub, userClubIds, userRole }}>
      {children}
    </KMContext.Provider>
  );
};