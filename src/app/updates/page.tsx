// src/app/updates/page.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Newspaper, Tag, CalendarDays, ListChecks } from 'lucide-react';
import type { ChangelogEntry } from '@/types/updates';

const changelogEntries: ChangelogEntry[] = [
  {
    version: '0.3.1',
    date: '22. Mai 2025',
    title: 'Benutzerfreundlichkeit Handbuch & Vorbereitung RWK-Ordnung',
    descriptionPoints: [
      'Handbuch und Changelog-Texte vereinfacht und technische Begriffe für bessere Lesbarkeit reduziert.',
      'Neue Seite für die "RWK-Ordnung" als Platzhalter erstellt und in die Hauptnavigation aufgenommen.',
      'Agenda im Admin-Dashboard an den aktuellen Entwicklungsstand angepasst.',
      'Vorbereitung für das nächste Minor-Release (0.4.0) mit Fokus auf Firestore Sicherheitsregeln.',
    ],
  },
  {
    version: '0.3.0',
    date: '22. Mai 2025',
    title: 'RWK Tabellen Optimierung & Finale Fehlerbehebungen',
    descriptionPoints: [
      'RWK Tabellen: Ligen-Akkordeons sind nun standardmäßig geöffnet für bessere Übersicht.',
      'RWK Tabellen: Einzelschützen in der aufgeklappten Mannschafts-Detailansicht sind jetzt klickbar und öffnen den Statistik-Dialog.',
      'RWK Tabellen: Die Seite verarbeitet jetzt URL-Parameter von der Startseite, um Ligen direkt anzuzeigen.',
      'Behebung diverser Darstellungs- und JavaScript-Fehler (EOF, useSearchParams-Boundary) auf der RWK-Tabellenseite.',
      'Handbuch-Seite: Syntaxfehler behoben und bedingte Anzeige für Admin-Abschnitt implementiert.',
      'Admin-Dashboard: Agenda aktualisiert.',
    ],
  },
  {
    version: '0.2.6a',
    date: '22. Mai 2025',
    title: 'Hotfix: Build-Fehler & Favicon',
    descriptionPoints: [
        'Behebung eines Vercel Build-Fehlers (fehlende Icon-Importe im Admin-Dashboard).',
        'Favicon-Konfiguration in der Hauptlayout-Datei präzisiert.',
        'Korrektur von Syntaxfehlern auf der Handbuch-Seite.',
    ],
  },
  {
    version: '0.2.5',
    date: '22. Mai 2025', 
    title: 'Firestore Sicherheitsregeln (Basis) & Rollen-UI',
    descriptionPoints: [
      'Erste Version der Firestore-Sicherheitsregeln implementiert, um Zugriffsrechte basierend auf Benutzerrollen (Admin, Vereinsvertreter, Mannschaftsführer) und Vereinszugehörigkeit (aus user_permissions) zu steuern.',
      'Benutzeroberfläche für Vereinsvertreter und Mannschaftsführer angepasst: Bearbeitungs-Buttons für Mannschaften und Schützen sind nun nur für Nutzer mit der Rolle "vereinsvertreter" sichtbar.',
      'Zugriff auf das Vereins-Dashboard für Mannschaftsführer korrigiert.',
      'Agenda und Handbuch aktualisiert.',
    ],
  },
   {
    version: '0.2.4',
    date: '21. Mai 2025',
    title: 'Zentralisierung Benutzerberechtigungen & VV-Seiten Umstellung',
    descriptionPoints: [
      'Ladelogik für Benutzerberechtigungen (`user_permissions`) im `AuthProvider` zentralisiert.',
      'Alle Vereinsvertreter-Seiten (`/verein/...`) nutzen nun den `AuthContext` und `VereinContext`, um Berechtigungen zu beziehen und die `VV_CLUB_ASSIGNMENTS`-Map abzulösen.',
      'Anzeige der Benutzerrolle im VV-Dashboard implementiert.',
      'Behebung von "Order of Hooks"-Fehlern im `VereinLayout`.',
      'Korrektur von Fehlern beim Setzen der `activeClubId` auf VV-Seiten.',
    ],
  },
  {
    version: '0.2.3a',
    date: '21. Mai 2025',
    title: 'Hotfix: Vercel Build & Favicon (Admin Dashboard)',
    descriptionPoints: [
      'Behebung eines Vercel Build-Fehlers (fehlende Icon-Importe und `cn`-Funktion) in der Admin-Dashboard-Seite.',
      'Favicon-Konfiguration in der Hauptlayout-Datei präzisiert.',
    ],
  },
   {
    version: '0.2.3',
    date: '21. Mai 2025',
    title: 'Korrekturen für VV/MF-Zugriff & UI-Konsistenz',
    descriptionPoints: [
      'Zugriff für Mannschaftsführer auf das Vereins-Dashboard korrigiert.',
      'Rollenbasierte Anzeige von Bearbeitungs-Buttons auf den Mannschafts- und Schützenverwaltungsseiten für Vereinsvertreter implementiert.',
      'Diverse UI- und Logikfehler in den Vereinsvertreter-Seiten behoben.',
    ],
  },
  {
    version: '0.2.2',
    date: '21. Mai 2025',
    title: 'RWK Tabellen Jahresauswahl & Impressum',
    descriptionPoints: [
      'RWK-Tabellen: Jahresauswahl wird jetzt dynamisch aus den in Firestore vorhandenen Saisons generiert. Standardmäßig wird das aktuellste Jahr mit "Laufenden" Saisons ausgewählt.',
      'RWK-Tabellen: Filterung, sodass nur Saisons mit Status "Laufend" angezeigt werden.',
      'Impressumsseite (`/impressum`) mit Inhalten gefüllt und im Footer verlinkt.',
    ],
  },
  {
    version: '0.2.1',
    date: '20. Mai 2025',
    title: 'Fehlerbehebungen Admin-Teams & Stabilität',
    descriptionPoints: [
      'Behebung von Fehlern bei der Schützenzuweisung und Zähleranzeige in der Admin-Mannschaftsverwaltung.',
      'Korrektur von "No document to update"-Fehlern bei inkonsistenten Schützendaten.',
      'Diverse `SelectItem`-Fehler in verschiedenen Admin- und VV-Seiten behoben.',
      'Stabilisierung der Datenlade-Logik zur Vermeidung von Endlosschleifen.',
    ],
  },
  {
    version: '0.2.0',
    date: '20. Mai 2025', 
    title: 'Benutzerverwaltung (Admin-UI für Berechtigungen) & Vorbereitung VV-Rollen',
    descriptionPoints: [
      'Admin-Seite `/admin/user-management` implementiert: UID-basierte Zuweisung von Rolle und bis zu 3 Vereinen (als Map) in `user_permissions` (Firestore-Direktschreibvorgang, ohne Cloud Functions für diesen Teil).',
      'Cloud Function `setUserRoleAndClub` erfolgreich deployt (setzt Custom Claims - Nutzung in App noch ausstehend).',
      'Platzhalter für "Statistiken" im Admin-Dashboard hinzugefügt.',
      'Agenda und Handbuch aktualisiert.',
    ],
  },
  {
    version: '0.1.9',
    date: '20. Mai 2025',
    title: 'Verbesserung Ergebniserfassung UX',
    descriptionPoints: [
      'Ergebniserfassungsseiten (Admin & VV): Vorgemerkte Ergebnisse bleiben jetzt auch bei einem Wechsel der Mannschaft (im selben Durchgang/Liga/Saison) in der Liste erhalten.',
    ],
  },
  {
    version: '0.1.8',
    date: '20. Mai 2025',
    title: 'Regelkonsistenz Schützenzuweisung & Stabilität',
    descriptionPoints: [
      'Regel "Ein Schütze pro Saison/Disziplinkategorie nur in einem Team" auch beim Neuanlegen von Schützen durch Vereinsvertreter implementiert.',
      'Behebung von Fehlern bei der Zähleranzeige für Schützen in Teams.',
      'Stabilisierung der Datenlade-Logik in den Vereinsvertreter-Seiten.',
    ],
  },
  {
    version: '0.1.7',
    date: '20. Mai 2025',
    title: 'VV-Funktionen auf user_permissions umgestellt',
    descriptionPoints: [
      'Alle Vereinsvertreter-Seiten (`/verein/...`) nutzen nun die `user_permissions`-Collection in Firestore (via Context) zur Rechteprüfung und Vereinszuweisung (Einzel-Club-Modell).',
      'Entfernung der temporären `VV_CLUB_ASSIGNMENTS`-Map.',
      'Korrektur diverser `SelectItem`-Fehler und Import-Fehler in VV-Seiten.',
    ],
  },
   {
    version: '0.1.6',
    date: '20. Mai 2025',
    title: '"Letzte Änderungen"-Feed & Support-System (Basis)',
    descriptionPoints: [
      'Startseite (`/`) zeigt "Letzte Ergebnis-Updates" aus `league_updates`-Collection, gruppiert pro Liga/Tag und inklusive Disziplintyp und Jahr.',
      'Support-Seite (`/support`) mit Formular und Speicherfunktion in Firestore für Tickets.',
      'Admin-Seite (`/admin/support-tickets`) zur Anzeige eingegangener Tickets.',
    ],
  },
  {
    version: '0.1.5',
    date: '20. Mai 2025',
    title: 'Ergebnisbearbeitung Admin & RWK-Tabellen Verfeinerung',
    descriptionPoints: [
      'Admin Edit Results (`/admin/edit-results`): Vollständige Implementierung der Bearbeitungs- und Löschfunktion für Ergebnisse mit Historie.',
      'RWK Tabellen: Anzeige für "Bester Schütze" und "Beste Dame" getrennt und korrekt implementiert.',
      'Validierung von Ringzahlen (max. 300/400) bei Ergebniserfassung und -bearbeitung.',
    ],
  },
  // Ältere Einträge können hier folgen
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
