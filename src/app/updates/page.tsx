// src/app/updates/page.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { NewspaperIcon, TagIcon, CalendarDaysIcon, ListChecksIcon } from 'lucide-react';
import type { ChangelogEntry } from '@/types/updates';

// Changelog entries using MAJOR.MINOR.PATCH
const changelogEntries: ChangelogEntry[] = [
  {
    version: '0.2.6',
    date: '22. Mai 2025',
    title: 'Stabilisierung Vereinsvertreter-Funktionen & Fehlerbehebungen',
    descriptionPoints: [
      'Fehlerbehebung: Importfehler (`firebase-functions/logger`) in Vereinsvertreter-Ergebnisseite behoben.',
      'Fehlerbehebung: Korrekte Verwendung der `assignedClubId` aus dem `VereinContext` in allen Vereinsvertreter-Seiten sichergestellt.',
      'Fehlerbehebung: Diverse `SelectItem`-Fehler durch striktere Filterung und korrekte `value`-Zuweisung behoben.',
      'Fehlerbehebung: `AlertDialog`-Importfehler in Vereinsvertreter-Seiten korrigiert.',
      'Stabilität der Vereinsvertreter-Seiten (Mannschaften, Schützen, Ergebnisse) nach Umstellung auf `user_permissions` verbessert.',
      'Handbuch und Agenda-Punkte im Admin-Dashboard aktualisiert.',
      'Klickbare Schützennamen in der Mannschafts-Detailansicht (RWK-Tabellen) für Statistik-Dialog implementiert.',
      'Ligen-Akkordeons in RWK-Tabellen sind nun standardmäßig geöffnet.',
    ],
  },
  {
    version: '0.2.5',
    date: '21. Mai 2025',
    title: 'Verfeinerung Firestore Sicherheitsregeln & Rollen-UI',
    descriptionPoints: [
      'Firestore-Sicherheitsregeln überarbeitet und korrigiert, um Berechtigungen für Super-Admin, Vereinsvertreter und Mannschaftsführer basierend auf der `user_permissions`-Collection (mit `clubIds` als Map) serverseitig durchzusetzen.',
      'Client-seitige UI in den Vereinsvertreter-Seiten (`/app/verein/mannschaften`, `/app/verein/schuetzen`) angepasst, um Bearbeitungsfunktionen nur für die Rolle "vereinsvertreter" anzuzeigen.',
      'Dashboard-Zugriff für Rolle "mannschaftsfuehrer" im Vereins-Layout korrigiert.',
      'Handbuch und Agenda im Admin-Panel aktualisiert.',
    ],
  },
  {
    version: '0.2.4',
    date: '21. Mai 2025',
    title: 'Behebung Vercel Build-Fehler & Stabilisierung',
    descriptionPoints: [
      'Behebung des "authLoading is not defined" Fehlers in `MainNav.tsx`.',
      'Korrektur des `VereinLayout`, um Super-Admin korrekt zum Admin-Dashboard weiterzuleiten und Zugriffsprobleme für VVs zu beheben.',
      'Korrektur des `APP`-Ordner-Problems durch Sicherstellung korrekter Dateipfade für Vereinsvertreter-Seiten (alle unter `src/app/verein/`).',
      'Behebung des "useSearchParams() should be wrapped in a suspense boundary" Fehlers auf der RWK-Tabellen-Seite durch Hinzufügen von `"use client";` und `<Suspense>`.',
      'Behebung diverser "Unexpected eof" Parsing-Fehler durch Entfernen von Markdown-Resten in .tsx Dateien.',
      'Behebung des "Link is not defined" Fehlers auf der RWK-Tabellenseite.',
    ],
  },
  {
    version: '0.2.3a',
    date: '21. Mai 2025',
    title: 'Hotfix: Vercel Build-Fehler & Favicon',
    descriptionPoints: [
      'Behebung eines Vercel Build-Fehlers ("cn is not defined" und Icon-Import-Fehler) in der Admin-Dashboard-Seite.',
      'Favicon-Konfiguration in `layout.tsx` präzisiert.',
      'Handbuch-Seite: Admin-Abschnitt nur für Super-Admin sichtbar gemacht; diverse Parsing-Fehler behoben.',
    ],
  },
  {
    version: '0.2.3',
    date: '21. Mai 2025',
    title: 'Rollenbasierte UI & Dashboard-Zugriff für MF korrigiert',
    descriptionPoints: [
      'Dashboard-Zugriff für Rolle "mannschaftsfuehrer" im Vereins-Layout korrigiert.',
      'UI-Anpassungen für Vereinsvertreter und Mannschaftsführer (Buttons ein-/ausblenden) vorbereitet.',
      'Handbuch und Agenda aktualisiert.',
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
    title: 'VV-Seiten auf user_permissions umgestellt',
    descriptionPoints: [
      'Vereinsvertreter-Seiten (Dashboard, Mannschaften, Schützen, Ergebnisse) nutzen die `user_permissions`-Collection in Firestore zur Rechteprüfung und Vereinszuweisung (Einzel-Club-Modell).',
      'Entfernung der temporären `VV_CLUB_ASSIGNMENTS`-Map.',
      'Diverse Fehlerbehebungen im Zusammenhang mit `SelectItem`-Komponenten und Importen.',
    ],
  },
  {
    version: '0.2.0',
    date: '20. Mai 2025',
    title: 'Benutzerverwaltung (Basis) & Vorbereitung für Custom Claims',
    descriptionPoints: [
      'Seite `/admin/user-management` überarbeitet: UID-basierte Zuweisung von Rolle/Vereinen in `user_permissions` (Firestore-Direktschreibvorgang).',
      'Cloud Functions für `setUserRoleAndClub`, `getUserDetailsByEmail` und `getUsersWithoutRole` vorbereitet und erfolgreich deployed (Blaze-Plan Voraussetzung).',
      'Client-Funktionen zum Aufrufen dieser Cloud Functions in `lib/firebase/functions.ts` erstellt.',
      'Admin-Dashboard um Platzhalter für "Statistiken" und aktualisierte Agenda erweitert.',
      'Support-Ticket-System: Formular speichert Tickets in Firestore, Admin-Ansicht `/admin/support-tickets` zeigt diese an.',
    ],
  },
  {
    version: '0.1.9',
    date: '20. Mai 2025',
    title: 'Verbesserung Ergebniserfassung',
    descriptionPoints: [
      'Ergebniserfassungsseiten: Vorgemerkte Ergebnisse bleiben bei Teamwechsel erhalten.',
      'Feed "Letzte Änderungen" auf Startseite gruppiert Einträge nun pro Liga und Tag, um Duplikate zu vermeiden.',
    ],
  },
  {
    version: '0.1.8',
    date: '20. Mai 2025',
    title: 'Regelkonsistenz & Fehlerbehebungen',
    descriptionPoints: [
      'Regel "Ein Schütze pro Saison/Disziplinkategorie nur in einem Team" auch beim Neuanlegen von Schützen durch Vereinsvertreter implementiert.',
      'Diverse Fehlerbehebungen in Admin- und Vereinsvertreter-Seiten (Zähler, `SelectItem`-Werte, Endlosschleifen).',
    ],
  },
  {
    version: '0.1.7',
    date: '20. Mai 2025',
    title: 'VV-Funktionen auf user_permissions umgestellt (Basis)',
    descriptionPoints: [
      'Vereinsvertreter-Dashboard und -Mannschaftsverwaltung nutzen `user_permissions` für die Vereinszuweisung.',
      'Korrektur von `AlertDialogFooter` Import-Fehlern.',
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
      'Platzhalter für Captcha auf Login-Seite hinzugefügt.',
    ],
  },
  {
    version: '0.1.5',
    date: '20. Mai 2025',
    title: 'Ergebnisbearbeitung Admin & RWK-Tabellen Verfeinerung',
    descriptionPoints: [
      'Admin Edit Results (`/admin/edit-results`): Vollständige Implementierung der Bearbeitungsfunktion für Ergebnisse mit Historie und Löschfunktion.',
      'RWK Tabellen: Anzeige für "Bester Schütze" und "Beste Dame" getrennt und korrekt implementiert.',
      'Validierung von Ringzahlen (max. 300/400) bei Ergebniserfassung und -bearbeitung; Disziplin "SP" entfernt.',
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
    version: '0.1.1', // Korrigierte Nummerierung, war vorher 0.2.0 falsch
    date: '20. Mai 2025',
    title: 'Admin-Stammdaten: Logik-Fixes & Konsistenz',
    descriptionPoints: [
      'Behebung von Zählerproblemen bei der Schützenzuweisung zu Mannschaften.',
      'Korrektur des Fehlers "No document to update" beim Speichern von Team-Schützen-Zuweisungen.',
      'Vereinfachung der Vereinszuweisung für VVs auf einen einzelnen Verein.',
    ],
  },
  {
    version: '0.1.0', // Korrigierte Nummerierung, war vorher 0.0.2.0
    date: '20. Mai 2025',
    title: 'Admin-Funktionen erweitert & Regelimplementierung',
    descriptionPoints: [
      'Admin-Mannschaftsverwaltung: Ligazuweisung und erweiterte Filter implementiert.',
      'Regel "Maximal 3 Schützen pro Mannschaft" in Admin- und VV-Seiten durchgesetzt.',
      'Vorbereitung für Rolle "Mannschaftsführer" in Typen und Admin-Benutzerverwaltung.',
    ],
  },
  {
    version: '0.0.2a', // Ältere Versionen behalten ihre vierstellige Nummer
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
  {
    version: '0.0.1.0', // Ältere Versionen behalten ihre vierstellige Nummer
    date: '20. Mai 2025',
    title: 'Vereinsverwaltung Implementiert',
    descriptionPoints: [
      'Admin-Seite für Vereinsverwaltung (`/admin/clubs`) mit Firestore verbunden (CRUD).',
      'Prüfung auf doppelte Vereinsnamen.',
      'Vereinsnummer-Feld hinzugefügt und Sortierung angepasst.',
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
