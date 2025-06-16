"use client";
import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function RwkTabellenPrintPage() {
  const [params, setParams] = useState<{
    leagueId: string | null,
    seasonId: string | null,
    view: string | null
  }>({
    leagueId: null,
    seasonId: null,
    view: null
  });
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      setParams({
        leagueId: urlParams.get('leagueId'),
        seasonId: urlParams.get('seasonId'),
        view: urlParams.get('view')
      });
    }
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="ml-2">Druckansicht wird geladen...</p>
    </div>
  );
}