"use client";

import { useState, useEffect } from "react";
import { logError, logWarn, logInfo, logDebug } from '@/lib/utils/secure-logger';
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
  
  // Lade Seriensumme in Input wenn Serie gewechselt wird
  useEffect(() => {
    if (serien[activeSerieIndex]?.summe > 0) {
      setSeriensummeInput(serien[activeSerieIndex].summe.toString());
    } else {
      setSeriensummeInput('');
    }
  }, [activeSerieIndex, serien]);
  
  const disziplinConfig = getDisziplinConfig(disziplin);
  
  useEffect(() => {
    if (serien.length === 0 && disziplinConfig && schussAnzahl) {
      // Berechne Anzahl benötigter Serien basierend auf Schussanzahl
      const benötigteSerien = Math.ceil(schussAnzahl / disziplinConfig.serienGroesse);
      
      // Erstelle die benötigten Serien
      const neueSerien: ZehnerSerie[] = [];
      for (let i = 0; i < benötigteSerien; i++) {
        const neueSerie: ZehnerSerie = {
          id: `serie-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${i}`,
          serienNummer: i + 1,
          schuesse: Array.from({ length: disziplinConfig.serienGroesse }, (_, j) => ({
            nummer: j + 1,
            wert: 0,
            ring: 0,
            zehntel: 0
          })),
          summe: 0
        };
        neueSerien.push(neueSerie);
      }
      
      setSerien(neueSerien);
      setActiveSerieIndex(0);
    } else if (serien.length === 0 && disziplinConfig) {
      // Fallback: Eine Serie erstellen
      const neueSerie: ZehnerSerie = {
        id: `serie-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        serienNummer: 1,
        schuesse: Array.from({ length: disziplinConfig.serienGroesse }, (_, i) => ({
          nummer: i + 1,
          wert: 0,
          ring: 0,
          zehntel: 0
        })),
        summe: 0
      };
      setSerien([neueSerie]);
      setActiveSerieIndex(0);
    }
  }, [disziplin, schussAnzahl, disziplinConfig, serien.length]);

  useEffect(() => {
    onSerienChange(serien);
  }, [serien]);

  const addSerie = () => {
    if (!disziplinConfig) return;
    
    const neueSerie: ZehnerSerie = {
      id: `serie-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${serien.length}`,
      serienNummer: serien.length + 1,
      schuesse: Array.from({ length: disziplinConfig.serienGroesse }, (_, i) => ({
        nummer: i + 1,
        wert: 0,
        ring: 0,
        zehntel: 0
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
    
    const maxWert = disziplinConfig.maxRinge + (disziplinConfig.kommastellen ? 0.9 : 0);
    const validierterWert = Math.max(0, Math.min(maxWert, wert));
    
    // Berechne ganze Ringe und Zehntel-Anteil
    const ganzeRinge = Math.floor(validierterWert);
    const zehntelAnteil = validierterWert - ganzeRinge;
    
    serie.schuesse[schussIndex] = {
      ...serie.schuesse[schussIndex],
      wert: validierterWert,
      ring: ganzeRinge,
      zehntel: zehntelAnteil
    };
    
    const rawSum = serie.schuesse.reduce((sum, schuss) => sum + schuss.wert, 0);
    serie.summe = Math.round(rawSum * 10) / 10; // Korrekte Rundung auf 1 Dezimalstelle
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
          <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <span className="flex items-center gap-2">
              <div className="w-3 h-3 bg-primary rounded-full flex-shrink-0"></div>
              Ergebnisaufnahme - {disziplin}
            </span>
            <Badge variant="default" className="text-lg px-3 w-fit">
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
              {serie.summe.toFixed(1)}
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
            <div className="space-y-3 mb-4">
              <Label className="text-sm font-medium">Eingabe-Modus:</Label>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  type="button"
                  variant={eingabeModus === 'einzelschuss' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setEingabeModus('einzelschuss')}
                  className="w-full sm:w-auto"
                >
                  Einzelschuss
                </Button>
                <Button
                  type="button"
                  variant={eingabeModus === 'seriensumme' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setEingabeModus('seriensumme')}
                  className="w-full sm:w-auto"
                >
                  Seriensumme
                </Button>
              </div>
            </div>

            {eingabeModus === 'einzelschuss' ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
                  {serien[activeSerieIndex].schuesse.map((schuss, schussIndex) => (
                    <div key={schuss.nummer} className="space-y-2 p-3 border rounded-lg">
                      <Label className="text-xs text-center block font-semibold">
                        Schuss {schuss.nummer}
                      </Label>
                      
                      {disziplinConfig.kommastellen ? (
                        // Zehntel-Eingabe: Separate Felder für ganze und Zehntel-Ringe
                        <div className="space-y-2">
                          <div>
                            <Label className="text-xs text-muted-foreground">Ganze Ringe</Label>
                            <Input
                              type="number"
                              min="0"
                              max={disziplinConfig.maxRinge}
                              step="1"
                              value={schuss.ring || ""}
                              onChange={(e) => {
                                const ganzeRinge = parseInt(e.target.value) || 0;
                                const zehntel = schuss.zehntel || 0;
                                const gesamtWert = ganzeRinge + zehntel;
                                updateSchuss(activeSerieIndex, schussIndex, gesamtWert);
                              }}
                              className="text-center font-mono text-sm h-8"
                              placeholder="10"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Zehntel</Label>
                            <Input
                              type="number"
                              min="0"
                              max="0.9"
                              step="0.1"
                              value={schuss.zehntel ? schuss.zehntel.toFixed(1) : ""}
                              onChange={(e) => {
                                const zehntel = parseFloat(e.target.value) || 0;
                                const ganzeRinge = schuss.ring || 0;
                                const gesamtWert = ganzeRinge + zehntel;
                                updateSchuss(activeSerieIndex, schussIndex, gesamtWert);
                              }}
                              className="text-center font-mono text-sm h-8 border-green-200"
                              placeholder="0.5"
                            />
                          </div>
                          <div className="text-center">
                            <Badge variant="outline" className="text-xs">
                              = {schuss.wert.toFixed(1)}
                            </Badge>
                          </div>
                        </div>
                      ) : (
                        // Normale Eingabe: Ein Feld für ganze Ringe
                        <Input
                          type="number"
                          min="0"
                          max={disziplinConfig.maxRinge}
                          step="1"
                          value={schuss.wert || ""}
                          onChange={(e) => {
                            const wert = parseInt(e.target.value) || 0;
                            updateSchuss(activeSerieIndex, schussIndex, wert);
                          }}
                          className="text-center font-mono text-lg"
                          placeholder="0"
                        />
                      )}
                    </div>
                  ))}
                </div>
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
                          
                          // Intelligente Erkennung: Punkt/Komma = Zehntel, sonst ganze Ringe
                          const hatKomma = e.target.value.includes('.') || e.target.value.includes(',');
                          
                          if (hatKomma && disziplinConfig.kommastellen) {
                            // Zehntel-Eingabe: Summe direkt übernehmen
                            serie.summe = summe;
                            serie.schuesse = []; // Keine Einzelschüsse bei Zehntel
                          } else {
                            // Ganze Ringe: Einzelschüsse mit ganzen Ringen erstellen
                            const schuesseProSerie = disziplinConfig.serienGroesse;
                            const durchschnitt = Math.floor(summe / schuesseProSerie);
                            const rest = summe % schuesseProSerie;
                            
                            // Erstelle Schüsse mit ganzen Ringen
                            const neueSchuesse = Array.from({ length: schuesseProSerie }, (_, i) => ({
                              nummer: i + 1,
                              wert: i < rest ? durchschnitt + 1 : durchschnitt,
                              ring: i < rest ? durchschnitt + 1 : durchschnitt
                            }));
                            
                            serie.schuesse = neueSchuesse;
                            serie.summe = summe;
                          }
                          
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
                      placeholder={`Max. ${((disziplinConfig.maxRinge + (disziplinConfig.kommastellen ? 0.9 : 0)) * disziplinConfig.serienGroesse).toFixed(disziplinConfig.kommastellen ? 1 : 0)} Ringe`}
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
                  Nur die Gesamtsumme wird gespeichert. Durchschnitt: {seriensummeInput ? (parseFloat(seriensummeInput) / disziplinConfig.serienGroesse).toFixed(disziplinConfig.kommastellen ? 1 : 0) : (serien[activeSerieIndex]?.summe ? (serien[activeSerieIndex].summe / disziplinConfig.serienGroesse).toFixed(disziplinConfig.kommastellen ? 1 : 0) : '0')} Ringe/Schuss
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
