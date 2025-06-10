"use client";
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Download, Info, AlertCircle } from 'lucide-react';
import { TouchFriendlyChart } from '@/components/mobile/TouchFriendlyChart';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

/**
 * Komponente für den saisonübergreifenden Vergleich von Schützen
 * 
 * @param {Object} props
 * @param {Array} props.shooters - Array mit Schützen-Objekten
 * @param {number} props.numberOfSeasons - Anzahl der zu berücksichtigenden Saisons
 */
export function SeasonComparisonChart({ 
  shooters = [], 
  numberOfSeasons = 3,
  className
}) {
  const [selectedShooters, setSelectedShooters] = useState([]);
  const [comparisonData, setComparisonData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Lade Vergleichsdaten, wenn sich die ausgewählten Schützen ändern
  useEffect(() => {
    const loadComparisonData = async () => {
      if (selectedShooters.length === 0) {
        setComparisonData(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Erstelle Dummy-Daten für die Visualisierung
        const dummyData = {
          seasons: [
            { id: 'season1', name: 'RWK 2025', year: 2025 }
          ],
          shooters: {},
          comparisonData: []
        };

        // Füge Dummy-Daten für jeden Schützen hinzu
        selectedShooters.forEach(shooter => {
          dummyData.shooters[shooter.id] = {
            name: shooter.name,
            seasons: {
              season1: {
                averageScore: 280 + Math.random() * 10,
                totalScore: 1400,
                roundsShot: 5,
                scores: []
              }
            }
          };
        });

        // Erstelle Vergleichsdaten für das Diagramm
        dummyData.comparisonData.push({
          name: 'RWK 2025',
          year: 2025,
          ...selectedShooters.reduce((acc, shooter) => {
            acc[shooter.id] = dummyData.shooters[shooter.id].seasons.season1.averageScore;
            return acc;
          }, {})
        });

        setComparisonData(dummyData);
      } catch (err) {
        console.error('Fehler beim Laden der Vergleichsdaten:', err);
        setError(`Fehler beim Laden der Vergleichsdaten: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    loadComparisonData();
  }, [selectedShooters, numberOfSeasons]);

  // Funktion zum Hinzufügen/Entfernen eines Schützen
  const toggleShooter = (shooter) => {
    if (selectedShooters.some(s => s.id === shooter.id)) {
      setSelectedShooters(selectedShooters.filter(s => s.id !== shooter.id));
    } else if (selectedShooters.length < 6) {
      setSelectedShooters([...selectedShooters, shooter]);
    }
  };

  // Funktion zum Exportieren des Diagramms als PNG
  const exportChart = () => {
    const chartElement = document.getElementById('season-comparison-chart');
    if (!chartElement) return;
    
    try {
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
        downloadLink.download = 'Saisonvergleich.png';
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
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Saisonübergreifender Vergleich</CardTitle>
          <CardDescription>Vergleich der Leistungsentwicklung über mehrere Saisons</CardDescription>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={exportChart}
          disabled={!comparisonData || isLoading}
        >
          <Download className="h-4 w-4 mr-2" />
          Exportieren
        </Button>
      </CardHeader>
      <CardContent>
        <Alert className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Hinweis</AlertTitle>
          <AlertDescription>
            Der saisonübergreifende Vergleich wird erst ab der Saison 2026 mit mehreren Datenpunkten relevant sein.
            Aktuell werden Beispieldaten angezeigt.
          </AlertDescription>
        </Alert>

        <div className="mb-6">
          <Label className="mb-2 block">Schützen auswählen (max. 6)</Label>
          <div className="flex flex-wrap gap-2">
            {shooters.map(shooter => (
              <Badge 
                key={shooter.id}
                variant={selectedShooters.some(s => s.id === shooter.id) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => toggleShooter(shooter)}
              >
                {shooter.name}
                {selectedShooters.some(s => s.id === shooter.id) && (
                  <span className="ml-1">✓</span>
                )}
              </Badge>
            ))}
            {shooters.length === 0 && (
              <p className="text-sm text-muted-foreground">Keine Schützen verfügbar</p>
            )}
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>Fehler</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="h-[400px] w-full flex items-center justify-center">
            <Skeleton className="h-[350px] w-full" />
          </div>
        ) : comparisonData && comparisonData.comparisonData && comparisonData.comparisonData.length > 0 ? (
          <div id="season-comparison-chart" className="h-[400px] w-full">
            <TouchFriendlyChart
              type="line"
              data={comparisonData.comparisonData}
              dataKey={selectedShooters.map(shooter => shooter.id)}
              colors={COLORS}
              config={{
                xAxisDataKey: 'name',
                yAxisDomain: [260, 300],
                legendFormatter: (value) => {
                  const shooter = selectedShooters.find(s => s.id === value);
                  return shooter ? shooter.name : value;
                },
                tooltipFormatter: (value, name) => {
                  const shooter = selectedShooters.find(s => s.id === name);
                  return [value, shooter ? shooter.name : name];
                }
              }}
            />
          </div>
        ) : (
          <div className="h-[400px] w-full flex flex-col items-center justify-center">
            <Info className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              {selectedShooters.length === 0 
                ? "Bitte wähle mindestens einen Schützen aus" 
                : "Keine Daten für die ausgewählten Schützen verfügbar"}
            </p>
          </div>
        )}

        {comparisonData && comparisonData.comparisonData && comparisonData.comparisonData.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-medium mb-2">Legende:</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {selectedShooters.map((shooter, index) => (
                <div 
                  key={shooter.id} 
                  className="flex items-center p-2 rounded-md border"
                  style={{ borderLeftColor: COLORS[index % COLORS.length], borderLeftWidth: '4px' }}
                >
                  <div>
                    <p className="font-medium">{shooter.name}</p>
                    <div className="text-xs text-muted-foreground">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="cursor-help underline decoration-dotted">
                              Durchschnittliche Entwicklung
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Durchschnittliche Ringzahl pro Saison</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}