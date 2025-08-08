"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface Duplicate {
  name: string;
  team: string;
  entries: Array<{
    id: string;
    durchgang: number;
    totalRinge: number;
    seasonName: string;
    enteredBy: string;
    entryDate: string;
  }>;
}

export default function DuplicateCleanup() {
  const { toast } = useToast();
  const [duplicates, setDuplicates] = useState<Duplicate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    findDuplicates();
  }, []);

  const findDuplicates = async () => {
    try {
      const response = await fetch('/api/admin/find-duplicates');
      if (response.ok) {
        const data = await response.json();
        setDuplicates(data.duplicates || []);
      }
    } catch (error) {
      toast({ title: 'Fehler', description: 'Duplikate konnten nicht geladen werden', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const removeDuplicate = async (name: string, team: string, removeId: string) => {
    if (!confirm(`Eintrag ${removeId} für ${name} wirklich löschen?`)) return;
    
    try {
      const response = await fetch('/api/admin/remove-duplicate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, team, removeId })
      });
      
      if (response.ok) {
        toast({ title: 'Erfolg', description: 'Duplikat entfernt' });
        findDuplicates();
      }
    } catch (error) {
      toast({ title: 'Fehler', description: 'Löschen fehlgeschlagen', variant: 'destructive' });
    }
  };

  const repairKnownDuplicates = async () => {
    if (!confirm('Alle gefundenen Duplikate automatisch reparieren?')) return;
    
    try {
      console.log('🔧 Starte Reparatur...');
      const response = await fetch('/api/admin/repair-duplicates', {
        method: 'POST'
      });
      
      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);
      
      if (response.ok) {
        toast({ title: 'Reparatur abgeschlossen', description: `${data.results?.length || 0} Duplikate entfernt` });
        setTimeout(() => findDuplicates(), 1000); // Kurz warten dann neu laden
      } else {
        toast({ title: 'Fehler', description: data.error || 'Unbekannter Fehler', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Reparatur-Fehler:', error);
      toast({ title: 'Fehler', description: 'Reparatur fehlgeschlagen', variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <div className="container py-8 max-w-6xl mx-auto">
        <div className="text-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Suche Duplikate...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-primary">🔧 Duplikat-Bereinigung</h1>
        <p className="text-muted-foreground">Verwaltung doppelter Schützen-Einträge</p>
      </div>

      {duplicates.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-green-600 font-medium">✅ Keine Duplikate gefunden!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {duplicates.map((duplicate, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="text-red-600">
                  🚨 {duplicate.name} ({duplicate.team})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {duplicate.entries.map((entry, entryIndex) => (
                    <div key={entryIndex} className="border rounded p-4">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-medium">ID: {entry.id}</span>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => removeDuplicate(duplicate.name, duplicate.team, entry.id)}
                        >
                          Löschen
                        </Button>
                      </div>
                      <div className="text-sm space-y-1">
                        <div>Durchgang: {entry.durchgang}</div>
                        <div>Ringe: {entry.totalRinge}</div>
                        <div>Saison: {entry.seasonName}</div>
                        <div className="text-xs text-gray-500 mt-2">
                          <div>Eingegeben von: {entry.enteredBy}</div>
                          <div>Datum: {entry.entryDate}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="mt-6 flex gap-4">
        <Button onClick={findDuplicates} variant="outline">
          🔄 Neu scannen
        </Button>
        <Button onClick={repairKnownDuplicates} variant="destructive">
          🔧 Alle Duplikate reparieren
        </Button>
      </div>
    </div>
  );
}