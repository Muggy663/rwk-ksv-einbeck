"use client";

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Camera, Loader2, CheckCircle2, AlertCircle, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ScheibenScannerProps {
  discipline: string; // 'LG', 'LP', 'KK' etc.
  shotCount: number; // Erwartete Schussanzahl (10, 20, 40)
  onResult: (result: {
    shots: number[];
    totalWithDecimal: number;
    totalWholeRings: number;
    shotCount: number;
    confidence: number;
  }) => void;
}

export function ScheibenScanner({ discipline, shotCount, onResult }: ScheibenScannerProps) {
  const { toast } = useToast();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file) return;

    // Vorschau zeigen
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);

    // Analyse starten
    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('discipline', discipline);
      formData.append('shotCount', shotCount.toString());

      const response = await fetch('/api/gemini/analyze-target', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Analyse fehlgeschlagen');
      }

      const data = await response.json();
      
      if (data.success) {
        setResult(data);
        toast({
          title: '✅ Scheibe erkannt',
          description: `${data.shotCount} Schuss erkannt — ${data.totalWholeRings} Ringe (Vertrauen: ${data.confidence}%)`,
        });
      } else {
        throw new Error(data.error || 'Unbekannter Fehler');
      }
    } catch (err: any) {
      setError(err.message);
      toast({
        title: 'Fehler bei der Erkennung',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleConfirm = () => {
    if (result) {
      onResult(result);
      reset();
    }
  };

  const reset = () => {
    setPreview(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  // Disziplin-Label
  const disciplineLabel = {
    'LG': 'Luftgewehr',
    'LP': 'Luftpistole',
    'KK': 'Kleinkaliber',
    'KKP': 'KK Pistole',
  }[discipline] || discipline;

  return (
    <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Camera className="h-5 w-5 text-purple-600" />
          📸 Scheibe fotografieren
          <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-700">Beta</Badge>
        </CardTitle>
        <CardDescription>
          Fotografiere deine Scheibe — die Ringe werden automatisch erkannt
          <Badge variant="outline" className="ml-2">{disciplineLabel}</Badge>
          <Badge variant="outline" className="ml-1">{shotCount} Schuss</Badge>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {!preview && !isAnalyzing && (
          <div className="space-y-2">
            {/* Kamera-Button (Mobile) */}
            <div className="block md:hidden">
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
              <Button
                type="button"
                className="w-full bg-purple-600 hover:bg-purple-700 h-12 text-base"
                onClick={() => cameraInputRef.current?.click()}
              >
                <Camera className="mr-2 h-5 w-5" />
                Scheibe fotografieren
              </Button>
            </div>

            {/* Datei-Auswahl (Desktop + Mobile) */}
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => fileInputRef.current?.click()}
              >
                📁 Aus Galerie wählen
              </Button>
            </div>
          </div>
        )}

        {/* Analyse läuft */}
        {isAnalyzing && (
          <div className="flex flex-col items-center gap-3 py-6">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            <p className="text-sm text-muted-foreground">Scheibe wird analysiert...</p>
          </div>
        )}

        {/* Vorschau + Ergebnis */}
        {preview && !isAnalyzing && (
          <div className="space-y-3">
            <div className="relative">
              <img src={preview} alt="Scheibe" className="rounded-lg max-h-48 mx-auto object-contain" />
            </div>

            {result && (
              <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="font-medium text-green-800 dark:text-green-200">
                    {result.shotCount} Schuss erkannt — {result.totalWholeRings} Ringe
                  </span>
                  <Badge className={result.confidence >= 80 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}>
                    {result.confidence}% Vertrauen
                  </Badge>
                </div>

                {result.shots && (
                  <div className="flex flex-wrap gap-1.5">
                    {result.shots.map((shot: number, i: number) => (
                      <span key={i} className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-medium ${
                        shot >= 10 ? 'bg-green-200 text-green-800' :
                        shot >= 9 ? 'bg-blue-200 text-blue-800' :
                        shot >= 8 ? 'bg-yellow-200 text-yellow-800' :
                        'bg-red-200 text-red-800'
                      }`}>
                        {Number.isInteger(shot) ? shot : shot.toFixed(1)}
                      </span>
                    ))}
                  </div>
                )}

                {result.notes && (
                  <p className="text-xs text-muted-foreground">{result.notes}</p>
                )}

                <div className="flex gap-2 pt-1">
                  <Button size="sm" onClick={handleConfirm} className="bg-green-600 hover:bg-green-700">
                    <CheckCircle2 className="h-4 w-4 mr-1" /> Übernehmen
                  </Button>
                  <Button size="sm" variant="outline" onClick={reset}>
                    <RotateCcw className="h-4 w-4 mr-1" /> Neue Aufnahme
                  </Button>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
                <span className="text-sm text-red-700">{error}</span>
                <Button size="sm" variant="outline" onClick={reset} className="ml-auto">
                  Erneut versuchen
                </Button>
              </div>
            )}
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          💡 Tipps: Scheibe flach fotografieren, gutes Licht, möglichst ohne Schatten. Die KI-Erkennung muss immer kontrolliert werden.
        </p>
        <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded p-2">
          <p className="text-xs text-orange-700 dark:text-orange-300">
            ⚠️ <strong>Beta-Funktion:</strong> Die automatische Scheiben-Erkennung befindet sich noch in der Entwicklung. 
            Die erkannten Werte müssen immer manuell überprüft werden. Bei Problemen bitte Feedback an rwk-leiter-ksve@gmx.de.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
