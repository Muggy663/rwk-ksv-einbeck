"use client";

import React, { useState, useEffect } from 'react';
import { logError, logWarn, logInfo, logDebug } from '@/lib/utils/secure-logger';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Save, Trophy, Medal, Upload, FileText, ArrowLeft, Download, ChevronDown, ChevronUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useKMAuth } from '@/hooks/useKMAuth';
import Link from 'next/link';

interface Meldung {
  id: string;
  schuetzenName: string;
  vereinsname: string;
  disziplin: string;
  altersklasse?: string;
  kmErgebnis?: {
    ringe: number;
    teiler?: number;
    platz_disziplin?: number;
    platz_altersklasse?: number;
    serien?: number[][];
  };
}

export default function KMErgebnissePage() {
  const { toast } = useToast();
  const { hasKMAccess, loading: authLoading } = useKMAuth();
  const [meldungen, setMeldungen] = useState<Meldung[]>([]);
  const [selectedDisziplin, setSelectedDisziplin] = useState<string>('');
  const [disziplinen, setDisziplinen] = useState<string[]>([]);
  const [selectedJahr, setSelectedJahr] = useState<string>('');
  const [jahre, setJahre] = useState<{id: string, name: string}[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [inputValues, setInputValues] = useState<{[key: string]: string}>({});
  const [seriesInputs, setSeriesInputs] = useState<{[key: string]: string}>({});
  const [showPDFDialog, setShowPDFDialog] = useState(false);
  const [selectedPDFDisziplinen, setSelectedPDFDisziplinen] = useState<string[]>([]);
  const [showStarterList, setShowStarterList] = useState(false);

  // Lade Saisons
  useEffect(() => {
    const loadSaisons = async () => {
      try {
        const response = await fetch('/api/km/saisons');
        if (response.ok) {
          const data = await response.json();
          const saisonData = (data.data || []).map(saison => ({
            id: saison.id,
            name: saison.name
          }));
          // Sortiere Saisons: Neueste zuerst (LD 2026 > KKP 2026 > KK 2026)
          const sortedSaisons = saisonData.sort((a, b) => {
            // Priorisiere LD (Luftdruck) als neueste Saison
            if (a.name?.includes('Luftdruck') && !b.name?.includes('Luftdruck')) return -1;
            if (!a.name?.includes('Luftdruck') && b.name?.includes('Luftdruck')) return 1;
            
            // Dann nach Jahr sortieren (höher = neuer)
            const yearA = a.jahr || 0;
            const yearB = b.jahr || 0;
            if (yearA !== yearB) return yearB - yearA;
            
            // Dann alphabetisch
            return (a.name || '').localeCompare(b.name || '');
          });
          
          setJahre(sortedSaisons);
          // Keine automatische Auswahl - Benutzer muss bewusst wählen
        }
      } catch (error) {
        logError('Fehler beim Laden der Saisons:', error);
      }
    };
    loadSaisons();
  }, []);

  useEffect(() => {
    if (!hasKMAccess || authLoading || !selectedJahr || selectedJahr === '') return;
    
    setLoading(true);
    const loadData = async () => {
      try {
        // Lade Schützen direkt aus Firebase
        const { getDocs, collection, query, orderBy } = await import('firebase/firestore');
        const { db } = await import('@/lib/firebase/config');
        
        const [meldungenRes, shootersSnapshot, disziplinenRes, clubsRes, altersklassenRes] = await Promise.all([
          fetch(`/api/km/meldungen?saison=${selectedJahr}`),
          getDocs(query(collection(db, 'shooters'), orderBy('lastName', 'asc'))),
          fetch('/api/km/disziplinen'),
          fetch('/api/clubs'),
          fetch('/api/km/altersklassen')
        ]);
        
        logDebug('🔍 Meldungen Response Status:', meldungenRes.status);
        
        const meldungenData = meldungenRes.ok ? (await meldungenRes.json()).data || [] : [];
        const altersklassenData = altersklassenRes.ok ? (await altersklassenRes.json()).data || [] : [];

        const kmErgebnisseRes = await fetch(`/api/km/ergebnisse?saison=${selectedJahr}`);
        const kmErgebnisseData = kmErgebnisseRes.ok ? (await kmErgebnisseRes.json()).data || [] : [];
        
        logDebug('🔍 Geladene KM-Ergebnisse:', kmErgebnisseData.length);
        logDebug('🔍 Geladene Meldungen:', meldungenData.length);
        logDebug('🔍 Ausgewählte Saison:', selectedJahr);
        logDebug('🔍 API Response Meldungen:', meldungenData);
        
        if (meldungenData.length === 0) {
          logWarn('⚠️ Keine Meldungen gefunden für Saison:', selectedJahr);
        }

        const schuetzenData = shootersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        const disziplinenData = disziplinenRes.ok ? (await disziplinenRes.json()).data || [] : [];
        const clubsData = clubsRes.ok ? (await clubsRes.json()).data || [] : [];
        
        const meldungenDataProcessed: Meldung[] = [];
        const disziplinenSet = new Set<string>();
        
        logDebug('🔍 Verarbeite Meldungen:', meldungenData.length);

        const kmErgebnisseMap = new Map();
        kmErgebnisseData.forEach(data => {
          kmErgebnisseMap.set(data.meldung_id, {
            ringe: data.ergebnis_ringe,
            teiler: data.ergebnis_teiler,
            platz_disziplin: data.platz_disziplin,
            platz_altersklasse: data.platz_altersklasse,
            serien: data.serien || []
          });
        });

        const schuetzenMap = new Map();
        const disziplinenMap = new Map();
        const clubsMap = new Map();
        const altersklassenMap = new Map();
        
        schuetzenData.forEach(schuetze => {
          const fullName = schuetze.firstName && schuetze.lastName 
            ? `${schuetze.firstName} ${schuetze.lastName}`
            : schuetze.name || 'Unbekannt';
          schuetzenMap.set(schuetze.id, {
            name: fullName,
            clubId: schuetze.kmClubId || schuetze.rwkClubId || schuetze.clubId,
            birthYear: schuetze.birthYear,
            gender: schuetze.gender
          });
        });
        
        disziplinenData.forEach(disziplin => {
          disziplinenMap.set(disziplin.id, disziplin.name);
        });
        
        clubsData.forEach(club => {
          clubsMap.set(club.id, club.name);
        });
        
        altersklassenData.forEach(ak => {
          altersklassenMap.set(ak.id, ak.name);
        });

        meldungenData.forEach(meldung => {
          const schuetze = schuetzenMap.get(meldung.schuetzeId);
          const disziplinName = disziplinenMap.get(meldung.disziplinId) || 'Unbekannte Disziplin';
          
          // Berechne Altersklasse basierend auf Geburtsjahr und Geschlecht
          const altersklasseName = schuetze ? getAltersklasseForSchuetze(schuetze, disziplinName) : 'Herren I';
          
          let vereinsname = meldung.vereinsname || 'Unbekannter Verein';
          if (!meldung.vereinsname && schuetze && schuetze.clubId) {
            vereinsname = clubsMap.get(schuetze.clubId) || 'Unbekannter Verein';
          }
          
          meldungenDataProcessed.push({
            id: meldung.id,
            schuetzenName: schuetze ? schuetze.name : 'Unbekannter Schütze',
            vereinsname: vereinsname,
            disziplin: disziplinName,
            altersklasse: altersklasseName,
            kmErgebnis: meldung.kmRinge ? {
              ringe: meldung.kmRinge,
              teiler: 0,
              serien: [
                meldung.kmSerie1 ? meldung.kmSerie1.split(',').map(Number) : [],
                meldung.kmSerie2 ? meldung.kmSerie2.split(',').map(Number) : [],
                meldung.kmSerie3 ? meldung.kmSerie3.split(',').map(Number) : [],
                meldung.kmSerie4 ? meldung.kmSerie4.split(',').map(Number) : []
              ].filter(s => s.length > 0)
            } : null
          });
          disziplinenSet.add(disziplinName);
        });

        setMeldungen(meldungenDataProcessed);
        setDisziplinen(Array.from(disziplinenSet).sort());

      } catch (error) {
        logError('Fehler beim Laden:', error);
        toast({ title: 'Fehler', description: 'Daten konnten nicht geladen werden.', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [hasKMAccess, authLoading, selectedJahr, toast]);

  // Disziplin-spezifische Schusszahlen
  const getDisciplineShots = (disziplinName: string) => {
    const disciplineMap = {
      'Luftgewehr': 40,
      'Luftgewehr Auflage': 30,
      'KK-Gewehr Auflage 50m': 30,
      'KK Gewehr Auflage 100m': 30,
      'KK - Gewehr 30 Schuss': 30,
      'KK - Liegendkampf': 60,
      '10m Luftpistole': 40,
      '10 m Luftpistole Auflage': 40,
      'Zimmerstutzen': 30,
      'Zimmerstutzen Auflage': 30
    };
    return disciplineMap[disziplinName] || 30;
  };

  // Serien-Definition für Meisterschaften (immer 10 Schuss pro Serie)
  const getSeriesInfo = (disziplinName: string) => {
    const seriesMap = {
      'Luftgewehr': { count: 4, shotsPerSeries: 10 }, // 4 Serien à 10 Schuss
      'Luftgewehr Auflage': { count: 3, shotsPerSeries: 10 }, // 3 Serien à 10 Schuss
      'KK-Gewehr Auflage 50m': { count: 3, shotsPerSeries: 10 }, // 3 Serien à 10 Schuss
      'KK Gewehr Auflage 100m': { count: 3, shotsPerSeries: 10 }, // 3 Serien à 10 Schuss
      'KK - Gewehr 30 Schuss': { count: 3, shotsPerSeries: 10 }, // 3 Serien à 10 Schuss
      'KK - Liegendkampf': { count: 6, shotsPerSeries: 10 }, // 6 Serien à 10 Schuss
      '10m Luftpistole': { count: 4, shotsPerSeries: 10 }, // 4 Serien à 10 Schuss
      '10 m Luftpistole Auflage': { count: 4, shotsPerSeries: 10 }, // 4 Serien à 10 Schuss
      'Zimmerstutzen': { count: 3, shotsPerSeries: 10 }, // 3 Serien à 10 Schuss
      'Zimmerstutzen Auflage': { count: 3, shotsPerSeries: 10 } // 3 Serien à 10 Schuss
    };
    return seriesMap[disziplinName] || { count: 3, shotsPerSeries: 10 };
  };

  const calculateTotalFromSeries = (series: number[][]) => {
    return series.flat().reduce((sum, shot) => sum + shot, 0);
  };

  // Altersklassen-Berechnung (kopiert von mannschaften/page.tsx)
  const getAltersklasseForSchuetze = (schuetze: any, disziplin: string) => {
    if (!schuetze?.birthYear || !schuetze?.gender) return 'Herren I';
    
    const age = 2026 - schuetze.birthYear;
    const isAuflage = disziplin?.toLowerCase().includes('auflage');
    const isMale = schuetze.gender === 'male';
    
    if (age <= 14) return 'Schüler';
    if (age <= 16) return 'Jugend';
    if (age <= 18) return `Junioren II ${isMale ? 'm' : 'w'}`;
    if (age <= 20) return `Junioren I ${isMale ? 'm' : 'w'}`;
    
    if (isAuflage) {
      if (age <= 40) return `${isMale ? 'Herren' : 'Damen'} I`;
      if (age <= 50) return 'Senioren 0';
      if (age <= 60) return 'Senioren I';
      if (age <= 65) return 'Senioren II';
      if (age <= 70) return 'Senioren III';
      if (age <= 75) return 'Senioren IV';
      if (age <= 80) return 'Senioren V';
      return 'Senioren VI';
    } else {
      if (age <= 40) return `${isMale ? 'Herren' : 'Damen'} I`;
      if (age <= 50) return `${isMale ? 'Herren' : 'Damen'} II`;
      if (age <= 60) return `${isMale ? 'Herren' : 'Damen'} III`;
      if (age <= 70) return `${isMale ? 'Herren' : 'Damen'} IV`;
      return `${isMale ? 'Herren' : 'Damen'} V`;
    }
  };

  const parseInput = (value: string) => {
    if (!value) return { ringe: 0, teiler: 0 };
    const decimalValue = parseFloat(value.replace(',', '.')) || 0;
    return { ringe: decimalValue, teiler: 0 };
  };

  const handleErgebnisChange = (meldungId: string, field: 'ringe' | 'teiler', value: string) => {
    setMeldungen(prev => prev.map(m => {
      if (m.id === meldungId) {
        const kmErgebnis = m.kmErgebnis || { ringe: 0 };
        return {
          ...m,
          kmErgebnis: {
            ...kmErgebnis,
            [field]: field === 'ringe' ? parseInt(value) || 0 : parseInt(value) || 0
          }
        };
      }
      return m;
    }));
  };

  const handleSave = async (meldungId: string) => {
    const meldung = meldungen.find(m => m.id === meldungId);
    if (!meldung?.kmErgebnis?.ringe) {
      toast({ title: 'Fehler', description: 'Kein Ergebnis zum Speichern vorhanden.', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      // Aktualisiere die Meldung direkt mit kmErgebnis
      const kmErgebnisData = {
        ringe: meldung.kmErgebnis.ringe,
        teiler: meldung.kmErgebnis.teiler || 0,
        serien: meldung.kmErgebnis.serien || [],
        platz_disziplin: meldung.kmErgebnis.platz_disziplin || 0,
        platz_altersklasse: meldung.kmErgebnis.platz_altersklasse || 0,
        eingegeben_am: new Date().toISOString(),
        eingegeben_von: 'km-admin'
      };

      logDebug('💾 Speichere KM-Ergebnis:', { meldungId, saisonId: selectedJahr, kmErgebnisData });

      const response = await fetch('/api/km/ergebnisse-save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meldungId, kmErgebnis: kmErgebnisData })
      });
      
      if (response.ok) {
        const result = await response.json();
        logDebug('✅ Erfolgreich gespeichert:', result);
        toast({ 
          title: '✅ Gespeichert!', 
          description: `${meldung.schuetzenName}: ${meldung.kmErgebnis.ringe} Ringe`,
          className: 'border-green-500 bg-green-50'
        });
        // Input-Wert zurücksetzen damit gespeicherter Wert angezeigt wird
        setInputValues(prev => {
          const newValues = { ...prev };
          delete newValues[meldungId];
          return newValues;
        });
        // Serien-Inputs zurücksetzen damit gespeicherte Werte angezeigt werden
        setSeriesInputs(prev => {
          const newInputs = { ...prev };
          for (let i = 0; i < 6; i++) {
            delete newInputs[`${meldungId}-${i}`];
          }
          return newInputs;
        });
      } else {
        const errorText = await response.text();
        logError('❌ API Fehler:', response.status, errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
    } catch (error) {
      logError('❌ Speichern fehlgeschlagen:', error);
      toast({ 
        title: '❌ Speichern fehlgeschlagen', 
        description: `${meldung.schuetzenName}: ${error.message || 'Unbekannter Fehler'}`,
        variant: 'destructive',
        duration: 5000
      });
    } finally {
      setSaving(false);
    }
  };

  const filteredMeldungen = selectedDisziplin && selectedDisziplin !== 'ALL_DISCIPLINES'
    ? meldungen.filter(m => m.disziplin === selectedDisziplin)
    : meldungen;

  const exportToPDF = async () => {
    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');
      
      const doc = new jsPDF();
      
      // Header mit Saison
      const currentSaison = jahre.find(s => s.id === selectedJahr);
      doc.setFontSize(16);
      doc.text(`Kreismeisterschaft ${currentSaison?.name || 'KM'}`, 20, 20);
      doc.setFontSize(12);
      doc.text(`Erstellt am: ${new Date().toLocaleDateString('de-DE')}`, 20, 30);
      
      let yPosition = 50;
      
      // Filter nach ausgewählten Disziplinen für PDF
      let ergebnisse = filteredMeldungen.filter(m => m.kmErgebnis?.ringe);
      if (selectedPDFDisziplinen.length > 0) {
        ergebnisse = ergebnisse.filter(m => selectedPDFDisziplinen.includes(m.disziplin));
      }
      
      // Gruppiere nach Disziplin und Altersklasse
      const gruppen = ergebnisse.reduce((acc, erg) => {
        const key = erg.disziplin;
        if (!acc[key]) acc[key] = {};
        
        // Verwende die echte Altersklasse aus den Meldungsdaten
        const altersklasse = erg.altersklasse || 'Herren I';
        
        if (!acc[key][altersklasse]) acc[key][altersklasse] = [];
        acc[key][altersklasse].push(erg);
        return acc;
      }, {} as {[disziplin: string]: {[altersklasse: string]: any[]}});
      
      // ÜBERSICHTSSEITE - Spo Nr. und Wettkampfbezeichnungen
      doc.setFontSize(14);
      doc.text('Wettkampfübersicht', 20, yPosition);
      yPosition += 15;
      
      const uebersichtData = [];
      let spoNr = 1;
      
      // Sortiere Altersklassen von jung nach alt
      const altersklassenReihenfolge = [
        'Schüler', 'Jugend', 'Junioren II m', 'Junioren II w', 'Junioren I m', 'Junioren I w',
        'Herren I', 'Damen I', 'Herren II', 'Damen II', 'Herren III', 'Damen III', 'Herren IV', 'Damen IV', 'Herren V', 'Damen V',
        'Senioren 0', 'Senioren I', 'Senioren II', 'Senioren III', 'Senioren IV', 'Senioren V', 'Senioren VI'
      ];
      
      Object.entries(gruppen).forEach(([disziplin, altersklassen]) => {
        // Sortiere Altersklassen nach Reihenfolge
        const sortierteKlassen = Object.entries(altersklassen).sort(([a], [b]) => {
          const indexA = altersklassenReihenfolge.indexOf(a);
          const indexB = altersklassenReihenfolge.indexOf(b);
          return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
        });
        
        sortierteKlassen.forEach(([altersklasse, teilnehmer]) => {
          // Prüfe ob Mannschaften möglich sind (mind. 3 Schützen pro Verein)
          const vereinsgruppen = teilnehmer.reduce((acc, t) => {
            if (!acc[t.vereinsname]) acc[t.vereinsname] = [];
            acc[t.vereinsname].push(t);
            return acc;
          }, {} as {[verein: string]: any[]});
          
          const hatMannschaften = Object.values(vereinsgruppen).some(schuetzen => schuetzen.length >= 3);
          
          if (hatMannschaften) {
            uebersichtData.push([
              spoNr.toString(),
              'M',
              'Mannschaft',
              `${disziplin} ${altersklasse}`
            ]);
            spoNr++;
          }
          
          uebersichtData.push([
            spoNr.toString(),
            'E',
            'Einzel',
            `${disziplin} ${altersklasse}`
          ]);
          spoNr++;
        });
      });
      
      autoTable(doc, {
        startY: yPosition,
        head: [['Spo Nr.', 'M/E', 'Wettkampfbezeichnung', 'Klasse']],
        body: uebersichtData,
        styles: { fontSize: 10 },
        headStyles: { fillColor: [66, 139, 202] }
      });
      
      // Neue Seite für Ergebnislisten
      doc.addPage();
      yPosition = 20;
      
      // DETAILLIERTE ERGEBNISLISTEN
      Object.entries(gruppen).forEach(([disziplin, altersklassen]) => {
        Object.entries(altersklassen).forEach(([altersklasse, teilnehmer]) => {
          // Mannschaftswertung
          const vereinsgruppen = teilnehmer.reduce((acc, t) => {
            if (!acc[t.vereinsname]) acc[t.vereinsname] = [];
            acc[t.vereinsname].push(t);
            return acc;
          }, {} as {[verein: string]: any[]});
          
          const mannschaftsErgebnisse = Object.entries(vereinsgruppen)
            .filter(([verein, schuetzen]) => schuetzen.length >= 3)
            .map(([verein, schuetzen]) => {
              const beste3 = schuetzen
                .sort((a, b) => (b.kmErgebnis?.ringe || 0) - (a.kmErgebnis?.ringe || 0))
                .slice(0, 3);
              const mannschaftsRinge = Math.round(beste3.reduce((sum, s) => sum + (s.kmErgebnis?.ringe || 0), 0) * 10) / 10;
              return { verein, mannschaftsRinge, schuetzen: beste3 };
            })
            .sort((a, b) => b.mannschaftsRinge - a.mannschaftsRinge);
          
          if (mannschaftsErgebnisse.length > 0) {
            if (yPosition > 200) {
              doc.addPage();
              yPosition = 20;
            }
            
            doc.setFontSize(12);
            doc.text(`Ergebnisliste Mannschaft`, 20, yPosition);
            yPosition += 8;
            doc.setFontSize(10);
            doc.text(`${disziplin} ${altersklasse}`, 20, yPosition);
            yPosition += 15;
            
            const mannschaftsTableData = mannschaftsErgebnisse.map((m, index) => [
              (index + 1).toString(),
              m.verein,
              m.mannschaftsRinge.toString(),
              'Ringe'
            ]);
            
            autoTable(doc, {
              startY: yPosition,
              head: [['', 'Verein', 'Gesamt', '']],
              body: mannschaftsTableData,
              styles: { fontSize: 9 },
              headStyles: { fillColor: [66, 139, 202] }
            });
            
            yPosition = (doc as any).lastAutoTable.finalY + 20;
          }
          
          // Einzelwertung
          if (yPosition > 200) {
            doc.addPage();
            yPosition = 20;
          }
          
          doc.setFontSize(12);
          doc.text(`Ergebnisliste Einzel`, 20, yPosition);
          yPosition += 8;
          doc.setFontSize(10);
          doc.text(`${disziplin} ${altersklasse}`, 20, yPosition);
          yPosition += 15;
          
          const einzelTableData = teilnehmer
            .sort((a, b) => (b.kmErgebnis?.ringe || 0) - (a.kmErgebnis?.ringe || 0))
            .map((e, index) => {
              // Serien formatieren - nur so viele wie die Disziplin hat
              const seriesInfo = getSeriesInfo(disziplin);
              let s1 = '', s2 = '', s3 = '', s4 = '';
              if (e.kmErgebnis?.serien && e.kmErgebnis.serien.length > 0) {
                if (e.kmErgebnis.serien[0]) s1 = Math.round(e.kmErgebnis.serien[0].reduce((sum, shot) => sum + shot, 0) * 10) / 10;
                if (e.kmErgebnis.serien[1]) s2 = Math.round(e.kmErgebnis.serien[1].reduce((sum, shot) => sum + shot, 0) * 10) / 10;
                if (e.kmErgebnis.serien[2]) s3 = Math.round(e.kmErgebnis.serien[2].reduce((sum, shot) => sum + shot, 0) * 10) / 10;
                if (seriesInfo.count > 3 && e.kmErgebnis.serien[3]) s4 = Math.round(e.kmErgebnis.serien[3].reduce((sum, shot) => sum + shot, 0) * 10) / 10;
              }
              
              // Nur die benötigten Spalten zurückgeben
              if (seriesInfo.count === 3) {
                return [
                  (index + 1).toString(),
                  e.schuetzenName,
                  e.vereinsname,
                  s1.toString(),
                  s2.toString(), 
                  s3.toString(),
                  e.kmErgebnis.ringe.toString()
                ];
              } else {
                return [
                  (index + 1).toString(),
                  e.schuetzenName,
                  e.vereinsname,
                  s1.toString(),
                  s2.toString(), 
                  s3.toString(),
                  s4.toString(),
                  e.kmErgebnis.ringe.toString()
                ];
              }
            });
          
          // Dynamische Spalten je nach Disziplin
          const seriesInfo = getSeriesInfo(disziplin);
          const headers = seriesInfo.count === 3 
            ? ['', 'Name', 'Verein', '1.S', '2.S', '3.S', 'Gesamt']
            : ['', 'Name', 'Verein', '1.S', '2.S', '3.S', '4.S', 'Gesamt'];
          
          const columnStyles = seriesInfo.count === 3 
            ? {
                0: { cellWidth: 12 },
                1: { cellWidth: 35 },
                2: { cellWidth: 30 },
                3: { cellWidth: 20 },
                4: { cellWidth: 20 },
                5: { cellWidth: 20 },
                6: { cellWidth: 22 }
              }
            : {
                0: { cellWidth: 12 },
                1: { cellWidth: 30 },
                2: { cellWidth: 25 },
                3: { cellWidth: 18 },
                4: { cellWidth: 18 },
                5: { cellWidth: 18 },
                6: { cellWidth: 18 },
                7: { cellWidth: 20 }
              };
          
          autoTable(doc, {
            startY: yPosition,
            head: [headers],
            body: einzelTableData,
            styles: { fontSize: 8 },
            headStyles: { fillColor: [34, 139, 34] },
            columnStyles: columnStyles
          });
          
          yPosition = (doc as any).lastAutoTable.finalY + 25;
        });
      });
      
      const fileName = `Ergebnisliste_KM_${currentSaison?.name?.replace(/\s+/g, '_') || 'KM'}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      
      toast({ title: 'PDF erstellt', description: `${fileName} wurde heruntergeladen.` });
    } catch (error) {
      logError('PDF-Export Fehler:', error);
      toast({ title: 'Fehler', description: 'PDF konnte nicht erstellt werden.', variant: 'destructive' });
    }
  };

  if ((loading && selectedJahr) || authLoading) {
    return (
      <div className="container py-8 max-w-6xl mx-auto">
        <div className="flex items-center justify-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-3"></div>
          <p>Lade KM-Ergebnisse...</p>
        </div>
      </div>
    );
  }

  if (!hasKMAccess) {
    return (
      <div className="container py-8 max-w-6xl mx-auto">
        <div className="text-center py-10">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Zugriff verweigert</h1>
          <Link href="/km-orga" className="text-primary hover:text-primary/80">← Zurück</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="px-2 md:px-4 py-8 max-w-6xl mx-auto">
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex items-center gap-4">
          <Link href="/km-orga">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-xl md:text-3xl font-bold text-primary">🏆 KM-Ergebnisse erfassen</h1>
            <p className="text-sm md:text-base text-muted-foreground">
              Kreismeisterschafts-Ergebnisse nach dem Wettkampf erfassen für automatische Ergebnislisten
            </p>
          </div>
        </div>
      </div>

      <Card className="mb-6 border-2 border-primary bg-primary/5">
        <CardHeader>
          <CardTitle>🎯 Saison & Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-base font-semibold text-gray-800 dark:text-gray-200">🎯 Saison auswählen (Pflichtfeld)</Label>
              <select
                value={selectedJahr}
                onChange={(e) => setSelectedJahr(e.target.value)}
                className="w-full mt-2 px-4 py-3 text-lg border-2 border-primary rounded-lg bg-white focus:ring-2 focus:ring-primary focus:border-primary"
                required
              >
                <option value="">🔽 Bitte Saison wählen...</option>
                {jahre.map(jahr => (
                  <option key={jahr.id} value={jahr.id}>
                    {jahr.name}
                  </option>
                ))}
              </select>
            </div>
            {selectedJahr && (
              <div>
                <Label>Disziplin</Label>
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
            )}
          </div>
        </CardContent>
      </Card>

      {selectedJahr && (
        <Card className="mb-6 bg-gradient-to-r from-blue-50 to-green-50 border-blue-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-blue-800 flex items-center gap-2">
                📋 Starterliste - Übersicht
              </CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowPDFDialog(true)}>
                  <Download className="h-4 w-4 mr-2" />
                  PDF Export
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowStarterList(!showStarterList)}
                >
                  {showStarterList ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center mb-6">
              <div className="bg-white p-3 rounded border">
                <div className="text-2xl font-bold text-blue-600">{meldungen.length}</div>
                <div className="text-sm text-gray-600">Gemeldete Schützen</div>
              </div>
              <div className="bg-white p-3 rounded border">
                <div className="text-2xl font-bold text-green-600">{meldungen.filter(m => m.kmErgebnis?.ringe).length}</div>
                <div className="text-sm text-gray-600">Mit Ergebnissen</div>
              </div>
              <div className="bg-white p-3 rounded border">
                <div className="text-2xl font-bold text-orange-600">{disziplinen.length}</div>
                <div className="text-sm text-gray-600">Disziplinen</div>
              </div>
              <div className="bg-white p-3 rounded border">
                <div className="text-2xl font-bold text-purple-600">{new Set(meldungen.map(m => m.vereinsname)).size}</div>
                <div className="text-sm text-gray-600">Vereine</div>
              </div>
            </div>
            
            {showStarterList && (
              <div className="space-y-4">
                {disziplinen.map(disziplin => {
                  const disziplinMeldungen = meldungen.filter(m => m.disziplin === disziplin);
                  return (
                    <div key={disziplin} className="bg-white p-4 rounded border">
                      <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                        🎯 {disziplin} ({disziplinMeldungen.length} Starter)
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
                        {disziplinMeldungen.map(meldung => (
                          <div key={meldung.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                            <span className="font-medium">{meldung.schuetzenName}</span>
                            <span className="text-gray-600 text-xs">{meldung.vereinsname}</span>
                            {meldung.kmErgebnis?.ringe && (
                              <Badge variant="secondary" className="ml-2">✅</Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {!selectedJahr && (
        <Card className="mb-6 border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="text-center py-4">
              <p className="text-orange-800 font-medium mb-2">⚠️ Bitte wählen Sie zuerst eine Saison aus</p>
              <p className="text-sm text-orange-600">Die Ergebnisse werden erst nach der Saisonauswahl angezeigt, um Fehlmeldungen zu vermeiden.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedJahr && (
        <Card>
          <CardHeader>
            <CardTitle>KM-Ergebnisse ({filteredMeldungen.length} Meldungen)</CardTitle>
          </CardHeader>
          <CardContent>
          <div className="space-y-4">
            {filteredMeldungen.map(meldung => (
              <Card key={meldung.id} className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{meldung.schuetzenName}</div>
                      <div className="text-sm text-muted-foreground">{meldung.vereinsname}</div>
                    </div>
                    <Badge variant="outline">{meldung.disziplin} {meldung.altersklasse && `- ${meldung.altersklasse}`}</Badge>
                  </div>
                  
                  <div className="space-y-3">
                    {(() => {
                      const shots = getDisciplineShots(meldung.disziplin);
                      const seriesInfo = getSeriesInfo(meldung.disziplin);
                      const currentSeries = meldung.kmErgebnis?.serien || Array(seriesInfo.count).fill(null).map(() => []);
                      
                      return (
                        <div className="space-y-2">
                          <Label className="text-xs font-semibold">
                            {meldung.disziplin}: {shots} Schuss in {seriesInfo.count} Serien à {seriesInfo.shotsPerSeries}
                          </Label>
                          {Array.from({ length: seriesInfo.count }, (_, serieIndex) => (
                            <div key={serieIndex}>
                              <Label className="text-xs">Serie {serieIndex + 1} ({seriesInfo.shotsPerSeries} Schuss)</Label>
                              <Input
                                type="text"
                                value={seriesInputs[`${meldung.id}-${serieIndex}`] || (currentSeries[serieIndex] && currentSeries[serieIndex].length > 0 ? currentSeries[serieIndex].map(v => v.toFixed(1).replace('.', ',')).join(' ') : '')}
                                onChange={(e) => {
                                  const inputKey = `${meldung.id}-${serieIndex}`;
                                  setSeriesInputs(prev => ({ ...prev, [inputKey]: e.target.value }));
                                }}
                                onBlur={(e) => {
                                  const values = e.target.value.split(/[\s]+/).map(v => {
                                    const num = parseFloat(v.trim().replace(',', '.'));
                                    return (!isNaN(num) && num >= 0 && num <= 109) ? num : null;
                                  }).filter(v => v !== null).slice(0, seriesInfo.shotsPerSeries);
                                  
                                  const newSeries = [...currentSeries];
                                  newSeries[serieIndex] = values;
                                  const total = Math.round(calculateTotalFromSeries(newSeries) * 10) / 10;
                                  
                                  setMeldungen(prev => prev.map(m => {
                                    if (m.id === meldung.id) {
                                      return {
                                        ...m,
                                        kmErgebnis: {
                                          ...m.kmErgebnis,
                                          serien: newSeries,
                                          ringe: total
                                        }
                                      };
                                    }
                                    return m;
                                  }));
                                }}
                                placeholder=""
                                className="text-xs h-8"
                              />
                              {currentSeries[serieIndex] && currentSeries[serieIndex].length > 0 && (
                                <div className="text-xs text-blue-600">
                                  {currentSeries[serieIndex].length}/{seriesInfo.shotsPerSeries} Schuss = {Math.round(currentSeries[serieIndex].reduce((sum, val) => sum + val, 0) * 10) / 10} Ringe
                                </div>
                              )}
                            </div>
                          ))}
                          {meldung.kmErgebnis?.serien && (
                            <div className="text-sm font-semibold text-green-600 p-2 bg-green-50 rounded">
                              Gesamtergebnis: {Math.round(calculateTotalFromSeries(meldung.kmErgebnis.serien) * 10) / 10} Ringe
                            </div>
                          )}
                        </div>
                      );
                    })()}
                    
                    <div>
                      <Label className="text-xs">Ergebnis (Ringe.Zehntel)</Label>
                      <div className="flex gap-2">
                        <Input
                          type="text"
                          value={inputValues[meldung.id] ?? (meldung.kmErgebnis ? meldung.kmErgebnis.ringe.toString().replace('.', ',') : '')}
                          onChange={(e) => {
                            const value = e.target.value;
                            setInputValues(prev => ({ ...prev, [meldung.id]: value }));
                            
                            if (value && !value.endsWith(',') && !value.endsWith('.')) {
                              const { ringe, teiler } = parseInput(value);
                              handleErgebnisChange(meldung.id, 'ringe', ringe.toString());
                              handleErgebnisChange(meldung.id, 'teiler', teiler.toString());
                            }
                          }}
                          className="flex-1"
                          placeholder="z.B. 387,5"
                        />
                        <div className="flex gap-1">
                          <Button 
                            size="sm" 
                            onClick={() => handleSave(meldung.id)}
                            disabled={saving || !meldung.kmErgebnis?.ringe}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            {saving ? '💾' : '✅'}
                          </Button>
                          {meldung.kmErgebnis?.ringe && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                setMeldungen(prev => prev.map(m => {
                                  if (m.id === meldung.id) {
                                    return {
                                      ...m,
                                      kmErgebnis: {
                                        ringe: 0,
                                        teiler: 0,
                                        serien: []
                                      }
                                    };
                                  }
                                  return m;
                                }));
                              }}
                              className="text-red-600 hover:text-red-700"
                            >
                              🗑️
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          </CardContent>
        </Card>
      )}

      {/* PDF Export Dialog */}
      {showPDFDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-bold mb-4">PDF Export - Disziplinen wählen</h3>
            <div className="space-y-2 mb-4">
              {disziplinen.map(disziplin => (
                <label key={disziplin} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedPDFDisziplinen.includes(disziplin)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedPDFDisziplinen(prev => [...prev, disziplin]);
                      } else {
                        setSelectedPDFDisziplinen(prev => prev.filter(d => d !== disziplin));
                      }
                    }}
                  />
                  <span>{disziplin}</span>
                </label>
              ))}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowPDFDialog(false)}>Abbrechen</Button>
              <Button onClick={() => {
                exportToPDF();
                setShowPDFDialog(false);
              }}>PDF erstellen</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
