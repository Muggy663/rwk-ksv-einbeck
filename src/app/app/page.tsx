"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Smartphone, Shield, Zap, Download, Github } from 'lucide-react';

const GITHUB_RELEASES_URL = 'https://github.com/Muggy663/rwk-ksv-einbeck/releases/latest';

export default function AppPage() {
  return (
    <div className="container py-8 max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-4">📱 RWK Einbeck App</h1>
        <p className="text-muted-foreground text-lg">
          Die offizielle Android-App für Rundenwettkämpfe
        </p>
      </div>

      {/* Download */}
      <Card className="mb-8 border-green-200 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20 dark:border-green-800">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-2xl text-green-900 dark:text-green-100">
            <Smartphone className="h-6 w-6" />
            RWK Einbeck App
          </CardTitle>
          <CardDescription className="text-green-700 dark:text-green-300">
            Kostenlos für Android • Keine Werbung • Direkter Download
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <div className="mb-6">
            <p className="text-sm text-muted-foreground mb-4 max-w-xl mx-auto">
              Die App wird als Android-Installationsdatei (APK) über GitHub bereitgestellt – kein Play Store nötig. Lade dir die aktuelle Version direkt herunter.
            </p>
            <Button
              size="lg"
              asChild
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <a href={GITHUB_RELEASES_URL} target="_blank" rel="noopener noreferrer">
                <Download className="h-5 w-5 mr-2" />
                Aktuelle App-Version herunterladen
              </a>
            </Button>
            <p className="text-xs text-muted-foreground mt-2 flex items-center justify-center gap-1">
              <Github className="h-3.5 w-3.5" />
              Öffnet die Release-Seite auf GitHub – dort die .apk-Datei antippen
            </p>
          </div>

          {/* Features Kurzübersicht */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="text-center">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center mx-auto mb-2">
                <Shield className="h-5 w-5 text-green-600 dark:text-green-300" />
              </div>
              <p className="text-xs font-medium">Werbefrei</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center mx-auto mb-2">
                <Zap className="h-5 w-5 text-blue-600 dark:text-blue-300" />
              </div>
              <p className="text-xs font-medium">Schnell & einfach</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/40 rounded-full flex items-center justify-center mx-auto mb-2">
                <Smartphone className="h-5 w-5 text-purple-600 dark:text-purple-300" />
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
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl font-bold text-blue-600 dark:text-blue-300">1</span>
              </div>
              <h3 className="font-semibold mb-2">APK herunterladen</h3>
              <p className="text-sm text-muted-foreground">
                Oben auf „Herunterladen" tippen und auf GitHub die .apk-Datei öffnen
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl font-bold text-green-600 dark:text-green-300">2</span>
              </div>
              <h3 className="font-semibold mb-2">Installation erlauben</h3>
              <p className="text-sm text-muted-foreground">
                Beim ersten Mal fragt Android nach – „Installation aus dieser Quelle erlauben" bestätigen, dann installieren
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/40 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl font-bold text-purple-600 dark:text-purple-300">3</span>
              </div>
              <h3 className="font-semibold mb-2">Anmelden</h3>
              <p className="text-sm text-muted-foreground">
                App öffnen und mit deinem RWK-Konto einloggen
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
              <p><strong>Inhalte sind immer aktuell:</strong> Tabellen, Ergebnisse, Termine und neue Funktionen lädt die App live von der Website – dafür ist keine Neuinstallation nötig.</p>
              <p className="mt-1"><strong>Neue App-Version:</strong> Nur bei größeren App-Updates gibt es eine neue APK. Dann einfach die aktuelle Datei erneut von GitHub herunterladen und über die vorhandene installieren.</p>
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
