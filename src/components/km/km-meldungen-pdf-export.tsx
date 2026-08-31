"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, FileDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { generateMeldelistePDF } from '@/lib/services/km-pdf-service';
import type { KMMeldung, KMDisziplin, Shooter, Club } from '@/types';
import { logError } from '@/lib/utils/secure-logger';

interface KMMeldungenPDFExportProps {
  meldungen: any[];
  disziplinen: any[];
  schuetzen: any[];
  vereine: any[];
  saisonName?: string;
  className?: string;
}

export function KMMeldungenPDFExport({
  meldungen,
  disziplinen,
  schuetzen,
  vereine,
  saisonName = 'KM',
  className
}: KMMeldungenPDFExportProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const handleExport = async () => {
    if (isGenerating || meldungen.length === 0) return;
    
    setIsGenerating(true);
    setProgress(10);
    
    try {
      // Simuliere Fortschritt
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev + Math.random() * 10;
          return newProgress < 90 ? newProgress : prev;
        });
      }, 200);
      
      // Generiere PDF
      const pdfBlob = await generateMeldelistePDF(
        meldungen as KMMeldung[],
        disziplinen as KMDisziplin[],
        schuetzen as Shooter[],
        vereine as Club[]
      );
      
      clearInterval(progressInterval);
      setProgress(95);
      
      // PDF herunterladen
      const fileName = `KM_Meldungen_${saisonName.replace(/\s+/g, '_')}_${new Date().toLocaleDateString('de-DE').replace(/\./g, '-')}.pdf`;
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setProgress(100);
      
      toast({
        title: 'PDF erstellt',
        description: `Meldungen-PDF mit ${meldungen.length} Einträgen wurde heruntergeladen.`,
      });
    } catch (error) {
      logError('Fehler beim Erstellen der PDF:', error);
      toast({
        title: 'Fehler',
        description: 'Die PDF-Datei konnte nicht erstellt werden.',
        variant: 'destructive'
      });
    } finally {
      setTimeout(() => {
        setIsGenerating(false);
        setProgress(0);
      }, 500);
    }
  };

  if (meldungen.length === 0) {
    return (
      <Button
        variant="outline"
        disabled
        className={className}
      >
        <FileDown className="mr-2 h-4 w-4" />
        Keine Meldungen vorhanden
      </Button>
    );
  }

  return (
    <div className="flex flex-col space-y-2">
      <Button
        variant="outline"
        onClick={handleExport}
        disabled={isGenerating}
        className={className}
      >
        {isGenerating ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            PDF wird erstellt...
          </>
        ) : (
          <>
            <FileDown className="mr-2 h-4 w-4" />
            📄 Meldungen als PDF ({meldungen.length})
          </>
        )}
      </Button>
      
      {isGenerating && (
        <div className="w-full bg-secondary rounded-full h-1.5 mb-1">
          <div 
            className="bg-primary h-1.5 rounded-full transition-all" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      )}
    </div>
  );
}