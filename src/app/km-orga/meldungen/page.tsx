"use client";

import React, { useState, useEffect } from 'react';
import { logError, logInfo, logDebug } from '@/lib/utils/secure-logger';
import { getShooterClubId, berechneAltersklasse } from '@/lib/utils/altersklassen';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { NativeSelect } from '@/components/ui/native-select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { useKMAuth } from '@/hooks/useKMAuth';
import { KMMeldungenPDFExport } from '@/components/km/km-meldungen-pdf-export';

export default function KMAdminMeldungen() {
  const { toast } = useToast();
  const { hasFullAccess, loading: authLoading } = useKMAuth();
  const [meldungen, setMeldungen] = useState<any[]>([]);
  const [schuetzen, setSchuetzen] = useState<any[]>([]);
  const [disziplinen, setDisziplinen] = useState<any[]>([]);
  const [clubs, setClubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSaison, setSelectedSaison] = useState('');
  const [saisons, setSaisons] = useState<any[]>([]);
  const [filter, setFilter] = useState({ verein: '', disziplin: '', search: '' });
  const [showMeldungsDialog, setShowMeldungsDialog] = useState(false);
  const [meldungsForm, setMeldungsForm] = useState({
    vereinId: '',
    schuetzeIds: [] as string[],
    disziplinIds: [] as string[],
    vmErgebnis: '',
    lmTeilnahme: false,
    anmerkung: ''
  });
  const [schuetzenSearch, setSchuetzenSearch] = useState('');
  const [vereinSchuetzen, setVereinSchuetzen] = useState<any[]>([]);
  const [editingMeldung, setEditingMeldung] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>({});
  const [selectedMeldungen, setSelectedMeldungen] = useState<string[]>([]);
  const [showVerschiebenDialog, setShowVerschiebenDialog] = useState(false);
  const [zielSaison, setZielSaison] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    if (hasFullAccess && !authLoading) {
      loadSaisons();
    }
  }, [hasFullAccess, authLoading]);

  useEffect(() => {
    // Lade Daten nur wenn eine Saison ausgewählt ist (Pflichtfeld)
    if (selectedSaison && selectedSaison !== '' && saisons.length > 0) {
      loadData();
    }
  }, [selectedSaison, saisons]);

  const loadSaisons = async () => {
    try {
      const response = await fetch('/api/km/saisons');
      if (response.ok) {
        const data = await response.json();
        const saisonsList = data.data || [];
        
        // Sortiere Saisons: Neueste zuerst (LD 2026 > KKP 2026 > KK 2026)
        const sortedSaisons = saisonsList.sort((a, b) => {
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
        
        setSaisons(sortedSaisons);
        // Keine automatische Auswahl - Benutzer muss bewusst wählen
      }
    } catch (error) {
      logError('Fehler beim Laden der Saisons:', error);
    }
  };

  const loadData = async () => {
    try {
      const [meldungenRes, disziplinenRes, clubsRes] = await Promise.all([
        fetch(`/api/km/meldungen?saison=${selectedSaison}`),
        fetch('/api/km/disziplinen'),
        fetch('/api/clubs')
      ]);
      
      // Lade Schützen direkt aus Firebase
      const { getDocs, collection, query, orderBy } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase/config');
      
      const shootersSnapshot = await getDocs(query(collection(db, 'shooters'), orderBy('lastName', 'asc')));
      const allSchuetzen = shootersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setSchuetzen(allSchuetzen);
      
      if (meldungenRes.ok) {
        const data = await meldungenRes.json();
        setMeldungen(data.data || []);
      }

      if (disziplinenRes.ok) {
        const data = await disziplinenRes.json();
        setDisziplinen(data.data || []);
      }

      if (clubsRes.ok) {
        const data = await clubsRes.json();
        setClubs(data.data || []);
      }
    } catch (error) {
      toast({ title: 'Fehler', description: 'Daten konnten nicht geladen werden', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const loadVereinSchuetzen = async (vereinId: string) => {
    if (!vereinId) {
      setVereinSchuetzen([]);
      return;
    }
    
    try {
      // Filtere aus bereits geladenen Schützen
      const vereinsSchuetzen = schuetzen.filter(shooter => {
        return getShooterClubId(shooter) === vereinId;
      });
      setVereinSchuetzen(vereinsSchuetzen);
    } catch (error) {
      logError('Fehler beim Laden der Vereinsschützen:', error);
    }
  };

  const submitMeldung = async () => {
    if (!meldungsForm.vereinId || meldungsForm.schuetzeIds.length === 0 || meldungsForm.disziplinIds.length === 0) {
      toast({ title: 'Fehler', description: 'Bitte alle Pflichtfelder ausfüllen', variant: 'destructive' });
      return;
    }

    try {
      let meldungenCount = 0;
      let duplicateCount = 0;
      
      for (const schuetzeId of meldungsForm.schuetzeIds) {
        for (const disziplinId of meldungsForm.disziplinIds) {
          const meldungData = {
            schuetzeId,
            disziplinId,
            saisonId: selectedSaison,
            lmTeilnahme: meldungsForm.lmTeilnahme,
            anmerkung: meldungsForm.anmerkung,
            vmErgebnis: meldungsForm.vmErgebnis ? { ringe: parseInt(meldungsForm.vmErgebnis) } : null,
            status: 'gemeldet',
            meldedatum: new Date(),
            gemeldeteVon: 'km-orga'
          };

          const response = await fetch('/api/km/meldungen', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(meldungData)
          });

          if (response.ok) {
            meldungenCount++;
          } else if (response.status === 409) {
            duplicateCount++;
            logInfo('Duplikat erkannt:', { data: response.status });
          } else {
            logInfo('Anderer Fehler:', { data: response.status });
          }
        }
      }

      if (meldungenCount > 0 && duplicateCount === 0) {
        toast({ 
          title: 'Erfolg', 
          description: `${meldungenCount} Meldung(en) erfolgreich erstellt` 
        });
        setShowMeldungsDialog(false);
        setMeldungsForm({
          vereinId: '',
          schuetzeIds: [],
          disziplinIds: [],
          vmErgebnis: '',
          lmTeilnahme: false,
          anmerkung: ''
        });
        setVereinSchuetzen([]);
        setSchuetzenSearch('');
        loadData();
      } else if (duplicateCount > 0) {
        // Browser-Alert für sofortige Sichtbarkeit
        alert(`⚠️ Duplikat erkannt!\n\n${duplicateCount} Meldung(en) bereits vorhanden${meldungenCount > 0 ? `.\n${meldungenCount} neue Meldung(en) wurden erstellt` : ''}.`);
        
        // Zusätzlich Toast
        toast({ 
          title: '⚠️ Duplikat erkannt', 
          description: `${duplicateCount} Meldung(en) bereits vorhanden${meldungenCount > 0 ? `. ${meldungenCount} neue Meldung(en) erstellt` : ''}.`, 
          variant: 'destructive',
          duration: 5000
        });
        
        if (meldungenCount > 0) loadData();
        return;
      } else {
        toast({ 
          title: 'Fehler', 
          description: 'Keine Meldungen konnten erstellt werden', 
          variant: 'destructive' 
        });
        return;
      }
    } catch (error) {
      toast({ title: 'Fehler', description: 'Meldung konnte nicht erstellt werden', variant: 'destructive' });
    }
  };

  const updateMeldung = async (meldungId: string) => {
    try {
      const response = await fetch(`/api/km/meldungen/${meldungId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lmTeilnahme: editData.lmTeilnahme,
          vmErgebnis: editData.vmRinge ? { ringe: parseFloat(editData.vmRinge) } : null,
          anmerkung: editData.anmerkung || '',
          disziplinId: editData.disziplinId
        })
      });
      
      if (response.ok) {
        toast({ title: 'Erfolg', description: 'Meldung aktualisiert' });
        setEditingMeldung(null);
        setEditData({});
        loadData();
      }
    } catch (error) {
      toast({ title: 'Fehler', description: 'Update fehlgeschlagen', variant: 'destructive' });
    }
  };

  const deleteMeldung = async (meldungId: string) => {
    if (!confirm('Meldung wirklich löschen?')) return;
    
    try {
      const response = await fetch(`/api/km/meldungen/${meldungId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        toast({ title: 'Erfolg', description: 'Meldung gelöscht' });
        loadData();
      }
    } catch (error) {
      toast({ title: 'Fehler', description: 'Löschen fehlgeschlagen', variant: 'destructive' });
    }
  };

  const verschiebenMeldungen = async () => {
    if (selectedMeldungen.length === 0 || !zielSaison) {
      toast({ title: 'Fehler', description: 'Bitte Meldungen und Ziel-Saison auswählen', variant: 'destructive' });
      return;
    }

    try {
      // Bestimme Collection-Namen basierend auf Saison-Namen
      const aktuelleCollection = saisons.find(s => s.id === selectedSaison);
      const zielCollection = saisons.find(s => s.id === zielSaison);
      
      let vonCollectionName = selectedSaison;
      let nachCollectionName = zielSaison;
      
      // Spezielle Collection-Namen für 2026
      if (aktuelleCollection?.name?.includes('Luftdruckgewehr')) {
        vonCollectionName = 'km_meldungen_2026_ld';
      } else if (aktuelleCollection?.name?.includes('Kleinkaliber Pistole')) {
        vonCollectionName = 'km_meldungen_2026_kkp';
      } else if (aktuelleCollection?.name?.includes('Kleinkaliber')) {
        vonCollectionName = 'km_meldungen_2026_kk';
      }
      
      if (zielCollection?.name?.includes('Luftdruckgewehr')) {
        nachCollectionName = 'km_meldungen_2026_ld';
      } else if (zielCollection?.name?.includes('Kleinkaliber Pistole')) {
        nachCollectionName = 'km_meldungen_2026_kkp';
      } else if (zielCollection?.name?.includes('Kleinkaliber')) {
        nachCollectionName = 'km_meldungen_2026_kk';
      }
      
      const response = await fetch('/api/km/meldungen/verschieben', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meldungIds: selectedMeldungen,
          vonSaison: vonCollectionName,
          nachSaison: nachCollectionName
        })
      });

      if (response.ok) {
        const result = await response.json();
        toast({ 
          title: 'Erfolg', 
          description: `${result.verschoben} Meldungen erfolgreich verschoben` 
        });
        setSelectedMeldungen([]);
        setShowVerschiebenDialog(false);
        setZielSaison('');
        loadData();
      } else {
        throw new Error('Verschieben fehlgeschlagen');
      }
    } catch (error) {
      toast({ title: 'Fehler', description: 'Verschieben fehlgeschlagen', variant: 'destructive' });
    }
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const filteredMeldungen = meldungen.filter(meldung => {
    const schuetze = schuetzen.find(s => s.id === meldung.schuetzeId);
    const disziplin = disziplinen.find(d => d.id === meldung.disziplinId);
    const vereinId = getShooterClubId(schuetze);
    
    if (filter.verein && vereinId !== filter.verein) return false;
    if (filter.disziplin && meldung.disziplinId !== filter.disziplin) return false;
    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      const schuetzeName = schuetze?.firstName && schuetze?.lastName 
        ? `${schuetze.firstName} ${schuetze.lastName}` 
        : schuetze?.name || '';
      const verein = clubs.find(c => c.id === vereinId);
      
      if (!schuetzeName.toLowerCase().includes(searchLower) &&
          !disziplin?.name?.toLowerCase().includes(searchLower) &&
          !verein?.name?.toLowerCase().includes(searchLower)) {
        return false;
      }
    }
    return true;
  }).sort((a, b) => {
    if (!sortBy) return 0;
    
    const schuetzeA = schuetzen.find(s => s.id === a.schuetzeId);
    const schuetzeB = schuetzen.find(s => s.id === b.schuetzeId);
    const disziplinA = disziplinen.find(d => d.id === a.disziplinId);
    const disziplinB = disziplinen.find(d => d.id === b.disziplinId);
    const vereinIdA = getShooterClubId(schuetzeA);
    const vereinIdB = getShooterClubId(schuetzeB);
    const vereinA = clubs.find(c => c.id === vereinIdA);
    const vereinB = clubs.find(c => c.id === vereinIdB);
    
    let valueA = '';
    let valueB = '';
    
    switch (sortBy) {
      case 'schuetze':
        valueA = schuetzeA?.firstName && schuetzeA?.lastName ? `${schuetzeA.firstName} ${schuetzeA.lastName}` : schuetzeA?.name || '';
        valueB = schuetzeB?.firstName && schuetzeB?.lastName ? `${schuetzeB.firstName} ${schuetzeB.lastName}` : schuetzeB?.name || '';
        break;
      case 'verein':
        valueA = vereinA?.name || '';
        valueB = vereinB?.name || '';
        break;
      case 'disziplin':
        valueA = disziplinA?.name || '';
        valueB = disziplinB?.name || '';
        break;
      case 'lm':
        return sortOrder === 'asc' ? (a.lmTeilnahme ? 1 : -1) : (a.lmTeilnahme ? -1 : 1);
      default:
        return 0;
    }
    
    const comparison = valueA.localeCompare(valueB);
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  if (loading && selectedSaison) {
    return (
      <div className="container py-8 max-w-6xl mx-auto">
        <div className="flex flex-col items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-lg text-gray-600">Lade alle KM-Meldungen...</p>
        </div>
      </div>
    );
  }

  if (!hasFullAccess) {
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
      <div className="flex flex-col gap-6 mb-6">
        <div className="flex items-center gap-4">
          <Link href="/km-orga">
            <Button variant="outline">← Zurück</Button>
          </Link>
          <div>
            <h1 className="text-xl md:text-3xl font-bold text-primary">📋 KM-Meldungen</h1>
            <p className="text-sm md:text-base text-muted-foreground">Verwaltung aller Meldungen zur Kreismeisterschaft</p>
          </div>
        </div>
        
        <Card className="border-2 border-primary bg-primary/5">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div>
                <Label className="text-base font-semibold text-gray-800 dark:text-gray-200">🎯 Saison auswählen (Pflichtfeld)</Label>
                <select
                  value={selectedSaison}
                  onChange={(e) => setSelectedSaison(e.target.value)}
                  className="w-full mt-2 px-4 py-3 text-lg border-2 border-primary rounded-lg bg-white focus:ring-2 focus:ring-primary focus:border-primary"
                  required
                >
                  <option value="">🔽 Bitte Saison wählen...</option>
                  {saisons.map(saison => (
                    <option key={saison.id} value={saison.id}>
                      {saison.name}
                    </option>
                  ))}
                </select>
              </div>
              
              {selectedSaison && (
                <Button onClick={() => {
                  logDebug('Button clicked, setting dialog to true');
                  setShowMeldungsDialog(true);
                }} className="w-full h-12">
                  <Plus className="h-4 w-4 mr-2" />
                  Meldung für Verein erstellen
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {!selectedSaison && (
        <Card className="mb-6 border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="text-center py-4">
              <p className="text-orange-800 font-medium mb-2">⚠️ Bitte wählen Sie zuerst eine Saison aus</p>
              <p className="text-sm text-orange-600">Die Listen werden erst nach der Saisonauswahl angezeigt, um Fehlmeldungen zu vermeiden.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedSaison && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filter</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-3 md:grid md:grid-cols-3 md:gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Verein</label>
                  <select
                    value={filter.verein}
                    onChange={(e) => setFilter(prev => ({ ...prev, verein: e.target.value }))}
                    className="w-full p-2 border border-gray-300 rounded text-sm"
                  >
                    <option value="">Alle Vereine</option>
                    {clubs.map(club => {
                      const hatMeldungen = meldungen.some(m => {
                        const schuetze = schuetzen.find(s => s.id === m.schuetzeId);
                        const vereinId = getShooterClubId(schuetze);
                        return vereinId === club.id;
                      });
                      return (
                        <option 
                          key={club.id} 
                          value={club.id}
                          className={hatMeldungen ? 'font-bold bg-green-50' : ''}
                        >
                          {hatMeldungen ? '✅ ' : ''}{club.name}
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Disziplin</label>
                  <select
                    value={filter.disziplin}
                    onChange={(e) => setFilter(prev => ({ ...prev, disziplin: e.target.value }))}
                    className="w-full p-2 border border-gray-300 rounded text-sm"
                  >
                    <option value="">Alle Disziplinen</option>
                    {disziplinen.map(disziplin => {
                      const hatMeldungen = meldungen.some(m => m.disziplinId === disziplin.id);
                      return (
                        <option 
                          key={disziplin.id} 
                          value={disziplin.id}
                          className={hatMeldungen ? 'font-bold bg-green-50' : ''}
                        >
                          {hatMeldungen ? '✅ ' : ''}{disziplin.spoNummer} - {disziplin.name}
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Suche</label>
                  <input
                    type="text"
                    value={filter.search}
                    onChange={(e) => setFilter(prev => ({ ...prev, search: e.target.value }))}
                    placeholder="Name, Disziplin, Verein..."
                    className="w-full p-2 border border-gray-300 rounded text-sm"
                  />
                </div>
              </div>
            </div>
            <div className="mt-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-col gap-2 md:flex-row md:items-center">
                <Button 
                  variant="outline" 
                  onClick={() => setFilter({ verein: '', disziplin: '', search: '' })}
                  className="w-full h-12 md:w-auto md:h-auto"
                >
                  🔄 Filter zurücksetzen
                </Button>
                
                <KMMeldungenPDFExport
                  meldungen={filteredMeldungen}
                  disziplinen={disziplinen}
                  schuetzen={schuetzen}
                  vereine={clubs}
                  saisonName={saisons.find(s => s.id === selectedSaison)?.name || 'KM'}
                  className="w-full h-12 md:w-auto md:h-auto"
                />
              </div>
              
              {selectedMeldungen.length > 0 && (
                <div className="flex flex-col gap-2 md:flex-row md:items-center">
                  <span className="text-sm font-medium">
                    {selectedMeldungen.length} ausgewählt
                  </span>
                  <Button 
                    onClick={() => setShowVerschiebenDialog(true)}
                    className="w-full h-12 md:w-auto md:h-auto"
                  >
                    🚚 Verschieben nach...
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => setSelectedMeldungen([])}
                    className="w-full h-12 md:w-auto md:h-auto"
                  >
                    ✖️ Auswahl aufheben
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {selectedSaison && (
        <Card>
          <CardHeader>
            <CardTitle>Meldungen ({filteredMeldungen.length})</CardTitle>
          </CardHeader>
          <CardContent>
          {/* Mobile Card Layout */}
          <div className="block md:hidden space-y-4">
            {filteredMeldungen.map(meldung => {
              const schuetze = schuetzen.find(s => s.id === meldung.schuetzeId);
              const disziplin = disziplinen.find(d => d.id === meldung.disziplinId);
              const vereinId = getShooterClubId(schuetze);
              const verein = clubs.find(c => c.id === vereinId);

              return (
                <Card key={meldung.id} className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">
                        {schuetze?.firstName && schuetze?.lastName 
                          ? `${schuetze.firstName} ${schuetze.lastName}`
                          : schuetze?.name || 'Unbekannt'
                        }
                      </h3>
                      <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                        {(() => {
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
                            if (age <= 50) return 'Senioren 0';
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
                        })()
                        }
                      </span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div><span className="font-medium">Verein:</span> {verein?.name || 'Unbekannt'}</div>
                        <div>
                          <span className="font-medium">Disziplin:</span> 
                          {editingMeldung === meldung.id ? (
                            <select
                              value={editData.disziplinId || meldung.disziplinId}
                              onChange={(e) => setEditData(prev => ({...prev, disziplinId: e.target.value}))}
                              className="w-full p-1 border rounded text-sm mt-1"
                            >
                              {disziplinen.map(d => (
                                <option key={d.id} value={d.id}>
                                  {d.spoNummer} - {d.name}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <>
                              {disziplin?.spoNummer}
                              <div className="text-xs text-gray-500">{disziplin?.name}</div>
                            </>
                          )}
                        </div>
                      <div className="flex items-center gap-4">
                        <div>
                          <span className="font-medium">LM:</span>
                          {editingMeldung === meldung.id ? (
                            <input
                              type="checkbox"
                              checked={editData.lmTeilnahme || false}
                              onChange={(e) => setEditData(prev => ({...prev, lmTeilnahme: e.target.checked}))}
                              className="w-4 h-4 ml-2"
                            />
                          ) : (
                            <span className={`ml-2 px-2 py-1 rounded text-xs ${
                              meldung.lmTeilnahme 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-gray-100 text-gray-700'
                            }`}>
                              {meldung.lmTeilnahme ? 'Ja' : 'Nein'}
                            </span>
                          )}
                        </div>
                        <div>
                          <span className="font-medium">VM:</span>
                          {editingMeldung === meldung.id ? (
                            <input
                              type="number"
                              step="0.1"
                              value={editData.vmRinge || ''}
                              onChange={(e) => setEditData(prev => ({...prev, vmRinge: e.target.value}))}
                              className="w-20 p-1 border rounded text-sm ml-2"
                              placeholder="Ringe"
                            />
                          ) : (
                            meldung.vmErgebnis?.ringe ? (
                              <span className="text-green-600 font-medium ml-2">
                                {meldung.vmErgebnis.ringe}
                              </span>
                            ) : (
                              <span className="text-gray-400 ml-2">-</span>
                            )
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        Datum: {(() => {
                          if (meldung.meldedatum?._seconds) {
                            return new Date(meldung.meldedatum._seconds * 1000).toLocaleDateString('de-DE');
                          } else if (meldung.meldedatum?.seconds) {
                            return new Date(meldung.meldedatum.seconds * 1000).toLocaleDateString('de-DE');
                          } else if (meldung.createdAt?._seconds) {
                            return new Date(meldung.createdAt._seconds * 1000).toLocaleDateString('de-DE');
                          } else if (meldung.createdAt?.seconds) {
                            return new Date(meldung.createdAt.seconds * 1000).toLocaleDateString('de-DE');
                          }
                          return new Date().toLocaleDateString('de-DE');
                        })()}
                      </div>
                    </div>
                    {meldung.anmerkung && (
                      <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded border">
                        <strong>Anmerkung:</strong> {meldung.anmerkung}
                      </div>
                    )}
                    <div className="flex flex-col gap-2 pt-2">
                      {editingMeldung === meldung.id ? (
                        <>
                          <button 
                            onClick={() => updateMeldung(meldung.id)}
                            className="w-full text-green-600 hover:text-green-800 text-sm px-3 py-3 border border-green-300 rounded font-medium"
                          >
                            ✓ Speichern
                          </button>
                          <button 
                            onClick={() => {
                              setEditingMeldung(null);
                              setEditData({});
                            }}
                            className="w-full text-gray-600 hover:text-gray-800 text-sm px-3 py-3 border border-gray-300 rounded font-medium"
                          >
                            ✕ Abbrechen
                          </button>
                        </>
                      ) : (
                        <>
                          <button 
                            onClick={() => {
                              setEditingMeldung(meldung.id);
                              setEditData({
                                lmTeilnahme: meldung.lmTeilnahme,
                                vmRinge: meldung.vmErgebnis?.ringe || '',
                                anmerkung: meldung.anmerkung || '',
                                disziplinId: meldung.disziplinId
                              });
                            }}
                            className="w-full text-blue-600 hover:text-blue-800 text-sm px-3 py-3 border border-blue-300 rounded font-medium"
                          >
                            ✏️ Bearbeiten
                          </button>
                          <button 
                            onClick={() => deleteMeldung(meldung.id)}
                            className="w-full text-red-600 hover:text-red-800 text-sm px-3 py-3 border border-red-300 rounded font-medium"
                          >
                            🗑️ Löschen
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
            {filteredMeldungen.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Keine Meldungen gefunden
              </div>
            )}
          </div>
          
          {/* Desktop Table Layout */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="p-2 text-left">
                    <Checkbox 
                      checked={selectedMeldungen.length === filteredMeldungen.length && filteredMeldungen.length > 0}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedMeldungen(filteredMeldungen.map(m => m.id));
                        } else {
                          setSelectedMeldungen([]);
                        }
                      }}
                    />
                  </th>
                  <th className="p-2 text-left cursor-pointer hover:bg-gray-100" onClick={() => handleSort('schuetze')}>Schütze {sortBy === 'schuetze' && (sortOrder === 'asc' ? '↑' : '↓')}</th>
                  <th className="p-2 text-left cursor-pointer hover:bg-gray-100" onClick={() => handleSort('verein')}>Verein {sortBy === 'verein' && (sortOrder === 'asc' ? '↑' : '↓')}</th>
                  <th className="p-2 text-left cursor-pointer hover:bg-gray-100" onClick={() => handleSort('disziplin')}>Disziplin {sortBy === 'disziplin' && (sortOrder === 'asc' ? '↑' : '↓')}</th>
                  <th className="p-2 text-left cursor-pointer hover:bg-gray-100" onClick={() => handleSort('klasse')}>Klasse {sortBy === 'klasse' && (sortOrder === 'asc' ? '↑' : '↓')}</th>
                  <th className="p-2 text-left cursor-pointer hover:bg-gray-100" onClick={() => handleSort('lm')}>LM {sortBy === 'lm' && (sortOrder === 'asc' ? '↑' : '↓')}</th>
                  <th className="p-2 text-left">VM</th>
                  <th className="p-2 text-left">Datum</th>
                  <th className="p-2 text-left">Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {filteredMeldungen.map(meldung => {
                  const schuetze = schuetzen.find(s => s.id === meldung.schuetzeId);
                  const disziplin = disziplinen.find(d => d.id === meldung.disziplinId);
                  const vereinId = getShooterClubId(schuetze);
                  const verein = clubs.find(c => c.id === vereinId);

                  return (
                    <tr key={meldung.id} className="border-b hover:bg-gray-50">
                      <td className="p-2">
                        <Checkbox 
                          checked={selectedMeldungen.includes(meldung.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedMeldungen(prev => [...prev, meldung.id]);
                            } else {
                              setSelectedMeldungen(prev => prev.filter(id => id !== meldung.id));
                            }
                          }}
                        />
                      </td>
                      <td className="p-2 font-medium">
                        <div className="flex items-center gap-2">
                          {schuetze?.firstName && schuetze?.lastName 
                            ? `${schuetze.firstName} ${schuetze.lastName}`
                            : schuetze?.name || 'Unbekannt'
                          }
                          {meldung.anmerkung && (
                            <div className="relative group">
                              <span className="text-blue-500 cursor-help text-sm">ℹ️</span>
                              <div className="absolute bottom-full right-0 mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 max-w-xs">
                                {meldung.anmerkung}
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-2">{verein?.name || 'Unbekannt'}</td>
                      <td className="p-2">
                        {editingMeldung === meldung.id ? (
                          <select
                            value={editData.disziplinId || meldung.disziplinId}
                            onChange={(e) => setEditData(prev => ({...prev, disziplinId: e.target.value}))}
                            className="w-full p-1 border rounded text-sm"
                          >
                            {disziplinen.map(d => (
                              <option key={d.id} value={d.id}>
                                {d.spoNummer} - {d.name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <div>
                            <span className="font-medium">{disziplin?.spoNummer}</span>
                            <div className="text-xs text-gray-500">{disziplin?.name}</div>
                          </div>
                        )}
                      </td>
                      <td className="p-2">
                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                          {(() => {
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
                          })()
                          }
                        </span>
                      </td>
                      <td className="p-2">
                        {editingMeldung === meldung.id ? (
                          <input
                            type="checkbox"
                            checked={editData.lmTeilnahme || false}
                            onChange={(e) => setEditData(prev => ({...prev, lmTeilnahme: e.target.checked}))}
                            className="w-4 h-4"
                          />
                        ) : (
                          <span className={`px-2 py-1 rounded text-xs ${
                            meldung.lmTeilnahme 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {meldung.lmTeilnahme ? 'Ja' : 'Nein'}
                          </span>
                        )}
                      </td>
                      <td className="p-2">
                        {editingMeldung === meldung.id ? (
                          <input
                            type="number"
                            step="0.1"
                            value={editData.vmRinge || ''}
                            onChange={(e) => setEditData(prev => ({...prev, vmRinge: e.target.value}))}
                            className="w-20 p-1 border rounded text-sm"
                            placeholder="Ringe"
                          />
                        ) : (
                          meldung.vmErgebnis?.ringe ? (
                            <span className="text-green-600 font-medium">
                              {meldung.vmErgebnis.ringe}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )
                        )}
                      </td>
                      <td className="p-2 text-xs text-gray-500">
                        {(() => {
                          if (meldung.meldedatum?._seconds) {
                            return new Date(meldung.meldedatum._seconds * 1000).toLocaleDateString('de-DE');
                          } else if (meldung.meldedatum?.seconds) {
                            return new Date(meldung.meldedatum.seconds * 1000).toLocaleDateString('de-DE');
                          } else if (meldung.createdAt?._seconds) {
                            return new Date(meldung.createdAt._seconds * 1000).toLocaleDateString('de-DE');
                          } else if (meldung.createdAt?.seconds) {
                            return new Date(meldung.createdAt.seconds * 1000).toLocaleDateString('de-DE');
                          }
                          return new Date().toLocaleDateString('de-DE');
                        })()}
                      </td>
                      <td className="p-2">
                        <div className="flex gap-1">
                          {editingMeldung === meldung.id ? (
                            <>
                              <button 
                                onClick={() => updateMeldung(meldung.id)}
                                className="text-green-600 hover:text-green-800 text-xs px-2 py-1 border border-green-300 rounded"
                              >
                                ✓
                              </button>
                              <button 
                                onClick={() => {
                                  setEditingMeldung(null);
                                  setEditData({});
                                }}
                                className="text-gray-600 hover:text-gray-800 text-xs px-2 py-1 border border-gray-300 rounded"
                              >
                                ✕
                              </button>
                            </>
                          ) : (
                            <>
                              <button 
                                onClick={() => {
                                  setEditingMeldung(meldung.id);
                                  setEditData({
                                    lmTeilnahme: meldung.lmTeilnahme,
                                    vmRinge: meldung.vmErgebnis?.ringe || '',
                                    anmerkung: meldung.anmerkung || '',
                                    disziplinId: meldung.disziplinId
                                  });
                                }}
                                className="text-blue-600 hover:text-blue-800 text-xs px-2 py-1 border border-blue-300 rounded"
                              >
                                ✏️
                              </button>
                              <button 
                                onClick={() => deleteMeldung(meldung.id)}
                                className="text-red-600 hover:text-red-800 text-xs px-2 py-1 border border-red-300 rounded"
                              >
                                🗑️
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            {filteredMeldungen.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Keine Meldungen gefunden
              </div>
            )}
          </div>
        </CardContent>
        </Card>
      )}

      {/* Meldungs-Dialog */}
      <Dialog open={showMeldungsDialog} onOpenChange={(open) => {
        logDebug('Dialog onOpenChange:', open);
        setShowMeldungsDialog(open);
      }}>
        <DialogContent className="max-w-2xl mx-auto">
          <DialogHeader>
            <DialogTitle>📋 Neue Meldung für Verein erstellen</DialogTitle>
            <DialogDescription>
              Erstellen Sie eine neue KM-Meldung für einen Schützen aus einem Verein.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Verein auswählen *</Label>
              <NativeSelect
                value={meldungsForm.vereinId} 
                onValueChange={(value) => {
                  setMeldungsForm(prev => ({ ...prev, vereinId: value, schuetzeIds: [] }));
                  loadVereinSchuetzen(value);
                  setSchuetzenSearch('');
                }}
                placeholder="Verein wählen..."
                options={clubs.map(club => ({ value: club.id, label: club.name }))}
              />
            </div>

            {meldungsForm.vereinId && (
              <div>
                <Label>Schützen auswählen * ({meldungsForm.schuetzeIds.length} ausgewählt)</Label>
                <Input 
                  placeholder="Schützen suchen..."
                  value={schuetzenSearch}
                  onChange={(e) => setSchuetzenSearch(e.target.value)}
                  className="mb-2"
                />
                <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto border rounded p-2">
                  {vereinSchuetzen
                    .filter(schuetze => {
                      const name = schuetze.firstName && schuetze.lastName 
                        ? `${schuetze.firstName} ${schuetze.lastName}` 
                        : schuetze.name || '';
                      return name.toLowerCase().includes(schuetzenSearch.toLowerCase());
                    })
                    .map(schuetze => (
                    <div key={schuetze.id} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`schuetze-${schuetze.id}`}
                        checked={meldungsForm.schuetzeIds.includes(schuetze.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setMeldungsForm(prev => ({
                              ...prev,
                              schuetzeIds: [...prev.schuetzeIds, schuetze.id]
                            }));
                          } else {
                            setMeldungsForm(prev => ({
                              ...prev,
                              schuetzeIds: prev.schuetzeIds.filter(id => id !== schuetze.id)
                            }));
                          }
                        }}
                      />
                      <Label htmlFor={`schuetze-${schuetze.id}`} className="text-sm">
                        {schuetze.firstName && schuetze.lastName 
                          ? `${schuetze.firstName} ${schuetze.lastName}` 
                          : schuetze.name
                        }
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <Label>Disziplinen auswählen *</Label>
              <div className="grid grid-cols-2 gap-2 mt-2 max-h-40 overflow-y-auto border rounded p-2">
                {disziplinen.map(disziplin => (
                  <div key={disziplin.id} className="flex items-center space-x-2">
                    <Checkbox 
                      id={disziplin.id}
                      checked={meldungsForm.disziplinIds.includes(disziplin.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setMeldungsForm(prev => ({
                            ...prev,
                            disziplinIds: [...prev.disziplinIds, disziplin.id]
                          }));
                        } else {
                          setMeldungsForm(prev => ({
                            ...prev,
                            disziplinIds: prev.disziplinIds.filter(id => id !== disziplin.id)
                          }));
                        }
                      }}
                    />
                    <Label htmlFor={disziplin.id} className="text-sm">
                      {disziplin.spoNummer} - {disziplin.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>VM-Ergebnis (Ringe)</Label>
                <Input 
                  type="number"
                  placeholder="z.B. 385"
                  value={meldungsForm.vmErgebnis}
                  onChange={(e) => setMeldungsForm(prev => ({ ...prev, vmErgebnis: e.target.value }))}
                />
              </div>
              <div className="flex items-center space-x-2 mt-6">
                <Checkbox 
                  id="lmTeilnahme"
                  checked={meldungsForm.lmTeilnahme}
                  onCheckedChange={(checked) => setMeldungsForm(prev => ({ ...prev, lmTeilnahme: !!checked }))}
                />
                <Label htmlFor="lmTeilnahme">LM-Teilnahme</Label>
              </div>
            </div>

            <div>
              <Label>Anmerkungen</Label>
              <Input 
                placeholder="z.B. 'Max Mustermann und Peter Schmidt teilen sich ein Gewehr' oder 'Verein hat nur 2 Luftgewehre'"
                value={meldungsForm.anmerkung}
                onChange={(e) => setMeldungsForm(prev => ({ ...prev, anmerkung: e.target.value }))}
              />
              <div className="text-xs text-gray-500 mt-1">
                💡 Gewehr-Sharing: Bitte beide Namen nennen oder Vereins-Geräteanzahl angeben
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-4 md:flex-row md:justify-end">
              <Button variant="outline" onClick={() => setShowMeldungsDialog(false)} className="w-full h-12 md:w-auto md:h-auto">
                ✕ Abbrechen
              </Button>
              <Button onClick={submitMeldung} className="w-full h-12 md:w-auto md:h-auto">
                ✓ Meldung erstellen
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Verschieben-Dialog */}
      <Dialog open={showVerschiebenDialog} onOpenChange={setShowVerschiebenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>🚚 Meldungen verschieben</DialogTitle>
            <DialogDescription>
              {selectedMeldungen.length} Meldungen in eine andere Saison verschieben.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Ziel-Saison auswählen *</Label>
              <select
                value={zielSaison}
                onChange={(e) => setZielSaison(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded mt-1"
              >
                <option value="">Saison wählen...</option>
                {saisons
                  .filter(s => s.id !== selectedSaison)
                  .map(saison => (
                    <option key={saison.id} value={saison.id}>
                      {saison.name} ({saison.disziplinTyp || 'Alle Disziplinen'})
                    </option>
                  ))
                }
              </select>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
              <p className="text-sm text-yellow-800">
                ⚠️ <strong>Achtung:</strong> Die Meldungen werden aus der aktuellen Saison entfernt und in die Ziel-Saison kopiert. Diese Aktion kann nicht rückgängig gemacht werden.
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-4 md:flex-row md:justify-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowVerschiebenDialog(false);
                  setZielSaison('');
                }}
                className="w-full h-12 md:w-auto md:h-auto"
              >
                ✖️ Abbrechen
              </Button>
              <Button 
                onClick={verschiebenMeldungen}
                disabled={!zielSaison}
                className="w-full h-12 md:w-auto md:h-auto"
              >
                🚚 {selectedMeldungen.length} Meldungen verschieben
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
