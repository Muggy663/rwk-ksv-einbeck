"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Download, Users, Clock, Target, Save, FileText, Plus, Minus, Brain, AlertTriangle, Lightbulb } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase/config';
import { collection, getDocs, doc, getDoc, query, where, addDoc, updateDoc } from 'firebase/firestore';
import { useParams, useRouter } from 'next/navigation';
import { analyzeStartlist, optimizeStartlist, type KIAnalyse } from '@/lib/services/startlisten-ki-service';
import { getAllDisziplinen } from '@/lib/services/km-disziplinen-service';

interface Starter {
  id: string;
  name: string;
  verein: string;
  disziplin: string;
  stand?: string;
  startzeit?: string;
  durchgang?: number;
  gewehrSharingHinweis?: string | null;
  schiesszeit?: number;
  auflage?: boolean;
  vmErgebnis?: {
    ringe: number;
    teiler?: number;
    sortierWert: number;
  };
}

interface StartlistConfig {
  austragungsort: string;
  verfuegbareStaende: string[];
  startDatum: string;
  startUhrzeit: string;
  durchgangsDauer: number;
  wechselzeit: number;
  disziplinen: string[];
  anlagensystem?: 'zuganlagen' | 'andere'; // Neu: Anlagensystem-Typ
}

export default function GenerierenPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [config, setConfig] = useState<StartlistConfig | null>(null);
  const [alleMeldungen, setAlleMeldungen] = useState<Starter[]>([]);
  const [startliste, setStartliste] = useState<Starter[]>([]);
  const [vereine, setVereine] = useState<Array<{id: string, name: string}>>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDisziplin, setSelectedDisziplin] = useState<string>('');
  const [showGruppenDialog, setShowGruppenDialog] = useState(false);
  const [gruppenZeitOffset, setGruppenZeitOffset] = useState<number>(0);
  const [showAbsageDialog, setShowAbsageDialog] = useState(false);
  const [startlisteGesperrt, setStartlisteGesperrt] = useState(false);
  const [selectedAbsageStarter, setSelectedAbsageStarter] = useState<string[]>([]);
  const [kiAnalyse, setKiAnalyse] = useState<KIAnalyse | null>(null);
  const [showKiPanel, setShowKiPanel] = useState(false);
  const [disziplinen, setDisziplinen] = useState<any[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Prüfe ob es eine Konfiguration oder gespeicherte Startliste ist
        let configData: StartlistConfig;
        let existingStartliste: Starter[] | null = null;
        
        // Versuche zuerst als Konfiguration zu laden
        const configDoc = await getDoc(doc(db, 'km_startlisten_configs', params.id as string));
        if (configDoc.exists()) {
          configData = configDoc.data() as StartlistConfig;
        } else {
          // Versuche als gespeicherte Startliste zu laden
          const startlisteDoc = await getDoc(doc(db, 'km_startlisten', params.id as string));
          if (startlisteDoc.exists()) {
            const startlisteData = startlisteDoc.data();
            existingStartliste = startlisteData.startliste;
            
            // Lade die zugehörige Konfiguration
            const relatedConfigDoc = await getDoc(doc(db, 'km_startlisten_configs', startlisteData.configId));
            if (relatedConfigDoc.exists()) {
              configData = relatedConfigDoc.data() as StartlistConfig;
            } else {
              toast({ title: 'Fehler', description: 'Zugehörige Konfiguration nicht gefunden.', variant: 'destructive' });
              return;
            }
          } else {
            toast({ title: 'Fehler', description: 'Konfiguration oder Startliste nicht gefunden.', variant: 'destructive' });
            return;
          }
        }
        
        setConfig(configData);

        // Disziplinen mit Schießzeiten laden (ZUERST!)
        const disziplinenData = await getAllDisziplinen();
        setDisziplinen(disziplinenData);

        // Alle Meldungen laden (haben disziplinId statt disziplin)
        const alleMeldungenSnapshot = await getDocs(collection(db, 'km_meldungen'));
        
        // Disziplinen-Map erstellen für ID -> Name Auflösung
        const disziplinenMap = new Map();
        disziplinenData.forEach(d => {
          disziplinenMap.set(d.id, d.name);
        });
        
        // Meldungen filtern basierend auf ausgewählten Disziplinen
        const meldungenSnapshot = { docs: alleMeldungenSnapshot.docs.filter(doc => {
          const data = doc.data();
          const disziplinName = disziplinenMap.get(data.disziplinId);
          return configData.disziplinen.includes(disziplinName);
        }) };
        
        // Schützen-Daten laden
        const schuetzenSnapshot = await getDocs(collection(db, 'km_shooters'));
        const schuetzenMap = new Map();
        schuetzenSnapshot.docs.forEach(doc => {
          schuetzenMap.set(doc.id, doc.data());
        });
        
        // Vereine laden für Namensauflösung
        const clubsSnapshot = await getDocs(collection(db, 'clubs'));
        const clubsMap = new Map();
        clubsSnapshot.docs.forEach(doc => {
          clubsMap.set(doc.id, doc.data().name);
        });
        
        const meldungen: Starter[] = [];
        meldungenSnapshot.docs.forEach(doc => {
          const data = doc.data();
          const schuetze = schuetzenMap.get(data.schuetzeId);
          const disziplinName = disziplinenMap.get(data.disziplinId);
          
          if (schuetze && disziplinName) {
            // Name aus verschiedenen möglichen Feldern zusammensetzen
            let name = 'Unbekannt';
            if (schuetze.firstName && schuetze.lastName) {
              name = `${schuetze.firstName} ${schuetze.lastName}`;
            } else if (schuetze.vorname && schuetze.nachname) {
              name = `${schuetze.vorname} ${schuetze.nachname}`;
            } else if (schuetze.name) {
              name = schuetze.name;
            }
            
            // Vereinsname über ID auflösen
            const vereinsname = clubsMap.get(schuetze.kmClubId) || clubsMap.get(schuetze.rwkClubId) || 'Unbekannt';
            
            meldungen.push({
              id: doc.id,
              name: name,
              verein: vereinsname,
              disziplin: disziplinName,
              vmErgebnis: data.vmErgebnis ? {
                ringe: data.vmErgebnis.ringe,
                teiler: data.vmErgebnis.teiler || 0,
                sortierWert: data.vmErgebnis.ringe + (data.vmErgebnis.teiler || 0) / 1000
              } : undefined
            });
          }
        });

        console.log('Geladene Meldungen:', meldungen.length);
        setAlleMeldungen(meldungen);
        
        // Vereine für PDF-Export (bereits geladen)
        const clubsData = clubsSnapshot.docs.map(doc => ({ 
          id: doc.id, 
          name: doc.data().name 
        }));
        setVereine(clubsData);
        
        // Disziplinen bereits geladen
        
        // Verwende existierende Startliste oder generiere neue
        if (existingStartliste) {
          setStartliste(existingStartliste);
          toast({ 
            title: '📝 Startliste geladen', 
            description: 'Gespeicherte Startliste wurde zum Bearbeiten geladen.',
            duration: 3000
          });
        } else {
          // Automatische Startlisten-Generierung mit KI-Optimierung
          const basisStartliste = generiereStartliste(meldungen, configData, disziplinenData);
          const optimierteStartliste = optimizeStartlist(basisStartliste, configData);
          setStartliste(optimierteStartliste);
        }
        
        // KI-Analyse durchführen
        const finalStartliste = existingStartliste || optimierteStartliste;
        const analyse = analyzeStartlist(meldungen, finalStartliste, configData);
        setKiAnalyse(analyse);
        
        if (configData.disziplinen.length > 0) {
          setSelectedDisziplin('alle');
        }
      } catch (error) {
        console.error('Fehler beim Laden:', error);
        toast({ title: 'Fehler', description: 'Daten konnten nicht geladen werden.', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [params.id, toast]);

  // Hilfsfunktion: Bestimme Schießzeit basierend auf Anlagensystem
  const getSchiesszeit = (disziplinInfo: any, config: StartlistConfig): number => {
    if (!disziplinInfo) return config.durchgangsDauer;
    
    const istZuganlage = config.anlagensystem === 'zuganlagen';
    return istZuganlage 
      ? (disziplinInfo.schiesszeit_zuganlagen || config.durchgangsDauer)
      : (disziplinInfo.schiesszeit_andere || config.durchgangsDauer);
  };

  const generiereStartliste = (meldungen: Starter[], config: StartlistConfig, disziplinenData: any[]): Starter[] => {
    const startliste: Starter[] = [];
    const staendeAnzahl = config.verfuegbareStaende.length;
    let currentTime = config.startUhrzeit;
    let durchgang = 1;

    // Gruppiere nach Disziplinen und trenne Auflage/Freihand
    const nachDisziplin = meldungen.reduce((acc, starter) => {
      // Erweitere Starter um Disziplin-Infos
      const disziplinInfo = disziplinenData.find(d => d.name === starter.disziplin);
      const schiesszeit = getSchiesszeit(disziplinInfo, config);
      const erweitertStarter = {
        ...starter,
        schiesszeit: schiesszeit,
        auflage: disziplinInfo?.auflage || false
      };
      
      const key = `${starter.disziplin}_${erweitertStarter.auflage ? 'Auflage' : 'Freihand'}`;
      if (!acc[key]) acc[key] = [];
      acc[key].push(erweitertStarter);
      return acc;
    }, {} as {[key: string]: Starter[]});

    // Verteile Starter auf Stände und Zeiten (Auflage zuerst)
    const sortedKeys = Object.keys(nachDisziplin).sort((a, b) => {
      const aAuflage = a.includes('Auflage');
      const bAuflage = b.includes('Auflage');
      if (aAuflage && !bAuflage) return -1;
      if (!aAuflage && bAuflage) return 1;
      return a.localeCompare(b);
    });

    sortedKeys.forEach(disziplinKey => {
      const starter = nachDisziplin[disziplinKey];
      
      // Alphabetische Sortierung (leistungsbasierte Sortierung deaktiviert)
      const sortiertStarter = starter.sort((a, b) => a.name.localeCompare(b.name));
      
      // TODO: Leistungsbasierte Sortierung optional aktivierbar machen
      // const sortiertStarter = starter.sort((a, b) => {
      //   if (a.vmErgebnis && b.vmErgebnis) {
      //     return b.vmErgebnis.sortierWert - a.vmErgebnis.sortierWert;
      //   }
      //   return a.name.localeCompare(b.name);
      // });
      
      let standIndex = 0;
      
      // Gruppiere Starter mit Gewehr-Sharing
      const gewehrGroups = sortiertStarter.reduce((acc, s) => {
        const key = s.gewehrSharingHinweis || `solo_${s.id}`;
        if (!acc[key]) acc[key] = [];
        acc[key].push(s);
        return acc;
      }, {} as {[key: string]: Starter[]});

      Object.values(gewehrGroups).forEach(gruppe => {
        const schiesszeit = gruppe[0].schiesszeit || config.durchgangsDauer;
        const zusatzzeit = gruppe.length > 1 ? config.wechselzeit : 0; // Extra Zeit für Gewehr-Sharing
        
        gruppe.forEach((s, index) => {
          if (standIndex === 0 && index === 0 && startliste.length > 0) {
            // Nächster Durchgang
            durchgang++;
            const [hours, minutes] = currentTime.split(':').map(Number);
            const totalMinutes = hours * 60 + minutes + schiesszeit + config.wechselzeit + zusatzzeit;
            const newHours = Math.floor(totalMinutes / 60);
            const newMinutes = totalMinutes % 60;
            currentTime = `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}`;
          }

          startliste.push({
            ...s,
            stand: config.verfuegbareStaende[standIndex],
            startzeit: currentTime,
            durchgang
          });

          standIndex = (standIndex + 1) % staendeAnzahl;
        });
      });
    });

    return startliste;
  };

  const handleStarterChange = (starterId: string, field: 'stand' | 'startzeit', value: string) => {
    const neueStartliste = startliste.map(s => 
      s.id === starterId ? { ...s, [field]: value } : s
    );
    setStartliste(neueStartliste);
    
    // KI-Analyse nach Änderung aktualisieren
    if (config) {
      const neueAnalyse = analyzeStartlist(alleMeldungen, neueStartliste, config);
      setKiAnalyse(neueAnalyse);
    }
  };
  
  const handleKiReanalyse = () => {
    if (config) {
      const analyse = analyzeStartlist(alleMeldungen, startliste, config);
      setKiAnalyse(analyse);
      toast({ title: 'KI-Analyse', description: `Qualität: ${analyse.score}% - ${analyse.konflikte.length} Konflikte erkannt` });
    }
  };

  const saveStartliste = async () => {
    console.log('Speichere Startliste...', { configId: params.id, startliste });
    try {
      const docRef = await addDoc(collection(db, 'km_startlisten'), {
        configId: params.id,
        startliste,
        datum: config?.startDatum,
        createdAt: new Date()
      });
      console.log('Startliste gespeichert mit ID:', docRef.id);
      toast({ 
        title: '✅ Gespeichert', 
        description: `Startliste wurde erfolgreich gespeichert (ID: ${docRef.id.substring(0, 8)}...)`,
        duration: 3000
      });
    } catch (error) {
      console.error('Fehler beim Speichern:', error);
      toast({ title: 'Fehler', description: 'Startliste konnte nicht gespeichert werden.', variant: 'destructive' });
    }
  };

  const exportToExcel = async () => {
    try {
      // Dynamischer Import von xlsx
      const XLSX = await import('xlsx');
      
      // Gruppiere nach Disziplinen
      const nachDisziplin = startliste.reduce((acc, starter) => {
        const key = `${starter.disziplin}${starter.auflage ? ' (Auflage)' : ''}`;
        if (!acc[key]) acc[key] = [];
        acc[key].push(starter);
        return acc;
      }, {} as {[key: string]: Starter[]});
      
      const workbook = XLSX.utils.book_new();
      
      // Für jede Disziplin ein Arbeitsblatt
      Object.entries(nachDisziplin).forEach(([disziplin, starter]) => {
        const worksheetData = [
          ['#', 'Name', 'Verein', 'Stand', 'Startzeit', 'Durchgang', 'VM-Ergebnis', 'Gewehr-Sharing', 'Schützennummer'],
          ...starter.map((s, index) => [
            index + 1,
            s.name,
            s.verein,
            s.stand,
            s.startzeit,
            s.durchgang,
            s.vmErgebnis ? `${s.vmErgebnis.ringe}${s.vmErgebnis.teiler ? '.' + s.vmErgebnis.teiler : ''}` : '',
            s.gewehrSharingHinweis || '',
            '' // Platz für Schützennummer
          ])
        ];
        
        const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
        
        // Spaltenbreiten setzen
        worksheet['!cols'] = [
          { width: 5 },   // #
          { width: 20 },  // Name
          { width: 15 },  // Verein
          { width: 8 },   // Stand
          { width: 10 },  // Startzeit
          { width: 10 },  // Durchgang
          { width: 12 },  // VM-Ergebnis
          { width: 15 },  // Gewehr-Sharing
          { width: 15 }   // Schützennummer
        ];
        
        const sheetName = disziplin.length > 31 ? disziplin.substring(0, 31) : disziplin;
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      });
      
      // Excel-Datei speichern
      const fileName = `Startliste_${new Date(config?.startDatum || '').toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      
      toast({ title: 'Excel erstellt', description: `${fileName} wurde heruntergeladen.` });
    } catch (error) {
      console.error('Excel-Export Fehler:', error);
      toast({ title: 'Fehler', description: 'Excel-Datei konnte nicht erstellt werden.', variant: 'destructive' });
    }
  };

  const handleGruppenAnpassung = () => {
    setShowGruppenDialog(true);
  };

  const handleNachmeldung = (starter: Starter) => {
    // Füge Starter zur Startliste hinzu
    const neuerStarter = {
      ...starter,
      stand: config?.verfuegbareStaende[0] || '1',
      startzeit: '09:00', // Standard-Zeit
      durchgang: 1
    };
    
    setStartliste(prev => [...prev, neuerStarter]);
    toast({ title: 'Nachmeldung', description: `${starter.name} zur Startliste hinzugefügt.` });
  };

  const handleStartlisteLock = () => {
    setStartlisteGesperrt(!startlisteGesperrt);
    toast({ 
      title: startlisteGesperrt ? 'Entsperrt' : 'Gesperrt', 
      description: `Startliste wurde ${startlisteGesperrt ? 'entsperrt' : 'gesperrt'}.` 
    });
  };

  const applyGruppenZeitOffset = () => {
    if (!selectedDisziplin || gruppenZeitOffset === 0) return;
    
    setStartliste(prev => prev.map(starter => {
      if (starter.disziplin === selectedDisziplin && starter.startzeit) {
        const [hours, minutes] = starter.startzeit.split(':').map(Number);
        const totalMinutes = hours * 60 + minutes + gruppenZeitOffset;
        const newHours = Math.floor(totalMinutes / 60);
        const newMinutes = totalMinutes % 60;
        return {
          ...starter,
          startzeit: `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}`
        };
      }
      return starter;
    }));
    
    setShowGruppenDialog(false);
    setGruppenZeitOffset(0);
    toast({ title: 'Zeiten angepasst', description: `Alle Starter in ${selectedDisziplin} um ${gruppenZeitOffset} Minuten verschoben.` });
  };





  const exportToPDF = async () => {
    await saveStartliste();
    
    try {
      // Dynamischer Import von jsPDF
      const { default: jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');
      
      const doc = new jsPDF();
      
      // Logo hinzufügen
      try {
        const logoResponse = await fetch('/images/logo2.png');
        const logoBlob = await logoResponse.blob();
        const logoBase64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(logoBlob);
        });
        doc.addImage(logoBase64, 'PNG', 150, 10, 30, 30);
      } catch (error) {
        console.warn('Logo konnte nicht geladen werden:', error);
      }
      
      // Header
      doc.setFontSize(16);
      doc.text('Startliste Kreismeisterschaft', 20, 20);
      doc.setFontSize(12);
      doc.text(`Datum: ${new Date(config?.startDatum || '').toLocaleDateString('de-DE')}`, 20, 30);
      doc.text(`Austragungsort: ${vereine.find(v => v.id === config?.austragungsort)?.name || 'Unbekannt'}`, 20, 40);
      
      let yPosition = 50;
      
      // Gruppiere nach Disziplinen
      const nachDisziplin = startliste.reduce((acc, starter) => {
        const key = `${starter.disziplin}${starter.auflage ? ' (Auflage)' : ''}`;
        if (!acc[key]) acc[key] = [];
        acc[key].push(starter);
        return acc;
      }, {} as {[key: string]: Starter[]});
      
      // Für jede Disziplin eine Tabelle
      Object.entries(nachDisziplin).forEach(([disziplin, starter]) => {
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }
        
        doc.setFontSize(14);
        doc.text(disziplin, 20, yPosition);
        yPosition += 10;
        
        // Sortiere nach Ständen
        const sortedStarter = starter.sort((a, b) => {
          const standA = parseInt(a.stand || '0');
          const standB = parseInt(b.stand || '0');
          return standA - standB;
        });
        
        const tableData = sortedStarter.map((s, index) => [
          (index + 1).toString(),
          s.name,
          s.verein,
          `Stand ${s.stand}`,
          s.startzeit || '',
          `DG ${s.durchgang}`,
          s.vmErgebnis ? `${s.vmErgebnis.ringe}${s.vmErgebnis.teiler ? '.' + s.vmErgebnis.teiler : ''}` : '',
          s.gewehrSharingHinweis || ''
        ]);
        
        autoTable(doc, {
          startY: yPosition,
          head: [['#', 'Name', 'Verein', 'Stand', 'Zeit', 'DG', 'VM-Erg.', 'Hinweis']],
          body: tableData,
          styles: { fontSize: 8 },
          headStyles: { fillColor: [66, 139, 202] },
          margin: { left: 20, right: 20 }
        });
        
        yPosition = (doc as any).lastAutoTable.finalY + 15;
      });
      
      // PDF speichern
      const fileName = `Startliste_${new Date(config?.startDatum || '').toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      
      toast({ title: 'PDF erstellt', description: `${fileName} wurde heruntergeladen.` });
    } catch (error) {
      console.error('PDF-Export Fehler:', error);
      toast({ title: 'Fehler', description: 'PDF konnte nicht erstellt werden.', variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <div className="container py-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-3"></div>
          <p>Generiere Startlisten...</p>
        </div>
      </div>
    );
  }

  if (!config) return null;

  const filteredStartliste = selectedDisziplin && selectedDisziplin !== 'alle'
    ? startliste.filter(s => s.disziplin === selectedDisziplin)
    : startliste;

  const nichtZugeteilte = alleMeldungen.filter(m => 
    !startliste.some(s => s.id === m.id) && 
    (!selectedDisziplin || selectedDisziplin === 'alle' || m.disziplin === selectedDisziplin)
  );

  return (
    <div className="container py-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-primary">🎯 Startlisten generieren</h1>
            <p className="text-muted-foreground">
              {new Date(config.startDatum).toLocaleDateString('de-DE')} - {config.verfuegbareStaende.length} Stände
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={saveStartliste}>
            <Save className="h-4 w-4 mr-2" />
            Speichern
          </Button>
          <Button 
            variant={kiAnalyse?.score && kiAnalyse.score < 80 ? "destructive" : "secondary"}
            onClick={() => setShowKiPanel(!showKiPanel)}
          >
            <Brain className="h-4 w-4 mr-2" />
            KI-Analyse ({kiAnalyse?.score || 0}%)
          </Button>
          <Button variant="outline" onClick={handleKiReanalyse}>
            <Brain className="h-4 w-4 mr-2" />
            Neu analysieren
          </Button>
          <Button variant="outline" onClick={handleGruppenAnpassung}>
            <Clock className="h-4 w-4 mr-2" />
            Gruppen-Zeiten
          </Button>
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

      {/* KI-Analyse Panel */}
      {showKiPanel && kiAnalyse && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              KI-Analyse - Qualität: {kiAnalyse.score}%
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Konflikte */}
              <div>
                <h4 className="font-medium text-red-700 mb-2 flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4" />
                  Konflikte ({kiAnalyse.konflikte.length})
                </h4>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {kiAnalyse.konflikte.map((konflikt, index) => (
                    <div key={index} className="text-xs p-2 bg-red-50 border border-red-200 rounded">
                      <div className="font-medium">{konflikt.titel}</div>
                      <div className="text-red-600">{konflikt.beschreibung}</div>
                    </div>
                  ))}
                  {kiAnalyse.konflikte.length === 0 && (
                    <div className="text-xs text-green-600">✅ Keine Konflikte erkannt</div>
                  )}
                </div>
              </div>
              
              {/* Empfehlungen */}
              <div>
                <h4 className="font-medium text-blue-700 mb-2 flex items-center gap-1">
                  <Lightbulb className="h-4 w-4" />
                  Empfehlungen ({kiAnalyse.empfehlungen.length})
                </h4>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {kiAnalyse.empfehlungen.map((empfehlung, index) => (
                    <div key={index} className="text-xs p-2 bg-blue-50 border border-blue-200 rounded">
                      <div className="font-medium">{empfehlung.titel}</div>
                      <div className="text-blue-600">{empfehlung.beschreibung}</div>
                    </div>
                  ))}
                  {kiAnalyse.empfehlungen.length === 0 && (
                    <div className="text-xs text-gray-500">Keine Empfehlungen</div>
                  )}
                </div>
              </div>
              
              {/* Optimierungen */}
              <div>
                <h4 className="font-medium text-purple-700 mb-2 flex items-center gap-1">
                  <Target className="h-4 w-4" />
                  Qualifikationen ({kiAnalyse.optimierungen.length})
                </h4>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {kiAnalyse.optimierungen.map((opt, index) => (
                    <div key={index} className="text-xs p-2 bg-purple-50 border border-purple-200 rounded">
                      <div className="font-medium">{opt.titel}</div>
                      <div className="text-purple-600">{opt.beschreibung}</div>
                    </div>
                  ))}
                  {kiAnalyse.optimierungen.length === 0 && (
                    <div className="text-xs text-gray-500">Alle Qualifikationen OK</div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Nicht zugeteilte Schützen & Verwaltung */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Verwaltung
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Nicht zugeteilte */}
            <div>
              <h4 className="font-medium mb-2">Nicht zugeteilt ({nichtZugeteilte.length})</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {nichtZugeteilte.map(starter => (
                  <div key={starter.id} className="p-2 bg-yellow-50 border border-yellow-200 rounded text-sm flex justify-between items-center">
                    <div>
                      <div className="font-medium">{starter.name}</div>
                      <div className="text-xs text-muted-foreground">{starter.verein}</div>
                      <Badge variant="outline" className="text-xs mt-1">{starter.disziplin}</Badge>
                    </div>
                    <Button size="sm" onClick={() => handleNachmeldung(starter)}>
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                {nichtZugeteilte.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    ✅ Alle Schützen zugeteilt
                  </p>
                )}
              </div>
            </div>
            
            {/* Schnell-Aktionen */}
            <div className="border-t pt-4">
              <h4 className="font-medium mb-2">Schnell-Aktionen</h4>
              <div className="space-y-2">
                <Button variant="outline" size="sm" className="w-full" onClick={() => setShowAbsageDialog(true)}>
                  Absage verwalten
                </Button>
                <Button variant="outline" size="sm" className="w-full" onClick={() => handleStartlisteLock()}>
                  {startlisteGesperrt ? 'Startliste entsperren' : 'Startliste sperren'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Startliste */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Startliste ({filteredStartliste.length} Starter)
                </CardTitle>
                <Select value={selectedDisziplin} onValueChange={setSelectedDisziplin}>
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="Alle Disziplinen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="alle">Alle Disziplinen</SelectItem>
                    {config.disziplinen.map(d => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredStartliste
                  .sort((a, b) => {
                    const standA = parseInt(a.stand || '0');
                    const standB = parseInt(b.stand || '0');
                    return standA - standB;
                  })
                  .map(starter => (
                  <div key={starter.id} className="grid grid-cols-12 gap-2 p-2 bg-green-50 border border-green-200 rounded text-sm items-center">
                    <div className="col-span-3">
                      <div className="font-medium">{starter.name}</div>
                      <div className="text-xs text-muted-foreground">{starter.verein}</div>
                      {starter.vmErgebnis && (
                        <div className="text-xs text-green-600 font-medium mt-1">
                          🏆 VM: {starter.vmErgebnis.ringe}{starter.vmErgebnis.teiler ? `.${starter.vmErgebnis.teiler}` : ''}
                        </div>
                      )}
                      {starter.gewehrSharingHinweis && (
                        <div className="text-xs text-orange-600 font-medium mt-1">
                          🔫 {starter.gewehrSharingHinweis}
                        </div>
                      )}
                    </div>
                    <div className="col-span-2">
                      <Badge variant="outline" className="text-xs">{starter.disziplin}</Badge>
                      {starter.auflage && (
                        <Badge variant="secondary" className="text-xs ml-1">Auflage</Badge>
                      )}
                    </div>
                    <div className="col-span-2">
                      <Select 
                        value={starter.stand} 
                        onValueChange={(value) => handleStarterChange(starter.id, 'stand', value)}
                        disabled={startlisteGesperrt}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {config.verfuegbareStaende.map(stand => (
                            <SelectItem key={stand} value={stand}>Stand {stand}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="time"
                        value={starter.startzeit}
                        onChange={(e) => handleStarterChange(starter.id, 'startzeit', e.target.value)}
                        className="h-8"
                        disabled={startlisteGesperrt}
                      />
                    </div>
                    <div className="col-span-1 text-center">
                      <Badge variant="secondary" className="text-xs">DG {starter.durchgang}</Badge>
                      {starter.schiesszeit && starter.schiesszeit !== config?.durchgangsDauer && (
                        <div className="text-xs text-blue-600 mt-1">{starter.schiesszeit}min</div>
                      )}
                    </div>
                  </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Absage Dialog */}
      <Dialog open={showAbsageDialog} onOpenChange={setShowAbsageDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Starter als abgesagt markieren</DialogTitle>
            <DialogDescription>
              Wählen Sie die Starter aus, die abgesagt haben. Nachrücker werden automatisch hinzugefügt.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="max-h-64 overflow-y-auto space-y-2">
              {startliste.map(starter => (
                <div key={starter.id} className="flex items-center space-x-2 p-2 border rounded">
                  <input
                    type="checkbox"
                    checked={selectedAbsageStarter.includes(starter.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedAbsageStarter(prev => [...prev, starter.id]);
                      } else {
                        setSelectedAbsageStarter(prev => prev.filter(id => id !== starter.id));
                      }
                    }}
                  />
                  <div className="flex-1">
                    <div className="font-medium">{starter.name}</div>
                    <div className="text-sm text-gray-500">{starter.verein} - {starter.disziplin} - Stand {starter.stand}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => {
                setShowAbsageDialog(false);
                setSelectedAbsageStarter([]);
              }}>
                Abbrechen
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => {
                  // Entferne abgesagte Starter
                  const neueStartliste = startliste.filter(s => !selectedAbsageStarter.includes(s.id));
                  
                  // Füge Nachrücker hinzu
                  const nachrücker = nichtZugeteilte.slice(0, selectedAbsageStarter.length);
                  nachrücker.forEach(starter => {
                    neueStartliste.push({
                      ...starter,
                      stand: config?.verfuegbareStaende[0] || '1',
                      startzeit: '09:00',
                      durchgang: 1
                    });
                  });
                  
                  setStartliste(neueStartliste);
                  setShowAbsageDialog(false);
                  setSelectedAbsageStarter([]);
                  
                  toast({ 
                    title: 'Absagen verarbeitet', 
                    description: `${selectedAbsageStarter.length} Starter abgesagt, ${nachrücker.length} Nachrücker hinzugefügt.` 
                  });
                }}
                disabled={selectedAbsageStarter.length === 0}
              >
                {selectedAbsageStarter.length} Starter absagen
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Gruppen-Anpassung Dialog */}
      <Dialog open={showGruppenDialog} onOpenChange={setShowGruppenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gruppen-Zeiten anpassen</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Disziplin auswählen</Label>
              <Select value={selectedDisziplin} onValueChange={setSelectedDisziplin}>
                <SelectTrigger>
                  <SelectValue placeholder="Disziplin wählen" />
                </SelectTrigger>
                <SelectContent>
                  {config?.disziplinen.map(d => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Zeit-Verschiebung (Minuten)</Label>
              <div className="flex items-center gap-2 mt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setGruppenZeitOffset(prev => prev - 15)}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  type="number"
                  value={gruppenZeitOffset}
                  onChange={(e) => setGruppenZeitOffset(parseInt(e.target.value) || 0)}
                  className="text-center w-20"
                />
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setGruppenZeitOffset(prev => prev + 15)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Positive Werte = später, negative Werte = früher
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowGruppenDialog(false)}>
                Abbrechen
              </Button>
              <Button onClick={applyGruppenZeitOffset} disabled={!selectedDisziplin || gruppenZeitOffset === 0}>
                Anwenden
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}