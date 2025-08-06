import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, Users, Target, BarChart3, Shield, Zap } from 'lucide-react';

export default function UpdatesV099Page() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-3xl font-bold text-primary">Version 0.9.9</h1>
        <Badge variant="secondary" className="text-sm">Aktuell</Badge>
      </div>
      
      <div className="grid gap-6">
        {/* Highlight: Multi-Verein-System */}
        <Card className="border-l-4 border-l-blue-500 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-700">
              <Building2 className="h-5 w-5" />
              🎉 Multi-Verein-Unterstützung
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-blue-600">
              Benutzer können jetzt mehreren Vereinen zugeordnet werden und nahtlos zwischen ihnen wechseln.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <h4 className="font-semibold text-blue-700">✨ Neue Features:</h4>
                <ul className="space-y-1 text-blue-600">
                  <li>• Club-Switcher in der Navigation</li>
                  <li>• Persistente Vereinsauswahl</li>
                  <li>• Automatische Club-Auswahl-Seite</li>
                  <li>• Nahtloser Wechsel ohne Reload</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-blue-700">🔧 Betroffene Bereiche:</h4>
                <ul className="space-y-1 text-blue-600">
                  <li>• Mannschaften verwalten</li>
                  <li>• Schützen verwalten</li>
                  <li>• Ergebnisse erfassen</li>
                  <li>• Navigation & Context</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alle Features von v0.9.9 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Alle Features Version 0.9.9
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-3">
                  <h4 className="font-semibold text-blue-700">🏢 Multi-Verein-System:</h4>
                  <ul className="space-y-1 text-muted-foreground pl-4">
                    <li>• Club-Switcher Navigation mit persistenter Auswahl</li>
                    <li>• Einheitliche Datenansicht für alle Seiten</li>
                    <li>• Automatische Club-Auswahl-Seite</li>
                    <li>• localStorage-basierte Persistierung</li>
                  </ul>
                  
                  <h4 className="font-semibold text-green-700">⚙️ Liga-Einstellungen:</h4>
                  <ul className="space-y-1 text-muted-foreground pl-4">
                    <li>• Flexible Schusszahlen (20/30/40 Schuss)</li>
                    <li>• Alle Disziplinen: KK, LG, LP + Benutzerdefiniert</li>
                    <li>• Variable Ringzahlen je nach Disziplin</li>
                  </ul>
                  
                  <h4 className="font-semibold text-purple-700">📱 Mobile & UI-Fixes:</h4>
                  <ul className="space-y-1 text-muted-foreground pl-4">
                    <li>• Kreisdiagramm korrekt dargestellt</li>
                    <li>• Statistik-Hinweise mit Icons und Tipps</li>
                    <li>• PWA-Verbesserungen mit Install-Prompt</li>
                    <li>• Offline-Indikator</li>
                  </ul>
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-semibold text-orange-700">📧 E-Mail-System:</h4>
                  <ul className="space-y-1 text-muted-foreground pl-4">
                    <li>• Vollständige Rundschreiben-Verwaltung</li>
                    <li>• PDF/Word/Bild-Anhänge (bis 10MB)</li>
                    <li>• Liga-Filter für zielgerichtete Kommunikation</li>
                    <li>• Einzelkontakt-Auswahl zusätzlich zu Gruppen</li>
                  </ul>
                  
                  <h4 className="font-semibold text-red-700">🌐 Domain & Security:</h4>
                  <ul className="space-y-1 text-muted-foreground pl-4">
                    <li>• rwk-einbeck.de mit HTTPS und SSL</li>
                    <li>• E-Mails von @rwk-einbeck.de</li>
                    <li>• OWASP-Scan bestanden</li>
                    <li>• DNS-Konfiguration: SPF, DKIM, DMARC</li>
                  </ul>
                  
                  <h4 className="font-semibold text-teal-700">📊 Monitoring & Performance:</h4>
                  <ul className="space-y-1 text-muted-foreground pl-4">
                    <li>• Sentry-Integration mit E-Mail-Benachrichtigungen</li>
                    <li>• Performance-Tracking von Ladezeiten</li>
                    <li>• Code-Optimierung, Debug-Logs entfernt</li>
                    <li>• Production-ready Deployment</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Live-Status */}
        <Card className="border-l-4 border-l-green-500 bg-green-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              🚀 Version 0.9.9 ist live!
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-green-600">
                Professionelle Domain mit SSL-Verschlüsselung und Multi-Verein-System sind jetzt verfügbar.
              </p>
              <div className="flex items-center justify-between p-3 bg-white rounded border">
                <div>
                  <span className="font-medium text-green-800">🌐 Jetzt verfügbar:</span>
                  <p className="text-sm text-green-600">Alle Features sind live und einsatzbereit</p>
                </div>
                <a href="https://rwk-einbeck.de" target="_blank" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors">
                  🚀 Besuchen
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
