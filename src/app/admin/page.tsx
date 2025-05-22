// src/app/admin/page.tsx
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { 
  Users, 
  Trophy, 
  ListChecks, 
  Edit3, 
  Settings, 
  UserCog, 
  MessagesSquare, 
  FileUp, 
  Award, 
  BarChart3, 
  ShieldQuestion, 
  GitPullRequestClosed, 
  BookOpenCheck, 
  CheckCircle, 
  AlertCircle, 
  InfoIcon,
  Table as TableIcon,
  ShieldCheck,
  FileText // Added FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AdminDashboardPage() {
  const agendaItems = [
    { 
      text: "Firestore Sicherheitsregeln abschließend verfeinern und gründlich testen (basierend auf user_permissions).", 
      status: "Als Nächstes", icon: ShieldQuestion, iconColor: "text-destructive" 
    },
    {
      text: "Client-seitige UI-Anpassung für Rollen (Vereinsvertreter/Mannschaftsführer) vollständig testen.",
      status: "In Prüfung", icon: CheckCircle, iconColor: "text-green-600"
    },
    {
      text: "Seite für 'Rundenwettkampfordnung (RWK-Ordnung)' erstellt und verlinkt.",
      status: "Erledigt", icon: CheckCircle, iconColor: "text-green-600"
    },
    {
      text: "Handbuch aktualisiert und technische Begriffe für Endanwender reduziert.",
      status: "Erledigt", icon: CheckCircle, iconColor: "text-green-600"
    },
    {
      text: "RWK-Tabellen: URL-Parameter verarbeiten & Liga direkt öffnen (Teil 1: Links auf Startseite erstellt).",
      status: "Erledigt", icon: CheckCircle, iconColor: "text-green-600"
    },
     {
      text: "RWK-Tabellen: Verarbeitung von URL-Parametern zur direkten Liga-Anzeige (Teil 2).",
      status: "Erledigt", icon: CheckCircle, iconColor: "text-green-600"
    },
    {
      text: "RWK-Tabellen UX verbessern (standardmäßig geöffnete Ligen, klickbare Schützen in Teamdetails).",
      status: "Erledigt", icon: CheckCircle, iconColor: "text-green-600"
    },
    {
      text: "Versionsmanagement und Changelog-Pflege etabliert.",
      status: "Erledigt", icon: CheckCircle, iconColor: "text-green-600"
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
      text: "Seite für 'Dokumente/Ausschreibungen' erstellen.",
      status: "Offen (Version 0.4.0+)", icon: FileText, iconColor: "text-primary/80"
    },
    {
      text: "RWK-Tabellen: Anzeige einer Kreuztabelle/Paarungsübersicht pro Liga.",
      status: "Zukunftsmusik (Version 0.5.0+)", icon: TableIcon, iconColor: "text-muted-foreground/70"
    },
     {
      text: "Erfassung/Anzeige von Mannschaftsführer-Kontaktdaten (Grundlage implementiert).",
      status: "Erledigt", icon: CheckCircle, iconColor: "text-green-600"
    },
    {
      text: "PDF-Generierung für Liga-Meldebögen/Ergebnislisten (Platzhalter).",
      status: "Zukunftsmusik (Version 0.5.0+)", icon: FileText, iconColor: "text-muted-foreground/70"
    },
    { 
      text: "Captcha auf der Login-Seite (Platzhalter).", 
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
      text: "Urkundengenerierung (PDF - Platzhalter).", 
      status: "Zukunft", icon: Award, iconColor: "text-muted-foreground/70" 
    },
    {
      text: "CSV Import-Funktion für Stammdaten (Platzhalter).",
      status: "Zukunft", icon: FileUp, iconColor: "text-muted-foreground/70"
    },
    {
      text: "Schützen-Detailansicht mit Diagramm (Grundlage implementiert, Verfeinerung möglich).",
      status: "Erledigt", icon: CheckCircle, iconColor: "text-green-600"
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
              Saisons und zugehörige Ligen verwalten.
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
              Rollen und Vereinszuweisungen für Benutzer festlegen.
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
            <CardTitle className="text-lg font-medium">Datenwerkzeuge</CardTitle>
            <Settings className="h-6 w-6 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <CardDescription className="mb-4">
              Allgemeine App-Einstellungen und Daten-Tools.
            </CardDescription>
             <div className="space-y-2">
              <Button className="w-full" variant="outline" disabled>CSV Import (Demnächst)</Button>
              <Button className="w-full" variant="outline" disabled>PDF Liga-Meldebögen (Demnächst)</Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-xl hover:shadow-2xl transition-shadow duration-300">
        <CardHeader>
          <CardTitle className="text-xl text-accent flex items-center">
            <GitPullRequestClosed className="mr-3 h-6 w-6" />
            Roadmap / Offene Punkte (Stand: 22. Mai 2025)
          </CardTitle>
          <CardDescription>Eine Übersicht der geplanten Erweiterungen und zu erledigenden Aufgaben, strukturiert nach potenziellen Versionen.</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground list-none pl-1">
            {agendaItems.map((item, index) => (
              <li key={index} className={cn("flex items-start py-1.5")}>
                <item.icon 
                  className={cn(
                    "h-4 w-4 mr-3 mt-0.5 flex-shrink-0", 
                    item.iconColor, 
                  )} 
                  title={item.status} 
                />
                <span className={cn(
                    item.status === "Als Nächstes" && "font-semibold text-foreground",
                    item.status === "Erledigt" && "line-through text-muted-foreground/80"
                )}>{item.text}</span>
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
