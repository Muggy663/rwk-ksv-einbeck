import { logError } from '@/lib/utils/secure-logger';

// PDF-Export für den Durchgangs-Meldebogen (Handzettel).
// Zweck: In der nativen App (Capacitor) funktioniert window.print() nicht –
// deshalb erzeugen wir hier ein echtes PDF (jsPDF + autotable) und bieten es
// zum Download (Browser) bzw. zum Teilen (App) an. Layout orientiert sich an
// der bestehenden HTML-Vorschau: Kopf mit Verband/Saison/Liga + Infozeile,
// Tabelle Verein | Name | Ringe | Nachschießen | Unterschrift MF.

export interface HandzettelSchuetze {
  name: string;
}

export interface HandzettelTeam {
  verein: string;
  schuetzen: HandzettelSchuetze[];
}

export interface HandzettelExportData {
  verband?: string;      // Default: Kreisschützenverband Einbeck
  saison: string;
  liga: string;
  durchgang: number;
  datum?: string;        // bereits formatiert (dd.MM.yyyy) oder leer
  uhrzeit?: string;
  ort?: string;
  teams: HandzettelTeam[];
}

const VERBAND_DEFAULT = 'Kreisschützenverband Einbeck';

// Zeichen, die die jsPDF-Standardschrift nicht sauber darstellt, ersetzen.
function sanitize(text: string): string {
  return (text || '')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\u2026/g, '...');
}

function sanitizeFilename(name: string): string {
  return (name || 'Meldebogen').replace(/[^a-zA-Z0-9äöüÄÖÜß _-]/g, '').replace(/\s+/g, '_');
}

async function deliver(blob: Blob, filename: string, mimeType: string): Promise<void> {
  const isNativeApp = typeof window !== 'undefined' && !!window.Capacitor?.isNativePlatform?.();
  if (isNativeApp) {
    try {
      const { Share } = await import('@capacitor/share');
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string).split(',')[1] || '');
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      await Share.share({ title: filename, url: `data:${mimeType};base64,${base64}`, dialogTitle: filename });
      return;
    } catch (error) {
      logError('Native Share des Meldebogens fehlgeschlagen, Fallback:', error);
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function exportHandzettelPdf(data: HandzettelExportData): Promise<void> {
  const { default: jsPDF } = await import('jspdf');
  const autoTable = (await import('jspdf-autotable')).default;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();

  // Kopf
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(sanitize(data.verband || VERBAND_DEFAULT), pageWidth / 2, 16, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text(sanitize(data.saison), pageWidth / 2, 22, { align: 'center' });
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(sanitize(`Meldebogen - ${data.liga}`), pageWidth / 2, 29, { align: 'center' });
  doc.setFont('helvetica', 'normal');

  // Empfänger-Hinweis (klein, links)
  doc.setFontSize(8);
  doc.text('Ergebnisse an: RWK-Leitung (rwk-leiter-ksve@gmx.de)', 14, 37);

  // Infozeile: Durchgang / Datum / Uhrzeit / Ort
  doc.setFontSize(10);
  const info = [
    `Durchgang: ${data.durchgang}`,
    `Datum: ${data.datum || '__.__.____'}`,
    `Uhrzeit: ${data.uhrzeit || '____'}`,
    `Ort: ${data.ort || '______________'}`,
  ].join('     ');
  doc.text(sanitize(info), 14, 44);

  // Tabelle
  const head = [['Verein', 'Name', 'Ringe', 'Nachschießen', 'Unterschrift MF']];
  const body: any[] = [];
  for (const team of data.teams) {
    const schuetzen = team.schuetzen.length > 0 ? team.schuetzen : [{ name: '' }];
    schuetzen.forEach((s, i) => {
      body.push([
        i === 0 ? { content: sanitize(team.verein), rowSpan: schuetzen.length, styles: { fontStyle: 'bold', valign: 'middle' } } : null,
        sanitize(s.name),
        '', '', '',
      ].filter((c) => c !== null));
    });
  }
  if (body.length === 0) {
    body.push([{ content: 'Keine Mannschaften gefunden', colSpan: 5, styles: { halign: 'center' } }]);
  }

  autoTable(doc, {
    startY: 49,
    head,
    body,
    theme: 'grid',
    styles: { fontSize: 10, cellPadding: 2, lineWidth: 0.1, minCellHeight: 9 },
    headStyles: { fillColor: [254, 243, 199], textColor: 0, fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 40 },
      1: { cellWidth: 55 },
      2: { cellWidth: 25, halign: 'center' },
      3: { cellWidth: 30, halign: 'center' },
      4: { cellWidth: 'auto' },
    },
  });

  const blob = doc.output('blob');
  await deliver(blob, `Meldebogen_${sanitizeFilename(data.liga)}_DG${data.durchgang}.pdf`, 'application/pdf');
}
