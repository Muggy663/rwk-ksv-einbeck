// src/app/admin/league-settings/page.tsx
"use client";
import { useState, useEffect } from 'react';
import { logError } from '@/lib/utils/secure-logger';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect } from '@/components/ui/native-select';
import { Settings, Save, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase/config';
import { collection, getDocs, doc, updateDoc, query, where, orderBy } from 'firebase/firestore';
import type { League, Season } from '@/types/rwk';
import { getDefaultShotConfigForType } from '@/lib/utils/league-shot-config';
import Link from 'next/link';

const DISCIPLINES = [
  'Kleinkaliber Gewehr',
  'Kleinkaliber Pistole',
  'Luftgewehr Auflage',
  'Luftgewehr Freihand',
  'Luftpistole',
  'Luftpistole Auflage',
  'Blasrohr',
  'Benutzerdefiniert'
];

const DEFAULT_SETTINGS = {
  'Kleinkaliber Gewehr': { shotCount: 30, maxRings: 300 },
  'Kleinkaliber Pistole': { shotCount: 30, maxRings: 300 },
  'Luftgewehr Auflage': { shotCount: 40, maxRings: 400 },
  'Luftgewehr Freihand': { shotCount: 40, maxRings: 400 },
  'Luftpistole': { shotCount: 40, maxRings: 400 },
  'Luftpistole Auflage': { shotCount: 40, maxRings: 400 },
  'Blasrohr': { shotCount: 30, maxRings: 300 }
};

/**
 * Leitet aus league.type einen sinnvollen Default-shotSettings-Block ab.
 * Wird genutzt, wenn eine Liga noch keine shotSettings besitzt – damit die
 * Anzeige und das Speichern einen passenden Vorschlag (statt hart KK/30/300)
 * haben. Die Zahlen kommen aus dem zentralen Helper (eine Quelle).
 */
function defaultSettingsForLeague(league: League): NonNullable<League['shotSettings']> {
  const { shotCount, maxRings } = getDefaultShotConfigForType(league.type);
  // Disziplin-Klartext passend zum Typ vorbelegen.
  const disciplineByType: Record<string, string> = {
    KK: 'Kleinkaliber Gewehr',
    KKG: 'Kleinkaliber Gewehr',
    KKP: 'Kleinkaliber Pistole',
    LG: 'Luftgewehr Freihand',
    LGA: 'Luftgewehr Auflage',
    LGS: 'Luftgewehr Freihand',
    LP: 'Luftpistole',
    LPA: 'Luftpistole Auflage',
    LD: 'Luftgewehr Freihand',
  };
  return {
    discipline: disciplineByType[league.type] || 'Kleinkaliber Gewehr',
    shotCount,
    maxRings,
    description: '',
  };
}

/** shotSettings einer Liga, oder (wenn fehlend) der aus league.type abgeleitete Default. */
function effectiveSettings(league: League): NonNullable<League['shotSettings']> {
  return league.shotSettings ?? defaultSettingsForLeague(league);
}

export default function LeagueSettingsPage() {
  const { toast } = useToast();
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const seasonsQuery = query(collection(db, 'seasons'), orderBy('competitionYear', 'desc'));
      const seasonsSnapshot = await getDocs(seasonsQuery);
      const seasonsData = seasonsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Season));
      setSeasons(seasonsData);

      if (seasonsData.length > 0 && !selectedSeasonId) {
        setSelectedSeasonId(seasonsData[0].id);
      }
    } catch (error) {
      logError('Fehler beim Laden:', error);
      toast({
        title: 'Fehler',
        description: 'Daten konnten nicht geladen werden.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedSeasonId) {
      loadLeagues();
    }
  }, [selectedSeasonId]);

  const loadLeagues = async () => {
    if (!selectedSeasonId) return;
    
    try {
      const leaguesQuery = query(
        collection(db, 'rwk_leagues'),
        where('seasonId', '==', selectedSeasonId)
      );
      const leaguesSnapshot = await getDocs(leaguesQuery);
      const leaguesData = leaguesSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as League))
        // Clientseitig sortieren: nach order (fehlendes order ans Ende), dann Name.
        // Kein orderBy in der Query, sonst würden Ligen ohne order-Feld verschwinden.
        .sort((a, b) => {
          const ao = typeof a.order === 'number' ? a.order : Number.MAX_SAFE_INTEGER;
          const bo = typeof b.order === 'number' ? b.order : Number.MAX_SAFE_INTEGER;
          if (ao !== bo) return ao - bo;
          return (a.name || '').localeCompare(b.name || '');
        });

      setLeagues(leaguesData);
    } catch (error) {
      logError('Fehler beim Laden der Ligen:', error);
      toast({
        title: 'Fehler',
        description: 'Ligen konnten nicht geladen werden.',
        variant: 'destructive'
      });
    }
  };

  const updateLeagueSetting = (leagueId: string, field: string, value: string | number) => {
    setLeagues(prev => prev.map(league => {
      if (league.id === leagueId) {
        const shotSettings: NonNullable<League['shotSettings']> = league.shotSettings || defaultSettingsForLeague(league);
        
        if (field === 'discipline' && value !== 'Benutzerdefiniert') {
          const defaults = DEFAULT_SETTINGS[value as keyof typeof DEFAULT_SETTINGS];
          const newSettings: NonNullable<League['shotSettings']> = {
            ...shotSettings,
            discipline: value as string,
            shotCount: defaults?.shotCount || shotSettings.shotCount || 30,
            maxRings: defaults?.maxRings || shotSettings.maxRings || 300
          };
          
          // customDiscipline nur löschen, nicht auf undefined setzen
          if (newSettings.customDiscipline) {
            delete newSettings.customDiscipline;
          }
          
          return {
            ...league,
            shotSettings: newSettings
          };
        }
        
        return {
          ...league,
          shotSettings: {
            ...shotSettings,
            [field]: value
          }
        };
      }
      return league;
    }));
  };

  const saveAllSettings = async () => {
    setIsSaving(true);
    try {
      // ALLE Ligen speichern – auch solche, die noch kein shotSettings haben.
      // Für sie wird der aus league.type abgeleitete Default geschrieben, damit
      // ab sofort eine explizite, admin-kontrollierbare Konfiguration existiert.
      const updatePromises = leagues.map(async (league) => {
        const src = effectiveSettings(league);
        const leagueRef = doc(db, 'rwk_leagues', league.id);

        // Entferne undefined Werte
        const cleanSettings: { discipline: string; shotCount: number; maxRings: number; description: string; customDiscipline?: string } = {
          discipline: src.discipline || 'Kleinkaliber Gewehr',
          shotCount: src.shotCount || 30,
          maxRings: src.maxRings || 300,
          description: src.description || ''
        };

        // Nur customDiscipline hinzufügen wenn es einen Wert hat
        if (src.customDiscipline) {
          cleanSettings.customDiscipline = src.customDiscipline;
        }

        await updateDoc(leagueRef, {
          shotSettings: cleanSettings
        });
      });

      await Promise.all(updatePromises);
      
      toast({
        title: 'Einstellungen gespeichert',
        description: 'Alle Liga-Einstellungen wurden erfolgreich aktualisiert.'
      });
    } catch (error) {
      logError('Fehler beim Speichern:', error);
      toast({
        title: 'Fehler',
        description: 'Einstellungen konnten nicht gespeichert werden.',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const resetToDefaults = () => {
    setLeagues(prev => prev.map(league => ({
      ...league,
      shotSettings: defaultSettingsForLeague(league)
    })));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Settings className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-semibold text-primary">Liga-Einstellungen</h1>
            <p className="text-muted-foreground">Schusszahlen und Disziplinen für jede Liga konfigurieren</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href="/admin">
            <Button variant="outline" size="sm">
              Zurück zum Dashboard
            </Button>
          </Link>
          <Button variant="outline" onClick={resetToDefaults}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Zurücksetzen
          </Button>
          <Button onClick={saveAllSettings} disabled={isSaving}>
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? 'Speichern...' : 'Alle speichern'}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Saison auswählen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-64">
            <Label>Saison</Label>
            <NativeSelect
              value={selectedSeasonId}
              onValueChange={setSelectedSeasonId}
              placeholder="Saison wählen"
              options={seasons.map(season => ({ value: season.id, label: season.name }))}
            />
          </div>
        </CardContent>
      </Card>

      {leagues.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {leagues.map(league => {
            const eff = effectiveSettings(league);
            const notYetConfigured = !league.shotSettings;
            return (
            <Card key={league.id}>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between gap-2">
                  <span>{league.name}</span>
                  {notYetConfigured && (
                    <span className="text-xs font-normal text-amber-600 bg-amber-50 border border-amber-200 rounded px-2 py-0.5">
                      Vorschlag (noch nicht gespeichert)
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Disziplin</Label>
                  <NativeSelect
                    value={eff.discipline || 'Kleinkaliber Gewehr'}
                    onValueChange={(value) => updateLeagueSetting(league.id, 'discipline', value)}
                    options={DISCIPLINES.map(discipline => ({ value: discipline, label: discipline }))}
                  />
                </div>

                {eff.discipline === 'Benutzerdefiniert' && (
                  <div>
                    <Label>Benutzerdefinierte Disziplin</Label>
                    <Input
                      value={eff.customDiscipline || ''}
                      onChange={(e) => updateLeagueSetting(league.id, 'customDiscipline', e.target.value)}
                      placeholder="z.B. Großkaliber Gewehr"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Schussanzahl</Label>
                    <Input
                      type="number"
                      min="1"
                      max="60"
                      value={eff.shotCount || 30}
                      onChange={(e) => updateLeagueSetting(league.id, 'shotCount', parseInt(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label>Maximale Ringzahl</Label>
                    <Input
                      type="number"
                      min="1"
                      max="600"
                      value={eff.maxRings || 300}
                      onChange={(e) => updateLeagueSetting(league.id, 'maxRings', parseInt(e.target.value))}
                    />
                  </div>
                </div>

                <div>
                  <Label>Zusätzliche Beschreibung (optional)</Label>
                  <Input
                    value={eff.description || ''}
                    onChange={(e) => updateLeagueSetting(league.id, 'description', e.target.value)}
                    placeholder="z.B. stehend freihändig"
                  />
                </div>

                <div className="p-3 bg-muted rounded-md text-sm">
                  <strong>Aktuelle Einstellung:</strong><br />
                  {eff.discipline === 'Benutzerdefiniert'
                    ? eff.customDiscipline || 'Benutzerdefiniert'
                    : eff.discipline || 'Kleinkaliber Gewehr'
                  }<br />
                  {eff.shotCount || 30} Schuss, max. {eff.maxRings || 300} Ringe
                  {eff.description && (
                    <><br />Zusatz: {eff.description}</>
                  )}
                </div>
              </CardContent>
            </Card>
            );
          })}
        </div>
      )}

      {leagues.length === 0 && selectedSeasonId && !isLoading && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">Keine Ligen für die ausgewählte Saison gefunden.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
