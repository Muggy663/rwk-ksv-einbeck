"use client";
import React, { useState } from 'react';
import RwkTabellenPage from './page';
import { PrintView } from './print-view';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { db } from '@/lib/firebase/config';
import { collection, getDocs, query, where } from 'firebase/firestore';
import type { LeagueDisplay } from '@/types/rwk';

export default function RwkTabellenPageWithPrint() {
  const [showPrintView, setShowPrintView] = useState(false);
  const [printData, setPrintData] = useState<{
    league: LeagueDisplay;
    seasonName: string;
    seasonYear: number;
  } | null>(null);
  
  const searchParams = useSearchParams();
  const leagueId = searchParams.get('league');
  const year = searchParams.get('year');
  
  const handlePrintClick = async () => {
    if (!leagueId || !year) {
      alert('Bitte wählen Sie eine Liga aus, um die Druckansicht zu öffnen.');
      return;
    }
    
    try {
      // Fetch league data
      const leagueQuery = query(
        collection(db, 'rwk_leagues'),
        where('id', '==', leagueId)
      );
      
      const leagueSnapshot = await getDocs(leagueQuery);
      if (leagueSnapshot.empty) {
        alert('Liga nicht gefunden.');
        return;
      }
      
      const leagueData = leagueSnapshot.docs[0].data() as LeagueDisplay;
      
      // Fetch season name
      const seasonQuery = query(
        collection(db, 'seasons'),
        where('competitionYear', '==', parseInt(year))
      );
      
      const seasonSnapshot = await getDocs(seasonQuery);
      const seasonName = seasonSnapshot.empty ? `Saison ${year}` : (seasonSnapshot.docs[0].data().name || `Saison ${year}`);
      
      setPrintData({
        league: leagueData,
        seasonName,
        seasonYear: parseInt(year)
      });
      
      setShowPrintView(true);
    } catch (error) {
      console.error('Error fetching print data:', error);
      alert('Fehler beim Laden der Druckdaten.');
    }
  };
  
  if (showPrintView && printData) {
    return (
      <div className="container mx-auto py-8">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-primary">Druckansicht</h1>
          <Button variant="outline" onClick={() => setShowPrintView(false)}>
            Zurück zur Tabellenansicht
          </Button>
        </div>
        
        <PrintView 
          league={printData.league}
          seasonName={printData.seasonName}
          seasonYear={printData.seasonYear}
        />
      </div>
    );
  }
  
  return (
    <div>
      {leagueId && year && (
        <div className="flex justify-end mb-4">
          <Button variant="outline" onClick={handlePrintClick}>
            <Printer className="mr-2 h-4 w-4" />
            Druckansicht öffnen
          </Button>
        </div>
      )}
      <RwkTabellenPage />
    </div>
  );
}