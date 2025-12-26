"use client";

import React, { useState, useEffect } from 'react';
import { logError, logWarn, logInfo, logDebug } from '@/lib/utils/secure-logger';
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
  const [searchTerm, setSearchTerm] = useState('');
  
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    setConfigId(urlParams.get('id'));
  }, []);
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState(null);
  const [meldungen, setMeldungen] = useState<Starter[]>([]);
  const [startliste, setStartliste] = useState<Starter[]>([]);
  const [selectedDisziplinen, setSelectedDisziplinen] = useState<string[]>([]);
  const [vereine, setVereine] = useState<Array<{id: string, name: string}>>([]);

  const [sortierung, setSortierung] = useState<string>('durchgang-stand');
  const [geminiLoading, setGeminiLoading] = useState(false);
  const [showGemini, setShowGemini] = useState(false);
  const [geminiResult, setGeminiResult] = useState(null);
  const [showGeminiChat, setShowGeminiChat] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [saisons, setSaisons] = useState([]);
  const [selectedSaison, setSelectedSaison] = useState<string>('');

  useEffect(() => {
    if (!configId) return;
    
    // Prüfe ob startlisteId Parameter vorhanden ist
    const urlParams = new URLSearchParams(window.location.search);
    const startlisteId = urlParams.get('startlisteId');
    
    let isCancelled = false;
    
    const loadData = async () => {
      if (isCancelled) return;
      try {
        // Konfiguration laden
        const configDoc = await getDoc(doc(db, 'km_startlisten_configs', configId));
        if (!configDoc.exists()) {
          setLoading(false);
          return;
        }
        
        const configData = { id: configDoc.id, ...configDoc.data() };
        setConfig(configData);

        // Lade Saisons nur einmal
        if (saisons.length === 0) {
          const saisonRes = await fetch('/api/km/saisons');
          console.log('DEBUG: Saisons API Response:', saisonRes.status);
          if (saisonRes.ok && !isCancelled) {
            const saisonData = await saisonRes.json();
            const availableSaisons = saisonData.data || [];
            console.log('DEBUG: Verfügbare Saisons:', availableSaisons);
            
            const sortedSaisons = availableSaisons.sort((a, b) => {
              if (a.status === 'aktiv' && b.status !== 'aktiv') return -1;
              if (b.status === 'aktiv' && a.status !== 'aktiv') return 1;
              return 0;
            });
            
            setSaisons(sortedSaisons);
          }
        }
        
        // WICHTIG: Wenn startlisteId vorhanden, lade gespeicherte Startliste OHNE Saisonauswahl
        if (startlisteId) {
          console.log('DEBUG: Lade gespeicherte Startliste:', startlisteId);
          
          // Versuche zuerst über API zu laden
          try {
            const response = await fetch('/api/km/startlisten');
            if (response.ok) {
              const apiData = await response.json();
              const gefundeneStartliste = apiData.data?.find(s => s.id === startlisteId);
              
              if (gefundeneStartliste) {
                console.log('DEBUG: Startliste über API gefunden:', gefundeneStartliste);
                setStartliste(gefundeneStartliste.startliste || []);
                setSelectedDisziplinen(['alle']);
                
                // Lade Meldungen für manuelles Hinzufügen
                await loadMeldungenForManualAdd();
                
                toast({ 
                  title: '📝 Startliste geladen', 
                  description: `Startliste mit ${gefundeneStartliste.startliste?.length || 0} Startern geladen`,
                  duration: 3000
                });
                
                setLoading(false);
                return;
              }
            }
          } catch (apiError) {
            console.log('DEBUG: API-Fehler, versuche Firebase direkt:', apiError);
          }
          
          // Fallback: Direkt aus Firebase
          const startlisteDoc = await getDoc(doc(db, 'km_startlisten', startlisteId));
          if (startlisteDoc.exists()) {
            const startlisteData = startlisteDoc.data();
            console.log('DEBUG: Rohe Startliste-Daten:', startlisteData);
            console.log('DEBUG: Startliste Array:', startlisteData.startliste);
            console.log('DEBUG: Startliste Länge:', startlisteData.startliste?.length);
            
            setStartliste(startlisteData.startliste || []);
            
            console.log('DEBUG: Gespeicherte Startliste geladen:', startlisteData.startliste?.length);
            
            // WICHTIG: Setze Filter auf "alle" für gespeicherte Startlisten
            setSelectedDisziplinen(['alle']);
            
            // Lade auch Meldungen für das manuelle Hinzufügen
            await loadMeldungenForManualAdd();
            
            toast({ 
              title: '📝 Startliste geladen', 
              description: `Startliste mit ${startlisteData.startliste?.length || 0} Startern geladen`,
              duration: 3000
            });
            
            // STOPPE hier - keine weitere Verarbeitung für gespeicherte Startlisten
            setLoading(false);
            return;
          } else {
            console.log('DEBUG: Startliste-Dokument existiert nicht:', startlisteId);
            toast({ 
              title: '⚠️ Startliste nicht gefunden', 
              description: `Startliste mit ID ${startlisteId} wurde nicht gefunden.`,
              variant: 'destructive',
              duration: 5000
            });
          }
        }
        
        // Nur für neue Startlisten: Prüfe Saisonauswahl
        const finalSaisonId = selectedSaison;
        logDebug('Gefundene Saison-ID:', finalSaisonId);
        
        if (!finalSaisonId || isCancelled) {
          console.log('DEBUG: Keine finalSaisonId oder cancelled:', {finalSaisonId, isCancelled});
          setLoading(false);
          return;
        }
        
        console.log('DEBUG: Lade Daten für Saison:', finalSaisonId);
        
        const [disziplinenRes, meldungenRes, schuetzenRes, clubsRes] = await Promise.all([
          fetch('/api/km/disziplinen'),
          fetch(`/api/km/meldungen?saison=${finalSaisonId}`),
          fetch('/api/shooters'),
          fetch('/api/clubs')
        ]);
        
        logDebug('API-Aufrufe mit Saison-Parameter:', finalSaisonId);
        
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
          console.log('DEBUG: API Response Meldungen:', allMeldungen.length);
        } else {
          console.log('DEBUG: Meldungen API Fehler:', meldungenRes.status);
        }
        
        logDebug('Alle KM-Meldungen:', allMeldungen.length);
        const meldungenData = allMeldungen
          .filter(data => {
            logDebug('Meldung:', data.id, 'SchuetzeId:', data.schuetzeId, 'DisziplinId:', data.disziplinId);
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
        
        logDebug('Config Disziplinen:', configData.disziplinen);
        logDebug('Alle Meldungen Disziplinen:', meldungenData.map(m => m.disziplin));
        
        // Keine Filterung - verwende alle Meldungen
        const gefilterteMeldungen = meldungenData;
        
        logDebug('Gefilterte Meldungen:', gefilterteMeldungen.length, 'von', meldungenData.length);
        logDebug('Fehlende Meldungen:', meldungenData.filter(m => !configData.disziplinen.includes(m.disziplin)).map(m => `${m.name} - ${m.disziplin}`));
        
        // Verwende immer alle Meldungen - Filterung erfolgt in der UI
        logDebug('Setze alle Meldungen:', meldungenData.length);
        logDebug('Saison:', selectedSaison);
        logDebug('Meldungen Details:', meldungenData.map(m => ({name: m.name, disziplin: m.disziplin})));
        setMeldungen(meldungenData);
        
        // Vereine für Export
        const clubsData = Object.entries(vereine).map(([id, name]) => ({ id, name }));
        setVereine(clubsData);
        
        // Nur für neue Startlisten: Automatische Generierung
        if (!startlisteId) {
          // Automatische Startlisten-Generierung nur wenn Meldungen vorhanden
          if (meldungenData.length > 0) {
            logDebug('Generiere Startliste für', meldungenData.length, 'Meldungen');
            const basisStartliste = await generiereStartliste();
            setStartliste(basisStartliste);
            autoSave(basisStartliste);
            

          } else {
            logDebug('Keine Meldungen gefunden - keine Startliste generiert');
            setStartliste([]);
          }
        }
      } catch (error) {
        logError('Fehler:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (configId) {
      loadData();
    }
    
    return () => {
      isCancelled = true;
    };
  }, [configId, selectedSaison]);

  const loadMeldungenForManualAdd = async () => {
    try {
      // Verwende selectedSaison falls vorhanden, sonst aktive Saison
      let saisonId = selectedSaison;
      
      if (!saisonId) {
        const saisonRes = await fetch('/api/km/saisons');
        if (saisonRes.ok) {
          const saisonData = await saisonRes.json();
          const aktiveSaison = saisonData.data?.find(s => s.status === 'aktiv');
          saisonId = aktiveSaison?.id;
        }
      }
      
      if (!saisonId) return;
      
      const [disziplinenRes, meldungenRes, schuetzenRes, clubsRes] = await Promise.all([
        fetch('/api/km/disziplinen'),
        fetch(`/api/km/meldungen?saison=${saisonId}`),
        fetch('/api/shooters'),
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
      
      const meldungenData = allMeldungen
        .filter(data => {
          if (!data.schuetzeId || !data.disziplinId) return false;
          
          const disziplinName = disziplinen[data.disziplinId];
          // Filtere nur Disziplinen die in der Konfiguration sind
          return config?.disziplinen?.includes(disziplinName);
        })
        .map(data => {
          const schuetze = schuetzen[data.schuetzeId];
          const disziplinName = disziplinen[data.disziplinId];
          
          if (!schuetze || !disziplinName) return null;
          
          return {
            id: data.id,
            name: schuetze?.name || 'Unbekannt',
            verein: vereine[schuetze?.kmClubId || schuetze?.rwkClubId || schuetze?.clubId] || 'Unbekannt',
            disziplin: disziplinName,
            altersklasse: 'Berechnet',
            anmerkung: data.anmerkung || '',
            lmTeilnahme: data.lmTeilnahme === true
          };
        })
        .filter(Boolean);
      
      setMeldungen(meldungenData);
      console.log('DEBUG: Gefilterte Meldungen für manuelles Hinzufügen:', meldungenData.length);
    } catch (error) {
      console.log('DEBUG: Fehler beim Laden der Meldungen:', error);
    }
  };

  const generiereStartliste = async (): Promise<Starter[]> => {
    console.log('DEBUG: generiereStartliste aufgerufen', {config: !!config, meldungenCount: meldungen.length});
    if (!config || meldungen.length === 0) {
      console.log('DEBUG: Keine Config oder Meldungen - return []');
      return [];
    }
    
    const startlisteEntries: Starter[] = [];
    const staendeAnzahl = config.verfuegbareStaende.length;
    let durchgang = 1;

    // Lade Daten über APIs
    console.log('DEBUG: Lade APIs für Startliste...');
    const [mannschaftenRes, kmMeldungenRes, schuetzenRes, disziplinenRes, vereineRes] = await Promise.all([
      fetch('/api/km/mannschaften'),
      fetch(`/api/km/meldungen${selectedSaison ? `?saison=${selectedSaison}` : ''}`),
      fetch('/api/shooters'),
      fetch('/api/km/disziplinen'),
      fetch('/api/clubs')
    ]);
    console.log('DEBUG: APIs geladen für Startliste');
    
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
    console.log('DEBUG: Verarbeite KM-Meldungen:', kmMeldungen.length);
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
    
    console.log('DEBUG: Echte KM-Meldungen verarbeitet:', echteKmMeldungen.length);
    
    // Gruppiere nach Disziplinen
    const nachDisziplin = echteKmMeldungen.reduce((acc, starter) => {
      const key = starter.disziplin;
      if (!acc[key]) acc[key] = [];
      acc[key].push(starter);
      return acc;
    }, {} as {[key: string]: Starter[]});

    console.log('DEBUG: Nach Disziplinen gruppiert:', Object.keys(nachDisziplin));
    Object.entries(nachDisziplin).forEach(([disziplinName, starter]) => {
      console.log('DEBUG: Verarbeite Disziplin:', disziplinName, 'mit', starter.length, 'Startern');
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
            
            // Prüfe Lichtpunkt-Regel für Einbeck: Stände 101 und 102 nur für Lichtpunkt
            const istLichtpunkt = s.disziplin?.toLowerCase().includes('lichtpunkt') || s.disziplin?.toLowerCase().includes('lp');
            
            while (standZeitMatrix.has(testKey) || 
                   (!istLichtpunkt && (testStand === '101' || testStand === '102'))) {
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
        
        logDebug(`Durchgang ${durchgang}: Startzeit ${config.startUhrzeit} -> ${startzeit} (${totalMinutes} Min total)`);
        
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
            
            // Prüfe Licht-Regel für Einbeck: Stände 101 und 102 nur für Licht-Disziplinen
            const istLichtgewehr = s.disziplin?.toLowerCase().includes('lichtgewehr') || s.disziplin?.toLowerCase().includes('lg');
            const istLichtDisziplin = s.disziplin?.toLowerCase().includes('licht') || 
                                      s.disziplin?.includes('11.10') || s.disziplin?.includes('11.11') || 
                                      s.disziplin?.includes('11.20') || s.disziplin?.includes('11.50') || s.disziplin?.includes('11.51') ||
                                      istLichtgewehr;
            const hatLichtgewehr = config.disziplinen.some(d => d.toLowerCase().includes('lichtgewehr') || d.toLowerCase().includes('lg'));
            
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

  const autoSave = async (neueStartliste: Starter[]) => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      let startlisteId = urlParams.get('startlisteId');
      
      const response = await fetch('/api/km/startlisten', {
        method: startlisteId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: startlisteId,
          configId: configId,
          startliste: neueStartliste,
          datum: config?.startDatum
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const result = await response.json();
      
      // Nach dem ersten Speichern: URL mit startlisteId aktualisieren
      if (!startlisteId && result.id) {
        const newUrl = `${window.location.pathname}?id=${configId}&startlisteId=${result.id}`;
        window.history.replaceState({}, '', newUrl);
      }
      
      logDebug('Auto-Speichern erfolgreich:', neueStartliste.length, 'Starter');
    } catch (error) {
      logError('Auto-Speichern fehlgeschlagen:', error);
      toast({ 
        title: 'Auto-Speichern fehlgeschlagen', 
        description: 'Änderungen wurden nicht gespeichert. Bitte manuell speichern.',
        variant: 'destructive',
        duration: 5000
      });
    }
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
    
    // Verbesserte Gewehr-Sharing Logik
    const gewehrSharingStarter = neueStartliste.filter(starter => 
      starter.anmerkung?.toLowerCase().includes('gewehr') || 
      starter.hinweise?.toLowerCase().includes('gewehr')
    );
    
    if (gewehrSharingStarter.length > 1) {
      // Gruppiere nach Nachnamen (Gewehr-Sharing meist in Familien)
      const nachNachnamen = {};
      gewehrSharingStarter.forEach(starter => {
        const nachname = starter.name.split(' ').pop() || starter.name;
        if (!nachNachnamen[nachname]) nachNachnamen[nachname] = [];
        nachNachnamen[nachname].push(starter);
      });
      
      // Für jeden Nachnamen: Stelle sicher, dass sie in verschiedenen Durchgängen sind
      Object.entries(nachNachnamen).forEach(([nachname, gruppe]: [string, any[]]) => {
        if (gruppe.length > 1) {
          // Sortiere nach aktueller Startzeit
          gruppe.sort((a, b) => (a.startzeit || '14:00').localeCompare(b.startzeit || '14:00'));
          
          // Verteile auf verschiedene Durchgänge
          gruppe.forEach((starter, index) => {
            if (index > 0) {
              const durchgangIntervall = (config?.durchgangsDauer || 50) + (config?.wechselzeit || 10);
              const [baseHours, baseMinutes] = (gruppe[0].startzeit || config?.startUhrzeit || '14:00').split(':').map(Number);
              const baseTotalMinutes = baseHours * 60 + baseMinutes;
              
              // Jeder weitere Schütze kommt in den nächsten Durchgang
              const newTotalMinutes = baseTotalMinutes + (index * durchgangIntervall);
              const newHours = Math.floor(newTotalMinutes / 60);
              const newMinutes = newTotalMinutes % 60;
              
              const neueZeit = `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}`;
              
              // Update in neueStartliste
              const starterIndex = neueStartliste.findIndex(s => s.id === starter.id);
              if (starterIndex !== -1) {
                neueStartliste[starterIndex].startzeit = neueZeit;
                neueStartliste[starterIndex].durchgang = (gruppe[0].durchgang || 1) + index;
                neueStartliste[starterIndex].hinweise = `Gewehr geteilt mit ${gruppe[0].name} - DG ${(gruppe[0].durchgang || 1) + index}`;
              }
            } else {
              // Erster Schütze behält seine Zeit, aber Update Hinweis
              const starterIndex = neueStartliste.findIndex(s => s.id === starter.id);
              if (starterIndex !== -1) {
                neueStartliste[starterIndex].hinweise = `Gewehr wird geteilt mit ${gruppe.slice(1).map(s => s.name).join(', ')}`;
              }
            }
          });
        }
      });
    }
    
    setStartliste(neueStartliste);
    autoSave(neueStartliste);
  };



  const generiereGemini = async () => {
    if (meldungen.length === 0) {
      toast({ title: 'Keine Meldungen', description: 'Es sind keine Meldungen zum Generieren vorhanden', variant: 'destructive' });
      return;
    }
    
    setGeminiLoading(true);
    try {
      // Nur gefilterte Meldungen an Gemini senden
      const gefilterteMeldungen = selectedDisziplinen.includes('alle') ? meldungen : meldungen.filter(m => selectedDisziplinen.includes(m.disziplin));
      
      const geminiMeldungen = gefilterteMeldungen.map(m => ({
        schuetzeName: m.name,
        verein: m.verein,
        disziplin: m.disziplin,
        wettkampfklasse: m.altersklasse,
        gewehrSharing: m.anmerkung?.toLowerCase().includes('gewehr') || false
      }));
      
      logDebug('Sende an Gemini:', geminiMeldungen.length, 'Meldungen');
      logDebug('Gemini Config:', {
        startUhrzeit: config?.startUhrzeit,
        durchgangsDauer: config?.durchgangsDauer,
        wechselzeit: config?.wechselzeit,
        vereinsLimit: config?.vereinsLimit
      });
      
      toast({ 
        title: '🤖 Gemini arbeitet...', 
        description: `Generiere Startliste für ${geminiMeldungen.length} Meldungen. Dies kann einige Minuten dauern.`,
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
          autoSave(result.data.startliste);
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
        toast({ 
          title: 'Gemini nicht verfügbar', 
          description: 'Bitte später nochmal versuchen oder manuelle Anpassung nutzen' 
        });
      }
    } catch (error) {
      toast({ 
        title: 'Verbindungsfehler', 
        description: 'Gemini nicht erreichbar - bitte später nochmal versuchen' 
      });
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
          autoSave(result.modifiedStartliste);
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
      
      console.log('DEBUG: Speichere Startliste:', { startlisteId, configId, starterAnzahl: startliste.length });
      console.log('DEBUG: Request Body:', {
        id: startlisteId,
        configId: configId,
        startliste: startliste.slice(0, 2),
        datum: config?.startDatum
      });
      
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
      
      console.log('DEBUG: Response Status:', response.status);
      const responseText = await response.text();
      console.log('DEBUG: Response Text:', responseText);
      
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (e) {
        throw new Error(`Invalid JSON response: ${responseText}`);
      }
      
      console.log('DEBUG: Parsed Result:', result);
      
      if (response.ok && result.success) {
        toast({ 
          title: '✅ Startliste gespeichert!', 
          description: `Startliste mit ${startliste.length} Startern wurde erfolgreich gespeichert.`,
          duration: 5000
        });
        
        if (!startlisteId && result.id) {
          const newUrl = `${window.location.pathname}?id=${configId}&startlisteId=${result.id}`;
          window.history.replaceState({}, '', newUrl);
        }
      } else {
        throw new Error(result.error || `HTTP ${response.status}: ${responseText}`);
      }
    } catch (error) {
      console.error('DEBUG: Fehler beim Speichern:', error);
      toast({ 
        title: 'Fehler beim Speichern', 
        description: `${error.message}`, 
        variant: 'destructive',
        duration: 8000
      });
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
        fetch('/api/shooters'),
        fetch(`/api/km/meldungen?saison=${selectedSaison}`),
        fetch('/api/km/disziplinen'),
        fetch(`/api/km/mannschaften?saison=${selectedSaison}`)
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
        logWarn('Meyton-Klassen Collection nicht gefunden, verwende Fallback-Mapping');
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
        logDebug(`Starter: ${entry.nachname}, Altersklasse: ${entry.wettkampfklasse}, Klassen-ID: ${klassenId}`);
        
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
      logError('Meyton-Export Fehler:', error);
      toast({ title: 'Fehler', description: 'Meyton-Export fehlgeschlagen.', variant: 'destructive' });
    }
  };

  const exportToPDF = async () => {
    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');
      
      // Lade Mannschaften und Disziplinen für E/M Erkennung und SPO-Nummern
      const [schuetzenRes, mannschaftenRes, disziplinenRes, kmMeldungenRes] = await Promise.all([
        fetch('/api/shooters'),
        fetch(`/api/km/mannschaften?saison=${selectedSaison}`),
        fetch('/api/km/disziplinen'),
        fetch(`/api/km/meldungen?saison=${selectedSaison}`)
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
        logWarn('Logo konnte nicht geladen werden:', error);
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
      
      // Verwende gefilterte Startliste basierend auf Disziplinen-Filter
      const gefilterteStartliste = selectedDisziplinen.includes('alle') ? 
        startliste : 
        startliste.filter(s => selectedDisziplinen.includes(s.disziplin));
      
      // Gruppiere nur nach Startzeiten (keine Disziplin-Gruppierung)
      const nachStartzeit = gefilterteStartliste.reduce((acc, s) => {
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
              logWarn('Logo konnte nicht geladen werden');
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
          const sortierteStarter = starterGruppe.sort((a, b) => {
            const standA = parseInt(a.stand || '999');
            const standB = parseInt(b.stand || '999');
            if (standA !== standB) return standA - standB;
            return a.name.localeCompare(b.name);
          });
          
          // Zeige nur Starter der gefilterten Disziplinen
          const finalStarter = selectedDisziplinen.includes('alle') ? 
            sortierteStarter : 
            sortierteStarter.filter(s => selectedDisziplinen.includes(s.disziplin));
          
          const tableData = finalStarter.map((s) => {
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
            
            // LM: Suche in ursprünglichen Meldungen
            const originalMeldung = meldungen.find(m => m.name === s.name && m.disziplin === s.disziplin);
            const lmTeilnahme = originalMeldung?.lmTeilnahme === true;
            
            // Altersklasse berechnen wie in KM-Meldungen
            let korrekteAltersklasse = 'Unbekannt';
            if (schuetze?.birthYear) {
              const age = (config?.saison || 2026) - schuetze.birthYear;
              const isAuflage = s.disziplin?.toLowerCase().includes('auflage');
              const isMale = schuetze.gender === 'male';
              
              if (age <= 14) korrekteAltersklasse = 'Schüler';
              else if (age <= 16) korrekteAltersklasse = 'Jugend';
              else if (age <= 18) korrekteAltersklasse = `Junioren II ${isMale ? 'm' : 'w'}`;
              else if (age <= 20) korrekteAltersklasse = `Junioren I ${isMale ? 'm' : 'w'}`;
              else if (isAuflage) {
                if (age <= 40) korrekteAltersklasse = `${isMale ? 'Herren' : 'Damen'} I`;
                else if (age <= 50) korrekteAltersklasse = 'Senioren 0';
                else if (age <= 60) korrekteAltersklasse = 'Senioren I';
                else if (age <= 65) korrekteAltersklasse = 'Senioren II';
                else if (age <= 70) korrekteAltersklasse = 'Senioren III';
                else if (age <= 75) korrekteAltersklasse = 'Senioren IV';
                else if (age <= 80) korrekteAltersklasse = 'Senioren V';
                else korrekteAltersklasse = 'Senioren VI';
              } else {
                if (age <= 40) korrekteAltersklasse = `${isMale ? 'Herren' : 'Damen'} I`;
                else if (age <= 50) korrekteAltersklasse = `${isMale ? 'Herren' : 'Damen'} II`;
                else if (age <= 60) korrekteAltersklasse = `${isMale ? 'Herren' : 'Damen'} III`;
                else if (age <= 70) korrekteAltersklasse = `${isMale ? 'Herren' : 'Damen'} IV`;
                else korrekteAltersklasse = `${isMale ? 'Herren' : 'Damen'} V`;
              }
            }
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
              cellPadding: 3,
              textColor: [0, 0, 0],
              fillColor: [255, 255, 255],
              valign: 'middle',
              halign: 'center',
              minCellHeight: 16,
              cellHeight: 16
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
            margin: { left: 10, right: 10 },
            columnStyles: {
              0: { cellWidth: 18 },
              1: { cellWidth: 25 },
              2: { cellWidth: 25 },
              3: { cellWidth: 25 },
              4: { cellWidth: 35 },
              5: { cellWidth: 18 },
              6: { cellWidth: 25 },
              7: { cellWidth: 12 },
              8: { cellWidth: 12 }
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
          `Erstellt am ${new Date().toLocaleDateString('de-DE')} - RWK Einbeck`,
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
        description: `${fileName} wurde heruntergeladen (${gefilterteStartliste.length} Teilnehmer${selectedDisziplinen.includes('alle') ? '' : ' - gefiltert'}).`,
        duration: 4000
      });
    } catch (error) {
      logError('PDF-Export Fehler:', error);
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
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-primary">🎯 Startlisten Tool</h1>
          <p className="text-muted-foreground">Config ID: {configId}</p>
          <div className="text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded border border-amber-200 mt-1 inline-block">
            💻 Empfohlen für PC/Desktop - Mobile Nutzung eingeschränkt
          </div>
        </div>
      </div>

      <Card className="border-2 border-primary bg-primary/5 mb-6">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div>
              <label className="text-base font-semibold text-gray-800 dark:text-gray-200">
                🎯 Saison auswählen {(() => {
                  const urlParams = new URLSearchParams(window.location.search);
                  const startlisteId = urlParams.get('startlisteId');
                  return startlisteId ? '(Optional - Startliste bereits geladen)' : '(Pflichtfeld)';
                })()}
              </label>
              <select
                value={selectedSaison}
                onChange={(e) => {
                  setSelectedSaison(e.target.value);
                  setMeldungen([]);
                  setStartliste([]);
                  setLoading(true);
                }}
                className="w-full mt-2 px-4 py-3 text-lg border-2 border-primary rounded-lg bg-white focus:ring-2 focus:ring-primary focus:border-primary"
                required={(() => {
                  const urlParams = new URLSearchParams(window.location.search);
                  const startlisteId = urlParams.get('startlisteId');
                  return !startlisteId; // Nur required wenn keine startlisteId
                })()}
              >
                <option value="">🔽 Bitte Saison wählen...</option>
                {saisons.map(saison => (
                  <option key={saison.id} value={saison.id}>
                    {saison.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const startlisteId = urlParams.get('startlisteId');
        
        // Zeige Warnung nur wenn keine startlisteId UND keine Saison gewählt
        return !startlisteId && !selectedSaison;
      })() && (
        <Card className="mb-6 border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="text-center py-4">
              <p className="text-orange-800 font-medium mb-2">⚠️ Bitte wählen Sie zuerst eine Saison aus</p>
              <p className="text-sm text-orange-600">Die Konfiguration und Meldungen werden erst nach der Saisonauswahl geladen.</p>
            </div>
          </CardContent>
        </Card>
      )}



      {(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const startlisteId = urlParams.get('startlisteId');
        
        // Zeige Konfiguration wenn: startlisteId vorhanden ODER (config UND selectedSaison)
        return (startlisteId && config) || (config && selectedSaison);
      })() && (
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>② Konfiguration</CardTitle>
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
                  <p className="text-sm font-medium mb-1">Zeitplan (bearbeitbar)</p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <label className="text-xs w-16">Start:</label>
                      <Input
                        type="time"
                        value={config.startUhrzeit}
                        onChange={(e) => {
                          const newConfig = {...config, startUhrzeit: e.target.value};
                          setConfig(newConfig);
                          updateDoc(doc(db, 'km_startlisten_configs', configId), { startUhrzeit: e.target.value });
                        }}
                        className="w-20 h-7 text-xs"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-xs w-16">Durchgang:</label>
                      <Input
                        type="number"
                        value={config.durchgangsDauer}
                        onChange={(e) => {
                          const newValue = parseInt(e.target.value) || 50;
                          const newConfig = {...config, durchgangsDauer: newValue};
                          setConfig(newConfig);
                          updateDoc(doc(db, 'km_startlisten_configs', configId), { durchgangsDauer: newValue });
                        }}
                        className="w-16 h-7 text-xs"
                        min="10"
                        max="120"
                      />
                      <span className="text-xs">Min</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-xs w-16">Wechsel:</label>
                      <Input
                        type="number"
                        value={config.wechselzeit || 10}
                        onChange={(e) => {
                          const newValue = parseInt(e.target.value) || 10;
                          const newConfig = {...config, wechselzeit: newValue};
                          setConfig(newConfig);
                          updateDoc(doc(db, 'km_startlisten_configs', configId), { wechselzeit: newValue });
                        }}
                        className="w-16 h-7 text-xs"
                        min="0"
                        max="60"
                      />
                      <span className="text-xs">Min</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>③ Meldungen ({meldungen.length})</CardTitle>
                  {saisons.length > 0 && selectedSaison && (
                    <div className="mt-2">
                      <p className="text-sm text-blue-600">Aktuelle Saison: <strong>{saisons.find(s => s.id === selectedSaison)?.name}</strong></p>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  {/* Gemini Panel wurde nach unten verschoben */}
                </div>
              </div>
              
              {/* Gemini AI Panel wurde nach oben verschoben */}
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="text-sm font-medium mb-2">Disziplinen Filter:</div>
                <div className="flex flex-wrap gap-3">
                  <label className="flex items-center gap-2 cursor-pointer bg-gray-50 px-3 py-2 rounded border">
                    <input
                      type="checkbox"
                      checked={selectedDisziplinen.includes('alle')}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedDisziplinen(['alle']);
                        } else {
                          setSelectedDisziplinen([]);
                        }
                      }}
                      className="rounded"
                    />
                    <span className="text-sm font-medium">Alle Disziplinen</span>
                  </label>
                  {config.disziplinen.map(disziplin => (
                    <label key={disziplin} className="flex items-center gap-2 cursor-pointer bg-blue-50 px-3 py-2 rounded border border-blue-200">
                      <input
                        type="checkbox"
                        checked={selectedDisziplinen.includes(disziplin) || selectedDisziplinen.includes('alle')}
                        onChange={(e) => {
                          if (e.target.checked) {
                            if (selectedDisziplinen.includes('alle')) {
                              setSelectedDisziplinen([disziplin]);
                            } else {
                              setSelectedDisziplinen([...selectedDisziplinen, disziplin]);
                            }
                          } else {
                            setSelectedDisziplinen(selectedDisziplinen.filter(d => d !== disziplin));
                          }
                        }}
                        className="rounded"
                      />
                      <span className="text-sm">{disziplin}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 mb-4">
                <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded text-sm text-green-700">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Automatisches Speichern aktiv
                </div>
                
                <Button onClick={saveStartliste} variant="outline" size="sm">
                  <Save className="h-4 w-4 mr-2" />
                  Manuell speichern
                </Button>

                <Button 
                  onClick={() => setShowGemini(!showGemini)}
                  variant={showGemini ? 'default' : 'outline'}
                >
                  🎯 Startliste generieren {showGemini ? 'aktiv' : ''}
                </Button>
                
                <Button 
                  onClick={async () => {
                    if (meldungen.length === 0) {
                      toast({ title: 'Keine Meldungen', description: 'Es sind keine Meldungen vorhanden', variant: 'destructive' });
                      return;
                    }
                    
                    // Einfache Startliste: Alle Meldungen mit Standard-Werten
                    const einfacheStartliste = meldungen.map((m, index) => {
                      const durchgang = Math.floor(index / config.verfuegbareStaende.length) + 1;
                      const standIndex = index % config.verfuegbareStaende.length;
                      const [hours, minutes] = (config?.startUhrzeit || '14:00').split(':').map(Number);
                      const totalMinutes = hours * 60 + minutes + ((durchgang - 1) * ((config?.durchgangsDauer || 50) + (config?.wechselzeit || 10)));
                      const newHours = Math.floor(totalMinutes / 60);
                      const newMinutes = totalMinutes % 60;
                      const startzeit = `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}`;
                      
                      return {
                        ...m,
                        id: `fallback_${m.id}_${index}`,
                        stand: config.verfuegbareStaende[standIndex],
                        startzeit,
                        durchgang,
                        hinweise: 'Einfache Verteilung - alle Stände genutzt'
                      };
                    });
                    
                    setStartliste(einfacheStartliste);
                    autoSave(einfacheStartliste);
                    toast({ title: '📋 Einfache Liste', description: `${einfacheStartliste.length} Starter - jetzt manuell anpassen` });
                  }}
                  variant="outline"
                >
                  📋 Einfache Liste
                </Button>
              </div>

              {/* Gemini AI Panel */}
              {showGemini && (
                <div className="mt-4 p-4 bg-blue-50 rounded border space-y-3 mb-4">
                  <h4 className="font-medium text-blue-900">🤖 Gemini AI Generator</h4>
                  <p className="text-sm text-blue-700">
                    KI-basierte Startlisten-Optimierung mit Vereins-Limits & Sportgeräte-Regeln
                  </p>
                  <div className="text-xs text-amber-700 bg-amber-50 p-2 rounded border border-amber-200">
                    ⏱️ Hinweis: Gemini-Generierung kann einige Minuten dauern, je nach Meldungsanzahl
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
                      {geminiLoading ? '⏳ Generiere...' : '🎯 Startliste generieren'}
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

              <div className="text-center py-8">
                {meldungen.length === 0 ? (
                  <p className="text-muted-foreground text-lg">
                    Keine Meldungen vorhanden.
                  </p>
                ) : (
                  <div className="space-y-4">
                    <div className="text-6xl font-bold text-primary">
                      {selectedDisziplinen.includes('alle') ? meldungen.length : meldungen.filter(m => selectedDisziplinen.includes(m.disziplin)).length}
                    </div>
                    <p className="text-lg text-muted-foreground font-medium">
                      {selectedDisziplinen.includes('alle') ? 'Alle Meldungen' : 'Gefilterte Meldungen'} bereit für Startliste
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center max-w-4xl mx-auto">
                      {(() => {
                        const gefilterteMeldungen = selectedDisziplinen.includes('alle') ? meldungen : meldungen.filter(m => selectedDisziplinen.includes(m.disziplin));
                        return [...new Set(gefilterteMeldungen.map(m => m.disziplin))].map(disziplin => (
                          <Badge key={disziplin} variant="outline" className="text-sm px-3 py-2">
                            {disziplin} ({gefilterteMeldungen.filter(m => m.disziplin === disziplin).length})
                          </Badge>
                        ));
                      })()
                      }
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
              <CardTitle>④ Generierte Startliste ({startliste.length})</CardTitle>
                  <div className="flex gap-2">
                    <Button onClick={saveStartliste} className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-2">
                      <Save className="h-4 w-4 mr-2" />
                      💾 JETZT SPEICHERN
                    </Button>
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
                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-sm font-medium text-amber-900">Schütze manuell hinzufügen</p>
                      <p className="text-xs text-amber-700">Für Schützen die am anderen Termin schießen sollen (z.B. Freihand-Schütze am Auflage-Tag)</p>
                      {!selectedSaison && (
                        <p className="text-xs text-red-600 font-medium mt-1">⚠️ Bitte wählen Sie oben eine Saison aus, um Schützen hinzuzufügen</p>
                      )}
                    </div>
                  </div>
                  <div className="mb-3">
                    <input
                      type="text"
                      placeholder="Schützen-Name suchen..."
                      className="w-full p-2 border rounded text-sm"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      disabled={!selectedSaison}
                    />
                  </div>
                  <div className="max-h-32 overflow-y-auto">
                    {!selectedSaison ? (
                      <div className="text-center py-4 text-amber-700">
                        <p className="text-sm">🔽 Bitte wählen Sie zuerst eine Saison aus</p>
                      </div>
                    ) : meldungen.length === 0 ? (
                      <div className="text-center py-4 text-amber-700">
                        <p className="text-sm">Keine passenden Meldungen gefunden</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                      {meldungen
                        .filter(m => 
                          !startliste.some(s => s.name === m.name && s.disziplin === m.disziplin) &&
                          (searchTerm === '' || 
                           m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           m.verein.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           m.disziplin.toLowerCase().includes(searchTerm.toLowerCase()))
                        )
                        .slice(0, 20)
                        .map(schuetze => (
                            <button
                              key={`${schuetze.name}_${schuetze.disziplin}`}
                              onClick={() => {
                                const neuerStarter = {
                                  ...schuetze,
                                  id: `manual_${Date.now()}`,
                                  stand: config?.verfuegbareStaende[0] || '1',
                                  startzeit: config?.startUhrzeit || '14:00',
                                  durchgang: 1,
                                  hinweise: 'Terminwechsel - schießt am anderen Tag'
                                };
                                const neueStartliste = [...startliste, neuerStarter];
                                setStartliste(neueStartliste);
                                autoSave(neueStartliste);
                                toast({ title: '✅ Hinzugefügt', description: `${schuetze.name} hinzugefügt` });
                              }}
                              className="text-left p-2 bg-white border rounded hover:bg-blue-50 text-xs"
                            >
                              <div className="font-medium">{schuetze.name}</div>
                              <div className="text-gray-600">{schuetze.disziplin}</div>
                              <div className="text-gray-500">{schuetze.verein}</div>
                            </button>
                          ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <div className="space-y-2 max-h-[600px] overflow-y-auto">
                    {(() => {
                      const gefiltert = selectedDisziplinen.includes('alle') ? 
                        startliste : 
                        startliste.filter(s => 
                          selectedDisziplinen.includes(s.disziplin) || 
                          s.hinweise?.includes('Terminwechsel') || 
                          s.hinweise?.includes('Manuell')
                        );
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
                              {starter.altersklasse && (
                                <Badge variant="outline" className="text-xs mt-1">{starter.altersklasse}</Badge>
                              )}
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
                                className="h-12 w-full min-w-[100px]"
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
                              {(() => {
                                const originalMeldung = meldungen.find(m => m.name === starter.name && m.disziplin === starter.disziplin);
                                return (starter.anmerkung || originalMeldung?.anmerkung) && (
                                  <div className="text-xs text-blue-600">
                                    {starter.anmerkung || originalMeldung?.anmerkung}
                                  </div>
                                );
                              })()}
                              <button 
                                onClick={() => {
                                  const neueStartliste = startliste.filter(s => s.id !== starter.id);
                                  setStartliste(neueStartliste);
                                  autoSave(neueStartliste);
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
