// src/app/updates/page.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Newspaper, Tag, CalendarDays, ListChecks } from 'lucide-react'; // Korrigierte Icon-Namen
import type { ChangelogEntry } from '@/types/updates';

// Changelog entries using MAJOR.MINOR.PATCH
const changelogEntries: ChangelogEntry[] = [
  {
    version: '0.3.0',
    date: '22. Mai 2025',
    title: 'RWK Tabellen Optimierung & Vorbereitung nächste Schritte',
    descriptionPoints: [
      'RWK Tabellen: Ligen-Akkordeons sind nun standardmäßig geöffnet für bessere Übersicht.',
      'RWK Tabellen: Einzelschützen in der aufgeklappten Mannschafts-Detailansicht sind jetzt klickbar und öffnen den Statistik-Dialog.',
      'RWK Tabellen: Fehlerhafte Anzeige von Standardjahren und Filterung nach "Laufend"-Status korrigiert.',
      'RWK Tabellen: Verarbeitung von URL-Query-Parametern (von Startseiten-Feed) implementiert, um Ligen direkt anzuzeigen (Zielseite muss noch angepasst werden, um Parameter zu nutzen).',
      'Handbuch: Umfassend aktualisiert (Rollen, VV-Funktionen, technische Begriffe reduziert).',
      'Admin-Dashboard: Agenda aktualisiert und für zukünftige Versionen strukturiert.',
      'Diverse Fehlerbehebungen (z.B. EOF-Fehler, Import-Fehler, Layout-Korrekturen).',
    ],
  },
  {
    version: '0.2.6a',
    date: '22. Mai 2025',
    title: 'Hotfix: Handbuch Syntax & Admin-Icon Fehler',
    descriptionPoints: [
        'Behebung eines Syntaxfehlers in der Handbuch-Seite, der den Vercel-Build blockierte.',
        'Korrektur fehlender Icon-Importe auf der Admin-Dashboard-Seite.',
        'Favicon-Konfiguration in Root-Layout präzisiert.',
    ],
  },
  {
    version: '0.2.5',
    date: '22. Mai 2025',
    title: 'Firestore Sicherheitsregeln & VV UI-Rechte',
    descriptionPoints: [
      'Firestore-Sicherheitsregeln implementiert und veröffentlicht, um Zugriffsrechte für Super-Admin, Vereinsvertreter und Mannschaftsführer zu definieren (basierend auf user_permissions).',
      'Benutzeroberfläche für Vereinsvertreter und Mannschaftsführer angepasst: Bearbeitungs-Buttons für Mannschaften und Schützen sind nun nur für Nutzer mit der Rolle "vereinsvertreter" sichtbar.',
      'Zugriff auf das Vereins-Dashboard für Mannschaftsführer korrigiert.',
    ],
  },
  {
    version: '0.2.4',
    date: '22. Mai 2025',
    title: 'Zentralisierung der Benutzerberechtigungs-Logik',
    descriptionPoints: [
      'Die Logik zum Laden von Benutzerberechtigungen (`user_permissions` aus Firestore) wurde im `AuthProvider` zentralisiert.',
      'Das `VereinLayout` und die Vereinsvertreter-Seiten beziehen Berechtigungen nun über den `AuthContext`.',
      'Die temporäre `VV_CLUB_ASSIGNMENTS`-Map wurde aus allen Vereinsvertreter-Seiten entfernt.',
      'Anzeige der Benutzerrolle im VV-Dashboard implementiert.',
      'Behebung von "Order of Hooks"-Fehlern im `VereinLayout`.',
    ],
  },
    {
    version: '0.2.3a',
    date: '22. Mai 2025',
    title: 'Hotfix: Vercel Build & Favicon (Admin Dashboard)',
    descriptionPoints: [
      'Behebung eines Vercel Build-Fehlers ("cn is not defined" und Icon-Import-Fehler) in der Admin-Dashboard-Seite.',
      'Favicon-Konfiguration in `layout.tsx` präzisiert.',
    ],
  },
  {
    version: '0.2.2',
    date: '21. Mai 2025',
    title: 'RWK Tabellen Jahresauswahl, Impressum & VV-Berechtigungsbasis',
    descriptionPoints: [
      'RWK-Tabellen: Jahresauswahl wird jetzt dynamisch aus den in Firestore vorhandenen Saisons generiert. Standardmäßig wird das aktuellste Jahr mit "Laufenden" Saisons ausgewählt.',
      'RWK-Tabellen: Filterung, sodass nur Saisons mit Status "Laufend" angezeigt werden.',
      'Impressumsseite (`/impressum`) mit Inhalten gefüllt und im Footer verlinkt.',
      'Vorbereitung für Vereinsvertreter: Umstellung auf `user_permissions`-Collection in Firestore (Admin-Seite kann eine `clubId` zuweisen).',
      'Vereinsvertreter-Layout und -Dashboard lesen testweise `user_permissions`.',
    ],
  },
   {
    version: '0.2.1',
    date: '21. Mai 2025',
    title: 'Admin-Team-Management & Fehlerbehebungen',
    descriptionPoints: [
      'Admin-Teamseite: Ligazuweisung im Dialog wiederhergestellt und Fehler mit `SelectItem`-Werten behoben.',
      'Diverse `SelectItem`-Fehler auf verschiedenen Admin- und VV-Seiten korrigiert.',
    ],
  },
  {
    version: '0.2.0',
    date: '21. Mai 2025', 
    title: 'Benutzerverwaltung (Admin UI für user_permissions) & Vorbereitung VV-Rollen',
    descriptionPoints: [
      'Admin-Seite `/admin/user-management` implementiert: UID-basierte Zuweisung von Rolle und bis zu 3 Vereinen in `user_permissions` (Firestore-Direktschreibvorgang).',
      'Admin-Dashboard um Platzhalter für "Statistiken" und aktualisierte Agenda erweitert.',
      'Vorbereitung für Vereinsvertreter/Mannschaftsführer-Rollen in Typen und Admin-UI.',
    ],
  },
  {
    version: '0.1.9',
    date: '20. Mai 2025',
    title: 'Verbesserung Ergebniserfassung & Feed-Gruppierung',
    descriptionPoints: [
      'Ergebniserfassungsseiten (Admin & VV): Vorgemerkte Ergebnisse bleiben bei Teamwechsel erhalten.',
      'Feed "Letzte Änderungen" auf Startseite gruppiert Einträge nun pro Liga und Tag (mit Zeitstempel der letzten Aktualisierung).',
      'Validierung von Ringzahlen (max. 300/400) beim Erfassen und Bearbeiten von Ergebnissen (Basis).',
      'Support-Ticket-System: Formular speichert Tickets in Firestore, Admin-Ansicht zeigt diese an.',
    ],
  },
  {
    version: '0.1.8',
    date: '20. Mai 2025',
    title: 'Regelkonsistenz & Fehlerbehebungen',
    descriptionPoints: [
      'Regel "Ein Schütze pro Saison/Disziplinkategorie nur in einem Team" auch beim Neuanlegen von Schützen durch Vereinsvertreter und Admins implementiert.',
      'Fehlerbehebungen in Admin- und Vereinsvertreter-Seiten (Zähler, `SelectItem`-Werte, Layout-Probleme).',
      'Schützen verschwinden nach Speichern von Ergebnissen korrekt aus dem Dropdown in der Ergebniserfassung.',
    ],
  },
  {
    version: '0.1.7',
    date: '20. Mai 2025',
    title: 'VV-Funktionen auf user_permissions umgestellt (Einzelverein)',
    descriptionPoints: [
      'Vereinsvertreter-Seiten (Dashboard, Mannschaften, Schützen, Ergebnisse) nutzen die `user_permissions`-Collection in Firestore zur Rechteprüfung und Vereinszuweisung (vorerst Einzel-Club-Modell).',
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
];


export default function UpdatesPage() {
  return (
    <div className="space-y-8 container mx-auto px-4 py-8">
      <div className="flex items-center space-x-3 mb-8">
        <Newspaper className="h-10 w-10 text-primary" /> {/* Korrigiertes Icon */}
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
                    <Tag className="mr-3 h-7 w-7" /> {/* Korrigiertes Icon */}
                    Version {entry.version}
                  </CardTitle>
                  <div className="text-sm text-muted-foreground flex items-center">
                    <CalendarDays className="mr-2 h-5 w-5" /> {/* Korrigiertes Icon */}
                    <span>{entry.date}</span>
                  </div>
                </div>
                {entry.title && <CardDescription className="text-lg pt-1">{entry.title}</CardDescription>}
              </CardHeader>
              <Separator />
              <CardContent className="pt-6">
                <div className="flex items-start space-x-3">
                  <ListChecks className="h-6 w-6 text-primary mt-1 flex-shrink-0" /> {/* Korrigiertes Icon */}
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
