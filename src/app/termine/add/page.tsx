"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { CalendarIcon, HelpCircle, ArrowLeft } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createEvent } from '@/lib/services/calendar-service';
import { fetchLeagues, fetchSeasons } from '@/lib/services/statistics-service';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase/config';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { containsProfanity, findProfanity } from '@/lib/utils/profanity-filter';

export default function AddTerminPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { user } = useAuth();
  
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [time, setTime] = useState("19:00");
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [customLocation, setCustomLocation] = useState("");
  const [description, setDescription] = useState("");
  const [isKreisverband, setIsKreisverband] = useState(false);
  const [type, setType] = useState<string>("durchgang");
  const [popoverOpen, setPopoverOpen] = useState(false);
  
  const [seasons, setSeasons] = useState<Array<{ id: string; name: string; year: number }>>([]);
  const [leagues, setLeagues] = useState<Array<{ id: string; name: string; type: string }>>([]);
  const [selectedSeason, setSelectedSeason] = useState<string>("");
  const [selectedLeague, setSelectedLeague] = useState<string>("");
  const [locations, setLocations] = useState<string[]>([]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Prüfen, ob der Benutzer eingeloggt ist
  useEffect(() => {
    if (!user) {
      toast({
        title: 'Zugriff verweigert',
        description: 'Sie müssen angemeldet sein, um Termine zu erstellen.',
        variant: 'destructive'
      });
      router.push('/termine');
    }
  }, [user, router, toast]);
  
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
      
      if (leaguesData.length > 0) {
        setSelectedLeague(leaguesData[0].id);
      }
    };
    
    loadLeagues();
  }, [selectedSeason]);
  
  // Lade Clubs aus der Datenbank
  useEffect(() => {
    const loadClubs = async () => {
      try {
        const clubsQuery = query(
          collection(db, 'clubs'),
          orderBy('name', 'asc')
        );
        
        const snapshot = await getDocs(clubsQuery);
        
        if (!snapshot.empty) {
          const clubLocations = snapshot.docs.map(doc => {
            const data = doc.data();
            return data.shortName ? `${data.name} (${data.shortName})` : data.name;
          });
          setLocations(clubLocations);
        } else {
          // Fallback zu Standard-Orten
          setLocations([
            "Schützenhaus Einbeck",
            "Schützenhaus Markoldendorf",
            "Schützenhaus Dassel",
            "Schützenhaus Kreiensen",
            "Schützenhaus Salzderhelden"
          ]);
        }
      } catch (error) {
        console.error('Fehler beim Laden der Clubs:', error);
        // Fallback zu Standard-Orten
        setLocations([
          "Schützenhaus Einbeck",
          "Schützenhaus Markoldendorf",
          "Schützenhaus Dassel",
          "Schützenhaus Kreiensen",
          "Schützenhaus Salzderhelden"
        ]);
      }
    };
    
    loadClubs();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!date || !time || !title || !selectedSeason || !selectedLeague) {
      toast({
        title: 'Fehler',
        description: 'Bitte füllen Sie alle Pflichtfelder aus.',
        variant: 'destructive'
      });
      return;
    }
    
    setIsSubmitting(true);
    
    // Prüfe Titel auf verbotene Wörter
    if (containsProfanity(title)) {
      const forbiddenWords = findProfanity(title);
      alert(`Unerlaubter Inhalt im Titel: ${forbiddenWords.join(', ')}`);
      toast({
        title: 'Unerlaubter Inhalt',
        description: `Der Titel enthält unerlaubte Wörter: ${forbiddenWords.join(', ')}`,
        variant: 'destructive'
      });
      setIsSubmitting(false);
      return;
    }
    
    // Prüfe Beschreibung auf verbotene Wörter
    if (description && containsProfanity(description)) {
      const forbiddenWords = findProfanity(description);
      alert(`Unerlaubter Inhalt in der Beschreibung: ${forbiddenWords.join(', ')}`);
      toast({
        title: 'Unerlaubter Inhalt',
        description: `Die Beschreibung enthält unerlaubte Wörter: ${forbiddenWords.join(', ')}`,
        variant: 'destructive'
      });
      setIsSubmitting(false);
      return;
    }
    

    
    // Verwende den benutzerdefinierten Ort, wenn "other" ausgewählt wurde
    const finalLocation = location === 'other' ? customLocation : location;
    
    if (!finalLocation) {
      toast({
        title: 'Fehler',
        description: 'Bitte geben Sie einen Ort an.',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      // Finde den Namen der ausgewählten Liga
      const selectedLeagueObj = leagues.find(league => league.id === selectedLeague);
      const leagueName = selectedLeagueObj ? selectedLeagueObj.name : 'Unbekannte Liga';
      
      const eventData = {
        title,
        date,
        time,
        location: finalLocation,
        leagueId: selectedLeague,
        leagueName,
        type: type as 'durchgang' | 'kreismeisterschaft' | 'sitzung' | 'sonstiges',
        description,
        isKreisverband,
        createdBy: user?.email || 'Unbekannter Benutzer'
      };
      
      const eventId = await createEvent(eventData);
      
      if (eventId) {
        toast({
          title: 'Erfolg',
          description: 'Der Termin wurde erfolgreich erstellt.',
        });
        
        router.push('/termine');
      } else {
        throw new Error('Der Termin konnte nicht erstellt werden.');
      }
    } catch (error) {
      console.error('Fehler beim Erstellen des Termins:', error);
      toast({
        title: 'Fehler',
        description: 'Der Termin konnte nicht erstellt werden.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container py-8 max-w-3xl mx-auto">
      <Link href="/termine" className="flex items-center text-primary mb-6 hover:underline">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Zurück zum Terminkalender
      </Link>
      
      <h1 className="text-3xl font-bold mb-6 text-primary">Neuen Termin erstellen</h1>
      
      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Termindaten</CardTitle>
            <CardDescription>Bitte geben Sie die Details für den neuen Termin ein.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <div className="flex items-center">
                  <Label htmlFor="title">Titel</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 ml-2 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="w-80">Geben Sie einen aussagekräftigen Titel ein, z.B. "3. Durchgang Kreisliga Luftgewehr"</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Input 
                  id="title" 
                  placeholder="z.B. 3. Durchgang Kreisliga Luftgewehr" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center">
                    <Label htmlFor="date">Datum</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4 ml-2 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Wählen Sie das Datum des Termins aus</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, "PPP", { locale: de }) : <span>Datum auswählen</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={(date) => {
                          setDate(date);
                          setPopoverOpen(false); // Schließe das Popover nach der Auswahl
                        }}
                        initialFocus
                        locale={de}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center">
                    <Label htmlFor="time">Uhrzeit</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4 ml-2 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Geben Sie die Startzeit des Termins ein</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Input
                    id="time"
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center">
                  <Label htmlFor="location">Ort</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 ml-2 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Wählen Sie einen bekannten Ort aus oder geben Sie einen neuen ein</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Select
                  value={location}
                  onValueChange={setLocation}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Ort auswählen oder eingeben" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((loc, index) => (
                      <SelectItem key={index} value={loc}>{loc}</SelectItem>
                    ))}
                    <SelectItem value="other">Anderer Ort...</SelectItem>
                  </SelectContent>
                </Select>
                {location === 'other' && (
                  <Input
                    className="mt-2"
                    placeholder="Ort eingeben"
                    value={customLocation}
                    onChange={(e) => setCustomLocation(e.target.value)}
                    required
                  />
                )}
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center">
                  <Label htmlFor="season">Saison</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 ml-2 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Wählen Sie die Saison aus</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Select
                  value={selectedSeason}
                  onValueChange={setSelectedSeason}
                  disabled={seasons.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Saison auswählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {seasons.map(season => (
                      <SelectItem key={season.id} value={season.id}>{season.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center">
                  <Label htmlFor="league">Liga</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 ml-2 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Wählen Sie die Liga, für die dieser Termin gilt</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Select
                  value={selectedLeague}
                  onValueChange={setSelectedLeague}
                  disabled={leagues.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Liga auswählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {leagues.map(league => (
                      <SelectItem key={league.id} value={league.id}>{league.name}</SelectItem>
                    ))}
                    <SelectItem value="all">Alle Ligen</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center">
                  <Label htmlFor="type">Art des Termins</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 ml-2 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Wählen Sie die Art des Termins aus</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Select
                  value={type}
                  onValueChange={setType}
                >
                  <SelectTrigger>
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
              
              <div className="space-y-2">
                <div className="flex items-center">
                  <Label htmlFor="description">Beschreibung (optional)</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 ml-2 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Fügen Sie bei Bedarf weitere Informationen hinzu</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Textarea 
                  id="description" 
                  placeholder="Zusätzliche Informationen zum Termin..." 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              
              <div className="flex items-center space-x-2 pt-2">
                <Checkbox 
                  id="kreisverband" 
                  checked={isKreisverband}
                  onCheckedChange={(checked) => setIsKreisverband(checked as boolean)}
                />
                <div className="grid gap-1.5 leading-none">
                  <Label
                    htmlFor="kreisverband"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Kreisverbandstermin
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Markieren Sie diesen Termin als offiziellen Kreisverbandstermin
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" type="button" asChild>
              <Link href="/termine">Abbrechen</Link>
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Wird gespeichert...' : 'Termin speichern'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
