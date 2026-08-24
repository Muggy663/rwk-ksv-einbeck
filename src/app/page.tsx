"use client";
import React, { useState, useEffect } from 'react';
import { logError, logWarn, logInfo, logDebug } from '@/lib/utils/secure-logger';
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
import { MaintenanceBanner } from '@/components/MaintenanceBanner';

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
  const [isNativeApp, setIsNativeApp] = useState(false);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsNativeApp(window.Capacitor && window.Capacitor.isNativePlatform());
    }
  }, []);


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
    <div className="container py-8 max-w-7xl mx-auto pwa-optimized">
      {/* Wartungshinweis entfernt - System ist live */}
      

      {/* Hero-Section mit modernem Design */}
      <section className="relative text-center mb-16 overflow-hidden">
        {/* Animierter Hintergrund */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 animate-pulse" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(120,119,198,0.1),transparent_50%)] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(255,119,198,0.1),transparent_50%)] animate-pulse" style={{ animationDelay: '2s' }} />
        
        <div className="relative z-10">
          {/* Logo mit Glow-Effekt */}
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" style={{ width: 180, height: 180, margin: 'auto' }} />
            <Image
              src="/images/logo.png"
              alt="KSV Einbeck Logo"
              width={150}
              height={150}
              className="relative mx-auto rounded-lg shadow-2xl"
              style={{ width: 150, height: 150 }}
              priority
            />
          </div>
          
          {/* Kraftvolle Headline */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-red-500 via-green-600 to-red-500 bg-clip-text text-transparent mb-4 animate-fade-in">
            <span className="block sm:hidden">RWK<br />KSV Einbeck</span>
            <span className="hidden sm:block">Willkommen beim RWK KSV Einbeck</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            🎯 Aktuelle Ergebnisse, Tabellen und Informationen zu den Rundenwettkämpfen des Kreisschützenverbandes Einbeck e.V. 🎯
          </p>
        </div>
      </section>

      <Separator className="my-6" />

      {/* Neuigkeiten-Banner v2.7.0 */}
      <div className="mb-6 rounded-xl border border-green-200 dark:border-green-800 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/40 dark:to-emerald-950/40 p-4 flex items-start gap-3 shadow-sm">
        <div className="flex-shrink-0 mt-0.5">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/60 text-green-700 dark:text-green-300 text-lg">🆕</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold uppercase tracking-wide text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/60 px-2 py-0.5 rounded-full">Version 2.7.0</span>
            <span className="font-semibold text-green-900 dark:text-green-100">KM-System & Mannschafts-Umbau</span>
          </div>
          <p className="text-sm text-green-800 dark:text-green-200 mt-1">
            Das KM-System berechnet Sportjahr und Altersklassen jetzt automatisch. Mannschaften können direkt in der Ersatzschützen-Verwaltung umgebaut werden — inkl. selektiver Ergebnis-Übertragung. Außerdem: Mitcom-Import mit Vereinsnummer-Prüfung unter <strong>Meine Schützen → Mitcom-Import</strong>.
          </p>
        </div>
      </div>

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
                  const uiDiscValueForLink = getUIDisciplineValueFromSpecificType(update.leagueType);
                  const disciplineOption = uiDisciplineFilterOptions.find(opt => opt.firestoreTypes.includes(update.leagueType));
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
              <div className="space-y-4">
                {upcomingEvents.map((event, index) => {
                  const isToday = new Date(event.date).toDateString() === new Date().toDateString();
                  return (
                    <div key={event.id || index} className={`flex flex-col space-y-1 pb-3 border-b last:border-0 rounded-md p-2 ${isToday ? 'border border-primary/50' : 'transition-colors'}`} style={isToday ? { background: 'rgba(30,30,40,0.95)' } : {}}>
                      <div className="flex justify-between items-start">
                        <span className="font-medium" style={isToday ? { color: '#4ade80', fontWeight: 700 } : {}}>
                          {isToday && '🔥 '}{event.title}
                        </span>
                        <Badge variant={getBadgeVariant(event.type, event.isKreisverband)}>
                          {formatEventType(event.type)}
                        </Badge>
                      </div>
                      <div className={`text-sm ${!isToday ? 'text-muted-foreground' : ''}`} style={isToday ? { color: '#4ade80', fontWeight: 600 } : {}}>
                        {isToday ? 'HEUTE' : format(new Date(event.date), 'EEEE, d. MMMM', { locale: de })}
                      </div>
                      <div className="text-sm" style={isToday ? { color: '#e2e8f0' } : {}}>
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



      {/* Weihnachtsgrüße entfernt - Januar 2026 */}

      {/* Play Store App */}
      <div className="mb-6">
        <Link href="/app" className="block">
          <div className="bg-gradient-to-r from-green-500 to-blue-600 p-4 rounded-lg shadow-lg transform hover:scale-[1.01] transition-all cursor-pointer">
            <div className="flex items-center">
              <div className="bg-white p-3 rounded-full mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600">
                  <rect width="14" height="20" x="5" y="2" rx="2" ry="2"/>
                  <path d="M12 18h.01"/>
                </svg>
              </div>
              <div className="flex-1">
                <h2 style={{color: 'white'}} className="text-xl font-bold mb-1">📱 Android App im Play Store</h2>
                <p style={{color: 'white'}}>Jetzt kostenlos herunterladen</p>
              </div>
              <div className="text-white">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m9 18 6-6-6-6"/>
                </svg>
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Desktop-Hinweis für Mobile - am Ende der Seite */}
      {!isNativeApp && typeof window !== 'undefined' && window.innerWidth <= 768 && (
        <Card className="mt-8 shadow-lg bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="text-xl flex items-center text-blue-800 dark:text-blue-200">
              <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600 dark:text-blue-300">
                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
                  <path d="m7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </div>
              💻 Desktop-Version verfügbar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-blue-700 dark:text-blue-300">
                Wussten Sie, dass es auch eine <strong>Desktop-Website</strong> gibt? 
                Dort stehen Ihnen zusätzliche Funktionen zur Verfügung:
              </p>
              <ul className="space-y-2 text-sm text-blue-600 dark:text-blue-400">
                <li className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  <span>📄 PDF-Export von Tabellen und Ergebnissen</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  <span>🖨️ Druckfunktionen für Handzettel und Urkunden</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  <span>⚙️ Erweiterte Verwaltungsfunktionen</span>
                </li>
              </ul>
              <div className="bg-blue-100 dark:bg-blue-800/30 p-3 rounded-lg mt-4">
                <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">
                  🌐 Besuchen Sie: <strong>rwk-einbeck.de</strong> am Computer
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
