import { logWarn, logError } from '@/lib/utils/secure-logger';
// src/lib/services/pdf-export-service.ts
// Gemeinsame PDF-Export-Funktionen für Startlisten

export class PDFExportService {
  static async exportStartlisteToPDF(startliste: any, config: any, meldungen: any[] = []) {
    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');
      
      const [schuetzenRes, mannschaftenRes, disziplinenRes] = await Promise.all([
        fetch('/api/shooters').catch(() => ({ ok: false })),
        fetch('/api/km/mannschaften').catch(() => ({ ok: false })),
        fetch('/api/km/disziplinen').catch(() => ({ ok: false }))
      ]);
      
      const schuetzenData = schuetzenRes.ok ? (await schuetzenRes.json().catch(() => ({ data: [] }))).data || [] : [];
      const mannschaftenData = mannschaftenRes.ok ? (await mannschaftenRes.json().catch(() => ({ data: [] }))).data || [] : [];
      const disziplinenData = disziplinenRes.ok ? (await disziplinenRes.json().catch(() => ({ data: [] }))).data || [] : [];
      
      // Schützen-Map für PDF Export
      const schuetzenMapPDF = {};
      schuetzenData.forEach(data => {
        schuetzenMapPDF[data.name] = {
          id: data.id,
          birthYear: data.birthYear,
          gender: data.gender,
          mitgliedsnummer: data.mitgliedsnummer
        };
      });
      
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      
      // Erste Seite - Vollständige Titelseite
      this.createTitlePage(doc, pageWidth, config);
      
      // Verwende gefilterte Startliste
      const gefilterteStartliste = startliste.startliste || startliste || [];
      
      // Gruppiere nur nach Startzeiten und sortiere korrekt
      const nachStartzeit = gefilterteStartliste.reduce((acc: Record<string, any[]>, s) => {
        const zeit = s.startzeit || config?.startzeit || '14:00';
        if (!acc[zeit]) acc[zeit] = [];
        acc[zeit].push(s);
        return acc;
      }, {} as Record<string, any[]>);
      
      const datum = config?.datum ? new Date(config.datum).toLocaleDateString('de-DE', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }) : 'Datum nicht angegeben';
      
      let globalStartNummer = 1;
      let isFirstStart = true;
      let currentY = 35;
      
      Object.entries(nachStartzeit)
        .sort(([zeitA], [zeitB]) => zeitA.localeCompare(zeitB)) // Sortiere Uhrzeiten korrekt
        .forEach(([startzeit, starterGruppe]: [string, any[]], startzeitIndex) => {
          if (isFirstStart) {
            doc.addPage();
            isFirstStart = false;
          } else {
            if (currentY > pageHeight - 100) {
              doc.addPage();
              currentY = 35;
            } else {
              currentY += 20;
            }
          }
          
          // Header nur bei neuer Seite
          if (currentY < 50) {
            this.createPageHeader(doc, pageWidth);
            currentY = 35;
          }
          
          // Start-Info
          this.createStartInfo(doc, globalStartNummer, datum, startzeit, config, currentY);
          currentY += 17;
          
          globalStartNummer++;
          const sortierteStarter = starterGruppe.sort((a, b) => {
            const standA = parseInt(a.stand || '999');
            const standB = parseInt(b.stand || '999');
            if (standA !== standB) return standA - standB;
            return (a.name || a.schuetzeName || '').localeCompare(b.name || b.schuetzeName || '');
          });
          
          const tableData = this.createTableData(sortierteStarter, schuetzenMapPDF, mannschaftenData, disziplinenData, meldungen);
          
          this.createTable(doc, currentY, tableData);
          currentY = (doc as any).lastAutoTable.finalY;
        });
      
      // Footer auf jeder Seite
      this.createFooter(doc);
      
      const veranstaltungsDatum = config?.datum ? new Date(config.datum).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
      const sanitizedDatum = veranstaltungsDatum.replace(/[^0-9-]/g, '');
      const sanitizedFileName = `Startliste_KM_${sanitizedDatum}.pdf`.replace(/[^a-zA-Z0-9._-]/g, '_');
      doc.save(sanitizedFileName);
      
    } catch (error) {
      logError('PDF-Export Fehler:', error);
      throw error;
    }
  }
  
  private static createTitlePage(doc: any, pageWidth: number, config: any) {
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('KREISSCHÜTZENVERBAND', pageWidth / 2, 40, { align: 'center' });
    doc.text('EINBECK e.V.', pageWidth / 2, 55, { align: 'center' });
    
    // Logo laden und einfügen
    try {
      const logoImg = new Image();
      logoImg.src = '/images/logo2.png';
      
      logoImg.onload = () => {
        doc.addImage(logoImg, 'PNG', pageWidth / 2 - 25, 70, 50, 50);
      };
      
      logoImg.onerror = () => {
        logWarn('Logo konnte nicht geladen werden');
      };
    } catch (error) {
      logWarn('Logo konnte nicht geladen werden:', { data: error });
    }
    
    doc.setFontSize(20);
    doc.text(`Kreisverbandsmeisterschaft ${new Date().getFullYear()}`, pageWidth / 2, 140, { align: 'center' });
    
    doc.setFontSize(18);
    doc.text('Startlisten', pageWidth / 2, 160, { align: 'center' });
    
    // Disziplinen mit Bullet-Points
    doc.setFontSize(16);
    doc.setFont('helvetica', 'normal');
    const disziplinText = config?.selectedDisziplinen?.join(' • ') || 'Alle Disziplinen';
    doc.text(disziplinText, pageWidth / 2, 190, { align: 'center' });
  }
  
  private static createPageHeader(doc: any, pageWidth: number) {
    try {
      const logoImg = new Image();
      logoImg.src = '/images/logo2.png';
      
      logoImg.onload = () => {
        doc.addImage(logoImg, 'PNG', 15, 10, 20, 20);
      };
      
      logoImg.onerror = () => {
        logWarn('Logo konnte nicht geladen werden');
      };
    } catch (error) {
      logWarn('Logo konnte nicht geladen werden', { data: error });
    }
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('KREISSCHÜTZENVERBAND EINBECK e.V.', 40, 15);
    doc.text('- Kreisschießsportleiterin -', 40, 22);
    
    doc.setFont('helvetica', 'normal');
    doc.line(40, 25, pageWidth - 20, 25);
  }
  
  private static createStartInfo(doc: any, startNummer: number, datum: string, startzeit: string, config: any, currentY: number) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    const austragungsort = config?.austragungsort || 'ESG Einbeck';
    doc.text(`Start ${startNummer} am: ${datum} um ${startzeit} Uhr im Schützenhaus ${austragungsort}`, 20, currentY);
    doc.text(`Schießzeit pro Durchgang = ${config?.durchgang || 50} Minuten`, 20, currentY + 7);
  }
  
  private static createTableData(starter: any[], schuetzenMapPDF: any, mannschaftenData: any[], disziplinenData: any[], meldungen: any[]) {
    // Create lookup maps for better performance
    const mannschaftsSchuetzenIds = new Set(
      mannschaftenData.flatMap(m => m.schuetzenIds || [])
    );
    
    const disziplinMap = new Map(
      disziplinenData.map(d => [d.name, d.spoNummer])
    );
    
    return starter.map((s) => {
      const schuetze = schuetzenMapPDF[s.name || s.schuetzeName];
      let mitgliedsNr = '08-000-0000';
      if (schuetze?.mitgliedsnummer) {
        const mitgliedsNummerStr = schuetze.mitgliedsnummer.toString();
        if (mitgliedsNummerStr.length >= 7) {
          const teil1 = mitgliedsNummerStr.substring(1, 4).padStart(3, '0');
          const teil2 = mitgliedsNummerStr.substring(4).padStart(3, '0');
          mitgliedsNr = `08-${teil1}-${teil2}`;
        }
      }
      
      const nameParts = (s.name || s.schuetzeName || '').split(' ');
      const nachname = nameParts[nameParts.length - 1];
      const vorname = nameParts.slice(0, -1).join(' ');
      
      // E/M: Prüfe ob Schütze in Mannschaft
      const istMannschaft = schuetze?.id ? mannschaftsSchuetzenIds.has(schuetze.id) : false;
      const einzelMannschaft = istMannschaft ? 'M' : 'E';
      
      // LM: Suche in ursprünglichen Meldungen
      const originalMeldung = meldungen.find(m => m.name === (s.name || s.schuetzeName) && m.disziplin === s.disziplin);
      const lmTeilnahme = originalMeldung?.lmTeilnahme === true;
      
      // Altersklasse berechnen
      let korrekteAltersklasse = 'Unbekannt';
      if (schuetze?.birthYear) {
        const age = (new Date().getFullYear()) - schuetze.birthYear;
        const isAuflage = s.disziplin?.toLowerCase().includes('auflage');
        const isMale = schuetze.gender === 'male';
        
        if (age <= 14) korrekteAltersklasse = 'Schüler';
        else if (age <= 16) korrekteAltersklasse = 'Jugend';
        else if (age <= 18) korrekteAltersklasse = `Junioren II ${isMale ? 'm' : 'w'}`;
        else if (age <= 20) korrekteAltersklasse = `Junioren I ${isMale ? 'm' : 'w'}`;
        else if (isAuflage) {
          if (age <= 40) korrekteAltersklasse = `${isMale ? 'Herren' : 'Damen'} I`;
          else if (age <= 50) korrekteAltersklasse = 'Senioren 0';
          else if (age <= 60) korrekteAltersklasse = 'Senioren I';
          else if (age <= 65) korrekteAltersklasse = 'Senioren II';
          else if (age <= 70) korrekteAltersklasse = 'Senioren III';
          else if (age <= 75) korrekteAltersklasse = 'Senioren IV';
          else if (age <= 80) korrekteAltersklasse = 'Senioren V';
          else korrekteAltersklasse = 'Senioren VI';
        } else {
          if (age <= 40) korrekteAltersklasse = `${isMale ? 'Herren' : 'Damen'} I`;
          else if (age <= 50) korrekteAltersklasse = `${isMale ? 'Herren' : 'Damen'} II`;
          else if (age <= 60) korrekteAltersklasse = `${isMale ? 'Herren' : 'Damen'} III`;
          else if (age <= 70) korrekteAltersklasse = `${isMale ? 'Herren' : 'Damen'} IV`;
          else korrekteAltersklasse = `${isMale ? 'Herren' : 'Damen'} V`;
        }
      }
      
      // Hole SPO-Nummer
      const spoNummer = disziplinMap.get(s.disziplin) || '1.41';
      
      return [
        s.stand || 'N/A',
        mitgliedsNr,
        nachname,
        vorname,
        s.verein,
        spoNummer,
        korrekteAltersklasse,
        einzelMannschaft,
        lmTeilnahme ? 'J' : 'N'
      ];
    });
  }
  
  private static createTable(doc: any, startY: number, tableData: any[]) {
    const { default: autoTable } = require('jspdf-autotable');
    
    autoTable(doc, {
      startY: startY,
      head: [['Stand', 'Mitgl.-Nr.', 'Name', 'Vorname', 'Verein', 'Disz.', 'WKl', 'E/M', 'LM']],
      body: tableData,
      styles: { 
        fontSize: 9,
        cellPadding: 3,
        textColor: [0, 0, 0],
        fillColor: [255, 255, 255],
        valign: 'middle',
        halign: 'center',
        minCellHeight: 16,
        cellHeight: 16
      },
      headStyles: { 
        fillColor: [220, 220, 220],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        lineWidth: 1,
        lineColor: [0, 0, 0]
      },
      bodyStyles: {
        lineWidth: 0.8,
        lineColor: [0, 0, 0],
        textColor: [0, 0, 0]
      },
      margin: { left: 10, right: 10 },
      columnStyles: {
        0: { cellWidth: 18 },
        1: { cellWidth: 25 },
        2: { cellWidth: 25 },
        3: { cellWidth: 25 },
        4: { cellWidth: 35 },
        5: { cellWidth: 18 },
        6: { cellWidth: 25 },
        7: { cellWidth: 12 },
        8: { cellWidth: 12 }
      }
    });
  }
  
  private static createFooter(doc: any) {
    const totalPages = doc.getNumberOfPages();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const footerDate = new Date().toLocaleDateString('de-DE');
    
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(
        `Erstellt am ${footerDate} - RWK Einbeck`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
      doc.text(`Seite ${i} von ${totalPages}`, pageWidth - 20, pageHeight - 10, { align: 'right' });
    }
  }
}