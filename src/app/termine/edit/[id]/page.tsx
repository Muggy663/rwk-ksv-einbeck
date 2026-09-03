'use client';

import { useState, useEffect, use } from 'react';
import { logError } from '@/lib/utils/secure-logger';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Link from 'next/link';
import { ArrowLeft, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase/config';
import { doc, getDoc, updateDoc, Timestamp, collection, query, getDocs, orderBy } from 'firebase/firestore';

export default function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { toast } = useToast();
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [customLocation, setCustomLocation] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('durchgang');
  const [isKreisverband, setIsKreisverband] = useState(false);
  const [locations, setLocations] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!id) {
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

          if (data.date?.toDate) {
            const eventDate = data.date.toDate();
            setDate(eventDate.toISOString().split('T')[0]);
          }

          setTime(data.time || '');
          setDescription(data.description || '');
          setType(data.type || 'durchgang');
          setIsKreisverband(data.isKreisverband || false);

          const clubsQuery = query(collection(db, 'clubs'), orderBy('name', 'asc'));
          const clubsSnapshot = await getDocs(clubsQuery);
          const clubLocations = clubsSnapshot.docs
            .filter(d => {
              const cd = d.data();
              return !cd.name.toLowerCase().includes('development') && !cd.name.toLowerCase().includes('test');
            })
            .map(d => {
              const cd = d.data();
              return cd.shortName ? `${cd.name} (${cd.shortName})` : cd.name;
            });

          const allLocations = clubLocations.length > 0 ? clubLocations : [
            'Schützenhaus Einbeck', 'Schützenhaus Markoldendorf', 'Schützenhaus Dassel',
            'Schützenhaus Kreiensen', 'Schützenhaus Salzderhelden'
          ];
          setLocations(allLocations);

          const savedLocation = data.location || '';
          if (savedLocation && allLocations.includes(savedLocation)) {
            setLocation(savedLocation);
          } else if (savedLocation) {
            setLocation('other');
            setCustomLocation(savedLocation);
          }
        } else {
          toast({ title: 'Fehler', description: 'Termin nicht gefunden.', variant: 'destructive' });
          router.push('/termine/verwaltung');
        }
      } catch (error) {
        logError('Fehler beim Laden des Termins:', error);
        toast({ title: 'Fehler', description: 'Termin konnte nicht geladen werden.', variant: 'destructive' });
        router.push('/termine/verwaltung');
      } finally {
        setIsLoading(false);
      }
    };

    loadEvent();
  }, [id, toast, router]);

  const handleSave = async () => {
    const finalLocation = location === 'other' ? customLocation : location;
    if (!title || !date || !time || !finalLocation) {
      toast({ title: 'Fehler', description: 'Bitte alle Pflichtfelder ausfüllen.', variant: 'destructive' });
      return;
    }

    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'events', id), {
        title,
        date: Timestamp.fromDate(new Date(date)),
        time,
        location: finalLocation,
        description,
        type,
        isKreisverband,
        leagueId: 'all',
        leagueName: 'Alle Ligen',
        updatedAt: Timestamp.now()
      });

      toast({ title: '✅ Termin gespeichert', description: 'Der Termin wurde erfolgreich aktualisiert.' });
      router.push('/termine/verwaltung');
    } catch (error) {
      logError('Fehler beim Speichern:', error);
      toast({ title: 'Fehler', description: 'Termin konnte nicht gespeichert werden.', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container py-8 max-w-3xl mx-auto space-y-4">
        {[1,2,3].map(i => <div key={i} className="h-10 bg-gray-200 rounded animate-pulse" />)}
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-primary">Termin bearbeiten</h1>
        <Link href="/termine/verwaltung">
          <Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" />Zurück</Button>
        </Link>
      </div>

      <Card>
        <CardHeader><CardTitle>Termin-Details</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title">Titel *</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date">Datum *</Label>
              <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="time">Uhrzeit *</Label>
              <Input id="time" type="time" value={time} onChange={(e) => setTime(e.target.value)} required />
            </div>
          </div>

          <div>
            <Label htmlFor="location">Ort *</Label>
            <Select value={location} onValueChange={setLocation}>
              <SelectTrigger><SelectValue placeholder="Ort auswählen" /></SelectTrigger>
              <SelectContent>
                {locations.map((loc, i) => <SelectItem key={i} value={loc}>{loc}</SelectItem>)}
                <SelectItem value="other">Anderer Ort...</SelectItem>
              </SelectContent>
            </Select>
            {location === 'other' && (
              <Input className="mt-2" placeholder="Ort eingeben" value={customLocation} onChange={(e) => setCustomLocation(e.target.value)} />
            )}
          </div>

          <div>
            <Label htmlFor="description">Beschreibung</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="type">Typ *</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger id="type"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="durchgang">Durchgang</SelectItem>
                  <SelectItem value="kreismeisterschaft">Kreismeisterschaft</SelectItem>
                  <SelectItem value="sitzung">Sitzung</SelectItem>
                  <SelectItem value="sonstiges">Sonstiges</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2 mt-6">
              <input type="checkbox" id="kreisverband" checked={isKreisverband} onChange={(e) => setIsKreisverband(e.target.checked)} className="h-4 w-4" />
              <Label htmlFor="kreisverband">Kreisverbandstermin</Label>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button onClick={handleSave} disabled={isSaving} className="w-full md:w-auto">
              {isSaving ? 'Speichern...' : <><Save className="mr-2 h-4 w-4" />Termin speichern</>}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
