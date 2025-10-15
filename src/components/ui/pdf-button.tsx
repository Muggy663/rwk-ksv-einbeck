import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, FileDown, AlertTriangle } from 'lucide-react';
import { generateLeaguePDFFixed, generateShootersPDFFixed } from '@/lib/utils/pdf-generator.fix';
import { useToast } from '@/hooks/use-toast';
import { useNativeApp } from '@/components/ui/native-app-detector';
import { isSafari, showSafariPDFInstructions } from '@/lib/utils/safari-pdf-fix';

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
  const [isNative, setIsNative] = useState<boolean>(false);
  const { toast } = useToast();
  const { isNativeApp } = useNativeApp();
  
  useEffect(() => {
    setIsNative(isNativeApp);
  }, [isNativeApp]);

  const handleExport = async (): Promise<void> => {
    if (isGenerating) return;
    
    // Safari-spezifische Warnung
    if (isSafari() && !showSafariPDFInstructions()) {
      return; // Benutzer hat abgebrochen
    }
    
    setIsGenerating(true);
    
    try {
      if (type === 'teams') {
        await generateLeaguePDFFixed(league, numRounds, competitionYear);
      } else {
        await generateShootersPDFFixed(league, numRounds, competitionYear);
      }
      
      toast({
        title: 'PDF erstellt',
        description: isSafari() 
          ? 'PDF wurde geöffnet. Falls nicht sichtbar, prüfen Sie neue Tabs oder Downloads.'
          : 'Die PDF-Datei wurde erfolgreich erstellt.',
      });
    } catch (error) {
      console.error('Fehler beim Erstellen der PDF:', error);
      
      let errorMessage = 'Die PDF-Datei konnte nicht erstellt werden.';
      if (isSafari()) {
        errorMessage += ' Safari hat bekannte PDF-Probleme. Versuchen Sie Chrome oder Firefox.';
      }
      
      toast({
        title: 'Fehler',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Safari-Erkennung über Hilfsfunktion
  const safariDetected = isSafari();
  
  // In nativer App ausblenden
  if (isNative) {
    return null;
  }
  
  // Safari-spezifische Darstellung
  if (isSafari()) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={handleExport}
        disabled={isGenerating}
        className={`${className} border-amber-300 text-amber-700 hover:bg-amber-50`}
        title="Safari-Kompatibilitätsmodus - PDF wird in neuem Tab geöffnet"
      >
        {isGenerating ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            PDF wird erstellt...
          </>
        ) : (
          <>
            <AlertTriangle className="mr-2 h-4 w-4" />
            {type === 'teams' ? 'PDF (Safari)' : 'PDF (Safari)'}
          </>
        )}
      </Button>
    );
  }
  
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
