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
            <Badge variant="outline" className="text-xs py-1 px-2 border-green-300 bg-green-50 text-green-700">
              <span>Web-Version: 0.9.9.6 (31.07.2025)</span>
            </Badge>
            <Badge variant="outline" className="text-xs py-1 px-2 border-blue-300 bg-blue-50 text-blue-700">
              <span>App-Version: 0.9.1.0 (22.07.2025)</span>
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
              <CardTitle className="text-xl">Version 0.9.9.6 - Beta-Tester Fixes</CardTitle>
              <Badge variant="default" className="bg-green-600">Neu</Badge>
            </div>
            <CardDescription>31.07.2025</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Kritische Bugfixes für Schützen-Anzeige und vollständige KM-System Optimierungen mit Dark Mode Support.</p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
              <h4 className="font-semibold text-green-900 mb-2">🔧 Kritische Fixes v0.9.9.5a</h4>
              <div className="text-xs text-green-700">
                Schützen-Anzeige repariert + KM-System produktionsreif
              </div>
            </div>
            <ul className="list-disc pl-5 space-y-1">
              <li>👥 <strong>Schützen-Anzeige repariert:</strong> Erweiterte Query für clubId, rwkClubId und kmClubId</li>
              <li>📝 <strong>Namen-Fallback:</strong> Neue Importe ohne firstName/lastName zeigen aufgeteilten name</li>
              <li>👥 <strong>Mannschaftsinfo-Fix:</strong> Bidirektionale Suche über teamIds und shooterIds</li>
              <li>🌌 <strong>KM Dark Mode:</strong> Vollständige Dark Mode Unterstützung für alle Eingabefelder</li>
              <li>📋 <strong>Zwischenspeicher UX:</strong> Unter Buttons verschoben, weniger verwirrend</li>
              <li>🎯 <strong>"Automatisch" Badge lesbar:</strong> Dark Mode kompatible Farben</li>
              <li>📱 <strong>Mobile Onboarding-Fix:</strong> "Weiter" Button kollidiert nicht mehr mit Zurück-Geste</li>
              <li>📅 <strong>Jahr-System implementiert:</strong> KM 2026/2027/2028 mit automatischer Archivierung</li>
              <li>🔗 <strong>Play Store Beta-Test:</strong> Anmeldung für offizielle App-Version</li>
              <li>👥 <strong>KM-Mitglieder CRUD:</strong> Anlegen, Bearbeiten, Löschen vollständig funktional</li>
              <li>🔄 <strong>Mannschaften-Generator:</strong> Bessere Benutzer-Rückmeldung mit Loading-States</li>
              <li>📊 <strong>Demo-Hinweis entfernt:</strong> "KM-System Beta" statt "Demo-Modus"</li>
            </ul>
            <div className="mt-4 p-3 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border">
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <span className="font-medium text-green-800">🔧 Kritische Fixes</span>
                  <p className="text-xs text-green-600 mt-1">Schützen-Anzeige + KM-System vollständig funktional</p>
                </div>
                <span className="bg-green-600 text-white px-3 py-1 rounded text-xs">
                  🚀 v0.9.9.6
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm hover:shadow-md transition-shadow opacity-60">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-xl">Version 1.0.0 - KM-System (Alpha Test)</CardTitle>
              <Badge variant="outline" className="bg-gray-100 text-gray-600">Konzept</Badge>
            </div>
            <CardDescription>Geplant - Noch nicht dem Präsidium vorgestellt</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Konzept für vollständiges Kreismeisterschafts-System - noch in Planung und nicht implementiert.</p>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
              <h4 className="font-semibold text-gray-700 mb-2">💭 KM-System Konzept</h4>
              <div className="text-xs text-gray-600">
                Idee für komplettes KM-System - Status: Nur Konzept
              </div>
            </div>
            <ul className="list-disc pl-5 space-y-1">
              <li>🏆 <strong>Digitale KM-Meldungen:</strong> Vollständiges Meldungsformular mit Wettkampfklassen-Berechnung</li>
              <li>⚖️ <strong>Auflage-Regeln korrekt:</strong> Nur Schüler (≤14) und ab 41 Jahren startberechtigt</li>
              <li>📋 <strong>39 Disziplinen:</strong> Alle KM-Disziplinen mit korrekten SpO-Nummern</li>
              <li>👥 <strong>Multi-Verein-Support:</strong> RWK-Vereinsvertreter haben automatisch KM-Zugang</li>
              <li>📊 <strong>LM-Teilnahme pro Disziplin:</strong> Individuelle Landesmeisterschafts-Meldung</li>
              <li>💾 <strong>Zwischenspeicher-System:</strong> Meldungen sammeln wie beim RWK-System</li>
              <li>🔧 <strong>Meldungen bearbeiten/löschen:</strong> Vollständige CRUD-Funktionalität</li>
              <li>👥 <strong>Automatische Mannschaftsbildung:</strong> 3er-Teams nach Wettkampfklassen</li>
              <li>📋 <strong>Große Meldungsübersicht:</strong> Tabelle mit Filter und Suche</li>
              <li>🎯 <strong>VM-Ergebnisse getrennt:</strong> Pro Disziplin separate Eingabe</li>
              <li>🔄 <strong>Vereinfachte Auth:</strong> Keine separate km_user_permissions mehr</li>
              <li>📱 <strong>Benutzerfreundlich:</strong> Loading-States und Erfolgs-Hinweise</li>
            </ul>
            <div className="mt-4 p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border">
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <span className="font-medium text-gray-700">💭 Nur Konzept</span>
                  <p className="text-xs text-gray-600 mt-1">Noch nicht dem Präsidium vorgestellt</p>
                </div>
                <span className="bg-gray-500 text-white px-3 py-1 rounded text-xs">
                  💡 Idee
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-xl">Native App v0.9.1.0</CardTitle>
              <Badge variant="outline">Vorherige</Badge>
            </div>
            <CardDescription>22.07.2025</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Erste offizielle Version der nativen Android-App mit verbesserter PDF-Anzeige.</p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <h4 className="font-semibold text-blue-900 mb-2">📱 Native App v0.9.1.0</h4>
              <div className="text-xs text-blue-700">
                Verbesserte PDF-Anzeige und Statusleisten-Fix
              </div>
            </div>
            <ul className="list-disc pl-5 space-y-1">
              <li>📱 <strong>PDF-Öffnen-Funktion</strong> für native Android-App komplett überarbeitet</li>
              <li>🔗 <strong>Intent-URLs</strong> für direktes Öffnen von PDFs mit nativen PDF-Viewern</li>
              <li>🔄 <strong>Statusleisten-Fix</strong>: Die App überlagert nicht mehr die Statusleiste</li>
              <li>🔧 <strong>Hybride Versionierungsstrategie</strong>: Klare Trennung zwischen Web und App</li>
              <li>🔔 <strong>Update-Benachrichtigungen</strong>: Die App erkennt neue Versionen</li>
            </ul>
            <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border">
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <span className="font-medium text-blue-800">📱 Native App</span>
                  <p className="text-xs text-blue-600 mt-1">Verbesserte PDF-Anzeige für Android</p>
                </div>
                <span className="bg-blue-600 text-white px-3 py-1 rounded text-xs">
                  📱 v0.9.1.0
                </span>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <Link href="/updates/v0.9.1.0" className="text-primary hover:text-primary/80 text-sm flex items-center">
                Details <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-xl">Version 0.9.9.5</CardTitle>
              <Badge variant="outline">Vorherige</Badge>
            </div>
            <CardDescription>21.07.2025</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Download-Zähler für die App und umfassende Copyright-Informationen.</p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <h4 className="font-semibold text-blue-900 mb-2">📱 Neue Features Version 0.9.9.5</h4>
              <div className="text-xs text-blue-700">
                App-Download-Zähler und Copyright-Schutz
              </div>
            </div>
            <ul className="list-disc pl-5 space-y-1">
              <li>📊 <strong>App-Download-Zähler</strong>: Tracking für Android-App-Downloads</li>
              <li>📄 <strong>Copyright-Seite</strong>: Umfassende Urheberrechtshinweise</li>
              <li>🔒 <strong>Meta-Tags</strong>: SEO-Schutz für Urheberrecht</li>
              <li>📱 <strong>Verbesserte App-Beschreibung</strong>: Aktualisierte Informationen</li>
              <li>📊 <strong>Fehlende Ergebnisse</strong>: Deutliche Hervorhebung in Tabellen</li>
            </ul>
            <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border">
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <span className="font-medium text-blue-800">📱 App-Download-Zähler</span>
                  <p className="text-xs text-blue-600 mt-1">Statistik für Android-App-Downloads</p>
                </div>
                <span className="bg-blue-600 text-white px-3 py-1 rounded text-xs">
                  📊 Live
                </span>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <Link href="/updates/v0.9.9.5" className="text-primary hover:text-primary/80 text-sm flex items-center">
                Details <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-xl">Version 0.9.9.4</CardTitle>
              <Badge variant="outline">Vorherige</Badge>
            </div>
            <CardDescription>16.07.2025</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Download-Zähler für Dokumente und Native Android App Support.</p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <h4 className="font-semibold text-blue-900 mb-2">📱 Neue Features Version 0.9.9.4</h4>
              <div className="text-xs text-blue-700">
                Download-Tracking und native App-Entwicklung
              </div>
            </div>
            <ul className="list-disc pl-5 space-y-1">
              <li>📊 <strong>Download-Zähler</strong>: Tracking für alle PDF-Dokumente mit MongoDB-Speicherung</li>
              <li>📱 <strong>Native Android App</strong>: Capacitor-Integration für APK-Erstellung</li>
              <li>🔧 <strong>App-Build-System</strong>: Gradle-Konfiguration für saubere APK-Namen</li>
              <li>🎯 <strong>App-Icon</strong>: RWK-Logo als natives App-Symbol</li>
              <li>📋 <strong>Vollständige Dokumentation</strong>: Update-Guide und Build-Anleitung</li>
            </ul>
            <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border">
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <span className="font-medium text-blue-800">📱 Native App verfügbar</span>
                  <p className="text-xs text-blue-600 mt-1">APK-Download für Android-Geräte</p>
                </div>
                <span className="bg-blue-600 text-white px-3 py-1 rounded text-xs">
                  📱 Beta
                </span>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <Link href="/updates/v0.9.9.4" className="text-primary hover:text-primary/80 text-sm flex items-center">
                Details <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-xl">Version 0.9.9.3b</CardTitle>
              <Badge variant="outline">Vorherige</Badge>
            </div>
            <CardDescription>11.07.2025</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Vollständiges E-Mail-System mit Batch-Versand, anpassbarer Signatur und News-Optimierung.</p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
              <h4 className="font-semibold text-green-900 mb-2">📧 E-Mail-System Version 0.9.9.3b</h4>
              <div className="text-xs text-green-700">
                Professionelles E-Mail-System für Rundschreiben an 55+ Sportleiter
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
              <li>📧 <strong>Vollständiges E-Mail-System</strong>: Sportleiter + App-Benutzer, 55+ Kontakte importiert</li>
              <li>✍️ <strong>Anpassbare E-Mail-Signatur</strong>: Marcel Bünger, individuell konfigurierbar</li>
              <li>📊 <strong>E-Mail-Logs Dashboard</strong>: Monitoring, Troubleshooting, Resend-Integration</li>
              <li>📧 <strong>Batch-Versand (50/Batch)</strong>: 422 Error Fix, Rate-Limiting umgangen</li>
              <li>📬 <strong>Bounce-Handling</strong>: Automatische Admin-Benachrichtigungen bei E-Mail-Problemen</li>
              <li>📋 <strong>Kontakte-Verwaltung</strong>: CRUD für E-Mail-Verteiler, Import/Export</li>
              <li>📧 <strong>Reply-To Schutz</strong>: Automatische Weiterleitung an rwk-leiter-ksv@gmx.de</li>
              <li>📰 <strong>News-Anzeige erweitert</strong>: 300→800 Zeichen für vollständige Artikel</li>
              <li>🔒 <strong>Firestore Rules erweitert</strong>: admin_settings + email_contacts abgesichert</li>
            </ul>
            <div className="mt-4 p-3 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border">
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <span className="font-medium text-green-800">📧 E-Mail-System Live</span>
                  <p className="text-xs text-green-600 mt-1">Batch-Versand + Signatur + Monitoring + 55+ Kontakte</p>
                </div>
                <span className="bg-green-600 text-white px-3 py-1 rounded text-xs">
                  📧 Bereit
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
              <CardTitle className="text-xl">Version 0.9.9.3a</CardTitle>
              <Badge variant="outline">Vorherige</Badge>
            </div>
            <CardDescription>11.07.2025</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Deployment-Verifikation und erste PWA-Optimierungen.</p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <h4 className="font-semibold text-blue-900 mb-2">🔧 Verifikation Version 0.9.9.3a</h4>
              <div className="text-xs text-blue-700">
                Deployment-Test und erste Optimierungen
              </div>
            </div>
            <ul className="list-disc pl-5 space-y-1">
              <li>📱 <strong>News auf Startseite</strong>: Echte Integration der neuesten veröffentlichten Artikel</li>
              <li>🔧 <strong>PWA-Verbesserungen</strong>: Bessere App-Erkennung und browserconfig.xml für Windows</li>
              <li>🚫 <strong>Sentry entfernt</strong>: Keine Trial-Abhängigkeiten mehr, App läuft vollständig eigenständig</li>
              <li>🔍 <strong>Deployment-Verifikation</strong>: Version im Footer für erfolgreiche Updates</li>
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
              <CardTitle className="text-xl">Version 0.9.9.3</CardTitle>
              <Badge variant="outline">Vorherige</Badge>
            </div>
            <CardDescription>15.07.2025</CardDescription>
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
            <CardTitle className="text-xl flex items-center gap-2">
              🚀 Roadmap - Was kommt als nächstes?
            </CardTitle>
            <CardDescription>
              Geplante Features und Verbesserungen ohne feste Termine
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="roadmap-item border-l-4 border-l-green-500 pl-4 py-2 bg-green-50 rounded-r">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">🏆</span>
                  <h4 className="font-semibold text-green-900">Kreismeisterschaftsmeldungen</h4>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">✅ Fertig</Badge>
                </div>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>✅ Digitale Meldungen zur Kreismeisterschaft</li>
                  <li>✅ Automatische Wettkampfklassenberechnung</li>
                  <li>✅ Vereinfachte Mannschaftsbildung</li>
                  <li>✅ Integration mit bestehender Mitgliederverwaltung</li>
                </ul>
              </div>

              <div className="roadmap-item border-l-4 border-l-blue-500 pl-4 py-2 bg-blue-50 rounded-r">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">📊</span>
                  <h4 className="font-semibold text-blue-900">KM-Startplan-Generator</h4>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">In Planung</Badge>
                </div>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Automatische Startzeit-Generierung</li>
                  <li>• Zeitslot-Management</li>
                  <li>• PDF-Export für Startpläne</li>
                  <li>• Integration mit Meldungen</li>
                </ul>
              </div>

              <div className="roadmap-item border-l-4 border-l-orange-500 pl-4 py-2 bg-orange-50 rounded-r">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">📊</span>
                  <h4 className="font-semibold text-orange-900">Verbesserte Statistiken</h4>
                  <Badge variant="secondary" className="bg-orange-100 text-orange-800">Geplant</Badge>
                </div>
                <ul className="text-sm text-orange-700 space-y-1">
                  <li>• Erweiterte Auswertungen</li>
                  <li>• Grafische Darstellungen</li>
                  <li>• Vergleiche zwischen Saisons</li>
                </ul>
              </div>

              <div className="roadmap-item border-l-4 border-l-purple-500 pl-4 py-2 bg-purple-50 rounded-r">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">🔧</span>
                  <h4 className="font-semibold text-purple-900">Weitere Verbesserungen</h4>
                  <Badge variant="secondary" className="bg-purple-100 text-purple-800">Geplant</Badge>
                </div>
                <ul className="text-sm text-purple-700 space-y-1">
                  <li>• Performance-Optimierungen</li>
                  <li>• Mobile App-Verbesserungen</li>
                  <li>• Zusätzliche Export-Funktionen</li>
                </ul>
              </div>
            </div>
            
            <div className="mt-6 p-3 bg-gray-50 rounded border text-sm text-gray-600">
              <em>Diese Roadmap zeigt geplante Features ohne feste Termine. Änderungen und Anpassungen sind möglich.</em>
            </div>
          </CardContent>
        </Card>

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