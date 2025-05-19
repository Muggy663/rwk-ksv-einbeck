// src/app/admin/page.tsx
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Users, Trophy, ListChecks, BarChart3, FileUp, Award, Settings } from 'lucide-react';

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-primary">Admin Dashboard</h1>
          <p className="text-muted-foreground">Verwaltung der Rundenwettkämpfe.</p>
        </div>
        {/* Optional: Add a settings button or similar here */}
        {/* <Button variant="outline" size="icon"><Settings className="h-5 w-5" /></Button> */}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium text-accent">Saisonverwaltung</CardTitle>
            <Trophy className="h-6 w-6 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <CardDescription className="mb-4">
              Saisons, Ligen und zugehörige Daten verwalten.
            </CardDescription>
            <Link href="/admin/seasons" passHref>
              <Button className="w-full">Saisons verwalten</Button>
            </Link>
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
             <div className="grid grid-cols-2 gap-2">
                <Link href="/admin/clubs" passHref><Button variant="outline" className="w-full">Vereine</Button></Link>
                <Link href="/admin/teams" passHref><Button variant="outline" className="w-full">Mannschaften</Button></Link>
                <Link href="/admin/shooters" passHref><Button variant="outline" className="w-full col-span-2">Schützen</Button></Link>
             </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium text-accent">Ergebniserfassung</CardTitle>
            <ListChecks className="h-6 w-6 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <CardDescription className="mb-4">
              Ergebnisse der Wettkampfrunden eintragen.
            </CardDescription>
            <Link href="/admin/results" passHref>
              <Button className="w-full">Ergebnisse erfassen</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow opacity-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium">Datenwerkzeuge</CardTitle>
            <FileUp className="h-6 w-6 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <CardDescription className="mb-4">
              Importieren und Exportieren von Daten.
            </CardDescription>
            <Button className="w-full" disabled>CSV Import (Demnächst)</Button>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow opacity-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium">Saisonabschluss</CardTitle>
            <Award className="h-6 w-6 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <CardDescription className="mb-4">
              Urkunden und Auswertungen generieren.
            </CardDescription>
            <Button className="w-full" disabled>Urkunden (PDF - Demnächst)</Button>
          </CardContent>
        </Card>
        
         <Card className="shadow-lg hover:shadow-xl transition-shadow opacity-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium">Statistiken</CardTitle>
            <BarChart3 className="h-6 w-6 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <CardDescription>
              Auswertungen und Statistiken (Demnächst).
            </CardDescription>
             <Button className="w-full" disabled>Statistiken anzeigen</Button>
          </CardContent>
        </Card>
      </div>
       <Card className="mt-8 shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl text-accent">Wichtige Hinweise</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>Dies ist der Administrationsbereich. Änderungen hier haben direkte Auswirkungen auf die angezeigten Daten in der App.</p>
          <p>Stellen Sie sicher, dass alle Eingaben korrekt sind, bevor Sie sie speichern.</p>
          <p>Bei Fragen oder Problemen wenden Sie sich an den technischen Support.</p>
        </CardContent>
      </Card>
    </div>
  );
}

// Placeholder pages for other admin sections to avoid 404s initially
export async function generateStaticParams() {
  const sections = ['seasons', 'leagues', 'clubs', 'teams', 'shooters', 'results'];
  return sections.map(section => ({ slug: section }));
}
