"use client";
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';

export default function PageWithPrint() {
  const [params, setParams] = useState<{
    leagueId: string | null,
    seasonId: string | null
  }>({
    leagueId: null,
    seasonId: null
  });
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      setParams({
        leagueId: urlParams.get('leagueId'),
        seasonId: urlParams.get('seasonId')
      });
    }
  }, []);

  const handlePrint = () => {
    if (params.leagueId && params.seasonId) {
      const printUrl = `/rwk-tabellen/print?leagueId=${params.leagueId}&seasonId=${params.seasonId}&view=print`;
      window.open(printUrl, '_blank');
    }
  };

  return (
    <Button onClick={handlePrint} variant="outline" className="flex items-center gap-2">
      <Printer className="h-4 w-4" /> Drucken
    </Button>
  );
}
