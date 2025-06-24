'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, ArrowLeft, Save } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { fetchEvents, updateEvent, Event } from '@/lib/services/calendar-service';
import { fetchLeagues, fetchSeasons } from '@/lib/services/statistics-service';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface PageProps {
  params: { id: string };
}

export default function EditEventPage({ params }: PageProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const router = useRouter();
  const id = decodeURIComponent(params.id);
  
  const [event, setEvent] = useState<Event | null>(null);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [time, setTime] = useState('18:00');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'durchgang' | 'kreismeisterschaft' | 'sitzung' | 'sonstiges'>('durchgang');
  const [isKreisverband, setIsKreisverband] = useState(false);
  
  const [seasons, setSeasons] = useState<Array<{ id: string; name: string; year: number }>>([]);
  const [leagues, setLeagues] = useState<Array<{ id: string; name: string; type: string }>>([]);
  const [selectedSeason, setSelectedSeason] = useState<string>('');
  const [selectedLeague, setSelectedLeague] = useState<string>('');
  const [selectedLeagueName, setSelectedLeagueName] = useState<string>('');
  
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Lade Termin-Details
  useEffect(() => {
    const loadEvent = async () => {
      setIsLoading(true);
      try {
        const eventsData = await fetchEvents();
        const foundEvent = eventsData.find(e => e.id === id);
        
        if (foundEvent) {
          setEvent(foundEvent);
          setTitle(foundEvent.title);
          setDate(foundEvent.date);
          setTime(foundEvent.time);
          setLocation(foundEvent.location);
          setDescription(foundEvent.description || '');
          setType(foundEvent.type);
          setIsKreisverband(foundEvent.isKreisverband);
          setSelectedLeague(foundEvent.leagueId);
          setSelectedLeagueName(foundEvent.leagueName);
        } else {
          toast({
            title: 'Fehler',
            description: 'Der Termin wurde nicht gefunden.',
            variant: 'destructive'
          });
          router.push('/termine/verwaltung');
        }
      } catch (error) {
        console.error('Fehler beim Laden des Termins:', error);
        toast({
          title: 'Fehler',
          description: 'Der Termin konnte nicht geladen werden.',
          variant: 'destructive'
        });
        router.push('/termine/verwaltung');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadEvent();
  }, [id, toast, router]);

  // Lade Saisons
  useEffect(() => {
    const loadSeasons = async () => {
      const seasonsData = await fetchSeasons();
      setSeasons(seasonsData);
      
      if (seasonsData.length > 0 && event) {
        // Finde die passende Saison für die Liga
        const season = seasonsData.find(s => s.year === event.date.getFullYear());
        if (season) {
          setSelectedSeason(season.id);
        } else {
          setSelectedSeason(seasonsData[0].id);
        }
      }
    };
    
    if (event) {
      loadSeasons();
    }
  }, [event]);

  // Lade Ligen, wenn sich die Saison ändert
  useEffect(() => {
    const loadLeagues = async () => {
      if (!selectedSeason) return;
      
      const leaguesData = await fetchLeagues(selectedSeason);
      setLeagues(leaguesData);
    };
    
    loadLeagues();
  }, [selectedSeason]);

  // Prüfe, ob der Benutzer angemeldet ist
  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  // Funktion zum Speichern des Termins
  const handleSave = async () => {
    if (!date || !title || !location || !time || !selectedLeague) {
      toast({
        title: 'Fehler',
        description: 'Bitte füllen Sie alle Pflichtfelder aus.',
        variant: 'destructive'
      });
      return;
    }
    
    setIsSaving(true);
    
    try {
      const updatedEvent = {
        title,
        date,
        time,
        location,
        description,
        type,
        isKreisverband,
        leagueId: selectedLeague,
        leagueName: selectedLeagueName || leagues.find(l => l.id === selectedLeague)?.name || '',
      };
      
      const success = await updateEvent(id, updatedEvent);
      
      if (success) {
        toast({
          title: 'Termin gespeichert',
          description: 'Der Termin wurde erfolgreich aktualisiert.',
        });
        router.push('/termine/verwaltung');
      } else {
        toast({
          title: 'Fehler',
          description: 'Der Termin konnte nicht gespeichert werden.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Fehler beim Speichern des Termins:', error);
      toast({
        title: 'Fehler',
        description: 'Der Termin konnte nicht gespeichert werden.',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="container py-8 max-w-3xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h1 className="text-3xl font-bold text-primary mb-4 md:mb-0">Termin bearbeiten</h1>
        <Link href="/termine/verwaltung">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Zurück zur Übersicht
          </Button>
        </Link>
      </div>
      
      {isLoading ? (
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2 mt-2" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Termin-Details</CardTitle>
            <CardDescription>Bearbeiten Sie die Details des Termins</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Titel *</Label>
                <Input 
                  id="title" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  placeholder="Titel des Termins"
                  required
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date">Datum *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="date"
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, 'PPP', { locale: de }) : <span>Datum auswählen</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        initialFocus
                        locale={de}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div>
                  <Label htmlFor="time">Uhrzeit *</Label>
                  <Input 
                    id="time" 
                    type="time" 
                    value={time} 
                    onChange={(e) => setTime(e.target.value)} 
                    required
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="location">Ort *</Label>
                <Input 
                  id="location" 
                  value={location} 
                  onChange={(e) => setLocation(e.target.value)} 
                  placeholder="Ort des Termins"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="description">Beschreibung</Label>
                <Textarea 
                  id="description" 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                  placeholder="Beschreibung des Termins"
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="season">Saison *</Label>
                  <Select
                    value={selectedSeason}
                    onValueChange={(value) => {
                      setSelectedSeason(value);
                      setSelectedLeague('');
                    }}
                    disabled={seasons.length === 0}
                  >
                    <SelectTrigger id="season">
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
                
                <div>
                  <Label htmlFor="league">Liga *</Label>
                  <Select
                    value={selectedLeague}
                    onValueChange={(value) => {
                      setSelectedLeague(value);
                      const league = leagues.find(l => l.id === value);
                      if (league) {
                        setSelectedLeagueName(league.name);
                      }
                    }}
                    disabled={leagues.length === 0}
                  >
                    <SelectTrigger id="league">
                      <SelectValue placeholder="Liga auswählen" />
                    </SelectTrigger>
                    <SelectContent>
                      {leagues.map(league => (
                        <SelectItem key={league.id} value={league.id}>
                          {league.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type">Typ *</Label>
                  <Select
                    value={type}
                    onValueChange={(value: 'durchgang' | 'kreismeisterschaft' | 'sitzung' | 'sonstiges') => setType(value)}
                  >
                    <SelectTrigger id="type">
                      <SelectValue placeholder="Typ auswählen" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="durchgang">Durchgang</SelectItem>
                      <SelectItem value="kreismeisterschaft">Kreismeisterschaft</SelectItem>
                      <SelectItem value="sitzung">Sitzung</SelectItem>
                      <SelectItem value="sonstiges">Sonstiges</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center space-x-2 pt-8">
                  <Switch
                    id="kreisverband"
                    checked={isKreisverband}
                    onCheckedChange={setIsKreisverband}
                  />
                  <Label htmlFor="kreisverband">Kreisverband-Termin</Label>
                </div>
              </div>
              
              <div className="flex justify-end pt-4">
                <Button 
                  onClick={handleSave} 
                  disabled={isSaving}
                  className="w-full md:w-auto"
                >
                  {isSaving ? (
                    "Speichern..."
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Termin speichern
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}