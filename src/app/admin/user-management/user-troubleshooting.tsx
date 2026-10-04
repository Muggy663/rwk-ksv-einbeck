"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Loader2, Search, MailCheck, KeyRound, Lock, Unlock, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { authFetch } from '@/lib/auth/authFetch';
import { logError } from '@/lib/utils/secure-logger';

interface UserStatus {
  auth: {
    uid: string;
    email: string | null;
    emailVerified: boolean;
    disabled: boolean;
    displayName: string | null;
    providers: string[];
    lastSignIn: string | null;
    created: string | null;
  };
  permissions: {
    emailVerifiedByAdmin: boolean;
    role: string | null;
    platformRole: string | null;
    kvRole: string | null;
    clubRoles: Record<string, string>;
    userType: string | null;
    isActive: boolean;
    displayName: string | null;
  } | null;
  clubs: Array<{ id: string; name: string }>;
}

type Aktion = 'markVerified' | 'resetPassword' | 'disable' | 'enable' | 'resendVerification';

export function UserTroubleshooting() {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<UserStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [working, setWorking] = useState<Aktion | null>(null);
  const [notFound, setNotFound] = useState(false);

  const laden = async (mail?: string) => {
    const ziel = (mail ?? email).trim();
    if (!ziel) return;
    setLoading(true);
    setNotFound(false);
    setStatus(null);
    try {
      const res = await authFetch('/api/admin/user-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: ziel }),
      });
      if (res.status === 404) {
        setNotFound(true);
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Status konnte nicht geladen werden.');
      setStatus(data);
    } catch (error: any) {
      logError('Troubleshooting laden fehlgeschlagen:', error);
      toast({ title: 'Fehler', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const aktion = async (a: Aktion) => {
    if (!status) return;
    setWorking(a);
    try {
      const route = a === 'resendVerification' ? '/api/admin/resend-verification' : '/api/admin/user-actions';
      const body =
        a === 'resendVerification'
          ? { uid: status.auth.uid, email: status.auth.email }
          : { uid: status.auth.uid, email: status.auth.email, action: a };
      const res = await authFetch(route, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Aktion fehlgeschlagen');

      const texte: Record<Aktion, string> = {
        markVerified: 'E-Mail als bestätigt markiert (Auth + Admin-Flag).',
        resetPassword: 'Passwort-Zurücksetzen-Mail wurde gesendet.',
        disable: 'Konto wurde gesperrt.',
        enable: 'Konto wurde entsperrt.',
        resendVerification: 'Bestätigungs-E-Mail wurde gesendet.',
      };
      toast({ title: '✅ Erledigt', description: texte[a] });
      await laden(status.auth.email || undefined); // Status aktualisieren
    } catch (error: any) {
      toast({ title: 'Fehler', description: error.message, variant: 'destructive' });
    } finally {
      setWorking(null);
    }
  };

  const JaNein = ({ wert, gutWennJa = true }: { wert: boolean; gutWennJa?: boolean }) => {
    const gut = gutWennJa ? wert : !wert;
    return (
      <Badge variant="outline" className={gut ? 'bg-green-50 text-green-700 border-green-300' : 'bg-red-50 text-red-700 border-red-300'}>
        {wert ? 'Ja' : 'Nein'}
      </Badge>
    );
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl text-primary flex items-center gap-2">🔧 Nutzer-Troubleshooting</CardTitle>
        <CardDescription>
          Suche einen Nutzer per E-Mail, sieh seinen vollständigen Status (Anmeldung + Berechtigungen)
          und behebe typische Probleme direkt – ohne Code-Änderung.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Suche */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="email"
              placeholder="E-Mail des Nutzers"
              className="pl-8"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') laden(); }}
            />
          </div>
          <Button onClick={() => laden()} disabled={loading || !email.trim()}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Status laden'}
          </Button>
        </div>

        {notFound && (
          <div className="text-sm text-muted-foreground border rounded-md p-4 text-center">
            Kein Nutzer mit dieser E-Mail gefunden.
          </div>
        )}

        {status && (
          <>
            {/* Statusübersicht */}
            <div className="border rounded-md divide-y">
              <div className="p-3 flex items-center justify-between gap-2">
                <span className="text-sm font-medium">Angemeldeter Name</span>
                <span className="text-sm text-muted-foreground">{status.auth.displayName || status.permissions?.displayName || '—'}</span>
              </div>
              <div className="p-3 flex items-center justify-between gap-2">
                <span className="text-sm font-medium">E-Mail bestätigt (Anmeldung)</span>
                <JaNein wert={status.auth.emailVerified} />
              </div>
              <div className="p-3 flex items-center justify-between gap-2">
                <span className="text-sm font-medium">Admin-Bestätigung</span>
                <JaNein wert={!!status.permissions?.emailVerifiedByAdmin} />
              </div>
              <div className="p-3 flex items-center justify-between gap-2">
                <span className="text-sm font-medium">Konto gesperrt</span>
                <JaNein wert={status.auth.disabled} gutWennJa={false} />
              </div>
              <div className="p-3 flex items-center justify-between gap-2">
                <span className="text-sm font-medium">Rollen</span>
                <span className="text-sm text-muted-foreground text-right">
                  {[
                    status.permissions?.platformRole,
                    status.permissions?.kvRole,
                    ...Object.values(status.permissions?.clubRoles || {}),
                    status.permissions?.role,
                  ].filter(Boolean).join(', ') || '— (keine Rolle)'}
                </span>
              </div>
              <div className="p-3 flex items-center justify-between gap-2">
                <span className="text-sm font-medium">Verein(e)</span>
                <span className="text-sm text-muted-foreground text-right">
                  {status.clubs.length ? status.clubs.map((c) => c.name).join(', ') : '—'}
                </span>
              </div>
              <div className="p-3 flex items-center justify-between gap-2">
                <span className="text-sm font-medium">userType</span>
                <span className="text-sm text-muted-foreground">{status.permissions?.userType || '—'}</span>
              </div>
              <div className="p-3 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                <span>UID</span>
                <span className="font-mono">{status.auth.uid}</span>
              </div>
            </div>

            {/* Hinweis bei Widerspruch (Joschka-Fall) */}
            {!status.auth.emailVerified && status.permissions?.emailVerifiedByAdmin && (
              <div className="text-sm bg-amber-50 border border-amber-200 text-amber-800 rounded-md p-3">
                ⚠️ Widerspruch: Admin-Bestätigung ist gesetzt, aber die Anmeldung sieht die E-Mail als
                unbestätigt. Mit „E-Mail als bestätigt markieren" wird beides angeglichen.
              </div>
            )}

            {/* Aktionen */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Button variant="outline" onClick={() => aktion('markVerified')} disabled={!!working} className="justify-start">
                {working === 'markVerified' ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <MailCheck className="h-4 w-4 mr-2 text-green-600" />}
                E-Mail als bestätigt markieren
              </Button>

              <Button variant="outline" onClick={() => aktion('resendVerification')} disabled={!!working} className="justify-start">
                {working === 'resendVerification' ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Mail className="h-4 w-4 mr-2 text-blue-600" />}
                Bestätigungs-Mail erneut senden
              </Button>

              <Button variant="outline" onClick={() => aktion('resetPassword')} disabled={!!working} className="justify-start">
                {working === 'resetPassword' ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <KeyRound className="h-4 w-4 mr-2 text-blue-600" />}
                Passwort-Zurücksetzen-Mail senden
              </Button>

              {status.auth.disabled ? (
                <Button variant="outline" onClick={() => aktion('enable')} disabled={!!working} className="justify-start">
                  {working === 'enable' ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Unlock className="h-4 w-4 mr-2 text-green-600" />}
                  Konto entsperren
                </Button>
              ) : (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" disabled={!!working} className="justify-start">
                      <Lock className="h-4 w-4 mr-2 text-red-600" />
                      Konto sperren
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Konto sperren?</AlertDialogTitle>
                      <AlertDialogDescription>
                        {status.auth.email} kann sich danach nicht mehr anmelden, bis du das Konto wieder entsperrst.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                      <AlertDialogAction onClick={() => aktion('disable')}>Sperren</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
