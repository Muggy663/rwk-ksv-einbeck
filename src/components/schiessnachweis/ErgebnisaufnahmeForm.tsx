"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Minus, RotateCcw, Calculator } from "lucide-react";
import { ZehnerSerie, Schuss, getDisziplinConfig, DisziplinName } from "@/types/schiessnachweis";

interface ErgebnisaufnahmeFormProps {
  disziplin: DisziplinName;
  onSerienChange: (serien: ZehnerSerie[]) => void;
  initialSerien?: ZehnerSerie[];
  schussAnzahl?: number;
}

export function ErgebnisaufnahmeForm({ disziplin, onSerienChange, initialSerien = [], schussAnzahl }: ErgebnisaufnahmeFormProps) {
  const [serien, setSerien] = useState<ZehnerSerie[]>(initialSerien);
  const [activeSerieIndex, setActiveSerieIndex] = useState<number>(0);
  const [eingabeModus, setEingabeModus] = useState<'einzelschuss' | 'seriensumme'>('einzelschuss');
  const [seriensummeInput, setSeriensummeInput] = useState<string>('');
  
  const disziplinConfig = getDisziplinConfig(disziplin);
  
  useEffect(() => {
    if (serien.length === 0 && disziplinConfig && schussAnzahl) {
      // Berechne Anzahl benötigter Serien basierend auf Schussanzahl
      const benötigteSerien = Math.ceil(schussAnzahl / disziplinConfig.serienGroesse);
      
      // Erstelle die benötigten Serien
      const neueSerien: ZehnerSerie[] = [];
      for (let i = 0; i < benötigteSerien; i++) {
        const neueSerie: ZehnerSerie = {
          id: `${Date.now()}-${i}`,
          serienNummer: i + 1,
          schuesse: Array.from({ length: disziplinConfig.serienGroesse }, (_, j) => ({
            nummer: j + 1,
            wert: 0,
            ring: 0
          })),
          summe: 0
        };
        neueSerien.push(neueSerie);
      }
      
      setSerien(neueSerien);
      setActiveSerieIndex(0);
    } else if (serien.length === 0 && disziplinConfig) {
      // Fallback: Eine Serie erstellen
      addSerie();
    }
  }, [disziplin, schussAnzahl]);

  useEffect(() => {
    onSerienChange(serien);
  }, [serien, onSerienChange]);

  const addSerie = () => {
    if (!disziplinConfig) return;
    
    const neueSerie: ZehnerSerie = {
      id: Date.now().toString(),
      serienNummer: serien.length + 1,
      schuesse: Array.from({ length: disziplinConfig.serienGroesse }, (_, i) => ({
        nummer: i + 1,
        wert: 0,
        ring: 0
      })),
      summe: 0
    };
    
    const neueSerien = [...serien, neueSerie];
    setSerien(neueSerien);
    setActiveSerieIndex(neueSerien.length - 1);
  };

  const updateSchuss = (serieIndex: number, schussIndex: number, wert: number) => {
    if (!disziplinConfig) return;
    
    const neueSerien = [...serien];
    const serie = neueSerien[serieIndex];
    
    const maxWert = disziplinConfig.maxRinge;
    const validierterWert = Math.max(0, Math.min(maxWert, wert));
    
    serie.schuesse[schussIndex] = {
      ...serie.schuesse[schussIndex],
      wert: validierterWert,
      ring: Math.floor(validierterWert)
    };
    
    serie.summe = serie.schuesse.reduce((sum, schuss) => sum + schuss.wert, 0);
    setSerien(neueSerien);
  };

  const getGesamtErgebnis = () => {
    return serien.reduce((sum, serie) => sum + serie.summe, 0);
  };

  const applySeriensumme = (e?: React.FormEvent) => {
    if (e) e.preventDefault(); // Verhindere Form-Submit
    if (!disziplinConfig || !seriensummeInput) return;
    
    const summe = parseFloat(seriensummeInput);
    
    const neueSerien = [...serien];
    const serie = neueSerien[activeSerieIndex];
    
    // Nur Summe setzen, keine Einzelschüsse
    serie.summe = summe;
    serie.schuesse = []; // Leere Einzelschüsse bei Seriensumme-Modus
    
    setSerien(neueSerien);
    setSeriensummeInput('');
  };

  const getSchnellwerte = () => {
    if (!disziplinConfig) return [];
    
    if (disziplinConfig.kommastellen) {
      return [0, 8.0, 9.0, 9.5, 10.0, 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8, 10.9];
    } else {
      return Array.from({ length: disziplinConfig.maxRinge + 1 }, (_, i) => i);
    }
  };

  if (!disziplinConfig) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">Bitte wählen Sie zuerst eine Disziplin aus.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Ergebnisaufnahme - {disziplin}</span>
            <Badge variant="default" className="text-lg px-3">
              {getGesamtErgebnis().toFixed(disziplinConfig.kommastellen ? 1 : 0)} Ringe
            </Badge>
          </CardTitle>
          <CardDescription>
            {disziplinConfig.serienGroesse} Schuss pro Serie • Max. {disziplinConfig.maxRinge} Ringe
            {disziplinConfig.kommastellen && " • Kommastellen möglich"}
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="flex flex-wrap gap-2 mb-4">
        {serien.map((serie, index) => (
          <Button
            key={serie.id}
            type="button"
            variant={activeSerieIndex === index ? "default" : "outline"}
            size="sm"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setActiveSerieIndex(index);
            }}
          >
            Serie {serie.serienNummer}
            <Badge variant="secondary" className="ml-2">
              {serie.summe.toFixed(disziplinConfig.kommastellen ? 1 : 0)}
            </Badge>
          </Button>
        ))}
        <Button 
          type="button" 
          variant="outline" 
          size="sm" 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            addSerie();
          }}
        >
          <Plus className="h-4 w-4 mr-1" />
          Serie
        </Button>
      </div>

      {serien[activeSerieIndex] && (
        <Card>
          <CardHeader>
            <CardTitle>Serie {serien[activeSerieIndex].serienNummer}</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Eingabe-Modus Umschalter */}
            <div className="flex items-center gap-4 mb-4">
              <Label className="text-sm font-medium">Eingabe-Modus:</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={eingabeModus === 'einzelschuss' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setEingabeModus('einzelschuss')}
                >
                  Einzelschuss
                </Button>
                <Button
                  type="button"
                  variant={eingabeModus === 'seriensumme' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setEingabeModus('seriensumme')}
                >
                  Seriensumme
                </Button>
              </div>
            </div>

            {eingabeModus === 'einzelschuss' ? (
              <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-3 mb-6">
                {serien[activeSerieIndex].schuesse.map((schuss, schussIndex) => (
                  <div key={schuss.nummer} className="space-y-2">
                    <Label className="text-xs text-center block">
                      Schuss {schuss.nummer}
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      max={disziplinConfig.maxRinge}
                      step={disziplinConfig.kommastellen ? "0.1" : "1"}
                      value={schuss.wert || ""}
                      onChange={(e) => {
                        const wert = parseFloat(e.target.value) || 0;
                        updateSchuss(activeSerieIndex, schussIndex, wert);
                      }}
                      className="text-center font-mono text-lg"
                      placeholder="0"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="mb-6">
                <Label className="text-sm font-medium mb-2 block">
                  Seriensumme eingeben
                </Label>
                <div className="flex gap-4 items-end">
                  <div className="flex-1 max-w-xs">
                    <Input
                      type="number"
                      min="0"
                      max={disziplinConfig.maxRinge * disziplinConfig.serienGroesse}
                      step={disziplinConfig.kommastellen ? "0.1" : "1"}
                      value={seriensummeInput}
                      onChange={(e) => {
                        const summe = parseFloat(e.target.value) || 0;
                        setSeriensummeInput(e.target.value);
                        
                        // Automatisch anwenden wenn Wert eingegeben wird
                        if (summe > 0) {
                          const neueSerien = [...serien];
                          const serie = neueSerien[activeSerieIndex];
                          serie.summe = summe;
                          serie.schuesse = []; // Keine Einzelschüsse bei Seriensumme
                          setSerien(neueSerien);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          e.stopPropagation();
                        }
                      }}
                      onBlur={() => setSeriensummeInput('')} // Input leeren nach Verlassen
                      placeholder={`Max. ${disziplinConfig.maxRinge * disziplinConfig.serienGroesse} Ringe`}
                      className="text-center font-mono text-lg"
                    />
                  </div>
                  <Button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      applySeriensumme();
                    }}
                    disabled={!seriensummeInput}
                  >
                    Verteilen
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Nur die Gesamtsumme wird gespeichert. Durchschnitt: {seriensummeInput ? (parseFloat(seriensummeInput) / disziplinConfig.serienGroesse).toFixed(disziplinConfig.kommastellen ? 1 : 0) : '0'} Ringe/Schuss
                </p>
              </div>
            )}

            {eingabeModus === 'einzelschuss' && (
              <div className="border-t pt-4">
                <Label className="text-sm font-medium mb-3 block">
                  <Calculator className="h-4 w-4 inline mr-1" />
                  Schnelleingabe:
                </Label>
                <div className="flex flex-wrap gap-2">
                  {getSchnellwerte().map((wert) => (
                    <Button
                      key={wert}
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const serie = serien[activeSerieIndex];
                        const leerSchussIndex = serie.schuesse.findIndex(s => s.wert === 0);
                        if (leerSchussIndex !== -1) {
                          updateSchuss(activeSerieIndex, leerSchussIndex, wert);
                        }
                      }}
                      className={`${wert === 0 ? 'text-red-600' : wert >= 10 ? 'text-green-600 font-bold' : ''}`}
                    >
                      {wert.toFixed(disziplinConfig.kommastellen ? 1 : 0)}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}