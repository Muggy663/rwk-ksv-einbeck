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
  const [sortierung, setSortierung] = useState<string>('durchgang-stand');

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
        
        // Meldungen laden - nur echte KM-Meldungen
        const meldungenSnapshot = await getDocs(collection(db, 'km_meldungen'));
        const allMeldungen = meldungenSnapshot.docs
          .filter(doc => doc.data().schuetzeId && doc.data().disziplinId) // Nur vollständige Meldungen
          .map(doc => {
            const data = doc.data();
            const schuetze = schuetzen[data.schuetzeId];
            const disziplinName = disziplinen[data.disziplinId];
            
            // Nur Meldungen mit gültigen Schützen und Disziplinen
            if (!schuetze || !disziplinName) return null;
            
            // Berechne Altersklasse wie in KM-Meldungen Seite
            let altersklasse = 'Unbekannt';
            if (schuetze?.birthYear) {
              const age = (configData.saison || 2026) - schuetze.birthYear;
              const isAuflage = disziplinName?.toLowerCase().includes('auflage');
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
              verein: vereine[schuetze?.kmClubId || schuetze?.rwkClubId || schuetze?.clubId] || 'Unbekannt',
              disziplin: disziplinName,
              altersklasse: altersklasse,
              anmerkung: data.anmerkung || '',
              lmTeilnahme: data.lmTeilnahme === true
            };
          })
          .filter(Boolean); // Entferne null-Werte
        
        // Filtere nur Meldungen für die konfigurierte Saison und Disziplinen
        const meldungenData = allMeldungen.filter(m => 
          configData.disziplinen.includes(m.disziplin)
        );
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
            const basisStartliste = await generiereStartliste();
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

  const generiereStartliste = async (): Starter[] => {
    if (!config || meldungen.length === 0) return [];
    
    const startlisteEntries: Starter[] = [];
    const staendeAnzahl = config.verfuegbareStaende.length;
    let durchgang = 1;

    // Lade Mannschaften, Meldungen, Schützen, Disziplinen und Vereine aus Datenbank
    const [mannschaftenSnapshot, kmMeldungenSnapshot, schuetzenSnapshot, disziplinenSnapshot, vereineSnapshot] = await Promise.all([
      getDocs(collection(db, 'km_mannschaften')),
      getDocs(collection(db, 'km_meldungen')),
      getDocs(collection(db, 'shooters')),
      getDocs(collection(db, 'km_disziplinen')),
      getDocs(collection(db, 'clubs'))
    ]);
    
    // Filtere Mannschaften für die richtige Saison
    const saisonStr = (config.saison || 2026).toString();
    const mannschaften = mannschaftenSnapshot.docs
      .filter(doc => doc.data().saison === saisonStr)
      .map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Filtere Meldungen für die richtige Saison  
    const kmMeldungen = kmMeldungenSnapshot.docs
      .filter(doc => doc.data().saison === saisonStr)
      .map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Globale Stand-Zeit-Matrix zur Konfliktprüfung
    const standZeitMatrix = new Set<string>();
    
    // Verwende nur die echten KM-Meldungen für die Startliste
    const echteKmMeldungen = kmMeldungen.map(meldung => {
      const schuetze = schuetzenSnapshot.docs.find(doc => doc.id === meldung.schuetzeId)?.data();
      const disziplin = disziplinenSnapshot.docs.find(doc => doc.id === meldung.disziplinId)?.data();
      
      if (!schuetze || !disziplin) {
        return null;
      }
      
      return {
        id: meldung.id || `meldung_${Date.now()}_${Math.random()}`,
        name: schuetze.name,
        verein: (() => {
          const clubId = schuetze.kmClubId || schuetze.rwkClubId || schuetze.clubId;
          const club = vereineSnapshot.docs.find(doc => doc.id === clubId);
          return club?.data()?.name || 'Unbekannt';
        })(),
        disziplin: disziplin.name,
        altersklasse: 'Berechnet',
        anmerkung: meldung.anmerkung || '',
        lmTeilnahme: meldung.lmTeilnahme === true
      };
    }).filter(Boolean);
    

    
    // Gruppiere nach Disziplinen
    const nachDisziplin = echteKmMeldungen.reduce((acc, starter) => {
      const key = starter.disziplin;
      if (!acc[key]) acc[key] = [];
      acc[key].push(starter);
      return acc;
    }, {} as {[key: string]: Starter[]});

    Object.entries(nachDisziplin).forEach(([disziplinName, starter]) => {
      // 1. Finde Mannschaften für diese Disziplin
      const disziplinMannschaften = mannschaften.filter(m => {
        // Finde Disziplin-Name für diese Mannschaft
        const disziplinDoc = disziplinenSnapshot.docs.find(d => d.id === m.disziplinId);
        const mannschaftDisziplin = disziplinDoc?.data()?.name;
        return mannschaftDisziplin === disziplinName;
      });
      

      
      // 2. Mannschaften + Einzelschützen optimal auf Durchgänge verteilen
      // Sammle alle Schützen-IDs die bereits in Mannschaften sind
      const mannschaftsSchuetzenIds = new Set();
      disziplinMannschaften.forEach(m => {
        m.schuetzenIds?.forEach(id => mannschaftsSchuetzenIds.add(id));
      });
      
      const einzelSchuetzen = starter.filter(s => {
        // Prüfe über ursprüngliche Meldung
        const kmMeldung = kmMeldungen.find(m => m.id === s.id);
        
        // Nur Einzelschütze wenn schuetzeId NICHT in Mannschaften
        return kmMeldung && !mannschaftsSchuetzenIds.has(kmMeldung.schuetzeId);
      }).sort((a, b) => a.name.localeCompare(b.name));
      
      let einzelSchuetzenIndex = 0;
      let currentDurchgangBelegt = 0;
      

      
      // Verarbeite alle Mannschaften und Einzelschützen zusammen
      disziplinMannschaften.forEach((mannschaft, mannschaftIndex) => {
        const mannschaftStarter = starter.filter(s => {
          // Direkte ID-Prüfung über die ursprüngliche Meldung
          const kmMeldung = kmMeldungen.find(m => m.id === s.id);
          const isInTeam = mannschaft.schuetzenIds?.includes(kmMeldung?.schuetzeId);

          return isInTeam;
        });
        

        
        // Prüfe ob Mannschaft in aktuellen Durchgang passt
        if (currentDurchgangBelegt + mannschaftStarter.length > staendeAnzahl) {
          durchgang++;
          currentDurchgangBelegt = 0;
        }
        
        // Prüfe ob bereits eine Mannschaft desselben Vereins in diesem Durchgang schießt
        const vereinBereitsImDurchgang = startlisteEntries.some(entry => 
          entry.durchgang === durchgang && 
          entry.verein === ((() => {
            const clubId = schuetzenSnapshot.docs.find(doc => 
              mannschaft.schuetzenIds?.includes(doc.id)
            )?.data()?.kmClubId || 
            schuetzenSnapshot.docs.find(doc => 
              mannschaft.schuetzenIds?.includes(doc.id)
            )?.data()?.rwkClubId || 
            schuetzenSnapshot.docs.find(doc => 
              mannschaft.schuetzenIds?.includes(doc.id)
            )?.data()?.clubId;
            const club = vereineSnapshot.docs.find(doc => doc.id === clubId);
            return club?.data()?.name;
          })()
        ));
        
        // Wenn Verein bereits im Durchgang, versuche Durchgang mit anderen zu füllen
        if (vereinBereitsImDurchgang) {
          // Fülle aktuellen Durchgang mit Einzelschützen oder anderen Mannschaften auf
          const restplaetze = staendeAnzahl - currentDurchgangBelegt;
          let aufgefuellt = 0;
          
          // Versuche mit Einzelschützen aufzufüllen
          while (aufgefuellt < restplaetze && einzelSchuetzenIndex < einzelSchuetzen.length) {
            const s = einzelSchuetzen[einzelSchuetzenIndex];
            const [hours, minutes] = config.startUhrzeit.split(':').map(Number);
            const totalMinutes = hours * 60 + minutes + ((durchgang - 1) * (config.durchgangsDauer + config.wechselzeit));
            const newHours = Math.floor(totalMinutes / 60);
            const newMinutes = totalMinutes % 60;
            const startzeit = `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}`;
            
            let hinweise = 'Einzelschütze';
            if (s.anmerkung?.toLowerCase().includes('sondergenehmigung')) hinweise = 'Sondergenehmigung';
            else if (s.anmerkung?.toLowerCase().includes('behinderung')) hinweise = 'Behinderung';
            
            let standIndex = currentDurchgangBelegt + aufgefuellt;
            let testStand = config.verfuegbareStaende[standIndex % staendeAnzahl];
            let testKey = `${testStand}_${startzeit}`;
            
            while (standZeitMatrix.has(testKey)) {
              standIndex++;
              testStand = config.verfuegbareStaende[standIndex % staendeAnzahl];
              testKey = `${testStand}_${startzeit}`;
            }
            
            standZeitMatrix.add(testKey);
            
            startlisteEntries.push({
              ...s,
              id: `${s.id}_fueller_${einzelSchuetzenIndex}`,
              stand: testStand,
              startzeit,
              durchgang,
              hinweise: `${hinweise} (Auffüller)`
            });
            
            aufgefuellt++;
            einzelSchuetzenIndex++;
          }
          
          // Springe zum nächsten Durchgang für die aktuelle Mannschaft
          durchgang++;
          currentDurchgangBelegt = 0;
        }
        
        // Alle Mannschafts-Schützen zur gleichen Zeit (gleicher Durchgang)
        const [hours, minutes] = config.startUhrzeit.split(':').map(Number);
        const totalMinutes = hours * 60 + minutes + ((durchgang - 1) * (config.durchgangsDauer + config.wechselzeit));
        const newHours = Math.floor(totalMinutes / 60);
        const newMinutes = totalMinutes % 60;
        const startzeit = `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}`;
        
        mannschaftStarter.forEach((s, index) => {
          // Finde nächsten freien Stand
          let standIndex = currentDurchgangBelegt + index;
          let testStand = config.verfuegbareStaende[standIndex % staendeAnzahl];
          let testKey = `${testStand}_${startzeit}`;
          
          while (standZeitMatrix.has(testKey)) {
            standIndex++;
            testStand = config.verfuegbareStaende[standIndex % staendeAnzahl];
            testKey = `${testStand}_${startzeit}`;
          }
          
          standZeitMatrix.add(testKey);
          
          startlisteEntries.push({
            ...s,
            id: `${s.id}_mannschaft_${mannschaftIndex}_${index}`, // Eindeutige ID
            stand: testStand,
            startzeit,
            durchgang,
            hinweise: `Mannschaft ${mannschaftIndex + 1}`
          });
        });
        currentDurchgangBelegt += mannschaftStarter.length;
        
        // Fülle Durchgang mit Einzelschützen auf wenn nächste Mannschaft nicht mehr passt
        const naechsteMannschaft = disziplinMannschaften[mannschaftIndex + 1];
        if (!naechsteMannschaft || currentDurchgangBelegt + 3 > staendeAnzahl) {
          // Keine weitere Mannschaft oder sie passt nicht mehr - fülle auf
          while (currentDurchgangBelegt < staendeAnzahl && einzelSchuetzenIndex < einzelSchuetzen.length) {
            const s = einzelSchuetzen[einzelSchuetzenIndex];
            const [hours, minutes] = config.startUhrzeit.split(':').map(Number);
            const totalMinutes = hours * 60 + minutes + ((durchgang - 1) * (config.durchgangsDauer + config.wechselzeit));
            const newHours = Math.floor(totalMinutes / 60);
            const newMinutes = totalMinutes % 60;
            const startzeit = `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}`;
            
            let hinweise = 'Einzelschütze';
            if (s.anmerkung?.toLowerCase().includes('sondergenehmigung')) hinweise = 'Sondergenehmigung';
            else if (s.anmerkung?.toLowerCase().includes('behinderung')) hinweise = 'Behinderung';
            
            // Finde nächsten freien Stand
            let standIndex = currentDurchgangBelegt;
            let testStand = config.verfuegbareStaende[standIndex % staendeAnzahl];
            let testKey = `${testStand}_${startzeit}`;
            
            while (standZeitMatrix.has(testKey)) {
              standIndex++;
              testStand = config.verfuegbareStaende[standIndex % staendeAnzahl];
              testKey = `${testStand}_${startzeit}`;
            }
            
            standZeitMatrix.add(testKey);
            
            startlisteEntries.push({
              ...s,
              id: `${s.id}_einzelschuetze_${einzelSchuetzenIndex}`, // Eindeutige ID
              stand: testStand,
              startzeit,
              durchgang,
              hinweise
            });
            currentDurchgangBelegt++;
            einzelSchuetzenIndex++;
          }
        }
        
      });
      
      // Restliche Einzelschützen in neue Durchgänge
      while (einzelSchuetzenIndex < einzelSchuetzen.length) {
        // Neuer Durchgang wenn nötig
        if (currentDurchgangBelegt >= staendeAnzahl) {
          durchgang++;
          currentDurchgangBelegt = 0;
        }
        
        const s = einzelSchuetzen[einzelSchuetzenIndex];
        const [hours, minutes] = config.startUhrzeit.split(':').map(Number);
        const totalMinutes = hours * 60 + minutes + ((durchgang - 1) * (config.durchgangsDauer + config.wechselzeit));
        const newHours = Math.floor(totalMinutes / 60);
        const newMinutes = totalMinutes % 60;
        const startzeit = `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}`;
        
        let hinweise = 'Einzelschütze';
        if (s.anmerkung?.toLowerCase().includes('sondergenehmigung')) hinweise = 'Sondergenehmigung';
        else if (s.anmerkung?.toLowerCase().includes('behinderung')) hinweise = 'Behinderung';
        
        // Finde nächsten freien Stand
        let standIndex = currentDurchgangBelegt;
        let testStand = config.verfuegbareStaende[standIndex % staendeAnzahl];
        let testKey = `${testStand}_${startzeit}`;
        
        while (standZeitMatrix.has(testKey)) {
          standIndex++;
          testStand = config.verfuegbareStaende[standIndex % staendeAnzahl];
          testKey = `${testStand}_${startzeit}`;
        }
        
        standZeitMatrix.add(testKey);
        
        startlisteEntries.push({
          ...s,
          id: `${s.id}_restlich_${einzelSchuetzenIndex}`, // Eindeutige ID
          stand: testStand,
          startzeit,
          durchgang,
          hinweise
        });
        currentDurchgangBelegt++;
        einzelSchuetzenIndex++;
      }
      

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
        const schuetze = schuetzenMapPDF[starter.name];
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
      
      // Lade Mannschaften und Disziplinen für E/M Erkennung und SPO-Nummern
      const [schuetzenSnapshot, mannschaftenSnapshot, disziplinenSnapshot, kmMeldungenSnapshot] = await Promise.all([
        getDocs(collection(db, 'shooters')),
        getDocs(collection(db, 'km_mannschaften')),
        getDocs(collection(db, 'km_disziplinen')),
        getDocs(collection(db, 'km_meldungen'))
      ]);
      
      // Schützen-Map für PDF Export
      const schuetzenMapPDF = {};
      schuetzenSnapshot.docs.forEach(doc => {
        const data = doc.data();
        schuetzenMapPDF[data.name] = {
          id: doc.id,
          birthYear: data.birthYear,
          gender: data.gender,
          mitgliedsnummer: data.mitgliedsnummer
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
      
      // Gruppiere nur nach Startzeiten (keine Disziplin-Gruppierung)
      const nachStartzeit = startliste.reduce((acc, s) => {
        const zeit = s.startzeit || config?.startUhrzeit || '14:00';
        if (!acc[zeit]) acc[zeit] = [];
        acc[zeit].push(s);
        return acc;
      }, {} as {[key: string]: typeof startliste});
      
      const datum = new Date(config?.startDatum || '').toLocaleDateString('de-DE', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      let globalStartNummer = 1;
      let isFirstStart = true;
      let currentY = 35;
      
      Object.entries(nachStartzeit).forEach(([startzeit, starterGruppe], startzeitIndex) => {
        if (isFirstStart) {
          doc.addPage();
          isFirstStart = false;
        } else {
          // Prüfe ob neue Seite nötig ist
          if (currentY > pageHeight - 100) {
            doc.addPage();
            currentY = 35;
          } else {
            currentY += 20; // Abstand zwischen Starts
          }
        }
          
          // Header nur bei neuer Seite
          if (currentY < 50) {
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
            currentY = 35;
          }
          
          doc.setFontSize(11);
          doc.setFont('helvetica', 'bold');
          const austragungsVerein = vereine.find(v => v.id === config.austragungsort);
          const austragungsort = austragungsVerein ? austragungsVerein.name : 'ESG Einbeck';
          doc.text(`Start ${globalStartNummer} am: ${datum} um ${startzeit} Uhr im Schützenhaus ${austragungsort}`, 20, currentY);
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
          

          
          const tableData = sortierteStarter.map((s) => {
            // Finde Schütze für echte Mitgliedsnummer mit korrektem 0-Präfix
            const schuetze = schuetzenMapPDF[s.name];
            let mitgliedsNr = '08-000-0000';
            if (schuetze?.mitgliedsnummer) {
              const mitgliedsNummerStr = schuetze.mitgliedsnummer.toString();
              if (mitgliedsNummerStr.length >= 7) {
                // Format: 8017017 -> 08-017-017
                const teil1 = mitgliedsNummerStr.substring(1, 4).padStart(3, '0');
                const teil2 = mitgliedsNummerStr.substring(4).padStart(3, '0');
                mitgliedsNr = `08-${teil1}-${teil2}`;
              }
            }
            
            const nameParts = s.name.split(' ');
            const nachname = nameParts[nameParts.length - 1];
            const vorname = nameParts.slice(0, -1).join(' ');
            
            // E/M: Prüfe ob Schütze in Mannschaft (aus km_mannschaften)
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
            
            // LM: Suche ursprüngliche Meldung für lmTeilnahme und Altersklasse
            const originalMeldung = meldungen.find(m => m.name === s.name && m.disziplin === s.disziplin);
            const lmTeilnahme = originalMeldung?.lmTeilnahme === true;
            const korrekteAltersklasse = originalMeldung?.altersklasse || s.altersklasse;
            // Hole SPO-Nummer direkt aus Disziplinen-Datenbank
            const disziplinDoc = disziplinenSnapshot.docs.find(d => d.data().name === s.disziplin);
            const spoNummer = disziplinDoc?.data().spoNummer || '1.41';
            
            return [
              s.stand || 'N/A',
              mitgliedsNr,
              nachname,
              vorname,
              s.verein,
              spoNummer,
              korrekteAltersklasse,
              einzelMannschaft,
              lmTeilnahme ? 'J' : 'N'
            ];
          });
          
          autoTable(doc, {
            startY: currentY,
            head: [['Stand', 'Mitgl.-Nr.', 'Name', 'Vorname', 'Verein', 'Disz.', 'WKl', 'E/M', 'LM']],
            body: tableData,
            styles: { 
              fontSize: 9,
              cellPadding: 2,
              textColor: [0, 0, 0],
              fillColor: [255, 255, 255],
              valign: 'middle',
              halign: 'left',
              minCellHeight: 12,
              cellHeight: 12
            },
            headStyles: { 
              fillColor: [220, 220, 220],
              textColor: [0, 0, 0],
              fontStyle: 'bold',
              lineWidth: 1,
              lineColor: [0, 0, 0]
            },
            bodyStyles: {
              lineWidth: 0.8,
              lineColor: [0, 0, 0],
              textColor: [0, 0, 0]
            },
            margin: { left: 5, right: 5 },
            columnStyles: {
              0: { cellWidth: 12 },
              1: { cellWidth: 22 },
              2: { cellWidth: 22 },
              3: { cellWidth: 22 },
              4: { cellWidth: 35 },
              5: { cellWidth: 10 },
              6: { cellWidth: 20 },
              7: { cellWidth: 10 },
              8: { cellWidth: 10 }
            }
          });
          
          currentY = (doc as any).lastAutoTable.finalY;
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
      
      const veranstaltungsDatum = new Date(config?.startDatum || new Date()).toISOString().split('T')[0];
      const fileName = `Startliste_KM_${veranstaltungsDatum}.pdf`;
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
                      <div className="text-red-600 mb-2">{konflikt.beschreibung}</div>
                      {konflikt.loesungsvorschlaege && (
                        <div className="mt-2">
                          <div className="font-medium text-blue-700 mb-1">💡 Lösungsvorschläge:</div>
                          <ul className="text-blue-600 space-y-1">
                            {konflikt.loesungsvorschlaege.map((vorschlag, i) => (
                              <li key={i} className="text-xs">• {vorschlag}</li>
                            ))}
                          </ul>
                        </div>
                      )}
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
                  <Button onClick={async () => {
                    const generierte = await generiereStartliste();
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
                <div className="mb-4">
                  <Select value={sortierung} onValueChange={setSortierung}>
                    <SelectTrigger className="w-64">
                      <SelectValue placeholder="Sortierung wählen" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="durchgang-stand">Durchgang → Stand → Zeit</SelectItem>
                      <SelectItem value="startzeit-stand">Startzeit → Stand → Name</SelectItem>
                      <SelectItem value="name-alphabetisch">Name (A-Z)</SelectItem>
                      <SelectItem value="verein-name">Verein → Name</SelectItem>
                      <SelectItem value="disziplin-name">Disziplin → Name</SelectItem>
                      <SelectItem value="altersklasse-name">Altersklasse → Name</SelectItem>
                      <SelectItem value="stand-zeit">Stand → Startzeit</SelectItem>
                      <SelectItem value="mannschaft-einzeln">Mannschaften → Einzelschützen</SelectItem>
                      <SelectItem value="hinweise-name">Hinweise → Name</SelectItem>
                      <SelectItem value="geburtsjahr-name">Geburtsjahr → Name</SelectItem>
                      <SelectItem value="geschlecht-name">Geschlecht → Name</SelectItem>
                      <SelectItem value="lm-teilnahme">LM-Teilnahme → Name</SelectItem>
                      <SelectItem value="mitgliedsnummer">Mitgliedsnummer</SelectItem>
                      <SelectItem value="verein-durchgang">Verein → Durchgang → Stand</SelectItem>
                      <SelectItem value="zufaellig">Zufällig</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="overflow-x-auto">
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {(() => {
                      const gefiltert = selectedDisziplin === 'alle' ? startliste : startliste.filter(s => s.disziplin === selectedDisziplin);
                      const sortiert = gefiltert.sort((a, b) => {
                        switch (sortierung) {
                          case 'durchgang-stand':
                            if (a.durchgang !== b.durchgang) return (a.durchgang || 1) - (b.durchgang || 1);
                            const standA = parseInt(a.stand || '0');
                            const standB = parseInt(b.stand || '0');
                            if (standA !== standB) return standA - standB;
                            if (a.startzeit !== b.startzeit) return (a.startzeit || '').localeCompare(b.startzeit || '');
                            return a.name.localeCompare(b.name);
                          case 'startzeit-stand':
                            if (a.startzeit !== b.startzeit) return (a.startzeit || '').localeCompare(b.startzeit || '');
                            const standA2 = parseInt(a.stand || '0');
                            const standB2 = parseInt(b.stand || '0');
                            if (standA2 !== standB2) return standA2 - standB2;
                            return a.name.localeCompare(b.name);
                          case 'name-alphabetisch':
                            return a.name.localeCompare(b.name);
                          case 'verein-name':
                            if (a.verein !== b.verein) return a.verein.localeCompare(b.verein);
                            return a.name.localeCompare(b.name);
                          case 'disziplin-name':
                            if (a.disziplin !== b.disziplin) return a.disziplin.localeCompare(b.disziplin);
                            return a.name.localeCompare(b.name);
                          case 'altersklasse-name':
                            if (a.altersklasse !== b.altersklasse) return a.altersklasse.localeCompare(b.altersklasse);
                            return a.name.localeCompare(b.name);
                          case 'stand-zeit':
                            const standA3 = parseInt(a.stand || '0');
                            const standB3 = parseInt(b.stand || '0');
                            if (standA3 !== standB3) return standA3 - standB3;
                            if (a.startzeit !== b.startzeit) return (a.startzeit || '').localeCompare(b.startzeit || '');
                            return a.name.localeCompare(b.name);
                          case 'mannschaft-einzeln':
                            const aIstMannschaft = a.hinweise?.includes('Mannschaft') ? 0 : 1;
                            const bIstMannschaft = b.hinweise?.includes('Mannschaft') ? 0 : 1;
                            if (aIstMannschaft !== bIstMannschaft) return aIstMannschaft - bIstMannschaft;
                            return a.name.localeCompare(b.name);
                          case 'hinweise-name':
                            const hinweisA = a.hinweise || 'ZZZ';
                            const hinweisB = b.hinweise || 'ZZZ';
                            if (hinweisA !== hinweisB) return hinweisA.localeCompare(hinweisB);
                            return a.name.localeCompare(b.name);
                          case 'geburtsjahr-name':
                            const jahrA = parseInt(a.altersklasse.match(/\d{4}/) || '1990');
                            const jahrB = parseInt(b.altersklasse.match(/\d{4}/) || '1990');
                            if (jahrA !== jahrB) return jahrB - jahrA;
                            return a.name.localeCompare(b.name);
                          case 'geschlecht-name':
                            const geschlechtA = a.altersklasse.includes('Damen') || a.altersklasse.includes('w') ? 'W' : 'M';
                            const geschlechtB = b.altersklasse.includes('Damen') || b.altersklasse.includes('w') ? 'W' : 'M';
                            if (geschlechtA !== geschlechtB) return geschlechtA.localeCompare(geschlechtB);
                            return a.name.localeCompare(b.name);
                          case 'lm-teilnahme':
                            const lmA = a.lmTeilnahme ? 0 : 1;
                            const lmB = b.lmTeilnahme ? 0 : 1;
                            if (lmA !== lmB) return lmA - lmB;
                            return a.name.localeCompare(b.name);
                          case 'mitgliedsnummer':
                            return a.name.localeCompare(b.name);
                          case 'verein-durchgang':
                            if (a.verein !== b.verein) return a.verein.localeCompare(b.verein);
                            if (a.durchgang !== b.durchgang) return (a.durchgang || 1) - (b.durchgang || 1);
                            const standA4 = parseInt(a.stand || '0');
                            const standB4 = parseInt(b.stand || '0');
                            return standA4 - standB4;
                          case 'zufaellig':
                            return Math.random() - 0.5;
                          default:
                            return a.name.localeCompare(b.name);
                        }
                      });
                      
                      // Durchgänge nach Sortierung neu berechnen für Übersicht
                      if (sortierung !== 'durchgang-stand' && config) {
                        const staendeAnzahl = config.verfuegbareStaende.length;
                        sortiert.forEach((starter, index) => {
                          starter.durchgang = Math.floor(index / staendeAnzahl) + 1;
                        });
                      }
                      
                      return sortiert;
                    })()
                      .map((starter, index) => {
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
                          <div key={`${starter.id}-${index}`} className={`grid grid-cols-12 gap-2 p-2 ${bgColor} rounded text-sm items-center group`}>
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
                            <div className="col-span-2 relative">
                              {starter.anmerkung && (
                                <div className="text-xs text-blue-600">{starter.anmerkung}</div>
                              )}
                              <button 
                                onClick={() => {
                                  const neueStartliste = startliste.filter(s => s.id !== starter.id);
                                  setStartliste(neueStartliste);
                                  if (config) {
                                    const neueAnalyse = analyzeStartlist(meldungen, neueStartliste, config);
                                    setKiAnalyse(neueAnalyse);
                                  }
                                }}
                                className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700 text-xs w-4 h-4 flex items-center justify-center"
                                title="Starter entfernen"
                              >
                                ×
                              </button>
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