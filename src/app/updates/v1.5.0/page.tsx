"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function UpdateV150Page() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <h1 className="text-4xl font-bold text-primary">Version 1.5.0</h1>
          <Badge variant="default" className="text-lg px-4 py-2">
            🎉 Vereinssoftware Revolution
          </Badge>
        </div>
        <p className="text-lg text-muted-foreground">
          Vollständige Mitgliederverwaltung mit 99 Geburtstagen, Eintrittsdaten-Import, 
          individualisierbare Jubiläen-Konfiguration und 5-Jahres-Vorausplanung
        </p>
      </div>

      <div className="grid gap-6">
        {/* Hauptfeatures */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🏠 Vollständige Mitgliederverwaltung
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">✨ Neue Features:</h4>
                <ul className="space-y-1 text-sm">
                  <li>• Professionelle Mitgliederdatenbank</li>
                  <li>• Editierbare Tabelle mit allen Feldern</li>
                  <li>• Geschlechts-Auswahl (Männlich/Weiblich)</li>
                  <li>• Neues Mitglied Dialog mit Labels</li>
                  <li>• Austritte und Löschungen</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">📊 Statistiken:</h4>
                <ul className="space-y-1 text-sm">
                  <li>• Gesamt-Mitglieder</li>
                  <li>• Aktive/Inaktive</li>
                  <li>• 25+ Jahre Mitglieder</li>
                  <li>• E-Mail Abdeckung</li>
                  <li>• Mitgliedsnummern-Status</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Geburtstage Import */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🎂 Geburtstage-Import System
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">📅 Import-Features:</h4>
                <ul className="space-y-1 text-sm">
                  <li>• 99 Geburtstage aus Geburtstage.txt</li>
                  <li>• Automatische Datum-Konvertierung</li>
                  <li>• DD.MM.YY → YYYY-MM-DD Format</li>
                  <li>• Namen-Matching mit Firebase</li>
                  <li>• Live-Import-Fortschritt</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">🔢 Altersberechnung:</h4>
                <ul className="space-y-1 text-sm">
                  <li>• Exakte tagesgenaue Berechnung</li>
                  <li>• Berücksichtigt Monat und Tag</li>
                  <li>• Automatische Aktualisierung</li>
                  <li>• Fallback zu birthYear</li>
                  <li>• Deutsche Datumsanzeige</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Eintrittsdaten */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📋 Eintrittsdaten-Import
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">🏠 Vereinseintritt:</h4>
                <ul className="space-y-1 text-sm">
                  <li>• 90 Eintrittsdaten aus Eintritt.txt</li>
                  <li>• Jahr-basierte Eingabe (1998)</li>
                  <li>• Automatische Konvertierung</li>
                  <li>• Nur Jahre anzeigen</li>
                  <li>• Zentrierte Darstellung</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">🎯 DSB-Eintritt:</h4>
                <ul className="space-y-1 text-sm">
                  <li>• Separate DSB-Eintrittsdaten</li>
                  <li>• Unterschiedliche Jahre möglich</li>
                  <li>• Leere Felder unterstützt</li>
                  <li>• Bulk-Import verfügbar</li>
                  <li>• Firebase-Integration</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Jubiläen System */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🏆 Individualisierbare Jubiläen-Konfiguration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">⚙️ Konfiguration:</h4>
                <ul className="space-y-1 text-sm">
                  <li>• Benutzerdefinierte Geburtstags-Alter</li>
                  <li>• Individuelle Jubiläums-Jahre</li>
                  <li>• Spezial-Kategorie (Lila)</li>
                  <li>• + Button zum Hinzufügen</li>
                  <li>• × Button zum Entfernen</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">📅 5-Jahres-Vorausplanung:</h4>
                <ul className="space-y-1 text-sm">
                  <li>• Jahr-Dropdown (2023-2030)</li>
                  <li>• Automatische Altersberechnung</li>
                  <li>• Vereinsjahre-Berechnung</li>
                  <li>• Planbare Ehrungen</li>
                  <li>• Vorbereitungs-Unterstützung</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Technische Verbesserungen */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🔧 Technische Verbesserungen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">🎨 UI/UX:</h4>
                <ul className="space-y-1 text-sm">
                  <li>• Responsive Tabellen-Layout</li>
                  <li>• Zentrierte Spalten-Header</li>
                  <li>• Zweistellige Datumsanzeige</li>
                  <li>• Kompakte Padding-Optimierung</li>
                  <li>• Zurück-Buttons überall</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">⚡ Performance:</h4>
                <ul className="space-y-1 text-sm">
                  <li>• NaN-Warnings behoben</li>
                  <li>• Robuste Fallback-Logik</li>
                  <li>• Optimierte Datenberechnung</li>
                  <li>• Verbesserte Fehlerbehandlung</li>
                  <li>• Saubere Code-Struktur</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Migration & Kompatibilität */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🔄 Migration & Kompatibilität
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">📦 Bestehende Daten:</h4>
                <p className="text-sm text-muted-foreground">
                  Alle bestehenden RWK- und KM-Daten bleiben vollständig erhalten. 
                  Die Vereinssoftware erweitert nur die Funktionalität.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">🔗 Integration:</h4>
                <p className="text-sm text-muted-foreground">
                  Nahtlose Integration mit bestehenden Firebase-Strukturen. 
                  Keine Breaking Changes für RWK-Tabellen oder KM-System.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Nächste Schritte */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🚀 Nächste Schritte
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">🎯 Geplante Features:</h4>
                <ul className="space-y-1 text-sm">
                  <li>• Beitragsverwaltung mit SEPA-Integration</li>
                  <li>• Multi-Role-System für KM-Zugang</li>
                  <li>• Erweiterte Statistiken und Reports</li>
                  <li>• Trainingsplan-Verwaltung</li>
                  <li>• Wettkampf-Anmeldungen</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 flex gap-4">
        <a href="/vereinssoftware">
          <Button>
            🏠 Zur Vereinssoftware
          </Button>
        </a>
        <a href="/updates">
          <Button variant="outline">
            📋 Alle Updates
          </Button>
        </a>
      </div>
    </div>
  );
}