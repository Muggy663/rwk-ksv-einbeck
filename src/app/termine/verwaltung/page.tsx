"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, CalendarPlus, ArrowLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import Link from 'next/link';
import { fetchEvents, deleteEvent, Event } from '@/lib/services/calendar-service';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';

export default function TermineVerwaltungPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  // Lade alle Termine
  useEffect(() => {
    const loadEvents = async () => {
      setIsLoading(true);
      try {
        const eventsData = await fetchEvents();
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
  }, [toast]);

  // Prüfe, ob der Benutzer angemeldet ist
  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

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

  // Funktion zum Löschen eines Termins
  const handleDeleteEvent = async () => {
    if (!selectedEvent?.id) return;
    
    try {
      const success = await deleteEvent(selectedEvent.id);
      if (success) {
        setEvents(events.filter(event => event.id !== selectedEvent.id));
        toast({
          title: 'Termin gelöscht',
          description: 'Der Termin wurde erfolgreich gelöscht.',
        });
      } else {
        toast({
          title: 'Fehler',
          description: 'Der Termin konnte nicht gelöscht werden.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Fehler beim Löschen des Termins:', error);
      toast({
        title: 'Fehler',
        description: 'Der Termin konnte nicht gelöscht werden.',
        variant: 'destructive'
      });
    } finally {
      setDeleteDialogOpen(false);
      setSelectedEvent(null);
    }
  };

  // Funktion zum Bearbeiten eines Termins
  const handleEditEvent = (event: Event) => {
    if (!event.id) return;
    router.push(`/termine/bearbeiten?id=${event.id}`);
  };

  return (
    <div className="container py-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h1 className="text-3xl font-bold text-primary mb-4 md:mb-0">Terminverwaltung</h1>
        <div className="flex flex-col sm:flex-row gap-2">
          <Link href="/termine/add">
            <Button className="w-full sm:w-auto">
              <CalendarPlus className="mr-2 h-4 w-4" />
              Termin hinzufügen
            </Button>
          </Link>
          <Link href="/termine">
            <Button variant="outline" className="w-full sm:w-auto">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Zurück zum Kalender
            </Button>
          </Link>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Alle Termine</CardTitle>
          <CardDescription>Verwalten Sie hier alle Termine</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-[400px] w-full" />
          ) : events.length > 0 ? (
            <div className="space-y-4">
              {events
                .sort((a, b) => a.date.getTime() - b.date.getTime())
                .map((event) => (
                  <div key={event.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">{event.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{event.location}</p>
                        <p className="text-sm mt-2">
                          {format(event.date, 'dd.MM.yyyy', { locale: de })} um {event.time} Uhr
                        </p>
                        {event.description && (
                          <p className="text-sm mt-2 text-muted-foreground">{event.description}</p>
                        )}
                      </div>
                      <div className="flex flex-col items-end">
                        <Badge variant={getBadgeVariant(event.type, event.isKreisverband)}>
                          {getBadgeText(event.type, event.isKreisverband)}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">{event.leagueName}</p>
                      </div>
                    </div>
                    <div className="mt-4 flex justify-end space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleEditEvent(event)}
                      >
                        <Pencil className="h-4 w-4 mr-1" />
                        Bearbeiten
                      </Button>
                      {user?.email === 'admin@rwk-einbeck.de' && (
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          onClick={() => {
                            setSelectedEvent(event);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Löschen
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">Keine Termine vorhanden.</p>
          )}
        </CardContent>
      </Card>

      {/* Löschen-Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Termin löschen</AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie diesen Termin wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteEvent} className="bg-destructive text-destructive-foreground">
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
