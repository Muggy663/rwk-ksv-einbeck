import { jsPDF } from 'jspdf';
import { logError, logWarn, logInfo, logDebug } from '@/lib/utils/secure-logger';
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
      this.drawBackground();
      this.drawLogos();
      this.drawTitle();
      this.drawSeasonInfo(options);
      this.drawRecipientInfo(options);
      this.drawFooter(options);
    } catch (error) {
      logError('Fehler beim Generieren der Urkunde:', error);
      this.doc.setFontSize(14);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('Fehler beim Generieren der Urkunde', this.margin, this.margin + 50);
    }
  }

  private drawBackground(): void {
    this.doc.setFillColor(255, 255, 255);
    this.doc.rect(0, 0, this.pageWidth, this.pageHeight, 'F');
    this.doc.setDrawColor(0, 0, 0);
    this.doc.setLineWidth(0.5);
    this.doc.rect(this.margin, this.margin, this.pageWidth - 2 * this.margin, this.pageHeight - 2 * this.margin, 'S');
  }

  private drawLogos(): void {
    try {
      this.doc.addImage('/images/logo2.png', 'PNG', this.margin + 10, this.margin + 10, 25, 25);
    } catch (error) {
      logError('Fehler beim Hinzufügen des Logos:', error);
    }
    try {
      this.doc.addImage('/images/nssv.png', 'PNG', this.pageWidth - this.margin - 35, this.margin + 10, 25, 25);
    } catch (error) {
      logError('Fehler beim Hinzufügen des NSSV-Logos:', error);
    }
  }

  private drawTitle(): void {
    this.doc.setFontSize(36);
    this.doc.setFont('times', 'italic');
    this.doc.setTextColor(218, 165, 32);
    this.doc.text('Urkunde', this.pageWidth / 2, this.margin + 50, { align: 'center' });
    this.doc.setTextColor(0, 0, 0);
  }

  private drawSeasonInfo(options: CertificateOptions): void {
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'normal');
    const seasonName = options.season.replace('RWK ', '').replace(/Kleinkaliber\s+Kleinkaliber/g, 'Kleinkaliber').replace(/Luftdruck\s+Luftdruck/g, 'Luftdruck');
    this.doc.text(`Rundenwettkampf ${seasonName}`, this.pageWidth / 2, this.margin + 65, { align: 'center' });
    this.doc.setFontSize(14);
    this.doc.text('errang', this.pageWidth / 2, this.margin + 80, { align: 'center' });
  }

  private drawRecipientInfo(options: CertificateOptions): void {
    this.doc.setFontSize(18);
    this.doc.setFont('helvetica', 'bold');
    
    if (options.teamMembersWithScores && options.teamMembersWithScores.length > 0) {
      this.drawTeamCertificate(options);
    } else {
      this.drawIndividualCertificate(options);
    }
  }

  private drawTeamCertificate(options: CertificateOptions): void {
    const LH = 15; // Zeilenabstand
    const cleanName = options.recipientName.replace(/\s*\([^)]*\)/g, '').replace(/\s+/g, ' ').trim();
    const maxWidth = this.pageWidth - 2 * this.margin - 20;
    let fontSize = 18;
    this.doc.setFontSize(fontSize);
    this.doc.setFont('helvetica', 'bold');
    while (this.doc.getTextWidth(cleanName) > maxWidth && fontSize > 10) {
      fontSize -= 1;
      this.doc.setFontSize(fontSize);
    }
    let y = this.margin + 95;
    this.doc.text(cleanName, this.pageWidth / 2, y, { align: 'center' });
    y += LH - 4;
    this.doc.setFontSize(11);
    this.doc.setFont('helvetica', 'normal');
    options.teamMembersWithScores!.forEach(member => {
      this.doc.text(`${member.name} (${member.totalScore} Ring)`, this.pageWidth / 2, y, { align: 'center' });
      y += 9;
    });
    y += 4;
    this.doc.setFontSize(14);
    this.getCategoryText(options).forEach(line => {
      this.doc.text(line, this.pageWidth / 2, y, { align: 'center' });
      y += LH;
    });
    this.doc.text('mit', this.pageWidth / 2, y, { align: 'center' });
    y += LH;
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(`${options.score} Ring`, this.pageWidth / 2, y, { align: 'center' });
    y += LH;
    this.doc.text(`den     ${options.rank}.    Platz`, this.pageWidth / 2, y, { align: 'center' });
  }

  private drawIndividualCertificate(options: CertificateOptions): void {
    const lines = options.recipientName.split('\n');
    if (lines.length > 1) {
      this.drawMultilineRecipient(options, lines);
    } else {
      this.drawSingleLineRecipient(options);
    }
  }

  private getCategoryText(options: CertificateOptions): string[] {
    const cat = options.category;
    if (/bester|beste/i.test(cat)) return []; // Titel bereits in drawSeasonInfo
    const isLeagueClass = /liga|klasse|oberliga/i.test(cat);
    if (!isLeagueClass) return ['in der Klasse', cat];
    return [`in der ${cat}`];
  }

  private drawCategoryLines(options: CertificateOptions, yStart: number): number {
    const lines = this.getCategoryText(options);
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'normal');
    lines.forEach((line, i) => {
      this.doc.text(line, this.pageWidth / 2, yStart + i * 14, { align: 'center' });
    });
    return yStart + lines.length * 14;
  }

  private drawMultilineRecipient(options: CertificateOptions, lines: string[]): void {
    const LH = 15;
    const isTitle = /bester|beste/i.test(options.category);
    let y = this.margin + 95;
    this.doc.setFontSize(18);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(lines[0].trim(), this.pageWidth / 2, y, { align: 'center' });
    y += LH;
    const line2 = lines[1].replace(/\s+/g, ' ').trim();
    const maxWidth = this.pageWidth - 2 * this.margin - 20;
    let fs2 = 14;
    this.doc.setFontSize(fs2);
    this.doc.setFont('helvetica', 'normal');
    while (this.doc.getTextWidth(line2) > maxWidth && fs2 > 8) { fs2 -= 0.5; this.doc.setFontSize(fs2); }
    this.doc.text(line2, this.pageWidth / 2, y, { align: 'center' });
    y += LH;
    this.doc.setFontSize(14);
    if (isTitle) {
      const isLeagueClass = /liga|klasse|oberliga/i.test(options.category);
      if (!isLeagueClass) {
        this.doc.text('in der Klasse', this.pageWidth / 2, y, { align: 'center' }); y += LH;
        this.doc.text(options.discipline, this.pageWidth / 2, y, { align: 'center' }); y += LH;
      }
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('den Titel', this.pageWidth / 2, y, { align: 'center' }); y += LH;
      this.doc.setFontSize(20);
      this.doc.text(options.category, this.pageWidth / 2, y, { align: 'center' });
    } else {
      this.getCategoryText(options).forEach(line => {
        this.doc.text(line, this.pageWidth / 2, y, { align: 'center' }); y += LH;
      });
      this.doc.text('mit', this.pageWidth / 2, y, { align: 'center' }); y += LH;
      this.doc.setFontSize(16);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(`${options.score} Ring`, this.pageWidth / 2, y, { align: 'center' }); y += LH;
      this.doc.text(`den     ${options.rank}.    Platz`, this.pageWidth / 2, y, { align: 'center' });
    }
  }

  private drawSingleLineRecipient(options: CertificateOptions): void {
    const LH = 15;
    const isTitle = /bester|beste/i.test(options.category);
    let y = this.margin + 95;
    const maxWidth = this.pageWidth - 2 * this.margin - 20;
    let fontSize = 18;
    this.doc.setFontSize(fontSize);
    this.doc.setFont('helvetica', 'bold');
    while (this.doc.getTextWidth(options.recipientName) > maxWidth && fontSize > 10) {
      fontSize -= 1; this.doc.setFontSize(fontSize);
    }
    this.doc.text(options.recipientName, this.pageWidth / 2, y, { align: 'center' });
    y += LH;
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'normal');
    if (isTitle) {
      const isLeagueClass = /liga|klasse|oberliga/i.test(options.category);
      if (!isLeagueClass) {
        this.doc.text('in der Klasse', this.pageWidth / 2, y, { align: 'center' }); y += LH;
        this.doc.text(options.discipline, this.pageWidth / 2, y, { align: 'center' }); y += LH;
      }
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('den Titel', this.pageWidth / 2, y, { align: 'center' }); y += LH;
      this.doc.setFontSize(20);
      this.doc.text(options.category, this.pageWidth / 2, y, { align: 'center' });
    } else {
      this.getCategoryText(options).forEach(line => {
        this.doc.text(line, this.pageWidth / 2, y, { align: 'center' }); y += LH;
      });
      this.doc.text('mit', this.pageWidth / 2, y, { align: 'center' }); y += LH;
      this.doc.setFontSize(16);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(`${options.score} Ring`, this.pageWidth / 2, y, { align: 'center' }); y += LH;
      this.doc.text(`den     ${options.rank}.    Platz`, this.pageWidth / 2, y, { align: 'center' });
    }
  }

  private drawFooter(options: CertificateOptions): void {
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(0, 128, 0);
    this.doc.text('KREISSCHÜTZENVERBAND EINBECK e.V.', this.pageWidth / 2, this.pageHeight - this.margin - 50, { align: 'center' });
    this.doc.setTextColor(0, 0, 0);
    this.drawSignatures();
    const dateText = options.date || `Einbeck, ${format(new Date(), 'dd. MMMM yyyy', { locale: de })}`;
    this.doc.setFontSize(10);
    this.doc.text(dateText, this.pageWidth / 2, this.pageHeight - this.margin - 15, { align: 'center' });
  }

  private drawSignatures(): void {
    this.doc.setLineWidth(0.5);
    this.doc.setDrawColor(0, 0, 0);
    this.doc.line(this.margin + 30, this.pageHeight - this.margin - 35, this.margin + 80, this.pageHeight - this.margin - 35);
    this.doc.setFontSize(9);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text('Präsident', this.margin + 55, this.pageHeight - this.margin - 27, { align: 'center' });
    try {
      this.doc.addImage('/images/Unterschrift Lars Sander.png', 'PNG', this.margin + 30, this.pageHeight - this.margin - 50, 50, 15);
    } catch (error) {
      logError('Fehler beim Hinzufügen der Präsidenten-Unterschrift:', error);
    }
    this.doc.line(this.pageWidth - this.margin - 80, this.pageHeight - this.margin - 35, this.pageWidth - this.margin - 30, this.pageHeight - this.margin - 35);
    this.doc.text('Rundenwettkampfleiter', this.pageWidth - this.margin - 55, this.pageHeight - this.margin - 27, { align: 'center' });
    try {
      this.doc.addImage('/images/Unterschrift Marcel Buenger.png', 'PNG', this.pageWidth - this.margin - 80, this.pageHeight - this.margin - 50, 50, 15);
    } catch (error) {
      logError('Fehler beim Hinzufügen der Rundenwettkampfleiter-Unterschrift:', error);
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
      logError('Fehler beim Speichern des PDFs:', error);
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
      logError('Fehler beim Öffnen des PDFs:', error);
      alert('Fehler beim Öffnen des PDFs. Bitte versuchen Sie es erneut.');
    }
  }
}