import { jsPDF } from 'jspdf';
import { logError, logWarn, logDebug } from '@/lib/utils/secure-logger';
import 'jspdf-autotable';
import { LeagueDisplay } from '@/types/rwk';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { isMobileDevice } from './is-mobile';
import { isSafari, downloadPDFSafari } from './safari-pdf-fix';

// Erweitere die jsPDF-Typen für autotable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    lastAutoTable?: { finalY: number };
    getNumberOfPages: () => number;
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
      const pageWidth = doc.internal.pageSize.getWidth();
      const leagueNameSafe = league?.name || 'Liga';

      // Dezenter Kopf mit Logo, Titel und feiner Trennlinie
      try {
        const response = await fetch('/images/logo2.png');
        const blob = await response.blob();
        const reader = new FileReader();
        const logoBase64 = await new Promise<string>((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
        doc.addImage(logoBase64, 'PNG', 14, 10, 16, 16);
      } catch (e) {
        logWarn('Logo konnte nicht geladen werden');
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(40, 40, 40);
      doc.text(sanitize(`${leagueNameSafe} ${competitionYear}`), 34, 17);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(120, 120, 120);
      doc.text(`Mannschaftsergebnisse · Stand: ${format(new Date(), 'dd.MM.yyyy', { locale: de })}`, 34, 23);
      doc.setDrawColor(210, 210, 210);
      doc.setLineWidth(0.3);
      doc.line(14, 29, pageWidth - 14, 29);
      doc.setTextColor(0, 0, 0);

      // Spalten
      const headers = [
        { title: 'Platz', dataKey: 'rank' },
        { title: 'Mannschaft', dataKey: 'name' },
      ];
      for (let i = 1; i <= numRounds; i++) headers.push({ title: `DG ${i}`, dataKey: `dg${i}` });
      headers.push({ title: 'Gesamt', dataKey: 'totalScore' }, { title: 'Schnitt', dataKey: 'averageScore' });

      // Gemeinsamer, ruhiger Tabellenstil (duenne graue Linien)
      const gridLine: [number, number, number] = [210, 210, 210];

      let currentY = 34;
      for (const team of (league?.teams || [])) {
        const teamNameSafe = team.name || '';
        const teamRowData: Record<string, string | number | null | undefined> = {
          rank: team.outOfCompetition ? 'AK' : team.rank,
          name: team.outOfCompetition ? sanitize(`${teamNameSafe} (Außer Konkurrenz)`) : sanitize(teamNameSafe),
          totalScore: team.totalScore || '-',
          averageScore: team.averageScore ? team.averageScore.toFixed(2) : '-'
        };
        for (let i = 1; i <= numRounds; i++) {
          const key = `dg${i}`;
          teamRowData[key] = team.roundResults?.[key] !== null && team.roundResults?.[key] !== undefined ? team.roundResults[key] : '-';
        }

        // Mannschafts-Zeile: hervorgehoben (dezentes Grau, fett)
        doc.autoTable({
          head: [headers.map(h => h.title)],
          body: [headers.map(h => teamRowData[h.dataKey])],
          startY: currentY,
          theme: 'grid',
          headStyles: { fillColor: [235, 235, 235], textColor: [60, 60, 60], fontStyle: 'bold', lineWidth: 0.1, lineColor: gridLine, fontSize: 8 },
          bodyStyles: {
            fillColor: team.outOfCompetition ? [255, 250, 235] : [245, 247, 250],
            textColor: team.outOfCompetition ? [180, 120, 20] : [20, 20, 20],
            fontStyle: 'bold',
            lineWidth: 0.1,
            lineColor: gridLine,
            fontSize: 8,
            cellPadding: 1.8
          },
          columnStyles: { 0: { cellWidth: 15, halign: 'center' }, 1: { cellWidth: 55 } },
          margin: { left: 14, right: 14 }
        });
        currentY = (doc.lastAutoTable?.finalY ?? currentY) + 0.5;

        // Schützen des Teams: bevorzugt aus individualLeagueShooters (frisch geladen, immer
        // vorhanden), Fallback auf shootersResults (nur nach Aufklappen befuellt).
        const normalizeTeamName = (n: string | undefined) => n?.replace(/\s+/g, ' ').trim();
        const fromIndividual = (league.individualLeagueShooters || [])
          .filter(s => normalizeTeamName(s.teamName) === normalizeTeamName(team.name))
          .map(s => ({
            shooterName: s.shooterName,
            results: s.results,
            total: s.totalScore,
            average: s.averageScore,
            substitutionInfo: undefined as any,
          }));
        const teamShooters = fromIndividual.length > 0
          ? fromIndividual
          : (team.shootersResults || []);
        if (teamShooters.length > 0) {
          const shooterHeaders = ['', 'Schütze'];
          for (let i = 1; i <= numRounds; i++) shooterHeaders.push(`DG ${i}`);
          shooterHeaders.push('Gesamt', 'Schnitt');

          const shooterRows = teamShooters.map((shooter: any) => {
            let name = sanitize(shooter.shooterName || 'Unbekannt');
            if (shooter.substitutionInfo) {
              name += ` (Ersatz ab DG${shooter.substitutionInfo.fromRound})`;
            }
            const row = ['', name];
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
            theme: 'grid',
            headStyles: { fillColor: [248, 248, 248], textColor: [120, 120, 120], fontSize: 6.5, lineWidth: 0.1, lineColor: gridLine, fontStyle: 'normal' },
            bodyStyles: { fillColor: [255, 255, 255], textColor: [50, 50, 50], fontSize: 7, lineWidth: 0.1, lineColor: gridLine, cellPadding: 1.2 },
            alternateRowStyles: { fillColor: [250, 250, 250] },
            columnStyles: { 0: { cellWidth: 15 }, 1: { cellWidth: 55 } },
            margin: { left: 14, right: 14 }
          });
          currentY = (doc.lastAutoTable?.finalY ?? currentY) + 3;
        } else {
          currentY += 3;
        }

        if (currentY > 190) {
          doc.addPage();
          currentY = 20;
        }
      }

      // Dezenter Footer mit Trennlinie
      const pageCount = doc.getNumberOfPages();
      const pageHeight = doc.internal.pageSize.getHeight();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setDrawColor(210, 210, 210);
        doc.setLineWidth(0.2);
        doc.line(14, pageHeight - 12, pageWidth - 14, pageHeight - 12);
        doc.setFontSize(7.5);
        doc.setTextColor(130, 130, 130);
        doc.text(`Erstellt am ${format(new Date(), 'dd.MM.yyyy', { locale: de })} · RWK Einbeck`, 14, pageHeight - 8);
        doc.text(`Seite ${i} von ${pageCount}`, pageWidth - 14, pageHeight - 8, { align: 'right' });
        doc.setTextColor(0, 0, 0);
      }

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
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const leagueNameSafe = league?.name || 'Liga';

      // Dezenter Kopf mit Logo, Titel und feiner Trennlinie
      try {
        const response = await fetch('/images/logo2.png');
        const blob = await response.blob();
        const reader = new FileReader();
        const logoBase64 = await new Promise<string>((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
        doc.addImage(logoBase64, 'PNG', 14, 10, 16, 16);
      } catch (e) {
        logWarn('Logo konnte nicht geladen werden');
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(40, 40, 40);
      doc.text(sanitize(`${leagueNameSafe} ${competitionYear}`), 34, 17);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(120, 120, 120);
      doc.text(`Einzelschützen · Stand: ${format(new Date(), 'dd.MM.yyyy', { locale: de })}`, 34, 23);
      doc.setDrawColor(210, 210, 210);
      doc.setLineWidth(0.3);
      doc.line(14, 29, pageWidth - 14, 29);
      doc.setTextColor(0, 0, 0);

      // Schützentabelle
      const headers = [
        { title: 'Platz', dataKey: 'rank' },
        { title: 'Name', dataKey: 'name' },
        { title: 'Mannschaft', dataKey: 'team' },
      ];
      for (let i = 1; i <= numRounds; i++) headers.push({ title: `DG ${i}`, dataKey: `dg${i}` });
      headers.push({ title: 'Gesamt', dataKey: 'totalScore' }, { title: 'Schnitt', dataKey: 'averageScore' });

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
          rank: shooter.teamOutOfCompetition ? 'AK' : (shooter.rank ?? '-'),
          name: sanitize(shooterNameSafe),
          team: shooter.teamOutOfCompetition ? sanitize(`${teamNameSafe} (AK)`) : sanitize(teamNameSafe),
          totalScore: shooter.totalScore || '-',
          averageScore: shooter.averageScore ? shooter.averageScore.toFixed(2) : '-',
          isOutOfCompetition: shooter.teamOutOfCompetition ?? false
        };
        for (let i = 1; i <= numRounds; i++) {
          const key = `dg${i}`;
          rowData[key] = shooter.results?.[key] !== null && shooter.results?.[key] !== undefined ? shooter.results[key] : '-';
        }
        return rowData;
      });

      const gridLine: [number, number, number] = [210, 210, 210];

      doc.autoTable({
        head: [headers.map(h => h.title)],
        body: tableData.map(row => headers.map(h => row[h.dataKey])),
        startY: 34,
        theme: 'grid',
        headStyles: { fillColor: [235, 235, 235], textColor: [60, 60, 60], fontStyle: 'bold', lineWidth: 0.1, lineColor: gridLine, fontSize: 9 },
        bodyStyles: { textColor: [30, 30, 30], fontSize: 9, lineWidth: 0.1, lineColor: gridLine, cellPadding: 2 },
        alternateRowStyles: { fillColor: [248, 248, 248] },
        // AK-Schützen dezent amber hervorheben
        didParseCell: (data: any) => {
          if (data.section === 'body' && tableData[data.row.index]?.isOutOfCompetition) {
            data.cell.styles.textColor = [180, 120, 20];
          }
        },
        columnStyles: {
          0: { cellWidth: 15, halign: 'center' },
          1: { cellWidth: 45 },
          2: { cellWidth: 45 },
        },
        margin: { left: 14, right: 14 }
      });

      // Dezenter Footer mit Trennlinie
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setDrawColor(210, 210, 210);
        doc.setLineWidth(0.2);
        doc.line(14, pageHeight - 12, pageWidth - 14, pageHeight - 12);
        doc.setFontSize(7.5);
        doc.setTextColor(130, 130, 130);
        doc.text(`Erstellt am ${format(new Date(), 'dd.MM.yyyy', { locale: de })} · RWK Einbeck`, 14, pageHeight - 8);
        doc.text(`Seite ${i} von ${pageCount}`, pageWidth - 14, pageHeight - 8, { align: 'right' });
        doc.setTextColor(0, 0, 0);
      }

      return doc.output('blob');
    },
    fileName
  );
}