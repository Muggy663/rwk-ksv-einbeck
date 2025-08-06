import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Zap, Database, Clock, TrendingUp } from 'lucide-react';
import Link from 'next/link';

export default function UpdateV092Page() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="text-center space-y-4">
        <Badge variant="secondary" className="text-lg px-4 py-2">
          Version 0.9.2
        </Badge>
        <h1 className="text-4xl font-bold text-primary">Performance-Optimierungen</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Drastische Verbesserung der Ladezeiten für RWK-Tabellen durch intelligentes Lazy Loading und Batch-Optimierungen.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <Zap className="h-5 w-5" />
              Bis zu 90% schneller
            </CardTitle>
            <CardDescription className="text-green-700">
              RWK-Tabellen laden jetzt in 1-2 Sekunden statt mehreren Sekunden
            </CardDescription>
          </CardHeader>
          <CardContent className="text-green-800">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Vorher:</span>
                <span className="font-mono">~49 Datenbankabfragen</span>
              </div>
              <div className="flex justify-between">
                <span>Nachher:</span>
                <span className="font-mono text-green-600">3 Datenbankabfragen</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Batch-Loading
            </CardTitle>
            <CardDescription>
              Intelligente Datenbankabfragen für optimale Performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Alle Teams in einer Abfrage
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Alle Scores in einer Abfrage
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Alle Clubs in einer Abfrage
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Hybrid Lazy Loading
            </CardTitle>
            <CardDescription>
              Sofortige Anzeige mit Details bei Bedarf
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Team-Tabellen laden sofort
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Schützen-Details beim Aufklappen
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Einzelschützen-Tab bei Bedarf
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Intelligentes Caching
            </CardTitle>
            <CardDescription>
              Einmal geladene Daten bleiben verfügbar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Schützen-Details werden gecacht
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Keine doppelten Abfragen
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Smooth User Experience
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-800">Technische Details</CardTitle>
        </CardHeader>
        <CardContent className="text-blue-800">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-semibold mb-2">Sofort geladen:</h4>
              <ul className="text-sm space-y-1">
                <li>• Alle Ligen und Teams</li>
                <li>• Team-Grunddaten (Name, Punkte, Rang)</li>
                <li>• Team-Tabellen sind sofort sichtbar</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Lazy geladen:</h4>
              <ul className="text-sm space-y-1">
                <li>• Schützen-Details beim Team-Aufklappen</li>
                <li>• Einzelschützen-Tab beim Tab-Wechsel</li>
                <li>• Loading-Spinner während des Ladens</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-amber-50 border-amber-200">
        <CardHeader>
          <CardTitle className="text-amber-800">Weitere Verbesserungen</CardTitle>
        </CardHeader>
        <CardContent className="text-amber-800">
          <ul className="text-sm space-y-2">
            <li>• <strong>Disziplin-Auswahl:</strong> Admin und Vereinsvertreter können Disziplin bei Mannschaftserstellung wählen</li>
            <li>• <strong>Disziplin-Badge:</strong> Bessere Unterscheidung von Teams durch Disziplin-Anzeige</li>
            <li>• <strong>Webpack-Fix:</strong> Termine-Bearbeitung funktioniert wieder korrekt</li>
            <li>• <strong>UI-Bereinigung:</strong> Störende Kontext-Texte und Pfeil-Buttons entfernt</li>
            <li>• <strong>Disziplinen-Update:</strong> KKS und LPF entfernt, LGS zu "Freihand" umbenannt</li>
            <li>• <strong>Cache-Optimierung:</strong> Session/Local Storage reduziert Firestore-Reads um 70%</li>
            <li>• <strong>Debounced Search:</strong> Suche wartet 300ms vor Filterung</li>
            <li>• <strong>Pagination:</strong> Nur 20 Teams pro Seite laden statt alle</li>
            <li>• <strong>Schützen-Limit:</strong> Nur erste 30 Schützen laden, "Mehr laden" Button für weitere</li>
            <li>• <strong>Offline Persistence:</strong> Firestore-Daten werden automatisch im Browser gecacht</li>
            <li>• <strong>Conditional Loading:</strong> Teams ohne Schützen werden nicht abgefragt</li>
            <li>• <strong>Smart Refresh:</strong> Daten werden nur alle 5 Minuten neu geladen</li>
            <li>• <strong>Background Sync:</strong> Gecachte Daten sofort anzeigen, frische im Hintergrund laden</li>
          </ul>
        </CardContent>
      </Card>

      <div className="text-center">
        <Link 
          href="/rwk-tabellen" 
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Zap className="h-4 w-4" />
          RWK-Tabellen testen
        </Link>
      </div>
    </div>
  );
}
