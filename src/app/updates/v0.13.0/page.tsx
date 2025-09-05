import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Settings, Users, Zap, CheckCircle } from 'lucide-react';

export default function UpdateV0130() {
  return (
    <div className="container py-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <Link href="/updates">
          <Button variant="outline" size="sm" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück zu Updates
          </Button>
        </Link>
        
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold">Version 0.13.0</h1>
          <Badge variant="default" className="bg-green-600">
            KM-Mannschaftsregeln
          </Badge>
        </div>
        
        <p className="text-muted-foreground">
          Veröffentlicht am 05. September 2025
        </p>
      </div>

      <div className="grid gap-6">
        {/* Hauptfeatures */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              🎯 Neue Hauptfeatures
            </CardTitle>
            <CardDescription>
              Vollständige KM-Mannschaftsregeln-Verwaltung implementiert
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-medium">⚙️ Mannschaftsregeln-Verwaltung</h4>
                  <p className="text-sm text-muted-foreground">
                    Neue Seite <code>/km/mannschaftsregeln</code> für die Konfiguration automatischer Mannschaftsbildung
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-medium">🎯 Drag & Drop Altersklassen</h4>
                  <p className="text-sm text-muted-foreground">
                    Intuitive Zuordnung von Altersklassen zu Kombinationen per Drag & Drop
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-medium">📋 Disziplin-spezifische Regeln</h4>
                  <p className="text-sm text-muted-foreground">
                    Mehrfachauswahl von Altersklassen-Kombinationen pro Disziplin mit Checkbox-Interface
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-medium">🔄 Live-Validierung</h4>
                  <p className="text-sm text-muted-foreground">
                    Automatische Regelprüfung beim Bearbeiten von Mannschaften mit sofortiger Fehlermeldung
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Verbesserungen */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              ⚡ Verbesserungen & Optimierungen
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium">🎯 Korrekte Altersklassen-Berechnung</h4>
                  <p className="text-sm text-muted-foreground">
                    Einheitliche Altersklassen-Logik wie in <code>/km/uebersicht</code> für konsistente Anzeige
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium">⚡ Optimistische Updates</h4>
                  <p className="text-sm text-muted-foreground">
                    Sofortige UI-Reaktionen beim Entfernen von Schützen mit Rollback bei Fehlern
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium">🔍 Intelligente Schützen-Filterung</h4>
                  <p className="text-sm text-muted-foreground">
                    Nur kompatible Schützen werden in der Auswahl angezeigt basierend auf Mannschaftsregeln
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium">🗂️ System Config Integration</h4>
                  <p className="text-sm text-muted-foreground">
                    Zentrale Speicherung der Mannschaftsregeln in <code>system_config</code> Collection
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Technische Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              🛠️ Technische Implementierung
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3">
              <div>
                <h4 className="font-medium mb-2">Neue Services & APIs:</h4>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                  <li>• <code>MannschaftsbildungService</code> für Regelvalidierung</li>
                  <li>• <code>/api/km/mannschaftsregeln</code> API-Endpunkt</li>
                  <li>• Firestore-Regeln für <code>system_config</code> Collection</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">UI/UX Verbesserungen:</h4>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                  <li>• Drag & Drop Interface mit visueller Rückmeldung</li>
                  <li>• Checkbox-basierte Mehrfachauswahl</li>
                  <li>• Übersichtliche Altersklassen-Anzeige</li>
                  <li>• Benutzerfreundliche Fehlermeldungen</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Nutzung */}
        <Card>
          <CardHeader>
            <CardTitle>📖 Wie verwenden?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3">
              <div>
                <h4 className="font-medium">1. Mannschaftsregeln konfigurieren:</h4>
                <p className="text-sm text-muted-foreground ml-4">
                  Gehen Sie zu <code>/km/mannschaftsregeln</code> und definieren Sie Altersklassen-Kombinationen
                </p>
              </div>
              
              <div>
                <h4 className="font-medium">2. Disziplin-Regeln festlegen:</h4>
                <p className="text-sm text-muted-foreground ml-4">
                  Wählen Sie für jede Disziplin die erlaubten Altersklassen-Kombinationen aus
                </p>
              </div>
              
              <div>
                <h4 className="font-medium">3. Mannschaften bearbeiten:</h4>
                <p className="text-sm text-muted-foreground ml-4">
                  In <code>/km/mannschaften</code> werden nur noch kompatible Schützen angezeigt
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}