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
  const fileName = `${(league?.name || 'Liga').replace(/\s+/g, '_')}_Mannschaften_${competitionYear}.pdf`;
  
  await generatePDFWithMobileSupport(
    async () => {
      // Lade Schützen-Daten für alle Teams
      const { db } = await import('@/lib/firebase/config');
      const { collection, query, where, getDocs } = await import('firebase/firestore');
      
      for (const team of (league?.teams || [])) {
        if (team.shooterIds && team.shooterIds.length > 0) {
          const scoresQuery = query(
            collection(db, 'rwk_scores'),
            where('teamId', '==', team.id),
            where('competitionYear', '==', competitionYear)
          );
          const scoresSnapshot = await getDocs(scoresQuery);
          const scoresByShooter = new Map();
          
          scoresSnapshot.docs.forEach(scoreDoc => {
            const score = scoreDoc.data();
            if (!scoresByShooter.has(score.shooterId)) scoresByShooter.set(score.shooterId, []);
            scoresByShooter.get(score.shooterId).push(score);
          });
          
          const shootersResults = [];
          for (const shooterId of team.shooterIds) {
            const shooterScores = scoresByShooter.get(shooterId) || [];
            const results = {};
            let total = 0;
            let roundsShot = 0;
            
            for (let r = 1; r <= numRounds; r++) results[`dg${r}`] = null;
            
            shooterScores.forEach(score => {
              if (score.durchgang >= 1 && score.durchgang <= numRounds) {
                results[`dg${score.durchgang}`] = score.totalRinge;
                if (score.totalRinge) {
                  total += score.totalRinge;
                  roundsShot++;
                }
              }
            });
            
            const shooterName = shooterScores[0]?.shooterName || `Schütze ${shooterId.substring(0,8)}`;
            
            shootersResults.push({
              shooterId,
              shooterName,
              results,
              total,
              average: roundsShot > 0 ? total / roundsShot : null,
              roundsShot
            });
          }
          
          team.shootersResults = shootersResults;
        }
      }
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
        console.warn('Logo konnte nicht geladen werden');
      }
      
      // Schriftart setzen
      doc.setFont('helvetica', 'normal');
      
      // Titel
      doc.setFontSize(18);
      doc.text(`${league?.name || 'Liga'} ${competitionYear}`, 14, 20);
      
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
      const tableData = (league?.teams || []).map(team => {
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
      
      // Erweiterte Tabelle mit Schützen pro Team
      let currentY = 35;
      
      for (const team of (league?.teams || [])) {
        // Team-Zeile
        const teamRowData = {
          rank: team.outOfCompetition ? "AK" : team.rank,
          name: team.outOfCompetition ? `${team.name} (Außer Konkurrenz)` : team.name,
          totalScore: team.totalScore || '-',
          averageScore: team.averageScore ? team.averageScore.toFixed(2) : '-'
        };
        
        for (let i = 1; i <= numRounds; i++) {
          const key = `dg${i}`;
          teamRowData[key] = team.roundResults[key] !== null ? team.roundResults[key] : '-';
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
        if (team.shootersResults && team.shootersResults.length > 0) {
          const shooterHeaders = ['', 'Schütze'];
          for (let i = 1; i <= numRounds; i++) {
            shooterHeaders.push(`DG ${i}`);
          }
          shooterHeaders.push('Gesamt', 'Schnitt');
          
          const shooterRows = team.shootersResults.map(shooter => {
            const row = ['', shooter.shooterName];
            for (let i = 1; i <= numRounds; i++) {
              row.push(shooter.results[`dg${i}`] !== null ? shooter.results[`dg${i}`].toString() : '-');
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
        
        // Neue Seite wenn nötig (später für mehr Inhalt)
        if (currentY > 200) {
          doc.addPage();
          // Logo auf neuer Seite
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
            console.warn('Logo konnte nicht geladen werden');
          }
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
): Promise<void> {
  const fileName = `${(league?.name || 'Liga').replace(/\s+/g, '_')}_Einzelschuetzen_${competitionYear}.pdf`;
  
  await generatePDFWithMobileSupport(
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
        console.warn('Logo konnte nicht geladen werden');
      }
      
      // Schriftart setzen
      doc.setFont('helvetica', 'normal');
      
      // Titel
      doc.setFontSize(18);
      doc.text(`Einzelschützen ${league?.name || 'Liga'} ${competitionYear}`, 14, 20);
      
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
      const tableData = (league?.individualLeagueShooters || []).map(shooter => {
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
