// src/hooks/use-mobile-detection.ts
"use client";

import { useState, useEffect } from 'react';

interface MobileDetection {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  screenWidth: number;
  screenHeight: number;
  hasNotch: boolean;
  isIOS: boolean;
  isAndroid: boolean;
}

// Ermittelt den aktuellen Detection-Zustand aus window (nur clientseitig).
function readDetection(): MobileDetection {
  if (typeof window === 'undefined') {
    // SSR-Standard: Desktop (wird direkt nach Mount korrigiert)
    return {
      isMobile: false, isTablet: false, isDesktop: true,
      screenWidth: 1920, screenHeight: 1080,
      hasNotch: false, isIOS: false, isAndroid: false,
    };
  }
  const width = window.innerWidth;
  const height = window.innerHeight;
  const userAgent = navigator.userAgent;
  const safeAreaTop = parseInt(getComputedStyle(document.documentElement)
    .getPropertyValue('--safe-area-inset-top').replace('px', '')) || 0;
  return {
    isMobile: width < 768,
    isTablet: width >= 768 && width < 1024,
    isDesktop: width >= 1024,
    screenWidth: width,
    screenHeight: height,
    hasNotch: safeAreaTop > 20,
    isIOS: /iPad|iPhone|iPod/.test(userAgent),
    isAndroid: /Android/.test(userAgent),
  };
}

export function useMobileDetection(): MobileDetection {
  // Start Desktop-neutral (SSR-konsistent), aber direkt nach Mount synchron korrigieren,
  // damit mobile Layouts nicht kurz die Desktop-Variante zeigen (Dialog-Sprung/Flackern).
  const [detection, setDetection] = useState<MobileDetection>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    screenWidth: 1920,
    screenHeight: 1080,
    hasNotch: false,
    isIOS: false,
    isAndroid: false,
  });

  // useLayoutEffect würde vor dem Paint laufen; useEffect reicht hier, wir setzen sofort.
  useEffect(() => {
    // Sofort echten Wert setzen (behebt kurzes Desktop-Rendering auf Mobilgeräten)
    setDetection(readDetection());

    const updateDetection = () => setDetection(readDetection());

    window.addEventListener('resize', updateDetection);
    window.addEventListener('orientationchange', updateDetection);

    return () => {
      window.removeEventListener('resize', updateDetection);
      window.removeEventListener('orientationchange', updateDetection);
    };
  }, []);

  return detection;
}
