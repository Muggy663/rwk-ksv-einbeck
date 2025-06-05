import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

// Erweitere den jsPDF-Typ um die autotable-Funktion
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

interface PdfGeneratorOptions {
  title: string;
  subtitle?: string;
  author?: string;
  subject?: string;
  keywords?: string;
  orientation?: 'portrait' | 'landscape';
  pageSize?: string;
  headerImage?: string; // Base64-kodiertes Bild
  footerText?: string;
}

interface TableColumn {
  header: string;
  dataKey: string;
  width?: number;
}

interface TableData {
  columns: TableColumn[];
  rows: any[];
  title?: string;
}

export class PdfGenerator {
  private doc: jsPDF;
  private options: PdfGeneratorOptions;
  private pageWidth: number;
  private pageHeight: number;
  private margin = 15;

  constructor(options: PdfGeneratorOptions) {
    this.options = {
      orientation: 'portrait',
      pageSize: 'a4',
      author: 'RWK Einbeck App',
      subject: 'Rundenwettkampf Einbeck',
      keywords: 'rwk,einbeck,schützen',
      ...options
    };

    this.doc = new jsPDF({
      orientation: this.options.orientation,
      unit: 'mm',
      format: this.options.pageSize
    });

    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();

    // Metadaten setzen
    this.doc.setProperties({
      title: this.options.title,
      subject: this.options.subject,
      author: this.options.author,
      keywords: this.options.keywords
    });

    // Standardschriftart setzen
    this.doc.setFont('helvetica', 'normal');
  }

  /**
   * Fügt eine Kopfzeile mit Titel und optionalem Logo hinzu
   */
  addHeader(): void {
    const headerHeight = 25;
    
    // Logo rechts oben
    try {
      // Kreisverbandslogo aus dem public-Ordner laden
      this.doc.addImage(
        '/images/logo2.png',
        'PNG',
        this.pageWidth - this.margin - 35,
        this.margin,
        25,
        25
      );
    } catch (error) {
      console.error('Fehler beim Hinzufügen des Logos:', error);
      // Fehler beim Hinzufügen des Logos ignorieren
    }

    // Titel
    this.doc.setFontSize(18);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(
      this.options.title,
      this.margin,
      this.margin + 10
    );

    // Untertitel
    if (this.options.subtitle) {
      this.doc.setFontSize(12);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(
        this.options.subtitle,
        this.margin,
        this.margin + 18
      );
    }

    // Trennlinie
    this.doc.setDrawColor(200, 200, 200);
    this.doc.setLineWidth(0.5);
    this.doc.line(
      this.margin,
      this.margin + headerHeight,
      this.pageWidth - this.margin,
      this.margin + headerHeight
    );
  }

  /**
   * Fügt eine Fußzeile mit Seitenzahl und Datum hinzu
   */
  addFooter(): void {
    const totalPages = this.doc.internal.getNumberOfPages();
    
    for (let i = 1; i <= totalPages; i++) {
      this.doc.setPage(i);
      
      // Datum und Uhrzeit
      const now = format(new Date(), 'dd.MM.yyyy HH:mm', { locale: de });
      this.doc.setFontSize(8);
      this.doc.setTextColor(100, 100, 100);
      this.doc.text(`Erstellt am: ${now}`, this.margin, this.pageHeight - 10);
      
      // Seitenzahl
      this.doc.text(
        `Seite ${i} von ${totalPages}`,
        this.pageWidth - this.margin - 25,
        this.pageHeight - 10
      );
      
      // Benutzerdefinierter Fußzeilentext
      if (this.options.footerText) {
        this.doc.text(
          this.options.footerText,
          this.pageWidth / 2,
          this.pageHeight - 10,
          { align: 'center' }
        );
      }
    }
  }

  /**
   * Fügt eine Tabelle hinzu
   */
  addTable(tableData: TableData, startY?: number): void {
    const tableStartY = startY || this.margin + 30;
    
    // Tabellentitel
    if (tableData.title) {
      this.doc.setFontSize(14);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(tableData.title, this.margin, tableStartY - 5);
    }
    
    // Tabelle erstellen
    try {
      this.doc.autoTable({
        startY: tableStartY,
        head: [tableData.columns.map(col => col.header)],
        body: tableData.rows.map(row => 
          tableData.columns.map(col => {
            // Sicherstellen, dass undefined oder null als leerer String dargestellt wird
            const value = row[col.dataKey];
            return value !== undefined && value !== null ? value : '';
          })
        ),
        margin: { top: this.margin, right: this.margin, bottom: this.margin, left: this.margin },
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: 255,
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: [240, 240, 240]
        },
        columnStyles: tableData.columns.reduce((styles, col, index) => {
          if (col.width) {
            styles[index] = { cellWidth: col.width };
          }
          return styles;
        }, {} as Record<number, { cellWidth: number }>),
        // Verbesserte Fehlerbehandlung für Umlaute
        didDrawCell: (data) => {
          // Nichts tun, aber die Funktion ist notwendig für die Fehlerbehandlung
        }
      });
    } catch (error) {
      console.error('Fehler beim Erstellen der Tabelle:', error);
      // Fallback: Einfache Tabelle ohne Formatierung
      this.doc.setFontSize(10);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text('Fehler beim Erstellen der Tabelle. Bitte versuchen Sie es erneut.', this.margin, tableStartY + 10);
    }
  }

  /**
   * Fügt einen Textabschnitt hinzu
   */
  addText(text: string, x: number, y: number, options?: { fontSize?: number; fontStyle?: string; align?: string }): void {
    const fontSize = options?.fontSize || 10;
    const fontStyle = options?.fontStyle || 'normal';
    const align = options?.align || 'left';
    
    this.doc.setFontSize(fontSize);
    this.doc.setFont('helvetica', fontStyle as any);
    
    try {
      this.doc.text(text || '', x, y, { align: align as any });
    } catch (error) {
      console.error('Fehler beim Hinzufügen von Text:', error);
      // Fallback: Text ohne spezielle Formatierung
      this.doc.text('Fehler beim Hinzufügen von Text', x, y);
    }
  }

  /**
   * Generiert eine Ergebnisliste für eine Liga
   */
  generateLeagueResults(leagueData: {
    leagueName: string;
    season: string;
    teams: Array<{
      rank: number;
      name: string;
      roundResults: Record<string, number | null>;
      totalScore: number;
      averageScore: number | null;
    }>;
    numRounds: number;
  }): void {
    try {
      // Header hinzufügen
      this.addHeader();
      
      // Ligainformationen
      this.addText(`Liga: ${leagueData.leagueName || 'Unbekannt'}`, this.margin, this.margin + 35, { fontSize: 14, fontStyle: 'bold' });
      
      // Saison ohne "RWK" anzeigen
      const seasonName = (leagueData.season || 'Unbekannt').replace('RWK ', '');
      this.addText(`Saison: ${seasonName}`, this.margin + 200, this.margin + 35, { fontSize: 14 });
      
      // Tabellenspalten definieren
      const columns: TableColumn[] = [
        { header: 'Platz', dataKey: 'rank', width: 15 },
        { header: 'Mannschaft', dataKey: 'name', width: 60 }
      ];
      
      // Durchgänge als Spalten hinzufügen
      for (let i = 1; i <= (leagueData.numRounds || 0); i++) {
        columns.push({ header: `DG ${i}`, dataKey: `dg${i}`, width: 20 });
      }
      
      // Gesamt und Schnitt hinzufügen
      columns.push({ header: 'Gesamt', dataKey: 'totalScore', width: 25 });
      columns.push({ header: 'Schnitt', dataKey: 'averageScore', width: 25 });
      
      // Tabellendaten aufbereiten
      const rows = (leagueData.teams || []).map(team => {
        const rowData: Record<string, any> = {
          rank: team.rank || '',
          name: team.name || 'Unbekannt',
          totalScore: team.totalScore || 0,
          averageScore: team.averageScore !== null ? team.averageScore.toFixed(2) : '-'
        };
        
        // Durchgangsergebnisse hinzufügen
        for (let i = 1; i <= (leagueData.numRounds || 0); i++) {
          const key = `dg${i}`;
          rowData[key] = team.roundResults && team.roundResults[key] !== null ? team.roundResults[key] : '-';
        }
        
        return rowData;
      });
      
      // Tabelle hinzufügen
      this.addTable({
        title: 'Mannschaftsergebnisse',
        columns,
        rows
      }, this.margin + 50);
      
      // Fußzeile hinzufügen
      this.addFooter();
    } catch (error) {
      console.error('Fehler beim Generieren der Ligaergebnisse:', error);
      // Fallback: Einfache Fehlermeldung
      this.doc.setFontSize(14);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('Fehler beim Generieren der Ligaergebnisse', this.margin, this.margin + 50);
      this.addFooter();
    }
  }

  /**
   * Generiert eine Einzelschützenliste für eine Liga
   */
  generateShooterResults(shooterData: {
    leagueName: string;
    season: string;
    shooters: Array<{
      rank: number;
      name: string;
      teamName: string;
      gender?: string;
      results: Record<string, number | null>;
      totalScore: number;
      averageScore: number | null;
    }>;
    numRounds: number;
    genderFilter?: 'all' | 'male' | 'female';
  }): void {
    try {
      // Header hinzufügen
      this.addHeader();
      
      // Ligainformationen
      this.addText(`Liga: ${shooterData.leagueName || 'Unbekannt'}`, this.margin, this.margin + 35, { fontSize: 14, fontStyle: 'bold' });
      
      // Saison ohne "RWK" anzeigen
      const seasonName = (shooterData.season || 'Unbekannt').replace('RWK ', '');
      this.addText(`Saison: ${seasonName}`, this.margin + 200, this.margin + 35, { fontSize: 14 });
      
      // Geschlechterfilter-Info hinzufügen, falls vorhanden
      if (shooterData.genderFilter && shooterData.genderFilter !== 'all') {
        const genderText = shooterData.genderFilter === 'male' ? 'Männlich' : 'Weiblich';
        this.addText(`Filter: ${genderText}`, this.margin + 350, this.margin + 35, { fontSize: 14 });
      }
      
      // Tabellenspalten definieren
      const columns: TableColumn[] = [
        { header: 'Platz', dataKey: 'rank', width: 15 },
        { header: 'Name', dataKey: 'name', width: 50 },
        { header: 'Mannschaft', dataKey: 'teamName', width: 50 }
      ];
      
      // Geschlecht als Spalte hinzufügen, wenn alle angezeigt werden
      if (shooterData.genderFilter === 'all' && shooterData.leagueName === 'Gesamtrangliste') {
        columns.push({ header: 'Geschl.', dataKey: 'genderDisplay', width: 20 });
      }
      
      // Durchgänge als Spalten hinzufügen mit mehr Abstand
      for (let i = 1; i <= (shooterData.numRounds || 0); i++) {
        columns.push({ header: `DG ${i}`, dataKey: `dg${i}`, width: 25 });
      }
      
      // Gesamt und Schnitt hinzufügen
      columns.push({ header: 'Gesamt', dataKey: 'totalScore', width: 25 });
      columns.push({ header: 'Schnitt', dataKey: 'averageScore', width: 25 });
      
      // Tabellendaten aufbereiten
      const rows = (shooterData.shooters || []).map(shooter => {
        const rowData: Record<string, any> = {
          rank: shooter.rank || '',
          name: shooter.name || 'Unbekannt',
          teamName: shooter.teamName || 'Unbekanntes Team',
          genderDisplay: shooter.gender === 'male' ? 'M' : shooter.gender === 'female' ? 'W' : '-',
          totalScore: shooter.totalScore || 0,
          averageScore: shooter.averageScore !== null ? shooter.averageScore.toFixed(2) : '-'
        };
        
        // Durchgangsergebnisse hinzufügen
        for (let i = 1; i <= (shooterData.numRounds || 0); i++) {
          const key = `dg${i}`;
          rowData[key] = shooter.results && shooter.results[key] !== null ? shooter.results[key] : '-';
        }
        
        return rowData;
      });
      
      // Tabelle hinzufügen
      this.addTable({
        title: 'Einzelschützenergebnisse',
        columns,
        rows
      }, this.margin + 50);
      
      // Fußzeile hinzufügen
      this.addFooter();
    } catch (error) {
      console.error('Fehler beim Generieren der Einzelschützenergebnisse:', error);
      // Fallback: Einfache Fehlermeldung
      this.doc.setFontSize(14);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('Fehler beim Generieren der Einzelschützenergebnisse', this.margin, this.margin + 50);
      this.addFooter();
    }
  }

  /**
   * Generiert eine Urkunde für einen Schützen oder eine Mannschaft
   */
  generateCertificate(data: {
    title: string;
    recipientName: string;
    achievement: string;
    date: string;
    signature?: string;
    additionalText?: string;
  }): void {
    try {
      // Seitenränder für die Urkunde
      const margin = 30;
      
      // Hintergrund (optional)
      this.doc.setFillColor(252, 252, 252);
      this.doc.rect(0, 0, this.pageWidth, this.pageHeight, 'F');
      
      // Rahmen
      this.doc.setDrawColor(128, 128, 128);
      this.doc.setLineWidth(1);
      this.doc.rect(margin, margin, this.pageWidth - 2 * margin, this.pageHeight - 2 * margin, 'S');
      
      // Innerer Rahmen
      this.doc.setDrawColor(100, 100, 100);
      this.doc.setLineWidth(0.5);
      this.doc.rect(margin + 5, margin + 5, this.pageWidth - 2 * (margin + 5), this.pageHeight - 2 * (margin + 5), 'S');
      
      // Titel
      this.doc.setFontSize(24);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('URKUNDE', this.pageWidth / 2, margin + 30, { align: 'center' });
      
      // Untertitel
      this.doc.setFontSize(16);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(data.title || '', this.pageWidth / 2, margin + 45, { align: 'center' });
      
      // Empfänger
      this.doc.setFontSize(18);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(data.recipientName || '', this.pageWidth / 2, this.pageHeight / 2 - 20, { align: 'center' });
      
      // Leistung
      this.doc.setFontSize(14);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(data.achievement || '', this.pageWidth / 2, this.pageHeight / 2, { align: 'center' });
      
      // Zusätzlicher Text
      if (data.additionalText) {
        this.doc.setFontSize(12);
        this.doc.text(data.additionalText, this.pageWidth / 2, this.pageHeight / 2 + 20, { align: 'center' });
      }
      
      // Datum
      this.doc.setFontSize(12);
      this.doc.text(data.date || '', this.pageWidth / 2, this.pageHeight - margin - 40, { align: 'center' });
      
      // Unterschriftslinie
      this.doc.setLineWidth(0.5);
      this.doc.line(
        this.pageWidth / 2 - 40,
        this.pageHeight - margin - 30,
        this.pageWidth / 2 + 40,
        this.pageHeight - margin - 30
      );
      
      // Unterschrift (falls vorhanden)
      if (data.signature) {
        this.doc.setFontSize(10);
        this.doc.text(data.signature, this.pageWidth / 2, this.pageHeight - margin - 20, { align: 'center' });
      }
    } catch (error) {
      console.error('Fehler beim Generieren der Urkunde:', error);
      // Fallback: Einfache Fehlermeldung
      this.doc.setFontSize(14);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('Fehler beim Generieren der Urkunde', this.margin, this.margin + 50);
    }
  }

  /**
   * Speichert das PDF oder gibt es als Blob zurück
   */
  save(filename?: string): string | Blob {
    try {
      if (filename) {
        this.doc.save(filename);
        return filename;
      } else {
        return this.doc.output('blob');
      }
    } catch (error) {
      console.error('Fehler beim Speichern des PDFs:', error);
      // Fallback: Leeres Blob zurückgeben
      return new Blob(['Fehler beim Generieren des PDFs'], { type: 'text/plain' });
    }
  }

  /**
   * Öffnet das PDF in einem neuen Tab
   */
  open(): void {
    try {
      const pdfBlob = this.doc.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      window.open(pdfUrl, '_blank');
    } catch (error) {
      console.error('Fehler beim Öffnen des PDFs:', error);
      alert('Fehler beim Öffnen des PDFs. Bitte versuchen Sie es erneut.');
    }
  }
}