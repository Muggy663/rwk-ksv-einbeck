"use client";
import { useState } from 'react';
import { logError } from '@/lib/utils/secure-logger';
import { Button } from '@/components/ui/button';
import { Loader2, Share } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNativeApp } from '@/components/ui/native-app-detector';

interface League {
  id: string;
  name: string;
  [key: string]: any;
}

interface NativePDFButtonProps {
  league: League;
  numRounds: number;
  competitionYear: number;
  type: 'teams' | 'shooters';
  className?: string;
}

/**
 * Native PDF Button für Android App mit Share-Funktionalität
 */
export function NativePDFButton({
  league,
  competitionYear,
  type,
  className
}: NativePDFButtonProps) {
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const { toast } = useToast();
  const { isNativeApp } = useNativeApp();

  const handleNativeShare = async (): Promise<void> => {
    if (isGenerating) return;
    
    setIsGenerating(true);
    
    try {
      let pdfBlob: Blob;
      if (type === 'teams') {
        // Erstelle temporäre Funktion die das Blob direkt zurückgibt
        const generateFunction = async () => {
          const { jsPDF } = await import('jspdf');
          const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
          
          // Vereinfachte PDF-Generierung für native App
          doc.setFontSize(18);
          doc.text(`${league.name} ${competitionYear}`, 14, 20);
          doc.setFontSize(12);
          doc.text(`Mannschaftstabelle - ${new Date().toLocaleDateString('de-DE')}`, 14, 30);
          
          // Einfache Tabelle ohne komplexe Formatierung
          let yPos = 50;
          doc.setFontSize(10);
          doc.text('Platz | Mannschaft | Gesamt', 14, yPos);
          
          if (league.teams) {
            league.teams.forEach((team: any, index: number) => {
              yPos += 10;
              const rank = team.outOfCompetition ? "AK" : (team.rank || index + 1);
              const name = team.name || 'Unbekannt';
              const total = team.totalScore || '-';
              doc.text(`${rank} | ${name} | ${total}`, 14, yPos);
            });
          }
          
          return doc.output('blob');
        };
        
        pdfBlob = await generateFunction();
      } else {
        // Ähnlich für Einzelschützen
        const generateFunction = async () => {
          const { jsPDF } = await import('jspdf');
          const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
          
          doc.setFontSize(18);
          doc.text(`${league.name} ${competitionYear}`, 14, 20);
          doc.setFontSize(12);
          doc.text(`Einzelschützen - ${new Date().toLocaleDateString('de-DE')}`, 14, 30);
          
          let yPos = 50;
          doc.setFontSize(10);
          doc.text('Platz | Name | Mannschaft | Gesamt', 14, yPos);
          
          if (league.individualLeagueShooters) {
            league.individualLeagueShooters.forEach((shooter: any, index: number) => {
              yPos += 10;
              const rank = shooter.teamOutOfCompetition ? "AK" : (shooter.rank || index + 1);
              const name = shooter.shooterName || 'Unbekannt';
              const team = shooter.teamName || 'Unbekannt';
              const total = shooter.totalScore || '-';
              doc.text(`${rank} | ${name} | ${team} | ${total}`, 14, yPos);
            });
          }
          
          return doc.output('blob');
        };
        
        pdfBlob = await generateFunction();
      }

      // Native Share API verwenden
      if (window.Capacitor && window.Capacitor.isNativePlatform()) {
        try {
          // Capacitor Share Plugin
          const { Share } = await import('@capacitor/share');
          
          // Konvertiere Blob zu Base64
          const reader = new FileReader();
          const base64Data = await new Promise<string>((resolve, reject) => {
            reader.onload = () => {
              const result = reader.result as string;
              // Entferne data:application/pdf;base64, Prefix
              const base64 = result.split(',')[1];
              resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(pdfBlob);
          });

          await Share.share({
            title: `${league.name} ${type === 'teams' ? 'Mannschaften' : 'Einzelschützen'}`,
            text: `RWK Tabelle ${competitionYear}`,
            url: `data:application/pdf;base64,${base64Data}`,
            dialogTitle: 'PDF teilen'
          });

          toast({
            title: 'PDF geteilt',
            description: 'Die PDF-Datei wurde erfolgreich geteilt.',
          });
        } catch (shareError) {
          logError('Native Share fehlgeschlagen:', shareError);
          
          // Fallback: Blob URL
          const url = URL.createObjectURL(pdfBlob);
          window.open(url, '_blank');
          
          setTimeout(() => {
            URL.revokeObjectURL(url);
          }, 5000);
          
          toast({
            title: 'PDF geöffnet',
            description: 'Die PDF-Datei wurde in einem neuen Tab geöffnet.',
          });
        }
      } else {
        // Fallback für Web
        const url = URL.createObjectURL(pdfBlob);
        const fileName = `${league.name.replace(/\s+/g, '_')}_${type}_${competitionYear}.pdf`;
        
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        toast({
          title: 'PDF heruntergeladen',
          description: 'Die PDF-Datei wurde erfolgreich heruntergeladen.',
        });
      }
    } catch (error) {
      logError('Fehler beim Erstellen der PDF:', error);
      toast({
        title: 'Fehler',
        description: 'Die PDF-Datei konnte nicht erstellt werden.',
        variant: 'destructive'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Nur in nativer App anzeigen
  if (!isNativeApp) {
    return null;
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleNativeShare}
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
          <Share className="mr-2 h-4 w-4" />
          {type === 'teams' ? 'Mannschaften teilen' : 'Einzelschützen teilen'}
        </>
      )}
    </Button>
  );
}
