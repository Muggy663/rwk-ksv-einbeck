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
              <span>Web-Version: 0.11.9 (02.09.2025)</span>
            </Badge>
            <Badge variant="outline" className="text-xs py-1 px-2 border-blue-300 bg-blue-50 text-blue-700">
              <span>App-Version: 0.9.4.1 (02.09.2025)</span>
            </Badge>
            <Badge variant="default" className="text-xs py-1 px-2 bg-green-600">
              <span>🌐 Live: rwk-einbeck.de</span>
            </Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
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
        
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-xl">Version 0.11.9 - FAQ-Suche für RWK-Ordnung: Intelligente Hilfe</CardTitle>
              <Badge variant="outline">Web-Update</Badge>
            </div>
            <CardDescription>02.09.2025</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Umfassende FAQ-Suche für die RWK-Ordnung: Über 50 häufige Fragen mit intelligenter Suche, Fuzzy-Matching und Tippfehler-Toleranz.</p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
              <h4 className="font-semibold text-green-900 mb-2">🔍 FAQ-System v0.11.9</h4>
              <div className="text-xs text-green-700">
                Intelligente Hilfe für alle Fragen zur RWK-Ordnung
              </div>
            </div>
            <ul className="list-disc pl-5 space-y-1">
              <li>🔍 <strong>50+ FAQ-Einträge:</strong> Alle wichtigen Fragen zu RWK-Ordnung, Klasseneinteilung, Terminen und Regeln</li>
              <li>🤖 <strong>Intelligente Suche:</strong> Findet auch bei Tippfehlern und Umlauten die richtigen Antworten</li>
              <li>📝 <strong>Fuzzy-Matching:</strong> "schiessen" findet "schießen", "schuetze" findet "Schütze"</li>
              <li>🔄 <strong>Synonym-Erkennung:</strong> "Liga", "Klasse", "Klasseneinteilung" - alles wird gefunden</li>
              <li>📊 <strong>Score-basierte Sortierung:</strong> Beste Treffer zuerst, relevante Ergebnisse priorisiert</li>
              <li>📱 <strong>Benutzerfreundlich:</strong> Suche ab 1 Zeichen, "Alle FAQs anzeigen" Button</li>
              <li>📍 <strong>Paragraph-Referenzen:</strong> Jede Antwort mit korrekter §-Nummer der RWK-Ordnung</li>
              <li>🎯 <strong>Zielgruppen-optimiert:</strong> Besonders für ältere und hilfbedürftige Benutzer entwickelt</li>
              <li>💬 <strong>Natürliche Sprache:</strong> "Wann ist Luftdruck?", "Was brauche ich?", "Wer darf mitmachen?"</li>
              <li>🔗 <strong>Integriert in RWK-Ordnung:</strong> Direkt auf /rwk-ordnung verfügbar</li>
              <li>💰 <strong>Kostenlos:</strong> Keine externen APIs, läuft komplett auf Vercel Free Tier</li>
              <li>⚡ <strong>Schnell:</strong> Sofortige Antworten ohne Ladezeiten</li>
            </ul>
            <div className="mt-4 p-3 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border">
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <span className="font-medium text-green-800">🔍 FAQ-System</span>
                  <p className="text-xs text-green-600 mt-1">Intelligente Hilfe & 50+ Fragen</p>
                </div>
                <span className="bg-green-600 text-white px-3 py-1 rounded text-xs">
                  🚀 v0.11.9
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-xl">Version 0.11.8 - Zeitungsbericht-Generator: Schützen-Namen Fix</CardTitle>
              <Badge variant="outline">Vorherige</Badge>
            </div>
            <CardDescription>02.09.2025</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Zeitungsbericht-Generator optimiert: Schützen-Namen werden jetzt korrekt aus der Datenbank geladen und Vereinsnamen-Anzeige vereinfacht.</p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
              <h4 className="font-semibold text-green-900 mb-2">📰 Zeitungsbericht-Fix v0.11.8</h4>
              <div className="text-xs text-green-700">
                Korrekte Schützen-Namen und vereinfachte Vereinsname-Anzeige
              </div>
            </div>
            <ul className="list-disc pl-5 space-y-1">
              <li>👥 <strong>Schützen-Namen Fix:</strong> teamMembersWithScores wird korrekt als Fallback zu teamMembers genutzt</li>
              <li>🏢 <strong>Vereinsname-Vereinfachung:</strong> Leere Klammern entfernt - nur noch Mannschaftsname wird angezeigt</li>
              <li>📰 <strong>Saubere Ausgabe:</strong> "SV Dörrigsen I - 4375 Ringe (Kreisoberliga)" statt "SV Dörrigsen I () - 4375 Ringe"</li>
              <li>🎯 <strong>Bessere Lesbarkeit:</strong> Vereinsname ist bereits im Mannschaftsnamen enthalten</li>
              <li>🔧 <strong>Code-Optimierung:</strong> Vereinfachte Logik ohne redundante Vereinsname-Extraktion</li>
            </ul>
            <div className="mt-4 p-3 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border">
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <span className="font-medium text-green-800">📰 Zeitungsbericht-Fix</span>
                  <p className="text-xs text-green-600 mt-1">Schützen-Namen & Vereinsname</p>
                </div>
                <span className="bg-green-600 text-white px-3 py-1 rounded text-xs">
                  🚀 v0.11.8
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-xl">Version 0.11.7a - KM-Orga Passwort-Änderung & Startlisten-Fixes</CardTitle>
              <Badge variant="outline">Vorherige</Badge>
            </div>
            <CardDescription>19.08.2025</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Neue Funktionalität für KM-Organisatoren: Button "Meldung für Verein erstellen" ermöglicht digitale Erfassung von Papier-Meldungen.</p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
              <h4 className="font-semibold text-green-900 mb-2">📋 Papier-Meldungen digital v0.11.7</h4>
              <div className="text-xs text-green-700">
                Workflow für die digitale Erfassung von Papier-Meldungen optimiert
              </div>
            </div>
            <ul className="list-disc pl-5 space-y-1">
              <li>➕ <strong>"Meldung für Verein erstellen" Button:</strong> Neuer Dialog auf /km-orga/meldungen</li>
              <li>🏢 <strong>Verein auswählen:</strong> Dropdown mit allen verfügbaren Vereinen</li>
              <li>👤 <strong>Schütze auswählen:</strong> Automatische Filterung nach gewähltem Verein</li>
              <li>🎯 <strong>Disziplinen wählen:</strong> Mehrfachauswahl mit Checkboxen für alle Disziplinen</li>
              <li>🏆 <strong>VM-Ergebnis:</strong> Optionale Eingabe der Vereinsmeisterschafts-Ringzahl</li>
              <li>🏅 <strong>LM-Teilnahme:</strong> Ja/Nein Checkbox für Landesmeisterschafts-Qualifikation</li>
              <li>📝 <strong>Anmerkungen:</strong> Textfeld für besondere Wünsche und Hinweise</li>
              <li>🔄 <strong>Automatisches Laden:</strong> Vereinsschützen werden nach Vereinsauswahl geladen</li>
              <li>📋 <strong>Mehrfach-Meldungen:</strong> Ein Schütze kann für mehrere Disziplinen gemeldet werden</li>
              <li>✅ <strong>Validierung:</strong> Pflichtfelder werden vor Speicherung geprüft</li>
              <li>🏷️ <strong>Nachverfolgung:</strong> Meldungen werden als "gemeldeteVon: km-orga" markiert</li>
              <li>⚡ <strong>Live-Update:</strong> Meldungsliste wird sofort nach Erstellung aktualisiert</li>
            </ul>
            <div className="mt-4 p-3 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border">
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <span className="font-medium text-green-800">🔑 KM-Orga Passwort-Änderung</span>
                  <p className="text-xs text-green-600 mt-1">Passwort & Startlisten-Fixes</p>
                </div>
                <Link href="/updates/v0.11.7a">
                  <span className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700 cursor-pointer">
                    🚀 v0.11.7a
                  </span>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-xl">Version 0.11.6 - Startlisten-Optimierung & Mannschafts-Integration</CardTitle>
              <Badge variant="outline">Vorherige</Badge>
            </div>
            <CardDescription>16.08.2025</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Startlisten-Generierung optimiert: Intelligente Mannschafts-Integration, papier-sparende PDFs und Duplikat-Bereinigung.</p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
              <h4 className="font-semibold text-green-900 mb-2">🎯 Startlisten-Optimierung v0.11.6</h4>
              <div className="text-xs text-green-700">
                Intelligente Mannschafts-Verteilung und papier-sparende PDF-Generierung
              </div>
            </div>
            <ul className="list-disc pl-5 space-y-1">
              <li>👥 <strong>Mannschafts-Integration:</strong> Automatische Erkennung von Mannschafts-Mitgliedern aus km_mannschaften</li>
              <li>🎯 <strong>Optimale Durchgangs-Verteilung:</strong> Mannschaften zeitgleich, Einzelschützen füllen Lücken auf</li>
              <li>⚡ <strong>Intelligente Stand-Zuweisung:</strong> Automatische Konfliktauflösung bei Stand-Zeit-Überschneidungen</li>
              <li>📄 <strong>Papier-sparende PDFs:</strong> Mehrere Starts pro Seite mit optimiertem Layout</li>
              <li>📅 <strong>Veranstaltungsdatum im Dateinamen:</strong> PDF-Dateien werden nach Wettkampfdatum benannt</li>
              <li>🔧 <strong>Duplikat-Bereinigung:</strong> Verhindert doppelte Starter in der Startliste (47 = 47)</li>
              <li>👥 <strong>Mannschaften-Verwaltung verschoben:</strong> Jetzt unter "Meldungen & Vorbereitung"</li>
              <li>🗑️ <strong>Dezente Löschen-Funktion:</strong> Starter können per Hover-Button entfernt werden</li>
              <li>🎯 <strong>Saubere Datenquelle:</strong> Startlisten basieren ausschließlich auf echten km_meldungen</li>
              <li>🔄 <strong>Saison-Filter:</strong> Korrekte Filterung nach Saison für Meldungen und Mannschaften</li>
              <li>🆔 <strong>Eindeutige IDs:</strong> Verhindert React-Warnings bei doppelten Schützen-Namen</li>
              <li>🐛 <strong>Debug-Bereinigung:</strong> Alle Console-Logs für Produktionsversion entfernt</li>
            </ul>
            <div className="mt-4 p-3 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border">
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <span className="font-medium text-green-800">🎯 Startlisten-Optimierung</span>
                  <p className="text-xs text-green-600 mt-1">Mannschaften & Papier-sparend</p>
                </div>
                <Link href="/updates/v0.11.6">
                  <span className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700 cursor-pointer">
                    🚀 v0.11.6
                  </span>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-xl">Version 0.11.5 - KM-Bereich: Mehrvereine-Support</CardTitle>
              <Badge variant="outline">Vorherige</Badge>
            </div>
            <CardDescription>14.08.2025</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">KM-Bereich Optimierung: Mehrvereine-Support für Vereinsvertreter, optimierte Mannschafts-Generierung und Auflage-Mannschaftsregeln.</p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
              <h4 className="font-semibold text-green-900 mb-2">👥 KM-Mehrvereine v0.11.5</h4>
              <div className="text-xs text-green-700">
                Vereinsvertreter können mehrere Vereine gleichzeitig verwalten
              </div>
            </div>
            <ul className="list-disc pl-5 space-y-1">
              <li>👥 <strong>Mehrvereine-Support:</strong> representedClubs Array für Vereinsvertreter mit mehreren Vereinen</li>
              <li>🎯 <strong>KM-Übersicht Dropdown:</strong> Vereinsauswahl wenn mehrere Vereine berechtigt sind</li>
              <li>⚙️ <strong>Optimierte Mannschafts-Generierung:</strong> Einfache Logik nach Altersklassen und VM-Ergebnis</li>
              <li>🏆 <strong>Auflage-Mannschaftsregeln:</strong> Gemischte Teams (m+w) bei Auflage, getrennt bei Freihand</li>
              <li>📋 <strong>KM-Meldungen verbessert:</strong> VM-Ergebnis individuell pro Schütze, LM-Teilnahme</li>
              <li>👥 <strong>KM-Mitglieder erweitert:</strong> Suchfeld, Vereine-Dropdown, alle berechtigten Vereine</li>
              <li>🔧 <strong>KM-Mannschaften optimiert:</strong> Vereinsgetrennte Generierung, "Fertig" statt "Abbrechen"</li>
              <li>📊 <strong>Inline-Bearbeitung:</strong> Direkte Bearbeitung in KM-Übersicht (LM, VM-Ringe, Anmerkung)</li>
              <li>🔍 <strong>Suchfunktion:</strong> Live-Suche in Namen für bessere Übersicht</li>
              <li>🎯 <strong>Startlisten-Tool:</strong> Disziplin 1.41 unter Kleinkaliber, korrekte Zeitberechnung</li>
              <li>📄 <strong>PDF-Export:</strong> Korrekte Altersklassen aus Meldungen, dynamischer Austragungsort</li>
              <li>🐛 <strong>Bugfixes:</strong> Performance-Optimierung, korrekte Vereinsfilterung</li>
            </ul>
            <div className="mt-4 p-3 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border">
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <span className="font-medium text-green-800">👥 KM-Mehrvereine</span>
                  <p className="text-xs text-green-600 mt-1">Vereinsvertreter & Mannschaften</p>
                </div>
                <Link href="/updates/v0.11.5">
                  <span className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700 cursor-pointer">
                    🚀 v0.11.5
                  </span>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-xl">Version 0.11.4 - Meyton Shootmaster Integration</CardTitle>
              <Badge variant="outline">Vorherige</Badge>
            </div>
            <CardDescription>12.08.2025</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Vollständige Integration mit Meyton Shootmaster: Startlisten-Export im David21-Format mit korrekten Altersklassen und individuellen Wettkampf-IDs.</p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
              <h4 className="font-semibold text-green-900 mb-2">🎯 Meyton Integration v0.11.4</h4>
              <div className="text-xs text-green-700">
                Professioneller Export für elektronische Schießanlagen
              </div>
            </div>
            <ul className="list-disc pl-5 space-y-1">
              <li>🎯 <strong>Meyton Export (Beta):</strong> Startlisten-Export im David21-Format für Meyton Shootmaster</li>
              <li>🏆 <strong>Korrekte Altersklassen:</strong> Klassen-IDs aus Firebase-Datenbank (Herren I = ID 10)</li>
              <li>⏰ <strong>Individuelle Wettkampf-IDs:</strong> Jeder Starter bekommt eigene ID basierend auf Startzeit</li>
              <li>🎨 <strong>UTF-8 Encoding:</strong> Korrekte Darstellung von Umlauten (ü, ä, ö)</li>
              <li>📊 <strong>Echte Daten:</strong> Geburtsjahre, Altersklassen und Disziplinen aus Firebase</li>
              <li>🔢 <strong>Disziplin-Codes:</strong> Korrekte Meyton-Codes (10110040 für LG 40 Schuss)</li>
              <li>🏟️ <strong>Stand-Zuordnung:</strong> Schießstände werden korrekt exportiert</li>
              <li>⚙️ <strong>Durchgangs-Berechnung:</strong> Automatische DG-Nummer basierend auf Startzeit</li>
              <li>💾 <strong>Datenbank-Speicherung:</strong> Meyton-Daten werden persistent gespeichert</li>
              <li>🕐 <strong>Wechselzeit-Anzeige:</strong> Zeitplan zeigt Durchgangsdauer + Wechselzeit</li>
              <li>🔄 <strong>Chunk-Loading Fix:</strong> Startlisten-URLs funktionieren ohne JavaScript-Fehler</li>
              <li>📋 <strong>Meyton-Klassen Collection:</strong> Zentrale Verwaltung der Altersklassen-IDs</li>
            </ul>
            <div className="mt-4 p-3 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border">
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <span className="font-medium text-green-800">🎯 Meyton Integration</span>
                  <p className="text-xs text-green-600 mt-1">Shootmaster Export & Altersklassen</p>
                </div>
                <span className="bg-blue-600 text-white px-3 py-1 rounded text-xs">
                  🚀 v0.11.4
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-xl">Version 0.11.3 - Orga-Bereich gefixt und optimiert</CardTitle>
              <Badge variant="outline">Vorherige</Badge>
            </div>
            <CardDescription>11.08.2025</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">KM-Orga Bereich vollständig überarbeitet: Startlisten-Tool, sortierbare Tabellen, VM-Ergebnisse und Zurück-Buttons.</p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
              <h4 className="font-semibold text-green-900 mb-2">🛠️ Orga-Optimierungen v0.11.3</h4>
              <div className="text-xs text-green-700">
                Komplette Überarbeitung des KM-Organisationsbereichs
              </div>
            </div>
            <ul className="list-disc pl-5 space-y-1">
              <li>🎯 <strong>Startlisten-Tool:</strong> Neues einheitliches Tool ersetzt alte Generieren-Seite mit verbesserter UX</li>
              <li>📊 <strong>Sortierbare Tabellen:</strong> Alle KM-Mitglieder-Spalten sind jetzt klickbar sortierbar</li>
              <li>🏆 <strong>VM-Ergebnisse:</strong> Vereinsmeisterschafts-Ringe werden korrekt in Mannschaften angezeigt</li>
              <li>🔙 <strong>Navigation:</strong> Zurück-Buttons in allen KM-Orga Unterseiten hinzugefügt</li>
              <li>🎨 <strong>Altersklassen-Fix:</strong> "Erwachsene Erwachsene" durch korrekte Berechnung ersetzt</li>
              <li>⚙️ <strong>Gewehr-Sharing:</strong> Verbesserte Erkennung für geteilte Gewehre</li>
              <li>📋 <strong>Startgebühren:</strong> Jahr 2026 als Standard, API-Endpunkte statt direkter Firebase-Zugriff</li>
              <li>🔄 <strong>Chunk-Loading Fix:</strong> Alte Startlisten-URLs leiten korrekt weiter ohne Fehler</li>
              <li>📱 <strong>Editierbare Startliste:</strong> Stand, Durchgang und Startzeit direkt bearbeitbar</li>
              <li>🎯 <strong>KI-Analyse:</strong> Konflikterkennung und Empfehlungen für Startlisten integriert</li>
              <li>🔐 <strong>Berechtigungen:</strong> KM-Orga Seiten verwenden sichere API-Endpunkte statt direkten Firebase-Zugriff</li>
              <li>📅 <strong>RWK-Tabellen:</strong> Abgeschlossene Saisons (2025) werden jetzt korrekt angezeigt</li>
              <li>🛠️ <strong>Bugfixes:</strong> Select.Item Fehler, Syntax-Fehler und Chunk-Loading Probleme behoben</li>
            </ul>
            <div className="mt-4 p-3 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border">
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <span className="font-medium text-green-800">🛠️ Orga-Optimierungen</span>
                  <p className="text-xs text-green-600 mt-1">Startlisten, Tabellen & Navigation</p>
                </div>
                <span className="bg-green-600 text-white px-3 py-1 rounded text-xs">
                  🚀 v0.11.3
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-xl">Version 0.11.2 - Saisonwechsel & PDF-Export</CardTitle>
              <Badge variant="outline">Vorherige</Badge>
            </div>
            <CardDescription>11.01.2025</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Vollständige Auf-/Abstiegsanalyse mit automatischen Vergleichen und professionellem PDF-Export.</p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
              <h4 className="font-semibold text-green-900 mb-2">🏆 Saisonwechsel-System v0.11.2</h4>
              <div className="text-xs text-green-700">
                Komplette Auf-/Abstiegslogik nach RWK-Ordnung mit PDF-Export
              </div>
            </div>
            <ul className="list-disc pl-5 space-y-1">
              <li>🏆 <strong>Auf-/Abstiegsanalyse:</strong> Vollständige Implementierung der RWK-Ordnung §16 mit automatischen Vergleichen</li>
              <li>📊 <strong>Vergleichsberechnungen:</strong> Zweiter vs. Vorletzter höhere Liga, Vorletzter vs. Zweiter niedrigere Liga</li>
              <li>📄 <strong>PDF-Export:</strong> Professioneller Export im Querformat mit RWK Logo und Farbkodierung</li>
              <li>🎯 <strong>Pistole-Logik:</strong> Keine Auf-/Abstiege in offener Kleinkaliber Pistole Klasse</li>
              <li>📉 <strong>2. Kreisklasse:</strong> Korrekte Behandlung als niedrigste Liga ohne Abstiegsmöglichkeit</li>
              <li>🎨 <strong>Farbkodierung:</strong> Grün für Aufstieg, Rot für Abstieg in PDF-Tabellen</li>
              <li>📋 <strong>Multi-Liga-Übersicht:</strong> Alle Ligen gleichzeitig analysieren und vergleichen</li>
              <li>⚙️ <strong>Abmeldungen:</strong> Separate Auswahl für "nach Meldeschluss abgemeldet" und "nicht mehr gemeldet"</li>
              <li>🔢 <strong>Ringzahlen-Anzeige:</strong> Gesamtergebnisse in Tabellen für bessere Transparenz</li>
              <li>🖼️ <strong>Logo-Integration:</strong> RWK Einbeck Logo oben rechts in allen PDF-Exporten</li>
            </ul>
            <div className="mt-4 p-3 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border">
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <span className="font-medium text-green-800">🏆 Saisonwechsel-System</span>
                  <p className="text-xs text-green-600 mt-1">Auf-/Abstieg & PDF-Export</p>
                </div>
                <span className="bg-green-600 text-white px-3 py-1 rounded text-xs">
                  🚀 v0.11.2
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-xl">Version 0.11.1 - Admin-Verbesserungen & PDF-Fixes</CardTitle>
              <Badge variant="outline">Vorherige</Badge>
            </div>
            <CardDescription>10.08.2025</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Admin-Bereich optimiert: Ergebniserfassung-Filter, PDF-Exports vereinfacht, Mannschaftsführer-Übersicht korrigiert.</p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <h4 className="font-semibold text-blue-900 mb-2">🔧 Admin-Optimierungen v0.11.1</h4>
              <div className="text-xs text-blue-700">
                Verbesserte Benutzerführung und korrigierte Funktionen
              </div>
            </div>
            <ul className="list-disc pl-5 space-y-1">
              <li>🎯 <strong>Ergebniserfassung-Filter:</strong> Teams/Schützen mit vollständigen Ergebnissen werden ausgeblendet (alte Logik reaktiviert)</li>
              <li>📄 <strong>PDF-Exports vereinfacht:</strong> Admin-Exports leitet direkt zu Urkunden weiter, funktionsfähige PDF-Buttons</li>
              <li>👥 <strong>Mannschaftsführer korrigiert:</strong> Keine "undefined undefined" mehr, korrekte Saison-Namen</li>
              <li>🏆 <strong>Urkunden-Button verschoben:</strong> Von System zu Saisonverwaltung für bessere Auffindbarkeit</li>
              <li>⏰ <strong>Session-Timer verbessert:</strong> Bessere Synchronisation zwischen Timer-Anzeige und tatsächlicher Session</li>
              <li>🔄 <strong>Vereinsvertreter-Ansicht:</strong> Mannschaftsführer in eigenen Ligen statt nur eigener Verein</li>
              <li>🎮 <strong>Bearbeitungsmodus:</strong> Toggle für Admin-Ergebniserfassung - AUS für Filterung, AN für Bearbeitung</li>
              <li>🏅 <strong>Urkunden-Verbesserungen:</strong> Tie-Breaking nach letztem Durchgang, Gesamtsieger-Layout optimiert, "wurde" statt "errang"</li>
              <li>⌨️ <strong>Ergebniserfassung UX:</strong> Enter-Taste zum Hinzufügen, automatische Schützen-Auswahl beim Durchgangswechsel</li>
              <li>🛠️ <strong>Code-Bereinigung:</strong> Entfernte nicht funktionierende PDF-Export-Logik</li>
            </ul>
            <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border">
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <span className="font-medium text-blue-800">🔧 Admin-Optimierungen</span>
                  <p className="text-xs text-blue-600 mt-1">Filter, PDFs & Benutzerführung</p>
                </div>
                <span className="bg-blue-600 text-white px-3 py-1 rounded text-xs">
                  🚀 v0.11.1
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-xl">Version 0.11.0 - Große Datenbank-Migration</CardTitle>
              <Badge variant="outline">Vorherige</Badge>
            </div>
            <CardDescription>10.08.2025</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">KM-System Vollendung: Altersklassen-Übersicht, Navigation vereinheitlicht, Logout-Timer korrigiert.</p>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>📋 <strong>Altersklassen-Übersicht:</strong> Neue Seite /km/altersklassen</li>
              <li>🎯 <strong>Korrekte Altersklassen:</strong> Auflage (Schüler 12-14, Senioren 41+)</li>
              <li>📊 <strong>KM-Mitglieder CRUD:</strong> Vollständige Verwaltung</li>
              <li>🔄 <strong>Navigation vereinheitlicht:</strong> "Arbeitsbereich" statt "Dashboard"</li>
              <li>⏰ <strong>Logout-Timer korrigiert:</strong> Timer-Reset bei Aktivität</li>
              <li>🛠️ <strong>API-Bereinigung:</strong> km_shooters zu shooters migriert</li>
            </ul>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-xl">Version 0.10.1a - Ersatzschützen & PDF-Verbesserungen</CardTitle>
              <Badge variant="outline">Vorherige</Badge>
            </div>
            <CardDescription>09.08.2025</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Ersatzschützen-System nach RWK-Ordnung §12, PDF-Logos und Disziplin-Optimierungen.</p>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
              <h4 className="font-semibold text-amber-900 mb-2">🔄 Ersatzschützen-System v0.10.1a</h4>
              <div className="text-xs text-amber-700">
                Vollständige Umsetzung der RWK-Ordnung §12 für Ersatzschützen
              </div>
            </div>
            <ul className="list-disc pl-5 space-y-1">
              <li>🔄 <strong>Ersatzschützen-Verwaltung:</strong> Admin-Seite für Ersatzschützen nach RWK-Ordnung §12</li>
              <li>⚙️ <strong>Ersatz-Typen:</strong> Neuer Schütze oder Einzelschütze → Team mit Ergebnis-Transfer</li>
              <li>🏆 <strong>Ersatz-Badge:</strong> "Ersatz ab DG1" wird in RWK-Tabellen angezeigt</li>
              <li>🖼️ <strong>PDF-Logos:</strong> Logo2.png in allen PDF-Exporten oben rechts</li>
              <li>📄 <strong>Erweiterte PDFs:</strong> Mannschafts-PDFs zeigen Schützen unter jedem Team</li>
              <li>🎯 <strong>Disziplin-Bereinigung:</strong> "Kleinkaliber" ohne Abkürzungen, LGS = Luftgewehr Freihand</li>
              <li>💨 <strong>Luftdruck-Kategorie:</strong> Luftgewehr + Luftpistole zusammengefasst wie Kleinkaliber</li>
              <li>🏆 <strong>KK Pistole Ehrungen:</strong> Separate Gesamtsieger-Urkunden für KK Pistole</li>
            </ul>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Version 0.10.1 - Schützen-Verwaltung für Vereinsvertreter</CardTitle>
            <CardDescription>09.08.2025</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Vollständige Schützen-Verwaltung für Vereinsvertreter mit Mannschaftszuordnung und km_shooters Synchronisation.</p>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>🎯 <strong>Schützen anlegen:</strong> Vereinsvertreter können neue Schützen erstellen</li>
              <li>✏️ <strong>Schützen bearbeiten:</strong> Alle Daten editierbar</li>
              <li>👥 <strong>Mannschaftszuordnung:</strong> Direkte Zuordnung zu Teams</li>
              <li>🔄 <strong>Duale Synchronisation:</strong> shooters + km_shooters</li>
              <li>⚖️ <strong>Regelvalidierung:</strong> Ein Schütze pro Saison/Disziplin</li>
            </ul>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Version 0.10.0 - Projekt-Aufräumung & Code-Bereinigung</CardTitle>
            <CardDescription>06.08.2025</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Große Aufräumung des Projekts: Debug-Funktionen entfernt, überflüssige Dateien gelöscht, produktionsreife Version.</p>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>🗑️ Debug-Funktionen entfernt</li>
              <li>📄 40+ MD-Dateien gelöscht</li>
              <li>🔇 Console.log entfernt</li>
              <li>📁 Projektstruktur bereinigt</li>
              <li>🔧 Favicon-Problem behoben</li>
            </ul>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm hover:shadow-md transition-shadow md:col-span-2 lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Ältere Versionen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <Link href="/updates/v0.10" className="text-primary hover:text-primary/80 flex items-center">
                Version 0.10.0 <ArrowRight className="ml-1 h-4 w-4" />
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