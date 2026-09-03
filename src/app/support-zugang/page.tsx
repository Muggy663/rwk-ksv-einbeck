"use client";

import { useState, useEffect } from 'react';
import { logError } from '@/lib/utils/secure-logger';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { NativeSelect } from '@/components/ui/native-select';
import { Shield, Key, Copy, Loader2, CheckCircle } from 'lucide-react';
import { useAuthContext } from '@/components/auth/AuthContext';
import { BackButton } from '@/components/ui/back-button';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase/config';
import { collection, addDoc, getDocs, query, where, documentId, Timestamp } from 'firebase/firestore';
import { deriveUserClubIds } from '@/lib/clubs/userClubs';

interface ClubOption {
  id: string;
  name: string;
}

// Erzeugt einen 6-stelligen Code ohne leicht verwechselbare Zeichen (0/O, 1/I)
function generateSupportCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Gültigkeitsdauer des generierten Codes
const GUELTIGKEIT_STUNDEN = 48;

export default function SupportZugangPage() {
  const { user, userAppPermissions } = useAuthContext();
  const { toast } = useToast();

  const [clubs, setClubs] = useState<ClubOption[]>([]);
  const [selectedClubId, setSelectedClubId] = useState('');
  const [loadingClubs, setLoadingClubs] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [ablaufZeit, setAblaufZeit] = useState<Date | null>(null);

  useEffect(() => {
    const loadClubs = async () => {
      if (!userAppPermissions) {
        setLoadingClubs(false);
        return;
      }
      try {
        const clubIds = deriveUserClubIds(userAppPermissions as any);
        if (clubIds.length === 0) {
          setClubs([]);
          setLoadingClubs(false);
          return;
        }

        // Vereinsnamen laden (Firestore 'in'-Query max. 30 IDs; hier praxisnah ausreichend)
        const result: ClubOption[] = [];
        for (let i = 0; i < clubIds.length; i += 30) {
          const chunk = clubIds.slice(i, i + 30);
          const snap = await getDocs(
            query(collection(db, 'clubs'), where(documentId(), 'in', chunk))
          );
          snap.forEach((d) => result.push({ id: d.id, name: d.data().name || d.id }));
        }

        setClubs(result);
        if (result.length === 1) {
          setSelectedClubId(result[0].id);
        }
      } catch (error) {
        logError('Fehler beim Laden der Vereine:', error);
        toast({ title: 'Fehler', description: 'Vereine konnten nicht geladen werden.', variant: 'destructive' });
      } finally {
        setLoadingClubs(false);
      }
    };
    loadClubs();
  }, [userAppPermissions, toast]);

  const handleGenerate = async () => {
    if (!user || !selectedClubId) {
      toast({ title: 'Verein fehlt', description: 'Bitte einen Verein auswählen.', variant: 'destructive' });
      return;
    }
    const club = clubs.find((c) => c.id === selectedClubId);
    if (!club) return;

    setGenerating(true);
    try {
      const code = generateSupportCode();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + GUELTIGKEIT_STUNDEN);

      await addDoc(collection(db, 'support_sessions'), {
        clubId: club.id,
        clubName: club.name,
        supportCode: code,
        adminUid: '', // wird bei der Aktivierung durch den Admin gesetzt
        expiresAt: Timestamp.fromDate(expiresAt),
        createdAt: Timestamp.now(),
        createdBy: user.uid,
        createdByName: user.displayName || user.email || 'Unbekannt',
        isActive: true,
        accessLog: []
      });

      setGeneratedCode(code);
      setAblaufZeit(expiresAt);
      toast({ title: 'Code erstellt', description: 'Der Support-Code wurde erzeugt.' });
    } catch (error) {
      logError('Fehler beim Erstellen des Support-Codes:', error);
      toast({ title: 'Fehler', description: 'Der Support-Code konnte nicht erstellt werden.', variant: 'destructive' });
    } finally {
      setGenerating(false);
    }
  };

  const copyCode = async () => {
    if (!generatedCode) return;
    try {
      await navigator.clipboard.writeText(generatedCode);
      toast({ title: 'Kopiert', description: 'Der Code wurde in die Zwischenablage kopiert.' });
    } catch {
      toast({ title: 'Hinweis', description: 'Bitte den Code manuell markieren und kopieren.' });
    }
  };

  if (!user) {
    return (
      <div className="container py-8 max-w-2xl mx-auto">
        <p className="text-center">Bitte melden Sie sich an.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <BackButton className="mr-2" fallbackHref="/dashboard-auswahl" />
        <Shield className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold text-primary">Support-Zugang generieren</h1>
          <p className="text-muted-foreground mt-1">
            Erstellen Sie einen zeitlich begrenzten Code, damit das Support-Team vorübergehend auf Ihren Verein zugreifen kann.
          </p>
        </div>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Code erstellen
          </CardTitle>
          <CardDescription>
            Der Code ist {GUELTIGKEIT_STUNDEN} Stunden gültig. Senden Sie ihn an den Administrator.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loadingClubs ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Vereine werden geladen...
            </div>
          ) : clubs.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Ihrem Konto ist kein Verein zugeordnet. Wenden Sie sich bitte direkt an den Administrator.
            </p>
          ) : (
            <>
              <div>
                <Label htmlFor="club">Verein</Label>
                <NativeSelect
                  id="club"
                  value={selectedClubId}
                  onValueChange={setSelectedClubId}
                  disabled={clubs.length === 1}
                  placeholder="Bitte wählen..."
                  options={clubs.map((c) => ({ value: c.id, label: c.name }))}
                />
              </div>

              <Button onClick={handleGenerate} disabled={generating || !selectedClubId}>
                {generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Key className="mr-2 h-4 w-4" />}
                Support-Code generieren
              </Button>
            </>
          )}

          {generatedCode && (
            <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-4 dark:bg-green-950/30 dark:border-green-800">
              <div className="flex items-center gap-2 mb-2 text-green-800 dark:text-green-200">
                <CheckCircle className="h-5 w-5" />
                <span className="font-semibold">Ihr Support-Code</span>
              </div>
              <div className="flex items-center gap-3">
                <code className="text-2xl font-bold tracking-widest bg-white dark:bg-gray-900 px-4 py-2 rounded border">
                  {generatedCode}
                </code>
                <Button variant="outline" size="sm" onClick={copyCode}>
                  <Copy className="h-4 w-4 mr-2" />
                  Kopieren
                </Button>
              </div>
              {ablaufZeit && (
                <p className="text-xs text-green-700 dark:text-green-300 mt-2">
                  Gültig bis {ablaufZeit.toLocaleString('de-DE')}. Senden Sie diesen Code an den Administrator
                  (z. B. per E-Mail an rwk-leiter-ksve@gmx.de).
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
