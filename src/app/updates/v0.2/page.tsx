"use client";
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';

export default function Version02UpdatesPage() {
  return (
    <div className="container py-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <Button asChild variant="outline" className="mb-4">
          <Link href="/updates" className="flex items-center">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Zurück zur Übersicht
          </Link>
        </Button>
        <h1 className="text-3xl font-bold text-primary">Updates & Changelog: Version 0.2.x</h1>
        <p className="text-muted-foreground mt-2">Frühe Entwicklungsphase mit grundlegenden Funktionen.</p>
      </div>
      
      <div className="space-y-4">
        <ScrollArea className="h-[600px] pr-4">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Version 0.2.6a (22. Mai 2025)</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Hotfix: Handbuch-Fehler und Build-Stabilität</h3>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Syntaxfehler auf der Handbuch-Anzeigeseite behoben, der das Rendern verhinderte</li>
                      <li>Korrekturen an Icon-Importen zur Verbesserung der Vercel-Build-Stabilität</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Version 0.2.6 (22. Mai 2025)</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">VV-Seiten Stabilisierung & Logger-Fixes</h3>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Fehlerhafte Logger-Importe auf den Vereinsvertreter-Seiten entfernt, die zu Laufzeitfehlern führten</li>
                      <li>Stabilitätsverbesserungen auf den VV-Seiten nach Umstellung auf `user_permissions`</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Version 0.2.5 (22. Mai 2025)</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Firestore Sicherheitsregeln (Basis für user_permissions)</h3>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Erste Version der Firestore-Sicherheitsregeln implementiert, die auf der `user_permissions`-Collection basiert</li>
                      <li>Client-seitige UI-Anpassungen für VV/MF-Rollen auf den Vereinsseiten</li>
                      <li>Korrektur des Dashboard-Zugriffs für Mannschaftsführer</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Version 0.2.4 (22. Mai 2025)</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Zentralisierung Benutzerberechtigungen im AuthProvider</h3>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Laden der `user_permissions` (Rolle, Vereins-IDs) in den `AuthProvider` zentralisiert</li>
                      <li>Vereins-Layout und abhängige Seiten nutzen nun den `AuthContext` für Berechtigungsdaten</li>
                      <li>Entfernung der `VV_CLUB_ASSIGNMENTS`-Map aus den VV-Seiten</li>
                      <li>Anzeige der Benutzerrolle im VV-Dashboard implementiert</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Version 0.2.3a (21. Mai 2025)</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Hotfix: Vercel Build-Fehler & Favicon-Korrektur</h3>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Behebung eines Build-Fehlers (`cn is not defined` und Icon-Fehler) auf der Admin-Dashboard-Seite</li>
                      <li>Favicon-Konfiguration in der Hauptlayout-Datei präzisiert</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Version 0.2.2 (21. Mai 2025)</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Dynamische Jahresauswahl RWK-Tabellen & Impressum</h3>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>RWK-Tabellen: Jahresauswahl wird dynamisch aus existierenden Saisons generiert</li>
                      <li>RWK-Tabellen: Filterung, sodass nur Saisons mit Status "Laufend" angezeigt werden</li>
                      <li>Impressumsseite mit Inhalt befüllt und im Footer verlinkt</li>
                      <li>Korrektur der "Bester Schütze"/"Beste Dame"-Logik in RWK-Tabellen</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Version 0.2.1 (21. Mai 2025)</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Stabile VV-Seiten (Einzelverein) & Admin-Team-Fixes</h3>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Vereinsvertreter-Seiten nutzen nun `user_permissions` für die Zuweisung zu einem einzelnen Verein</li>
                      <li>Fehlerbehebung auf der Admin-Teamseite (`SelectItem`-Fehler, Ligazuweisung im Dialog)</li>
                      <li>Umstellung der `clubIds` in `user_permissions` von Array auf Map für bessere Regelkompatibilität</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Version 0.2.0 (21. Mai 2025)</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Benutzerverwaltung (UID-basiert) & Vorbereitung VV-Rechte</h3>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Admin-Seite `/admin/user-management` speichert Rolle und Vereinszuweisungen in `user_permissions`</li>
                      <li>Entfernung der Cloud Function-Logik für das Setzen von Claims aus der App</li>
                      <li>Vorbereitung der Vereinsvertreter-Seiten zur Nutzung dieser `user_permissions`</li>
                      <li>Agenda im Admin-Panel um Notizen zur Rechteverwaltung erweitert</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
