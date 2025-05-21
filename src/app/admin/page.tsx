// src/app/admin/page.tsx
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Users, Trophy, ListChecks, BarChart3, FileUp, Award, Settings, CheckCircle, UserCog, FileText, MessagesSquare } from 'lucide-react';

export default function AdminDashboardPage() {
  const openPoints = [
    "Firestore Sicherheitsregeln weiter verfeinern/testen (basierend auf user_permissions).",
    "Client-seitige Nutzung der user_permissions für Vereinsvertreter abschließen (Mannschaften, Schützen, Ergebnisse).",
    "Benutzerverwaltung durch Super-Admin: UI-Verbesserungen (z.B. Liste bearbeitbarer User-Permissions).",
    "'Unbehandelte Benutzer'-Widget im Admin-Dashboard (Anzeige von Nutzern ohne user_permissions-Eintrag).",
    "Erfassung/Anzeige von Mannschaftsführer-Kontaktdaten (Grundlage implementiert).",
    "PDF-Generierung für Liga-Meldebögen/Ergebnislisten (Platzhalter).",
    "Rolle 'Mannschaftsführer' konzeptionell vorbereitet (darf nur Ergebnisse für zugewiesene Teams eintragen).",
    "Schützen-Detailansicht mit Diagramm (Grundlage implementiert, Verfeinerung möglich).",
    "Captcha auf der Login-Seite (Platzhalter).",
    "Platzhalter 'Schnitt Vorjahr' in den Team-Dialogen mit echter Funktionalität versehen.",
    "Ergebniserfassung (Details): Logging, wer wann welches Ergebnis geändert hat (Audit-Trail).",
    "Automatischer Saisonabschluss / Auf- und Abstieg.",
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-primary">Admin Dashboard</h1>
          <p className="text-muted-foreground">Verwaltung der Rundenwettkämpfe.</p>
        </div>
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
            <CardTitle className="text-lg font-medium text-accent">Ergebnisse</CardTitle>
            <ListChecks className="h-6 w-6 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <CardDescription className="mb-4">
              Ergebnisse der Wettkampfrunden eintragen oder bearbeiten.
            </CardDescription>
            <div className="grid grid-cols-2 gap-2">
                <Link href="/admin/results" passHref><Button className="w-full">Erfassen</Button></Link>
                <Link href="/admin/edit-results" passHref><Button variant="outline" className="w-full">Bearbeiten</Button></Link>
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
              Benutzerrollen und Vereinszuweisungen verwalten. (Basis implementiert)
            </CardDescription>
            <Link href="/admin/user-management" passHref>
              <Button className="w-full" variant="outline">Benutzer verwalten</Button>
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
             Eingegangene Support-Tickets einsehen. (Basis implementiert)
            </CardDescription>
            <Link href="/admin/support-tickets" passHref>
              <Button className="w-full" variant="outline">Tickets anzeigen</Button>
            </Link>
          </CardContent>
        </Card>
        
        <Card className="shadow-lg hover:shadow-xl transition-shadow">
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

         <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium">Saisonabschluss</CardTitle>
            <Award className="h-6 w-6 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <CardDescription className="mb-4">
              Urkunden und Auswertungen generieren.
            </CardDescription>
            <Button className="w-full" disabled>Urkunden/PDF (Demnächst)</Button>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-xl hover:shadow-2xl transition-shadow duration-300">
        <CardHeader>
          <CardTitle className="text-xl text-accent flex items-center">
            <ListChecks className="mr-3 h-6 w-6" />
            Nächste Schritte / Offene Punkte
          </CardTitle>
          <CardDescription>Eine Übersicht der geplanten Erweiterungen und zu erledigenden Aufgaben.</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-5">
            {openPoints.map((point, index) => (
              <li key={index} className="flex items-start">
                <CheckCircle className="h-4 w-4 mr-2 mt-0.5 text-primary/70 flex-shrink-0" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

       <Card className="mt-8 shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl text-accent">Wichtige Hinweise</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>Dies ist der Administrationsbereich. Änderungen hier haben direkte Auswirkungen auf die angezeigten Daten in der App.</p>
          <p>Stellen Sie sicher, dass alle Eingaben korrekt sind, bevor Sie sie speichern.</p>
        </CardContent>
      </Card>
    </div>
  );
}
