"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Save, Calendar, Clock, MapPin, Target, Users } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase/config';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { ALTERSKLASSEN, getSchiesszeit } from '@/lib/services/km-disziplinen-service';

interface StartlistConfig {
  id?: string;
  austragungsort: string;
  verfuegbareStaende: string[];
  startDatum: string;
  startUhrzeit: string;
  durchgangsDauer: number;
  wechselzeit: number;
  disziplinen: string[];
  anlagensystem: 'zuganlagen' | 'andere';
  altersklassen: string[]; // Neu: Welche Altersklassen teilnehmen
  createdAt?: Date;
  updatedAt?: Date;
}



export default function StartlistenPage() {
  const { toast } = useToast();
  const [vereine, setVereine] = useState<Array<{id: string, name: string}>>([]);
  const [disziplinen, setDisziplinen] = useState<Array<{spoNummer: number, name: string}>>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('luftdruck');
  
  const [config, setConfig] = useState<StartlistConfig>({
    austragungsort: '',
    verfuegbareStaende: [],
    startDatum: '',
    startUhrzeit: '09:00',
    durchgangsDauer: 90,
    wechselzeit: 15,
    disziplinen: [],
    anlagensystem: 'andere',
    altersklassen: ['Erwachsene']
  });

  const ALLE_STAENDE = [
    ...Array.from({length: 15}, (_, i) => (i + 1).toString()),
    '101', '102'
  ];

  // Vereine und Disziplinen aus Firestore laden
  useEffect(() => {
    const loadData = async () => {
      try {
        // Vereine laden
        const clubsSnapshot = await getDocs(collection(db, 'clubs'));
        const clubsData = clubsSnapshot.docs.map(doc => ({ 
          id: doc.id, 
          name: doc.data().name 
        }));
        setVereine(clubsData);

        // KM-Disziplinen laden - verwende die API statt direkten Firebase-Zugriff
        const disziplinenResponse = await fetch('/api/km/disziplinen');
        const disziplinenResult = await disziplinenResponse.json();
        console.log('Loaded disziplinen from API:', disziplinenResult.data?.length || 0);
        const disziplin141 = disziplinenResult.data?.find(d => d.spoNummer === '1.41');
        console.log('Found 1.41:', disziplin141);
        if (disziplinenResult.success && disziplinenResult.data) {
          const disziplinenData = disziplinenResult.data
            .map(d => ({
              id: d.id,
              spoNummer: d.spoNummer,
              name: d.name,
              schiesszeit_minuten: d.schiesszeit_minuten || 90,
              schiesszeit_zuganlagen: d.schiesszeit_zuganlagen,
              schiesszeit_andere: d.schiesszeit_andere,
              schusszahlen: d.schusszahlen,
              auflage: d.auflage || false
            }))
            .sort((a, b) => {
              const aNum = parseFloat(a.spoNummer) || 0;
              const bNum = parseFloat(b.spoNummer) || 0;
              return aNum - bNum;
            });
          setDisziplinen(disziplinenData);
        }
      } catch (error) {
        console.error('Fehler beim Laden der Daten:', error);
        toast({ title: 'Fehler', description: 'Daten konnten nicht geladen werden.', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [toast]);

  const handleDisziplinChange = (disziplinName: string, checked: boolean) => {
    setConfig(prev => ({
      ...prev,
      disziplinen: checked 
        ? [...prev.disziplinen, disziplinName]
        : prev.disziplinen.filter(d => d !== disziplinName)
    }));
  };

  const handleSave = async () => {
    if (!config.austragungsort || !config.startDatum || config.disziplinen.length === 0 || config.verfuegbareStaende.length === 0) {
      toast({
        title: "Fehlende Angaben",
        description: "Bitte füllen Sie alle Pflichtfelder aus.",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    try {
      const configToSave = {
        ...config,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Konfiguration in Firestore speichern
      await addDoc(collection(db, 'km_startlisten_configs'), configToSave);
      

      
      toast({
        title: "Konfiguration gespeichert",
        description: `Einstellungen für ${config.verfuegbareStaende.length} Stände gespeichert.`
      });
      
      // Weiterleitung zur Konfigurationsübersicht
      setTimeout(() => {
        window.location.href = '/km-orga/startlisten/uebersicht';
      }, 1500);
    } catch (error) {
      console.error('Fehler beim Speichern:', error);
      toast({
        title: "Fehler",
        description: "Die Konfiguration konnte nicht gespeichert werden.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const calculateNextStart = (startTime: string, durchgang: number, customDuration?: number) => {
    const duration = customDuration || config.durchgangsDauer;
    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + (durchgang * (duration + config.wechselzeit));
    const newHours = Math.floor(totalMinutes / 60);
    const newMinutes = totalMinutes % 60;
    return `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}`;
  };

  const getAverageDisziplinTime = () => {
    if (config.disziplinen.length === 0 || config.altersklassen.length === 0) return config.durchgangsDauer;
    const selectedDisziplinen = disziplinen.filter(d => config.disziplinen.includes(d.name));
    
    let totalTime = 0;
    let count = 0;
    
    selectedDisziplinen.forEach(d => {
      config.altersklassen.forEach(altersklasse => {
        const schiesszeit = getSchiesszeit(d, altersklasse, config.anlagensystem);
        totalTime += schiesszeit;
        count++;
      });
    });
    
    return count > 0 ? Math.round(totalTime / count) : config.durchgangsDauer;
  };

  if (loading) {
    return (
      <div className="container py-8 max-w-4xl mx-auto">
        <div className="flex items-center justify-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-3"></div>
          <p>Lade Startlisten-Generator...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/km-orga">
          <Button variant="outline">← Zurück</Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-primary">📄 Startlisten generieren</h1>
          <p className="text-muted-foreground">
            Konfigurieren Sie die Wettkampf-Parameter für die automatische Startlisten-Generierung
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Grundeinstellungen */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Wettkampf-Grunddaten
            </CardTitle>
            <CardDescription>
              Austragungsort, Datum und grundlegende Einstellungen
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="austragungsort">Austragungsort *</Label>
                <Select value={config.austragungsort} onValueChange={(value) => setConfig(prev => ({...prev, austragungsort: value}))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Verein auswählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {vereine.map(verein => (
                      <SelectItem key={verein.id} value={verein.id}>
                        {verein.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>Verfügbare Stände auswählen</Label>
                <div className="grid grid-cols-6 gap-2">
                  {ALLE_STAENDE.map(stand => (
                    <div key={stand} className="flex items-center space-x-2">
                      <Checkbox
                        id={`stand-${stand}`}
                        checked={config.verfuegbareStaende.includes(stand)}
                        onCheckedChange={(checked) => {
                          setConfig(prev => ({
                            ...prev,
                            verfuegbareStaende: checked 
                              ? [...prev.verfuegbareStaende, stand].sort((a, b) => {
                                  const numA = parseInt(a);
                                  const numB = parseInt(b);
                                  return numA - numB;
                                })
                              : prev.verfuegbareStaende.filter(s => s !== stand)
                          }));
                        }}
                      />
                      <Label htmlFor={`stand-${stand}`} className="text-sm font-normal">
                        {stand}
                      </Label>
                    </div>
                  ))}
                </div>
                {config.verfuegbareStaende.length > 0 && (
                  <div className="mt-2 p-2 bg-blue-50 rounded text-sm text-blue-700">
                    <strong>{config.verfuegbareStaende.length}</strong> Stände ausgewählt: {config.verfuegbareStaende.join(', ')}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="datum">Wettkampf-Datum *</Label>
                <Input
                  id="datum"
                  type="date"
                  value={config.startDatum}
                  onChange={(e) => setConfig(prev => ({...prev, startDatum: e.target.value}))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="uhrzeit">Erster Start</Label>
                <Input
                  id="uhrzeit"
                  type="time"
                  value={config.startUhrzeit}
                  onChange={(e) => setConfig(prev => ({...prev, startUhrzeit: e.target.value}))}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Disziplinen */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Disziplinen auswählen
            </CardTitle>
            <CardDescription>
              Wählen Sie die Disziplinen aus, die an diesem Wettkampftag ausgetragen werden
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="flex border-b">
                {[
                  { key: 'luftdruck', label: 'Luftdruck', range: [1] },
                  { key: 'kleinkaliber', label: 'Kleinkaliber', range: [2] },
                  { key: 'licht', label: 'Licht', range: [11] },
                  { key: 'blasrohr', label: 'Blasrohr', range: [] },
                  { key: 'andere', label: 'Andere', range: [4, 5, 6, 7, 8, 9] }
                ].map(kategorie => {
                  const count = disziplinen.filter(d => {
                    const disziplinName = d.name?.toLowerCase() || '';
                    switch(kategorie.key) {
                      case 'luftdruck': return disziplinName.includes('luftgewehr') || disziplinName.includes('luftpistole') || disziplinName.includes('10m luftpistole') || disziplinName.includes('10 m luftpistole') || d.spoNummer?.startsWith('1.1');
                      case 'kleinkaliber': return (disziplinName.includes('kk') || disziplinName.includes('kleinkaliber') || (disziplinName.includes('pistole') || disziplinName.includes('pistol')) && !disziplinName.includes('luftpistole') || d.spoNummer?.startsWith('1.4')) && !disziplinName.includes('100m') && true && !disziplinName.includes('luftpistole') && !disziplinName.includes('lichtpistole');
                      case 'licht': return disziplinName.includes('licht');
                      case 'blasrohr': return disziplinName.includes('blasrohr');
                      case 'andere': return (!disziplinName.includes('luftgewehr') && !disziplinName.includes('luftpistole') && !disziplinName.includes('licht') && !disziplinName.includes('blasrohr')) && (disziplinName.includes('100m') || (!disziplinName.includes('kk') && !disziplinName.includes('kleinkaliber') && !disziplinName.includes('pistole') && !disziplinName.includes('pistol')));
                      default: return false;
                    }
                  }).length;
                  return (
                    <button
                      key={kategorie.key}
                      onClick={() => setActiveTab(kategorie.key)}
                      className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                        activeTab === kategorie.key
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {kategorie.label} ({count})
                    </button>
                  );
                })}
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 w-12">Auswählen</th>
                    <th className="text-left p-2 w-16">SPO-Nr.</th>
                    <th className="text-left p-2">Disziplin</th>
                    <th className="text-left p-2 w-20">Typ</th>
                    <th className="text-left p-2 w-24">Schießzeit</th>
                  </tr>
                </thead>
                <tbody>
                  {disziplinen
                    .filter(d => {
                      const spoStr = d.spoNummer?.toString() || '';
                      const firstDigit = parseInt(spoStr.charAt(0)) || 0;
                      
                      const disziplinName = d.name?.toLowerCase() || '';
                      
                      switch(activeTab) {
                        case 'luftdruck': return disziplinName.includes('luftgewehr') || disziplinName.includes('luftpistole') || disziplinName.includes('10m luftpistole') || disziplinName.includes('10 m luftpistole') || d.spoNummer?.toString().startsWith('1.1');
                        case 'kleinkaliber': return (disziplinName.includes('kk') || disziplinName.includes('kleinkaliber') || (disziplinName.includes('pistole') || disziplinName.includes('pistol')) && !disziplinName.includes('luftpistole') || d.spoNummer?.startsWith('1.4') || d.spoNummer?.startsWith('1.6') || d.spoNummer?.startsWith('1.8') || d.spoNummer?.startsWith('2.')) && !disziplinName.includes('100m') && !disziplinName.includes('luftpistole') && !disziplinName.includes('lichtpistole');
                        case 'licht': return disziplinName.includes('licht');
                        case 'blasrohr': return disziplinName.includes('blasrohr');
                        case 'andere': return (!disziplinName.includes('luftgewehr') && !disziplinName.includes('luftpistole') && !disziplinName.includes('licht') && !disziplinName.includes('blasrohr')) && (disziplinName.includes('100m') || (!disziplinName.includes('kk') && !disziplinName.includes('kleinkaliber') && !disziplinName.includes('pistole') && !disziplinName.includes('pistol')));
                        default: return true;
                      }
                    })
                    .sort((a, b) => (a.spoNummer || 0) - (b.spoNummer || 0))
                    .map(disziplin => {
                      const avgTime = config.altersklassen.length > 0 
                        ? Math.round(config.altersklassen.reduce((sum, ak) => 
                            sum + getSchiesszeit(disziplin, ak, config.anlagensystem), 0
                          ) / config.altersklassen.length)
                        : (config.anlagensystem === 'zuganlagen' 
                            ? (disziplin.schiesszeit_zuganlagen || 90)
                            : (disziplin.schiesszeit_andere || 90));
                      
                      return (
                        <tr key={disziplin.name} className={`border-b hover:bg-gray-50 ${
                          config.disziplinen.includes(disziplin.name) ? 'bg-blue-50' : ''
                        }`}>
                          <td className="p-2">
                            <Checkbox
                              id={disziplin.name}
                              checked={config.disziplinen.includes(disziplin.name)}
                              onCheckedChange={(checked) => handleDisziplinChange(disziplin.name, checked as boolean)}
                            />
                          </td>
                          <td className="p-2 font-mono font-medium">
                            {disziplin.spoNummer || '-'}
                          </td>
                          <td className="p-2">
                            <Label htmlFor={disziplin.name} className="cursor-pointer">
                              {disziplin.name}
                            </Label>
                          </td>
                          <td className="p-2">
                            <span className={`px-2 py-1 text-xs rounded ${
                              disziplin.auflage 
                                ? 'bg-blue-100 text-blue-800' 
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {disziplin.auflage ? 'Auflage' : 'Freihand'}
                            </span>
                          </td>
                          <td className="p-2 font-medium">
                            {avgTime} Min
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
            
            {disziplinen.length === 0 && !loading && (
              <div className="text-center py-4 text-muted-foreground">
                Keine KM-Disziplinen in der Datenbank gefunden.
              </div>
            )}
            
            {config.disziplinen.length > 0 && (
              <div className="mt-4 p-3 bg-green-50 rounded-lg">
                <p className="text-sm text-green-700">
                  <strong>{config.disziplinen.length}</strong> Disziplin{config.disziplinen.length !== 1 ? 'en' : ''} ausgewählt
                </p>
                <div className="text-xs text-green-600 mt-1">
                  Auflage: {disziplinen.filter(d => config.disziplinen.includes(d.name) && d.auflage).length} • 
                  Freihand: {disziplinen.filter(d => config.disziplinen.includes(d.name) && !d.auflage).length}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Zeitplanung */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Zeitplanung
            </CardTitle>
            <CardDescription>
              Durchgangsdauer und Wechselzeiten für die automatische Zeitberechnung
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="durchgang">Durchgangsdauer (Minuten)</Label>
                <Input
                  id="durchgang"
                  type="number"
                  min="30"
                  max="180"
                  value={config.durchgangsDauer || ''}
                  onChange={(e) => setConfig(prev => ({...prev, durchgangsDauer: e.target.value === '' ? '' : parseInt(e.target.value) || 90}))}
                />
                {config.disziplinen.length > 0 && (
                  <div className="text-xs text-gray-600">
                    💡 Empfohlen: {getAverageDisziplinTime()} Min (basierend auf gewählten Disziplinen)
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="wechsel">Wechselzeit (Minuten)</Label>
                <Input
                  id="wechsel"
                  type="number"
                  min="5"
                  max="60"
                  value={config.wechselzeit}
                  onChange={(e) => setConfig(prev => ({...prev, wechselzeit: parseInt(e.target.value) || 15}))}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="anlagensystem">Anlagensystem</Label>
                <Select value={config.anlagensystem} onValueChange={(value: 'zuganlagen' | 'andere') => setConfig(prev => ({...prev, anlagensystem: value}))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="zuganlagen">Zuganlagen (längere Schießzeiten)</SelectItem>
                    <SelectItem value="andere">Elektronische Anlagen (Disag, Meyton)</SelectItem>
                  </SelectContent>
                </Select>
                <div className="text-xs text-gray-600">
                  {config.anlagensystem === 'zuganlagen' 
                    ? '🎯 Zuganlagen benötigen mehr Zeit für das Nachladen'
                    : '⚡ Elektronische Anlagen (Disag, Meyton) sind schneller'
                  }
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Teilnehmende Altersklassen</Label>
                <div className="grid grid-cols-2 gap-2">
                  {ALTERSKLASSEN.map(altersklasse => (
                    <div key={altersklasse} className="flex items-center space-x-2">
                      <Checkbox
                        id={`altersklasse-${altersklasse}`}
                        checked={config.altersklassen.includes(altersklasse)}
                        onCheckedChange={(checked) => {
                          setConfig(prev => ({
                            ...prev,
                            altersklassen: checked 
                              ? [...prev.altersklassen, altersklasse]
                              : prev.altersklassen.filter(a => a !== altersklasse)
                          }));
                        }}
                      />
                      <Label htmlFor={`altersklasse-${altersklasse}`} className="text-sm font-normal">
                        {altersklasse}
                      </Label>
                    </div>
                  ))}
                </div>
                {config.altersklassen.length > 0 && (
                  <div className="text-xs text-gray-600">
                    👥 {config.altersklassen.length} Altersklasse{config.altersklassen.length !== 1 ? 'n' : ''} ausgewählt
                  </div>
                )}
              </div>
            </div>

            {/* Zeitvorschau */}
            {config.startUhrzeit && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Zeitplan-Vorschau</h4>
                <div className="text-sm text-blue-700 space-y-1">
                  <div>1. Durchgang: {config.startUhrzeit} Uhr</div>
                  <div>2. Durchgang: {calculateNextStart(config.startUhrzeit, 1)} Uhr</div>
                  <div>3. Durchgang: {calculateNextStart(config.startUhrzeit, 2)} Uhr</div>
                </div>
                
                {config.disziplinen.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-blue-200">
                    <h5 className="font-medium text-blue-900 mb-2">Disziplin-spezifische Zeiten</h5>
                    <div className="space-y-2">
                      {config.disziplinen.map(disziplinName => {
                        const disziplin = disziplinen.find(d => d.name === disziplinName);
                        if (!disziplin) return null;
                        
                        return (
                          <div key={disziplinName} className="border-l-2 border-blue-300 pl-2">
                            <div className="font-medium text-xs text-blue-900">
                              {disziplin.spoNummer} {disziplin.name}
                            </div>
                            <div className="space-y-1 mt-1">
                              {config.altersklassen.map(altersklasse => {
                                const schiesszeit = getSchiesszeit(disziplin, altersklasse, config.anlagensystem);
                                const schusszahlInfo = disziplin.schusszahlen?.find((s: any) => 
                                  s.altersklassen.includes(altersklasse) || s.altersklassen.includes('Alle')
                                );
                                return (
                                  <div key={altersklasse} className="flex justify-between text-xs text-blue-700">
                                    <span>{altersklasse}:</span>
                                    <span className="font-medium">
                                      {schiesszeit} Min {schusszahlInfo ? `(${schusszahlInfo.schusszahl} Schuss)` : ''}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Aktionen */}
        <div className="flex justify-end space-x-4">
          <Button variant="outline" onClick={() => window.history.back()}>
            Abbrechen
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>}
            <Save className="h-4 w-4 mr-2" />
            Konfiguration speichern
          </Button>
        </div>
      </div>
    </div>
  );
}
