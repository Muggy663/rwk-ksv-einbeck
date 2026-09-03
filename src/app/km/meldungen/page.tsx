"use client";

import { useState, useEffect } from 'react';
import { logError, logWarn, logDebug } from '@/lib/utils/secure-logger';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import type { Shooter, KMDisziplin, KMMeldung } from '@/types';
import { getStartVereinForDisziplin } from '@/lib/services/km-startrechte-service';
import { useKMAuth } from '@/hooks/useKMAuth';
import { BackButton } from '@/components/ui/back-button';
import { KMProvider, useKMContext } from '@/contexts/KMContext';
import { KMClubSwitcher } from '@/components/ui/km-club-switcher';
import { getShooterClubId, ermittleEinzelklasse, type KmAltersklasse } from '@/lib/utils/altersklassen';
import { authFetch } from '@/lib/auth/authFetch';

function KMMeldungenContent() {
  const { toast } = useToast();
  const { userRole } = useKMAuth();
  const { currentClubId, userClubIds } = useKMContext();
  const [meldeModus, setMeldeModus] = useState<'schuetze-disziplinen' | 'disziplin-schuetzen'>('disziplin-schuetzen');
  const [selectedSchuetze, setSelectedSchuetze] = useState('');
  const [selectedSchuetzen, setSelectedSchuetzen] = useState<string[]>([]);
  const [selectedDisziplinen, setSelectedDisziplinen] = useState<string[]>([]);
  const [selectedDisziplin, setSelectedDisziplin] = useState('');
  const [schuetzenSuche, setSchuetzenSuche] = useState('');
  const [lmTeilnahme, setLmTeilnahme] = useState<{[key: string]: boolean}>({});
  const [anmerkung, setAnmerkung] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // VM-Ergebnis Felder pro Disziplin
  const [vmErgebnisse, setVmErgebnisse] = useState<{[key: string]: {ringe: string, datum: string, bemerkung: string}}>({});
  
  const [schuetzen, setSchuetzen] = useState<Shooter[]>([]);
  const [disziplinen, setDisziplinen] = useState<KMDisziplin[]>([]);
  const [, setMeldungen] = useState<KMMeldung[]>([]);
  const [clubs, setClubs] = useState<any[]>([]);
  const [altersklassenListe, setAltersklassenListe] = useState<KmAltersklasse[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingMeldung, setEditingMeldung] = useState<KMMeldung | null>(null);
  
  // Zwischenspeicher für Meldungen
  const [pendingMeldungen, setPendingMeldungen] = useState<any[]>([]);
  const [saisons, setSaisons] = useState<any[]>([]);
  const [selectedSaison, setSelectedSaison] = useState<string>('');

  // Gefilterte Disziplinen für gewählte Saison
  // Disziplinen sind zeitlos — Filterung nur nach Disziplin-Typ (KK/LD/KKP) der gewählten Saison
  const filteredDisziplinenForSaison = (() => {
    if (!selectedSaison) return [];
    const selectedSaisonData = saisons.find(s => s.id === selectedSaison);
    if (!selectedSaisonData) return [];
    const disziplinTyp = selectedSaisonData?.disziplinTyp?.toUpperCase() || '';
    
    // Alle Disziplinen anzeigen die zum Typ passen
    return disziplinen.filter(d => {
      if (!disziplinTyp) return true; // Kein Typ → alle zeigen
      // KK = Gewehr Disziplinen (spoNummer 1.xx und 3.xx)
      if (disziplinTyp === 'KK') return d.spoNummer?.startsWith('1.') || d.spoNummer?.startsWith('3.');
      // LD = Luftdruck (spoNummer 1.xx und 2.xx)
      if (disziplinTyp === 'LD') return d.spoNummer?.startsWith('1.') || d.spoNummer?.startsWith('2.');
      // KKP = Pistole (spoNummer 4.xx)
      if (disziplinTyp === 'KKP') return d.spoNummer?.startsWith('4.');
      return true;
    }).sort((a, b) => {
      const numA = parseFloat(a.spoNummer || '0') || 0;
      const numB = parseFloat(b.spoNummer || '0') || 0;
      return numA - numB;
    });
  })();

  useEffect(() => {
    loadData();
  }, []);
  
  useEffect(() => {
    if (selectedSaison) {
      loadDisziplinen();
    }
  }, [selectedSaison]);

  const loadDisziplinen = async () => {
    if (!selectedSaison) return;
    
    try {
      const { getDocs, collection } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase/config');
      
      const saison = saisons.find(s => s.id === selectedSaison);
      const disziplinTyp = saison?.disziplinTyp?.toLowerCase() || 'kk';
      
      const meldungenSnapshot = await getDocs(collection(db, `km_meldungen_${saison?.jahr || 2027}_${disziplinTyp}`));
      const saisonMeldungen = meldungenSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as unknown as KMMeldung[];
      setMeldungen(saisonMeldungen);
    } catch (error) {
      logWarn('Fehler beim Laden der Disziplinen:', error instanceof Error ? error.message : String(error));
    }
  };

  const loadData = async () => {
    try {
      // Lade direkt aus Firebase
      const { getDocs, collection, query, orderBy } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase/config');
      
      // Lade alle Daten parallel
      const [shootersSnapshot, disziplinenSnapshot, saisonSnapshot, clubsSnapshot, altersklassenSnapshot] = await Promise.all([
        getDocs(query(collection(db, 'shooters'), orderBy('lastName', 'asc'))),
        getDocs(collection(db, 'km_disziplinen')),
        getDocs(collection(db, 'km_saisons')),
        getDocs(collection(db, 'clubs')),
        getDocs(collection(db, 'km_altersklassen'))
      ]);
      
      const allSchuetzen = shootersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as unknown as Shooter[];
      const allDisziplinen = disziplinenSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as unknown as KMDisziplin[];
      const allSaisons = saisonSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as unknown as Array<{ id: string; jahr: number; status: string; meldeschluss?: string; disziplinTyp?: string; [key: string]: any }>;
      const allClubs = clubsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as unknown as Array<{ id: string; name: string; [key: string]: any }>;
      const allAltersklassen = altersklassenSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as unknown as KmAltersklasse[];
      setAltersklassenListe(allAltersklassen);
      
      logDebug(`DEBUG: Disziplinen aus Firebase: ${allDisziplinen.length}`);
      logDebug(`DEBUG: Vereine aus Firebase: ${allClubs.length}`);
      logDebug(`DEBUG: Beispiel Disziplinen IDs: ${JSON.stringify(allDisziplinen.slice(0, 5).map(d => ({ id: d.id, name: d.name })))}`);
      logDebug(`DEBUG: Suche nach Disziplin Zlnqwo6I1KYyOzeO0CPU: ${JSON.stringify(allDisziplinen.find(d => d.id === 'Zlnqwo6I1KYyOzeO0CPU'))}`);
      logDebug(`DEBUG: Alle Disziplin IDs: ${JSON.stringify(allDisziplinen.map(d => d.id))}`);
      
      setSchuetzen(allSchuetzen);
      setDisziplinen(allDisziplinen);
      setClubs(allClubs);
      
      // Sortiere Saisons — nur aktive anzeigen
      const sortedSaisons = allSaisons
        .filter(s => s.status === 'aktiv' || s.status === 'Aktiv')
        .sort((a, b) => {
        const today = new Date();
        const getDeadline = (s: { meldeschluss?: string }) => {
          if (!s.meldeschluss) return new Date(0);
          if (s.meldeschluss.includes('.') && s.meldeschluss.length > 6) {
            const [day, month, year] = s.meldeschluss.split('.');
            return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
          } else {
            const [day, month] = s.meldeschluss.split('.');
            return new Date(today.getFullYear(), parseInt(month) - 1, parseInt(day));
          }
        };
        
        const aExpired = today > getDeadline(a);
        const bExpired = today > getDeadline(b);
        
        if (aExpired !== bExpired) {
          return aExpired ? 1 : -1;
        }
        return b.jahr - a.jahr;
      });
      
      setSaisons(sortedSaisons);
      
      // Lade Meldungen aus allen Collections für das aktive Jahr
      const aktiveSaisonDaten = sortedSaisons.length > 0 ? sortedSaisons[0] : null;
      const jahr = aktiveSaisonDaten?.jahr || new Date().getFullYear() + (new Date().getMonth() >= 6 ? 1 : 0);
      const collections = ['kk', 'kkp', 'ld'];
      let alleMeldungen: KMMeldung[] = [];
      
      for (const typ of collections) {
        try {
          const collectionName = `km_meldungen_${jahr}_${typ}`;
          const meldungenSnapshot = await getDocs(collection(db, collectionName));
          const meldungen = meldungenSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as unknown as KMMeldung[];
          alleMeldungen.push(...meldungen);
        } catch (e) {
          logWarn(`Collection km_meldungen_${jahr}_${typ} nicht gefunden`);
        }
      }
      
      setMeldungen(alleMeldungen);
      
      logDebug(`DEBUG: Rohe Meldungen aus Firebase: ${alleMeldungen.length}`);
      if (alleMeldungen.length > 0) {
        logDebug(`DEBUG: Erste Meldung: ${JSON.stringify(alleMeldungen[0])}`);
      }
      
      // Debug: Prüfe Mapping
      alleMeldungen.forEach(meldung => {
        const schuetze = allSchuetzen.find(s => s.id === meldung.schuetzeId);
        const disziplin = allDisziplinen.find(d => d.id === meldung.disziplinId);
        logDebug(`DEBUG: Prüfe Meldung: ${meldung.id} SchuetzeId: ${meldung.schuetzeId} DisziplinId: ${meldung.disziplinId}`);
        logDebug(`DEBUG: Mapping - Schütze: ${schuetze?.name || (schuetze?.firstName + ' ' + schuetze?.lastName)} Disziplin: ${disziplin?.name} DisziplinId: ${meldung.disziplinId}`);
      });
      
      const verarbeitete = alleMeldungen.filter(meldung => {
        const schuetze = allSchuetzen.find(s => s.id === meldung.schuetzeId);
        const disziplin = allDisziplinen.find(d => d.id === meldung.disziplinId);
        return schuetze && disziplin;
      });
      
      logDebug(`DEBUG: Verarbeitete Meldungen: ${verarbeitete.length}`);
      
    } catch (error) {
      logError('Fehler beim Laden der Daten:', error);
      toast({ title: 'Fehler', description: 'Daten konnten nicht geladen werden', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleAddToPending = () => {
    if (!selectedSchuetze || selectedDisziplinen.length === 0) return;
    
    const newPending = selectedDisziplinen.map(disziplinId => {
      const vmData = vmErgebnisse[disziplinId];
      return {
        schuetzeId: selectedSchuetze,
        disziplinId,
        lmTeilnahme: lmTeilnahme[disziplinId] || false,
        anmerkung,
        vmErgebnis: vmData?.ringe ? {
          ringe: parseFloat(vmData.ringe),
          datum: new Date(vmData.datum || Date.now()),
          bemerkung: vmData.bemerkung || ''
        } : undefined
      };
    });
    
    setPendingMeldungen(prev => [...prev, ...newPending]);
    
    // Form zurücksetzen
    setSelectedSchuetze('');
    setSelectedDisziplinen([]);
    setLmTeilnahme({});
    setAnmerkung('');
    setVmErgebnisse({});
    
    toast({ title: 'Hinzugefügt', description: `${newPending.length} Meldung(en) zum Zwischenspeicher hinzugefügt` });
  };
  
  const handleBulkSubmit = async () => {
    logDebug('handleBulkSubmit called, pending:', pendingMeldungen.length);
    if (pendingMeldungen.length === 0) {
      logDebug('No pending meldungen, returning');
      return;
    }
    
    logDebug('Starting bulk submit...');
    setIsSubmitting(true);
    try {
      logDebug(`Creating promises for ${pendingMeldungen.length} meldungen`);
      const promises = pendingMeldungen.map((meldung, index) => {
        logDebug(`Creating promise ${index + 1}: ${JSON.stringify(meldung)}`);
        return authFetch('/api/km/meldungen', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            ...meldung,
            saisonId: selectedSaison
          })
        });
      });
      
      logDebug('Waiting for all promises...');
      const results = await Promise.all(promises);
      logDebug('All promises resolved:', results.length);
      const successful = results.filter(r => r.ok).length;
      const duplicates = results.filter(r => r.status === 409).length;
      
      if (successful === pendingMeldungen.length) {
        toast({ 
          title: 'Erfolg', 
          description: `${successful} Meldungen gespeichert - Liste wird aktualisiert` 
        });
        setPendingMeldungen([]);
        loadData();
      } else if (duplicates > 0) {
        // Browser-Alert für Duplikate
        alert(`⚠️ Duplikat erkannt!\n\n${duplicates} Meldung(en) bereits vorhanden${successful > 0 ? `.\n${successful} neue Meldung(en) wurden erstellt` : ''}.`);
        
        toast({ 
          title: 'Duplikat erkannt', 
          description: `${duplicates} Meldung(en) bereits vorhanden. ${successful} neue Meldung(en) erstellt.`, 
          variant: 'destructive' 
        });
        
        // Nur erfolgreich gespeicherte aus Zwischenspeicher entfernen
        if (successful > 0) {
          setPendingMeldungen(prev => prev.slice(successful));
          loadData();
        }
      } else {
        toast({ title: 'Teilweise Fehler', description: `${successful}/${pendingMeldungen.length} Meldungen gespeichert`, variant: 'destructive' });
      }
    } catch (error) {
      logError('Bulk submit error:', error);
      toast({ title: 'Fehler', description: 'Speichern fehlgeschlagen', variant: 'destructive' });
    } finally {
      logDebug('Bulk submit finished, setting isSubmitting to false');
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedSchuetze || selectedDisziplinen.length === 0) {
      toast({ title: 'Fehler', description: 'Bitte Schütze und mindestens eine Disziplin auswählen', variant: 'destructive' });
      return;
    }

    // Prüfe VM-Ergebnis für Durchmeldungs-Disziplinen (außer 11.10, 11.11, 11.20, 11.50, 11.51)
    const durchmeldungsDisziplinen = selectedDisziplinen.filter(id => {
      const disziplin = disziplinen.find(d => d.id === id);
      if (!disziplin?.nurVereinsmeisterschaft) return false;
      // Diese Disziplinen brauchen kein VM-Ergebnis
      const noVmRequired = ['11.10', '11.11', '11.20', '11.50', '11.51'];
      return !noVmRequired.includes(disziplin.spoNummer);
    });
    
    for (const disziplinId of durchmeldungsDisziplinen) {
      const vmData = vmErgebnisse[disziplinId];
      if (!vmData?.ringe || !vmData?.datum) {
        toast({ title: 'Fehler', description: 'Für Durchmeldungs-Disziplinen ist das VM-Ergebnis erforderlich', variant: 'destructive' });
        return;
      }
    }

    setIsSubmitting(true);
    try {
      if (editingMeldung) {
        // Update bestehende Meldung
        const vmData = vmErgebnisse[selectedDisziplinen[0]];
        const response = await authFetch(`/api/km/meldungen/${editingMeldung.id}`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            lmTeilnahme: lmTeilnahme[selectedDisziplinen[0]] || false,
            anmerkung,
            vmErgebnis: vmData?.ringe ? {
              ringe: parseFloat(vmData.ringe),
              datum: new Date(vmData.datum || Date.now()),
              bemerkung: vmData.bemerkung || ''
            } : undefined
          })
        });
        
        if (response.ok) {
          toast({ 
            title: 'Erfolg', 
            description: 'Meldung aktualisiert - Anzeige wird in wenigen Sekunden aktualisiert' 
          });
          setEditingMeldung(null);
        } else {
          toast({ title: 'Fehler', description: 'Aktualisierung fehlgeschlagen', variant: 'destructive' });
        }
      } else {
        // Erstelle neue Meldungen
        const meldungsPromises = selectedDisziplinen.map(disziplinId => {
          const vmData = vmErgebnisse[disziplinId];
          return authFetch('/api/km/meldungen', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              schuetzeId: selectedSchuetze,
              disziplinId,
              saisonId: selectedSaison,
              lmTeilnahme: lmTeilnahme[disziplinId] || false,
              anmerkung,
              vmErgebnis: vmData?.ringe ? {
                ringe: parseFloat(vmData.ringe),
                datum: new Date(vmData.datum || Date.now()),
                bemerkung: vmData.bemerkung || ''
              } : undefined
            })
          });
        });
        
        let successful = 0;
        let duplicates = 0;
        
        for (const promise of meldungsPromises) {
          try {
            const response = await promise;
            const data = await response.json();
            
            if (response.ok && data.success) {
              successful++;
            } else if (response.status === 409 && data.duplicate) {
              duplicates++;
            }
          } catch (error) {
            // Fehler ignorieren und weitermachen
          }
        }
        
        if (successful > 0 && duplicates === 0) {
          toast({ title: 'Erfolg', description: `${successful} Meldung(en) erfolgreich erstellt` });
          // Reset form nur bei vollem Erfolg
          setSelectedSchuetze('');
          setSelectedDisziplinen([]);
          setLmTeilnahme({});
          setAnmerkung('');
          setVmErgebnisse({});
          loadData();
        } else if (duplicates > 0) {
          // Browser-Alert für sofortige Sichtbarkeit
          alert(`⚠️ Duplikat erkannt!\n\n${duplicates} Meldung(en) bereits vorhanden${successful > 0 ? `.\n${successful} neue Meldung(en) wurden erstellt` : ''}.`);
          
          toast({ 
            title: 'Duplikat erkannt', 
            description: `${duplicates} Meldung(en) bereits vorhanden${successful > 0 ? `. ${successful} neue Meldung(en) erstellt` : ''}.`, 
            variant: 'destructive' 
          });
          // Formular NICHT zurücksetzen bei Duplikaten
          if (successful > 0) loadData(); // Nur Daten neu laden wenn etwas erfolgreich war
          return; // Früh beenden, kein Reset
        } else {
          toast({ title: 'Fehler', description: 'Meldungen konnten nicht erstellt werden', variant: 'destructive' });
          return; // Früh beenden, kein Reset
        }
      }
    } catch (error) {
      toast({ title: 'Fehler', description: 'Meldungen konnten nicht erstellt werden', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getWettkampfklasse = (schuetze: Shooter, auflage: boolean = false, spoNummer?: string) => {
    if (!schuetze.birthYear || !schuetze.gender) {
      return {
        klasse: 'Daten unvollständig - bitte nachtragen',
        kmErlaubt: false,
        lmErlaubt: false,
        warnung: 'Geburtsjahr und Geschlecht erforderlich'
      };
    }

    const selectedSaisonData = saisons.find(s => s.id === selectedSaison);
    const sportjahr = selectedSaisonData?.jahr || new Date().getFullYear();
    const age = sportjahr - schuetze.birthYear;
    const gender = schuetze.gender;
    const altersgenehmigung = !!(schuetze as any).sondergenehmigung;

    // Lichtgewehr (11.11): nur 6-11 Jahre
    if (spoNummer === '11.11') {
      if (age >= 6 && age <= 11) {
        const klasse = gender === 'male' ? 'Lichtgewehr m' : 'Lichtgewehr w';
        return { klasse, kmErlaubt: true, lmErlaubt: true, warnung: null };
      }
      return {
        klasse: 'Nicht teilnahmeberechtigt',
        kmErlaubt: false,
        lmErlaubt: false,
        warnung: 'Lichtgewehr (11.11) nur für Altersklasse 6-11 Jahre'
      };
    }

    // Klassenname datengetrieben aus km_altersklassen (Single Source of Truth)
    const klasse = ermittleEinzelklasse({
      birthYear: schuetze.birthYear,
      gender,
      auflage,
      spoNummer,
      saisonJahr: sportjahr,
      altersklassen: altersklassenListe,
      altersgenehmigung
    });

    if (!klasse) {
      // Kein startberechtigter Treffer (z. B. unter 12 ohne Genehmigung bei Freihand,
      // oder 21-40 bei regulärer Auflage ohne kreisinterne Ausnahme).
      const hinweis = !auflage && age < 12
        ? 'Luftgewehr erst ab 12 Jahren (bzw. ab 10 mit Altersgenehmigung)'
        : 'Für diese Disziplin/Altersklasse keine Startberechtigung';
      return { klasse: 'Nicht teilnahmeberechtigt', kmErlaubt: false, lmErlaubt: false, warnung: hinweis };
    }

    // LM-Berechtigung: kreisinterne Auflage-Ausnahme (1.41/1.11) für 21-40 ist KM-,
    // aber nicht LM-berechtigt.
    const istKreisinterneAuflage = auflage && (spoNummer === '1.41' || spoNummer === '1.11');
    if (istKreisinterneAuflage && age >= 21 && age <= 40) {
      return {
        klasse,
        kmErlaubt: true,
        lmErlaubt: false,
        warnung: 'KM erlaubt, aber nicht LM-berechtigt (Sonderregelung Kreisverband Auflage)'
      };
    }

    return { klasse, kmErlaubt: true, lmErlaubt: true, warnung: null };
  };

  if (loading) {
    return (
      <div className="container py-8 max-w-4xl mx-auto">
        <div className="flex flex-col items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-lg text-gray-600">Lade Meldungsformular...</p>
          <p className="text-sm text-gray-400 mt-2">Disziplinen und Schützendaten werden geladen</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <BackButton className="mr-2" fallbackHref="/km" />
          <div>
            <h1 className="text-3xl font-bold text-primary">📝 Schützen zur KM melden</h1>
            <p className="text-muted-foreground">
              Melden Sie Ihre Schützen für die Kreismeisterschaft an
            </p>
          </div>
        </div>

      </div>

      <div className="max-w-4xl mx-auto">
        <div>
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>Meldungsformular</CardTitle>
                  <CardDescription>
                    {meldeModus === 'schuetze-disziplinen' 
                      ? 'Wählen Sie einen Schützen und die gewünschten Disziplinen'
                      : 'Wählen Sie eine Disziplin und die gewünschten Schützen'
                    }
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">

              
              {/* Melde-Modus Tabs */}
              <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <button
                  onClick={() => {
                    setMeldeModus('schuetze-disziplinen');
                    setSelectedSchuetzen([]);
                    setSelectedDisziplin('');
                  }}
                  className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    meldeModus === 'schuetze-disziplinen'
                      ? 'bg-white dark:bg-gray-700 text-primary shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  👤 Schütze → Disziplinen
                </button>
                <button
                  onClick={() => {
                    setMeldeModus('disziplin-schuetzen');
                    setSelectedSchuetze('');
                    setSelectedDisziplinen([]);
                  }}
                  className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    meldeModus === 'disziplin-schuetzen'
                      ? 'bg-white dark:bg-gray-700 text-primary shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  🎯 Disziplin → Schützen
                </button>
              </div>
              
              {/* KM-Auswahl */}
              <Card className="border-2 border-primary bg-primary/5">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-base font-semibold text-gray-800 dark:text-gray-200">🎯 Saison auswählen (Pflichtfeld)</label>
                      <select
                        value={selectedSaison}
                        onChange={(e) => setSelectedSaison(e.target.value)}
                        className="w-full mt-2 px-4 py-3 text-lg border-2 border-primary rounded-lg bg-white focus:ring-2 focus:ring-primary focus:border-primary"
                        required
                      >
                        <option value="">🔽 Bitte Saison wählen...</option>
                        {saisons.map(saison => {
                          const today = new Date();
                          let isExpired = false;
                          
                          if (saison.meldeschluss) {
                            const meldeschluss = saison.meldeschluss;
                            let deadline;
                            
                            if (meldeschluss.includes('.') && meldeschluss.length > 6) {
                              const [day, month, year] = meldeschluss.split('.');
                              deadline = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                            } else {
                              const [day, month] = meldeschluss.split('.');
                              deadline = new Date(today.getFullYear(), parseInt(month) - 1, parseInt(day));
                            }
                            
                            isExpired = today > deadline;
                          }
                          
                          return (
                            <option 
                              key={saison.id} 
                              value={saison.id}
                              disabled={isExpired}
                              style={isExpired ? { color: '#999', backgroundColor: '#f5f5f5' } : {}}
                            >
                              {saison.name} ({saison.disziplinTyp}){isExpired ? ' - Meldeschluss vorbei' : ''}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {!selectedSaison && (
                <Card className="border-orange-200 bg-orange-50">
                  <CardContent className="pt-6">
                    <div className="text-center py-4">
                      <p className="text-orange-800 font-medium mb-2">⚠️ Bitte wählen Sie zuerst eine Saison aus</p>
                      <p className="text-sm text-orange-600">Das Meldungsformular wird erst nach der Saisonauswahl angezeigt.</p>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {/* Vereinsauswahl */}
              {selectedSaison && (
              <div>
                <label className="block text-sm font-medium mb-2">Verein</label>
                <KMClubSwitcher />
              </div>
              )}

              {selectedSaison && meldeModus === 'schuetze-disziplinen' ? (
                <>{/* Bestehender Schütze → Disziplinen Modus */}

                {/* Schützen-Auswahl */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Schütze auswählen
                  {currentClubId && (
                    <span className="text-sm text-gray-500 ml-2">
                      (gefiltert nach {clubs.find(c => c.id === currentClubId)?.name})
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  placeholder="Schütze suchen..."
                  value={schuetzenSuche}
                  onChange={(e) => setSchuetzenSuche(e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 mb-2"
                />
                <div className="max-h-48 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded p-2 bg-white dark:bg-gray-800">
                  {schuetzen
                    .filter(schuetze => {
                      // Zeige nur Schützen mit Namen an
                      if (!schuetze.name) return false;
                      
                      // Prüfe ob Schütze zu berechtigten Vereinen gehört
                      const schuetzeClubIds = [
                        schuetze.rwkClubId,
                        schuetze.clubId, 
                        schuetze.kmClubId,
                        ...(schuetze.kmStartrechte ? Object.values(schuetze.kmStartrechte) : [])
                      ].filter((c): c is string => Boolean(c));
                      
                      const hasAccess = schuetzeClubIds.some(clubId => userClubIds.includes(clubId));
                      if (!hasAccess) return false;
                      
                      if (currentClubId && !schuetzeClubIds.includes(currentClubId)) return false;
                      
                      // Suchfilter
                      if (schuetzenSuche) {
                        const searchTerm = schuetzenSuche.toLowerCase();
                        const fullName = schuetze.firstName && schuetze.lastName 
                          ? `${schuetze.firstName} ${schuetze.lastName}` 
                          : schuetze.name;
                        return fullName.toLowerCase().includes(searchTerm);
                      }
                      
                      return true;
                    })
                    .sort((a, b) => {
                      // Nach Nachname sortieren
                      const getLastName = (schuetze: Shooter) => {
                        if (schuetze.lastName) return schuetze.lastName;
                        if (schuetze.name) {
                          const parts = schuetze.name.trim().split(' ');
                          return parts.length >= 2 ? (parts.pop() || '') : schuetze.name;
                        }
                        return '';
                      };
                      
                      return getLastName(a).localeCompare(getLastName(b));
                    })
                    .map(schuetze => {
                      const club = clubs.find(c => c.id === getShooterClubId(schuetze));
                      const birthYearDisplay = schuetze.birthYear || 'Jahrgang fehlt';
                      const genderDisplay = schuetze.gender === 'male' ? 'm' : schuetze.gender === 'female' ? 'w' : 'Geschlecht fehlt';
                      
                      // Intelligente Namen-Anzeige
                      let displayName;
                      if (schuetze.firstName && schuetze.lastName) {
                        displayName = `${schuetze.lastName}, ${schuetze.firstName}`;
                      } else if (schuetze.name) {
                        // Wenn name "Vorname Nachname" Format hat, umdrehen
                        const nameParts = schuetze.name.trim().split(' ');
                        if (nameParts.length >= 2) {
                          const lastName = nameParts.pop();
                          const firstName = nameParts.join(' ');
                          displayName = `${lastName}, ${firstName}`;
                        } else {
                          displayName = schuetze.name;
                        }
                      } else {
                        displayName = 'Unbekannt';
                      }
                      
                      return (
                        <label key={schuetze.id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer">
                          <input
                            type="radio"
                            name="schuetze"
                            checked={selectedSchuetze === schuetze.id}
                            onChange={() => setSelectedSchuetze(schuetze.id)}
                          />
                          <span className="text-sm">
                            {displayName} ({birthYearDisplay}, {genderDisplay}) - {club?.name || 'Verein unbekannt'}
                          </span>
                        </label>
                      );
                    })}
                </div>
              </div>

              {/* Startverein-Anzeige */}
              {selectedSchuetze && selectedDisziplinen.length > 0 && (
                <div>
                  <label className="block text-sm font-medium mb-2">Startvereine für gewählte Disziplinen</label>
                  <div className="space-y-2">
                    {selectedDisziplinen.map(disziplinId => {
                      const schuetze = schuetzen.find(s => s.id === selectedSchuetze);
                      const disziplin = disziplinen.find(d => d.id === disziplinId);
                      if (!schuetze || !disziplin) return null;
                      
                      const startVereinId = getStartVereinForDisziplin(schuetze, disziplin);
                      const startVerein = clubs.find(c => c.id === startVereinId);
                      
                      return (
                        <div key={disziplinId} className="p-3 bg-green-50 border border-green-200 rounded">
                          <div className="font-medium text-green-900">
                            {disziplin.spoNummer} - {startVerein?.name || 'Kein Startrecht'}
                          </div>
                          <div className="text-sm text-green-600">
                            {disziplin.name}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Wettkampfklassen für gewählte Disziplinen */}
              {selectedSchuetze && selectedDisziplinen.length > 0 && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium">Wettkampfklassen</label>
                    <a 
                      href="https://dsb.de/fileadmin/dsb/sportordnung/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:text-blue-800 underline"
                    >
                      DSB-Sportordnung
                    </a>
                  </div>
                  <div className="space-y-2">
                    {selectedDisziplinen.map(disziplinId => {
                      const schuetze = schuetzen.find(s => s.id === selectedSchuetze);
                      const disziplin = disziplinen.find(d => d.id === disziplinId);
                      if (!schuetze || !disziplin) return null;
                      
                      const wettkampfInfo = getWettkampfklasse(schuetze, disziplin.auflage, disziplin.spoNummer);
                      
                      return (
                        <div key={disziplinId} className={`p-3 border rounded ${
                          !wettkampfInfo.kmErlaubt ? 'bg-red-50 border-red-200' :
                          !wettkampfInfo.lmErlaubt ? 'bg-orange-50 border-orange-200' :
                          'bg-blue-50 border-blue-200'
                        }`}>
                          <div className="flex justify-between items-center">
                            <div>
                              <div className={`font-medium ${
                                !wettkampfInfo.kmErlaubt ? 'text-red-900' :
                                !wettkampfInfo.lmErlaubt ? 'text-orange-900' :
                                'text-blue-900'
                              }`}>
                                {disziplin.spoNummer}: {wettkampfInfo.klasse}
                              </div>
                              <div className={`text-sm ${
                                !wettkampfInfo.kmErlaubt ? 'text-red-600' :
                                !wettkampfInfo.lmErlaubt ? 'text-orange-600' :
                                'text-blue-600'
                              }`}>
                                {disziplin.name} {disziplin.auflage ? '(Auflage)' : '(Freihand)'}
                              </div>
                              {wettkampfInfo.warnung && (
                                <div className={`text-xs mt-1 ${
                                  !wettkampfInfo.kmErlaubt ? 'text-red-500' :
                                  !wettkampfInfo.lmErlaubt ? 'text-orange-500' :
                                  'text-blue-500'
                                }`}>
                                  ⚠️ {wettkampfInfo.warnung}
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col gap-1">
                              <Badge variant={wettkampfInfo.kmErlaubt ? "default" : "destructive"} className="text-xs">
                                KM: {wettkampfInfo.kmErlaubt ? '✅' : '❌'}
                              </Badge>
                              <Badge variant={wettkampfInfo.lmErlaubt ? "default" : "secondary"} className="text-xs">
                                LM: {wettkampfInfo.lmErlaubt ? '✅' : '❌'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div className="text-sm text-blue-600 mt-2">
                      {(() => {
                        const schuetze = schuetzen.find(s => s.id === selectedSchuetze);
                        if (!schuetze) return '';
                        const selectedSaisonInfo = saisons.find(s => s.id === selectedSaison);
                        const sportjahr = selectedSaisonInfo?.jahr || new Date().getFullYear();
                        const age = sportjahr - (schuetze.birthYear || 0);
                        return `Alter Sportjahr ${sportjahr}: ${age} Jahre, ${schuetze.gender === 'male' ? 'Männlich' : 'Weiblich'}`;
                      })()}
                    </div>
                  </div>
                </div>
              )}

              {/* Meldeschluss-Warnung */}
              {(() => {
                const today = new Date();
                const selectedSaisonData = saisons.find(s => s.id === selectedSaison);
                let isExpired = false;
                
                if (selectedSaisonData?.meldeschluss) {
                  const meldeschluss = selectedSaisonData.meldeschluss;
                  let deadline;
                  
                  if (meldeschluss.includes('.') && meldeschluss.length > 6) {
                    const [day, month, year] = meldeschluss.split('.');
                    deadline = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                  } else {
                    const [day, month] = meldeschluss.split('.');
                    deadline = new Date(today.getFullYear(), parseInt(month) - 1, parseInt(day));
                  }
                  
                  isExpired = today > deadline;
                }
                
                const canStillEdit = !isExpired || userRole === 'admin' || userRole === 'km_organisator';
                
                if (isExpired && !canStillEdit) {
                  return (
                    <div className="p-3 bg-red-50 border border-red-200 rounded mb-4">
                      <div className="flex items-center gap-2 text-red-800 mb-2">
                        <span>⚠️</span>
                        <span className="font-medium">Meldeschluss überschritten</span>
                      </div>
                      <p className="text-sm text-red-700">
                        Der Meldeschluss für diese KM ist bereits vorbei ({selectedSaisonData?.meldeschluss}). Neue Meldungen sind nicht mehr möglich.
                      </p>
                    </div>
                  );
                } else if (isExpired && canStillEdit) {
                  return (
                    <div className="p-3 bg-orange-50 border border-orange-200 rounded mb-4">
                      <div className="flex items-center gap-2 text-orange-800 mb-2">
                        <span>⚠️</span>
                        <span className="font-medium">Meldeschluss überschritten - Admin-Modus</span>
                      </div>
                      <p className="text-sm text-orange-700">
                        Der Meldeschluss ist vorbei ({selectedSaisonData?.meldeschluss}), aber Sie können als {userRole === 'admin' ? 'Administrator' : 'KM-Organisator'} noch Änderungen vornehmen.
                      </p>
                    </div>
                  );
                }
                return null;
              })()}
              
              {/* Disziplinen - Mehrfachauswahl */}
              <div>
                <label className="block text-sm font-medium mb-2">Disziplinen auswählen (Mehrfachauswahl möglich)</label>
                {filteredDisziplinenForSaison.length === 0 ? (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                    <p className="text-sm text-yellow-700">
                      Für diese Saison sind noch keine Disziplinen hinterlegt. Bitte wende dich an den KM-Organisator.
                    </p>
                  </div>
                ) : (
                  <div className="max-h-48 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded p-2 bg-white dark:bg-gray-800">
                    {filteredDisziplinenForSaison.map(disziplin => {
                      // Prüfe Meldeschluss
                      const today = new Date();
                      let isExpired = false;
                      
                      if ((disziplin as any).saison?.meldeschluss) {
                        const meldeschluss = (disziplin as any).saison.meldeschluss;
                        let deadline;
                        
                        if (meldeschluss.includes('.') && meldeschluss.length > 6) {
                          const [day, month, year] = meldeschluss.split('.');
                          deadline = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                        } else {
                          const [day, month] = meldeschluss.split('.');
                          deadline = new Date(today.getFullYear(), parseInt(month) - 1, parseInt(day));
                        }
                        
                        isExpired = today > deadline;
                      }
                      
                      return (
                        <label key={disziplin.id} className={`flex items-center space-x-2 p-2 rounded cursor-pointer ${
                          isExpired 
                            ? 'bg-red-50 text-red-500 cursor-not-allowed' 
                            : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}>
                          <input
                            type="checkbox"
                            checked={selectedDisziplinen.includes(disziplin.id)}
                            disabled={isExpired}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedDisziplinen(prev => [...prev, disziplin.id]);
                              } else {
                                setSelectedDisziplinen(prev => prev.filter(id => id !== disziplin.id));
                              }
                            }}
                          />
                          <span className="text-sm">
                            {disziplin.spoNummer} - {disziplin.name}
                            {disziplin.nurVereinsmeisterschaft && <Badge variant="outline" className="ml-2 text-xs">VM</Badge>}
                            {isExpired && <Badge variant="destructive" className="ml-2 text-xs">Meldeschluss vorbei</Badge>}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* VM-Ergebnis für gewählte Disziplinen */}
              {selectedDisziplinen.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">VM-Ergebnisse</h4>
                  {selectedDisziplinen.map(disziplinId => {
                    const disziplin = disziplinen.find(d => d.id === disziplinId);
                    if (!disziplin) return null;
                    
                    const vmData = vmErgebnisse[disziplinId] || { ringe: '', datum: '', bemerkung: '' };
                    const noVmRequired = ['11.10', '11.11', '11.20', '11.50', '11.51'];
                    const isVmRequired = disziplin.nurVereinsmeisterschaft && !noVmRequired.includes(disziplin.spoNummer);
                    
                    return (
                      <div key={disziplinId} className="p-4 bg-blue-50 border border-blue-200 rounded">
                        <h5 className="font-medium text-blue-900 mb-2">
                          {disziplin.spoNummer} - {disziplin.name} {isVmRequired ? '(Erforderlich)' : '(Optional)'}
                        </h5>
                        <p className="text-sm text-blue-700 mb-3">
                          {isVmRequired 
                            ? 'Da diese Disziplin nur durchgemeldet wird, ist das VM-Ergebnis erforderlich.'
                            : disziplin.nurVereinsmeisterschaft 
                              ? 'Durchmeldungs-Disziplin - VM-Ergebnis optional.'
                              : 'VM-Ergebnis als Qualifikation für die Kreismeisterschaft (empfohlen).'}
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-medium mb-1 text-blue-900 dark:text-blue-100">
                              Ringe {isVmRequired && '*'}
                            </label>
                            <input
                              type="number"
                              min="0"
                              max="600"
                              step="0.1"
                              value={vmData.ringe}
                              onChange={(e) => setVmErgebnisse(prev => ({
                                ...prev,
                                [disziplinId]: { ...vmData, ringe: e.target.value }
                              }))}
                              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                              placeholder="z.B. 385.7 (mit Nachkommastelle)"
                              required={isVmRequired}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1 text-blue-900 dark:text-blue-100">
                              Datum {isVmRequired && '*'}
                            </label>
                            <input
                              type="date"
                              value={vmData.datum}
                              onChange={(e) => setVmErgebnisse(prev => ({
                                ...prev,
                                [disziplinId]: { ...vmData, datum: e.target.value }
                              }))}
                              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                              required={isVmRequired}
                            />
                          </div>
                        </div>
                        <div className="mt-3">
                          <label className="block text-sm font-medium mb-1 text-blue-900 dark:text-blue-100">Bemerkung (Optional)</label>
                          <input
                            type="text"
                            value={vmData.bemerkung}
                            onChange={(e) => setVmErgebnisse(prev => ({
                              ...prev,
                              [disziplinId]: { ...vmData, bemerkung: e.target.value }
                            }))}
                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                            placeholder="z.B. Vereinsmeisterschaft 2025"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* LM-Teilnahme pro Disziplin */}
              {selectedDisziplinen.length > 0 && (
                <div>
                  <label className="block text-sm font-medium mb-2">Landesmeisterschaft-Teilnahme</label>
                  <div className="space-y-3">
                    {selectedDisziplinen.map(disziplinId => {
                      const disziplin = disziplinen.find(d => d.id === disziplinId);
                      const schuetze = schuetzen.find(s => s.id === selectedSchuetze);
                      if (!disziplin || !schuetze) return null;
                      
                      const wettkampfInfo = getWettkampfklasse(schuetze, disziplin.auflage, disziplin.spoNummer);
                      const isLmDisabled = !wettkampfInfo.lmErlaubt;
                      
                      return (
                        <div key={disziplinId} className={`p-3 border rounded ${
                          isLmDisabled ? 'bg-gray-50 border-gray-200' : 'bg-purple-50 border-purple-200'
                        }`}>
                          <h5 className={`font-medium mb-2 ${
                            isLmDisabled ? 'text-gray-600' : 'text-purple-900'
                          }`}>
                            {disziplin.spoNummer} - {disziplin.name}
                          </h5>
                          {isLmDisabled && (
                            <div className="mb-3 p-2 bg-orange-100 border border-orange-300 rounded text-sm text-orange-800">
                              ⚠️ LM-Meldung für diese Altersklasse nicht möglich: {wettkampfInfo.warnung}
                            </div>
                          )}
                          <div className="flex items-center space-x-4">
                            <label className={`flex items-center space-x-2 ${
                              isLmDisabled ? 'opacity-50 cursor-not-allowed' : ''
                            }`}>
                              <input
                                type="radio"
                                name={`lm_${disziplinId}`}
                                checked={lmTeilnahme[disziplinId] === true}
                                disabled={isLmDisabled}
                                onChange={() => setLmTeilnahme(prev => ({...prev, [disziplinId]: true}))}
                              />
                              <span className={isLmDisabled ? 'text-gray-500' : 'text-purple-900 dark:text-purple-100'}>
                                Ja {isLmDisabled && '(nicht möglich)'}
                              </span>
                            </label>
                            <label className="flex items-center space-x-2">
                              <input
                                type="radio"
                                name={`lm_${disziplinId}`}
                                checked={lmTeilnahme[disziplinId] !== true || isLmDisabled}
                                onChange={() => setLmTeilnahme(prev => ({...prev, [disziplinId]: false}))}
                              />
                              <span className={isLmDisabled ? 'text-gray-500' : 'text-purple-900 dark:text-purple-100'}>
                                Nein
                              </span>
                            </label>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

                {/* Gewehr-Sharing */}
                <div>
                  <label className="block text-sm font-medium mb-2">🔫 Gewehr-Sharing (Optional)</label>
                  <div className="p-3 bg-orange-50 border border-orange-200 rounded mb-3">
                    <p className="text-sm text-orange-700 mb-2">
                      Falls mehrere Schützen sich ein Gewehr teilen müssen, geben Sie hier die Details an.
                    </p>
                    <div className="text-xs text-orange-600">
                      Beispiel: "2 Schützen, 1 Gewehr" oder "Max Mustermann und ich teilen uns ein Gewehr"
                    </div>
                  </div>
                  <textarea
                    value={anmerkung}
                    onChange={(e) => setAnmerkung(e.target.value)}
                    placeholder="z.B. 2 Schützen, 1 Gewehr - bitte zeitlich versetzen"
                    className="w-full p-2 border border-gray-300 rounded h-20"
                  />
                </div>
                </>
              ) : selectedSaison ? (
                <>{/* Neuer Disziplin → Schützen Modus */}
                {/* Disziplinen-Auswahl */}
                <div>
                  <label className="block text-sm font-medium mb-2">Disziplin auswählen</label>
                  <select 
                    value={selectedDisziplin} 
                    onChange={(e) => {
                      setSelectedDisziplin(e.target.value);
                      setSelectedSchuetzen([]);
                    }}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  >
                    <option value="">-- Disziplin wählen --</option>
                    {filteredDisziplinenForSaison.map(disziplin => (
                      <option key={disziplin.id} value={disziplin.id}>
                        {disziplin.spoNummer} - {disziplin.name}
                        {disziplin.nurVereinsmeisterschaft ? ' (VM)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Mehrfach-Schützen-Auswahl */}
                {selectedDisziplin && (
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Schützen auswählen (Mehrfachauswahl)
                      {currentClubId && (
                        <span className="text-sm text-gray-500 ml-2">
                          (gefiltert nach {clubs.find(c => c.id === currentClubId)?.name})
                        </span>
                      )}
                    </label>
                    <input
                      type="text"
                      placeholder="Schütze suchen..."
                      value={schuetzenSuche}
                      onChange={(e) => setSchuetzenSuche(e.target.value)}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 mb-2"
                    />
                    <div className="max-h-48 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded p-2 bg-white dark:bg-gray-800">
                      {schuetzen
                        .filter(schuetze => {
                          if (!schuetze.name) return false;
                          const schuetzeClubIds = [
                            schuetze.rwkClubId,
                            schuetze.clubId, 
                            schuetze.kmClubId,
                            ...(schuetze.kmStartrechte ? Object.values(schuetze.kmStartrechte) : [])
                          ].filter((c): c is string => Boolean(c));
                          const hasAccess = schuetzeClubIds.some(clubId => userClubIds.includes(clubId));
                          if (!hasAccess) return false;
                          if (currentClubId && !schuetzeClubIds.includes(currentClubId)) return false;
                          if (schuetzenSuche) {
                            const searchTerm = schuetzenSuche.toLowerCase();
                            const fullName = schuetze.firstName && schuetze.lastName 
                              ? `${schuetze.firstName} ${schuetze.lastName}` 
                              : schuetze.name;
                            return fullName.toLowerCase().includes(searchTerm);
                          }
                          return true;
                        })
                        .sort((a, b) => {
                          const getLastName = (schuetze: Shooter) => {
                            if (schuetze.lastName) return schuetze.lastName;
                            if (schuetze.name) {
                              const parts = schuetze.name.trim().split(' ');
                              return parts.length >= 2 ? (parts.pop() || '') : schuetze.name;
                            }
                            return '';
                          };
                          return getLastName(a).localeCompare(getLastName(b));
                        })
                        .map(schuetze => {
                          const club = clubs.find(c => c.id === getShooterClubId(schuetze));
                          const birthYearDisplay = schuetze.birthYear || 'Jahrgang fehlt';
                          const genderDisplay = schuetze.gender === 'male' ? 'm' : schuetze.gender === 'female' ? 'w' : 'Geschlecht fehlt';
                          
                          let displayName;
                          if (schuetze.firstName && schuetze.lastName) {
                            displayName = `${schuetze.lastName}, ${schuetze.firstName}`;
                          } else if (schuetze.name) {
                            const nameParts = schuetze.name.trim().split(' ');
                            if (nameParts.length >= 2) {
                              const lastName = nameParts.pop();
                              const firstName = nameParts.join(' ');
                              displayName = `${lastName}, ${firstName}`;
                            } else {
                              displayName = schuetze.name;
                            }
                          } else {
                            displayName = 'Unbekannt';
                          }
                          
                          return (
                            <label key={schuetze.id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedSchuetzen.includes(schuetze.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedSchuetzen(prev => [...prev, schuetze.id]);
                                  } else {
                                    setSelectedSchuetzen(prev => prev.filter(id => id !== schuetze.id));
                                  }
                                }}
                              />
                              <span className="text-sm">
                                {displayName} ({birthYearDisplay}, {genderDisplay}) - {club?.name || 'Verein unbekannt'}
                              </span>
                            </label>
                          );
                        })}
                    </div>
                    {selectedSchuetzen.length > 0 && (
                      <div className="mt-2 text-sm text-green-600">
                        {selectedSchuetzen.length} Schützen ausgewählt
                      </div>
                    )}
                  </div>
                )}

                {/* Wettkampfklassen für ausgewählte Schützen */}
                {selectedDisziplin && selectedSchuetzen.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Wettkampfklassen der ausgewählten Schützen</label>
                    <div className="space-y-2">
                      {selectedSchuetzen.map(schuetzeId => {
                        const schuetze = schuetzen.find(s => s.id === schuetzeId);
                        const disziplin = disziplinen.find(d => d.id === selectedDisziplin);
                        if (!schuetze || !disziplin) return null;
                        
                        const wettkampfInfo = getWettkampfklasse(schuetze, disziplin.auflage, disziplin.spoNummer);
                        const displayName = schuetze.firstName && schuetze.lastName 
                          ? `${schuetze.firstName} ${schuetze.lastName}`
                          : schuetze.name;
                        
                        return (
                          <div key={schuetzeId} className={`p-3 border rounded ${
                            !wettkampfInfo.kmErlaubt ? 'bg-red-50 border-red-200' :
                            !wettkampfInfo.lmErlaubt ? 'bg-orange-50 border-orange-200' :
                            'bg-blue-50 border-blue-200'
                          }`}>
                            <div className="flex justify-between items-center">
                              <div>
                                <div className={`font-medium ${
                                  !wettkampfInfo.kmErlaubt ? 'text-red-900' :
                                  !wettkampfInfo.lmErlaubt ? 'text-orange-900' :
                                  'text-blue-900'
                                }`}>
                                  {displayName}: {wettkampfInfo.klasse}
                                </div>
                                <div className={`text-sm ${
                                  !wettkampfInfo.kmErlaubt ? 'text-red-600' :
                                  !wettkampfInfo.lmErlaubt ? 'text-orange-600' :
                                  'text-blue-600'
                                }`}>
                                  {disziplin.name} {disziplin.auflage ? '(Auflage)' : '(Freihand)'}
                                </div>
                                {wettkampfInfo.warnung && (
                                  <div className={`text-xs mt-1 ${
                                    !wettkampfInfo.kmErlaubt ? 'text-red-500' :
                                    'text-orange-500'
                                  }`}>
                                    ⚠️ {wettkampfInfo.warnung}
                                  </div>
                                )}
                              </div>
                              <div className="flex flex-col gap-1">
                                <Badge variant={wettkampfInfo.kmErlaubt ? "default" : "destructive"} className="text-xs">
                                  KM: {wettkampfInfo.kmErlaubt ? '✅' : '❌'}
                                </Badge>
                                <Badge variant={wettkampfInfo.lmErlaubt ? "default" : "secondary"} className="text-xs">
                                  LM: {wettkampfInfo.lmErlaubt ? '✅' : '❌'}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* VM-Ergebnis pro Schütze */}
                {selectedDisziplin && selectedSchuetzen.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">VM-Ergebnisse (einzeln pro Schütze)</h4>
                    <div className="space-y-4">
                      {selectedSchuetzen.map(schuetzeId => {
                        const schuetze = schuetzen.find(s => s.id === schuetzeId);
                        const disziplin = disziplinen.find(d => d.id === selectedDisziplin);
                        if (!schuetze || !disziplin) return null;
                        
                        const displayName = schuetze.firstName && schuetze.lastName 
                          ? `${schuetze.firstName} ${schuetze.lastName}`
                          : schuetze.name;
                        
                        const vmKey = `${schuetzeId}_${selectedDisziplin}`;
                        const vmData = vmErgebnisse[vmKey] || { ringe: '', datum: '', bemerkung: '' };
                        const noVmRequired = ['11.10', '11.11', '11.20', '11.50', '11.51'];
                        const isVmRequired = disziplin.nurVereinsmeisterschaft && !noVmRequired.includes(disziplin.spoNummer);
                        
                        return (
                          <div key={schuetzeId} className="p-4 bg-blue-50 border border-blue-200 rounded">
                            <h5 className="font-medium text-blue-900 mb-2">
                              {displayName} - {disziplin.name} {isVmRequired ? '(Erforderlich)' : '(Optional)'}
                            </h5>
                            <p className="text-sm text-blue-700 mb-3">
                              {isVmRequired 
                                ? 'Da diese Disziplin nur durchgemeldet wird, ist das VM-Ergebnis erforderlich.'
                                : disziplin.nurVereinsmeisterschaft 
                                  ? 'Durchmeldungs-Disziplin - VM-Ergebnis optional.'
                                  : 'VM-Ergebnis als Qualifikation für die Kreismeisterschaft (empfohlen).'}
                            </p>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-sm font-medium mb-1 text-blue-900 dark:text-blue-100">
                                  Ringe {isVmRequired && '*'}
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  max="600"
                                  step="0.1"
                                  value={vmData.ringe}
                                  onChange={(e) => setVmErgebnisse(prev => ({
                                    ...prev,
                                    [vmKey]: { ...vmData, ringe: e.target.value }
                                  }))}
                                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                  placeholder="z.B. 385.7 (mit Nachkommastelle)"
                                  required={isVmRequired}
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium mb-1 text-blue-900 dark:text-blue-100">
                                  Datum {isVmRequired && '*'}
                                </label>
                                <input
                                  type="date"
                                  value={vmData.datum}
                                  onChange={(e) => setVmErgebnisse(prev => ({
                                    ...prev,
                                    [vmKey]: { ...vmData, datum: e.target.value }
                                  }))}
                                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                  required={isVmRequired}
                                />
                              </div>
                            </div>
                            <div className="mt-3">
                              <label className="block text-sm font-medium mb-1 text-blue-900 dark:text-blue-100">Bemerkung (Optional)</label>
                              <input
                                type="text"
                                value={vmData.bemerkung}
                                onChange={(e) => setVmErgebnisse(prev => ({
                                  ...prev,
                                  [vmKey]: { ...vmData, bemerkung: e.target.value }
                                }))}
                                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                placeholder="z.B. Vereinsmeisterschaft 2025"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* LM-Teilnahme pro Schütze */}
                {selectedDisziplin && selectedSchuetzen.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Landesmeisterschaft-Teilnahme (einzeln pro Schütze)</label>
                    <div className="space-y-3">
                      {selectedSchuetzen.map(schuetzeId => {
                        const schuetze = schuetzen.find(s => s.id === schuetzeId);
                        if (!schuetze) return null;
                        
                        const displayName = schuetze.firstName && schuetze.lastName 
                          ? `${schuetze.firstName} ${schuetze.lastName}`
                          : schuetze.name;
                        
                        const lmKey = `${schuetzeId}_${selectedDisziplin}`;
                        
                        return (
                          <div key={schuetzeId} className="p-3 bg-purple-50 border border-purple-200 rounded">
                            <h5 className="font-medium text-purple-900 mb-2">
                              {displayName}
                            </h5>
                            <div className="flex items-center space-x-4">
                              <label className="flex items-center space-x-2">
                                <input
                                  type="radio"
                                  name={`lm_${lmKey}`}
                                  checked={lmTeilnahme[lmKey] === true}
                                  onChange={() => setLmTeilnahme(prev => ({...prev, [lmKey]: true}))}
                                />
                                <span className="text-purple-900 dark:text-purple-100">Ja</span>
                              </label>
                              <label className="flex items-center space-x-2">
                                <input
                                  type="radio"
                                  name={`lm_${lmKey}`}
                                  checked={lmTeilnahme[lmKey] === false || lmTeilnahme[lmKey] === undefined}
                                  onChange={() => setLmTeilnahme(prev => ({...prev, [lmKey]: false}))}
                                />
                                <span className="text-purple-900 dark:text-purple-100">Nein</span>
                              </label>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Anmerkung */}
                <div>
                  <label className="block text-sm font-medium mb-2">Anmerkung (Optional)</label>
                  <textarea
                    value={anmerkung}
                    onChange={(e) => setAnmerkung(e.target.value)}
                    placeholder="z.B. Gewehr-Sharing oder sonstige Hinweise"
                    className="w-full p-2 border border-gray-300 rounded h-20"
                  />
                </div>
                </>
              ) : null}



              {/* Buttons */}
              {selectedSaison && (() => {
                const today = new Date();
                const selectedSaisonData = saisons.find(s => s.id === selectedSaison);
                let isExpired = false;
                
                if (selectedSaisonData?.meldeschluss) {
                  const meldeschluss = selectedSaisonData.meldeschluss;
                  let deadline;
                  
                  if (meldeschluss.includes('.') && meldeschluss.length > 6) {
                    const [day, month, year] = meldeschluss.split('.');
                    deadline = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                  } else {
                    const [day, month] = meldeschluss.split('.');
                    deadline = new Date(today.getFullYear(), parseInt(month) - 1, parseInt(day));
                  }
                  
                  isExpired = today > deadline;
                }
                
                const canEdit = !isExpired || userRole === 'admin' || userRole === 'km_organisator';
                
                return (
                  <div className="flex flex-col sm:flex-row gap-2">
                    {editingMeldung ? (
                  <>
                    <Button 
                      onClick={handleSubmit}
                      disabled={!selectedSchuetze || selectedDisziplinen.length === 0 || isSubmitting || !canEdit}
                      className="w-full sm:w-auto"
                      title={!canEdit ? 'Meldeschluss abgelaufen' : ''}
                    >
                      {isSubmitting ? 'Speichere...' : 'Meldung aktualisieren'}
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => {
                        setEditingMeldung(null);
                        setSelectedSchuetze('');
                        setSelectedDisziplinen([]);
                        setLmTeilnahme({});
                        setAnmerkung('');
                        setVmErgebnisse({});
                      }}
                      className="w-full sm:w-auto"
                    >
                      Abbrechen
                    </Button>
                  </>
                ) : (
                  <>
                    {meldeModus === 'schuetze-disziplinen' ? (
                      <>
                        <Button 
                          onClick={handleAddToPending}
                          disabled={!selectedSchuetze || selectedDisziplinen.length === 0 || !canEdit}
                          className="w-full sm:w-auto"
                          title={!canEdit ? 'Meldeschluss abgelaufen' : ''}
                        >
                          📋 Zwischenspeichern ({selectedDisziplinen.length || 0})
                        </Button>
                        <Button 
                          onClick={handleSubmit}
                          disabled={!selectedSchuetze || selectedDisziplinen.length === 0 || isSubmitting || !canEdit}
                          variant="outline"
                          className="w-full sm:w-auto"
                          title={!canEdit ? 'Meldeschluss abgelaufen' : ''}
                        >
                          {isSubmitting ? 'Speichere...' : 'Direkt speichern'}
                        </Button>
                      </>
                    ) : (
                      <Button 
                        onClick={() => {
                          if (!selectedDisziplin || selectedSchuetzen.length === 0) {
                            toast({ title: 'Fehler', description: 'Bitte Disziplin und mindestens einen Schützen auswählen', variant: 'destructive' });
                            return;
                          }
                          
                          // Erstelle Meldungen für alle ausgewählten Schützen
                          const newPending = selectedSchuetzen.map(schuetzeId => {
                            const lmKey = `${schuetzeId}_${selectedDisziplin}`;
                            const vmKey = `${schuetzeId}_${selectedDisziplin}`;
                            const vmData = vmErgebnisse[vmKey];
                            logDebug(`LM Key: ${lmKey} Value: ${lmTeilnahme[lmKey]}`);
                            return {
                              schuetzeId,
                              disziplinId: selectedDisziplin,
                              lmTeilnahme: lmTeilnahme[lmKey] === true, // Explizit true oder false
                              anmerkung,
                              vmErgebnis: vmData?.ringe ? {
                                ringe: parseFloat(vmData.ringe),
                                datum: new Date(vmData.datum || Date.now()),
                                bemerkung: vmData.bemerkung || ''
                              } : undefined
                            };
                          });
                          
                          logDebug('New pending:', newPending);
                          setPendingMeldungen(prev => [...prev, ...newPending]);
                          
                          // Reset
                          setSelectedSchuetzen([]);
                          setSelectedDisziplin('');
                          setLmTeilnahme({});
                          setAnmerkung('');
                          
                          toast({ title: 'Hinzugefügt', description: `${newPending.length} Meldungen zum Zwischenspeicher hinzugefügt` });
                        }}
                        disabled={!selectedDisziplin || selectedSchuetzen.length === 0 || !canEdit}
                        className="w-full sm:w-auto"
                        title={!canEdit ? 'Meldeschluss abgelaufen' : ''}
                      >
                        📋 {selectedSchuetzen.length} Schützen zu Zwischenspeicher
                      </Button>
                    )}
                    <Link href="/km" className="w-full sm:w-auto">
                      <Button variant="outline" className="w-full">Zurück</Button>
                    </Link>
                  </>
                )}
                  </div>
                );
              })()}
              
              {/* Zwischenspeicher - unter den Buttons */}
              {selectedSaison && pendingMeldungen.length > 0 && (
                <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded">
                  <h4 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">📋 Zwischenspeicher ({pendingMeldungen.length})</h4>
                  <div className="space-y-2 mb-3">
                    {pendingMeldungen.map((pending, index) => {
                      const schuetze = schuetzen.find(s => s.id === pending.schuetzeId);
                      const disziplin = disziplinen.find(d => d.id === pending.disziplinId);
                      return (
                        <div key={index} className="flex justify-between items-center text-sm bg-white dark:bg-gray-800 p-2 rounded border">
                          <span className="text-gray-900 dark:text-gray-100">
                            {schuetze?.firstName && schuetze?.lastName 
                              ? `${schuetze.firstName} ${schuetze.lastName}`
                              : schuetze?.name || 'Unbekannt'
                            } - {disziplin?.spoNummer} {disziplin?.name}
                          </span>
                          <button 
                            onClick={() => setPendingMeldungen(prev => prev.filter((_, i) => i !== index))}
                            className="text-red-600 hover:text-red-800 text-xs px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-950/30"
                          >
                            ✕
                          </button>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button 
                      onClick={handleBulkSubmit}
                      disabled={isSubmitting || pendingMeldungen.length === 0}
                      className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
                    >
                      {isSubmitting ? 'Speichere...' : `${pendingMeldungen.length} Meldungen speichern`}
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => setPendingMeldungen([])}
                      className="w-full sm:w-auto"
                    >
                      Alle löschen
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function KMMeldungen() {
  return (
    <KMProvider>
      <KMMeldungenContent />
    </KMProvider>
  );
}
