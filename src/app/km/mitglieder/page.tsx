"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useKMAuth } from '@/hooks/useKMAuth';
import { collection, query, orderBy, limit, startAfter, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export default function KMMitglieder() {
  const { toast } = useToast();
  const { hasKMAccess, loading: authLoading } = useKMAuth();
  const [schuetzen, setSchuetzen] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    if (hasKMAccess && !authLoading) {
      loadSchuetzen();
    }
  }, [hasKMAccess, authLoading]);

  const loadSchuetzen = async (loadMore = false) => {
    try {
      let batchQuery;
      
      if (loadMore && lastDoc) {
        batchQuery = query(
          collection(db, 'km_shooters'),
          orderBy('name'),
          startAfter(lastDoc),
          limit(500)
        );
      } else {
        batchQuery = query(
          collection(db, 'km_shooters'),
          orderBy('name'),
          limit(500)
        );
      }

      const snapshot = await getDocs(batchQuery);
      const newSchuetzen = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      if (loadMore) {
        setSchuetzen(prev => [...prev, ...newSchuetzen]);
      } else {
        setSchuetzen(newSchuetzen);
      }

      setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
      setHasMore(snapshot.docs.length === 500);
    } catch (error) {
      toast({ 
        title: 'Fehler', 
        description: 'Schützen konnten nicht geladen werden', 
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="container py-8 max-w-6xl mx-auto">
        <div className="flex items-center justify-center py-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Lade KM-Mitglieder...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!hasKMAccess) {
    return (
      <div className="container py-8 max-w-6xl mx-auto">
        <div className="text-center py-10">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Zugriff verweigert</h1>
          <p className="text-gray-600 mb-4">
            Sie haben keine Berechtigung für den KM-Bereich.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-primary">👥 KM-Mitglieder</h1>
        <p className="text-muted-foreground">
          Übersicht aller registrierten KM-Schützen
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Alle KM-Schützen ({schuetzen.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="p-2 text-left">Name</th>
                  <th className="p-2 text-left">Verein</th>
                  <th className="p-2 text-left">Geburtsjahr</th>
                  <th className="p-2 text-left">Geschlecht</th>
                  <th className="p-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {schuetzen.map(schuetze => (
                  <tr key={schuetze.id} className="border-b hover:bg-gray-50">
                    <td className="p-2 font-medium">
                      {schuetze.firstName && schuetze.lastName 
                        ? `${schuetze.firstName} ${schuetze.lastName}`
                        : schuetze.name || 'Unbekannt'
                      }
                    </td>
                    <td className="p-2">{schuetze.clubName || 'Unbekannt'}</td>
                    <td className="p-2">{schuetze.birthYear || '-'}</td>
                    <td className="p-2">{schuetze.gender || '-'}</td>
                    <td className="p-2">
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                        Aktiv
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {hasMore && (
            <div className="mt-4 text-center">
              <Button 
                variant="outline" 
                onClick={() => loadSchuetzen(true)}
                disabled={loading}
              >
                Weitere laden
              </Button>
            </div>
          )}

          {schuetzen.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Keine KM-Schützen gefunden
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}