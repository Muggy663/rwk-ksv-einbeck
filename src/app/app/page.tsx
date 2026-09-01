"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Smartphone, Shield, Zap } from 'lucide-react';

export default function AppPage() {
  return (
    <div className="container py-8 max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-4">📱 RWK Einbeck App</h1>
        <p className="text-muted-foreground text-lg">
          Die offizielle Android-App für Rundenwettkämpfe
        </p>
      </div>

      {/* Play Store Download */}
      <Card className="mb-8 border-green-200 bg-gradient-to-r from-green-50 to-blue-50">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-2xl text-green-900">
            <Smartphone className="h-6 w-6" />
            RWK Einbeck App
          </CardTitle>
          <CardDescription className="text-green-700">
            Kostenlos für Android • Keine Werbung • Automatische Updates
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <div className="mb-6">
            <div className="bg-orange-100 border border-orange-300 rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-orange-900 mb-2">🚀 App wird für den Play Store vorbereitet!</h3>
              <p className="text-orange-800 text-sm mb-3">
                Bevor Google die App für alle veröffentlicht, brauchen wir <strong>mindestens 12 Tester</strong> die die App 14 Tage lang testen.
              </p>
              <div className="space-y-2 text-sm text-orange-700">
                <p><strong>So hilfst du:</strong></p>
                <p>1. 📧 Sende deine <strong>Google-Mail-Adresse</strong> (Gmail) an die E-Mail unten</p>
                <p>2. 📱 Du erhältst einen Test-Link zum Installieren</p>
                <p>3. ✅ App installieren und kurz ausprobieren — fertig!</p>
              </div>
            </div>
            <Button 
              size="lg" 
              asChild 
              className="bg-green-600 hover:bg-green-700"
            >
              <a href="mailto:rwk-leiter-ksve@gmx.de?subject=Play Store Test - Meine Gmail-Adresse&body=Hallo Marcel,%0D%0A%0D%0AIch möchte die RWK App testen.%0D%0A%0D%0AMeine Google-Mail-Adresse: [HIER GMAIL EINFÜGEN]%0D%0A%0D%0AViele Grüße">
                📧 Gmail-Adresse zum Testen senden
              </a>
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              An: rwk-leiter-ksve@gmx.de • Deine E-Mail wird nur für den Test verwendet
            </p>
          </div>

          {/* Features Kurzübersicht */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="text-center">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Shield className="h-5 w-5 text-green-600" />
              </div>
              <p className="text-xs font-medium">Sicher & geprüft</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Zap className="h-5 w-5 text-blue-600" />
              </div>
              <p className="text-xs font-medium">Schnell & einfach</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Smartphone className="h-5 w-5 text-purple-600" />
              </div>
              <p className="text-xs font-medium">Optimiert fürs Handy</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Installation */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📋 So geht's
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl font-bold text-blue-600">1</span>
              </div>
              <h3 className="font-semibold mb-2">Play Store öffnen</h3>
              <p className="text-sm text-muted-foreground">
                Nach &quot;RWK Einbeck&quot; suchen oder Link anklicken
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl font-bold text-green-600">2</span>
              </div>
              <h3 className="font-semibold mb-2">Installieren</h3>
              <p className="text-sm text-muted-foreground">
                Auf &quot;Installieren&quot; tippen — fertig!
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl font-bold text-purple-600">3</span>
              </div>
              <h3 className="font-semibold mb-2">Anmelden</h3>
              <p className="text-sm text-muted-foreground">
                Mit deinem RWK-Konto einloggen
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* FAQ */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>❓ Häufige Fragen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <details className="border rounded-lg p-4">
            <summary className="cursor-pointer font-medium">
              Wie aktualisiere ich die App?
            </summary>
            <div className="mt-3 text-sm text-muted-foreground">
              <p><strong>Automatisch:</strong> Updates werden über den Play Store installiert.</p>
              <p className="mt-1"><strong>Manuell:</strong> Play Store öffnen → Meine Apps → Aktualisieren</p>
            </div>
          </details>

          <details className="border rounded-lg p-4">
            <summary className="cursor-pointer font-medium">
              Benötige ich Internet für die App?
            </summary>
            <div className="mt-3 text-sm text-muted-foreground">
              <p>Ja, die App benötigt eine Internetverbindung für aktuelle Daten (Tabellen, Ergebnisse, Meldungen).</p>
            </div>
          </details>

          <details className="border rounded-lg p-4">
            <summary className="cursor-pointer font-medium">
              Ist die App kostenlos?
            </summary>
            <div className="mt-3 text-sm text-muted-foreground">
              <p>Ja, komplett kostenlos und ohne Werbung. Entwickelt vom RWK-Leiter für den Kreisschützenverband Einbeck.</p>
            </div>
          </details>
        </CardContent>
      </Card>

      {/* iOS Explanation */}
      <Card className="mb-8 border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-900">
            🍎 Warum keine iPhone-App?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-orange-800">
            <p>
              Eine native iPhone-App würde <strong>laufende Kosten</strong> verursachen, die für eine kostenlose Rundenwettkampf-App unwirtschaftlich sind:
            </p>
            <ul className="list-disc ml-6 space-y-1">
              <li><strong>Apple Developer Account:</strong> €90 pro Jahr (Pflicht für Installation auf fremden Geräten)</li>
              <li><strong>App Store Review:</strong> Komplizierter Genehmigungsprozess</li>
              <li><strong>Wartungsaufwand:</strong> Separate iOS-Entwicklung und Updates</li>
            </ul>
            <div className="bg-white rounded-lg p-4 mt-4">
              <h4 className="font-semibold text-orange-900 mb-2">📱 iPhone-Nutzer können trotzdem:</h4>
              <ul className="text-sm space-y-1">
                <li>✅ <strong>Web-App nutzen:</strong> Alle Funktionen im Safari-Browser</li>
                <li>✅ <strong>PWA installieren:</strong> "Zum Home-Bildschirm" hinzufügen</li>
                <li>✅ <strong>Vollständiger Zugriff:</strong> Dokumente, Ergebnisse, Tabellen</li>
              </ul>
            </div>
            <p className="text-sm">
              <strong>Fazit:</strong> Die Web-App funktioniert auf iPhone genauso gut - ohne zusätzliche Kosten für den RWK-Leiter.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Features */}
      <Card>
        <CardHeader>
          <CardTitle>✨ App-Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <Zap className="h-5 w-5 text-blue-500" />
              <span>Schneller als Browser</span>
            </div>
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-green-500" />
              <span>Sicher & werbefrei</span>
            </div>
            <div className="flex items-center gap-3">
              <Zap className="h-5 w-5 text-purple-500" />
              <span>Schnelle Ladezeiten</span>
            </div>
            <div className="flex items-center gap-3">
              <Smartphone className="h-5 w-5 text-orange-500" />
              <span>Native Android-App</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
