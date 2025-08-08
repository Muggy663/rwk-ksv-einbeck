"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuthContext } from '@/components/auth/AuthContext';

export default function VereinSchuetzen() {
  const { toast } = useToast();
  const { user } = useAuthContext();
  const [schuetzen, setSchuetzen] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    if (user) {
      loadSchuetzen();
    }
  }, [user]);

  const loadSchuetzen = async () => {
    try {
      const response = await fetch('/api/shooters');
      
      if (response.ok) {
        const data = await response.json();
        setSchuetzen(data.data || []);
      } else {
        toast({ 
          title: 'Fehler', 
          description: 'Schützen konnten nicht geladen werden', 
          variant: 'destructive' 
        });
      }
    } catch (error) {
      toast({ 
        title: 'Fehler', 
        description: 'Verbindungsfehler beim Laden der Schützen', 
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteSchuetze = async (schuetzeId: string) => {
    if (!confirm('Schütze wirklich löschen?')) return;

    try {
      const response = await fetch(`/api/shooters/${schuetzeId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast({ title: 'Erfolg', description: 'Schütze gelöscht' });
        loadSchuetzen();
      } else {
        toast({ 
          title: 'Fehler', 
          description: 'Schütze konnte nicht gelöscht werden', 
          variant: 'destructive' 
        });
      }
    } catch (error) {
      toast({ 
        title: 'Fehler', 
        description: 'Löschen fehlgeschlagen', 
        variant: 'destructive' 
      });
    }
  };

  const filteredSchuetzen = schuetzen.filter(schuetze => {
    if (!filter) return true;
    const searchTerm = filter.toLowerCase();
    return (
      schuetze.name?.toLowerCase().includes(searchTerm) ||
      schuetze.firstName?.toLowerCase().includes(searchTerm) ||
      schuetze.lastName?.toLowerCase().includes(searchTerm)
    );
  });

  if (loading) {
    return (
      <div className="container py-8 max-w-6xl mx-auto">
        <div className="flex items-center justify-center py-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Lade Schützen...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-primary">🎯 Vereinsschützen</h1>
        <p className="text-muted-foreground">
          Verwaltung der Schützen Ihres Vereins
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Alle Schützen ({filteredSchuetzen.length})</CardTitle>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Schütze suchen..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="p-2 border border-gray-300 rounded text-sm"
            />
            <Button variant="outline" onClick={() => setFilter('')}>
              Filter zurücksetzen
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="p-2 text-left">Name</th>
                  <th className="p-2 text-left">Geburtsjahr</th>
                  <th className="p-2 text-left">Geschlecht</th>
                  <th className="p-2 text-left">Status</th>
                  <th className="p-2 text-left">Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {filteredSchuetzen.map(schuetze => (
                  <tr key={schuetze.id} className="border-b hover:bg-gray-50">
                    <td className="p-2 font-medium">
                      {schuetze.firstName && schuetze.lastName 
                        ? `${schuetze.firstName} ${schuetze.lastName}`
                        : schuetze.name || 'Unbekannt'
                      }
                    </td>
                    <td className="p-2">{schuetze.birthYear || '-'}</td>
                    <td className="p-2">{schuetze.gender || '-'}</td>
                    <td className="p-2">
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                        Aktiv
                      </span>
                    </td>
                    <td className="p-2">
                      <div className="flex gap-1">
                        <button className="text-blue-600 hover:text-blue-800 text-xs px-2 py-1 border border-blue-300 rounded">
                          ✏️ Bearbeiten
                        </button>
                        <button 
                          onClick={() => deleteSchuetze(schuetze.id)}
                          className="text-red-600 hover:text-red-800 text-xs px-2 py-1 border border-red-300 rounded"
                        >
                          🗑️ Löschen
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredSchuetzen.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              {filter ? 'Keine Schützen gefunden' : 'Noch keine Schützen registriert'}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}