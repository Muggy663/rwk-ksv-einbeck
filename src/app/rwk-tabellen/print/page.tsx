"use client";

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

// Komponente, die useSearchParams verwendet
function PrintPageContent() {
  const searchParams = useSearchParams();
  const leagueId = searchParams.get('league');
  const year = searchParams.get('year');
  const discipline = searchParams.get('discipline');

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Druckansicht</h1>
      <p>Liga: {leagueId || 'Keine Liga ausgewählt'}</p>
      <p>Jahr: {year || 'Kein Jahr ausgewählt'}</p>
      <p>Disziplin: {discipline || 'Keine Disziplin ausgewählt'}</p>
      {/* Hier würde die eigentliche Druckansicht implementiert werden */}
    </div>
  );
}

// Fallback für die Suspense-Boundary
function PrintPageLoading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="h-8 w-8 animate-spin mr-2" />
      <p>Lade Druckansicht...</p>
    </div>
  );
}

// Hauptkomponente mit Suspense-Boundary
export default function PrintPage() {
  return (
    <Suspense fallback={<PrintPageLoading />}>
      <PrintPageContent />
    </Suspense>
  );
}