"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Zap, AlertCircle, Camera } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ZehnerSerie } from "@/types/schiessnachweis";

interface DigitalAnlageImportProps {
  onImport: (serien: ZehnerSerie[]) => void;
  disziplin: string;
}

export function DigitalAnlageImport({ onImport, disziplin }: DigitalAnlageImportProps) {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPhotoProcessing, setIsPhotoProcessing] = useState(false);



  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    if (file.type.startsWith('image/')) {
      await handlePhotoUpload(file);
    } else {
      toast({
        title: "Ungültiger Dateityp",
        description: "Bitte wählen Sie eine Bild-Datei.",
        variant: "destructive"
      });
    }
    
    // Input zurücksetzen
    event.target.value = '';
  };

  const handlePhotoUpload = async (file: File) => {
    console.log('🔍 Sende Foto an Gemini OCR...');
    setIsPhotoProcessing(true);
    
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('disziplin', disziplin);
      
      const response = await fetch('/api/schiessnachweis-ocr', {
        method: 'POST',
        body: formData
      });
      
      console.log('📡 OCR Response Status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unbekannter Fehler');
        console.error('OCR API Fehler:', errorText);
        throw new Error(`OCR-Service nicht verfügbar (${response.status})`);
      }
      
      const result = await response.json();
      
      if (result.success && result.serien) {
        // Konvertiere OCR-Serien zu ZehnerSerie Format
        const serien: ZehnerSerie[] = result.serien.map((serie: any) => ({
          id: Date.now().toString() + serie.serienNummer,
          serienNummer: serie.serienNummer,
          schuesse: serie.schuesse || [],
          summe: serie.summe || 0
        }));
        
        if (serien.length > 0) {
          onImport(serien);
          toast({
            title: "🤖 Foto-Import erfolgreich",
            description: `${serien.length} Serie(n) aus Foto erkannt und importiert.`,
          });
        } else {
          throw new Error('Keine Serien im Foto erkannt');
        }
      } else {
        throw new Error('Foto konnte nicht analysiert werden');
      }
      
    } catch (error) {
      console.error('Foto-Import Fehler:', error);
      toast({
        title: "Foto-Import fehlgeschlagen",
        description: "Das Foto konnte nicht analysiert werden. Bitte versuchen Sie es erneut.",
        variant: "destructive"
      });
    } finally {
      setIsPhotoProcessing(false);
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
          Importieren Sie Ergebnisse von elektronischen Schießanlagen per Foto-Upload
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
        
        {/* Foto-Upload */}
        <div className="space-y-3">
          <Button 
            onClick={() => document.getElementById('file-input')?.click()}
            disabled={isProcessing || isPhotoProcessing || !disziplin}
            className="flex items-center justify-center gap-2 w-full"
          >
            <Camera className="h-4 w-4" />
            {isPhotoProcessing ? 'Analysiere Foto...' : '📷 Foto hochladen'}
          </Button>
          <input 
            id="file-input"
            type="file" 
            accept=".jpg,.jpeg,.png,.webp" 
            onChange={handleFileUpload}
            className="hidden"
            disabled={isProcessing || isPhotoProcessing || !disziplin}
          />
          <p className="text-xs text-center text-blue-700">
            Unterstützt: .jpg, .png, .webp Dateien
          </p>
        </div>
        
        {/* Hinweise */}
        <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-blue-700 dark:text-blue-300">
              <p className="font-semibold mb-1">Foto-Import:</p>
              <ul className="space-y-1">
                <li>• Fotografieren Sie Ihre Ergebnisse vom Monitor</li>
                <li>• Unterstützt alle elektronischen Anlagen</li>
                <li>• KI-gestützte automatische Erkennung</li>
                <li>• Meyton, Sius, Disag, Sport Quantum, etc.</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
