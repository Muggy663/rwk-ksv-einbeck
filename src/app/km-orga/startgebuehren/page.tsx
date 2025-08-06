"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Calculator } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase/config';
import { collection, getDocs } from 'firebase/firestore';
import Link from 'next/link';

interface StartgebührData {
  verein: string;
  vereinId: string;
  disziplinen: {
    [disziplin: string]: number;
  };
  gesamt: number;
  abgesagt: {
    [disziplin: string]: string[]; // Namen der abgesagten Starter
  };
  abgesagtGesamt: number;
}

export default function StartgebührenPage() {
  const { toast } = useToast();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [startgebühren, setStartgebühren] = useState<StartgebührData[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAbgesagte, setShowAbgesagte] = useState(false);

  const availableYears = Array.from({length: 5}, (_, i) => (new Date().getFullYear() - i).toString());

  useEffect(() => {
    loadData();
  }, [selectedYear]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [clubsSnapshot, disziplinenSnapshot, meldungenSnapshot, schuetzenSnapshot] = await Promise.all([
        getDocs(collection(db, 'clubs')),
        getDocs(collection(db, 'km_disziplinen')),
        getDocs(collection(db, 'km_meldungen')),
        getDocs(collection(db, 'km_shooters'))
      ]);

      const vereinsMap: {[id: string]: string} = {};
      clubsSnapshot.docs.forEach(doc => {
        vereinsMap[doc.id] = doc.data().name;
      });

      const disziplinenMap: {[id: string]: string} = {};
      disziplinenSnapshot.docs.forEach(doc => {
        disziplinenMap[doc.id] = doc.data().name;
      });

      const schuetzenMap: {[id: string]: any} = {};
      schuetzenSnapshot.docs.forEach(doc => {
        schuetzenMap[doc.id] = doc.data();
      });

      const startgebührenMap: {[vereinId: string]: StartgebührData} = {};
      
      // Lade auch Startlisten für Absagen-Info
      const startlistenSnapshot = await getDocs(collection(db, 'km_startlisten'));
      const abgesagteStarter = new Set<string>();
      
      startlistenSnapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.abgesagte) {
          data.abgesagte.forEach((id: string) => abgesagteStarter.add(id));
        }
      });

      meldungenSnapshot.docs.forEach(doc => {
        const meldung = doc.data();
        const meldungsDatum = meldung.createdAt?.toDate() || new Date();
        
        if (meldungsDatum.getFullYear().toString() !== selectedYear) return;

        const schuetze = schuetzenMap[meldung.schuetzeId];
        if (!schuetze) return;

        const vereinId = schuetze.kmClubId || schuetze.rwkClubId;
        const vereinName = vereinsMap[vereinId] || 'Unbekannt';
        const disziplinName = disziplinenMap[meldung.disziplinId] || 'Unbekannt';

        if (!startgebührenMap[vereinId]) {
          startgebührenMap[vereinId] = {
            verein: vereinName,
            vereinId: vereinId,
            disziplinen: {},
            gesamt: 0,
            abgesagt: {},
            abgesagtGesamt: 0
          };
        }

        const schuetzeName = schuetze.firstName && schuetze.lastName 
          ? `${schuetze.firstName} ${schuetze.lastName}` 
          : schuetze.name || 'Unbekannt';
        
        if (abgesagteStarter.has(doc.id)) {
          // Abgesagter Starter
          if (!startgebührenMap[vereinId].abgesagt[disziplinName]) {
            startgebührenMap[vereinId].abgesagt[disziplinName] = [];
          }
          startgebührenMap[vereinId].abgesagt[disziplinName].push(schuetzeName);
          startgebührenMap[vereinId].abgesagtGesamt++;
        } else {
          // Aktiver Starter
          if (!startgebührenMap[vereinId].disziplinen[disziplinName]) {
            startgebührenMap[vereinId].disziplinen[disziplinName] = 0;
          }
          startgebührenMap[vereinId].disziplinen[disziplinName]++;
          startgebührenMap[vereinId].gesamt++;
        }
      });

      const startgebührenArray = Object.values(startgebührenMap)
        .sort((a, b) => a.verein.localeCompare(b.verein));

      setStartgebühren(startgebührenArray);
    } catch (error) {
      console.error('Fehler beim Laden:', error);
      toast({ title: 'Fehler', description: 'Daten konnten nicht geladen werden.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = async () => {
    try {
      const XLSX = await import('xlsx');
      
      const workbook = XLSX.utils.book_new();
      
      const übersichtData = [
        ['Startgebühren-Übersicht KM ' + selectedYear],
        [''],
        ['Verein', 'Aktive Starter', 'Abgesagte Starter', 'Startgebühr pro Starter', 'Gesamt'],
        ...startgebühren.map(sg => [
          sg.verein,
          sg.gesamt,
          sg.abgesagtGesamt,
          '',
          ''
        ]),
        [''],
        ['GESAMT', 
         startgebühren.reduce((sum, sg) => sum + sg.gesamt, 0),
         startgebühren.reduce((sum, sg) => sum + sg.abgesagtGesamt, 0),
         '', 
         ''
        ]
      ];
      
      const übersichtSheet = XLSX.utils.aoa_to_sheet(übersichtData);
      übersichtSheet['!cols'] = [
        { width: 30 },
        { width: 15 },
        { width: 15 },
        { width: 20 },
        { width: 15 }
      ];
      XLSX.utils.book_append_sheet(workbook, übersichtSheet, 'Übersicht');
      
      const alleDisziplinen = [...new Set(
        startgebühren.flatMap(sg => Object.keys(sg.disziplinen))
      )].sort();
      
      const detailData = [
        ['Detailaufstellung nach Disziplinen - KM ' + selectedYear],
        [''],
        ['Verein', ...alleDisziplinen, 'Gesamt'],
        ...startgebühren.map(sg => [
          sg.verein,
          ...alleDisziplinen.map(disziplin => sg.disziplinen[disziplin] || 0),
          sg.gesamt
        ]),
        [''],
        ['GESAMT', 
         ...alleDisziplinen.map(disziplin => 
           startgebühren.reduce((sum, sg) => sum + (sg.disziplinen[disziplin] || 0), 0)
         ),
         startgebühren.reduce((sum, sg) => sum + sg.gesamt, 0)
        ]
      ];
      
      const detailSheet = XLSX.utils.aoa_to_sheet(detailData);
      detailSheet['!cols'] = [
        { width: 30 },
        ...alleDisziplinen.map(() => ({ width: 12 })),
        { width: 12 }
      ];
      XLSX.utils.book_append_sheet(workbook, detailSheet, 'Detail nach Disziplinen');
      
      const fileName = `Startgebuehren_KM_${selectedYear}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      
      toast({ 
        title: 'Excel erstellt', 
        description: `${fileName} wurde heruntergeladen. ${startgebühren.reduce((sum, sg) => sum + sg.gesamt, 0)} Starter insgesamt.` 
      });
    } catch (error) {
      console.error('Excel-Export Fehler:', error);
      toast({ title: 'Fehler', description: 'Excel-Datei konnte nicht erstellt werden.', variant: 'destructive' });
    }
  };

  const gesamtStarter = startgebühren.reduce((sum, sg) => sum + sg.gesamt, 0);

  return (
    <div className="container py-8 max-w-6xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/km-orga" className="text-primary hover:text-primary/80">← Zurück</Link>
        <div>
          <h1 className="text-3xl font-bold text-primary">💰 Startgebühren-Übersicht</h1>
          <p className="text-muted-foreground">
            Übersicht aller KM-Teilnahmen für die Abrechnung
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Jahr auswählen
              </CardTitle>
              <div className="flex gap-2">
                <Button onClick={exportToExcel} disabled={loading || gesamtStarter === 0}>
                  <FileText className="h-4 w-4 mr-2" />
                  Excel Export
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowAbgesagte(!showAbgesagte)}
                  disabled={loading}
                >
                  {showAbgesagte ? 'Absagen ausblenden' : 'Absagen anzeigen'}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableYears.map(year => (
                    <SelectItem key={year} value={year}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="text-sm text-muted-foreground">
                {loading ? 'Lade...' : `${gesamtStarter} Starter in ${startgebühren.length} Vereinen`}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Startgebühren {selectedYear}</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p>Lade Startgebühren...</p>
              </div>
            ) : startgebühren.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Keine KM-Meldungen für {selectedYear} gefunden.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Verein</th>
                      <th className="text-left p-2">Disziplinen</th>
                      <th className="text-right p-2">Anzahl Starter</th>
                    </tr>
                  </thead>
                  <tbody>
                    {startgebühren.map((sg) => (
                      <React.Fragment key={sg.vereinId}>
                        <tr className="border-b hover:bg-gray-50">
                          <td className="p-2 font-medium">{sg.verein}</td>
                          <td className="p-2">
                            <div className="flex flex-wrap gap-1">
                              {Object.entries(sg.disziplinen).map(([disziplin, anzahl]) => (
                                <span key={disziplin} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                                  {disziplin}: {anzahl}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="p-2 text-right font-medium">{sg.gesamt}</td>
                        </tr>
                        {showAbgesagte && sg.abgesagtGesamt > 0 && (
                          <tr className="border-b bg-red-50">
                            <td className="p-2 text-red-700 font-medium pl-6">↳ Absagen ({sg.abgesagtGesamt})</td>
                            <td className="p-2">
                              <div className="flex flex-wrap gap-1">
                                {Object.entries(sg.abgesagt).map(([disziplin, namen]) => (
                                  <span key={disziplin} className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded" title={namen.join(', ')}>
                                    {disziplin}: {namen.length}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="p-2 text-right text-red-700 font-medium">{sg.abgesagtGesamt}</td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                    <tr className="border-t-2 font-bold">
                      <td className="p-2">GESAMT</td>
                      <td className="p-2"></td>
                      <td className="p-2 text-right">{gesamtStarter}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">💡 Hinweise für Kreisschatzmeister</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>• Excel-Export enthält Übersicht und Detailaufstellung nach Disziplinen</p>
            <p>• Startgebühr pro Starter kann manuell in Excel eingetragen werden</p>
            <p>• Gesamtbeträge können in Excel automatisch berechnet werden</p>
            <p>• Daten basieren auf allen KM-Meldungen des gewählten Jahres</p>
            <p>• Abgesagte Starter werden separat aufgeführt - Schatzmeister entscheidet über Abrechnung</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
