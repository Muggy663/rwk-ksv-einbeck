"use client";

import React, { useState, useEffect } from 'react';
import { ShooterComparisonSelector, Shooter } from '@/components/statistics/ShooterComparisonSelector';
import { ShooterComparisonChart } from '@/components/statistics/ShooterComparisonChart';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
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
      console.error('Fehler beim Exportieren des Diagramms:', error);
      alert('Das Diagramm konnte nicht exportiert werden.');
    }
  };

  return (
    <div className="container py-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-primary">Schützenvergleich</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <Label htmlFor="season-select">Saison</Label>
          <Select
            value={selectedSeason}
            onValueChange={setSelectedSeason}
            disabled={seasons.length === 0}
          >
            <SelectTrigger id="season-select">
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
            disabled={leagues.length === 0}
          >
            <SelectTrigger id="league-select">
              <SelectValue placeholder="Alle Ligen" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Ligen</SelectItem>
              {leagues.map(league => (
                <SelectItem key={league.id} value={league.id}>
                  {league.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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