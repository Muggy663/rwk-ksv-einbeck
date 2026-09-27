"use client";

// Öffentliche Vereins-Übersicht: zeigt alle Vereine mit Vereinsnummer und – falls
// hinterlegt – einem Anfahrt-Link (Google Maps). Reine Ansicht, nicht bearbeitbar.

import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { logError } from '@/lib/utils/secure-logger';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BackButton } from '@/components/ui/back-button';
import { Building2, MapPin, Search, Hash } from 'lucide-react';

interface ClubInfo {
  id: string;
  name: string;
  shortName?: string;
  clubNumber?: string;
  mapsUrl?: string;
}

export default function VereineUebersichtPage() {
  const [clubs, setClubs] = useState<ClubInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [suche, setSuche] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDocs(collection(db, 'clubs'));
        const list: ClubInfo[] = snap.docs.map(d => {
          const data = d.data() as any;
          return {
            id: d.id,
            name: data.name || 'Unbenannter Verein',
            shortName: data.shortName || undefined,
            clubNumber: data.clubNumber || undefined,
            mapsUrl: typeof data.mapsUrl === 'string' && data.mapsUrl.trim() ? data.mapsUrl.trim() : undefined,
          };
        });
        // Nach Vereinsnummer sortieren (08-001, 08-002 …), Vereine ohne Nummer ans Ende.
        list.sort((a, b) => {
          if (a.clubNumber && b.clubNumber) return a.clubNumber.localeCompare(b.clubNumber);
          if (a.clubNumber) return -1;
          if (b.clubNumber) return 1;
          return a.name.localeCompare(b.name);
        });
        setClubs(list);
      } catch (e) {
        logError('Vereine laden fehlgeschlagen:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const gefiltert = clubs.filter(c => {
    const q = suche.trim().toLowerCase();
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      (c.shortName || '').toLowerCase().includes(q) ||
      (c.clubNumber || '').toLowerCase().includes(q)
    );
  });

  const mitAnfahrt = clubs.filter(c => c.mapsUrl).length;

  return (
    <div className="container py-8 max-w-6xl mx-auto">
      {/* Hero */}
      <div className="relative mb-8 overflow-hidden rounded-2xl border bg-gradient-to-br from-indigo-500/10 via-background to-background p-6 animate-fade-in">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 p-2.5 text-white shadow-lg">
              <Building2 className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 bg-clip-text text-transparent">
                Vereine im KSV Einbeck
              </h1>
              <p className="text-sm text-muted-foreground">
                {clubs.length} Vereine · {mitAnfahrt} mit Anfahrt-Link
              </p>
            </div>
          </div>
          <BackButton fallbackHref="/" />
        </div>
      </div>

      {/* Suche */}
      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Verein oder Nummer suchen…"
          value={suche}
          onChange={(e) => setSuche(e.target.value)}
          className="pl-9"
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 rounded-xl border bg-muted/30 animate-pulse" />
          ))}
        </div>
      ) : gefiltert.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">Keine Vereine gefunden.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {gefiltert.map((club, i) => (
            <Card
              key={club.id}
              className="group overflow-hidden border shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg animate-fade-in"
              style={{ animationDelay: `${Math.min(i, 12) * 40}ms` }}
            >
              <div className="h-1.5 w-full bg-gradient-to-r from-indigo-500 to-violet-600" />
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="font-semibold text-lg leading-tight truncate" title={club.name}>
                      {club.name}
                    </h2>
                    {club.shortName && (
                      <p className="text-xs text-muted-foreground mt-0.5">{club.shortName}</p>
                    )}
                  </div>
                  <div className="rounded-lg bg-indigo-500/10 p-2 text-indigo-600 dark:text-indigo-300 shrink-0">
                    <Building2 className="h-5 w-5" />
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2 text-sm">
                  <Hash className="h-4 w-4 text-muted-foreground shrink-0" />
                  {club.clubNumber ? (
                    <span className="font-mono font-medium">{club.clubNumber}</span>
                  ) : (
                    <span className="text-muted-foreground">keine Vereinsnummer</span>
                  )}
                </div>

                <div className="mt-4">
                  {club.mapsUrl ? (
                    <Button asChild size="sm" className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700">
                      <a href={club.mapsUrl} target="_blank" rel="noopener noreferrer">
                        <MapPin className="mr-2 h-4 w-4" />
                        Anfahrt öffnen
                      </a>
                    </Button>
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <MapPin className="h-4 w-4 shrink-0" />
                      Kein Anfahrt-Link hinterlegt
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <p className="mt-8 text-center text-xs text-muted-foreground">
        Anfahrts-Links werden von den Vereinen bzw. der Verwaltung gepflegt.
      </p>
    </div>
  );
}
