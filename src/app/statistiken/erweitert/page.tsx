"use client";

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function ExtendedStatisticsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  useEffect(() => {
    // Leite direkt zur erweiterten Statistik-Seite weiter
    // Behalte den Tab-Parameter bei, falls vorhanden
    const tabParam = searchParams.get('tab');
    
    if (tabParam) {
      router.replace(`/statistik/erweitert?tab=${tabParam}`);
    } else {
      router.replace('/statistik/erweitert');
    }
  }, [router, searchParams]);
  
  return (
    <div className="flex justify-center items-center h-screen">
      <p>Weiterleitung...</p>
    </div>
  );
}