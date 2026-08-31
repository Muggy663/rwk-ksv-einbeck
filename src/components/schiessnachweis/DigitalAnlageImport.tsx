"use client";

import { useState, useRef } from "react";
import { logError } from '@/lib/utils/secure-logger';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Zap, AlertCircle, Camera, Loader2, CheckCircle2, RotateCcw, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ZehnerSerie } from "@/types/schiessnachweis";

interface DigitalAnlageImportProps {
  onImport: (serien: ZehnerSerie[]) => void;
  disziplin: string;
}

export function DigitalAnlageImport({ onImport, disziplin }: DigitalAnlageImportProps) {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [recognizedSerien, setRecognizedSerien] = useState<ZehnerSerie[]>([]);
  const [preview, setPreview] = useState<string | null>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file || !file.type.startsWith('image/')) {
      toast({ title: "Ungültiger Dateityp", description: "Bitte ein Bild auswählen.", variant: "destructive" });
      return;
    }

    // Vorschau
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);

    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('disziplin', disziplin);

      const response = await fetch('/api/schiessnachweis-ocr', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error(`OCR-Service nicht verfügbar (${response.status})`);

      const result = await response.json();

      if (result.success && result.serien && result.serien.length > 0) {
        const serien: ZehnerSerie[] = result.serien.map((serie: any) => ({
          id: Date.now().toString() + serie.serienNummer,
          serienNummer: serie.serienNummer,
          schuesse: (serie.schuesse || []).map((s: any) => ({
            nummer: s.nummer || 0,
            wert: s.wert || 0,
            ring: s.ring || Math.floor(s.wert || 0),
            zehntel: s.zehntel || ((s.wert || 0) % 1),
          })),
          summe: serie.summe || 0
        }));
        setRecognizedSerien(serien);
        toast({ title: "✅ Erkannt", description: `${serien.length} Serie(n) aus Ausdruck erkannt. Bitte prüfen.` });
      } else {
        throw new Error('Keine Serien erkannt');
      }
    } catch (error) {
      logError('Digital-Import Fehler:', error);
      toast({ title: "Fehler", description: "Ausdruck konnte nicht analysiert werden.", variant: "destructive" });
    } finally {
      setIsProcessing(false);
      if (cameraRef.current) cameraRef.current.value = '';
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const updateSchuss = (serieIdx: number, schussIdx: number, value: string) => {
    setRecognizedSerien(prev => {
      const updated = [...prev];
      const parsed = parseFloat(value);
      const wert = isNaN(parsed) ? 0 : parsed;
      updated[serieIdx].schuesse[schussIdx] = {
        ...updated[serieIdx].schuesse[schussIdx],
        wert,
        ring: Math.floor(wert),
        zehntel: Math.round((wert % 1) * 10) / 10,
      };
      // Summe neu berechnen
      updated[serieIdx].summe = Math.round(
        updated[serieIdx].schuesse.reduce((sum, s) => sum + (s.wert || 0), 0) * 10
      ) / 10;
      return updated;
    });
  };

  const handleConfirm = () => {
    onImport(recognizedSerien);
    toast({ title: "✅ Übernommen", description: `${recognizedSerien.length} Serie(n) übernommen.` });
    setRecognizedSerien([]);
    setPreview(null);
  };

  const reset = () => {
    setRecognizedSerien([]);
    setPreview(null);
  };

  const totalRings = recognizedSerien.reduce((sum, s) => sum + s.summe, 0);

  return (
    <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-950/20 dark:to-yellow-950/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Zap className="h-5 w-5 text-orange-600" />
          Ausdruck digitale Anlage
          <span className="text-xs bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300 px-2 py-0.5 rounded-full ml-2">Beta</span>
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          Meyton, Sius, Disag etc. — Foto vom Ausdruck analysieren
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">

        {!disziplin && (
          <div className="bg-yellow-100 border border-yellow-300 p-3 rounded-lg">
            <p className="text-sm text-yellow-800">⚠️ Bitte zuerst Disziplin auswählen.</p>
          </div>
        )}

        {/* Upload-Buttons */}
        {disziplin && !isProcessing && recognizedSerien.length === 0 && (
          <div className="space-y-2">
            <div className="block md:hidden">
              <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
              <Button type="button" className="w-full h-11 bg-orange-600 hover:bg-orange-700"
                onClick={() => cameraRef.current?.click()}>
                <Camera className="mr-2 h-4 w-4" /> Fotografieren
              </Button>
            </div>
            <div>
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
              <Button type="button" variant="outline" className="w-full h-11"
                onClick={() => fileRef.current?.click()}>
                <Plus className="mr-2 h-4 w-4" /> Aus Galerie
              </Button>
            </div>
          </div>
        )}

        {/* Analyse läuft */}
        {isProcessing && (
          <div className="flex flex-col items-center gap-3 py-4">
            <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
            <p className="text-sm text-muted-foreground">Ausdruck wird analysiert...</p>
          </div>
        )}

        {/* Erkannte Serien — editierbar */}
        {recognizedSerien.length > 0 && (
          <div className="space-y-3">
            {preview && (
              <img src={preview} alt="Ausdruck" className="rounded-lg max-h-32 mx-auto object-contain" />
            )}

            {recognizedSerien.map((serie, serieIdx) => (
              <div key={serie.id} className="border rounded-lg p-3 bg-white dark:bg-background space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Serie {serie.serienNummer}</span>
                  <span className="text-xs text-muted-foreground">
                    Ganze: <strong>{serie.schuesse.reduce((a, sc) => a + Math.floor(sc.wert || 0), 0)}</strong>
                    {' · '}Zehntel: <strong>{serie.summe.toFixed(1)}</strong>
                  </span>
                </div>

                <div className="grid grid-cols-5 gap-1.5">
                  {serie.schuesse.map((schuss, schussIdx) => (
                    <Input
                      key={schussIdx}
                      type="number"
                      step="0.1"
                      min="0"
                      max="10.9"
                      value={schuss.wert || ''}
                      onChange={(e) => updateSchuss(serieIdx, schussIdx, e.target.value)}
                      className={`h-9 text-center text-sm font-medium p-1 ${
                        (schuss.wert || 0) >= 10 ? 'bg-green-50 border-green-300' :
                        (schuss.wert || 0) >= 9 ? 'bg-blue-50 border-blue-300' :
                        (schuss.wert || 0) >= 8 ? 'bg-yellow-50 border-yellow-300' :
                        'bg-red-50 border-red-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
            ))}

            {/* Gesamt + Buttons */}
            <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="font-medium text-green-800 dark:text-green-200">
                    Ganze Ringe: <strong>{recognizedSerien.reduce((sum, s) => sum + s.schuesse.reduce((a, sc) => a + Math.floor(sc.wert || 0), 0), 0)}</strong>
                  </span>
                  <br />
                  <span className="text-sm text-green-600 dark:text-green-400">
                    Mit Zehntel: <strong>{(Math.round(totalRings * 10) / 10).toFixed(1)}</strong>
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleConfirm} className="bg-green-600 hover:bg-green-700 flex-1">
                  <CheckCircle2 className="h-4 w-4 mr-1" /> Übernehmen
                </Button>
                <Button size="sm" variant="outline" onClick={reset}>
                  <RotateCcw className="h-4 w-4 mr-1" /> Verwerfen
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Hinweis */}
        <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded p-2">
          <p className="text-xs text-orange-700 dark:text-orange-300">
            ⚠️ <strong>Beta:</strong> Erkannte Werte immer prüfen und bei Bedarf korrigieren. Unterstützt Meyton, Sius, Disag, Sport Quantum u.a.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
