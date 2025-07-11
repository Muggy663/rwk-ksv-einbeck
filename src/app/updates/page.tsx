// src/app/updates/page.tsx
"use client";

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight } from 'lucide-react';

export default function UpdatesPage() {
  return (
    <div className="container py-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-primary">Updates & Changelog</h1>
          <p className="text-muted-foreground">
            Übersicht aller Änderungen und Verbesserungen der RWK App Einbeck
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs py-1 px-2">
              <span>Aktuelle Version: 0.9.9.3 (08.07.2025)</span>
            </Badge>
            <Badge variant="default" className="text-xs py-1 px-2 bg-green-600">
              <span>🌐 Live: rwk-einbeck.de</span>
            </Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-xl">Version 0.9.9.3</CardTitle>
              <Badge variant="secondary">Neu</Badge>
            </div>
            <CardDescription>11.07.2025</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Vollständiges Kommunikations- und Verwaltungssystem mit Push-Notifications, digitalem Protest-System und News-Management.</p>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-4">
              <h4 className="font-semibold text-purple-900 mb-2">🚀 Major Features Version 0.9.9.3</h4>
              <div className="text-xs text-purple-700">
                Komplettes Kommunikations-Ökosystem für moderne Vereinsverwaltung
              </div>
            </div>
            <ul className="list-disc pl-5 space-y-1">
              <li>🔔 <strong>Push-Notifications System</strong>: FCM-Integration für sofortige Benachrichtigungen bei neuen Ergebnissen, Terminen und News</li>
              <li>⚖️ <strong>Digitales Protest-System</strong>: Vollständiger Workflow Rundenwettkampfleiter → Sportausschuss mit Status-Tracking</li>
              <li>📢 <strong>RWK-News Management</strong>: Professionelles Content-Management für offizielle Mitteilungen mit Kategorien und Prioritäten</li>
              <li>📋 <strong>Funktionierendes Audit-Log</strong>: Vollständige Änderungsverfolgung aller CRUD-Operationen mit Statistik-Dashboard</li>
              <li>🛡️ <strong>Content-Filter</strong>: Automatische Filterung unerlaubter Inhalte in allen Eingabefeldern</li>
              <li>📱 <strong>Notification Settings</strong>: Granulare Kontrolle über Benachrichtigungstypen (Ergebnisse, Termine, News, Proteste)</li>
              <li>🎯 <strong>Zielgruppen-Management</strong>: News für spezifische Benutzergruppen (Alle, Vereinsvertreter, Mannschaftsführer, Admins)</li>
              <li>📊 <strong>Admin-Dashboard</strong>: Erweiterte Statistiken für News, Proteste und Audit-Aktivitäten</li>
              <li>🔍 <strong>Erweiterte Suche</strong>: Filterbare Übersichten für News und Proteste mit Volltext-Suche</li>
              <li>📝 <strong>Kommentar-System</strong>: Kommunikation zwischen Parteien bei Protesten mit internen/öffentlichen Kommentaren</li>
              <li>🏷️ <strong>Tag-System</strong>: Kategorisierung und bessere Auffindbarkeit von News-Artikeln</li>
              <li>📈 <strong>View-Tracking</strong>: Aufrufe und Engagement-Metriken für News-Artikel</li>
              <li>🔒 <strong>Firestore Rules Update</strong>: Erweiterte Sicherheitsregeln für alle neuen Collections</li>
              <li>⚡ <strong>Performance-Optimiert</strong>: Effiziente Datenbankabfragen und Caching-Strategien</li>
            </ul>
            <div className="mt-4 p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border">
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <span className="font-medium text-purple-800">🚀 Kommunikations-Update</span>
                  <p className="text-xs text-purple-600 mt-1">Push-Notifications + Protest-System + News + Audit-Log</p>
                </div>
                <span className="bg-purple-600 text-white px-3 py-1 rounded text-xs">
                  🔔 Live
                </span>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <span className="text-muted-foreground text-sm">
                Alle Details hier angezeigt
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-xl">Version 0.9.9.2</CardTitle>
              <Badge variant="outline">Vorherige</Badge>
            </div>
            <CardDescription>08.07.2025</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Urkunden-System Verbesserungen und Content-Filter für Termine.</p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <h4 className="font-semibold text-blue-900 mb-2">🏆 Neue Features Version 0.9.9.2</h4>
              <div className="text-xs text-blue-700">
                Individuelle Urkunden-Erstellung und Sicherheitsverbesserungen
              </div>
            </div>
            <ul className="list-disc pl-5 space-y-1">
              <li>🏆 <strong>Individuelle Urkunden-Auswahl</strong>: Flexible Anzahl Top-Schützen (0-10) und Teams (0-5) statt fixer "3+2"</li>
              <li>👥 <strong>Teammitglieder mit Einzelergebnissen</strong>: Mannschaftsurkunden zeigen Namen und Ringzahlen der Schützen</li>
              <li>🎨 <strong>Schlichte Urkunden-Gestaltung</strong>: Professionelles Design ohne überladene Dekoration</li>
              <li>📅 <strong>Termine: 4 statt 3</strong>: Startseite zeigt jetzt 4 nächste Termine mit Beschreibungstext</li>
              <li>🚫 <strong>Content-Filter für Termine</strong>: Automatische Filterung unerlaubter Inhalte (Drogen, Gewalt, etc.)</li>
              <li>🔒 <strong>Proaktive Sicherheit</strong>: Bestehende problematische Termine werden automatisch ausgeblendet</li>
              <li>⚠️ <strong>Benutzer-Feedback</strong>: Klare Fehlermeldungen bei unerlaubten Inhalten mit Wort-Auflistung</li>
            </ul>
            <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border">
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <span className="font-medium text-blue-800">🏆 Urkunden-Update</span>
                  <p className="text-xs text-blue-600 mt-1">Individuelle Auswahl + Content-Filter</p>
                </div>
                <span className="bg-blue-600 text-white px-3 py-1 rounded text-xs">
                  🚀 Live
                </span>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <span className="text-muted-foreground text-sm">
                Alle Details hier angezeigt
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-xl">Version 0.9.9.1</CardTitle>
              <Badge variant="outline">Vorherige</Badge>
            </div>
            <CardDescription>08.07.2025</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Bugfix-Release für Beta-Tester-Feedback - Behebung kritischer Fehler aus Version 0.9.9.</p>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
              <h4 className="font-semibold text-orange-900 mb-2">🔧 Bugfixes Version 0.9.9.1</h4>
              <div className="text-xs text-orange-700">
                Basierend auf Beta-Tester-Feedback werden kritische Fehler behoben
              </div>
            </div>
            <ul className="list-disc pl-5 space-y-1">
              <li>📎 <strong>Support: Multiple Screenshots</strong>: Mehrere Dateien mit automatischer Komprimierung - CORS-Problem behoben</li>
              <li>🚫 <strong>Hilfe & Einstellungen entfernt</strong>: Redundante Seite entfernt - alle Funktionen sind im Dashboard verfügbar</li>
              <li>🎯 <strong>Einzelrangliste-Fix</strong>: Liga-Auswahl Pflicht verhindert Disziplin-Vermischung (Raimund-Problem behoben)</li>
              <li>🔄 <strong>Context-Aware Navigation</strong>: Zuletzt geöffnete Liga wird automatisch für Einzelschützen übernommen</li>
              <li>🏆 <strong>KK Gewehr Ehrungen</strong>: Spezielle Option für übergreifende Beste Dame/Bester Schütze Auswertung</li>
              <li>🔍 <strong>Schützen-Suche</strong>: Suchfunktion in Einzelrangliste nach Namen und Mannschaft</li>
              <li>🏅 <strong>Stichentscheid-Logik</strong>: Keine gleichen Plätze mehr - bei Gleichstand entscheidet letzter Durchgang</li>
              <li>🎨 <strong>Liga-Anzeige verbessert</strong>: "Gruppe" entfernt, Typ-Kürzel in separater Spalte, mobile Optimierung</li>
              <li>🎨 <strong>Liga-Anzeige verbessert</strong>: "Gruppe" entfernt, Typ-Kürzel in separater Spalte, mobile Optimierung</li>
              <li>🔧 <strong>Kritischer Bugfix</strong>: getDisciplineCategory Funktion implementiert - behebt Mannschafts-Bearbeitung</li>
              <li>🗑️ <strong>Admin: Ticket-Verwaltung</strong>: Support-Tickets löschen, Antwort-Templates und Multiple Screenshots-Anzeige</li>
            </ul>
            <div className="mt-4 p-3 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg border">
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <span className="font-medium text-orange-800">🔧 Bugfix-Release</span>
                  <p className="text-xs text-orange-600 mt-1">Basierend auf Beta-Tester-Feedback</p>
                </div>
                <span className="bg-orange-600 text-white px-3 py-1 rounded text-xs">
                  🚀 Live
                </span>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <span className="text-muted-foreground text-sm">
                Alle Details hier angezeigt
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-xl">Version 0.9.9</CardTitle>
              <Badge variant="outline">Vorherige</Badge>
            </div>
            <CardDescription>06. Juli 2025</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Multi-Verein-System, vollständiges E-Mail-System mit eigener Domain, professionelle Website-Adresse und erweiterte Features.</p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
              <h4 className="font-semibold text-green-900 mb-2">🎉 Highlights Version 0.9.9</h4>
              <div className="grid grid-cols-2 gap-2 text-xs text-green-700">
                <div>🏢 Multi-Verein-System</div>
                <div>🔄 Club-Switcher Navigation</div>
                <div>🌐 rwk-einbeck.de (HTTPS)</div>
                <div>📧 E-Mails von @rwk-einbeck.de</div>
                <div>📎 PDF/Word-Anhänge</div>
                <div>🎯 Liga-Filter für Kontakte</div>
                <div>📊 Automatische Fehlerüberwachung</div>
                <div>⚡ Performance-Optimierungen</div>
              </div>
              <div className="mt-2 p-2 bg-white rounded border text-xs">
                <strong>🚀 Jetzt live:</strong> <a href="https://rwk-einbeck.de" target="_blank" className="text-blue-600 hover:underline">https://rwk-einbeck.de</a> - Professionelle Domain mit SSL-Verschlüsselung
              </div>
            </div>
            <ul className="list-disc pl-5 space-y-1">
              <li>🏢 <strong>Multi-Verein-System</strong>: Benutzer können mehreren Vereinen zugeordnet werden und nahtlos zwischen ihnen wechseln</li>
              <li>🔄 <strong>Club-Switcher</strong>: Navigation mit persistenter Auswahl - gewählter Verein wird gespeichert</li>
              <li>📊 <strong>Einheitliche Datenansicht</strong>: Alle Seiten (Mannschaften, Schützen, Ergebnisse) zeigen Daten des aktuell ausgewählten Vereins</li>
              <li>⚙️ <strong>Liga-Einstellungen</strong>: Flexible Schusszahlen und Disziplinen pro Liga konfigurierbar</li>
              <li>🎯 <strong>Alle Disziplinen</strong>: KK Gewehr/Pistole, LG Auflage/Freihand, Luftpistole + Benutzerdefiniert</li>
              <li>🔢 <strong>Variable Schusszahlen</strong>: 20/30/40 Schuss mit entsprechenden Ringzahlen</li>
              <li>📱 <strong>Mobile Statistik-Fix</strong>: Kreisdiagramm korrekt dargestellt</li>
              <li>📈 <strong>Statistik-Hinweise</strong>: Icons und Tipps für Schützen-Diagramme in RWK-Tabellen</li>
              <li>🔧 <strong>Substitutions-Fix</strong>: Berechtigungsfehler behoben, graceful fallback</li>
              <li>📧 <strong>E-Mail-System</strong>: Vollständige Rundschreiben-Verwaltung mit professioneller Domain</li>
              <li>📎 <strong>Anhang-Funktion</strong>: PDF, Word, Bilder versendbar (bis 10MB pro Datei)</li>
              <li>🎯 <strong>Liga-Filter</strong>: Intelligente Kontakt-Filterung für zielgerichtete Kommunikation</li>
              <li>👤 <strong>Einzelkontakt-Auswahl</strong>: Gezielte Empfänger-Auswahl zusätzlich zu Gruppen</li>
              <li>🌐 <strong>Professionelle Domain</strong>: rwk-einbeck.de mit HTTPS und SSL-Verschlüsselung</li>
              <li>📧 <strong>E-Mail-Domain</strong>: Professionelle E-Mails von @rwk-einbeck.de</li>
              <li>📱 <strong>PWA-Verbesserungen</strong>: Install-Prompt nach 30 Sekunden und Offline-Indikator</li>
              <li>📊 <strong>Error-Monitoring</strong>: Sentry-Integration mit E-Mail-Benachrichtigungen</li>
              <li>⚡ <strong>Performance-Tracking</strong>: Monitoring von Ladezeiten und API-Performance</li>
              <li>🔒 <strong>Security-Audit</strong>: OWASP-Scan bestanden, SSL-Verschlüsselung aktiv</li>
              <li>🎆 <strong>Code-Optimierung</strong>: Production-ready, Debug-Logs entfernt</li>
              <li>🚀 <strong>Domain-Setup</strong>: Vercel Custom Domain mit automatischem SSL</li>
              <li>📊 <strong>DNS-Konfiguration</strong>: SPF, DKIM, DMARC für E-Mail-Zustellbarkeit</li>
            </ul>
            <div className="mt-4 p-3 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border">
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <span className="font-medium text-green-800">🎉 Version 0.9.9 ist live!</span>
                  <p className="text-xs text-green-600 mt-1">Professionelle Domain mit SSL-Verschlüsselung</p>
                </div>
                <a href="https://rwk-einbeck.de" target="_blank" className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700 transition-colors">
                  🚀 Besuchen
                </a>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <Link href="/updates/v0.9.9" className="text-primary hover:text-primary/80 text-sm flex items-center">
                Details <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-xl">Version 0.9.8.2</CardTitle>
              <Badge variant="outline">Bugfix</Badge>
            </div>
            <CardDescription>30. Juni 2025</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Layout-Fixes für Handzettel-Generatoren und Druckoptimierung.</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>📱 <strong>Mobile Layout-Fixes</strong>: Buttons bleiben im Layout auf allen Geräten</li>
              <li>👀 <strong>Verbesserte Vorschauen</strong>: Vollständige Sicht auf Handzettel und Gesamtergebnislisten</li>
              <li>🖨️ <strong>Druckoptimierung</strong>: Größere Schrift und höhere Zeilen für bessere Lesbarkeit</li>
              <li>🔧 <strong>UI-Verbesserungen</strong>: Responsive Header und kompakte Buttons</li>
            </ul>
            <div className="mt-4 flex justify-end">
              <span className="text-muted-foreground text-sm">
                Alle Details hier angezeigt
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-xl">Version 0.9.8.1</CardTitle>
              <Badge variant="outline">Bugfix</Badge>
            </div>
            <CardDescription>28. Juni 2025</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Bugfix-Release für mobile Druckoptimierung.</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>📱 <strong>Mobile Druckoptimierung</strong>: Handzettel und Gesamtergebnislisten drucken korrekt auf mobilen Geräten</li>
              <li>🖨️ <strong>Responsive Skalierung</strong>: Automatische Anpassung für verschiedene Bildschirmgrößen</li>
              <li>🔧 <strong>Print-Media-Queries</strong>: Optimierte Druckausgabe für alle Gerätetypen</li>
            </ul>
            <div className="mt-4 flex justify-end">
              <span className="text-muted-foreground text-sm">
                Alle Details hier angezeigt
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-xl">Version 0.9.8</CardTitle>
              <Badge variant="outline">Vorherige</Badge>
            </div>
            <CardDescription>27. Juni 2025</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Optimierungen für Handzettel-Druckfunktionen und bessere Seitenausnutzung.</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>🖨️ <strong>Dynamische Skalierung</strong>: Gesamtergebnislisten passen automatisch auf eine Seite</li>
              <li>📊 <strong>Intelligente Anpassung</strong>: Optimale Balance zwischen Lesbarkeit und Platznutzung</li>
              <li>📋 <strong>Vollständige Handzettel-Suite</strong>: Durchgangs-Meldebögen und Gesamtergebnislisten</li>
              <li>🏢 <strong>Vereinsbereich erweitert</strong>: Komplette Handtabellen-Funktionalität mit Kontaktdaten</li>
              <li>🌍 <strong>Öffentliche Generatoren</strong>: Handzettel & Gesamtlisten ohne sensible Daten</li>
              <li>🎨 <strong>Präsente Darstellung</strong>: Große Generator-Karten im Dokumentenbereich</li>
              <li>🔗 <strong>Nahtlose Navigation</strong>: Direkte Verlinkung zwischen Generatoren</li>
              <li>📧 <strong>Rundschreiben-System</strong>: Admin-Kommunikation mit Vorlagen und Empfänger-Auswahl</li>
              <li>🔧 <strong>Admin-Bugfix</strong>: Saison-Dropdown wird automatisch gefüllt</li>
            </ul>
            <div className="mt-4 flex justify-end">
              <Link href="/updates/v0.9.8" className="text-primary hover:text-primary/80 text-sm flex items-center">
                Details <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Version 0.9.7</CardTitle>
            <CardDescription>26. Juni 2025</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Wichtige Admin-Features und Vervollständigung der RWK-Ordnung-Umsetzung.</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Ersatzschützen-System</strong>: Vollständige Implementierung gemäß RWK-Ordnung</li>
              <li><strong>Startgelder-Verwaltung</strong>: Automatische Berechnung mit PDF/CSV-Export</li>
              <li><strong>Halbautomatischer Auf-/Abstieg</strong>: Intelligente Vorschläge mit Admin-Bestätigung</li>
              <li><strong>RWK-Tabellen Anzeige</strong>: Ersatzschützen werden sichtbar markiert</li>
            </ul>
            <div className="mt-4 flex justify-end">
              <Link href="/updates/v0.9.7" className="text-primary hover:text-primary/80 text-sm flex items-center">
                Details <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Version 0.9.6</CardTitle>
            <CardDescription>26. Juni 2025</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Verbesserungen für Einzelschützen-Rangliste und Navigation der RWK-Ordnung.</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Einzelschützen-Rangliste</strong>: Sortierung nach Durchschnitt für fairere Bewertung</li>
              <li><strong>RWK-Ordnung</strong>: Klickbares Inhaltsverzeichnis mit Sprunglinks</li>
              <li><strong>Verbesserte Navigation</strong>: Optimierte Benutzerführung</li>
              <li><strong>Fairere Wertung</strong>: Schützen mit weniger Durchgängen nicht mehr benachteiligt</li>
            </ul>
            <div className="mt-4 flex justify-end">
              <Link href="/updates/v0.9.6" className="text-primary hover:text-primary/80 text-sm flex items-center">
                Details <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Version 0.9.5</CardTitle>
            <CardDescription>26. Juni 2025</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Analytics Dashboard, verbessertes Onboarding und UI-Optimierungen.</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>📊 <strong>Analytics Dashboard</strong>: Nutzungsstatistiken und Performance-Monitoring</li>
              <li>🎯 <strong>Interaktives Onboarding</strong>: Mit Emojis, Icons und praktischen Beispielen</li>
              <li>👥 <strong>Vereins-Dashboard</strong>: Für blutige Anfänger optimiert</li>
              <li>🔒 <strong>Rechtliche Absicherung</strong>: Copyright und Nutzungsbedingungen</li>
              <li>🎨 <strong>UI-Verbesserungen</strong>: Größere Texte und bessere Visualisierung</li>
            </ul>
            <div className="mt-4 flex justify-end">
              <Link href="/updates/v0.9.5" className="text-primary hover:text-primary/80 text-sm flex items-center">
                Details <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Version 0.9.4</CardTitle>
            <CardDescription>25. Juni 2025</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Update mit Fehlerbehebungen und UI-Verbesserungen für RWK-Tabellen und Terminverwaltung.</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>🐛 Behebung von Fehlern in der Datenbank-Recovery-Seite</li>
              <li>📅 Korrektur von Problemen beim Hinzufügen von Terminen</li>
              <li>📊 Verbesserte Sortierlogik für RWK-Tabellen</li>
              <li>🎨 Neue UI-Funktionen für RWK-Tabellen</li>
              <li>📱 Verbesserte mobile Ansicht für Tabellen</li>
              <li>🔧 Behebung von NaN-Fehlern in RWK-Tabellen</li>
              <li>📊 Optimiertes Statistik-Dashboard</li>
            </ul>
            <div className="mt-4 flex justify-end">
              <Link href="/updates/v0.9.4" className="text-primary hover:text-primary/80 text-sm flex items-center">
                Details <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Version 0.9.3</CardTitle>
            <CardDescription>25. Juni 2025</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Bugfix-Update für Ergebniserfassung und Terminverwaltung.</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>🐛 Korrektur der Anzeige von Teams mit fehlenden Ergebnissen</li>
              <li>🔧 Verbesserung der Benutzeroberfläche für vollständig erfasste Teams</li>
              <li>🔒 Behebung von Berechtigungsproblemen bei Liga-Updates</li>
              <li>📊 Filterung von Saisons - nur laufende und abgeschlossene Saisons werden angezeigt</li>
              <li>📅 Behebung des Fehlers bei der Bearbeitung von Terminen</li>
            </ul>
            <div className="mt-4 flex justify-end">
              <Link href="/updates/v0.9.3" className="text-primary hover:text-primary/80 text-sm flex items-center">
                Details <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Version 0.9.2</CardTitle>
            <CardDescription>20. Januar 2025</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Performance-Update mit Batch-Loading und Caching-Optimierungen.</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>⚡ Hybrid Lazy Loading für optimale Performance</li>
              <li>📊 Batch-Loading reduziert Datenbankabfragen von ~49 auf 3</li>
              <li>🔄 Intelligentes Caching für bereits geladene Daten</li>
              <li>⏱️ Sofortige Anzeige der Team-Tabellen</li>
            </ul>
            <div className="mt-4 flex justify-end">
              <Link href="/updates/v0.9.2" className="text-primary hover:text-primary/80 text-sm flex items-center">
                Details <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Weitere Update-Karten hier */}
        
        <Card className="shadow-sm hover:shadow-md transition-shadow md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Ältere Versionen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">

              <Link href="/updates/v0.9" className="text-primary hover:text-primary/80 flex items-center">
                Version 0.9.0 <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
              <Link href="/updates/v0.8" className="text-primary hover:text-primary/80 flex items-center">
                Version 0.8.0 <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
              <Link href="/updates/v0.7" className="text-primary hover:text-primary/80 flex items-center">
                Version 0.7.0 <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
              <Link href="/updates/v0.6" className="text-primary hover:text-primary/80 flex items-center">
                Version 0.6.0 <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
              <Link href="/updates/v0.5" className="text-primary hover:text-primary/80 flex items-center">
                Version 0.5.0 <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
              <Link href="/updates/v0.4" className="text-primary hover:text-primary/80 flex items-center">
                Version 0.4.0 <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
              <Link href="/updates/v0.3" className="text-primary hover:text-primary/80 flex items-center">
                Version 0.3.0 <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
              <Link href="/updates/v0.2" className="text-primary hover:text-primary/80 flex items-center">
                Version 0.2.0 <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
              <Link href="/updates/v0" className="text-primary hover:text-primary/80 flex items-center">
                Version 0.1.0 <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}