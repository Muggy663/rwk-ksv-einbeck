// src/app/admin/startgelder/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Euro, FileDown, Calculator } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase/config';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import type { Season, Team, Club } from '@/types/rwk';

interface StartgeldBerechnung {
  clubId: string;
  clubName: string;
  mannschaften: number;
  einzelschuetzen: number;
  gesamtkosten: number;
}

export default function StartgelderPage() {
  const { toast } = useToast();
  
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>('');
  const [startgeldProMannschaft, setStartgeldProMannschaft] = useState<number>(25);
  const [startgeldProEinzelschuetze, setStartgeldProEinzelschuetze] = useState<number>(10);
  
  const [berechnungen, setBerechnungen] = useState<StartgeldBerechnung[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [gesamtsumme, setGesamtsumme] = useState<number>(0);

  // Lade Saisons
  useEffect(() => {
    const loadSeasons = async () => {
      try {
        const seasonsQuery = query(
          collection(db, 'seasons'),
          orderBy('competitionYear', 'desc')
        );
        const seasonsSnapshot = await getDocs(seasonsQuery);
        const seasonsData = seasonsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Season));
        setSeasons(seasonsData);
        
        // Wähle aktuelle Saison automatisch
        const currentSeason = seasonsData.find(s => s.status === 'Laufend');
        if (currentSeason) {
          setSelectedSeasonId(currentSeason.id);
        }
      } catch (error) {
        console.error('Fehler beim Laden der Saisons:', error);
        toast({
          title: 'Fehler',
          description: 'Saisons konnten nicht geladen werden.',
          variant: 'destructive'
        });
      }
    };

    loadSeasons();
  }, [toast]);

  const berechneStartgelder = async () => {
    if (!selectedSeasonId) {
      toast({
        title: 'Saison fehlt',
        description: 'Bitte wählen Sie eine Saison aus.',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    try {
      const selectedSeason = seasons.find(s => s.id === selectedSeasonId);
      if (!selectedSeason) return;

      // Lade alle Teams der Saison
      const teamsQuery = query(
        collection(db, 'rwk_teams'),
        where('competitionYear', '==', selectedSeason.competitionYear)
      );
      const teamsSnapshot = await getDocs(teamsQuery);
      const teams = teamsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Team));

      // Lade alle Vereine
      const clubsQuery = query(collection(db, 'clubs'), orderBy('name', 'asc'));
      const clubsSnapshot = await getDocs(clubsQuery);
      const clubs = clubsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Club));

      // Gruppiere Teams nach Vereinen
      const clubStats = new Map<string, { mannschaften: number; einzelschuetzen: number }>();
      
      teams.forEach(team => {
        if (!team.clubId) return;
        
        const current = clubStats.get(team.clubId) || { mannschaften: 0, einzelschuetzen: 0 };
        
        // Prüfe ob es ein Einzelschützen-Team ist (enthält "einzel" im Namen)
        if (team.name.toLowerCase().includes('einzel')) {
          current.einzelschuetzen += team.shooterIds?.length || 0;
        } else {
          current.mannschaften += 1;
        }
        
        clubStats.set(team.clubId, current);
      });

      // Erstelle Berechnungen
      const berechnungenData: StartgeldBerechnung[] = [];
      let gesamtsummeTemp = 0;

      clubStats.forEach((stats, clubId) => {
        const club = clubs.find(c => c.id === clubId);
        if (!club) return;

        const kostenMannschaften = stats.mannschaften * startgeldProMannschaft;
        const kostenEinzelschuetzen = stats.einzelschuetzen * startgeldProEinzelschuetze;
        const gesamtkosten = kostenMannschaften + kostenEinzelschuetzen;

        berechnungenData.push({
          clubId,
          clubName: club.name,
          mannschaften: stats.mannschaften,
          einzelschuetzen: stats.einzelschuetzen,
          gesamtkosten
        });

        gesamtsummeTemp += gesamtkosten;
      });

      // Sortiere nach Vereinsname
      berechnungenData.sort((a, b) => a.clubName.localeCompare(b.clubName));

      setBerechnungen(berechnungenData);
      setGesamtsumme(gesamtsummeTemp);

      toast({
        title: 'Berechnung abgeschlossen',
        description: `Startgelder für ${berechnungenData.length} Vereine berechnet.`
      });

    } catch (error) {
      console.error('Fehler bei der Berechnung:', error);
      toast({
        title: 'Fehler',
        description: 'Startgelder konnten nicht berechnet werden.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const exportierePDF = async () => {
    if (berechnungen.length === 0) {
      toast({
        title: 'Keine Daten',
        description: 'Bitte führen Sie zuerst eine Berechnung durch.',
        variant: 'destructive'
      });
      return;
    }

    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      
      const selectedSeason = seasons.find(s => s.id === selectedSeasonId);
      
      // Header
      doc.setFontSize(16);
      doc.text('Startgelder-Übersicht', 20, 20);
      doc.setFontSize(12);
      doc.text(`Saison: ${selectedSeason?.name || 'Unbekannt'}`, 20, 30);
      doc.text(`Erstellt am: ${new Date().toLocaleDateString('de-DE')}`, 20, 40);
      
      // Tabelle
      let yPos = 60;
      doc.setFontSize(10);
      
      // Header
      doc.text('Verein', 20, yPos);
      doc.text('Teams', 80, yPos);
      doc.text('Einzel', 110, yPos);
      doc.text('Kosten Teams', 140, yPos);
      doc.text('Kosten Einzel', 170, yPos);
      doc.text('Gesamt', 200, yPos);
      
      yPos += 10;
      doc.line(20, yPos - 5, 220, yPos - 5);
      
      berechnungen.forEach(b => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
        
        doc.text(b.clubName.substring(0, 25), 20, yPos);
        doc.text(b.mannschaften.toString(), 80, yPos);
        doc.text(b.einzelschuetzen.toString(), 110, yPos);
        doc.text(`${b.mannschaften * startgeldProMannschaft}€`, 140, yPos);
        doc.text(`${b.einzelschuetzen * startgeldProEinzelschuetze}€`, 170, yPos);
        doc.text(`${b.gesamtkosten}€`, 200, yPos);
        
        yPos += 8;
      });
      
      // Gesamtsumme
      yPos += 10;
      doc.line(20, yPos - 5, 220, yPos - 5);
      doc.setFontSize(12);
      doc.text(`Gesamtsumme: ${gesamtsumme}€`, 20, yPos);
      
      doc.save(`Startgelder_${selectedSeason?.name || 'Saison'}_${new Date().getFullYear()}.pdf`);
      
      toast({
        title: 'PDF erstellt',
        description: 'PDF-Datei wurde heruntergeladen.'
      });
      
    } catch (error) {
      console.error('Fehler beim PDF-Export:', error);
      toast({
        title: 'Fehler',
        description: 'PDF konnte nicht erstellt werden.',
        variant: 'destructive'
      });
    }
  };

  const exportiereCSV = () => {
    if (berechnungen.length === 0) {
      toast({
        title: 'Keine Daten',
        description: 'Bitte führen Sie zuerst eine Berechnung durch.',
        variant: 'destructive'
      });
      return;
    }

    const selectedSeason = seasons.find(s => s.id === selectedSeasonId);
    const csvHeader = 'Verein,Mannschaften,Einzelschützen,Kosten Mannschaften,Kosten Einzelschützen,Gesamtkosten\n';
    
    const csvData = berechnungen.map(b => 
      `"${b.clubName}",${b.mannschaften},${b.einzelschuetzen},${b.mannschaften * startgeldProMannschaft}€,${b.einzelschuetzen * startgeldProEinzelschuetze}€,${b.gesamtkosten}€`
    ).join('\n');

    const csvContent = csvHeader + csvData + `\n\nGesamtsumme:,,,,,${gesamtsumme}€`;
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `Startgelder_${selectedSeason?.name || 'Saison'}_${new Date().getFullYear()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: 'Export erfolgreich',
      description: 'CSV-Datei wurde heruntergeladen.'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Euro className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-semibold text-primary">Startgelder-Verwaltung</h1>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Startgelder berechnen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="season-select">Saison</Label>
              <Select value={selectedSeasonId} onValueChange={setSelectedSeasonId}>
                <SelectTrigger>
                  <SelectValue placeholder="Saison wählen" />
                </SelectTrigger>
                <SelectContent>
                  {seasons.map(season => (
                    <SelectItem key={season.id} value={season.id}>
                      {season.name} ({season.status})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="mannschaft-preis">Startgeld pro Mannschaft (€)</Label>
              <Input
                id="mannschaft-preis"
                type="number"
                value={startgeldProMannschaft}
                onChange={(e) => setStartgeldProMannschaft(Number(e.target.value))}
                min="0"
              />
            </div>

            <div>
              <Label htmlFor="einzelschuetze-preis">Startgeld pro Einzelschütze (€)</Label>
              <Input
                id="einzelschuetze-preis"
                type="number"
                value={startgeldProEinzelschuetze}
                onChange={(e) => setStartgeldProEinzelschuetze(Number(e.target.value))}
                min="0"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={berechneStartgelder} 
              disabled={!selectedSeasonId || isLoading}
              className="flex items-center"
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Calculator className="mr-2 h-4 w-4" />
              )}
              Startgelder berechnen
            </Button>

            {berechnungen.length > 0 && (
              <>
                <Button variant="outline" onClick={exportiereCSV}>
                  <FileDown className="mr-2 h-4 w-4" />
                  Als CSV exportieren
                </Button>
                <Button variant="outline" onClick={exportierePDF}>
                  <FileDown className="mr-2 h-4 w-4" />
                  Als PDF exportieren
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {berechnungen.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Startgelder-Übersicht</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Verein</TableHead>
                    <TableHead className="text-center">Mannschaften</TableHead>
                    <TableHead className="text-center">Einzelschützen</TableHead>
                    <TableHead className="text-right">Kosten Mannschaften</TableHead>
                    <TableHead className="text-right">Kosten Einzelschützen</TableHead>
                    <TableHead className="text-right font-semibold">Gesamtkosten</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {berechnungen.map(berechnung => (
                    <TableRow key={berechnung.clubId}>
                      <TableCell className="font-medium">{berechnung.clubName}</TableCell>
                      <TableCell className="text-center">{berechnung.mannschaften}</TableCell>
                      <TableCell className="text-center">{berechnung.einzelschuetzen}</TableCell>
                      <TableCell className="text-right">
                        {berechnung.mannschaften * startgeldProMannschaft}€
                      </TableCell>
                      <TableCell className="text-right">
                        {berechnung.einzelschuetzen * startgeldProEinzelschuetze}€
                      </TableCell>
                      <TableCell className="text-right font-semibold text-primary">
                        {berechnung.gesamtkosten}€
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="border-t-2 bg-muted/20">
                    <TableCell className="font-bold">Gesamtsumme</TableCell>
                    <TableCell className="text-center font-semibold">
                      {berechnungen.reduce((sum, b) => sum + b.mannschaften, 0)}
                    </TableCell>
                    <TableCell className="text-center font-semibold">
                      {berechnungen.reduce((sum, b) => sum + b.einzelschuetzen, 0)}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {berechnungen.reduce((sum, b) => sum + (b.mannschaften * startgeldProMannschaft), 0)}€
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {berechnungen.reduce((sum, b) => sum + (b.einzelschuetzen * startgeldProEinzelschuetze), 0)}€
                    </TableCell>
                    <TableCell className="text-right font-bold text-primary text-lg">
                      {gesamtsumme}€
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-800 mb-2">💡 Für den Schatzmeister</h4>
              <p className="text-sm text-blue-700">
                Diese Übersicht kann als CSV exportiert und direkt an die Vereine weitergeleitet werden. 
                Die Berechnung erfolgt automatisch basierend auf den gemeldeten Mannschaften und Einzelschützen.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}