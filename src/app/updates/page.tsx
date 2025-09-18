// src/app/updates/page.tsx
"use client";

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { VersionBadge, LiveBadge } from '@/components/ui/version-badge';

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
            <VersionBadge className="border-green-300 bg-green-50 text-green-700">
              Web-Version: 1.7.1 (20.09.2025)
            </VersionBadge>
            <VersionBadge className="border-blue-300 bg-blue-50 text-blue-700">
              App-Version: 0.9.4.1 (02.09.2025)
            </VersionBadge>
            <LiveBadge />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-xl">Version 1.7.1 - Mobile UX Revolution</CardTitle>
              <Badge variant="default" className="bg-green-600">Aktuell</Badge>
            </div>
            <CardDescription>20.09.2025</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Vollständige Mobile-Optimierung aller KM-Bereiche mit responsiven Card-Layouts, mobile-freundliche Button-Anordnung und verbesserte Sichtbarkeit von Formularen und Aktions-Buttons.</p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
              <h4 className="font-semibold text-green-900 mb-2">📱 Mobile UX Revolution v1.7.1</h4>
              <div className="text-xs text-green-700">
                Responsive Design und optimierte mobile Bedienung
              </div>
            </div>
            <ul className="list-disc pl-5 space-y-1">
              <li>📱 <strong>KM-Bereiche Mobile-Optimierung:</strong> Alle KM-Tabellen durch responsive Card-Layouts ersetzt für bessere mobile Lesbarkeit</li>
              <li>🔘 <strong>Button-Layout Fixes:</strong> Buttons stapeln sich vertikal auf mobilen Geräten statt horizontal gequetscht zu werden</li>
              <li>👁️ <strong>Verbesserte Sichtbarkeit:</strong> "Neuen Schützen anlegen" Button unter Titel platziert, nicht mehr seitlich versteckt</li>
              <li>🎨 <strong>Dark Mode Fixes:</strong> Farbige Dialog-Boxen in "Erste Schritte" Tour haben jetzt korrekte Kontraste im Dark Mode</li>
              <li>📋 <strong>Formular-Optimierung:</strong> Mitgliederverwaltung Formulare sind prominent sichtbar mit grünen Rahmen und Labels</li>
              <li>🗂️ <strong>Responsive Tabellen:</strong> Desktop behält Tabellen, Mobile zeigt Cards - beste UX für jedes Gerät</li>
              <li>🎯 <strong>Navigation Updates:</strong> Burger-Menü zeigt "Dashboard" statt "Verein" für klarere Navigation</li>
              <li>📝 <strong>Aktualisierte Inhalte:</strong> Onboarding-Tour mit aktuellen 2024/25 Saison-Informationen und realistischen Beispielen</li>
              <li>🔄 <strong>Vereinssoftware Layout:</strong> "Zurück zum Dashboard" Button unter Titel für bessere mobile Bedienung</li>
              <li>📊 <strong>KM-Altersklassen:</strong> Mobile Card-Layout für bessere Übersicht der Wettkampfklassen auf kleinen Bildschirmen</li>
              <li>👥 <strong>KM-Mannschaften:</strong> Responsive Button-Anordnung und "Regeln bearbeiten" unter Titel statt daneben</li>
              <li>🎯 <strong>Konsistente UX:</strong> Alle Bereiche folgen dem gleichen responsive Design-Prinzip für einheitliche Bedienung</li>
            </ul>
            <div className="mt-4 p-3 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border">
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <span className="font-medium text-green-800">📱 Mobile UX Revolution</span>
                  <p className="text-xs text-green-600 mt-1">Responsive Cards & Button-Layouts</p>
                </div>
                <span className="bg-green-600 text-white px-3 py-1 rounded text-xs">
                  🚀 v1.7.1
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-xl">Version 1.7.0 - Support-System & Development-Tools</CardTitle>
              <Badge variant="outline">Vorherige</Badge>
            </div>
            <CardDescription>18.09.2025</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Vollständiges Support-Code-System mit temporärem Vereinszugang, benutzerfreundliche Fehlermeldungen bei fehlendem Zugang und Development-Club mit 20 Test-Mitgliedern für Entwicklung.</p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
              <h4 className="font-semibold text-green-900 mb-2">🛠️ Support-System & Development-Tools v1.7.0</h4>
              <div className="text-xs text-green-700">
                Professionelles Support-System und Development-Umgebung
              </div>
            </div>
            <ul className="list-disc pl-5 space-y-1">
              <li>🔑 <strong>Support-Code-System:</strong> Temporärer Vereinszugang für Support-Team mit zeitlich begrenzten Codes</li>
              <li>🏢 <strong>Development-Club:</strong> Separater Test-Verein mit 20 Mitgliedern für sichere Entwicklung</li>
              <li>⚠️ <strong>Benutzerfreundliche Fehlermeldungen:</strong> Klare Anweisungen bei fehlendem Zugang statt technischer Fehler</li>
              <li>🎯 <strong>Prioritäten-System:</strong> Support-Code > Development-Club > Fehlermeldung für optimale UX</li>
              <li>🔧 <strong>Admin-Tools:</strong> Vereinfachte Development-Setup-Tools für schnellere Entwicklung</li>
              <li>📱 <strong>Mobile-Optimierung:</strong> Support-Dialoge funktionieren perfekt auf allen Geräten</li>
              <li>🔒 <strong>Sicherheit:</strong> Support-Codes sind zeitlich begrenzt und automatisch ablaufend</li>
              <li>🎮 <strong>Development-Workflow:</strong> Separate Umgebung verhindert Produktionsdaten-Konflikte</li>
            </ul>
            <div className="mt-4 p-3 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border">
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <span className="font-medium text-green-800">🛠️ Support-System & Development</span>
                  <p className="text-xs text-green-600 mt-1">Support-Codes & Test-Umgebung</p>
                </div>
                <span className="bg-green-600 text-white px-3 py-1 rounded text-xs">
                  🚀 v1.7.0
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-xl">Version 1.6.0 - Rollen-System Revolution</CardTitle>
              <Badge variant="outline">Vorherige</Badge>
            </div>
            <CardDescription>15.09.2025</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Komplettes 3-Tier-Rollensystem mit Platform/KV/Club-Rollen, URL-Level Security, granulare Firestore-Regeln und Multi-Verein-Support mit finalem Abschluss der Legacy-Rollen-Migration.</p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
              <h4 className="font-semibold text-green-900 mb-2">🔐 Rollen-System Revolution v1.6.0</h4>
              <div className="text-xs text-green-700">
                Professionelles 3-Tier-Rollensystem mit granularer Sicherheit
              </div>
            </div>
            <ul className="list-disc pl-5 space-y-1">
              <li>🏗️ <strong>3-Tier-Rollensystem:</strong> Platform-Rollen (SUPERADMIN), KV-Rollen (KM_ADMIN, KM_ORGA), Club-Rollen (SPORTLEITER, VORSTAND, etc.)</li>
              <li>🔒 <strong>URL-Level Security:</strong> Jede Route prüft spezifische Berechtigungen, keine unautorisierten Zugriffe mehr</li>
              <li>🛡️ <strong>Granulare Firestore-Regeln:</strong> Datenbank-Level Sicherheit mit rollen-spezifischen Zugriffskontrollen</li>
              <li>🏢 <strong>Multi-Verein-Support:</strong> Ein Benutzer kann mehrere Vereine gleichzeitig verwalten</li>
              <li>📋 <strong>Lizenz-Management:</strong> Vereinssoftware-Lizenzen pro Verein mit automatischer Zugriffskontrolle</li>
              <li>🔄 <strong>Legacy-Migration abgeschlossen:</strong> Alle alten "vereinsvertreter" und "vereinsvorstand" Rollen migriert</li>
              <li>⚡ <strong>Performance-Optimierung:</strong> Effiziente Rollen-Abfragen mit Caching</li>
              <li>🎯 <strong>Benutzerfreundlich:</strong> Automatische Weiterleitung basierend auf Berechtigungen</li>
              <li>📊 <strong>Admin-Dashboard:</strong> Vollständige Rollen-Verwaltung für Administratoren</li>
              <li>🔧 <strong>Development-Tools:</strong> Rollen-Debugging und Berechtigungs-Analyse</li>
            </ul>
            <div className="mt-4 p-3 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border">
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <span className="font-medium text-green-800">🔐 Rollen-System Revolution</span>
                  <p className="text-xs text-green-600 mt-1">3-Tier-System & Security</p>
                </div>
                <span className="bg-green-600 text-white px-3 py-1 rounded text-xs">
                  🚀 v1.6.0
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-xl">Version 1.5.9 - Vereinsbereich UX-Verbesserungen</CardTitle>
              <Badge variant="outline">Vorherige</Badge>
            </div>
            <CardDescription>14.09.2025</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Vereinsbereich UX-Verbesserungen: Aufklappbare Mannschaftsdetails in der Übersicht mit Schützen-Anzeige und bereits ausgewählte Schützen im Dialog sichtbar mit direkter Entfernungsmöglichkeit.</p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
              <h4 className="font-semibold text-green-900 mb-2">📱 Vereinsbereich UX-Verbesserungen v1.5.9</h4>
              <div className="text-xs text-green-700">
                Aufklappbare Mannschaftsdetails und bessere Schützen-Auswahl im Dialog
              </div>
            </div>
            <ul className="list-disc pl-5 space-y-1">
              <li>🔽 <strong>Aufklappbare Mannschaftsdetails:</strong> Chevron-Button neben jedem Mannschaftsnamen zum Anzeigen aller gemeldeten Schützen</li>
              <li>👥 <strong>Schützen-Anzeige in Übersicht:</strong> Grid-Layout mit Namen, Geschlecht und Geburtsjahr wie im Admin-Bereich</li>
              <li>📱 <strong>Bereits ausgewählte Schützen im Dialog:</strong> Blaue Box oberhalb der Schützen-Suche zeigt alle bereits ausgewählten Schützen</li>
              <li>❌ <strong>Direktes Entfernen:</strong> Jeder ausgewählte Schütze hat ein "×" zum sofortigen Entfernen ohne Scrollen</li>
              <li>🔄 <strong>Konsistente UX:</strong> Gleiche Funktionalität wie im Admin-Bereich für einheitliche Bedienung</li>
              <li>📱 <strong>Mobile-responsive:</strong> Funktioniert perfekt auf allen Geräten mit Touch-optimierten Buttons</li>
              <li>⚡ <strong>On-demand Laden:</strong> Schützen-Daten werden erst beim ersten Aufklappen geladen für bessere Performance</li>
              <li>🔍 <strong>Fallback für nicht gefundene Schützen:</strong> Zeigt Platzhalter für ungültige Schützen-IDs</li>
              <li>📊 <strong>Zähler-Anzeige:</strong> "Bereits ausgewählte Schützen (3):" zeigt immer die aktuelle Anzahl</li>
              <li>🎯 <strong>Beta-Tester Feedback umgesetzt:</strong> Direkte Antwort auf Benutzer-Wünsche für bessere Übersicht</li>
              <li>🏦 <strong>Multi-Bank-Export:</strong> Sparkasse, Volksbank, Commerzbank, Deutsche Bank Formate für Online-Banking</li>
              <li>📋 <strong>Erweiterte Beitragsliste:</strong> Zahlungsart-Dropdown (SEPA, Überweisung, Bar, Dauerauftrag) mit SEPA-Mandate-Anzeige</li>
              <li>📄 <strong>Professionelle Mahnbriefe:</strong> PDF-Generator mit Schützenbruder/Schützenschwester-Anrede und 14-Tage-Zahlungsfrist</li>
              <li>🏦 <strong>SEPA-Mandate-Übersicht:</strong> Vollständige Mandate-Verwaltung mit Bankname-Anzeige und Status-Tracking</li>
              <li>💰 <strong>Vereinseinstellungen:</strong> Gläubiger-ID, Vereinsdaten und Bankverbindung konfigurierbar pro Verein</li>
              <li>📊 <strong>Automatische BIC-Berechnung:</strong> Deutsche Banken werden automatisch aus IBAN erkannt (Sparkasse, VR-Bank, etc.)</li>
              <li>📄 <strong>SEPA-XML Export:</strong> Standardkonformer Export für alle deutschen Banken mit korrekten Mandatsreferenzen</li>
              <li>💸 <strong>Mahnwesen:</strong> Vollständige Bankdaten in Mahnbriefen mit Empfänger, IBAN, BIC und Verwendungszweck</li>
              <li>🎯 <strong>Praxistauglich:</strong> Alle Mock-Funktionen entfernt, nur noch echte Features für den Vereinsalltag</li>
              <li>📱 <strong>CSV-Import:</strong> SEPA-Daten können per CSV importiert werden mit automatischer Zuordnung zu Mitgliedern</li>
              <li>🔧 <strong>Beitragsberechnung:</strong> Korrekte Jahresbeiträge nach konfigurierten Beitragssätzen statt Mock-Daten</li>
              <li>🎂 <strong>Geburtstage & Jubiläen:</strong> Funktionale Verwaltung mit korrekter Altersberechnung und Vereinsjahren aus Eintrittsdatum</li>
              <li>🏆 <strong>Jubiläen-Konfiguration:</strong> Individuell konfigurierbare Bronze/Silber/Gold-Ehrungen für Vereinsjubiläen</li>
              <li>🎉 <strong>Geburtstag-Aktionen:</strong> Konfigurierbare Karten/Gutscheine für besondere Geburtstage (18, 50, 60, 70+)</li>
              <li>📋 <strong>Getrennte Listen:</strong> Saubere Trennung zwischen Geburtstag-Aktionen und Vereinsjubiläen</li>
              <li>🏆 <strong>Lizenzen & Ausbildungen:</strong> 8 echte Schießsport-Ausbildungen (Waffensachkunde bis Trainer C Leistung)</li>
              <li>👥 <strong>12 Vorstandspositionen:</strong> Vollständige Verwaltung von 1. Vorsitzender bis Kassenprüfer</li>
              <li>⚠️ <strong>Automatische Ablauf-Überwachung:</strong> 90-Tage-Warnung vor Ablauf mit Status-Ampel (Grün/Gelb/Rot)</li>
              <li>🏆 <strong>DSB-Lizenznummern:</strong> Vollständige Integration für professionelle Lizenz-Verwaltung</li>
              <li>📊 <strong>Live-Statistiken:</strong> Mitglieder, Lizenzen, Ausbildungen und Ablauf-Warnungen</li>
              <li>🏢 <strong>Multi-Tenant Firestore:</strong> Club-spezifische Datentrennung mit clubs/[clubId]/mitglieder</li>
              <li>📝 <strong>PDF-Export & Echtzeit:</strong> Professionelle Listen zum Drucken mit sofortiger Synchronisation</li>
            </ul>
            <div className="mt-4 p-3 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border">
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <span className="font-medium text-green-800">📱 Vereinsbereich UX-Verbesserungen</span>
                  <p className="text-xs text-green-600 mt-1">Aufklappbare Details + Schützen-Dialog</p>
                </div>
                <span className="bg-green-600 text-white px-3 py-1 rounded text-xs">
                  🚀 v1.5.9
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-xl">Version 1.5.8 - SEPA, Jubiläen & Lizenzen-Management</CardTitle>
              <Badge variant="outline">Vorherige</Badge>
            </div>
            <CardDescription>10.09.2025</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Vollständiges Vereinsrecht-Modul mit Protokoll-Management, Wahlen-System, Satzungsverwaltung und Gemeinnützigkeits-Compliance für moderne Schützenvereine.</p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
              <h4 className="font-semibold text-green-900 mb-2">⚖️ Vereinsrecht-Modul v1.5.6</h4>
              <div className="text-xs text-green-700">
                Digitale Vereinsführung mit Protokollen, Wahlen und Compliance
              </div>
            </div>
            <ul className="list-disc pl-5 space-y-1">
              <li>📄 <strong>Protokoll-Management:</strong> Vollständige Sitzungsprotokolle mit Tagesordnung, Anwesenden und Beschlüssen digital erstellen</li>
              <li>🗳️ <strong>Wahlen-System:</strong> Digitale Vereinswahlen mit Kandidaten-Verwaltung, Abstimmung und Ergebnis-Auswertung</li>
              <li>📜 <strong>Satzungsverwaltung:</strong> Vereinssatzung, Geschäftsordnungen und Regelwerke zentral verwalten mit Versionierung</li>
              <li>🛡️ <strong>Gemeinnützigkeits-Compliance:</strong> Compliance-Überwachung, Spendenverwaltung und Tätigkeitsberichte</li>
              <li>🔄 <strong>Status-Workflow:</strong> Protokolle von Entwurf → Fertig → Versendet mit automatischer Statusverfolgung</li>
              <li>✏️ <strong>Live-Bearbeitung:</strong> Tagesordnungspunkte, Anwesende und Beschlüsse direkt hinzufügen und bearbeiten</li>
              <li>📊 <strong>Dashboard-Integration:</strong> Vereinsrecht-Modul vollständig in Vereinssoftware-Dashboard integriert</li>
              <li>🔥 <strong>Firebase-Integration:</strong> Alle APIs funktional mit Firestore-Backend und Echtzeit-Synchronisation</li>
              <li>📱 <strong>Responsive Design:</strong> Vollständig mobile-optimiert für Tablet und Smartphone-Nutzung</li>
              <li>🔍 <strong>Such- & Filterfunktionen:</strong> Intelligente Suche durch alle Protokolle, Wahlen und Dokumente</li>
            </ul>
            <div className="mt-4 p-3 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border">
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <span className="font-medium text-green-800">⚖️ Vereinsrecht-Modul</span>
                  <p className="text-xs text-green-600 mt-1">Protokolle, Wahlen & Compliance</p>
                </div>
                <Link href="/updates/v0.13.0">
                  <span className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700 cursor-pointer">
                    🚀 v1.5.6
                  </span>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-xl">Version 1.5.5 - KM-Jahresverwaltung & Inline-Bearbeitung</CardTitle>
              <Badge variant="outline">Vorherige</Badge>
            </div>
            <CardDescription>10.09.2025</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">KM-Jahresverwaltung mit automatischen Collections, Inline-Bearbeitung in Meldungen-Tabelle und Migration-System für bestehende Daten.</p>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>📅 <strong>KM-Jahresverwaltung:</strong> Jahre anlegen, Meldeschlüsse verwalten und Status ändern</li>
              <li>🗂️ <strong>Jahresspezifische Collections:</strong> km_meldungen_JAHR_DISZIPLIN für bessere Organisation</li>
              <li>✏️ <strong>Inline-Bearbeitung:</strong> LM-Teilnahme und VM-Ergebnis direkt in Tabelle ändern</li>
              <li>🚀 <strong>Migration-System:</strong> Bestehende KM-Daten automatisch migrieren</li>
            </ul>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-xl">Version 1.5.4 - Globale Suche & Dark Mode</CardTitle>
              <Badge variant="outline">Vorherige</Badge>
            </div>
            <CardDescription>08.09.2025</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Aufgaben-Management für Vorstand, globale Suche über alle Bereiche, vollständiger Dark Mode mit System-Integration und erweiterte Tabellen-Suche.</p>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>📋 <strong>Aufgaben-Management:</strong> To-Do-Listen für Vorstand mit Prioritäten und Fälligkeitsdaten</li>
              <li>🔍 <strong>Globale Suche:</strong> Intelligente Suche über Mitglieder, Aufgaben, Finanzen und alle Vereinsbereiche</li>
              <li>🌙 <strong>Vollständiger Dark Mode:</strong> System-Integration mit automatischem Wechsel und verbesserter Farbpalette</li>
              <li>📋 <strong>Erweiterte Tabellen-Suche:</strong> Live-Suche in allen Mitglieder- und Vereinstabellen</li>
            </ul>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-xl">Version 1.5.3 - Erweiterte Vereinsfunktionen</CardTitle>
              <Badge variant="outline">Vorherige</Badge>
            </div>
            <CardDescription>05.09.2025</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Vorstandsposten-Verwaltung, Jubiläums-Urkunden Generator und erweiterte Statistik-Dashboards für professionelle Vereinsführung.</p>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>👔 <strong>Vorstandsposten-Verwaltung:</strong> 12 offizielle Positionen mit Amtszeiten und Verantwortlichkeiten</li>
              <li>🏆 <strong>Jubiläums-Urkunden Generator:</strong> Automatische Urkunden mit ESG-Logo und digitaler Unterschrift</li>
              <li>📈 <strong>Statistik-Dashboard:</strong> Erweiterte Mitglieder-Auswertungen mit Grafiken und Trends</li>
              <li>👥 <strong>Gender-spezifische Anreden:</strong> SCHÜTZENBRUDER/SCHÜTZENSCHWESTER für korrekte Urkunden</li>
            </ul>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-xl">Version 1.5.2 - SEPA & Lizenzen Integration</CardTitle>
              <Badge variant="outline">Vorherige</Badge>
            </div>
            <CardDescription>02.09.2025</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">SEPA-Lastschrift in Beitragsverwaltung, Lizenzen & Ausbildungen mit echten Schießsport-Ausbildungen und Ablauf-Überwachung.</p>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>💳 <strong>SEPA-Lastschrift Integration:</strong> Vollständige SEPA-Mandate-Verwaltung in der Beitragsverwaltung</li>
              <li>🏆 <strong>Lizenzen & Ausbildungen:</strong> 8 echte Schießsport-Ausbildungen mit Ablaufdaten und Erinnerungen</li>
              <li>⏰ <strong>Ablauf-Überwachung:</strong> Automatische Benachrichtigungen bei ablaufenden Lizenzen und Ausbildungen</li>
              <li>🏢 <strong>Vereinsfunktionen erweitert:</strong> Kassenwart-Tools und erweiterte Mitgliederverwaltung</li>
            </ul>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-xl">Version 1.5.1 - Mobile Navigation & Dialog Fixes</CardTitle>
              <Badge variant="outline">Vorherige</Badge>
            </div>
            <CardDescription>30.08.2025</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Burger-Menü mit Logout-Button, Android Safe Areas für Dialoge, korrekte Dialog-Positionierung und verbesserte mobile Benutzerfreundlichkeit.</p>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>🍔 <strong>Burger-Menü mit Logout:</strong> Vollständige Navigation mit Logout-Button für mobile Geräte</li>
              <li>📱 <strong>Android Safe Areas:</strong> Dialoge respektieren Statusleiste und Navigationsleiste korrekt</li>
              <li>💬 <strong>Dialog-Positionierung:</strong> Keine abgeschnittenen Fenster mehr auf mobilen Geräten</li>
              <li>📱 <strong>Mobile UX verbessert:</strong> Entfernte redundante untere Navigation für sauberes Design</li>
            </ul>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-xl">Version 1.5.0 - Vereinssoftware Revolution</CardTitle>
              <Badge variant="outline">Vorherige</Badge>
            </div>
            <CardDescription>15.01.2025</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Vollständige Mitgliederverwaltung mit 99 Geburtstagen, Eintrittsdaten-Import, individualisierbare Jubiläen-Konfiguration und 5-Jahres-Vorausplanung.</p>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>🏠 <strong>Vollständige Mitgliederverwaltung:</strong> 99 importierte Geburtstage und 90 Vereins-/DSB-Eintritte</li>
              <li>🎂 <strong>Individualisierbare Jubiläen:</strong> Konfigurierbare Jubiläums-Jahre für alle Vereine</li>
              <li>📅 <strong>5-Jahres-Vorausplanung:</strong> 2023-2030 Ehrungen mit exakter tagesgenauen Altersberechnung</li>
              <li>📊 <strong>Professionelle Mitgliederdatenbank:</strong> Import-Funktionen und Statistik-Dashboard</li>
            </ul>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-xl">App-Version 0.9.4.1 - Mobile-Optimierung & Stabilität</CardTitle>
              <Badge variant="default" className="bg-blue-600">App-Update</Badge>
            </div>
            <CardDescription>19.08.2025</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Mobile-Optimierung und Stabilitätsverbesserungen: Update-System, Navigation-Fixes und Touch-Optimierungen für bessere App-Erfahrung.</p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <h4 className="font-semibold text-blue-900 mb-2">📱 Mobile-Optimierung v0.9.4.1</h4>
              <div className="text-xs text-blue-700">
                Bessere mobile Bedienung und automatische Updates
              </div>
            </div>
            <ul className="list-disc pl-5 space-y-1">
              <li>🔔 <strong>Update-Benachrichtigung:</strong> Automatische Prüfung auf neue Versionen mit GitHub API</li>
              <li>📱 <strong>Play Store Integration:</strong> Intelligente Weiterleitung - Play Store für App Store Updates, APK für Sideload</li>
              <li>🗑️ <strong>Auto-Cleanup:</strong> Speicher wird bei App-Updates automatisch geleert (localStorage, sessionStorage, Cache)</li>
              <li>📱 <strong>Mobile Navigation:</strong> Hamburger-Menü öffnet sich korrekt im Bildschirm, keine Radix-Abhängigkeiten</li>
              <li>🎯 <strong>KM-Orga Optimierung:</strong> Kompakte Darstellung für mobile Geräte, einspaltige Layouts</li>
              <li>📄 <strong>Dokumente-Seite:</strong> Bessere Trennung zwischen Kategorien mit Trennlinien</li>
              <li>🏠 <strong>KM-Dashboard:</strong> Mobile-optimierte Layouts, kompaktere Button-Anordnung</li>
              <li>⚛️ <strong>React Stabilität:</strong> Hydration-Fehler behoben, mounted State für Client-Komponenten</li>
              <li>🌙 <strong>Theme-Toggle:</strong> Vereinfachter Dark/Light Mode Wechsel ohne Tooltip-Wrapper</li>
              <li>🔧 <strong>Navigation:</strong> "Vereinsbereich" statt "RWK", Updates-Punkt im Mobile-Menü sichtbar</li>
              <li>📱 <strong>Touch-Optimierung:</strong> Bessere Bedienung auf Touchscreens, größere Klickbereiche</li>
              <li>🎯 <strong>Version-Management:</strong> Zentrale Versionsverwaltung, automatische Versionsnummer-Updates</li>
            </ul>
            <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border">
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <span className="font-medium text-blue-800">📱 Mobile-Optimierung</span>
                  <p className="text-xs text-blue-600 mt-1">Navigation, Updates & Touch-UX</p>
                </div>
                <span className="bg-blue-600 text-white px-3 py-1 rounded text-xs">
                  📱 v0.9.4.1
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
        

        

        

        



        

        

        

        


        
        <Card className="shadow-sm hover:shadow-md transition-shadow md:col-span-2 lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Ältere Versionen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <Link href="/updates/v0.12" className="text-primary hover:text-primary/80 flex items-center">
                Version 0.12.x <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
              <Link href="/updates/v0.11" className="text-primary hover:text-primary/80 flex items-center">
                Version 0.11.x <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
              <Link href="/updates/v0.10" className="text-primary hover:text-primary/80 flex items-center">
                Version 0.10.x <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
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