"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BackButton } from '@/components/ui/back-button';
import { VereinsAppBanner } from '@/components/ui/vereins-app-banner';
import { ExternalLink, Users, CreditCard, Calendar, Trophy, FileText, Settings } from 'lucide-react';

export default function VereinssoftwarePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <BackButton className="mr-2" fallbackHref="/dashboard-auswahl" />
          <h1 className="text-4xl font-bold text-primary">Vereinssoftware</h1>
        </div>
      </div>

      {/* Migration Banner */}
      <VereinsAppBanner />

      {/* Migration Notice */}
      <Card className="mb-8 bg-gradient-to-r from-blue-50 via-purple-50 to-green-50 border-2 border-blue-300">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="text-3xl">🚀</div>
            <div>
              <CardTitle className="text-2xl text-blue-900">
                Vereinssoftware ist umgezogen!
              </CardTitle>
              <p className="text-blue-700 font-medium mt-2">
                Die Vereinssoftware ist jetzt eine eigenständige, spezialisierte App für professionelle Vereinsverwaltung.
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Warum der Umzug? */}
            <div>
              <h3 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
                <span>✨</span> Warum der Umzug?
              </h3>
              <ul className="space-y-2 text-blue-800">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span><strong>Bessere Performance:</strong> Fokussierte App nur für Vereinsverwaltung</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span><strong>Mehr Features:</strong> Neue Funktionen wie digitales Schießbuch</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span><strong>Saubere Trennung:</strong> RWK bleibt für Wettkampf, Verein für Verwaltung</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span><strong>Alle Daten migriert:</strong> Nichts geht verloren</span>
                </li>
              </ul>
            </div>

            {/* Was ist neu? */}
            <div>
              <h3 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
                <span>🆕</span> Was ist neu?
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 text-sm text-blue-700">
                  <Users className="h-4 w-4" />
                  <span>Mitgliederverwaltung</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-blue-700">
                  <CreditCard className="h-4 w-4" />
                  <span>SEPA-Beiträge</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-blue-700">
                  <Calendar className="h-4 w-4" />
                  <span>Terminplanung</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-blue-700">
                  <Trophy className="h-4 w-4" />
                  <span>Digitales Schießbuch</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-blue-700">
                  <FileText className="h-4 w-4" />
                  <span>Vereinsrecht</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-blue-700">
                  <Settings className="h-4 w-4" />
                  <span>Aufgaben-Management</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-white rounded-lg border border-blue-200">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div>
                <p className="font-bold text-blue-900 mb-1">
                  🔗 Neue Adresse: vereins-manager.vercel.app
                </p>
                <p className="text-sm text-blue-700">
                  Bookmarken Sie die neue Adresse für direkten Zugang
                </p>
              </div>
              <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white font-bold">
                <a 
                  href="https://vereins-manager.vercel.app" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  Vereins-Manager öffnen
                </a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Legacy Notice */}
      <Card className="bg-yellow-50 border-yellow-200">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <div className="text-yellow-600 text-xl">⚠️</div>
            <div>
              <h3 className="font-bold text-yellow-900 mb-2">
                Diese Seite wird nicht mehr aktualisiert
              </h3>
              <p className="text-yellow-800 mb-3">
                Die Vereinssoftware-Funktionen in der RWK App sind seit dem 15. Januar 2025 
                nicht mehr verfügbar. Alle Funktionen wurden in die neue Vereins-Manager App migriert.
              </p>
              <div className="text-sm text-yellow-700">
                <p>• <strong>Mitgliederdaten:</strong> Sicher in die neue App übertragen</p>
                <p>• <strong>Login:</strong> Verwenden Sie Ihre bestehenden Zugangsdaten</p>
                <p>• <strong>Support:</strong> rwk-leiter-ksve@gmx.de</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}