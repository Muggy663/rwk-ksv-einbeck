"use client";

import { useState, useEffect } from 'react';
import { logError, logDebug } from '@/lib/utils/secure-logger';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { NativeSelect } from '@/components/ui/native-select';
import { BackButton } from '@/components/ui/back-button';
import { useKMAuth } from '@/hooks/useKMAuth';
import { CalendarDays, Plus, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type DisziplinTyp = 'KK' | 'LD' | 'KKP';

interface KMSaison {
  id: string;
  jahr: number;
  disziplinTyp: DisziplinTyp;
  name: string;
  meldeschluss: string;
  status: 'aktiv' | 'archiviert' | 'vorbereitung';
  beschreibung?: string;
}

export default function KMJahreVerwaltung() {
  const { hasKMAccess, userRole, loading } = useKMAuth();
  const { toast } = useToast();
  const [saisons, setSaisons] = useState<KMSaison[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSaison, setEditingSaison] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    jahr: new Date().getFullYear() + 1,
    disziplinTyp: 'KK' as DisziplinTyp,
    meldeschluss: '15.12.',
    beschreibung: ''
  });
  const [editData, setEditData] = useState({
    meldeschluss: '',
    beschreibung: ''
  });


  useEffect(() => {
    loadSaisons();
  }, []);

  const loadSaisons = async () => {
    try {
      const response = await fetch('/api/km/jahre');
      logDebug('API Response Status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        logDebug('API Response Data:', data);
        setSaisons(data.data || []);
      } else {
        logError('API Error:', response.status, response.statusText);
        const errorData = await response.text();
        logError('Error Details:', errorData);
      }
    } catch (error) {
      logError('Fehler beim Laden der Saisons:', error);
      toast({ title: 'Fehler', description: 'Saisons konnten nicht geladen werden', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const createSaison = async () => {
    try {
      const response = await fetch('/api/km/jahre', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jahr: formData.jahr,
          disziplinTyp: formData.disziplinTyp,
          meldeschluss: formData.meldeschluss.includes('.') && formData.meldeschluss.length > 6 ? formData.meldeschluss : `${formData.meldeschluss}${formData.jahr - 1}`,
          status: 'vorbereitung',
          beschreibung: formData.beschreibung
        })
      });

      const result = await response.json();
      
      if (response.ok) {
        toast({ title: 'Erfolg', description: result.message });
        await loadSaisons();
        setShowForm(false);
        setFormData({
          jahr: formData.jahr,
          disziplinTyp: 'KK',
          meldeschluss: '15.12.',
          beschreibung: ''
        });
      } else {
        toast({ title: 'Fehler', description: result.error, variant: 'destructive' });
      }
    } catch (error) {
      logError('Fehler beim Erstellen:', error);
      toast({ title: 'Fehler', description: 'Saison konnte nicht erstellt werden', variant: 'destructive' });
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      const response = await fetch(`/api/km/jahre/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        toast({ title: 'Erfolg', description: 'Status aktualisiert' });
        await loadSaisons();
      } else {
        toast({ title: 'Fehler', description: 'Status-Update fehlgeschlagen', variant: 'destructive' });
      }
    } catch (error) {
      logError('Fehler beim Update:', error);
      toast({ title: 'Fehler', description: 'Update fehlgeschlagen', variant: 'destructive' });
    }
  };

  const updateSaison = async (id: string) => {
    try {
      const response = await fetch(`/api/km/jahre/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meldeschluss: editData.meldeschluss,
          beschreibung: editData.beschreibung
        })
      });

      if (response.ok) {
        toast({ title: 'Erfolg', description: 'Saison aktualisiert' });
        setEditingSaison(null);
        setEditData({ meldeschluss: '', beschreibung: '' });
        await loadSaisons();
      } else {
        toast({ title: 'Fehler', description: 'Update fehlgeschlagen', variant: 'destructive' });
      }
    } catch (error) {
      logError('Fehler beim Update:', error);
      toast({ title: 'Fehler', description: 'Update fehlgeschlagen', variant: 'destructive' });
    }
  };

  if (loading || isLoading) {
    return (
      <div className="container py-8 max-w-6xl mx-auto">
        <div className="flex flex-col items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-lg text-gray-600">Lade KM-Jahre...</p>
        </div>
      </div>
    );
  }

  if (!hasKMAccess || (userRole !== 'admin' && userRole !== 'km_organisator')) {
    return (
      <div className="container py-8 max-w-6xl mx-auto">
        <div className="text-center py-10">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Zugriff verweigert</h1>
          <p className="text-gray-600 mb-4">Sie haben keine Berechtigung für die KM-Jahresverwaltung.</p>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'aktiv': return 'bg-green-100 text-green-800';
      case 'vorbereitung': return 'bg-blue-100 text-blue-800';
      case 'archiviert': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="px-2 md:px-4 py-4 max-w-6xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center mb-2">
          <BackButton className="mr-2" fallbackHref="/km-orga" />
          <h1 className="text-xl md:text-3xl font-bold text-primary flex items-center gap-2">
            <CalendarDays className="h-6 md:h-8 w-6 md:w-8" />
            KM-Saisonverwaltung
          </h1>
        </div>
        <p className="text-sm md:text-base text-muted-foreground">
          Kreismeisterschafts-Saisons anlegen und verwalten (KK, LD & KKP getrennt)
        </p>
      </div>

      {/* Neues Jahr anlegen */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Neue KM-Saison anlegen
          </CardTitle>
          <CardDescription>
            Pro Jahr gibt es drei separate Kreismeisterschaften: Kleinkaliber (KK), Luftdruck (LD) und Kleinkaliber Pistole (KKP)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!showForm ? (
            <Button onClick={() => setShowForm(true)} className="w-full md:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Saison hinzufügen
            </Button>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="jahr">Jahr</Label>
                  <Input
                    id="jahr"
                    type="number"
                    value={formData.jahr}
                    onChange={(e) => setFormData({...formData, jahr: parseInt(e.target.value)})}
                  />
                </div>
                <div>
                  <Label htmlFor="disziplinTyp">Disziplin-Typ</Label>
                  <NativeSelect
                    value={formData.disziplinTyp}
                    onValueChange={(value) => setFormData({...formData, disziplinTyp: value as DisziplinTyp})}
                    options={[
                      { value: 'KK', label: 'Kleinkaliber (KK)' },
                      { value: 'LD', label: 'Luftdruck (LD)' },
                      { value: 'KKP', label: 'Kleinkaliber Pistole (KKP)' }
                    ]}
                  />
                </div>
                <div>
                  <Label htmlFor="meldeschluss">Meldeschluss</Label>
                  <Input
                    id="meldeschluss"
                    value={formData.meldeschluss}
                    onChange={(e) => setFormData({...formData, meldeschluss: e.target.value})}
                    placeholder="15.12."
                  />
                </div>
                <div>
                  <Label htmlFor="beschreibung">Beschreibung (optional)</Label>
                  <Input
                    id="beschreibung"
                    value={formData.beschreibung}
                    onChange={(e) => setFormData({...formData, beschreibung: e.target.value})}
                    placeholder="Zusätzliche Informationen"
                  />
                </div>
              </div>
              <div className="flex flex-col md:flex-row gap-2">
                <Button onClick={createSaison} className="w-full md:w-auto">Saison erstellen</Button>
                <Button variant="outline" onClick={() => setShowForm(false)} className="w-full md:w-auto">Abbrechen</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bestehende Saisons */}
      <div className="grid gap-4">
        {saisons.map((saison) => (
          <Card key={saison.id}>
            <CardHeader>
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2">
                    {saison.name}
                    <Badge className={getStatusColor(saison.status)}>
                      {saison.status}
                    </Badge>
                  </CardTitle>
                  {editingSaison === saison.id ? (
                    <div className="space-y-2 mt-2">
                      <div>
                        <Label className="text-xs">Meldeschluss:</Label>
                        <Input
                          value={editData.meldeschluss}
                          onChange={(e) => setEditData({...editData, meldeschluss: e.target.value})}
                          className="h-8 text-sm"
                          placeholder="15.12.2025"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Beschreibung:</Label>
                        <Input
                          value={editData.beschreibung}
                          onChange={(e) => setEditData({...editData, beschreibung: e.target.value})}
                          className="h-8 text-sm"
                          placeholder="Zusätzliche Informationen"
                        />
                      </div>
                    </div>
                  ) : (
                    <CardDescription>
                      Meldeschluss: {saison.meldeschluss}
                      {saison.beschreibung && ` • ${saison.beschreibung}`}
                    </CardDescription>
                  )}
                </div>
                <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
                  {editingSaison === saison.id ? (
                    <>
                      <Button 
                        size="sm" 
                        onClick={() => updateSaison(saison.id)}
                        className="w-full md:w-auto"
                      >
                        Speichern
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          setEditingSaison(null);
                          setEditData({ meldeschluss: '', beschreibung: '' });
                        }}
                        className="w-full md:w-auto"
                      >
                        Abbrechen
                      </Button>
                    </>
                  ) : (
                    <>
                      {saison.status === 'vorbereitung' && (
                        <Button 
                          size="sm" 
                          onClick={() => updateStatus(saison.id, 'aktiv')}
                          className="w-full md:w-auto"
                        >
                          Aktivieren
                        </Button>
                      )}
                      {saison.status === 'aktiv' && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => updateStatus(saison.id, 'archiviert')}
                          className="w-full md:w-auto"
                        >
                          Archivieren
                        </Button>
                      )}
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          setEditingSaison(saison.id);
                          setEditData({
                            meldeschluss: saison.meldeschluss,
                            beschreibung: saison.beschreibung || ''
                          });
                        }}
                        className="w-full md:w-auto"
                      >
                        <Edit className="h-4 w-4 mr-2 md:mr-0" />
                        <span className="md:hidden">Bearbeiten</span>
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>

      {saisons.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <CalendarDays className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Noch keine KM-Saisons angelegt.</p>
            <p className="text-xs text-muted-foreground mt-2">Erstellen Sie separate Saisons für Kleinkaliber, Luftdruck und Kleinkaliber Pistole.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
