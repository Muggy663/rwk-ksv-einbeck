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
  // Roadmap / Agenda items
  const agendaItems = [
    { 
      text: "Firestore Sicherheitsregeln abschließend verfeinern und gründlich testen (basierend auf user_permissions).", 
      status: "Als Nächstes", icon: ShieldQuestion, iconColor: "text-destructive" 
    },
    { 
      text: "Client-seitige Nutzung der user_permissions für Vereinsvertreter vollständig umsetzen und testen (alle VV-Seiten).", 
      status: "Erledigt/In Prüfung", icon: CheckCircle, iconColor: "text-green-600" 
    },
    {
      text: "RWK-Tabellen: Verarbeitung von URL-Parametern (Verlinkung von Startseite) implementiert.",
      status: "Erledigt", icon: CheckCircle, iconColor: "text-green-600"
    },
     {
      text: "Handbuch und Changelog an aktuelle Funktionen und UI angepasst (Vereinfachung, Rollen VV/MF).",
      status: "Erledigt", icon: CheckCircle, iconColor: "text-green-600"
    },
    {
      text: "Icons in Navigation und Dashboard überprüft/angepasst.",
      status: "In Arbeit", icon: InfoIcon, iconColor: "text-blue-500"
    },
    { 
      text: "Benutzerverwaltung durch Super-Admin (UI-Verbesserungen): Auflistung von Benutzern mit Berechtigungen, einfacheres Bearbeiten.", 
      status: "Offen (Version 0.4.0+)", icon: UserCog, iconColor: "text-primary/80" 
    },
    { 
      text: "'Unbehandelte Benutzer'-Widget im Admin-Dashboard (Anzeige von Nutzern ohne user_permissions-Eintrag).", 
      status: "Offen (Version 0.4.0+)", icon: Users, iconColor: "text-primary/80" 
    },
    {
      text: "RWK-Tabellen: Detailliertere Disziplin-Filterung (z.B. KKG, LGA).",
      status: "Offen (Version 0.4.0+)", icon: ListChecks, iconColor: "text-primary/80"
    },
    {
      text: "RWK-Tabellen: Anzeige einer Kreuztabelle/Paarungsübersicht pro Liga.",
      status: "Offen (Version 0.4.0+)", icon: Table, iconColor: "text-primary/80"
    },
    {
      text: "Seite für 'Dokumente/Ausschreibungen' erstellen und verlinken.",
      status: "Offen (Version 0.4.0+)", icon: FileUp, iconColor: "text-primary/80"
    },
    { 
      text: "Captcha auf der Login-Seite implementieren.", 
      status: "Zukunft (Version 0.5.0+)", icon: ShieldCheck, iconColor: "text-muted-foreground/70" 
    },
    { 
      text: "Platzhalter 'Schnitt Vorjahr' in den Team-Dialogen mit echter Funktionalität versehen.", 
      status: "Zukunft (Version 0.5.0+)", icon: BarChart3, iconColor: "text-muted-foreground/70" 
    },
    { 
      text: "Ergebniserfassung (Details): Logging/Audit-Trail, wer wann welches Ergebnis geändert hat.", 
      status: "Zukunft (Version 0.5.0+)", icon: Edit3, iconColor: "text-muted-foreground/70" 
    },
    { 
      text: "Automatischer Saisonabschluss / Auf- und Abstieg (komplex).", 
      status: "Zukunft", icon: Trophy, iconColor: "text-muted-foreground/70" 
    },
    { 
      text: "PDF-Generierung für Liga-Meldebögen/Ergebnislisten.", 
      status: "Zukunft", icon: FileText, iconColor: "text-muted-foreground/70" 
    },
     { 
      text: "PDF-Generierung für Urkunden.", 
      status: "Zukunft", icon: Award, iconColor: "text-muted-foreground/70" 
    },
    {
      text: "CSV Import-Funktion für Stammdaten.",
      status: "Zukunft", icon: FileUp, iconColor: "text-muted-foreground/70"
    }
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
              Saisons und Ligen anlegen und verwalten.
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
              Benutzer anlegen (manuell in Firebase Auth), Rollen und Vereinszuweisungen verwalten.
            </CardDescription>
            <Link href="/admin/user-management" passHref>
              <Button className="w-full" variant="outline">Benutzerrechte verwalten</Button>
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
            <CardTitle className="text-lg font-medium">Datenwerkzeuge</CardTitle>
            <Settings className="h-6 w-6 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <CardDescription className="mb-4">
              Allgemeine App-Einstellungen und Daten-Tools.
            </CardDescription>
             <div className="space-y-2">
              <Button className="w-full" disabled>CSV Import (Zukunft)</Button>
              <Button className="w-full" disabled>PDF Generierung (Zukunft)</Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-xl hover:shadow-2xl transition-shadow duration-300 md:col-span-2 lg:col-span-3">
        <CardHeader>
          <CardTitle className="text-xl text-accent flex items-center">
            <GitPullRequestClosed className="mr-3 h-6 w-6" />
            Roadmap / Offene Punkte (Nächste Versionen)
          </CardTitle>
          <CardDescription>Eine Übersicht der geplanten Erweiterungen und zu erledigenden Aufgaben.</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground list-none pl-1">
            {agendaItems.map((item, index) => (
              <li key={index} className={cn("flex items-start py-1.5")}>
                <item.icon className={cn("h-4 w-4 mr-3 mt-0.5 flex-shrink-0", item.iconColor, item.status === "In Arbeit" && "animate-spin")} title={item.status} />
                <span className={cn(item.status === "Als Nächstes" && "font-semibold text-foreground")}>{item.text}</span>
              </li>
            ))}
          </ul>
           <p className="mt-4 text-xs text-muted-foreground">
            Stand der Agenda: 22. Mai 2025
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

