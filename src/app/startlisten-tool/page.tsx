"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Download, Users, Clock, Target, Save, FileText, Plus, Brain, Upload } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase/config';
import { doc, getDoc, collection, getDocs, addDoc, updateDoc } from 'firebase/firestore';
import { analyzeStartlist, optimizeStartlist, type KIAnalyse } from '@/lib/services/startlisten-ki-service';
import { David21Service } from '@/lib/services/david21-service';
import { MeytonMappingService } from '@/lib/services/meyton-mapping-service';

interface Starter {
  id: string;
  name: string;
  verein: string;
  disziplin: string;
  altersklasse: string;
  stand?: string;
  startzeit?: string;
  durchgang?: number;
  hinweise?: string;
  anmerkung?: string;
  schiesszeit?: number;
}

export default function StartlistenToolPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const configId = searchParams.get('id');
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState(null);
  const [meldungen, setMeldungen] = useState<Starter[]>([]);
  const [startliste, setStartliste] = useState<Starter[]>([]);
  const [selectedDisziplin, setSelectedDisziplin] = useState<string>('alle');
  const [vereine, setVereine] = useState<Array<{id: string, name: string}>>([]);
  const [kiAnalyse, setKiAnalyse] = useState<KIAnalyse | null>(null);
  const [showKiPanel, setShowKiPanel] = useState(false);

  useEffect(() => {
    if (!configId) return;
    
    // Prüfe ob startlisteId Parameter vorhanden ist
    const urlParams = new URLSearchParams(window.location.search);
    const startlisteId = urlParams.get('startlisteId');
    
    const loadData = async () => {
      try {
        // Konfiguration laden
        const configDoc = await getDoc(doc(db, 'km_startlisten_configs', configId));
        if (!configDoc.exists()) {
          setLoading(false);
          return;
        }
        
        const configData = { id: configDoc.id, ...configDoc.data() };
        setConfig(configData);

        // Disziplinen laden
        const disziplinenSnapshot = await getDocs(collection(db, 'km_disziplinen'));
        const disziplinen = {};
        disziplinenSnapshot.docs.forEach(doc => {
          disziplinen[doc.id] = doc.data().name;
        });
        
        // KM-Meldungen laden für Altersklassen und LM-Teilnahme
        const kmMeldungenSnapshot = await getDocs(collection(db, 'km_meldungen'));
        const kmAltersklassen = {};
        const kmMeldungenData = {};
        kmMeldungenSnapshot.docs.forEach(doc => {
          const data = doc.data();
          if (data.schuetzeId && data.altersklasse) {
            kmAltersklassen[data.schuetzeId] = data.altersklasse;
          }
          kmMeldungenData[doc.id] = data;
        });
        
        // Schützen laden
        const schuetzenSnapshot = await getDocs(collection(db, 'shooters'));
        const schuetzen = {};
        schuetzenSnapshot.docs.forEach(doc => {
          schuetzen[doc.id] = doc.data();
        });
        
        // Vereine laden
        const vereineSnapshot = await getDocs(collection(db, 'clubs'));
        const vereine = {};
        vereineSnapshot.docs.forEach(doc => {
          vereine[doc.id] = doc.data().name;
        });
        
        // Meldungen laden
        const meldungenSnapshot = await getDocs(collection(db, 'km_meldungen'));
        const allMeldungen = meldungenSnapshot.docs.map(doc => {
          const data = doc.data();
          const schuetze = schuetzen[data.schuetzeId];
          const disziplinName = disziplinen[data.disziplinId];
          const disziplinData = Object.values(disziplinen).find(d => d.name === disziplinName);
          
          // Altersklasse korrekt berechnen
          let altersklasse = 'Unbekannt';
          if (schuetze?.birthYear) {
            const age = (configData.saison || 2026) - schuetze.birthYear;
            const isAuflage = disziplinData?.name?.toLowerCase().includes('auflage');
            const isMale = schuetze.gender === 'male';
            
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
          
          return {
            id: doc.id,
            name: schuetze?.name || 'Unbekannt',
            verein: vereine[schuetze?.clubId] || 'Unbekannt',
            disziplin: disziplinName,
            altersklasse: altersklasse,
            anmerkung: data.anmerkung || '',
            lmTeilnahme: data.lmTeilnahme === true
          };
        });
        
        const meldungenData = allMeldungen.filter(m => configData.disziplinen.includes(m.disziplin));
        setMeldungen(meldungenData);
        
        // Vereine für Export
        const clubsData = Object.entries(vereine).map(([id, name]) => ({ id, name }));
        setVereine(clubsData);
        
        // Lade existierende Startliste oder generiere neue
        if (startlisteId) {
          // Lade gespeicherte Startliste
          const startlisteDoc = await getDoc(doc(db, 'km_startlisten', startlisteId));
          if (startlisteDoc.exists()) {
            const startlisteData = startlisteDoc.data();
            setStartliste(startlisteData.startliste || []);
            
            // KI-Analyse für geladene Startliste
            const analyse = analyzeStartlist(meldungenData, startlisteData.startliste || [], configData);
            setKiAnalyse(analyse);
            
            toast({ 
              title: '📝 Startliste geladen', 
              description: 'Gespeicherte Startliste wurde zum Bearbeiten geladen.',
              duration: 3000
            });
          }
        } else {
          // Automatische Startlisten-Generierung mit KI-Optimierung
          if (meldungenData.length > 0) {
            const basisStartliste = generiereStartliste();
            const optimierteStartliste = optimizeStartlist(basisStartliste, configData);
            setStartliste(optimierteStartliste);
            
            // KI-Analyse durchführen
            const analyse = analyzeStartlist(meldungenData, optimierteStartliste, configData);
            setKiAnalyse(analyse);
          }
        }
      } catch (error) {
        console.error('Fehler:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [configId]);

  const generiereStartliste = (): Starter[] => {
    if (!config || meldungen.length === 0) return [];
    
    const startlisteEntries: Starter[] = [];
    const staendeAnzahl = config.verfuegbareStaende.length;
    let currentTime = config.startUhrzeit;
    let durchgang = 1;

    // Gruppiere nach Disziplinen
    const nachDisziplin = meldungen.reduce((acc, starter) => {
      const key = starter.disziplin;
      if (!acc[key]) acc[key] = [];
      acc[key].push(starter);
      return acc;
    }, {} as {[key: string]: Starter[]});

    Object.values(nachDisziplin).forEach(starter => {
      const sortiertStarter = starter.sort((a, b) => a.name.localeCompare(b.name));
      
      let standIndex = 0;
      
      // Finde Gewehr-Sharing-Paare (verbesserte Erkennung)
      const gewehrSharing = new Map<string, string[]>();
      sortiertStarter.forEach(s => {
        if (s.anmerkung) {
          const anmerkung = s.anmerkung.toLowerCase();
          if ((anmerkung.includes('gewehr') && anmerkung.includes('teil')) || 
              (anmerkung.includes('teilt') && anmerkung.includes('gewehr'))) {
            // Extrahiere Namen aus Anmerkung wie "Teilt sich ein Gewehr mit Marcel Leiding"
            const nameMatches = s.anmerkung.match(/mit\s+([A-Za-z]+\s+[A-Za-z]+)/i) || 
                               s.anmerkung.match(/([A-Za-z]+\s+[A-Za-z]+)(?=\s|$)/g);
            if (nameMatches) {
              const partnerName = nameMatches[0].replace(/^mit\s+/i, '').trim();
              const key = [s.name, partnerName].sort().join('_');
              if (!gewehrSharing.has(key)) gewehrSharing.set(key, []);
              gewehrSharing.get(key)!.push(s.name, partnerName);
            }
          }
        }
      });
      
      // Gruppiere Starter
      const gewehrGroups = sortiertStarter.reduce((acc, s) => {
        let key = `solo_${s.id}`;
        
        for (const [groupKey, namen] of gewehrSharing.entries()) {
          if (namen.includes(s.name)) {
            key = `sharing_${groupKey}`;
            break;
          }
        }
        
        if (!acc[key]) acc[key] = [];
        acc[key].push(s);
        return acc;
      }, {} as {[key: string]: Starter[]});

      Object.values(gewehrGroups).forEach(gruppe => {
        const schiesszeit = config.durchgangsDauer;
        
        if (gruppe.length > 1) {
          // Gewehr-Sharing: Gleicher Stand, unterschiedliche Durchgänge
          const gruppenStand = config.verfuegbareStaende[standIndex];
          
          gruppe.forEach((s, index) => {
            const individualDurchgang = durchgang + index;
            const [hours, minutes] = config.startUhrzeit.split(':').map(Number);
            const totalMinutes = hours * 60 + minutes + ((individualDurchgang - 1) * (schiesszeit + config.wechselzeit));
            const newHours = Math.floor(totalMinutes / 60);
            const newMinutes = totalMinutes % 60;
            const individualStartzeit = `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}`;

            startlisteEntries.push({
              ...s,
              stand: gruppenStand,
              startzeit: individualStartzeit,
              durchgang: individualDurchgang,
              hinweise: 'Gewehr geteilt'
            });
          });
          
          standIndex = (standIndex + 1) % staendeAnzahl;
        } else {
          // Einzelschütze
          const einzelStarter = gruppe[0];
          let hinweise = '';
          if (einzelStarter.anmerkung) {
            if (einzelStarter.anmerkung.toLowerCase().includes('sondergenehmigung')) hinweise = 'Sondergenehmigung';
            else if (einzelStarter.anmerkung.toLowerCase().includes('behinderung')) hinweise = 'Behinderung';
            else if (einzelStarter.anmerkung.toLowerCase().includes('auflage')) hinweise = 'Nur Auflage';
          }
          
          startlisteEntries.push({
            ...einzelStarter,
            stand: config.verfuegbareStaende[standIndex],
            startzeit: currentTime,
            durchgang,
            hinweise
          });

          standIndex = (standIndex + 1) % staendeAnzahl;
        }
      });
    });

    return startlisteEntries;
  };

  const handleStarterChange = (starterId: string, field: 'stand' | 'startzeit', value: string) => {
    const neueStartliste = startliste.map(s => {
      if (s.id === starterId) {
        const updated = { ...s, [field]: value };
        
        // Durchgang basierend auf Startzeit berechnen
        if (field === 'startzeit' && config) {
          const [configHours, configMinutes] = config.startUhrzeit.split(':').map(Number);
          const [starterHours, starterMinutes] = value.split(':').map(Number);
          const configTotalMinutes = configHours * 60 + configMinutes;
          const starterTotalMinutes = starterHours * 60 + starterMinutes;
          const diffMinutes = starterTotalMinutes - configTotalMinutes;
          
          // Durchgang basierend auf 60-Minuten-Intervallen (vereinfacht)
          const durchgang = Math.floor(diffMinutes / 60) + 1;
          updated.durchgang = Math.max(1, durchgang);
        }
        
        return updated;
      }
      return s;
    });
    setStartliste(neueStartliste);
    
    // KI-Analyse nach Änderung aktualisieren
    if (config) {
      const neueAnalyse = analyzeStartlist(meldungen, neueStartliste, config);
      setKiAnalyse(neueAnalyse);
    }
  };

  const handleKiReanalyse = () => {
    if (config) {
      const analyse = analyzeStartlist(meldungen, startliste, config);
      setKiAnalyse(analyse);
      toast({ title: 'KI-Analyse', description: `Qualität: ${analyse.score}% - ${analyse.konflikte.length} Konflikte erkannt` });
    }
  };

  const saveStartliste = async () => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const startlisteId = urlParams.get('startlisteId');
      
      if (startlisteId) {
        // Bestehende Startliste überschreiben
        await updateDoc(doc(db, 'km_startlisten', startlisteId), {
          startliste,
          updatedAt: new Date()
        });
        toast({ 
          title: '✅ Aktualisiert', 
          description: 'Startliste wurde erfolgreich überschrieben.',
          duration: 3000
        });
      } else {
        // Neue Startliste erstellen
        const docRef = await addDoc(collection(db, 'km_startlisten'), {
          configId: configId,
          startliste,
          datum: config?.startDatum,
          createdAt: new Date()
        });
        toast({ 
          title: '✅ Gespeichert', 
          description: `Neue Startliste wurde erfolgreich erstellt (ID: ${docRef.id.substring(0, 8)}...)`,
          duration: 3000
        });
      }
    } catch (error) {
      console.error('Fehler beim Speichern:', error);
      toast({ title: 'Fehler', description: 'Startliste konnte nicht gespeichert werden.', variant: 'destructive' });
    }
  };

  const exportToDavid21 = async () => {
    try {
      if (!config || startliste.length === 0) {
        toast({ title: 'Fehler', description: 'Keine Startliste zum Exportieren vorhanden.', variant: 'destructive' });
        return;
      }

      // Lade alle benötigten Daten aus Firebase
      const [schuetzenSnapshot, meldungenSnapshot, disziplinenSnapshot, mannschaftenSnapshot] = await Promise.all([
        getDocs(collection(db, 'shooters')),
        getDocs(collection(db, 'km_meldungen')),
        getDocs(collection(db, 'km_disziplinen')),
        getDocs(collection(db, 'km_mannschaften'))
      ]);
      
      // Versuche Meyton-Klassen zu laden, falls vorhanden
      let meytonKlassenSnapshot;
      try {
        meytonKlassenSnapshot = await getDocs(collection(db, 'meyton_klassen'));
      } catch (error) {
        console.warn('Meyton-Klassen Collection nicht gefunden, verwende Fallback-Mapping');
        meytonKlassenSnapshot = { docs: [] };
      }
      
      // Schützen-Map für PDF Export
      const schuetzenMapPDF = {};
      schuetzenSnapshot.docs.forEach(doc => {
        const data = doc.data();
        schuetzenMapPDF[data.name] = {
          id: doc.id,
          birthYear: data.birthYear,
          gender: data.gender
        };
      });
      
      // Meldungen-Map für echte Altersklassen
      const meldungenMap = {};
      meldungenSnapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.schuetzeId) {
          meldungenMap[data.schuetzeId] = {
            altersklasse: data.altersklasse,
            disziplinId: data.disziplinId
          };
        }
      });
      
      // Disziplinen-Map
      const disziplinenMap = {};
      disziplinenSnapshot.docs.forEach(doc => {
        const data = doc.data();
        disziplinenMap[doc.id] = {
          name: data.name,
          spoNummer: data.spoNummer
        };
      });
      
      // Meyton-Klassen-Map (mit Fallback auf MeytonMappingService)
      const meytonKlassenMap = {};
      if (meytonKlassenSnapshot.docs.length > 0) {
        meytonKlassenSnapshot.docs.forEach(doc => {
          const data = doc.data();
          meytonKlassenMap[data.klassenName] = {
            id: data.klassenId,
            minAlter: data.minAlter,
            maxAlter: data.maxAlter,
            geschlecht: data.geschlecht
          };
        });
      } else {
        // Fallback: Verwende MeytonMappingService
        MeytonMappingService.KLASSEN.forEach(klasse => {
          meytonKlassenMap[klasse.name] = {
            id: klasse.id,
            minAlter: klasse.minAlter,
            maxAlter: klasse.maxAlter,
            geschlecht: klasse.geschlecht
          };
        });
      }

      // Konvertiere Startliste zu David21 Format mit echten Daten
      const david21Entries = startliste.map((starter, index) => {
        const schuetze = schuetzenMap[starter.name];
        const meldung = schuetze ? meldungenMap[schuetze.id] : null;
        const disziplin = meldung ? disziplinenMap[meldung.disziplinId] : null;
        
        const geschlecht = schuetze?.gender === 'female' ? 'W' : 'M';
        const geburtsjahr = schuetze?.birthYear || 1990;
        const echteAltersklasse = meldung?.altersklasse || starter.altersklasse;
        const echteDisziplin = disziplin?.name || starter.disziplin;
        const spoNummer = disziplin?.spoNummer || '1.10';
        

        
        return {
          startNummer: index + 1,
          nachname: starter.name.split(' ').slice(-1)[0] || starter.name,
          vorname: starter.name.split(' ').slice(0, -1).join(' ') || starter.name,
          vereinsNummer: vereine.findIndex(v => v.name === starter.verein) + 1 || 99,
          vereinsName: starter.verein,
          geburtsjahr,
          geschlecht,
          wettkampfklasse: echteAltersklasse,
          disziplin: echteDisziplin,
          startzeit: starter.startzeit || config.startUhrzeit,
          stand: starter.stand, // Stand aus Startliste
          // Meyton-spezifische Felder
          klassenId: MeytonMappingService.getKlassenId(echteAltersklasse, geschlecht, geburtsjahr),
          disziplinCode: MeytonMappingService.getDisziplinCodeBySpoNummer(spoNummer)
        };
      });

      // Disziplin-Code für CTL-Datei (aber Klassen-ID für Wettkampf-ID)
      const ersteDisziplin = david21Entries[0];
      const disziplinCode = ersteDisziplin?.disziplinCode?.includes('10110') ? 'K72' : 
                           ersteDisziplin?.disziplinCode?.includes('10210') ? 'K20' : 'K72';
      
      // Generiere TXT Datei mit korrekter Wettkampf-ID basierend auf Startzeit
      const datum = new Date(config.startDatum);
      const year = datum.getFullYear().toString().slice(-2);
      const month = (datum.getMonth() + 1).toString().padStart(2, '0');
      const day = datum.getDate().toString().padStart(2, '0');
      const startzeit = david21Entries[0]?.startzeit || config.startUhrzeit;
      // Generiere individuelle Wettkampf-IDs für jeden Starter
      const entriesWithIds = david21Entries.map(entry => {
        // Korrekte Klassen-ID aus Firebase-Datenbank
        const meytonKlasse = meytonKlassenMap[entry.wettkampfklasse];
        const klassenId = meytonKlasse?.id || 10; // Fallback auf Herren I
        
        // Debug-Ausgabe
        console.log(`Starter: ${entry.nachname}, Altersklasse: ${entry.wettkampfklasse}, Klassen-ID: ${klassenId}`);
        
        const individualWettkampfId = `W111_K${klassenId}_${year}${month}${day}_${entry.startzeit?.replace(':', '') || config.startUhrzeit.replace(':', '')}`;
        
        return {
          ...entry,
          individualWettkampfId,
          klassenId
        };
      });
      
      // Speichere Meyton-Daten in der Startliste
      const updatedStartliste = startliste.map((starter, index) => {
        const entry = entriesWithIds[index];
        return {
          ...starter,
          meytonData: {
            startNummer: entry.startNummer,
            klassenId: entry.klassenId,
            disziplinCode: entry.disziplinCode,
            wettkampfId: entry.individualWettkampfId,
            geburtsjahr: entry.geburtsjahr
          }
        };
      });
      
      // Aktualisiere Startliste in Firebase
      const urlParams = new URLSearchParams(window.location.search);
      const startlisteId = urlParams.get('startlisteId');
      if (startlisteId) {
        await updateDoc(doc(db, 'km_startlisten', startlisteId), {
          startliste: updatedStartliste,
          meytonExport: {
            datum: new Date(),
            teilnehmer: entriesWithIds.length,
            disziplinCode,
            baseWettkampfId: `W111_${disziplinCode}_${year}${month}${day}`
          }
        });
      }
      
      const txtContent = David21Service.generateStartlist(entriesWithIds);
      
      // Generiere CTL Datei
      const ctlContent = David21Service.generateControlFile(
        'VW111',
        disziplinCode,
        new Date(config.startDatum),
        config.startUhrzeit,
        david21Entries.length
      );

      // Dateinamen generieren
      const baseFilename = David21Service.generateFilename(
        'VW111',
        disziplinCode,
        new Date(config.startDatum),
        config.startUhrzeit,
        'TXT'
      );

      // Download TXT Datei (Meyton Format) - ZUERST
      David21Service.downloadFile(txtContent, baseFilename, 'text/plain');
      
      // Download CTL Datei mit Verzögerung
      setTimeout(() => {
        David21Service.downloadFile(
          ctlContent, 
          baseFilename.replace('.TXT', '.CTL'), 
          'text/plain'
        );
      }, 500);
      
      toast({ 
        title: '📤 Meyton Export', 
        description: `${david21Entries.length} Starter für Meyton Shootmaster exportiert (${baseFilename}).`,
        duration: 4000
      });
    } catch (error) {
      console.error('Meyton-Export Fehler:', error);
      toast({ title: 'Fehler', description: 'Meyton-Export fehlgeschlagen.', variant: 'destructive' });
    }
  };

  const exportToPDF = async () => {
    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');
      
      // Lade Mannschaften für E/M Erkennung
      const [schuetzenSnapshot, mannschaftenSnapshot] = await Promise.all([
        getDocs(collection(db, 'shooters')),
        getDocs(collection(db, 'km_mannschaften'))
      ]);
      
      // Schützen-Map für PDF Export
      const schuetzenMapPDF = {};
      schuetzenSnapshot.docs.forEach(doc => {
        const data = doc.data();
        schuetzenMapPDF[data.name] = {
          id: doc.id,
          birthYear: data.birthYear,
          gender: data.gender
        };
      });
      
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      
      // Erste Seite - Vollständige Titelseite
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('KREISSCHÜTZENVERBAND', pageWidth / 2, 40, { align: 'center' });
      doc.text('EINBECK e.V.', pageWidth / 2, 55, { align: 'center' });
      
      // Logo laden und einfügen
      try {
        const logoImg = new Image();
        logoImg.src = '/images/logo2.png';
        await new Promise((resolve) => {
          logoImg.onload = resolve;
          logoImg.onerror = resolve;
        });
        doc.addImage(logoImg, 'PNG', pageWidth / 2 - 25, 70, 50, 50);
      } catch (error) {
        console.warn('Logo konnte nicht geladen werden:', error);
      }
      
      doc.setFontSize(20);
      doc.text(`Kreisverbandsmeisterschaft ${config?.saison || 2025}`, pageWidth / 2, 140, { align: 'center' });
      
      doc.setFontSize(18);
      doc.text('Startlisten', pageWidth / 2, 160, { align: 'center' });
      
      // Disziplinen mit Bullet-Points
      doc.setFontSize(16);
      doc.setFont('helvetica', 'normal');
      const disziplinText = config?.disziplinen?.join(' • ') || '';
      doc.text(disziplinText, pageWidth / 2, 190, { align: 'center' });
      
      // Gruppiere nach Disziplinen
      const nachDisziplin = startliste.reduce((acc, starter) => {
        if (!acc[starter.disziplin]) acc[starter.disziplin] = [];
        acc[starter.disziplin].push(starter);
        return acc;
      }, {} as {[key: string]: typeof startliste});
      
      const datum = new Date(config?.startDatum || '').toLocaleDateString('de-DE', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      let globalStartNummer = 1;
      Object.entries(nachDisziplin).forEach(([disziplin, starter], disziplinIndex) => {
        
        // Gruppiere nach Startzeiten
        const nachStartzeit = starter.reduce((acc, s) => {
          const zeit = s.startzeit || config?.startUhrzeit || '14:00';
          if (!acc[zeit]) acc[zeit] = [];
          acc[zeit].push(s);
          return acc;
        }, {} as {[key: string]: typeof starter});
        
        let globalStartNummer = 1;
        Object.entries(nachStartzeit).forEach(([startzeit, starterGruppe], startzeitIndex) => {
          doc.addPage();
          
          // Header für Startlisten-Seiten
          try {
            const logoImg = new Image();
            logoImg.src = '/images/logo2.png';
            doc.addImage(logoImg, 'PNG', 15, 10, 20, 20);
          } catch (error) {
            console.warn('Logo konnte nicht geladen werden');
          }
          
          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
          doc.text('KREISSCHÜTZENVERBAND EINBECK e.V.', 40, 15);
          doc.text('- Kreisschießsportleiterin -', 40, 22);
          
          doc.setFont('helvetica', 'normal');
          doc.line(40, 25, pageWidth - 20, 25);
          let currentY = 35;
          
          doc.setFontSize(14);
          doc.setFont('helvetica', 'bold');
          doc.text(disziplin, 20, currentY);
          currentY += 10;
          
          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
          doc.text(`Start ${globalStartNummer} am: ${datum} um ${startzeit} Uhr im Schützenhaus der ESG Einbeck`, 20, currentY);
          currentY += 7;
          doc.text(`Schießzeit pro Durchgang = ${config?.durchgangsDauer || 50} Minuten`, 20, currentY);
          currentY += 10;
          
          globalStartNummer++;
          
          // Sortiere nach Stand und Name
          const sortierteStarter = starterGruppe.sort((a, b) => {
            const standA = parseInt(a.stand || '999');
            const standB = parseInt(b.stand || '999');
            if (standA !== standB) return standA - standB;
            return a.name.localeCompare(b.name);
          });
          
          // Erkenne Mannschaften (3er Gruppen mit gleichem Stand/Zeit)
          const mannschaftsGruppen = new Map();
          sortierteStarter.forEach(s => {
            const key = `${s.stand}_${s.startzeit}`;
            if (!mannschaftsGruppen.has(key)) mannschaftsGruppen.set(key, []);
            mannschaftsGruppen.get(key).push(s);
          });
          
          const tableData = sortierteStarter.map((s) => {
            const vereinsNr = vereine.findIndex(v => v.name === s.verein) + 1;
            const mitgliedsNr = `08-${vereinsNr.toString().padStart(3, '0')}-0001`;
            
            const nameParts = s.name.split(' ');
            const nachname = nameParts[nameParts.length - 1];
            const vorname = nameParts.slice(0, -1).join(' ');
            
            // E/M: Prüfe ob Schütze in Mannschaft (aus km_mannschaften)
            const schuetze = schuetzenMapPDF[s.name];
            let istMannschaft = false;
            if (schuetze?.id) {
              mannschaftenSnapshot.docs.forEach(doc => {
                const mannschaftData = doc.data();
                if (mannschaftData.schuetzenIds?.includes(schuetze.id)) {
                  istMannschaft = true;
                }
              });
            }
            const einzelMannschaft = istMannschaft ? 'M' : 'E';
            
            // LM: Suche ursprüngliche Meldung für lmTeilnahme
            const originalMeldung = meldungen.find(m => m.name === s.name && m.disziplin === s.disziplin);
            const lmTeilnahme = originalMeldung?.lmTeilnahme === true;
            
            return [
              s.stand || 'N/A',
              mitgliedsNr,
              nachname,
              vorname,
              s.verein,
              s.altersklasse.split(' ')[0],
              einzelMannschaft,
              lmTeilnahme ? 'J' : 'N'
            ];
          });
          
          autoTable(doc, {
            startY: currentY,
            head: [['Stand', 'Mitglieds-Nr.', 'Name', 'Vorname', 'Verein', 'WKl', 'E / M', 'LM']],
            body: tableData,
            styles: { 
              fontSize: 8,
              cellPadding: 2
            },
            headStyles: { 
              fillColor: [255, 255, 255],
              textColor: 0,
              fontStyle: 'bold',
              lineWidth: 0.5,
              lineColor: [0, 0, 0]
            },
            bodyStyles: {
              lineWidth: 0.5,
              lineColor: [0, 0, 0]
            },
            margin: { left: 20, right: 20 },
            columnStyles: {
              0: { cellWidth: 15 },
              1: { cellWidth: 25 },
              2: { cellWidth: 30 },
              3: { cellWidth: 25 },
              4: { cellWidth: 35 },
              5: { cellWidth: 15 },
              6: { cellWidth: 15 },
              7: { cellWidth: 15 }
            }
          });
          
          currentY = (doc as any).lastAutoTable.finalY + 15;
        });
      });
      
      // Footer auf jeder Seite
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(
          `Erstellt am ${new Date().toLocaleDateString('de-DE')} um ${new Date().toLocaleTimeString('de-DE')} - RWK Einbeck App v0.11.4`,
          pageWidth / 2,
          pageHeight - 10,
          { align: 'center' }
        );
        doc.text(`Seite ${i} von ${totalPages}`, pageWidth - 20, pageHeight - 10, { align: 'right' });
      }
      
      const fileName = `Startliste_KM_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      
      toast({ 
        title: '📄 PDF erstellt', 
        description: `${fileName} wurde heruntergeladen (${startliste.length} Teilnehmer).`,
        duration: 4000
      });
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
          <p>Lade...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-7xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" onClick={() => router.push('/km-orga/startlisten/uebersicht')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-primary">🎯 Startlisten Tool</h1>
          <p className="text-muted-foreground">Config ID: {configId}</p>
        </div>
      </div>

      {/* KI-Analyse Panel - Automatisch anzeigen bei Problemen */}
      {kiAnalyse && (kiAnalyse.score < 100 || showKiPanel) && (
        <Card className={`mb-6 ${kiAnalyse.score < 80 ? 'border-red-300 bg-red-50' : kiAnalyse.score < 95 ? 'border-yellow-300 bg-yellow-50' : 'border-green-300 bg-green-50'}`}>
          <CardHeader>
            <CardTitle className={`flex items-center gap-2 ${kiAnalyse.score < 80 ? 'text-red-700' : kiAnalyse.score < 95 ? 'text-yellow-700' : 'text-green-700'}`}>
              <Brain className="h-5 w-5" />
              KI-Analyse - Qualität: {kiAnalyse.score}%
              {kiAnalyse.score < 100 && (
                <span className="text-sm font-normal">
                  ({kiAnalyse.konflikte.length} Konflikte, {kiAnalyse.empfehlungen.length} Empfehlungen)
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <h4 className="font-medium text-red-700 mb-2">Konflikte ({kiAnalyse.konflikte.length})</h4>
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
              <div>
                <h4 className="font-medium text-blue-700 mb-2">Empfehlungen ({kiAnalyse.empfehlungen.length})</h4>
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
              <div>
                <h4 className="font-medium text-purple-700 mb-2">Optimierungen ({kiAnalyse.optimierungen.length})</h4>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {kiAnalyse.optimierungen.map((opt, index) => (
                    <div key={index} className="text-xs p-2 bg-purple-50 border border-purple-200 rounded">
                      <div className="font-medium">{opt.titel}</div>
                      <div className="text-purple-600">{opt.beschreibung}</div>
                    </div>
                  ))}
                  {kiAnalyse.optimierungen.length === 0 && (
                    <div className="text-xs text-gray-500">Alle Optimierungen OK</div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {config && (
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Konfiguration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium mb-1">Stände ({config.verfuegbareStaende.length})</p>
                  <div className="flex flex-wrap gap-1">
                    {config.verfuegbareStaende.map(stand => (
                      <Badge key={stand} variant="secondary" className="text-xs">{stand}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Disziplinen ({config.disziplinen.length})</p>
                  <div className="flex flex-wrap gap-1">
                    {config.disziplinen.slice(0, 2).map(disziplin => (
                      <Badge key={disziplin} variant="outline" className="text-xs">{disziplin}</Badge>
                    ))}
                    {config.disziplinen.length > 2 && (
                      <Badge variant="outline" className="text-xs">+{config.disziplinen.length - 2}</Badge>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Zeitplan</p>
                  <p className="text-xs text-muted-foreground">
                    Start: {config.startUhrzeit} Uhr<br/>
                    Durchgang: {config.durchgangsDauer} Min<br/>
                    Wechselzeit: {config.wechselzeit || 0} Min
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Meldungen ({meldungen.length})</CardTitle>
                <div className="flex gap-2">
                  <Button onClick={() => {
                    const generierte = generiereStartliste();
                    setStartliste(generierte);
                  }} disabled={meldungen.length === 0}>
                    <Target className="h-4 w-4 mr-2" />
                    Neu generieren
                  </Button>
                  <Button variant="outline" onClick={saveStartliste} disabled={startliste.length === 0}>
                    <Save className="h-4 w-4 mr-2" />
                    Speichern
                  </Button>
                  <Button 
                    variant={kiAnalyse?.score && kiAnalyse.score < 80 ? "destructive" : kiAnalyse?.score && kiAnalyse.score < 95 ? "default" : "secondary"}
                    onClick={() => setShowKiPanel(!showKiPanel)}
                  >
                    <Brain className="h-4 w-4 mr-2" />
                    KI-Analyse ({kiAnalyse?.score || 0}%)
                    {kiAnalyse && kiAnalyse.score < 100 && (
                      <span className="ml-1 text-xs">⚠️</span>
                    )}
                  </Button>
                  <Button variant="outline" onClick={handleKiReanalyse}>
                    <Brain className="h-4 w-4 mr-2" />
                    Neu analysieren
                  </Button>
                  <Button variant="outline" onClick={exportToPDF} disabled={startliste.length === 0}>
                    <Download className="h-4 w-4 mr-2" />
                    📄 Startlisten-PDF
                  </Button>
                  <Button variant="outline" onClick={exportToDavid21} disabled={startliste.length === 0}>
                    <Upload className="h-4 w-4 mr-2" />
                    Meyton Export (Beta)
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Select value={selectedDisziplin} onValueChange={setSelectedDisziplin}>
                  <SelectTrigger>
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
              {meldungen.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  Keine Meldungen für die ausgewählten Disziplinen gefunden.
                </p>
              ) : (
                <div className="space-y-2">
                  {meldungen.slice(0, 5).map(meldung => (
                    <div key={meldung.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <div>
                        <span className="font-medium">{meldung.name}</span>
                        <span className="text-sm text-muted-foreground ml-2">({meldung.verein})</span>
                        {meldung.anmerkung && (
                          <div className="text-xs text-orange-600 mt-1">{meldung.anmerkung}</div>
                        )}
                      </div>
                      <div className="text-sm">
                        <Badge variant="outline">{meldung.disziplin}</Badge>
                        <Badge variant="secondary" className="ml-1">{meldung.altersklasse}</Badge>
                      </div>
                    </div>
                  ))}
                  {meldungen.length > 5 && (
                    <p className="text-sm text-muted-foreground text-center">... und {meldungen.length - 5} weitere</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {startliste.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Generierte Startliste ({startliste.length})</CardTitle>
                  <div className="flex gap-2">
                    <Button onClick={exportToPDF} variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      PDF Export
                    </Button>
                    <Button onClick={exportToDavid21} variant="outline">
                      <Upload className="h-4 w-4 mr-2" />
                      Meyton Export (Beta)
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {(selectedDisziplin === 'alle' ? startliste : startliste.filter(s => s.disziplin === selectedDisziplin))
                      .sort((a, b) => {
                        if (a.durchgang !== b.durchgang) return (a.durchgang || 1) - (b.durchgang || 1);
                        const standA = parseInt(a.stand || '0');
                        const standB = parseInt(b.stand || '0');
                        if (standA !== standB) return standA - standB;
                        if (a.startzeit !== b.startzeit) return (a.startzeit || '').localeCompare(b.startzeit || '');
                        return a.name.localeCompare(b.name);
                      })
                      .map(starter => {
                        const gleicheZeitStand = startliste.filter(s => 
                          s.id !== starter.id && s.stand === starter.stand && s.startzeit === starter.startzeit
                        ).length > 0;
                        
                        // Prüfe Gewehr-Sharing Konflikte
                        const gewehrSharingKonflikt = starter.hinweise?.includes('Gewehr geteilt') && 
                          startliste.filter(s => 
                            s.id !== starter.id && 
                            s.hinweise?.includes('Gewehr geteilt') && 
                            s.stand === starter.stand && 
                            s.startzeit === starter.startzeit
                          ).length > 0;
                        
                        const bgColor = (gleicheZeitStand || gewehrSharingKonflikt) ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200';
                        
                        return (
                          <div key={starter.id} className={`grid grid-cols-12 gap-2 p-2 ${bgColor} rounded text-sm items-center`}>
                            <div className="col-span-3">
                              <div className="font-medium">{starter.name}</div>
                              <div className="text-xs text-muted-foreground">{starter.verein}</div>
                              <Badge variant="outline" className="text-xs mt-1">{starter.altersklasse}</Badge>
                              {starter.hinweise && (
                                <div className="text-xs text-orange-600 font-medium mt-1">
                                  {starter.hinweise}
                                </div>
                              )}
                            </div>
                            <div className="col-span-2">
                              <Badge variant="outline" className="text-xs">{starter.disziplin}</Badge>
                            </div>
                            <div className="col-span-2">
                              <Select 
                                value={starter.stand} 
                                onValueChange={(value) => handleStarterChange(starter.id, 'stand', value)}
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
                              />
                            </div>
                            <div className="col-span-1 text-center">
                              <Badge variant="secondary" className="text-xs">DG {starter.durchgang}</Badge>
                            </div>
                            <div className="col-span-2">
                              {starter.anmerkung && (
                                <div className="text-xs text-blue-600">{starter.anmerkung}</div>
                              )}
                            </div>
                            {(gleicheZeitStand || gewehrSharingKonflikt) && (
                              <div className="col-span-12 text-xs text-red-600 font-medium mt-1">
                                ⚠️ Konflikt: {gleicheZeitStand ? 'Gleicher Stand zur gleichen Zeit' : ''}
                                {gewehrSharingKonflikt ? 'Gewehr-Sharing zur gleichen Zeit nicht möglich' : ''}
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}