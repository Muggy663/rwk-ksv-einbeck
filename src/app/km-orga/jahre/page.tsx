"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { BackButton } from '@/components/ui/back-button';
import { useKMAuth } from '@/hooks/useKMAuth';
import { CalendarDays, Plus, Settings } from 'lucide-react';

interface KMJahr {
  id: string;
  jahr: number;
  meldeschluss: string;
  status: 'aktiv' | 'archiviert' | 'vorbereitung';
  beschreibung?: string;
}

export default function KMJahreVerwaltung() {
  const { hasKMAccess, userRole, loading } = useKMAuth();
  const [jahre, setJahre] = useState<KMJahr[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    jahr: new Date().getFullYear() + 1,
    meldeschluss: '15.12.',
    beschreibung: ''
  });

  useEffect(() => {
    loadJahre();
  }, []);

  const loadJahre = async () => {
    try {
      const response = await fetch('/api/km/jahre');
      if (response.ok) {
        const data = await response.json();
        setJahre(data.data || []);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Jahre:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createJahr = async () => {
    try {
      const response = await fetch('/api/km/jahre', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jahr: formData.jahr,
          meldeschluss: `${formData.meldeschluss}${formData.jahr - 1}`,
          status: 'vorbereitung',
          beschreibung: formData.beschreibung
        })
      });

      if (response.ok) {
        await loadJahre();
        setShowForm(false);
        setFormData({
          jahr: formData.jahr + 1,
          meldeschluss: '15.12.',
          beschreibung: ''
        });
      }
    } catch (error) {
      console.error('Fehler beim Erstellen:', error);
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
        console.log('Status updated successfully');
        await loadJahre();
      } else {
        console.error('Update failed:', response.status);
      }
    } catch (error) {
      console.error('Fehler beim Update:', error);
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
    <div className="container py-4 px-2 max-w-6xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center mb-2">
          <BackButton className="mr-2" fallbackHref="/km-orga" />
          <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
            <CalendarDays className="h-8 w-8" />
            KM-Jahresverwaltung
          </h1>
        </div>
        <p className="text-muted-foreground">
          Kreismeisterschafts-Jahre anlegen und verwalten
        </p>
      </div>

      {/* Neues Jahr anlegen */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Neues KM-Jahr anlegen
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!showForm ? (
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Jahr hinzufügen
            </Button>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                    placeholder="z.B. Luftdruck-KM"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={createJahr}>Erstellen</Button>
                <Button variant="outline" onClick={() => setShowForm(false)}>Abbrechen</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bestehende Jahre */}
      <div className="grid gap-4">
        {jahre.map((jahr) => (
          <Card key={jahr.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    🏆 KM {jahr.jahr}
                    <Badge className={getStatusColor(jahr.status)}>
                      {jahr.status}
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    Meldeschluss: {jahr.meldeschluss}
                    {jahr.beschreibung && ` • ${jahr.beschreibung}`}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  {jahr.status === 'vorbereitung' && (
                    <Button 
                      size="sm" 
                      onClick={() => updateStatus(jahr.id, 'aktiv')}
                    >
                      Aktivieren
                    </Button>
                  )}
                  {jahr.status === 'aktiv' && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => updateStatus(jahr.id, 'archiviert')}
                    >
                      Archivieren
                    </Button>
                  )}
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => {
                      // TODO: Jahr bearbeiten (Meldeschluss, Beschreibung ändern)
                      console.log('Jahr bearbeiten:', jahr.id);
                    }}
                  >
                    <Settings className="h-4 w-4" />
                  </Button>

                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>

      {jahre.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <CalendarDays className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Noch keine KM-Jahre angelegt.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}