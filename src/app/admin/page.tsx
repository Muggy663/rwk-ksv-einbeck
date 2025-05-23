// src/app/admin/page.tsx
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { 
  LayoutDashboard, Users, Trophy, ListChecks, Edit3, Settings, UserCog, 
  MessagesSquare, FileUp, Award, BarChart3, ShieldQuestion, GitPullRequestClosed, 
  BookOpenCheck, Printer, ClipboardList, KeyRound, ListTree, 
  Table as TableIcon, Info as InfoIcon, CheckCircle, AlertCircle, ShieldCheck as AdminShieldIcon, FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AgendaItem {
  text: string;
  status: string; // z.B. "Erledigt (vX.Y.Z)", "In Arbeit (vX.Y.Z)", "Offen (vX.Y.Z)", "Zukunft"
  icon: React.ElementType;
  iconColor?: string;
  isMajor?: boolean; // Für größere geplante Versionssprünge
  versionTarget?: string; // Zielversion
}

export default function AdminDashboardPage() {
  const agendaItems: AgendaItem[] = [
    // Version 0.3.x - Stabilisierung & Kern-UX
    { 
      text: "Basis-Admin-Funktionen (Stammdaten CRUD, Ergebniserfassung/-bearbeitung) implementiert.", 
      status: "Erledigt (v0.3.1)", icon: CheckCircle, iconColor: "text-green-600" 
    },
    { 
      text: "Basis-VV/MF-Funktionen (Dashboard, Mannschafts-/Schützenansicht, Ergebniserfassung für eigenen Verein über user_permissions) implementiert.", 
      status: "Erledigt (v0.3.1)", icon: CheckCircle, iconColor: "text-green-600"
    },
    { 
      text: "RWK-Tabellen: Funktionalität mit Filtern, Detailansichten, URL-Parameter-Verarbeitung und Standard-Sortierung.", 
      status: "Erledigt (v0.3.1)", icon: CheckCircle, iconColor: "text-green-600" 
    },
    {
      text: "Handbuch, Impressum, RWK-Ordnung und Support-Formular (mit DB-Speicherung) erstellt.",
      status: "Erledigt (v0.3.1)", icon: CheckCircle, iconColor: "text-green-600"
    },
     {
      text: "Admin-Benutzerverwaltung: Zuweisung von Rolle und einem Verein zu Benutzern (UID-basiert, Speicherung in `user_permissions`) implementiert.",
      status: "Erledigt (v0.3.1)", icon: CheckCircle, iconColor: "text-green-600"
    },
    {
      text: "Regeln für Mannschaftszuordnung (max. 3 Schützen/Team; 1x pro Schütze/Disziplinkategorie/Jahr) in Admin- und VV-Bereichen implementiert.",
      status: "Erledigt (v0.3.1)", icon: CheckCircle, iconColor: "text-green-600"
    },
    {
      text: "Diverse UI-Verbesserungen und Fehlerbehebungen (Layouts, Importfehler, Vercel Build-Fehler).",
      status: "Erledigt (v0.3.1)", icon: CheckCircle, iconColor: "text-green-600"
    },
    {
      text: "Anzeige der Mannschaftsführer-Kontaktdaten und Hinweis zur Mannschaftsstärke in Team-Dialogen.",
      status: "Erledigt (v0.3.1)", icon: CheckCircle, iconColor: "text-green-600"
    },

    // Ziel: Version 0.4.0 (Sicherheit & VV/MF Kernfunktionen finalisieren)
    { 
      text: "Firestore Sicherheitsregeln vollständig implementieren und gründlich testen (basierend auf `user_permissions` und Rollen VV/MF).", 
      status: "Als Nächstes (Version 0.4.0)", icon: AdminShieldIcon, iconColor: "text-destructive", versionTarget: "0.4.0", isMajor: true 
    },
    {
      text: "Client-seitige Nutzung der `user_permissions` für VV/MF finalisieren und `VV_CLUB_ASSIGNMENTS`-Map entfernen.",
      status: "Erledigt (v0.3.1)", icon: CheckCircle, iconColor: "text-green-600"
    },
    {
      text: "Seite für 'Dokumente/Ausschreibungen' erstellen (Basis).",
      status: "Offen (Version 0.4.0)", icon: FileText, iconColor: "text-blue-600", versionTarget: "0.4.0"
    },

    // Ziel: Version 0.5.0 (UX-Verbesserungen, Vorbereitung für erste breitere Tests)
    {
      text: "Ergebniserfassung (VV/MF/Admin): UX-Verbesserungen (z.B. Vorauswahl Durchgang, Anzeige fehlender Schützen, Live-Validierung Ringzahlen).",
      status: "Offen (Version 0.5.0)", icon: ListChecks, iconColor: "text-blue-600", versionTarget: "0.5.0", isMajor: true
    },
    {
      text: "Admin-Panel: Liste aller Mannschaftsführer einer Saison (mit Kontaktdaten).",
      status: "Offen (Version 0.5.0)", icon: ClipboardList, iconColor: "text-blue-600", versionTarget: "0.5.0"
    },
    {
      text: "Login: Passwort-Reset-Funktion implementieren.",
      status: "Offen (Version 0.5.0)", icon: KeyRound, iconColor: "text-blue-600", versionTarget: "0.5.0"
    },
    {
      text: "Anzeige 'Mannschaften (Info)' verfeinern: Name des einen Teams anzeigen, wenn nur ein Team zugeordnet (ohne Kontext).",
      status: "Offen (Version 0.5.0)", icon: Users, iconColor: "text-blue-600", versionTarget: "0.5.0"
    },
    {
      text: "RWK-Tabellen: Druckfunktion für Ligaergebnisse (ohne sensible Daten).",
      status: "Offen (Version 0.5.0)", icon: Printer, iconColor: "text-blue-600", versionTarget: "0.5.0"
    },
    {
      text: "Hauptnavigation: Icons überprüfen/optimieren, 'KM'-Link entfernt/auskommentiert.",
      status: "Erledigt (v0.3.1)", icon: CheckCircle, iconColor: "text-green-600"
    },
    {
      text: "Admin-Benutzerverwaltung: UI-Verbesserungen (Auflisten, einfacheres Bearbeiten).",
      status: "Offen (Version 0.5.0)", icon: UserCog, iconColor: "text-blue-600", versionTarget: "0.5.0"
    },


    // Ziel: Version 0.6.0 (Weitere Features, Richtung Beta-Reife)
    { 
      text: "Audit-Trail für Ergebniserfassung (Admin): Protokollierung von Änderungen.", 
      status: "Offen (Version 0.6.0)", icon: Edit3, iconColor: "text-purple-600", versionTarget: "0.6.0", isMajor: true
    },
    { 
      text: "Platzhalter 'Schnitt Vorjahr' in den Team-Dialogen mit echter Funktionalität versehen.", 
      status: "Offen (Version 0.6.0)", icon: BarChart3, iconColor: "text-purple-600", versionTarget: "0.6.0"
    },
    { 
      text: "PDF-Generierung (Erweitert): Gesamtlisten, Urkunden (falls nötig).", 
      status: "Offen (Version 0.6.0)", icon: Award, iconColor: "text-purple-600", versionTarget: "0.6.0"
    },

    // Zukunft (Nach Beta / v1.0+)
    {
      text: "'Unbehandelte Benutzer'-Widget im Admin-Dashboard (weniger relevant durch aktuellen Admin-Workflow).", 
      status: "Zurückgestellt", icon: Users, iconColor: "text-muted-foreground/70" 
    },
    {
      text: "RWK-Tabellen: Detailliertere Disziplin-Filterung (z.B. KKG, LGA), falls doch gewünscht.",
      status: "Zurückgestellt", icon: ListChecks, iconColor: "text-muted-foreground/70"
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
      text: "CSV Import-Funktion für Stammdaten (aktuell nicht benötigt).",
      status: "Zurückgestellt", icon: FileUp, iconColor: "text-muted-foreground/70"
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

  const getStatusColor = (status: string) => {
    if (status.startsWith("Erledigt")) return "text-green-600";
    if (status.startsWith("Als Nächstes")) return "text-destructive";
    if (status.startsWith("In Arbeit")) return "text-blue-600";
    if (status.startsWith("Offen")) return "text-orange-600";
    return "text-muted-foreground";
  };


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
              Benutzer anlegen (manuell in Firebase Auth), Rollen und Vereinszuweisungen in der App verwalten.
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
            <CardTitle className="text-lg font-medium">System & Berichte</CardTitle> 
            <Settings className="h-6 w-6 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <CardDescription className="mb-4">
              PDF-Exporte und andere Systemfunktionen.
            </CardDescription>
             <div className="space-y-2">
              <Button className="w-full" variant="outline" disabled>PDF: Ergebnislisten (v0.6.0+)</Button>
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
          <ul className="space-y-1 text-sm text-muted-foreground list-none pl-1">
            {agendaItems.map((item, index) => (
              <React.Fragment key={index}>
                {item.isMajor && item.versionTarget && (
                  <li className="pt-3 pb-1 first:pt-0">
                    <h3 className={cn("text-md font-semibold", getStatusColor(item.status))}>
                      Ziel: Version {item.versionTarget}
                    </h3>
                    <hr className="my-1 border-border/50"/>
                  </li>
                )}
                <li className={cn("flex items-start py-1")}>
                  <item.icon 
                    className={cn(
                      "h-4 w-4 mr-3 mt-0.5 flex-shrink-0", 
                      item.iconColor || getStatusColor(item.status)
                    )} 
                    title={item.status} 
                  />
                  <span>{item.text} - <span className={cn("font-semibold", getStatusColor(item.status))}>({item.status})</span></span>
                </li>
              </React.Fragment>
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
