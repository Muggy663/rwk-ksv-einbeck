"use client";
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, FileDown } from 'lucide-react';
import { generateLeaguePDF, generateShootersPDF } from '@/lib/services/pdf-service';
import { useToast } from '@/hooks/use-toast';

interface League {
  id: string;
  name: string;
  [key: string]: any;
}

interface PDFExportButtonProps {
  league: League;
  numRounds: number;
  competitionYear: number;
  type: 'teams' | 'shooters';
  className?: string;
  useCache?: boolean;
}

/**
 * Button zum Exportieren von PDF-Dateien
 */
export function PDFExportButton({
  league,
  numRounds,
  competitionYear,
  type,
  className,
  useCache = true
}: PDFExportButtonProps) {
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const { toast } = useToast();

  const handleExport = async (): Promise<void> => {
    if (isGenerating) return;
    
    setIsGenerating(true);
    setProgress(10); // Starte mit 10%
    
    try {
      let pdfBlob: Blob;
      let fileName: string;
      
      // Simuliere Fortschritt
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev + Math.random() * 5;
          return newProgress < 90 ? newProgress : prev;
        });
      }, 200);
      
      if (type === 'teams') {
        pdfBlob = await generateLeaguePDF(league, numRounds, competitionYear, { useCache });
        fileName = `${league.name.replace(/\s+/g, '_')}_Mannschaften_${competitionYear}.pdf`;
      } else {
        pdfBlob = await generateShootersPDF(league, numRounds, competitionYear, { useCache });
        fileName = `${league.name.replace(/\s+/g, '_')}_Einzelschuetzen_${competitionYear}.pdf`;
      }
      
      clearInterval(progressInterval);
      setProgress(95); // Fast fertig
      
      // PDF herunterladen
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setProgress(100); // Fertig
      
      toast({
        title: 'PDF erstellt',
        description: 'Die PDF-Datei wurde erfolgreich erstellt und heruntergeladen.',
      });
    } catch (error) {
      console.error('Fehler beim Erstellen der PDF:', error);
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

  return (
    <div className="flex flex-col space-y-2">
      <Button
        variant="outline"
        size="sm"
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
            {type === 'teams' ? 'Mannschaften als PDF' : 'Einzelschützen als PDF'}
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
