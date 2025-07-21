"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface OnboardingContextType {
  isWizardOpen: boolean;
  openWizard: () => void;
  closeWizard: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export const OnboardingProvider = ({ children }: { children: ReactNode }) => {
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const openWizard = () => setIsWizardOpen(true);
  const closeWizard = () => setIsWizardOpen(false);

  return (
    <OnboardingContext.Provider value={{ isWizardOpen, openWizard, closeWizard }}>
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
};