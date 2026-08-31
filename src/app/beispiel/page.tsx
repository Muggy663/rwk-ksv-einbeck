"use client";

import React, { useState, useMemo } from 'react';
import { OptimizedCard } from '@/components/optimized-card';
import { OptimizedImage } from '@/components/optimized-image';
import { LazyComponent } from '@/components/lazy-component';
import { Button } from '@/components/ui/button';

export default function BeispielPage() {
  const [count, setCount] = useState(0);
  
  // Beispiel für useMemo zur Optimierung von Berechnungen
  const expensiveCalculation = useMemo(() => {

    // Simuliere eine aufwändige Berechnung
    let result = 0;
    for (let i = 0; i < 1000; i++) {
      result += i;
    }
    return result;
  }, []); // Leeres Dependency-Array bedeutet, dass die Berechnung nur einmal durchgeführt wird
  
  return (
    <div className="container py-8 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-primary">Optimierte Komponenten Beispiel</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <OptimizedCard
          title="Optimierte Card-Komponente"
          description="Diese Komponente verwendet React.memo für bessere Performance"
        >
          <p>Diese Komponente wird nur neu gerendert, wenn sich ihre Props ändern.</p>
          <p className="mt-4">Zähler: {count}</p>
          <Button 
            onClick={() => setCount(prev => prev + 1)}
            className="mt-4"
          >
            Zähler erhöhen
          </Button>
        </OptimizedCard>
        
        <LazyComponent height="300px">
          <OptimizedCard
            title="Lazy-Loading Komponente"
            description="Diese Komponente wird erst geladen, wenn sie sichtbar ist"
          >
            <div className="flex justify-center">
              <OptimizedImage
                src="/images/logo.png"
                alt="Logo"
                width={200}
                height={200}
                className="rounded-md"
              />
            </div>
          </OptimizedCard>
        </LazyComponent>
      </div>
      
      <OptimizedCard
        title="useMemo Beispiel"
        description="Optimierung von aufwändigen Berechnungen"
      >
        <p>Ergebnis der aufwändigen Berechnung: {expensiveCalculation}</p>
        <p className="mt-4 text-muted-foreground">
          Diese Berechnung wird nur einmal durchgeführt, auch wenn die Komponente neu gerendert wird.
        </p>
      </OptimizedCard>
    </div>
  );
}
