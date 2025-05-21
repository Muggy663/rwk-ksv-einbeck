// src/app/admin/page.tsx
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Users, Trophy, ListChecks, Settings, CheckCircle, UserCog, FileText, MessagesSquare, FileUp, Award, BarChart3, ShieldQuestion, GitPullRequestClosed } from 'lucide-react';

export default function AdminDashboardPage() {
  const agendaPunkte = [
    { text: "Firestore Sicherheitsregeln vollständig implementieren und testen (basierend auf user_permissions).", status: "Als Nächstes" },
    { text: "Benutzerverwaltung durch Super-Admin (UI-Verbesserungen): Auflisten/Bearbeiten von user_permissions.", status: "Offen" },
    { text: "'Unbehandelte Benutzer'-Widget im Admin-Dashboard (Anzeige von Nutzern ohne user_permissions-Eintrag, die sich aber ggf. schon eingeloggt haben).", status: "Offen" },
    { text: "Client-seitige Nutzung der user_permissions für Vereinsvertreter/Mannschaftsführer abschließen (Sicherstellen, dass der Vereinskontext überall korrekt angewendet wird).", status: "In Arbeit" },
    { text: "Captcha auf der Login-Seite integrieren.", status: "Offen" },
    { text: "Anzeige 'Mannschaften (Info)' verfeinern: Name des einen Teams anzeigen, wenn Schütze nur einem Team zugeordnet (ohne Kontext).", status: "Offen" },
    { text: "Platzhalter 'Schnitt Vorjahr' in Team-Dialogen mit echter Funktionalität versehen.", status: "Offen" },
    { text: "Ergebniserfassung (Details): Audit-Trail für Ergebnisänderungen (wer hat wann was geändert).", status: "Offen" },
    { text: "Automatischer Saisonabschluss / Auf- und Abstieg (fortgeschritten).", status: "Zukunft" },
    { text: "CSV-Import für Stammdaten (fortgeschritten).", status: "Zukunft" },
    { text: "Urkundengenerierung (PDF, fortgeschritten).", status: "Zukunft" },
    { text: "PDF-Generierung für Liga-Meldebögen/Ergebnislisten.", status: "Zukunft" },
    { text: "Schützen-Detailansicht mit Diagramm (Grundlage implementiert, Verfeinerung möglich).", status: "In Arbeit" },
    { text: "Erfassung von Mannschaftsführer-Kontaktdaten (Grundlage implementiert).", status: "In Arbeit" },
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
            <div className="grid grid-cols-2 gap-2">
                <Link href="/admin/seasons" passHref><Button className="w-full">Saisons</Button></Link>
                <Link href="/admin/leagues" passHref><Button className="w-full">Ligen</Button></Link>
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
              Rollen und Vereinszuweisungen für Benutzer verwalten (über Firestore `user_permissions`).
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
             Eingegangene Support-Tickets einsehen.
            </CardDescription>
            <Link href="/admin/support-tickets" passHref>
              <Button className="w-full" variant="outline">Tickets anzeigen</Button>
            </Link>
          </CardContent>
        </Card>
        
         <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium">Statistiken</CardTitle>
            <BarChart3 className="h-6 w-6 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <CardDescription className="mb-4">
              Übersicht über App-Nutzung und Daten. (Platzhalter)
            </CardDescription>
            <Button className="w-full" disabled>Statistiken anzeigen (Demnächst)</Button>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-xl hover:shadow-2xl transition-shadow duration-300">
        <CardHeader>
          <CardTitle className="text-xl text-accent flex items-center">
            <GitPullRequestClosed className="mr-3 h-6 w-6" />
            Nächste Schritte / Offene Punkte (Agenda)
          </CardTitle>
          <CardDescription>Eine Übersicht der geplanten Erweiterungen und zu erledigenden Aufgaben.</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground list-none pl-1">
            {agendaPunkte.map((point, index) => (
              <li key={index} className="flex items-start">
                {point.status === "Als Nächstes" && <ShieldQuestion className="h-4 w-4 mr-2 mt-0.5 text-destructive flex-shrink-0" title="Nächste Priorität"/>}
                {point.status === "In Arbeit" && <Settings className="h-4 w-4 mr-2 mt-0.5 text-amber-500 flex-shrink-0" title="In Arbeit"/>}
                {point.status === "Offen" && <FileText className="h-4 w-4 mr-2 mt-0.5 text-primary/70 flex-shrink-0" title="Offen"/>}
                {point.status === "Zukunft" && <Award className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground/70 flex-shrink-0" title="Zukunft"/>}
                <span className={cn(point.status === "Als Nächstes" && "font-semibold text-destructive/90")}>{point.text}</span>
              </li>
            ))}
          </ul>
           <p className="mt-4 text-xs text-muted-foreground">
            Letzte Aktualisierung der Agenda: 20. Mai 2025
          </p>
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
