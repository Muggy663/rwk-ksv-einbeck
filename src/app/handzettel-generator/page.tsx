// src/app/handzettel-generator/page.tsx
"use client";
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileText, Download, Printer, ArrowLeft, BarChart3 } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase/config';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import type { Season, League, Team } from '@/types/rwk';
import Link from 'next/link';

export default function HandzettelGeneratorPage() {
  const { toast } = useToast();
  
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>('');
  const [selectedLeagueId, setSelectedLeagueId] = useState<string>('');
  
  const [selectedDurchgang, setSelectedDurchgang] = useState<number>(1);
  const [wettkampfData, setWettkampfData] = useState({
    datum: '',
    uhrzeit: '19:00',
    ort: ''
  });
  
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
          collection(db, 'rwk_shooters'),
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
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <FileText className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-semibold text-primary">Handzettel-Generator</h1>
            <p className="text-muted-foreground">Erstellen Sie Durchgangs-Meldebögen für Wettkämpfe</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href="/gesamtergebnisliste-generator">
            <Button variant="outline">
              <BarChart3 className="mr-2 h-4 w-4" />
              Gesamtergebnisliste
            </Button>
          </Link>
          <Link href="/dokumente#ligalisten">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Zurück zu Dokumenten
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Meldebogen konfigurieren</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="season-select">Saison</Label>
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
                <Label htmlFor="league-select">Liga *</Label>
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
            </div>

            <div>
              <Label htmlFor="durchgang-select">Durchgang</Label>
              <Select value={selectedDurchgang.toString()} onValueChange={(value) => setSelectedDurchgang(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="Durchgang wählen" />
                </SelectTrigger>
                <SelectContent>
                  {[1,2,3,4,5].map(dg => (
                    <SelectItem key={dg} value={dg.toString()}>
                      {dg}. Durchgang
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="datum">Datum</Label>
                <Input
                  id="datum"
                  type="date"
                  value={wettkampfData.datum}
                  onChange={(e) => setWettkampfData(prev => ({
                    ...prev,
                    datum: e.target.value
                  }))}
                />
              </div>
              <div>
                <Label htmlFor="uhrzeit">Uhrzeit</Label>
                <Input
                  id="uhrzeit"
                  type="time"
                  value={wettkampfData.uhrzeit}
                  onChange={(e) => setWettkampfData(prev => ({
                    ...prev,
                    uhrzeit: e.target.value
                  }))}
                />
              </div>
              <div>
                <Label htmlFor="ort">Ort</Label>
                <Input
                  id="ort"
                  value={wettkampfData.ort}
                  onChange={(e) => setWettkampfData(prev => ({
                    ...prev,
                    ort: e.target.value
                  }))}
                  placeholder="z.B. Einbeck"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Vorschau</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="print-area border rounded-lg p-4 bg-white w-full max-w-[210mm] h-[297mm] text-xs mx-auto overflow-hidden flex flex-col" style={{aspectRatio: '210/297', transform: 'scale(0.75)', transformOrigin: 'top center'}}>
              <div className="flex justify-between items-start mb-4">
                <div className="border p-2 text-xs">
                  <div className="font-bold mb-1">Ergebnisse an:</div>
                  <div>RWK-Leitung</div>
                  <div>Kreisschützenverband Einbeck</div>
                  <div>37574 Einbeck</div>
                </div>
                <div className="text-center flex-1">
                  <h1 className="text-lg font-bold">Kreisschützenverband Einbeck</h1>
                  <h2 className="text-md">KK - Rundenwettkampf 2025</h2>
                  <div className="mt-2">
                    <span className="mr-2">(Meldebogen)</span>
                    <span className="border px-2 py-1">◊ {selectedLeagueId ? availableLeagues.find(l => l.id === selectedLeagueId)?.name || 'Liga wählen' : 'Liga wählen'}</span>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <img src="/images/logo.png" alt="Logo" className="w-16 h-16 object-contain" />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4 mb-4 text-xs">
                <div>Durchgang: <span className="font-bold">{selectedDurchgang}</span></div>
                <div>Datum: <span className="font-bold">{wettkampfData.datum || '__.__.25'}</span></div>
                <div>Uhrzeit: <span className="font-bold">{wettkampfData.uhrzeit}</span></div>
                <div>Ort: <span className="font-bold">{wettkampfData.ort || '___________'}</span></div>
              </div>

              <table className="w-full border-collapse border text-xs flex-1">
                <thead>
                  <tr className="bg-yellow-100">
                    <th className="border p-1 text-left w-1/4">Verein</th>
                    <th className="border p-1 text-left w-1/3">Name</th>
                    <th className="border p-1 text-center w-1/6">Ringe</th>
                    <th className="border p-1 text-center w-1/6">Nachschießen</th>
                    <th className="border p-1 text-center w-1/6">Unterschrift MF</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoadingTeams ? (
                    <tr>
                      <td colSpan={5} className="border p-2 text-center">Lade Mannschaften...</td>
                    </tr>
                  ) : teams.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="border p-2 text-center">Keine Mannschaften gefunden</td>
                    </tr>
                  ) : (
                    teams
                      .sort((a, b) => {
                        const aIsEinzel = a.name.toLowerCase().includes('einzel');
                        const bIsEinzel = b.name.toLowerCase().includes('einzel');
                        if (aIsEinzel && !bIsEinzel) return 1;
                        if (!aIsEinzel && bIsEinzel) return -1;
                        return 0;
                      })
                      .slice(0, 10)
                      .map((team, teamIndex) => {
                        const isEinzelTeam = team.name.toLowerCase().includes('einzel');
                        const shooterCount = isEinzelTeam ? (team.shooters?.length || 1) : 3;
                        const rowSpan = shooterCount + 1;
                        
                        return (
                          <React.Fragment key={team.id}>
                            {Array.from({ length: shooterCount }).map((_, shooterIndex) => (
                              <tr key={`${team.id}-${shooterIndex}`}>
                                {shooterIndex === 0 && (
                                  <td className="border p-0.5 font-bold text-xs" rowSpan={rowSpan}>
                                    {team.name}
                                  </td>
                                )}
                                <td className="border p-0.5 text-xs">
                                  {team.shooters?.[shooterIndex]?.name || `Schütze ${shooterIndex + 1}`}
                                </td>
                                <td className="border p-0.5 h-6"></td>
                                <td className="border p-0.5 h-6"></td>
                                {shooterIndex === 0 && (
                                  <td className="border p-0.5" rowSpan={rowSpan}></td>
                                )}
                              </tr>
                            ))}
                            <tr className="h-4">
                              <td className="border p-0.5 text-xs italic" colSpan={4}>
                                Ansprechpartner: {team.captainName || 'N/A'}
                              </td>
                            </tr>
                          </React.Fragment>
                        );
                      })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-3">
            <Button onClick={async () => {
              const printContent = document.querySelector('.print-area');
              if (printContent) {
                try {
                  const canvas = await html2canvas(printContent as HTMLElement, {
                    scale: 2,
                    useCORS: true,
                    allowTaint: true
                  });
                  
                  const imgData = canvas.toDataURL('image/png');
                  const pdf = new jsPDF('p', 'mm', 'a4');
                  const imgWidth = 210;
                  const pageHeight = 297;
                  const imgHeight = (canvas.height * imgWidth) / canvas.width;
                  
                  pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
                  pdf.save(`Meldebogen_${selectedDurchgang}DG_${wettkampfData.datum || 'unbekannt'}.pdf`);
                  
                  toast({
                    title: 'PDF erstellt',
                    description: 'Der Meldebogen wurde als PDF heruntergeladen.'
                  });
                } catch (error) {
                  console.error('PDF-Fehler:', error);
                  toast({
                    title: 'Fehler',
                    description: 'PDF konnte nicht erstellt werden.',
                    variant: 'destructive'
                  });
                }
              }
            }} disabled={!selectedSeasonId || !selectedLeagueId}>
              <Download className="mr-2 h-4 w-4" />
              PDF herunterladen
            </Button>
            
            <Button variant="outline" onClick={() => {
              const printContent = document.querySelector('.print-area');
              if (printContent) {
                const printWindow = window.open('', '_blank');
                printWindow?.document.write(`
                  <html>
                    <head>
                      <title>Meldebogen</title>
                      <style>
                        @page { size: A4 portrait; margin: 5mm; }
                        @media print { 
                          body { margin: 0; padding: 0; font-family: Arial, sans-serif; font-size: 12px; height: 100vh; }
                          .print-area { width: 100% !important; height: 100% !important; transform: none !important; }
                        }
                        @media screen and (max-width: 768px) {
                          body { margin: 0; padding: 0; font-family: Arial, sans-serif; font-size: 10px; }
                          .print-area { width: 100% !important; height: auto !important; transform: scale(0.8) !important; transform-origin: top left !important; }
                        }
                        body { margin: 0; padding: 0; font-family: Arial, sans-serif; font-size: 12px; height: 100vh; }
                        .print-area { width: 210mm; height: 297mm; display: flex; flex-direction: column; transform: scale(1); transform-origin: top left; }
                        table { border-collapse: collapse; width: 100%; flex: 1; }
                        th, td { border: 1px solid black; padding: 4px; text-align: left; }
                        .bg-yellow-100 { background-color: #fef3c7; }
                        .bg-blue-50 { background-color: #eff6ff; }
                        .bg-gray-100 { background-color: #f3f4f6; }
                        .border { border: 1px solid black; }
                        .font-bold { font-weight: bold; }
                        .text-center { text-align: center; }
                        .text-xs { font-size: 10px; }
                        .italic { font-style: italic; }
                        .grid { display: grid; }
                        .grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
                        .grid-cols-4 { grid-template-columns: repeat(4, 1fr); }
                        .gap-4 { gap: 16px; }
                        .mb-4 { margin-bottom: 16px; }
                        .p-2 { padding: 8px; }
                        .p-3 { padding: 12px; }
                        .h-8 { height: 32px; }
                        .flex { display: flex; }
                        .justify-between { justify-content: space-between; }
                        .items-start { align-items: flex-start; }
                        .flex-1 { flex: 1; }
                        .flex-shrink-0 { flex-shrink: 0; }
                        .flex-col { flex-direction: column; }
                        @media print { 
                          body { margin: 0; padding: 0; height: 100vh; }
                          .print-area { width: 210mm; height: 297mm; display: flex; flex-direction: column; }
                          table { flex: 1; }
                        }
                      </style>
                    </head>
                    <body>${printContent.innerHTML}</body>
                  </html>
                `);
                printWindow?.document.close();
                printWindow?.print();
              }
            }} disabled={!selectedSeasonId || !selectedLeagueId}>
              <Printer className="mr-2 h-4 w-4" />
              Drucken
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}