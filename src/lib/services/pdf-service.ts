import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { LeagueDisplay, TeamDisplay } from '@/types/rwk';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

// Erweitere die jsPDF-Typen für autotable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

/**
 * Generiert ein PDF mit den Ligaergebnissen
 * @param league Die Liga mit Teams und Ergebnissen
 * @param numRounds Anzahl der Durchgänge
 * @param competitionYear Das Wettkampfjahr
 * @returns Blob des generierten PDFs
 */
export async function generateLeaguePDF(
  league: LeagueDisplay,
  numRounds: number,
  competitionYear: number
): Promise<Blob> {
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
}

/**
 * Generiert ein PDF mit den Einzelschützenergebnissen einer Liga
 * @param league Die Liga mit Einzelschützen und Ergebnissen
 * @param numRounds Anzahl der Durchgänge
 * @param competitionYear Das Wettkampfjahr
 * @returns Blob des generierten PDFs
 */
export async function generateShootersPDF(
  league: LeagueDisplay,
  numRounds: number,
  competitionYear: number
): Promise<Blob> {
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
}

/**
 * Generiert eine einseitige, leere Tabelle im Querformat für den Saisonbeginn,
 * basierend auf dem Design des ursprünglichen PDF-Beispiels.
 * @param league Die Liga mit Teams und optionalen Schützen/Kontakten.
 * @param numRounds Anzahl der Durchgänge.
 * @param competitionYear Das Wettkampfjahr.
 * @returns Blob des generierten PDFs.
 */
export async function generateEmptySeasonTablePDF(
    league,
    numRounds,
    competitionYear
) {
    // Benötigte Bibliotheken aus dem globalen Namespace
    const { jsPDF } = window.jspdf;
    const autoTable = window.jspdf.autoTable;
    const { format } = window.dateFns;
    const { de } = window.dateFns.locale;

    // PDF im A4-Querformat erstellen
    const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
    });

    // Globale Variablen für das Layout
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - 2 * margin;

    // --- KOPFZEILE ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(`Kreisoberliga KK 50m Auflage ${competitionYear}`, margin, margin);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Abgabetermin: 15. August ${competitionYear + 1}`, pageWidth - margin, margin, { align: 'right' });

    let startY = margin + 15;

    // --- HAUPTBEREICH: MANNSCHAFTEN ---
    const teamBlockWidth = (contentWidth / 2) - 5; // Zwei Spalten für Teams
    let currentX = margin;
    let columnMaxY = 0; // Um die Höhe der Spalten zu verfolgen

    league.teams.forEach((team, index) => {
        // Nach der Hälfte der Teams in die zweite Spalte wechseln
        if (index === Math.ceil(league.teams.length / 2)) {
            currentX = margin + teamBlockWidth + 10;
            startY = margin + 15; // Y-Position für die zweite Spalte zurücksetzen
        }

        // --- MANNSCHAFTSBLOCK ---
        let teamBlockStartY = startY;

        // Mannschaftsname
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text(team.name, currentX, teamBlockStartY);
        teamBlockStartY += 6;

        // --- Sub-Tabelle für die Mannschaft ---
        const firstColWidth = 40;
        const roundHeaders = Array.from({ length: numRounds }, (_, i) => `DG ${i + 1}`);
        roundHeaders.push('Gesamt');
        const roundColWidth = (teamBlockWidth - firstColWidth) / roundHeaders.length;

        // Header-Zeile der Sub-Tabelle
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.rect(currentX, teamBlockStartY, firstColWidth, 10);
        doc.text('Name', currentX + 2, teamBlockStartY + 6);
        
        let headerX = currentX + firstColWidth;
        roundHeaders.forEach(header => {
            doc.rect(headerX, teamBlockStartY, roundColWidth, 10);
            doc.text("Ringe", headerX + 2, teamBlockStartY + 4);
            doc.text("Gesamt", headerX + roundColWidth - 2, teamBlockStartY + 4, { align: 'right'});
            doc.line(headerX, teamBlockStartY + 5, headerX + roundColWidth, teamBlockStartY + 5);
            headerX += roundColWidth;
        });
        teamBlockStartY += 10;
        
        // Schützen-Zeilen (mindestens 3)
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        const shooterCount = Math.max(team.shooters?.length || 0, 3);
        for (let i = 0; i < shooterCount; i++) {
            doc.rect(currentX, teamBlockStartY, firstColWidth, 7);
            let shooterX = currentX + firstColWidth;
            roundHeaders.forEach(() => {
                doc.rect(shooterX, teamBlockStartY, roundColWidth, 7);
                shooterX += roundColWidth;
            });
            teamBlockStartY += 7;
        }

        // Total-Zeile
        doc.setFont('helvetica', 'bold');
        doc.rect(currentX, teamBlockStartY, firstColWidth, 7);
        doc.text('Total', currentX + 2, teamBlockStartY + 5);
        let totalX = currentX + firstColWidth;
        roundHeaders.forEach(() => {
            doc.rect(totalX, teamBlockStartY, roundColWidth, 7);
            totalX += roundColWidth;
        });
        teamBlockStartY += 7;
        
        // Mannschaftsführer-Zeile
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        const contact = team.contact || { name: '', phone: '' };
        doc.text(`Mannschaftsführer: ${contact.name} ${contact.phone}`, currentX, teamBlockStartY + 5);
        teamBlockStartY += 10;

        // Y-Position für den nächsten Block in derselben Spalte aktualisieren
        startY = teamBlockStartY;
        if (startY > columnMaxY) {
            columnMaxY = startY;
        }
    });

    // --- FUSSBEREICH: PLATZIERUNGEN ---
    let footerY = (columnMaxY > pageHeight - 50) ? pageHeight - 50 : columnMaxY + 5;
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Mannschaft', margin + (contentWidth / 4), footerY, { align: 'center' });
    doc.text('Einzelschütze', margin + (contentWidth * 3 / 4), footerY, { align: 'center' });
    
    const rankingBody = Array.from({length: 8}, (_, i) => [`${i+1}.`, '', '']);
    
    // Mannschafts-Rangliste
    autoTable(doc, {
        head: [['Platz', 'Name', 'Gesamt']],
        body: rankingBody,
        startY: footerY + 5,
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 1.5 },
        headStyles: { fillColor: [220, 220, 220], textColor: 20, fontStyle: 'bold' },
        margin: { left: margin, right: pageWidth / 2 + 5 },
        tableWidth: teamBlockWidth
    });

    // Einzel-Rangliste
    autoTable(doc, {
        head: [['Platz', 'Name', 'Gesamt']],
        body: rankingBody,
        startY: footerY + 5,
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 1.5 },
        headStyles: { fillColor: [220, 220, 220], textColor: 20, fontStyle: 'bold' },
        margin: { left: pageWidth / 2 + 5, right: margin },
        tableWidth: teamBlockWidth
    });

    // PDF als Blob zurückgeben
    return doc.output('blob');
}

/**
 * Generiert eine Gesamtliste für die Kreisoberliga KK 50 zum Ausfüllen
 * @param league Die Liga mit Teams
 * @param competitionYear Das Wettkampfjahr
 * @param teamContacts Kontaktdaten der Mannschaftsführer (optional)
 * @returns Blob des generierten PDFs
 */
export async function generateGesamtlistePDF(
  league: LeagueDisplay,
  competitionYear: number,
  teamContacts?: Record<string, { name: string; phone: string; email: string }>
): Promise<Blob> {
  // PDF im A3-Format erstellen (Querformat)
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a3'
  });
  
  // Schriftart setzen
  doc.setFont('helvetica', 'normal');
  
  // Kopfzeile
  doc.setFontSize(12);
  doc.text(`Abgabetermin: 15. August ${competitionYear}`, 14, 15);
  doc.text(`Klasse: ${league.name}`, 14, 22);
  
  // Durchgänge-Überschriften
  const durchgangX = [80, 130, 180, 230];
  for (let i = 0; i < 4; i++) {
    doc.text(`${i+1}. Durchgang`, durchgangX[i], 15);
    doc.text(`Ort:`, durchgangX[i], 22);
    doc.text(`Datum:`, durchgangX[i], 29);
    doc.text(`Uhrzeit:`, durchgangX[i], 36);
  }
  
  // Tabellenkopf
  const tableHead = [
    [
      { content: 'Mannschaft', colSpan: 1 },
      { content: 'Name', colSpan: 1 },
      { content: 'Ringe', colSpan: 1 },
      { content: 'gesamt', colSpan: 1 },
      { content: 'Ringe', colSpan: 1 },
      { content: 'gesamt', colSpan: 1 },
      { content: 'Ringe', colSpan: 1 },
      { content: 'gesamt', colSpan: 1 },
      { content: 'Ringe', colSpan: 1 },
      { content: 'gesamt', colSpan: 1 },
      { content: 'Einzel', colSpan: 1 },
      { content: 'Platz', colSpan: 1 },
      { content: 'Mannschaft', colSpan: 1 }
    ]
  ];
  
  // Tabellendaten vorbereiten
  const tableBody: any[] = [];
  
  // Für jede Mannschaft
  league.teams.forEach(team => {
    // Mannschaftsname
    tableBody.push([
      { content: team.name, colSpan: 1, styles: { fontStyle: 'bold' } },
      { content: '', colSpan: 12 }
    ]);
    
    // Schützen der Mannschaft (oder leere Zeilen, wenn keine Schützen vorhanden)
    const shooters = team.shooters || [];
    const shooterCount = Math.max(shooters.length, 3); // Mindestens 3 Zeilen für Schützen
    
    for (let i = 0; i < shooterCount; i++) {
      const shooter = shooters[i] || { name: '' };
      tableBody.push([
        { content: '', colSpan: 1 },
        { content: shooter.name, colSpan: 1 },
        { content: '', colSpan: 1 },
        { content: '', colSpan: 1 },
        { content: '', colSpan: 1 },
        { content: '', colSpan: 1 },
        { content: '', colSpan: 1 },
        { content: '', colSpan: 1 },
        { content: '', colSpan: 1 },
        { content: '', colSpan: 1 },
        { content: '', colSpan: 1 },
        { content: '', colSpan: 1 },
        { content: '', colSpan: 1 }
      ]);
    }
    
    // Kontaktdaten des Mannschaftsführers
    if (teamContacts && teamContacts[team.id]) {
      const contact = teamContacts[team.id];
      tableBody.push([
        { content: `${contact.name}, ${contact.phone}`, colSpan: 2, styles: { fontSize: 8 } },
        { content: '', colSpan: 11 }
      ]);
    }
    
    // Total-Zeile
    tableBody.push([
      { content: '', colSpan: 1 },
      { content: 'Total', colSpan: 1, styles: { fontStyle: 'bold' } },
      { content: '', colSpan: 1 },
      { content: '', colSpan: 1 },
      { content: '', colSpan: 1 },
      { content: '', colSpan: 1 },
      { content: '', colSpan: 1 },
      { content: '', colSpan: 1 },
      { content: '', colSpan: 1 },
      { content: '', colSpan: 1 },
      { content: '', colSpan: 1 },
      { content: '', colSpan: 1 },
      { content: '', colSpan: 1 }
    ]);
    
    // Leerzeile zwischen Mannschaften
    tableBody.push([
      { content: '', colSpan: 13 }
    ]);
  });
  
  // Einzelschützen (falls vorhanden)
  const einzelTeams = league.teams.filter(team => team.name.toLowerCase().includes('einzel'));
  
  einzelTeams.forEach(team => {
    // Mannschaftsname (Einzel)
    tableBody.push([
      { content: team.name, colSpan: 1, styles: { fontStyle: 'bold' } },
      { content: '', colSpan: 12 }
    ]);
    
    // Schützen
    const shooters = team.shooters || [];
    for (const shooter of shooters) {
      tableBody.push([
        { content: '', colSpan: 1 },
        { content: shooter.name, colSpan: 1 },
        { content: '', colSpan: 1 },
        { content: '', colSpan: 1 },
        { content: '', colSpan: 1 },
        { content: '', colSpan: 1 },
        { content: '', colSpan: 1 },
        { content: '', colSpan: 1 },
        { content: '', colSpan: 1 },
        { content: '', colSpan: 1 },
        { content: '', colSpan: 1 },
        { content: '', colSpan: 1 },
        { content: '', colSpan: 1 }
      ]);
    }
    
    // Total-Zeile
    tableBody.push([
      { content: '', colSpan: 1 },
      { content: 'Total', colSpan: 1, styles: { fontStyle: 'bold' } },
      { content: '', colSpan: 1 },
      { content: '', colSpan: 1 },
      { content: '', colSpan: 1 },
      { content: '', colSpan: 1 },
      { content: '', colSpan: 1 },
      { content: '', colSpan: 1 },
      { content: '', colSpan: 1 },
      { content: '', colSpan: 1 },
      { content: '', colSpan: 1 },
      { content: '', colSpan: 1 },
      { content: '', colSpan: 1 }
    ]);
  });
  
  // Tabelle erstellen
  doc.autoTable({
    head: tableHead,
    body: tableBody,
    startY: 45,
    theme: 'grid',
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontStyle: 'bold',
      halign: 'center'
    },
    styles: {
      fontSize: 10,
      cellPadding: 3,
      lineWidth: 0.1,
      lineColor: [0, 0, 0]
    },
    columnStyles: {
      0: { cellWidth: 40 }, // Mannschaft
      1: { cellWidth: 40 }, // Name
    }
  });
  
  // Fußzeile mit Rundenwettkampfleiter
  const pageCount = doc.internal.getNumberOfPages();
  doc.setFontSize(8);
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.text(
      `Seite ${i} von ${pageCount} - Erstellt mit RWK App Einbeck`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 15,
      { align: 'center' }
    );
    doc.text(
      `Karsten Reinert Einbecker Sgi`,
      doc.internal.pageSize.getWidth() - 20,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'right' }
    );
  }
  
  // PDF als Blob zurückgeben
  return doc.output('blob');
}
