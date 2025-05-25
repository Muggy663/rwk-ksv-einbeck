"use client";
import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Printer, Download } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import type { LeagueDisplay, TeamDisplay, ShooterDisplayResults } from '@/types/rwk';

interface PrintViewProps {
  league: LeagueDisplay;
  seasonName: string;
  seasonYear: number;
}

export function PrintView({ league, seasonName, seasonYear }: PrintViewProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: `RWK_${league.name.replace(/\s+/g, '_')}_${seasonYear}`,
    pageStyle: `
      @page {
        size: A4;
        margin: 10mm;
      }
      @media print {
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          font-size: 12px;
        }
        .print-header {
          text-align: center;
          margin-bottom: 15px;
        }
        .print-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        .print-table th, .print-table td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
        }
        .print-table th {
          background-color: #f2f2f2;
          font-weight: bold;
        }
        .print-table tr:nth-child(even) {
          background-color: #f9f9f9;
        }
        .print-footer {
          text-align: center;
          font-size: 10px;
          margin-top: 20px;
          color: #666;
        }
        .no-print {
          display: none !important;
        }
      }
    `,
  });

  // Generate CSV data for the league
  const generateCSV = () => {
    // Header row
    let csvContent = "Rang,Mannschaft,Verein";
    
    // Add round headers (DG1, DG2, etc.)
    const maxRounds = Math.max(...league.teams.map(team => 
      team.roundResults ? Object.keys(team.roundResults).length : 0
    ));
    
    for (let i = 1; i <= maxRounds; i++) {
      csvContent += `,DG${i}`;
    }
    
    csvContent += ",Gesamt,Durchschnitt\n";
    
    // Team data rows
    league.teams.forEach(team => {
      csvContent += `${team.rank || ''},${team.name},${team.clubName}`;
      
      // Add round results
      for (let i = 1; i <= maxRounds; i++) {
        const roundKey = `${i}`;
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
    link.setAttribute('download', `RWK_${league.name.replace(/\s+/g, '_')}_${seasonYear}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 justify-end no-print">
        <Button variant="outline" onClick={handlePrint}>
          <Printer className="mr-2 h-4 w-4" />
          Drucken
        </Button>
        <Button variant="outline" onClick={generateCSV}>
          <Download className="mr-2 h-4 w-4" />
          CSV exportieren
        </Button>
      </div>
      
      <div ref={printRef} className="bg-white p-6 rounded-lg shadow-sm">
        <div className="print-header">
          <h2 className="text-2xl font-bold text-center">{league.name}</h2>
          <p className="text-center text-muted-foreground">{seasonName} ({seasonYear})</p>
        </div>
        
        <h3 className="text-xl font-semibold mt-6 mb-3">Mannschaftstabelle</h3>
        <div className="overflow-x-auto">
          <table className="print-table w-full">
            <thead>
              <tr>
                <th className="w-[50px]">Rang</th>
                <th>Mannschaft</th>
                <th>Verein</th>
                {league.teams.length > 0 && league.teams[0].roundResults && 
                  Object.keys(league.teams[0].roundResults)
                    .sort((a, b) => parseInt(a) - parseInt(b))
                    .map(round => (
                      <th key={round} className="text-center">DG {round}</th>
                    ))
                }
                <th className="text-center">Gesamt</th>
                <th className="text-center">Ø</th>
              </tr>
            </thead>
            <tbody>
              {league.teams
                .sort((a, b) => (a.rank || 999) - (b.rank || 999))
                .map(team => (
                  <tr key={team.id}>
                    <td className="text-center">{team.rank || '-'}</td>
                    <td>{team.name}</td>
                    <td>{team.clubName}</td>
                    {team.roundResults && 
                      Object.keys(team.roundResults)
                        .sort((a, b) => parseInt(a) - parseInt(b))
                        .map(round => (
                          <td key={round} className="text-center">
                            {team.roundResults[round] !== null ? team.roundResults[round] : '-'}
                          </td>
                        ))
                    }
                    <td className="text-center font-medium">{team.totalScore || '-'}</td>
                    <td className="text-center">{team.averageScore !== null ? team.averageScore.toFixed(1) : '-'}</td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
        
        <h3 className="text-xl font-semibold mt-8 mb-3">Einzelschützen</h3>
        <div className="overflow-x-auto">
          <table className="print-table w-full">
            <thead>
              <tr>
                <th>Name</th>
                <th>Mannschaft</th>
                {league.teams.length > 0 && 
                  league.teams[0].shootersResults.length > 0 && 
                  league.teams[0].shootersResults[0].results && 
                  Object.keys(league.teams[0].shootersResults[0].results)
                    .sort((a, b) => parseInt(a) - parseInt(b))
                    .map(round => (
                      <th key={round} className="text-center">DG {round}</th>
                    ))
                }
                <th className="text-center">Gesamt</th>
                <th className="text-center">Ø</th>
                <th className="text-center">Runden</th>
              </tr>
            </thead>
            <tbody>
              {league.teams.flatMap(team => 
                team.shootersResults.map(shooter => ({
                  ...shooter,
                  teamName: team.name
                }))
              )
              .sort((a, b) => {
                // Sort by average score (descending)
                const avgA = a.average || 0;
                const avgB = b.average || 0;
                return avgB - avgA;
              })
              .map((shooter, index) => (
                <tr key={`${shooter.shooterId}-${index}`}>
                  <td>{shooter.shooterName}</td>
                  <td>{shooter.teamName}</td>
                  {Object.keys(shooter.results)
                    .sort((a, b) => parseInt(a) - parseInt(b))
                    .map(round => (
                      <td key={round} className="text-center">
                        {shooter.results[round] !== null ? shooter.results[round] : '-'}
                      </td>
                    ))
                  }
                  <td className="text-center font-medium">{shooter.total || '-'}</td>
                  <td className="text-center">{shooter.average !== null ? shooter.average.toFixed(1) : '-'}</td>
                  <td className="text-center">{shooter.roundsShot}</td>
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