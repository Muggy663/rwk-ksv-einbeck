"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/hooks/use-auth';
import { authFetch } from '@/lib/auth/authFetch';
import { useToast } from '@/hooks/use-toast';
import { logError } from '@/lib/utils/secure-logger';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Trophy, Loader2, CheckCircle2 } from 'lucide-react';
import type { Club } from '@/types/rwk';

const ROLLEN = [
  { value: 'SPORTLEITER', label: 'Sportleiter (RWK + KM Vollzugriff)' },
  { value: 'MANNSCHAFTSFUEHRER', label: 'Mannschaftsführer (Ergebnisse eingeben)' },
];

export default function VereinszugangPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();

  const [clubs, setClubs] = useState<Club[]>([]);
  const [loadingClubs, setLoadingClubs] = useState(true);
  const [clubId, setClubId] = useState('');
  const [role, setRole] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [erfolg, setErfolg] = useState(false);

  // Nicht eingeloggte Nutzer zur Anmeldung schicken.
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    const ladeVereine = async () => {
      setLoadingClubs(true);
      try {
        const snap = await getDocs(query(collection(db, 'clubs'), orderBy('name', 'asc')));
        const liste = snap.docs
          .map((d) => ({ id: d.id, ...d.data() } as Club))
          .filter((c) => c.id && typeof c.id === 'string' && c.id.trim() !== '');
        setClubs(liste);
      } catch (error) {
        logError('Fehler beim Laden der Vereine:', error);
        toast({ title: 'Fehler', description: 'Vereine konnten nicht geladen werden.', variant: 'destructive' });
      } finally {
        setLoadingClubs(false);
      }
    };
    ladeVereine();
  }, [toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clubId || !role) {
      toast({ title: 'Fehlende Angaben', description: 'Bitte Verein und Rolle auswählen.', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      const res = await authFetch('/api/access-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clubId, requestedClubRole: role, message }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'Antrag konnte nicht gesendet werden.');
      }
      setErfolg(true);
      toast({ title: '✅ Antrag gesendet', description: 'Dein Antrag wurde übermittelt und wird geprüft.' });
    } catch (error: any) {
      toast({ title: 'Fehler', description: error.message || 'Antrag konnte nicht gesendet werden.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (erfolg) {
    return (
      <div className="container mx-auto p-4 sm:p-6 max-w-md">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle className="text-2xl">Antrag gesendet</CardTitle>
            <CardDescription>
              Dein Antrag auf Vereinszugang wurde übermittelt. Der RWK-Leiter prüft ihn und schaltet dir die
              Rechte frei. Du wirst per E-Mail informiert, sobald es so weit ist.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Link href="/">
              <Button variant="outline">Zur Startseite</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-md">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4">
            <Trophy className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <CardTitle className="text-2xl">Vereinszugang beantragen</CardTitle>
          <CardDescription>
            Beantrage deine Rolle für den Rundenwettkampf / die Kreismeisterschaft. Nach der Prüfung durch den
            RWK-Leiter werden dir die Rechte freigeschaltet.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="verein">Verein *</Label>
              <Select value={clubId} onValueChange={setClubId} disabled={loadingClubs}>
                <SelectTrigger id="verein" className="mt-1">
                  <SelectValue placeholder={loadingClubs ? 'Vereine werden geladen …' : 'Verein auswählen'} />
                </SelectTrigger>
                <SelectContent>
                  {clubs.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}{c.clubNumber ? ` (${c.clubNumber})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="rolle">Gewünschte Rolle *</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger id="rolle" className="mt-1">
                  <SelectValue placeholder="Rolle auswählen" />
                </SelectTrigger>
                <SelectContent>
                  {ROLLEN.map((r) => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="begruendung">Begründung (optional)</Label>
              <Textarea
                id="begruendung"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="mt-1"
                placeholder="z. B. seit 2024 Sportleiter des Vereins, Vorstand kann bestätigen"
                rows={3}
                maxLength={1000}
              />
            </div>

            <Button type="submit" className="w-full" disabled={submitting || loadingClubs}>
              {submitting ? 'Wird gesendet …' : 'Antrag senden'}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Angemeldet als {user.email}
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
