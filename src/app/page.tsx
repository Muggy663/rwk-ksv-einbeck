// src/app/page.tsx
"use client";
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ListChecks, Loader2, Info } from 'lucide-react';
import type { LeagueUpdateEntry, FirestoreLeagueSpecificDiscipline } from '@/types/rwk';
import { uiDisciplineFilterOptions } from '@/types/rwk';
import { db } from '@/lib/firebase/config';
import { collection, query, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

const LEAGUE_UPDATES_COLLECTION = "league_updates";

export default function HomePage() {
  const [updates, setUpdates] = useState<LeagueUpdateEntry[]>([]);
  const [loadingUpdates, setLoadingUpdates] = useState<boolean>(true);

  const getUIDisciplineLabel = (specificType?: FirestoreLeagueSpecificDiscipline): string => {
    if (!specificType) return 'Unbek. Disziplin';
    const uiOption = uiDisciplineFilterOptions.find(opt => opt.firestoreTypes.includes(specificType));
    return uiOption ? uiOption.label.replace(/\s*\(.*\)\s*$/, '') : specificType;
  };

  useEffect(() => {
    const fetchUpdates = async () => {
      setLoadingUpdates(true);
      try {
        const updatesQuery = query(
          collection(db, LEAGUE_UPDATES_COLLECTION),
          orderBy("timestamp", "desc"),
          limit(7)
        );
        const querySnapshot = await getDocs(updatesQuery);
        const fetchedUpdates: LeagueUpdateEntry[] = [];
        querySnapshot.forEach((doc) => {
          fetchedUpdates.push({ id: doc.id, ...doc.data() } as LeagueUpdateEntry);
        });
        setUpdates(fetchedUpdates);
      } catch (error) {
        console.error("Error fetching league updates for homepage:", error);
      } finally {
        setLoadingUpdates(false);
      }
    };

    fetchUpdates();
  }, []);

  return (
    <div className="space-y-12">
      <section className="text-center">
        <Image
          src="/images/logo.png"
          alt="KSV Einbeck Logo"
          width={150}
          height={150}
          className="mx-auto mb-6 rounded-lg shadow-md"
          data-ai-hint="club logo"
          priority
        />
        <h1 className="text-4xl font-bold text-primary mb-2">
          Willkommen beim Rundenwettkampf KSV Einbeck
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Aktuelle Ergebnisse, Tabellen und Informationen zu den Rundenwettkämpfen des Kreisschützenverbandes Einbeck e.V.
        </p>
      </section>

      <Separator />

      <section>
        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <ListChecks className="h-7 w-7 text-accent" />
              <CardTitle className="text-2xl text-accent">Letzte Ergebnis-Updates</CardTitle>
            </div>
            <CardDescription>
              Die neuesten Aktualisierungen der Ergebnistabellen.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingUpdates ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-3 text-muted-foreground">Lade Updates...</p>
              </div>
            ) : updates.length > 0 ? (
              <ul className="space-y-4">
                {updates.map((update) => (
                  <li key={update.id} className="p-4 bg-muted/50 rounded-md shadow-sm hover:bg-muted/70 transition-colors">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                      <p className="text-md font-medium text-foreground">
                        Ergebnisse in der Liga <strong className="text-primary">{update.leagueName} {getUIDisciplineLabel(update.leagueType)}</strong> ({update.competitionYear}) hinzugefügt.
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 sm:mt-0">
                        {update.timestamp ? format((update.timestamp as Timestamp).toDate(), 'dd. MMMM yyyy, HH:mm', { locale: de }) : '-'} Uhr
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Info className="mx-auto h-10 w-10 mb-3 text-primary/70" />
                <p>Momentan keine aktuellen Ergebnis-Updates vorhanden.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
