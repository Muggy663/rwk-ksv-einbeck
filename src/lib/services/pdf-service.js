import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { cachePDF, getCachedPDF } from './pdf-cache-service';

/**
 * Generiert ein PDF-Dokument mit einer Tabelle
 * @param {string} title - Titel des Dokuments
 * @param {string[]} headers - Spaltenüberschriften
 * @param {Array<Array<string|number>>} data - Tabellendaten
 * @param {Object} [options] - Zusätzliche Optionen
 * @param {string} [options.orientation='portrait'] - Ausrichtung des Dokuments ('portrait' oder 'landscape')
 * @param {string} [options.filename='export.pdf'] - Dateiname für den Download
 * @param {boolean} [options.compress=true] - PDF komprimieren
 * @returns {jsPDF} Das generierte PDF-Dokument
 */
export function generateTablePDF(title, headers, data, options = {}) {
  const orientation = options.orientation || 'portrait';
  const filename = options.filename || 'export.pdf';
  const compress = options.compress !== false;
  
  const doc = new jsPDF({
    orientation: orientation,
    unit: 'mm',
    format: 'a4',
    compress: compress
  });
  
  // Metadaten hinzufügen
  doc.setProperties({
    title: title,
    subject: 'RWK Einbeck App Export',
    author: 'RWK Einbeck App',
    creator: 'RWK Einbeck App'
  });
  
  // Titel und Datum
  doc.setFontSize(18);
  doc.text(title, 14, 22);
  
  doc.setFontSize(10);
  const today = format(new Date(), 'dd. MMMM yyyy, HH:mm', { locale: de });
  doc.text(`Erstellt am: ${today} Uhr`, 14, 30);
  
  // Tabelle erstellen
  doc.autoTable({
    head: [headers],
    body: data,
    startY: 35,
    styles: {
      fontSize: 10,
      cellPadding: 3,
      lineColor: [0, 0, 0],
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [240, 240, 240],
    },
    margin: { top: 35 },
  });
  
  // Fußzeile
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(
      `Seite ${i} von ${pageCount} | RWK Einbeck App | ${today}`,
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    );
  }
  
  return doc;
}

/**
 * Speichert ein PDF-Dokument
 * @param {jsPDF} doc - Das PDF-Dokument
 * @param {string} [filename='export.pdf'] - Dateiname für den Download
 */
export function savePDF(doc, filename = 'export.pdf') {
  doc.save(filename);
}

/**
 * Generiert ein PDF mit Ligadaten
 * @param {import('../../types/rwk').LeagueDisplay} league - Die Liga
 * @param {number} numRounds - Anzahl der Durchgänge
 * @param {number} competitionYear - Wettkampfjahr
 * @param {Object} [options] - Zusätzliche Optionen
 * @param {boolean} [options.useCache=true] - Cache verwenden
 * @param {boolean} [options.compress=true] - PDF komprimieren
 * @returns {Promise<Blob>} Das generierte PDF als Blob
 */
export async function generateLeaguePDF(league, numRounds, competitionYear, options = {}) {
  const useCache = options.useCache !== false;
  const compress = options.compress !== false;
  
  // Versuche, das PDF aus dem Cache zu laden
  if (useCache) {
    const params = { leagueId: league.id, numRounds, competitionYear };
    const cachedPDF = getCachedPDF('league', params);
    if (cachedPDF) {
      return cachedPDF;
    }
  }
  
  // Erstelle ein neues PDF-Dokument
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
    compress: compress
  });
  
  // Metadaten hinzufügen
  doc.setProperties({
    title: `${league.name} - Mannschaftstabelle ${competitionYear}`,
    subject: 'RWK Einbeck App Export',
    author: 'RWK Einbeck App',
    creator: 'RWK Einbeck App'
  });
  
  // Titel und Datum
  doc.setFontSize(18);
  doc.text(`${league.name} - Mannschaftstabelle ${competitionYear}`, 14, 20);
  
  doc.setFontSize(10);
  const today = format(new Date(), 'dd. MMMM yyyy, HH:mm', { locale: de });
  doc.text(`Erstellt am: ${today} Uhr`, 14, 28);
  
  // Tabellendaten vorbereiten
  const headers = ['Platz', 'Mannschaft'];
  
  // Durchgänge hinzufügen
  for (let i = 1; i <= numRounds; i++) {
    headers.push(`DG ${i}`);
  }
  
  headers.push('Gesamt', 'Schnitt');
  
  // Mannschaftsdaten
  const data = league.teams.map((team, index) => {
    const row = [index + 1, team.name];
    
    // Leere Zellen für Durchgänge
    for (let i = 0; i < numRounds; i++) {
      row.push('');
    }
    
    // Leere Zellen für Gesamt und Schnitt
    row.push('', '');
    
    return row;
  });
  
  // Tabelle erstellen
  doc.autoTable({
    head: [headers],
    body: data,
    startY: 35,
    styles: {
      fontSize: 10,
      cellPadding: 3,
      lineColor: [0, 0, 0],
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [240, 240, 240],
    },
    margin: { top: 35 },
  });
  
  // Fußzeile
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(
      `Seite ${i} von ${pageCount} | RWK Einbeck App | ${today}`,
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    );
  }
  
  // PDF als Blob generieren
  const pdfBlob = doc.output('blob');
  
  // Im Cache speichern, wenn gewünscht
  if (useCache) {
    const params = { leagueId: league.id, numRounds, competitionYear };
    cachePDF('league', params, pdfBlob);
  }
  
  return pdfBlob;
}

/**
 * Generiert ein PDF mit Schützendaten
 * @param {import('../../types/rwk').LeagueDisplay} league - Die Liga
 * @param {number} numRounds - Anzahl der Durchgänge
 * @param {number} competitionYear - Wettkampfjahr
 * @param {Object} [options] - Zusätzliche Optionen
 * @param {boolean} [options.useCache=true] - Cache verwenden
 * @param {boolean} [options.compress=true] - PDF komprimieren
 * @returns {Promise<Blob>} Das generierte PDF als Blob
 */
export async function generateShootersPDF(league, numRounds, competitionYear, options = {}) {
  const useCache = options.useCache !== false;
  const compress = options.compress !== false;
  
  // Versuche, das PDF aus dem Cache zu laden
  if (useCache) {
    const params = { leagueId: league.id, numRounds, competitionYear };
    const cachedPDF = getCachedPDF('shooters', params);
    if (cachedPDF) {
      return cachedPDF;
    }
  }
  
  // Erstelle ein neues PDF-Dokument
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
    compress: compress
  });
  
  // Metadaten hinzufügen
  doc.setProperties({
    title: `${league.name} - Einzelschützentabelle ${competitionYear}`,
    subject: 'RWK Einbeck App Export',
    author: 'RWK Einbeck App',
    creator: 'RWK Einbeck App'
  });
  
  // Titel und Datum
  doc.setFontSize(18);
  doc.text(`${league.name} - Einzelschützentabelle ${competitionYear}`, 14, 20);
  
  doc.setFontSize(10);
  const today = format(new Date(), 'dd. MMMM yyyy, HH:mm', { locale: de });
  doc.text(`Erstellt am: ${today} Uhr`, 14, 28);
  
  // Tabellendaten vorbereiten
  const headers = ['Platz', 'Name', 'Mannschaft'];
  
  // Durchgänge hinzufügen
  for (let i = 1; i <= numRounds; i++) {
    headers.push(`DG ${i}`);
  }
  
  headers.push('Gesamt', 'Schnitt');
  
  // Schützendaten (Platzhalter)
  const data = [];
  
  // Für jede Mannschaft Platzhalter für Schützen erstellen
  league.teams.forEach(team => {
    // Wenn keine Schützen vorhanden sind, 3 Platzhalter erstellen
    const shooters = team.shooters || [];
    if (shooters.length === 0) {
      for (let i = 0; i < 3; i++) {
        const row = ['-', `Schütze ${i+1}`, team.name];
        
        // Leere Zellen für Durchgänge
        for (let j = 0; j < numRounds; j++) {
          row.push('');
        }
        
        // Leere Zellen für Gesamt und Schnitt
        row.push('', '');
        
        data.push(row);
      }
    } else {
      // Vorhandene Schützen verwenden
      shooters.forEach((shooter, index) => {
        const row = ['-', shooter.name, team.name];
        
        // Leere Zellen für Durchgänge
        for (let j = 0; j < numRounds; j++) {
          row.push('');
        }
        
        // Leere Zellen für Gesamt und Schnitt
        row.push('', '');
        
        data.push(row);
      });
    }
  });
  
  // Tabelle erstellen
  doc.autoTable({
    head: [headers],
    body: data,
    startY: 35,
    styles: {
      fontSize: 10,
      cellPadding: 3,
      lineColor: [0, 0, 0],
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [240, 240, 240],
    },
    margin: { top: 35 },
  });
  
  // Fußzeile
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(
      `Seite ${i} von ${pageCount} | RWK Einbeck App | ${today}`,
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    );
  }
  
  // PDF als Blob generieren
  const pdfBlob = doc.output('blob');
  
  // Im Cache speichern, wenn gewünscht
  if (useCache) {
    const params = { leagueId: league.id, numRounds, competitionYear };
    cachePDF('shooters', params, pdfBlob);
  }
  
  return pdfBlob;
}

/**
 * Generiert eine leere Saisontabelle zum Handausfüllen
 * @param {import('../../types/rwk').LeagueDisplay} league - Die Liga
 * @param {number} numRounds - Anzahl der Durchgänge
 * @param {number} competitionYear - Wettkampfjahr
 * @param {Object.<string, {name: string, phone: string, email: string}>} teamContacts - Kontaktdaten der Teams
 * @param {Object} [options] - Zusätzliche Optionen
 * @param {boolean} [options.useCache=true] - Cache verwenden
 * @param {boolean} [options.compress=true] - PDF komprimieren
 * @returns {Promise<Blob>} Das generierte PDF als Blob
 */
export async function generateEmptySeasonTablePDF(league, numRounds, competitionYear, teamContacts = {}, options = {}) {
  const useCache = options.useCache !== false;
  const compress = options.compress !== false;
  
  // Versuche, das PDF aus dem Cache zu laden
  if (useCache) {
    const params = { leagueId: league.id, numRounds, competitionYear };
    const cachedPDF = getCachedPDF('emptyTable', params);
    if (cachedPDF) {
      return cachedPDF;
    }
  }
  
  // Erstelle ein neues PDF-Dokument
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: compress
  });
  
  // Metadaten hinzufügen
  doc.setProperties({
    title: `${league.name} - Handtabelle ${competitionYear}`,
    subject: 'RWK Einbeck App Export',
    author: 'RWK Einbeck App',
    creator: 'RWK Einbeck App'
  });
  
  // Titel und Datum
  doc.setFontSize(18);
  doc.text(`${league.name} - Handtabelle ${competitionYear}`, 14, 20);
  
  doc.setFontSize(10);
  const today = format(new Date(), 'dd. MMMM yyyy', { locale: de });
  doc.text(`Erstellt am: ${today}`, 14, 28);
  
  // Kontaktdaten der Mannschaftsführer
  doc.setFontSize(12);
  doc.text('Kontaktdaten der Mannschaftsführer:', 14, 40);
  
  let yPos = 45;
  league.teams.forEach((team, index) => {
    const contact = teamContacts[team.id] || { name: '', phone: '', email: '' };
    doc.setFontSize(10);
    doc.text(`${index + 1}. ${team.name}:`, 14, yPos);
    doc.text(`Mannschaftsführer: ${contact.name || '-'}`, 30, yPos + 5);
    doc.text(`Telefon: ${contact.phone || '-'}`, 30, yPos + 10);
    doc.text(`E-Mail: ${contact.email || '-'}`, 30, yPos + 15);
    yPos += 22;
  });
  
  // Neue Seite für Wettkampfplan
  doc.addPage();
  
  // Wettkampfplan
  doc.setFontSize(14);
  doc.text(`Wettkampfplan ${league.name} - ${competitionYear}`, 14, 20);
  
  // Tabelle für Wettkampfplan
  const headers = ['Durchgang', 'Datum', 'Uhrzeit', 'Ort', 'Heimmannschaft', 'Gastmannschaft'];
  const data = [];
  
  for (let i = 1; i <= numRounds; i++) {
    data.push([`${i}`, '', '', '', '', '']);
  }
  
  doc.autoTable({
    head: [headers],
    body: data,
    startY: 30,
    styles: {
      fontSize: 10,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [240, 240, 240],
    },
  });
  
  // Neue Seite für Einzelschützen-Rangliste
  doc.addPage();
  
  // Einzelschützen-Rangliste
  doc.setFontSize(14);
  doc.text(`Einzelschützen-Rangliste ${league.name} - ${competitionYear}`, 14, 20);
  
  // Tabelle für Einzelschützen
  const shooterHeaders = ['Platz', 'Name', 'Mannschaft'];
  
  // Durchgänge hinzufügen
  for (let i = 1; i <= numRounds; i++) {
    shooterHeaders.push(`DG ${i}`);
  }
  
  shooterHeaders.push('Gesamt', 'Schnitt');
  
  // Leere Daten für Einzelschützen
  const shooterData = [];
  for (let i = 1; i <= 20; i++) {
    const row = [i, '', ''];
    
    // Leere Zellen für Durchgänge
    for (let j = 0; j < numRounds; j++) {
      row.push('');
    }
    
    // Leere Zellen für Gesamt und Schnitt
    row.push('', '');
    
    shooterData.push(row);
  }
  
  doc.autoTable({
    head: [shooterHeaders],
    body: shooterData,
    startY: 30,
    styles: {
      fontSize: 9,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [240, 240, 240],
    },
  });
  
  // Fußzeile auf allen Seiten
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(
      `Seite ${i} von ${pageCount} | RWK Einbeck App | ${today}`,
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    );
  }
  
  // PDF als Blob generieren
  const pdfBlob = doc.output('blob');
  
  // Im Cache speichern, wenn gewünscht
  if (useCache) {
    const params = { leagueId: league.id, numRounds, competitionYear };
    cachePDF('emptyTable', params, pdfBlob);
  }
  
  return pdfBlob;
}

/**
 * Generiert eine Gesamtliste für die Kreisoberliga
 * @param {import('../../types/rwk').LeagueDisplay} league - Die Liga
 * @param {number} competitionYear - Wettkampfjahr
 * @param {Object.<string, {name: string, phone: string, email: string}>} teamContacts - Kontaktdaten der Teams
 * @param {Object} [options] - Zusätzliche Optionen
 * @param {boolean} [options.useCache=true] - Cache verwenden
 * @param {boolean} [options.compress=true] - PDF komprimieren
 * @returns {Promise<Blob>} Das generierte PDF als Blob
 */
export async function generateGesamtlistePDF(league, competitionYear, teamContacts = {}, options = {}) {
  const useCache = options.useCache !== false;
  const compress = options.compress !== false;
  
  // Versuche, das PDF aus dem Cache zu laden
  if (useCache) {
    const params = { leagueId: league.id, competitionYear };
    const cachedPDF = getCachedPDF('gesamtliste', params);
    if (cachedPDF) {
      return cachedPDF;
    }
  }
  
  // Erstelle ein neues PDF-Dokument
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
    compress: compress
  });
  
  // Metadaten hinzufügen
  doc.setProperties({
    title: `${league.name} - Gesamtliste ${competitionYear}`,
    subject: 'RWK Einbeck App Export',
    author: 'RWK Einbeck App',
    creator: 'RWK Einbeck App'
  });
  
  // Titel und Datum
  doc.setFontSize(18);
  doc.text(`${league.name} - Gesamtliste ${competitionYear}`, 14, 20);
  
  doc.setFontSize(10);
  const today = format(new Date(), 'dd. MMMM yyyy', { locale: de });
  doc.text(`Erstellt am: ${today}`, 14, 28);
  
  // Abgabetermin
  doc.setFontSize(12);
  doc.setTextColor(255, 0, 0);
  doc.text(`Abgabetermin: 15. August ${competitionYear}`, 200, 28);
  doc.setTextColor(0, 0, 0);
  
  // Kontaktdaten der Mannschaftsführer
  doc.setFontSize(12);
  doc.text('Kontaktdaten der Mannschaftsführer:', 14, 40);
  
  let yPos = 45;
  let xPos = 14;
  league.teams.forEach((team, index) => {
    const contact = teamContacts[team.id] || { name: '', phone: '', email: '' };
    
    // Neue Spalte nach 3 Teams
    if (index > 0 && index % 3 === 0) {
      xPos += 90;
      yPos = 45;
    }
    
    doc.setFontSize(10);
    doc.text(`${index + 1}. ${team.name}:`, xPos, yPos);
    doc.text(`MF: ${contact.name || '-'}`, xPos + 5, yPos + 5);
    doc.text(`Tel: ${contact.phone || '-'}`, xPos + 5, yPos + 10);
    doc.text(`E-Mail: ${contact.email || '-'}`, xPos + 5, yPos + 15);
    yPos += 22;
  });
  
  // Neue Seite für Mannschaftstabelle
  doc.addPage();
  
  // Mannschaftstabelle
  doc.setFontSize(14);
  doc.text(`Mannschaftstabelle ${league.name} - ${competitionYear}`, 14, 20);
  
  // Tabelle für Mannschaften
  const teamHeaders = ['Platz', 'Mannschaft', 'DG 1', 'DG 2', 'DG 3', 'DG 4', 'Gesamt', 'Schnitt'];
  
  // Mannschaftsdaten
  const teamData = league.teams.map((team, index) => {
    return [index + 1, team.name, '', '', '', '', '', ''];
  });
  
  doc.autoTable({
    head: [teamHeaders],
    body: teamData,
    startY: 30,
    styles: {
      fontSize: 10,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [240, 240, 240],
    },
  });
  
  // Neue Seite für Einzelschützen
  doc.addPage();
  
  // Einzelschützen
  doc.setFontSize(14);
  doc.text(`Einzelschützen ${league.name} - ${competitionYear}`, 14, 20);
  
  // Tabelle für Einzelschützen
  const shooterHeaders = ['Platz', 'Name', 'Mannschaft', 'DG 1', 'DG 2', 'DG 3', 'DG 4', 'Gesamt', 'Schnitt'];
  
  // Schützendaten
  const shooterData = [];
  
  // Für jede Mannschaft die Schützen hinzufügen
  league.teams.forEach(team => {
    const shooters = team.shooters || [];
    
    if (shooters.length === 0) {
      // Wenn keine Schützen vorhanden sind, Platzhalter erstellen
      for (let i = 0; i < 3; i++) {
        shooterData.push(['', `Schütze ${i+1}`, team.name, '', '', '', '', '', '']);
      }
    } else {
      // Vorhandene Schützen verwenden
      shooters.forEach(shooter => {
        shooterData.push(['', shooter.name, team.name, '', '', '', '', '', '']);
      });
    }
  });
  
  // Platz für weitere Einzelschützen
  for (let i = 0; i < 10; i++) {
    shooterData.push(['', '', '', '', '', '', '', '', '']);
  }
  
  doc.autoTable({
    head: [shooterHeaders],
    body: shooterData,
    startY: 30,
    styles: {
      fontSize: 10,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [240, 240, 240],
    },
  });
  
  // Fußzeile auf allen Seiten
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(
      `Seite ${i} von ${pageCount} | RWK Einbeck App | ${today}`,
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    );
  }
  
  // PDF als Blob generieren
  const pdfBlob = doc.output('blob');
  
  // Im Cache speichern, wenn gewünscht
  if (useCache) {
    const params = { leagueId: league.id, competitionYear };
    cachePDF('gesamtliste', params, pdfBlob);
  }
  
  return pdfBlob;
}