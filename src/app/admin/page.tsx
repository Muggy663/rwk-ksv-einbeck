// src/app/admin/page.tsx
"use client";
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { 
  LayoutDashboard, Users, Trophy, ListChecks, Edit3, Settings, UserCog, 
  MessagesSquare, FileUp, Award, BarChart3, ShieldQuestion, GitPullRequestClosed, 
  BookOpenCheck, Printer, ClipboardList, KeyRound, ListTree, 
  Table as TableIcon, Info as InfoIcon, CheckCircle, AlertCircle, ShieldCheck as AdminShieldIcon, FileText,
  CalendarDays, Smartphone
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

    // Version 0.4.0 (Sicherheit & VV/MF Kernfunktionen finalisieren)
    { 
      text: "Firestore Sicherheitsregeln vollständig implementieren und gründlich testen (basierend auf `user_permissions` und Rollen VV/MF).", 
      status: "Erledigt (v0.4.0)", icon: CheckCircle, iconColor: "text-green-600"
    },
    {
      text: "Client-seitige Nutzung der `user_permissions` für VV/MF finalisieren und `VV_CLUB_ASSIGNMENTS`-Map entfernen.",
      status: "Erledigt (v0.3.1)", icon: CheckCircle, iconColor: "text-green-600"
    },
    {
      text: "Tooltips für bessere Benutzerführung in allen Bereichen hinzufügen.",
      status: "Erledigt (v0.4.0)", icon: CheckCircle, iconColor: "text-green-600"
    },
    {
      text: "Ergebniserfassung für Vereinsvertreter verbessern (Erfassung für alle Mannschaften in einer Liga).",
      status: "Erledigt (v0.4.0)", icon: CheckCircle, iconColor: "text-green-600"
    },
    {
      text: "Seite für 'Dokumente/Ausschreibungen' erstellen (Basis).",
      status: "Erledigt (v0.4.0)", icon: CheckCircle, iconColor: "text-green-600"
    },

    // Version 0.5.0 (UX-Verbesserungen, Vorbereitung für erste breitere Tests)
    {
      text: "Ergebniserfassung (VV/MF/Admin): UX-Verbesserungen (z.B. Vorauswahl Durchgang, Anzeige fehlender Schützen, Live-Validierung Ringzahlen).",
      status: "Erledigt (v0.5.0)", icon: CheckCircle, iconColor: "text-green-600", versionTarget: "0.5.0", isMajor: true
    },
    {
      text: "Admin-Panel: Liste aller Mannschaftsführer einer Saison (mit Kontaktdaten).",
      status: "Erledigt (v0.5.0)", icon: CheckCircle, iconColor: "text-green-600", versionTarget: "0.5.0"
    },
    {
      text: "Login: Passwort-Reset-Funktion implementieren.",
      status: "Erledigt (v0.5.0)", icon: CheckCircle, iconColor: "text-green-600", versionTarget: "0.5.0"
    },
    {
      text: "Anzeige 'Mannschaften (Info)' verfeinern: Name des einen Teams anzeigen, wenn nur ein Team zugeordnet (ohne Kontext).",
      status: "Erledigt (v0.5.0)", icon: CheckCircle, iconColor: "text-green-600", versionTarget: "0.5.0"
    },
    {
      text: "RWK-Tabellen: Druckfunktion für Ligaergebnisse (ohne sensible Daten).",
      status: "Offen (v0.7.0)", icon: Printer, iconColor: "text-purple-600", versionTarget: "0.7.0"
    },
    {
      text: "Hauptnavigation: Icons überprüfen/optimieren, 'KM'-Link entfernt/auskommentiert.",
      status: "Erledigt (v0.3.1)", icon: CheckCircle, iconColor: "text-green-600"
    },
    {
      text: "Admin-Benutzerverwaltung: UI-Verbesserungen (Auflisten, einfacheres Bearbeiten).",
      status: "Erledigt (v0.5.0)", icon: CheckCircle, iconColor: "text-green-600", versionTarget: "0.5.0"
    },
    {
      text: "Vereinfachte Mannschaftsanlage mit Dropdown für Mannschaftsstärke und automatischen Namensvorschlägen.",
      status: "Erledigt (v0.5.0)", icon: CheckCircle, iconColor: "text-green-600", versionTarget: "0.5.0"
    },
    {
      text: "Suchfunktion für Schützen bei größeren Vereinen implementiert.",
      status: "Erledigt (v0.5.0)", icon: CheckCircle, iconColor: "text-green-600", versionTarget: "0.5.0"
    },
    {
      text: "Deutlichere visuelle Unterscheidung zwischen verfügbaren und zugewiesenen Schützen.",
      status: "Erledigt (v0.5.0)", icon: CheckCircle, iconColor: "text-green-600", versionTarget: "0.5.0"
    },


    // Version 0.6.0 bis 0.6.3 (Implementierte Features)
    { 
      text: "Vercel-Kompatibilität: Ersetzung von useSearchParams durch clientseitiges Parsen mit window.location.search.", 
      status: "Erledigt (v0.6.3)", icon: CheckCircle, iconColor: "text-green-600", versionTarget: "0.6.3", isMajor: true
    },
    { 
      text: "Behebung von Fehlern beim statischen Rendering auf Vercel.", 
      status: "Erledigt (v0.6.3)", icon: CheckCircle, iconColor: "text-green-600", versionTarget: "0.6.3"
    },
    { 
      text: "Optimierte Firestore-Abfragen für Vercel-Limits und verbesserte Asset-Handhabung.", 
      status: "Erledigt (v0.6.3)", icon: CheckCircle, iconColor: "text-green-600", versionTarget: "0.6.3"
    },
    { 
      text: "Audit-Trail für Ergebniserfassung (Admin): Protokollierung von Änderungen.", 
      status: "Erledigt (v0.6.0)", icon: CheckCircle, iconColor: "text-green-600", versionTarget: "0.6.0", isMajor: true
    },
    { 
      text: "Platzhalter 'Schnitt Vorjahr' in den Team-Dialogen mit echter Funktionalität versehen.", 
      status: "Erledigt (v0.6.0)", icon: CheckCircle, iconColor: "text-green-600", versionTarget: "0.6.0"
    },
    { 
      text: "PDF-Generierung (Erweitert): Gesamtlisten mit Geschlechterfilter.", 
      status: "Erledigt (v0.6.3)", icon: CheckCircle, iconColor: "text-green-600", versionTarget: "0.6.3"
    },
    { 
      text: "Urkunden-Generator für Schützen und Mannschaften mit Vercel-Kompatibilität.", 
      status: "Erledigt (v0.6.3)", icon: CheckCircle, iconColor: "text-green-600", versionTarget: "0.6.3"
    },
    {
      text: "Onboarding-Assistent für neue Benutzer implementiert.",
      status: "Erledigt (v0.6.0)", icon: CheckCircle, iconColor: "text-green-600", versionTarget: "0.6.0"
    },
    {
      text: "Passwortänderungsaufforderung nach dem ersten Login.",
      status: "Erledigt (v0.6.0)", icon: CheckCircle, iconColor: "text-green-600", versionTarget: "0.6.0"
    },
    {
      text: "RWK-Tabellen: Druckfunktion für Ligaergebnisse implementiert.",
      status: "Erledigt (v0.6.1)", icon: CheckCircle, iconColor: "text-green-600", versionTarget: "0.6.1", isMajor: true
    },
    {
      text: "Optimierte PDF-Layouts für bessere Lesbarkeit.",
      status: "Erledigt (v0.6.1)", icon: CheckCircle, iconColor: "text-green-600", versionTarget: "0.6.1"
    },
    {
      text: "Integration des Vorjahresdurchschnitts in Team-Dialoge.",
      status: "Erledigt (v0.6.1)", icon: CheckCircle, iconColor: "text-green-600", versionTarget: "0.6.1"
    },
    {
      text: "Hilfs-Tooltips für komplexe Funktionen.",
      status: "Erledigt (v0.6.1)", icon: CheckCircle, iconColor: "text-green-600", versionTarget: "0.6.1"
    },
    
    // Version 0.7.0 (Statistik & Mobile) - Abgeschlossen
    {
      text: "Statistik-Dashboard mit erweiterten Visualisierungen.",
      status: "Erledigt (v0.7.0)", icon: CheckCircle, iconColor: "text-green-600", versionTarget: "0.7.0", isMajor: true
    },
    {
      text: "Schützenvergleich-Funktion mit Auswahl von bis zu 6 Schützen.",
      status: "Erledigt (v0.7.0)", icon: CheckCircle, iconColor: "text-green-600", versionTarget: "0.7.0"
    },
    {
      text: "Terminkalender für Wettkämpfe mit iCal-Export.",
      status: "Erledigt (v0.7.0)", icon: CheckCircle, iconColor: "text-green-600", versionTarget: "0.7.0"
    },
    {
      text: "Mobile Optimierung und Progressive Web App (PWA).",
      status: "Erledigt (v0.7.0)", icon: CheckCircle, iconColor: "text-green-600", versionTarget: "0.7.0"
    },
    
    // Ziel: Version 0.7.1 (Fehlerbehebungen & UX-Verbesserungen)
    {
      text: "Standard-Statistik-Seite korrigieren, insbesondere den Mannschaftsvergleich.",
      status: "Als Nächstes (v0.7.1)", icon: AlertCircle, iconColor: "text-destructive", versionTarget: "0.7.1", isMajor: true
    },
    {
      text: "\"Erste Schritte starten\"-Button mit Funktionalität versehen.",
      status: "Offen (v0.7.1)", icon: ShieldQuestion, iconColor: "text-purple-600", versionTarget: "0.7.1"
    },
    {
      text: "\"Passwort ändern\"-Funktion implementieren.",
      status: "Offen (v0.7.1)", icon: KeyRound, iconColor: "text-purple-600", versionTarget: "0.7.1"
    },
    {
      text: "Vereinfachung der Benutzeroberfläche (Navigation, Terminkalender, etc.).",
      status: "Offen (v0.7.1)", icon: Settings, iconColor: "text-purple-600", versionTarget: "0.7.1"
    },

    // Ziel: Version 0.8.0 (Beta-Phase)
    {
      text: "Benachrichtigungssystem für neue Ergebnisse und wichtige Ereignisse.", 
      status: "Zukunft (v0.8.0)", icon: MessagesSquare, iconColor: "text-muted-foreground", versionTarget: "0.8.0", isMajor: true
    },
    {
      text: "Erweiterte Benutzerberechtigungen und Vereinfachung der Benutzerverwaltung.", 
      status: "Zukunft (v0.8.0)", icon: UserCog, iconColor: "text-muted-foreground", versionTarget: "0.8.0"
    },
    {
      text: "Automatischer Saisonabschluss / Auf- und Abstieg (komplex).", 
      status: "In Vorbereitung (v0.8.0)", icon: Trophy, iconColor: "text-blue-600", versionTarget: "0.8.0"
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
            <div className="grid grid-cols-2 gap-2">
              <Link href="/admin/seasons" passHref>
                <Button className="w-full">Saisons verwalten</Button>
              </Link>
              <Link href="/admin/season-transition" passHref>
                <Button variant="outline" className="w-full">Saisonwechsel & Auf-/Abstieg</Button>
              </Link>
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
            <CardTitle className="text-lg font-medium">Dokumentenverwaltung</CardTitle>
            <FileText className="h-6 w-6 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <CardDescription className="mb-4">
              Dokumente, Ausschreibungen und Formulare hochladen und verwalten.
            </CardDescription>
            <Link href="/admin/documents" passHref>
              <Button className="w-full">Dokumente verwalten</Button>
            </Link>
          </CardContent>
        </Card>
        
        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium">Mannschaftsführer</CardTitle>
            <Users className="h-6 w-6 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <CardDescription className="mb-4">
              Liste aller Mannschaftsführer nach Saison und Liga mit Kontaktdaten.
            </CardDescription>
            <Link href="/admin/team-managers" passHref>
              <Button className="w-full" variant="outline">Mannschaftsführer anzeigen</Button>
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
              <Link href="/admin/exports" passHref>
                <Button className="w-full" variant="outline">PDF: Ergebnislisten & Urkunden</Button>
              </Link>
              <Link href="/admin/cleanup" passHref>
                <Button className="w-full" variant="outline">Datenbereinigung</Button>
              </Link>
              <Link href="/admin/audit" passHref>
                <Button className="w-full" variant="outline">Änderungsprotokoll</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>



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
