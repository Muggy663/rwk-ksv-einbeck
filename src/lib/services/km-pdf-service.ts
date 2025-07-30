// src/lib/services/km-pdf-service.ts
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import type { KMMeldung, KMDisziplin, Shooter, Club, KMMannschaft } from '@/types';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export async function generateMeldelistePDF(
  meldungen: KMMeldung[],
  disziplinen: KMDisziplin[],
  schuetzen: Shooter[],
  vereine: Club[]
): Promise<Blob> {
  
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(16);
  doc.text('Kreismeisterschaft 2026 - Meldeliste', 20, 20);
  
  doc.setFontSize(10);
  doc.text(`Erstellt am: ${new Date().toLocaleDateString('de-DE')}`, 20, 30);
  doc.text(`Anzahl Meldungen: ${meldungen.length}`, 20, 35);
  
  // Tabelle
  const tableData = meldungen.map(meldung => {
    const schuetze = schuetzen.find(s => s.id === meldung.schuetzeId);
    const verein = vereine.find(v => v.id === schuetze?.clubId);
    const disziplin = disziplinen.find(d => d.id === meldung.disziplinId);
    
    return [
      schuetze?.name || 'Unbekannt',
      verein?.name || 'Unbekannt',
      disziplin ? `${disziplin.spoNummer} ${disziplin.name}` : 'Unbekannt',
      meldung.lmTeilnahme ? 'Ja' : 'Nein',
      meldung.vmErgebnis ? meldung.vmErgebnis.ringe.toString() : '-',
      meldung.anmerkung || ''
    ];
  });
  
  doc.autoTable({
    head: [['Name', 'Verein', 'Disziplin', 'LM', 'VM-Ringe', 'Anmerkung']],
    body: tableData,
    startY: 45,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [41, 128, 185] }
  });
  
  return new Blob([doc.output('blob')], { type: 'application/pdf' });
}

export async function generateStartlistePDF(
  mannschaften: KMMannschaft[],
  disziplinen: KMDisziplin[],
  schuetzen: Shooter[],
  vereine: Club[]
): Promise<Blob> {
  
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(16);
  doc.text('Kreismeisterschaft 2026 - Startliste', 20, 20);
  
  doc.setFontSize(10);
  doc.text(`Erstellt am: ${new Date().toLocaleDateString('de-DE')}`, 20, 30);
  doc.text(`Anzahl Mannschaften: ${mannschaften.length}`, 20, 35);
  
  let yPosition = 50;
  
  // Gruppiere nach Disziplin
  const disziplinGruppen = new Map<string, KMMannschaft[]>();
  mannschaften.forEach(mannschaft => {
    if (!disziplinGruppen.has(mannschaft.disziplinId)) {
      disziplinGruppen.set(mannschaft.disziplinId, []);
    }
    disziplinGruppen.get(mannschaft.disziplinId)!.push(mannschaft);
  });
  
  for (const [disziplinId, disziplinMannschaften] of disziplinGruppen) {
    const disziplin = disziplinen.find(d => d.id === disziplinId);
    
    // Disziplin-Header
    doc.setFontSize(12);
    doc.text(`${disziplin?.spoNummer} ${disziplin?.name}`, 20, yPosition);
    yPosition += 10;
    
    // Mannschaften-Tabelle
    const tableData = disziplinMannschaften.map((mannschaft, index) => {
      const verein = vereine.find(v => v.id === mannschaft.vereinId);
      const schuetzenNamen = mannschaft.schuetzenIds
        .map(id => schuetzen.find(s => s.id === id)?.name || 'Unbekannt')
        .join(', ');
      
      return [
        `Team ${index + 1}`,
        verein?.name || 'Unbekannt',
        mannschaft.wettkampfklassen.join(', '),
        schuetzenNamen,
        mannschaft.geschlechtGemischt ? 'Ja' : 'Nein'
      ];
    });
    
    doc.autoTable({
      head: [['Team', 'Verein', 'Klasse', 'Schützen', 'Gemischt']],
      body: tableData,
      startY: yPosition,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [52, 152, 219] }
    });
    
    yPosition = (doc as any).lastAutoTable.finalY + 15;
    
    // Neue Seite wenn nötig
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }
  }
  
  return new Blob([doc.output('blob')], { type: 'application/pdf' });
}

export async function generateLMMeldungenPDF(
  meldungen: KMMeldung[],
  disziplinen: KMDisziplin[],
  schuetzen: Shooter[],
  vereine: Club[]
): Promise<Blob> {
  
  const lmMeldungen = meldungen.filter(m => m.lmTeilnahme);
  
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(16);
  doc.text('Kreismeisterschaft 2026 - LM-Meldungen', 20, 20);
  
  doc.setFontSize(10);
  doc.text(`Erstellt am: ${new Date().toLocaleDateString('de-DE')}`, 20, 30);
  doc.text(`Anzahl LM-Meldungen: ${lmMeldungen.length}`, 20, 35);
  
  // Tabelle
  const tableData = lmMeldungen.map(meldung => {
    const schuetze = schuetzen.find(s => s.id === meldung.schuetzeId);
    const verein = vereine.find(v => v.id === schuetze?.clubId);
    const disziplin = disziplinen.find(d => d.id === meldung.disziplinId);
    
    return [
      schuetze?.name || 'Unbekannt',
      schuetze?.birthYear?.toString() || '-',
      schuetze?.gender === 'male' ? 'M' : 'W',
      verein?.name || 'Unbekannt',
      disziplin ? `${disziplin.spoNummer} ${disziplin.name}` : 'Unbekannt',
      meldung.vmErgebnis ? meldung.vmErgebnis.ringe.toString() : '-'
    ];
  });
  
  doc.autoTable({
    head: [['Name', 'Jahrgang', 'Geschlecht', 'Verein', 'Disziplin', 'VM-Ringe']],
    body: tableData,
    startY: 45,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [231, 76, 60] }
  });
  
  return new Blob([doc.output('blob')], { type: 'application/pdf' });
}