"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { CalendarIcon, Upload, X, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { protestService, Protest } from '@/lib/services/protest-service';
import { fetchLeagues, fetchSeasons } from '@/lib/services/statistics-service';

interface ProtestFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ProtestForm({ onSuccess, onCancel }: ProtestFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form data
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Protest['category']>('ergebnis');
  const [priority, setPriority] = useState<Protest['priority']>('mittel');
  const [matchDate, setMatchDate] = useState<Date>();
  
  // Liga/Team data
  const [seasons, setSeasons] = useState<Array<{ id: string; name: string }>>([]);
  const [leagues, setLeagues] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedSeason, setSelectedSeason] = useState('');
  const [selectedLeague, setSelectedLeague] = useState('');
  const [teamName, setTeamName] = useState('');
  const [shooterName, setShooterName] = useState('');
  
  // Attachments
  const [attachments, setAttachments] = useState<string[]>([]);

  useEffect(() => {
    loadSeasons();
  }, []);

  useEffect(() => {
    if (selectedSeason) {
      loadLeagues();
    }
  }, [selectedSeason]);

  const loadSeasons = async () => {
    try {
      const seasonsData = await fetchSeasons();
      setSeasons(seasonsData || []);
      
      if (seasonsData && seasonsData.length > 0) {
        const currentSeason = seasonsData.find(s => s.name.includes('2025'));
        setSelectedSeason(currentSeason?.id || seasonsData[0].id);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Saisons:', error);
    }
  };

  const loadLeagues = async () => {
    try {
      const leaguesData = await fetchLeagues(selectedSeason);
      setLeagues(leaguesData || []);
    } catch (error) {
      console.error('Fehler beim Laden der Ligen:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: 'Fehler',
        description: 'Sie müssen angemeldet sein, um einen Protest einzureichen.',
        variant: 'destructive'
      });
      return;
    }

    if (!title || !description) {
      toast({
        title: 'Fehler',
        description: 'Bitte füllen Sie alle Pflichtfelder aus.',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const selectedLeagueData = leagues.find(l => l.id === selectedLeague);
      
      const protestData: Omit<Protest, 'id' | 'submittedAt' | 'status' | 'comments'> = {
        title,
        description,
        category,
        priority,
        leagueId: selectedLeague,
        leagueName: selectedLeagueData?.name,
        teamName: teamName || undefined,
        shooterName: shooterName || undefined,
        matchDate,
        submittedBy: user.email || '',
        submittedByName: user.displayName || user.email || 'Unbekannt',
        attachments
      };

      await protestService.submitProtest(protestData);
      
      // Push-Notification Hinweis (ohne Cloud Functions)
      console.log('⚖️ Protest eingereicht - Push-Notifications würden an Rundenwettkampfleiter gesendet:', title);

      toast({
        title: 'Protest eingereicht',
        description: 'Ihr Protest wurde erfolgreich eingereicht und wird vom Rundenwettkampfleiter geprüft.',
      });

      // Form zurücksetzen
      setTitle('');
      setDescription('');
      setCategory('ergebnis');
      setPriority('mittel');
      setMatchDate(undefined);
      setTeamName('');
      setShooterName('');
      setAttachments([]);

      onSuccess?.();
    } catch (error) {
      console.error('Fehler beim Einreichen des Protests:', error);
      toast({
        title: 'Fehler',
        description: 'Der Protest konnte nicht eingereicht werden.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'ergebnis': return 'Ergebnis-Einspruch';
      case 'verhalten': return 'Verhalten';
      case 'regelverstoß': return 'Regelverstoß';
      case 'sonstiges': return 'Sonstiges';
      default: return cat;
    }
  };

  const getPriorityLabel = (prio: string) => {
    switch (prio) {
      case 'niedrig': return 'Niedrig';
      case 'mittel': return 'Mittel';
      case 'hoch': return 'Hoch';
      default: return prio;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Protest einreichen
        </CardTitle>
        <CardDescription>
          Reichen Sie einen offiziellen Einspruch beim Sportausschuss ein.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Titel *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Kurze Beschreibung des Problems"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Kategorie *</Label>
              <Select value={category} onValueChange={(value: Protest['category']) => setCategory(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ergebnis">Ergebnis-Einspruch</SelectItem>
                  <SelectItem value="verhalten">Verhalten</SelectItem>
                  <SelectItem value="regelverstoß">Regelverstoß</SelectItem>
                  <SelectItem value="sonstiges">Sonstiges</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Priorität</Label>
              <Select value={priority} onValueChange={(value: Protest['priority']) => setPriority(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="niedrig">Niedrig</SelectItem>
                  <SelectItem value="mittel">Mittel</SelectItem>
                  <SelectItem value="hoch">Hoch</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Wettkampfdatum</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {matchDate ? format(matchDate, "PPP", { locale: de }) : "Datum auswählen"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={matchDate}
                    onSelect={setMatchDate}
                    initialFocus
                    locale={de}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="season">Saison</Label>
              <Select value={selectedSeason} onValueChange={setSelectedSeason}>
                <SelectTrigger>
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

            <div className="space-y-2">
              <Label htmlFor="league">Liga</Label>
              <Select value={selectedLeague} onValueChange={setSelectedLeague}>
                <SelectTrigger>
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
            <div className="space-y-2">
              <Label htmlFor="team">Mannschaft (optional)</Label>
              <Input
                id="team"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="Name der betroffenen Mannschaft"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="shooter">Schütze (optional)</Label>
              <Input
                id="shooter"
                value={shooterName}
                onChange={(e) => setShooterName(e.target.value)}
                placeholder="Name des betroffenen Schützen"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Beschreibung *</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detaillierte Beschreibung des Problems und der gewünschten Lösung..."
              rows={6}
              required
            />
          </div>

          <div className="flex justify-end space-x-2">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Abbrechen
              </Button>
            )}
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Wird eingereicht...' : 'Protest einreichen'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}