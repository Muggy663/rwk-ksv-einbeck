"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Download, Trophy, Medal, FileText, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { db } from '@/lib/firebase/config';
import { collection, getDocs, query, where } from 'firebase/firestore';

interface ErgebnisEintrag {
  id: string;
  schuetzenName: string;
  vereinsname: string;
  disziplin: string;
  ringe: number;
  teiler?: number;
  sortierWert: number;
  platz: number;
  altersklasse?: string;
}

export default function ErgebnislistenPage() {
  const { toast } = useToast();
  const [ergebnisse, setErgebnisse] = useState<ErgebnisEintrag[]>([]);
  const [selectedDisziplin, setSelectedDisziplin] = useState<string>('');
  const [selectedAltersklasse, setSelectedAltersklasse] = useState<string>('');
  const [disziplinen, setDisziplinen] = useState<string[]>([]);
  const [altersklassen, setAltersklassen] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        // KM-Ergebnisse laden (aus km_vm_ergebnisse)
        const kmErgebnisseSnapshot = await getDocs(collection(db, 'km_vm_ergebnisse'));
        const meldungenRes = await fetch('/api/km/meldungen?jahr=2026');
        const meldungenData = meldungenRes.ok ? (await meldungenRes.json()).data || [] : [];
        
        // Lade zusätzliche Daten über API
        const [schuetzenRes, disziplinenRes, clubsRes] = await Promise.all([
          fetch('/api/km/shooters'),
          fetch('/api/km/disziplinen'),
          fetch('/api/clubs')
        ]);
        
        const schuetzenData = schuetzenRes.ok ? (await schuetzenRes.json()).data || [] : [];
        const disziplinenData = disziplinenRes.ok ? (await disziplinenRes.json()).data || [] : [];
        const clubsData = clubsRes.ok ? (await clubsRes.json()).data || [] : [];
        
        // Maps für Namen-Auflösung
        const schuetzenMap = new Map();
        const disziplinenMap = new Map();
        const clubsMap = new Map();
        
        schuetzenData.forEach(schuetze => {
          const fullName = schuetze.firstName && schuetze.lastName 
            ? `${schuetze.firstName} ${schuetze.lastName}`
            : schuetze.name || 'Unbekannt';
          schuetzenMap.set(schuetze.id, {
            name: fullName,
            clubId: schuetze.kmClubId || schuetze.rwkClubId || schuetze.clubId
          });
        });
        
        disziplinenData.forEach(disziplin => {
          disziplinenMap.set(disziplin.id, disziplin.name);
        });
        
        clubsData.forEach(club => {
          clubsMap.set(club.id, club.name);
        });
        
        // Meldungen-Map für zusätzliche Infos
        const meldungenMap = new Map();
        meldungenData.forEach(meldung => {
          const schuetze = schuetzenMap.get(meldung.schuetzeId);
          const disziplinName = disziplinenMap.get(meldung.disziplinId) || 'Unbekannt';
          const vereinName = schuetze && schuetze.clubId ? clubsMap.get(schuetze.clubId) || 'Unbekannt' : 'Unbekannt';
          
          // Berechne Altersklasse wie in der Meldungen-Seite
          let altersklasse = 'Erwachsene';
          if (schuetze) {
            const schuetzeDetail = schuetzenData.find(s => s.id === meldung.schuetzeId);
            if (schuetzeDetail?.birthYear) {
              const age = 2026 - schuetzeDetail.birthYear;
              const isAuflage = disziplinName?.toLowerCase().includes('auflage');
              const isMale = schuetzeDetail.gender === 'male';
              
              if (age <= 14) altersklasse = 'Schüler';
              else if (age <= 16) altersklasse = 'Jugend';
              else if (age <= 18) altersklasse = `Junioren II ${isMale ? 'm' : 'w'}`;
              else if (age <= 20) altersklasse = `Junioren I ${isMale ? 'm' : 'w'}`;
              else if (isAuflage) {
                if (age <= 40) altersklasse = `${isMale ? 'Herren' : 'Damen'} I`;
                else if (age <= 50) altersklasse = 'Senioren 0';
                else if (age <= 60) altersklasse = 'Senioren I';
                else if (age <= 65) altersklasse = 'Senioren II';
                else if (age <= 70) altersklasse = 'Senioren III';
                else if (age <= 75) altersklasse = 'Senioren IV';
                else if (age <= 80) altersklasse = 'Senioren V';
                else altersklasse = 'Senioren VI';
              } else {
                if (age <= 40) altersklasse = `${isMale ? 'Herren' : 'Damen'} I`;
                else if (age <= 50) altersklasse = `${isMale ? 'Herren' : 'Damen'} II`;
                else if (age <= 60) altersklasse = `${isMale ? 'Herren' : 'Damen'} III`;
                else if (age <= 70) altersklasse = `${isMale ? 'Herren' : 'Damen'} IV`;
                else altersklasse = `${isMale ? 'Herren' : 'Damen'} V`;
              }
            }
          }
          
          meldungenMap.set(meldung.id, {
            schuetzenName: schuetze ? schuetze.name : 'Unbekannt',
            vereinsname: vereinName,
            disziplin: disziplinName,
            altersklasse: altersklasse
          });
        });

        const ergebnisseData: ErgebnisEintrag[] = [];
        const disziplinenSet = new Set<string>();
        const altersklassenSet = new Set<string>();

        kmErgebnisseSnapshot.docs.forEach(doc => {
          const data = doc.data();
          const meldungInfo = meldungenMap.get(data.meldung_id);
          
          if (meldungInfo) {
            const sortierWert = data.ergebnis_teiler ? 
              data.ergebnis_ringe + (data.ergebnis_teiler / 10) : 
              data.ergebnis_ringe;

            ergebnisseData.push({
              id: doc.id,
              schuetzenName: meldungInfo.schuetzenName,
              vereinsname: meldungInfo.vereinsname,
              disziplin: meldungInfo.disziplin,
              ringe: data.ergebnis_ringe,
              teiler: data.ergebnis_teiler,
              sortierWert,
              platz: 0, // Wird berechnet
              altersklasse: meldungInfo.altersklasse
            });

            disziplinenSet.add(meldungInfo.disziplin);
            altersklassenSet.add(meldungInfo.altersklasse);
          }
        });

        // Plätze berechnen
        const ergebnisseMitPlaetzen = berechnePlayetze(ergebnisseData);
        
        setErgebnisse(ergebnisseMitPlaetzen);
        setDisziplinen(Array.from(disziplinenSet).sort());
        setAltersklassen(Array.from(altersklassenSet).sort());
      } catch (error) {
        console.error('Fehler beim Laden:', error);
        toast({ title: 'Fehler', description: 'Ergebnisse konnten nicht geladen werden.', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [toast]);

  const berechnePlayetze = (ergebnisse: ErgebnisEintrag[]): ErgebnisEintrag[] => {
    // Gruppiere nach Disziplin und Altersklasse
    const gruppen = ergebnisse.reduce((acc, erg) => {
      const key = `${erg.disziplin}_${erg.altersklasse}`;
      if (!acc[key]) acc[key] = [];
      acc[key].push(erg);
      return acc;
    }, {} as {[key: string]: ErgebnisEintrag[]});

    // Berechne Plätze pro Gruppe
    Object.values(gruppen).forEach(gruppe => {
      gruppe.sort((a, b) => b.sortierWert - a.sortierWert);
      gruppe.forEach((erg, index) => {
        erg.platz = index + 1;
      });
    });

    return ergebnisse;
  };

  const exportToPDF = async () => {
    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');
      
      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(16);
      doc.text('Ergebnisliste Kreismeisterschaft', 20, 20);
      doc.setFontSize(12);
      doc.text(`Erstellt am: ${new Date().toLocaleDateString('de-DE')}`, 20, 30);
      
      let yPosition = 50;
      
      // Filtere Ergebnisse
      let filteredErgebnisse = ergebnisse;
      if (selectedDisziplin) {
        filteredErgebnisse = filteredErgebnisse.filter(e => e.disziplin === selectedDisziplin);
      }
      if (selectedAltersklasse) {
        filteredErgebnisse = filteredErgebnisse.filter(e => e.altersklasse === selectedAltersklasse);
      }
      
      // Gruppiere nach Disziplin und Altersklasse
      const gruppen = filteredErgebnisse.reduce((acc, erg) => {
        const key = `${erg.disziplin} - ${erg.altersklasse}`;
        if (!acc[key]) acc[key] = [];
        acc[key].push(erg);
        return acc;
      }, {} as {[key: string]: ErgebnisEintrag[]});
      
      // Für jede Gruppe eine Tabelle
      Object.entries(gruppen).forEach(([gruppe, ergebnisse]) => {
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }
        
        doc.setFontSize(14);
        doc.text(gruppe, 20, yPosition);
        yPosition += 10;
        
        const tableData = ergebnisse
          .sort((a, b) => a.platz - b.platz)
          .map(e => [
            e.platz.toString(),
            e.schuetzenName,
            e.vereinsname,
            `${e.ringe}${e.teiler ? '.' + e.teiler : ''}`,
          ]);
        
        autoTable(doc, {
          startY: yPosition,
          head: [['Platz', 'Name', 'Verein', 'Ergebnis']],
          body: tableData,
          styles: { fontSize: 10 },
          headStyles: { fillColor: [66, 139, 202] },
          margin: { left: 20, right: 20 }
        });
        
        yPosition = (doc as any).lastAutoTable.finalY + 15;
      });
      
      const fileName = `Ergebnisliste_KM_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      
      toast({ title: 'PDF erstellt', description: `${fileName} wurde heruntergeladen.` });
    } catch (error) {
      console.error('PDF-Export Fehler:', error);
      toast({ title: 'Fehler', description: 'PDF konnte nicht erstellt werden.', variant: 'destructive' });
    }
  };

  const exportToExcel = async () => {
    try {
      const XLSX = await import('xlsx');
      
      let filteredErgebnisse = ergebnisse;
      if (selectedDisziplin) {
        filteredErgebnisse = filteredErgebnisse.filter(e => e.disziplin === selectedDisziplin);
      }
      if (selectedAltersklasse) {
        filteredErgebnisse = filteredErgebnisse.filter(e => e.altersklasse === selectedAltersklasse);
      }
      
      const worksheetData = [
        ['Platz', 'Name', 'Verein', 'Disziplin', 'Altersklasse', 'Ringe', 'Teiler', 'Ergebnis'],
        ...filteredErgebnisse
          .sort((a, b) => a.platz - b.platz)
          .map(e => [
            e.platz,
            e.schuetzenName,
            e.vereinsname,
            e.disziplin,
            e.altersklasse,
            e.ringe,
            e.teiler || '',
            `${e.ringe}${e.teiler ? '.' + e.teiler : ''}`
          ])
      ];
      
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Ergebnisliste');
      
      const fileName = `Ergebnisliste_KM_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      
      toast({ title: 'Excel erstellt', description: `${fileName} wurde heruntergeladen.` });
    } catch (error) {
      console.error('Excel-Export Fehler:', error);
      toast({ title: 'Fehler', description: 'Excel konnte nicht erstellt werden.', variant: 'destructive' });
    }
  };

  // Filtere Ergebnisse für Anzeige
  let filteredErgebnisse = ergebnisse;
  if (selectedDisziplin && selectedDisziplin !== 'ALL_DISCIPLINES') {
    filteredErgebnisse = filteredErgebnisse.filter(e => e.disziplin === selectedDisziplin);
  }
  if (selectedAltersklasse && selectedAltersklasse !== 'ALL_ALTERSKLASSEN') {
    filteredErgebnisse = filteredErgebnisse.filter(e => e.altersklasse === selectedAltersklasse);
  }

  if (loading) {
    return (
      <div className="container py-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-3"></div>
          <p>Lade Ergebnislisten...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-7xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/km-orga">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-primary">🏆 Ergebnislisten</h1>
          <p className="text-muted-foreground">
            Automatisch generierte Ergebnislisten nach Disziplin und Altersklasse
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportToExcel}>
            <FileText className="h-4 w-4 mr-2" />
            Excel Export
          </Button>
          <Button onClick={exportToPDF}>
            <Download className="h-4 w-4 mr-2" />
            PDF Export
          </Button>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Select value={selectedDisziplin} onValueChange={setSelectedDisziplin}>
                <SelectTrigger>
                  <SelectValue placeholder="Alle Disziplinen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL_DISCIPLINES">Alle Disziplinen</SelectItem>
                  {disziplinen.map(d => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select value={selectedAltersklasse} onValueChange={setSelectedAltersklasse}>
                <SelectTrigger>
                  <SelectValue placeholder="Alle Altersklassen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL_ALTERSKLASSEN">Alle Altersklassen</SelectItem>
                  {altersklassen.map(a => (
                    <SelectItem key={a} value={a}>{a}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ergebnisse ({filteredErgebnisse.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {filteredErgebnisse
              .sort((a, b) => a.platz - b.platz)
              .map(ergebnis => (
                <div key={ergebnis.id} className="grid grid-cols-12 gap-3 p-3 bg-gray-50 rounded-lg items-center">
                  <div className="col-span-1 text-center">
                    <div className={`font-bold text-lg ${
                      ergebnis.platz === 1 ? 'text-yellow-600' : 
                      ergebnis.platz === 2 ? 'text-gray-500' : 
                      ergebnis.platz === 3 ? 'text-amber-600' : 'text-gray-700'
                    }`}>
                      {ergebnis.platz === 1 && '🥇'}
                      {ergebnis.platz === 2 && '🥈'}
                      {ergebnis.platz === 3 && '🥉'}
                      {ergebnis.platz > 3 && ergebnis.platz}
                    </div>
                  </div>
                  <div className="col-span-3">
                    <div className="font-medium">{ergebnis.schuetzenName}</div>
                    <div className="text-sm text-muted-foreground">{ergebnis.vereinsname}</div>
                  </div>
                  <div className="col-span-2">
                    <Badge variant="outline">{ergebnis.disziplin}</Badge>
                  </div>
                  <div className="col-span-2">
                    <Badge variant="secondary">{ergebnis.altersklasse}</Badge>
                  </div>
                  <div className="col-span-2 text-center">
                    <div className="font-bold text-lg text-green-600">
                      {ergebnis.ringe}{ergebnis.teiler ? `.${ergebnis.teiler}` : ''}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
