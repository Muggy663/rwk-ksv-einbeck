// src/app/updates/page.tsx
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { NewspaperIcon, TagIcon, CalendarDaysIcon, ListChecksIcon } from 'lucide-react';
import type { ChangelogEntry } from '@/types/updates';

// Changelog entries using MAJOR.MINOR.PATCH
const changelogEntries: ChangelogEntry[] = [
  {
    version: '0.2.1',
    date: '20. Mai 2025',
    title: 'Vereinsvertreter-Berechtigungen auf Firestore `user_permissions` umgestellt',
    descriptionPoints: [
      'Alle Vereinsvertreter-Seiten (/verein/dashboard, /verein/mannschaften, /verein/schuetzen, /verein/ergebnisse) nutzen nun die `user_permissions`-Collection in Firestore, um die Rolle und die zugewiesenen Vereine des eingeloggten Benutzers zu ermitteln.',
      'Die temporäre, hartcodierte `VV_CLUB_ASSIGNMENTS`-Map wurde aus allen VV-Seiten entfernt.',
      'VV-Seiten ermöglichen nun eine Vereinsauswahl, wenn dem VV mehrere Vereine zugewiesen sind.',
      'Die Filterung von Ligen und Mannschaften in den VV-Seiten basiert jetzt auf den zugewiesenen Vereinen.',
      'Diverse Fehlerbehebungen im Zusammenhang mit der Umstellung und der Datenanzeige für VVs.',
    ],
  },
  {
    version: '0.2.0',
    date: '20. Mai 2025',
    title: 'Benutzerverwaltung (Basis) & Vorbereitung für Custom Claims',
    descriptionPoints: [
      'Admin-Seite "/admin/user-management" überarbeitet: Super-Admin kann Berechtigungen (Rolle, bis zu 3 Vereine) für Benutzer (identifiziert durch UID) direkt in Firestore (`user_permissions`-Collection) speichern.',
      'Anleitung für manuelle Benutzeranlage in Firebase Auth und Rechtevergabe in der App auf der Benutzerverwaltungs-Seite hinzugefügt.',
      'Temporäre Umgehung von Cloud Functions für die Rechtevergabe; Fokus auf direkte Firestore-Operationen für den Admin.',
      'Platzhalter-Link "Benutzerverwaltung" im Admin-Layout aktiviert.',
      'Platzhalter-Sektion für "Statistiken" im Admin-Dashboard hinzugefügt.',
      'Firestore-Sicherheitsregeln angepasst, um Schreibzugriff auf `user_permissions` auf Super-Admin zu beschränken.',
      'Support-Ticket-System implementiert: Formular auf /support speichert Tickets in Firestore; Admin-Ansicht unter /admin/support-tickets.',
      'Disziplin "SP" (Sportpistole) entfernt und Maximalringzahl für LG/LP-Disziplinen auf 400 korrigiert.',
      'Fehlerbehebungen in der Admin-Ergebnisbearbeitung und -erfassung.',
      'Seite `/admin/edit-results` ermöglicht Admins das Löschen von Ergebnissen.',
      'Verbesserung der Ergebniserfassung: Vorgemerkte Ergebnisse bleiben bei Mannschaftswechsel erhalten.',
      'Changelog-Datum korrigiert und Formatierungsfehler in Cloud Function (für spätere Nutzung) behoben.',
      'Firebase Cloud Function `setUserRoleAndClub` erfolgreich deployed (Blaze Plan Voraussetzung).',
    ],
  },
  {
    version: '0.1.9',
    date: '20. Mai 2025',
    title: 'Verbesserung Ergebniserfassung UX',
    descriptionPoints: [
      'Die Liste der vorgemerkten Ergebnisse in den Ergebniserfassungsseiten (Admin & Verein) bleibt nun erhalten, wenn die Mannschaftsauswahl geändert wird.',
      'Fehlerbehebungen bei der Anzeige der Einzelrangliste ("Unbekannter Schütze").',
      'Schützen verschwinden nun auch nach Seiten-Neuladen aus dem Dropdown der Ergebniserfassung, wenn für sie bereits Ergebnisse in der Runde existieren.',
    ],
  },
  {
    version: '0.1.8',
    date: '20. Mai 2025',
    title: 'Regeldurchsetzung Schützenzuordnung für VVs & Fehlerbehebungen',
    descriptionPoints: [
      'Regel "Ein Schütze pro Saison/Disziplinkategorie nur in einem Team" beim Neuanlegen von Schützen durch Vereinsvertreter implementiert.',
      'Diverse Fehlerbehebungen bei Importen und der `SelectItem`-Komponente in Admin- und Vereinsseiten behoben.',
    ],
  },
   {
    version: '0.1.7',
    date: '20. Mai 2025',
    title: 'Basis-Funktionalität für Vereinsvertreter (VV) mit Firestore-Berechtigungen',
    descriptionPoints: [
      'Vereinsvertreter-Seiten (Dashboard, Basis für Mannschaften, Schützen, Ergebnisse) nutzen jetzt die `user_permissions`-Collection in Firestore anstelle einer hartcodierten Map (fortlaufende Implementierung).',
      'VV-Dashboard zeigt zugewiesene Vereine an.',
      'Korrektur der Geschlechterfilterung ("Bester Schütze" vs. "Beste Dame") in der RWK-Tabellenansicht.',
    ],
  },
  {
    version: '0.1.6',
    date: '20. Mai 2025',
    title: 'Implementierung "Letzte Änderungen"-Feed & Disziplinanzeige',
    descriptionPoints: [
      'Neue Firestore-Collection `league_updates` speichert Informationen über neu hinzugefügte Ergebnisse.',
      'Ergebniserfassung (Admin & Verein) erstellt/aktualisiert Einträge in `league_updates` (gruppiert pro Liga/Tag).',
      'Startseite (`/`) zeigt die letzten Einträge aus `league_updates` an, inklusive des Disziplintyps der Liga (z.B. Kleinkaliber).',
    ],
  },
   {
    version: '0.1.5',
    date: '20. Mai 2025',
    title: 'Ergebnisbearbeitung für Admins & Ranglisten-Anpassung',
    descriptionPoints: [
      'Admin Edit Results (/admin/edit-results): Vollständige Implementierung der Bearbeitungsfunktion für Ergebnisse (Ringzahl, Ergebnistyp) inklusive Speicherung der Änderungshistorie.',
      'RWK Tabellen: Korrektur der Logik zur Ermittlung von "Bester Schütze" (jetzt bester männlicher Teilnehmer) und "Beste Dame".',
      'Validierung für maximale Ringzahl (LG/LP: 400, KK: 300) in Ergebniserfassung und -bearbeitung implementiert und Disziplin "SP" entfernt.',
    ],
  },
  {
    version: '0.1.4',
    date: '20. Mai 2025',
    title: 'Verbesserungen Ergebniserfassung & Einzelrangliste',
    descriptionPoints: [
      'Ergebniserfassung: Korrekte Speicherung von Schützen- und Teamnamen in der `rwk_scores`-Datenbank sichergestellt.',
      'Ergebniserfassung: Schützen werden nun auch nach dem Neuladen der Seite korrekt aus dem Dropdown entfernt, wenn für den gewählten Durchgang bereits ein Ergebnis in der Datenbank existiert.',
      'RWK Tabellen: Korrektur der Geschlechter-Aggregierung für die zuverlässige Ermittlung der "Besten Dame".',
    ],
  },
  {
    version: '0.1.3',
    date: '19. Mai 2025',
    title: 'Implementierung Ergebniserfassung & -bearbeitung (Basis)',
    descriptionPoints: [
      'Admin Results (/admin/results): Ergebnisse können erfasst und in Firestore (rwk_scores) gespeichert werden.',
      'Admin Results: Korrekte Speicherung von shooterName, teamName, leagueName etc. implementiert.',
      'Admin Results: Schützen verschwinden nach Erfassung für einen Durchgang aus dem Auswahl-Dropdown.',
      'Admin Edit Results (/admin/edit-results): Neue Seite zum Suchen und (Basis-)Bearbeiten von erfassten Ergebnissen hinzugefügt.',
    ],
  },
  {
    version: '0.1.2',
    date: '19. Mai 2025',
    title: 'Filterung RWK-Tabellen nach laufenden Saisons & Korrekturen',
    descriptionPoints: [
      'RWK-Tabellen (/rwk-tabellen) werden nur noch für Saisons mit dem Status "Laufend" angezeigt.',
      'Diverse Fehlerbehebungen im Zusammenhang mit Importen und State-Management in Admin-Seiten und RWK-Tabellen.',
      'Behebung eines "limit is not defined" Fehlers in RWK-Tabellen.',
      'Korrektur diverser "SelectItem value cannot be empty" Fehler in Admin-Dropdowns.',
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
      'Grundlegende Implementierung der Vereinsvertreter-Seiten mit Nutzung der `user_permissions`-Collection.',
    ],
  },
  {
    version: '0.0.2.0', 
    date: '20. Mai 2025',
    title: 'Benutzerverwaltung (Basis) & Cloud Function Deployment',
    descriptionPoints: [
      'Admin-Seite "/admin/user-management" überarbeitet: Super-Admin kann Berechtigungen (Rolle, bis zu 3 Vereine) für Benutzer (identifiziert durch UID) direkt in Firestore (`user_permissions`-Collection) speichern.',
      'Anleitung für manuelle Benutzeranlage in Firebase Auth und Rechtevergabe in der App auf der Benutzerverwaltungs-Seite hinzugefügt.',
      'Temporäre Umgehung von Cloud Functions für die Rechtevergabe; Fokus auf direkte Firestore-Operationen für den Admin.',
      'Platzhalter-Link "Benutzerverwaltung" im Admin-Layout aktiviert.',
      'Platzhalter-Sektion für "Statistiken" im Admin-Dashboard hinzugefügt.',
      'Firestore-Sicherheitsregeln angepasst, um Schreibzugriff auf `user_permissions` auf Super-Admin zu beschränken.',
      'Support-Ticket-System implementiert.',
      'Disziplin "SP" entfernt und Maximalringzahl für LG/LP-Disziplinen auf 400 korrigiert.',
      'Fehlerbehebungen in der Admin-Ergebnisbearbeitung und -erfassung.',
      'Seite `/admin/edit-results` ermöglicht Admins das Löschen von Ergebnissen.',
      'Verbesserung der Ergebniserfassung.',
      'Changelog-Datum korrigiert und Formatierungsfehler behoben.',
      'Firebase Cloud Function `setUserRoleAndClub` erfolgreich deployed.',
      'Behebung diverser UI- und Runtime-Fehler.',
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
                <CardDescription className="text-lg pt-1">{entry.title}</CardDescription>
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
              {index < changelogEntries.length - 1 && <Separator className="my-4"/>}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
