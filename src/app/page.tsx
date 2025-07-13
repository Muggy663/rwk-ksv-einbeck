"use client";
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ListChecks, Loader2, Info, CalendarDays, ChevronRight, Newspaper } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getUIDisciplineValueFromSpecificType, uiDisciplineFilterOptions } from '@/types/rwk';
import { db } from '@/lib/firebase/config';
import { collection, query, orderBy, limit as firestoreLimit, getDocs, Timestamp } from 'firebase/firestore';
import { format, addDays } from 'date-fns';
import { de } from 'date-fns/locale';
import { fetchEvents } from '@/lib/services/calendar-service';
import { cleanupExpiredEvents } from '@/lib/services/event-cleanup';
import { newsService } from '@/lib/services/news-service';

const LEAGUE_UPDATES_COLLECTION = "league_updates";

interface LeagueUpdate {
  id: string;
  leagueType: string;
  leagueName: string;
  competitionYear: string | number;
  leagueId: string;
  timestamp: Timestamp | { toDate: () => Date };
}

interface Event {
  id?: string;
  title: string;
  date: string | Date;
  time: string;
  location: string;
  type?: string;
  isKreisverband?: boolean;
}

export default function HomePage() {
  const [updates, setUpdates] = useState<LeagueUpdate[]>([]);
  const [loadingUpdates, setLoadingUpdates] = useState<boolean>(true);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState<boolean>(true);
  const [latestNews, setLatestNews] = useState<any[]>([]);
  const [isLoadingNews, setIsLoadingNews] = useState<boolean>(true);

  // Lade Updates und Termine parallel
  useEffect(() => {
    const loadData = async () => {
      setLoadingUpdates(true);
      setIsLoadingEvents(true);
      
      try {
        // Parallele Abfragen für bessere Performance
        const [updatesResult, eventsResult, newsResult] = await Promise.allSettled([
          // Updates laden
          getDocs(query(
            collection(db, LEAGUE_UPDATES_COLLECTION),
            orderBy("timestamp", "desc"),
            firestoreLimit(5)
          )),
          // Termine laden (nächste 90 Tage für mehr Termine)
          (() => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const endDate = new Date(today);
            endDate.setDate(endDate.getDate() + 90); // 90 Tage voraus für mehr Termine
            return fetchEvents(today, endDate);
          })(),
          // News laden (neueste 3)
          newsService.getPublishedArticles(3)
        ]);
        
        // Updates verarbeiten
        if (updatesResult.status === 'fulfilled') {
          const fetchedUpdates: LeagueUpdate[] = [];
          updatesResult.value.forEach((doc) => {
            const data = doc.data();
            fetchedUpdates.push({ 
              id: doc.id, 
              ...data,
              leagueType: data.leagueType
            } as LeagueUpdate);
          });
          setUpdates(fetchedUpdates);
        } else {
          console.error("Fehler beim Laden der Updates:", updatesResult.reason);
        }
        
        // Termine verarbeiten
        if (eventsResult.status === 'fulfilled') {
          const allEvents = eventsResult.value;
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          // Filtere und sortiere Termine
          const futureEvents = allEvents
            .filter(event => {
              if (!event?.date) return false;
              const eventDate = event.date instanceof Date ? event.date : new Date(event.date);
              return eventDate >= today;
            })
            .sort((a, b) => {
              const dateA = a.date instanceof Date ? a.date : new Date(a.date);
              const dateB = b.date instanceof Date ? b.date : new Date(b.date);
              return dateA.getTime() - dateB.getTime();
            })
            .slice(0, 3);
          
          console.log(`Startseite: Gefilterte Termine: ${futureEvents.length}`);
          
          setUpcomingEvents(futureEvents);
        } else {
          console.error("Fehler beim Laden der Termine:", eventsResult.reason);
        }
        
        // News verarbeiten
        if (newsResult.status === 'fulfilled') {
          setLatestNews(newsResult.value || []);
        } else {
          console.error("Fehler beim Laden der News:", newsResult.reason);
        }
        
      } catch (error) {
        console.error('Fehler beim Laden der Startseiten-Daten:', error);
      } finally {
        setLoadingUpdates(false);
        setIsLoadingEvents(false);
        setIsLoadingNews(false);
      }
    };

    loadData();
  }, []);

  // Funktion zum Bestimmen der Badge-Farbe basierend auf dem Termintyp
  const getBadgeVariant = (type?: string, isKreisverband?: boolean): "default" | "destructive" | "secondary" | "outline" => {
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
  const formatEventType = (type?: string): string => {
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

      {/* App-Installation Hinweis */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-700 p-4 rounded-lg shadow-lg mb-6 transform hover:scale-[1.01] transition-all">
        <div className="flex items-center">
          <div className="bg-white p-3 rounded-full mr-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
              <path d="M12 2H2v10h10V2z"></path>
              <path d="M22 12h-10v10h10V12z"></path>
              <path d="M12 12H2v10h10V12z"></path>
              <path d="M22 2h-10v10h10V2z"></path>
            </svg>
          </div>
          <div>
            <h2 style={{color: 'white'}} className="text-xl font-bold mb-1">NEU: RWK App auf Ihrem Smartphone installieren!</h2>
            <p style={{color: 'white'}}>Sie können diese Website jetzt direkt auf Ihrem Smartphone als App installieren. Tippen Sie in Ihrem Browser auf "Zum Startbildschirm hinzufügen" für schnelleren Zugriff und bessere Bedienung.</p>
          </div>
        </div>
      </div>

      {/* Karten-Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {/* Letzte Ergebnis-Updates */}
        <Card className="md:col-span-2 shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <ListChecks className="h-7 w-7 text-primary" />
              <CardTitle className="text-2xl text-primary font-bold">Letzte Ergebnis-Updates</CardTitle>
            </div>
            <CardDescription className="text-muted-foreground dark:text-muted-foreground">
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
              <ul className="space-y-4 text-foreground dark:text-foreground">
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
                          <p className="text-md font-medium text-foreground dark:text-foreground">
                            Ergebnisse in der Liga <strong className="text-primary dark:text-primary">{update.leagueName} {uiDiscDisplayLabel ? `(${uiDiscDisplayLabel})` : ''}</strong> ({update.competitionYear}) hinzugefügt.
                          </p>
                          <p className="text-xs text-muted-foreground dark:text-muted-foreground mt-1 sm:mt-0">
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
              Nächste 3 Termine
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
                {upcomingEvents.map((event, index) => {
                  const isToday = new Date(event.date).toDateString() === new Date().toDateString();
                  return (
                    <div key={event.id || index} className={`flex flex-col space-y-1 pb-3 border-b last:border-0 ${isToday ? 'bg-primary/10 p-2 rounded-md' : ''}`}>
                      <div className="flex justify-between items-start">
                        <span className={`font-medium ${isToday ? 'text-primary font-bold' : ''}`}>
                          {isToday && '🔥 '}{event.title}
                        </span>
                        <Badge variant={getBadgeVariant(event.type, event.isKreisverband)}>
                          {formatEventType(event.type)}
                        </Badge>
                      </div>
                      <div className={`text-sm ${isToday ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>
                        {isToday ? 'HEUTE' : format(new Date(event.date), 'EEEE, d. MMMM', { locale: de })}
                      </div>
                      <div className="text-sm">
                        {event.time} Uhr, {event.location}
                      </div>
                      {event.description && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {event.description}
                        </div>
                      )}
                    </div>
                  );
                })}
                
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
        
        {/* RWK-News */}
        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Newspaper className="mr-2 h-5 w-5" />
              Neuigkeiten
            </CardTitle>
            <CardDescription>
              Aktuelle Mitteilungen
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingNews ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <p className="ml-3 text-muted-foreground">Lade News...</p>
              </div>
            ) : latestNews.length > 0 ? (
              <div className="space-y-3">
                {latestNews.slice(0, 2).map((article) => (
                  <div key={article.id} className="border-b last:border-0 pb-3 last:pb-0">
                    <h4 className="font-medium text-sm line-clamp-2">{article.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {article.excerpt || article.content.substring(0, 100) + '...'}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-muted-foreground">
                        {new Date(article.publishedAt || article.createdAt).toLocaleDateString('de-DE')}
                      </span>
                      {article.priority === 'dringend' && (
                        <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded">
                          Dringend
                        </span>
                      )}
                      {article.priority === 'hoch' && (
                        <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded">
                          Wichtig
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                <Button asChild variant="default" className="w-full mt-2">
                  <Link href="/news">
                    Alle News anzeigen
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-sm text-muted-foreground">
                  Noch keine News veröffentlicht.
                </div>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/news">
                    News-Bereich öffnen
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