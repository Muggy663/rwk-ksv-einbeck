"use client";

import React, { useState, useEffect } from 'react';
import { logError, logWarn, logInfo, logDebug } from '@/lib/utils/secure-logger';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Edit, Play, Trash2, Plus, Calendar, MapPin, Target, Eye, ArrowLeft, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { David21ImportDialog } from '@/components/David21ImportDialog';
import { db } from '@/lib/firebase/config';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';

import { useKMAuth } from '@/hooks/useKMAuth';

interface StartlistConfig {
  id: string;
  austragungsort: string;
  verfuegbareStaende: string[];
  startDatum: string;
  startUhrzeit: string;
  durchgangsDauer: number;
  wechselzeit: number;
  disziplinen: string[];
  createdAt: Date;
  updatedAt: Date;
}

interface GespeicherteStartliste {
  id: string;
  configId: string;
  datum: string;
  startliste: any[];
  createdAt: Date;
}

export default function StartlistenUebersichtPage() {
  const { toast } = useToast();
  const { hasKMAccess, loading: authLoading } = useKMAuth();
  const [configs, setConfigs] = useState<StartlistConfig[]>([]);
  const [startlisten, setStartlisten] = useState<GespeicherteStartliste[]>([]);
  const [loading, setLoading] = useState(true);
  const [vereine, setVereine] = useState<{[key: string]: string}>({});
  const [activeTab, setActiveTab] = useState<'configs' | 'startlisten'>('configs');

  useEffect(() => {
    if (!hasKMAccess || authLoading) return;
    
    const loadData = async () => {
      try {
        // Lade direkt aus Firebase mit erweiterten Logs
        // Lade über APIs statt direktem Firebase
        const [startlistenRes, clubsRes] = await Promise.all([
          fetch('/api/km/startlisten'),
          fetch('/api/clubs')
        ]);
        
        console.log('DEBUG: API Responses:', {
          startlisten: startlistenRes.status,
          clubs: clubsRes.status
        });
        
        // Configs - lade direkt aus Firebase (funktioniert)
        const configsSnapshot = await getDocs(collection(db, 'km_startlisten_configs'));
        const configsData = configsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setConfigs(configsData);
        
        // Startlisten über API
        const startlistenData = startlistenRes.ok ? (await startlistenRes.json()).data || [] : [];
        console.log('DEBUG: API Startlisten:', startlistenData.length);
        console.log('DEBUG: Erste Startliste:', startlistenData[0]);
        setStartlisten(startlistenData);
        
        
        if (clubsRes.ok) {
          const data = await clubsRes.json();
          const clubsMap: {[key: string]: string} = {};
          (data.data || []).forEach((club: any) => {
            clubsMap[club.id] = club.name;
          });
          setVereine(clubsMap);
        }
      } catch (error) {
        logError('Fehler beim Laden:', error);
        toast({ title: 'Fehler', description: 'Konfigurationen konnten nicht geladen werden.', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [hasKMAccess, authLoading, toast]);

  const handleDelete = async (configId: string) => {
    if (!confirm('Konfiguration wirklich löschen?')) return;
    
    try {
      await deleteDoc(doc(db, 'km_startlisten_configs', configId));
      setConfigs(prev => prev.filter(c => c.id !== configId));
      toast({ 
        title: '✅ Gelöscht', 
        description: 'Konfiguration wurde erfolgreich entfernt.',
        duration: 3000
      });
    } catch (error) {
      logError('Fehler beim Löschen:', error);
      toast({ title: 'Fehler', description: 'Konfiguration konnte nicht gelöscht werden.', variant: 'destructive' });
    }
  };

  const handleDeleteStartliste = async (startlisteId: string) => {
    if (!confirm('Startliste wirklich löschen?')) return;
    
    try {
      const response = await fetch('/api/km/startlisten', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: startlisteId })
      });
      
      if (response.ok) {
        setStartlisten(prev => prev.filter(s => s.id !== startlisteId));
        toast({ 
          title: '✅ Gelöscht', 
          description: 'Startliste wurde erfolgreich entfernt.',
          duration: 3000
        });
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      logError('Fehler beim Löschen:', error);
      toast({ title: 'Fehler', description: 'Startliste konnte nicht gelöscht werden.', variant: 'destructive' });
    }
  };

  if (loading || authLoading) {
    return (
      <div className="container py-8 max-w-6xl mx-auto">
        <div className="flex items-center justify-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-3"></div>
          <p>Lade Konfigurationen...</p>
        </div>
      </div>
    );
  }

  if (!hasKMAccess) {
    return (
      <div className="container py-8 max-w-6xl mx-auto">
        <div className="text-center py-10">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Zugriff verweigert</h1>
          <p className="text-muted-foreground mb-4">Sie haben keine Berechtigung für das KM-System.</p>
          <Link href="/" className="text-primary hover:text-primary/80">← Zur Startseite</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="px-2 md:px-4 py-8 max-w-6xl mx-auto">
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex items-center gap-4">
          <Link href="/km-orga">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-xl md:text-3xl font-bold text-primary">📄 Startlisten-Übersicht</h1>
            <p className="text-sm md:text-base text-muted-foreground">
              Austragungsorte und gespeicherte Startlisten verwalten
            </p>
          </div>
        </div>
        <Link href="/km-orga/startlisten" className="w-full md:w-auto">
          <Button className="w-full h-12 text-left justify-start md:w-auto md:h-auto md:text-center md:justify-center">
            <Plus className="h-4 w-4 mr-2" />
            Neuen Austragungsort erstellen
          </Button>
        </Link>
      </div>
      
      {/* Tabs */}
      <div className="flex flex-col gap-2 mb-6 md:flex-row md:gap-1">
        <Button 
          variant={activeTab === 'configs' ? 'default' : 'outline'}
          onClick={() => setActiveTab('configs')}
          className="w-full h-12 text-left justify-start md:w-auto md:h-auto md:text-center md:justify-center"
        >
          🏢 Austragungsorte ({configs.length})
        </Button>
        <Button 
          variant={activeTab === 'startlisten' ? 'default' : 'outline'}
          onClick={() => setActiveTab('startlisten')}
          className="w-full h-12 text-left justify-start md:w-auto md:h-auto md:text-center md:justify-center"
        >
          📄 Gespeicherte Startlisten ({startlisten.length})
        </Button>
      </div>

      {activeTab === 'configs' && configs.length === 0 ? (
        <Card>
          <CardContent className="text-center py-10">
            <p className="text-muted-foreground mb-4">Noch keine Austragungsorte vorhanden.</p>
            <Link href="/km-orga/startlisten">
              <Button className="w-full h-12 md:w-auto md:h-auto">
                <Plus className="h-4 w-4 mr-2" />
                Ersten Austragungsort erstellen
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : activeTab === 'configs' ? (
        <div className="grid gap-4">
          {configs.map(config => (
            <Card key={config.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      {vereine[config.austragungsort] || config.austragungsort}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-4 mt-2">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {(() => {
                          try {
                            return new Date(config.startDatum).toLocaleDateString('de-DE');
                          } catch {
                            return config.startDatum || 'Unbekannt';
                          }
                        })()} um {config.startUhrzeit || '00:00'} Uhr
                      </span>
                      <span className="flex items-center gap-1">
                        <Target className="h-4 w-4" />
                        {(config.verfuegbareStaende || []).length} Stände
                      </span>
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/km-orga/startlisten?edit=${config.id}`}>
                      <Button variant="outline" size="sm" className="hidden md:flex">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(config.id)} className="hidden md:flex">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium mb-1">Stände:</p>
                    <div className="flex flex-wrap gap-1">
                      {(config.verfuegbareStaende || []).map(stand => (
                        <Badge key={stand} variant="secondary" className="text-xs">
                          {stand}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium mb-1">Disziplinen ({(config.disziplinen || []).length}):</p>
                    <div className="flex flex-wrap gap-1">
                      {(config.disziplinen || []).slice(0, 3).map(disziplin => (
                        <Badge key={disziplin} variant="outline" className="text-xs">
                          {disziplin}
                        </Badge>
                      ))}
                      {(config.disziplinen || []).length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{(config.disziplinen || []).length - 3} weitere
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 pt-2">
                    <span className="text-xs text-muted-foreground">
                      Erstellt: {(() => {
                        try {
                          if (!config.createdAt) return 'Unbekannt';
                          // Firebase Timestamp mit .seconds
                          if (config.createdAt.seconds) {
                            return new Date(config.createdAt.seconds * 1000).toLocaleDateString('de-DE');
                          }
                          return 'Unbekannt';
                        } catch {
                          return 'Unbekannt';
                        }
                      })()}
                    </span>
                    <div className="flex flex-col gap-2 w-full md:flex-row md:w-auto">
                      <Link href={`/startlisten-tool?id=${config.id}`} className="w-full md:w-auto">
                        <Button className="w-full h-12 text-left justify-start md:w-auto md:h-auto md:text-center md:justify-center">
                          <Play className="h-4 w-4 mr-2" />
                          Startlisten generieren
                        </Button>
                      </Link>
                      <Link href={`/km-orga/startlisten?edit=${config.id}`} className="w-full md:w-auto">
                        <Button variant="outline" className="w-full h-12 text-left justify-start md:hidden">
                          <Edit className="h-4 w-4 mr-2" />
                          Bearbeiten
                        </Button>
                      </Link>
                      <Button variant="outline" onClick={() => handleDelete(config.id)} className="w-full h-12 text-left justify-start md:hidden">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Löschen
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : activeTab === 'startlisten' && startlisten.length === 0 ? (
        <Card>
          <CardContent className="text-center py-10">
            <p className="text-muted-foreground mb-4">Noch keine Startlisten gespeichert.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {startlisten.map(liste => {
            const config = configs.find(c => c.id === liste.configId);
            
            return (
              <Card key={liste.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5" />
                        Startliste - {config ? (vereine[config.austragungsort] || config.austragungsort) : 'Unbekannter Austragungsort'}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-4 mt-2">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {(() => {
                            try {
                              // datum ist bereits ein String im Format "2026-02-07"
                              const date = new Date(liste.datum);
                              return date.toLocaleDateString('de-DE');
                            } catch {
                              return liste.datum || 'Unbekanntes Datum';
                            }
                          })()} um {config?.startUhrzeit || '09:00'} Uhr
                        </span>
                        <span>{liste.startliste?.length || 0} Starter</span>
                        <span>{(liste.startliste?.length || 0) > 0 ? Math.max(...liste.startliste.map((s: any) => s.durchgang || 1)) : 0} Durchgänge</span>
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => config ? window.location.href = `/startlisten-tool?id=${liste.configId}&startlisteId=${liste.id}` : null}
                        title={config ? "Startliste bearbeiten" : "Config nicht gefunden"}
                        className="hidden md:flex"
                        disabled={!config}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDeleteStartliste(liste.id)}
                        className="hidden md:flex"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium mb-1">Starter:</p>
                      <div className="text-sm text-muted-foreground">
                        {(liste.startliste || []).slice(0, 3).map((starter: any) => starter.name).join(', ')}
                        {(liste.startliste?.length || 0) > 3 && ` und ${(liste.startliste?.length || 0) - 3} weitere`}
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-xs text-muted-foreground">
                        Gespeichert: {(() => {
                          try {
                            const timestamp = liste.updatedAt || liste.createdAt;
                            if (!timestamp) return 'Unbekannt';
                            
                            // Firebase Timestamp mit .seconds oder ._seconds
                            const seconds = timestamp.seconds || timestamp._seconds;
                            if (seconds) {
                              return new Date(seconds * 1000).toLocaleDateString('de-DE');
                            }
                            return 'Unbekannt';
                          } catch {
                            return 'Unbekannt';
                          }
                        })()} um {(() => {
                          try {
                            const timestamp = liste.updatedAt || liste.createdAt;
                            if (!timestamp) return '00:00';
                            
                            const seconds = timestamp.seconds || timestamp._seconds;
                            if (seconds) {
                              return new Date(seconds * 1000).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
                            }
                            return '00:00';
                          } catch {
                            return '00:00';
                          }
                        })()} Uhr
                      </span>
                      <div className="flex flex-col gap-2 w-full md:flex-row md:w-auto">
                        <Button 
                          variant="outline" 
                          onClick={() => config ? window.location.href = `/startlisten-tool?id=${liste.configId}&startlisteId=${liste.id}` : null}
                          className="w-full h-12 text-left justify-start md:hidden"
                          disabled={!config}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Bearbeiten
                        </Button>

                        <div className="w-full md:w-auto">
                          <David21ImportDialog 
                            wettkampfId={`VW111_${liste.id.substring(0, 8)}`}
                            onImport={(results) => {
                              logDebug('Importierte Ergebnisse:', results);
                              toast({ 
                                title: '✅ Import erfolgreich', 
                                description: `${results.length} Ergebnisse für Startliste ${liste.id.substring(0, 8)} importiert` 
                              });
                            }}
                          />
                        </div>
                        <Button 
                          variant="outline" 
                          onClick={() => handleDeleteStartliste(liste.id)}
                          className="w-full h-12 text-left justify-start md:hidden"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Löschen
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
