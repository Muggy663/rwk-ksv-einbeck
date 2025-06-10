"use client";
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ListChecks, Loader2, Info, CalendarDays, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getUIDisciplineValueFromSpecificType, uiDisciplineFilterOptions } from '@/types/rwk';
import { db } from '@/lib/firebase/config';
import { collection, query, orderBy, limit as firestoreLimit, getDocs, Timestamp } from 'firebase/firestore';
import { format, addDays } from 'date-fns';
import { de } from 'date-fns/locale';
import { fetchEvents } from '@/lib/services/calendar-service';

const LEAGUE_UPDATES_COLLECTION = "league_updates";

export default function HomePage() {
  const [updates, setUpdates] = useState([]);
  const [loadingUpdates, setLoadingUpdates] = useState(true);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);

  // Lade die letzten Ergebnis-Updates
  useEffect(() => {
    const fetchUpdates = async () => {
      setLoadingUpdates(true);
      try {
        const updatesQuery = query(
          collection(db, LEAGUE_UPDATES_COLLECTION),
          orderBy("timestamp", "desc"),
          firestoreLimit(7)
        );
        const querySnapshot = await getDocs(updatesQuery);
        const fetchedUpdates = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          fetchedUpdates.push({ 
            id: doc.id, 
            ...data,
            leagueType: data.leagueType
          });
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

  // Lade die nächsten Termine
  useEffect(() => {
    const loadEvents = async () => {
      setIsLoadingEvents(true);
      try {
        // Lade Termine für die nächsten 30 Tage
        const now = new Date();
        const endDate = addDays(now, 30);
        const events = await fetchEvents(now, endDate);
        setUpcomingEvents(events.slice(0, 3)); // Zeige maximal 3 Termine an
      } catch (error) {
        console.error('Fehler beim Laden der Termine:', error);
      } finally {
        setIsLoadingEvents(false);
      }
    };

    loadEvents();
  }, []);

  // Funktion zum Bestimmen der Badge-Farbe basierend auf dem Termintyp
  const getBadgeVariant = (type, isKreisverband) => {
    if (isKreisverband) return "destructive";
    switch (type) {
      case "Durchgang": return "default";
      case "durchgang": return "default";
      case "kreismeisterschaft": return "secondary";
      case "sitzung": return "outline";
      default: return "secondary";
    }
  };

  // Funktion zum Formatieren des Termintyps mit großem Anfangsbuchstaben
  const formatEventType = (type) => {
    if (!type) return "";
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  return (
    <div className="container py-8 max-w-7xl mx-auto">
      {/* Logo und Willkommenstext */}
      <section className="text-center mb-12">
        <Image
          src="/images/logo.png"
          alt="KSV Einbeck Logo"
          width={150}
          height={150}
          className="mx-auto mb-6 rounded-lg shadow-md"
          style={{ width: 150, height: 150 }}
          priority
        />
        <h1 className="text-4xl font-bold text-primary mb-2">
          Willkommen beim Rundenwettkampf KSV Einbeck
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Aktuelle Ergebnisse, Tabellen und Informationen zu den Rundenwettkämpfen des Kreisschützenverbandes Einbeck e.V.
        </p>
      </section>

      <Separator className="my-6" />

      {/* Karten-Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Letzte Ergebnis-Updates */}
        <Card className="md:col-span-2 shadow-lg hover:shadow-xl transition-shadow">
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
                {updates.map((update) => {
                  const uiDiscValueForLink = getUIDisciplineValueFromSpecificType(update.leagueType);
                  const disciplineOption = uiDisciplineFilterOptions.find(opt => opt.firestoreTypes.includes(update.leagueType));
                  const uiDiscDisplayLabel = disciplineOption ? disciplineOption.label.replace(/\s*\(.*\)\s*$/, '').trim() : update.leagueType;
                  
                  const linkHref = uiDiscValueForLink 
                    ? `/rwk-tabellen?year=${update.competitionYear}&discipline=${uiDiscValueForLink}&league=${update.leagueId}`
                    : `/rwk-tabellen?year=${update.competitionYear}&league=${update.leagueId}`;
                  
                  return (
                    <li key={update.id} className="p-4 bg-muted/50 rounded-md shadow-sm hover:bg-muted/70 transition-colors">
                      <Link href={linkHref} className="block hover:text-primary">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                          <p className="text-md font-medium text-foreground">
                            Ergebnisse in der Liga <strong className="text-primary">{update.leagueName} {uiDiscDisplayLabel ? `(${uiDiscDisplayLabel})` : ''}</strong> ({update.competitionYear}) hinzugefügt.
                          </p>
                          <p className="text-xs text-muted-foreground mt-1 sm:mt-0">
                            {update.timestamp ? format((update.timestamp instanceof Timestamp ? update.timestamp : Timestamp.fromDate(new Date(update.timestamp))).toDate(), 'dd. MMMM yyyy, HH:mm', { locale: de }) : '-'} Uhr
                          </p>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Info className="mx-auto h-10 w-10 mb-3 text-primary/70" />
                <p>Momentan keine aktuellen Ergebnis-Updates vorhanden.</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Nächste Termine */}
        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <CalendarDays className="mr-2 h-5 w-5" />
              Nächste Termine
            </CardTitle>
            <CardDescription>
              Die nächsten anstehenden Wettkämpfe
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingEvents ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <p className="ml-3 text-muted-foreground">Lade Termine...</p>
              </div>
            ) : upcomingEvents.length > 0 ? (
              <div className="space-y-4">
                {upcomingEvents.map((event, index) => (
                  <div key={event.id || index} className="flex flex-col space-y-1 pb-3 border-b last:border-0">
                    <div className="flex justify-between items-start">
                      <span className="font-medium">{event.title}</span>
                      <Badge variant={getBadgeVariant(event.type, event.isKreisverband)}>
                        {formatEventType(event.type)}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(event.date), 'EEEE, d. MMMM', { locale: de })}
                    </div>
                    <div className="text-sm">
                      {event.time} Uhr, {event.location}
                    </div>
                  </div>
                ))}
                
                <Button asChild variant="default" className="w-full mt-2">
                  <Link href="/termine">
                    Terminkalender öffnen
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">Keine anstehenden Termine.</p>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/termine">
                    Terminkalender öffnen
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}