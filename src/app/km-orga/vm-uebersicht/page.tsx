"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trophy, AlertTriangle, CheckCircle, Filter, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { validateQualifications } from '@/lib/services/startlisten-ki-service';

interface VMMeldung {
  id: string;
  schuetzeName: string;
  verein: string;
  disziplin: string;
  vmErgebnis?: {
    ringe: number;
    datum: string;
    bemerkung: string;
  };
  lmTeilnahme: boolean;
  nurVereinsmeisterschaft: boolean;
  qualifikationStatus?: 'ok' | 'fraglich' | 'fehlt';
}

export default function VMUebersichtPage() {
  const { toast } = useToast();
  const [meldungen, setMeldungen] = useState<VMMeldung[]>([]);
  const [filteredMeldungen, setFilteredMeldungen] = useState<VMMeldung[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDisziplin, setSelectedDisziplin] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [disziplinen, setDisziplinen] = useState<string[]>([]);

  // Qualifikationslimits 2025 (für LM 2026)
  const qualifikationsLimits = {
    '10m Luftgewehr Herren I': 375.1,
    '10m Luftgewehr Damen I': 374.7,
    '10m Luftgewehr Herren II': 372.5,
    '10m Luftgewehr Damen II': 370.7,
    '10m Luftgewehr Herren III': 371.4,
    '10m Luftgewehr Damen III': 365.3,
    '10m Luftgewehr Auflage Senioren I': 309.3,
    '10m Luftgewehr Auflage Seniorinnen I': 308.9,
    'KK - 3x20 Herren I': 502,
    'KK - 3x20 Damen I': 498,
    'KK - 3x20 Herren II': 477,
    'KK - 3x20 Damen II': 475,
    '50m KK Auflage Senioren I': 298.2,
    '50m KK Auflage Seniorinnen I': 297.5,
    '10m Luftpistole Herren I': 352,
    '10m Luftpistole Damen I': 347,
    '10m Luftpistole Herren II': 348,
    '10m Luftpistole Damen II': 344,
    '10m Luftpistole Auflage Senioren I': 289.5,
    '10m Luftpistole Auflage Seniorinnen I': 288.1
  };

  useEffect(() => {
    loadVMMeldungen();
  }, []);

  useEffect(() => {
    filterMeldungen();
  }, [meldungen, selectedDisziplin, selectedStatus]);

  const loadVMMeldungen = async () => {
    try {
      // Lade Meldungen, Schützen und Disziplinen
      const [meldungenRes, schuetzenRes, disziplinenRes, clubsRes] = await Promise.all([
        fetch('/api/km/meldungen'),
        fetch('/api/km/shooters'),
        fetch('/api/km/disziplinen'),
        fetch('/api/clubs')
      ]);
      
      if (meldungenRes.ok && schuetzenRes.ok && disziplinenRes.ok && clubsRes.ok) {
        const [meldungenData, schuetzenData, disziplinenData, clubsData] = await Promise.all([
          meldungenRes.json(),
          schuetzenRes.json(),
          disziplinenRes.json(),
          clubsRes.json()
        ]);
        
        // Maps erstellen
        const schuetzenMap = new Map();
        schuetzenData.data?.forEach((s: any) => schuetzenMap.set(s.id, s));
        
        const disziplinenMap = new Map();
        disziplinenData.data?.forEach((d: any) => disziplinenMap.set(d.id, d));
        
        const clubsMap = new Map();
        clubsData.data?.forEach((c: any) => clubsMap.set(c.id, c));
        
        const processedMeldungen = meldungenData.data?.map((m: any) => {
          const schuetze = schuetzenMap.get(m.schuetzeId);
          const disziplin = disziplinenMap.get(m.disziplinId);
          const club = clubsMap.get(schuetze?.kmClubId || schuetze?.rwkClubId);
          
          const processedMeldung = {
            id: m.id,
            schuetzeName: schuetze ? `${schuetze.firstName || schuetze.vorname || ''} ${schuetze.lastName || schuetze.nachname || ''}`.trim() : 'Unbekannt',
            verein: club?.name || 'Unbekannt',
            disziplin: disziplin?.name || 'Unbekannt',
            vmErgebnis: m.vmErgebnis,
            lmTeilnahme: m.lmTeilnahme,
            nurVereinsmeisterschaft: m.nurVereinsmeisterschaft
          };
          
          return {
            ...processedMeldung,
            qualifikationStatus: getQualifikationStatus(processedMeldung)
          };
        }) || [];
        
        setMeldungen(processedMeldungen);
        
        // Unique Disziplinen extrahieren
        const uniqueDisziplinen = [...new Set(processedMeldungen.map((m: VMMeldung) => m.disziplin))];
        setDisziplinen(uniqueDisziplinen);
      }
    } catch (error) {
      console.error('Fehler beim Laden:', error);
      toast({ title: 'Fehler', description: 'VM-Meldungen konnten nicht geladen werden.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const getQualifikationStatus = (meldung: any): 'ok' | 'fraglich' | 'fehlt' => {
    if (meldung.nurVereinsmeisterschaft && !meldung.vmErgebnis) {
      return 'fehlt';
    }
    
    if (meldung.lmTeilnahme && meldung.vmErgebnis) {
      // Geschlecht aus Namen schätzen oder Default verwenden
      const geschlecht = 'Herren'; // TODO: Echtes Geschlecht aus Schützendaten
      const limitKey = `${meldung.disziplin} ${geschlecht}`;
      const limit = qualifikationsLimits[limitKey as keyof typeof qualifikationsLimits];
      
      if (limit && meldung.vmErgebnis.ringe < limit) {
        return 'fraglich';
      }
    }
    
    return 'ok';
  };

  const filterMeldungen = () => {
    let filtered = [...meldungen];
    
    if (selectedDisziplin && selectedDisziplin !== 'alle') {
      filtered = filtered.filter(m => m.disziplin === selectedDisziplin);
    }
    
    if (selectedStatus && selectedStatus !== 'alle') {
      filtered = filtered.filter(m => m.qualifikationStatus === selectedStatus);
    }
    
    setFilteredMeldungen(filtered);
  };

  const exportVMUebersicht = async () => {
    try {
      const XLSX = await import('xlsx');
      
      const worksheetData = [
        ['Schütze', 'Verein', 'Disziplin', 'VM-Ringe', 'VM-Datum', 'LM-Teilnahme', 'Status', 'Bemerkung'],
        ...filteredMeldungen.map(m => [
          m.schuetzeName,
          m.verein,
          m.disziplin,
          m.vmErgebnis?.ringe || '',
          m.vmErgebnis?.datum ? new Date(m.vmErgebnis.datum).toLocaleDateString('de-DE') : '',
          m.lmTeilnahme ? 'Ja' : 'Nein',
          m.qualifikationStatus === 'ok' ? 'OK' : 
          m.qualifikationStatus === 'fraglich' ? 'Fraglich' : 'Fehlt',
          m.vmErgebnis?.bemerkung || ''
        ])
      ];
      
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'VM-Übersicht');
      
      const fileName = `VM_Uebersicht_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      
      toast({ title: 'Export erstellt', description: `${fileName} wurde heruntergeladen.` });
    } catch (error) {
      console.error('Export-Fehler:', error);
      toast({ title: 'Fehler', description: 'Export konnte nicht erstellt werden.', variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <div className="container py-8 max-w-6xl mx-auto">
        <div className="flex items-center justify-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-3"></div>
          <p>Lade VM-Übersicht...</p>
        </div>
      </div>
    );
  }

  const statistiken = {
    gesamt: meldungen.length,
    mitVM: meldungen.filter(m => m.vmErgebnis).length,
    lmTeilnahme: meldungen.filter(m => m.lmTeilnahme).length,
    durchmeldung: meldungen.filter(m => m.nurVereinsmeisterschaft).length,
    probleme: meldungen.filter(m => m.qualifikationStatus !== 'ok').length
  };

  return (
    <div className="container py-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-primary">🏆 VM-Ergebnisse Übersicht</h1>
          <p className="text-muted-foreground">
            Vereinsmeisterschaft-Ergebnisse und Qualifikationen für die KM 2026
          </p>
        </div>
        <Button onClick={exportVMUebersicht}>
          <Download className="h-4 w-4 mr-2" />
          Excel Export
        </Button>
      </div>

      {/* Statistiken */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{statistiken.gesamt}</div>
            <div className="text-sm text-muted-foreground">Meldungen</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{statistiken.mitVM}</div>
            <div className="text-sm text-muted-foreground">Mit VM-Ergebnis</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{statistiken.lmTeilnahme}</div>
            <div className="text-sm text-muted-foreground">LM-Teilnahme</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{statistiken.durchmeldung}</div>
            <div className="text-sm text-muted-foreground">Durchmeldungen</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{statistiken.probleme}</div>
            <div className="text-sm text-muted-foreground">Probleme</div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Disziplin</label>
              <Select value={selectedDisziplin} onValueChange={setSelectedDisziplin}>
                <SelectTrigger>
                  <SelectValue placeholder="Alle Disziplinen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="alle">Alle Disziplinen</SelectItem>
                  {disziplinen.map(d => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Status</label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Alle Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="alle">Alle Status</SelectItem>
                  <SelectItem value="ok">OK</SelectItem>
                  <SelectItem value="fraglich">Fraglich</SelectItem>
                  <SelectItem value="fehlt">VM fehlt</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setSelectedDisziplin('alle');
                  setSelectedStatus('alle');
                }}
              >
                Filter zurücksetzen
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* VM-Meldungen Liste */}
      <Card>
        <CardHeader>
          <CardTitle>VM-Meldungen ({filteredMeldungen.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredMeldungen.map(meldung => (
              <div key={meldung.id} className="grid grid-cols-12 gap-2 p-3 border rounded-lg items-center">
                <div className="col-span-3">
                  <div className="font-medium">{meldung.schuetzeName}</div>
                  <div className="text-sm text-muted-foreground">{meldung.verein}</div>
                </div>
                <div className="col-span-2">
                  <Badge variant="outline">{meldung.disziplin}</Badge>
                </div>
                <div className="col-span-2">
                  {meldung.vmErgebnis ? (
                    <div>
                      <div className="font-medium text-green-600">
                        🏆 {meldung.vmErgebnis.ringe} Ringe
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(meldung.vmErgebnis.datum).toLocaleDateString('de-DE')}
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-red-600">Kein VM-Ergebnis</div>
                  )}
                </div>
                <div className="col-span-2">
                  {meldung.lmTeilnahme && (
                    <Badge variant="secondary" className="text-xs">LM-Teilnahme</Badge>
                  )}
                  {meldung.nurVereinsmeisterschaft && (
                    <Badge variant="outline" className="text-xs mt-1">Durchmeldung</Badge>
                  )}
                </div>
                <div className="col-span-2">
                  {meldung.qualifikationStatus === 'ok' && (
                    <div className="flex items-center gap-1 text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-xs">OK</span>
                    </div>
                  )}
                  {meldung.qualifikationStatus === 'fraglich' && (
                    <div className="flex items-center gap-1 text-orange-600">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="text-xs">Fraglich</span>
                    </div>
                  )}
                  {meldung.qualifikationStatus === 'fehlt' && (
                    <div className="flex items-center gap-1 text-red-600">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="text-xs">VM fehlt</span>
                    </div>
                  )}
                </div>
                <div className="col-span-1">
                  {meldung.vmErgebnis?.bemerkung && (
                    <div className="text-xs text-muted-foreground" title={meldung.vmErgebnis.bemerkung}>
                      💬
                    </div>
                  )}
                </div>
              </div>
            ))}
            {filteredMeldungen.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Keine Meldungen gefunden
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Qualifikations-Hinweise */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Qualifikations-Limits (Vorjahr 2025)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            {Object.entries(qualifikationsLimits).map(([disziplin, limit]) => (
              <div key={`limit-${disziplin}`} className="p-2 bg-blue-50 rounded">
                <div className="font-medium">{disziplin}</div>
                <div className="text-blue-600">{limit} Ringe</div>
              </div>
            ))}
          </div>
          <div className="mt-4 text-xs text-muted-foreground">
            * Limits vom Vorjahr als Orientierung. Aktuelle Limits werden später bekannt gegeben.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
