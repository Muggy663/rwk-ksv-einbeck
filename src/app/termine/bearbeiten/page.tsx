'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { ArrowLeft, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter, useSearchParams } from 'next/navigation';
import { db } from '@/lib/firebase/config';
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { collection, query, getDocs } from 'firebase/firestore';

export default function EditEventPage() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id') || '';
  
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('durchgang');
  const [isKreisverband, setIsKreisverband] = useState(false);
  const [leagueId, setLeagueId] = useState('');
  const [leagueName, setLeagueName] = useState('');
  
  const [leagues, setLeagues] = useState<Array<{ id: string; name: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Lade Termin-Details
  useEffect(() => {
    if (!id) {
      toast({
        title: 'Fehler',
        description: 'Keine Termin-ID angegeben.',
        variant: 'destructive'
      });
      router.push('/termine/verwaltung');
      return;
    }
    
    const loadEvent = async () => {
      setIsLoading(true);
      try {
        const eventRef = doc(db, 'events', id);
        const eventDoc = await getDoc(eventRef);
        
        if (eventDoc.exists()) {
          const data = eventDoc.data();
          setTitle(data.title || '');
          
          // Datum formatieren
          if (data.date) {
            const eventDate = data.date.toDate();
            setDate(eventDate.toISOString().split('T')[0]);
          }
          
          setTime(data.time || '');
          setLocation(data.location || '');
          setDescription(data.description || '');
          setType(data.type || 'durchgang');
          setIsKreisverband(data.isKreisverband || false);
          setLeagueId(data.leagueId || '');
          setLeagueName(data.leagueName || '');
          
          // Lade Ligen
          const leaguesQuery = query(collection(db, 'rwk_leagues'));
          const leaguesSnapshot = await getDocs(leaguesQuery);
          const leaguesData = leaguesSnapshot.docs.map(doc => ({
            id: doc.id,
            name: doc.data().name
          }));
          setLeagues(leaguesData);
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

  // Funktion zum Speichern des Termins
  const handleSave = async () => {
    if (!id || !title || !date || !time || !location || !leagueId) {
      toast({
        title: 'Fehler',
        description: 'Bitte füllen Sie alle Pflichtfelder aus.',
        variant: 'destructive'
      });
      return;
    }
    
    setIsSaving(true);
    
    try {
      const eventRef = doc(db, 'events', id);
      
      // Datum konvertieren
      const eventDate = new Date(date);
      
      await updateDoc(eventRef, {
        title,
        date: Timestamp.fromDate(eventDate),
        time,
        location,
        description,
        type,
        isKreisverband,
        leagueId,
        leagueName: leagueName || leagues.find(l => l.id === leagueId)?.name || '',
        updatedAt: Timestamp.now()
      });
      
      toast({
        title: 'Termin gespeichert',
        description: 'Der Termin wurde erfolgreich aktualisiert.',
      });
      
      router.push('/termine/verwaltung');
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
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Termin-Details</CardTitle>
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
                  <Input 
                    id="date" 
                    type="date" 
                    value={date} 
                    onChange={(e) => setDate(e.target.value)} 
                    required
                  />
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
              
              <div>
                <Label htmlFor="league">Liga *</Label>
                <Select
                  value={leagueId}
                  onValueChange={(value) => {
                    setLeagueId(value);
                    const league = leagues.find(l => l.id === value);
                    if (league) {
                      setLeagueName(league.name);
                    }
                  }}
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
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type">Typ *</Label>
                  <Select
                    value={type}
                    onValueChange={setType}
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