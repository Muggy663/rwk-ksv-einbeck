"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { ArrowLeft, FileText, Download, Calendar, User } from "lucide-react";
import Link from "next/link";
import { SchießnachweisService } from "@/lib/services/schiessnachweis-service";
import { SchießEintrag, DISZIPLIN_NAMES } from "@/types/schiessnachweis";
import { useToast } from "@/hooks/use-toast";
import { format, startOfYear, endOfYear, subYears } from "date-fns";
import { de } from "date-fns/locale";
import jsPDF from 'jspdf';

export default function PDFExportPage() {
  const { toast } = useToast();
  const [einträge, setEinträge] = useState<SchießEintrag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Filter-Optionen
  const [filterJahr, setFilterJahr] = useState<string>(new Date().getFullYear().toString());
  const [filterDisziplin, setFilterDisziplin] = useState<string>("alle");
  const [filterTyp, setFilterTyp] = useState<string>("alle");
  
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

  useEffect(() => {
    loadData();
    loadPersonalData();
  }, []);

  const loadData = () => {
    setIsLoading(true);
    try {
      const data = SchießnachweisService.getEinträge();
      setEinträge(data);
    } catch (error) {
      console.error('Fehler beim Laden der Daten:', error);
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
    } catch (error) {
      console.error('Fehler beim Laden der persönlichen Daten:', error);
    }
  };

  const savePersonalData = () => {
    try {
      localStorage.setItem('rwk_personal_data', JSON.stringify(personalData));
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

  // Gefilterte Daten
  const getFilteredData = () => {
    let filtered = [...einträge];
    
    // Jahr-Filter
    if (filterJahr !== "alle") {
      const year = parseInt(filterJahr);
      const startDate = startOfYear(new Date(year, 0, 1));
      const endDate = endOfYear(new Date(year, 0, 1));
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
      let yPosition = 20;

      // Header mit Logo (falls verfügbar)
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Schießnachweis für Behörden', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 10;
      
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Nachweis regelmäßiger Schießtätigkeit', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 20;

      // Persönliche Daten
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Persönliche Daten:', 20, yPosition);
      yPosition += 10;
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      
      const personalInfo = [
        `Name: ${personalData.name}, ${personalData.vorname}`,
        personalData.geburtsdatum ? `Geburtsdatum: ${personalData.geburtsdatum}` : '',
        personalData.adresse ? `Adresse: ${personalData.adresse}` : '',
        personalData.plz && personalData.ort ? `${personalData.plz} ${personalData.ort}` : '',
        personalData.vereinsname ? `Verein: ${personalData.vereinsname}` : '',
        personalData.waffenbesitzkarte ? `WBK-Nr.: ${personalData.waffenbesitzkarte}` : ''
      ].filter(Boolean);
      
      personalInfo.forEach(info => {
        pdf.text(info, 20, yPosition);
        yPosition += 6;
      });
      
      yPosition += 10;

      // Zeitraum und Statistik
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Schießtätigkeit:', 20, yPosition);
      yPosition += 10;
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      
      const stats = SchießnachweisService.getStatistik();
      const filteredStats = {
        totalSchüsse: filteredData.reduce((sum, e) => sum + e.schussAnzahl, 0),
        totalTrainings: filteredData.filter(e => e.typ === 'training').length,
        totalWettkämpfe: filteredData.filter(e => e.typ === 'wettkampf').length,
        zeitraum: filterJahr !== "alle" ? `Jahr ${filterJahr}` : 'Gesamter Zeitraum'
      };
      
      const statsInfo = [
        `Zeitraum: ${filteredStats.zeitraum}`,
        `Trainingseinheiten: ${filteredStats.totalTrainings}`,
        `Wettkämpfe: ${filteredStats.totalWettkämpfe}`,
        `Gesamtschüsse: ${filteredStats.totalSchüsse}`,
        `Einträge gesamt: ${filteredData.length}`
      ];
      
      statsInfo.forEach(info => {
        pdf.text(info, 20, yPosition);
        yPosition += 6;
      });
      
      yPosition += 10;

      // Tabelle mit Einträgen
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Detaillierte Aufstellung:', 20, yPosition);
      yPosition += 10;

      // Tabellen-Header
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'bold');
      
      const colWidths = [25, 20, 45, 25, 25, 30, 40];
      const headers = ['Datum', 'Typ', 'Disziplin', 'Schüsse', 'Ergebnis', 'Standort', 'Notizen'];
      let xPosition = 20;
      
      headers.forEach((header, index) => {
        pdf.text(header, xPosition, yPosition);
        xPosition += colWidths[index];
      });
      
      yPosition += 8;
      
      // Linie unter Header
      pdf.line(20, yPosition - 2, pageWidth - 20, yPosition - 2);
      
      // Tabellen-Daten
      pdf.setFont('helvetica', 'normal');
      
      filteredData.forEach((eintrag, index) => {
        if (yPosition > pageHeight - 30) {
          pdf.addPage();
          yPosition = 20;
        }
        
        xPosition = 20;
        const rowData = [
          format(eintrag.datum, 'dd.MM.yy', { locale: de }),
          eintrag.typ === 'training' ? 'T' : 'W',
          eintrag.disziplin.length > 20 ? eintrag.disziplin.substring(0, 17) + '...' : eintrag.disziplin,
          eintrag.schussAnzahl.toString(),
          eintrag.ergebnis.toString(),
          eintrag.standort.length > 15 ? eintrag.standort.substring(0, 12) + '...' : eintrag.standort,
          eintrag.notizen ? (eintrag.notizen.length > 20 ? eintrag.notizen.substring(0, 17) + '...' : eintrag.notizen) : ''
        ];
        
        rowData.forEach((data, colIndex) => {
          pdf.text(data, xPosition, yPosition);
          xPosition += colWidths[colIndex];
        });
        
        yPosition += 6;
      });

      // Footer
      yPosition = pageHeight - 30;
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Erstellt am: ${format(new Date(), 'dd.MM.yyyy', { locale: de })}`, 20, yPosition);
      pdf.text('Digitaler Schießnachweis - RWK Einbeck App', pageWidth - 20, yPosition, { align: 'right' });
      
      yPosition += 10;
      pdf.text('Unterschrift: ________________________', 20, yPosition);

      // PDF speichern
      const fileName = `Schiessnachweis_${personalData.name}_${filterJahr !== "alle" ? filterJahr : 'Gesamt'}.pdf`;
      pdf.save(fileName);
      
      toast({
        title: "PDF erstellt",
        description: `${fileName} wurde heruntergeladen.`,
      });
      
    } catch (error) {
      console.error('Fehler beim Erstellen des PDFs:', error);
      toast({
        title: "Fehler",
        description: "PDF konnte nicht erstellt werden.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
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
            <div className="grid grid-cols-2 gap-4">
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
            
            <div className="grid grid-cols-2 gap-4">
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
              <Label htmlFor="jahr">Jahr</Label>
              <NativeSelect
                value={filterJahr}
                onChange={setFilterJahr}
              >
                <option value="alle">Alle Jahre</option>
                {availableYears().map(year => (
                  <option key={year} value={year.toString()}>
                    {year}
                  </option>
                ))}
              </NativeSelect>
            </div>
            
            <div>
              <Label htmlFor="disziplin">Disziplin</Label>
              <NativeSelect
                value={filterDisziplin}
                onChange={setFilterDisziplin}
              >
                <option value="alle">Alle Disziplinen</option>
                {DISZIPLIN_NAMES.map(disziplin => (
                  <option key={disziplin} value={disziplin}>
                    {disziplin}
                  </option>
                ))}
              </NativeSelect>
            </div>
            
            <div>
              <Label htmlFor="typ">Aktivitätstyp</Label>
              <NativeSelect
                value={filterTyp}
                onChange={setFilterTyp}
              >
                <option value="alle">Training & Wettkampf</option>
                <option value="training">Nur Training</option>
                <option value="wettkampf">Nur Wettkämpfe</option>
              </NativeSelect>
            </div>
            
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