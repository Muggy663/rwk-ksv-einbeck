"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { logError, logWarn, logInfo, logDebug } from '@/lib/utils/secure-logger';

interface NativeAppContextType {
  isNativeApp: boolean;
  isPWA: boolean;
  isMobile: boolean;
}

const NativeAppContext = createContext<NativeAppContextType>({ 
  isNativeApp: false, 
  isPWA: false, 
  isMobile: false 
});

export function useNativeApp() {
  return useContext(NativeAppContext);
}

export function NativeAppProvider({ children }: { children: ReactNode }) {
  const [isNativeApp, setIsNativeApp] = useState(false);
  const [isPWA, setIsPWA] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkAppType = () => {
      // Native App Check (Capacitor)
      const isNative = window.Capacitor && window.Capacitor.isNativePlatform();
      setIsNativeApp(!!isNative);
      
      // PWA Check
      const isPWAMode = window.matchMedia('(display-mode: standalone)').matches || 
                       window.navigator.standalone === true || 
                       document.referrer.includes('android-app://');
      setIsPWA(isPWAMode);
      
      // Mobile Check
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(isMobileDevice);
      
      // Safari Check
      const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent) || 
                       /iPad|iPhone|iPod/.test(navigator.userAgent);
      
      // CSS Classes hinzufügen
      if (isNative) {
        localStorage.setItem('is_native_app', 'true');
        document.body.classList.add('native-app');
      }
      if (isPWAMode) {
        localStorage.setItem('is_pwa', 'true');
        document.body.classList.add('pwa-app');
      }
      if (isMobileDevice) {
        document.body.classList.add('mobile-device');
      }
      if (isSafari) {
        document.body.classList.add('safari-browser');
        localStorage.setItem('is_safari', 'true');
      }
    };
    
    checkAppType();
  }, []);
  
  return (
    <NativeAppContext.Provider value={{ isNativeApp, isPWA, isMobile }}>
      {children}
    </NativeAppContext.Provider>
  );
}

// Komponente zum Ausblenden von Elementen in der nativen App
export function HideInNativeApp({ children, exceptIn = [] }: { children: ReactNode, exceptIn?: string[] }) {
  const { isNativeApp } = useNativeApp();
  const [currentPath, setCurrentPath] = useState<string>('');
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentPath(window.location.pathname);
      
      // Aktualisiere den Pfad bei Navigation
      const handleRouteChange = () => {
        setCurrentPath(window.location.pathname);
      };
      
      window.addEventListener('popstate', handleRouteChange);
      return () => window.removeEventListener('popstate', handleRouteChange);
    }
  }, []);
  
  // Prüfe, ob der aktuelle Pfad in den Ausnahmen enthalten ist
  const isExcepted = exceptIn.some(path => currentPath.includes(path));
  
  if (isNativeApp && !isExcepted) {
    return null;
  }
  
  return <>{children}</>;
}

// Komponente zum Ausblenden von Elementen in PWA/Mobile
export function HideInMobile({ children, exceptIn = [] }: { children: ReactNode, exceptIn?: string[] }) {
  const { isPWA, isMobile } = useNativeApp();
  const [currentPath, setCurrentPath] = useState<string>('');
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentPath(window.location.pathname);
      
      const handleRouteChange = () => {
        setCurrentPath(window.location.pathname);
      };
      
      window.addEventListener('popstate', handleRouteChange);
      return () => window.removeEventListener('popstate', handleRouteChange);
    }
  }, []);
  
  const isExcepted = exceptIn.some(path => currentPath.includes(path));
  
  if ((isPWA || isMobile) && !isExcepted) {
    return null;
  }
  
  return <>{children}</>;
}
