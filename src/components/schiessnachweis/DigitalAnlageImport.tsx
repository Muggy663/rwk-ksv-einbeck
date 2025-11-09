"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, FileText, Zap, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ZehnerSerie } from "@/types/schiessnachweis";

interface DigitalAnlageImportProps {
  onImport: (serien: ZehnerSerie[]) => void;
  disziplin: string;
}

export function DigitalAnlageImport({ onImport, disziplin }: DigitalAnlageImportProps) {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [textInput, setTextInput] = useState("");

  const processDigitalResults = async (text: string) => {
    setIsProcessing(true);
    
    try {
      // Gemini AI Integration für intelligente Erkennung
      const response = await fetch('/api/gemini-ocr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text,
          context: `Erkenne Schießergebnisse aus digitaler Schießanlage für Disziplin: ${disziplin}. 
          Format kann sein: Meyton, Sius, Disag, Sport Quantum.
          Extrahiere Serien und Einzelschüsse mit Kommastellen.`
        })
      });
      
      if (response.ok) {
        const aiResult = await response.json();
        if (aiResult.serien && aiResult.serien.length > 0) {
          onImport(aiResult.serien);
          toast({
            title: "🤖 KI-Import erfolgreich",
            description: `${aiResult.serien.length} Serie(n) automatisch erkannt und importiert.`,
          });
          setTextInput("");
          return;
        }
      }
      
      // Fallback: Manuelle Verarbeitung
      const lines = text.split('\n').filter(line => line.trim());
      const serien: ZehnerSerie[] = [];
      
      let currentSerie: ZehnerSerie | null = null;
      let serienNummer = 1;
      
      for (const line of lines) {
        if (line.includes('Serie') || line.includes('Round') || line.includes('String')) {
          if (currentSerie) {
            serien.push(currentSerie);
          }
          currentSerie = {
            id: Date.now().toString() + serienNummer,
            serienNummer,
            schuesse: [],
            summe: 0
          };
          serienNummer++;
        } else if (line.match(/^\d+[\.,]\d*$/)) {
          if (currentSerie) {
            const wert = parseFloat(line.replace(',', '.'));
            currentSerie.schuesse.push({
              nummer: currentSerie.schuesse.length + 1,
              wert,
              ring: Math.floor(wert)
            });
          }
        } else if (line.match(/^[\d\.,\s]+$/)) {
          const werte = line.split(/[\s,;\t]+/).filter(w => w.trim());
          if (currentSerie) {
            werte.forEach(wertStr => {
              const wert = parseFloat(wertStr.replace(',', '.'));
              if (!isNaN(wert) && wert >= 0 && wert <= 10.9) {
                currentSerie!.schuesse.push({
                  nummer: currentSerie!.schuesse.length + 1,
                  wert,
                  ring: Math.floor(wert)
                });
              }
            });
          }
        }
      }
      
      if (currentSerie) {
        serien.push(currentSerie);
      }
      
      serien.forEach(serie => {
        serie.summe = serie.schuesse.reduce((sum, schuss) => sum + schuss.wert, 0);
      });
      
      if (serien.length > 0) {
        onImport(serien);
        toast({
          title: "Import erfolgreich",
          description: `${serien.length} Serie(n) mit ${serien.reduce((sum, s) => sum + s.schuesse.length, 0)} Schüssen importiert.`,
        });
        setTextInput("");
      } else {
        throw new Error("Keine gültigen Ergebnisse gefunden");
      }
      
    } catch (error) {
      toast({
        title: "Import fehlgeschlagen",
        description: "Die Ergebnisse konnten nicht verarbeitet werden. Bitte prüfen Sie das Format.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    if (file.type === 'text/plain' || file.name.endsWith('.txt') || file.name.endsWith('.csv')) {
      const text = await file.text();
      await processDigitalResults(text);
    } else {
      toast({
        title: "Ungültiger Dateityp",
        description: "Bitte wählen Sie eine .txt oder .csv Datei.",
        variant: "destructive"
      });
    }
    
    // Input zurücksetzen
    event.target.value = '';
  };

  return (
    <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
          <Zap className="h-5 w-5" />
          Import von digitaler Anlage
        </CardTitle>
        <CardDescription className="text-blue-700 dark:text-blue-300">
          Importieren Sie Ergebnisse von elektronischen Schießanlagen (Meyton, Sius, Disag, Sport Quantum, etc.)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Text-Eingabe */}
        <div>
          <Label htmlFor="textInput">Ergebnisse einfügen</Label>
          <textarea
            id="textInput"
            className="w-full h-32 p-3 border rounded-md font-mono text-sm"
            placeholder={`Beispiel-Formate:

Meyton:
Serie 1
10.5 9.8 10.1 9.9 10.0 9.7 10.2 9.6 10.3 9.8
Summe: 98.6

Sius/Disag:
String 1: 10.5, 9.8, 10.1, 9.9, 10.0
String 2: 9.7, 10.2, 9.6, 10.3, 9.8

Sport Quantum:
Round 1 | 10.5 | 9.8 | 10.1 | 9.9 | 10.0 |
Total: 50.3`}
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
          />
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <Button 
            onClick={() => processDigitalResults(textInput)}
            disabled={!textInput.trim() || isProcessing}
            className="flex items-center justify-center gap-2 w-full sm:w-auto"
          >
            <FileText className="h-4 w-4" />
            {isProcessing ? 'Verarbeite...' : 'Text importieren'}
          </Button>
          
          {/* Datei-Upload */}
          <div className="relative w-full sm:w-auto">
            <input
              type="file"
              accept=".txt,.csv"
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={isProcessing}
            />
            <Button variant="outline" disabled={isProcessing} className="flex items-center justify-center gap-2 w-full">
              <Upload className="h-4 w-4" />
              Datei hochladen
            </Button>
          </div>
        </div>
        
        {/* Hinweise */}
        <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-blue-700 dark:text-blue-300">
              <p className="font-semibold mb-1">Unterstützte Anlagen:</p>
              <ul className="space-y-1">
                <li>• Meyton OpticScore/MytargetSoft (.txt, .csv)</li>
                <li>• Sius Ascor/Suis Target (.txt, .csv)</li>
                <li>• Disag Shooting Systems (.txt, .csv)</li>
                <li>• Sport Quantum (.txt, .csv)</li>
                <li>• Foto von Bildschirm/Ausdruck (🤖 Gemini KI)</li>
                <li>• Automatische Format-Erkennung</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}