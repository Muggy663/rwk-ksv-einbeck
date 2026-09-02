'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { getDocs, collection, query, orderBy, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { getShooterClubId } from '@/lib/utils/altersklassen';
import { logInfo, logWarn, logError, getErrorMessage } from '@/lib/utils/secure-logger';
import { authFetch } from '@/lib/auth/authFetch';

export function StartlistenToolV2Content() {
  const searchParams = useSearchParams();
  const configId = searchParams.get('id');

  const [saisons, setSaisons] = useState<Array<{ id: string; jahr?: number; name?: string; [key: string]: any }>>([]);
  const [selectedSaison, setSelectedSaison] = useState('');
  const [meldungen, setMeldungen] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDisziplinen, setSelectedDisziplinen] = useState<string[]>([]);
  const [staende, setStaende] = useState<number[]>([1,2,3,4,5,6,7,8,9]);
  const [startzeit, setStartzeit] = useState('14:00');
  const [durchgang, setDurchgang] = useState(50);
  const [wechsel, setWechsel] = useState(10);
  const [vereinsLimit, setVereinsLimit] = useState<number | null>(null);
  const [datum, setDatum] = useState('');
  const [austragungsort, setAustragungsort] = useState('');
  const [geminiLoading, setGeminiLoading] = useState(false);
  const [geminiResult, setGeminiResult] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadSaisons = async () => {
      try {
        const res = await fetch('/api/km/saisons');
        if (res.ok) {
          const data = await res.json();
          setSaisons(data.data || []);
        }
      } catch (error) {
        logError('Fehler beim Laden der Saisons:', error);
      }
    };
    loadSaisons();
  }, []);

  useEffect(() => {
    if (!selectedSaison) return;

    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          Promise.resolve({ ok: true }),
          Promise.resolve({ ok: true })
        ]);
        
        const shootersSnapshot = await getDocs(
          query(collection(db, 'shooters'), orderBy('lastName', 'asc'))
        );
        const schuetzenMap: Record<string, any> = {};
        shootersSnapshot.docs.forEach(doc => {
          schuetzenMap[doc.id] = { id: doc.id, ...doc.data() };
        });
        
        // Lade Disziplinen über die gleiche API wie KM-Orga
        const disziplinenRes = await fetch('/api/km/disziplinen');
        const disziplinenMap: Record<string, any> = {};
        
        if (disziplinenRes.ok) {
          const disziplinenData = await disziplinenRes.json();
          const alleDisziplinen = disziplinenData.data || [];
          
          alleDisziplinen.forEach((disziplin: any) => {
            disziplinenMap[disziplin.id] = {
              name: disziplin.name,
              spoNummer: disziplin.spoNummer || '1.41'
            };
          });
          
          logInfo('DEBUG: Disziplinen über API geladen:', { data: Object.keys(disziplinenMap).length });
        }
        logInfo('DEBUG: Disziplinen aus Firebase:', { data: Object.keys(disziplinenMap).length });
        logInfo('DEBUG: Erste 5 Disziplin-IDs:', { data: Object.keys(disziplinenMap).slice(0, 5) });
        logInfo('DEBUG: Beispiel Disziplin:', { data: Object.values(disziplinenMap)[0] });
        
        // Lade Vereine direkt aus Firebase
        const clubsSnapshot = await getDocs(collection(db, 'clubs'));
        const vereineMap: Record<string, string> = {};
        clubsSnapshot.docs.forEach(doc => {
          const data = doc.data();
          vereineMap[doc.id] = data.name;
        });
        logInfo('DEBUG: Vereine aus Firebase:', { data: Object.keys(vereineMap).length });
        
        // Lade Meldungen über die gleiche API wie KM-Orga
        const meldungenRes = await authFetch(`/api/km/meldungen?saison=${selectedSaison}`);
        let saisonMeldungen: any[] = [];
        
        if (meldungenRes.ok) {
          const meldungenData = await meldungenRes.json();
          saisonMeldungen = meldungenData.data || [];
          logInfo('DEBUG: Meldungen über API geladen:', { data: saisonMeldungen.length });
        } else {
          logError('DEBUG: Meldungen API Fehler:', meldungenRes.status);
        }
        
        const meldungenData = saisonMeldungen
          .filter(data => {
            return data.schuetzeId && data.disziplinId;
          })
          .map(data => {
            const schuetze = schuetzenMap[data.schuetzeId];
            const disziplinName = disziplinenMap[data.disziplinId]?.name;
            
            if (!schuetze || !disziplinName) return null;
            
            // Berechne Altersklasse wie in KM-Orga
            const berechneAltersklasse = (schuetze: any, disziplin: any, selectedSaison: any) => {
              if (!schuetze?.birthYear) return 'Unbekannt';
              
              const currentSaison = saisons.find(s => s.id === selectedSaison);
              const age = (currentSaison?.jahr || 2026) - schuetze.birthYear;
              const isAuflage = disziplin?.name?.toLowerCase().includes('auflage');
              const isMale = schuetze.gender === 'male';
              
              if (age <= 14) return 'Schüler';
              if (age <= 16) return 'Jugend';
              if (age <= 18) return `Junioren II ${isMale ? 'm' : 'w'}`;
              if (age <= 20) return `Junioren I ${isMale ? 'm' : 'w'}`;
              
              if (isAuflage) {
                if (age <= 40) return `${isMale ? 'Herren' : 'Damen'} I`;
                if (age <= 50) return isMale ? 'Senioren 0 m' : 'Seniorinnen 0';
                if (age <= 60) return isMale ? 'Senioren I m' : 'Seniorinnen I';
                if (age <= 65) return isMale ? 'Senioren II m' : 'Seniorinnen II';
                if (age <= 70) return isMale ? 'Senioren III m' : 'Seniorinnen III';
                if (age <= 75) return isMale ? 'Senioren IV m' : 'Seniorinnen IV';
                if (age <= 80) return isMale ? 'Senioren V m' : 'Seniorinnen V';
                return isMale ? 'Senioren VI m' : 'Seniorinnen VI';
              } else {
                if (age <= 40) return `${isMale ? 'Herren' : 'Damen'} I`;
                if (age <= 50) return `${isMale ? 'Herren' : 'Damen'} II`;
                if (age <= 60) return `${isMale ? 'Herren' : 'Damen'} III`;
                if (age <= 70) return `${isMale ? 'Herren' : 'Damen'} IV`;
                return `${isMale ? 'Herren' : 'Damen'} V`;
              }
            };
            
            const disziplinData = disziplinenMap[data.disziplinId];
            const berechnetAltersklasse = berechneAltersklasse(schuetze, disziplinData, selectedSaison);
            
            return {
              id: data.id,
              name: schuetze?.name || `${schuetze?.firstName || ''} ${schuetze?.lastName || ''}`.trim() || 'Unbekannt',
              verein: vereineMap[getShooterClubId(schuetze) || ''] || 'Unbekannt',
              disziplin: disziplinName,
              altersklasse: berechnetAltersklasse,
              anmerkung: data.anmerkung || '',
              spoNummer: disziplinData?.spoNummer || '1.41',
              disziplinId: data.disziplinId,
              schuetzeId: data.schuetzeId,
              lmTeilnahme: data.lmTeilnahme || false,
              vmErgebnis: data.vmErgebnis?.ringe || null,
              birthYear: schuetze?.birthYear,
              gender: schuetze?.gender
            };
          })
          .filter(Boolean);
        
        logInfo('Verarbeitete Meldungen:', { data: meldungenData.length });
        
        setMeldungen(meldungenData);
        setLoading(false);

      } catch (error) {
        logError('Fehler beim Laden der Daten:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [selectedSaison]);

  const verarbeiteMeldungen = () => {
    let verarbeitet = meldungen;

    if (selectedDisziplinen.length > 0) {
      verarbeitet = verarbeitet.filter(m => selectedDisziplinen.includes(m.disziplin));
    }

    return { verarbeitet };
  };

  const getAlleDisziplinen = (): Record<string, typeof meldungen> => {
    const nachDisziplin: Record<string, typeof meldungen> = {};
    meldungen.forEach(m => {
      const disziplinName = m.disziplin || '';
      if (!nachDisziplin[disziplinName]) {
        nachDisziplin[disziplinName] = [];
      }
      nachDisziplin[disziplinName].push(m);
    });
    return nachDisziplin;
  };

  const generiereGemini = async () => {
    if (meldungen.length === 0) {
      logInfo('Keine Meldungen zum Generieren vorhanden');
      return;
    }
    
    setGeminiLoading(true);
    try {
      const { verarbeitet: gefilterteMeldungen } = verarbeiteMeldungen();
      
      const geminiMeldungen = gefilterteMeldungen.map(m => ({
        schuetzeName: m.name,
        verein: m.verein,
        disziplin: m.disziplin,
        wettkampfklasse: m.altersklasse,
        anmerkung: m.anmerkung || '',
        gewehrSharing: m.anmerkung?.toLowerCase().includes('gewehr') || false
      }));
      
      const response = await fetch('/api/gemini/startlisten', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meldungen: geminiMeldungen,
          config: {
            verfuegbareStaende: staende.map(s => s.toString()),
            startUhrzeit: startzeit,
            durchgangsDauer: durchgang,
            wechselzeit: wechsel,
            vereinsLimit: vereinsLimit
          },
          aktion: 'generieren'
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setGeminiResult(result.data);
        if (result.data.startliste) {
          const mappedStartliste = result.data.startliste.map((starter: any, index: number) => {
            const originalMeldung = gefilterteMeldungen[index];
            
            return {
              ...starter,
              schuetzeName: originalMeldung?.name || starter.schuetzeName,
              name: originalMeldung?.name || starter.schuetzeName,
              verein: originalMeldung?.verein || starter.verein,
              disziplin: originalMeldung?.disziplin || starter.disziplin,
              altersklasse: originalMeldung?.altersklasse || starter.wettkampfklasse,
              anmerkung: originalMeldung?.anmerkung || '',
              id: `gemini_v2_${Date.now()}_${index}`
            };
          });
          
          const startlisteData = {
            configId: configId || `auto_${Date.now()}`,
            saison: selectedSaison || null,
            startliste: mappedStartliste,
            konfiguration: {
              staende: staende || [],
              startzeit: startzeit || '14:00',
              durchgang: durchgang || 50,
              wechsel: wechsel || 10,
              austragungsort: austragungsort || '',
              datum: datum || '',
              selectedDisziplinen: selectedDisziplinen || []
            },
            erstellt: new Date(),
            version: '2.0'
          };
          
          const docRef = await addDoc(collection(db, 'km_startlisten_v2'), startlisteData);
          logInfo('✅ Gemini Startliste V2 gespeichert:', { data: docRef.id });
        }
      } else {
        if (result.error?.includes('quota') || result.error?.includes('429')) {
          alert('⚠️ Google Gemini API Limit erreicht (20 Anfragen/Tag)\n\nBitte warte bis morgen oder verwende einen anderen API Key.');
        } else {
          logError('Gemini Fehler:', result.error);
        }
      }
    } catch (error) {
      logError('Fehler:', getErrorMessage(error));
    } finally {
      setGeminiLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            🎯 Startlisten Tool 2.0
            <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">
              Neu & Verbessert
            </span>
          </h1>
          <button
            onClick={() => window.location.href = '/km-orga'}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded font-medium flex items-center gap-2"
          >
            ← Zurück
          </button>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            🎯 Saison auswählen (Pflichtfeld)
          </label>
          <select
            value={selectedSaison}
            onChange={(e) => setSelectedSaison(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">-- Saison wählen --</option>
            {saisons.map(saison => (
              <option key={saison.id} value={saison.id}>
                {saison.name}
              </option>
            ))}
          </select>
        </div>

        {loading && selectedSaison && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Lade Daten...</p>
          </div>
        )}

        {!loading && selectedSaison && (
          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-3">② Konfiguration</h3>
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Datum</label>
                  <input
                    type="date"
                    value={datum}
                    onChange={(e) => setDatum(e.target.value)}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Austragungsort</label>
                  <input
                    type="text"
                    value={austragungsort}
                    onChange={(e) => setAustragungsort(e.target.value)}
                    placeholder="z.B. Schützenhaus Einbeck"
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stände ({staende.length})</label>
                  <div className="flex flex-wrap gap-1">
                    {[1,2,3,4,5,6,7,8,9,101,102].map(stand => (
                      <label key={stand} className="flex items-center gap-1 text-xs">
                        <input
                          type="checkbox"
                          checked={staende.includes(stand)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setStaende([...staende, stand].sort((a,b) => a-b));
                            } else {
                              setStaende(staende.filter(s => s !== stand));
                            }
                          }}
                          className="w-3 h-3"
                        />
                        {stand}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start</label>
                  <input
                    type="time"
                    value={startzeit}
                    onChange={(e) => setStartzeit(e.target.value)}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Durchgang (Min)</label>
                  <input
                    type="number"
                    value={durchgang}
                    onChange={(e) => setDurchgang(Number(e.target.value))}
                    className="w-full p-2 border rounded"
                    min="10"
                    max="120"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Wechsel (Min)</label>
                  <input
                    type="number"
                    value={wechsel}
                    onChange={(e) => setWechsel(Number(e.target.value))}
                    className="w-full p-2 border rounded"
                    min="5"
                    max="30"
                  />
                </div>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-800 dark:text-blue-100 mb-3">③ Meldungen ({verarbeiteMeldungen().verarbeitet.length})</h3>
                <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Disziplinen Filter:</label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedDisziplinen([])}
                    className="text-xs bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded"
                  >
                    Alle abwählen
                  </button>
                  <button
                    onClick={() => {
                      const alleDisziplinen = Object.keys(getAlleDisziplinen());
                      setSelectedDisziplinen(alleDisziplinen);
                    }}
                    className="text-xs bg-blue-200 hover:bg-blue-300 px-2 py-1 rounded"
                  >
                    Alle auswählen
                  </button>
                  <button
                    onClick={() => {
                      const lmDisziplinen = Object.entries(getAlleDisziplinen())
                        .filter(([_disziplin, meldungenListe]) => 
                          meldungenListe.some(m => m.lmTeilnahme === true)
                        )
                        .map(([disziplin]) => disziplin);
                      setSelectedDisziplinen(lmDisziplinen);
                    }}
                    className="text-xs bg-green-200 hover:bg-green-300 px-2 py-1 rounded"
                  >
                    Nur LM-Teilnehmer
                  </button>
                  {Object.entries(getAlleDisziplinen()).map(([disziplin, meldungenListe]) => {
                    const lmAnzahl = meldungenListe.filter(m => m.lmTeilnahme === true).length;
                    return (
                      <label key={disziplin} className="flex items-center gap-2 bg-white dark:bg-gray-800 p-2 rounded border cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                        <input
                          type="checkbox"
                          checked={selectedDisziplinen.includes(disziplin)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedDisziplinen(prev => [...prev, disziplin]);
                            } else {
                              setSelectedDisziplinen(prev => prev.filter(d => d !== disziplin));
                            }
                          }}
                          className="rounded"
                        />
                        <span className="text-sm dark:text-white">{disziplin}</span>
                        <span className="text-xs bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-100 px-1 rounded">{meldungenListe.length}</span>
                        {lmAnzahl > 0 && (
                          <span className="text-xs bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-100 px-1 rounded">LM: {lmAnzahl}</span>
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded border space-y-3">
              <h4 className="font-medium text-blue-900 dark:text-blue-100">🤖 KI Startlisten-Generator</h4>
              <p className="text-sm text-blue-700 dark:text-blue-200">
                KI-basierte Startlisten-Optimierung mit Vereins-Limits & Sportgeräte-Regeln
              </p>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-sm text-blue-700 dark:text-blue-200">
                    Max. Starter pro Verein pro Durchgang:
                  </label>
                  <input
                    type="number"
                    value={vereinsLimit || ''}
                    onChange={(e) => setVereinsLimit(e.target.value ? parseInt(e.target.value) : null)}
                    placeholder="Kein Limit"
                    className="w-24 h-8 p-2 border rounded dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                    min="1"
                    max="10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white px-4 py-2 rounded font-medium disabled:opacity-50"
                  onClick={generiereGemini}
                  disabled={geminiLoading}
                >
                  {geminiLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Generiere...
                    </div>
                  ) : (
                    '🎯 KM Startliste generieren'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {!selectedSaison && (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg">👆 Bitte wähle eine Saison aus, um zu beginnen</p>
          </div>
        )}
        
        {geminiResult && geminiResult.startliste && geminiResult.startliste.length > 0 && (
          <div className="mt-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-3">
                🎯 Generierte Startliste
                <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">
                  {geminiResult.startliste.length} Starter
                </span>
              </h2>
              
              {/* Konflikterkennung */}
              {(() => {
                const konflikte: Array<{zeit: string; stand: string; starter: string[]; indices: number[]; alternativen: string[]}> = [];
                const zeitStandMap: Record<string, Array<{schuetzeName?: string; name?: string; index: number; stand?: string; startzeit?: string}>> = {};
                const belegteZeiten = new Set();
                
                // Sammle alle belegten Zeit/Stand Kombinationen
                geminiResult.startliste.forEach((starter: any, index: number) => {
                  const key = `${starter.startzeit}_${starter.stand}`;
                  belegteZeiten.add(key);
                  if (!zeitStandMap[key]) zeitStandMap[key] = [];
                  zeitStandMap[key].push({ ...starter, index });
                });
                
                // Finde freie Alternativen
                const findeFreieAlternativen = (konfliktZeit: any, konfliktStand: any) => {
                  const alternativen = [];
                  const startZeit = new Date(`2000-01-01T${startzeit}:00`);
                  const durchgangMin = durchgang || 50;
                  const wechselMin = wechsel || 10;
                  const slotDauer = durchgangMin + wechselMin; // z.B. 60min
                  
                  // Prüfe andere Stände zur gleichen Zeit
                  staende.forEach(stand => {
                    if (stand !== parseInt(konfliktStand)) {
                      const key = `${konfliktZeit}_${stand}`;
                      if (!belegteZeiten.has(key)) {
                        alternativen.push(`Stand ${stand} um ${konfliktZeit}`);
                      }
                    }
                  });
                  
                  // Berechne gültige Zeitslots basierend auf Startzeit und Durchgangsdauer
                  for (let slot = -2; slot <= 6; slot++) { // Max 8 Slots prüfen
                    if (slot === 0) continue; // Aktuelle Zeit überspringen
                    
                    const slotZeit = new Date(startZeit.getTime() + slot * slotDauer * 60000);
                    const slotZeitStr = slotZeit.toTimeString().slice(0, 5);
                    const key = `${slotZeitStr}_${konfliktStand}`;
                    
                    if (!belegteZeiten.has(key) && slotZeitStr >= '08:00' && slotZeitStr <= '18:00') {
                      const zeitDiff = Math.abs(slot * slotDauer);
                      const richtung = slot > 0 ? 'später' : 'früher';
                      alternativen.push(`${slotZeitStr} an Stand ${konfliktStand} (${zeitDiff}min ${richtung})`);
                    }
                  }
                  
                  return alternativen.slice(0, 3); // Max 3 Vorschläge
                };
                
                Object.entries(zeitStandMap).forEach(([key, starter]) => {
                  if (starter.length > 1) {
                    const [zeit, stand] = key.split('_');
                    const alternativen = findeFreieAlternativen(zeit, stand);
                    
                    konflikte.push({
                      zeit,
                      stand,
                      starter: starter.map(s => s.schuetzeName || s.name).filter((v): v is string => Boolean(v)),
                      indices: starter.map(s => s.index),
                      alternativen
                    });
                  }
                });
                
                return konflikte.length > 0 && (
                  <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <h3 className="font-bold text-red-800 mb-2">⚠️ Konflikte erkannt ({konflikte.length})</h3>
                    {konflikte.map((konflikt, i) => (
                      <div key={i} className="mb-3 p-3 bg-white rounded border border-red-300">
                        <p className="text-sm text-red-700 font-medium mb-2">
                          <strong>Stand {konflikt.stand} um {konflikt.zeit}:</strong> {konflikt.starter.join(', ')}
                        </p>
                        <div className="text-xs text-green-700">
                          <p className="font-medium mb-1">💡 Freie Alternativen:</p>
                          {konflikt.alternativen.length > 0 ? (
                            <ul className="list-disc list-inside space-y-1">
                              {konflikt.alternativen.map((alt, j) => (
                                <li key={j} className="text-green-600">{alt}</li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-orange-600">Keine freien Alternativen in der Nähe gefunden</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
              
              <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Schütze manuell hinzufügen ({meldungen
                      .filter(m => 
                        !geminiResult?.startliste?.some((s: any) => (s.name || s.schuetzeName) === m.name && s.disziplin === m.disziplin) &&
                        (searchTerm === '' || 
                         m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         m.verein.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         m.disziplin.toLowerCase().includes(searchTerm.toLowerCase()))
                      ).length})</p>
                    <p className="text-xs text-gray-700 dark:text-gray-300">Für Schützen die am anderen Termin schießen sollen (z.B. Freihand-Schütze am Auflage-Tag)</p>
                  </div>
                </div>
                <div className="mb-3">
                  <input
                    type="text"
                    placeholder="Schützen-Name suchen..."
                    className="w-full p-2 border rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="max-h-32 overflow-y-auto">
                  <div className="grid grid-cols-2 gap-2">
                    {meldungen
                      .filter(m => 
                        !geminiResult?.startliste?.some((s: any) => (s.name || s.schuetzeName) === m.name && s.disziplin === m.disziplin) &&
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
                            // Finde den letzten Durchgang und nächsten freien Stand
                            const aktuelleStartliste = geminiResult?.startliste || [];
                            const maxDurchgang = Math.max(...aktuelleStartliste.map((s: any) => s.durchgang || 1), 0);
                            
                            // Sammle alle belegten Zeit/Stand Kombinationen im letzten Durchgang
                            const belegteSlots = new Set();
                            aktuelleStartliste
                              .filter((s: any) => s.durchgang === maxDurchgang)
                              .forEach((s: any) => belegteSlots.add(`${s.startzeit}_${s.stand}`));
                            
                            // Finde nächsten freien Stand zur Startzeit
                            let freierStand = null;
                            for (const stand of staende) {
                              const key = `${startzeit}_${stand}`;
                              if (!belegteSlots.has(key)) {
                                freierStand = stand;
                                break;
                              }
                            }
                            
                            const neuerStarter = {
                              ...schuetze,
                              schuetzeName: schuetze.name,
                              id: `manual_${Date.now()}`,
                              stand: freierStand || staende[0] || '1',
                              startzeit: startzeit || '14:00',
                              durchgang: freierStand ? maxDurchgang : maxDurchgang + 1,
                              hinweise: 'Terminwechsel - schießt am anderen Tag'
                            };
                            const neueStartliste = [...aktuelleStartliste, neuerStarter];
                            setGeminiResult({
                              ...geminiResult,
                              startliste: neueStartliste
                            });
                          }}
                          className="text-left p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 text-xs transition-colors"
                        >
                          <div className="font-medium dark:text-white">{schuetze.name}</div>
                          <div className="text-gray-600 dark:text-gray-300">{schuetze.disziplin}</div>
                          <div className="text-gray-500 dark:text-gray-400">{schuetze.verein}</div>
                        </button>
                      ))}
                  </div>
                </div>
              </div>

              {/* Drag & Drop Hinweis */}
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 text-blue-800">
                  <span className="text-lg">🖱️</span>
                  <span className="font-medium">Drag & Drop aktiviert!</span>
                </div>
                <p className="text-sm text-blue-700 mt-1">
                  Ziehe die Starter-Cards mit der Maus, um sie zu verschieben. Stand, Uhrzeit und Durchgang werden automatisch angepasst.
                </p>
              </div>
              
              <div className="overflow-x-auto">
                <div className="space-y-1 max-h-[600px] overflow-y-auto">
                  {geminiResult.startliste
                    .filter((starter: any) => starter.name && starter.name !== 'EMPTY' && starter.name !== 'Leerer Stand')
                    .sort((a: any, b: any) => {
                      if (a.durchgang !== b.durchgang) return (a.durchgang || 1) - (b.durchgang || 1);
                      const standA = parseInt(a.stand || '0');
                      const standB = parseInt(b.stand || '0');
                      if (standA !== standB) return standA - standB;
                      return (a.startzeit || '').localeCompare(b.startzeit || '');
                    })
                    .map((starter: any, index: number, sortedArray: any) => {
                      const echteMeldung = meldungen.find(m => 
                        m.name === (starter.schuetzeName || starter.name) && 
                        m.disziplin === starter.disziplin
                      );
                      
                      const hatKonflikt = geminiResult.startliste.some((other: any, otherIndex: number) => 
                        otherIndex !== index && 
                        other.startzeit === starter.startzeit && 
                        other.stand === starter.stand
                      );
                      
                      return (
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
                                const draggedIndex = dragData.starterIndex;
                                
                                if (draggedIndex === index) return;
                                
                                const newStartliste = [...geminiResult.startliste];
                                const [draggedItem] = newStartliste.splice(draggedIndex, 1);
                                newStartliste.splice(index, 0, draggedItem);
                                
                                const updatedStartliste = newStartliste.map((s, newIndex) => {
                                  const durchgangNr = Math.floor(newIndex / staende.length) + 1;
                                  const standIndex = newIndex % staende.length;
                                  const neuerStand = staende[standIndex]?.toString() || '1';
                                  
                                  const [startStunden, startMinuten] = startzeit.split(':').map(Number);
                                  const durchgangIntervall = (durchgang || 50) + (wechsel || 10);
                                  const totalMinuten = startStunden * 60 + startMinuten + ((durchgangNr - 1) * durchgangIntervall);
                                  const neueStunden = Math.floor(totalMinuten / 60);
                                  const neueMinutenWert = totalMinuten % 60;
                                  const neueStartzeit = `${neueStunden.toString().padStart(2, '0')}:${neueMinutenWert.toString().padStart(2, '0')}`;
                                  
                                  return {
                                    ...s,
                                    stand: neuerStand,
                                    startzeit: neueStartzeit,
                                    durchgang: durchgangNr
                                  };
                                });
                                
                                setGeminiResult({...geminiResult, startliste: updatedStartliste});
                              } catch (error) {
                                logError('Drop Zone Fehler:', error);
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
                            onDragEnd={(e) => {
                              e.currentTarget.style.opacity = '1';
                            }}
                            className={`grid grid-cols-12 gap-2 p-3 border border-gray-200 rounded-lg text-sm items-center group hover:bg-gray-100 transition-colors cursor-move ${
                              hatKonflikt ? 'bg-red-100 border-red-300' : 'bg-gray-50'
                            }`}
                            title="🖱️ Ziehen & zwischen Cards ablegen"
                          >
                            <div className="col-span-3">
                            <div className="font-medium">{starter.schuetzeName || starter.name}</div>
                            <div className="text-xs text-muted-foreground">{starter.verein}</div>
                            {echteMeldung?.altersklasse && (
                              <span className="text-xs bg-blue-100 text-blue-800 px-1 rounded mt-1 inline-block">
                                {echteMeldung.altersklasse}
                              </span>
                            )}
                            {(starter.lmTeilnahme === true || echteMeldung?.lmTeilnahme === true) && (
                              <span className="text-xs bg-green-100 text-green-800 px-1 rounded mt-1 inline-block ml-1">
                                LM
                              </span>
                            )}
                            {starter.hinweise && (
                              <div className="text-xs text-orange-600 font-medium mt-1">
                                {starter.hinweise}
                              </div>
                            )}
                            {hatKonflikt && (
                              <div className="text-xs text-red-600 font-bold mt-1 flex items-center gap-1">
                                ⚠️ KONFLIKT: Stand bereits belegt!
                              </div>
                            )}
                          </div>
                          <div className="col-span-2">
                            <span className="text-xs bg-blue-100 text-blue-800 px-1 rounded">{starter.disziplin}</span>
                          </div>
                          <div className="col-span-2 relative">
                            <select
                              value={starter.stand}
                              onChange={(e) => {
                                const neuerStand = e.target.value;
                                const neueStartzeit = starter.startzeit;
                                
                                // Prüfe sofort auf Konflikte
                                const konflikt = geminiResult.startliste.some((s: any) => 
                                  s !== starter && s.startzeit === neueStartzeit && s.stand === neuerStand
                                );
                                
                                if (konflikt) {
                                  // Zeige Warnung und frage nach Lösung
                                  const bestaetigung = confirm(
                                    `⚠️ Stand ${neuerStand} ist um ${neueStartzeit} bereits belegt!\n\n` +
                                    `❓ Möchtest du:\n` +
                                    `✅ OK = Automatisch freien Stand finden\n` +
                                    `❌ Abbrechen = Änderung rückgängig machen`
                                  );
                                  
                                  if (bestaetigung) {
                                    // Finde automatisch freien Stand
                                    let freierStand = null;
                                    for (const stand of staende) {
                                      const istFrei = !geminiResult.startliste.some((s: any) => 
                                        s !== starter && s.startzeit === neueStartzeit && s.stand === stand.toString()
                                      );
                                      if (istFrei) {
                                        freierStand = stand.toString();
                                        break;
                                      }
                                    }
                                    
                                    const finalerStand = freierStand || neuerStand;
                                    const neuerDurchgang = Math.floor((parseInt(finalerStand) - 1) / staende.length) + 1;
                                    
                                    const updatedStartliste = geminiResult.startliste.map((s: any) => 
                                      s === starter ? {...s, stand: finalerStand, durchgang: neuerDurchgang} : s
                                    );
                                    setGeminiResult({...geminiResult, startliste: updatedStartliste});
                                    
                                    if (freierStand && freierStand !== neuerStand) {
                                      setTimeout(() => {
                                        alert(`✅ Automatisch auf Stand ${freierStand} verschoben!`);
                                      }, 100);
                                    }
                                  }
                                  return; // Stoppe hier bei Konflikt
                                }
                                
                                // Kein Konflikt - normale Verarbeitung
                                const neuerDurchgang = Math.floor((parseInt(neuerStand) - 1) / staende.length) + 1;
                                const updatedStartliste = geminiResult.startliste.map((s: any) => 
                                  s === starter ? {...s, stand: neuerStand, durchgang: neuerDurchgang} : s
                                );
                                setGeminiResult({...geminiResult, startliste: updatedStartliste});
                              }}
                              className={`w-full p-1 border rounded text-xs ${
                                hatKonflikt ? 'border-red-500 bg-red-50' : 'border-gray-300'
                              }`}
                            >
                              {staende.map(stand => {
                                // Zeige ob Stand zur aktuellen Zeit belegt ist
                                const istBelegt = geminiResult.startliste.some((s: any) => 
                                  s !== starter && s.startzeit === starter.startzeit && s.stand === stand.toString()
                                );
                                return (
                                  <option key={stand} value={stand} disabled={istBelegt}>
                                    Stand {stand} {istBelegt ? '(❌ belegt)' : '(✅ frei)'}
                                  </option>
                                );
                              })}
                            </select>
                            {hatKonflikt && (
                              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                            )}
                          </div>
                          <div className="col-span-2">
                            <input
                              type="time"
                              value={starter.startzeit}
                              onChange={(e) => {
                                const neueStartzeit = e.target.value;
                                
                                // Berechne Durchgang basierend auf Zeitdifferenz zur Startzeit
                                const [startStunden, startMinuten] = startzeit.split(':').map(Number);
                                const [neueStunden, neueMinuten] = neueStartzeit.split(':').map(Number);
                                
                                const startTotalMinuten = startStunden * 60 + startMinuten;
                                const neueTotalMinuten = neueStunden * 60 + neueMinuten;
                                const zeitDifferenz = neueTotalMinuten - startTotalMinuten;
                                
                                // Durchgang basierend auf Durchgangsdauer + Wechselzeit
                                const durchgangIntervall = (durchgang || 50) + (wechsel || 10);
                                let neuerDurchgang = Math.max(1, Math.floor(zeitDifferenz / durchgangIntervall) + 1);
                                
                                // Prüfe Konflikte: Wenn Stand bereits zur neuen Zeit belegt
                                const konflikt = geminiResult.startliste.some((s: any) => 
                                  s !== starter && s.startzeit === neueStartzeit && s.stand === starter.stand
                                );
                                
                                if (konflikt) {
                                  // Finde nächsten freien Stand zur gleichen Zeit
                                  let freierStand = null;
                                  for (const stand of staende) {
                                    const istBelegt = geminiResult.startliste.some((s: any) => 
                                      s !== starter && s.startzeit === neueStartzeit && s.stand === stand.toString()
                                    );
                                    if (!istBelegt) {
                                      freierStand = stand.toString();
                                      break;
                                    }
                                  }
                                  
                                  const updatedStartliste = geminiResult.startliste.map((s: any) => 
                                    s === starter ? {
                                      ...s, 
                                      startzeit: neueStartzeit, 
                                      durchgang: neuerDurchgang,
                                      stand: freierStand || s.stand
                                    } : s
                                  );
                                  setGeminiResult({...geminiResult, startliste: updatedStartliste});
                                  
                                  // Zeige Benutzer-Feedback
                                  if (freierStand && freierStand !== starter.stand) {
                                    setTimeout(() => {
                                      alert(`ℹ️ Stand automatisch geändert: ${starter.stand} → ${freierStand} (Konflikt vermieden)`);
                                    }, 100);
                                  }
                                } else {
                                  const updatedStartliste = geminiResult.startliste.map((s: any) => 
                                    s === starter ? {...s, startzeit: neueStartzeit, durchgang: neuerDurchgang} : s
                                  );
                                  setGeminiResult({...geminiResult, startliste: updatedStartliste});
                                }
                              }}
                              className="w-full p-1 border rounded text-xs"
                            />
                          </div>
                          <div className="col-span-1 text-center">
                            <input
                              type="number"
                              value={starter.durchgang}
                              onChange={(e) => {
                                const updatedStartliste = geminiResult.startliste.map((s: any) => 
                                  s === starter ? {...s, durchgang: parseInt(e.target.value) || 1} : s
                                );
                                setGeminiResult({...geminiResult, startliste: updatedStartliste});
                              }}
                              className="w-full p-1 border rounded text-xs text-center"
                              min="1"
                            />
                          </div>
                          <div className="col-span-2">
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={echteMeldung?.anmerkung || ''}
                                onChange={(e) => {
                                  const updatedStartliste = geminiResult.startliste.map((s: any) => 
                                    s === starter ? {...s, anmerkung: e.target.value} : s
                                  );
                                  setGeminiResult({...geminiResult, startliste: updatedStartliste});
                                }}
                                placeholder="Bemerkung..."
                                className="flex-1 p-1 border rounded text-xs"
                              />
                              <input
                                type="checkbox"
                                checked={starter.lmTeilnahme === true || echteMeldung?.lmTeilnahme === true}
                                onChange={(e) => {
                                  const updatedStartliste = geminiResult.startliste.map((s: any) => 
                                    s === starter ? {...s, lmTeilnahme: e.target.checked} : s
                                  );
                                  setGeminiResult({...geminiResult, startliste: updatedStartliste});
                                }}
                                className="w-4 h-4 rounded"
                                title="LM-Teilnahme"
                              />
                              <span className="text-xs text-gray-600 ml-1">LM</span>
                            </div>
                          </div>
                          <div className="col-span-1 flex justify-center">
                            <button
                              onClick={() => {
                                if (confirm(`${starter.name || starter.schuetzeName} aus der Startliste entfernen?`)) {
                                  const updatedStartliste = geminiResult.startliste.filter((s: any) => s !== starter);
                                  setGeminiResult({...geminiResult, startliste: updatedStartliste});
                                }
                              }}
                              className="w-8 h-8 bg-red-500 text-white rounded-full text-sm hover:bg-red-600 flex items-center justify-center font-bold"
                              title="Starter entfernen"
                            >
                              ×
                            </button>
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
                              onDrop={(e) => {
                                e.preventDefault();
                                e.currentTarget.style.height = '16px';
                                e.currentTarget.style.backgroundColor = '#e5e7eb';
                                e.currentTarget.style.border = '1px dashed #9ca3af';
                                e.currentTarget.innerHTML = '';
                                
                                try {
                                  const dragData = JSON.parse(e.dataTransfer.getData('text/plain'));
                                  const draggedIndex = dragData.starterIndex;
                                  
                                  const newStartliste = [...geminiResult.startliste];
                                  const [draggedItem] = newStartliste.splice(draggedIndex, 1);
                                  newStartliste.push(draggedItem);
                                  
                                  const updatedStartliste = newStartliste.map((s, newIndex) => {
                                    const durchgangNr = Math.floor(newIndex / staende.length) + 1;
                                    const standIndex = newIndex % staende.length;
                                    const neuerStand = staende[standIndex]?.toString() || '1';
                                    
                                    const [startStunden, startMinuten] = startzeit.split(':').map(Number);
                                    const durchgangIntervall = (durchgang || 50) + (wechsel || 10);
                                    const totalMinuten = startStunden * 60 + startMinuten + ((durchgangNr - 1) * durchgangIntervall);
                                    const neueStunden = Math.floor(totalMinuten / 60);
                                    const neueMinutenWert = totalMinuten % 60;
                                    const neueStartzeit = `${neueStunden.toString().padStart(2, '0')}:${neueMinutenWert.toString().padStart(2, '0')}`;
                                    
                                    return {
                                      ...s,
                                      stand: neuerStand,
                                      startzeit: neueStartzeit,
                                      durchgang: durchgangNr
                                    };
                                  });
                                  
                                  setGeminiResult({...geminiResult, startliste: updatedStartliste});
                                } catch (error) {
                                  logError('End Drop Zone Fehler:', error);
                                }
                              }}
                              className="h-4 transition-all duration-200 rounded mt-2 bg-gray-200 border border-dashed border-gray-400"
                              style={{ backgroundColor: '#e5e7eb', border: '1px dashed #9ca3af' }}
                            />
                          )}
                        </React.Fragment>
                      );
                    })}
                </div>
              </div>
              
              <div className="mt-4 flex gap-2 flex-wrap">
                <button 
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                  onClick={() => {
                    // Auto-Sortierung: Optimiere alle Konflikte
                    const optimierteStartliste = [...geminiResult.startliste];
                    const staendeProDurchgang = staende.length;
                    
                    // Sortiere nach Zeit, dann nach Stand
                    optimierteStartliste.sort((a, b) => {
                      if (a.startzeit !== b.startzeit) return a.startzeit.localeCompare(b.startzeit);
                      return parseInt(a.stand || '0') - parseInt(b.stand || '0');
                    });
                    
                    // Weise Durchgänge neu zu
                    const zeitGruppen: Record<string, any> = {};
                    optimierteStartliste.forEach((starter: any) => {
                      if (!zeitGruppen[starter.startzeit]) zeitGruppen[starter.startzeit] = [];
                      zeitGruppen[starter.startzeit].push(starter);
                    });
                    
                    Object.values(zeitGruppen).forEach((gruppe: any[]) => {
                      gruppe.forEach((starter: any, index: number) => {
                        starter.durchgang = Math.floor(index / staendeProDurchgang) + 1;
                      });
                    });
                    
                    setGeminiResult({...geminiResult, startliste: optimierteStartliste});
                  }}
                >
                  🔧 Auto-Optimierung
                </button>
                
                <button 
                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                  onClick={() => {
                    // Gleichmäßige Verteilung auf alle Stände
                    const verteilteStartliste = [...geminiResult.startliste];
                    verteilteStartliste.forEach((starter, index) => {
                      const standIndex = index % staende.length;
                      starter.stand = staende[standIndex].toString();
                      starter.durchgang = Math.floor(index / staende.length) + 1;
                      
                      // Berechne Startzeit basierend auf Durchgang
                      const [startStunden, startMinuten] = startzeit.split(':').map(Number);
                      const durchgangIntervall = (durchgang || 50) + (wechsel || 10);
                      const totalMinuten = startStunden * 60 + startMinuten + ((starter.durchgang - 1) * durchgangIntervall);
                      const neueStunden = Math.floor(totalMinuten / 60);
                      const neueMinuten = totalMinuten % 60;
                      starter.startzeit = `${neueStunden.toString().padStart(2, '0')}:${neueMinuten.toString().padStart(2, '0')}`;
                    });
                    
                    setGeminiResult({...geminiResult, startliste: verteilteStartliste});
                  }}
                >
                  📊 Gleichmäßig verteilen
                </button>
                
                <button 
                  className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-sm"
                  onClick={() => {
                    // Drag & Drop Simulation: Verschiebe Starter automatisch bei Konflikten
                    const optimierteStartliste = [...geminiResult.startliste];
                    const konflikte: any[] = [];
                    
                    optimierteStartliste.forEach((starter: any, index: number) => {
                      // Finde Konflikte
                      const konfliktStarter = optimierteStartliste.find((other: any, otherIndex: number) => 
                        otherIndex !== index && 
                        other.startzeit === starter.startzeit && 
                        other.stand === starter.stand
                      );
                      
                      if (konfliktStarter) {
                        // Finde nächsten freien Slot
                        let neueZeit = starter.startzeit;
                        let neuerStand = starter.stand;
                        let gefunden = false;
                        
                        // Probiere andere Stände zur gleichen Zeit
                        for (const stand of staende) {
                          const istFrei = !optimierteStartliste.some((s: any) => 
                            s !== starter && s.startzeit === neueZeit && s.stand === stand.toString()
                          );
                          if (istFrei) {
                            neuerStand = stand.toString();
                            gefunden = true;
                            break;
                          }
                        }
                        
                        // Wenn kein Stand frei, probiere nächste Zeit
                        if (!gefunden) {
                          const [stunden, minuten] = starter.startzeit.split(':').map(Number);
                          const durchgangIntervall = (durchgang || 50) + (wechsel || 10);
                          const neueTotalMinuten = stunden * 60 + minuten + durchgangIntervall;
                          const neueStunden = Math.floor(neueTotalMinuten / 60);
                          const neueMinutenWert = neueTotalMinuten % 60;
                          neueZeit = `${neueStunden.toString().padStart(2, '0')}:${neueMinutenWert.toString().padStart(2, '0')}`;
                          neuerStand = staende[0].toString();
                        }
                        
                        starter.startzeit = neueZeit;
                        starter.stand = neuerStand;
                        starter.durchgang = Math.floor((parseInt(neuerStand) - 1) / staende.length) + 1;
                        
                        konflikte.push(`${starter.name || starter.schuetzeName}: ${neueZeit} Stand ${neuerStand}`);
                      }
                    });
                    
                    setGeminiResult({...geminiResult, startliste: optimierteStartliste});
                    
                    if (konflikte.length > 0) {
                      alert(`✅ ${konflikte.length} Starter automatisch verschoben:\n\n${konflikte.join('\n')}`);
                    }
                  }}
                >
                  🔄 Smart-Verschiebung
                </button>
                
                <button 
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded text-sm"
                  onClick={() => {
                    // Zeige Empfehlungen für bessere Verteilung
                    const empfehlungen: any[] = [];
                    const zeitGruppen: Record<string, any> = {};
                    
                    geminiResult.startliste.forEach((starter: any) => {
                      if (!zeitGruppen[starter.startzeit]) zeitGruppen[starter.startzeit] = [];
                      zeitGruppen[starter.startzeit].push(starter);
                    });
                    
                    Object.entries(zeitGruppen).forEach(([zeit, gruppe]: [string, any]) => {
                      if (gruppe.length > staende.length) {
                        empfehlungen.push(`⏰ ${zeit}: ${gruppe.length} Starter, aber nur ${staende.length} Stände verfügbar`);
                      }
                      
                      // Prüfe Stand-Verteilung
                      const standVerteilung: Record<string, any> = {};
                      gruppe.forEach((s: any) => {
                        standVerteilung[s.stand] = (standVerteilung[s.stand] || 0) + 1;
                      });
                      
                      Object.entries(standVerteilung).forEach(([stand, anzahl]: [string, any]) => {
                        if (anzahl > 1) {
                          empfehlungen.push(`🎯 Stand ${stand} um ${zeit}: ${anzahl} Starter (Konflikt!)`);
                        }
                      });
                    });
                    
                    if (empfehlungen.length > 0) {
                      alert(`💡 Verbesserungsvorschläge:\n\n${empfehlungen.join('\n')}\n\n➡️ Nutze 'Smart-Verschiebung' für automatische Lösung!`);
                    } else {
                      alert('🎉 Perfekte Verteilung! Keine Verbesserungen nötig.');
                    }
                  }}
                >
                  💡 Empfehlungen
                </button>
                <button 
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-medium"
                  onClick={async () => {
                    try {
                      const { default: jsPDF } = await import('jspdf');
                      const { default: autoTable } = await import('jspdf-autotable');
                      
                      // Lade Mannschaften und Disziplinen für E/M Erkennung und SPO-Nummern
                      const [schuetzenRes, mannschaftenRes, disziplinenRes] = await Promise.all([
                        authFetch('/api/shooters'),
                        fetch('/api/km/mannschaften'),
                        fetch('/api/km/disziplinen'),
                        authFetch('/api/km/meldungen')
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
                      const currentSaison = saisons.find(s => s.id === selectedSaison);
                      doc.text(`Kreisverbandsmeisterschaft ${currentSaison?.jahr || 2026}`, pageWidth / 2, 140, { align: 'center' });
                      
                      doc.setFontSize(18);
                      doc.text('Startlisten', pageWidth / 2, 160, { align: 'center' });
                      
                      // Disziplinen mit Bullet-Points
                      doc.setFontSize(16);
                      doc.setFont('helvetica', 'normal');
                      const disziplinText = selectedDisziplinen?.join(' • ') || 'Alle Disziplinen';
                      doc.text(disziplinText, pageWidth / 2, 190, { align: 'center' });
                      
                      // Verwende gefilterte Startliste
                      const gefilterteStartliste = geminiResult?.startliste || [];
                      
                      // Gruppiere nur nach Startzeiten
                      const nachStartzeit = gefilterteStartliste.reduce((acc: Record<string, any[]>, s: any) => {
                        const zeit = s.startzeit || startzeit || '14:00';
                        if (!acc[zeit]) acc[zeit] = [];
                        acc[zeit].push(s);
                        return acc;
                      }, {} as Record<string, any[]>);
                      
                      const datumFormatted = datum ? new Date(datum).toLocaleDateString('de-DE', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      }) : 'Datum nicht angegeben';
                      
                      let globalStartNummer = 1;
                      let isFirstStart = true;
                      let currentY = 35;
                      
                      (Object.entries(nachStartzeit) as [string, any[]][])
                        .sort(([zeitA], [zeitB]) => zeitA.localeCompare(zeitB)) // Sortiere Uhrzeiten korrekt
                        .forEach(([startzeit, starterGruppe]: [string, any[]], _startzeitIndex: number) => {
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
                          const austragungsortText = austragungsort || 'ESG Einbeck';
                          doc.text(`Start ${globalStartNummer} am: ${datumFormatted} um ${startzeit} Uhr im Schützenhaus ${austragungsortText}`, 20, currentY);
                          currentY += 7;
                          doc.text(`Schießzeit pro Durchgang = ${durchgang || 50} Minuten`, 20, currentY);
                          currentY += 10;
                          
                          globalStartNummer++;
                          const sortierteStarter = starterGruppe.sort((a, b) => {
                            const standA = parseInt(a.stand || '999');
                            const standB = parseInt(b.stand || '999');
                            if (standA !== standB) return standA - standB;
                            return (a.name || a.schuetzeName || '').localeCompare(b.name || b.schuetzeName || '');
                          });
                          
                          const tableData = sortierteStarter.map((s) => {
                            // Finde Schütze für echte Mitgliedsnummer
                            const schuetze = schuetzenMapPDF[s.name || s.schuetzeName];
                            let mitgliedsNr = '08-000-0000';
                            if (schuetze?.mitgliedsnummer) {
                              const mitgliedsNummerStr = schuetze.mitgliedsnummer.toString();
                              if (mitgliedsNummerStr.length >= 7) {
                                const teil1 = mitgliedsNummerStr.substring(1, 4).padStart(3, '0');
                                const teil2 = mitgliedsNummerStr.substring(4).padStart(3, '0');
                                mitgliedsNr = `08-${teil1}-${teil2}`;
                              }
                            }
                            
                            const nameParts = (s.name || s.schuetzeName || '').split(' ');
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
                            const originalMeldung = meldungen.find(m => m.name === (s.name || s.schuetzeName) && m.disziplin === s.disziplin);
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
                                else if (age <= 50) korrekteAltersklasse = isMale ? 'Senioren 0 m' : 'Seniorinnen 0';
                                else if (age <= 60) korrekteAltersklasse = isMale ? 'Senioren I m' : 'Seniorinnen I';
                                else if (age <= 65) korrekteAltersklasse = isMale ? 'Senioren II m' : 'Seniorinnen II';
                                else if (age <= 70) korrekteAltersklasse = isMale ? 'Senioren III m' : 'Seniorinnen III';
                                else if (age <= 75) korrekteAltersklasse = isMale ? 'Senioren IV m' : 'Seniorinnen IV';
                                else if (age <= 80) korrekteAltersklasse = isMale ? 'Senioren V m' : 'Seniorinnen V';
                                else korrekteAltersklasse = isMale ? 'Senioren VI m' : 'Seniorinnen VI';
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
                      
                      const veranstaltungsDatum = datum ? new Date(datum).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
                      const fileName = `Startliste_KM_${veranstaltungsDatum}.pdf`;
                      doc.save(fileName);
                    } catch (error) {
                      logError('PDF-Export Fehler:', error);
                    }
                  }}
                >
                  📝 PDF Drucken
                </button>
                <button 
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded font-medium"
                  onClick={async () => {
                    // Prüfe ob bereits eine Startliste für diese Konfiguration existiert
                    let existierendeStartlisteId = null;
                    
                    try {
                      const { getDocs, collection, query, where } = await import('firebase/firestore');
                      const { db } = await import('@/lib/firebase/config');
                      
                      // Suche nach existierender Startliste mit gleicher Konfiguration
                      const snapshot = await getDocs(
                        query(
                          collection(db, 'km_startlisten_v2'),
                          where('saison', '==', selectedSaison)
                        )
                      );
                      
                      // Finde die neueste Startliste für diese Saison
                      let neuesteStartliste: any = null;
                      snapshot.docs.forEach(doc => {
                        const data = doc.data();
                        if (!neuesteStartliste || 
                            (data.erstellt?.toDate?.() || data.erstellt) > (neuesteStartliste.erstellt?.toDate?.() || neuesteStartliste.erstellt)) {
                          neuesteStartliste = { id: doc.id, ...data };
                        }
                      });
                      
                      if (neuesteStartliste) {
                        existierendeStartlisteId = neuesteStartliste.id;
                      }
                    } catch (error) {
                      logInfo('Fehler beim Suchen existierender Startliste:', { data: error });
                    }
                    
                    const startlisteData = {
                      configId: configId || null,
                      saison: selectedSaison || null,
                      startliste: geminiResult.startliste.map((s: any) => {
                        const echteMeldung = meldungen.find(m => 
                          m.name === (s.schuetzeName || s.name) && m.disziplin === s.disziplin
                        );
                        return {
                          ...s,
                          name: s.schuetzeName || s.name,
                          altersklasse: echteMeldung?.altersklasse || 'Unbekannt',
                          anmerkung: echteMeldung?.anmerkung || '',
                          id: `gemini_${Date.now()}_${Math.random()}`
                        };
                      }),
                      konfiguration: { 
                        staende: staende || [], 
                        startzeit: startzeit || '14:00', 
                        durchgang: durchgang || 50, 
                        wechsel: wechsel || 10, 
                        austragungsort: austragungsort || '', 
                        datum: datum || '',
                        selectedDisziplinen: selectedDisziplinen || [] 
                      },
                      erstellt: new Date(),
                      version: '2.0'
                    };
                    
                    try {
                      if (existierendeStartlisteId) {
                        // Überschreibe existierende Startliste
                        const { updateDoc, doc } = await import('firebase/firestore');
                        const { db } = await import('@/lib/firebase/config');
                        
                        await updateDoc(doc(db, 'km_startlisten_v2', existierendeStartlisteId), {
                          ...startlisteData,
                          aktualisiert: new Date()
                        });
                        
                        alert(`✅ Startliste aktualisiert! (${geminiResult.startliste.length} Starter)`);
                      } else {
                        // Erstelle neue Startliste
                        const { addDoc, collection } = await import('firebase/firestore');
                        const { db } = await import('@/lib/firebase/config');
                        
                        await addDoc(collection(db, 'km_startlisten_v2'), startlisteData);
                        alert(`✅ Neue Startliste gespeichert! (${geminiResult.startliste.length} Starter)`);
                      }
                    } catch (error) {
                      logError('Fehler beim Speichern:', error);
                      alert('❌ Fehler beim Speichern!');
                    }
                  }}
                >
                  💾 Speichern/Aktualisieren
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}