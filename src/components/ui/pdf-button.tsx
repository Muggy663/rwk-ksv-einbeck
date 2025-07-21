"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Printer, FileDown, Loader2 } from 'lucide-react';
import { PdfGenerator } from '@/lib/utils/pdf-generator.fix';
import { useToast } from '@/hooks/use-toast';

interface PdfButtonProps {
  title: string;
  subtitle?: string;
  generateData: () => Promise<any>;
  pdfType: 'leagueResults' | 'shooterResults' | 'certificate';
  buttonText?: string;
  variant?: 'default' | 'outline' | 'secondary';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
  fileName?: string;
  orientation?: 'portrait' | 'landscape';
}

export function PdfButton({
  title,
  subtitle,
  generateData,
  pdfType,
  buttonText = 'PDF erstellen',
  variant = 'default',
  size = 'default',
  className = '',
  fileName,
  orientation = 'portrait'
}: PdfButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleGeneratePdf = async () => {
    setIsLoading(true);
    try {
      // Daten für das PDF abrufen
      const data = await generateData();
      
      // PDF-Generator initialisieren
      const pdfGenerator = new PdfGenerator({
        title,
        subtitle,
        orientation,
        author: 'RWK Einbeck App',
        footerText: '© Kreisschützenverband Einbeck'
      });
      
      // Je nach PDF-Typ die entsprechende Methode aufrufen
      switch (pdfType) {
        case 'leagueResults':
          pdfGenerator.generateLeagueResults(data);
          break;
        case 'shooterResults':
          pdfGenerator.generateShooterResults(data);
          break;
        case 'certificate':
          pdfGenerator.generateCertificate(data);
          break;
      }
      
      // PDF speichern oder öffnen
      if (fileName) {
        pdfGenerator.save(fileName);
        toast({
          title: 'PDF erstellt',
          description: `Die Datei "${fileName}" wurde erfolgreich erstellt.`,
        });
      } else {
        pdfGenerator.open();
      }
    } catch (error) {
      console.error('Fehler beim Erstellen des PDFs:', error);
      toast({
        title: 'Fehler',
        description: 'Das PDF konnte nicht erstellt werden.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleGeneratePdf}
      disabled={isLoading}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          PDF wird erstellt...
        </>
      ) : (
        <>
          {fileName ? (
            <FileDown className="mr-2 h-4 w-4" />
          ) : (
            <Printer className="mr-2 h-4 w-4" />
          )}
          {buttonText}
        </>
      )}
    </Button>
  );
}