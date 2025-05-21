// src/app/updates/page.tsx
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { NewspaperIcon, TagIcon, CalendarDaysIcon, ListChecksIcon } from 'lucide-react';
import type { ChangelogEntry } from '@/types/updates';

// Changelog entries using MAJOR.MINOR.PATCH
const changelogEntries: ChangelogEntry[] = [
  {
    version: '0.2.4',
    date: '20. Mai 2025',
    title: 'Verbesserungen RWK-Tabellen & Stabilität',
    descriptionPoints: [
      'Fehler "Unexpected eof" in der RWK-Tabellenseite behoben.',
      'Layout und Funktionalität für das Aufklappen der Teamdetails (Anzeige der Einzelschützen) in den RWK-Mannschaftstabellen korrigiert und stabilisiert.',
      'Chevron-Icon für das Auf-/Einklappen der Teamdetails zeigt nun korrekt die Richtung an (Rechts/Runter).',
      'Allgemeine Code-Bereinigungen und Behebung kleinerer Fehler bei der Code-Generierung.',
    ],
  },
  {
    version: '0.2.3a',
    date: '20. Mai 2025', 
    title: 'Hotfix: Vercel Build-Fehler und Favicon',
    descriptionPoints: [
      'Behebung eines Vercel Build-Fehlers ("cn is not defined" und Icon-Import-Fehler) in der Admin-Dashboard-Seite durch Hinzufügen der fehlenden Imports.',
      'Favicon-Konfiguration in src/app/layout.tsx präzisiert.',
      'Handbuch-Seite: Admin-spezifischer Inhalt wird nun nur noch für eingeloggte Super-Admins angezeigt.',
      'Admin-Dashboard-Agenda aktualisiert.',
    ],
  },
  {
    version: '0.2.3',
    date: '20. Mai 2025',
    title: 'VV/MF Rollenunterscheidung & Layout-Zugriff',
    descriptionPoints: [
      'Korrektur im Vereins-Layout, sodass Mannschaftsführer korrekt auf das Vereins-Dashboard zugreifen können.',
      'UI-Anpassungen in den Vereins-Seiten (Mannschaften, Schützen), um Bearbeitungsfunktionen nur für Vereinsvertreter anzuzeigen.',
    ],
  },
  {
    version: '0.2.2',
    date: '20. Mai 2025',
    title: 'RWK Tabellen Jahresauswahl & Impressum',
    descriptionPoints: [
      'RWK-Tabellen (/rwk-tabellen): Jahresauswahl wird jetzt dynamisch aus den in Firestore vorhandenen Saisons generiert.',
      'RWK-Tabellen: Das aktuelle Kalenderjahr wird als Standard im Jahres-Dropdown vorausgewählt (falls "laufende" Saisons dafür existieren), ansonsten das neueste verfügbare Jahr.',
      'RWK-Tabellen: Es werden nur noch Saisons mit dem Status "Laufend" berücksichtigt und angezeigt.',
      'Impressumsseite (/impressum) mit den bereitgestellten Inhalten erstellt und im Footer verlinkt.',
    ],
  },
  {
    version: '0.2.1',
    date: '20. Mai 2025', 
    title: 'Fehlerbehebungen Admin Team-Dialog & VV-Rechtebasis',
    descriptionPoints: [
      'Hartnäckigen "SelectItem value cannot be empty" Fehler auf der Admin-Teamseite im Liga-Zuweisungsdialog behoben.',
      'Liga-Zuweisung im Admin-Team-Dialog wiederhergestellt und stabilisiert.',
      'Grundlage für Vereinsvertreter-Seiten (Mannschaften, Schützen, Ergebnisse) zur Nutzung der `user_permissions`-Collection (Firestore) anstelle der temporären Map gelegt.',
      'Vereinsvertreter-Seiten: Implementierung der Vereinsauswahl, falls VV mehreren Vereinen zugeordnet ist.',
    ],
  },
  {
    version: '0.2.0',
    date: '20. Mai 2025',
    title: 'Benutzerverwaltung Basis & Vorbereitung erweiterte Rechte',
    descriptionPoints: [
      'Admin-Seite `/admin/user-management` überarbeitet: Super-Admin weist Rolle und bis zu 3 Vereine über UID zu (Speicherung in Firestore `user_permissions`).',
      'Anleitung für manuelle Benutzeranlage in Firebase Auth und Rechtevergabe in der App auf der Benutzerverwaltungs-Seite hinzugefügt.',
      'Cloud Function `setUserRoleAndClub` (und verwandte) für zukünftige Custom Claims erfolgreich deployed (Blaze Plan Voraussetzung).',
      'Admin-Dashboard um Platzhalter für "Statistiken" und "Agenda" erweitert.',
    ],
  },
  {
    version: '0.1.9',
    date: '20. Mai 2025',
    title: 'UX Verbesserung Ergebniserfassung',
    descriptionPoints: [
      'Ergebniserfassungsseiten (Admin & Verein): Vorgemerkte Ergebnisse (`pendingScores`) bleiben nun auch bei einem Wechsel der Mannschaft in der Eingabeliste erhalten.',
      'Changelog-Datum für frühere Einträge korrigiert.',
    ],
  },
  {
    version: '0.1.8',
    date: '20. Mai 2025',
    title: 'Regeldurchsetzung Schützenzuordnung VV & Korrekturen',
    descriptionPoints: [
      'Regel "Ein Schütze pro Saison/Disziplinkategorie nur in einem Team" beim Neuanlegen von Schützen durch Vereinsvertreter implementiert.',
      'Korrektur der Geschlechterfilterung in der Einzelrangliste ("Bester Schütze" vs. "Beste Dame").',
      'Schützen verschwinden nun auch nach Speichern und Neuladen korrekt aus dem Dropdown der Ergebniserfassung.',
    ],
  },
  {
    version: '0.1.7',
    date: '20. Mai 2025',
    title: 'VV-Funktionen auf Firestore user_permissions umgestellt',
    descriptionPoints: [
      'Vereinsvertreter-Seiten (Dashboard, Basis für Mannschaften, Schützen, Ergebnisse) nutzen nun die `user_permissions`-Collection aus Firestore zur Rechteprüfung und Vereinszuweisung.',
      'Implementierung einer Vereinsauswahl für VVs, wenn ihnen mehrere Vereine zugewiesen sind (Basis).',
      '"Letzte Änderungen"-Feed: Gruppierung pro Liga und Tag implementiert, um Informationsflut zu reduzieren.',
    ],
  },
   {
    version: '0.1.6',
    date: '20. Mai 2025',
    title: '"Letzte Änderungen"-Feed & Support-Tickets',
    descriptionPoints: [
      'Neue Firestore-Collection `league_updates` für den "Letzte Änderungen"-Feed erstellt.',
      'Ergebniserfassung (Admin & Verein) erstellt/aktualisiert Einträge in `league_updates`.',
      'Startseite (`/`) zeigt die letzten Einträge aus `league_updates`, inklusive Disziplintyp und Jahr.',
      'Support-Seite: Formular speichert Anfragen nun in Firestore (`support_tickets`). Admin-Ansicht für Tickets erstellt.',
    ],
  },
   {
    version: '0.1.5',
    date: '20. Mai 2025',
    title: 'Ergebnisbearbeitung Admin & Ranglisten-Anzeige verfeinert',
    descriptionPoints: [
      'Admin Edit Results (/admin/edit-results): Vollständige Implementierung der Bearbeitungsfunktion für Ergebnisse (Ringzahl, Ergebnistyp) inklusive Speicherung der Änderungshistorie und Löschfunktion.',
      'RWK Tabellen: Anzeige für "Bester Schütze" (bester männlicher Teilnehmer) und "Beste Dame" (beste weibliche Teilnehmerin) getrennt und korrekt implementiert.',
      'Validierung für Ringzahlen (max. 300 für KK, max. 400 für LG/LP) in Ergebniserfassung und -bearbeitung.',
      'Disziplin "SP" (Sportpistole) aus dem System entfernt.',
    ],
  },
  {
    version: '0.1.4',
    date: '20. Mai 2025',
    title: 'Verbesserungen Ergebniserfassung & Einzelrangliste',
    descriptionPoints: [
      'Ergebniserfassung: Korrekte Speicherung von Schützen-, Team- und Liganamen in der `rwk_scores`-Datenbank sichergestellt.',
      'Ergebniserfassung: Schützen werden nun auch nach dem Neuladen der Seite korrekt aus dem Dropdown entfernt, wenn für den gewählten Durchgang bereits ein Ergebnis in der Datenbank existiert.',
    ],
  },
  {
    version: '0.1.3',
    date: '20. Mai 2025',
    title: 'Implementierung Ergebniserfassung (Speichern) & -bearbeitung (Basis)',
    descriptionPoints: [
      'Admin Results (/admin/results): Ergebnisse können erfasst und in Firestore (rwk_scores) gespeichert werden.',
      'Admin Edit Results (/admin/edit-results): Seite zum Suchen und (Basis-)Bearbeiten von erfassten Ergebnissen hinzugefügt.',
      'Logik für "Letzte Änderungen"-Feed vorbereitet.',
    ],
  },
  {
    version: '0.1.2', 
    date: '20. Mai 2025',
    title: 'Dynamische Jahresauswahl RWK-Tabellen & Impressum',
    descriptionPoints: [
      'RWK-Tabellen (/rwk-tabellen): Jahresauswahl wird jetzt dynamisch aus den in Firestore vorhandenen Saisons generiert.',
      'RWK-Tabellen: Das aktuelle Kalenderjahr wird als Standard im Jahres-Dropdown vorausgewählt (falls "laufende" Saisons dafür existieren).',
      'RWK-Tabellen: Es werden nur noch Saisons mit dem Status "Laufend" berücksichtigt und angezeigt.',
      'Impressumsseite (/impressum) mit den bereitgestellten Inhalten erstellt und im Footer verlinkt.',
    ],
  },
  {
    version: '0.1.1',
    date: '20. Mai 2025',
    title: 'Korrektur Schützenzuordnung & Datenintegrität',
    descriptionPoints: [
      'Behebung von "No document to update"-Fehlern bei der Mannschaftsbearbeitung.',
      'Korrektur des Zählers für ausgewählte Schützen im Mannschafts-Bearbeiten-Dialog.',
      'Sicherstellung der Datenkonsistenz bei der Zuordnung von Schützen zu Teams (beidseitige Verknüpfung).',
      'Regel "Maximal 3 Schützen pro Team" und "Ein Schütze pro Saison/Disziplinkategorie nur in einem Team" implementiert und korrigiert.',
    ],
  },
  {
    version: '0.1.0',
    date: '19. Mai 2025',
    title: 'Umstellung Versionierung & Admin Stammdaten mit DB-Anbindung',
    descriptionPoints: [
      'Versionierung auf MAJOR.MINOR.PATCH umgestellt.',
      'Admin Vereinsverwaltung (/admin/clubs): CRUD-Funktionen mit Firestore-Anbindung.',
      'Admin Saisonverwaltung (/admin/seasons): CRUD-Funktionen mit Firestore-Anbindung.',
      'Admin Ligaverwaltung (/admin/leagues): CRUD-Funktionen, Zuordnung zu Saisons.',
      'Admin Mannschaftsverwaltung (/admin/teams): Datenbankanbindung, Zuordnung.',
      'Admin Schützenverwaltung (/admin/shooters): Datenbankanbindung, Zuordnung.',
      'Basis für Vereinsvertreter-Bereich geschaffen.',
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
