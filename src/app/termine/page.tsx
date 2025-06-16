"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { AlertCircle, CalendarPlus, Download, FileDown, Pencil } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { fetchEvents, generateICalEvent, generateICalFile, Event } from '@/lib/services/calendar-service';
import { fetchLeagues, fetchSeasons } from '@/lib/services/statistics-service';
import { format, isSameDay, startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns';
import { de } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';

export default function TerminePage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvents, setSelectedEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  const [seasons, setSeasons] = useState<Array<{ id: string; name: string; year: number }>>([]);
  const [leagues, setLeagues] = useState<Array<{ id: string; name: string; type: string }>>([]);
  const [selectedSeason, setSelectedSeason] = useState<string>('');
  const [selectedLeague, setSelectedLeague] = useState<string>('all');
  
  // Lade Saisons beim ersten Rendern
  useEffect(() => {
    const loadSeasons = async () => {
      const seasonsData = await fetchSeasons();
      setSeasons(seasonsData);
      
      if (seasonsData.length > 0) {
        // Finde die aktuelle Saison (Status "Laufend")
        const currentSeason = seasonsData.find(s => s.name.includes('2025'));
        if (currentSeason) {
          setSelectedSeason(currentSeason.id);
        } else {
          setSelectedSeason(seasonsData[0].id);
        }
      }
    };
    
    loadSeasons();
  }, []);
  
  // Lade Ligen, wenn sich die Saison ändert
  useEffect(() => {
    const loadLeagues = async () => {
      if (!selectedSeason) return;
      
      const leaguesData = await fetchLeagues(selectedSeason);
      setLeagues(leaguesData);
    };
    
    loadLeagues();
  }, [selectedSeason]);
  
  // Lade Termine, wenn sich der Monat oder die Filter ändern
  useEffect(() => {
    const loadEvents = async () => {
      if (!selectedSeason) return;
      
      setIsLoading(true);
      
      const start = startOfMonth(currentMonth);
      const end = endOfMonth(currentMonth);
      
      try {
        const eventsData = await fetchEvents(start, end, selectedLeague);
        setEvents(eventsData);
      } catch (error) {
        console.error('Fehler beim Laden der Termine:', error);
        toast({
          title: 'Fehler',
          description: 'Die Termine konnten nicht geladen werden.',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadEvents();
  }, [currentMonth, selectedSeason, selectedLeague, toast]);
  
  // Aktualisiere die ausgewählten Termine, wenn sich das Datum oder die Termine ändern
  useEffect(() => {
    if (selectedDate && events.length > 0) {
      const filteredEvents = events.filter(event => 
        isSameDay(event.date, selectedDate)
      );
      setSelectedEvents(filteredEvents);
    } else {
      setSelectedEvents([]);
    }
  }, [selectedDate, events]);
  
  // Funktion, die prüft, ob ein Datum Termine enthält
  const hasEvents = (date: Date) => {
    return events.some(event => isSameDay(event.date, date));
  };
  
  // Funktion zum Exportieren eines Termins als iCal
  const exportEvent = (event: Event) => {
    try {
      const icalContent = generateICalEvent(event);
      const blob = new Blob([icalContent], { type: 'text/calendar;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `${event.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: 'Export erfolgreich',
        description: 'Der Termin wurde als iCal-Datei exportiert.',
      });
    } catch (error) {
      console.error('Fehler beim Exportieren des Termins:', error);
      toast({
        title: 'Fehler',
        description: 'Der Termin konnte nicht exportiert werden.',
        variant: 'destructive'
      });
    }
  };
  
  // Funktion zum Exportieren aller Termine als iCal
  const exportAllEvents = () => {
    try {
      const icalContent = generateICalFile(events);
      const blob = new Blob([icalContent], { type: 'text/calendar;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `rwk_termine_${format(currentMonth, 'yyyy_MM')}.ics`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: 'Export erfolgreich',
        description: 'Alle Termine wurden als iCal-Datei exportiert.',
      });
    } catch (error) {
      console.error('Fehler beim Exportieren der Termine:', error);
      toast({
        title: 'Fehler',
        description: 'Die Termine konnten nicht exportiert werden.',
        variant: 'destructive'
      });
    }
  };
  
  // Funktion zum Bestimmen der Badge-Farbe basierend auf dem Termintyp
  const getBadgeVariant = (type: string, isKreisverband?: boolean) => {
    if (isKreisverband) return "destructive";
    switch (type) {
      case "durchgang": return "default";
      case "kreismeisterschaft": return "secondary";
      case "sitzung": return "outline";
      default: return "secondary";
    }
  };
  
  // Funktion zum Bestimmen des Badge-Textes basierend auf dem Termintyp
  const getBadgeText = (type: string, isKreisverband?: boolean) => {
    if (isKreisverband) return "Kreisverband";
    switch (type) {
      case "durchgang": return "Durchgang";
      case "kreismeisterschaft": return "Kreismeisterschaft";
      case "sitzung": return "Sitzung";
      default: return "Sonstiges";
    }
  };
  
  // Funktion zum Ändern des aktuellen Monats
  const changeMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => 
      direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1)
    );
  };

  return (
    <div className="container py-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h1 className="text-3xl font-bold text-primary mb-4 md:mb-0">Terminkalender</h1>
        <div className="flex flex-col sm:flex-row gap-2">
          {user && (
            <>
              <Link href="/termine/add">
                <Button className="w-full sm:w-auto mr-2">
                  <CalendarPlus className="mr-2 h-4 w-4" />
                  Termin hinzufügen
                </Button>
              </Link>
              <Link href="/termine/verwaltung">
                <Button variant="secondary" className="w-full sm:w-auto">
                  <Pencil className="mr-2 h-4 w-4" />
                  Termine verwalten
                </Button>
              </Link>
            </>
          )}
          <Button variant="outline" onClick={exportAllEvents} className="w-full sm:w-auto">
            <Download className="mr-2 h-4 w-4" />
            Alle Termine exportieren
          </Button>
        </div>
      </div>
      
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
          <div className="w-full sm:w-64">
            <Label htmlFor="season-select">Saison</Label>
            <Select
              value={selectedSeason}
              onValueChange={setSelectedSeason}
              disabled={seasons.length === 0}
            >
              <SelectTrigger id="season-select">
                <SelectValue placeholder="Saison auswählen" />
              </SelectTrigger>
              <SelectContent>
                {seasons.map(season => (
                  <SelectItem key={season.id} value={season.id}>
                    {season.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="w-full sm:w-64">
            <Label htmlFor="league-select">Liga</Label>
            <Select
              value={selectedLeague}
              onValueChange={setSelectedLeague}
              disabled={leagues.length === 0}
            >
              <SelectTrigger id="league-select">
                <SelectValue placeholder="Alle Ligen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Ligen</SelectItem>
                {leagues.map(league => (
                  <SelectItem key={league.id} value={league.id}>
                    {league.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Kalender</CardTitle>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" onClick={() => changeMonth('prev')}>
                    &lt;
                  </Button>
                  <span className="text-sm font-medium">
                    {format(currentMonth, 'MMMM yyyy', { locale: de })}
                  </span>
                  <Button variant="outline" size="sm" onClick={() => changeMonth('next')}>
                    &gt;
                  </Button>
                </div>
              </div>
              <CardDescription>Übersicht aller anstehenden Wettkämpfe und Veranstaltungen</CardDescription>
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
                  className="rounded-md border"
                  modifiers={{
                    hasEvent: (date) => hasEvents(date),
                  }}
                  modifiersClassNames={{
                    hasEvent: "bg-primary/20 font-bold text-primary",
                  }}
                  locale={de}
                />
              )}
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Termine am {selectedDate?.toLocaleDateString('de-DE')}</CardTitle>
              <CardDescription>Details zu den ausgewählten Terminen</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[200px] w-full" />
              ) : selectedEvents.length > 0 ? (
                <div className="space-y-4">
                  {selectedEvents.map((event, index) => (
                    <div key={event.id || index} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <h3 className="font-semibold">{event.title}</h3>
                        <Badge variant={getBadgeVariant(event.type, event.isKreisverband)}>
                          {getBadgeText(event.type, event.isKreisverband)}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{event.location}</p>
                      <p className="text-sm mt-2">Uhrzeit: {event.time} Uhr</p>
                      {event.description && (
                        <p className="text-sm mt-2 text-muted-foreground">{event.description}</p>
                      )}
                      <div className="mt-4 flex justify-end">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => exportEvent(event)}
                        >
                          <FileDown className="h-4 w-4 mr-1" />
                          Als iCal exportieren
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">Keine Termine an diesem Tag.</p>
              )}
            </CardContent>
          </Card>
          
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Nächste Termine</CardTitle>
              <CardDescription>Anstehende Wettkämpfe</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[150px] w-full" />
              ) : events.length > 0 ? (
                <div className="space-y-2">
                  {events
                    .filter(event => event.date >= new Date())
                    .sort((a, b) => a.date.getTime() - b.date.getTime())
                    .slice(0, 3)
                    .map((event, index) => (
                      <div key={event.id || index} className="flex justify-between items-center py-2 border-b last:border-0">
                        <div>
                          <p className="font-medium">{event.title}</p>
                          <p className="text-xs text-muted-foreground">{event.location}</p>
                        </div>
                        <div className="flex flex-col items-end">
                          <p className="text-sm">{format(event.date, 'dd.MM.yyyy')}</p>
                          <Badge variant={getBadgeVariant(event.type, event.isKreisverband)} className="mt-1">
                            {getBadgeText(event.type, event.isKreisverband)}
                          </Badge>
                        </div>
                      </div>
                    ))
                  }
                </div>
              ) : (
                <p className="text-muted-foreground">Keine anstehenden Termine.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}