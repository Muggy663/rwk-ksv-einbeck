"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle, Users, Target, Calendar, FileText } from 'lucide-react';
import Link from 'next/link';

export default function UpdateV0116() {
  return (
    <div className="container py-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/updates">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-primary">Version 0.11.6</h1>
          <p className="text-muted-foreground">Startlisten-Optimierung & Mannschafts-Integration</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Hauptfeatures */}
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <Target className="h-5 w-5" />
              🎯 Startlisten-Generierung Optimiert
            </CardTitle>
            <CardDescription>
              Intelligente Mannschafts-Integration und papier-sparende PDF-Generierung
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <div>
                    <div className="font-medium">Mannschafts-Integration</div>
                    <div className="text-sm text-muted-foreground">
                      Automatische Erkennung von Mannschafts-Mitgliedern aus km_mannschaften
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <div>
                    <div className="font-medium">Optimale Durchgangs-Verteilung</div>
                    <div className="text-sm text-muted-foreground">
                      Mannschaften zeitgleich, Einzelschützen füllen Lücken auf
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <div>
                    <div className="font-medium">Intelligente Stand-Zuweisung</div>
                    <div className="text-sm text-muted-foreground">
                      Automatische Konfliktauflösung bei Stand-Zeit-Überschneidungen
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <div>
                    <div className="font-medium">Papier-sparende PDFs</div>
                    <div className="text-sm text-muted-foreground">
                      Mehrere Starts pro Seite mit optimiertem Layout
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <div>
                    <div className="font-medium">Veranstaltungsdatum im Dateinamen</div>
                    <div className="text-sm text-muted-foreground">
                      PDF-Dateien werden nach Wettkampfdatum benannt
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <div>
                    <div className="font-medium">Duplikat-Bereinigung</div>
                    <div className="text-sm text-muted-foreground">
                      Verhindert doppelte Starter in der Startliste
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* UI Verbesserungen */}
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Users className="h-5 w-5" />
              👥 Benutzerfreundlichkeit
            </CardTitle>
            <CardDescription>
              Verbesserte Navigation und Funktionalität
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                <div>
                  <div className="font-medium">Mannschaften-Verwaltung verschoben</div>
                  <div className="text-sm text-muted-foreground">
                    Jetzt unter "Meldungen & Vorbereitung" für bessere Übersicht
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                <div>
                  <div className="font-medium">Dezente Löschen-Funktion</div>
                  <div className="text-sm text-muted-foreground">
                    Starter können per Hover-Button entfernt werden
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                <div>
                  <div className="font-medium">Korrekte Anzahl-Anzeige</div>
                  <div className="text-sm text-muted-foreground">
                    Meldungen und Startliste zeigen identische Zahlen
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Technische Verbesserungen */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              🔧 Technische Optimierungen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                <div>
                  <div className="font-medium">Saubere Datenquelle</div>
                  <div className="text-sm text-muted-foreground">
                    Startlisten basieren ausschließlich auf echten km_meldungen
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                <div>
                  <div className="font-medium">Saison-Filter</div>
                  <div className="text-sm text-muted-foreground">
                    Korrekte Filterung nach Saison für Meldungen und Mannschaften
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                <div>
                  <div className="font-medium">Eindeutige IDs</div>
                  <div className="text-sm text-muted-foreground">
                    Verhindert React-Warnings bei doppelten Schützen-Namen
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Beispiel */}
        <Card className="border-purple-200 bg-purple-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-800">
              <Calendar className="h-5 w-5" />
              📋 Beispiel: Optimierte Startlisten-Generierung
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-white p-4 rounded-lg border">
              <div className="text-sm font-mono space-y-1">
                <div className="text-green-600">✅ Bei 7 Ständen:</div>
                <div className="ml-4">• Durchgang 1: Mannschaft 1 (3) + Mannschaft 2 (3) + 1 Einzelschütze</div>
                <div className="ml-4">• Durchgang 2: Mannschaft 3 (3) + 4 Einzelschützen</div>
                <div className="ml-4">• Durchgang 3: Restliche Einzelschützen</div>
                <div className="mt-2 text-blue-600">📄 PDF-Dateiname:</div>
                <div className="ml-4">• Startliste_KM_2025-10-11.pdf (Wettkampfdatum)</div>
                <div className="ml-4">• Mehrere Starts pro Seite (papier-sparend)</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Versionsinfo */}
        <Card>
          <CardHeader>
            <CardTitle>📊 Versionsdetails</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">0.11.6</div>
                <div className="text-sm text-muted-foreground">Web-Version</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">47</div>
                <div className="text-sm text-muted-foreground">Korrekte Starter-Anzahl</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">9</div>
                <div className="text-sm text-muted-foreground">Mannschaften integriert</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">100%</div>
                <div className="text-sm text-muted-foreground">Konflikt-frei</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <Link href="/updates/v0.11.5">
            <Button variant="outline">← Version 0.11.5</Button>
          </Link>
          <Link href="/updates">
            <Button>Alle Updates</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}