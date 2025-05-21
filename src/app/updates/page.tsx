// src/app/updates/page.tsx
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { NewspaperIcon, TagIcon, CalendarDaysIcon, ListChecksIcon } from 'lucide-react';
import type { ChangelogEntry } from '@/types/updates';

// Changelog entries using MAJOR.MINOR.PATCH
const changelogEntries: ChangelogEntry[] = [
  {
    version: '0.2.2',
    date: '20. Mai 2025',
    title: 'RWK-Tabellen verbessert & Impressum hinzugefügt',
    descriptionPoints: [
      'RWK-Tabellen (/rwk-tabellen): Jahresauswahl wird jetzt dynamisch aus den in Firestore vorhandenen Saisons generiert.',
      'RWK-Tabellen: Das aktuelle Kalenderjahr wird als Standard im Jahres-Dropdown vorausgewählt, falls dafür Saisons existieren; ansonsten das neueste verfügbare Jahr.',
      'RWK-Tabellen: Es werden nur noch Saisons mit dem Status "Laufend" berücksichtigt und angezeigt.',
      'Impressumsseite (/impressum) mit den bereitgestellten Inhalten erstellt und im Footer verlinkt.',
      'Diverse Fehlerbehebungen im Zusammenhang mit der Code-Bereitstellung und Komponenten-Imports.',
    ],
  },
  {
    version: '0.2.1',
    date: '20. Mai 2025',
    title: 'Korrekturen Admin-Teamseite & VV-Funktionalität',
    descriptionPoints: [
      'Behebung eines persistenten "SelectItem value cannot be empty" Fehlers auf der Admin-Teamseite (/admin/teams) durch Vereinfachung und sorgfältige Wiedereinführung der Liga-Zuweisung im Dialog.',
      'Sicherstellung, dass die Vereinsvertreter-Seiten (Mannschaften, Schützen, Ergebnisse) den `VereinContext` korrekt nutzen und die Vereinsauswahl bei mehreren zugewiesenen Vereinen funktioniert.',
      'Korrektur von Import-Fehlern für AlertDialog-Komponenten auf verschiedenen Vereinsvertreter-Seiten.',
      'Anpassung der Zählerlogik für Schützen in Teams.',
    ],
  },
  {
    version: '0.2.0',
    date: '20. Mai 2025',
    title: 'Benutzerverwaltung Basis & Vorbereitung VV-Rechtesystem',
    descriptionPoints: [
      'Admin-Seite "/admin/user-management" überarbeitet: Super-Admin kann Berechtigungen (Rolle, bis zu 3 Vereine) für Benutzer (identifiziert durch UID) direkt in Firestore (`user_permissions`-Collection) speichern (ohne Cloud Functions für diesen Schreibvorgang).',
      'Anleitung für manuelle Benutzeranlage in Firebase Auth und Rechtevergabe in der App auf der Benutzerverwaltungs-Seite hinzugefügt.',
      'Grundlage für Vereinsvertreter-Bereich geschaffen (`/app/verein/...`) mit Layout und ersten Seiten.',
      'Client-seitige Logik im Vereins-Layout (`/app/verein/layout.tsx`) zum Laden der `user_permissions` aus Firestore implementiert.',
      'Vereins-Dashboard (`/app/verein/dashboard`) zeigt nun Vereine basierend auf `user_permissions`.',
      'Platzhalter für "Statistiken" im Admin-Dashboard hinzugefügt.',
      // Cloud Function Anmerkung: Der Deployment-Teil für die Functions war erfolgreich, die clientseitige Nutzung wurde aber aufgrund des Blaze-Plans erstmal zurückgestellt.
    ],
  },
  {
    version: '0.1.9',
    date: '20. Mai 2025',
    title: 'Verbesserung Ergebniserfassung',
    descriptionPoints: [
      'Ergebniserfassungsseiten (/admin/results, /app/verein/ergebnisse): Vorgemerkte Ergebnisse bleiben bei Mannschaftswechsel in der Liste.',
      'Korrektur des Changelog-Datums für frühere Einträge.',
    ],
  },
  {
    version: '0.1.8',
    date: '20. Mai 2025',
    title: 'Regeldurchsetzung Schützenzuordnung für Vereinsvertreter',
    descriptionPoints: [
      'Seite /app/verein/schuetzen/page.tsx: Beim Neuanlegen eines Schützen wird die Regel "Ein Schütze pro Disziplinkategorie (Gewehr/Pistole) pro Wettkampfjahr nur einem Team zuordnen" durch UI-Logik (Deaktivieren von Checkboxen) und Validierung beim Speichern durchgesetzt.',
      'Diverse Korrekturen bei Importen und Fehlerbehandlung.',
    ],
  },
  {
    version: '0.1.7',
    date: '20. Mai 2025',
    title: 'VV-Seiten auf Firestore user_permissions umgestellt (Basis)',
    descriptionPoints: [
      'Vereinsvertreter-Layout (/app/verein/layout.tsx) lädt Berechtigungen (Rolle, clubIds) aus Firestore `user_permissions`.',
      'Vereinsvertreter-Dashboard (/app/verein/dashboard) zeigt Vereine basierend auf `user_permissions`.',
      'Seite /app/verein/mannschaften/page.tsx nutzt `user_permissions` für Vereinskontext und ermöglicht Vereinsauswahl bei mehreren zugewiesenen Vereinen.',
      'Seite /app/verein/schuetzen/page.tsx und /app/verein/ergebnisse/page.tsx für die Umstellung vorbereitet (Context-Nutzung, aber Detail-Logik folgt).',
      'Diverse Fehlerbehebungen im Zusammenhang mit der Umstellung (Routing, State-Management, fehlende Imports).',
    ],
  },
  {
    version: '0.1.6',
    date: '20. Mai 2025', 
    title: 'Implementierung "Letzte Änderungen"-Feed & Disziplinanzeige',
    descriptionPoints: [
      'Neue Firestore-Collection `league_updates` speichert Informationen über neu hinzugefügte Ergebnisse.',
      'Ergebniserfassung (Admin & Verein) erstellt/aktualisiert Einträge in `league_updates`, gruppiert pro Liga und Tag.',
      'Startseite (`/`) zeigt die letzten Einträge aus `league_updates` an, inklusive des Disziplintyps der Liga.',
    ],
  },
   {
    version: '0.1.5',
    date: '20. Mai 2025',
    title: 'Ergebnisbearbeitung implementiert & Ranglisten-Anzeige verfeinert',
    descriptionPoints: [
      'Admin Edit Results (/admin/edit-results): Vollständige Implementierung der Bearbeitungsfunktion für Ergebnisse (Ringzahl, Ergebnistyp) inklusive Speicherung der Änderungshistorie.',
      'RWK Tabellen: Anzeige für "Bester Schütze" (bester männlicher Teilnehmer) und "Beste Dame" (beste weibliche Teilnehmerin) getrennt und korrekt implementiert.',
      'Fehlerbehebung beim Logout (Client-seitige Exception).',
      'Support-Seite mit Formular (Speicherung in Firestore) und Admin-Ansicht für Tickets implementiert.',
      'Platzhalter für Captcha auf Login-Seite und erweiterter Hinweistext auf Support-Seite.',
    ],
  },
  {
    version: '0.1.4',
    date: '20. Mai 2025',
    title: 'Verbesserungen Ergebniserfassung & Einzelrangliste',
    descriptionPoints: [
      'Ergebniserfassung: Korrekte Speicherung von Schützen-, Team- und Liganamen in der `rwk_scores`-Datenbank sichergestellt.',
      'Ergebniserfassung: Schützen werden nun auch nach dem Neuladen der Seite korrekt aus dem Dropdown entfernt, wenn für den gewählten Durchgang bereits ein Ergebnis in der Datenbank existiert (`existingScoresForTeamAndRound`).',
      'RWK Tabellen: Korrektur der Geschlechter-Aggregierung für die zuverlässige Ermittlung der "Besten Dame".',
    ],
  },
  {
    version: '0.1.3',
    date: '19. Mai 2025',
    title: 'Implementierung Ergebniserfassung (Speichern) & -bearbeitung (Basis)',
    descriptionPoints: [
      'Admin Results (/admin/results): Ergebnisse können erfasst und in Firestore (rwk_scores) gespeichert werden. Korrekte Speicherung von Namen etc. implementiert.',
      'Admin Edit Results (/admin/edit-results): Neue Seite zum Suchen und (Basis-)Bearbeiten von erfassten Ergebnissen hinzugefügt.',
      'Logik für "Letzte Änderungen"-Feed vorbereitet (Speichern von league_updates).',
    ],
  },
  {
    version: '0.1.2',
    date: '19. Mai 2025',
    title: 'Filterung RWK-Tabellen & diverse Admin-Korrekturen',
    descriptionPoints: [
      'RWK-Tabellen (/rwk-tabellen) werden nur noch für Saisons mit dem Status "Laufend" angezeigt (Filterung implementiert, Standardjahr korrigiert).',
      'Behebung diverser "SelectItem value cannot be empty" Fehler in Admin-Dropdowns, insbesondere auf /admin/teams.',
      'Korrektur von Import-Fehlern für AlertDialog-Komponenten.',
    ],
  },
  {
    version: '0.1.1',
    date: '19. Mai 2025',
    title: 'Korrektur Schützenzuordnung Zähler & Datenintegrität',
    descriptionPoints: [
      'Behebung von "No document to update"-Fehlern bei der Mannschaftsbearbeitung.',
      'Korrektur des Zählers für ausgewählte Schützen im Mannschafts-Bearbeiten-Dialog.',
      'Sicherstellung der Datenkonsistenz bei der Zuordnung von Schützen zu Teams (beidseitige Verknüpfung).',
      'Verbesserungen am Layout und der Benutzerführung in verschiedenen Admin-Dialogen.',
      'Regel "Maximal 3 Schützen pro Team" implementiert und korrigiert.',
      'Regel "Ein Schütze pro Saison/Disziplinkategorie nur in einem Team" (Basis) implementiert.',
    ],
  },
  {
    version: '0.1.0',
    date: '19. Mai 2025',
    title: 'Umstellung Versionierung & Admin Stammdaten-Grundlagen mit DB-Anbindung',
    descriptionPoints: [
      'Versionierung auf MAJOR.MINOR.PATCH umgestellt.',
      'Admin Vereinsverwaltung: CRUD-Funktionen mit Firestore-Anbindung implementiert.',
      'Admin Saisonverwaltung: CRUD-Funktionen mit Firestore-Anbindung implementiert.',
      'Admin Ligaverwaltung: CRUD-Funktionen und Zuordnung zu Saisons implementiert.',
      'Admin Mannschaftsverwaltung: Datenbankanbindung, Zuordnung zu Liga/Saison/Verein, Schützenzuweisung (Basis).',
      'Admin Schützenverwaltung: Datenbankanbindung, Zuordnung zu Verein, Regeln für Teamzuordnung (Basis).',
      'Basis für Vereinsvertreter-Bereich geschaffen (Layouts, Navigation, erste Seite).',
      'Diverse UI-Korrekturen und Fehlerbehebungen.',
      'Git-Initialisierung und .gitignore-Setup.',
      'Anpassung des Logos.',
    ],
  },
];

export default function UpdatesPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center space-x-3 mb-8">
        <NewspaperIcon className="h-10 w-10 text-primary" />
        <div>
          <h1 className="text-4xl font-bold text-primary">Updates & Changelog</h1>
          <p className="text-lg text-muted-foreground">
            Alle wichtigen Informationen und Änderungen zu den Rundenwettkämpfen und der App.
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
          {changelogEntries.map((entry, index) => (
            <Card key={entry.version} className="shadow-xl hover:shadow-2xl transition-shadow duration-300">
              <CardHeader className="pb-4">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                  <CardTitle className="text-3xl text-accent flex items-center">
                    <TagIcon className="mr-3 h-7 w-7" />
                    Version {entry.version}
                  </CardTitle>
                  <div className="text-sm text-muted-foreground flex items-center">
                    <CalendarDaysIcon className="mr-2 h-5 w-5" />
                    <span>{entry.date}</span>
                  </div>
                </div>
                {entry.title && <CardDescription className="text-lg pt-1">{entry.title}</CardDescription>}
              </CardHeader>
              <Separator />
              <CardContent className="pt-6">
                <div className="flex items-start space-x-3">
                  <ListChecksIcon className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
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
