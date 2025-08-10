"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Award, Loader2, ArrowLeft } from 'lucide-react';
import { CertificateGenerator } from '@/lib/utils/certificate-generator';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, orderBy, doc, getDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { fetchTopShooters, fetchTopTeams, fetchBestOverallShooters } from '@/lib/utils/certificate-data-generator';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import Link from 'next/link';

export default function CertificatesPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedSeason, setSelectedSeason] = useState<string>('');
  const [selectedLeague, setSelectedLeague] = useState<string>('');
  const [seasons, setSeasons] = useState<Array<{ id: string; name: string }>>([]);
  const [leagues, setLeagues] = useState<Array<{ id: string; name: string; type: string }>>([]);
  const [combinePdf, setCombinePdf] = useState<boolean>(true);
  const [numTopShooters, setNumTopShooters] = useState<number>(3);
  const [numTopTeams, setNumTopTeams] = useState<number>(2);
  const [generateOverallBest, setGenerateOverallBest] = useState<boolean>(false);
  const [ceremonyDate, setCeremonyDate] = useState<string>('');

  // Lade verfügbare Saisons
  useEffect(() => {
    const fetchSeasons = async () => {
      try {
        const seasonsQuery = query(
          collection(db, 'seasons'),
          where('status', '==', 'Laufend'),
          orderBy('competitionYear', 'desc')
        );
        
        const snapshot = await getDocs(seasonsQuery);
        const seasonsData = snapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name
        }));
        
        setSeasons(seasonsData);
        
        // Automatisch die neueste Saison auswählen
        if (seasonsData.length > 0) {
          setSelectedSeason(seasonsData[0].id);
        }
      } catch (error) {
        console.error('Fehler beim Laden der Saisons:', error);
        toast({
          title: 'Fehler',
          description: 'Die Saisons konnten nicht geladen werden.',
          variant: 'destructive'
        });
      }
    };
    
    fetchSeasons();
  }, [toast]);

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
        
        // Automatisch die erste Liga auswählen
        if (leaguesData.length > 0) {
          setSelectedLeague(leaguesData[0].id);
        } else {
          setSelectedLeague('');
        }
      } catch (error) {
        console.error('Fehler beim Laden der Ligen:', error);
        toast({
          title: 'Fehler',
          description: 'Die Ligen konnten nicht geladen werden.',
          variant: 'destructive'
        });
      }
    };
    
    fetchLeagues();
  }, [selectedSeason, toast]);

  // Einfache Testfunktion für die Urkunden-Generierung
  const generateTestCertificate = async () => {
    setLoading(true);
    
    try {
      // Beispiel für eine Einzelschützen-Urkunde
      const certificateGenerator = new CertificateGenerator({ orientation: 'portrait' });
      
      certificateGenerator.generateCertificate({
        season: '2025',
        discipline: 'Luftgewehr Auflage',
        category: 'Kreisoberliga',
        recipientName: 'Christa Heise',
        score: '1274',
        rank: 1,
        date: 'Einbeck, 18. Mai 2025'
      });
      
      // PDF öffnen
      certificateGenerator.open();
      
      // Beispiel für eine Mannschafts-Urkunde
      setTimeout(() => {
        const teamCertificateGenerator = new CertificateGenerator({ orientation: 'portrait' });
        
        teamCertificateGenerator.generateCertificate({
          season: '2025',
          discipline: 'Luftgewehr Auflage',
          category: 'Kreisoberliga',
          recipientName: 'SV Edemissen III',
          teamMembersWithScores: [
            { name: 'Andreas Stitz', totalScore: 1520, rounds: 5, averageScore: 304 },
            { name: 'Bernd Klie', totalScore: 1480, rounds: 5, averageScore: 296 },
            { name: 'Thomas Jaeger', totalScore: 1427, rounds: 5, averageScore: 285.4 }
          ],
          score: '4.427',
          rank: 1,
          date: 'Einbeck, 18. Mai 2025'
        });
        
        // PDF öffnen
        teamCertificateGenerator.open();
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Fehler beim Generieren der Test-Urkunden:', error);
      setLoading(false);
      toast({
        title: 'Fehler',
        description: 'Die Test-Urkunden konnten nicht generiert werden.',
        variant: 'destructive'
      });
    }
  };

  // Generiere Urkunden für eine Liga
  const generateLeagueCertificates = async () => {
    if (!selectedLeague || !selectedSeason) {
      toast({
        title: 'Fehler',
        description: 'Bitte wählen Sie eine Liga und Saison aus.',
        variant: 'destructive'
      });
      return;
    }
    
    if (numTopShooters === 0 && numTopTeams === 0) {
      toast({
        title: 'Fehler',
        description: 'Bitte wählen Sie mindestens eine Art von Urkunden aus.',
        variant: 'destructive'
      });
      return;
    }
    
    setLoading(true);
    
    try {
      toast({
        title: 'Info',
        description: 'Die Urkunden werden generiert. Dies kann einen Moment dauern.',
      });
      
      const currentDate = ceremonyDate ? 
        format(new Date(ceremonyDate), 'dd. MMMM yyyy', { locale: de }) : 
        format(new Date(), 'dd. MMMM yyyy', { locale: de });
      const certificates = [];
      
      // Liga-Informationen abrufen
      const leagueRef = doc(db, 'rwk_leagues', selectedLeague);
      const leagueSnap = await getDoc(leagueRef);
      
      if (!leagueSnap.exists()) {
        throw new Error('Liga nicht gefunden');
      }
      const leagueData = leagueSnap.data();
      const leagueName = leagueData.name;
      
      // Top-Schützen abrufen und Urkunden generieren
      if (numTopShooters > 0) {
        const topShooters = await fetchTopShooters(selectedLeague, numTopShooters);
        
        for (const shooter of topShooters) {
          certificates.push({
            type: 'shooter',
            season: shooter.season.replace('RWK ', ''), // "RWK" entfernen
            discipline: shooter.discipline,
            category: leagueName, // Verwende den tatsächlichen Liga-Namen
            recipientName: shooter.name, // Nur Name
            teamName: shooter.teamName, // Mannschaftsname separat
            clubName: shooter.clubName, // Verein separat speichern
            score: shooter.totalScore.toString(),
            rank: shooter.rank,
            date: `Einbeck, ${currentDate}`
          });
        }
      }
      
      // Top-Teams abrufen und Urkunden generieren
      if (numTopTeams > 0) {
        const topTeams = await fetchTopTeams(selectedLeague, numTopTeams);
        
        for (const team of topTeams) {
          certificates.push({
            type: 'team',
            season: team.season.replace('RWK ', ''), // "RWK" entfernen
            discipline: team.discipline,
            category: leagueName, // Verwende den tatsächlichen Liga-Namen
            recipientName: team.name,
            teamMembers: team.teamMembers,
            teamMembersWithScores: team.teamMembersWithScores,
            score: team.totalScore.toString(),
            rank: team.rank,
            date: `Einbeck, ${currentDate}`
          });
        }
      }
      
      // Urkunden generieren
      if (certificates.length === 0) {
        toast({
          title: 'Info',
          description: 'Es wurden keine Daten für Urkunden gefunden.',
        });
        setLoading(false);
        return;
      }
      
      if (combinePdf) {
        // Alle Urkunden in einem PDF
        const certificateGenerator = new CertificateGenerator({ orientation: 'portrait' });
        
        for (let i = 0; i < certificates.length; i++) {
          const cert = certificates[i];
          
          if (i > 0) {
            certificateGenerator.addPage();
          }
          
          if (cert.type === 'team') {
            // Duplikate aus teamMembersWithScores entfernen
            const uniqueMembers = cert.teamMembersWithScores ? 
              cert.teamMembersWithScores.filter((member, index, arr) => 
                arr.findIndex(m => m.name === member.name) === index
              ) : [];
            
            // Berechne das korrekte Gesamtergebnis
            const correctScore = uniqueMembers.reduce((sum, member) => sum + member.totalScore, 0);
            
            certificateGenerator.generateCertificate({
              season: cert.season,
              discipline: cert.discipline,
              category: cert.category,
              recipientName: cert.recipientName,
              teamMembersWithScores: uniqueMembers,
              score: correctScore.toString(),
              rank: cert.rank,
              date: cert.date
            });
          } else {
            certificateGenerator.generateCertificate({
              season: cert.season,
              discipline: cert.discipline,
              category: cert.category,
              recipientName: cert.teamName ? `${cert.recipientName} (${cert.teamName})` : cert.recipientName,
              score: cert.score,
              rank: cert.rank,
              date: cert.date
            });
          }
        }
        
        // PDF speichern
        const leagueName = leagues.find(l => l.id === selectedLeague)?.name || 'Liga';
        certificateGenerator.save(`Urkunden_${leagueName}.pdf`);
      } else {
        // Einzelne PDFs für jede Urkunde
        for (const cert of certificates) {
          const certificateGenerator = new CertificateGenerator({ orientation: 'portrait' });
          
          if (cert.type === 'team') {
            // Duplikate aus teamMembersWithScores entfernen
            const uniqueMembers = cert.teamMembersWithScores ? 
              cert.teamMembersWithScores.filter((member, index, arr) => 
                arr.findIndex(m => m.name === member.name) === index
              ) : [];
            
            // Berechne das korrekte Gesamtergebnis
            const correctScore = uniqueMembers.reduce((sum, member) => sum + member.totalScore, 0);
            
            certificateGenerator.generateCertificate({
              season: cert.season,
              discipline: cert.discipline,
              category: cert.category,
              recipientName: cert.recipientName,
              teamMembersWithScores: uniqueMembers,
              score: correctScore.toString(),
              rank: cert.rank,
              date: cert.date
            });
            
            // PDF speichern
            certificateGenerator.save(`Urkunde_${cert.discipline}_${cert.recipientName}_Platz${cert.rank}.pdf`);
          } else {
            certificateGenerator.generateCertificate({
              season: cert.season,
              discipline: cert.discipline,
              category: cert.category,
              recipientName: cert.teamName ? `${cert.recipientName} (${cert.teamName})` : cert.recipientName,
              score: cert.score,
              rank: cert.rank,
              date: cert.date
            });
            
            // PDF speichern
            const shooterName = cert.recipientName.split('(')[0].trim();
            certificateGenerator.save(`Urkunde_${cert.discipline}_${shooterName}_Platz${cert.rank}.pdf`);
          }
        }
      }
      
      toast({
        title: 'Erfolg',
        description: `${certificates.length} Urkunden wurden erfolgreich generiert.`,
      });
    } catch (error) {
      console.error('Fehler beim Generieren der Urkunden:', error);
      toast({
        title: 'Fehler',
        description: 'Die Urkunden konnten nicht generiert werden.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Generiere Urkunden für Gesamtsieger
  const generateOverallCertificates = async () => {
    if (!selectedSeason) {
      toast({
        title: 'Fehler',
        description: 'Bitte wählen Sie eine Saison aus.',
        variant: 'destructive'
      });
      return;
    }
    
    setLoading(true);
    
    try {
      toast({
        title: 'Info',
        description: 'Die Urkunden für Gesamtsieger werden generiert. Dies kann einen Moment dauern.',
      });
      
      const currentDate = ceremonyDate ? 
        format(new Date(ceremonyDate), 'dd. MMMM yyyy', { locale: de }) : 
        format(new Date(), 'dd. MMMM yyyy', { locale: de });
      const certificates = [];
      
      // Beste Schützen über alle Ligen hinweg abrufen
      const bestShooters = await fetchBestOverallShooters(selectedSeason);
      
      // Saison-Informationen abrufen
      const seasonRef = doc(db, 'seasons', selectedSeason);
      const seasonSnap = await getDoc(seasonRef);
      
      if (!seasonSnap.exists()) {
        throw new Error('Saison nicht gefunden');
      }
      const seasonData = seasonSnap.data();
      const seasonName = seasonData.name.replace('RWK ', ''); // "RWK" entfernen
      
      // Bester männlicher Schütze
      if (bestShooters.bestMale) {
        certificates.push({
          type: 'shooter',
          season: seasonName,
          discipline: bestShooters.bestMale.discipline,
          category: 'Gesamtwertung',
          recipientName: bestShooters.bestMale.name,
          score: bestShooters.bestMale.totalScore.toString(),
          rank: 1,
          date: `Einbeck, ${currentDate}`
        });
      }
      
      // Beste weibliche Schützin
      if (bestShooters.bestFemale) {
        certificates.push({
          type: 'shooter',
          season: seasonName,
          discipline: bestShooters.bestFemale.discipline,
          category: 'Gesamtwertung',
          recipientName: bestShooters.bestFemale.name,
          score: bestShooters.bestFemale.totalScore.toString(),
          rank: 1,
          date: `Einbeck, ${currentDate}`
        });
      }
      
      // Bester Sportpistolenschütze
      if (bestShooters.bestPistol) {
        certificates.push({
          type: 'shooter',
          season: seasonName,
          discipline: bestShooters.bestPistol.discipline,
          category: 'Gesamtwertung',
          recipientName: bestShooters.bestPistol.name,
          score: bestShooters.bestPistol.totalScore.toString(),
          rank: 1,
          date: `Einbeck, ${currentDate}`
        });
      }
      
      // Bester KK Pistolenschütze
      if (bestShooters.bestKKPistol) {
        certificates.push({
          type: 'shooter',
          season: seasonName,
          discipline: bestShooters.bestKKPistol.discipline,
          category: 'Gesamtwertung',
          recipientName: bestShooters.bestKKPistol.name,
          score: bestShooters.bestKKPistol.totalScore.toString(),
          rank: 1,
          date: `Einbeck, ${currentDate}`
        });
      }
      
      // Urkunden generieren
      if (certificates.length === 0) {
        toast({
          title: 'Info',
          description: 'Es wurden keine Daten für Urkunden gefunden.',
        });
        setLoading(false);
        return;
      }
      
      if (combinePdf) {
        // Alle Urkunden in einem PDF
        const certificateGenerator = new CertificateGenerator({ orientation: 'portrait' });
        
        for (let i = 0; i < certificates.length; i++) {
          const cert = certificates[i];
          
          if (i > 0) {
            certificateGenerator.addPage();
          }
          
          certificateGenerator.generateCertificate({
            season: cert.season,
            discipline: cert.discipline,
            category: cert.category,
            recipientName: cert.recipientName,
            score: cert.score,
            rank: cert.rank,
            date: cert.date
          });
        }
        
        // PDF speichern
        const seasonName = seasons.find(s => s.id === selectedSeason)?.name.replace('RWK ', '') || 'Saison';
        certificateGenerator.save(`Urkunden_Gesamtsieger_${seasonName}.pdf`);
      } else {
        // Einzelne PDFs für jede Urkunde
        for (const cert of certificates) {
          const certificateGenerator = new CertificateGenerator({ orientation: 'portrait' });
          
          certificateGenerator.generateCertificate({
            season: cert.season,
            discipline: cert.discipline,
            category: cert.category,
            recipientName: cert.recipientName,
            score: cert.score,
            rank: cert.rank,
            date: cert.date
          });
          
          // PDF speichern
          const shooterName = cert.recipientName.split('(')[0].trim();
          certificateGenerator.save(`Urkunde_Gesamtsieger_${cert.discipline}_${shooterName}.pdf`);
        }
      }
      
      toast({
        title: 'Erfolg',
        description: `${certificates.length} Urkunden wurden erfolgreich generiert.`,
      });
    } catch (error) {
      console.error('Fehler beim Generieren der Urkunden für Gesamtsieger:', error);
      toast({
        title: 'Fehler',
        description: 'Die Urkunden für Gesamtsieger konnten nicht generiert werden.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary">Urkunden erstellen</h1>
          <p className="text-muted-foreground">
            Erstellen Sie Urkunden für Rundenwettkämpfe.
          </p>
        </div>
        <Link href="/admin/exports">
          <Button variant="outline" className="flex items-center">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Zurück zu Ergebnislisten
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Test-Urkunden</CardTitle>
          <CardDescription>
            Generieren Sie Test-Urkunden, um das Layout zu überprüfen.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={generateTestCertificate} 
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Urkunden werden erstellt...
              </>
            ) : (
              <>
                <Award className="mr-2 h-4 w-4" />
                Test-Urkunden generieren
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Urkunden für Liga</CardTitle>
          <CardDescription>
            Erstellen Sie Urkunden für die besten Schützen und Mannschaften einer Liga.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="season-select">Saison</Label>
              <Select
                value={selectedSeason}
                onValueChange={setSelectedSeason}
                disabled={seasons.length === 0 || loading}
              >
                <SelectTrigger id="season-select" className="w-full">
                  <SelectValue placeholder="Saison auswählen" />
                </SelectTrigger>
                <SelectContent>
                  {seasons.map(season => (
                    <SelectItem key={season.id} value={season.id}>
                      {season.name.replace('RWK ', '')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="league-select">Liga</Label>
              <Select
                value={selectedLeague}
                onValueChange={setSelectedLeague}
                disabled={leagues.length === 0 || loading}
              >
                <SelectTrigger id="league-select" className="w-full">
                  <SelectValue placeholder="Liga auswählen" />
                </SelectTrigger>
                <SelectContent>
                  {leagues.map(league => (
                    <SelectItem key={league.id} value={league.id}>
                      {league.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="ceremony-date">Datum der Siegerehrung</Label>
              <input
                id="ceremony-date"
                type="date"
                value={ceremonyDate}
                onChange={(e) => setCeremonyDate(e.target.value)}
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Leer lassen für heutiges Datum ({format(new Date(), 'dd.MM.yyyy')})
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="num-shooters">Anzahl Top-Schützen (0 = keine)</Label>
                <Select
                  value={numTopShooters.toString()}
                  onValueChange={(value) => setNumTopShooters(parseInt(value))}
                  disabled={loading}
                >
                  <SelectTrigger id="num-shooters" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                      <SelectItem key={num} value={num.toString()}>
                        {num === 0 ? 'Keine Schützen' : `${num} Schütze${num > 1 ? 'n' : ''}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="num-teams">Anzahl Top-Teams (0 = keine)</Label>
                <Select
                  value={numTopTeams.toString()}
                  onValueChange={(value) => setNumTopTeams(parseInt(value))}
                  disabled={loading}
                >
                  <SelectTrigger id="num-teams" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[0, 1, 2, 3, 4, 5].map(num => (
                      <SelectItem key={num} value={num.toString()}>
                        {num === 0 ? 'Keine Teams' : `${num} Team${num > 1 ? 's' : ''}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="combine-pdf" 
                checked={combinePdf} 
                onCheckedChange={(checked) => setCombinePdf(!!checked)}
                disabled={loading}
              />
              <Label htmlFor="combine-pdf">
                Alle Urkunden in einem PDF zusammenfassen
              </Label>
            </div>
          </div>

          <Button 
            onClick={generateLeagueCertificates} 
            disabled={!selectedLeague || !selectedSeason || loading || (numTopShooters === 0 && numTopTeams === 0)}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Urkunden werden erstellt...
              </>
            ) : (
              <>
                <Award className="mr-2 h-4 w-4" />
                Urkunden für Liga erstellen
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Urkunden für Gesamtsieger</CardTitle>
          <CardDescription>
            Erstellen Sie Urkunden für die besten Schützen über alle Ligen hinweg.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="ceremony-date-overall">Datum der Siegerehrung</Label>
            <input
              id="ceremony-date-overall"
              type="date"
              value={ceremonyDate}
              onChange={(e) => setCeremonyDate(e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
            />
            <p className="text-xs text-gray-500 mt-1 mb-4">
              Leer lassen für heutiges Datum ({format(new Date(), 'dd.MM.yyyy')})
            </p>
          </div>
          <div>
            <Label htmlFor="season-select-overall">Saison</Label>
            <Select
              value={selectedSeason}
              onValueChange={setSelectedSeason}
              disabled={seasons.length === 0 || loading}
            >
              <SelectTrigger id="season-select-overall" className="w-full">
                <SelectValue placeholder="Saison auswählen" />
              </SelectTrigger>
              <SelectContent>
                {seasons.map(season => (
                  <SelectItem key={season.id} value={season.id}>
                    {season.name.replace('RWK ', '')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox 
              id="combine-pdf-overall" 
              checked={combinePdf} 
              onCheckedChange={(checked) => setCombinePdf(!!checked)}
              disabled={loading}
            />
            <Label htmlFor="combine-pdf-overall">
              Alle Urkunden in einem PDF zusammenfassen
            </Label>
          </div>

          <Button 
            onClick={generateOverallCertificates} 
            disabled={!selectedSeason || loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Urkunden werden erstellt...
              </>
            ) : (
              <>
                <Award className="mr-2 h-4 w-4" />
                Urkunden für Gesamtsieger erstellen
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
