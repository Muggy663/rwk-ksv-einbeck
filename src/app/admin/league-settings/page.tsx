// src/app/admin/league-settings/page.tsx
"use client";
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings, Save, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase/config';
import { collection, getDocs, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import type { League, Season } from '@/types/rwk';
import Link from 'next/link';

const DISCIPLINES = [
  'Kleinkaliber Gewehr',
  'Kleinkaliber Pistole', 
  'Luftgewehr Auflage',
  'Luftgewehr Freihand',
  'Luftpistole',
  'Benutzerdefiniert'
];

const DEFAULT_SETTINGS = {
  'Kleinkaliber Gewehr': { shotCount: 30, maxRings: 300 },
  'Kleinkaliber Pistole': { shotCount: 30, maxRings: 300 },
  'Luftgewehr Auflage': { shotCount: 40, maxRings: 400 },
  'Luftgewehr Freihand': { shotCount: 40, maxRings: 400 },
  'Luftpistole': { shotCount: 40, maxRings: 400 }
};

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
      console.error('Fehler beim Laden:', error);
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
        orderBy('order', 'asc')
      );
      const leaguesSnapshot = await getDocs(leaguesQuery);
      const leaguesData = leaguesSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as League))
        .filter(league => league.seasonId === selectedSeasonId);
      
      setLeagues(leaguesData);
    } catch (error) {
      console.error('Fehler beim Laden der Ligen:', error);
      toast({
        title: 'Fehler',
        description: 'Ligen konnten nicht geladen werden.',
        variant: 'destructive'
      });
    }
  };

  const updateLeagueSetting = (leagueId: string, field: string, value: any) => {
    setLeagues(prev => prev.map(league => {
      if (league.id === leagueId) {
        const shotSettings = league.shotSettings || {};
        
        if (field === 'discipline' && value !== 'Benutzerdefiniert') {
          const defaults = DEFAULT_SETTINGS[value as keyof typeof DEFAULT_SETTINGS];
          const newSettings = {
            ...shotSettings,
            discipline: value,
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
      const updatePromises = leagues.map(async (league) => {
        if (league.shotSettings) {
          const leagueRef = doc(db, 'rwk_leagues', league.id);
          
          // Entferne undefined Werte
          const cleanSettings = {
            discipline: league.shotSettings.discipline || 'Kleinkaliber Gewehr',
            shotCount: league.shotSettings.shotCount || 30,
            maxRings: league.shotSettings.maxRings || 300,
            description: league.shotSettings.description || ''
          };
          
          // Nur customDiscipline hinzufügen wenn es einen Wert hat
          if (league.shotSettings.customDiscipline) {
            cleanSettings.customDiscipline = league.shotSettings.customDiscipline;
          }
          
          await updateDoc(leagueRef, {
            shotSettings: cleanSettings
          });
        }
      });

      await Promise.all(updatePromises);
      
      toast({
        title: 'Einstellungen gespeichert',
        description: 'Alle Liga-Einstellungen wurden erfolgreich aktualisiert.'
      });
    } catch (error) {
      console.error('Fehler beim Speichern:', error);
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
      shotSettings: {
        discipline: 'Kleinkaliber Gewehr',
        shotCount: 30,
        maxRings: 300,
        description: ''
      }
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
            <Select value={selectedSeasonId} onValueChange={setSelectedSeasonId}>
              <SelectTrigger>
                <SelectValue placeholder="Saison wählen" />
              </SelectTrigger>
              <SelectContent>
                {seasons.map(season => (
                  <SelectItem key={season.id} value={season.id}>
                    {season.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {leagues.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {leagues.map(league => (
            <Card key={league.id}>
              <CardHeader>
                <CardTitle className="text-lg">{league.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Disziplin</Label>
                  <Select 
                    value={league.shotSettings?.discipline || 'Kleinkaliber Gewehr'} 
                    onValueChange={(value) => updateLeagueSetting(league.id, 'discipline', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DISCIPLINES.map(discipline => (
                        <SelectItem key={discipline} value={discipline}>
                          {discipline}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {league.shotSettings?.discipline === 'Benutzerdefiniert' && (
                  <div>
                    <Label>Benutzerdefinierte Disziplin</Label>
                    <Input
                      value={league.shotSettings?.customDiscipline || ''}
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
                      value={league.shotSettings?.shotCount || 30}
                      onChange={(e) => updateLeagueSetting(league.id, 'shotCount', parseInt(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label>Maximale Ringzahl</Label>
                    <Input
                      type="number"
                      min="1"
                      max="600"
                      value={league.shotSettings?.maxRings || 300}
                      onChange={(e) => updateLeagueSetting(league.id, 'maxRings', parseInt(e.target.value))}
                    />
                  </div>
                </div>

                <div>
                  <Label>Zusätzliche Beschreibung (optional)</Label>
                  <Input
                    value={league.shotSettings?.description || ''}
                    onChange={(e) => updateLeagueSetting(league.id, 'description', e.target.value)}
                    placeholder="z.B. stehend freihändig"
                  />
                </div>

                <div className="p-3 bg-muted rounded-md text-sm">
                  <strong>Aktuelle Einstellung:</strong><br />
                  {league.shotSettings?.discipline === 'Benutzerdefiniert' 
                    ? league.shotSettings?.customDiscipline || 'Benutzerdefiniert'
                    : league.shotSettings?.discipline || 'Kleinkaliber Gewehr'
                  }<br />
                  {league.shotSettings?.shotCount || 30} Schuss, max. {league.shotSettings?.maxRings || 300} Ringe
                  {league.shotSettings?.description && (
                    <><br />Zusatz: {league.shotSettings.description}</>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
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
