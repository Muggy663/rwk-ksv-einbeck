// src/app/admin/page.tsx
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Users, Trophy, ListChecks, Settings, UserCog, FileText, MessagesSquare, FileUp, Award, BarChart3, ShieldQuestion, GitPullRequestClosed, BookOpenCheckIcon } from 'lucide-react';
import { cn } from '@/lib/utils'; // <<< HIER WIRD DER IMPORT HINZUGEFÜGT

export default function AdminDashboardPage() {
  const agendaPunkte = [
    { text: "Firestore Sicherheitsregeln vollständig implementieren und testen (basierend auf user_permissions).", status: "Als Nächstes", icon: ShieldQuestion },
    { text: "Client-seitige Nutzung der user_permissions für Vereinsvertreter abschließen (Vereinsauswahl bei >1 Verein, Datenfilterung).", status: "In Arbeit", icon: Settings },
    { text: "Benutzerverwaltung durch Super-Admin (UI-Verbesserungen): Auflisten/Bearbeiten von user_permissions.", status: "Offen", icon: UserCog },
    { text: "'Unbehandelte Benutzer'-Widget im Admin-Dashboard (Anzeige von Nutzern ohne user_permissions-Eintrag via Firestore-Workaround).", status: "Offen", icon: UserCog },
    { text: "Captcha auf der Login-Seite integrieren.", status: "Zukunft", icon: ShieldCheck },
    { text: "Anzeige 'Mannschaften (Info)' verfeinern: Name des einen Teams anzeigen.", status: "Offen", icon: Users },
    { text: "Platzhalter 'Schnitt Vorjahr' in Team-Dialogen mit echter Funktionalität versehen.", status: "Zukunft", icon: BarChart3 },
    { text: "Ergebniserfassung (Details): Audit-Trail für Ergebnisänderungen durch Admin.", status: "Zukunft", icon: ListChecks },
    { text: "Automatischer Saisonabschluss / Auf- und Abstieg.", status: "Zukunft", icon: Trophy },
    { text: "CSV-Import für Stammdaten.", status: "Zukunft", icon: FileUp },
    { text: "Urkundengenerierung (PDF).", status: "Zukunft", icon: Award },
    { text: "PDF-Generierung für Liga-Meldebögen/Ergebnislisten.", status: "Zukunft", icon: FileText },
    { text: "Handbuch-Seite (/handbuch) mit Markdown-Rendering-Bibliothek verbessern für einfachere Wartung.", status: "Offen", icon: BookOpenCheckIcon },
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

        <Card className="shadow-lg hover:shadow-xl transition-shadow md:col-span-2 lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium">Datenwerkzeuge</CardTitle>
            <Settings className="h-6 w-6 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <CardDescription className="mb-4">
              Import- und Exportfunktionen.
            </CardDescription>
            <div className="space-y-2">
                <Button className="w-full" variant="outline" disabled><FileUp className="mr-2 h-4 w-4" /> CSV Import (Demnächst)</Button>
            </div>
          </CardContent>
        </Card>
         <Card className="shadow-lg hover:shadow-xl transition-shadow md:col-span-2 lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium">Saisonabschluss</CardTitle>
            <Award className="h-6 w-6 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <CardDescription className="mb-4">
              Werkzeuge für das Saisonende.
            </CardDescription>
            <div className="space-y-2">
                 <Button className="w-full" variant="outline" disabled><FileText className="mr-2 h-4 w-4" /> PDF Liga-Meldebögen (Demnächst)</Button>
                 <Button className="w-full" variant="outline" disabled><Award className="mr-2 h-4 w-4" /> Urkunden generieren (Demnächst)</Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-xl hover:shadow-2xl transition-shadow duration-300 lg:col-span-3">
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
              <li key={index} className="flex items-start py-1">
                <point.icon className={cn("h-4 w-4 mr-3 mt-0.5 flex-shrink-0", 
                  point.status === "Als Nächstes" && "text-destructive",
                  point.status === "In Arbeit" && "text-amber-500",
                  point.status === "Offen" && "text-primary/80",
                  point.status === "Zukunft" && "text-muted-foreground/70"
                )} title={point.status} />
                <span className={cn(point.status === "Als Nächstes" && "font-semibold text-foreground")}>{point.text}</span>
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
