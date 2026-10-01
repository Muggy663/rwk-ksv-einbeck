"use client";
import { useState, useEffect } from 'react';
import { logError } from '@/lib/utils/secure-logger';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ListChecks, Info, CalendarDays, ChevronRight, Newspaper, MapPin, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MeldefensterBanner } from '@/components/home/MeldefensterBanner';
import { getUIDisciplineValueFromSpecificType, uiDisciplineFilterOptions } from '@/types/rwk';
import { db } from '@/lib/firebase/config';
import { collection, query, orderBy, limit as firestoreLimit, getDocs, Timestamp } from 'firebase/firestore';
import { format, differenceInCalendarDays, isSameDay } from 'date-fns';
import { de } from 'date-fns/locale';
import { fetchEvents, type Event } from '@/lib/services/calendar-service';
import { LinkifiedText } from '@/components/ui/linkified-text';
import { findMapsUrlForLocation, type ClubMapsInfo } from '@/lib/utils/club-maps';
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

// Termintyp → Label + Chip-Farbe (einheitlich zur Termine-Seite; kein hartes Rot).
const typeMeta = (type?: string, isKreisverband?: boolean): { label: string; className: string } => {
  if (isKreisverband) {
    return { label: 'Kreisverband', className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' };
  }
  switch (type) {
    case 'durchgang':
      return { label: 'Durchgang', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' };
    case 'kreismeisterschaft':
      return { label: 'Kreismeisterschaft', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' };
    case 'sitzung':
      return { label: 'Sitzung', className: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' };
    default:
      return { label: 'Sonstiges', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' };
  }
};

// Menschliches, relatives Datum: „Heute“, „Morgen“, „In 3 Tagen“ … sonst Datum.
const relativeDay = (date: Date): string => {
  const diff = differenceInCalendarDays(date, new Date());
  if (diff === 0) return 'Heute';
  if (diff === 1) return 'Morgen';
  if (diff > 1 && diff <= 7) return `In ${diff} Tagen`;
  return format(date, 'EEEE, d. MMMM', { locale: de });
};

export default function HomePage() {
  const [updates, setUpdates] = useState<LeagueUpdate[]>([]);
  const [loadingUpdates, setLoadingUpdates] = useState<boolean>(true);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState<boolean>(true);
  const [latestNews, setLatestNews] = useState<any[]>([]);
  const [isLoadingNews, setIsLoadingNews] = useState<boolean>(true);
  const [clubsMaps, setClubsMaps] = useState<ClubMapsInfo[]>([]);
  const [isNativeApp, setIsNativeApp] = useState(false);
  const [isNarrow, setIsNarrow] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setIsNativeApp(!!(window.Capacitor && window.Capacitor.isNativePlatform()));
    const check = () => setIsNarrow(window.innerWidth <= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);


  // Lade Updates und Termine parallel
  useEffect(() => {
    const loadData = async () => {
      setLoadingUpdates(true);
      setIsLoadingEvents(true);
      
      try {
        // Parallele Abfragen für bessere Performance
        const [updatesResult, eventsResult, newsResult, clubsResult] = await Promise.allSettled([
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
          newsService.getPublishedArticles(3),
          // Vereine laden (für Anfahrt-Link am Termin-Ort)
          getDocs(collection(db, 'clubs'))
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
          logError("Fehler beim Laden der Updates:", updatesResult.reason);
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
          

          
          setUpcomingEvents(futureEvents);
        } else {
          logError("Fehler beim Laden der Termine:", eventsResult.reason);
        }
        
        // News verarbeiten
        if (newsResult.status === 'fulfilled') {
          setLatestNews(newsResult.value || []);
        } else {
          logError("Fehler beim Laden der News:", newsResult.reason);
        }

        // Vereine verarbeiten (nur name + mapsUrl für den Anfahrt-Link nötig)
        if (clubsResult.status === 'fulfilled') {
          const list: ClubMapsInfo[] = clubsResult.value.docs.map(d => {
            const data = d.data() as any;
            return { id: d.id, name: data.name || '', mapsUrl: data.mapsUrl };
          });
          setClubsMaps(list);
        } else {
          logError("Fehler beim Laden der Vereine:", clubsResult.reason);
        }
        
      } catch (error) {
        logError('Fehler beim Laden der Startseiten-Daten:', error);
      } finally {
        setLoadingUpdates(false);
        setIsLoadingEvents(false);
        setIsLoadingNews(false);
      }
    };

    loadData();
  }, []);

  return (
    <div className="container py-8 max-w-7xl mx-auto pwa-optimized">
      {/* Meldefenster-Hinweis ganz oben (RWK/KM), zuerst sichtbar auf Desktop & Mobil */}
      <MeldefensterBanner />

      {/* Hero-Section */}
      <section className="relative text-center mb-10 overflow-hidden">
        {/* Dezenter Verlauf-Hintergrund */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />

        <div className="relative z-10 py-4">
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-primary/15 rounded-full blur-xl" style={{ width: 150, height: 150, margin: 'auto' }} />
            <Image
              src="/images/logo.png"
              alt="KSV Einbeck Logo"
              width={130}
              height={130}
              className="relative mx-auto rounded-lg shadow-xl"
              style={{ width: 130, height: 130 }}
              priority
            />
          </div>

          <h1 className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-red-500 via-green-600 to-red-500 bg-clip-text text-transparent mb-4">
            <span className="block sm:hidden">RWK<br />KSV Einbeck</span>
            <span className="hidden sm:block">Willkommen beim RWK KSV Einbeck</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Aktuelle Ergebnisse, Tabellen und Informationen zu den Rundenwettkämpfen des Kreisschützenverbandes Einbeck e.V.
          </p>
        </div>
      </section>

      <Separator className="my-6" />

      {/* Feature-Cards mit modernem Design */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 pwa-cards">
        {/* Letzte Ergebnis-Updates */}
        <Card className="md:col-span-2 glass-lift pwa-card-updates">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-muted/50 dark:bg-muted/30 rounded-lg hover:bg-muted/70 dark:hover:bg-muted/50 transition-colors">
                <ListChecks className="h-7 w-7 text-primary" />
              </div>
              <CardTitle className="text-2xl text-primary font-bold">Letzte Ergebnis-Updates</CardTitle>
            </div>
            <CardDescription className="text-muted-foreground dark:text-muted-foreground">
              Die neuesten Aktualisierungen der Ergebnistabellen.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingUpdates ? (
              <div className="space-y-4">
                {[1,2,3,4,5].map(i => (
                  <div key={i} className="p-4 rounded-lg bg-muted/30 animate-pulse">
                    <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                    <div className="h-3 bg-muted rounded w-1/3" />
                  </div>
                ))}
              </div>
            ) : updates.length > 0 ? (
              <ul className="space-y-4 text-foreground dark:text-foreground">
                {updates.map((update) => {
                  const uiDiscValueForLink = getUIDisciplineValueFromSpecificType(update.leagueType as any);
                  const disciplineOption = uiDisciplineFilterOptions.find(opt => opt.firestoreTypes.includes(update.leagueType as any));
                  const uiDiscDisplayLabel = disciplineOption ? disciplineOption.label.replace(/\s*\(.*\)\s*$/, '').trim() : update.leagueType;
                  
                  const linkHref = uiDiscValueForLink 
                    ? `/rwk-tabellen?year=${update.competitionYear}&discipline=${uiDiscValueForLink}&league=${update.leagueId}`
                    : `/rwk-tabellen?year=${update.competitionYear}&league=${update.leagueId}`;
                  
                  return (
                    <li key={update.id} className="p-4 glass-subtle rounded-lg hover:glass-medium transition-all duration-300">
                      <Link href={linkHref} className="block hover:text-primary group">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                          <p className="text-md font-medium text-foreground dark:text-foreground">
                            Ergebnisse in der Liga <strong className="text-primary dark:text-primary">{update.leagueName} {uiDiscDisplayLabel ? `(${uiDiscDisplayLabel})` : ''}</strong> ({update.competitionYear}) hinzugefügt.
                          </p>
                          <p className="text-xs text-muted-foreground dark:text-muted-foreground mt-1 sm:mt-0">
                            {update.timestamp ? format((update.timestamp instanceof Timestamp ? update.timestamp : Timestamp.fromDate(new Date(update.timestamp as any))).toDate(), 'dd. MMMM yyyy, HH:mm', { locale: de }) : '-'} Uhr
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
        <Card className="glass-lift">
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <div className="p-1 bg-secondary/10 rounded-md hover:bg-secondary/20 transition-colors mr-2">
                <CalendarDays className="h-5 w-5 text-primary dark:text-primary" />
              </div>
              Nächste 3 Termine
            </CardTitle>
            <CardDescription>
              Die nächsten anstehenden Wettkämpfe
            </CardDescription>
            <p className="mt-1 text-xs text-muted-foreground">
              Tipp: Auf den Vereinsnamen tippen öffnet die Anfahrt in Google Maps.
            </p>
          </CardHeader>
          <CardContent>
            {isLoadingEvents ? (
              <div className="space-y-4">
                {[1,2,3].map(i => (
                  <div key={i} className="p-2 rounded-md animate-pulse">
                    <div className="h-4 bg-muted rounded w-2/3 mb-2" />
                    <div className="h-3 bg-muted rounded w-1/2 mb-1" />
                    <div className="h-3 bg-muted rounded w-1/3" />
                  </div>
                ))}
              </div>
            ) : upcomingEvents.length > 0 ? (
              <div className="space-y-3">
                {upcomingEvents.map((event, index) => {
                  const eventDate = event.date instanceof Date ? event.date : new Date(event.date);
                  const isToday = isSameDay(eventDate, new Date());
                  const meta = typeMeta(event.type, event.isKreisverband);
                  const mapsUrl = findMapsUrlForLocation(event.location, clubsMaps);
                  return (
                    <div
                      key={event.id || index}
                      className={`rounded-lg border p-3 transition-colors ${isToday ? 'border-primary bg-primary/5' : 'hover:bg-muted/30'}`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <span className={`font-medium ${isToday ? 'text-primary' : ''}`}>{event.title}</span>
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${meta.className}`}>
                          {meta.label}
                        </span>
                      </div>
                      <div className={`mt-1 text-sm font-medium ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>
                        {relativeDay(eventDate)}
                      </div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-muted-foreground">
                        <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{event.time} Uhr</span>
                        {mapsUrl ? (
                          <a
                            href={mapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-primary hover:underline"
                            title="Anfahrt in Google Maps öffnen"
                          >
                            <MapPin className="h-3.5 w-3.5" />{event.location}
                          </a>
                        ) : (
                          <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{event.location}</span>
                        )}
                      </div>
                      {event.description && (
                        <div className="text-xs text-muted-foreground mt-1 break-words">
                          <LinkifiedText text={event.description} />
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
        <Card className="glass-lift">
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <div className="p-1 bg-accent/10 rounded-md hover:bg-accent/20 transition-colors mr-2">
                <Newspaper className="h-5 w-5 text-accent" />
              </div>
              Neuigkeiten
            </CardTitle>
            <CardDescription>
              Aktuelle Mitteilungen
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingNews ? (
              <div className="space-y-3">
                {[1,2].map(i => (
                  <div key={i} className="p-2 rounded-md animate-pulse">
                    <div className="h-4 bg-muted rounded w-full mb-2" />
                    <div className="h-3 bg-muted rounded w-3/4 mb-1" />
                    <div className="h-3 bg-muted rounded w-1/4" />
                  </div>
                ))}
              </div>
            ) : latestNews.length > 0 ? (
              <div className="space-y-3">
                {latestNews.slice(0, 2).map((article) => (
                  <div key={article.id} className="border-b last:border-0 pb-3 last:pb-0 hover:bg-accent/5 dark:hover:bg-accent/5 transition-colors rounded-md p-2 -m-2">
                    <h4 className="font-medium text-sm line-clamp-2">{article.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {article.excerpt || article.content.substring(0, 100) + '...'}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-muted-foreground">
                        {new Date(article.publishedAt || article.createdAt).toLocaleDateString('de-DE')}
                      </span>
                      {article.priority === 'dringend' && (
                        <span className="bg-red-100 dark:bg-red-950/80 text-red-800 dark:text-red-100 text-xs px-2 py-1 rounded border border-red-200 dark:border-red-800">
                          Dringend
                        </span>
                      )}
                      {article.priority === 'hoch' && (
                        <span className="bg-orange-100 dark:bg-orange-950/80 text-orange-800 dark:text-orange-100 text-xs px-2 py-1 rounded border border-orange-200 dark:border-orange-800">
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

      {/* Statistik-Teaser */}
      <div className="mb-6">
        <Link href="/statistik" className="block">
          <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-4 rounded-lg shadow-lg transform hover:scale-[1.01] transition-all cursor-pointer">
            <div className="flex items-center">
              <div className="bg-white p-3 rounded-full mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600">
                  <path d="M3 3v18h18" />
                  <path d="m19 9-5 5-4-4-3 3" />
                </svg>
              </div>
              <div className="text-white flex-1">
                <h3 className="font-bold text-lg">📊 Statistiken entdecken</h3>
                <p className="text-sm text-white/90">Leistungsentwicklung einzelner Schützen und ganzer Mannschaften – über Durchgänge und Saisons hinweg.</p>
              </div>
              <ChevronRight className="h-6 w-6 text-white shrink-0" />
            </div>
          </div>
        </Link>
      </div>

      {/* Hinweis auf die Android-App – nur im mobilen Browser (nicht in der App selbst) */}
      {!isNativeApp && isNarrow && (
        <Card className="mt-8 shadow-lg bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="text-xl flex items-center text-blue-800 dark:text-blue-200">
              <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600 dark:text-blue-300">
                  <rect width="14" height="20" x="5" y="2" rx="2" ry="2"/>
                  <path d="M12 18h.01"/>
                </svg>
              </div>
              📱 Android-App verfügbar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-blue-700 dark:text-blue-300">
                Für die Nutzung auf dem Smartphone gibt es die <strong>RWK Einbeck App</strong> für Android – mit allen Funktionen inkl. PDF-Export.
              </p>
              <Button asChild variant="outline" className="w-full">
                <Link href="/app">
                  Zur App-Seite
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
