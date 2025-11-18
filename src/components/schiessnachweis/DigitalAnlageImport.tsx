"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, FileText, Zap, AlertCircle, Camera, Image } from "lucide-react";
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
  const [isPhotoProcessing, setIsPhotoProcessing] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
          context: `Erkenne Schießergebnisse für Schießnachweis aus digitaler Schießanlage für Disziplin: ${disziplin}. 
          Format kann sein: Meyton, Sius, Disag, Sport Quantum oder manuell eingegebene Daten.
          Extrahiere Serien und Einzelschüsse mit Kommastellen (z.B. 10.5, 9.8, 10.1).
          Wichtig: Erkenne auch Serien-Strukturen und Gesamtergebnisse für persönliches Schießtagebuch.`
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

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Ungültiger Dateityp",
        description: "Bitte wählen Sie ein Bild aus.",
        variant: "destructive"
      });
      return;
    }

    setIsPhotoProcessing(true);
    
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('context', `Erkenne Schießergebnisse aus Ausdrucken digitaler Schießanlagen für Disziplin: ${disziplin}.
      
      FORMATE:
      • Meyton OpticScore: Tabellen mit Einzelschüssen (10.5, 9.8) und Seriensummen
      • Sius Ascor: "Shot 1: 10.5" oder Tabellen mit Schussnummern
      • Disag: "Ring 1: 10.5" oder "S1: 10.5" Format
      • Sport Quantum: "Round 1" mit Schusswerten in Spalten
      
      Extrahiere ALLE Einzelschüsse mit Kommastellen (0.0-10.9) und erkenne Serien-Strukturen.`);
      
      console.log('🔍 Sende Foto an Gemini OCR...');
      const response = await fetch('/api/gemini-ocr', {
        method: 'POST',
        body: formData
      });
      
      console.log('📡 OCR Response Status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        
        console.log('📊 OCR Result:', result);
        console.log('📊 OCR Results Array:', result.results);
        
        if (result.success && result.results && result.results.length > 0) {
          // Konvertiere OCR-Ergebnisse zu Serien
          const serien: ZehnerSerie[] = [];
          let serienNummer = 1;
          
          // Sammle alle Schießwerte und Ringzahlen aus verschiedenen Formaten
          const alleWerte: number[] = [];
          const alleRingzahlen: number[] = [];
          
          result.results.forEach((res: any, index: number) => {
            console.log(`📊 OCR Result ${index}:`, res);
            
            // Verschiedene Formate prüfen
            let wert: number | null = null;
            
            // Format 1: res.score (Meyton/Standard)
            if (res.score && !isNaN(parseFloat(res.score))) {
              wert = parseFloat(res.score);
            }
            // Format 2: res.shotValue (Sius/Disag)
            else if (res.shotValue && !isNaN(parseFloat(res.shotValue))) {
              wert = parseFloat(res.shotValue);
            }
            // Format 3: res.ringValue (Sport Quantum)
            else if (res.ringValue && !isNaN(parseFloat(res.ringValue))) {
              wert = parseFloat(res.ringValue);
            }
            // Format 4: res.value (Allgemein)
            else if (res.value && !isNaN(parseFloat(res.value))) {
              wert = parseFloat(res.value);
            }
            // Format 5: res.shooterName als Wert (falls Gemini verwirrt ist)
            else if (res.shooterName && !isNaN(parseFloat(res.shooterName))) {
              wert = parseFloat(res.shooterName);
            }
            // Format 6: Direkt als Zahl
            else if (typeof res === 'number') {
              wert = res;
            }
            // Format 7: String mit Zahl
            else if (typeof res === 'string' && !isNaN(parseFloat(res))) {
              wert = parseFloat(res);
            }
            
            // Sammle sowohl Schusswerte als auch Ringzahlen
            if (wert !== null && wert >= 0) {
              // Große ganze Zahlen = Ringzahlen (z.B. 297, 311)
              if (wert > 50 && wert === Math.floor(wert)) {
                alleRingzahlen.push(wert);
                console.log(`🎯 Ringzahl gefunden: ${wert}`);
              }
              // Einzelschusswerte (0.0 bis 10.9)
              else if (wert <= 10.9) {
                alleWerte.push(wert);
                console.log(`✅ Schusswert gefunden: ${wert}`);
              }
            } else {
              console.log(`❌ Ungültiger Wert: ${wert}`);
            }
          });
          
          console.log(`🎯 Alle Schusswerte:`, alleWerte);
          console.log(`🎯 Alle Ringzahlen:`, alleRingzahlen);
          
          // Erstelle Serien mit je 10 Schuss (oder weniger)
          if (alleWerte.length > 0) {
            for (let i = 0; i < alleWerte.length; i += 10) {
              const serienWerte = alleWerte.slice(i, i + 10);
              const ringeSumme = alleRingzahlen.length > 0 ? alleRingzahlen[serienNummer - 1] || Math.floor(serienWerte.reduce((sum, wert) => sum + wert, 0)) : Math.floor(serienWerte.reduce((sum, wert) => sum + wert, 0));
              
              const serie: ZehnerSerie = {
                id: `photo-${Date.now()}-${serienNummer}`,
                serienNummer,
                schuesse: serienWerte.map((wert, index) => ({
                  nummer: index + 1,
                  wert,
                  ring: Math.floor(wert)
                })),
                summe: serienWerte.reduce((sum, wert) => sum + wert, 0),
                ringeSumme
              };
              serien.push(serie);
              serienNummer++;
            }
            
            onImport(serien);
            toast({
              title: "🤖 Foto-Import erfolgreich",
              description: `${serien.length} Serie(n) mit ${alleWerte.length} Schüssen aus Schießanlagen-Ausdruck erkannt.`,
            });
          } else {
            throw new Error(`Keine gültigen Schießwerte gefunden. OCR erkannte: ${JSON.stringify(result.results)}`);
          }
        } else {
          console.warn('⚠️ Keine OCR-Ergebnisse:', result);
          throw new Error(`Keine Ergebnisse im Foto erkannt. ${result.error || 'Unbekannter Fehler'}`);
        }
      } else {
        throw new Error("OCR-Service nicht verfügbar");
      }
    } catch (error) {
      console.error('Foto-Import Fehler:', error);
      
      let errorMessage = "Die Ergebnisse konnten nicht aus dem Foto erkannt werden.";
      
      if (error instanceof Error) {
        if (error.message.includes("Keine gültigen Ergebnisse")) {
          errorMessage = "Keine Schießergebnisse im Foto erkannt. Versuchen Sie:\n• Bessere Beleuchtung\n• Klareres Foto\n• Vollständige Ergebnistabelle";
        } else if (error.message.includes("OCR-Service")) {
          errorMessage = "KI-Service vorübergehend nicht verfügbar. Versuchen Sie Text-Import.";
        }
      }
      
      toast({
        title: "📸 Foto-Import fehlgeschlagen",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsPhotoProcessing(false);
      // Input zurücksetzen
      event.target.value = '';
    }
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
        {!disziplin && (
          <div className="bg-yellow-100 border border-yellow-300 p-3 rounded-lg">
            <p className="text-sm text-yellow-800 font-medium">
              ⚠️ Bitte wählen Sie zuerst eine <strong>Disziplin</strong> und <strong>Anzahl Schüsse</strong> aus, bevor Sie Ergebnisse importieren.
            </p>
          </div>
        )}
        
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
        
        {/* Buttons für alle Geräte */}
        <div className="space-y-3">
          <Button 
            onClick={() => processDigitalResults(textInput)}
            disabled={!textInput.trim() || isProcessing || !disziplin}
            className="flex items-center justify-center gap-2 w-full"
          >
            <FileText className="h-4 w-4" />
            {isProcessing ? 'Verarbeite...' : 'Text importieren'}
          </Button>
          
          {/* Kamera-Button für Mobile */}
          <div className="block md:hidden">
            <Button 
              onClick={() => document.getElementById('camera-input')?.click()}
              disabled={isProcessing || isPhotoProcessing || !disziplin}
              className="flex items-center justify-center gap-2 w-full bg-green-600 hover:bg-green-700"
            >
              <Camera className="h-4 w-4" />
              {isPhotoProcessing ? 'Analysiere Foto...' : '📸 Kamera öffnen'}
            </Button>
            <input 
              id="camera-input"
              type="file" 
              accept="image/*" 
              capture="environment"
              onChange={handlePhotoUpload}
              className="hidden"
              disabled={isProcessing || isPhotoProcessing || !disziplin}
            />
          </div>
          
          {/* Galerie/Datei-Auswahl für alle Geräte */}
          <div className="space-y-2">
            <Button 
              onClick={() => document.getElementById('file-input')?.click()}
              disabled={isProcessing || isPhotoProcessing || !disziplin}
              variant="outline"
              className="flex items-center justify-center gap-2 w-full border-blue-300 text-blue-700 hover:bg-blue-50"
            >
              <Image className="h-4 w-4" />
              {isPhotoProcessing ? 'Analysiere...' : '📁 Foto/Datei auswählen'}
            </Button>
            <input 
              id="file-input"
              type="file" 
              accept="image/*,.txt,.csv" 
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  if (file.type.startsWith('image/')) {
                    handlePhotoUpload(e);
                  } else {
                    handleFileUpload(e);
                  }
                }
              }}
              className="hidden"
              disabled={isProcessing || isPhotoProcessing || !disziplin}
            />
            <p className="text-xs text-center text-blue-700">
              Unterstützt: JPG, PNG, .txt, .csv Dateien
            </p>
          </div>
        </div>
        
        {/* Hinweise */}
        <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-blue-700 dark:text-blue-300">
              <p className="font-semibold mb-1">Unterstützte Anlagen:</p>
              <ul className="space-y-1">
                <li>• Meyton OpticScore/MytargetSoft (.txt, .csv, 📷)</li>
                <li>• Sius Ascor/Suis Target (.txt, .csv, 📷)</li>
                <li>• Disag Shooting Systems (.txt, .csv, 📷)</li>
                <li>• Sport Quantum (.txt, .csv, 📷)</li>
                {isMobile && (
                  <>
                    <li>• 📸 Foto von Bildschirm/Ausdruck (🤖 Gemini KI)</li>
                    <li>• 📱 Handy-Fotos aus WhatsApp/Galerie</li>
                    <li>• 🎯 Meyton/Sius/Disag Ausdrucke scannen</li>
                  </>
                )}
                {!isMobile && (
                  <li>• 💻 Desktop: Nur Datei-Upload verfügbar</li>
                )}
                <li>• Automatische Format-Erkennung</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}