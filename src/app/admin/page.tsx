// src/app/admin/page.tsx
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { 
  LayoutDashboard, Users, Trophy, ListChecks, Edit3, Settings, 
  UserCog, MessagesSquare, FileUp, Award, BarChart3, 
  ShieldQuestion, GitPullRequestClosed, BookOpenCheck, CheckCircle, Loader2, AlertCircle, InfoIcon 
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AdminDashboardPage() {
  const agendaItems = [
    { 
      text: "RWK-Tabellen: Verarbeitung von URL-Parametern & direkte Liga-Anzeige implementiert. Standardmäßig geöffnete Ligen, klickbare Schützen in Teamdetails.", 
      status: "Erledigt", icon: CheckCircle, iconColor: "text-green-500" 
    },
    { 
      text: "Handbuch: Aktualisiert (Rollen, VV-Funktionen, RWK-Tabellen-UX, technische Begriffe reduziert). Bedingte Anzeige für Admin-Abschnitt.", 
      status: "Erledigt", icon: CheckCircle, iconColor: "text-green-500" 
    },
    {
      text: "Benutzerverwaltung: Admin kann Rolle ('vereinsvertreter', 'mannschaftsfuehrer') und Vereine (bis zu 3) für Benutzer in 'user_permissions' (Firestore) festlegen. Basis-UI vorhanden.",
      status: "Erledigt (Basis)", icon: CheckCircle, iconColor: "text-green-500"
    },
    {
      text: "Vereinsvertreter-Bereich: Seiten (Dashboard, Mannschaften, Schützen, Ergebnisse) nutzen 'user_permissions' für Rechte und Vereinskontext. Auswahl bei mehreren Vereinen implementiert.",
      status: "Erledigt (Basis)", icon: CheckCircle, iconColor: "text-green-500"
    },
    {
      text: "Rollenbasierte UI: Vereinsvertreter sehen Bearbeitungsfunktionen, Mannschaftsführer nicht (auf Mannschafts-/Schützen-VV-Seiten).",
      status: "Erledigt", icon: CheckCircle, iconColor: "text-green-500"
    },
    {
      text: "Support-Ticket-System: Formular speichert Tickets in Firestore; Admin-Ansicht zeigt Tickets an.",
      status: "Erledigt", icon: CheckCircle, iconColor: "text-green-500"
    },
    { 
      text: "Nächster Fokus: Version 0.4.0", 
      status: "Info", icon: InfoIcon, iconColor: "text-blue-500", isHeader: true 
    },
    { 
      text: "Firestore Sicherheitsregeln abschließend verfeinern und gründlich testen (basierend auf 'user_permissions' und Rollen).", 
      status: "Als Nächstes", icon: ShieldQuestion, iconColor: "text-destructive" 
    },
    {
      text: "RWK-Ordnung: Eigene Seite erstellen und in Navigation einbinden.",
      status: "Offen", icon: BookOpenCheck, iconColor: "text-primary/80"
    },
    { 
      text: "'Unbehandelte Benutzer'-Widget im Admin-Dashboard (Anzeige von Nutzern ohne 'user_permissions'-Eintrag).", 
      status: "Offen", icon: Users, iconColor: "text-primary/80" 
    },
    { 
      text: "Nächster Fokus: Version 0.5.0 (oder später)", 
      status: "Info", icon: InfoIcon, iconColor: "text-blue-500", isHeader: true 
    },
    { 
      text: "Captcha auf der Login-Seite integrieren.", 
      status: "Zukunft", icon: ShieldCheck, iconColor: "text-muted-foreground/70" 
    },
    { 
      text: "Anzeige 'Mannschaften (Info)' verfeinern: Name des einen Teams anzeigen, wenn Schütze nur einem Team zugeordnet (ohne Seitenkontext).", 
      status: "Zukunft", icon: Users, iconColor: "text-muted-foreground/70" 
    },
    { 
      text: "Platzhalter 'Schnitt Vorjahr' in den Team-Dialogen mit echter Funktionalität versehen.", 
      status: "Zukunft", icon: BarChart3, iconColor: "text-muted-foreground/70" 
    },
    { 
      text: "Ergebniserfassung (Details): Audit-Trail für Ergebnisänderungen durch Admin.", 
      status: "Zukunft", icon: ListChecks, iconColor: "text-muted-foreground/70" 
    },
    { 
      text: "PDF-Generierung (Gesamtlisten, Durchgangslisten, Urkunden).", 
      status: "Zukunft", icon: FileUp, iconColor: "text-muted-foreground/70" 
    },
     { 
      text: "PDF-Generierung für Liga-Meldebögen.", 
      status: "Zukunft", icon: FileUp, iconColor: "text-muted-foreground/70" 
    },
    { 
      text: "Automatischer Saisonabschluss / Auf- und Abstieg.", 
      status: "Zukunft", icon: Trophy, iconColor: "text-muted-foreground/70" 
    },
    { 
      text: "CSV Import für Stammdaten (Vereine, Schützen).", 
      status: "Zukunft", icon: FileUp, iconColor: "text-muted-foreground/70" 
    },
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
              Benutzer anlegen, Rollen und Vereinszuweisungen verwalten. (UID-basiert)
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
             Eingegangene Support-Tickets einsehen und Status ändern.
            </CardDescription>
            <Link href="/admin/support-tickets" passHref>
              <Button className="w-full" variant="outline">Tickets anzeigen</Button>
            </Link>
          </CardContent>
        </Card>
        
         <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium">Einstellungen</CardTitle> {/* Geändert von Datenwerkzeuge */}
            <Settings className="h-6 w-6 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <CardDescription className="mb-4">
              Allgemeine App-Einstellungen (zukünftig).
            </CardDescription>
             <div className="space-y-2">
              <Button className="w-full" disabled>CSV Import (Demnächst)</Button>
              <Button className="w-full" disabled>PDF Generierung (Demnächst)</Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-xl hover:shadow-2xl transition-shadow duration-300 md:col-span-2 lg:col-span-3">
        <CardHeader>
          <CardTitle className="text-xl text-accent flex items-center">
            <GitPullRequestClosed className="mr-3 h-6 w-6" />
            Roadmap / Offene Punkte
          </CardTitle>
          <CardDescription>Eine Übersicht der geplanten Erweiterungen und zu erledigenden Aufgaben, strukturiert nach Versionen.</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground list-none pl-1">
            {agendaItems.map((item, index) => (
              <li key={index} className={cn("flex items-start py-1.5", item.isHeader && "mt-3 pt-3 border-t")}>
                {item.isHeader ? (
                  <span className={cn("font-semibold text-lg block w-full", item.iconColor)}>{item.text}</span>
                ) : (
                  <>
                    <item.icon className={cn("h-4 w-4 mr-3 mt-0.5 flex-shrink-0", item.iconColor, item.status === "In Arbeit" && "animate-spin")} title={item.status} />
                    <span className={cn(item.status === "Als Nächstes" && "font-semibold text-foreground")}>{item.text}</span>
                  </>
                )}
              </li>
            ))}
          </ul>
           <p className="mt-4 text-xs text-muted-foreground">
            Letzte Aktualisierung der Agenda: 22. Mai 2025
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
