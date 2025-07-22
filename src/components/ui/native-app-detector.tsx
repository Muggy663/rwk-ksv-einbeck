"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface NativeAppContextType {
  isNativeApp: boolean;
}

const NativeAppContext = createContext<NativeAppContextType>({ isNativeApp: false });

export function useNativeApp() {
  return useContext(NativeAppContext);
}

export function NativeAppProvider({ children }: { children: ReactNode }) {
  const [isNativeApp, setIsNativeApp] = useState(false);
  
  useEffect(() => {
    // Prüfe, ob wir in einer nativen App sind
    const checkNativeApp = () => {
      const isNative = window.Capacitor && window.Capacitor.isNativePlatform();
      setIsNativeApp(!!isNative);
      
      // Speichere die Information im localStorage für andere Komponenten
      if (isNative) {
        localStorage.setItem('is_native_app', 'true');
        
        // Füge eine Klasse zum body hinzu, um CSS-Anpassungen zu ermöglichen
        document.body.classList.add('native-app');
        
        console.log('Native App erkannt:', window.Capacitor.getPlatform());
      }
    };
    
    checkNativeApp();
  }, []);
  
  return (
    <NativeAppContext.Provider value={{ isNativeApp }}>
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