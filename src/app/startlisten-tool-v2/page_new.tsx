'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { getDocs, collection, query, orderBy, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { getShooterClubId } from '@/lib/utils/altersklassen';
import { logInfo, logWarn, logError, logDebug , getErrorMessage} from '@/lib/utils/secure-logger';

export default function StartlistenToolV2() {
  const searchParams = useSearchParams();
  const configId = searchParams.get('id');

  const [saisons, setSaisons] = useState([]);
  const [selectedSaison, setSelectedSaison] = useState('');
  const [meldungen, setMeldungen] = useState([]);
  const [schuetzen, setSchuetzen] = useState({});
  const [disziplinen, setDisziplinen] = useState({});
  const [vereine, setVereine] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedDisziplinen, setSelectedDisziplinen] = useState([]);
  const [staende, setStaende] = useState([1,2,3,4,5,6,7,8,9]);
  const [startzeit, setStartzeit] = useState('14:00');
  const [durchgang, setDurchgang] = useState(50);
  const [wechsel, setWechsel] = useState(10);
  const [vereinsLimit, setVereinsLimit] = useState(null);
  const [austragungsort, setAustragungsort] = useState('');
  const [kmGenerating, setKmGenerating] = useState(false);
  const [geminiLoading, setGeminiLoading] = useState(false);
  const [geminiResult, setGeminiResult] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Lade Saisons
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

  // Lade Daten wenn Saison ausgewählt
  useEffect(() => {
    if (!selectedSaison) return;

    const loadData = async () => {
      setLoading(true);
      try {
        const [disziplinenRes, clubsRes] = await Promise.all([
          fetch('/api/km/disziplinen'),
          fetch('/api/clubs')
        ]);
        
        const shootersSnapshot = await getDocs(
          query(collection(db, 'shooters'), orderBy('lastName', 'asc'))
        );
        const schuetzenMap = {};
        shootersSnapshot.docs.forEach(doc => {
          schuetzenMap[doc.id] = { id: doc.id, ...doc.data() };
        });
        
        const disziplinenMap = {};
        if (disziplinenRes.ok) {
          const diszData = await disziplinenRes.json();
          diszData.data?.forEach(d => {
            disziplinenMap[d.id] = d.name;
          });
        }
        
        const vereineMap = {};
        if (clubsRes.ok) {
          const clubsData = await clubsRes.json();
          clubsData.data?.forEach(c => {
            vereineMap[c.id] = c.name;
          });
        }
        
        const meldungenSnapshot = await getDocs(collection(db, 'km_meldungen_2026_ld'));
        const allMeldungen = meldungenSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        const meldungenData = allMeldungen
          .filter(data => data.schuetzeId && data.disziplinId)
          .map(data => {
            const schuetze = schuetzenMap[data.schuetzeId];
            const disziplinName = disziplinenMap[data.disziplinId];
            
            if (!schuetze || !disziplinName) return null;
            
            return {
              id: data.id,
              name: schuetze?.name || 'Unbekannt',
              verein: vereineMap[getShooterClubId(schuetze)] || 'Unbekannt',
              disziplin: disziplinName,
              altersklasse: data.altersklasse || 'Unbekannt',
              anmerkung: data.anmerkung || '',
              spoNummer: disziplinenMap[data.disziplinId]?.spoNummer || '1.41'
            };
          })
          .filter(Boolean);
        
        setMeldungen(meldungenData);
        setDisziplinen(disziplinenMap);
        setVereine(vereineMap);
        setSchuetzen(schuetzenMap);
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

    const nachDisziplin: Record<string, typeof meldungen> = {};
    verarbeitet.forEach(m => {
      const disziplinName = m.disziplin;
      if (!nachDisziplin[disziplinName]) {
        nachDisziplin[disziplinName] = [];
      }
      nachDisziplin[disziplinName].push(m);
    });

    return { verarbeitet, nachDisziplin };
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
            disziplinen: Object.values(disziplinen),
            vereinsLimit: vereinsLimit
          },
          aktion: 'generieren'
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setGeminiResult(result.data);
        if (result.data.startliste) {
          const mappedStartliste = result.data.startliste.map((starter, index) => {
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
            configId: configId || null,
            saison: selectedSaison || null,
            startliste: mappedStartliste,
            konfiguration: {
              staende: staende || [],
              startzeit: startzeit || '14:00',
              durchgang: durchgang || 50,
              wechsel: wechsel || 10,
              austragungsort: austragungsort || '',
              selectedDisziplinen: selectedDisziplinen || []
            },
            erstellt: new Date(),
            version: '2.0'
          };
          
          const docRef = await addDoc(collection(db, 'km_startlisten_v2'), startlisteData);
          
          setGeminiResult({
            ...result.data,
            startliste: mappedStartliste
          });
          
          logInfo('✅ Gemini Startliste V2 gespeichert:', { data: docRef.id });
        }
      } else {
        logError('Gemini Fehler:', result.error);
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
        <h1 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-3">
          🎯 Startlisten Tool 2.0
          <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">
            Neu & Verbessert
          </span>
        </h1>

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
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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

            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-3">③ Meldungen ({verarbeiteMeldungen().verarbeitet.length})</h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Disziplinen Filter:</label>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(verarbeiteMeldungen().nachDisziplin).map(([disziplin, meldungenListe]) => (
                    <label key={disziplin} className="flex items-center gap-2 bg-white p-2 rounded border cursor-pointer hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={selectedDisziplinen.includes(disziplin)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedDisziplinen([...selectedDisziplinen, disziplin]);
                          } else {
                            setSelectedDisziplinen(selectedDisziplinen.filter(d => d !== disziplin));
                          }
                        }}
                        className="rounded"
                      />
                      <span className="text-sm">{disziplin}</span>
                      <span className="text-xs bg-blue-100 text-blue-800 px-1 rounded">{meldungenListe.length}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 p-4 bg-blue-50 rounded border space-y-3">
              <h4 className="font-medium text-blue-900">🤖 KI Startlisten-Generator</h4>
              <p className="text-sm text-blue-700">
                KI-basierte Startlisten-Optimierung mit Vereins-Limits & Sportgeräte-Regeln
              </p>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-sm text-blue-700">
                    Max. Starter pro Verein pro Durchgang:
                  </label>
                  <input
                    type="number"
                    value={vereinsLimit || ''}
                    onChange={(e) => setVereinsLimit(e.target.value ? parseInt(e.target.value) : null)}
                    placeholder="Kein Limit"
                    className="w-24 h-8 p-2 border rounded"
                    min="1"
                    max="10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium disabled:opacity-50"
                  onClick={async () => {
                    setKmGenerating(true);
                    await generiereGemini();
                    setKmGenerating(false);
                  }}
                  disabled={kmGenerating || geminiLoading}
                >
                  {(kmGenerating || geminiLoading) ? (
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
              
              <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Schütze manuell hinzufügen</p>
                    <p className="text-xs text-gray-700">Für Schützen die am anderen Termin schießen sollen</p>
                  </div>
                </div>
                <div className="mb-3">
                  <input
                    type="text"
                    placeholder="Schützen-Name suchen..."
                    className="w-full p-2 border rounded text-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="max-h-32 overflow-y-auto">
                  <div className="grid grid-cols-2 gap-2">
                    {verarbeiteMeldungen().verarbeitet
                      .filter(m => 
                        !geminiResult?.startliste?.some(s => (s.name || s.schuetzeName) === m.name && s.disziplin === m.disziplin) &&
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
                              schuetzeName: schuetze.name,
                              id: `manual_${Date.now()}`,
                              stand: staende[0] || '1',
                              startzeit: startzeit || '14:00',
                              durchgang: 1,
                              hinweise: 'Terminwechsel - schießt am anderen Tag'
                            };
                            const neueStartliste = [...(geminiResult?.startliste || []), neuerStarter];
                            setGeminiResult({
                              ...geminiResult,
                              startliste: neueStartliste
                            });
                          }}
                          className="text-left p-2 bg-white border border-gray-300 rounded hover:bg-blue-50 text-xs transition-colors"
                        >
                          <div className="font-medium">{schuetze.name}</div>
                          <div className="text-gray-600">{schuetze.disziplin}</div>
                          <div className="text-gray-500">{schuetze.verein}</div>
                        </button>
                      ))}
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {geminiResult.startliste
                    .filter(starter => starter.name && starter.name !== 'EMPTY' && starter.name !== 'Leerer Stand')
                    .sort((a, b) => {
                      if (a.durchgang !== b.durchgang) return (a.durchgang || 1) - (b.durchgang || 1);
                      const standA = parseInt(a.stand || '0');
                      const standB = parseInt(b.stand || '0');
                      if (standA !== standB) return standA - standB;
                      return (a.startzeit || '').localeCompare(b.startzeit || '');
                    })
                    .map((starter, index) => {
                      const echteMeldung = meldungen.find(m => 
                        m.name === (starter.schuetzeName || starter.name) && 
                        m.disziplin === starter.disziplin
                      );
                      
                      return (
                        <div key={index} className="grid grid-cols-12 gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm items-center group hover:bg-gray-100 transition-colors">
                          <div className="col-span-3">
                            <div className="font-medium">{starter.schuetzeName || starter.name}</div>
                            <div className="text-xs text-muted-foreground">{starter.verein}</div>
                            {echteMeldung?.altersklasse && (
                              <span className="text-xs bg-blue-100 text-blue-800 px-1 rounded mt-1 inline-block">
                                {echteMeldung.altersklasse}
                              </span>
                            )}
                            {starter.hinweise && (
                              <div className="text-xs text-orange-600 font-medium mt-1">
                                {starter.hinweise}
                              </div>
                            )}
                          </div>
                          <div className="col-span-2">
                            <span className="text-xs bg-blue-100 text-blue-800 px-1 rounded">{starter.disziplin}</span>
                          </div>
                          <div className="col-span-2">
                            <select
                              value={starter.stand}
                              onChange={(e) => {
                                const updatedStartliste = geminiResult.startliste.map(s => 
                                  s === starter ? {...s, stand: e.target.value} : s
                                );
                                setGeminiResult({...geminiResult, startliste: updatedStartliste});
                              }}
                              className="w-full p-1 border rounded text-xs"
                            >
                              {staende.map(stand => (
                                <option key={stand} value={stand}>Stand {stand}</option>
                              ))}
                            </select>
                          </div>
                          <div className="col-span-2">
                            <input
                              type="time"
                              value={starter.startzeit}
                              onChange={(e) => {
                                const updatedStartliste = geminiResult.startliste.map(s => 
                                  s === starter ? {...s, startzeit: e.target.value} : s
                                );
                                setGeminiResult({...geminiResult, startliste: updatedStartliste});
                              }}
                              className="w-full p-1 border rounded text-xs"
                            />
                          </div>
                          <div className="col-span-1 text-center">
                            <input
                              type="number"
                              value={starter.durchgang}
                              onChange={(e) => {
                                const updatedStartliste = geminiResult.startliste.map(s => 
                                  s === starter ? {...s, durchgang: parseInt(e.target.value) || 1} : s
                                );
                                setGeminiResult({...geminiResult, startliste: updatedStartliste});
                              }}
                              className="w-full p-1 border rounded text-xs text-center"
                              min="1"
                            />
                          </div>
                          <div className="col-span-2">
                            <input
                              type="text"
                              value={echteMeldung?.anmerkung || starter.hinweise || starter.anmerkung || ''}
                              onChange={(e) => {
                                const updatedStartliste = geminiResult.startliste.map(s => 
                                  s === starter ? {...s, anmerkung: e.target.value} : s
                                );
                                setGeminiResult({...geminiResult, startliste: updatedStartliste});
                              }}
                              placeholder="Bemerkung..."
                              className="w-full p-1 border rounded text-xs"
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}