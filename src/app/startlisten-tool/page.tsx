"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { NativeSelect } from '@/components/ui/native-select';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Download, Users, Clock, Target, Save, FileText, Plus, Brain, Upload } from 'lucide-react';
import { useRouter } from 'next/navigation';
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
  const [configId, setConfigId] = useState<string | null>(null);
  
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    setConfigId(urlParams.get('id'));
  }, []);
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
  const [geminiLoading, setGeminiLoading] = useState(false);
  const [showGemini, setShowGemini] = useState(false);
  const [geminiResult, setGeminiResult] = useState(null);
  const [showGeminiChat, setShowGeminiChat] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

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

        // Lade Saisons zuerst um die richtige Collection zu finden
        const saisonRes = await fetch('/api/km/saisons');
        let saisonId = null;
        if (saisonRes.ok) {
          const saisonData = await saisonRes.json();
          const saisons = saisonData.data || [];
          if (saisons.length > 0) {
            saisonId = saisons[0].id; // Aktuelle Saison
          }
        }
        
        // Lade Daten über APIs mit Saison-Parameter
        const [disziplinenRes, meldungenRes, schuetzenRes, clubsRes] = await Promise.all([
          fetch('/api/km/disziplinen'),
          fetch(`/api/km/meldungen${saisonId ? `?saison=${saisonId}` : ''}`),
          fetch('/api/km/shooters'),
          fetch('/api/clubs')
        ]);
        
        const disziplinen = {};
        if (disziplinenRes.ok) {
          const diszData = await disziplinenRes.json();
          diszData.data?.forEach(d => {
            disziplinen[d.id] = d.name;
          });
        }
        
        const schuetzen = {};
        if (schuetzenRes.ok) {
          const schuetzenData = await schuetzenRes.json();
          schuetzenData.data?.forEach(s => {
            schuetzen[s.id] = s;
          });
        }
        
        const vereine = {};
        if (clubsRes.ok) {
          const clubsData = await clubsRes.json();
          clubsData.data?.forEach(c => {
            vereine[c.id] = c.name;
          });
        }
        
        let allMeldungen = [];
        if (meldungenRes.ok) {
          const meldungenData = await meldungenRes.json();
          allMeldungen = meldungenData.data || [];
        }
        
        console.log('Alle KM-Meldungen:', allMeldungen.length);
        const meldungenData = allMeldungen
          .filter(data => {
            console.log('Meldung:', data.id, 'SchuetzeId:', data.schuetzeId, 'DisziplinId:', data.disziplinId);
            return data.schuetzeId && data.disziplinId;
          })
          .map(data => {
            const schuetze = schuetzen[data.schuetzeId];
            const disziplinName = disziplinen[data.disziplinId];
            
            if (!schuetze || !disziplinName) return null;
            
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
              id: data.id,
              name: schuetze?.name || 'Unbekannt',
              verein: vereine[schuetze?.kmClubId || schuetze?.rwkClubId || schuetze?.clubId] || 'Unbekannt',
              disziplin: disziplinName,
              altersklasse: altersklasse,
              anmerkung: data.anmerkung || '',
              lmTeilnahme: data.lmTeilnahme === true
            };
          })
          .filter(Boolean);
        
        console.log('Config Disziplinen:', configData.disziplinen);
        console.log('Alle Meldungen Disziplinen:', meldungenData.map(m => m.disziplin));
        
        const gefilterteMeldungen = meldungenData.filter(m => {
          const passt = configData.disziplinen.includes(m.disziplin);
          console.log('Meldung', m.name, 'Disziplin:', m.disziplin, 'Passt:', passt);
          return passt;
        });
        
        console.log('Gefilterte Meldungen:', gefilterteMeldungen.length, 'von', meldungenData.length);
        console.log('Fehlende Meldungen:', meldungenData.filter(m => !configData.disziplinen.includes(m.disziplin)).map(m => `${m.name} - ${m.disziplin}`));
        
        // Verwende ALLE Meldungen wenn Diskrepanz zwischen Anzeige und Startliste
        if (Math.abs(gefilterteMeldungen.length - meldungenData.length) <= 2) {
          console.log('Kleine Diskrepanz - verwende alle Meldungen');
          setMeldungen(meldungenData);
        } else if (gefilterteMeldungen.length === 0 && meldungenData.length > 0) {
          console.log('Fallback: Nehme alle Meldungen da Filter leer');
          setMeldungen(meldungenData);
        } else {
          setMeldungen(gefilterteMeldungen);
        }
        
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
              description: `Startliste mit ${startlisteData.startliste?.length || 0} Startern geladen`,
              duration: 3000
            });
          }
        } else {
          // Automatische Startlisten-Generierung nur wenn Meldungen vorhanden
          if (meldungenData.length > 0) {
            console.log('Generiere Startliste für', meldungenData.length, 'Meldungen');
            const basisStartliste = await generiereStartliste();
            const optimierteStartliste = optimizeStartlist(basisStartliste, configData);
            setStartliste(optimierteStartliste);
            
            // KI-Analyse durchführen
            const analyse = analyzeStartlist(meldungenData, optimierteStartliste, configData);
            setKiAnalyse(analyse);
          } else {
            console.log('Keine Meldungen gefunden - keine Startliste generiert');
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

  const generiereStartliste = async (): Promise<Starter[]> => {
    if (!config || meldungen.length === 0) return [];
    
    const startlisteEntries: Starter[] = [];
    const staendeAnzahl = config.verfuegbareStaende.length;
    let durchgang = 1;

    // Lade Daten über APIs
    const [mannschaftenRes, kmMeldungenRes, schuetzenRes, disziplinenRes, vereineRes] = await Promise.all([
      fetch('/api/km/mannschaften'),
      fetch('/api/km/meldungen'),
      fetch('/api/km/shooters'),
      fetch('/api/km/disziplinen'),
      fetch('/api/clubs')
    ]);
    
    const mannschaftenData = mannschaftenRes.ok ? (await mannschaftenRes.json()).data || [] : [];
    const kmMeldungenData = kmMeldungenRes.ok ? (await kmMeldungenRes.json()).data || [] : [];
    const schuetzenData = schuetzenRes.ok ? (await schuetzenRes.json()).data || [] : [];
    const disziplinenData = disziplinenRes.ok ? (await disziplinenRes.json()).data || [] : [];
    const vereineData = vereineRes.ok ? (await vereineRes.json()).data || [] : [];
    
    // Filtere Mannschaften für die richtige Saison
    const saisonStr = (config.saison || 2026).toString();
    const mannschaften = mannschaftenData.filter(m => m.saison === saisonStr);
    const kmMeldungen = kmMeldungenData.filter(m => m.saison === saisonStr);
    
    // Globale Stand-Zeit-Matrix zur Konfliktprüfung
    const standZeitMatrix = new Set<string>();
    
    // Verwende nur die echten KM-Meldungen für die Startliste
    const echteKmMeldungen = kmMeldungen.map(meldung => {
      const schuetze = schuetzenData.find(s => s.id === meldung.schuetzeId);
      const disziplin = disziplinenData.find(d => d.id === meldung.disziplinId);
      
      if (!schuetze || !disziplin) {
        return null;
      }
      
      return {
        id: meldung.id || `meldung_${Date.now()}_${Math.random()}`,
        name: schuetze.name,
        verein: (() => {
          const clubId = schuetze.kmClubId || schuetze.rwkClubId || schuetze.clubId;
          const club = vereineData.find(c => c.id === clubId);
          return club?.name || 'Unbekannt';
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
        const disziplin = disziplinenData.find(d => d.id === m.disziplinId);
        return disziplin?.name === disziplinName;
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
        
        // Prüfe Vereinslimit für diesen Durchgang
        const mannschaftVerein = (() => {
          const schuetze = schuetzenData.find(s => 
            mannschaft.schuetzenIds?.includes(s.id)
          );
          const clubId = schuetze?.kmClubId || schuetze?.rwkClubId || schuetze?.clubId;
          const club = vereineData.find(c => c.id === clubId);
          return club?.name;
        })();
        
        const vereinsStarterImDurchgang = startlisteEntries.filter(entry => 
          entry.durchgang === durchgang && entry.verein === mannschaftVerein
        ).length;
        
        const vereinslimitUeberschritten = config.vereinsLimit && 
          (vereinsStarterImDurchgang + mannschaftStarter.length) > config.vereinsLimit;
        
        // Wenn Vereinslimit überschritten, versuche Durchgang mit anderen zu füllen
        if (vereinslimitUeberschritten) {
          // Fülle aktuellen Durchgang mit Einzelschützen oder anderen Mannschaften auf
          const restplaetze = staendeAnzahl - currentDurchgangBelegt;
          let aufgefuellt = 0;
          
          // Versuche mit Einzelschützen aufzufüllen
          while (aufgefuellt < restplaetze && einzelSchuetzenIndex < einzelSchuetzen.length) {
            const s = einzelSchuetzen[einzelSchuetzenIndex];
            const [hours, minutes] = config.startUhrzeit.split(':').map(Number);
            const totalMinutes = hours * 60 + minutes + ((durchgang - 1) * (config.durchgangsDauer + (config.wechselzeit || 0)));
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
        const totalMinutes = hours * 60 + minutes + ((durchgang - 1) * (config.durchgangsDauer + (config.wechselzeit || 0)));
        const newHours = Math.floor(totalMinutes / 60);
        const newMinutes = totalMinutes % 60;
        const startzeit = `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}`;
        
        console.log(`Durchgang ${durchgang}: Startzeit ${config.startUhrzeit} -> ${startzeit} (${totalMinutes} Min total)`);
        
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
            const totalMinutes = hours * 60 + minutes + ((durchgang - 1) * (config.durchgangsDauer + (config.wechselzeit || 0)));
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
        
        // Prüfe Vereinslimit für restliche Einzelschützen
        if (config.vereinsLimit) {
          const vereinsStarterImDurchgang = startlisteEntries.filter(entry => 
            entry.durchgang === durchgang && entry.verein === s.verein
          ).length;
          
          if (vereinsStarterImDurchgang >= config.vereinsLimit) {
            einzelSchuetzenIndex++;
            continue;
          }
        }
        const [hours, minutes] = config.startUhrzeit.split(':').map(Number);
        const totalMinutes = hours * 60 + minutes + ((durchgang - 1) * (config.durchgangsDauer + (config.wechselzeit || 0)));
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
          
          // Durchgang basierend auf Durchgangsdauer + Wechselzeit
          const durchgangIntervall = (config.durchgangsDauer || 30) + (config.wechselzeit || 15);
          const durchgang = Math.floor(diffMinutes / durchgangIntervall) + 1;
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

  const generiereGemini = async () => {
    if (meldungen.length === 0) {
      toast({ title: 'Keine Meldungen', description: 'Es sind keine Meldungen zum Generieren vorhanden', variant: 'destructive' });
      return;
    }
    
    setGeminiLoading(true);
    try {
      const geminiMeldungen = meldungen.map(m => ({
        schuetzeName: m.name,
        verein: m.verein,
        disziplin: m.disziplin,
        wettkampfklasse: m.altersklasse,
        gewehrSharing: m.anmerkung?.toLowerCase().includes('gewehr') || false
      }));
      
      console.log('Sende an Gemini:', geminiMeldungen.length, 'Meldungen');
      console.log('Gemini Config:', {
        startUhrzeit: config?.startUhrzeit,
        durchgangsDauer: config?.durchgangsDauer,
        wechselzeit: config?.wechselzeit,
        vereinsLimit: config?.vereinsLimit
      });
      
      toast({ 
        title: '🤖 Gemini arbeitet...', 
        description: `Generiere Startliste für ${geminiMeldungen.length} Meldungen. Dies kann 1-2 Minuten dauern.`,
        duration: 5000
      });
      
      const response = await fetch('/api/gemini/startlisten', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meldungen: geminiMeldungen,
          config: {
            verfuegbareStaende: config?.verfuegbareStaende || [],
            startUhrzeit: config?.startUhrzeit || '14:00',
            durchgangsDauer: config?.durchgangsDauer || 30,
            wechselzeit: config?.wechselzeit || 10,
            disziplinen: config?.disziplinen || [],
            vereinsLimit: config?.vereinsLimit || null
          },
          aktion: 'generieren'
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setGeminiResult(result.data);
        if (result.data.startliste) {
          setStartliste(result.data.startliste);
          toast({ title: '✨ Gemini Startliste', description: `${result.data.startliste.length} Starter generiert` });
        }
      } else {
        toast({ title: 'Gemini Fehler', description: result.error, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Fehler', description: error.message, variant: 'destructive' });
    } finally {
      setGeminiLoading(false);
    }
  };

  const optimiereGemini = async () => {
    if (startliste.length === 0) return;
    
    setGeminiLoading(true);
    try {
      const response = await fetch('/api/gemini/startlisten', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meldungen: startliste,
          config: {
            ...config,
            vereinsLimit: config?.vereinsLimit || null
          },
          aktion: 'optimieren'
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setGeminiResult(result.data);
        toast({ 
          title: '🔍 Gemini Analyse abgeschlossen', 
          description: `Score: ${result.data.score || 'N/A'}/100 - ${result.data.konflikte?.length || 0} Konflikte gefunden` 
        });
      } else {
        // Fallback auf lokale Analyse
        if (config) {
          const lokalAnalyse = analyzeStartlist(meldungen, startliste, config);
          setKiAnalyse(lokalAnalyse);
          toast({ 
            title: 'Lokale Analyse verwendet', 
            description: `Gemini nicht verfügbar - Score: ${lokalAnalyse.score}%` 
          });
        }
      }
    } catch (error) {
      // Fallback auf lokale Analyse
      if (config) {
        const lokalAnalyse = analyzeStartlist(meldungen, startliste, config);
        setKiAnalyse(lokalAnalyse);
        toast({ 
          title: 'Lokale Analyse verwendet', 
          description: `Verbindungsfehler - Score: ${lokalAnalyse.score}%` 
        });
      }
    } finally {
      setGeminiLoading(false);
    }
  };

  const sendChatMessage = async () => {
    if (!chatInput.trim()) return;
    
    const userMessage = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { type: 'user', content: userMessage }]);
    setChatLoading(true);
    
    try {
      const context = `Aktuelle Startliste: ${startliste.length} Starter, ${meldungen.length} Meldungen`;
      
      // Prüfe ob es eine Anpassungsanfrage ist
      const isModificationRequest = userMessage.toLowerCase().includes('ändere') || 
                                   userMessage.toLowerCase().includes('verschiebe') || 
                                   userMessage.toLowerCase().includes('tausche') ||
                                   userMessage.toLowerCase().includes('anpassen');
      
      // Erweiterte Kontext-Informationen für Gemini
      const detailContext = `
WETTKAMPF-KONFIGURATION:
- Verfügbare Stände: ${config?.verfuegbareStaende?.join(', ') || 'Nicht definiert'} (${config?.verfuegbareStaende?.length || 0} Stände)
- Startzeit: ${config?.startUhrzeit || 'Nicht definiert'}
- Durchgangsdauer: ${config?.durchgangsDauer || 30} Minuten
- Wechselzeit: ${config?.wechselzeit || 10} Minuten
- Disziplinen: ${config?.disziplinen?.join(', ') || 'Nicht definiert'}

AKTUELLE DATEN:
- Startliste: ${startliste.length} Starter bereits eingeteilt
- Meldungen: ${meldungen.length} Meldungen verfügbar
- Vereine: ${[...new Set(meldungen.map(m => m.verein))].join(', ')}

VEREINS-REGELN:
- Max. Starter pro Verein pro Durchgang: ${config?.vereinsLimit ? config.vereinsLimit : 'Kein Limit'}
- Gewehr-Sharing muss zeitlich versetzt werden
- Stand-Zeit-Konflikte vermeiden

${isModificationRequest ? `
STARTLISTE DETAILS:
${startliste.slice(0,8).map(s => `- ${s.name} (${s.verein}) - Stand ${s.stand} - ${s.startzeit} - DG${s.durchgang}${s.hinweise ? ' - ' + s.hinweise : ''}`).join('\n')}${startliste.length > 8 ? '\n... und ' + (startliste.length - 8) + ' weitere' : ''}` : ''}

${meldungen.length > 0 ? `
MELDUNGEN DETAILS:
${meldungen.slice(0,5).map(m => `- ${m.name} (${m.verein}) - ${m.disziplin} - ${m.altersklasse}${m.anmerkung ? ' - ' + m.anmerkung : ''}`).join('\n')}${meldungen.length > 5 ? '\n... und ' + (meldungen.length - 5) + ' weitere' : ''}` : ''}`;
      
      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          context: detailContext,
          canModify: isModificationRequest
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setChatMessages(prev => [...prev, { type: 'gemini', content: result.reply }]);
        
        // Wenn Gemini eine modifizierte Startliste zurückgibt
        if (result.modifiedStartliste && Array.isArray(result.modifiedStartliste)) {
          setStartliste(result.modifiedStartliste);
          if (config) {
            const analyse = analyzeStartlist(meldungen, result.modifiedStartliste, config);
            setKiAnalyse(analyse);
          }
          toast({ title: '✨ Startliste angepasst', description: 'Gemini hat die Änderungen vorgenommen' });
        }
      } else {
        setChatMessages(prev => [...prev, { type: 'gemini', content: 'Entschuldigung, ich kann gerade nicht antworten.' }]);
      }
    } catch (error) {
      setChatMessages(prev => [...prev, { type: 'gemini', content: 'Verbindungsfehler. Bitte versuche es nochmal.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  const saveStartliste = async () => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const startlisteId = urlParams.get('startlisteId');
      
      console.log('Speichere Startliste:', { startlisteId, configId, starterAnzahl: startliste.length });
      
      const response = await fetch('/api/km/startlisten', {
        method: startlisteId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: startlisteId,
          configId: configId,
          startliste,
          datum: config?.startDatum
        })
      });
      
      console.log('Response Status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('Speichern erfolgreich:', result);
        
        // Sofortige Rückmeldung
        alert(`✅ Startliste gespeichert! (${startliste.length} Starter)`);
        
        toast({ 
          title: '✅ Startliste gespeichert!', 
          description: `Startliste mit ${startliste.length} Startern wurde erfolgreich gespeichert.`,
          duration: 5000
        });
      } else {
        const errorText = await response.text();
        console.error('API Fehler Response:', errorText);
        throw new Error(`API Fehler: ${response.status}`);
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

      // Lade alle benötigten Daten über APIs
      const [schuetzenRes, meldungenRes, disziplinenRes, mannschaftenRes] = await Promise.all([
        fetch('/api/km/shooters'),
        fetch('/api/km/meldungen'),
        fetch('/api/km/disziplinen'),
        fetch('/api/km/mannschaften')
      ]);
      
      const schuetzenData = schuetzenRes.ok ? (await schuetzenRes.json()).data || [] : [];
      const meldungenData = meldungenRes.ok ? (await meldungenRes.json()).data || [] : [];
      const disziplinenData = disziplinenRes.ok ? (await disziplinenRes.json()).data || [] : [];
      const mannschaftenData = mannschaftenRes.ok ? (await mannschaftenRes.json()).data || [] : [];
      
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
      schuetzenData.forEach(data => {
        schuetzenMapPDF[data.name] = {
          id: data.id,
          birthYear: data.birthYear,
          gender: data.gender
        };
      });
      
      // Meldungen-Map für echte Altersklassen
      const meldungenMap = {};
      meldungenData.forEach(data => {
        if (data.schuetzeId) {
          meldungenMap[data.schuetzeId] = {
            altersklasse: data.altersklasse,
            disziplinId: data.disziplinId
          };
        }
      });
      
      // Disziplinen-Map
      const disziplinenMap = {};
      disziplinenData.forEach(data => {
        disziplinenMap[data.id] = {
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
      const [schuetzenRes, mannschaftenRes, disziplinenRes, kmMeldungenRes] = await Promise.all([
        fetch('/api/km/shooters'),
        fetch('/api/km/mannschaften'),
        fetch('/api/km/disziplinen'),
        fetch('/api/km/meldungen')
      ]);
      
      const schuetzenData = schuetzenRes.ok ? (await schuetzenRes.json()).data || [] : [];
      const mannschaftenData = mannschaftenRes.ok ? (await mannschaftenRes.json()).data || [] : [];
      const disziplinenData = disziplinenRes.ok ? (await disziplinenRes.json()).data || [] : [];
      const kmMeldungenData = kmMeldungenRes.ok ? (await kmMeldungenRes.json()).data || [] : [];
      
      // Schützen-Map für PDF Export
      const schuetzenMapPDF = {};
      schuetzenData.forEach(data => {
        schuetzenMapPDF[data.name] = {
          id: data.id,
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
              mannschaftenData.forEach(mannschaftData => {
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
            const disziplinDoc = disziplinenData.find(d => d.name === s.disziplin);
            const spoNummer = disziplinDoc?.spoNummer || '1.41';
            
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
              halign: 'center',
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
              0: { cellWidth: 15 },
              1: { cellWidth: 22 },
              2: { cellWidth: 22 },
              3: { cellWidth: 22 },
              4: { cellWidth: 32 },
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
          `Erstellt am ${new Date().toLocaleDateString('de-DE')} um ${new Date().toLocaleTimeString('de-DE')} - RWK Einbeck App v${process.env.npm_package_version || '1.9.1'}`,
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
          <div className="text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded border border-amber-200 mt-1 inline-block">
            💻 Empfohlen für PC/Desktop - Mobile Nutzung eingeschränkt
          </div>
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
                    if (config) {
                      const analyse = analyzeStartlist(meldungen, generierte, config);
                      setKiAnalyse(analyse);
                    }
                    toast({ title: 'Startliste generiert', description: `${generierte.length} Starter eingeteilt` });
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
                  <Button 
                    onClick={() => setShowGemini(!showGemini)}
                    variant={showGemini ? 'default' : 'outline'}
                  >
                    🤖 Gemini AI {showGemini ? 'aktiv' : ''}
                  </Button>

                </div>
              </div>
              
              {/* Gemini AI Panel */}
              {showGemini && (
                <div className="mt-4 p-4 bg-blue-50 rounded border space-y-3">
                  <h4 className="font-medium text-blue-900">🤖 Gemini AI Generator</h4>
                  <p className="text-sm text-blue-700">
                    KI-basierte Startlisten-Optimierung mit Vereins-Limits & Sportgeräte-Regeln
                  </p>
                  <div className="text-xs text-amber-700 bg-amber-50 p-2 rounded border border-amber-200">
                    ⏱️ Hinweis: Gemini-Generierung kann 1-2 Minuten dauern, je nach Meldungsanzahl
                  </div>
                  <div className="text-xs text-blue-600 bg-blue-100 p-2 rounded">
                    • Gewehr-Sharing Erkennung<br/>
                    • Stand-Zeit-Konflikt Vermeidung
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <label htmlFor="vereinslimit" className="text-sm text-blue-700">
                        Max. Starter pro Verein pro Durchgang:
                      </label>
                      <Input
                        type="number"
                        id="vereinslimit"
                        value={config?.vereinsLimit || ''}
                        onChange={(e) => setConfig(prev => ({...prev, vereinsLimit: e.target.value ? parseInt(e.target.value) : null}))}
                        placeholder="Kein Limit"
                        className="w-24 h-8"
                        min="1"
                        max="10"
                      />
                    </div>
                    <div className="text-xs text-blue-600">
                      Leer = kein Limit, Zahl = max. Anzahl
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      onClick={generiereGemini} 
                      disabled={geminiLoading || meldungen.length === 0}
                      size="sm"
                    >
                      {geminiLoading ? '⏳ Generiere...' : '✨ Neu generieren'}
                    </Button>
                    <Button 
                      onClick={optimiereGemini} 
                      disabled={geminiLoading || startliste.length === 0}
                      variant="outline"
                      size="sm"
                    >
                      {geminiLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                          Analysiere...
                        </div>
                      ) : '🔍 Optimieren'}
                    </Button>
                    <Button 
                      onClick={() => setShowGeminiChat(!showGeminiChat)}
                      variant="secondary"
                      size="sm"
                      disabled={geminiLoading}
                    >
                      💬 Chat
                    </Button>
                  </div>
                  
                  {/* Gemini Analyse */}
                  {geminiResult && (
                    <div className="p-3 bg-green-50 rounded border">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium text-green-900">🤖 Gemini Analyse</h5>
                        {geminiResult.score && (
                          <div className={`px-2 py-1 rounded text-sm font-medium ${
                            geminiResult.score >= 95 ? 'bg-green-100 text-green-800' :
                            geminiResult.score >= 80 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {geminiResult.score}/100
                          </div>
                        )}
                      </div>
                      
                      {(!geminiResult.konflikte || geminiResult.konflikte.length === 0) && 
                       (!geminiResult.optimierungen || geminiResult.optimierungen.length === 0) ? (
                        <div className="text-sm text-green-700 flex items-center gap-2">
                          <span>✅</span>
                          <span>Startliste optimal generiert - keine Konflikte erkannt!</span>
                        </div>
                      ) : (
                        <>
                          {geminiResult.konflikte?.length > 0 && (
                            <div className="mb-3">
                              <p className="text-sm font-medium text-red-700">⚠️ Konflikte ({geminiResult.konflikte.length}):</p>
                              {geminiResult.konflikte.map((k, i) => (
                                <div key={i} className="text-xs text-red-600 mb-1">
                                  <div className="font-medium">• {k.typ || 'Konflikt'}: {k.beschreibung || k}</div>
                                  {k.betroffene && <div className="ml-2 text-red-500">Betroffen: {k.betroffene.join(', ')}</div>}
                                  {k.loesungen && k.loesungen.map((l, j) => (
                                    <div key={j} className="ml-2 text-red-400">→ {l}</div>
                                  ))}
                                </div>
                              ))}
                            </div>
                          )}
                          {geminiResult.optimierungen?.length > 0 && (
                            <div>
                              <p className="text-sm font-medium text-green-700">✅ Optimierungen:</p>
                              {geminiResult.optimierungen.map((o, i) => (
                                <p key={i} className="text-xs text-green-600">• {o.beschreibung || o}</p>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                  
                  {/* Gemini Chat */}
                  {showGeminiChat && (
                    <div className="mt-4 p-4 bg-purple-50 rounded border">
                      <h4 className="font-medium text-purple-900 mb-3">💬 Chat mit Gemini</h4>
                      
                      <div className="max-h-64 overflow-y-auto mb-3 space-y-2">
                        {chatMessages.length === 0 && (
                          <div className="text-sm text-purple-600 italic">
                            Frage Gemini alles über Startlisten, Vereinsregeln oder Schießsport!
                          </div>
                        )}
                        {chatMessages.map((msg, i) => (
                          <div key={i} className={`p-2 rounded text-sm ${
                            msg.type === 'user' 
                              ? 'bg-blue-100 text-blue-900 ml-8' 
                              : 'bg-white text-gray-900 mr-8'
                          }`}>
                            <div className="font-medium text-xs mb-1">
                              {msg.type === 'user' ? '👤 Du' : '🤖 Gemini'}
                            </div>
                            <div className="whitespace-pre-wrap">{msg.content}</div>
                          </div>
                        ))}
                        {chatLoading && (
                          <div className="p-2 bg-gray-100 rounded text-sm mr-8">
                            <div className="font-medium text-xs mb-1">🤖 Gemini</div>
                            <div className="text-gray-600">⏳ Denkt nach...</div>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                          placeholder="Frage Gemini..."
                          className="flex-1 p-2 border rounded text-sm"
                          disabled={chatLoading}
                        />
                        <Button 
                          onClick={sendChatMessage}
                          disabled={chatLoading || !chatInput.trim()}
                          size="sm"
                        >
                          Senden
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <NativeSelect
                  value={selectedDisziplin}
                  onValueChange={setSelectedDisziplin}
                  placeholder="Alle Disziplinen"
                  options={[
                    { value: 'alle', label: 'Alle Disziplinen' },
                    ...config.disziplinen.map(d => ({ value: d, label: d }))
                  ]}
                />
              </div>
              <div className="text-center py-4">
                {meldungen.length === 0 ? (
                  <p className="text-muted-foreground">
                    Keine Meldungen für die ausgewählten Disziplinen gefunden.
                  </p>
                ) : (
                  <div className="space-y-2">
                    <div className="text-2xl font-bold text-primary">{meldungen.length}</div>
                    <p className="text-sm text-muted-foreground">Meldungen bereit für Startliste</p>
                    <div className="flex flex-wrap gap-1 justify-center">
                      {[...new Set(meldungen.map(m => m.disziplin))].map(disziplin => (
                        <Badge key={disziplin} variant="outline" className="text-xs">
                          {disziplin} ({meldungen.filter(m => m.disziplin === disziplin).length})
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
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
                  <NativeSelect
                    value={sortierung}
                    onValueChange={setSortierung}
                    placeholder="Sortierung wählen"
                    className="w-64"
                    options={[
                      { value: 'durchgang-stand', label: 'Durchgang → Stand → Zeit' },
                      { value: 'startzeit-stand', label: 'Startzeit → Stand → Name' },
                      { value: 'name-alphabetisch', label: 'Name (A-Z)' },
                      { value: 'verein-name', label: 'Verein → Name' },
                      { value: 'disziplin-name', label: 'Disziplin → Name' },
                      { value: 'altersklasse-name', label: 'Altersklasse → Name' },
                      { value: 'stand-zeit', label: 'Stand → Startzeit' },
                      { value: 'mannschaft-einzeln', label: 'Mannschaften → Einzelschützen' },
                      { value: 'hinweise-name', label: 'Hinweise → Name' },
                      { value: 'geburtsjahr-name', label: 'Geburtsjahr → Name' },
                      { value: 'geschlecht-name', label: 'Geschlecht → Name' },
                      { value: 'lm-teilnahme', label: 'LM-Teilnahme → Name' },
                      { value: 'mitgliedsnummer', label: 'Mitgliedsnummer' },
                      { value: 'verein-durchgang', label: 'Verein → Durchgang → Stand' },
                      { value: 'zufaellig', label: 'Zufällig' }
                    ]}
                  />
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
                              <NativeSelect
                                value={starter.stand}
                                onValueChange={(value) => handleStarterChange(starter.id, 'stand', value)}
                                className="h-8"
                                options={config.verfuegbareStaende.map(stand => ({ value: stand, label: `Stand ${stand}` }))}
                              />
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
