// src/app/updates/page.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { NewspaperIcon, TagIcon, CalendarDaysIcon, ListChecksIcon } from 'lucide-react';
import type { ChangelogEntry } from '@/types/updates';

// Changelog entries using MAJOR.MINOR.PATCH
const changelogEntries: ChangelogEntry[] = [
  {
    version: '0.3.0',
    date: '22. Mai 2025',
    title: 'Verbesserung RWK-Tabellen & Stabilität',
    descriptionPoints: [
      'RWK-Tabellen: Die Seite verarbeitet nun URL-Parameter, um direkt eine spezifische Liga anzuzeigen (z.B. bei Klick auf Links von der Startseite).',
      'RWK-Tabellen: Ligen-Akkordeons sind jetzt standardmäßig geöffnet für eine bessere Übersicht.',
      'RWK-Tabellen: Einzelschützen in der aufgeklappten Mannschafts-Detailansicht sind jetzt klickbar und öffnen den Statistik-Dialog.',
      'Diverse Fehlerbehebungen im Zusammenhang mit der Seiten-Struktur und Komponenten-Importen, die zu Build-Fehlern oder Laufzeitfehlern führten.',
      'Handbuch und Admin-Agenda aktualisiert.',
    ],
  },
  {
    version: '0.2.6a',
    date: '22. Mai 2025',
    title: 'Hotfix: Build-Fehler & Handbuch-Anzeige',
    descriptionPoints: [
      'Behebung eines Build-Fehlers auf Vercel (`cn is not defined` und Icon-Importe in `/admin/page.tsx`).',
      'Korrektur der Handbuch-Seite (`/app/handbuch/page.tsx`) zur korrekten, bedingten Anzeige von Admin-Inhalten und Behebung von Parsing-Fehlern.',
      'Favicon-Konfiguration in `layout.tsx` präzisiert.',
    ],
  },
  {
    version: '0.2.5',
    date: '22. Mai 2025', // Korrigiertes Datum
    title: 'Verfeinerung Firestore-Regeln & Rollen-UI für VV/MF',
    descriptionPoints: [
      'Firestore-Sicherheitsregeln überarbeitet und syntaktisch korrigiert, um Zugriffsrechte für Super-Admin, Vereinsvertreter und Mannschaftsführer basierend auf der `user_permissions`-Collection besser zu definieren.',
      'Benutzeroberfläche für Vereinsvertreter und Mannschaftsführer angepasst: Bearbeitungs-Buttons für Mannschaften und Schützen sind nun nur für Nutzer mit der Rolle "vereinsvertreter" sichtbar.',
      'Zugriff auf das Vereins-Dashboard für Nutzer mit Rolle "mannschaftsfuehrer" korrigiert.',
      'Handbuch und Agenda im Admin-Panel aktualisiert, um die neue Rollenlogik und die nächsten Schritte widerzuspiegeln.',
    ],
  },
  {
    version: '0.2.4',
    date: '22. Mai 2025',
    title: 'Zentralisierung Benutzerberechtigungen & UI-Fixes',
    descriptionPoints: [
      'Benutzerberechtigungen (Rolle, Vereinszuweisung) werden nun zentral im `AuthProvider` geladen und über einen Context (`VereinContext`) an die Vereinsvertreter-Seiten weitergegeben.',
      'Die `VV_CLUB_ASSIGNMENTS`-Map wurde aus den Vereinsvertreter-Seiten entfernt.',
      'Anzeige der Benutzerrolle im Vereins-Dashboard implementiert.',
      'Diverse Fehlerbehebungen im `VereinLayout` bezüglich der Hook-Reihenfolge und der Prop-Weitergabe.',
      'Import-Fehler für `AlertDialog`-Komponenten auf verschiedenen Seiten behoben.',
      'Layout-Korrekturen in den Dialogen der Vereinsvertreter-Schützenverwaltung.',
      'Korrektur der Jahresauswahl-Logik in den RWK-Tabellen.',
    ],
  },
  {
    version: '0.2.3a',
    date: '21. Mai 2025',
    title: 'Hotfix: Vercel Build & Favicon',
    descriptionPoints: [
      'Behebung eines Vercel Build-Fehlers ("cn is not defined" und Icon-Import-Fehler) in der Admin-Dashboard-Seite.',
      'Favicon-Konfiguration in `layout.tsx` präzisiert.',
      'Handbuch-Seite: Admin-Abschnitt nur für Super-Admin sichtbar gemacht; diverse Parsing-Fehler behoben.',
    ],
  },
  {
    version: '0.2.2',
    date: '21. Mai 2025',
    title: 'RWK Tabellen Jahresauswahl & Impressum',
    descriptionPoints: [
      'RWK-Tabellen: Jahresauswahl wird jetzt dynamisch aus den in Firestore vorhandenen Saisons generiert. Standardmäßig wird das aktuellste Jahr mit "Laufenden" Saisons ausgewählt (oder das letzte verfügbare Jahr).',
      'Filterung der RWK-Tabellen, sodass nur Saisons mit Status "Laufend" angezeigt werden.',
      'Impressumsseite (`/impressum`) mit Inhalten gefüllt und im Footer verlinkt.',
    ],
  },
  {
    version: '0.2.1',
    date: '21. Mai 2025',
    title: 'VV-Seiten auf user_permissions umgestellt (Basis)',
    descriptionPoints: [
      'Vereinsvertreter-Seiten (Dashboard, Mannschaften, Schützen, Ergebnisse) nutzen die `user_permissions`-Collection in Firestore zur Rechteprüfung und Vereinszuweisung (Einzel-Club-Modell).',
      'Entfernung der temporären `VV_CLUB_ASSIGNMENTS`-Map.',
      'Diverse Fehlerbehebungen im Zusammenhang mit `SelectItem`-Komponenten und Importen.',
      'Anpassung der `firestore.rules` für `user_permissions`.',
    ],
  },
  {
    version: '0.2.0',
    date: '20. Mai 2025', 
    title: 'Benutzerverwaltung (Admin UI) & Vorbereitung für Custom Claims',
    descriptionPoints: [
      'Admin-Seite `/admin/user-management` überarbeitet: UID-basierte Zuweisung von Rolle/Verein(en) in `user_permissions` (Firestore-Direktschreibvorgang, keine Cloud Function mehr für diesen Teil). Möglichkeit, bis zu 3 Vereine zuzuweisen.',
      'Platzhalter für Cloud Function-basierte Benutzererstellung durch Admin (noch nicht aktiv).',
      'Admin-Dashboard um Platzhalter für "Statistiken" und aktualisierte Agenda erweitert.',
      'Support-Ticket-System: Formular speichert Tickets in Firestore, Admin-Ansicht `/admin/support-tickets` zeigt diese an und erlaubt Statusänderung.',
    ],
  },
  {
    version: '0.1.9',
    date: '20. Mai 2025',
    title: 'Verbesserung Ergebniserfassung & Startseiten-Feed',
    descriptionPoints: [
      'Ergebniserfassungsseiten: Vorgemerkte Ergebnisse bleiben bei Teamwechsel erhalten.',
      'Feed "Letzte Änderungen" auf Startseite gruppiert Einträge nun pro Liga, Tag und Disziplin, um Duplikate zu vermeiden.',
       'Validierung von Ringzahlen (max. 300/400) beim Erfassen und Bearbeiten von Ergebnissen.',
      'Disziplin "SP" aus Typdefinitionen und Auswahl entfernt.',
    ],
  },
  {
    version: '0.1.8',
    date: '20. Mai 2025',
    title: 'Regelkonsistenz & Fehlerbehebungen',
    descriptionPoints: [
      'Regel "Ein Schütze pro Saison/Disziplinkategorie nur in einem Team" auch beim Neuanlegen von Schützen durch Vereinsvertreter implementiert.',
      'Diverse Fehlerbehebungen in Admin- und Vereinsvertreter-Seiten (Zähler, `SelectItem`-Werte, Endlosschleifen, Layout-Probleme).',
      'Korrektur der Geschlechterfilterung in der Einzelrangliste.',
      'Schützen verschwinden nach Speichern von Ergebnissen korrekt aus dem Dropdown in der Ergebniserfassung.',
    ],
  },
    {
    version: '0.1.7',
    date: '20. Mai 2025',
    title: 'VV-Funktionen auf user_permissions umgestellt (Einzelverein)',
    descriptionPoints: [
      'Vereinsvertreter-Seiten (Dashboard, Mannschaften, Schützen, Ergebnisse) nutzen die `user_permissions`-Collection in Firestore zur Rechteprüfung und Vereinszuweisung (Einzel-Club-Modell).',
      'Entfernung der temporären `VV_CLUB_ASSIGNMENTS`-Map.',
      'Korrektur diverser `SelectItem`-Fehler und Import-Fehler.',
    ],
  },
  {
    version: '0.1.6',
    date: '20. Mai 2025',
    title: '"Letzte Änderungen"-Feed & Support-System (Basis)',
    descriptionPoints: [
      'Startseite (`/`) zeigt "Letzte Ergebnis-Updates" aus `league_updates`-Collection, inklusive Disziplintyp und Jahr.',
      'Support-Seite (`/support`) mit Formular und Speicherfunktion in Firestore für Tickets.',
      'Admin-Seite (`/admin/support-tickets`) zur Anzeige eingegangener Tickets.',
    ],
  },
  {
    version: '0.1.5',
    date: '20. Mai 2025',
    title: 'Ergebnisbearbeitung Admin & RWK-Tabellen Verfeinerung',
    descriptionPoints: [
      'Admin Edit Results (`/admin/edit-results`): Vollständige Implementierung der Bearbeitungsfunktion für Ergebnisse mit Historie und Löschfunktion.',
      'RWK Tabellen: Anzeige für "Bester Schütze" und "Beste Dame" getrennt und korrekt implementiert.',
      'Validierung von Ringzahlen (max. 300/400) bei Ergebniserfassung und -bearbeitung.',
    ],
  },
   {
    version: '0.1.4',
    date: '20. Mai 2025',
    title: 'Ergebniserfassung: Namensspeicherung & UI-Verbesserung',
    descriptionPoints: [
      'Sicherstellung der korrekten Speicherung von Schützen- und Teamnamen in `rwk_scores`.',
      'Schützen verschwinden nach Erfassung/Speichern für einen Durchgang korrekt aus dem Dropdown (auch nach Neuladen).',
    ],
  },
  {
    version: '0.1.3',
    date: '20. Mai 2025',
    title: 'Admin Ergebniserfassung: Speicherfunktion & UI-Verbesserungen',
    descriptionPoints: [
      'Implementierung der Speicherfunktion für Ergebnisse in `/admin/results`.',
      'Zwischenspeicher für Ergebnisse mit Kontrollmöglichkeit vor dem endgültigen Speichern.',
      'Schütze verschwindet nach Hinzufügen zur Liste aus Dropdown für den aktuellen Durchgang.',
    ],
  },
  {
    version: '0.1.1', 
    date: '20. Mai 2025',
    title: 'Admin-Stammdaten: Logik-Fixes & Konsistenz',
    descriptionPoints: [
      'Behebung von Zählerproblemen bei der Schützenzuweisung zu Mannschaften.',
      'Korrektur des Fehlers "No document to update" beim Speichern von Team-Schützen-Zuweisungen.',
      'Vereinfachung der Vereinszuweisung für VVs auf einen einzelnen Verein in `user_permissions`.',
    ],
  },
  {
    version: '0.1.0',
    date: '20. Mai 2025',
    title: 'Admin-Funktionen erweitert & Regelimplementierung',
    descriptionPoints: [
      'Admin-Mannschaftsverwaltung: Ligazuweisung und erweiterte Filter implementiert.',
      'Regel "Maximal 3 Schützen pro Mannschaft" in Admin- und VV-Seiten durchgesetzt.',
      'Vorbereitung für Rolle "Mannschaftsführer" in Typen und Admin-Benutzerverwaltung.',
       'Vereinsverwaltung mit CRUD und Validierung implementiert.',
    ],
  },
  {
    version: '0.0.2a',
    date: '20. Mai 2025',
    title: 'Hotfix: Vercel Build & Favicon',
    descriptionPoints: [
      'Behebung von Build-Fehlern auf Vercel (Icon-Importe, `cn is not defined`).',
      'Favicon-Konfiguration in `layout.tsx` präzisiert.',
      'Handbuch-Seite: Admin-Abschnitt nur für Super-Admin sichtbar gemacht.',
    ],
  },
  {
    version: '0.0.1.9',
    date: '20. Mai 2025',
    title: 'Admin-Bereich: Stammdaten-CRUD & Regeln (Basis)',
    descriptionPoints: [
      'Admin-Seiten für Vereine, Saisons, Ligen mit DB-Anbindung (Anlegen, Lesen, Bearbeiten, Löschen).',
      'Admin-Seite für Mannschaften: DB-Anbindung, Schützenzuweisung (max. 3 Regel).',
      'Admin-Seite für Schützen: DB-Anbindung, Regel "1 Schütze pro Disziplin/Jahr".',
      'Agenda im Admin-Dashboard aktualisiert.',
      'Hinweis zur Mannschaftsstärke in Dialogen hinzugefügt.',
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
