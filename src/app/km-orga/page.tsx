"use client";

import React, { useState } from 'react';
import { logError, logWarn, logInfo, logDebug } from '@/lib/utils/secure-logger';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';
import { useKMAuth } from '@/hooks/useKMAuth';
import { useAuthContext } from '@/components/auth/AuthContext';
import { BackButton } from '@/components/ui/back-button';

export default function KMAdminDashboard() {
  const { hasKMAccess, userRole, loading } = useKMAuth();
  const { user } = useAuthContext();
  const [isInstructionOpen, setIsInstructionOpen] = useState(false);

  if (loading) {
    return (
      <div className="container py-8 max-w-6xl mx-auto">
        <div className="flex flex-col items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-lg text-gray-600">Lade KM-Admin-Dashboard...</p>
        </div>
      </div>
    );
  }

  if (!hasKMAccess || (userRole !== 'admin' && userRole !== 'km_organisator')) {
    return (
      <div className="container py-8 max-w-6xl mx-auto">
        <div className="text-center py-10">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Zugriff verweigert</h1>
          <p className="text-gray-600 mb-4">Sie haben keine Berechtigung für das KM-Admin-Dashboard.</p>
          <Link href="/admin" className="text-primary hover:text-primary/80">← Zurück zum Admin-Bereich</Link>
        </div>
      </div>
    );
  }

  const isOrganisator = userRole === 'km_organisator';

  return (
    <div className="px-2 md:px-4 py-4 max-w-full mx-auto">
      <div className="mb-6">
        <div className="flex items-center mb-2">
          <BackButton className="mr-2" fallbackHref="/dashboard-auswahl" />
          <h1 className="text-xl md:text-3xl font-bold text-primary">🏆 KM-Orga-Dashboard</h1>
        </div>
        <p className="text-sm md:text-base text-muted-foreground">
          Hallo {user?.displayName || user?.email}! Kreismeisterschafts-Verwaltung für alle Vereine
          {isOrganisator && <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">KM-Organisator</span>}
        </p>
      </div>

      {/* Ausführliche Anleitung für Sportleiterin */}
      <Card className="mb-6 bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-blue-800 flex items-center gap-2">
                📚 Anleitung: Kreismeisterschaft digital organisieren
              </CardTitle>
              <CardDescription className="text-blue-700">
                Schritt-für-Schritt Anleitung für die erste digitale KM-Organisation - auch ohne PC-Erfahrung!
              </CardDescription>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsInstructionOpen(!isInstructionOpen)}
              className="text-blue-700 hover:text-blue-900"
            >
              {isInstructionOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              {isInstructionOpen ? 'Einklappen' : 'Anleitung anzeigen'}
            </Button>
          </div>
        </CardHeader>
        {isInstructionOpen && (
        <CardContent>
          <div className="space-y-4">
            {/* Schritt 1 */}
            <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-blue-200 dark:border-blue-700">
              <div className="flex items-start gap-4">
                <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-lg font-bold flex-shrink-0">1</div>
                <div className="flex-1">
                  <h3 className="font-bold text-blue-900 dark:text-blue-100 mb-2">📝 Meldungen sammeln und prüfen</h3>
                  <p className="text-sm text-blue-700 dark:text-blue-200 mb-3">
                    <strong>Was passiert:</strong> Die Vereine melden ihre Schützen über das System an. Sie sehen alle eingegangenen Meldungen in einer übersichtlichen Liste.
                  </p>
                  <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded border border-blue-100 dark:border-blue-800 mb-3">
                    <h4 className="font-medium text-blue-800 dark:text-blue-100 mb-1">Das können Sie hier tun:</h4>
                    <ul className="text-xs text-blue-700 dark:text-blue-200 space-y-1">
                      <li>• Alle Meldungen aller Vereine einsehen</li>
                      <li>• VM-Ergebnisse (Vereinsmeisterschaft) kontrollieren</li>
                      <li>• Prüfen wer sich für die Landesmeisterschaft qualifiziert hat</li>
                      <li>• Statistiken ansehen (wie viele Teilnehmer pro Disziplin)</li>
                    </ul>
                  </div>
                  <Link href="/km-orga/meldungen">
                    <Button size="sm" className="w-full md:w-auto">📋 Alle Meldungen anzeigen (4)</Button>
                  </Link>
                </div>
              </div>
            </div>
            
            {/* Schritt 2 */}
            <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-green-200 dark:border-green-700">
              <div className="flex items-start gap-4">
                <div className="bg-green-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-lg font-bold flex-shrink-0">2</div>
                <div className="flex-1">
                  <h3 className="font-bold text-green-900 dark:text-green-100 mb-2">🎯 Startlisten automatisch erstellen</h3>
                  <p className="text-sm text-green-700 dark:text-green-200 mb-3">
                    <strong>Das Wichtigste:</strong> Das System macht die ganze Arbeit für Sie! Sie geben nur ein paar Grunddaten ein und bekommen perfekte Startlisten.
                  </p>
                  <div className="bg-green-50 dark:bg-green-900/30 p-3 rounded border border-green-100 dark:border-green-800 mb-3">
                    <h4 className="font-medium text-green-800 dark:text-green-100 mb-1">So einfach geht's:</h4>
                    <ol className="text-xs text-green-700 dark:text-green-200 space-y-1 list-decimal list-inside">
                      <li>Austragungsort auswählen (z.B. "Einbecker Schützengilde")</li>
                      <li>Verfügbare Stände eingeben (z.B. "1, 2, 3, 4, 5")</li>
                      <li>Datum und Startzeit festlegen</li>
                      <li>Disziplinen auswählen (z.B. "Luftgewehr")</li>
                      <li>Auf "Startlisten generieren" klicken - fertig!</li>
                    </ol>
                  </div>
                  <div className="bg-yellow-50 dark:bg-yellow-900/30 p-3 rounded border border-yellow-100 dark:border-yellow-800 mb-3">
                    <h4 className="font-medium text-yellow-800 dark:text-yellow-100 mb-1">🤖 Das macht das System automatisch:</h4>
                    <ul className="text-xs text-yellow-700 dark:text-yellow-200 space-y-1">
                      <li>• Richtige Schießzeiten je nach Alter (Schüler: 30 Min, Erwachsene: 50 Min)</li>
                      <li>• Berücksichtigt Ihr Anlagensystem (Zuganlagen brauchen mehr Zeit)</li>
                      <li>• Verteilt Schützen optimal auf Stände und Zeiten</li>
                      <li>• Beachtet Gewehr-Sharing (wenn 2 Schützen 1 Gewehr teilen)</li>
                    </ul>
                  </div>
                  <Link href="/km-orga/startlisten/uebersicht">
                    <Button size="sm" className="w-full md:w-auto bg-green-600 hover:bg-green-700">🎯 Startlisten-Verwaltung</Button>
                  </Link>
                </div>
              </div>
            </div>
            
            {/* Schritt 3 */}
            <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-orange-200 dark:border-orange-700">
              <div className="flex items-start gap-4">
                <div className="bg-orange-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-lg font-bold flex-shrink-0">3</div>
                <div className="flex-1">
                  <h3 className="font-bold text-orange-900 dark:text-orange-100 mb-2">🏆 Nach dem Wettkampf: Ergebnisse eingeben</h3>
                  <p className="text-sm text-orange-700 dark:text-orange-200 mb-3">
                    <strong>Später:</strong> Nach dem Wettkampftag können Sie hier die Ergebnisse eingeben und automatisch Ergebnislisten erstellen lassen.
                  </p>
                  <div className="bg-orange-50 dark:bg-orange-900/30 p-3 rounded border border-orange-100 dark:border-orange-800 mb-3">
                    <h4 className="font-medium text-orange-800 dark:text-orange-100 mb-1">Das kommt nach dem Wettkampf:</h4>
                    <ul className="text-xs text-orange-700 dark:text-orange-200 space-y-1">
                      <li>• Ergebnisse der Schützen eingeben</li>
                      <li>• Automatische Ranglisten-Erstellung</li>
                      <li>• PDF-Listen für Aushang generieren</li>
                      <li>• Urkunden-Druck vorbereiten</li>
                    </ul>
                  </div>
                  <Link href="/km-orga/km-ergebnisse">
                    <Button size="sm" className="w-full md:w-auto bg-orange-600 hover:bg-orange-700">🏅 Ergebnisse eingeben</Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded-lg">
            <h4 className="font-semibold text-green-800 dark:text-green-100 mb-2">🎉 Das Beste: Sie sparen 75% Zeit!</h4>
            <p className="text-sm text-green-700 dark:text-green-200">
              <strong>Früher:</strong> 40-60 Stunden Arbeit mit Excel, Papier und Taschenrechner<br/>
              <strong>Jetzt:</strong> 8-15 Stunden - das System macht die Rechenarbeit und erstellt perfekte Listen!
            </p>
          </div>
          
          <div className="mt-4 p-4 bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700 rounded-lg">
            <h4 className="font-semibold text-blue-800 dark:text-blue-100 mb-2">❓ Fragen oder Probleme?</h4>
            <p className="text-sm text-blue-700 dark:text-blue-200">
              Bei Fragen können Sie jederzeit ein Support-Ticket erstellen oder direkt anrufen. Das System ist so gebaut, dass auch Computer-Laien es problemlos bedienen können!
            </p>
          </div>
        </CardContent>
        )}
      </Card>

      <div className="flex flex-col gap-4 md:grid md:grid-cols-2 md:gap-6">
        {/* Meldungen & Vorbereitung */}
        <Card className="hover:shadow-md transition-shadow border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              📋 Meldungen & Vorbereitung
            </CardTitle>
            <CardDescription>
              Alle Vereinsmeldungen prüfen und VM-Ergebnisse kontrollieren
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              <Link href="/km-orga/meldungen">
                <Button className="w-full h-12 text-left justify-start">📄 Alle Meldungen</Button>
              </Link>
              <Link href="/km-orga/vm-uebersicht">
                <Button variant="outline" className="w-full h-12 text-left justify-start">🏆 VM-Ergebnisse prüfen</Button>
              </Link>
              <Link href="/km-orga/meldungen/statistik">
                <Button variant="outline" className="w-full h-12 text-left justify-start">📊 Statistiken</Button>
              </Link>
              <Link href="/km-orga/mannschaften">
                <Button variant="outline" className="w-full h-12 text-left justify-start">👥 Mannschaften verwalten</Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Startlisten-Assistent */}
        <Card className="hover:shadow-md transition-shadow border-green-200 dark:border-green-700 bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              🎯 Startlisten-Assistent
            </CardTitle>
            <CardDescription>
              Intelligente Startlisten-Generierung mit KI-Optimierung
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              <Link href="/km-orga/startlisten/uebersicht">
                <Button className="w-full h-12 text-left justify-start bg-green-600 hover:bg-green-700">
                  🎯 Startlisten-Verwaltung
                </Button>
              </Link>
              <div className="text-xs text-green-700 dark:text-green-200 bg-green-100 dark:bg-green-900/30 p-2 rounded">
                🤖 KI-System berücksichtigt automatisch: Altersklassen, Schießzeiten, Gewehr-Sharing
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ergebnisse & Auswertung */}
        <Card className="hover:shadow-md transition-shadow border-orange-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              🏆 Ergebnisse & Auswertung
            </CardTitle>
            <CardDescription>
              Nach dem Wettkampf: Ergebnisse erfassen und Listen erstellen
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              <Link href="/km-orga/km-ergebnisse">
                <Button className="w-full h-12 text-left justify-start bg-orange-600 hover:bg-orange-700">
                  ✏️ Ergebnisse manuell eingeben
                </Button>
              </Link>
              <Link href="/km-orga/david21">
                <Button variant="outline" className="w-full h-12 text-left justify-start">
                  🎯 Meyton Import (Shootmaster)
                </Button>
              </Link>
              <Link href="/km-orga/ergebnisse-korrektur">
                <Button variant="outline" className="w-full h-12 text-left justify-start">
                  🔧 Ergebnisse korrigieren
                </Button>
              </Link>
              <Link href="/km-orga/ergebnislisten">
                <Button variant="outline" className="w-full h-12 text-left justify-start">
                  📄 Ergebnislisten erstellen
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Zusätzliche Funktionen */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              👥 Zusätzliche Funktionen
            </CardTitle>
            <CardDescription>
              Erweiterte Verwaltungsfunktionen
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              <Link href="/km-orga/mitglieder">
                <Button variant="outline" className="w-full h-12 text-left justify-start">👥 Alle Mitglieder</Button>
              </Link>
              <Link href="/km-orga/disziplinen">
                <Button variant="outline" className="w-full h-12 text-left justify-start">🎯 Disziplinen & Kennziffern</Button>
              </Link>
              <Link href="/km-orga/altersklassen">
                <Button variant="outline" className="w-full h-12 text-left justify-start">🏆 Altersklassen & Klassen-IDs</Button>
              </Link>
              <Link href="/km-orga/mannschaftsregeln">
                <Button variant="outline" className="w-full h-12 text-left justify-start">⚖️ Mannschaftsregeln</Button>
              </Link>
              <Link href="/km-orga/startgebuehren">
                <Button variant="outline" className="w-full h-12 text-left justify-start">💰 Startgebühren-Übersicht</Button>
              </Link>
              <Link href="/change-password">
                <Button variant="outline" className="w-full h-12 text-left justify-start">🔑 Passwort ändern</Button>
              </Link>
              {!isOrganisator && (
                <Link href="/km-orga/mitglieder/import">
                  <Button variant="outline" className="w-full h-12 text-left justify-start">📥 Mitglieder importieren</Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>

        {/* KM-Saisonverwaltung */}
        <Card className="hover:shadow-md transition-shadow border-purple-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-800">
              📅 KM-Saisonverwaltung
            </CardTitle>
            <CardDescription>
              Saisons anlegen (KK & LP getrennt), Meldeschlüsse verwalten und Status ändern
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              <Link href="/km-orga/jahre">
                <Button className="w-full h-12 text-left justify-start bg-purple-600 hover:bg-purple-700">
                  📅 Saisons verwalten
                </Button>
              </Link>
              <div className="text-xs text-purple-700 dark:text-purple-200 bg-purple-100 dark:bg-purple-900/30 p-2 rounded">
                💡 Hier können Sie neue KM-Saisons anlegen (KK & LP getrennt)
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System-Verwaltung - nur für echte Admins */}
        {!isOrganisator && (
          <Card className="hover:shadow-md transition-shadow border-orange-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-700">
                ⚙️ System-Verwaltung
              </CardTitle>
              <CardDescription>
                Erweiterte Admin-Funktionen (nur für System-Admins)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2">
                <Link href="/km-orga/benutzer">
                  <Button variant="outline" className="w-full h-12 text-left justify-start">👤 Benutzer verwalten</Button>
                </Link>
                <Link href="/km-orga/system">
                  <Button variant="outline" className="w-full h-12 text-left justify-start">⚙️ System-Einstellungen</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
