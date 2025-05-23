// src/app/updates/page.tsx
"use client";
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Newspaper, Tag, CalendarDays, ListChecks } from 'lucide-react'; // Ensure ListChecks is imported
import type { ChangelogEntry } from '@/types/updates';

const changelogEntries: ChangelogEntry[] = [
  {
    version: '0.3.2',
    date: '23. Mai 2025',
    title: 'Fehlerbehebungen und Stabilitätsverbesserungen',
    descriptionPoints: [
      'Behebung eines Syntaxfehlers auf der Handbuch-Anzeigeseite, der das Rendern verhinderte.',
      'Korrektur von Endlosschleifen und Import-Fehlern auf der RWK-Tabellenseite für eine stabilere Anzeige.',
      'Weitere kleinere Optimierungen und Fehlerbehebungen zur Verbesserung der Gesamtstabilität.',
    ],
  },
  {
    version: '0.3.1',
    date: '22. Mai 2025',
    title: 'Benutzerfreundlichkeit Handbuch & RWK-Ordnung',
    descriptionPoints: [
      'Handbuch und Changelog-Texte vereinfacht und technische Begriffe für bessere Lesbarkeit reduziert.',
      'Neue Seite für die "RWK-Ordnung" erstellt und in die Hauptnavigation aufgenommen (Inhalt kann nun eingepflegt werden).',
      'Agenda im Admin-Dashboard an den aktuellen Entwicklungsstand angepasst.',
      'Korrektur der Standard-Jahresauswahl und des Statusfilters in den RWK-Tabellen.',
      'Impressumsseite mit Inhalt befüllt.',
    ],
  },
  {
    version: '0.3.0',
    date: '22. Mai 2025',
    title: 'RWK Tabellen verbessert und Dokumentation aktualisiert',
    descriptionPoints: [
      'RWK-Tabellen (/rwk-tabellen): Verarbeitet jetzt URL-Query-Parameter, um direkt spezifische Ligen und Jahre anzuzeigen, wenn von externen Links (z.B. Startseiten-Feed) navigiert wird.',
      'Ligen-Akkordeons in den RWK-Tabellen sind standardmäßig geöffnet für eine bessere Übersicht.',
      'Einzelschützen in der aufgeklappten Mannschafts-Detailansicht sind nun klickbar und öffnen den Statistik-Dialog mit Leistungsdiagramm.',
      'Behebung diverser Darstellungsfehler und JavaScript-Fehler (EOF-Fehler, useSearchParams-Boundary, useToast-Import) auf der RWK-Tabellenseite.',
      'Handbuch (/handbuch): Inhalt an den aktuellen Entwicklungsstand angepasst und bedingte Anzeige des Admin-Abschnitts implementiert.',
      'Admin-Dashboard (/admin): Agenda mit den neuesten Entwicklungen und nächsten Schritten aktualisiert.',
    ],
  },
  {
    version: '0.2.6a',
    date: '22. Mai 2025',
    title: 'Hotfix Build-Fehler & Icon-Importe Admin-Dashboard',
    descriptionPoints: [
      'Behebung eines Build-Fehlers ("ShieldCheck is not defined" und andere) auf der Admin-Dashboard-Seite durch korrekte Icon-Importe.',
      'Handbuch-Seite: Syntaxfehler behoben, der das Rendern verhinderte.',
      'Favicon-Konfiguration präzisiert.',
    ],
  },
  {
    version: '0.2.6',
    date: '22. Mai 2025',
    title: 'Stabilisierung VV-Seiten & Vorbereitung erweiterte Rechte',
    descriptionPoints: [
      'Fehlerbehebung auf den Vereinsvertreter-Seiten (Mannschaften, Schützen, Ergebnisse) zur korrekten Verwendung der `user_permissions` (einzelne `clubId`).',
      'Korrektur von Import-Fehlern (`AlertDialogFooter`, Logger) in VV-Seiten.',
      'Agenda und Handbuch an den aktuellen Entwicklungsstand und die geplanten Schritte angepasst.',
      'Vorbereitung für differenzierte Rechte zwischen Vereinsvertreter und Mannschaftsführer.',
    ],
  },
  {
    version: '0.2.5',
    date: '22. Mai 2025', 
    title: 'Firestore Sicherheitsregeln (Basis) & UI-Rechte für VV/MF',
    descriptionPoints: [
      'Erste Version der detaillierten Firestore-Sicherheitsregeln implementiert (basierend auf `user_permissions` mit einzelner `clubId`).',
      'Client-seitige UI in den Vereins-Seiten (`/verein/mannschaften`, `/verein/schuetzen`) angepasst, um Bearbeitungsfunktionen nur für Rolle "vereinsvertreter" anzuzeigen.',
      'Zugriff für Rolle "mannschaftsfuehrer" auf das Vereins-Dashboard und die Ergebniserfassung sichergestellt.',
    ],
  },
  {
    version: '0.2.4',
    date: '22. Mai 2025',
    title: 'Zentralisierung Benutzerberechtigungen & Stabilitätsfixes',
    descriptionPoints: [
      'Benutzerberechtigungen (`user_permissions`) werden jetzt zentral im `AuthProvider` geladen und über Context (`VereinContext`) an die Vereins-Seiten weitergegeben.',
      'Die temporäre `VV_CLUB_ASSIGNMENTS`-Map wurde aus den VV-Seiten entfernt.',
      'Behebung eines "Order of Hooks"-Fehlers im `VereinLayout`.',
      'Anzeige der Benutzerrolle im VV-Dashboard implementiert.',
    ],
  },
   {
    version: '0.2.3a',
    date: '22. Mai 2025',
    title: 'Hotfix: Vercel Build-Fehler & Favicon',
    descriptionPoints: [
      'Behebung eines Build-Fehlers ("cn is not defined") auf der Admin-Dashboard-Seite.',
      'Favicon-Konfiguration in der Hauptlayout-Datei präzisiert.',
    ],
  },
  {
    version: '0.2.3',
    date: '22. Mai 2025',
    title: 'Korrekturen VV-Zugriff & UI-Konsistenz',
    descriptionPoints: [
      'Zugriff für Mannschaftsführer auf das Vereins-Dashboard korrigiert.',
      'Rollenbasierte Anzeige von Bearbeitungs-Buttons auf den Mannschafts- und Schützenverwaltungsseiten für Vereinsvertreter implementiert (Basis).',
      'Navigations-Label "Mein Verein" zu "Vereinsbereich" geändert.',
    ],
  },
  {
    version: '0.2.2',
    date: '22. Mai 2025',
    title: 'RWK Tabellen Jahresauswahl, Statusfilter & Impressum',
    descriptionPoints: [
      'RWK-Tabellen: Jahresauswahl wird jetzt dynamisch aus den in Firestore vorhandenen Saisons generiert. Standardmäßig wird das aktuellste Jahr mit "Laufenden" Saisons ausgewählt.',
      'RWK-Tabellen: Filterung, sodass nur Saisons mit Status "Laufend" angezeigt werden.',
      'Impressumsseite (`/impressum`) mit Inhalt befüllt und im Footer verlinkt.',
    ],
  },
  {
    version: '0.2.1',
    date: '21. Mai 2025',
    title: 'Stabiles Admin-Team-Management & VV-Basis',
    descriptionPoints: [
      'Behebung von "SelectItem value cannot be empty" Fehlern auf der Admin-Teamseite.',
      'Liga-Zuweisung für Teams im Admin-Dialog wiederhergestellt und stabilisiert.',
      'Grundlegende Umstellung der Vereinsvertreter-Seiten auf das Laden von Berechtigungen aus `user_permissions` (Einzelverein-Modell).',
    ],
  },
  {
    version: '0.2.0',
    date: '21. Mai 2025', 
    title: 'Admin Benutzerverwaltung (Basis Firestore) & Vorbereitung für VV-Rechte',
    descriptionPoints: [
      'Admin-Seite `/admin/user-management` implementiert: UID-basierte Zuweisung von Rolle und Verein(en) (bis zu 3) direkt in `user_permissions` (Firestore). Cloud Functions für Rechtevergabe vorerst pausiert.',
      'Anpassung der VV-Seiten zur Nutzung von `user_permissions` über Context (Basis für Einzelverein).',
    ],
  },
  {
    version: '0.1.9',
    date: '20. Mai 2025',
    title: 'Verbesserung Ergebniserfassung UX',
    descriptionPoints: [
      'Ergebniserfassungsseiten (Admin & VV): Vorgemerkte Ergebnisse bleiben jetzt auch bei einem Wechsel der Mannschaft (im selben Durchgang/Liga/Saison) in der Liste erhalten.',
      'Korrektur: "Einzel"-Mannschaften werden nicht mehr in der Mannschaftsrangliste der RWK-Tabellen angezeigt.',
      'Korrektur: Dropdown-Reihenfolge in Ergebniserfassung (Durchgang vor Mannschaft).',
      'Vorbereitung: Einzelschützenrangliste pro Liga in RWK-Tabellen (Filter-Dropdown).',
    ],
  },
   {
    version: '0.1.8',
    date: '20. Mai 2025',
    title: 'Regelkonsistenz Schützenzuweisung & Support-System',
    descriptionPoints: [
      'Regel "Ein Schütze pro Saison/Disziplinkategorie nur in einem Team" konsistent auf Admin- und VV-Seiten implementiert.',
      'Regel "Maximal 3 Schützen pro Team" auf Admin- und VV-Seiten durchgesetzt.',
      'Support-Seite (`/support`) mit Formular und Speicherfunktion in Firestore für Tickets implementiert.',
      'Admin-Seite (`/admin/support-tickets`) zur Anzeige und Basis-Verwaltung eingegangener Tickets hinzugefügt.',
    ],
  },
  {
    version: '0.1.7',
    date: '20. Mai 2025',
    title: 'Vereinsvertreter-Funktionen auf `user_permissions` umgestellt',
    descriptionPoints: [
      'Alle Vereinsvertreter-Seiten (`/verein/...`) nutzen nun die `user_permissions`-Collection in Firestore (via Context) zur Rechteprüfung und Vereinszuweisung (Einzel-Club-Modell).',
      'Anzeige der Benutzerrolle und des Vereinsnamens im VV-Dashboard.',
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
      'Validierung von Ringzahlen (max. 300/400) bei Ergebniserfassung und -bearbeitung; Entfernung der Disziplin "SP".',
      'Anzeige "Bester Schütze" / "Beste Dame" in RWK-Tabellen korrigiert.',
    ],
  },
  {
    version: '0.1.0', // Konsolidierung früherer 0.0.x Versionen
    date: '20. Mai 2025',
    title: 'Admin Stammdaten CRUD & Basis VV-Layout & RWK-Tabellen',
    descriptionPoints: [
      'Vereins-, Saison-, Liga-, Mannschafts- und Schützenverwaltung für Admins mit DB-Anbindung implementiert (Basis CRUD).',
      'Grundstruktur für Vereinsvertreter-Bereich (`/verein/...`) mit Layout und Platzhalterseiten erstellt.',
      'RWK-Tabellenseite mit Anzeige von Ligen, Mannschaften und Einzelschützen (basierend auf Firestore-Daten).',
      'Implementierung einer grundlegenden Versionsnummer im Footer und einer Changelog-Seite.',
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
