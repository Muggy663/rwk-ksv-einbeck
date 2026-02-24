import { jsPDF } from 'jspdf';
import { logError, logWarn, logInfo, logDebug } from '@/lib/utils/secure-logger';
import 'jspdf-autotable';
import { LeagueDisplay, TeamDisplay } from '@/types/rwk';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { isMobileDevice } from './is-mobile';
import { isSafari, isIOS, downloadPDFSafari } from './safari-pdf-fix';

// Erweitere die jsPDF-Typen für autotable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

import { openWithAppChooser } from './open-external';

/**
 * Sanitize-Funktion für sichere PDF-Texte
 */
function sanitize(str: string): string {
  const text = String(str || '');
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .substring(0, 500);
}

/**
 * Verbesserte PDF-Generator-Funktion für mobile Geräte und Safari
 * Verwendet einen anderen Ansatz für mobile Geräte und Safari, um Kompatibilitätsprobleme zu vermeiden
 */
export async function generatePDFWithMobileSupport(
  generateFunction: () => Promise<Blob>,
  fileName: string
): Promise<Blob> {
  const pdfBlob = await generateFunction();
  
  try {
    const isNativeApp = window.Capacitor && window.Capacitor.isNativePlatform();
    const isMobile = isMobileDevice();
    const url = URL.createObjectURL(pdfBlob);
    
    if (isNativeApp) {
      try {
        await openWithAppChooser(url);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      } catch (nativeError) {
        logError('Fehler beim Öffnen mit nativer App:', nativeError);
        window.open(url, '_blank');
        setTimeout(() => URL.revokeObjectURL(url), 10000);
      }
    } else if (isSafari()) {
      logDebug('Safari erkannt - verwende Safari-optimierte PDF-Behandlung');
      
      try {
        await downloadPDFSafari(pdfBlob, fileName);
        URL.revokeObjectURL(url);
      } catch (safariError) {
        logError('Safari PDF-Behandlung fehlgeschlagen:', safariError);
        window.open(url, '_blank');
        setTimeout(() => URL.revokeObjectURL(url), 10000);
      }
    } else if (isMobile) {
      // Auf anderen mobilen Geräten: PDF im Browser öffnen
      logDebug('Mobile Gerät erkannt - öffne PDF in neuem Tab');
      const newWindow = window.open(url, '_blank');
      if (!newWindow) {
        // Fallback für blockierte Popups
        window.location.href = url;
      }
      
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 5000);
    } else {
      // Auf Desktop-Geräten: PDF herunterladen
      logDebug('Desktop erkannt - lade PDF herunter');
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  } catch (error) {
    logError('Fehler beim Generieren oder Herunterladen des PDFs:', error);
  }
  
  return pdfBlob;
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
): Promise<Blob> {
  const fileName = `${(league?.name || 'Liga').replace(/\s+/g, '_')}_Mannschaften_${competitionYear}.pdf`;
  
  return await generatePDFWithMobileSupport(
    async () => {
      // PDF im A4-Format erstellen
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
        const logoBase64 = await new Promise<string>((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
        doc.addImage(logoBase64, 'PNG', 250, 10, 25, 25);
      } catch (e) {
        logWarn('Logo konnte nicht geladen werden');
      }
      
      // Schriftart setzen
      doc.setFont('helvetica', 'normal');
      
      // Titel
      doc.setFontSize(18);
      const leagueNameSafe = league?.name || 'Liga';
      doc.text(sanitize(`${leagueNameSafe} ${competitionYear}`), 14, 20);
      
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
      
      // Debug: Prüfe verfügbare Daten
      logInfo('League individualLeagueShooters:', { data: league?.individualLeagueShooters?.length || 0 });
      if (league?.individualLeagueShooters?.length > 0) {
        logInfo('Sample shooter:', { data: league.individualLeagueShooters[0] });
      }
      
      let currentY = 35;
      for (const team of (league?.teams || [])) {
        const teamNameSafe = team.name || '';
        const teamRowData = {
          rank: team.outOfCompetition ? "AK" : team.rank,
          name: team.outOfCompetition ? sanitize(`${teamNameSafe} (Außer Konkurrenz)`) : sanitize(teamNameSafe),
          totalScore: team.totalScore || '-',
          averageScore: team.averageScore ? team.averageScore.toFixed(2) : '-'
        };
        
        for (let i = 1; i <= numRounds; i++) {
          const key = `dg${i}`;
          teamRowData[key] = team.roundResults?.[key] !== null && team.roundResults?.[key] !== undefined ? team.roundResults[key] : '-';
        }
        
        // Team-Tabelle
        doc.autoTable({
          head: [headers.map(header => header.title)],
          body: [headers.map(header => teamRowData[header.dataKey])],
          startY: currentY,
          headStyles: {
            fillColor: [41, 128, 185],
            textColor: 255,
            fontStyle: 'bold'
          },
          bodyStyles: {
            fillColor: team.outOfCompetition ? [255, 248, 220] : [255, 255, 255],
            textColor: team.outOfCompetition ? [194, 124, 14] : [0, 0, 0],
            fontStyle: 'bold'
          },
          styles: {
            fontSize: 8,
            cellPadding: 2
          },
          columnStyles: {
            0: { cellWidth: 15 },
            1: { cellWidth: 50 }
          }
        });
        
        currentY = doc.lastAutoTable.finalY + 1;
        
        // Schützen des Teams
        const teamShooters = team.shootersResults || [];
        if (teamShooters.length > 0) {
          const shooterHeaders = ['', 'Schütze'];
          for (let i = 1; i <= numRounds; i++) {
            shooterHeaders.push(`DG ${i}`);
          }
          shooterHeaders.push('Gesamt', 'Schnitt');
          
          const shooterRows = teamShooters.map(shooter => {
            const shooterNameSafe = shooter.shooterName || 'Unbekannt';
            const row = ['', sanitize(shooterNameSafe)];
            for (let i = 1; i <= numRounds; i++) {
              const key = `dg${i}`;
              row.push(shooter.results?.[key] !== null && shooter.results?.[key] !== undefined ? shooter.results[key].toString() : '-');
            }
            row.push((shooter.total || 0).toString());
            row.push(shooter.average ? shooter.average.toFixed(2) : '-');
            return row;
          });
          
          doc.autoTable({
            head: [shooterHeaders],
            body: shooterRows,
            startY: currentY,
            headStyles: {
              fillColor: [34, 139, 34],
              textColor: 255,
              fontSize: 7
            },
            bodyStyles: {
              fillColor: [248, 255, 248],
              fontSize: 7
            },
            styles: {
              cellPadding: 1
            },
            columnStyles: {
              0: { cellWidth: 15 },
              1: { cellWidth: 50 }
            }
          });
          
          currentY = doc.lastAutoTable.finalY + 2;
        } else {
          currentY += 2;
        }
        
        // Neue Seite wenn nötig
        if (currentY > 200) {
          doc.addPage();
          currentY = 30;
        }
      }
      
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
): Promise<Blob> {
  const fileName = `${(league?.name || 'Liga').replace(/\s+/g, '_')}_Einzelschuetzen_${competitionYear}.pdf`;
  
  return await generatePDFWithMobileSupport(
    async () => {
      // PDF im A4-Format erstellen
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
        const logoBase64 = await new Promise<string>((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
        doc.addImage(logoBase64, 'PNG', 250, 10, 25, 25);
      } catch (e) {
        logWarn('Logo konnte nicht geladen werden');
      }
      
      // Schriftart setzen
      doc.setFont('helvetica', 'normal');
      
      // Titel
      doc.setFontSize(18);
      const leagueNameSafe = league?.name || 'Liga';
      doc.text(`Einzelschützen ${sanitize(leagueNameSafe)} ${competitionYear}`, 14, 20);
      
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
      
      interface ShooterRowData {
        rank: string | number;
        name: string;
        team: string;
        totalScore: string | number;
        averageScore: string;
        isOutOfCompetition: boolean;
        [key: string]: string | number | boolean;
      }
      
      const tableData: ShooterRowData[] = (league?.individualLeagueShooters || []).map(shooter => {
        const teamNameSafe = shooter.teamName || '';
        const shooterNameSafe = shooter.shooterName || '';
        const rowData: ShooterRowData = {
          rank: shooter.teamOutOfCompetition ? "AK" : shooter.rank,
          name: sanitize(shooterNameSafe),
          team: shooter.teamOutOfCompetition ? sanitize(`${teamNameSafe} (AK)`) : sanitize(teamNameSafe),
          totalScore: shooter.totalScore || '-',
          averageScore: shooter.averageScore ? shooter.averageScore.toFixed(2) : '-',
          isOutOfCompetition: shooter.teamOutOfCompetition
        };
        
        for (let i = 1; i <= numRounds; i++) {
          const key = `dg${i}`;
          rowData[key] = shooter.results?.[key] !== null && shooter.results?.[key] !== undefined ? shooter.results[key] : '-';
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
          0: { cellWidth: 15 },
          1: { cellWidth: 40 },
          2: { cellWidth: 40 },
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