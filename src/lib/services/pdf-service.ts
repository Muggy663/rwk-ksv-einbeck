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
      rank: team.rank,
      name: team.name,
      totalScore: team.totalScore || '-',
      averageScore: team.averageScore ? team.averageScore.toFixed(2) : '-'
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
      rank: shooter.rank,
      name: shooter.shooterName,
      team: shooter.teamName,
      totalScore: shooter.totalScore || '-',
      averageScore: shooter.averageScore ? shooter.averageScore.toFixed(2) : '-'
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
 * Generiert eine leere Tabelle für den Saisonbeginn zum Handausfüllen mit Kontaktdaten
 * @param league Die Liga mit Teams
 * @param numRounds Anzahl der Durchgänge
 * @param competitionYear Das Wettkampfjahr
 * @param teamContacts Kontaktdaten der Mannschaftsführer (optional)
 * @returns Blob des generierten PDFs
 */
export async function generateEmptySeasonTablePDF(
  league: LeagueDisplay,
  numRounds: number,
  competitionYear: number,
  teamContacts?: Record<string, { name: string; phone: string; email: string }>
): Promise<Blob> {
  // PDF im A3-Format erstellen (Querformat für mehr Platz)
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a3'
  });
  
  // Schriftart setzen
  doc.setFont('helvetica', 'normal');
  
  // Logo-Einfügung entfernen, da es Probleme verursacht
  // Das Logo kann später hinzugefügt werden, wenn die korrekte Einbindung implementiert ist
  
  // Titel
  doc.setFontSize(18);
  doc.text(`${league.name} ${competitionYear} - Wettkampfplan`, 14, 20);
  
  // Untertitel
  doc.setFontSize(12);
  doc.text(`Erstellt am: ${format(new Date(), 'dd.MM.yyyy', { locale: de })}`, 14, 28);
  
  // Tabelle für Wettkampfplan mit Durchgängen
  const headers = [
    { title: 'Mannschaft / Schützen', dataKey: 'name' },
  ];
  
  // Durchgänge hinzufügen
  for (let i = 1; i <= numRounds; i++) {
    headers.push({ 
      title: `Durchgang ${i}`, 
      dataKey: `dg${i}` 
    });
  }
  
  // Spalte für Endergebnis
  headers.push({ title: 'Gesamt', dataKey: 'total' });
  headers.push({ title: 'Platz', dataKey: 'rank' });
  
  // Daten für die Tabelle vorbereiten
  const tableData = [];
  
  // Für jede Mannschaft
  league.teams.forEach(team => {
    // Mannschaftsname
    tableData.push([
      { content: team.name, colSpan: 1, styles: { fontStyle: 'bold' } },
      { content: '', colSpan: numRounds },
      { content: '', colSpan: 1 },
      { content: '', colSpan: 1 }
    ]);
    
    // Schützen der Mannschaft (oder leere Zeilen, wenn keine Schützen vorhanden)
    const shooters = team.shooters || [];
    const shooterCount = Math.max(shooters.length, 3); // Mindestens 3 Zeilen für Schützen
    
    for (let i = 0; i < shooterCount; i++) {
      const shooter = shooters[i] || { name: '' };
      const row = [
        { content: shooter.name, colSpan: 1 }
      ];
      
      // Leere Zellen für Durchgänge
      for (let j = 0; j < numRounds; j++) {
        row.push({ content: '', colSpan: 1 });
      }
      
      // Leere Zellen für Gesamt und Platz
      row.push({ content: '', colSpan: 1 });
      row.push({ content: '', colSpan: 1 });
      
      tableData.push(row);
    }
    
    // Mannschaftsergebnis-Zeile
    const totalRow = [
      { content: 'Mannschaft gesamt', colSpan: 1, styles: { fontStyle: 'bold' } }
    ];
    
    // Leere Zellen für Durchgänge
    for (let j = 0; j < numRounds; j++) {
      totalRow.push({ content: '', colSpan: 1 });
    }
    
    // Leere Zellen für Gesamt und Platz
    totalRow.push({ content: '', colSpan: 1 });
    totalRow.push({ content: '', colSpan: 1 });
    
    tableData.push(totalRow);
    
    // Leerzeile zwischen Mannschaften
    tableData.push([
      { content: '', colSpan: numRounds + 3 }
    ]);
  });
  
  // Tabelle erstellen
  doc.autoTable({
    head: [headers.map(header => header.title)],
    body: tableData,
    startY: 35,
    theme: 'grid',
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontStyle: 'bold'
    },
    styles: {
      fontSize: 10,
      cellPadding: 3
    },
    columnStyles: {
      0: { cellWidth: 50 }, // Mannschaft/Schützen
    },
    didDrawCell: (data) => {
      // Platz für Ort, Datum und Uhrzeit in der Kopfzeile
      if (data.row.index === 0 && data.column.index > 0 && data.column.index <= numRounds) {
        const x = data.cell.x;
        const y = data.cell.y;
        const w = data.cell.width;
        
        // Linien für Einträge
        doc.setDrawColor(200, 200, 200);
        doc.line(x + 15, y + 15, x + w - 2, y + 15); // Linie für Ort
        doc.line(x + 15, y + 20, x + w - 2, y + 20); // Linie für Datum
        doc.line(x + 15, y + 25, x + w - 2, y + 25); // Linie für Uhrzeit
        
        doc.setFontSize(8);
        doc.text(`Ort:`, x + 2, y + 15);
        doc.text(`Datum:`, x + 2, y + 20);
        doc.text(`Uhrzeit:`, x + 2, y + 25);
      }
    }
  });
  
  // Mannschaftsführer-Kontakte unter dem Wettkampfplan
  const lastY = (doc as any).lastAutoTable.finalY + 15;
  doc.setFontSize(14);
  doc.text("Mannschaftsführer", 14, lastY);
  
  const contactData = [];
  league.teams.forEach(team => {
    const contact = teamContacts?.[team.id] || { name: '', phone: '', email: '' };
    contactData.push([
      team.name,
      contact.name,
      contact.phone,
      contact.email
    ]);
  });
  
  doc.autoTable({
    head: [['Mannschaft', 'Mannschaftsführer', 'Telefon', 'E-Mail']],
    body: contactData,
    startY: lastY + 5,
    theme: 'grid',
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontStyle: 'bold'
    },
    styles: {
      fontSize: 9,
      cellPadding: 2
    }
  });
  
  // Platz für Einzel- und Mannschaftsplatzierungen
  const contactsEndY = (doc as any).lastAutoTable.finalY + 15;
  
  // Einfache Tabelle für Platzierungen
  doc.setFontSize(14);
  doc.text("Platzierungen", 14, contactsEndY);
  
  const platzierungsData = [
    ['Platz', 'Mannschaft', 'Gesamt'],
    ['1.', '', ''],
    ['2.', '', ''],
    ['3.', '', ''],
    ['4.', '', ''],
    ['5.', '', ''],
    ['6.', '', ''],
    ['7.', '', ''],
    ['8.', '', ''],
    ['9.', '', ''],
    ['10.', '', '']
  ];
  
  doc.autoTable({
    head: [['Platz Mannschaft', '', '']],
    body: platzierungsData,
    startY: contactsEndY + 5,
    theme: 'grid',
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontStyle: 'bold'
    },
    styles: {
      fontSize: 9,
      cellPadding: 2
    },
    margin: { right: doc.internal.pageSize.getWidth() / 2 + 10 }
  });
  
  // Einzelplatzierungen
  const einzelData = [
    ['Platz', 'Name', 'Gesamt'],
    ['1.', '', ''],
    ['2.', '', ''],
    ['3.', '', ''],
    ['4.', '', ''],
    ['5.', '', ''],
    ['6.', '', ''],
    ['7.', '', ''],
    ['8.', '', ''],
    ['9.', '', ''],
    ['10.', '', '']
  ];
  
  doc.autoTable({
    head: [['Platz Einzel', '', '']],
    body: einzelData,
    startY: contactsEndY + 5,
    theme: 'grid',
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontStyle: 'bold'
    },
    styles: {
      fontSize: 9,
      cellPadding: 2
    },
    margin: { left: doc.internal.pageSize.getWidth() / 2 + 5 }
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