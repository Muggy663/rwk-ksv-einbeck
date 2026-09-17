// src/app/gesamtergebnisliste-generator/page.tsx
"use client";
import React, { useState, useEffect } from 'react';
import { logError } from '@/lib/utils/secure-logger';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { NativeSelect } from '@/components/ui/native-select';
import { Label } from '@/components/ui/label';
import { BarChart3, Printer, ArrowLeft, FileText, FileSpreadsheet, FileDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { BackButton } from '@/components/ui/back-button';
import { db } from '@/lib/firebase/config';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import type { Season, League, Team } from '@/types/rwk';
import { getSeasonSpecificScoresCollection } from '@/lib/utils/collection-names';
import { exportGesamtlisteExcel, exportGesamtlistePdf, type GesamtlisteExportData } from '@/lib/utils/gesamtliste-export';
import Link from 'next/link';

export default function GesamtergebnislisteGeneratorPage() {
  const { toast } = useToast();
  
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>('');
  const [selectedLeagueId, setSelectedLeagueId] = useState<string>('');
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoadingTeams, setIsLoadingTeams] = useState(false);
  // Ergebnisse je Schütze/Durchgang (für Vorbefüllung im Export): Map shooterId -> { 1: ringe, 2: ... }
  const [scoresByShooter, setScoresByShooter] = useState<Record<string, Record<number, number>>>({});
  const [isExporting, setIsExporting] = useState(false);

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
        logError('Fehler beim Laden der Daten:', error);
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
          captainEmail: '',
          // Echte Kontaktdaten separat für den internen Export (nicht in der Anzeige verwendet)
          _exportPhone: team.captainPhone || team.teamLeaderPhone || ''
        }));
        
        setTeams(teamsWithShooters);

        // Vorhandene Ergebnisse laden (für Vorbefüllung im Export)
        try {
          const season = seasons.find(s => s.id === selectedSeasonId);
          const league = leagues.find(l => l.id === selectedLeagueId);
          const scoreMap: Record<string, Record<number, number>> = {};
          let scoresSnap;
          if (season?.competitionYear && league?.type) {
            try {
              const coll = getSeasonSpecificScoresCollection(season.competitionYear, league.type);
              scoresSnap = await getDocs(query(
                collection(db, coll),
                where('leagueId', '==', selectedLeagueId),
                where('competitionYear', '==', season.competitionYear)
              ));
            } catch {
              scoresSnap = await getDocs(query(collection(db, 'rwk_scores'), where('leagueId', '==', selectedLeagueId)));
            }
          } else {
            scoresSnap = await getDocs(query(collection(db, 'rwk_scores'), where('leagueId', '==', selectedLeagueId)));
          }
          // Dedup: pro shooterId+durchgang neuesten Eintrag (entryTimestamp) behalten
          const dedup = new Map<string, any>();
          scoresSnap.forEach(d => {
            const sc: any = { id: d.id, ...d.data() };
            const key = `${sc.shooterId}|${sc.durchgang}`;
            const existing = dedup.get(key);
            if (!existing) { dedup.set(key, sc); return; }
            const a = sc.entryTimestamp?.seconds || 0;
            const b = existing.entryTimestamp?.seconds || 0;
            if (a > b) dedup.set(key, sc);
          });
          dedup.forEach(sc => {
            if (!sc.shooterId || typeof sc.durchgang !== 'number') return;
            if (sc.durchgang < 1 || sc.durchgang > 5) return;
            if (typeof sc.totalRinge !== 'number') return;
            if (!scoreMap[sc.shooterId]) scoreMap[sc.shooterId] = {};
            scoreMap[sc.shooterId][sc.durchgang] = sc.totalRinge;
          });
          setScoresByShooter(scoreMap);
        } catch (scoreErr) {
          logError('Fehler beim Laden der Ergebnisse für den Export:', scoreErr);
          setScoresByShooter({});
        }
        
      } catch (error) {
        logError('Fehler beim Laden der Teams:', error);
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

  // Baut die Export-Datenstruktur aus den geladenen Teams + Ergebnissen
  const buildExportData = (): GesamtlisteExportData => {
    const season = seasons.find(s => s.id === selectedSeasonId);
    const league = availableLeagues.find(l => l.id === selectedLeagueId);

    // Abgabetermin analog zur Anzeige ermitteln
    let abgabetermin = '';
    if (season) {
      if ((season as any).wettkampfende) {
        const d = new Date((season as any).wettkampfende);
        if (!isNaN(d.getTime())) abgabetermin = d.toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' });
      }
      if (!abgabetermin) {
        const yearMatch = season.name.match(/(\d{4})/);
        const year = yearMatch ? yearMatch[1] : '';
        if (season.name.toLowerCase().includes('kleinkaliber')) abgabetermin = `15. August ${year}`;
        else if (season.name.toLowerCase().includes('luftdruck')) abgabetermin = `1. März ${year}`;
      }
    }

    const sortedTeams = [...teams].sort((a, b) => {
      const aE = a.name.toLowerCase().includes('einzel');
      const bE = b.name.toLowerCase().includes('einzel');
      if (aE && !bE) return 1;
      if (!aE && bE) return -1;
      return a.name.localeCompare(b.name);
    });

    const mannschaften = sortedTeams.map(team => {
      const isEinzel = team.name.toLowerCase().includes('einzel');
      const shooters = (team as any).shooters || [];
      const list = isEinzel ? shooters : shooters.slice(0, 3);
      const schuetzen = (list.length > 0 ? list : [null, null, null].slice(0, isEinzel ? 1 : 3)).map((s: any) => {
        const name = s ? ((s.firstName && s.lastName) ? `${s.firstName} ${s.lastName}` : (s.name || '')) : '';
        const ringe: Record<number, number | undefined> = {};
        if (s?.id && scoresByShooter[s.id]) {
          for (let dg = 1; dg <= 5; dg++) {
            const v = scoresByShooter[s.id][dg];
            if (typeof v === 'number') ringe[dg] = v;
          }
        }
        return { name, ringe };
      });
      return {
        name: team.name,
        telefon: (team as any)._exportPhone || '',
        einzel: isEinzel,
        schuetzen,
      };
    });

    return {
      kopf: {
        sportjahr: season?.name || 'Rundenwettkampf',
        liga: league?.name || 'Liga',
        verband: 'Kreisschützenverband Einbeck',
        abgabetermin: abgabetermin || undefined,
      },
      mannschaften,
    };
  };

  const handleExcelExport = async () => {
    setIsExporting(true);
    try {
      await exportGesamtlisteExcel(buildExportData());
      toast({ title: 'Excel erstellt', description: 'Die Gesamtliste wurde als .xlsx heruntergeladen.' });
    } catch (e) {
      logError('Excel-Export fehlgeschlagen:', e);
      toast({ title: 'Fehler', description: 'Excel konnte nicht erstellt werden.', variant: 'destructive' });
    } finally {
      setIsExporting(false);
    }
  };

  const handlePdfExport = async () => {
    setIsExporting(true);
    try {
      await exportGesamtlistePdf(buildExportData());
      toast({ title: 'PDF erstellt', description: 'Die Gesamtliste wurde als PDF heruntergeladen.' });
    } catch (e) {
      logError('PDF-Export fehlgeschlagen:', e);
      toast({ title: 'Fehler', description: 'PDF konnte nicht erstellt werden.', variant: 'destructive' });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-3">
          <BackButton className="mr-2" fallbackHref="/dokumente" />
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
              <NativeSelect
                value={selectedSeasonId}
                onValueChange={setSelectedSeasonId}
                placeholder="Saison wählen"
                options={seasons.map(season => ({ value: season.id, label: season.name }))}
              />
            </div>
            <div>
              <Label>Liga *</Label>
              <NativeSelect
                value={selectedLeagueId}
                onValueChange={setSelectedLeagueId}
                placeholder="Liga wählen"
                options={availableLeagues.map(league => ({ value: league.id, label: league.name }))}
              />
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
                  iframeDoc?.close();
                  
                  setTimeout(() => {
                    iframe.contentWindow?.print();
                    setTimeout(() => {
                      document.body.removeChild(iframe);
                    }, 1000);
                  }, 500);
                }
              }} disabled={!selectedSeasonId || !selectedLeagueId}>
                <Printer className="mr-2 h-4 w-4" />
                Drucken
              </Button>
              <Button variant="outline" size="sm" onClick={handleExcelExport} disabled={!selectedSeasonId || !selectedLeagueId || isExporting}>
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Excel (mit Formeln)
              </Button>
              <Button variant="outline" size="sm" onClick={handlePdfExport} disabled={!selectedSeasonId || !selectedLeagueId || isExporting}>
                <FileDown className="mr-2 h-4 w-4" />
                PDF
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
                <img src={typeof window !== 'undefined' ? `${window.location.origin}/images/logo.png` : '/images/logo.png'} alt="Logo" className="w-12 h-12 object-contain" />
                <div className="text-center flex-1">
                  <h1 className="text-lg font-bold">Kreisschützenverband Einbeck</h1>
                  <h2 className="text-md">{selectedSeasonId ? seasons.find(s => s.id === selectedSeasonId)?.name || 'Rundenwettkampf' : 'Rundenwettkampf'} - {availableLeagues.find(l => l.id === selectedLeagueId)?.name || 'Liga'}</h2>
                </div>
                <div className="text-right text-xs">
                  {(() => {
                    const season = seasons.find(s => s.id === selectedSeasonId);
                    if (!season) return null;
                    let abgabe = '';
                    // 1. Bevorzugt das gepflegte Wettkampfende-Datum der Saison verwenden.
                    if ((season as any).wettkampfende) {
                      const d = new Date((season as any).wettkampfende);
                      if (!isNaN(d.getTime())) {
                        abgabe = d.toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' });
                      }
                    }
                    // 2. Fallback: Standard aus der RWK-Ordnung (LD 1. März / KK 15. August).
                    if (!abgabe) {
                      const yearMatch = season.name.match(/(\d{4})/);
                      const year = yearMatch ? yearMatch[1] : '';
                      if (season.name.toLowerCase().includes('kleinkaliber')) abgabe = `15. August ${year}`;
                      else if (season.name.toLowerCase().includes('luftdruck')) abgabe = `1. März ${year}`;
                    }
                    if (!abgabe) return null;
                    return <div className="text-red-600 font-bold">Abgabetermin: {abgabe}</div>;
                  })()}
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
                        const shooterCount = isEinzelTeam ? ((team as any).shooters?.length || 1) : 3;
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
                                  {(() => { const s = (team as any).shooters?.[shooterIndex]; if (!s) return `Schütze ${shooterIndex + 1}`; return (s.firstName && s.lastName) ? `${s.firstName} ${s.lastName}` : s.name || `Schütze ${shooterIndex + 1}`; })()}
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
