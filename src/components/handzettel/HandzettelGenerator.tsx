// src/components/handzettel/HandzettelGenerator.tsx
"use client";
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileText, Printer, BarChart3, ArrowLeft } from 'lucide-react';
import { BackButton } from '@/components/ui/back-button';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase/config';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import type { Season, League, Team } from '@/types/rwk';
import Link from 'next/link';

interface HandzettelGeneratorProps {
  showContactData: boolean;
  showGesamtTab?: boolean;
  backButtonHref?: string;
}

export function HandzettelGenerator({ 
  showContactData, 
  showGesamtTab = false,
  backButtonHref = "/dokumente"
}: HandzettelGeneratorProps) {
  const { toast } = useToast();
  
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>('');
  const [selectedLeagueId, setSelectedLeagueId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'durchgang' | 'gesamt'>('durchgang');
  
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
          // Kontaktdaten basierend auf showContactData
          captainName: showContactData ? team.captainName : (team.captainName ? 'Mannschaftsführer' : ''),
          captainPhone: showContactData ? team.captainPhone : '',
          captainEmail: showContactData ? team.captainEmail : ''
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
  }, [selectedSeasonId, selectedLeagueId, showContactData, toast]);

  const availableLeagues = leagues.filter(league => 
    !selectedSeasonId || league.seasonId === selectedSeasonId
  );

  const printStyles = `
    @page { size: A4 portrait; margin: 8mm; }
    @media print { 
      * { color: black !important; background: white !important; }
      body { margin: 0; padding: 0; font-family: Arial, sans-serif; font-size: 11px; }
      .print-area { width: 100% !important; height: 100% !important; transform: none !important; }
      table { width: 100% !important; font-size: 10px !important; }
      th, td { font-size: 10px !important; padding: 4px !important; height: 28px !important; }
      .bg-yellow-100 { background-color: #fef3c7 !important; }
    }
    body { margin: 0; padding: 0; font-family: Arial, sans-serif; font-size: 12px; height: 100vh; }
    .print-area { width: 210mm; height: 297mm; display: flex; flex-direction: column; transform: scale(1); transform-origin: top left; }
    table { border-collapse: collapse; width: 100%; flex: 1; }
    th, td { border: 1px solid black; padding: 4px; text-align: left; }
    .bg-yellow-100 { background-color: #fef3c7; }
    .border { border: 1px solid black; }
    .font-bold { font-weight: bold; }
    .text-center { text-align: center; }
    .text-xs { font-size: 10px; }
    .italic { font-style: italic; }
    .grid { display: grid; }
    .grid-cols-4 { grid-template-columns: repeat(4, 1fr); }
    .gap-4 { gap: 16px; }
    .mb-4 { margin-bottom: 16px; }
    .p-2 { padding: 8px; }
    .flex { display: flex; }
    .justify-between { justify-content: space-between; }
    .items-start { align-items: flex-start; }
    .flex-1 { flex: 1; }
    .flex-shrink-0 { flex-shrink: 0; }
    .flex-col { flex-direction: column; }
  `;

  const isMobile = () => {
    if (typeof window === 'undefined') return false;
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
           window.innerWidth <= 768;
  };

  const printDurchgang = async () => {
    const printContent = document.querySelector('.print-area');
    if (!printContent) return;

    if (isMobile()) {
      // Mobile: Try Web Share API first, fallback to print
      if (navigator.share) {
        try {
          // Create a blob with the HTML content
          const htmlContent = `
            <html>
              <head>
                <title>Meldebogen</title>
                <style>${printStyles}</style>
              </head>
              <body>
                <div class="print-area">${printContent.innerHTML}</div>
              </body>
            </html>
          `;
          
          const blob = new Blob([htmlContent], { type: 'text/html' });
          const file = new File([blob], 'Meldebogen.html', { type: 'text/html' });
          
          await navigator.share({
            title: 'Meldebogen',
            text: 'RWK Meldebogen zum Drucken',
            files: [file]
          });
          return;
        } catch (error) {
          console.log('Web Share API failed, falling back to print');
        }
      }
      
      // Fallback: Direct print
      const styleElement = document.createElement('style');
      styleElement.id = 'mobile-print-styles';
      styleElement.innerHTML = `
        @media print {
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; }
          .print-area { 
            position: absolute; 
            left: 0; 
            top: 0; 
            width: 100% !important;
            height: 100% !important;
            transform: none !important;
            font-size: 12px !important;
          }
          ${printStyles}
        }
      `;
      document.head.appendChild(styleElement);
      
      window.print();
      
      setTimeout(() => {
        const element = document.getElementById('mobile-print-styles');
        if (element) element.remove();
      }, 1000);
    } else {
      // Desktop: Use iframe method
      const iframe = document.createElement('iframe');
      iframe.style.position = 'absolute';
      iframe.style.left = '-9999px';
      iframe.style.width = '1px';
      iframe.style.height = '1px';
      document.body.appendChild(iframe);
      
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      iframeDoc?.write(`
        <html>
          <head>
            <title>Meldebogen</title>
            <style>${printStyles}</style>
          </head>
          <body>${printContent.innerHTML}</body>
        </html>
      `);
      iframeDoc?.close();
      
      setTimeout(() => {
        iframe.contentWindow?.print();
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 1000);
      }, 500);
    }
  };

  return (
    <div className={showGesamtTab ? "space-y-6" : "container mx-auto py-8 space-y-6"}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-3">
          <BackButton className="mr-2" fallbackHref={backButtonHref} />
          <FileText className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-semibold text-primary">
              {showGesamtTab ? "Meldebögen" : "Meldebogen-Generator"}
            </h1>
            <p className="text-muted-foreground">
              Erstellen Sie Durchgangs-Meldebögen für Wettkämpfe
            </p>
          </div>
        </div>
        {!showGesamtTab && (
          <div className="flex flex-wrap gap-2">
            <Link href="/gesamtergebnisliste-generator">
              <Button variant="outline" size="sm">
                <BarChart3 className="mr-2 h-4 w-4" />
                Gesamt
              </Button>
            </Link>
            <Link href="/dokumente#ligalisten">
              <Button variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Zurück
              </Button>
            </Link>
          </div>
        )}
      </div>

      {showGesamtTab && (
        <div className="flex space-x-1 mb-6 border-b">
          <button
            onClick={() => setActiveTab('durchgang')}
            className={`px-4 py-2 font-medium text-sm rounded-t-lg ${
              activeTab === 'durchgang'
                ? 'bg-primary text-primary-foreground border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <FileText className="inline mr-2 h-4 w-4" />
            Durchgangs-Meldebogen
          </button>
          <button
            onClick={() => setActiveTab('gesamt')}
            className={`px-4 py-2 font-medium text-sm rounded-t-lg ${
              activeTab === 'gesamt'
                ? 'bg-primary text-primary-foreground border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Gesamtergebnisliste
          </button>
        </div>
      )}

      {(!showGesamtTab || activeTab === 'durchgang') && (
        <>
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
                <div className="print-area border rounded-lg p-4 bg-white text-xs mx-auto overflow-auto flex flex-col" style={{width: '100%', maxWidth: '400px', height: '600px', transform: 'scale(0.7)', transformOrigin: 'top center'}}>
                  <div className="flex justify-between items-start mb-4">
                    <div className="border p-2 text-xs">
                      <div className="font-bold mb-1">Ergebnisse an:</div>
                      <div>RWK-Leitung</div>
                      <div>rwk-leiter-ksve@gmx.de</div>
                    </div>
                    <div className="text-center flex-1">
                      <h1 className="text-lg font-bold">Kreisschützenverband Einbeck</h1>
                      <h2 className="text-md">{selectedSeasonId ? seasons.find(s => s.id === selectedSeasonId)?.name || 'Rundenwettkampf' : 'Rundenwettkampf'}</h2>
                      <div className="mt-2">
                        <span className="mr-2">Meldebogen für </span>
                        <span>{selectedLeagueId ? availableLeagues.find(l => l.id === selectedLeagueId)?.name || 'Liga wählen' : 'Liga wählen'}</span>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <img src="/images/logo.png" alt="Logo" className="w-24 h-24 object-contain" style={{width: '100px', height: '100px'}} />
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-4 mb-4 text-xs">
                    <div>Durchgang: <span className="font-bold">{selectedDurchgang}</span></div>
                    <div>Datum: <span className="font-bold">{wettkampfData.datum ? new Date(wettkampfData.datum).toLocaleDateString('de-DE') : '__.__.25'}</span></div>
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
                          .map((team) => {
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
                                    {showContactData && team.captainPhone && `, ${team.captainPhone}`}
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
                <Button variant="outline" onClick={printDurchgang} disabled={!selectedSeasonId || !selectedLeagueId}>
                  <Printer className="mr-2 h-4 w-4" />
                  {typeof window !== 'undefined' && isMobile() ? 'Teilen/Drucken' : 'Drucken'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {showGesamtTab && activeTab === 'gesamt' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Konfiguration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
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
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Gesamtergebnisliste (5 Durchgänge)</CardTitle>
                <Button variant="outline" onClick={async () => {
                  const printContent = document.querySelector('.gesamt-print-area');
                  if (!printContent) return;

                  const gesamtPrintStyles = `
                    @page { size: A4 landscape; margin: 8mm; }
                    @media print { 
                      * { color: black !important; background: white !important; }
                      body { margin: 0; padding: 0; font-family: Arial, sans-serif; font-size: 10px; }
                      .gesamt-print-area { width: 100% !important; height: 100% !important; transform: none !important; }
                      table { width: 100% !important; font-size: 8px !important; }
                      th, td { font-size: 8px !important; padding: 2px !important; }
                      .bg-yellow-100 { background-color: #fef3c7 !important; }
                      .bg-gray-100 { background-color: #f3f4f6 !important; }
                    }
                    body { margin: 0; padding: 0; font-family: Arial, sans-serif; font-size: 10px; }
                    table { border-collapse: collapse; width: 100%; }
                    th, td { border: 1px solid black; padding: 2px; text-align: left; }
                    .bg-yellow-100 { background-color: #fef3c7; }
                    .bg-gray-100 { background-color: #f3f4f6; }
                    .border { border: 1px solid black; }
                    .font-bold { font-weight: bold; }
                    .text-center { text-align: center; }
                    .text-xs { font-size: 8px; }
                    .italic { font-style: italic; }
                    .flex { display: flex; }
                    .justify-between { justify-content: space-between; }
                    .items-center { align-items: center; }
                    .flex-1 { flex: 1; }
                    .mb-4 { margin-bottom: 16px; }
                    img { width: 60px !important; height: 60px !important; object-fit: contain !important; }
                  `;

                  if (isMobile()) {
                    // Mobile: Try Web Share API first
                    if (navigator.share) {
                      try {
                        const htmlContent = `
                          <html>
                            <head>
                              <title>Gesamtergebnisliste</title>
                              <style>${gesamtPrintStyles}</style>
                            </head>
                            <body>
                              <div class="gesamt-print-area">${printContent.innerHTML}</div>
                            </body>
                          </html>
                        `;
                        
                        const blob = new Blob([htmlContent], { type: 'text/html' });
                        const file = new File([blob], 'Gesamtergebnisliste.html', { type: 'text/html' });
                        
                        await navigator.share({
                          title: 'Gesamtergebnisliste',
                          text: 'RWK Gesamtergebnisliste zum Drucken',
                          files: [file]
                        });
                        return;
                      } catch (error) {
                        console.log('Web Share API failed, falling back to print');
                      }
                    }
                    
                    // Fallback: Direct print
                    const styleElement = document.createElement('style');
                    styleElement.id = 'mobile-gesamt-print-styles';
                    styleElement.innerHTML = `
                      @media print {
                        body * { visibility: hidden; }
                        .gesamt-print-area, .gesamt-print-area * { visibility: visible; }
                        .gesamt-print-area { 
                          position: absolute; 
                          left: 0; 
                          top: 0; 
                          width: 100% !important;
                          height: 100% !important;
                          transform: none !important;
                          font-size: 10px !important;
                        }
                        ${gesamtPrintStyles}
                      }
                    `;
                    document.head.appendChild(styleElement);
                    
                    window.print();
                    
                    setTimeout(() => {
                      const element = document.getElementById('mobile-gesamt-print-styles');
                      if (element) element.remove();
                    }, 1000);
                  } else {
                    // Desktop: Use iframe method
                    const iframe = document.createElement('iframe');
                    iframe.style.position = 'absolute';
                    iframe.style.left = '-9999px';
                    iframe.style.width = '1px';
                    iframe.style.height = '1px';
                    document.body.appendChild(iframe);
                    
                    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
                    iframeDoc?.write(`
                      <html>
                        <head>
                          <title>Gesamtergebnisliste</title>
                          <style>${gesamtPrintStyles}</style>
                        </head>
                        <body>${printContent.innerHTML}</body>
                      </html>
                    `);
                    iframeDoc?.close();
                    
                    setTimeout(() => {
                      iframe.contentWindow?.print();
                      setTimeout(() => {
                        document.body.removeChild(iframe);
                      }, 1000);
                    }, 500);
                  }
                }} disabled={!selectedSeasonId || !selectedLeagueId} size="sm">
                  <Printer className="mr-2 h-4 w-4" />
                  {typeof window !== 'undefined' && isMobile() ? 'Teilen/Drucken' : 'Drucken'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="gesamt-print-area border rounded-lg p-2 bg-white overflow-x-auto" style={{
                transform: `scale(${Math.max(0.75, 1 - (teams.length * 0.02))})`, 
                transformOrigin: 'top left', 
                width: '130%'
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
                        teams
                          .sort((a, b) => {
                            const aIsEinzel = a.name.toLowerCase().includes('einzel');
                            const bIsEinzel = b.name.toLowerCase().includes('einzel');
                            if (aIsEinzel && !bIsEinzel) return 1;
                            if (!aIsEinzel && bIsEinzel) return -1;
                            return a.name.localeCompare(b.name);
                          })
                          .map((team) => {
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
                                <td className="border p-1 text-xs italic" colSpan={13}>
                                  Ansprechpartner: {team.captainName || 'N/A'}
                                  {showContactData && team.captainPhone && `, ${team.captainPhone}`}
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
      )}
    </div>
  );
}