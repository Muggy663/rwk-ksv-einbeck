import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, FileDown } from 'lucide-react';
import { LeagueDisplay } from '@/types/rwk';
import { generateLeaguePDF, generateShootersPDF } from '@/lib/services/pdf-service';
import { useToast } from '@/hooks/use-toast';

interface PDFExportButtonProps {
  league: LeagueDisplay;
  numRounds: number;
  competitionYear: number;
  type: 'teams' | 'shooters';
  className?: string;
}

export function PDFExportButton({
  league,
  numRounds,
  competitionYear,
  type,
  className
}: PDFExportButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleExport = async () => {
    if (isGenerating) return;
    
    setIsGenerating(true);
    
    try {
      let pdfBlob: Blob;
      let fileName: string;
      
      if (type === 'teams') {
        pdfBlob = await generateLeaguePDF(league, numRounds, competitionYear);
        fileName = `${league.name.replace(/\s+/g, '_')}_Mannschaften_${competitionYear}.pdf`;
      } else {
        pdfBlob = await generateShootersPDF(league, numRounds, competitionYear);
        fileName = `${league.name.replace(/\s+/g, '_')}_Einzelschuetzen_${competitionYear}.pdf`;
      }
      
      // PDF herunterladen
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
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
      setIsGenerating(false);
    }
  };

  return (
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
  );
}