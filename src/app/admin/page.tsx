// src/app/admin/page.tsx
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { 
  LayoutDashboard, 
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
  Printer,
  ClipboardList,
  KeyRound,
  ListTree,
  Table as TableIcon, // Alias Table from lucide-react
  Info as InfoIcon,    // Alias Info from lucide-react
  CheckCircle,
  AlertCircle,
  ShieldCheck as AdminShieldIcon, // Alias ShieldCheck for admin-specific use
  FileText // Added missing FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AdminDashboardPage() {
  const agendaItems = [
    // Ziel: Version 0.4.0 (Sicherheit & VV/MF Kernfunktionen stabilisieren)
    { 
      text: "Firestore Sicherheitsregeln vollständig implementieren und gründlich testen (basierend auf user_permissions).", 
      status: "Als Nächstes (Version 0.4.0)", icon: AdminShieldIcon, iconColor: "text-destructive" 
    },
    {
      text: "Client-seitige Nutzung der user_permissions für VV/MF finalisieren (Sicherstellen, dass alle VV/MF-Seiten konsistent die zugewiesene(n) clubId(s) aus dem Context nutzen und die UI die Rollen korrekt widerspiegelt).",
      status: "In Arbeit (Version 0.4.0)", icon: UserCog, iconColor: "text-primary"
    },
    {
      text: "RWK-Tabellen: Links von Startseite korrekt verarbeiten & Liga direkt öffnen/hervorheben.",
      status: "Erledigt (v0.3.0)", icon: CheckCircle, iconColor: "text-green-600"
    },
     {
      text: "Startseite: 'Letzte Änderungen'-Einträge zur RWK-Tabelle verlinken (Links erstellt, Zielseite verarbeitet Parameter).",
      status: "Erledigt (v0.3.1)", icon: CheckCircle, iconColor: "text-green-600" 
    },
    {
      text: "Seite für 'Rundenwettkampfordnung (RWK-Ordnung)' mit Inhalt füllen.",
      status: "Erledigt (v0.3.1)", icon: CheckCircle, iconColor: "text-green-600"
    },
    {
      text: "Seite für 'Dokumente/Ausschreibungen' erstellen (Basis).",
      status: "Offen (Version 0.4.0)", icon: FileText, iconColor: "text-blue-600" // Using FileText here
    },
     {
      text: "Hauptnavigation: Icons überprüft/optimiert, 'KM'-Link entfernt, 'Mein Verein' zu 'Vereinsbereich' umbenannt.",
      status: "Erledigt (v0.3.1)", icon: CheckCircle, iconColor: "text-green-600"
    },
    {
      text: "Erfassung/Anzeige von Mannschaftsführer-Kontaktdaten.",
      status: "Erledigt (v0.3.1)", icon: CheckCircle, iconColor: "text-green-600"
    },
    {
      text: "Admin-Panel: Liste aller Mannschaftsführer einer Saison mit Kontaktdaten anzeigen.",
      status: "Offen (Version 0.4.0)", icon: ClipboardList, iconColor: "text-blue-600"
    },
    {
      text: "RWK-Tabellen: Druckfunktion für Ligaergebnisse (ohne sensible Daten).",
      status: "Offen (Version 0.4.0)", icon: Printer, iconColor: "text-blue-600"
    },
    // Ziel: Version 0.5.0 (UX-Verbesserungen, Vorbereitung für erste breitere Tests)
    {
      text: "Ergebniserfassung (VV/MF/Admin): UX-Verbesserungen (z.B. Vorauswahl Durchgang, Anzeige fehlender Schützen, Live-Validierung Ringzahlen).",
      status: "Offen (Version 0.5.0)", icon: ListChecks, iconColor: "text-blue-600"
    },
    {
      text: "Login: Passwort-Reset-Funktion implementieren.",
      status: "Offen (Version 0.5.0)", icon: KeyRound, iconColor: "text-blue-600"
    },
    { 
      text: "Benutzerverwaltung durch Super-Admin (UI-Verbesserungen): Auflisten von Benutzern mit Berechtigungen, einfacheres Bearbeiten.",
      status: "Offen (Version 0.5.0)", icon: UserCog, iconColor: "text-blue-600"
    },
     // Ziel: Version 0.6.0 (Weitere Features, Richtung Beta-Reife)
    { 
      text: "Audit-Trail für Ergebniserfassung (Admin): Protokollierung von Änderungen.", 
      status: "Offen (Version 0.6.0)", icon: Edit3, iconColor: "text-purple-600" 
    },
    { 
      text: "Platzhalter 'Schnitt Vorjahr' in den Team-Dialogen mit echter Funktionalität versehen.", 
      status: "Offen (Version 0.6.0)", icon: BarChart3, iconColor: "text-purple-600" 
    },
    // Zukunft (Nach Beta / v1.0+)
    {
      text: "'Unbehandelte Benutzer'-Widget im Admin-Dashboard.", 
      status: "Zurückgestellt (Weniger relevant durch aktuellen Admin-Workflow der Benutzeranlage).", icon: Users, iconColor: "text-muted-foreground/70" 
    },
    {
      text: "RWK-Tabellen: Detailliertere Disziplin-Filterung (z.B. KKG, LGA), falls gewünscht.",
      status: "Zurückgestellt (Feedback: Aktuelle Filterung ist übersichtlich)", icon: ListChecks, iconColor: "text-muted-foreground/70"
    },
    {
      text: "RWK-Tabellen: Anzeige einer Kreuztabelle/Paarungsübersicht pro Liga.",
      status: "Zukunftsmusik", icon: TableIcon, iconColor: "text-muted-foreground/70"
    },
    {
      text: "Login/VV-Dashboard: Mechanismus/Aufforderung zur Passwortänderung nach Erstanmeldung.",
      status: "Zukunft", icon: KeyRound, iconColor: "text-muted-foreground/70"
    },
    { 
      text: "Automatischer Saisonabschluss / Auf- und Abstieg (komplex).", 
      status: "Zukunft", icon: Trophy, iconColor: "text-muted-foreground/70" 
    },
     { 
      text: "PDF-Generierung (Erweitert): Urkunden, Meldebögen (falls nötig).", 
      status: "Zukunftsmusik (Version 0.5.0+)", icon: Award, iconColor: "text-muted-foreground/70"
    },
    {
      text: "CSV Import-Funktion für Stammdaten.",
      status: "Zurückgestellt (Aktuell nicht benötigt)", icon: FileUp, iconColor: "text-muted-foreground/70"
    },
     { 
      text: "Captcha auf der Login-Seite (Platzhalter).", 
      status: "Zukunft (Nach Beta-Test)", icon: AdminShieldIcon, iconColor: "text-muted-foreground/70" 
    },
    {
      text: "Archivierungsfunktion für alte Saisons (z.B. älter als 5 Jahre).",
      status: "Zukunft", icon: ListTree, iconColor: "text-muted-foreground/70"
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
            <Link href="/admin/seasons" passHref><Button className="w-full">Saisons verwalten</Button></Link>
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
                <Link href="/admin/edit-results" passHref><Button variant="outline" className="w-full">Bearbeiten/Löschen</Button></Link>
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
              Benutzer anlegen und Berechtigungen zuweisen. (UID-basiert)
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
            <CardTitle className="text-lg font-medium">Systemeinstellungen</CardTitle> {/* Umbenannt von Berichte & Exporte */}
            <Settings className="h-6 w-6 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <CardDescription className="mb-4">
              PDF-Exporte und andere Systemfunktionen.
            </CardDescription>
             <div className="space-y-2">
              <Button className="w-full" variant="outline" disabled>PDF: Ergebnislisten (v0.5.0+)</Button>
              <Button className="w-full" variant="outline" disabled>PDF: Urkunden (Zukunft)</Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-xl hover:shadow-2xl transition-shadow duration-300">
        <CardHeader>
          <CardTitle className="text-xl text-accent flex items-center">
            <GitPullRequestClosed className="mr-3 h-6 w-6" />
            Roadmap / Nächste Schritte (Stand: 22. Mai 2025)
          </CardTitle>
          <CardDescription>Übersicht geplanter Erweiterungen und wichtiger Aufgaben, strukturiert nach potenziellen Versionen.</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground list-none pl-1">
            {agendaItems.map((item, index) => (
              <li key={index} className={cn(
                "flex items-start py-1.5",
                item.status.startsWith("Erledigt") && "line-through text-muted-foreground/70 opacity-80",
                item.status.startsWith("Teilweise Erledigt") && "text-muted-foreground/90",
                item.status.startsWith("Als Nächstes") && "font-semibold text-primary/90"
              )}>
                <item.icon 
                  className={cn(
                    "h-4 w-4 mr-3 mt-0.5 flex-shrink-0", 
                    item.iconColor || "text-primary", 
                    item.status.startsWith("Erledigt") && "!text-green-500"
                  )} 
                  title={item.status} 
                />
                <span>{item.text} - <span className={cn("font-semibold", item.iconColor || "text-primary", item.status.startsWith("Erledigt") && "!text-green-500")}>({item.status})</span></span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

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
