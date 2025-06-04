import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

/**
 * Generiert ein PDF-Dokument mit einer Tabelle
 * @param {string} title - Titel des Dokuments
 * @param {string[]} headers - Spaltenüberschriften
 * @param {Array<Array<string|number>>} data - Tabellendaten
 * @param {Object} [options] - Zusätzliche Optionen
 * @param {string} [options.orientation='portrait'] - Ausrichtung des Dokuments ('portrait' oder 'landscape')
 * @param {string} [options.filename='export.pdf'] - Dateiname für den Download
 * @returns {jsPDF} Das generierte PDF-Dokument
 */
export function generateTablePDF(title, headers, data, options = {}) {
  const orientation = options.orientation || 'portrait';
  const filename = options.filename || 'export.pdf';
  
  const doc = new jsPDF({
    orientation: orientation,
    unit: 'mm',
    format: 'a4'
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