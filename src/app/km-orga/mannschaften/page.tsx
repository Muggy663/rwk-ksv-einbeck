"use client";

import React, { useState, useEffect } from 'react';
import { logError, logWarn, logInfo, logDebug } from '@/lib/utils/secure-logger';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { ArrowLeft, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useKMAuth } from '@/hooks/useKMAuth';
import { MannschaftsbildungService } from '@/lib/services/mannschaftsbildung-service';

export default function KMAdminMannschaften() {
  const { toast } = useToast();
  const { hasFullAccess, loading: authLoading } = useKMAuth();
  const [mannschaften, setMannschaften] = useState<any[]>([]);
  const [schuetzen, setSchuetzen] = useState<any[]>([]);
  const [disziplinen, setDisziplinen] = useState<any[]>([]);
  const [clubs, setClubs] = useState<any[]>([]);
  const [meldungen, setMeldungen] = useState<any[]>([]);
  const [altersklassen, setAltersklassen] = useState<any[]>([]);
  const [mannschaftsregeln, setMannschaftsregeln] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [editingTeam, setEditingTeam] = useState<string | null>(null);
  const [filter, setFilter] = useState({ verein: '', disziplin: '' });
  const [saisons, setSaisons] = useState<any[]>([]);
  const [selectedSaison, setSelectedSaison] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createForm, setCreateForm] = useState({
    vereinId: '',
    disziplinId: '',
    schuetzenIds: [] as string[]
  });

  useEffect(() => {
    if (hasFullAccess && !authLoading) {
      loadSaisons();
    }
  }, [hasFullAccess, authLoading]);

  useEffect(() => {
    if (selectedSaison && selectedSaison !== '') {
      loadData();
    } else {
      setLoading(false);
    }
  }, [selectedSaison]);

  const loadSaisons = async () => {
    try {
      const response = await fetch('/api/km/saisons');
      if (response.ok) {
        const data = await response.json();
        const saisonsList = data.data || [];
        setSaisons(saisonsList);
      }
    } catch (error) {
      logError('Fehler beim Laden der Saisons:', error);
    }
  };

  const loadMannschaftsregeln = () => {
    const regeln = {
      "lg_auflage_senioren": {
        mannschaften: [
          { name: "Senioren 0 gemischt", erlaubteKlassen: ["Senioren 0", "Seniorinnen 0"] },
          { name: "Senioren I-II gemischt", erlaubteKlassen: ["Senioren I männl.", "Senioren I weibl.", "Senioren II männl.", "Senioren II weibl."] },
          { name: "Senioren III-V gemischt", erlaubteKlassen: ["Senioren III männl.", "Senioren III weibl.", "Senioren IV männl.", "Senioren IV weibl.", "Senioren V männl.", "Senioren V weibl."] }
        ]
      }
    };
    setMannschaftsregeln(regeln);
  };

  const getAltersklasseForSchuetze = (schuetze: any, disziplin: any) => {
    if (!schuetze?.birthYear || !schuetze?.gender) return 'Unbekannt';
    
    const age = 2026 - schuetze.birthYear;
    const isAuflage = disziplin?.name?.toLowerCase().includes('auflage');
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

  const checkMannschaftsregeln = (teamSchuetzen: any[], disziplin: any) => {
    const klassen = teamSchuetzen.map(s => getAltersklasseForSchuetze(s, disziplin));
    const uniqueKlassen = [...new Set(klassen)];
    
    // Luftpistole: Alle Herren/Damen-Klassen müssen gleich sein
    if (disziplin?.name?.toLowerCase().includes('luftpistole') && !disziplin?.name?.toLowerCase().includes('auflage')) {
      const herrenKlassen = uniqueKlassen.filter(k => k.includes('Herren'));
      const damenKlassen = uniqueKlassen.filter(k => k.includes('Damen'));
      
      if (herrenKlassen.length > 1 || damenKlassen.length > 1) {
        return { valid: false, message: '❌ Luftpistole: Herren/Damen-Klassen müssen jeweils einzeln sein (z.B. nur Herren I oder nur Damen II)' };
      }
    }
    
    return { valid: true, message: '' };
  };

  const calculateWettkampfklassen = (teamSchuetzen: any[], disziplinId: string) => {
    const disziplin = disziplinen.find(d => d.id === disziplinId);
    return teamSchuetzen.map(schuetze => getAltersklasseForSchuetze(schuetze, disziplin));
  };

  const loadData = async () => {
    if (!selectedSaison) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      // Lade Schützen direkt aus Firebase
      const { getDocs, collection, query, orderBy } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase/config');
      
      const [mannschaftenRes, shootersSnapshot, disziplinenRes, clubsRes, meldungenRes, altersklassenRes] = await Promise.all([
        fetch(`/api/km/mannschaften?saison=${selectedSaison}`),
        getDocs(query(collection(db, 'shooters'), orderBy('lastName', 'asc'))),
        fetch('/api/km/disziplinen'),
        fetch('/api/clubs'),
        fetch(`/api/km/meldungen?saison=${selectedSaison}`),
        fetch('/api/km/altersklassen')
      ]);
      
      const schuetzenData = shootersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      if (mannschaftenRes.ok) {
        const data = await mannschaftenRes.json();
        setMannschaften(data.data || []);
      }

      setSchuetzen(schuetzenData);

      if (disziplinenRes.ok) {
        const data = await disziplinenRes.json();
        setDisziplinen(data.data || []);
      }

      if (clubsRes.ok) {
        const data = await clubsRes.json();
        setClubs(data.data || []);
      }

      if (altersklassenRes.ok) {
        const data = await altersklassenRes.json();
        setAltersklassen(data.data || []);
      }

      if (meldungenRes.ok) {
        const data = await meldungenRes.json();
        setMeldungen(data.data || []);
      }

      loadMannschaftsregeln();
    } catch (error) {
      toast({ title: 'Fehler', description: 'Daten konnten nicht geladen werden', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const filteredMannschaften = mannschaften.filter(mannschaft => {
    if (filter.verein && mannschaft.vereinId !== filter.verein) return false;
    if (filter.disziplin && mannschaft.disziplinId !== filter.disziplin) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="container py-8 max-w-6xl mx-auto">
        <div className="flex flex-col items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-lg text-gray-600">Lade alle KM-Mannschaften...</p>
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
    <div className="container py-8 max-w-7xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/km-orga">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-primary">🏆 Alle KM-Mannschaften</h1>
          <p className="text-muted-foreground">Verwaltung aller Teams für die Kreismeisterschaft</p>
        </div>
      </div>

      <Card className="border-2 border-primary bg-primary/5 mb-6">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div>
              <label className="text-base font-semibold text-gray-800 dark:text-gray-200">🎯 Saison auswählen (Pflichtfeld)</label>
              <select
                value={selectedSaison}
                onChange={(e) => {
                  setSelectedSaison(e.target.value);
                  if (e.target.value) {
                    setLoading(true);
                  }
                }}
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
          </div>
        </CardContent>
      </Card>

      {!selectedSaison && (
        <Card className="mb-6 border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="text-center py-4">
              <p className="text-orange-800 font-medium mb-2">⚠️ Bitte wählen Sie zuerst eine Saison aus</p>
              <p className="text-sm text-orange-600">Die Mannschaften werden erst nach der Saisonauswahl angezeigt.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedSaison && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Mannschaften</CardTitle>
                <CardDescription>
                  Teams mit echten Altersklassen und Mannschaftsregeln
                </CardDescription>
              </CardHeader>
              <CardContent>
                {mannschaften.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-600">
                      {mannschaften.length} Mannschaften für {saisons.find(s => s.id === selectedSaison)?.name || 'diese Saison'}
                    </p>
                  </div>
                )}

                <div className="space-y-4">
                  {filteredMannschaften.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      {mannschaften.length === 0 
                        ? `Keine Mannschaften für ${saisons.find(s => s.id === selectedSaison)?.name || 'diese Saison'} vorhanden.`
                        : 'Keine Mannschaften für die gewählten Filter gefunden.'
                      }
                    </div>
                  ) : (
                    filteredMannschaften.map(mannschaft => {
                      const verein = clubs.find(c => c.id === mannschaft.vereinId);
                      const disziplin = disziplinen.find(d => d.id === mannschaft.disziplinId);
                      const teamSchuetzen = mannschaft.schuetzenIds.map(id => 
                        schuetzen.find(s => s.id === id)
                      ).filter(Boolean);

                      return (
                        <div key={mannschaft.id} className="p-4 border rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h3 className="font-semibold">
                                {verein?.name} - {disziplin?.name}
                              </h3>
                              <div className="text-sm text-gray-600">
                                {(() => {
                                  const berechnet = calculateWettkampfklassen(teamSchuetzen, mannschaft.disziplinId);
                                  const unique = [...new Set(berechnet.filter(k => k !== 'Unbekannt'))];
                                  const regelCheck = checkMannschaftsregeln(teamSchuetzen, disziplin);
                                  
                                  return (
                                    <>
                                      <div>{unique.length > 0 ? unique.join(', ') : 'Gemischte Klassen'}</div>
                                      {!regelCheck.valid && (
                                        <div className="mt-1 text-red-600 text-xs font-medium">
                                          {regelCheck.message}
                                        </div>
                                      )}
                                    </>
                                  );
                                })()}
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2">
                            {teamSchuetzen.map((schuetze) => (
                              <div key={schuetze?.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                <div>
                                  <span>
                                    {schuetze?.firstName && schuetze?.lastName 
                                      ? `${schuetze.firstName} ${schuetze.lastName}`
                                      : schuetze?.name || 'Unbekannt'
                                    } ({schuetze?.birthYear}, {schuetze?.gender === 'male' ? 'm' : schuetze?.gender === 'female' ? 'w' : '?'})
                                  </span>
                                  <div className="text-xs text-blue-600">
                                    AK: {getAltersklasseForSchuetze(schuetze, disziplin)}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>📊 Statistiken</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{mannschaften.length}</div>
                    <div className="text-sm text-blue-600">Mannschaften gesamt</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {clubs.filter(c => mannschaften.some(m => m.vereinId === c.id)).length}
                    </div>
                    <div className="text-sm text-green-600">Vereine mit Teams</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}