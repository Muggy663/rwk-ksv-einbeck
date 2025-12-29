'use client';

import React, { useState, useEffect } from 'react';
import { getDocs, collection, doc, updateDoc, deleteDoc, addDoc, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

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

export default function StartlistenV2Uebersicht() {
  const { toast } = useToast();
  const [startlisten, setStartlisten] = useState([]);
  const [saisons, setSaisons] = useState([]);
  const [meldungen, setMeldungen] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [showAddShooter, setShowAddShooter] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSaison, setSelectedSaison] = useState('');
  const [verfuegbareJahre, setVerfuegbareJahre] = useState<string[]>([]);
  const [aenderungswuensche, setAenderungswuensche] = useState<Aenderungswunsch[]>([]);
  const [neuerWunsch, setNeuerWunsch] = useState('');
  const [showAenderungen, setShowAenderungen] = useState(true);

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
      
      const gefundeneJahre = new Set();
      
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
      console.error('Fehler beim Laden der verfügbaren Jahre:', error);
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
      }));
      
      setStartlisten(startlistenData.sort((a, b) => new Date(b.erstellt?.toDate?.() || b.erstellt) - new Date(a.erstellt?.toDate?.() || a.erstellt)));
      
      if (saisonsRes.ok) {
        const saisonsData = await saisonsRes.json();
        setSaisons(saisonsData.data || []);
      }
      
      // Lade Meldungen direkt aus Firebase
      const { getDocs: getDocsFirebase, collection: collectionFirebase, query, orderBy } = await import('firebase/firestore');
      const { db: dbFirebase } = await import('@/lib/firebase/config');
      
      const shootersSnapshot = await getDocsFirebase(query(collectionFirebase(dbFirebase, 'shooters'), orderBy('lastName', 'asc')));
      const schuetzenMap = {};
      shootersSnapshot.docs.forEach(doc => {
        schuetzenMap[doc.id] = { id: doc.id, ...doc.data() };
      });
      
      // Lade Meldungen für die spezifische Saison
      const jahr = parseInt(selectedSaison);
      const collections = ['kk', 'kkp', 'ld'];
      let alleMeldungen = [];
      
      for (const typ of collections) {
        try {
          const collectionName = `km_meldungen_${jahr}_${typ}`;
          const meldungenSnapshot = await getDocsFirebase(collectionFirebase(dbFirebase, collectionName));
          const meldungen = meldungenSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          alleMeldungen.push(...meldungen);
        } catch (e) {
          console.warn(`Collection km_meldungen_${jahr}_${typ} nicht gefunden`);
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
      
      let disziplinenMap = {};
      let clubsMap = {};
      
      if (disziplinenRes.ok) {
        const disziplinenData = await disziplinenRes.json();
        (disziplinenData.data || []).forEach(d => {
          disziplinenMap[d.id] = {
            name: d.name,
            spoNummer: d.spoNummer || '1.41'
          };
        });
      }
      
      if (clubsRes.ok) {
        const clubsData = await clubsRes.json();
        (clubsData.data || []).forEach(c => {
          clubsMap[c.id] = c.name;
        });
      }
      
      const meldungenData = saisonMeldungen
        .filter(data => data.schuetzeId && data.disziplinId)
        .map(data => {
          const schuetze = schuetzenMap[data.schuetzeId];
          if (!schuetze) return null;
          
          const vereinId = schuetze.kmClubId || schuetze.rwkClubId || schuetze.clubId;
          
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
        .filter(Boolean);
      
      setMeldungen(meldungenData);
      
    } catch (error) {
      console.error('Fehler beim Laden:', error);
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
      
      const aenderungenData = aenderungenSnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate() || new Date()
        }))
        .filter(a => a.saison === selectedSaison);
      
      setAenderungswuensche(aenderungenData);
    } catch (error) {
      console.error('Fehler beim Laden der Änderungswünsche:', error);
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
      console.error('Fehler beim Hinzufügen:', error);
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
      console.error('Fehler beim Löschen:', error);
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
      console.error('Fehler beim Update:', error);
    }
  };

  const getSaisonName = (saisonId) => {
    const saison = saisons.find(s => s.id === saisonId);
    return saison?.name || saisonId;
  };

  const handleEdit = (startliste) => {
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
      
      await updateDoc(doc(correctDb, 'km_startlisten_v2', editingId), editData);
      setEditingId(null);
      loadData();
    } catch (error) {
      console.error('Fehler beim Speichern:', error);
    }
  };

  const handleDelete = async (id) => {
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
        console.error('Fehler beim Löschen:', error);
      }
    }
  };

  const updateStarter = (starterIndex, field, value) => {
    const updatedStartliste = [...editData.startliste];
    updatedStartliste[starterIndex] = {
      ...updatedStartliste[starterIndex],
      [field]: value
    };
    setEditData({
      ...editData,
      startliste: updatedStartliste
    });
  };

  const removeStarter = (starterIndex) => {
    const updatedStartliste = editData.startliste.filter((_, index) => index !== starterIndex);
    setEditData({
      ...editData,
      startliste: updatedStartliste
    });
  };

  const addShooterToStartliste = (meldung) => {
    const newStarter = {
      id: `added_${Date.now()}`,
      name: meldung.name,
      schuetzeName: meldung.name,
      verein: meldung.verein,
      disziplin: meldung.disziplin,
      altersklasse: meldung.altersklasse,
      anmerkung: meldung.anmerkung || '',
      stand: '1',
      startzeit: editData.konfiguration?.startzeit || '14:00',
      durchgang: 1
    };
    
    setEditData({
      ...editData,
      startliste: [...(editData.startliste || []), newStarter]
    });
    setShowAddShooter(false);
    setSearchTerm('');
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
                  <h3 className="text-xl font-bold text-gray-900">Startliste vom {new Date(startliste.erstellt?.toDate?.() || startliste.erstellt).toLocaleDateString('de-DE')}</h3>
                  <p className="text-gray-600">
                    {startliste.startliste?.length || 0} Starter • Saison: {getSaisonName(startliste.saison)}
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
                            const [schuetzenRes, mannschaftenRes, disziplinenRes, kmMeldungenRes] = await Promise.all([
                              fetch('/api/shooters'),
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
                            const nachStartzeit = gefilterteStartliste.reduce((acc, s) => {
                              const zeit = s.startzeit || startliste.konfiguration?.startzeit || '14:00';
                              if (!acc[zeit]) acc[zeit] = [];
                              acc[zeit].push(s);
                              return acc;
                            }, {});
                            
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
                              .forEach(([startzeit, starterGruppe], startzeitIndex) => {
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
                            
                            const veranstaltungsDatum = new Date(startliste.konfiguration?.datum || new Date()).toISOString().split('T')[0];
                            const fileName = `Startliste_KM_${veranstaltungsDatum}.pdf`;
                            doc.save(fileName);
                          } catch (error) {
                            console.error('PDF-Export Fehler:', error);
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
                              const standA = parseInt(a.stand || '0');
                              const standB = parseInt(b.stand || '0');
                              if (standA !== standB) return standA - standB;
                              return (a.startzeit || '').localeCompare(b.startzeit || '');
                            })
                            .map(s => {
                              const nameParts = (s.schuetzeName || s.name).split(' ');
                              const vorname = nameParts.slice(0, -1).join(' ');
                              const nachname = nameParts[nameParts.length - 1];
                              
                              return [
                                nachname,
                                vorname,
                                s.verein || '',
                                s.altersklasse || '',
                                s.disziplin || '',
                                s.stand || '',
                                s.startzeit || '',
                                s.durchgang || '1'
                              ].join(';');
                            })
                            .join('\n');
                          
                          const header = 'Name;Vorname;Verein;Altersklasse;Disziplin;Stand;Startzeit;Durchgang\n';
                          const fullCsv = header + csvContent;
                          
                          const blob = new Blob([fullCsv], { type: 'text/csv;charset=utf-8;' });
                          const link = document.createElement('a');
                          const url = URL.createObjectURL(blob);
                          link.setAttribute('href', url);
                          link.setAttribute('download', `startliste_david21_${startliste.konfiguration?.datum || 'export'}.csv`);
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
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
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
                        <label className="block text-sm font-medium mb-1">Durchgang (Min)</label>
                        <input
                          type="number"
                          value={editData.konfiguration?.durchgang || ''}
                          onChange={(e) => setEditData({
                            ...editData,
                            konfiguration: { ...editData.konfiguration, durchgang: e.target.value ? parseInt(e.target.value) : '' }
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
                            konfiguration: { ...editData.konfiguration, wechsel: e.target.value ? parseInt(e.target.value) : '' }
                          })}
                          className="w-full p-2 border rounded text-sm"
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Schützen hinzufügen/entfernen */}
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-medium text-green-900">Schützen verwalten</h4>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setShowAddShooter(!showAddShooter)}
                          className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                        >
                          + Schütze hinzufügen
                        </button>
                      </div>
                    </div>
                    
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
                  
                  {/* Startliste bearbeiten */}
                  <div className="space-y-2 max-h-96 overflow-y-auto bg-gray-50 rounded-lg p-3" id="startliste-container">
                    <div className="grid grid-cols-10 gap-2 p-2 bg-gray-200 dark:bg-gray-700 rounded font-medium text-sm dark:text-white">
                      <div>Name</div>
                      <div>Verein</div>
                      <div>Disziplin</div>
                      <div>Stand</div>
                      <div>Startzeit</div>
                      <div>Durchgang</div>
                      <div>Altersklasse</div>
                      <div className="text-center">LM</div>
                      <div>Anmerkung</div>
                      <div>Aktion</div>
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
                          onDrop={(e) => {
                            e.preventDefault();
                            e.currentTarget.style.height = '16px';
                            e.currentTarget.style.backgroundColor = '#e5e7eb';
                            e.currentTarget.style.border = '1px dashed #9ca3af';
                            e.currentTarget.innerHTML = '';
                            
                            try {
                              const dragData = JSON.parse(e.dataTransfer.getData('text/plain'));
                              
                              if (dragData.type === 'newShooter') {
                                // Neuen Schützen an dieser Position einfügen
                                const newStarter = {
                                  id: `added_${Date.now()}`,
                                  name: dragData.meldung.name,
                                  schuetzeName: dragData.meldung.name,
                                  verein: dragData.meldung.verein,
                                  disziplin: dragData.meldung.disziplin,
                                  altersklasse: dragData.meldung.altersklasse,
                                  anmerkung: dragData.meldung.anmerkung || '',
                                  stand: '1',
                                  startzeit: editData.konfiguration?.startzeit || '14:00',
                                  durchgang: 1
                                };
                                
                                const newStartliste = [...editData.startliste];
                                newStartliste.splice(index, 0, newStarter);
                                
                                setEditData({
                                  ...editData,
                                  startliste: newStartliste
                                });
                              } else {
                                // Bestehenden Starter verschieben
                                const draggedIndex = dragData.starterIndex;
                                
                                if (draggedIndex === index) return;
                                
                                const newStartliste = [...editData.startliste];
                                const [draggedItem] = newStartliste.splice(draggedIndex, 1);
                                newStartliste.splice(index, 0, draggedItem);
                                
                                // Recalculate positions for all starters
                                const updatedStartliste = newStartliste.map((s, i) => {
                                  const baseTime = new Date(`1970-01-01T${editData.konfiguration?.startzeit || '14:00'}:00`);
                                  const durchgangMin = editData.konfiguration?.durchgang || 50;
                                  const wechselMin = editData.konfiguration?.wechsel || 10;
                                  const durchgangNr = Math.floor(i / 10) + 1;
                                  const minutesOffset = (durchgangNr - 1) * (durchgangMin + wechselMin);
                                  const newStartzeit = new Date(baseTime.getTime() + minutesOffset * 60000).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
                                  
                                  return {
                                    ...s,
                                    stand: ((i % 10) + 1).toString(),
                                    startzeit: newStartzeit,
                                    durchgang: durchgangNr
                                  };
                                });
                                
                                setEditData({
                                  ...editData,
                                  startliste: updatedStartliste
                                });
                              }
                            } catch (error) {
                              console.error('Drop Zone Fehler:', error);
                            }
                          }}
                          className="h-4 transition-all duration-200 rounded bg-gray-200 border border-dashed border-gray-400 mb-2"
                          style={{ backgroundColor: '#e5e7eb', border: '1px dashed #9ca3af' }}
                        />
                        
                        <div 
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData('text/plain', JSON.stringify({
                              starterIndex: index,
                              starter: starter
                            }));
                            e.currentTarget.style.opacity = '0.5';
                          }}
                          onDrag={(e) => {
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
                            e.currentTarget.style.opacity = '1';
                          }}
                          className="grid grid-cols-10 gap-2 p-2 bg-white dark:bg-gray-800 rounded border dark:border-gray-600 items-center cursor-move hover:bg-gray-100 transition-colors"
                          title="🖱️ Ziehen & zwischen Cards ablegen"
                        >
                        <input
                          type="text"
                          value={starter.name || starter.schuetzeName || ''}
                          onChange={(e) => updateStarter(index, 'name', e.target.value)}
                          className="p-1 border rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                        <input
                          type="text"
                          value={starter.verein || ''}
                          onChange={(e) => updateStarter(index, 'verein', e.target.value)}
                          className="p-1 border rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                        <input
                          type="text"
                          value={starter.disziplin || ''}
                          onChange={(e) => updateStarter(index, 'disziplin', e.target.value)}
                          className="p-1 border rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                        <select
                          value={starter.stand}
                          onChange={(e) => {
                            const neuerStand = e.target.value;
                            
                            // Prüfe auf Konflikte
                            const konflikt = editData.startliste.some(s => 
                              s !== starter && s.startzeit === starter.startzeit && s.stand === neuerStand
                            );
                            
                            if (konflikt) {
                              const bestaetigung = confirm(
                                `⚠️ Stand ${neuerStand} ist um ${starter.startzeit} bereits belegt!\n\n` +
                                `✅ OK = Automatisch freien Stand finden\n` +
                                `❌ Abbrechen = Änderung rückgängig machen`
                              );
                              
                              if (bestaetigung) {
                                // Finde freien Stand
                                const staende = [1,2,3,4,5,6,7,8,9,101,102];
                                let freierStand = null;
                                for (const stand of staende) {
                                  const istFrei = !editData.startliste.some(s => 
                                    s !== starter && s.startzeit === starter.startzeit && s.stand === stand.toString()
                                  );
                                  if (istFrei) {
                                    freierStand = stand.toString();
                                    break;
                                  }
                                }
                                updateStarter(index, 'stand', freierStand || neuerStand);
                                if (freierStand && freierStand !== neuerStand) {
                                  setTimeout(() => alert(`✅ Auf Stand ${freierStand} verschoben!`), 100);
                                }
                              }
                            } else {
                              updateStarter(index, 'stand', neuerStand);
                            }
                          }}
                          className={`p-1 border rounded text-sm ${
                            editData.startliste.some(s => 
                              s !== starter && s.startzeit === starter.startzeit && s.stand === starter.stand
                            ) ? 'border-red-500 bg-red-50' : 'border-gray-300'
                          }`}
                        >
                          {[1,2,3,4,5,6,7,8,9,101,102].map(stand => {
                            const istBelegt = editData.startliste.some(s => 
                              s !== starter && s.startzeit === starter.startzeit && s.stand === stand.toString()
                            );
                            return (
                              <option key={stand} value={stand} disabled={istBelegt}>
                                Stand {stand} {istBelegt ? '(❌ belegt)' : '(✅ frei)'}
                              </option>
                            );
                          })}
                        </select>
                        <input
                          type="time"
                          value={starter.startzeit}
                          onChange={(e) => updateStarter(index, 'startzeit', e.target.value)}
                          className="p-1 border rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                        <input
                          type="number"
                          value={starter.durchgang || ''}
                          onChange={(e) => updateStarter(index, 'durchgang', e.target.value ? parseInt(e.target.value) : 1)}
                          className="p-1 border rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          min="1"
                        />
                        <input
                          type="text"
                          value={starter.altersklasse || ''}
                          onChange={(e) => updateStarter(index, 'altersklasse', e.target.value)}
                          className="p-1 border rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                        <div className="flex items-center justify-center">
                          <input
                            type="checkbox"
                            checked={starter.lmTeilnahme === true || meldungen.find(m => m.name === starter.name && m.disziplin === starter.disziplin)?.lmTeilnahme === true}
                            onChange={(e) => updateStarter(index, 'lmTeilnahme', e.target.checked)}
                            className="w-4 h-4 rounded"
                            title="Landesmeisterschaft Teilnahme"
                          />
                        </div>
                        <input
                          type="text"
                          value={starter.anmerkung || ''}
                          onChange={(e) => updateStarter(index, 'anmerkung', e.target.value)}
                          className="p-1 border rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                        <button
                          onClick={() => removeStarter(index)}
                          className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600"
                        >
                          ×
                        </button>
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
                            onDrop={(e) => {
                              e.preventDefault();
                              e.currentTarget.style.height = '16px';
                              e.currentTarget.style.backgroundColor = '#e5e7eb';
                              e.currentTarget.style.border = '1px dashed #9ca3af';
                              e.currentTarget.innerHTML = '';
                              
                              try {
                                const dragData = JSON.parse(e.dataTransfer.getData('text/plain'));
                                const draggedIndex = dragData.starterIndex;
                                
                                const newStartliste = [...editData.startliste];
                                const [draggedItem] = newStartliste.splice(draggedIndex, 1);
                                newStartliste.push(draggedItem);
                                
                                // Recalculate positions for all starters
                                const updatedStartliste = newStartliste.map((s, i) => {
                                  const baseTime = new Date(`1970-01-01T${editData.konfiguration?.startzeit || '14:00'}:00`);
                                  const durchgangMin = editData.konfiguration?.durchgang || 50;
                                  const wechselMin = editData.konfiguration?.wechsel || 10;
                                  const durchgangNr = Math.floor(i / 10) + 1;
                                  const minutesOffset = (durchgangNr - 1) * (durchgangMin + wechselMin);
                                  const newStartzeit = new Date(baseTime.getTime() + minutesOffset * 60000).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
                                  
                                  return {
                                    ...s,
                                    stand: ((i % 10) + 1).toString(),
                                    startzeit: newStartzeit,
                                    durchgang: durchgangNr
                                  };
                                });
                                
                                setEditData({
                                  ...editData,
                                  startliste: updatedStartliste
                                });
                              } catch (error) {
                                console.error('End Drop Zone Fehler:', error);
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
