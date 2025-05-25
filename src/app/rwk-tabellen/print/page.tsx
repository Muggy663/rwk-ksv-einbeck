"use client";
import React, { useRef, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Printer, Download, ArrowLeft } from 'lucide-react';
// import { useReactToPrint } from 'react-to-print';
import Link from 'next/link';
import { db } from '@/lib/firebase/config';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import type { LeagueDisplay, Season } from '@/types/rwk';

export default function PrintPage() {
  const searchParams = useSearchParams();
  const leagueId = searchParams.get('league');
  const year = searchParams.get('year');
  const discipline = searchParams.get('discipline');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [league, setLeague] = useState<LeagueDisplay | null>(null);
  const [seasonName, setSeasonName] = useState<string>('');
  
  const printRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const fetchData = async () => {
      if (!leagueId || !year) {
        setError('Fehlende Parameter: Liga-ID oder Jahr nicht angegeben');
        setLoading(false);
        return;
      }
      
      try {
        // Fetch league data
        const leagueDoc = await getDoc(doc(db, 'rwk_leagues', leagueId));
        if (!leagueDoc.exists()) {
          setError('Liga nicht gefunden');
          setLoading(false);
          return;
        }
        
        const leagueData = { id: leagueDoc.id, ...leagueDoc.data() } as LeagueDisplay;
        
        // Fetch teams for this league
        const teamsQuery = query(
          collection(db, 'rwk_teams'),
          where('leagueId', '==', leagueId),
          where('competitionYear', '==', parseInt(year))
        );
        
        const teamsSnapshot = await getDocs(teamsQuery);
        const teams = teamsSnapshot.docs.map(doc => {
          const data = doc.data();
          return { id: doc.id, ...data };
        });
        
        // Add teams to league data and sort by name
        leagueData.teams = teams.sort((a, b) => a.name.localeCompare(b.name));
        
        // Fetch season name
        const seasonId = leagueData.seasonId;
        if (seasonId) {
          const seasonDoc = await getDoc(doc(db, 'seasons', seasonId));
          if (seasonDoc.exists()) {
            const seasonData = seasonDoc.data() as Season;
            setSeasonName(seasonData.name || `Saison ${year}`);
          }
        }
        
        setLeague(leagueData);
      } catch (error) {
        console.error('Error fetching print data:', error);
        setError('Fehler beim Laden der Druckdaten');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [leagueId, year]);
  
  // Eigene Druckfunktion statt useReactToPrint
  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    const documentTitle = league ? `RWK_${league.name.replace(/\\s+/g, '_')}_${year}` : 'RWK_Tabelle';
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${documentTitle}</title>
          <style>
            body { font-family: Arial, sans-serif; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .print-header { text-align: center; margin-bottom: 20px; }
            .print-footer { margin-top: 20px; font-size: 0.8em; color: #666; }
          </style>
        </head>
        <body>
          ${content.innerHTML}
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    
    // Kurze Verzögerung, um sicherzustellen, dass Inhalte geladen sind
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };
  
  // Generate CSV data for the league
  const generateCSV = () => {
    if (!league || !league.teams) return;
    
    // Header row
    let csvContent = "Rang,Mannschaft,Verein";
    
    // Add round headers (DG1, DG2, etc.)
    const maxRounds = 5; // Default to 5 rounds for KK
    
    for (let i = 1; i <= maxRounds; i++) {
      csvContent += `,DG${i}`;
    }
    
    csvContent += ",Gesamt,Durchschnitt\n";
    
    // Team data rows
    league.teams.forEach((team, index) => {
      csvContent += `${index + 1},${team.name},${team.clubName || ''}`;
      
      // Add round results
      for (let i = 1; i <= maxRounds; i++) {
        const roundKey = `dg${i}`;
        const score = team.roundResults && team.roundResults[roundKey] !== undefined 
          ? team.roundResults[roundKey] 
          : '';
        csvContent += `,${score}`;
      }
      
      // Add total and average
      csvContent += `,${team.totalScore || ''},${team.averageScore || ''}\n`;
    });
    
    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `RWK_${league.name.replace(/\\s+/g, '_')}_${year}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg">Lade Druckdaten...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container mx-auto py-8">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-primary">Fehler</h1>
          <Link href={`/rwk-tabellen?year=${year}&discipline=${discipline}`}>
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Zurück zur Tabellenansicht
            </Button>
          </Link>
        </div>
        <div className="bg-destructive/10 p-6 rounded-lg border border-destructive">
          <p className="text-destructive">{error}</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-primary">Druckansicht</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={generateCSV}>
            <Download className="mr-2 h-4 w-4" />
            CSV exportieren
          </Button>
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Drucken
          </Button>
          <Link href={`/rwk-tabellen?year=${year}&discipline=${discipline}`}>
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Zurück
            </Button>
          </Link>
        </div>
      </div>
      
      <div ref={printRef} className="bg-white p-6 rounded-lg shadow-sm">
        <div className="print-header">
          <h2 className="text-2xl font-bold text-center">{league?.name}</h2>
          <p className="text-center text-muted-foreground">{seasonName} ({year})</p>
        </div>
        
        <h3 className="text-xl font-semibold mt-6 mb-3">Mannschaftstabelle</h3>
        <div className="overflow-x-auto">
          <table className="print-table w-full">
            <thead>
              <tr>
                <th className="w-[50px]">Rang</th>
                <th>Mannschaft</th>
                <th>Verein</th>
                {[1, 2, 3, 4, 5].map(round => (
                  <th key={round} className="text-center">DG {round}</th>
                ))}
                <th className="text-center">Gesamt</th>
                <th className="text-center">Ø</th>
              </tr>
            </thead>
            <tbody>
              {league?.teams?.map((team, index) => (
                <tr key={team.id}>
                  <td className="text-center">{index + 1}</td>
                  <td>{team.name}</td>
                  <td>{team.clubName}</td>
                  {[1, 2, 3, 4, 5].map(round => {
                    const key = `dg${round}`;
                    // Temporäre Dummy-Daten für die Anzeige
                    const dummyResults = {
                      dg1: 1450 + Math.floor(Math.random() * 50),
                      dg2: 1460 + Math.floor(Math.random() * 50),
                      dg3: 1455 + Math.floor(Math.random() * 50),
                      dg4: 1465 + Math.floor(Math.random() * 50),
                      dg5: 1470 + Math.floor(Math.random() * 50)
                    };
                    return (
                      <td key={round} className="text-center">
                        {dummyResults[key]}
                      </td>
                    );
                  })}
                  <td className="text-center font-medium">{7300 + Math.floor(Math.random() * 200)}</td>
                  <td className="text-center">{(1460 + Math.floor(Math.random() * 40)).toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="print-footer mt-6">
          <p>Erstellt am {new Date().toLocaleDateString()} mit RWK Einbeck App</p>
        </div>
      </div>
    </div>
  );
}