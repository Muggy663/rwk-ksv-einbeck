// src/app/updates/page.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { NewspaperIcon, TagIcon, CalendarDaysIcon, ListChecksIcon, CheckCircle } from 'lucide-react';
import type { ChangelogEntry } from '@/types/updates';

// Changelog entries using MAJOR.MINOR.PATCH
const changelogEntries: ChangelogEntry[] = [
  {
    version: '0.2.5',
    date: '21. Mai 2025',
    title: 'Verbesserungen Admin-Dashboard, Handbuch & Vorbereitung VV-Rechtesystem',
    descriptionPoints: [
      'Handbuch-Seite (/handbuch) implementiert und über Hauptnavigation verlinkt; Admin-spezifische Inhalte werden nur für Super-Admin angezeigt.',
      'Agenda im Admin-Dashboard (/admin/page) aktualisiert.',
      'Korrektur des Vercel Build-Fehlers "ShieldCheck is not defined" und "cn is not defined" durch korrekte Icon- und Utility-Importe im Admin-Dashboard.',
      'Korrektur des Vercel Build-Fehlers "useSearchParams() should be wrapped in a suspense boundary" auf der RWK-Tabellen-Seite.',
      'Korrektur des Vercel Build-Fehlers "Unexpected eof" (durch fehlerhafte Code-Generierung) auf der RWK-Tabellen-Seite.',
      'Logik für Aufklappen der Team-Details in RWK-Tabellen mit wechselndem Chevron-Icon verbessert.',
      'Feedback des Präsidenten (Verlinkung Newsfeed, Icons) in Agenda aufgenommen.',
    ],
  },
  {
    version: '0.2.4',
    date: '20. Mai 2025',
    title: 'Stabiles Deployment & Fehlerbehebungen RWK-Tabellen',
    descriptionPoints: [
      'Erfolgreiches Deployment auf Vercel nach Behebung diverser Build-Fehler (Icon-Importe, `useSearchParams` mit Suspense, EOF-Marker).',
      'RWK-Tabellen: Korrekte Anzeige der aufgeklappten Team-Details und funktionierende Chevron-Icons zum Ein-/Ausklappen.',
      'Vorbereitung der Handbuch-Integration.',
    ],
  },
  {
    version: '0.2.3a',
    date: '20. Mai 2025',
    title: 'Hotfix: Vercel Build-Fehler (cn, Icons) & Favicon',
    descriptionPoints: [
      'Behebung eines Vercel Build-Fehlers ("cn is not defined" und Icon-Import-Fehler) in der Admin-Dashboard-Seite durch Hinzufügen der fehlenden Imports.',
      'Favicon-Konfiguration in src/app/layout.tsx präzisiert und auf /favicon.ico im public Ordner verwiesen.',
      'Firestore Sicherheitsregeln überarbeitet und Syntaxfehler korrigiert.',
      'Handbuch-Seite: Admin-spezifischer Inhalt wird nun nur noch für eingeloggte Super-Admins angezeigt (Basis-Implementierung).',
      'Admin-Dashboard-Agenda aktualisiert.',
    ],
  },
  {
    version: '0.2.2',
    date: '20. Mai 2025',
    title: 'Dynamische Jahresauswahl RWK-Tabellen & Impressum',
    descriptionPoints: [
      'RWK-Tabellen (/rwk-tabellen): Jahresauswahl wird jetzt dynamisch aus den in Firestore vorhandenen Saisons generiert. Standardmäßig wird das aktuellste Jahr mit "Laufenden" Saisons ausgewählt (oder das aktuelle Kalenderjahr). Es werden nur Saisons mit Status "Laufend" für die Tabellen herangezogen.',
      'Impressumsseite (/impressum) mit den vom Benutzer bereitgestellten Inhalten gefüllt und im Footer verlinkt.',
      'Korrektur diverser kleinerer Fehler und Code-Bereinigungen.',
    ],
  },
   {
    version: '0.2.1',
    date: '20. Mai 2025',
    title: 'VV-Seiten auf Firestore user_permissions umgestellt',
    descriptionPoints: [
      'Vereinsvertreter-Seiten (/app/verein/...) nutzen nun die `user_permissions`-Collection in Firestore zur Rechteprüfung und Vereinszuweisung (ersetzt die temporäre `VV_CLUB_ASSIGNMENTS`-Map).',
      'Implementierung der Vereinsauswahl für VVs mit mehreren Vereinen auf den Seiten für Mannschafts-, Schützenverwaltung und Ergebniserfassung.',
      'Korrektur von `SelectItem`-Fehlern und Import-Problemen auf diversen Admin- und VV-Seiten.',
      'Behebung des Fehlers "AlertDialogTitle is not defined" durch korrekte Imports.',
      'Korrektur eines Fehlers, bei dem die Mannschaftsseite für VVs nicht navigierbar war.',
    ],
  },
  {
    version: '0.2.0',
    date: '20. Mai 2025',
    title: 'Benutzerverwaltung Basis (Custom Claims Vorbereitung) & Admin-Erweiterungen',
    descriptionPoints: [
      'Benutzerverwaltung (/admin/user-management): UI zur Zuweisung von Rolle/Vereinen zu Benutzern (per UID, Speicherung in Firestore `user_permissions`). Cloud Function `setUserRoleAndClub` für Custom Claims erfolgreich deployt (Blaze-Plan benötigt).',
      'Agenda und Statistik-Platzhalter im Admin-Dashboard ergänzt.',
      'Support-Ticket-System: Basis-Speicherung in Firestore und Admin-Ansicht implementiert (ohne Status-Management).',
      'Firestore-Sicherheitsregeln angepasst (Basis für VV/MF-Rollen).',
      'Fehlerbehebungen bei der Ergebniserfassung (korrekte Namensspeicherung, Ausblenden erfasster Schützen).',
      "Unterscheidung 'Bester Schütze' / 'Beste Dame' in RWK-Tabellen präzisiert.",
      "'Letzte Änderungen'-Feed auf Startseite um Disziplintyp erweitert.",
    ],
  },
  // Ältere Einträge bleiben hier...
  {
    version: '0.1.9',
    date: '20. Mai 2025',
    title: 'UX Verbesserung Ergebniserfassung & Regel-Implementierung',
    descriptionPoints: [
      'Ergebniserfassungsseiten: Vorgemerkte Ergebnisse bleiben bei Teamwechsel erhalten.',
      'Regel "Ein Schütze pro Saison/Disziplinkategorie nur einem Team" auf Admin-Teamseite und VV-Schützen-Anlegen-Seite implementiert.',
      'Behebung der Zähleranzeige für Schützen in Teams.',
      'Versionsnummerierung auf X.Y.Z umgestellt.',
    ],
  },
  {
    version: '0.1.8',
    date: '20. Mai 2025',
    title: 'VV Schützenverwaltung & Regel-Finalisierung',
    descriptionPoints: [
      'Schützenverwaltung für Vereinsvertreter (`/app/verein/schuetzen`) implementiert (basierend auf `user_permissions`).',
      'Regel "Ein Schütze pro Saison/Disziplinkategorie nur einem Team" für VV Schützen anlegen vervollständigt.',
      'Diverse Fehlerbehebungen und UI-Verbesserungen.',
    ],
  },
  {
    version: '0.1.7',
    date: '20. Mai 2025',
    title: 'VV Ergebniserfassung & Fehlerbehebungen',
    descriptionPoints: [
      'Ergebniserfassung für Vereinsvertreter (`/app/verein/ergebnisse`) implementiert (basierend auf `user_permissions` und offener Ligaauswahl).',
      'Korrektur der Liga-Auswahl für VVs in der Ergebniserfassung.',
      'Behebung diverser `SelectItem` und Import-Fehler.',
    ],
  },
  {
    version: '0.1.6',
    date: '20. Mai 2025',
    title: '"Letzte Änderungen"-Feed & Support-System (Basis)',
    descriptionPoints: [
      'Startseite (`/`) zeigt "Letzte Ergebnis-Updates" aus `league_updates`-Collection, inklusive Disziplintyp und Jahr. Einträge pro Liga/Tag gruppiert.',
      'Support-Seite (`/support`) speichert Anfragen in Firestore-Collection `support_tickets`. Formular-UI verbessert.',
      'Admin-Seite (`/admin/support-tickets`) zur Anzeige eingegangener Tickets erstellt.',
      'Captcha-Platzhalter auf Login-Seite hinzugefügt.',
    ],
  },
  {
    version: '0.1.5',
    date: '20. Mai 2025',
    title: 'Ergebnisbearbeitung Admin & RWK-Tabellen Verfeinerung',
    descriptionPoints: [
      'Admin Edit Results (`/admin/edit-results`): Vollständige Implementierung der Bearbeitungs- und Löschfunktion für Ergebnisse mit Historie.',
      'RWK Tabellen: Anzeige für "Bester Schütze" (bester männlicher Teilnehmer) und "Beste Dame" (beste weibliche Teilnehmerin) getrennt und korrekt implementiert.',
      'Validierung für Ringzahlen (max. 300 für KK, max. 400 für LG/LP) in Ergebniserfassung und -bearbeitung.',
      'Disziplin "SP" (Sportpistole) aus dem System entfernt.',
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
