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

interface CertificateOptions {
  title?: string;
  season: string;
  discipline: string;
  category: string;
  recipientName: string;
  teamMembers?: string[];
  score: number | string;
  rank: number;
  date?: string;
  orientation?: 'portrait' | 'landscape';
}

export class CertificateGenerator {
  private doc: jsPDF;
  private pageWidth: number;
  private pageHeight: number;
  private margin = 20;

  constructor(options: { orientation?: 'portrait' | 'landscape' }) {
    this.doc = new jsPDF({
      orientation: options.orientation || 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();

    // Metadaten setzen
    this.doc.setProperties({
      title: 'Urkunde',
      subject: 'Rundenwettkampf Einbeck',
      author: 'Kreisschützenverband Einbeck e.V.',
      keywords: 'urkunde,rwk,einbeck,schützen'
    });

    // Standardschriftart setzen
    this.doc.setFont('helvetica', 'normal');
  }

  /**
   * Generiert eine Urkunde für einen Schützen oder eine Mannschaft
   */
  generateCertificate(options: CertificateOptions): void {
    try {
      // Weißer Hintergrund
      this.doc.setFillColor(255, 255, 255);
      this.doc.rect(0, 0, this.pageWidth, this.pageHeight, 'F');
      
      // Rahmen
      this.doc.setDrawColor(0, 0, 0);
      this.doc.setLineWidth(0.5);
      this.doc.rect(this.margin, this.margin, this.pageWidth - 2 * this.margin, this.pageHeight - 2 * this.margin, 'S');
      
      // Logo links oben - Verwende einen relativen Pfad für Vercel-Kompatibilität
      try {
        // Vercel benötigt einen absoluten Pfad relativ zum public-Verzeichnis
        this.doc.addImage(
          '/images/logo2.png', // Statt direktem Dateipfad
          'PNG',
          this.margin + 10,
          this.margin + 10,
          25,
          25
        );
      } catch (error) {
        console.error('Fehler beim Hinzufügen des Logos:', error);
        // Fehler beim Hinzufügen des Logos ignorieren
      }
      
      // NSSV-Logo rechts oben
      try {
        this.doc.addImage(
          '/images/nssv.png',
          'PNG',
          this.pageWidth - this.margin - 35,
          this.margin + 10,
          25,
          25
        );
      } catch (error) {
        console.error('Fehler beim Hinzufügen des NSSV-Logos:', error);
        // Fehler beim Hinzufügen des Logos ignorieren
      }
      
      // Titel "Urkunde" in Gold mit Monotype Corsiva
      this.doc.setFontSize(36);
      this.doc.setFont('times', 'italic'); // Annäherung an Monotype Corsiva
      this.doc.setTextColor(218, 165, 32); // Goldfarbe
      this.doc.text('Urkunde', this.pageWidth / 2, this.margin + 50, { align: 'center' });
      this.doc.setTextColor(0, 0, 0); // Zurück zu schwarz
      
      // "Beim Rundenwettkampf [Jahr]" und "[Liga]" auf separaten Zeilen
      this.doc.setFontSize(16);
      this.doc.setFont('helvetica', 'normal');
      
      // Entferne "RWK" aus dem Saisonnamen, wenn es vorhanden ist
      const seasonName = options.season.replace('RWK ', '');
      
      this.doc.text(`Beim Rundenwettkampf ${seasonName}`, this.pageWidth / 2, this.margin + 70, { align: 'center' });
      this.doc.text(`${options.discipline}`, this.pageWidth / 2, this.margin + 85, { align: 'center' });
      this.doc.text(`${options.category}`, this.pageWidth / 2, this.margin + 100, { align: 'center' });
      
      // "errang"
      this.doc.setFontSize(14);
      this.doc.text('errang', this.pageWidth / 2, this.margin + 120, { align: 'center' });
      
      // Empfänger (Schütze oder Mannschaft) - ohne Klammern
      this.doc.setFontSize(18);
      this.doc.setFont('helvetica', 'bold');
      
      // Entferne Klammern aus dem Namen
      const cleanName = options.recipientName.replace(/\s*\([^)]*\)/g, '');
      
      this.doc.text(cleanName, this.pageWidth / 2, this.margin + 140, { align: 'center' });
      
      // Teammitglieder (falls vorhanden)
      if (options.teamMembers && options.teamMembers.length > 0) {
        this.doc.setFontSize(12);
        this.doc.setFont('helvetica', 'normal');
        let yPos = this.margin + 150;
        
        options.teamMembers.forEach(member => {
          this.doc.text(member, this.pageWidth / 2, yPos, { align: 'center' });
          yPos += 10;
        });
        
        // Ergebnis
        this.doc.setFontSize(16);
        this.doc.setFont('helvetica', 'bold');
        this.doc.text(`${options.score} Ring`, this.pageWidth / 2, yPos + 15, { align: 'center' });
      } else {
        // Ergebnis (für Einzelschützen)
        this.doc.setFontSize(16);
        this.doc.setFont('helvetica', 'bold');
        this.doc.text(`${options.score} Ring`, this.pageWidth / 2, this.margin + 160, { align: 'center' });
      }
      
      // Platzierung
      this.doc.setFontSize(16);
      this.doc.text(`den     ${options.rank}.    Platz`, this.pageWidth / 2, this.margin + 185, { align: 'center' });
      
      // Verband in Grün
      this.doc.setFontSize(14);
      this.doc.setFont('helvetica', 'bold');
      this.doc.setTextColor(0, 128, 0); // Grüne Farbe
      this.doc.text('KREISSCHÜTZENVERBAND EINBECK e.V.', this.pageWidth / 2, this.pageHeight - this.margin - 60, { align: 'center' });
      this.doc.setTextColor(0, 0, 0); // Zurück zu schwarz
      
      // Unterschriftslinien
      this.doc.setLineWidth(0.5);
      this.doc.setDrawColor(0, 0, 0);
      
      // Unterschrift links (Präsident)
      this.doc.line(
        this.margin + 30,
        this.pageHeight - this.margin - 40,
        this.margin + 80,
        this.pageHeight - this.margin - 40
      );
      this.doc.setFontSize(10);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text('Präsident', this.margin + 55, this.pageHeight - this.margin - 30, { align: 'center' });
      
      // Unterschrift rechts (Rundenwettkampfleiter)
      this.doc.line(
        this.pageWidth - this.margin - 80,
        this.pageHeight - this.margin - 40,
        this.pageWidth - this.margin - 30,
        this.pageHeight - this.margin - 40
      );
      this.doc.text('Rundenwettkampfleiter', this.pageWidth - this.margin - 55, this.pageHeight - this.margin - 30, { align: 'center' });
      
      // Datum am unteren Ende der Seite
      const dateText = options.date || `Einbeck, ${format(new Date(), 'dd. MMMM yyyy', { locale: de })}`;
      this.doc.text(dateText, this.pageWidth / 2, this.pageHeight - this.margin - 10, { align: 'center' });
    } catch (error) {
      console.error('Fehler beim Generieren der Urkunde:', error);
      // Fallback: Einfache Fehlermeldung
      this.doc.setFontSize(14);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('Fehler beim Generieren der Urkunde', this.margin, this.margin + 50);
    }
  }

  /**
   * Fügt eine neue Seite hinzu
   */
  addPage(): void {
    this.doc.addPage();
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