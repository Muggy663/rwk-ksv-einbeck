"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { logError } from '@/lib/utils/secure-logger';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { CalendarPlus, Download, Pencil, MapPin, Clock, CalendarDays, CalendarCheck, ChevronDown, Apple } from 'lucide-react';
import { BackButton } from '@/components/ui/back-button';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { fetchEvents, generateICalEvent, generateICalFile, generateGoogleCalendarUrl, Event } from '@/lib/services/calendar-service';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { format, isSameDay, startOfMonth, endOfMonth, differenceInCalendarDays } from 'date-fns';
import { de } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { LinkifiedText } from '@/components/ui/linkified-text';
import { findMapsUrlForLocation, type ClubMapsInfo } from '@/lib/utils/club-maps';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

const sanitizeText = (text: string | undefined | null): string => {
  return String(text || '').replace(/[<>"'&]/g, (char) => {
    const entities: Record<string, string> = {
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
      '&': '&amp;'
    };
    return entities[char] || char;
  });
};

// Termintyp → Label, Chip-Farbe und Akzentfarbe (dezente, farbige Chips statt
// „destructive"-Rot; der Akzent färbt den linken Rand der Termin-Karten).
const typeMeta = (type: string, isKreisverband?: boolean): { label: string; className: string; accent: string } => {
  if (isKreisverband) {
    return { label: 'Kreisverband', className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300', accent: 'border-l-purple-500' };
  }
  switch (type) {
    case 'durchgang':
      return { label: 'Durchgang', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300', accent: 'border-l-blue-500' };
    case 'kreismeisterschaft':
      return { label: 'Kreismeisterschaft', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300', accent: 'border-l-amber-500' };
    case 'sitzung':
      return { label: 'Sitzung', className: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300', accent: 'border-l-slate-400' };
    default:
      return { label: 'Sonstiges', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300', accent: 'border-l-emerald-500' };
  }
};

// Menschliches, relatives Datum: „Heute“, „Morgen“, „In 3 Tagen“ … sonst Datum.
const relativeDay = (date: Date): string => {
  const diff = differenceInCalendarDays(date, new Date());
  if (diff === 0) return 'Heute';
  if (diff === 1) return 'Morgen';
  if (diff > 1 && diff <= 7) return `In ${diff} Tagen`;
  return format(date, 'EEE, dd.MM.yyyy', { locale: de });
};

export default function TerminePage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [events, setEvents] = useState<Event[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [clubsMaps, setClubsMaps] = useState<ClubMapsInfo[]>([]);

  // Vereine laden (für den Anfahrt-Link am Termin-Ort).
  useEffect(() => {
    (async () => {
      try {
        const snap = await getDocs(collection(db, 'clubs'));
        setClubsMaps(snap.docs.map(d => {
          const data = d.data() as any;
          return { id: d.id, name: data.name || '', mapsUrl: data.mapsUrl } as ClubMapsInfo;
        }));
      } catch (error) {
        logError('Fehler beim Laden der Vereine (Anfahrt):', error);
      }
    })();
  }, []);

  // Termine laden: die des angezeigten Monats (für Kalender + Tagesliste) und
  // die nächsten kommenden Termine (für die Übersicht rechts).
  useEffect(() => {
    const loadEvents = async () => {
      setIsLoading(true);
      try {
        const start = startOfMonth(currentMonth);
        const end = endOfMonth(currentMonth);
        const [monthEvents, futureEvents] = await Promise.all([
          fetchEvents(start, end, 'all'),
          (() => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const futureEnd = new Date(today);
            futureEnd.setFullYear(futureEnd.getFullYear() + 1);
            return fetchEvents(today, futureEnd, 'all');
          })(),
        ]);

        setEvents(monthEvents);
        setUpcomingEvents(
          [...futureEvents]
            .sort((a, b) => a.date.getTime() - b.date.getTime())
            .slice(0, 5)
        );
      } catch (error) {
        logError('Fehler beim Laden der Termine:', error);
        toast({
          title: 'Fehler',
          description: 'Die Termine konnten nicht geladen werden.',
          variant: 'destructive'
        });
        setEvents([]);
        setUpcomingEvents([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadEvents();
  }, [currentMonth, toast]);

  // Termine des ausgewählten Tages.
  const selectedEvents = useMemo(() => {
    if (!selectedDate) return [];
    return events.filter(event => event.date && isSameDay(event.date, selectedDate));
  }, [selectedDate, events]);

  // Tage mit Terminen für die Kalender-Markierung.
  const eventDays = useMemo(
    () => events.filter(e => e.date).map(e => e.date),
    [events]
  );
  const hasEvents = useCallback(
    (date: Date) => eventDays.some(d => isSameDay(d, date)),
    [eventDays]
  );

  // Termin als .ics herunterladen (Apple/iOS, Outlook, Thunderbird …).
  const exportEvent = (event: Event) => {
    if (!event || !event.title || !event.date) {
      toast({ title: 'Fehler', description: 'Der Termin enthält ungültige Daten und kann nicht gespeichert werden.', variant: 'destructive' });
      return;
    }
    try {
      const icalContent = generateICalEvent(event);
      downloadIcal(icalContent, `${(event.title || 'termin').replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`);
      toast({ title: 'Termin gespeichert', description: 'Die Kalender-Datei (.ics) wurde heruntergeladen – auf dem iPhone öffnet sie direkt den Kalender.' });
    } catch (error) {
      logError('Fehler beim Exportieren des Termins:', error);
      toast({ title: 'Fehler', description: 'Der Termin konnte nicht gespeichert werden.', variant: 'destructive' });
    }
  };

  // Termin in einem neuen Tab in Google Kalender öffnen (vorausgefüllt).
  const openInGoogleCalendar = (event: Event) => {
    if (!event || !event.title || !event.date) {
      toast({ title: 'Fehler', description: 'Der Termin enthält ungültige Daten.', variant: 'destructive' });
      return;
    }
    try {
      window.open(generateGoogleCalendarUrl(event), '_blank', 'noopener,noreferrer');
    } catch (error) {
      logError('Fehler beim Öffnen in Google Kalender:', error);
      toast({ title: 'Fehler', description: 'Google Kalender konnte nicht geöffnet werden.', variant: 'destructive' });
    }
  };

  // Wiederverwendbares „Zum Kalender hinzufügen"-Menü (Google / Apple-iOS).
  const AddToCalendar = ({ event, size = 'sm' }: { event: Event; size?: 'sm' | 'default' }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size={size} className="text-primary">
          <CalendarCheck className="h-4 w-4 mr-1" />
          Zum Kalender
          <ChevronDown className="h-3.5 w-3.5 ml-1 opacity-70" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel>Termin speichern</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => openInGoogleCalendar(event)}>
          <CalendarDays className="h-4 w-4 mr-2 text-blue-600" />
          Google Kalender
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => exportEvent(event)}>
          <Apple className="h-4 w-4 mr-2" />
          Apple / iOS (.ics)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  // iCal-Export aller Termine des angezeigten Monats.
  const exportAllEvents = () => {
    const validEvents = events.filter(event => event && event.date && event.title);
    if (validEvents.length === 0) {
      toast({ title: 'Keine Termine', description: 'In diesem Monat gibt es keine Termine zum Exportieren.', variant: 'destructive' });
      return;
    }
    try {
      const icalContent = generateICalFile(validEvents);
      downloadIcal(icalContent, `rwk_termine_${format(currentMonth, 'yyyy_MM')}.ics`);
      toast({ title: 'Export erfolgreich', description: `${validEvents.length} Termine wurden als iCal-Datei exportiert.` });
    } catch (error) {
      logError('Fehler beim Exportieren der Termine:', error);
      toast({ title: 'Fehler', description: 'Die Termine konnten nicht exportiert werden.', variant: 'destructive' });
    }
  };

  const downloadIcal = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 100);
  };

  // Ort mit optionalem Anfahrt-Link (Google Maps), einheitlich für alle Karten.
  const LocationLine = ({ location }: { location: string }) => {
    const mapsUrl = findMapsUrlForLocation(location, clubsMaps);
    const inner = (
      <>
        <MapPin className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate">{sanitizeText(location)}</span>
      </>
    );
    return mapsUrl ? (
      <a
        href={mapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-primary hover:underline"
        title="Anfahrt in Google Maps öffnen"
      >
        {inner}
      </a>
    ) : (
      <span className="inline-flex items-center gap-1 text-muted-foreground">{inner}</span>
    );
  };

  return (
    <div className="container py-8 max-w-7xl mx-auto">
      {/* Kopfzeile */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div className="flex items-center">
          <BackButton className="mr-2 hidden lg:block" fallbackHref="/" />
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-gradient-to-br from-primary to-emerald-600 p-2.5 text-white shadow-md">
              <CalendarDays className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-primary">Terminkalender</h1>
              <p className="text-sm text-muted-foreground">Wettkämpfe, Kreismeisterschaften und Sitzungen im Überblick</p>
            </div>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          {user && (
            <>
              <Link href="/termine/add">
                <Button className="w-full sm:w-auto">
                  <CalendarPlus className="mr-2 h-4 w-4" />
                  Termin hinzufügen
                </Button>
              </Link>
              <Link href="/termine/verwaltung">
                <Button variant="secondary" className="w-full sm:w-auto">
                  <Pencil className="mr-2 h-4 w-4" />
                  Verwalten
                </Button>
              </Link>
            </>
          )}
          <Button variant="outline" onClick={exportAllEvents} className="w-full sm:w-auto">
            <Download className="mr-2 h-4 w-4" />
            Monat exportieren
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kalender */}
        <div className="lg:col-span-2">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Kalender</CardTitle>
              <CardDescription>Tage mit Terminen sind farblich markiert – tippe einen Tag an für die Details</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[350px] w-full" />
              ) : (
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  month={currentMonth}
                  onMonthChange={setCurrentMonth}
                  showOutsideDays
                  className="w-full p-0"
                  classNames={{
                    months: "w-full",
                    month: "w-full space-y-4",
                    caption: "flex justify-center pt-1 relative items-center mb-2",
                    caption_label: "text-base font-semibold capitalize",
                    nav_button: "h-8 w-8 bg-transparent rounded-full p-0 opacity-70 hover:opacity-100 hover:bg-muted inline-flex items-center justify-center transition-colors",
                    table: "w-full border-collapse",
                    head_row: "grid grid-cols-7",
                    head_cell: "text-muted-foreground font-medium text-xs uppercase tracking-wide pb-2 text-center",
                    row: "grid grid-cols-7 gap-y-1",
                    cell: "relative p-0 text-center focus-within:relative focus-within:z-20",
                    day: "mx-auto h-11 w-11 rounded-full p-0 font-normal text-sm inline-flex items-center justify-center hover:bg-muted transition-colors aria-selected:opacity-100",
                    day_selected: "bg-primary text-primary-foreground font-semibold hover:bg-primary hover:text-primary-foreground focus:bg-primary shadow-sm",
                    day_today: "ring-2 ring-primary/40 ring-inset font-semibold",
                    day_outside: "text-muted-foreground/40",
                    day_disabled: "text-muted-foreground/40",
                  }}
                  modifiers={{ hasEvent: (date) => hasEvents(date) }}
                  modifiersClassNames={{
                    hasEvent: "relative font-semibold after:absolute after:bottom-1.5 after:left-1/2 after:-translate-x-1/2 after:h-1.5 after:w-1.5 after:rounded-full after:bg-primary aria-selected:after:bg-primary-foreground",
                  }}
                  locale={de}
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Rechte Spalte: Tagesdetails + nächste Termine */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">
                {selectedDate ? format(selectedDate, "EEEE, dd. MMMM yyyy", { locale: de }) : 'Kein Tag gewählt'}
              </CardTitle>
              <CardDescription>
                {selectedEvents.length > 0
                  ? `${selectedEvents.length} Termin${selectedEvents.length === 1 ? '' : 'e'} an diesem Tag`
                  : 'Details zum ausgewählten Tag'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[160px] w-full" />
              ) : selectedEvents.length > 0 ? (
                <div className="space-y-3">
                  {selectedEvents.map((event, index) => {
                    const meta = typeMeta(event.type, event.isKreisverband);
                    return (
                      <div key={event.id || index} className={`rounded-lg border border-l-4 ${meta.accent} bg-card p-4 shadow-sm transition-all hover:shadow-md hover:bg-muted/20`}>
                        <div className="flex justify-between items-start gap-2">
                          <h3 className="font-semibold leading-tight">{sanitizeText(event.title)}</h3>
                          <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${meta.className}`}>
                            {meta.label}
                          </span>
                        </div>
                        <div className="mt-2 space-y-1 text-sm">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Clock className="h-3.5 w-3.5 shrink-0" />
                            {sanitizeText(event.time)} Uhr
                          </div>
                          <LocationLine location={event.location} />
                        </div>
                        {event.description && (
                          <p className="mt-2 text-sm text-muted-foreground break-words">
                            <LinkifiedText text={event.description} />
                          </p>
                        )}
                        <div className="mt-3 flex justify-end">
                          <AddToCalendar event={event} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <CalendarDays className="mx-auto h-8 w-8 text-muted-foreground/50" />
                  <p className="mt-2 text-sm text-muted-foreground">Keine Termine an diesem Tag.</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Nächste Termine</CardTitle>
              <CardDescription>Die kommenden Termine im Überblick</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[150px] w-full" />
              ) : upcomingEvents.length === 0 ? (
                <div className="py-6 text-center">
                  <p className="text-sm text-muted-foreground">Aktuell keine anstehenden Termine.</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {upcomingEvents.map((event, index) => {
                    const meta = typeMeta(event.type, event.isKreisverband);
                    return (
                      <button
                        key={event.id || index}
                        onClick={() => { setSelectedDate(event.date); setCurrentMonth(event.date); }}
                        className="w-full text-left py-3 border-b last:border-0 hover:bg-muted/30 rounded-md px-2 -mx-2 transition-colors"
                      >
                        <div className="flex justify-between items-start gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-primary">{relativeDay(event.date)}</span>
                              <span className="text-xs text-muted-foreground">· {sanitizeText(event.time)} Uhr</span>
                            </div>
                            <p className="font-medium truncate mt-0.5">{sanitizeText(event.title)}</p>
                            <div className="mt-0.5 text-xs">
                              <LocationLine location={event.location} />
                            </div>
                          </div>
                          <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${meta.className}`}>
                            {meta.label}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
