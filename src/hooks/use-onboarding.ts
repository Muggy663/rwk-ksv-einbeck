// src/hooks/use-onboarding.ts
"use client";

import { useState } from 'react';

export function useOnboarding() {
  const [showGuide, setShowGuide] = useState(false);

  const startGuide = () => setShowGuide(true);
  const completeGuide = () => setShowGuide(false);
  const skipGuide = () => setShowGuide(false);

  return {
    showGuide,
    startGuide,
    completeGuide,
    skipGuide
  };
}
