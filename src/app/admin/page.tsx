// src/app/admin/page.tsx
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { 
  LayoutDashboard, Users, Trophy, ListChecks, Edit3, Settings, 
  UserCog, MessagesSquare, FileUp, Award, BarChart3, 
  ShieldQuestion, GitPullRequestClosed, BookOpenCheck, CheckCircle, Loader2, AlertCircle, InfoIcon 
} from 'lucide-react'; // Added all potentially used icons
import { cn } from '@/lib/utils'; // Added cn import

export default function AdminDashboardPage() {
  const agendaItems = [
    { 
      text: "Firestore Sicherheitsregeln abschließend verfeinern und gründlich testen (basierend auf user_permissions).", 
      status: "Als Nächstes", icon: ShieldQuestion, iconColor: "text-destructive" 
    },
    { 
      text: "Client-seitige Nutzung der user_permissions für Vereinsvertreter vollständig umsetzen und testen (aktuell nur Dashboard angepasst).", 
      status: "Offen", icon: UserCog, iconColor: "text-primary/80" 
    },
    {
      text: "Handbuch: Hinweis zur Erfassung von Einzelschützen (als 'Mannschaft Einzel') präzisieren.",
      status: "In Arbeit", icon: BookOpenCheck, iconColor: "text-orange-500"
    },
    { 
      text: "'Unbehandelte Benutzer'-Widget im Admin-Dashboard (Anzeige von Nutzern ohne user_permissions-Eintrag).", 
      status: "Offen", icon: Users, iconColor: "text-primary/80" 
    },
    { 
      text: "RWK-Tabellen: URL-Parameter verarbeiten & Liga direkt öffnen (Teil 2: Tabellenseite anpassen).", 
      status: "Offen", icon: ListChecks, iconColor: "text-primary/80" 
    },
    { 
      text: "PDF-Generierung für Liga-Meldebögen/Ergebnislisten (Platzhalter).", 
      status: "Zukunft", icon: FileUp, iconColor: "text-muted-foreground/70" 
    },
    { 
      text: "Captcha auf der Login-Seite (Platzhalter).", 
      status: "Zukunft", icon: ShieldCheck, iconColor: "text-muted-foreground/70" 
    },
    { 
      text: "Platzhalter 'Schnitt Vorjahr' in den Team-Dialogen mit echter Funktionalität versehen.", 
      status: "Zukunft", icon: BarChart3, iconColor: "text-muted-foreground/70" 
    },
    { 
      text: "Ergebniserfassung (Details): Logging, wer wann welches Ergebnis geändert hat (Audit-Trail).", 
      status: "Zukunft", icon: Edit3, iconColor: "text-muted-foreground/70" 
    },
    { 
      text: "Automatischer Saisonabschluss / Auf- und Abstieg.", 
      status: "Zukunft", icon: Trophy, iconColor: "text-muted-foreground/70" 
    },
     { 
      text: "Icons hervorheben/ändern (Navigation, Dashboard) - Feedback vom Präsidenten.", 
      status: "Offen", icon: InfoIcon, iconColor: "text-blue-500" 
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
              Benutzer anlegen, Rollen und Vereinszuweisungen verwalten. (UID-basiert in Firestore)
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
            <CardTitle className="text-lg font-medium">Einstellungen & Werkzeuge</CardTitle>
            <Settings className="h-6 w-6 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <CardDescription className="mb-4">
              Allgemeine App-Einstellungen und Daten-Tools.
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
            Roadmap / Offene Punkte (Version 0.3.0)
          </CardTitle>
          <CardDescription>Eine Übersicht der geplanten Erweiterungen und zu erledigenden Aufgaben.</CardDescription>
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
