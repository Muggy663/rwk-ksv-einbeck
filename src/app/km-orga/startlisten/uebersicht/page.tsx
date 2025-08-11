"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Edit, Play, Trash2, Plus, Calendar, MapPin, Target, Eye, ArrowLeft, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { David21ImportDialog } from '@/components/David21ImportDialog';
import { db } from '@/lib/firebase/config';
import { collection, getDocs, deleteDoc, doc, orderBy, query } from 'firebase/firestore';
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
        // Konfigurationen laden
        const configsSnapshot = await getDocs(
          query(collection(db, 'km_startlisten_configs'), orderBy('createdAt', 'desc'))
        );
        const configsData = configsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date()
        })) as StartlistConfig[];
        setConfigs(configsData);

        // Gespeicherte Startlisten laden
        const startlistenSnapshot = await getDocs(
          query(collection(db, 'km_startlisten'), orderBy('createdAt', 'desc'))
        );
        const startlistenData = startlistenSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date()
        })) as GespeicherteStartliste[];
        setStartlisten(startlistenData);

        // Vereine für Namen laden
        const clubsSnapshot = await getDocs(collection(db, 'clubs'));
        const clubsMap: {[key: string]: string} = {};
        clubsSnapshot.docs.forEach(doc => {
          clubsMap[doc.id] = doc.data().name;
        });
        setVereine(clubsMap);
      } catch (error) {
        console.error('Fehler beim Laden:', error);
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
      console.error('Fehler beim Löschen:', error);
      toast({ title: 'Fehler', description: 'Konfiguration konnte nicht gelöscht werden.', variant: 'destructive' });
    }
  };

  const handleDeleteStartliste = async (startlisteId: string) => {
    if (!confirm('Startliste wirklich löschen?')) return;
    
    try {
      await deleteDoc(doc(db, 'km_startlisten', startlisteId));
      setStartlisten(prev => prev.filter(s => s.id !== startlisteId));
      toast({ 
        title: '✅ Gelöscht', 
        description: 'Startliste wurde erfolgreich entfernt.',
        duration: 3000
      });
    } catch (error) {
      console.error('Fehler beim Löschen:', error);
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
    <div className="container py-8 max-w-6xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/km-orga">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-primary">📄 Startlisten-Übersicht</h1>
          <p className="text-muted-foreground">
            Konfigurationen und gespeicherte Startlisten verwalten
          </p>
        </div>
        <Link href="/km-orga/startlisten">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Neue Konfiguration
          </Button>
        </Link>
      </div>
      
      {/* Tabs */}
      <div className="flex space-x-1 mb-6">
        <Button 
          variant={activeTab === 'configs' ? 'default' : 'outline'}
          onClick={() => setActiveTab('configs')}
        >
          Konfigurationen ({configs.length})
        </Button>
        <Button 
          variant={activeTab === 'startlisten' ? 'default' : 'outline'}
          onClick={() => setActiveTab('startlisten')}
        >
          Gespeicherte Startlisten ({startlisten.length})
        </Button>
      </div>

      {activeTab === 'configs' && configs.length === 0 ? (
        <Card>
          <CardContent className="text-center py-10">
            <p className="text-muted-foreground mb-4">Noch keine Konfigurationen vorhanden.</p>
            <Link href="/km-orga/startlisten">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Erste Konfiguration erstellen
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
                        {new Date(config.startDatum).toLocaleDateString('de-DE')} um {config.startUhrzeit} Uhr
                      </span>
                      <span className="flex items-center gap-1">
                        <Target className="h-4 w-4" />
                        {config.verfuegbareStaende.length} Stände
                      </span>
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleDelete(config.id)}>
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
                      {config.verfuegbareStaende.map(stand => (
                        <Badge key={stand} variant="secondary" className="text-xs">
                          {stand}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium mb-1">Disziplinen ({config.disziplinen.length}):</p>
                    <div className="flex flex-wrap gap-1">
                      {config.disziplinen.slice(0, 3).map(disziplin => (
                        <Badge key={disziplin} variant="outline" className="text-xs">
                          {disziplin}
                        </Badge>
                      ))}
                      {config.disziplinen.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{config.disziplinen.length - 3} weitere
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <span className="text-xs text-muted-foreground">
                      Erstellt: {config.createdAt.toLocaleDateString('de-DE')}
                    </span>
                    <Link href={`/startlisten-tool?id=${config.id}`}>
                      <Button>
                        <Play className="h-4 w-4 mr-2" />
                        Startlisten generieren
                      </Button>
                    </Link>
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
                        Startliste - {config ? (vereine[config.austragungsort] || 'Einbecker Schützengilde') : 'Einbecker Schützengilde'}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-4 mt-2">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(liste.datum).toLocaleDateString('de-DE')} um {config?.startUhrzeit || '09:00'} Uhr
                        </span>
                        <span>{liste.startliste.length} Starter</span>
                        <span>{Math.max(...liste.startliste.map((s: any) => s.durchgang || 1))} Durchgänge</span>
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/km-orga/startlisten/generieren/${liste.configId}?startlisteId=${liste.id}`}>
                        <Button 
                          variant="outline" 
                          size="sm"
                          title="Startliste bearbeiten"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDeleteStartliste(liste.id)}
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
                        {liste.startliste.slice(0, 3).map((starter: any) => starter.name).join(', ')}
                        {liste.startliste.length > 3 && ` und ${liste.startliste.length - 3} weitere`}
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-xs text-muted-foreground">
                        Gespeichert: {(() => {
                          const date = liste.updatedAt ? (liste.updatedAt.toDate ? liste.updatedAt.toDate() : new Date(liste.updatedAt)) : liste.createdAt;
                          return date.toLocaleDateString('de-DE');
                        })()} um {(() => {
                          const date = liste.updatedAt ? (liste.updatedAt.toDate ? liste.updatedAt.toDate() : new Date(liste.updatedAt)) : liste.createdAt;
                          return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
                        })()} Uhr
                      </span>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            // TODO: PDF Export der gespeicherten Startliste
                            toast({ title: 'Info', description: 'PDF-Export wird implementiert' });
                          }}
                        >
                          PDF Export
                        </Button>
                        <David21ImportDialog 
                          wettkampfId={`VW111_${liste.id.substring(0, 8)}`}
                          onImport={(results) => {
                            console.log('Importierte Ergebnisse:', results);
                            toast({ 
                              title: '✅ Import erfolgreich', 
                              description: `${results.length} Ergebnisse für Startliste ${liste.id.substring(0, 8)} importiert` 
                            });
                          }}
                        />
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
