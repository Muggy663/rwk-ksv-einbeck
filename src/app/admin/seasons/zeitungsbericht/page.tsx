"use client";
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Copy, FileText, Loader2, ArrowLeft } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, orderBy, doc, getDoc } from 'firebase/firestore';
import { fetchTopShooters, fetchTopTeams, fetchBestOverallShooters } from '@/lib/utils/certificate-data-generator';

interface ZeitungsberichtData {
  saison: string;
  wettkampftag: string;
  ort: string;
  siegerehrungOrt: string;
  besteSchuetzen: Array<{
    name: string;
    verein: string;
    ringe: number;
    liga: string;
  }>;
  besteMannschaften: Array<{
    name: string;
    verein: string;
    ringe: number;
    liga: string;
    schuetzen?: string;
  }>;
  besterKKAuflage: {
    name: string;
    verein: string;
    ringe: number;
  } | null;
  besteDame: {
    name: string;
    verein: string;
    ringe: number;
  } | null;
}

export default function ZeitungsberichtPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const seasonId = searchParams.get('seasonId');

  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<ZeitungsberichtData | null>(null);
  const [wettkampftag, setWettkampftag] = useState('');
  const [ort, setOrt] = useState('');
  const [siegerehrungOrt, setSiegerehrungOrt] = useState('');
  const [generatedText, setGeneratedText] = useState('');
  
  // Neue Dropdown-Optionen wie bei Urkunden
  const [selectedSeason, setSelectedSeason] = useState<string>('');
  const [selectedLeague, setSelectedLeague] = useState<string>('');
  const [seasons, setSeasons] = useState<Array<{ id: string; name: string }>>([]);
  const [leagues, setLeagues] = useState<Array<{ id: string; name: string; type: string }>>([]);
  const [numTopShooters, setNumTopShooters] = useState<number>(3);
  const [numTopTeams, setNumTopTeams] = useState<number>(2);
  const [includeOverallBest, setIncludeOverallBest] = useState<boolean>(true);
  const [collectedData, setCollectedData] = useState<ZeitungsberichtData | null>(null);

  // Lade verfügbare Saisons
  useEffect(() => {
    const fetchSeasons = async () => {
      try {
        const seasonsQuery = query(
          collection(db, 'seasons'),
          where('status', 'in', ['Laufend', 'Abgeschlossen']),
          orderBy('competitionYear', 'desc')
        );
        
        const snapshot = await getDocs(seasonsQuery);
        const seasonsData = snapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name
        }));
        
        setSeasons(seasonsData);
        
        // Setze seasonId aus URL oder erste Saison
        if (seasonId && seasonsData.find(s => s.id === seasonId)) {
          setSelectedSeason(seasonId);
        } else if (seasonsData.length > 0) {
          setSelectedSeason(seasonsData[0].id);
        }
      } catch (error) {
        console.error('Fehler beim Laden der Saisons:', error);
      }
    };
    
    fetchSeasons();
  }, [seasonId]);

  // Lade Ligen für die ausgewählte Saison
  useEffect(() => {
    if (!selectedSeason) return;
    
    const fetchLeagues = async () => {
      try {
        const leaguesQuery = query(
          collection(db, 'rwk_leagues'),
          where('seasonId', '==', selectedSeason),
          orderBy('order', 'asc')
        );
        
        const snapshot = await getDocs(leaguesQuery);
        const leaguesData = snapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name,
          type: doc.data().type
        }));
        
        setLeagues(leaguesData);
        
        // Erste Liga automatisch auswählen
        if (leaguesData.length > 0) {
          setSelectedLeague('ALL_LEAGUES');
        }
      } catch (error) {
        console.error('Fehler beim Laden der Ligen:', error);
      }
    };
    
    fetchLeagues();
  }, [selectedSeason]);

  const fetchZeitungsberichtData = async () => {
    if (!selectedSeason) return;
    
    setIsLoading(true);
    try {
      // Hole Saison-Info
      const seasonRef = doc(db, 'seasons', selectedSeason);
      const seasonSnap = await getDoc(seasonRef);
      
      if (!seasonSnap.exists()) {
        toast({ title: "Fehler", description: "Saison nicht gefunden", variant: "destructive" });
        return;
      }

      const season = seasonSnap.data();
      const besteSchuetzen: any[] = [];
      const besteMannschaften: any[] = [];
      let besterKKAuflage: any = null;
      let besteDame: any = null;
      
      if (selectedLeague && selectedLeague !== 'ALL_LEAGUES') {
        // Spezifische Liga ausgewählt
        const topShooters = await fetchTopShooters(selectedLeague, numTopShooters);
        const topTeams = await fetchTopTeams(selectedLeague, numTopTeams);
        
        // Hole Liga-Name für korrekte Anzeige
        const leagueInfo = leagues.find(l => l.id === selectedLeague);
        const ligaName = leagueInfo ? leagueInfo.name : s.category;
        
        besteSchuetzen.push(...topShooters.map(s => ({
          name: s.name,
          verein: s.clubName || s.teamName,
          ringe: s.totalScore,
          liga: ligaName
        })));
        
        besteMannschaften.push(...topTeams.map(t => {
          // Vereinsname-Extraktion: Entferne römische Zahlen nur aus Vereinsname, nicht aus Teamname
          let vereinsname = t.clubName || 'Unbekannt';
          if (!t.clubName && t.name) {
            // Extrahiere Vereinsname aus Teamname (entferne römische Zahlen am Ende)
            vereinsname = t.name
              .replace(/\s+(I{1,3}|\d+)\s*$/, '') // Entferne nur römische Zahlen/Nummern für Vereinsname
              .trim();
          }
          
          // Schützen-Namen: Nutze teamMembersWithScores wenn verfügbar, sonst teamMembers
          let schuetzenNamen = '';
          if (t.teamMembersWithScores && t.teamMembersWithScores.length > 0) {
            schuetzenNamen = t.teamMembersWithScores.slice(0, 4).map(m => m.name).join(', ');
          } else if (t.teamMembers && t.teamMembers.length > 0) {
            schuetzenNamen = t.teamMembers.slice(0, 4).join(', ');
          }
          
          return {
            name: t.name,
            ringe: t.totalScore,
            liga: ligaName,
            schuetzen: schuetzenNamen
          };
        }));
      } else {
        // Alle Ligen - hole Top-Ergebnisse pro Liga
        for (const league of leagues) {
          try {
            const topShooters = await fetchTopShooters(league.id, numTopShooters);
            const topTeams = await fetchTopTeams(league.id, numTopTeams);
            
            besteSchuetzen.push(...topShooters.map(s => ({
              name: s.name,
              verein: s.clubName || s.teamName,
              ringe: s.totalScore,
              liga: league.name
            })));
            
            besteMannschaften.push(...topTeams.map(t => {
              // Vereinsname-Extraktion: Entferne römische Zahlen nur aus Vereinsname, nicht aus Teamname
              let vereinsname = t.clubName || 'Unbekannt';
              if (!t.clubName && t.name) {
                // Extrahiere Vereinsname aus Teamname (entferne römische Zahlen am Ende)
                vereinsname = t.name
                  .replace(/\s+(I{1,3}|\d+)\s*$/, '') // Entferne nur römische Zahlen/Nummern für Vereinsname
                  .trim();
              }
              
              // Schützen-Namen: Nutze teamMembersWithScores wenn verfügbar, sonst teamMembers
              let schuetzenNamen = '';
              if (t.teamMembersWithScores && t.teamMembersWithScores.length > 0) {
                schuetzenNamen = t.teamMembersWithScores.slice(0, 4).map(m => m.name).join(', ');
              } else if (t.teamMembers && t.teamMembers.length > 0) {
                schuetzenNamen = t.teamMembers.slice(0, 4).join(', ');
              }
              
              return {
                name: t.name,
                ringe: t.totalScore,
                liga: league.name,
                schuetzen: schuetzenNamen
              };
            }));
          } catch (error) {
            console.error(`Fehler bei Liga ${league.name}:`, error);
            // Weiter mit nächster Liga
            continue;
          }
        }
      }
      
      // Gesamtsieger holen wenn gewünscht
      if (includeOverallBest) {
        const bestOverall = await fetchBestOverallShooters(selectedSeason);
        
        if (bestOverall.bestMale) {
          besterKKAuflage = {
            name: bestOverall.bestMale.displayName || bestOverall.bestMale.name,
            verein: bestOverall.bestMale.clubName || 'Unbekannt',
            ringe: bestOverall.bestMale.totalScore
          };
        }
        
        if (bestOverall.bestFemale) {
          besteDame = {
            name: bestOverall.bestFemale.displayName || bestOverall.bestFemale.name,
            verein: bestOverall.bestFemale.clubName || 'Unbekannt',
            ringe: bestOverall.bestFemale.totalScore
          };
        }
      }

      setData({
        saison: season.name || `${season.competitionYear} ${season.type}`,
        wettkampftag: wettkampftag || `${new Date().getDate()}. Wettkampftag`,
        ort: ort,
        siegerehrungOrt: siegerehrungOrt,
        besteSchuetzen: besteSchuetzen.sort((a, b) => {
          // Erst nach Liga sortieren, dann nach Ringen
          const ligaOrder = ['Kreisoberliga', 'Kreisliga', '1. Kreisklasse', '2. Kreisklasse', 'Kleinkaliber Pistole', 'Sportpistole', 'Luftpistole'];
          let aIndex = ligaOrder.findIndex(l => a.liga.includes(l));
          let bIndex = ligaOrder.findIndex(l => b.liga.includes(l));
          if (aIndex === -1) aIndex = 999;
          if (bIndex === -1) bIndex = 999;
          if (aIndex !== bIndex) return aIndex - bIndex;
          return b.ringe - a.ringe;
        }),
        besteMannschaften: besteMannschaften.sort((a, b) => {
          // Erst nach Liga sortieren, dann nach Ringen
          const ligaOrder = ['Kreisoberliga', 'Kreisliga', '1. Kreisklasse', '2. Kreisklasse', 'Kleinkaliber Pistole', 'Sportpistole', 'Luftpistole'];
          let aIndex = ligaOrder.findIndex(l => a.liga.includes(l));
          let bIndex = ligaOrder.findIndex(l => b.liga.includes(l));
          if (aIndex === -1) aIndex = 999;
          if (bIndex === -1) bIndex = 999;
          if (aIndex !== bIndex) return aIndex - bIndex;
          return b.ringe - a.ringe;
        }),
        besterKKAuflage,
        besteDame
      });

    } catch (error) {
      console.error('Fehler beim Laden der Daten:', error);
      toast({ title: "Fehler", description: "Daten konnten nicht geladen werden", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const generateZeitungsbericht = (dataToUse?: ZeitungsberichtData | null) => {
    const reportData = dataToUse || data;
    if (!reportData) return;

    const berichtText = `
**Zeitungsbericht - ${data.saison}**

**${reportData.wettkampftag} in ${reportData.ort}**

Die besten Schützen des Wettkampftages:

${reportData.besteSchuetzen.map((s, i) => 
  `${i + 1}. ${s.name} (${s.verein}) - ${s.ringe} Ringe (${s.liga})`
).join('\n')}

Die besten Mannschaften:

${reportData.besteMannschaften.map((m, i) => 
  `${i + 1}. ${m.name} - ${m.ringe} Ringe (${m.liga})${m.schuetzen ? `\n   Schützen: ${m.schuetzen}` : ''}`
).join('\n')}

${reportData.besterKKAuflage ? `**Bester KK Auflage Schütze:**
${reportData.besterKKAuflage.name} (${reportData.besterKKAuflage.verein}) - ${reportData.besterKKAuflage.ringe} Ringe
` : ''}
${reportData.besteDame ? `**Beste Dame:**
${reportData.besteDame.name} (${reportData.besteDame.verein}) - ${reportData.besteDame.ringe} Ringe
` : ''}

**Siegerehrung:** ${reportData.siegerehrungOrt}

---
*Für Gemini AI: Bitte formuliere diesen Zeitungsbericht in einem ansprechenden, journalistischen Stil um. Füge passende Übergänge hinzu und mache ihn leserfreundlicher.*
    `.trim();

    setGeneratedText(berichtText);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedText);
    toast({ title: "Kopiert!", description: "Text wurde in die Zwischenablage kopiert" });
  };

  // Entferne automatisches Laden - nur manuell über Button
  // useEffect(() => {
  //   if (selectedSeason) {
  //     fetchZeitungsberichtData();
  //   }
  // }, [selectedSeason, selectedLeague, numTopShooters, numTopTeams, includeOverallBest, wettkampftag, ort, siegerehrungOrt]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Zurück
        </Button>
        <h1 className="text-2xl font-bold">📰 Zeitungsbericht Generator</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Konfiguration */}
        <Card>
          <CardHeader>
            <CardTitle>Konfiguration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="season-select">Saison</Label>
                <Select
                  value={selectedSeason}
                  onValueChange={setSelectedSeason}
                  disabled={seasons.length === 0 || isLoading}
                >
                  <SelectTrigger id="season-select" className="w-full">
                    <SelectValue placeholder="Saison auswählen" />
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
                <Label htmlFor="league-select">Liga (leer = alle)</Label>
                <Select
                  value={selectedLeague}
                  onValueChange={setSelectedLeague}
                  disabled={leagues.length === 0 || isLoading}
                >
                  <SelectTrigger id="league-select" className="w-full">
                    <SelectValue placeholder="Liga auswählen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL_LEAGUES">Alle Ligen</SelectItem>
                    {leagues.map(league => (
                      <SelectItem key={league.id} value={league.id}>
                        {league.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="num-shooters">Anzahl Top-Schützen</Label>
                <Select
                  value={numTopShooters.toString()}
                  onValueChange={(value) => setNumTopShooters(parseInt(value))}
                  disabled={isLoading}
                >
                  <SelectTrigger id="num-shooters" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6].map(num => (
                      <SelectItem key={num} value={num.toString()}>
                        {num} Schütze{num > 1 ? 'n' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="num-teams">Anzahl Top-Teams</Label>
                <Select
                  value={numTopTeams.toString()}
                  onValueChange={(value) => setNumTopTeams(parseInt(value))}
                  disabled={isLoading}
                >
                  <SelectTrigger id="num-teams" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4].map(num => (
                      <SelectItem key={num} value={num.toString()}>
                        {num} Team{num > 1 ? 's' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox 
                id="include-overall" 
                checked={includeOverallBest} 
                onCheckedChange={(checked) => setIncludeOverallBest(!!checked)}
                disabled={isLoading}
              />
              <Label htmlFor="include-overall">
                Gesamtsieger einbeziehen (Bester Schütze & Beste Dame)
              </Label>
            </div>
            
            <div>
              <Label htmlFor="wettkampftag">Wettkampftag</Label>
              <Input
                id="wettkampftag"
                value={wettkampftag}
                onChange={(e) => setWettkampftag(e.target.value)}
                placeholder="z.B. 5. Wettkampftag"
              />
            </div>
            
            <div>
              <Label htmlFor="ort">Austragungsort</Label>
              <Input
                id="ort"
                value={ort}
                onChange={(e) => setOrt(e.target.value)}
                placeholder="z.B. Schützenhaus Einbeck"
              />
            </div>
            
            <div>
              <Label htmlFor="siegerehrung">Ort der Siegerehrung</Label>
              <Input
                id="siegerehrung"
                value={siegerehrungOrt}
                onChange={(e) => setSiegerehrungOrt(e.target.value)}
                placeholder="z.B. Vereinsheim KSV Einbeck"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button 
                onClick={fetchZeitungsberichtData} 
                disabled={isLoading || !selectedSeason}
                variant="outline"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <FileText className="h-4 w-4 mr-2" />
                )}
                Daten laden
              </Button>
              <Button 
                onClick={() => {
                  if (!data) return;
                  if (!collectedData) {
                    setCollectedData(data);
                  } else {
                    // Sammle Daten zusammen
                    setCollectedData({
                      ...collectedData,
                      besteSchuetzen: [...collectedData.besteSchuetzen, ...data.besteSchuetzen],
                      besteMannschaften: [...collectedData.besteMannschaften, ...data.besteMannschaften],
                      besterKKAuflage: data.besterKKAuflage || collectedData.besterKKAuflage,
                      besteDame: data.besteDame || collectedData.besteDame
                    });
                  }
                }} 
                disabled={!data}
                variant="outline"
              >
                ➕ Zu Sammlung
              </Button>
            </div>
            <Button 
              onClick={() => generateZeitungsbericht(collectedData || data)} 
              disabled={!collectedData && !data}
              className="w-full"
            >
              📰 Zeitungsbericht generieren
            </Button>
            {collectedData && (
              <Button 
                onClick={() => setCollectedData(null)} 
                variant="destructive"
                size="sm"
                className="w-full"
              >
                🗑️ Sammlung leeren
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Ausgabe */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Generierter Bericht
              {generatedText && (
                <Button variant="outline" size="sm" onClick={copyToClipboard}>
                  <Copy className="h-4 w-4 mr-2" />
                  Kopieren
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {generatedText ? (
              <Textarea
                value={generatedText}
                onChange={(e) => setGeneratedText(e.target.value)}
                rows={20}
                className="font-mono text-sm"
              />
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Konfiguriere die Einstellungen und klicke auf "Generieren"</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Daten-Vorschau */}
      {(data || collectedData) && (
        <Card>
          <CardHeader>
            <CardTitle>📊 {collectedData ? 'Gesammelte' : 'Aktuelle'} Wettkampfdaten</CardTitle>
            {collectedData && (
              <p className="text-sm text-muted-foreground">
                Daten aus mehreren Ligen gesammelt
              </p>
            )}
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-semibold mb-2">🏆 Beste Schützen ({(collectedData || data)?.besteSchuetzen.length})</h4>
                {(collectedData || data)?.besteSchuetzen.map((s, i) => (
                  <div key={i} className="text-muted-foreground">
                    {s.name} ({s.verein}) - {s.ringe} Ringe ({s.liga})
                  </div>
                ))}
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">👥 Beste Mannschaften ({(collectedData || data)?.besteMannschaften.length})</h4>
                {(collectedData || data)?.besteMannschaften.map((m, i) => (
                  <div key={i} className="text-muted-foreground">
                    <div>{m.name} - {m.ringe} Ringe ({m.liga})</div>
                    {m.schuetzen && <div className="text-xs ml-2 text-muted-foreground/70">Schützen: {m.schuetzen}</div>}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}