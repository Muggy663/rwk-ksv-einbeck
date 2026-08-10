"use client";

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Camera, Loader2, CheckCircle2, AlertCircle, RotateCcw, Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ScheibenScannerProps {
  discipline: string;
  shotCount: number;
  onResult: (result: {
    shots: number[];
    totalWithDecimal: number;
    totalWholeRings: number;
    shotCount: number;
    confidence: number;
  }) => void;
}

interface ScannedTarget {
  id: string;
  preview: string;
  shots: number[];
  confidence: number;
}

export function ScheibenScanner({ discipline, shotCount, onResult }: ScheibenScannerProps) {
  const { toast } = useToast();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [scannedTargets, setScannedTargets] = useState<ScannedTarget[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file) return;
    setIsAnalyzing(true);
    setError(null);

    // Vorschau
    const previewUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.readAsDataURL(file);
    });

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

      if (data.success && data.shots) {
        setScannedTargets(prev => [...prev, {
          id: Date.now().toString(),
          preview: previewUrl,
          shots: data.shots,
          confidence: data.confidence || 0,
        }]);
        toast({ title: '✅ Scheibe erkannt', description: `${data.shots.length} Schuss erkannt` });
      } else {
        throw new Error('Keine Schüsse erkannt');
      }
    } catch (err: any) {
      setError(err.message);
      toast({ title: 'Fehler', description: err.message, variant: 'destructive' });
    } finally {
      setIsAnalyzing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
    }
  };

  const updateShot = (targetIndex: number, shotIndex: number, value: string) => {
    setScannedTargets(prev => {
      const updated = [...prev];
      const parsed = parseFloat(value);
      updated[targetIndex].shots[shotIndex] = isNaN(parsed) ? 0 : parsed;
      return updated;
    });
  };

  const removeTarget = (targetId: string) => {
    setScannedTargets(prev => prev.filter(t => t.id !== targetId));
  };

  const handleConfirm = () => {
    const allShots = scannedTargets.flatMap(t => t.shots);
    if (allShots.length === 0) return;

    const totalWithDecimal = Math.round(allShots.reduce((a, b) => a + b, 0) * 10) / 10;
    const totalWholeRings = allShots.reduce((a, b) => a + Math.floor(b), 0);
    const avgConfidence = scannedTargets.length > 0
      ? Math.round(scannedTargets.reduce((a, t) => a + t.confidence, 0) / scannedTargets.length)
      : 0;

    onResult({
      shots: allShots,
      totalWithDecimal,
      totalWholeRings,
      shotCount: allShots.length,
      confidence: avgConfidence,
    });

    setScannedTargets([]);
  };

  const totalShots = scannedTargets.reduce((sum, t) => sum + t.shots.length, 0);
  const totalRings = Math.round(scannedTargets.flatMap(t => t.shots).reduce((a, b) => a + b, 0) * 10) / 10;

  const disciplineLabel = {
    'LG': 'Luftgewehr', 'LP': 'Luftpistole', 'KK': 'Kleinkaliber', 'KKP': 'KK Pistole',
  }[discipline] || discipline;

  return (
    <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Camera className="h-5 w-5 text-purple-600" />
          📸 Scheibe fotografieren
          <span className="text-xs bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300 px-2 py-0.5 rounded-full ml-2">Beta</span>
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          {disciplineLabel} — {shotCount} Schuss. Mehrere Scheiben möglich.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">

        {/* Upload-Buttons — immer sichtbar */}
        {!isAnalyzing && (
          <div className="flex gap-2">
            <div className="block md:hidden flex-1">
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
                className="w-full bg-purple-600 hover:bg-purple-700 h-11"
                onClick={() => cameraInputRef.current?.click()}
              >
                <Camera className="mr-2 h-4 w-4" />
                {scannedTargets.length > 0 ? 'Weitere Scheibe' : 'Fotografieren'}
              </Button>
            </div>
            <div className="flex-1">
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
                className="w-full h-11"
                onClick={() => fileInputRef.current?.click()}
              >
                <Plus className="mr-2 h-4 w-4" />
                {scannedTargets.length > 0 ? 'Weitere Scheibe' : 'Aus Galerie'}
              </Button>
            </div>
          </div>
        )}

        {/* Analyse läuft */}
        {isAnalyzing && (
          <div className="flex flex-col items-center gap-3 py-4">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            <p className="text-sm text-muted-foreground">Scheibe wird analysiert...</p>
          </div>
        )}

        {/* Fehler */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-2 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
            <span className="text-sm text-red-700">{error}</span>
          </div>
        )}

        {/* Gescannte Scheiben mit editierbaren Werten */}
        {scannedTargets.length > 0 && (
          <div className="space-y-3">
            {scannedTargets.map((target, targetIdx) => (
              <div key={target.id} className="border rounded-lg p-3 bg-white dark:bg-background space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img src={target.preview} alt={`Scheibe ${targetIdx + 1}`} className="h-10 w-10 rounded object-cover" />
                    <span className="text-sm font-medium">Scheibe {targetIdx + 1}</span>
                    <span className="text-xs text-muted-foreground">({target.shots.length} Schuss)</span>
                  </div>
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-500" onClick={() => removeTarget(target.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>

                {/* Editierbare Schusswerte */}
                <div className="grid grid-cols-5 gap-1.5">
                  {target.shots.map((shot, shotIdx) => (
                    <Input
                      key={shotIdx}
                      type="number"
                      step="0.1"
                      min="0"
                      max="10.9"
                      value={shot || ''}
                      onChange={(e) => updateShot(targetIdx, shotIdx, e.target.value)}
                      className={`h-9 text-center text-sm font-medium p-1 ${
                        shot >= 10 ? 'bg-green-50 border-green-300' :
                        shot >= 9 ? 'bg-blue-50 border-blue-300' :
                        shot >= 8 ? 'bg-yellow-50 border-yellow-300' :
                        'bg-red-50 border-red-300'
                      }`}
                    />
                  ))}
                </div>

                <div className="text-xs text-muted-foreground text-right">
                  Summe: <strong>{Math.round(target.shots.reduce((a, b) => a + b, 0) * 10) / 10}</strong> Ringe
                </div>
              </div>
            ))}

            {/* Gesamtergebnis + Übernehmen */}
            <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="font-medium text-green-800 dark:text-green-200">
                    Gesamt: {totalShots} Schuss — <strong>{totalRings}</strong> Ringe (Zehntel)
                  </span>
                  <br />
                  <span className="text-sm text-green-700 dark:text-green-300">
                    Ganze Ringe: <strong>{scannedTargets.flatMap(t => t.shots).reduce((a, b) => a + Math.floor(b), 0)}</strong>
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleConfirm} className="bg-green-600 hover:bg-green-700 flex-1">
                  <CheckCircle2 className="h-4 w-4 mr-1" /> Übernehmen
                </Button>
                <Button size="sm" variant="outline" onClick={() => setScannedTargets([])}>
                  <RotateCcw className="h-4 w-4 mr-1" /> Zurücksetzen
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded p-2">
          <p className="text-xs text-orange-700 dark:text-orange-300">
            ⚠️ <strong>Beta:</strong> Erkannte Werte immer prüfen und korrigieren. Bei mehreren Scheiben (z.B. 5 Schuss pro Scheibe) einfach nacheinander fotografieren.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
