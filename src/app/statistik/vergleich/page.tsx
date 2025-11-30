"use client";

import React, { useState, useEffect } from 'react';
import { logError, logWarn, logInfo, logDebug } from '@/lib/utils/secure-logger';
import { ShooterComparisonSelector, Shooter } from '@/components/statistics/ShooterComparisonSelector';
import { ShooterComparisonChart } from '@/components/statistics/ShooterComparisonChart';
import { NativeSelect } from '@/components/ui/native-select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { fetchSeasons, fetchLeagues, fetchShooterPerformanceData } from '@/lib/services/statistics-service';

export default function ShooterComparisonPage() {
  // Filter-States
  const [seasons, setSeasons] = useState<Array<{ id: string; name: string; year: number }>>([]);
  const [leagues, setLeagues] = useState<Array<{ id: string; name: string; type: string }>>([]);
  
  const [selectedSeason, setSelectedSeason] = useState<string>('');
  const [selectedLeague, setSelectedLeague] = useState<string>('all');
  
  // Daten-States
  const [allShooters, setAllShooters] = useState<Shooter[]>([]);
  const [selectedShooters, setSelectedShooters] = useState<Shooter[]>([]);
  const [chartData, setChartData] = useState<Array<{ name: string; [key: string]: any }>>([]);
  
  // Loading-States
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // Lade Saisons beim ersten Rendern
  useEffect(() => {
    const loadSeasons = async () => {
      const seasonsData = await fetchSeasons();
      setSeasons(seasonsData);
      
      if (seasonsData.length > 0) {
        setSelectedSeason(seasonsData[0].id);
      }
    };
    
    loadSeasons();
  }, []);
  
  // Lade Ligen, wenn sich die Saison ändert
  useEffect(() => {
    const loadLeagues = async () => {
      if (!selectedSeason) return;
      
      const leaguesData = await fetchLeagues(selectedSeason);
      setLeagues(leaguesData);
      setSelectedLeague('all');
    };
    
    loadLeagues();
  }, [selectedSeason]);
  
  // Lade Schützen, wenn sich die Filter ändern
  useEffect(() => {
    if (!selectedSeason) return;
    
    const loadShooters = async () => {
      setIsLoading(true);
      
      const shooterPerformanceData = await fetchShooterPerformanceData(
        selectedSeason,
        selectedLeague !== 'all' ? selectedLeague : undefined
      );
      
      // Schützen für die Auswahl aufbereiten
      const shooters = shooterPerformanceData.map(shooter => ({
        id: shooter.shooterId,
        name: shooter.shooterName,
        teamName: shooter.teamName,
        averageScore: shooter.averageScore
      }));
      
      setAllShooters(shooters);
      setIsLoading(false);
    };
    
    loadShooters();
  }, [selectedSeason, selectedLeague]);
  
  // Aktualisiere Diagrammdaten, wenn sich die ausgewählten Schützen ändern
  useEffect(() => {
    if (selectedShooters.length === 0) {
      setChartData([]);
      return;
    }
    
    const loadShooterData = async () => {
      setIsLoading(true);
      
      const shooterPerformanceData = await fetchShooterPerformanceData(
        selectedSeason,
        selectedLeague !== 'all' ? selectedLeague : undefined
      );
      
      // Finde die vollständigen Daten für die ausgewählten Schützen
      const selectedShooterData = shooterPerformanceData.filter(shooter => 
        selectedShooters.some(s => s.id === shooter.shooterId)
      );
      
      // Daten für das Liniendiagramm aufbereiten
      const formattedData = [];
      const maxDurchgang = 5; // Maximal 5 Durchgänge
      
      for (let dg = 1; dg <= maxDurchgang; dg++) {
        const dataPoint: any = { name: `DG ${dg}` };
        
        selectedShooterData.forEach(shooter => {
          const key = `dg${dg}`;
          dataPoint[shooter.shooterId] = shooter.results[key] || null;
        });
        
        formattedData.push(dataPoint);
      }
      
      setChartData(formattedData);
      setIsLoading(false);
    };
    
    loadShooterData();
  }, [selectedShooters, selectedSeason, selectedLeague]);
  
  // Funktion zum Exportieren des Diagramms als PNG
  const exportChart = () => {
    const chartElement = document.getElementById('shooter-comparison-chart');
    if (!chartElement) return;
    
    try {
      // SVG in Canvas umwandeln und als PNG herunterladen
      const svgElement = chartElement.querySelector('svg');
      if (!svgElement) return;
      
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      const img = new Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
        
        const pngFile = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.download = 'Schützenvergleich.png';
        downloadLink.href = pngFile;
        downloadLink.click();
      };
      
      img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    } catch (error) {
      logError('Fehler beim Exportieren des Diagramms:', error);
      alert('Das Diagramm konnte nicht exportiert werden.');
    }
  };

  return (
    <div className="container py-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-primary">Schützenvergleich</h1>
        <Button asChild variant="outline" className="w-full sm:w-auto">
          <Link href="/statistik" className="flex items-center justify-center">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Zurück zur Übersicht
          </Link>
        </Button>
      </div>
      
      <div className="space-y-4 mb-6">
        <div>
          <Label htmlFor="season-select" className="text-base font-medium">Saison</Label>
          <NativeSelect
            value={selectedSeason}
            onValueChange={setSelectedSeason}
            disabled={seasons.length === 0}
            placeholder="Saison auswählen"
            options={seasons.map(season => ({ value: season.id, label: season.name }))}
            className="h-12 text-base mt-1"
          />
        </div>
        
        <div>
          <Label htmlFor="league-select" className="text-base font-medium">Liga</Label>
          <NativeSelect
            value={selectedLeague}
            onValueChange={setSelectedLeague}
            disabled={leagues.length === 0}
            placeholder="Alle Ligen"
            options={[
              { value: 'all', label: 'Alle Ligen' },
              ...leagues.map(league => ({ value: league.id, label: league.name }))
            ]}
            className="h-12 text-base mt-1"
          />
        </div>
      </div>
      
      <ShooterComparisonSelector 
        shooters={allShooters}
        maxSelections={6}
        onSelectionChange={setSelectedShooters}
      />
      
      <ShooterComparisonChart 
        data={chartData}
        selectedShooters={selectedShooters}
        isLoading={isLoading}
        onExport={exportChart}
      />
    </div>
  );
}
