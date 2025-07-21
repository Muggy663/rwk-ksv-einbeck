import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, FileDown } from 'lucide-react';
import { generateLeaguePDFFixed, generateShootersPDFFixed } from '@/lib/utils/pdf-generator.fix';
import { useToast } from '@/hooks/use-toast';

interface League {
  id: string;
  name: string;
  [key: string]: any;
}

interface PDFButtonProps {
  league: League;
  numRounds: number;
  competitionYear: number;
  type: 'teams' | 'shooters';
  className?: string;
}

/**
 * Button zum Exportieren von PDF-Dateien mit verbesserter mobiler Unterstützung
 */
function PDFButtonComponent({
  league,
  numRounds,
  competitionYear,
  type,
  className
}: PDFButtonProps) {
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const { toast } = useToast();

  const handleExport = async (): Promise<void> => {
    if (isGenerating) return;
    
    setIsGenerating(true);
    
    try {
      if (type === 'teams') {
        await generateLeaguePDFFixed(league, numRounds, competitionYear);
      } else {
        await generateShootersPDFFixed(league, numRounds, competitionYear);
      }
      
      toast({
        title: 'PDF erstellt',
        description: 'Die PDF-Datei wurde erfolgreich erstellt.',
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

// Exportiere beide Varianten, um Kompatibilität zu gewährleisten
export const PDFButton = PDFButtonComponent;
export const PdfButton = PDFButtonComponent;