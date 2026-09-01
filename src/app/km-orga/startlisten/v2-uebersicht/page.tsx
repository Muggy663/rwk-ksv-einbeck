'use client';

import React, { useState, useEffect } from 'react';
import { getDocs, collection, doc, updateDoc, deleteDoc, addDoc, query, orderBy } from 'firebase/firestore';
import { getShooterClubId } from '@/lib/utils/altersklassen';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { logWarn, logError } from '@/lib/utils/secure-logger';

interface Aenderungswunsch {
  id: string;
  text: string;
  autor: string;
  timestamp: Date;
  status: 'offen' | 'bearbeitung' | 'erledigt';
  prioritaet: 'hoch' | 'normal' | 'niedrig';
  startlisteId?: string;
  saison: string;
}

// Ein einzelner Starter innerhalb einer Startliste (zur Laufzeit aus Firestore, daher locker typisiert)
interface Starter {
  name?: string;
  schuetzeName?: string;
  schuetzeId?: string;
  verein?: string;
  disziplin?: string;
  altersklasse?: string;
  anmerkung?: string;
  stand?: string | number;
  startzeit?: string;
  durchgang?: number;
  lmTeilnahme?: boolean;
  [key: string]: any;
}

// Konfiguration einer Startliste
interface StartlistenKonfiguration {
  datum?: string;
  staende?: number[];
  durchgang?: number;
  wechsel?: number;
  startzeit?: string;
  austragungsort?: string;
  selectedDisziplinen?: string[];
  autoRecalculate?: boolean;
  [key: string]: any;
}

// Eine gespeicherte Startliste (Firestore-Dokument)
interface StartlistenDoc {
  id: string;
  name?: string;
  saison?: string;
  disziplin?: string;
  startliste?: Starter[];
  konfiguration?: StartlistenKonfiguration;
  erstellt?: any;
  [key: string]: any;
}

export default function StartlistenV2Uebersicht() {
  const { toast } = useToast();
  const [startlisten, setStartlisten] = useState<StartlistenDoc[]>([]);
  const [saisons, setSaisons] = useState<Array<{ id: string; jahr?: number; name?: string; status?: string; [key: string]: any }>>([]);
  const [meldungen, setMeldungen] = useState<Array<{ id: string; name?: string; disziplin?: string; verein?: string; altersklasse?: string; anmerkung?: string; lmTeilnahme?: boolean; [key: string]: any }>>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<StartlistenDoc> & Record<string, any>>({});
  const [showAddShooter, setShowAddShooter] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSaison, setSelectedSaison] = useState('');
  const [verfuegbareJahre, setVerfuegbareJahre] = useState<string[]>([]);
  const [aenderungswuensche, setAenderungswuensche] = useState<Aenderungswunsch[]>([]);
  const [neuerWunsch, setNeuerWunsch] = useState('');
  const [showAenderungen, setShowAenderungen] = useState(true);
  const [swapMode, setSwapMode] = useState(false);
  const [selectedForSwap, setSelectedForSwap] = useState<number[]>([]);
  const [showVereinsTools, setShowVereinsTools] = useState(false);
  const [selectedVerein, setSelectedVerein] = useState('');
  const [neueStartzeit, setNeueStartzeit] = useState('13:00');
  const [showAnleitung, setShowAnleitung] = useState(false);
  const [starterSuche, setStarterSuche] = useState('');

  useEffect(() => {
    loadVerfuegbareJahre();
  }, []);

  useEffect(() => {
    if (selectedSaison) {
      loadData();
      loadAenderungswuensche();
    }
  }, [selectedSaison]);

  const loadVerfuegbareJahre = async () => {
    try {
      const { getFirestore } = await import('firebase/firestore');
      const { app } = await import('@/lib/firebase/config');
      const databaseId = process.env.FIREBASE_DATABASE_ID || process.env.NEXT_PUBLIC_FIREBASE_DATABASE_ID || '(default)';
      const correctDb = getFirestore(app, databaseId);
      
      // Dynamisch aus existierenden Collections ableiten
      const knownCollections = [
        'km_meldungen_2026_kk', 'km_meldungen_2026_kkp', 'km_meldungen_2026_ld'
      ];
      
      const gefundeneJahre = new Set<string>();
      
      for (const collectionName of knownCollections) {
        try {
          const { getDocs, collection, limit, query } = await import('firebase/firestore');
          const testQuery = query(collection(correctDb, collectionName), limit(1));
          const snapshot = await getDocs(testQuery);
          
          if (!snapshot.empty) {
            // Extrahiere Jahr aus Collection-Name (z.B. "km_meldungen_2026_kk" -> "2026")
            const jahr = collectionName.match(/_(\d{4})_/)?.[1];
            if (jahr) {
              gefundeneJahre.add(jahr);
            }
          }
        } catch (e) {
          // Collection existiert nicht - ignorieren
        }
      }
      
      const jahreArray = Array.from(gefundeneJahre).sort((a, b) => parseInt(b) - parseInt(a));
      setVerfuegbareJahre(jahreArray);
      
      // Setze das neueste Jahr als Standard
      if (jahreArray.length > 0 && !selectedSaison) {
        setSelectedSaison(jahreArray[0]);
      }
    } catch (error) {
      logError('Fehler beim Laden der verfügbaren Jahre:', error);
      // Fallback
      setVerfuegbareJahre(['2026']);
      setSelectedSaison('2026');
    }
  };

  const loadData = async () => {
    try {
      // Verwende die korrekte Datenbank-Instanz
      const { getFirestore } = await import('firebase/firestore');
      const { app } = await import('@/lib/firebase/config');
      const databaseId = process.env.FIREBASE_DATABASE_ID || process.env.NEXT_PUBLIC_FIREBASE_DATABASE_ID || '(default)';
      const correctDb = getFirestore(app, databaseId);
      
      const [startlistenSnapshot, saisonsRes] = await Promise.all([
        getDocs(collection(correctDb, 'km_startlisten_v2')),
        fetch('/api/km/saisons')
      ]);
      
      const startlistenData = startlistenSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as StartlistenDoc[];
      
      setStartlisten(startlistenData.sort((a, b) => {
        const dateA = new Date(a.konfiguration?.datum || a.erstellt?.toDate?.() || a.erstellt);
        const dateB = new Date(b.konfiguration?.datum || b.erstellt?.toDate?.() || b.erstellt);
        return dateB.getTime() - dateA.getTime(); // Neuestes Datum zuerst
      }));
      
      if (saisonsRes.ok) {
        const saisonsData = await saisonsRes.json();
        setSaisons(saisonsData.data || []);
      }
      
      // Lade Meldungen direkt aus Firebase
      const { getDocs: getDocsFirebase, collection: collectionFirebase, query, orderBy } = await import('firebase/firestore');
      const { db: dbFirebase } = await import('@/lib/firebase/config');
      
      const shootersSnapshot = await getDocsFirebase(query(collectionFirebase(dbFirebase, 'shooters'), orderBy('lastName', 'asc')));
      const schuetzenMap: Record<string, any> = {};
      shootersSnapshot.docs.forEach(doc => {
        schuetzenMap[doc.id] = { id: doc.id, ...doc.data() };
      });
      
      // Lade Meldungen für die spezifische Saison
      const jahr = parseInt(selectedSaison);
      const collections = ['kk', 'kkp', 'ld'];
      let alleMeldungen: Array<{ id: string; [key: string]: any }> = [];
      
      for (const typ of collections) {
        try {
          const collectionName = `km_meldungen_${jahr}_${typ}`;
          const meldungenSnapshot = await getDocsFirebase(collectionFirebase(dbFirebase, collectionName));
          const meldungen = meldungenSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Array<{ id: string; [key: string]: any }>;
          alleMeldungen.push(...meldungen);
        } catch (e) {
          logWarn(`Collection km_meldungen_${jahr}_${typ} nicht gefunden`);
        }
      }
      
      // Lade Meldungen für die spezifische Saison
      const saisonMeldungen = alleMeldungen.filter(m => {
        // Prüfe sowohl saisonId als auch saison Feld
        return m.saisonId || m.saison;
      });
      
      // Lade Disziplinen und Vereine für Mapping
      const [disziplinenRes, clubsRes] = await Promise.all([
        fetch('/api/km/disziplinen'),
        fetch('/api/clubs')
      ]);
      
      let disziplinenMap: Record<string, any> = {};
      let clubsMap: Record<string, any> = {};
      
      if (disziplinenRes.ok) {
        const disziplinenData = await disziplinenRes.json();
        (disziplinenData.data || []).forEach((d: any) => {
          disziplinenMap[d.id] = {
            name: d.name,
            spoNummer: d.spoNummer || '1.41'
          };
        });
      }
      
      if (clubsRes.ok) {
        const clubsData = await clubsRes.json();
        (clubsData.data || []).forEach((c: any) => {
          clubsMap[c.id] = c.name;
        });
      }
      
      const meldungenData = saisonMeldungen
        .filter(data => data.schuetzeId && data.disziplinId)
        .map(data => {
          const schuetze = schuetzenMap[data.schuetzeId];
          if (!schuetze) return null;
          
          const vereinId = getShooterClubId(schuetze) as string;
          
          return {
            id: data.id,
            name: schuetze?.name || `${schuetze?.firstName || ''} ${schuetze?.lastName || ''}`.trim() || 'Unbekannt',
            verein: clubsMap[vereinId] || 'Unbekannt',
            disziplin: disziplinenMap[data.disziplinId]?.name || 'Unbekannt',
            spoNummer: disziplinenMap[data.disziplinId]?.spoNummer || '1.41',
            altersklasse: data.altersklasse || 'Unbekannt',
            anmerkung: data.anmerkung || '',
            saisonId: data.saisonId || data.saison,
            lmTeilnahme: data.lmTeilnahme || false
          };
        })
        .filter(Boolean) as any[];
      
      setMeldungen(meldungenData);
      
    } catch (error) {
      logError('Fehler beim Laden:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAenderungswuensche = async () => {
    try {
      const { getFirestore } = await import('firebase/firestore');
      const { app } = await import('@/lib/firebase/config');
      const databaseId = process.env.FIREBASE_DATABASE_ID || process.env.NEXT_PUBLIC_FIREBASE_DATABASE_ID || '(default)';
      const correctDb = getFirestore(app, databaseId);
      
      const aenderungenSnapshot = await getDocs(
        query(
          collection(correctDb, 'km_startlisten_aenderungen'),
          orderBy('timestamp', 'desc')
        )
      );
      
      const aenderungenData = (aenderungenSnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate() || new Date()
        })) as Aenderungswunsch[])
        .filter(a => a.saison === selectedSaison);
      
      setAenderungswuensche(aenderungenData);
    } catch (error) {
      logError('Fehler beim Laden der Änderungswünsche:', error);
    }
  };

  const addAenderungswunsch = async () => {
    if (!neuerWunsch.trim()) return;
    
    try {
      const { getFirestore } = await import('firebase/firestore');
      const { app } = await import('@/lib/firebase/config');
      const databaseId = process.env.FIREBASE_DATABASE_ID || process.env.NEXT_PUBLIC_FIREBASE_DATABASE_ID || '(default)';
      const correctDb = getFirestore(app, databaseId);
      
      await addDoc(collection(correctDb, 'km_startlisten_aenderungen'), {
        text: neuerWunsch,
        autor: 'KM-Orga', // TODO: Echten Benutzernamen verwenden
        timestamp: new Date(),
        status: 'offen',
        prioritaet: 'normal',
        saison: selectedSaison
      });
      
      setNeuerWunsch('');
      loadAenderungswuensche();
      toast({
        title: "✅ Änderungswunsch hinzugefügt",
        description: "Der Wunsch wurde erfolgreich gespeichert."
      });
    } catch (error) {
      logError('Fehler beim Hinzufügen:', error);
      toast({
        title: "Fehler",
        description: "Wunsch konnte nicht gespeichert werden.",
        variant: "destructive"
      });
    }
  };

  const deleteAenderungswunsch = async (id: string) => {
    try {
      const { getFirestore } = await import('firebase/firestore');
      const { app } = await import('@/lib/firebase/config');
      const databaseId = process.env.FIREBASE_DATABASE_ID || process.env.NEXT_PUBLIC_FIREBASE_DATABASE_ID || '(default)';
      const correctDb = getFirestore(app, databaseId);
      
      await deleteDoc(doc(correctDb, 'km_startlisten_aenderungen', id));
      loadAenderungswuensche();
      toast({
        title: "🗑️ Änderungswunsch gelöscht",
        description: "Der Wunsch wurde erfolgreich entfernt."
      });
    } catch (error) {
      logError('Fehler beim Löschen:', error);
      toast({
        title: "Fehler",
        description: "Wunsch konnte nicht gelöscht werden.",
        variant: "destructive"
      });
    }
  };

  const updateAenderungswunschStatus = async (id: string, status: string) => {
    try {
      const { getFirestore } = await import('firebase/firestore');
      const { app } = await import('@/lib/firebase/config');
      const databaseId = process.env.FIREBASE_DATABASE_ID || process.env.NEXT_PUBLIC_FIREBASE_DATABASE_ID || '(default)';
      const correctDb = getFirestore(app, databaseId);
      
      await updateDoc(doc(correctDb, 'km_startlisten_aenderungen', id), { status });
      loadAenderungswuensche();
    } catch (error) {
      logError('Fehler beim Update:', error);
    }
  };

  const getSaisonName = (saisonId: string) => {
    const saison = saisons.find(s => s.id === saisonId);
    return saison?.name || saisonId;
  };

  const handleEdit = (startliste: StartlistenDoc) => {
    setEditingId(startliste.id);
    setEditData(startliste);
  };

  const handleSave = async () => {
    try {
      // Verwende die korrekte Datenbank-Instanz
      const { getFirestore } = await import('firebase/firestore');
      const { app } = await import('@/lib/firebase/config');
      const databaseId = process.env.FIREBASE_DATABASE_ID || process.env.NEXT_PUBLIC_FIREBASE_DATABASE_ID || '(default)';
      const correctDb = getFirestore(app, databaseId);
      
      await updateDoc(doc(correctDb, 'km_startlisten_v2', editingId || ''), editData);
      setEditingId(null);
      loadData();
    } catch (error) {
      logError('Fehler beim Speichern:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Startliste wirklich löschen?')) {
      try {
        // Verwende die korrekte Datenbank-Instanz
        const { getFirestore } = await import('firebase/firestore');
        const { app } = await import('@/lib/firebase/config');
        const databaseId = process.env.FIREBASE_DATABASE_ID || process.env.NEXT_PUBLIC_FIREBASE_DATABASE_ID || '(default)';
        const correctDb = getFirestore(app, databaseId);
        
        await deleteDoc(doc(correctDb, 'km_startlisten_v2', id));
        loadData();
      } catch (error) {
        logError('Fehler beim Löschen:', error);
      }
    }
  };

  const updateStarter = (starterIndex: number, field: string, value: any) => {
    const updatedStartliste = [...(editData.startliste || [])];
    updatedStartliste[starterIndex] = {
      ...updatedStartliste[starterIndex],
      [field]: value
    };
    
    // Wenn Stand geändert wird, automatisch alle Positionen neu berechnen
    if (field === 'stand') {
      const recalculatedStartliste = recalculateAllPositions(updatedStartliste);
      setEditData({
        ...editData,
        startliste: recalculatedStartliste
      });
    } else {
      setEditData({
        ...editData,
        startliste: updatedStartliste
      });
    }
  };
  
  // Funktion zur Neuberechnung aller Positionen
  const recalculateAllPositions = (startliste: Starter[]) => {
    const konfigurierteStaende = editData.konfiguration?.staende || [1,2,3,4,5,6,7,8,9];
    const maxStaende = konfigurierteStaende.length;
    const durchgangMin = editData.konfiguration?.durchgang || 50;
    const wechselMin = editData.konfiguration?.wechsel || 10;
    const baseTime = new Date(`1970-01-01T${editData.konfiguration?.startzeit || '14:00'}:00`);
    
    return startliste.map((starter: Starter, index: number) => {
      const durchgangNr = Math.floor(index / maxStaende) + 1;
      const standNr = konfigurierteStaende[index % maxStaende];
      const minutesOffset = (durchgangNr - 1) * (durchgangMin + wechselMin);
      const startzeit = new Date(baseTime.getTime() + minutesOffset * 60000)
        .toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
      
      return {
        ...starter,
        stand: standNr.toString(),
        startzeit: startzeit,
        durchgang: durchgangNr
      };
    });
  };

  const removeStarter = (starterIndex: number) => {
    const updatedStartliste = (editData.startliste || []).filter((_, index) => index !== starterIndex);
    setEditData({
      ...editData,
      startliste: updatedStartliste
    });
  };

  const calculateAgeClass = (schuetze: any, disziplin: any, selectedSaison: any) => {
    if (!schuetze?.birthYear) return 'Unbekannt';
    
    const currentSaison = saisons.find(s => s.id === selectedSaison);
    const age = (currentSaison?.jahr || 2026) - schuetze.birthYear;
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

  const addShooterToStartliste = async (meldung: any) => {
    const currentStartliste = editData.startliste || [];
    
    const newStarter = {
      id: `added_${Date.now()}`,
      name: meldung.name,
      schuetzeName: meldung.name,
      verein: meldung.verein,
      disziplin: meldung.disziplin,
      altersklasse: meldung.altersklasse || 'Unbekannt',
      anmerkung: meldung.anmerkung || '',
      stand: '1',
      startzeit: editData.konfiguration?.startzeit || '14:00',
      durchgang: 1
    };
    
    const newStartliste = [...currentStartliste, newStarter];
    
    if (editData.konfiguration?.autoRecalculate !== false) {
      const recalculatedStartliste = recalculateAllPositions(newStartliste);
      setEditData({
        ...editData,
        startliste: recalculatedStartliste
      });
    } else {
      setEditData({
        ...editData,
        startliste: newStartliste
      });
    }
    
    setShowAddShooter(false);
    setSearchTerm('');
  };

  const swapShooters = () => {
    if (selectedForSwap.length !== 2) {
      toast({
        title: "Fehler",
        description: "Bitte genau 2 Schützen zum Tauschen auswählen.",
        variant: "destructive"
      });
      return;
    }

    const [index1, index2] = selectedForSwap;
    const newStartliste = [...(editData.startliste || [])];
    
    // Speichere die Stand-, Zeit- und Durchgang-Daten der beiden Positionen
    const position1 = {
      stand: newStartliste[index1].stand,
      startzeit: newStartliste[index1].startzeit,
      durchgang: newStartliste[index1].durchgang
    };
    const position2 = {
      stand: newStartliste[index2].stand,
      startzeit: newStartliste[index2].startzeit,
      durchgang: newStartliste[index2].durchgang
    };
    
    // Tausche die beiden Schützen
    [newStartliste[index1], newStartliste[index2]] = [newStartliste[index2], newStartliste[index1]];
    
    // Weise die ursprünglichen Positionen zu (Stand, Zeit, Durchgang bleiben an der Position)
    newStartliste[index1].stand = position1.stand;
    newStartliste[index1].startzeit = position1.startzeit;
    newStartliste[index1].durchgang = position1.durchgang;
    
    newStartliste[index2].stand = position2.stand;
    newStartliste[index2].startzeit = position2.startzeit;
    newStartliste[index2].durchgang = position2.durchgang;
    
    setEditData({
      ...editData,
      startliste: newStartliste
    });
    
    // Reset swap mode
    setSwapMode(false);
    setSelectedForSwap([]);
    
    toast({
      title: "✅ Getauscht",
      description: `${newStartliste[index2].name} ↔ ${newStartliste[index1].name}`
    });
  };

  const toggleSwapSelection = (index: number) => {
    if (selectedForSwap.includes(index)) {
      setSelectedForSwap(selectedForSwap.filter(i => i !== index));
    } else if (selectedForSwap.length < 2) {
      setSelectedForSwap([...selectedForSwap, index]);
    } else {
      // Ersetze die erste Auswahl
      setSelectedForSwap([selectedForSwap[1], index]);
    }
  };

  const getVereinsUebersicht = () => {
    if (!editData.startliste) return {};
    
    const uebersicht: Record<string, any> = {};
    editData.startliste.forEach((starter: Starter) => {
      const verein = starter.verein || 'Unbekannt';
      const startzeit = starter.startzeit || '14:00';
      
      if (!uebersicht[verein]) {
        uebersicht[verein] = {};
      }
      if (!uebersicht[verein][startzeit]) {
        uebersicht[verein][startzeit] = 0;
      }
      uebersicht[verein][startzeit]++;
    });
    
    return uebersicht;
  };

  const getVerfuegbareVereine = () => {
    if (!editData.startliste) return [];
    const vereine = [...new Set(editData.startliste.map(s => s.verein).filter(Boolean))];
    return vereine.sort();
  };

  const vereinVorziehen = () => {
    if (!selectedVerein || !neueStartzeit) {
      toast({
        title: "Fehler",
        description: "Bitte Verein und neue Startzeit auswählen.",
        variant: "destructive"
      });
      return;
    }

    const newStartliste = [...(editData.startliste || [])];
    const vereinsSchuetzen = newStartliste.filter(s => s.verein === selectedVerein);
    
    if (vereinsSchuetzen.length === 0) {
      toast({
        title: "Fehler",
        description: `Keine Schützen von ${selectedVerein} gefunden.`,
        variant: "destructive"
      });
      return;
    }

    // Berechne neue Durchgänge und Stände für die neue Startzeit
    const maxStaende = editData.konfiguration?.staende?.length || 9;
    const durchgangMin = editData.konfiguration?.durchgang || 50;
    const wechselMin = editData.konfiguration?.wechsel || 10;
    
    // Finde freie Plätze ab der neuen Startzeit
    let neuerDurchgang = 1;
    let neuerStand = 1;
    
    vereinsSchuetzen.forEach((schuetze) => {
      // Finde den Schützen in der Startliste
      const schuetzeIndex = newStartliste.findIndex(s => s.id === schuetze.id);
      if (schuetzeIndex !== -1) {
        // Berechne neue Position
        const minutesOffset = (neuerDurchgang - 1) * (durchgangMin + wechselMin);
        const baseTime = new Date(`1970-01-01T${neueStartzeit}:00`);
        const startzeit = new Date(baseTime.getTime() + minutesOffset * 60000)
          .toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
        
        newStartliste[schuetzeIndex] = {
          ...newStartliste[schuetzeIndex],
          startzeit: startzeit,
          stand: neuerStand.toString(),
          durchgang: neuerDurchgang
        };
        
        // Nächste Position berechnen
        neuerStand++;
        if (neuerStand > maxStaende) {
          neuerStand = 1;
          neuerDurchgang++;
        }
      }
    });
    
    setEditData({
      ...editData,
      startliste: newStartliste.sort((a, b) => {
        if (a.startzeit !== b.startzeit) return String(a.startzeit || '').localeCompare(String(b.startzeit || ''));
        return parseInt(String(a.stand || '0')) - parseInt(String(b.stand || '0'));
      })
    });
    
    toast({
      title: "✅ Verein vorgezogen",
      description: `${vereinsSchuetzen.length} Schützen von ${selectedVerein} auf ${neueStartzeit} Uhr verschoben.`
    });
  };

  const getKonflikte = () => {
    if (!editData.startliste) return [];
    
    const konflikte: string[] = [];
    const belegtePositionen = new Map<string, number[]>();
    
    editData.startliste.forEach((starter, index) => {
      const key = `${starter.startzeit}-${starter.stand}`;
      if (belegtePositionen.has(key)) {
        belegtePositionen.get(key)!.push(index + 1);
      } else {
        belegtePositionen.set(key, [index + 1]);
      }
    });
    
    // Prüfe auf Doppelbelegungen
    belegtePositionen.forEach((indices, key) => {
      if (indices.length > 1) {
        const [zeit, stand] = key.split('-');
        konflikte.push(`Stand ${stand} um ${zeit} Uhr: Mehrfach belegt (Zeilen ${indices.join(', ')})`);
      }
    });
    
    // Prüfe auf Lücken in Ständen pro Startzeit
    const nachStartzeit = editData.startliste.reduce((acc: Record<string, number[]>, starter) => {
      const zeit = starter.startzeit || '14:00';
      if (!acc[zeit]) acc[zeit] = [];
      acc[zeit].push(parseInt(String(starter.stand || '0')));
      return acc;
    }, {} as Record<string, number[]>);
    
    const konfigurierteStaende = editData.konfiguration?.staende || [1,2,3,4,5,6,7,8,9];
    
    Object.entries(nachStartzeit).forEach(([zeit, staende]: [string, number[]]) => {
      const sortierteStaende = staende.sort((a, b) => a - b);
      
      konfigurierteStaende.forEach(stand => {
        if (!sortierteStaende.includes(stand)) {
          konflikte.push(`🕳️ Stand ${stand} um ${zeit} Uhr ist frei (Lücke in der Belegung)`);
        }
      });
    });
    
    return konflikte;
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Lade Startlisten...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/km-orga" className="text-blue-600 hover:text-blue-800">
          ← Zurück
        </Link>
        <h1 className="text-3xl font-bold text-gray-800">📄 Gespeicherte Startlisten V2</h1>
        <div className="ml-auto flex items-center gap-4">
          <label className="text-sm font-medium">Saison:</label>
          <select
            value={selectedSaison}
            onChange={(e) => setSelectedSaison(e.target.value)}
            className="px-3 py-2 border rounded-lg bg-white"
            disabled={verfuegbareJahre.length === 0}
          >
            {verfuegbareJahre.length === 0 ? (
              <option value="">Lade Jahre...</option>
            ) : (
              verfuegbareJahre.map(jahr => (
                <option key={jahr} value={jahr}>
                  {jahr}
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      {/* Bedienungsanleitung */}
      <div className="mb-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            📖 Bedienungsanleitung & Workflow
          </h2>
          <button
            onClick={() => setShowAnleitung(!showAnleitung)}
            className="text-gray-600 hover:text-gray-800 text-sm"
          >
            {showAnleitung ? 'Ausblenden' : 'Anzeigen'}
          </button>
        </div>
        
        {showAnleitung && (
          <div className="space-y-4 text-sm text-gray-900 dark:text-white">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">🎯 Grundfunktionen</h3>
                <ul className="space-y-1 text-gray-700 dark:text-gray-200">
                  <li>• <strong>Bearbeiten:</strong> Startliste öffnen und anpassen</li>
                  <li>• <strong>PDF Drucken:</strong> Offizielle Startlisten für Wettkampf</li>
                  <li>• <strong>David21 Import:</strong> CSV-Export für Schießanlagen</li>
                  <li>• <strong>Löschen:</strong> Startliste endgültig entfernen</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold text-purple-800 dark:text-purple-200 mb-2">🔄 Bearbeitungsmodus</h3>
                <ul className="space-y-1 text-gray-700 dark:text-gray-200">
                  <li>• <strong>Drag & Drop:</strong> Schützen zwischen Positionen ziehen</li>
                  <li>• <strong>Schützen tauschen:</strong> 1:1 Tausch zwischen zwei Schützen</li>
                  <li>• <strong>Schütze hinzufügen:</strong> Neue Schützen aus Meldungen</li>
                  <li>• <strong>Positionen neu berechnen:</strong> Automatische Reorganisation</li>
                </ul>
              </div>
            </div>
            
            <div className="border-t pt-4">
              <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2">🏆 Vereins-Management Workflow</h3>
              <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded border">
                <p className="font-medium mb-2 dark:text-white">Beispiel: Salzderhelden muss früher starten</p>
                <ol className="space-y-1 text-gray-700 dark:text-gray-200">
                  <li>1. <strong>Startliste bearbeiten</strong> → "Bearbeiten" Button klicken</li>
                  <li>2. <strong>Vereins-Management öffnen</strong> → "Anzeigen" klicken</li>
                  <li>3. <strong>Verein auswählen</strong> → "Salzderhelden" aus Dropdown</li>
                  <li>4. <strong>Neue Zeit eingeben</strong> → z.B. "13:00" statt "14:00"</li>
                  <li>5. <strong>Vorziehen</strong> → Alle Schützen werden automatisch verschoben</li>
                  <li>6. <strong>Lücken füllen</strong> → Optimiert die gesamte Startliste</li>
                  <li>7. <strong>Speichern</strong> → Änderungen übernehmen</li>
                </ol>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded border">
                <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">📊 Vereins-Übersicht</h4>
                <p className="text-gray-700 dark:text-gray-200">Zeigt wie viele Schützen pro Verein zu welcher Zeit starten. Hilft bei der Planung.</p>
              </div>
              
              <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded border">
                <h4 className="font-semibold text-orange-800 dark:text-orange-200 mb-2">⚠️ Konflikt-Warnung</h4>
                <p className="text-gray-700 dark:text-gray-200">Automatische Erkennung von Doppelbelegungen und fehlenden Daten vor dem Speichern.</p>
              </div>
              
              <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded border">
                <h4 className="font-semibold text-purple-800 dark:text-purple-200 mb-2">🔧 Lücken füllen</h4>
                <p className="text-gray-700 dark:text-gray-200">Reorganisiert die komplette Startliste ohne Leerstellen für optimale Zeitnutzung.</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Änderungswünsche Panel */}
      <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-blue-800 flex items-center gap-2">
            📝 Änderungswünsche Saison {selectedSaison}
          </h2>
          <button
            onClick={() => setShowAenderungen(!showAenderungen)}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            {showAenderungen ? 'Ausblenden' : 'Anzeigen'}
          </button>
        </div>
        
        {showAenderungen && (
          <div className="space-y-4">
            {/* Neuen Wunsch hinzufügen */}
            <div className="flex gap-2">
              <input
                type="text"
                value={neuerWunsch}
                onChange={(e) => setNeuerWunsch(e.target.value)}
                placeholder="Neuen Änderungswunsch eingeben..."
                className="flex-1 px-3 py-2 border rounded-lg"
                onKeyDown={(e) => e.key === 'Enter' && addAenderungswunsch()}
              />
              <button
                onClick={addAenderungswunsch}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Hinzufügen
              </button>
            </div>
            
            {/* Liste der Wünsche */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {aenderungswuensche.map((wunsch) => (
                <div key={wunsch.id} className={`p-3 rounded-lg border ${
                  wunsch.status === 'erledigt' ? 'bg-green-50 border-green-200' :
                  wunsch.status === 'bearbeitung' ? 'bg-yellow-50 border-yellow-200' :
                  'bg-white border-gray-200'
                }`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm">{wunsch.text}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span title="Autor des Änderungswunsches">👤 {wunsch.autor}</span>
                        <span title="Erstellungsdatum und -zeit">🕰️ {format(wunsch.timestamp, 'dd.MM.yyyy HH:mm', { locale: de })}</span>
                        <span className={`px-2 py-1 rounded ${
                          wunsch.status === 'erledigt' ? 'bg-green-100 text-green-800' :
                          wunsch.status === 'bearbeitung' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`} title={`Status: ${wunsch.status === 'erledigt' ? 'Erledigt' : wunsch.status === 'bearbeitung' ? 'In Bearbeitung' : 'Offen'}`}>
                          {wunsch.status === 'erledigt' ? '✅ Erledigt' :
                           wunsch.status === 'bearbeitung' ? '🔄 In Bearbeitung' :
                           '🔴 Offen'}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1 ml-4">
                      {wunsch.status !== 'bearbeitung' && (
                        <button
                          onClick={() => updateAenderungswunschStatus(wunsch.id, 'bearbeitung')}
                          className="px-2 py-1 text-xs bg-yellow-600 text-white rounded hover:bg-yellow-700"
                          title="Als 'In Bearbeitung' markieren"
                        >
                          🔄
                        </button>
                      )}
                      {wunsch.status !== 'erledigt' && (
                        <button
                          onClick={() => updateAenderungswunschStatus(wunsch.id, 'erledigt')}
                          className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                          title="Als erledigt markieren"
                        >
                          ✅
                        </button>
                      )}
                      <button
                        onClick={() => {
                          if (confirm('Änderungswunsch wirklich löschen?')) {
                            deleteAenderungswunsch(wunsch.id);
                          }
                        }}
                        className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                        title="Änderungswunsch endgültig löschen"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {aenderungswuensche.length === 0 && (
                <p className="text-gray-500 text-sm text-center py-4">
                  Keine Änderungswünsche für Saison {selectedSaison}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {startlisten.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">Keine Startlisten gefunden</p>
          <Link href="/startlisten-tool-v2" className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded">
            Neue Startliste erstellen
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {startlisten.map((startliste) => (
            <div key={startliste.id} className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Startliste für den {startliste.konfiguration?.datum ? 
                      new Date(startliste.konfiguration.datum).toLocaleDateString('de-DE') : 
                      new Date(startliste.erstellt?.toDate?.() || startliste.erstellt).toLocaleDateString('de-DE')
                    }
                  </h3>
                  <p className="text-gray-600">
                    {startliste.startliste?.length || 0} Starter • Saison: {getSaisonName(startliste.saison || '')}
                  </p>
                </div>
                <div className="flex gap-2">
                  {editingId === startliste.id ? (
                    <>
                      <button
                        onClick={handleSave}
                        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                      >
                        💾 Speichern
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
                      >
                        Abbrechen
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleEdit(startliste)}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                      >
                        ✏️ Bearbeiten
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            const { default: jsPDF } = await import('jspdf');
                            const { default: autoTable } = await import('jspdf-autotable');
                            
                            // Lade Mannschaften und Disziplinen für E/M Erkennung und SPO-Nummern
                            const [schuetzenRes, mannschaftenRes, disziplinenRes] = await Promise.all([
                              fetch('/api/shooters'),
                              fetch('/api/km/mannschaften'),
                              fetch('/api/km/disziplinen'),
                              fetch('/api/km/meldungen')
                            ]);
                            
                            const schuetzenData = schuetzenRes.ok ? (await schuetzenRes.json()).data || [] : [];
                            const mannschaftenData = mannschaftenRes.ok ? (await mannschaftenRes.json()).data || [] : [];
                            const disziplinenData = disziplinenRes.ok ? (await disziplinenRes.json()).data || [] : [];
                            
                            // Schützen-Map für PDF Export
                            const schuetzenMapPDF: Record<string, any> = {};
                            schuetzenData.forEach((data: any) => {
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
                              logWarn('Logo konnte nicht geladen werden:', { data: error });
                            }
                            
                            doc.setFontSize(20);
                            const currentSaison = saisons.find(s => s.id === startliste.saison);
                            doc.text(`Kreisverbandsmeisterschaft ${currentSaison?.jahr || 2026}`, pageWidth / 2, 140, { align: 'center' });
                            
                            doc.setFontSize(18);
                            doc.text('Startlisten', pageWidth / 2, 160, { align: 'center' });
                            
                            // Disziplinen mit Bullet-Points
                            doc.setFontSize(16);
                            doc.setFont('helvetica', 'normal');
                            const disziplinText = startliste.konfiguration?.selectedDisziplinen?.join(' • ') || 'Alle Disziplinen';
                            doc.text(disziplinText, pageWidth / 2, 190, { align: 'center' });
                            
                            // Verwende gefilterte Startliste
                            const gefilterteStartliste = startliste.startliste || [];
                            
                            // Gruppiere nur nach Startzeiten
                            const nachStartzeit = gefilterteStartliste.reduce((acc: Record<string, any[]>, s) => {
                              const zeit = s.startzeit || startliste.konfiguration?.startzeit || '14:00';
                              if (!acc[zeit]) acc[zeit] = [];
                              acc[zeit].push(s);
                              return acc;
                            }, {} as Record<string, any[]>);
                            
                            const datum = new Date(startliste.konfiguration?.datum || '').toLocaleDateString('de-DE', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            });
                            
                            let globalStartNummer = 1;
                            let isFirstStart = true;
                            let currentY = 35;
                            
                            Object.entries(nachStartzeit)
                              .sort(([zeitA], [zeitB]) => zeitA.localeCompare(zeitB)) // Sortiere Uhrzeiten korrekt
                              .forEach(([startzeit, starterGruppe]: [string, any[]], _startzeitIndex) => {
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
                                const austragungsort = startliste.konfiguration?.austragungsort || 'ESG Einbeck';
                                doc.text(`Start ${globalStartNummer} am: ${datum} um ${startzeit} Uhr im Schützenhaus ${austragungsort}`, 20, currentY);
                                currentY += 7;
                                doc.text(`Schießzeit pro Durchgang = ${startliste.konfiguration?.durchgang || 50} Minuten`, 20, currentY);
                                currentY += 10;
                                
                                globalStartNummer++;
                                const sortierteStarter = starterGruppe.sort((a, b) => {
                                  const standA = parseInt(a.stand || '999');
                                  const standB = parseInt(b.stand || '999');
                                  if (standA !== standB) return standA - standB;
                                  return a.name.localeCompare(b.name);
                                });
                                
                                const tableData = sortierteStarter.map((s) => {
                                  // Finde Schütze für echte Mitgliedsnummer
                                  const schuetze = schuetzenMapPDF[s.name];
                                  let mitgliedsNr = '08-000-0000';
                                  if (schuetze?.mitgliedsnummer) {
                                    const mitgliedsNummerStr = schuetze.mitgliedsnummer.toString();
                                    if (mitgliedsNummerStr.length >= 7) {
                                      const teil1 = mitgliedsNummerStr.substring(1, 4).padStart(3, '0');
                                      const teil2 = mitgliedsNummerStr.substring(4).padStart(3, '0');
                                      mitgliedsNr = `08-${teil1}-${teil2}`;
                                    }
                                  }
                                  
                                  const nameParts = s.name.split(' ');
                                  const nachname = nameParts[nameParts.length - 1];
                                  const vorname = nameParts.slice(0, -1).join(' ');
                                  
                                  // E/M: Prüfe ob Schütze in Mannschaft
                                  let istMannschaft = false;
                                  if (schuetze?.id) {
                                    mannschaftenData.forEach((mannschaftData: any) => {
                                      if (mannschaftData.schuetzenIds?.includes(schuetze.id)) {
                                        istMannschaft = true;
                                      }
                                    });
                                  }
                                  const einzelMannschaft = istMannschaft ? 'M' : 'E';
                                  
                                  // LM: Suche in ursprünglichen Meldungen
                                  const originalMeldung = meldungen.find(m => m.name === s.name && m.disziplin === s.disziplin);
                                  const lmTeilnahme = originalMeldung?.lmTeilnahme === true;
                                  
                                  // Altersklasse berechnen
                                  let korrekteAltersklasse = 'Unbekannt';
                                  if (schuetze?.birthYear) {
                                    const age = (new Date().getFullYear()) - schuetze.birthYear;
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
                                  
                                  // Hole SPO-Nummer
                                  const disziplinDoc = disziplinenData.find((d: any) => d.name === s.disziplin);
                                  const spoNummer = disziplinDoc?.spoNummer || '1.41';
                                  
                                  return [
                                    String(s.stand || 'N/A').replace(/[<>"'&]/g, ''),
                                    String(mitgliedsNr).replace(/[<>"'&]/g, ''),
                                    String(nachname).replace(/[<>"'&]/g, ''),
                                    String(vorname).replace(/[<>"'&]/g, ''),
                                    String(s.verein || '').replace(/[<>"'&]/g, ''),
                                    String(spoNummer).replace(/[<>"'&]/g, ''),
                                    String(korrekteAltersklasse).replace(/[<>"'&]/g, ''),
                                    String(einzelMannschaft).replace(/[<>"'&]/g, ''),
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
                                    minCellHeight: 16
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
                            
                            const sanitizedDatum = String(startliste.konfiguration?.datum || new Date().toISOString().split('T')[0]).replace(/[<>"'&\/\\]/g, '');
                            const fileName = `Startliste_KM_${sanitizedDatum}.pdf`;
                            doc.save(fileName);
                          } catch (error) {
                            logError('PDF-Export Fehler:', error);
                          }
                        }}
                        className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                      >
                        📝 PDF Drucken
                      </button>
                      <button
                        onClick={() => {
                          // David21 Import - CSV Export für David21
                          const csvContent = (startliste.startliste || [])
                            .filter(s => s.name && s.name !== 'EMPTY')
                            .sort((a, b) => {
                              if (a.durchgang !== b.durchgang) return (a.durchgang || 1) - (b.durchgang || 1);
                              const standA = parseInt(String(a.stand || '0'));
                              const standB = parseInt(String(b.stand || '0'));
                              if (standA !== standB) return standA - standB;
                              return (a.startzeit || '').localeCompare(b.startzeit || '');
                            })
                            .map(s => {
                              const sanitizedName = String(s.schuetzeName || s.name || '').replace(/[<>"'&;]/g, '');
                              const nameParts = sanitizedName.split(' ');
                              const vorname = nameParts.slice(0, -1).join(' ');
                              const nachname = nameParts[nameParts.length - 1];
                              
                              return [
                                nachname,
                                vorname,
                                String(s.verein || '').replace(/[<>"'&;]/g, ''),
                                String(s.altersklasse || '').replace(/[<>"'&;]/g, ''),
                                String(s.disziplin || '').replace(/[<>"'&;]/g, ''),
                                String(s.stand || '').replace(/[<>"'&;]/g, ''),
                                String(s.startzeit || '').replace(/[<>"'&;]/g, ''),
                                String(s.durchgang || '1').replace(/[<>"'&;]/g, '')
                              ].join(';');
                            })
                            .join('\n');
                          
                          const header = 'Name;Vorname;Verein;Altersklasse;Disziplin;Stand;Startzeit;Durchgang\n';
                          const fullCsv = header + csvContent;
                          
                          const blob = new Blob([fullCsv], { type: 'text/csv;charset=utf-8;' });
                          const link = document.createElement('a');
                          const url = URL.createObjectURL(blob);
                          link.setAttribute('href', url);
                          const sanitizedDatum = String(startliste.konfiguration?.datum || 'export').replace(/[<>"'&\/\\]/g, '');
                          link.setAttribute('download', `startliste_david21_${sanitizedDatum}.csv`);
                          link.style.visibility = 'hidden';
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }}
                        className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
                      >
                        📊 David21 Import
                      </button>
                      <button
                        onClick={() => handleDelete(startliste.id)}
                        className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
                      >
                        🗑️ Löschen
                      </button>
                    </>
                  )}
                </div>
              </div>

              {editingId === startliste.id ? (
                <div className="space-y-4">
                  {/* Konfiguration bearbeiten */}
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-3">Konfiguration</h4>
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                      <div>
                        <label className="block text-sm font-medium mb-1">Datum</label>
                        <input
                          type="date"
                          value={editData.konfiguration?.datum || ''}
                          onChange={(e) => setEditData({
                            ...editData,
                            konfiguration: { ...editData.konfiguration, datum: e.target.value }
                          })}
                          className="w-full p-2 border rounded text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Austragungsort</label>
                        <input
                          type="text"
                          value={editData.konfiguration?.austragungsort || ''}
                          onChange={(e) => setEditData({
                            ...editData,
                            konfiguration: { ...editData.konfiguration, austragungsort: e.target.value }
                          })}
                          className="w-full p-2 border rounded text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Startzeit</label>
                        <input
                          type="time"
                          value={editData.konfiguration?.startzeit || ''}
                          onChange={(e) => setEditData({
                            ...editData,
                            konfiguration: { ...editData.konfiguration, startzeit: e.target.value }
                          })}
                          className="w-full p-2 border rounded text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Auto-Berechnung</label>
                        <label className="flex items-center gap-2 mt-2">
                          <input
                            type="checkbox"
                            checked={editData.konfiguration?.autoRecalculate !== false}
                            onChange={(e) => setEditData({
                              ...editData,
                              konfiguration: { ...editData.konfiguration, autoRecalculate: e.target.checked }
                            })}
                            className="w-4 h-4"
                          />
                          <span className="text-xs">Positionen automatisch berechnen</span>
                        </label>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Durchgang (Min)</label>
                        <input
                          type="number"
                          value={editData.konfiguration?.durchgang || ''}
                          onChange={(e) => setEditData({
                            ...editData,
                            konfiguration: { ...editData.konfiguration, durchgang: e.target.value ? parseInt(e.target.value) : '' } as any
                          })}
                          className="w-full p-2 border rounded text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Wechsel (Min)</label>
                        <input
                          type="number"
                          value={editData.konfiguration?.wechsel || ''}
                          onChange={(e) => setEditData({
                            ...editData,
                            konfiguration: { ...editData.konfiguration, wechsel: e.target.value ? parseInt(e.target.value) : '' } as any
                          })}
                          className="w-full p-2 border rounded text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Stände ({(editData.konfiguration?.staende || []).length})</label>
                        <div className="flex flex-wrap gap-1">
                          {[1,2,3,4,5,6,7,8,9,101,102].map(stand => (
                            <label key={stand} className="flex items-center gap-1 text-xs">
                              <input
                                type="checkbox"
                                checked={(editData.konfiguration?.staende || []).includes(stand)}
                                onChange={(e) => {
                                  const aktuelleStaende = editData.konfiguration?.staende || [];
                                  let neueStaende;
                                  if (e.target.checked) {
                                    neueStaende = [...aktuelleStaende, stand].sort((a,b) => a-b);
                                  } else {
                                    neueStaende = aktuelleStaende.filter(s => s !== stand);
                                  }
                                  setEditData({
                                    ...editData,
                                    konfiguration: { ...editData.konfiguration, staende: neueStaende }
                                  });
                                }}
                                className="w-3 h-3"
                              />
                              {stand}
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Probleme-Anzeige mit Konflikten */}
                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <h4 className="font-medium text-yellow-900 mb-3 flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      Konflikte in der Startliste
                    </h4>
                    {(() => {
                      const konflikte = getKonflikte();
                      const startliste = editData.startliste || [];
                      
                      // Prüfe auf fehlende Stände
                      const ohneStand = startliste
                        .map((starter, index) => ({ starter, index: index + 1 }))
                        .filter(({ starter }) => !starter.stand || starter.stand === '')
                        .map(({ index }) => index);
                      
                      if (ohneStand.length > 0) {
                        konflikte.push(`🚫 Ohne Stand-Zuweisung: Zeilen ${ohneStand.join(', ')}`);
                      }
                      
                      // Prüfe auf fehlende Namen
                      const ohneName = startliste
                        .map((starter, index) => ({ starter, index: index + 1 }))
                        .filter(({ starter }) => !starter.name || starter.name.trim() === '')
                        .map(({ index }) => index);
                      
                      if (ohneName.length > 0) {
                        konflikte.push(`📝 Ohne Namen: Zeilen ${ohneName.join(', ')}`);
                      }
                      
                      return konflikte.length > 0 ? (
                        <ul className="space-y-1 text-sm text-yellow-800">
                          {konflikte.map((konflikt, index) => (
                            <li key={index} className="flex items-start">
                              <span className="mr-2">•</span>
                              <span>{konflikt}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-green-700 flex items-center">
                          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          ✅ Keine Konflikte gefunden - Startliste ist bereit!
                        </p>
                      );
                    })()}
                  </div>
                  
                  {/* Schützen hinzufügen/entfernen */}
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-medium text-green-900">Schützen verwalten</h4>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSwapMode(!swapMode);
                            setSelectedForSwap([]);
                          }}
                          className={`px-3 py-1 rounded text-sm transition-colors ${
                            swapMode 
                              ? 'bg-orange-600 text-white hover:bg-orange-700' 
                              : 'bg-orange-100 text-orange-800 hover:bg-orange-200'
                          }`}
                        >
                          🔄 {swapMode ? 'Tausch-Modus beenden' : 'Schützen tauschen'}
                        </button>
                        {swapMode && selectedForSwap.length === 2 && (
                          <button
                            onClick={swapShooters}
                            className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                          >
                            ✅ Tauschen
                          </button>
                        )}
                        <button
                          onClick={() => setShowAddShooter(!showAddShooter)}
                          className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                        >
                          + Schütze hinzufügen
                        </button>
                        <button
                          onClick={() => {
                            if (editData.konfiguration?.autoRecalculate !== false) {
                              const recalculatedStartliste = recalculateAllPositions(editData.startliste || []);
                              setEditData({
                                ...editData,
                                startliste: recalculatedStartliste
                              });
                            }
                          }}
                          className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                          title="Alle Positionen automatisch neu berechnen"
                        >
                          🔄 Positionen neu berechnen
                        </button>
                      </div>
                    </div>
                    
                    {swapMode && (
                      <div className="bg-orange-50 p-3 rounded border border-orange-200 mb-3">
                        <p className="text-sm text-orange-800 mb-2">
                          🔄 <strong>Tausch-Modus aktiv:</strong> Klicken Sie auf 2 Schützen, um ihre Positionen zu tauschen.
                        </p>
                        <p className="text-xs text-orange-600">
                          Ausgewählt: {selectedForSwap.length}/2 Schützen
                          {selectedForSwap.length > 0 && (
                            <span className="ml-2">
                              ({selectedForSwap.map(i => (editData.startliste || [])[i]?.name).join(' ↔ ')})
                            </span>
                          )}
                        </p>
                      </div>
                    )}
                    
                    {showAddShooter && (
                      <div className="bg-white p-3 rounded border">
                        <input
                          type="text"
                          placeholder="Schützen suchen..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full p-2 border rounded mb-2 text-sm"
                        />
                        <div className="max-h-32 overflow-y-auto space-y-1">
                          {meldungen
                            .filter(m => 
                              // Filtere nach Saison der Startliste
                              m.saisonId === startliste.saison &&
                              !editData.startliste?.some(s => s.name === m.name && s.disziplin === m.disziplin) &&
                              (searchTerm === '' || 
                               m.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                               m.verein?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                               m.disziplin?.toLowerCase().includes(searchTerm.toLowerCase()))
                            )
                            .slice(0, 10)
                            .map((meldung, i) => (
                              <div
                                key={i}
                                draggable
                                onDragStart={(e) => {
                                  e.dataTransfer.setData('text/plain', JSON.stringify({
                                    type: 'newShooter',
                                    meldung: meldung
                                  }));
                                  e.currentTarget.style.opacity = '0.5';
                                }}
                                onDragEnd={(e) => {
                                  e.currentTarget.style.opacity = '1';
                                }}
                                onClick={() => addShooterToStartliste(meldung)}
                                className="w-full text-left p-2 bg-gray-50 hover:bg-blue-50 rounded text-xs border cursor-move transition-colors"
                                title="🖱️ Ziehen oder klicken zum Hinzufügen"
                              >
                                <div className="font-medium flex items-center gap-2">
                                  {meldung.name}
                                  {meldung.lmTeilnahme && (
                                    <span className="text-xs bg-green-100 text-green-800 px-1 rounded">LM</span>
                                  )}
                                </div>
                                <div className="text-gray-600">{meldung.spoNummer} - {meldung.disziplin} • {meldung.verein}</div>
                              </div>
                            ))
                          }
                        </div>
                      </div>
                    )}
                  </div>
                  {/* Vereins-Tools */}
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-medium text-purple-900">Vereins-Management</h4>
                      <button
                        onClick={() => setShowVereinsTools(!showVereinsTools)}
                        className="text-purple-600 hover:text-purple-800 text-sm"
                      >
                        {showVereinsTools ? 'Ausblenden' : 'Anzeigen'}
                      </button>
                    </div>
                    
                    {showVereinsTools && (
                      <div className="space-y-4">
                        {/* Vereins-Übersicht */}
                        <div className="bg-white p-3 rounded border">
                          <h5 className="font-medium mb-2">📊 Vereins-Übersicht</h5>
                          <div className="text-xs space-y-1 max-h-32 overflow-y-auto">
                            {Object.entries(getVereinsUebersicht()).map(([verein, zeiten]) => (
                              <div key={verein} className="flex justify-between border-b border-gray-100 dark:border-gray-700 py-1">
                                <span className="font-medium">{verein}:</span>
                                <span className="flex gap-3">
                                  {Object.entries(zeiten as Record<string, number>).map(([zeit, anzahl]) => (
                                    <span key={zeit} className="text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded">
                                      {zeit}h: {anzahl}
                                    </span>
                                  ))}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        {/* Verein vorziehen */}
                        <div className="bg-white p-3 rounded border">
                          <h5 className="font-medium mb-2">⏰ Verein vorziehen</h5>
                          <div className="grid grid-cols-3 gap-2">
                            <select
                              value={selectedVerein}
                              onChange={(e) => setSelectedVerein(e.target.value)}
                              className="p-2 border rounded text-sm"
                            >
                              <option value="">Verein wählen...</option>
                              {getVerfuegbareVereine().map(verein => (
                                <option key={verein} value={verein}>{verein}</option>
                              ))}
                            </select>
                            <input
                              type="time"
                              value={neueStartzeit}
                              onChange={(e) => setNeueStartzeit(e.target.value)}
                              className="p-2 border rounded text-sm"
                            />
                            <button
                              onClick={vereinVorziehen}
                              className="bg-purple-600 text-white px-3 py-2 rounded text-sm hover:bg-purple-700"
                            >
                              ⏰ Vorziehen
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Starter-Suche */}
                  <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200 mb-4">
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium text-yellow-900">🔍 Starter suchen:</label>
                      <input
                        type="text"
                        value={starterSuche}
                        onChange={(e) => {
                          setStarterSuche(e.target.value);
                          if (e.target.value) {
                            // Finde ersten passenden Starter
                            const suchbegriff = e.target.value.toLowerCase();
                            const gefundenerIndex = editData.startliste?.findIndex(starter => 
                              starter.name?.toLowerCase().includes(suchbegriff) ||
                              starter.verein?.toLowerCase().includes(suchbegriff) ||
                              starter.disziplin?.toLowerCase().includes(suchbegriff)
                            );
                            
                            if (gefundenerIndex !== undefined && gefundenerIndex >= 0) {
                              // Scrolle zum gefundenen Element
                              setTimeout(() => {
                                const element = document.querySelector<HTMLElement>(`[data-starter-index="${gefundenerIndex}"]`);
                                if (element) {
                                  element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                  element.style.backgroundColor = '#fef3c7';
                                  element.style.border = '2px solid #f59e0b';
                                  setTimeout(() => {
                                    element.style.backgroundColor = '';
                                    element.style.border = '';
                                  }, 2000);
                                }
                              }, 100);
                            }
                          }
                        }}
                        placeholder="Name, Verein oder Disziplin eingeben..."
                        className="flex-1 px-3 py-1 border rounded text-sm"
                      />
                      {starterSuche && (
                        <button
                          onClick={() => setStarterSuche('')}
                          className="px-2 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* Startliste bearbeiten */}
                  <div className="space-y-2 max-h-[60vh] overflow-y-auto bg-gray-50 rounded-lg p-3" id="startliste-container">
                    <div className="grid grid-cols-9 gap-2 p-2 bg-gray-200 dark:bg-gray-700 rounded font-medium text-sm dark:text-white">
                      <div className="col-span-2">Name</div>
                      <div>Verein</div>
                      <div>Disziplin</div>
                      <div>Stand</div>
                      <div>Startzeit</div>
                      <div>Durchgang</div>
                      <div>Anmerkung</div>
                      <div className="text-center">LM</div>
                    </div>
                    {editData.startliste?.map((starter, index, sortedArray) => (
                      <React.Fragment key={index}>
                        {/* Drop Zone vor der Card */}
                        <div
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.currentTarget.style.height = '40px';
                            e.currentTarget.style.backgroundColor = '#bbf7d0';
                            e.currentTarget.style.border = '2px dashed #16a34a';
                            e.currentTarget.style.borderRadius = '8px';
                            e.currentTarget.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#16a34a;font-weight:bold;font-size:12px;pointer-events:none;">📍 Hier ablegen</div>';
                          }}
                          onDragLeave={(e) => {
                            e.currentTarget.style.height = '16px';
                            e.currentTarget.style.backgroundColor = '#e5e7eb';
                            e.currentTarget.style.border = '1px dashed #9ca3af';
                            e.currentTarget.innerHTML = '';
                          }}
                          onDrop={async (e) => {
                            e.preventDefault();
                            e.currentTarget.style.height = '16px';
                            e.currentTarget.style.backgroundColor = '#e5e7eb';
                            e.currentTarget.style.border = '1px dashed #9ca3af';
                            e.currentTarget.innerHTML = '';
                            
                            try {
                              const dragData = JSON.parse(e.dataTransfer.getData('text/plain'));
                              
                              if (dragData.type === 'newShooter') {
                                // Neuen Schützen an dieser Position einfügen
                                let altersklasse = dragData.meldung.altersklasse || dragData.meldung.ageClass || dragData.meldung.wettkampfklasse;
                                if (!altersklasse || altersklasse === 'Unbekannt') {
                                  // Hole Schützen-Daten für Altersklassen-Berechnung
                                  try {
                                    const shootersRes = await fetch('/api/shooters');
                                    if (shootersRes.ok) {
                                      const shootersData = await shootersRes.json();
                                      const schuetze = shootersData.data?.find((s: any) => s.name === dragData.meldung.name);
                                      if (schuetze) {
                                        altersklasse = calculateAgeClass(schuetze, dragData.meldung.disziplin, selectedSaison);
                                      }
                                    }
                                  } catch (error) {
                                    logError('Fehler bei Altersklassen-Berechnung:', error);
                                  }
                                }
                                
                                const newStarter = {
                                  id: `added_${Date.now()}`,
                                  name: dragData.meldung.name,
                                  schuetzeName: dragData.meldung.name,
                                  verein: dragData.meldung.verein,
                                  disziplin: dragData.meldung.disziplin,
                                  altersklasse: altersklasse,
                                  anmerkung: dragData.meldung.anmerkung || '',
                                  stand: '1',
                                  startzeit: editData.konfiguration?.startzeit || '14:00',
                                  durchgang: 1
                                };
                                
                                const newStartliste = [...(editData.startliste || [])];
                                newStartliste.splice(index, 0, newStarter);
                                
                                setEditData({
                                  ...editData,
                                  startliste: newStartliste
                                });
                              } else {
                                // Bestehenden Starter verschieben
                                const draggedIndex = dragData.starterIndex;
                                
                                if (draggedIndex === (editData.startliste || []).findIndex(s => s === starter)) return;
                                
                                const newStartliste = [...(editData.startliste || [])];
                                const [draggedItem] = newStartliste.splice(draggedIndex, 1);
                                const realIndex = (editData.startliste || []).findIndex(s => s === starter);
                                newStartliste.splice(realIndex, 0, draggedItem);
                                
                                // Only recalculate if auto-recalculate is enabled
                                if (editData.konfiguration?.autoRecalculate !== false) {
                                  const updatedStartliste = recalculateAllPositions(newStartliste);
                                  setEditData({
                                    ...editData,
                                    startliste: updatedStartliste
                                  });
                                } else {
                                  setEditData({
                                    ...editData,
                                    startliste: newStartliste
                                  });
                                }
                              }
                            } catch (error) {
                              logError('Drop Zone Fehler:', error);
                            }
                          }}
                          className="h-4 transition-all duration-200 rounded bg-gray-200 border border-dashed border-gray-400 mb-2"
                          style={{ backgroundColor: '#e5e7eb', border: '1px dashed #9ca3af' }}
                        />
                        
                        <div 
                          data-starter-index={index}
                          draggable={!swapMode}
                          onDragStart={(e) => {
                            if (swapMode) {
                              e.preventDefault();
                              return;
                            }
                            e.dataTransfer.setData('text/plain', JSON.stringify({
                              starterIndex: index,
                              starter: starter
                            }));
                            e.currentTarget.style.opacity = '0.5';
                          }}
                          onDrag={(e) => {
                            if (swapMode) return;
                            // Auto-scroll während drag
                            const container = document.getElementById('startliste-container');
                            if (container) {
                              const rect = container.getBoundingClientRect();
                              const scrollZone = 50;
                              
                              if (e.clientY < rect.top + scrollZone) {
                                container.scrollTop -= 10;
                              } else if (e.clientY > rect.bottom - scrollZone) {
                                container.scrollTop += 10;
                              }
                            }
                          }}
                          onDragEnd={(e) => {
                            if (swapMode) return;
                            e.currentTarget.style.opacity = '1';
                          }}
                          onClick={() => {
                            if (swapMode) {
                              const realIndex = (editData.startliste || []).findIndex(s => s === starter);
                              toggleSwapSelection(realIndex);
                            }
                          }}
                          className={`grid grid-cols-9 gap-2 p-2 rounded border transition-all ${
                            swapMode 
                              ? selectedForSwap.includes(index)
                                ? 'bg-orange-100 border-orange-400 cursor-pointer'
                                : 'bg-white hover:bg-orange-50 border-gray-300 cursor-pointer'
                              : 'bg-white dark:bg-gray-800 cursor-move hover:bg-gray-100 dark:border-gray-600'
                          }`}
                          title={swapMode ? '🔄 Zum Tauschen auswählen' : '🖱️ Ziehen & zwischen Cards ablegen'}
                        >
                        <div className="col-span-2">
                          <input
                            type="text"
                            value={starter.name || starter.schuetzeName || ''}
                            onChange={(e) => {
                              const realIndex = (editData.startliste || []).findIndex(s => s === starter);
                              updateStarter(realIndex, 'name', e.target.value);
                            }}
                            className="p-1 border rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white w-full"
                          />
                          <button
                            onClick={() => {
                            const realIndex = (editData.startliste || []).findIndex(s => s === starter);
                            removeStarter(realIndex);
                          }}
                            className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600 mt-1"
                          >
                            ×
                          </button>
                        </div>
                        <input
                          type="text"
                          value={starter.verein || ''}
                          onChange={(e) => {
                          const realIndex = (editData.startliste || []).findIndex(s => s === starter);
                          updateStarter(realIndex, 'verein', e.target.value);
                        }}
                          className="p-1 border rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white w-40"
                        />
                        <input
                          type="text"
                          value={starter.disziplin || ''}
                          onChange={(e) => {
                          const realIndex = (editData.startliste || []).findIndex(s => s === starter);
                          updateStarter(realIndex, 'disziplin', e.target.value);
                        }}
                          className="p-1 border rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white w-40"
                        />
                        <select
                          value={starter.stand}
                          onChange={(e) => {
                            const neuerStand = parseInt(e.target.value);
                            const konfigurierteStaende = editData.konfiguration?.staende || [1,2,3,4,5,6,7,8,9];
                            const maxStand = Math.max(...konfigurierteStaende);
                            
                            if (neuerStand > maxStand) return;
                            
                            const updatedStartliste = [...(editData.startliste || [])];
                            const currentStarter = updatedStartliste[index];
                            const currentStartzeit = currentStarter.startzeit;
                            const oldStand = parseInt(String(currentStarter.stand || '0'));
                            
                            // Finde alle Schützen zur gleichen Startzeit
                            const schuetzenGleicheZeit = updatedStartliste
                              .map((s, i) => ({ ...s, originalIndex: i }))
                              .filter(s => s.startzeit === currentStartzeit);
                            
                            // Wenn der neue Stand bereits belegt ist, verschiebe alle nachfolgenden um +1
                            if (neuerStand !== oldStand) {
                              schuetzenGleicheZeit.forEach(schuetze => {
                                const schuetzeStand = parseInt(String(schuetze.stand || '0'));
                                
                                if (schuetze.originalIndex === index) {
                                  // Der aktuelle Schütze bekommt den neuen Stand
                                  updatedStartliste[schuetze.originalIndex].stand = neuerStand.toString();
                                } else if (neuerStand <= schuetzeStand && schuetzeStand < maxStand) {
                                  // Alle Schützen ab dem neuen Stand werden um +1 verschoben
                                  updatedStartliste[schuetze.originalIndex].stand = (schuetzeStand + 1).toString();
                                }
                              });
                            }
                            
                            // Sortiere nach Zeit und Stand
                            const sortierteStartliste = updatedStartliste.sort((a, b) => {
                              if (a.startzeit !== b.startzeit) return String(a.startzeit || '').localeCompare(String(b.startzeit || ''));
                              return parseInt(String(a.stand || '0')) - parseInt(String(b.stand || '0'));
                            });
                            
                            setEditData({
                              ...editData,
                              startliste: sortierteStartliste
                            });
                          }}
                          className={`p-1 border rounded text-sm ${
                            (editData.startliste || []).some(s => 
                              s !== starter && s.startzeit === starter.startzeit && s.stand === starter.stand
                            ) ? 'border-red-500 bg-red-50' : 'border-gray-300'
                          }`}
                        >
                          {(() => {
                            const konfigurierteStaende = editData.konfiguration?.staende || [1,2,3,4,5,6,7,8,9];
                            return konfigurierteStaende.map(stand => {
                              const istBelegt = (editData.startliste || []).some(s => 
                                s !== starter && s.startzeit === starter.startzeit && s.stand === stand.toString()
                              );
                              return (
                                <option key={stand} value={stand}>
                                  Stand {stand} {istBelegt ? '❌' : '✅'}
                                </option>
                              );
                            });
                          })()}
                        </select>
                        <input
                          type="time"
                          value={starter.startzeit}
                          onChange={(e) => {
                            const neueStartzeit = e.target.value;
                            const updatedStartliste = [...(editData.startliste || [])];
                            updatedStartliste[index] = {
                              ...updatedStartliste[index],
                              startzeit: neueStartzeit
                            };
                            
                            // Automatisch sortieren nach Zeit und Stand
                            const sortierteStartliste = updatedStartliste.sort((a, b) => {
                              if (a.startzeit !== b.startzeit) return String(a.startzeit || '').localeCompare(String(b.startzeit || ''));
                              return parseInt(String(a.stand || '0')) - parseInt(String(b.stand || '0'));
                            });
                            
                            setEditData({
                              ...editData,
                              startliste: sortierteStartliste
                            });
                          }}
                          className="p-1 border rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white w-20"
                        />
                        <input
                          type="number"
                          value={starter.durchgang || ''}
                          onChange={(e) => {
                            const neuerDurchgang = e.target.value ? parseInt(e.target.value) : '';
                            const updatedStartliste = [...(editData.startliste || [])];
                            updatedStartliste[index] = {
                              ...updatedStartliste[index],
                              durchgang: neuerDurchgang
                            } as any;
                            
                            // Automatisch sortieren nach Zeit und Stand
                            const sortierteStartliste = updatedStartliste.sort((a, b) => {
                              if (a.startzeit !== b.startzeit) return String(a.startzeit || '').localeCompare(String(b.startzeit || ''));
                              return parseInt(String(a.stand || '0')) - parseInt(String(b.stand || '0'));
                            });
                            
                            setEditData({
                              ...editData,
                              startliste: sortierteStartliste
                            });
                          }}
                          className="p-1 border rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white w-10 text-center"
                          min="1"
                          max="99"
                        />
                        <input
                          type="text"
                          value={starter.anmerkung || ''}
                          onChange={(e) => {
                            const realIndex = (editData.startliste || []).findIndex(s => s === starter);
                            updateStarter(realIndex, 'anmerkung', e.target.value);
                          }}
                          className="p-1 border rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white w-24"
                        />
                        <div className="flex items-center justify-center">
                          <input
                            type="checkbox"
                            checked={starter.lmTeilnahme === true || meldungen.find(m => m.name === starter.name && m.disziplin === starter.disziplin)?.lmTeilnahme === true}
                            onChange={(e) => {
                              const realIndex = (editData.startliste || []).findIndex(s => s === starter);
                              updateStarter(realIndex, 'lmTeilnahme', e.target.checked);
                            }}
                            className="w-4 h-4 rounded"
                            title="Landesmeisterschaft Teilnahme"
                          />
                        </div>
                        </div>
                        
                        {/* Drop Zone nach der letzten Card */}
                        {index === sortedArray.length - 1 && (
                          <div
                            onDragOver={(e) => {
                              e.preventDefault();
                              e.currentTarget.style.height = '40px';
                              e.currentTarget.style.backgroundColor = '#bbf7d0';
                              e.currentTarget.style.border = '2px dashed #16a34a';
                              e.currentTarget.style.borderRadius = '8px';
                              e.currentTarget.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#16a34a;font-weight:bold;font-size:12px;pointer-events:none;">📍 Hier ablegen</div>';
                            }}
                            onDragLeave={(e) => {
                              e.currentTarget.style.height = '16px';
                              e.currentTarget.style.backgroundColor = '#e5e7eb';
                              e.currentTarget.style.border = '1px dashed #9ca3af';
                              e.currentTarget.innerHTML = '';
                            }}
                            onDrop={async (e) => {
                              e.preventDefault();
                              e.currentTarget.style.height = '16px';
                              e.currentTarget.style.backgroundColor = '#e5e7eb';
                              e.currentTarget.style.border = '1px dashed #9ca3af';
                              e.currentTarget.innerHTML = '';
                              
                              try {
                                const dragData = JSON.parse(e.dataTransfer.getData('text/plain'));
                                
                                if (dragData.type === 'newShooter') {
                                  // Neuen Schützen am Ende hinzufügen
                                  let altersklasse = dragData.meldung.altersklasse || dragData.meldung.ageClass || dragData.meldung.wettkampfklasse;
                                  if (!altersklasse || altersklasse === 'Unbekannt') {
                                    // Hole Schützen-Daten für Altersklassen-Berechnung
                                    try {
                                      const shootersRes = await fetch('/api/shooters');
                                      if (shootersRes.ok) {
                                        const shootersData = await shootersRes.json();
                                        const schuetze = shootersData.data?.find((s: any) => s.name === dragData.meldung.name);
                                        if (schuetze) {
                                          altersklasse = calculateAgeClass(schuetze, dragData.meldung.disziplin, selectedSaison);
                                        }
                                      }
                                    } catch (error) {
                                      logError('Fehler bei Altersklassen-Berechnung:', error);
                                    }
                                  }
                                  
                                  const newStarter = {
                                    id: `added_${Date.now()}`,
                                    name: dragData.meldung.name,
                                    schuetzeName: dragData.meldung.name,
                                    verein: dragData.meldung.verein,
                                    disziplin: dragData.meldung.disziplin,
                                    altersklasse: altersklasse,
                                    anmerkung: dragData.meldung.anmerkung || '',
                                    stand: '1',
                                    startzeit: editData.konfiguration?.startzeit || '14:00',
                                    durchgang: 1
                                  };
                                  
                                  const newStartliste = [...(editData.startliste || []), newStarter];
                                  
                                  setEditData({
                                    ...editData,
                                    startliste: newStartliste
                                  });
                                } else {
                                  const draggedIndex = dragData.starterIndex;
                                  
                                  const newStartliste = [...(editData.startliste || [])];
                                  const [draggedItem] = newStartliste.splice(draggedIndex, 1);
                                  newStartliste.push(draggedItem);
                                  
                                  // Recalculate positions for all starters
                                  const updatedStartliste = recalculateAllPositions(newStartliste);
                                  
                                  setEditData({
                                    ...editData,
                                    startliste: updatedStartliste
                                  });
                                }
                              } catch (error) {
                                logError('End Drop Zone Fehler:', error);
                              }
                            }}
                            className="h-4 transition-all duration-200 rounded mt-2 bg-gray-200 border border-dashed border-gray-400"
                            style={{ backgroundColor: '#e5e7eb', border: '1px dashed #9ca3af' }}
                          />
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                  <p>Datum: {startliste.konfiguration?.datum || 'Nicht angegeben'}</p>
                  <p>Ort: {startliste.konfiguration?.austragungsort || 'Nicht angegeben'}</p>
                  <p><span className="text-red-600 font-semibold">Disziplinen:</span> {startliste.konfiguration?.selectedDisziplinen?.join(', ') || 'Alle'}</p>
                  <p>Konfiguration: {startliste.konfiguration?.staende?.length || 0} Stände, Start: {startliste.konfiguration?.startzeit}</p>
                  <p>Erstellt: {new Date(startliste.erstellt?.toDate?.() || startliste.erstellt).toLocaleString('de-DE')}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
