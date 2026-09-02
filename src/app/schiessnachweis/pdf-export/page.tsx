"use client";

import { useState, useEffect } from "react";
import { logError, logWarn, logDebug } from '@/lib/utils/secure-logger';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { ArrowLeft, FileText, Download, Calendar, User } from "lucide-react";
import Link from "next/link";
import { SchießnachweisService } from "@/lib/services/schiessnachweis-service";
import { SchießEintrag } from "@/types/schiessnachweis";
import { useToast } from "@/hooks/use-toast";
import { format, startOfYear, endOfYear } from "date-fns";
import { de } from "date-fns/locale";
import jsPDF from 'jspdf';
import 'jspdf-autotable';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    lastAutoTable?: { finalY: number };
  }
}

export default function PDFExportPage() {
  const { toast } = useToast();
  const [einträge, setEinträge] = useState<SchießEintrag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Filter-Optionen
  // Zeitraum-Filter: "alle" = kein Jahresfilter, sonst Spanne von/bis (inklusive)
  const [filterAlleJahre, setFilterAlleJahre] = useState<boolean>(false);
  const [filterVonJahr, setFilterVonJahr] = useState<string>(new Date().getFullYear().toString());
  const [filterBisJahr, setFilterBisJahr] = useState<string>(new Date().getFullYear().toString());
  const [filterDisziplin, setFilterDisziplin] = useState<string>("alle");
  const [filterTyp, setFilterTyp] = useState<string>("alle");
  const [includeAIText, setIncludeAIText] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // Persönliche Daten für Behörden-Nachweis
  const [personalData, setPersonalData] = useState({
    name: '',
    vorname: '',
    geburtsdatum: '',
    adresse: '',
    plz: '',
    ort: '',
    vereinsname: '',
    waffenbesitzkarte: ''
  });

  // Empfänger-/Behördendaten (Adressblock im PDF + Gegenzeichnung)
  const [behoerdenData, setBehoerdenData] = useState({
    name: '',
    adresse: '',
    plz: '',
    ort: '',
  });

  // Beispiel-Adresse des Niedersächsischen Sportschützenverbandes (NSSV)
  const setNSSVBeispiel = () => {
    setBehoerdenData({
      name: 'Niedersächsischer Sportschützenverband e.V. (NSSV)',
      adresse: 'Anton-Rieke-Weg 5',
      plz: '30539',
      ort: 'Hannover',
    });
  };

  useEffect(() => {
    // Mobile Detection
    const checkMobile = () => {
      const isMobileDevice = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
      setIsMobile(isMobileDevice);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    loadData();
    loadPersonalData();
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await SchießnachweisService.getEinträge();
      setEinträge(data);
    } catch (error) {
      logError('Fehler beim Laden der Daten:', error);
      toast({
        title: "Fehler",
        description: "Daten konnten nicht geladen werden.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadPersonalData = () => {
    try {
      const saved = localStorage.getItem('rwk_personal_data');
      if (saved) {
        setPersonalData(JSON.parse(saved));
      }
      const savedBehoerde = localStorage.getItem('rwk_behoerden_data');
      if (savedBehoerde) {
        setBehoerdenData(JSON.parse(savedBehoerde));
      }
    } catch (error) {
      logError('Fehler beim Laden der persönlichen Daten:', error);
    }
  };

  const savePersonalData = () => {
    try {
      localStorage.setItem('rwk_personal_data', JSON.stringify(personalData));
      localStorage.setItem('rwk_behoerden_data', JSON.stringify(behoerdenData));
      toast({
        title: "Gespeichert",
        description: "Persönliche Daten wurden gespeichert.",
      });
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Daten konnten nicht gespeichert werden.",
        variant: "destructive"
      });
    }
  };

  // Lesbare Bezeichnung des gewählten Zeitraums (für PDF-Statistik)
  const getZeitraumLabel = () => {
    if (filterAlleJahre) return 'Gesamter Zeitraum';
    const von = Math.min(parseInt(filterVonJahr), parseInt(filterBisJahr));
    const bis = Math.max(parseInt(filterVonJahr), parseInt(filterBisJahr));
    return von === bis ? `Jahr ${von}` : `Jahre ${von} – ${bis}`;
  };

  // Zeitraum-Kürzel für den Dateinamen
  const getZeitraumDateiname = () => {
    if (filterAlleJahre) return 'Gesamt';
    const von = Math.min(parseInt(filterVonJahr), parseInt(filterBisJahr));
    const bis = Math.max(parseInt(filterVonJahr), parseInt(filterBisJahr));
    return von === bis ? `${von}` : `${von}-${bis}`;
  };

  // Gefilterte Daten
  const getFilteredData = () => {
    let filtered = [...einträge];
    
    // Zeitraum-Filter (Spanne von/bis, inklusive)
    if (!filterAlleJahre) {
      const vonYear = Math.min(parseInt(filterVonJahr), parseInt(filterBisJahr));
      const bisYear = Math.max(parseInt(filterVonJahr), parseInt(filterBisJahr));
      const startDate = startOfYear(new Date(vonYear, 0, 1));
      const endDate = endOfYear(new Date(bisYear, 0, 1));
      filtered = filtered.filter(e => e.datum >= startDate && e.datum <= endDate);
    }
    
    // Disziplin-Filter
    if (filterDisziplin !== "alle") {
      filtered = filtered.filter(e => e.disziplin === filterDisziplin);
    }
    
    // Typ-Filter
    if (filterTyp !== "alle") {
      filtered = filtered.filter(e => e.typ === filterTyp);
    }
    
    return filtered.sort((a, b) => a.datum.getTime() - b.datum.getTime());
  };

  const generatePDF = async () => {
    if (!personalData.name || !personalData.vorname) {
      toast({
        title: "Fehlende Daten",
        description: "Bitte füllen Sie mindestens Name und Vorname aus.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      const filteredData = getFilteredData();
      
      if (filteredData.length === 0) {
        toast({
          title: "Keine Daten",
          description: "Keine Einträge für den gewählten Zeitraum gefunden.",
          variant: "destructive"
        });
        return;
      }

      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.width;
      const pageHeight = pdf.internal.pageSize.height;
      const marginX = 18;
      const contentWidth = pageWidth - marginX * 2;

      // Farbschema (passend zum App-Blau)
      const accent: [number, number, number] = [37, 99, 235];       // blue-600
      const accentDark: [number, number, number] = [30, 58, 138];   // blue-900
      const lightBg: [number, number, number] = [239, 246, 255];    // blue-50
      const textMuted: [number, number, number] = [100, 116, 139];  // slate-500
      const textDark: [number, number, number] = [30, 41, 59];      // slate-800

      // ---- Kopfband ----
      pdf.setFillColor(...accent);
      pdf.rect(0, 0, pageWidth, 34, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Schießnachweis', marginX, 16);
      pdf.setFontSize(10.5);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Nachweis regelmäßiger Schießtätigkeit für Behörden', marginX, 25);
      pdf.setFontSize(8.5);
      pdf.text(
        `Erstellt am ${format(new Date(), 'dd.MM.yyyy', { locale: de })}`,
        pageWidth - marginX,
        16,
        { align: 'right' }
      );

      let yPosition = 46;

      // ---- Empfänger-Adressblock (oben rechts, wie im Brief) ----
      const behoerdeZeilen = [
        behoerdenData.name,
        behoerdenData.adresse,
        [behoerdenData.plz, behoerdenData.ort].filter(Boolean).join(' '),
      ].filter((z) => z && z.trim().length > 0);

      if (behoerdeZeilen.length > 0) {
        pdf.setTextColor(...textMuted);
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        pdf.text('An', marginX, yPosition);
        pdf.setTextColor(...textDark);
        pdf.setFontSize(9.5);
        let addrY = yPosition + 5;
        behoerdeZeilen.forEach((zeile, idx) => {
          pdf.setFont('helvetica', idx === 0 ? 'bold' : 'normal');
          pdf.text(zeile, marginX, addrY);
          addrY += 5;
        });
        yPosition = addrY + 6;
      }

      // Statistik-Daten vorbereiten
      const filteredStats = {
        totalSchüsse: filteredData.reduce((sum, e) => sum + (e.schussAnzahl ?? 0), 0),
        totalTrainings: filteredData.filter(e => e.typ === 'training').length,
        totalWettkämpfe: filteredData.filter(e => e.typ === 'wettkampf').length,
        zeitraum: getZeitraumLabel()
      };

      // Kleiner Helfer für Abschnitts-Überschriften
      const sectionTitle = (title: string, y: number) => {
        pdf.setFillColor(...accent);
        pdf.rect(marginX, y - 4, 3, 5.5, 'F');
        pdf.setTextColor(...accentDark);
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text(title, marginX + 6, y);
        return y + 8;
      };

      // ---- Optional: KI-generierter Begleittext ----
      if (includeAIText) {
        const aiText = await generateAIText(personalData, filteredStats);
        yPosition = sectionTitle('Begleitschreiben', yPosition);

        const lines: string[] = pdf.splitTextToSize(aiText, contentWidth - 10);
        const boxHeight = lines.length * 5 + 8;
        pdf.setFillColor(...lightBg);
        pdf.setDrawColor(...accent);
        pdf.roundedRect(marginX, yPosition - 4, contentWidth, boxHeight, 2, 2, 'FD');

        pdf.setTextColor(...textDark);
        pdf.setFontSize(9.5);
        pdf.setFont('helvetica', 'normal');
        let lineY = yPosition + 2;
        lines.forEach((line: string) => {
          pdf.text(line, marginX + 5, lineY);
          lineY += 5;
        });
        yPosition += boxHeight + 8;
      }

      // ---- Persönliche Daten + Statistik (zwei Karten nebeneinander) ----
      const personalInfo = [
        ['Name', `${personalData.name}, ${personalData.vorname}`],
        personalData.geburtsdatum ? ['Geburtsdatum', personalData.geburtsdatum] : null,
        personalData.adresse ? ['Adresse', personalData.adresse] : null,
        personalData.plz && personalData.ort ? ['Ort', `${personalData.plz} ${personalData.ort}`] : null,
        personalData.vereinsname ? ['Verein', personalData.vereinsname] : null,
        personalData.waffenbesitzkarte ? ['WBK-Nr.', personalData.waffenbesitzkarte] : null
      ].filter(Boolean) as [string, string][];

      const statsInfo: [string, string][] = [
        ['Zeitraum', filteredStats.zeitraum],
        ['Trainingseinheiten', filteredStats.totalTrainings.toString()],
        ['Wettkämpfe', filteredStats.totalWettkämpfe.toString()],
        ['Gesamtschüsse', filteredStats.totalSchüsse.toString()],
        ['Einträge gesamt', filteredData.length.toString()]
      ];

      const cardGap = 8;
      const cardWidth = (contentWidth - cardGap) / 2;
      const rows = Math.max(personalInfo.length, statsInfo.length);
      const cardBodyHeight = rows * 6.5 + 4;
      const cardHeight = cardBodyHeight + 10;
      const cardTop = yPosition;

      const drawCard = (x: number, heading: string, entries: [string, string][]) => {
        // Karten-Rahmen
        pdf.setFillColor(255, 255, 255);
        pdf.setDrawColor(226, 232, 240); // slate-200
        pdf.roundedRect(x, cardTop, cardWidth, cardHeight, 2, 2, 'FD');
        // Karten-Titel
        pdf.setTextColor(...accentDark);
        pdf.setFontSize(10.5);
        pdf.setFont('helvetica', 'bold');
        pdf.text(heading, x + 5, cardTop + 7);
        pdf.setDrawColor(...lightBg);
        pdf.line(x + 5, cardTop + 9.5, x + cardWidth - 5, cardTop + 9.5);
        // Zeilen
        let rowY = cardTop + 16;
        entries.forEach(([label, value]) => {
          pdf.setTextColor(...textMuted);
          pdf.setFontSize(8);
          pdf.setFont('helvetica', 'normal');
          pdf.text(label, x + 5, rowY);
          pdf.setTextColor(...textDark);
          pdf.setFontSize(9);
          pdf.setFont('helvetica', 'bold');
          const valLines: string[] = pdf.splitTextToSize(value, cardWidth - 10);
          pdf.text(valLines[0] ?? '', x + cardWidth - 5, rowY, { align: 'right' });
          rowY += 6.5;
        });
      };

      drawCard(marginX, 'Persönliche Daten', personalInfo);
      drawCard(marginX + cardWidth + cardGap, 'Schießtätigkeit', statsInfo);
      yPosition = cardTop + cardHeight + 10;

      // ---- Detaillierte Aufstellung (autoTable) ----
      yPosition = sectionTitle('Detaillierte Aufstellung', yPosition);

      const tableBody = filteredData.map((eintrag) => {
        const disziplin = eintrag.disziplin ?? '';
        const standort = eintrag.standort ?? '';
        const notizen = eintrag.notizen ?? '';
        return [
          eintrag.datum ? format(eintrag.datum, 'dd.MM.yy', { locale: de }) : '',
          eintrag.typ === 'training' ? 'Training' : 'Wettkampf',
          disziplin,
          (eintrag.schussAnzahl ?? 0).toString(),
          (eintrag.ergebnis ?? 0).toString(),
          standort,
          notizen
        ];
      });

      pdf.autoTable({
        head: [['Datum', 'Typ', 'Disziplin', 'Schüsse', 'Ergebnis', 'Standort', 'Notizen']],
        body: tableBody,
        startY: yPosition,
        margin: { left: marginX, right: marginX },
        theme: 'grid',
        styles: {
          fontSize: 8,
          cellPadding: 2.5,
          textColor: textDark,
          lineColor: [226, 232, 240],
          lineWidth: 0.1
        },
        headStyles: {
          fillColor: accent,
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          halign: 'left'
        },
        alternateRowStyles: { fillColor: lightBg },
        columnStyles: {
          0: { cellWidth: 18 },
          1: { cellWidth: 22 },
          2: { cellWidth: 34 },
          3: { cellWidth: 16, halign: 'center' },
          4: { cellWidth: 18, halign: 'center' },
          5: { cellWidth: 32 },
          6: { cellWidth: 'auto' }
        }
      });

      // ---- Footer / Unterschriften ----
      let afterTableY = (pdf.lastAutoTable?.finalY ?? yPosition) + 22;
      if (afterTableY > pageHeight - 30) {
        pdf.addPage();
        afterTableY = 30;
      }
      pdf.setDrawColor(...textMuted);
      pdf.setLineWidth(0.3);
      pdf.setTextColor(...textMuted);
      pdf.setFontSize(8.5);
      pdf.setFont('helvetica', 'normal');

      // Linke Unterschrift: Antragsteller
      const leftLineWidth = 70;
      pdf.line(marginX, afterTableY, marginX + leftLineWidth, afterTableY);
      pdf.text('Ort, Datum, Unterschrift', marginX, afterTableY + 5);

      // Rechte Unterschrift: gegenzeichnende Stelle (Stempel & Unterschrift)
      const rightLineWidth = 70;
      const rightLineEnd = pageWidth - marginX;
      const rightLineStart = rightLineEnd - rightLineWidth;
      pdf.line(rightLineStart, afterTableY, rightLineEnd, afterTableY);
      pdf.text('Stempel und Unterschrift', rightLineEnd, afterTableY + 5, { align: 'right' });
      // Beschriftung: eingetragene Stelle bevorzugen, sonst Vereinsschießsportleiter
      const gegenzeichner = behoerdenData.name?.trim() || 'Vereinsschießsportleiter';
      const gegenzeichnerLines: string[] = pdf.splitTextToSize(gegenzeichner, rightLineWidth);
      pdf.text(gegenzeichnerLines[0] ?? '', rightLineEnd, afterTableY + 9.5, { align: 'right' });

      // Fußzeile auf jeder Seite
      const pageCount = pdf.getNumberOfPages();
      for (let p = 1; p <= pageCount; p++) {
        pdf.setPage(p);
        pdf.setDrawColor(226, 232, 240);
        pdf.setLineWidth(0.3);
        pdf.line(marginX, pageHeight - 14, pageWidth - marginX, pageHeight - 14);
        pdf.setTextColor(...textMuted);
        pdf.setFontSize(7.5);
        pdf.setFont('helvetica', 'normal');
        pdf.text('Digitaler Schießnachweis · RWK Einbeck App', marginX, pageHeight - 9);
        pdf.text(`Seite ${p} von ${pageCount}`, pageWidth - marginX, pageHeight - 9, { align: 'right' });
      }

      // PDF speichern
      const fileName = `Schiessnachweis_${personalData.name}_${getZeitraumDateiname()}.pdf`;
      pdf.save(fileName);
      
      toast({
        title: "PDF erstellt",
        description: `${fileName} wurde heruntergeladen.`,
      });
      
    } catch (error) {
      logError('Fehler beim Erstellen des PDFs:', error);
      toast({
        title: "Fehler",
        description: "PDF konnte nicht erstellt werden.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const generateAIText = async (personalData: any, stats: any) => {
    try {
      logDebug('🤖 Starte KI-Textgenerierung...');
      logDebug('Personal Data:', personalData);
      logDebug('Stats:', stats);
      
      const response = await fetch('/api/gemini/behoerdentext', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ personalData, stats })
      });
      
      logDebug('Response Status:', response.status);
      logDebug('Response OK:', response.ok);
      
      if (!response.ok) {
        logError('API Response nicht OK:', response.status, response.statusText);
        const errorText = await response.text();
        logError('Error Response Text:', errorText);
        return generateFallbackText(personalData, stats);
      }
      
      const data = await response.json();
      logDebug('API Response Data:', data);
      
      if (data.success) {
        const finalText = `Sehr geehrte Damen und Herren,\n\n${data.text}\n\nMit freundlichen Grüßen`;
        logDebug('✅ KI-Text erfolgreich generiert');
        return finalText;
      } else {
        logWarn('⚠️ API meldet Fehler:', data.error);
        return generateFallbackText(personalData, stats);
      }
    } catch (error) {
      logError('❌ Fehler bei KI-Textgenerierung:', error);
      return generateFallbackText(personalData, stats);
    }
  };
  
  const generateFallbackText = (personalData: any, stats: any) => {
    const vereinsname = personalData.vereinsname || 'meinem Schützenverein';
    let vereinText;
    
    if (personalData.vereinsname) {
      if (vereinsname.includes('Schützengilde') || vereinsname.includes('Gilde')) {
        vereinText = `in der ${vereinsname}`;
      } else if (vereinsname.startsWith('SC ') || vereinsname.startsWith('KSV ') || vereinsname.includes('Verein')) {
        vereinText = `im ${vereinsname}`;
      } else {
        vereinText = `im ${vereinsname}`; // Default für unbekannte Vereine
      }
    } else {
      vereinText = 'in meinem Schützenverein';
    }
    
    const trainingsText = stats.totalTrainings > 0 ? `regelmäßig trainiere (${stats.totalTrainings} Trainingseinheiten)` : 'regelmäßig trainiere';
    const wettkampfText = stats.totalWettkämpfe > 0 ? `an ${stats.totalWettkämpfe} Wettkämpfen teilgenommen habe` : 'an Wettkämpfen teilnehme';
    
    return `Sehr geehrte Damen und Herren,\n\nhiermit bestätige ich, dass ich ${vereinText} aktiv bin und ${trainingsText}. Im dokumentierten Zeitraum ${stats.zeitraum} habe ich ${wettkampfText} und insgesamt ${stats.totalSchüsse} Schüsse abgegeben.\n\nDie nachfolgende Aufstellung dokumentiert meine regelmäßige Schießtätigkeit gemäß den Anforderungen des Waffengesetzes.\n\nMit freundlichen Grüßen`;
  };

  const availableYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = 0; i < 5; i++) {
      years.push(currentYear - i);
    }
    return years;
  };

  const filteredData = getFilteredData();

  // Mobile Warnung anzeigen
  if (isMobile) {
    return (
      <div className="container mx-auto p-6 max-w-2xl">
        <div className="mb-6">
          <Button asChild variant="ghost" className="mb-4">
            <Link href="/schiessnachweis">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Zurück zum Schießnachweis
            </Link>
          </Button>
          
          <div className="flex items-center gap-3 mb-2">
            <FileText className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold">PDF-Export für Behörden</h1>
          </div>
        </div>

        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="text-amber-800 flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Nur am Desktop verfügbar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-amber-700">
              <p>
                💻 <strong>PDF-Export ist nur am Desktop-PC verfügbar.</strong>
              </p>
              <p>
                Die PDF-Erstellung benötigt erweiterte Browser-Funktionen, die auf mobilen Geräten nicht zuverlässig funktionieren.
              </p>
              <div className="bg-white p-4 rounded border border-amber-200">
                <h4 className="font-semibold mb-2">So erstellen Sie Ihren Behörden-Nachweis:</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm">
                  <li>Öffnen Sie die App am Desktop-PC oder Laptop</li>
                  <li>Gehen Sie zu Schießnachweis → PDF für Behörden</li>
                  <li>Füllen Sie Ihre persönlichen Daten aus</li>
                  <li>Wählen Sie den gewünschten Zeitraum</li>
                  <li>Erstellen Sie das PDF mit einem Klick</li>
                </ol>
              </div>
              <p className="text-sm">
                📱 <strong>Alternative:</strong> Nutzen Sie den CSV-Export in den Einstellungen - dieser funktioniert auch mobil und kann am PC geöffnet werden.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <Button asChild variant="ghost" className="mb-4">
          <Link href="/schiessnachweis">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück zum Schießnachweis
          </Link>
        </Button>
        
        <div className="flex items-center gap-3 mb-2">
          <FileText className="h-8 w-8 text-blue-600" />
          <h1 className="text-2xl font-bold">PDF-Export für Behörden</h1>
        </div>
        <p className="text-muted-foreground">
          Erstellen Sie einen offiziellen Nachweis Ihrer Schießtätigkeit
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Persönliche Daten */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Persönliche Daten
            </CardTitle>
            <CardDescription>
              Diese Daten werden im PDF-Nachweis verwendet
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={personalData.name}
                  onChange={(e) => setPersonalData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Mustermann"
                />
              </div>
              <div>
                <Label htmlFor="vorname">Vorname *</Label>
                <Input
                  id="vorname"
                  value={personalData.vorname}
                  onChange={(e) => setPersonalData(prev => ({ ...prev, vorname: e.target.value }))}
                  placeholder="Max"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="geburtsdatum">Geburtsdatum</Label>
              <Input
                id="geburtsdatum"
                type="date"
                value={personalData.geburtsdatum}
                onChange={(e) => setPersonalData(prev => ({ ...prev, geburtsdatum: e.target.value }))}
              />
            </div>
            
            <div>
              <Label htmlFor="adresse">Adresse</Label>
              <Input
                id="adresse"
                value={personalData.adresse}
                onChange={(e) => setPersonalData(prev => ({ ...prev, adresse: e.target.value }))}
                placeholder="Musterstraße 123"
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="plz">PLZ</Label>
                <Input
                  id="plz"
                  value={personalData.plz}
                  onChange={(e) => setPersonalData(prev => ({ ...prev, plz: e.target.value }))}
                  placeholder="12345"
                />
              </div>
              <div>
                <Label htmlFor="ort">Ort</Label>
                <Input
                  id="ort"
                  value={personalData.ort}
                  onChange={(e) => setPersonalData(prev => ({ ...prev, ort: e.target.value }))}
                  placeholder="Musterstadt"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="vereinsname">Vereinsname</Label>
              <Input
                id="vereinsname"
                value={personalData.vereinsname}
                onChange={(e) => setPersonalData(prev => ({ ...prev, vereinsname: e.target.value }))}
                placeholder="z.B. KSV Einbeck"
              />
            </div>
            
            <div>
              <Label htmlFor="waffenbesitzkarte">Waffenbesitzkarte Nr.</Label>
              <Input
                id="waffenbesitzkarte"
                value={personalData.waffenbesitzkarte}
                onChange={(e) => setPersonalData(prev => ({ ...prev, waffenbesitzkarte: e.target.value }))}
                placeholder="Optional"
              />
            </div>

            {/* Empfänger / Behörde (wird oben im PDF als Adressblock angezeigt) */}
            <div className="mt-2 rounded-lg border border-dashed p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <div>
                  <Label className="text-sm font-semibold">Empfänger / gegenzeichnende Stelle</Label>
                  <p className="text-xs text-muted-foreground">
                    Behörde oder Verband, an die/den der Nachweis gerichtet ist (optional)
                  </p>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={setNSSVBeispiel} className="shrink-0">
                  NSSV einsetzen
                </Button>
              </div>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="behoerdeName">Name der Stelle</Label>
                  <Input
                    id="behoerdeName"
                    value={behoerdenData.name}
                    onChange={(e) => setBehoerdenData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="z.B. Waffenbehörde Landkreis Northeim"
                  />
                </div>
                <div>
                  <Label htmlFor="behoerdeAdresse">Straße & Hausnr.</Label>
                  <Input
                    id="behoerdeAdresse"
                    value={behoerdenData.adresse}
                    onChange={(e) => setBehoerdenData(prev => ({ ...prev, adresse: e.target.value }))}
                    placeholder="Musterstraße 1"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="behoerdePlz">PLZ</Label>
                    <Input
                      id="behoerdePlz"
                      value={behoerdenData.plz}
                      onChange={(e) => setBehoerdenData(prev => ({ ...prev, plz: e.target.value }))}
                      placeholder="37154"
                    />
                  </div>
                  <div>
                    <Label htmlFor="behoerdeOrt">Ort</Label>
                    <Input
                      id="behoerdeOrt"
                      value={behoerdenData.ort}
                      onChange={(e) => setBehoerdenData(prev => ({ ...prev, ort: e.target.value }))}
                      placeholder="Northeim"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <Button onClick={savePersonalData} variant="outline" className="w-full">
              Daten speichern
            </Button>
          </CardContent>
        </Card>

        {/* Filter und Vorschau */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Filter & Vorschau
            </CardTitle>
            <CardDescription>
              Wählen Sie den Zeitraum für den Nachweis
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Zeitraum</Label>
              <div className="grid grid-cols-2 gap-3 mt-1">
                <div>
                  <span className="text-xs text-muted-foreground">Von Jahr</span>
                  <NativeSelect
                    value={filterVonJahr}
                    onValueChange={setFilterVonJahr}
                    disabled={filterAlleJahre}
                    options={availableYears().map(year => ({
                      value: year.toString(),
                      label: year.toString()
                    }))}
                  />
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Bis Jahr</span>
                  <NativeSelect
                    value={filterBisJahr}
                    onValueChange={setFilterBisJahr}
                    disabled={filterAlleJahre}
                    options={availableYears().map(year => ({
                      value: year.toString(),
                      label: year.toString()
                    }))}
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2 mt-2">
                <input
                  type="checkbox"
                  id="alleJahre"
                  checked={filterAlleJahre}
                  onChange={(e) => setFilterAlleJahre(e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="alleJahre" className="text-sm font-normal">
                  Alle Jahre (kein Zeitraum-Filter)
                </Label>
              </div>
            </div>
            
            <div>
              <Label htmlFor="disziplin">Disziplin</Label>
              <NativeSelect
                value={filterDisziplin}
                onValueChange={setFilterDisziplin}
                options={[
                  { value: "alle", label: "Alle Disziplinen" },
                  ...[...new Set(einträge.map(e => e.disziplin))].sort().map(disziplin => ({
                    value: disziplin,
                    label: disziplin
                  }))
                ]}
              />
            </div>
            
            <div>
              <Label htmlFor="typ">Aktivitätstyp</Label>
              <NativeSelect
                value={filterTyp}
                onValueChange={setFilterTyp}
                options={[
                  { value: "alle", label: "Training & Wettkampf" },
                  { value: "training", label: "Nur Training" },
                  { value: "wettkampf", label: "Nur Wettkämpfe" }
                ]}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="aiText"
                checked={includeAIText}
                onChange={(e) => setIncludeAIText(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="aiText" className="text-sm">
                KI-Begleittext hinzufügen (Ich-Form)
              </Label>
            </div>
            {includeAIText && (
              <p className="text-xs text-muted-foreground">
                🤖 Gemini AI erstellt einen professionellen Begleittext in Ich-Form
              </p>
            )}
            
            {/* Vorschau-Statistik */}
            <div className="bg-muted/30 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Vorschau:</h4>
              {isLoading ? (
                <p className="text-sm text-muted-foreground">Lade Daten...</p>
              ) : (
                <div className="space-y-1 text-sm">
                  <p><strong>Einträge:</strong> {filteredData.length}</p>
                  <p><strong>Trainings:</strong> {filteredData.filter(e => e.typ === 'training').length}</p>
                  <p><strong>Wettkämpfe:</strong> {filteredData.filter(e => e.typ === 'wettkampf').length}</p>
                  <p><strong>Gesamtschüsse:</strong> {filteredData.reduce((sum, e) => sum + e.schussAnzahl, 0)}</p>
                  {filteredData.length > 0 && (
                    <p><strong>Zeitraum:</strong> {format(filteredData[0].datum, 'dd.MM.yyyy', { locale: de })} - {format(filteredData[filteredData.length - 1].datum, 'dd.MM.yyyy', { locale: de })}</p>
                  )}
                </div>
              )}
            </div>
            
            <Button 
              onClick={generatePDF} 
              disabled={isGenerating || filteredData.length === 0 || !personalData.name || !personalData.vorname}
              className="w-full"
            >
              <Download className="h-4 w-4 mr-2" />
              {isGenerating ? 'Erstelle PDF...' : 'PDF-Nachweis erstellen'}
            </Button>
            
            {filteredData.length === 0 && !isLoading && (
              <p className="text-sm text-muted-foreground text-center">
                Keine Einträge für den gewählten Zeitraum gefunden.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Hinweise */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Hinweise zum Behörden-Nachweis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>• Der PDF-Nachweis enthält alle Ihre Schießaktivitäten im gewählten Zeitraum</p>
            <p>• Persönliche Daten werden nur lokal gespeichert und nicht übertragen</p>
            <p>• Das PDF ist für die Vorlage bei Behörden (z.B. Landkreis) geeignet</p>
            <p>• Bewahren Sie regelmäßige Backups Ihrer Schießnachweis-Daten auf</p>
            <p>• Bei Fragen wenden Sie sich an Ihren Vereinsvorstand</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
