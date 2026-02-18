import React, { useState } from 'react';
import { logError, logWarn, logInfo, logDebug } from '@/lib/utils/secure-logger';
import { Button } from '@/components/ui/button';
import { Loader2, FileDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

const sanitizeText = (text: string | number | null | undefined): string => {
  if (text === null || text === undefined) return '-';
  return String(text).replace(/[<>\"'&]/g, (char) => {
    const entities: Record<string, string> = { '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '&': '&amp;' };
    return entities[char] || char;
  });
};

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

interface PDFButtonProps {
  title: string;
  subtitle: string;
  generateData: () => Promise<any>;
  pdfType: 'leagueResults' | 'shooterResults';
  buttonText: string;
  fileName: string;
  orientation?: 'portrait' | 'landscape';
  className?: string;
}

export function PDFButton({
  title,
  subtitle,
  generateData,
  pdfType,
  buttonText,
  fileName,
  orientation = 'landscape',
  className
}: PDFButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleExport = async () => {
    if (isGenerating) return;
    
    setIsGenerating(true);
    
    try {
      const data = await generateData();
      
      if (pdfType === 'leagueResults') {
        await generateLeagueResultsPDF(data, fileName);
      } else {
        await generateShooterResultsPDF(data, fileName);
      }
      
      toast({
        title: 'PDF erstellt',
        description: 'Die PDF-Datei wurde erfolgreich erstellt.',
      });
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

  const generateLeagueResultsPDF = async (data: any, fileName: string) => {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });
    
    // Logo als Base64 laden und hinzufügen
    try {
      const response = await fetch('/images/logo2.png');
      const blob = await response.blob();
      const reader = new FileReader();
      const logoBase64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Failed to read logo'));
        reader.readAsDataURL(blob);
      });
      doc.addImage(logoBase64, 'PNG', 250, 10, 25, 25);
    } catch (e) {
      logWarn('Logo konnte nicht geladen werden');
    }
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(18);
    doc.text(`${data.leagueName} ${data.season}`, 14, 20);
    
    doc.setFontSize(12);
    doc.text(`Stand: ${format(new Date(), 'dd.MM.yyyy', { locale: de })}`, 14, 28);
    
    const headers = ['Platz', 'Mannschaft/Schütze'];
    for (let i = 1; i <= data.numRounds; i++) {
      headers.push(`DG ${i}`);
    }
    headers.push('Gesamt', 'Schnitt');
    
    const tableData: any[] = [];
    
    data.teams.forEach((team: any) => {
      // Mannschaftszeile
      const teamRow = [sanitizeText(team.rank), sanitizeText(team.name)];
      for (let i = 1; i <= data.numRounds; i++) {
        teamRow.push(sanitizeText(team.roundResults[`dg${i}`]));
      }
      teamRow.push(sanitizeText(team.totalScore));
      teamRow.push(team.averageScore ? sanitizeText(team.averageScore.toFixed(2)) : '-');
      tableData.push(teamRow);
      
      // Einzelschützen unter der Mannschaft
      if (team.shooters && team.shooters.length > 0) {
        team.shooters.forEach((shooter: any) => {
          const shooterRow = ['', `  • ${sanitizeText(shooter.name)}`]; // Einrückung mit Bullet
          for (let i = 1; i <= data.numRounds; i++) {
            shooterRow.push(sanitizeText(shooter.results[`dg${i}`]));
          }
          shooterRow.push(sanitizeText(shooter.totalScore));
          shooterRow.push(shooter.averageScore ? sanitizeText(shooter.averageScore.toFixed(2)) : '-');
          tableData.push(shooterRow);
        });
      }
    });
    
    doc.autoTable({
      head: [headers],
      body: tableData,
      startY: 35,
      headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [240, 240, 240] },
      styles: { fontSize: 9, cellPadding: 2 },
      didParseCell: function(data: any) {
        // Mannschaftszeilen fett formatieren
        if (data.row.index % 2 === 0 && data.column.index === 1 && !data.cell.text[0].startsWith('  •')) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [220, 220, 220];
        }
        // Schützenzeilen einrücken
        if (data.column.index === 1 && data.cell.text[0].startsWith('  •')) {
          data.cell.styles.fontSize = 8;
          data.cell.styles.textColor = [100, 100, 100];
        }
      }
    });
    
    doc.save(sanitizeText(fileName));
  };

  const generateShooterResultsPDF = async (data: any, fileName: string) => {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });
    
    // Logo als Base64 laden und hinzufügen
    try {
      const response = await fetch('/images/logo2.png');
      const blob = await response.blob();
      const reader = new FileReader();
      const logoBase64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Failed to read logo'));
        reader.readAsDataURL(blob);
      });
      doc.addImage(logoBase64, 'PNG', 250, 10, 25, 25);
    } catch (e) {
      logWarn('Logo konnte nicht geladen werden');
    }
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(18);
    doc.text(`Einzelschützen ${data.leagueName} ${data.season}`, 14, 20);
    
    doc.setFontSize(12);
    doc.text(`Stand: ${format(new Date(), 'dd.MM.yyyy', { locale: de })}`, 14, 28);
    
    const headers = ['Platz', 'Name', 'Mannschaft'];
    for (let i = 1; i <= data.numRounds; i++) {
      headers.push(`DG ${i}`);
    }
    headers.push('Gesamt', 'Schnitt');
    
    const tableData = data.shooters.map((shooter: any) => {
      const row = [sanitizeText(shooter.rank), sanitizeText(shooter.name), sanitizeText(shooter.teamName)];
      for (let i = 1; i <= data.numRounds; i++) {
        row.push(sanitizeText(shooter.results[`dg${i}`]));
      }
      row.push(sanitizeText(shooter.totalScore));
      row.push(shooter.averageScore ? sanitizeText(shooter.averageScore.toFixed(2)) : '-');
      return row;
    });
    
    doc.autoTable({
      head: [headers],
      body: tableData,
      startY: 35,
      headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [240, 240, 240] },
      styles: { fontSize: 10, cellPadding: 3 }
    });
    
    doc.save(sanitizeText(fileName));
  };

  return (
    <Button
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
          {buttonText}
        </>
      )}
    </Button>
  );
}
