// src/app/gesamtergebnisliste-generator/page.tsx
"use client";
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { BarChart3, Printer, ArrowLeft, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase/config';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import type { Season, League, Team } from '@/types/rwk';
import Link from 'next/link';

export default function GesamtergebnislisteGeneratorPage() {
  const { toast } = useToast();
  
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>('');
  const [selectedLeagueId, setSelectedLeagueId] = useState<string>('');
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoadingTeams, setIsLoadingTeams] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const seasonsQuery = query(
          collection(db, 'seasons'),
          where('status', '==', 'Laufend'),
          orderBy('competitionYear', 'desc')
        );
        const seasonsSnapshot = await getDocs(seasonsQuery);
        const seasonsData = seasonsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Season));
        setSeasons(seasonsData.filter(s => s.id && s.id.trim() !== ''));

        const leaguesQuery = query(
          collection(db, 'rwk_leagues'),
          orderBy('order', 'asc')
        );
        const leaguesSnapshot = await getDocs(leaguesQuery);
        const leaguesData = leaguesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as League));
        setLeagues(leaguesData.filter(l => l.id && l.id.trim() !== ''));
        
        if (seasonsData.length > 0 && !selectedSeasonId) {
          setSelectedSeasonId(seasonsData[0].id);
        }
      } catch (error) {
        console.error('Fehler beim Laden der Daten:', error);
        toast({
          title: 'Fehler',
          description: 'Daten konnten nicht geladen werden.',
          variant: 'destructive'
        });
      }
    };

    loadData();
  }, [toast]);

  useEffect(() => {
    const loadTeams = async () => {
      if (!selectedSeasonId || !selectedLeagueId) return;
      
      setIsLoadingTeams(true);
      try {
        const teamsQuery = query(
          collection(db, 'rwk_teams'),
          where('seasonId', '==', selectedSeasonId),
          where('leagueId', '==', selectedLeagueId),
          orderBy('name', 'asc')
        );
        
        const teamsSnapshot = await getDocs(teamsQuery);
        const teamsData = teamsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Team));
        
        const shootersQuery = query(
          collection(db, 'shooters'),
          orderBy('name', 'asc')
        );
        const shootersSnapshot = await getDocs(shootersQuery);
        const shootersData = shootersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        const shooterMap = new Map();
        shootersData.forEach(shooter => {
          shooterMap.set(shooter.id, shooter);
        });
        
        const teamsWithShooters = teamsData.map(team => ({
          ...team,
          shooters: (team.shooterIds || []).map(id => shooterMap.get(id)).filter(Boolean),
          // Entferne sensible Kontaktdaten für öffentlichen Bereich
          captainName: team.captainName ? 'Mannschaftsführer' : '',
          captainPhone: '',
          captainEmail: ''
        }));
        
        setTeams(teamsWithShooters);
        
      } catch (error) {
        console.error('Fehler beim Laden der Teams:', error);
        toast({
          title: 'Fehler',
          description: 'Teams konnten nicht geladen werden.',
          variant: 'destructive'
        });
      } finally {
        setIsLoadingTeams(false);
      }
    };
    
    loadTeams();
  }, [selectedSeasonId, selectedLeagueId, toast]);

  const availableLeagues = leagues.filter(league => 
    !selectedSeasonId || league.seasonId === selectedSeasonId
  );

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-3">
          <BarChart3 className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-semibold text-primary">Gesamtergebnisliste-Generator</h1>
            <p className="text-muted-foreground">Erstellen Sie Gesamtergebnislisten für alle 5 Durchgänge</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/handzettel-generator">
            <Button variant="outline" size="sm">
              <FileText className="mr-2 h-4 w-4" />
              Handzettel
            </Button>
          </Link>
          <Link href="/dokumente#ligalisten">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Zurück
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Konfiguration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Saison</Label>
              <Select value={selectedSeasonId} onValueChange={setSelectedSeasonId}>
                <SelectTrigger>
                  <SelectValue placeholder="Saison wählen" />
                </SelectTrigger>
                <SelectContent>
                  {seasons.map(season => (
                    <SelectItem key={season.id} value={season.id}>
                      {season.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Liga *</Label>
              <Select value={selectedLeagueId} onValueChange={setSelectedLeagueId}>
                <SelectTrigger>
                  <SelectValue placeholder="Liga wählen" />
                </SelectTrigger>
                <SelectContent>
                  {availableLeagues.map(league => (
                    <SelectItem key={league.id} value={league.id}>
                      {league.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
              <CardTitle>Gesamtergebnisliste (5 Durchgänge)</CardTitle>
              <Button variant="outline" size="sm" onClick={() => {
                const printContent = document.querySelector('.gesamt-print-area');
                if (printContent) {
                  const printWindow = window.open('', '_blank');
                  printWindow?.document.write(`
                    <html>
                      <head>
                        <title>Gesamtergebnisliste</title>
                        <style>
                          @page { size: A4 landscape; margin: 5mm; }
                          @media print { 
                            body { margin: 0; padding: 0; font-family: Arial, sans-serif; font-size: ${teams.length > 12 ? '5px' : teams.length > 8 ? '6px' : '7px'}; }
                            .gesamt-print-area { width: 100% !important; height: 100% !important; transform: none !important; }
                          }
                          @media screen and (max-width: 768px) {
                            body { margin: 0; padding: 0; font-family: Arial, sans-serif; font-size: 8px; }
                            .gesamt-print-area { width: 100% !important; height: auto !important; transform: scale(0.6) !important; transform-origin: top left !important; }
                            table { font-size: 6px !important; }
                            th, td { padding: 1px !important; height: 12px !important; }
                          }
                          body { margin: 0; padding: 0; font-family: Arial, sans-serif; font-size: ${teams.length > 12 ? '5px' : teams.length > 8 ? '6px' : '7px'}; }
                          .gesamt-print-area { width: 100%; height: 95vh; page-break-inside: avoid; transform: scale(${Math.max(0.75, 1 - (teams.length * 0.02))}); transform-origin: top left; }
                          table { border-collapse: collapse; width: 100%; font-size: ${teams.length > 12 ? '6px' : teams.length > 8 ? '7px' : '8px'}; }
                          th, td { border: 1px solid black; padding: ${teams.length > 12 ? '1px' : teams.length > 8 ? '2px' : '3px'}; text-align: center; vertical-align: middle; font-size: ${teams.length > 12 ? '6px' : teams.length > 8 ? '7px' : '8px'} !important; height: ${Math.max(12, 18 - teams.length)}px; line-height: 1; }
                          .bg-yellow-100 { background-color: #fef3c7 !important; }
                          .bg-gray-100 { background-color: #f3f4f6 !important; }
                          .font-bold { font-weight: bold; }
                          .text-center { text-align: center; }
                          .text-left { text-align: left; }
                          .italic { font-style: italic; }
                          .flex { display: flex; }
                          .justify-between { justify-content: space-between; }
                          .items-center { align-items: center; }
                          .mb-4 { margin-bottom: 8px; }
                          .text-lg { font-size: 12px; }
                          .text-md { font-size: 10px; }
                          img { width: 30px; height: 30px; }
                        </style>
                      </head>
                      <body>${printContent.innerHTML}</body>
                    </html>
                  `);
                  printWindow?.document.close();
                  printWindow?.print();
                }
              }} disabled={!selectedSeasonId || !selectedLeagueId} size="sm">
                <Printer className="mr-2 h-4 w-4" />
                Drucken
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="gesamt-print-area border rounded-lg p-2 bg-white w-full overflow-auto" style={{
              transform: `scale(${Math.max(0.4, 0.6 - (teams.length * 0.01))})`, 
              transformOrigin: 'top left',
              height: '500px'
            }}>
              <div className="flex justify-between items-center mb-4">
                <img src="/images/logo.png" alt="Logo" className="w-12 h-12 object-contain" />
                <div className="text-center flex-1">
                  <h1 className="text-lg font-bold">Kreisschützenverband Einbeck</h1>
                  <h2 className="text-md">Gesamtergebnisliste - {availableLeagues.find(l => l.id === selectedLeagueId)?.name || 'Liga'}</h2>
                </div>
              </div>

              {selectedLeagueId ? (
                <table className="w-full border-collapse border text-xs">
                  <thead>
                    <tr className="bg-yellow-100">
                      <th className="border p-1 text-left" rowSpan={3}>Mannschaft</th>
                      <th className="border p-1 text-left" rowSpan={3}>Name</th>
                      <th className="border p-1 text-center" colSpan={2}>1. Durchgang</th>
                      <th className="border p-1 text-center" colSpan={2}>2. Durchgang</th>
                      <th className="border p-1 text-center" colSpan={2}>3. Durchgang</th>
                      <th className="border p-1 text-center" colSpan={2}>4. Durchgang</th>
                      <th className="border p-1 text-center" colSpan={2}>5. Durchgang</th>
                      <th className="border p-1 text-center" colSpan={2}>Platz</th>
                    </tr>
                    <tr className="bg-yellow-100">
                      <td className="border p-2 text-center text-xs" colSpan={2}></td>
                      <td className="border p-2 text-center text-xs" colSpan={2}></td>
                      <td className="border p-2 text-center text-xs" colSpan={2}></td>
                      <td className="border p-2 text-center text-xs" colSpan={2}></td>
                      <td className="border p-2 text-center text-xs" colSpan={2}></td>
                      <th className="border p-1 text-center text-xs" rowSpan={2}>Einzel</th>
                      <th className="border p-1 text-center text-xs" rowSpan={2}>Mannschaft</th>
                    </tr>
                    <tr className="bg-yellow-100">
                      <th className="border p-0.5 text-center text-xs">Ringe</th>
                      <th className="border p-0.5 text-center text-xs">Gesamt</th>
                      <th className="border p-0.5 text-center text-xs">Ringe</th>
                      <th className="border p-0.5 text-center text-xs">Gesamt</th>
                      <th className="border p-0.5 text-center text-xs">Ringe</th>
                      <th className="border p-0.5 text-center text-xs">Gesamt</th>
                      <th className="border p-0.5 text-center text-xs">Ringe</th>
                      <th className="border p-0.5 text-center text-xs">Gesamt</th>
                      <th className="border p-0.5 text-center text-xs">Ringe</th>
                      <th className="border p-0.5 text-center text-xs">Gesamt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoadingTeams ? (
                      <tr>
                        <td colSpan={13} className="border p-2 text-center">Lade Mannschaften...</td>
                      </tr>
                    ) : teams.length === 0 ? (
                      <tr>
                        <td colSpan={13} className="border p-2 text-center">Keine Mannschaften gefunden</td>
                      </tr>
                    ) : (
                      teams.map((team) => {
                        const isEinzelTeam = team.name.toLowerCase().includes('einzel');
                        const shooterCount = isEinzelTeam ? (team.shooters?.length || 1) : 3;
                        const rowSpan = shooterCount + 2;
                        
                        return (
                          <React.Fragment key={team.id}>
                            {Array.from({ length: shooterCount }).map((_, shooterIndex) => (
                              <tr key={`${team.id}-${shooterIndex}`}>
                                {shooterIndex === 0 && (
                                  <td className="border p-1 font-bold text-xs bg-gray-100" rowSpan={rowSpan}>
                                    {team.name}
                                  </td>
                                )}
                                <td className="border p-1 text-xs">
                                  {team.shooters?.[shooterIndex]?.name || `Schütze ${shooterIndex + 1}`}
                                </td>
                                <td className="border p-1"></td>
                                <td className="border p-1"></td>
                                <td className="border p-1"></td>
                                <td className="border p-1"></td>
                                <td className="border p-1"></td>
                                <td className="border p-1"></td>
                                <td className="border p-1"></td>
                                <td className="border p-1"></td>
                                <td className="border p-1"></td>
                                <td className="border p-1"></td>
                                <td className="border p-1"></td>
                              </tr>
                            ))}
                            <tr>
                              <td className="border p-1 font-bold text-xs bg-yellow-100">Total</td>
                              <td className="border p-1 font-bold text-xs bg-yellow-100"></td>
                              <td className="border p-1 font-bold text-xs bg-yellow-100"></td>
                              <td className="border p-1 font-bold text-xs bg-yellow-100"></td>
                              <td className="border p-1 font-bold text-xs bg-yellow-100"></td>
                              <td className="border p-1 font-bold text-xs bg-yellow-100"></td>
                              <td className="border p-1 font-bold text-xs bg-yellow-100"></td>
                              <td className="border p-1 font-bold text-xs bg-yellow-100"></td>
                              <td className="border p-1 font-bold text-xs bg-yellow-100"></td>
                              <td className="border p-1 font-bold text-xs bg-yellow-100"></td>
                              <td className="border p-1 font-bold text-xs bg-yellow-100"></td>
                              <td className="border p-1 font-bold text-xs bg-yellow-100"></td>
                              <td className="border p-1 font-bold text-xs bg-yellow-100"></td>
                            </tr>
                            <tr>
                              <td className="border p-1 text-xs italic text-left" colSpan={13}>
                                Ansprechpartner: {team.captainName || 'N/A'}
                              </td>
                            </tr>
                          </React.Fragment>
                        );
                      })
                    )}
                  </tbody>
                </table>
              ) : (
                <div className="text-center p-8 text-muted-foreground">
                  <p>Bitte wählen Sie eine Liga aus, um die Gesamtergebnisliste anzuzeigen.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
