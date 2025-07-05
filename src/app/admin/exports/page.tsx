"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileDown, Printer, Award } from 'lucide-react';
import { PdfButton } from '@/components/ui/pdf-button';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, orderBy, doc, getDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ExportsPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [selectedSeason, setSelectedSeason] = useState<string>('');
  const [selectedLeague, setSelectedLeague] = useState<string>('');
  const [seasons, setSeasons] = useState<Array<{ id: string; name: string; year: number }>>([]);
  const [leagues, setLeagues] = useState<Array<{ id: string; name: string; type: string }>>([]);
  const [activeTab, setActiveTab] = useState<string>('results');
  const [genderFilter, setGenderFilter] = useState<'all' | 'male' | 'female'>('all');
  const [showAllShooters, setShowAllShooters] = useState<boolean>(false);

  // Wenn der Tab auf "certificates" gesetzt wird, zur Urkunden-Seite navigieren
  useEffect(() => {
    if (activeTab === 'certificates') {
      router.push('/admin/exports/certificates');
    }
  }, [activeTab, router]);

  // Lade verfügbare Saisons
  React.useEffect(() => {
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
          name: doc.data().name,
          year: doc.data().competitionYear
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
  React.useEffect(() => {
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

  // Generiere Daten für die Mannschaftsergebnisse
  const generateLeagueResultsData = async () => {
    if (!selectedLeague || !selectedSeason) {
      throw new Error('Liga oder Saison nicht ausgewählt');
    }
    
    try {
      // Liga-Informationen abrufen
      const leagueRef = doc(db, 'rwk_leagues', selectedLeague);
      const leagueSnap = await getDoc(leagueRef);
      
      if (!leagueSnap.exists()) {
        throw new Error('Liga nicht gefunden');
      }
      const leagueData = leagueSnap.data();
      
      // Saison-Informationen abrufen
      const seasonRef = doc(db, 'seasons', selectedSeason);
      const seasonSnap = await getDoc(seasonRef);
      
      if (!seasonSnap.exists()) {
        throw new Error('Saison nicht gefunden');
      }
      const seasonData = seasonSnap.data();
      
      // Anzahl der Durchgänge bestimmen
      const numRounds = leagueData.type.startsWith('L') ? 4 : 5; // Luftdruck: 4, KK: 5
      
      // Teams für die Liga abrufen
      const teamsQuery = query(
        collection(db, 'rwk_teams'),
        where('leagueId', '==', selectedLeague)
      );
      
      const teamsSnapshot = await getDocs(teamsQuery);
      const teams = [];
      
      for (const teamDoc of teamsSnapshot.docs) {
        const teamData = teamDoc.data();
        
        // Ergebnisse für das Team abrufen
        const scoresQuery = query(
          collection(db, 'rwk_scores'),
          where('teamId', '==', teamDoc.id)
        );
        
        const scoresSnapshot = await getDocs(scoresQuery);
        const roundResults = {};
        
        // Durchgangsergebnisse initialisieren
        for (let i = 1; i <= numRounds; i++) {
          roundResults[`dg${i}`] = null;
        }
        
        // Ergebnisse nach Durchgang gruppieren
        scoresSnapshot.forEach(scoreDoc => {
          const scoreData = scoreDoc.data();
          const durchgang = scoreData.durchgang;
          
          if (durchgang >= 1 && durchgang <= numRounds) {
            if (!roundResults[`dg${durchgang}`]) {
              roundResults[`dg${durchgang}`] = 0;
            }
            
            roundResults[`dg${durchgang}`] += scoreData.totalRinge || 0;
          }
        });
        
        // Gesamtergebnis und Durchschnitt berechnen
        let totalScore = 0;
        let numScoredRounds = 0;
        
        Object.values(roundResults).forEach(result => {
          if (result !== null) {
            totalScore += result as number;
            numScoredRounds++;
          }
        });
        
        const averageScore = numScoredRounds > 0 ? totalScore / numScoredRounds : null;
        
        teams.push({
          rank: teams.length + 1, // Wird später sortiert
          name: teamData.name,
          roundResults,
          totalScore,
          averageScore
        });
      }
      
      // Teams nach Gesamtergebnis sortieren
      teams.sort((a, b) => b.totalScore - a.totalScore);
      
      // Ränge aktualisieren
      teams.forEach((team, index) => {
        team.rank = index + 1;
      });
      
      return {
        leagueName: leagueData.name,
        season: seasonData.name,
        teams,
        numRounds
      };
    } catch (error) {
      console.error('Fehler beim Generieren der Mannschaftsergebnisse:', error);
      throw error;
    }
  };

  // Generiere Daten für die Einzelschützenergebnisse
  const generateShooterResultsData = async () => {
    if ((!selectedLeague && !showAllShooters) || !selectedSeason) {
      throw new Error('Liga oder Saison nicht ausgewählt');
    }
    
    try {
      // Saison-Informationen abrufen
      const seasonRef = doc(db, 'seasons', selectedSeason);
      const seasonSnap = await getDoc(seasonRef);
      
      if (!seasonSnap.exists()) {
        throw new Error('Saison nicht gefunden');
      }
      const seasonData = seasonSnap.data();
      
      let leagueData = { name: 'Alle Ligen', type: '' };
      let numRounds = 5; // Standard für KK
      
      // Liga-Informationen abrufen, wenn eine spezifische Liga ausgewählt ist
      if (selectedLeague && !showAllShooters) {
        const leagueRef = doc(db, 'rwk_leagues', selectedLeague);
        const leagueSnap = await getDoc(leagueRef);
        
        if (!leagueSnap.exists()) {
          throw new Error('Liga nicht gefunden');
        }
        leagueData = leagueSnap.data();
        
        // Anzahl der Durchgänge bestimmen
        numRounds = leagueData.type.startsWith('L') ? 4 : 5; // Luftdruck: 4, KK: 5
      }
      
      // Ergebnisse abrufen - entweder für eine spezifische Liga oder alle Ligen der Saison
      let scoresQuery;
      
      if (showAllShooters) {
        // Alle Ligen der Saison, außer Sportpistole
        const leaguesQuery = query(
          collection(db, 'rwk_leagues'),
          where('seasonId', '==', selectedSeason)
        );
        
        const leaguesSnapshot = await getDocs(leaguesQuery);
        const leagueIds = leaguesSnapshot.docs
          .filter(doc => !doc.data().type.includes('SP')) // Sportpistole ausschließen
          .map(doc => doc.id);
        
        if (leagueIds.length === 0) {
          throw new Error('Keine passenden Ligen gefunden');
        }
        
        // Ergebnisse für alle gefilterten Ligen abrufen
        scoresQuery = query(
          collection(db, 'rwk_scores'),
          where('leagueId', 'in', leagueIds)
        );
      } else {
        // Nur Ergebnisse für die ausgewählte Liga
        scoresQuery = query(
          collection(db, 'rwk_scores'),
          where('leagueId', '==', selectedLeague)
        );
      }
      
      const scoresSnapshot = await getDocs(scoresQuery);
      const shootersMap = new Map();
      
      // Ergebnisse nach Schützen gruppieren
      scoresSnapshot.forEach(scoreDoc => {
        const scoreData = scoreDoc.data();
        const shooterId = scoreData.shooterId;
        const durchgang = scoreData.durchgang;
        const gender = scoreData.shooterGender || 'unknown';
        
        // Geschlechterfilter anwenden
        if (genderFilter !== 'all') {
          if ((genderFilter === 'male' && gender !== 'male') || 
              (genderFilter === 'female' && gender !== 'female')) {
            return;
          }
        }
        
        if (!shooterId || durchgang < 1 || durchgang > 5) return; // Max 5 Durchgänge
        
        if (!shootersMap.has(shooterId)) {
          shootersMap.set(shooterId, {
            shooterId,
            name: scoreData.shooterName || 'Unbekannter Schütze',
            teamName: scoreData.teamName || 'Unbekanntes Team',
            gender: gender,
            results: {},
            totalScore: 0,
            roundsShot: 0
          });
          
          // Durchgangsergebnisse initialisieren
          for (let i = 1; i <= 5; i++) { // Immer 5 Spalten für Durchgänge reservieren
            shootersMap.get(shooterId).results[`dg${i}`] = null;
          }
        }
        
        const shooter = shootersMap.get(shooterId);
        shooter.results[`dg${durchgang}`] = scoreData.totalRinge || null;
        
        if (scoreData.totalRinge) {
          shooter.totalScore += scoreData.totalRinge;
          shooter.roundsShot++;
        }
      });
      
      // Durchschnitt berechnen und in Array umwandeln
      const shooters = Array.from(shootersMap.values()).map(shooter => {
        shooter.averageScore = shooter.roundsShot > 0 ? shooter.totalScore / shooter.roundsShot : null;
        return shooter;
      });
      
      // Schützen nach Gesamtergebnis sortieren
      shooters.sort((a, b) => b.totalScore - a.totalScore);
      
      // Ränge aktualisieren
      shooters.forEach((shooter, index) => {
        shooter.rank = index + 1;
      });
      
      return {
        leagueName: showAllShooters ? 'Gesamtrangliste' : leagueData.name,
        season: seasonData.name,
        shooters,
        numRounds: 5, // Immer 5 Spalten für Durchgänge anzeigen
        genderFilter
      };
    } catch (error) {
      console.error('Fehler beim Generieren der Einzelschützenergebnisse:', error);
      throw error;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary">PDF-Exporte</h1>
          <p className="text-muted-foreground">
            Erstellen Sie PDFs für Ergebnislisten und Urkunden.
          </p>
        </div>
        <Link href="/admin">
          <Button variant="outline">
            Zurück zum Dashboard
          </Button>
        </Link>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:w-1/2 lg:w-1/3 mb-6 shadow-md">
          <TabsTrigger value="results" className="py-2.5">
            <FileDown className="mr-2 h-5 w-5" />
            Ergebnislisten
          </TabsTrigger>
          <TabsTrigger value="certificates" className="py-2.5">
            <Award className="mr-2 h-5 w-5" />
            Urkunden
          </TabsTrigger>
        </TabsList>

        <TabsContent value="results">
          <Card>
            <CardHeader>
              <CardTitle>Ergebnislisten exportieren</CardTitle>
              <CardDescription>
                Wählen Sie eine Saison und Liga aus, um Ergebnislisten als PDF zu exportieren.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="season-select">Saison</Label>
                  <Select
                    value={selectedSeason}
                    onValueChange={setSelectedSeason}
                    disabled={seasons.length === 0}
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
                  <Label htmlFor="league-select">Liga</Label>
                  <Select
                    value={selectedLeague}
                    onValueChange={setSelectedLeague}
                    disabled={leagues.length === 0 || showAllShooters}
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

              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Mannschaftsergebnisse</CardTitle>
                    <CardDescription>
                      Exportieren Sie die Mannschaftsergebnisse der ausgewählten Liga.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <PdfButton
                      title="Mannschaftsergebnisse"
                      subtitle={leagues.find(l => l.id === selectedLeague)?.name || ''}
                      generateData={generateLeagueResultsData}
                      pdfType="leagueResults"
                      buttonText="Mannschaftsergebnisse exportieren"
                      fileName={`Mannschaftsergebnisse_${leagues.find(l => l.id === selectedLeague)?.name || 'Liga'}.pdf`}
                      orientation="landscape"
                      className="w-full"
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Einzelschützenergebnisse</CardTitle>
                    <CardDescription>
                      Exportieren Sie Einzelschützenergebnisse nach Liga oder als Gesamtliste.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="show-all-shooters"
                        checked={showAllShooters}
                        onChange={(e) => setShowAllShooters(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <Label htmlFor="show-all-shooters">
                        Gesamtliste aller Schützen (außer Sportpistole)
                      </Label>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Nach Geschlecht filtern</Label>
                      <RadioGroup 
                        value={genderFilter} 
                        onValueChange={(value) => setGenderFilter(value as 'all' | 'male' | 'female')}
                        className="flex space-x-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="all" id="all" />
                          <Label htmlFor="all">Alle</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="male" id="male" />
                          <Label htmlFor="male">Männlich</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="female" id="female" />
                          <Label htmlFor="female">Weiblich</Label>
                        </div>
                      </RadioGroup>
                    </div>
                    
                    <PdfButton
                      title="Einzelschützenergebnisse"
                      subtitle={showAllShooters 
                        ? `Gesamtliste (${genderFilter === 'all' ? 'Alle' : genderFilter === 'male' ? 'Männlich' : 'Weiblich'})` 
                        : leagues.find(l => l.id === selectedLeague)?.name || ''}
                      generateData={generateShooterResultsData}
                      pdfType="shooterResults"
                      buttonText="Einzelschützenergebnisse exportieren"
                      fileName={`Einzelschuetzenergebnisse_${showAllShooters 
                        ? `Gesamt_${genderFilter === 'all' ? 'Alle' : genderFilter === 'male' ? 'Männlich' : 'Weiblich'}` 
                        : leagues.find(l => l.id === selectedLeague)?.name || 'Liga'}.pdf`}
                      orientation="landscape"
                      className="w-full mt-4"
                    />
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Der TabsContent für "certificates" wird nicht mehr benötigt, da wir direkt zur Urkunden-Seite navigieren */}
      </Tabs>
    </div>
  );
}