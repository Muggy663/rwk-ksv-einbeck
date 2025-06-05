"use client";

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, FileDown, ArrowLeft } from 'lucide-react';
import { useVereinAuth } from '@/app/verein/layout';
import { db } from '@/lib/firebase/config';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { LeagueDisplay } from '@/types/rwk';
import { useToast } from '@/hooks/use-toast';
import { generateEmptySeasonTablePDF, generateGesamtlistePDF } from '@/lib/services/pdf-service';
import Link from 'next/link';

interface TeamContact {
  name: string;
  phone: string;
  email: string;
}

export default function HandtabellenPage() {
  const { userPermission, loadingPermissions, permissionError } = useVereinAuth();
  const { toast } = useToast();
  const [leagues, setLeagues] = useState<LeagueDisplay[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState<string | null>(null);
  
  // Ligen laden
  useEffect(() => {
    if (!loadingPermissions && userPermission) {
      const loadLeagues = async () => {
        setIsLoading(true);
        try {
          // Saisons für das ausgewählte Jahr laden
          const seasonsQuery = query(
            collection(db, 'seasons'),
            where('competitionYear', '==', selectedYear),
            where('status', '==', 'Laufend')
          );
          
          const seasonsSnapshot = await getDocs(seasonsQuery);
          const seasonIds = seasonsSnapshot.docs.map(doc => doc.id);
          
          if (seasonIds.length > 0) {
            // Ligen für die gefundenen Saisons laden
            const leaguesQuery = query(
              collection(db, 'rwk_leagues'),
              where('seasonId', 'in', seasonIds),
              orderBy('order', 'asc')
            );
            
            const leaguesSnapshot = await getDocs(leaguesQuery);
            const leaguesData = leaguesSnapshot.docs.map(doc => ({
              id: doc.id,
              name: doc.data().name,
              type: doc.data().type,
              shortName: doc.data().shortName,
              competitionYear: selectedYear,
              teams: [],
              individualLeagueShooters: []
            })) as LeagueDisplay[];
            
            // Teams für jede Liga laden
            for (const league of leaguesData) {
              const teamsQuery = query(
                collection(db, 'rwk_teams'),
                where('leagueId', '==', league.id)
              );
              
              const teamsSnapshot = await getDocs(teamsQuery);
              league.teams = teamsSnapshot.docs.map(doc => ({
                id: doc.id,
                name: doc.data().name,
                clubId: doc.data().clubId,
                leagueId: league.id,
                competitionYear: selectedYear,
                leagueType: league.type
              }));
            }
            
            setLeagues(leaguesData);
          } else {
            setLeagues([]);
          }
        } catch (error) {
          console.error('Fehler beim Laden der Ligen:', error);
          toast({
            title: 'Fehler',
            description: 'Die Ligen konnten nicht geladen werden.',
            variant: 'destructive'
          });
        } finally {
          setIsLoading(false);
        }
      };
      
      loadLeagues();
    }
  }, [userPermission, loadingPermissions, selectedYear, toast]);
  
  // Kontaktdaten der Mannschaftsführer laden
  const fetchTeamContacts = async (leagueId: string): Promise<Record<string, TeamContact>> => {
    try {
      const teamsQuery = query(
        collection(db, 'rwk_teams'),
        where('leagueId', '==', leagueId)
      );
      
      const teamsSnapshot = await getDocs(teamsQuery);
      const contacts: Record<string, TeamContact> = {};
      
      for (const teamDoc of teamsSnapshot.docs) {
        const teamData = teamDoc.data();
        contacts[teamDoc.id] = {
          name: teamData.contactName || '',
          phone: teamData.contactPhone || '',
          email: teamData.contactEmail || ''
        };
      }
      
      return contacts;
    } catch (error) {
      console.error('Fehler beim Laden der Kontaktdaten:', error);
      return {};
    }
  };
  
  // Handtabelle generieren
  const handleGenerateEmptyTable = async (league: LeagueDisplay) => {
    if (isGeneratingPDF) return;
    
    setIsGeneratingPDF(league.id);
    
    try {
      // Kopie der Liga erstellen, um die Originaldaten nicht zu verändern
      const leagueCopy = JSON.parse(JSON.stringify(league));
      
      // Kontaktdaten laden
      const teamContacts = await fetchTeamContacts(league.id);
      
      // Schützen für jedes Team laden, wenn Berechtigungen vorhanden
      try {
        for (const team of leagueCopy.teams) {
          const shootersQuery = query(
            collection(db, 'rwk_team_shooters'),
            where('teamId', '==', team.id)
          );
          
          try {
            const shootersSnapshot = await getDocs(shootersQuery);
            const shooterPromises = shootersSnapshot.docs.map(async doc => {
              const shooterId = doc.data().shooterId;
              try {
                const shooterDoc = await getDocs(query(
                  collection(db, 'rwk_shooters'),
                  where('__name__', '==', shooterId)
                ));
                
                if (!shooterDoc.empty) {
                  const shooterData = shooterDoc.docs[0].data();
                  return {
                    id: shooterId,
                    name: `${shooterData.firstName} ${shooterData.lastName}`,
                    gender: shooterData.gender
                  };
                }
              } catch (error) {
                console.log("Fehler beim Laden eines Schützen:", error);
                // Fehler bei einzelnem Schützen ignorieren
              }
              
              return {
                id: shooterId,
                name: 'Schütze',
                gender: 'unknown'
              };
            });
            
            team.shooters = await Promise.all(shooterPromises);
          } catch (error) {
            console.log("Fehler beim Laden der Schützen für Team:", error);
            team.shooters = [];
          }
        }
      } catch (error) {
        console.log("Fehler beim Laden der Schützen, fahre ohne Schützen fort:", error);
        // Fehler beim Laden der Schützen ignorieren und ohne Schützen fortfahren
      }
      
      // PDF generieren
      const pdfBlob = await generateEmptySeasonTablePDF(leagueCopy, 5, selectedYear, teamContacts);
      
      // PDF herunterladen
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${league.name.replace(/\s+/g, '_')}_Handtabelle_${selectedYear}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({
        title: 'PDF erstellt',
        description: 'Die Handtabelle wurde erfolgreich erstellt und heruntergeladen.',
      });
    } catch (error) {
      console.error('Fehler beim Erstellen der PDF:', error);
      toast({
        title: 'Fehler',
        description: 'Die Handtabelle konnte nicht erstellt werden.',
        variant: 'destructive'
      });
    } finally {
      setIsGeneratingPDF(null);
    }
  };
  
  // Gesamtliste generieren
  const handleGenerateGesamtliste = async (league: LeagueDisplay) => {
    if (isGeneratingPDF) return;
    
    setIsGeneratingPDF(`gesamtliste-${league.id}`);
    
    try {
      // Schützen für jedes Team laden
      for (const team of league.teams) {
        const shootersQuery = query(
          collection(db, 'rwk_team_shooters'),
          where('teamId', '==', team.id)
        );
        
        const shootersSnapshot = await getDocs(shootersQuery);
        team.shooters = await Promise.all(shootersSnapshot.docs.map(async doc => {
          const shooterId = doc.data().shooterId;
          const shooterDoc = await getDocs(query(
            collection(db, 'rwk_shooters'),
            where('__name__', '==', shooterId)
          ));
          
          if (!shooterDoc.empty) {
            const shooterData = shooterDoc.docs[0].data();
            return {
              id: shooterId,
              name: `${shooterData.firstName} ${shooterData.lastName}`,
              gender: shooterData.gender
            };
          }
          
          return {
            id: shooterId,
            name: 'Unbekannter Schütze',
            gender: 'unknown'
          };
        }));
      }
      
      // Kontaktdaten laden
      const teamContacts = await fetchTeamContacts(league.id);
      
      // PDF generieren
      const pdfBlob = await generateGesamtlistePDF(league, selectedYear, teamContacts);
      
      // PDF herunterladen
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${league.name.replace(/\s+/g, '_')}_Gesamtliste_${selectedYear}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({
        title: 'PDF erstellt',
        description: 'Die Gesamtliste wurde erfolgreich erstellt und heruntergeladen.',
      });
    } catch (error) {
      console.error('Fehler beim Erstellen der PDF:', error);
      toast({
        title: 'Fehler',
        description: 'Die Gesamtliste konnte nicht erstellt werden.',
        variant: 'destructive'
      });
    } finally {
      setIsGeneratingPDF(null);
    }
  };
  
  if (loadingPermissions) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-12 w-12 animate-spin text-primary mr-3" />
        <p>Lade Berechtigungsdaten...</p>
      </div>
    );
  }
  
  if (permissionError || !userPermission) {
    return (
      <div className="p-6">
        <Card className="border-destructive bg-destructive/10">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center">
              Zugriffsproblem
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>{permissionError || "Sie haben keine Berechtigung für diese Seite."}</p>
            <p className="text-sm mt-1">Bitte kontaktieren Sie den Administrator.</p>
            <Link href="/verein/dashboard" className="flex items-center text-primary mt-4 hover:underline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Zurück zum Dashboard
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-primary">Handtabellen</h1>
          <p className="text-muted-foreground">
            Erstellen Sie leere Tabellen zum Handausfüllen für den Saisonbeginn.
          </p>
        </div>
        <Link href="/verein/dashboard" className="flex items-center text-primary hover:underline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Zurück zum Dashboard
        </Link>
      </div>
      
      <div className="mb-4">
        <Label htmlFor="yearSelect">Jahr auswählen</Label>
        <Select 
          value={selectedYear.toString()} 
          onValueChange={(value) => setSelectedYear(parseInt(value))}
        >
          <SelectTrigger id="yearSelect" className="w-[180px]">
            <SelectValue placeholder="Jahr wählen" />
          </SelectTrigger>
          <SelectContent>
            {[new Date().getFullYear(), new Date().getFullYear() + 1].map(year => (
              <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Handtabellen für Saisonbeginn</CardTitle>
          <CardDescription>
            Erstellen Sie leere Tabellen zum Handausfüllen für den Saisonbeginn mit Kontaktdaten der Mannschaftsführer.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Ligen werden geladen...</span>
            </div>
          ) : leagues.length > 0 ? (
            <div className="space-y-4">
              {leagues.map(league => (
                <div key={league.id} className="flex items-center justify-between p-3 bg-muted/20 rounded-md">
                  <div>
                    <p className="font-medium">{league.name}</p>
                    <p className="text-sm text-muted-foreground">{league.type} - {selectedYear}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleGenerateEmptyTable(league)}
                    disabled={isGeneratingPDF === league.id}
                  >
                    {isGeneratingPDF === league.id ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        PDF wird erstellt...
                      </>
                    ) : (
                      <>
                        <FileDown className="mr-2 h-4 w-4" />
                        Handtabelle erstellen
                      </>
                    )}
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              <p>Keine aktiven Ligen für {selectedYear} gefunden.</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Gesamtliste für Kreisoberliga KK 50</CardTitle>
          <CardDescription>
            Erstellen Sie eine Gesamtliste für die Kreisoberliga KK 50 mit Kontaktdaten der Mannschaftsführer.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Ligen werden geladen...</span>
            </div>
          ) : leagues.length > 0 ? (
            <div className="space-y-4">
              {leagues
                .filter(league => league.name.includes('Kreisoberliga') && league.name.includes('KK'))
                .map(league => (
                <div key={`gesamtliste-${league.id}`} className="flex items-center justify-between p-3 bg-muted/20 rounded-md">
                  <div>
                    <p className="font-medium">{league.name}</p>
                    <p className="text-sm text-muted-foreground">{league.type} - {selectedYear}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleGenerateGesamtliste(league)}
                    disabled={isGeneratingPDF === `gesamtliste-${league.id}`}
                  >
                    {isGeneratingPDF === `gesamtliste-${league.id}` ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        PDF wird erstellt...
                      </>
                    ) : (
                      <>
                        <FileDown className="mr-2 h-4 w-4" />
                        Gesamtliste erstellen
                      </>
                    )}
                  </Button>
                </div>
              ))}
              
              {leagues.filter(league => league.name.includes('Kreisoberliga') && league.name.includes('KK')).length === 0 && (
                <div className="text-center py-4 text-muted-foreground">
                  <p>Keine Kreisoberliga KK 50 für {selectedYear} gefunden.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              <p>Keine aktiven Ligen für {selectedYear} gefunden.</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Hinweise</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>Die Handtabellen enthalten:</p>
          <ul className="list-disc list-inside ml-2 space-y-1">
            <li>Kontaktdaten der Mannschaftsführer</li>
            <li>Wettkampfplan mit Platz für Ort, Datum und Uhrzeit</li>
            <li>Leere Tabelle für Einzelschützen-Rangliste</li>
          </ul>
          
          <p className="mt-4">Die Gesamtliste für die Kreisoberliga KK 50 enthält:</p>
          <ul className="list-disc list-inside ml-2 space-y-1">
            <li>Mannschaftsnamen und zugehörige Schützen</li>
            <li>Kontaktdaten der Mannschaftsführer</li>
            <li>Spalten für Ringe und Gesamtergebnisse für 4 Durchgänge</li>
            <li>Platz für Einzelschützen</li>
            <li>Abgabetermin: 15. August {selectedYear}</li>
          </ul>
          
          <p className="mt-4">Die Tabellen werden im PDF-Format erstellt und können ausgedruckt werden.</p>
        </CardContent>
      </Card>
    </div>
  );
}