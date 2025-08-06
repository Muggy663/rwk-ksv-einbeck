// src/hooks/use-local-storage.ts
"use client";
import { useState, useEffect } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  // State zum Speichern des Werts
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  // Initialisierung: Wert aus localStorage lesen oder initialValue verwenden
  useEffect(() => {
    try {
      // Prüfen, ob localStorage verfügbar ist (nur im Browser)
      if (typeof window !== 'undefined') {
        const item = window.localStorage.getItem(key);
        // Gespeicherten Wert parsen oder initialValue verwenden
        setStoredValue(item ? JSON.parse(item) : initialValue);
      }
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      setStoredValue(initialValue);
    }
  }, [key, initialValue]);

  // Funktion zum Aktualisieren des Werts im localStorage
  const setValue = (value: T) => {
    try {
      // Wert im State speichern
      setStoredValue(value);
      
      // Wert im localStorage speichern
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(value));
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue];
}
