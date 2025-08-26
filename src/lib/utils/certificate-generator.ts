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
  teamMembersWithScores?: Array<{name: string; totalScore: number; rounds: number; averageScore: number}>;
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
      
      // Entferne "RWK" und doppelte Disziplin-Namen aus dem Saisonnamen
      const seasonName = options.season
        .replace('RWK ', '')
        .replace(/Kleinkaliber\s+Kleinkaliber/g, 'Kleinkaliber')
        .replace(/Luftdruck\s+Luftdruck/g, 'Luftdruck');
      
      // Für Gesamtsieger keine Disziplin in der ersten Zeile, da sie in der Kategorie steht
      const isOverallWinner = options.category.includes('Bester') || options.category.includes('Beste');
      
      // Entferne auch doppelte Disziplin-Namen aus options.discipline
      const cleanDiscipline = options.discipline.replace(/Kleinkaliber\s+Kleinkaliber/g, 'Kleinkaliber').replace(/Luftdruck\s+Luftdruck/g, 'Luftdruck');
      
      const firstLineText = `Beim Rundenwettkampf ${seasonName}`;
      this.doc.text(firstLineText, this.pageWidth / 2, this.margin + 65, { align: 'center' });
      
      // "wurde" für Gesamtsieger, "errang" für Liga-Plätze
      this.doc.setFontSize(14);
      const verbText = options.category.includes('Bester') || options.category.includes('Beste') ? 'wurde' : 'errang';
      this.doc.text(verbText, this.pageWidth / 2, this.margin + 80, { align: 'center' });
      
      // Empfänger (Schütze oder Mannschaft)
      this.doc.setFontSize(18);
      this.doc.setFont('helvetica', 'bold');
      
      if (options.teamMembersWithScores && options.teamMembersWithScores.length > 0) {
        // Team-Urkunde: Nur Teamname ohne Klammern
        const cleanName = options.recipientName.replace(/\s*\([^)]*\)/g, '');
        this.doc.text(cleanName, this.pageWidth / 2, this.margin + 95, { align: 'center' });
      } else {
        // Einzelschützen-Urkunde: Name und Verein untereinander
        const lines = options.recipientName.split('\n');
        if (lines.length > 1) {
          // Mehrzeiliger Name (für Gesamtsieger)
          this.doc.text(lines[0], this.pageWidth / 2, this.margin + 95, { align: 'center' });
          this.doc.setFontSize(14);
          this.doc.setFont('helvetica', 'normal');
          this.doc.text(lines[1], this.pageWidth / 2, this.margin + 110, { align: 'center' });
          
          // "mit" und Ergebnis in separaten Zeilen
          this.doc.setFontSize(14);
          this.doc.setFont('helvetica', 'normal');
          this.doc.text('mit', this.pageWidth / 2, this.margin + 125, { align: 'center' });
          
          this.doc.setFontSize(16);
          this.doc.setFont('helvetica', 'bold');
          this.doc.text(`${options.score} Ring`, this.pageWidth / 2, this.margin + 140, { align: 'center' });
          this.doc.text(`${options.category}`, this.pageWidth / 2, this.margin + 155, { align: 'center' });
        } else {
          // Normale Einzelschützen-Urkunde
          const match = options.recipientName.match(/^(.+?)\s*\((.+)\)$/);
          if (match) {
            const shooterName = match[1].trim();
            const teamName = match[2].trim();
            
            this.doc.text(shooterName, this.pageWidth / 2, this.margin + 95, { align: 'center' });
            this.doc.setFontSize(14);
            this.doc.setFont('helvetica', 'normal');
            this.doc.text(teamName, this.pageWidth / 2, this.margin + 110, { align: 'center' });
            
            // "mit" hinzufügen
            this.doc.setFontSize(14);
            this.doc.text('mit', this.pageWidth / 2, this.margin + 125, { align: 'center' });
          } else {
            this.doc.text(options.recipientName, this.pageWidth / 2, this.margin + 95, { align: 'center' });
          }
        }
      }
      
      // Teammitglieder mit Einzelergebnissen (falls vorhanden)
      if (options.teamMembersWithScores && options.teamMembersWithScores.length > 0) {
        this.doc.setFontSize(11);
        this.doc.setFont('helvetica', 'normal');
        let yPos = this.margin + 105;
        
        options.teamMembersWithScores.forEach(member => {
          this.doc.text(`${member.name} (${member.totalScore} Ring)`, this.pageWidth / 2, yPos, { align: 'center' });
          yPos += 8;
        });
        
        // Ergebnis
        this.doc.setFontSize(16);
        this.doc.setFont('helvetica', 'bold');
        this.doc.text(`${options.score} Ring`, this.pageWidth / 2, yPos + 10, { align: 'center' });
        
        // Platzierung
        this.doc.setFontSize(16);
        this.doc.text(`den     ${options.rank}.    Platz`, this.pageWidth / 2, yPos + 25, { align: 'center' });
      } else if (options.teamMembers && options.teamMembers.length > 0) {
        this.doc.setFontSize(11);
        this.doc.setFont('helvetica', 'normal');
        let yPos = this.margin + 105;
        
        options.teamMembers.forEach(member => {
          this.doc.text(member, this.pageWidth / 2, yPos, { align: 'center' });
          yPos += 8;
        });
        
        // Ergebnis
        this.doc.setFontSize(16);
        this.doc.setFont('helvetica', 'bold');
        this.doc.text(`${options.score} Ring`, this.pageWidth / 2, yPos + 10, { align: 'center' });
        
        // Platzierung
        this.doc.setFontSize(16);
        this.doc.text(`den     ${options.rank}.    Platz`, this.pageWidth / 2, yPos + 25, { align: 'center' });
      } else {
        // Normale Einzelschützen-Urkunde (nicht Gesamtsieger)
        if (!options.recipientName.includes('\n')) {
          // Ergebnis (für Einzelschützen)
          this.doc.setFontSize(16);
          this.doc.setFont('helvetica', 'bold');
          this.doc.text(`${options.score} Ring`, this.pageWidth / 2, this.margin + 140, { align: 'center' });
          
          // Platzierung
          this.doc.setFontSize(16);
          this.doc.text(`den     ${options.rank}.    Platz`, this.pageWidth / 2, this.margin + 155, { align: 'center' });
        }
      }
      
      // Verband in Grün - kompakter positioniert
      this.doc.setFontSize(12);
      this.doc.setFont('helvetica', 'bold');
      this.doc.setTextColor(0, 128, 0); // Grüne Farbe
      this.doc.text('KREISSCHÜTZENVERBAND EINBECK e.V.', this.pageWidth / 2, this.pageHeight - this.margin - 50, { align: 'center' });
      this.doc.setTextColor(0, 0, 0); // Zurück zu schwarz
      
      // Unterschriftslinien
      this.doc.setLineWidth(0.5);
      this.doc.setDrawColor(0, 0, 0);
      
      // Unterschrift links (Präsident)
      this.doc.line(
        this.margin + 30,
        this.pageHeight - this.margin - 35,
        this.margin + 80,
        this.pageHeight - this.margin - 35
      );
      this.doc.setFontSize(9);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text('Präsident', this.margin + 55, this.pageHeight - this.margin - 27, { align: 'center' });
      
      // Unterschriftbild des Präsidenten
      try {
        this.doc.addImage(
          '/images/Unterschrift Lars Sander.png',
          'PNG',
          this.margin + 30,
          this.pageHeight - this.margin - 50,
          50,
          15
        );
      } catch (error) {
        console.error('Fehler beim Hinzufügen der Präsidenten-Unterschrift:', error);
      }
      
      // Unterschrift rechts (Rundenwettkampfleiter)
      this.doc.line(
        this.pageWidth - this.margin - 80,
        this.pageHeight - this.margin - 35,
        this.pageWidth - this.margin - 30,
        this.pageHeight - this.margin - 35
      );
      this.doc.text('Rundenwettkampfleiter', this.pageWidth - this.margin - 55, this.pageHeight - this.margin - 27, { align: 'center' });
      
      // Unterschriftbild des Rundenwettkampfleiters
      try {
        this.doc.addImage(
          '/images/Unterschrift Marcel Buenger.png',
          'PNG',
          this.pageWidth - this.margin - 80,
          this.pageHeight - this.margin - 50,
          50,
          15
        );
      } catch (error) {
        console.error('Fehler beim Hinzufügen der Rundenwettkampfleiter-Unterschrift:', error);
      }
      
      // Datum am unteren Ende der Seite
      const dateText = options.date || `Einbeck, ${format(new Date(), 'dd. MMMM yyyy', { locale: de })}`;
      this.doc.setFontSize(10);
      this.doc.text(dateText, this.pageWidth / 2, this.pageHeight - this.margin - 15, { align: 'center' });
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
