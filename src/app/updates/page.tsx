// src/app/updates/page.tsx
"use client";
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Newspaper, Tag, CalendarDays, ListChecks } from 'lucide-react';
import type { ChangelogEntry } from '@/types/updates';

const changelogEntries: ChangelogEntry[] = [
  {
    version: '0.3.5',
    date: '24. Mai 2025',
    title: 'Verbesserte Ergebniserfassung & Benutzerfreundlichkeit',
    descriptionPoints: [
      'Verbessert: Schützen ohne Ergebnisse werden in der Ergebniserfassung fett und mit Warnzeichen (⚠️) hervorgehoben.',
      'Behoben: Durchgang wird beim Mannschaftswechsel in der Ergebniserfassung nicht mehr zurückgesetzt (Admin und Vereinsvertreter).',
      'Behoben: "seasonId is not defined"-Fehler in der Ergebniserfassung für Admin und Vereinsvertreter.',
      'Verbessert: Mannschaften, deren Schützen bereits alle Ergebnisse für einen Durchgang haben, werden aus dem Dropdown entfernt.',
      'Verbessert: Anzeige "Alle Teams vollständig erfasst" wenn keine Mannschaften mehr für den ausgewählten Durchgang verfügbar sind.',
      'Aktualisierung der Dokumentation und Handbuch mit den neuesten Funktionen.',
    ],
  },
  {
    version: '0.3.3',
    date: '22. Mai 2025',
    title: 'Fehlerbehebung Admin-Schützenverwaltung & Stabilitätsverbesserungen',
    descriptionPoints: [
      'Behoben: Fälschlicherweise angezeigter Fehler-Toast "maximal 3 Mannschaften ausgewählt" beim Öffnen des "Neuen Schützen anlegen"-Dialogs im Admin-Panel.',
      'Diverse Korrekturen an Importen und Code-Struktur zur Verbesserung der Build-Stabilität auf Vercel.',
      'Aktualisierung der Handbuch- und Agenda-Texte.',
    ],
  },
  {
    version: '0.3.1', // Beibehaltung der vorherigen korrekten Versionierung für diese Punkte
    date: '22. Mai 2025',
    title: 'RWK-Ordnung, Handbuch-Fix & Vorbereitung Admin-Agenda',
    descriptionPoints: [
      'Neue Seite "/rwk-ordnung" mit Inhalt erstellt und in die Hauptnavigation aufgenommen.',
      'Syntaxfehler auf der Seite "/handbuch" behoben, der das Rendern verhinderte.',
      'Handbuch und Admin-Agenda mit den neuesten Funktionen und vereinfachten Formulierungen aktualisiert.',
      'Fehlerbehebungen im Zusammenhang mit Icon-Importen auf verschiedenen Seiten.',
    ],
  },
  {
    version: '0.3.0',
    date: '22. Mai 2025',
    title: 'Verbesserte RWK-Tabellen, Doku & Fahrplan',
    descriptionPoints: [
      'RWK-Tabellen (/rwk-tabellen) verarbeiten jetzt URL-Query-Parameter, um direkt spezifische Ligen und Jahre anzuzeigen (Verlinkung von Startseite).',
      'Ligen-Akkordeons in RWK-Tabellen sind jetzt standardmäßig geöffnet.',
      'Einzelschützen in der aufgeklappten Mannschafts-Detailansicht (RWK-Tabellen) sind nun klickbar und öffnen den Statistik-Dialog.',
      'Behebung von Darstellungs- und JavaScript-Fehlern auf der RWK-Tabellenseite (EOF, useSearchParams).',
      'Handbuch und Admin-Dashboard-Agenda an den aktuellen Entwicklungsstand angepasst.',
      'Filterung von "Einzel"-Mannschaften aus der Mannschaftsrangliste.',
      'Korrekte Berechnung von Mannschafts-Rundenergebnissen (nur wenn 3 Schützen Ergebnisse haben).',
      'Anpassung der DG-Spaltenüberschriften in der Mannschaftstabelle für bessere Lesbarkeit.',
      'Behebung einer Dauerschleife auf der RWK-Tabellenseite durch Optimierung der React Hooks.',
    ],
  },
  {
    version: '0.2.6a',
    date: '22. Mai 2025',
    title: 'Hotfix: Handbuch-Fehler und Build-Stabilität',
    descriptionPoints: [
        'Syntaxfehler auf der Handbuch-Anzeigeseite behoben, der das Rendern verhinderte.',
        'Korrekturen an Icon-Importen zur Verbesserung der Vercel-Build-Stabilität.',
    ],
  },
  {
    version: '0.2.6',
    date: '22. Mai 2025',
    title: 'VV-Seiten Stabilisierung & Logger-Fixes',
    descriptionPoints: [
      'Fehlerhafte Logger-Importe auf den Vereinsvertreter-Seiten entfernt, die zu Laufzeitfehlern führten.',
      'Stabilitätsverbesserungen auf den VV-Seiten nach Umstellung auf `user_permissions`.',
    ],
  },
  {
    version: '0.2.5',
    date: '22. Mai 2025',
    title: 'Firestore Sicherheitsregeln (Basis für user_permissions)',
    descriptionPoints: [
      'Erste Version der Firestore-Sicherheitsregeln implementiert, die auf der `user_permissions`-Collection basiert, um Zugriffsrechte für Vereinsvertreter und Mannschaftsführer vorzubereiten.',
      'Client-seitige UI-Anpassungen für VV/MF-Rollen auf den Vereinsseiten (Anzeige von Bearbeitungsbuttons).',
      'Korrektur des Dashboard-Zugriffs für Mannschaftsführer.',
    ],
  },
  {
    version: '0.2.4',
    date: '22. Mai 2025',
    title: 'Zentralisierung Benutzerberechtigungen im AuthProvider',
    descriptionPoints: [
      'Laden der `user_permissions` (Rolle, Vereins-IDs) in den `AuthProvider` zentralisiert.',
      'Vereins-Layout (`/app/verein/layout.tsx`) und abhängige Seiten nutzen nun den `AuthContext` für Berechtigungsdaten.',
      'Entfernung der `VV_CLUB_ASSIGNMENTS`-Map aus den VV-Seiten zugunsten der `user_permissions`-Datenbanklogik.',
      'Anzeige der Benutzerrolle im VV-Dashboard implementiert.',
    ],
  },
  {
    version: '0.2.3a',
    date: '21. Mai 2025',
    title: 'Hotfix: Vercel Build-Fehler & Favicon-Korrektur',
    descriptionPoints: [
      'Behebung eines Build-Fehlers (`cn is not defined` und Icon-Fehler) auf der Admin-Dashboard-Seite für Vercel-Deployments.',
      'Favicon-Konfiguration in der Hauptlayout-Datei präzisiert.',
    ],
  },
  {
    version: '0.2.2',
    date: '21. Mai 2025',
    title: 'Dynamische Jahresauswahl RWK-Tabellen & Impressum',
    descriptionPoints: [
      'RWK-Tabellen: Jahresauswahl wird dynamisch aus existierenden Saisons generiert und das aktuelle Jahr (mit laufenden Wettbewerben) wird standardmäßig ausgewählt.',
      'RWK-Tabellen: Filterung, sodass nur Saisons mit Status "Laufend" angezeigt werden.',
      'Impressumsseite mit Inhalt befüllt und im Footer verlinkt.',
      'Korrektur der "Bester Schütze"/"Beste Dame"-Logik in RWK-Tabellen.',
    ],
  },
  {
    version: '0.2.1',
    date: '21. Mai 2025',
    title: 'Stabile VV-Seiten (Einzelverein) & Admin-Team-Fixes',
    descriptionPoints: [
      'Vereinsvertreter-Seiten (Mannschaften, Schützen, Ergebnisse) nutzen nun `user_permissions` für die Zuweisung zu einem einzelnen Verein.',
      'Fehlerbehebung auf der Admin-Teamseite (`SelectItem`-Fehler, Ligazuweisung im Dialog).',
      'Umstellung der `clubIds` in `user_permissions` von Array auf Map für bessere Regelkompatibilität (später wieder zu Single-ID für VV vereinfacht).',
    ],
  },
  {
    version: '0.2.0',
    date: '21. Mai 2025',
    title: 'Benutzerverwaltung (UID-basiert) & Vorbereitung VV-Rechte',
    descriptionPoints: [
      'Admin-Seite `/admin/user-management` speichert Rolle und Vereinszuweisungen (bis zu 3 Vereine) in `user_permissions` (Firestore) basierend auf UID.',
      'Entfernung der Cloud Function-Logik für das Setzen von Claims aus der App; Admin legt Benutzer manuell in Auth an, App weist Rechte in DB zu.',
      'Vorbereitung der Vereinsvertreter-Seiten zur Nutzung dieser `user_permissions`.',
      'Agenda im Admin-Panel um Notizen zur Rechteverwaltung erweitert.',
    ],
  },
  {
    version: '0.1.9',
    date: '20. Mai 2025',
    title: 'Verbesserung Ergebniserfassung UX & Datenkonsistenz',
    descriptionPoints: [
      'Ergebniserfassungsseiten (Admin & VV): Vorgemerkte Ergebnisse bleiben jetzt auch bei einem Wechsel der Mannschaft (im selben Durchgang/Liga/Saison) in der Liste erhalten.',
      'Regel "Ein Schütze pro Saison/Disziplinkategorie nur in einem Team" beim Zuweisen zu Mannschaften implementiert.',
      'Fehlerbehebung Zähler "X/3 Schützen" in Team-Dialogen.',
    ],
  },
  {
    version: '0.1.8',
    date: '20. Mai 2025',
    title: 'Regelkonsistenz Schützenzuweisung & VV-Basis',
    descriptionPoints: [
      'Regel "Ein Schütze pro Saison/Disziplinkategorie nur in einem Team" für Admin und VV Schützen-/Mannschaftsverwaltung vereinheitlicht.',
      'Basis für Vereinsvertreter-Seiten implementiert, um `user_permissions` zu nutzen.',
      'Fehlerbehebung "Mannschaften Info"-Anzeige auf Schützen-Adminseite.',
    ],
  },
  {
    version: '0.1.7',
    date: '20. Mai 2025',
    title: 'VV-Funktionen auf `user_permissions` umgestellt (Basis)',
    descriptionPoints: [
      'Vereinsvertreter-Seiten (`/verein/...`) nutzen nun die `user_permissions`-Collection in Firestore (via Context) zur Rechteprüfung und Vereinszuweisung (Einzel-Club-Modell).',
      'Anzeige der Benutzerrolle und des Vereinsnamens im VV-Dashboard.',
      'Ergebniserfassung für VVs an die neuen Berechtigungen angepasst.',
    ],
  },
  {
    version: '0.1.6',
    date: '20. Mai 2025',
    title: '"Letzte Änderungen"-Feed & Ergebnis-Korrekturen',
    descriptionPoints: [
      'Startseite (`/`) zeigt "Letzte Ergebnis-Updates" aus `league_updates`-Collection, gruppiert pro Liga/Tag und inklusive Disziplintyp und Jahr.',
      'Korrekte Speicherung von `shooterName`, `teamName`, `leagueName` etc. in `rwk_scores` bei Ergebniserfassung.',
      'Schützen verschwinden korrekt aus Dropdown nach Ergebniserfassung (auch nach Neuladen).',
    ],
  },
  {
    version: '0.1.5',
    date: '20. Mai 2025',
    title: 'Ergebnisbearbeitung Admin & RWK-Tabellen Verfeinerung',
    descriptionPoints: [
      'Admin Edit Results (`/admin/edit-results`): Vollständige Implementierung der Bearbeitungs- und Löschfunktion für Ergebnisse mit Historie.',
      'Validierung von Ringzahlen (max. 300/400) bei Ergebniserfassung und -bearbeitung.',
      'Anzeige "Bester Schütze" / "Beste Dame" in RWK-Tabellen korrigiert und auf männlich/weiblich getrennt.',
      'Disziplin "SP" entfernt und Maximalringzahlen für LG/LP auf 400 angepasst.',
    ],
  },
   {
    version: '0.1.4',
    date: '20. Mai 2025',
    title: 'Verbesserte Ergebniserfassung und Einzelranglisten-Fix',
    descriptionPoints: [
      'Korrekte Speicherung von Namen in `rwk_scores` sichergestellt, um "Unbekannter Schütze" in Ranglisten zu vermeiden.',
      'Schützen verschwinden nach dem Speichern von Ergebnissen korrekt aus dem Dropdown der Ergebniserfassung.',
      'Geschlechterfilterung für "Beste Dame" in Einzelrangliste korrigiert.',
    ],
  },
  {
    version: '0.1.3',
    date: '20. Mai 2025',
    title: 'Ergebniserfassung Admin (Speichern) & UI-Verbesserungen',
    descriptionPoints: [
      'Admin-Ergebniserfassung: Speichern von Ergebnissen in Firestore (`rwk_scores`) implementiert.',
      'Vorgemerkte Ergebnisse bleiben bei Mannschaftswechsel in der Liste.',
      'Felder für Mannschaftsführer-Kontaktdaten in Team-Dialogen hinzugefügt.',
      'Hinweis zur Mannschaftsstärke-Benennung in Team-Dialogen.',
    ],
  },
  {
    version: '0.1.1', // War vorher 0.2.1, angepasst für Konsistenz
    date: '20. Mai 2025',
    title: 'Stabile Admin-Teamverwaltung & VV-Basisanpassung',
    descriptionPoints: [
      'Fehlerbehebung auf Admin-Teamseite (`SelectItem`-Fehler, Ligazuweisung im Dialog stabilisiert).',
      'Grundlegende Umstellung der Vereinsvertreter-Seiten auf Nutzung von `user_permissions` (Basis für Einzelverein).',
      'Zähler für Schützen in Team-Dialogen korrigiert.',
      'Regel "Ein Schütze pro Saison/Disziplin nur in einem Team" in Admin-Team-Dialog implementiert.',
    ],
  },
  {
    version: '0.1.0', // War vorher 0.2.0, angepasst
    date: '20. Mai 2025',
    title: 'Admin Benutzerverwaltung (Firestore-basiert) & Vorbereitung VV-Rechte',
    descriptionPoints: [
      'Admin-Seite `/admin/user-management` speichert Rolle und Vereinszuweisung (1 Verein) in `user_permissions` (Firestore) basierend auf UID.',
      'Entfernung der Cloud Function-Logik für Rechtevergabe; Admin legt Benutzer manuell in Auth an, App weist Rechte in DB zu.',
      'Layout-Korrekturen für Admin-Schützen-Dialog.',
      'Agenda im Admin-Panel um Notizen zur Rechteverwaltung und Doku-Fortschritt erweitert.',
    ],
  },
  {
    version: '0.0.2.6a', // Beibehalten, da spezifischer Hotfix
    date: '20. Mai 2025',
    title: 'Hotfix: Vercel Build-Fehler (Admin Dashboard Icons & cn)',
    descriptionPoints: [
        'Behebung eines Build-Fehlers (`cn is not defined` und diverse Icon-Fehler) auf der Admin-Dashboard-Seite für Vercel-Deployments durch korrekte Importe.',
        'Favicon-Konfiguration präzisiert.',
    ],
  },
  {
    version: '0.0.2.0', // Konsolidierung früherer Stände
    date: '19. Mai 2025',
    title: 'Admin Stammdaten CRUD, Basis VV-Layout & RWK-Tabellen, Support-System',
    descriptionPoints: [
      'Vereins-, Saison-, Liga-, Mannschafts- und Schützenverwaltung für Admins mit DB-Anbindung implementiert (Basis CRUD).',
      'Grundstruktur für Vereinsvertreter-Bereich (`/verein/...`) mit Layout und Platzhalterseiten erstellt.',
      'RWK-Tabellenseite mit Anzeige von Ligen, Mannschaften und Einzelschützen (basierend auf Firestore-Daten), inkl. Filter und Detail-Dialog für Schützen.',
      'Support-Seite mit Formular und Speicherung der Tickets in Firestore; Admin-Ansicht für Tickets.',
      'Handbuch- und Impressumsseiten erstellt und mit Inhalt befüllt.',
      'Versionsnummer im Footer und Changelog-Seite implementiert.',
      'Firebase-Konfiguration auf Umgebungsvariablen umgestellt.',
      'Diverse UI-Verbesserungen und Fehlerbehebungen (Layout, SelectItem-Fehler, Hydration Errors).',
      'Admin-Dashboard mit Agenda und Links zu Verwaltungsbereichen.',
    ],
  },
];

export default function UpdatesPage() {
  return (
    <div className="space-y-8 container mx-auto px-4 py-8">
      <div className="flex items-center space-x-3 mb-8">
        <Newspaper className="h-10 w-10 text-primary" />
        <div>
          <h1 className="text-4xl font-bold text-primary">Updates & Changelog</h1>
          <p className="text-lg text-muted-foreground">
            Alle wichtigen Informationen und Änderungen zur RWK Einbeck App.
          </p>
        </div>
      </div>

      {changelogEntries.length === 0 ? (
        <Card className="shadow-lg">
          <CardContent className="text-center py-12">
            <p className="text-lg text-muted-foreground">
              Noch keine Update-Einträge vorhanden.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-10">
          {changelogEntries.map((entry) => (
            <Card key={entry.version} className="shadow-xl hover:shadow-2xl transition-shadow duration-300">
              <CardHeader className="pb-4">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                  <CardTitle className="text-3xl text-accent flex items-center">
                    <Tag className="mr-3 h-7 w-7" />
                    Version {entry.version}
                  </CardTitle>
                  <div className="text-sm text-muted-foreground flex items-center">
                    <CalendarDays className="mr-2 h-5 w-5" />
                    <span>{entry.date}</span>
                  </div>
                </div>
                {entry.title && <CardDescription className="text-lg pt-1">{entry.title}</CardDescription>}
              </CardHeader>
              <Separator />
              <CardContent className="pt-6">
                <div className="flex items-start space-x-3">
                  <ListChecks className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                  <ul className="space-y-2 list-inside text-foreground/90">
                    {entry.descriptionPoints.map((point, idx) => (
                      <li key={idx} className="leading-relaxed">
                        <span className="font-medium text-primary/80">-</span> {point}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
