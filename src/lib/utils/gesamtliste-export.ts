// src/lib/utils/gesamtliste-export.ts
// Export der RWK-Gesamtergebnisliste als Excel (mit echten Formeln) und als PDF (leere Vorlage).
// Layout orientiert sich an der bestehenden Kreis-Vorlage:
//   Kopf: Sportjahr + je Durchgang (1..5) Ort / Datum / Uhrzeit
//   Pro Mannschaft: 3 Schützen-Zeilen (Ring / Gesamt je Durchgang) + "Mannschaft Total"-Zeile
//   Einzelstarter: eigene Zeilen unten (nur Einzelrang, keine Mannschaftswertung)
//   Rechts: Einzel-Rang (je Schütze) + Mannschafts-Rang (einmal pro Mannschaft)

const ANZAHL_DURCHGAENGE = 5;

export interface ExportSchuetze {
  name: string;
  /** Vorhandene Ring-Ergebnisse je Durchgang (1..5); leer = noch nicht geschossen */
  ringe?: Record<number, number | undefined>;
}

export interface ExportMannschaft {
  name: string;
  telefon?: string;
  /** true = Einzelstarter (keine Mannschaftswertung, keine Total-Zeile) */
  einzel?: boolean;
  schuetzen: ExportSchuetze[];
}

export interface ExportKopfDaten {
  sportjahr: string;   // z.B. "RWK Luftdruck 2026/2027" oder "2024/2025"
  liga: string;        // Liga-Name
  verband?: string;    // Default: Kreisschützenverband Einbeck
  abgabetermin?: string;
}

export interface GesamtlisteExportData {
  kopf: ExportKopfDaten;
  mannschaften: ExportMannschaft[];
}

const VERBAND_DEFAULT = 'Kreisschützenverband Einbeck';

/**
 * Spaltenlayout (1-basiert für ExcelJS):
 *  A(1) Mannschaft | B(2) Telefon | C(3) Name
 *  D(4)/E(5)   DG1 Ring/Gesamt
 *  F(6)/G(7)   DG2 Ring/Gesamt
 *  H(8)/I(9)   DG3 Ring/Gesamt
 *  J(10)/K(11) DG4 Ring/Gesamt
 *  L(12)/M(13) DG5 Ring/Gesamt
 *  N(14) Einzel-Rang | O(15) Mannschafts-Rang
 */
const COL = {
  mannschaft: 1,
  telefon: 2,
  name: 3,
  ringStart: 4, // DG1 Ring; Gesamt = +1; nächster DG = +2
  rangEinzel: 14,
  rangMannschaft: 15,
};
const LETTER = ['', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O'];

function ringCol(dg: number): number {
  return COL.ringStart + (dg - 1) * 2; // Ring-Spalte des Durchgangs
}
function gesamtCol(dg: number): number {
  return ringCol(dg) + 1; // Gesamt-Spalte des Durchgangs
}

/**
 * Baut die Excel-Datei mit echten Formeln und triggert den Download im Browser.
 */
export async function exportGesamtlisteExcel(data: GesamtlisteExportData): Promise<void> {
  const ExcelJS = (await import('exceljs')).default;
  const wb = new ExcelJS.Workbook();
  wb.creator = 'RWK App Einbeck';
  wb.created = new Date();
  const ws = wb.addWorksheet('Gesamtliste', {
    pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0, paperSize: 9 },
    properties: { defaultRowHeight: 16 },
  });

  const gesamtSpalten = ANZAHL_DURCHGAENGE * 2 + 3 + 2; // Name-Block(3) + DG(10) + Rang(2) = 15
  const letzterGesamtCol = gesamtCol(ANZAHL_DURCHGAENGE); // M (13) = End-Gesamt DG5

  // Spaltenbreiten
  ws.getColumn(COL.mannschaft).width = 22;
  ws.getColumn(COL.telefon).width = 14;
  ws.getColumn(COL.name).width = 22;
  for (let dg = 1; dg <= ANZAHL_DURCHGAENGE; dg++) {
    ws.getColumn(ringCol(dg)).width = 7;
    ws.getColumn(gesamtCol(dg)).width = 8;
  }
  ws.getColumn(COL.rangEinzel).width = 7;
  ws.getColumn(COL.rangMannschaft).width = 11;

  const border = {
    top: { style: 'thin' as const }, left: { style: 'thin' as const },
    bottom: { style: 'thin' as const }, right: { style: 'thin' as const },
  };
  const headerFill = { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FFDEEAF6' } };
  const totalFill = { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FFF2F2F2' } };

  // ---------- Kopfzeilen ----------
  // Zeile 1: Titel / Verband
  const titelRow = ws.addRow([]);
  ws.mergeCells(titelRow.number, 1, titelRow.number, gesamtSpalten);
  titelRow.getCell(1).value = `${data.kopf.verband || VERBAND_DEFAULT} – ${data.kopf.liga}`;
  titelRow.getCell(1).font = { bold: true, size: 13 };
  titelRow.getCell(1).alignment = { horizontal: 'center' };

  // Zeile 2: Sportjahr + Durchgangs-Überschriften
  const sportjahrRow = ws.addRow([]);
  sportjahrRow.getCell(COL.mannschaft).value = 'Sportjahr';
  sportjahrRow.getCell(COL.mannschaft).font = { bold: true };
  for (let dg = 1; dg <= ANZAHL_DURCHGAENGE; dg++) {
    ws.mergeCells(sportjahrRow.number, ringCol(dg), sportjahrRow.number, gesamtCol(dg));
    const c = sportjahrRow.getCell(ringCol(dg));
    c.value = `${dg}. Durchgang`;
    c.font = { bold: true };
    c.alignment = { horizontal: 'center' };
    c.fill = headerFill;
  }
  sportjahrRow.getCell(COL.rangEinzel).value = 'Einzel';
  sportjahrRow.getCell(COL.rangMannschaft).value = 'Mannschaft';
  sportjahrRow.getCell(COL.rangEinzel).font = { bold: true };
  sportjahrRow.getCell(COL.rangMannschaft).font = { bold: true };

  // Zeile 3: Sportjahr-Wert + "Ort" + Leerfelder
  const ortRow = ws.addRow([]);
  ortRow.getCell(COL.mannschaft).value = data.kopf.sportjahr;
  ortRow.getCell(COL.name).value = 'Ort';
  ortRow.getCell(COL.name).font = { bold: true };
  // Zeile 4: Datum
  const datumRow = ws.addRow([]);
  datumRow.getCell(COL.name).value = 'Datum';
  datumRow.getCell(COL.name).font = { bold: true };
  // Zeile 5: Uhrzeit
  const uhrzeitRow = ws.addRow([]);
  uhrzeitRow.getCell(COL.name).value = 'Uhrzeit';
  uhrzeitRow.getCell(COL.name).font = { bold: true };
  for (const r of [ortRow, datumRow, uhrzeitRow]) {
    for (let dg = 1; dg <= ANZAHL_DURCHGAENGE; dg++) {
      ws.mergeCells(r.number, ringCol(dg), r.number, gesamtCol(dg)); // Ort/Datum/Uhrzeit füllt beide Spalten
    }
  }

  // Zeile 6: Spaltenköpfe
  const kopf = ws.addRow([]);
  kopf.getCell(COL.mannschaft).value = 'Mannschaft';
  kopf.getCell(COL.telefon).value = 'Telefon';
  kopf.getCell(COL.name).value = 'Name';
  for (let dg = 1; dg <= ANZAHL_DURCHGAENGE; dg++) {
    kopf.getCell(ringCol(dg)).value = 'Ring';
    kopf.getCell(gesamtCol(dg)).value = 'Gesamt';
  }
  kopf.getCell(COL.rangEinzel).value = 'Rang';
  kopf.getCell(COL.rangMannschaft).value = 'Rang';
  kopf.eachCell({ includeEmpty: true }, (cell, col) => {
    if (col <= gesamtSpalten) {
      cell.font = { bold: true };
      cell.fill = headerFill;
      cell.alignment = { horizontal: 'center' };
      cell.border = border;
    }
  });

  // ---------- Datenzeilen ----------
  // Sammle für Rang-Formeln: Zeilen der Einzel-Endgesamt-Zellen und der Mannschafts-Endgesamt-Zellen
  const einzelGesamtZellen: string[] = []; // "M<row>" jeder gewerteten Schützenzeile
  const mannschaftGesamtZellen: string[] = []; // "M<row>" jeder Mannschaft-Total-Zeile
  // Merke pro Schützenzeile / Total-Zeile die Zeilennummer für spätere Rang-Formeln
  const einzelRangZeilen: { row: number; gesamtRef: string }[] = [];
  const mannschaftRangZeilen: { row: number; gesamtRef: string }[] = [];

  const endGesamtLetter = LETTER[letzterGesamtCol];

  for (const team of data.mannschaften) {
    const istEinzel = !!team.einzel;
    const schuetzen = team.schuetzen.length > 0 ? team.schuetzen : [{ name: '' }];

    const schuetzenRows: number[] = [];
    for (let i = 0; i < schuetzen.length; i++) {
      const s = schuetzen[i];
      const row = ws.addRow([]);
      schuetzenRows.push(row.number);
      if (i === 0) {
        row.getCell(COL.mannschaft).value = team.name;
        row.getCell(COL.telefon).value = team.telefon || '';
      }
      row.getCell(COL.name).value = s.name;
      // Ring + kumulierte Gesamt-Formel je Durchgang
      for (let dg = 1; dg <= ANZAHL_DURCHGAENGE; dg++) {
        const rc = LETTER[ringCol(dg)];
        const ringVal = s.ringe?.[dg];
        if (typeof ringVal === 'number') {
          row.getCell(ringCol(dg)).value = ringVal;
        }
        // Gesamt = (vorheriges Gesamt) + aktuelles Ring; DG1: = Ring
        if (dg === 1) {
          row.getCell(gesamtCol(dg)).value = { formula: `${rc}${row.number}` };
        } else {
          const prevG = LETTER[gesamtCol(dg - 1)];
          row.getCell(gesamtCol(dg)).value = { formula: `${prevG}${row.number}+${rc}${row.number}` };
        }
      }
      // Einzel-Rang-Formel (jeder Schütze) — wird nach dem Sammeln aller Zeilen gesetzt
      einzelGesamtZellen.push(`${endGesamtLetter}${row.number}`);
      einzelRangZeilen.push({ row: row.number, gesamtRef: `${endGesamtLetter}${row.number}` });
      styleDatenzeile(row, gesamtSpalten, border);
    }

    // Mannschaft-Total-Zeile (nur echte Mannschaften, nicht Einzel)
    if (!istEinzel) {
      const totalRow = ws.addRow([]);
      totalRow.getCell(COL.name).value = 'Mannschaft Total:';
      totalRow.getCell(COL.name).font = { bold: true };
      for (let dg = 1; dg <= ANZAHL_DURCHGAENGE; dg++) {
        const rc = LETTER[ringCol(dg)];
        const first = schuetzenRows[0];
        const last = schuetzenRows[schuetzenRows.length - 1];
        // Total-Ring = Summe der Schützen-Ringe dieses Durchgangs
        totalRow.getCell(ringCol(dg)).value = { formula: `SUM(${rc}${first}:${rc}${last})` };
        // Total-Gesamt kumulativ
        if (dg === 1) {
          totalRow.getCell(gesamtCol(dg)).value = { formula: `${rc}${totalRow.number}` };
        } else {
          const prevG = LETTER[gesamtCol(dg - 1)];
          totalRow.getCell(gesamtCol(dg)).value = { formula: `${prevG}${totalRow.number}+${rc}${totalRow.number}` };
        }
      }
      mannschaftGesamtZellen.push(`${endGesamtLetter}${totalRow.number}`);
      mannschaftRangZeilen.push({ row: totalRow.number, gesamtRef: `${endGesamtLetter}${totalRow.number}` });
      styleDatenzeile(totalRow, gesamtSpalten, border);
      totalRow.eachCell({ includeEmpty: true }, (cell, col) => {
        if (col <= gesamtSpalten) cell.fill = totalFill;
      });
    }
  }

  // ---------- Rang-Formeln setzen (Vergleichs-Summe statt RANK, s. buildRangFormel) ----------
  // Rang wird als Summe von Größer-Vergleichen berechnet: Rang = (Anzahl größerer
  // Werte) + 1. Das kommt ohne RANK/RANG.GLEICH aus (das über eine Zellen-LISTE
  // "#NAME?"/Fehler liefert) und funktioniert sprach- und versionsunabhängig.
  for (const e of einzelRangZeilen) {
    ws.getCell(e.row, COL.rangEinzel).value = {
      formula: buildRangFormel(e.gesamtRef, einzelGesamtZellen),
    };
  }
  for (const m of mannschaftRangZeilen) {
    // Mannschaftsrang in der Total-Zeile
    ws.getCell(m.row, COL.rangMannschaft).value = {
      formula: buildRangFormel(m.gesamtRef, mannschaftGesamtZellen),
    };
  }

  // Kopf-Ränder für Sportjahr-/Ort-/Datum-/Uhrzeit-Zeilen
  for (const rowNum of [sportjahrRow.number, ortRow.number, datumRow.number, uhrzeitRow.number]) {
    const r = ws.getRow(rowNum);
    for (let c = 1; c <= gesamtSpalten; c++) r.getCell(c).border = border;
  }

  const buf = await wb.xlsx.writeBuffer();
  triggerDownload(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `Gesamtliste_${sanitizeFilename(data.kopf.liga)}.xlsx`);
}

// Baut eine Rang-Formel ohne RANK: Rang = Anzahl der (verstreuten) End-Gesamt-Zellen,
// die größer sind als die Ziel-Zelle, + 1. Leere/0-Werte ergeben keinen Rang ("").
// Beispiel: =IF(M7=0,"",(M8>M7)+(M9>M7)+...+1)
function buildRangFormel(zielRef: string, alleRefs: string[]): string {
  const andere = alleRefs.filter((r) => r !== zielRef);
  if (andere.length === 0) return `IF(${zielRef}=0,"",1)`;
  const vergleiche = andere.map((r) => `(${r}>${zielRef})`).join('+');
  return `IF(${zielRef}=0,"",${vergleiche}+1)`;
}

function styleDatenzeile(
  row: import('exceljs').Row,
  gesamtSpalten: number,
  border: any,
): void {
  row.eachCell({ includeEmpty: true }, (cell, col) => {
    if (col <= gesamtSpalten) {
      cell.border = border;
      if (col >= COL.ringStart) cell.alignment = { horizontal: 'center' };
    }
  });
}

function sanitizeFilename(name: string): string {
  return (name || 'Liga').replace(/[^a-zA-Z0-9äöüÄÖÜß _-]/g, '').replace(/\s+/g, '_');
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * PDF-Export: gleiche Struktur, aber leere Ring/Gesamt-Felder (nur Schützen + Vereine vorbefüllt),
 * ohne Formeln. Querformat A4.
 */
export async function exportGesamtlistePdf(data: GesamtlisteExportData): Promise<void> {
  const { default: jsPDF } = await import('jspdf');
  const autoTable = (await import('jspdf-autotable')).default;

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFontSize(13);
  doc.text(`${data.kopf.verband || VERBAND_DEFAULT}`, pageWidth / 2, 12, { align: 'center' });
  doc.setFontSize(11);
  doc.text(`${data.kopf.sportjahr} – ${data.kopf.liga}`, pageWidth / 2, 18, { align: 'center' });
  if (data.kopf.abgabetermin) {
    doc.setFontSize(9);
    doc.setTextColor(200, 0, 0);
    doc.text(`Abgabetermin: ${data.kopf.abgabetermin}`, pageWidth - 10, 12, { align: 'right' });
    doc.setTextColor(0, 0, 0);
  }

  // Kopf-Zeilen (Durchgänge + Ort/Datum/Uhrzeit) als eigene kleine Tabelle
  const dgHead1: any[] = [
    { content: 'Mannschaft', rowSpan: 4 },
    { content: 'Telefon', rowSpan: 4 },
    { content: 'Name', rowSpan: 4 },
  ];
  for (let dg = 1; dg <= ANZAHL_DURCHGAENGE; dg++) {
    dgHead1.push({ content: `${dg}. Durchgang`, colSpan: 2, styles: { halign: 'center' } });
  }
  dgHead1.push({ content: 'Einzel', rowSpan: 4, styles: { halign: 'center' } });
  dgHead1.push({ content: 'Mannschaft', rowSpan: 4, styles: { halign: 'center' } });

  const ortRow: any[] = [{ content: 'Ort', styles: { fontStyle: 'bold' } }];
  const datumRow: any[] = [{ content: 'Datum', styles: { fontStyle: 'bold' } }];
  const uhrzeitRow: any[] = [{ content: 'Uhrzeit', styles: { fontStyle: 'bold' } }];
  for (let dg = 1; dg <= ANZAHL_DURCHGAENGE; dg++) {
    ortRow.push({ content: '', colSpan: 2 });
    datumRow.push({ content: '', colSpan: 2 });
    uhrzeitRow.push({ content: '', colSpan: 2 });
  }
  const ringRow: any[] = [];
  for (let dg = 1; dg <= ANZAHL_DURCHGAENGE; dg++) {
    ringRow.push({ content: 'Ring', styles: { halign: 'center' } });
    ringRow.push({ content: 'Gesamt', styles: { halign: 'center' } });
  }

  // Datenzeilen: leer außer Name/Mannschaft/Telefon
  const body: any[] = [];
  for (const team of data.mannschaften) {
    const istEinzel = !!team.einzel;
    const schuetzen = team.schuetzen.length > 0 ? team.schuetzen : [{ name: '' }];
    schuetzen.forEach((s, i) => {
      const zeile: any[] = [];
      if (i === 0) {
        zeile.push({ content: team.name, rowSpan: istEinzel ? schuetzen.length : schuetzen.length + 1, styles: { fontStyle: 'bold', valign: 'middle' } });
        zeile.push({ content: team.telefon || '', rowSpan: istEinzel ? schuetzen.length : schuetzen.length + 1, styles: { valign: 'middle' } });
      }
      zeile.push(s.name);
      for (let dg = 1; dg <= ANZAHL_DURCHGAENGE; dg++) {
        zeile.push('');
        zeile.push('');
      }
      zeile.push(''); // Einzel-Rang
      if (i === 0) zeile.push({ content: '', rowSpan: istEinzel ? schuetzen.length : schuetzen.length + 1 }); // Mannschaft-Rang
      body.push(zeile);
    });
    if (!istEinzel) {
      const totalZeile: any[] = [{ content: 'Mannschaft Total:', colSpan: 1, styles: { fontStyle: 'bold', halign: 'right' } }];
      for (let dg = 1; dg <= ANZAHL_DURCHGAENGE; dg++) {
        totalZeile.push('');
        totalZeile.push('');
      }
      totalZeile.push(''); // Einzel-Rang leer
      body.push(totalZeile);
    }
  }

  autoTable(doc, {
    startY: 22,
    head: [dgHead1, ortRow, datumRow, uhrzeitRow, ringRow],
    body,
    theme: 'grid',
    styles: { fontSize: 6, cellPadding: 0.8, lineWidth: 0.1, minCellHeight: 4 },
    headStyles: { fillColor: [222, 234, 246], textColor: 0, fontStyle: 'bold' },
    columnStyles: { 0: { cellWidth: 30 }, 1: { cellWidth: 18 }, 2: { cellWidth: 30 } },
  });

  doc.save(`Gesamtliste_${sanitizeFilename(data.kopf.liga)}.pdf`);
}
