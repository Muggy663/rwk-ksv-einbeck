import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { LeagueDisplay, TeamDisplay } from '@/types/rwk';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { isMobileDevice } from './is-mobile';

// Erweitere die jsPDF-Typen für autotable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

import { openWithAppChooser } from './open-external';

/**
 * Verbesserte PDF-Generator-Funktion für mobile Geräte
 * Verwendet einen anderen Ansatz für mobile Geräte, um Kompatibilitätsprobleme zu vermeiden
 */
export async function generatePDFWithMobileSupport(
  generateFunction: () => Promise<Blob>,
  fileName: string
): Promise<void> {
  try {

    
    // PDF generieren
    const pdfBlob = await generateFunction();

    
    // Prüfen, ob wir in einer nativen App sind
    const isNativeApp = window.Capacitor && window.Capacitor.isNativePlatform();
    
    // Prüfen, ob es sich um ein mobiles Gerät handelt
    if (isMobileDevice() || isNativeApp) {

      
      // Blob-URL erstellen
      const url = URL.createObjectURL(pdfBlob);

      
      // In nativer App: Mit Capacitor öffnen
      if (isNativeApp) {

        try {
          // Speichere die Datei temporär und öffne sie mit der nativen App
          await openWithAppChooser(url);
        } catch (nativeError) {
          console.error('Fehler beim Öffnen mit nativer App:', nativeError);
          // Fallback: Im Browser öffnen
          window.open(url, '_blank');
        }
      } else {
        // Auf mobilen Geräten: PDF im Browser öffnen

        window.open(url, '_blank');
      }
      
      // Nach einer Verzögerung die URL freigeben
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 5000);
    } else {
      // Auf Desktop-Geräten: PDF herunterladen

      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  } catch (error) {
    console.error('Fehler beim Generieren oder Herunterladen des PDFs:', error);
    throw error;
  }
}

/**
 * Generiert ein PDF mit den Ligaergebnissen
 * @param league Die Liga mit Teams und Ergebnissen
 * @param numRounds Anzahl der Durchgänge
 * @param competitionYear Das Wettkampfjahr
 * @returns Blob des generierten PDFs
 */
export async function generateLeaguePDFFixed(
  league: LeagueDisplay,
  numRounds: number,
  competitionYear: number
): Promise<void> {
  const fileName = `${league.name.replace(/\s+/g, '_')}_Mannschaften_${competitionYear}.pdf`;
  
  await generatePDFWithMobileSupport(
    async () => {
      // PDF im A4-Format erstellen
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });
      
      // Schriftart setzen
      doc.setFont('helvetica', 'normal');
      
      // Titel
      doc.setFontSize(18);
      doc.text(`${league.name} ${competitionYear}`, 14, 20);
      
      // Untertitel
      doc.setFontSize(12);
      doc.text(`Stand: ${format(new Date(), 'dd.MM.yyyy', { locale: de })}`, 14, 28);
      
      // Mannschaftstabelle
      const headers = [
        { title: 'Platz', dataKey: 'rank' },
        { title: 'Mannschaft', dataKey: 'name' },
      ];
      
      // Durchgänge hinzufügen
      for (let i = 1; i <= numRounds; i++) {
        headers.push({ title: `DG ${i}`, dataKey: `dg${i}` });
      }
      
      // Gesamt und Schnitt hinzufügen
      headers.push(
        { title: 'Gesamt', dataKey: 'totalScore' },
        { title: 'Schnitt', dataKey: 'averageScore' }
      );
      
      // Daten für die Tabelle vorbereiten
      const tableData = league.teams.map(team => {
        const rowData: any = {
          rank: team.outOfCompetition ? "AK" : team.rank,
          name: team.outOfCompetition ? `${team.name} (Außer Konkurrenz)` : team.name,
          totalScore: team.totalScore || '-',
          averageScore: team.averageScore ? team.averageScore.toFixed(2) : '-',
          isOutOfCompetition: team.outOfCompetition // Zusätzliches Feld für die Formatierung
        };
        
        // Durchgangsergebnisse hinzufügen
        for (let i = 1; i <= numRounds; i++) {
          const key = `dg${i}`;
          rowData[key] = team.roundResults[key] !== null ? team.roundResults[key] : '-';
        }
        
        return rowData;
      });
      
      // Tabelle erstellen
      doc.autoTable({
        head: [headers.map(header => header.title)],
        body: tableData.map(row => headers.map(header => row[header.dataKey])),
        startY: 35,
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: 255,
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: [240, 240, 240]
        },
        styles: {
          fontSize: 10,
          cellPadding: 3
        },
        columnStyles: {
          0: { cellWidth: 15 }, // Platz
          1: { cellWidth: 50 }, // Mannschaft
        },
        // Spezielle Formatierung für Teams "außer Konkurrenz"
        didDrawCell: (data) => {
          if (data.section === 'body') {
            const row = tableData[data.row.index];
            if (row.isOutOfCompetition) {
              // Amber-Farbe für Teams "außer Konkurrenz"
              doc.setTextColor(194, 124, 14);
            } else {
              // Normale Textfarbe für andere Teams
              doc.setTextColor(0, 0, 0);
            }
          }
        }
      });
      
      // Fußzeile
      const pageCount = doc.internal.getNumberOfPages();
      doc.setFontSize(8);
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.text(
          `Seite ${i} von ${pageCount} - Erstellt mit RWK App Einbeck`,
          doc.internal.pageSize.getWidth() / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        );
      }
      
      // PDF als Blob zurückgeben
      return doc.output('blob');
    },
    fileName
  );
}

/**
 * Generiert ein PDF mit den Einzelschützenergebnissen einer Liga
 * @param league Die Liga mit Einzelschützen und Ergebnissen
 * @param numRounds Anzahl der Durchgänge
 * @param competitionYear Das Wettkampfjahr
 */
export async function generateShootersPDFFixed(
  league: LeagueDisplay,
  numRounds: number,
  competitionYear: number
): Promise<void> {
  const fileName = `${league.name.replace(/\s+/g, '_')}_Einzelschuetzen_${competitionYear}.pdf`;
  
  await generatePDFWithMobileSupport(
    async () => {
      // PDF im A4-Format erstellen
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });
      
      // Schriftart setzen
      doc.setFont('helvetica', 'normal');
      
      // Titel
      doc.setFontSize(18);
      doc.text(`Einzelschützen ${league.name} ${competitionYear}`, 14, 20);
      
      // Untertitel
      doc.setFontSize(12);
      doc.text(`Stand: ${format(new Date(), 'dd.MM.yyyy', { locale: de })}`, 14, 28);
      
      // Schützentabelle
      const headers = [
        { title: 'Platz', dataKey: 'rank' },
        { title: 'Name', dataKey: 'name' },
        { title: 'Mannschaft', dataKey: 'team' },
      ];
      
      // Durchgänge hinzufügen
      for (let i = 1; i <= numRounds; i++) {
        headers.push({ title: `DG ${i}`, dataKey: `dg${i}` });
      }
      
      // Gesamt und Schnitt hinzufügen
      headers.push(
        { title: 'Gesamt', dataKey: 'totalScore' },
        { title: 'Schnitt', dataKey: 'averageScore' }
      );
      
      // Daten für die Tabelle vorbereiten
      const tableData = league.individualLeagueShooters.map(shooter => {
        const rowData: any = {
          rank: shooter.teamOutOfCompetition ? "AK" : shooter.rank,
          name: shooter.shooterName,
          team: shooter.teamOutOfCompetition ? `${shooter.teamName} (AK)` : shooter.teamName,
          totalScore: shooter.totalScore || '-',
          averageScore: shooter.averageScore ? shooter.averageScore.toFixed(2) : '-',
          isOutOfCompetition: shooter.teamOutOfCompetition // Zusätzliches Feld für die Formatierung
        };
        
        // Durchgangsergebnisse hinzufügen
        for (let i = 1; i <= numRounds; i++) {
          const key = `dg${i}`;
          rowData[key] = shooter.results[key] !== null ? shooter.results[key] : '-';
        }
        
        return rowData;
      });
      
      // Tabelle erstellen
      doc.autoTable({
        head: [headers.map(header => header.title)],
        body: tableData.map(row => headers.map(header => row[header.dataKey])),
        startY: 35,
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: 255,
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: [240, 240, 240]
        },
        styles: {
          fontSize: 10,
          cellPadding: 3
        },
        columnStyles: {
          0: { cellWidth: 15 }, // Platz
          1: { cellWidth: 40 }, // Name
          2: { cellWidth: 40 }, // Mannschaft
        },
        // Spezielle Formatierung für Schützen "außer Konkurrenz"
        didDrawCell: (data) => {
          if (data.section === 'body') {
            const row = tableData[data.row.index];
            if (row.isOutOfCompetition) {
              // Amber-Farbe für Schützen "außer Konkurrenz"
              doc.setTextColor(194, 124, 14);
            } else {
              // Normale Textfarbe für andere Schützen
              doc.setTextColor(0, 0, 0);
            }
          }
        }
      });
      
      // Fußzeile
      const pageCount = doc.internal.getNumberOfPages();
      doc.setFontSize(8);
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.text(
          `Seite ${i} von ${pageCount} - Erstellt mit RWK App Einbeck`,
          doc.internal.pageSize.getWidth() / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        );
      }
      
      // PDF als Blob zurückgeben
      return doc.output('blob');
    },
    fileName
  );
}
