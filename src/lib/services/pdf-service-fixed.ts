import { jsPDF } from 'jspdf';
import { logError, logWarn } from '@/lib/utils/secure-logger';
import 'jspdf-autotable';
import { LeagueDisplay, TeamDisplay } from '@/types/rwk';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

// Erweitere die jsPDF-Typen für autotable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    lastAutoTable?: { finalY: number };
    getNumberOfPages: () => number;
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
): Promise<Blob> {
  try {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(18);
  doc.text(`${league.name} ${competitionYear}`, 14, 20);
  doc.setFontSize(12);
  doc.text(`Stand: ${format(new Date(), 'dd.MM.yyyy', { locale: de })}`, 14, 28);
  
  let currentY = 35;
  
  // Für jede Mannschaft
  for (const team of league.teams) {
    // Mannschafts-Header
    const teamHeaders = ['Platz', 'Mannschaft'];
    for (let i = 1; i <= numRounds; i++) teamHeaders.push(`DG ${i}`);
    teamHeaders.push('Gesamt', 'Schnitt');
    
    const teamRow = [
      team.outOfCompetition ? "AK" : team.rank,
      team.name
    ];
    for (let i = 1; i <= numRounds; i++) {
      teamRow.push(team.roundResults[`dg${i}`] || '-');
    }
    teamRow.push(team.totalScore || '-');
    teamRow.push(team.averageScore ? team.averageScore.toFixed(2) : '-');
    
    // Mannschafts-Tabelle
    doc.autoTable({
      head: [teamHeaders],
      body: [teamRow],
      startY: currentY,
      headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 8 }
    });
    
    currentY = (doc.lastAutoTable?.finalY ?? currentY) + 2;
    
    // Schützen aus individualLeagueShooters holen (exakt wie Einzelschützen-PDF)
    // Normalisiere Teamnamen für Vergleich (entferne mehrfache Leerzeichen)
    const normalizeTeamName = (name: string | undefined) => name?.replace(/\s+/g, ' ').trim();
    
    const shooters = league.individualLeagueShooters?.filter(s => 
      normalizeTeamName(s.teamName) === normalizeTeamName(team.name)
    ) || [];
    
    // IMMER Schützen-Tabelle anzeigen (auch wenn leer)
    const shooterHeaders = ['', 'Schütze'];
    for (let i = 1; i <= numRounds; i++) shooterHeaders.push(`DG ${i}`);
    shooterHeaders.push('Gesamt', 'Schnitt');
    
    let shooterRows;
    if (shooters.length > 0) {
      shooterRows = shooters.map(shooter => {
        let shooterName = shooter.shooterName;
        
        // Prüfe auf Ersatzschützen-Info aus den Team-Daten
        const teamShooter = team.shootersResults?.find(s => s.shooterId === shooter.shooterId);
        if (teamShooter?.substitutionInfo) {
          const sub = teamShooter.substitutionInfo;
          shooterName += ` (Ersatz ab DG${sub.fromRound} für ${sub.originalShooterName})`;
        }
        
        const row: (string | number)[] = ['', shooterName];
        for (let i = 1; i <= numRounds; i++) {
          const key = `dg${i}`;
          row.push(shooter.results[key] !== null ? shooter.results[key] : '-');
        }
        row.push(shooter.totalScore || '-');
        row.push(shooter.averageScore ? shooter.averageScore.toFixed(2) : '-');
        return row;
      });
    } else {
      // Debug-Zeile wenn keine Schützen
      shooterRows = [['', `DEBUG: ${shooters.length} Schützen für "${normalizeTeamName(team.name)}"`]];
    }
    
    doc.autoTable({
      head: [shooterHeaders],
      body: shooterRows,
      startY: currentY,
      headStyles: { fillColor: [34, 139, 34], textColor: 255, fontSize: 7 },
      bodyStyles: { fillColor: [248, 255, 248], fontSize: 7 },
      styles: { cellPadding: 1 }
    });
    
    currentY = (doc.lastAutoTable?.finalY ?? currentY) + 5;
    
    if (currentY > 200) {
      doc.addPage();
      currentY = 30;
    }
  }
  
  return doc.output('blob');
  } catch (error) {
    logError('Fehler beim Generieren des Liga-PDFs', { error, leagueName: league.name });
    throw new Error('PDF-Generierung fehlgeschlagen');
  }
}

/**
 * Generiert ein PDF mit den Einzelschützenergebnissen einer Liga
 * @param league Die Liga mit Einzelschützen und Ergebnissen
 * @param numRounds Anzahl der Durchgänge
 * @param competitionYear Das Wettkampfjahr
 * @returns Blob des generierten PDFs
 */
export async function generateShootersPDFFixed(
  league: LeagueDisplay,
  numRounds: number,
  competitionYear: number
): Promise<Blob> {
  try {
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
    const substitutionInfo = findSubstitutionInfo(shooter, league.teams);
    let shooterName = shooter.shooterName;
    
    if (substitutionInfo) {
      shooterName += ` (Ersatz ab DG${substitutionInfo.fromRound} für ${substitutionInfo.originalShooterName})`;
    }
    
    const rowData: any = {
      rank: shooter.teamOutOfCompetition ? "AK" : shooter.rank,
      name: shooterName,
      team: shooter.teamOutOfCompetition ? `${shooter.teamName} (AK)` : shooter.teamName,
      totalScore: shooter.totalScore || '-',
      averageScore: shooter.averageScore ? shooter.averageScore.toFixed(2) : '-',
      isOutOfCompetition: shooter.teamOutOfCompetition
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
      0: { cellWidth: 15 },
      1: { cellWidth: 40 },
      2: { cellWidth: 40 },
    }
  });
  
  // Fußzeile
  const pageCount = doc.getNumberOfPages();
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
  } catch (error) {
    logError('Fehler beim Generieren des Einzelschützen-PDFs', { error, leagueName: league.name });
    throw new Error('PDF-Generierung fehlgeschlagen');
  }
}

/**
 * Hilfsfunktion: Findet Ersatzschützen-Info für einen Schützen
 */
function findSubstitutionInfo(shooter: any, teams: TeamDisplay[]): any {
  try {
    for (const team of teams) {
      const teamShooter = team.shootersResults?.find(s => s.shooterId === shooter.shooterId);
      if (teamShooter?.substitutionInfo) {
        return teamShooter.substitutionInfo;
      }
    }
    return null;
  } catch (error) {
    logWarn('Fehler beim Suchen der Ersatzschützen-Info', { error, shooterId: shooter?.shooterId });
    return null;
  }
}