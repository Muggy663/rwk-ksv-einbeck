// src/app/admin/page.tsx
"use client";
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { 
  Users, Trophy, ListChecks, Settings, UserCog, 
  MessagesSquare, FileUp, Award, BarChart3, 
  Info as InfoIcon, FileText,
  Euro
} from 'lucide-react';
import { AdminStats } from '@/components/admin/AdminStats';
import { LoginMonitor } from '@/components/admin/LoginMonitor';
import { BackButton } from '@/components/ui/back-button';

function BulkVerifyButton() {
  const [loading, setLoading] = React.useState(false);
  const [done, setDone] = React.useState<number | null>(null);
  const handleClick = async () => {
    setLoading(true);
    try {
      const { authFetch } = await import('@/lib/auth/authFetch');
      const res = await authFetch('/api/admin/verify-existing-users', { method: 'POST' });
      const data = await res.json();
      setDone(data.updated ?? 0);
    } catch (e) { setDone(-1); } finally { setLoading(false); }
  };
  if (done !== null) return <p className="text-xs text-green-600 font-medium">{done >= 0 ? done + ' User als verifiziert markiert' : 'Fehler'}</p>;
  return <Button variant="outline" className="w-full text-xs" onClick={handleClick} disabled={loading}>{loading ? 'Laeuft...' : 'Bestehende User verifizieren'}</Button>;
}
export default function AdminDashboardPage() {
  return (
    <div className="px-2 md:px-4 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center">
          <BackButton className="mr-2" fallbackHref="/dashboard-auswahl" />
          <div>
            <h1 className="text-xl md:text-3xl font-bold text-primary">Admin Dashboard</h1>
            <p className="text-sm md:text-base text-muted-foreground">Verwaltung der Rundenwettkämpfe.</p>
          </div>
        </div>
        <Link href="/km-orga" className="w-full md:w-auto">
          <Button variant="outline" className="w-full md:w-auto">
            🏆 KM-Orga-Dashboard
          </Button>
        </Link>
      </div>

      {/* Admin-Statistiken */}
      <AdminStats />

      {/* Login-Monitoring */}
      <LoginMonitor />
      
      <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium text-accent">Saisonverwaltung</CardTitle>
            <Trophy className="h-6 w-6 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <CardDescription className="mb-4">
              Saisons, Ligen und zugehörige Daten verwalten.
            </CardDescription>
            <div className="flex flex-col gap-2">
              <Link href="/admin/seasons" passHref>
                <Button className="w-full">Saisons verwalten</Button>
              </Link>
              <Link href="/admin/season-transition" passHref>
                <Button variant="outline" className="w-full">Saisonwechsel</Button>
              </Link>
              <Link href="/admin/promotion-relegation" passHref>
                <Button variant="outline" className="w-full">🔼🔽 Auf- & Abstiege</Button>
              </Link>
              <Link href="/admin/league-settings">
                <Button variant="outline" className="w-full">
                  <Settings className="mr-2 h-4 w-4" />
                  Liga-Einstellungen
                </Button>
              </Link>
              <Link href="/admin/exports/certificates" passHref>
                <Button variant="outline" className="w-full">
                  <Award className="mr-2 h-4 w-4" />
                  Urkunden erstellen
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium text-accent">Stammdaten</CardTitle>
            <Users className="h-6 w-6 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <CardDescription className="mb-4">
              Vereine, Mannschaften und Schützen pflegen.
            </CardDescription>
             <div className="flex flex-col gap-2">
                <Link href="/admin/clubs" passHref><Button variant="outline" className="w-full">Vereine</Button></Link>
                <Link href="/admin/teams" passHref><Button variant="outline" className="w-full">Mannschaften</Button></Link>
                <Link href="/admin/shooters" passHref><Button variant="outline" className="w-full">Schützen</Button></Link>
                <Link href="/admin/mitglieder-import" passHref><Button variant="outline" className="w-full"><FileUp className="mr-2 h-4 w-4" />Mitcom-Import</Button></Link>
             </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium text-accent">Ergebnisse</CardTitle>
            <ListChecks className="h-6 w-6 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <CardDescription className="mb-4">
              Ergebnisse der Wettkampfrunden eintragen oder bearbeiten.
            </CardDescription>
            <div className="flex flex-col gap-2">
                <Link href="/admin/results" passHref><Button className="w-full">Erfassen</Button></Link>
                <Link href="/admin/edit-results" passHref><Button variant="outline" className="w-full">Bearbeiten/Löschen</Button></Link>
                <Link href="/admin/missing-results" passHref><Button variant="outline" className="w-full bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200">Fehlende Ergebnisse prüfen</Button></Link>
                <Link href="/admin/substitutions" passHref><Button variant="outline" className="w-full bg-blue-50 hover:bg-blue-100 text-blue-800 border-blue-200">🔄 Ersatzschützen verwalten</Button></Link>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium">Benutzerverwaltung</CardTitle>
            <UserCog className="h-6 w-6 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <CardDescription className="mb-4">
              Neues 3-Tier-Rollensystem: Platform, KV und Club-Rollen verwalten.
            </CardDescription>
            <div className="flex flex-col gap-2">
              <Link href="/admin/user-management" passHref>
                <Button className="w-full" variant="outline">👥 Benutzer & Rollen</Button>
              </Link>
              <BulkVerifyButton />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium">Dokumentenverwaltung</CardTitle>
            <FileText className="h-6 w-6 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <CardDescription className="mb-4">
              Dokumente, Ausschreibungen, Formulare und APK-Dateien hochladen und verwalten.
            </CardDescription>
            <Link href="/admin/documents" passHref>
              <Button className="w-full">Dokumente verwalten</Button>
            </Link>
          </CardContent>
        </Card>
        
        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium">Mannschaftsführer</CardTitle>
            <Users className="h-6 w-6 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <CardDescription className="mb-4">
              Liste aller Mannschaftsführer nach Saison und Liga mit Kontaktdaten.
            </CardDescription>
            <Link href="/admin/team-managers" passHref>
              <Button className="w-full" variant="outline">Mannschaftsführer anzeigen</Button>
            </Link>
          </CardContent>
        </Card>
        
        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium">Support Anfragen</CardTitle>
            <MessagesSquare className="h-6 w-6 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <CardDescription className="mb-4">
             Eingegangene Support-Tickets und Feedbacks einsehen.
            </CardDescription>
            <div className="flex flex-col gap-2">
              <Link href="/admin/support-tickets" passHref>
                <Button className="w-full" variant="outline">Tickets anzeigen</Button>
              </Link>
              <Link href="/admin/feedback" passHref>
                <Button className="w-full" variant="outline">💬 Feedbacks</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
        
         <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium">Monitoring</CardTitle> 
            <BarChart3 className="h-6 w-6 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-center p-3 bg-green-50 rounded-md">
              <p className="text-sm text-green-800 font-medium">✅ Error-Monitoring aktiv</p>
              <p className="text-xs text-green-600">Fehler werden automatisch per E-Mail gesendet</p>
            </div>
          </CardContent>
        </Card>
        
         <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium">Startgelder & Finanzen</CardTitle> 
            <Euro className="h-6 w-6 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <CardDescription className="mb-4">
              Startgelder berechnen und Kostenübersicht für den Schatzmeister.
            </CardDescription>
            <Link href="/admin/startgelder" passHref>
              <Button className="w-full">Startgelder verwalten</Button>
            </Link>
          </CardContent>
        </Card>
        
        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium">Kommunikation</CardTitle> 
            <FileText className="h-6 w-6 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <CardDescription className="mb-4">
              Handzettel, E-Mails und Support-Zugang.
            </CardDescription>
             <div className="flex flex-col gap-2">
              <Link href="/admin/handzettel" passHref>
                <Button className="w-full">Handzettel erstellen</Button>
              </Link>
              <Link href="/admin/email-system" passHref>
                <Button className="w-full" variant="outline">📧 E-Mail-System</Button>
              </Link>
              <Link href="/admin/support-access" passHref>
                <Button className="w-full" variant="outline">🛠️ Support-Zugang</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
        
        
         <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium">System</CardTitle> 
            <Settings className="h-6 w-6 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <CardDescription className="mb-4">
              Systemfunktionen und Protokolle.
            </CardDescription>
             <div className="flex flex-col gap-2">
              <Link href="/admin/audit" passHref>
                <Button className="w-full">Änderungsprotokoll</Button>
              </Link>
              <Link href="/admin/recovery" passHref>
                <Button className="w-full" variant="outline">🔄 Datenwiederherstellung</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>



       <Card className="mt-8 shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl text-accent flex items-center"><InfoIcon className="mr-2 h-5 w-5" /> Wichtige Hinweise</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>Dies ist der Administrationsbereich. Änderungen hier haben direkte Auswirkungen auf die angezeigten Daten in der App.</p>
          <p>Stellen Sie sicher, dass alle Eingaben korrekt sind, bevor Sie sie speichern.</p>
        </CardContent>
      </Card>
    </div>
  );
}
