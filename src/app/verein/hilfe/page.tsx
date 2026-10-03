"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';
import Link from 'next/link';
import { HelpCircle, Key } from 'lucide-react';
import { BackButton } from '@/components/ui/back-button';

export default function HilfePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <BackButton className="mr-2" fallbackHref="/verein/dashboard" />
        <div>
          <h1 className="text-3xl font-bold text-primary">Hilfe & Einstellungen</h1>
          <p className="text-muted-foreground">
            Hier findest du Hilfe und kannst deine Einstellungen ändern.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <HelpCircle className="h-5 w-5 mr-2" />
              Erste Schritte & App-Einführung
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Starte die Einführung, um die wichtigsten Funktionen der App kennenzulernen. Der &bdquo;Erste Schritte&ldquo;-Assistent führt dich durch die grundlegenden Funktionen für Sportleiter und Mannschaftsführer.</p>

            <div className="bg-blue-50 p-3 rounded-md border border-blue-100 mb-4">
              <h4 className="font-medium text-blue-800 mb-2">🏢 Multi-Verein-System</h4>
              <p className="text-sm text-blue-700">Falls du mehreren Vereinen zugeordnet bist:</p>
              <ul className="text-sm text-blue-700 mt-1 ml-4 list-disc">
                <li>Nach dem Login erscheint eine <strong>Club-Auswahl-Seite</strong></li>
                <li>Nutze den <strong>Club-Switcher</strong> in der Navigation zum Wechseln</li>
                <li>Deine Vereinsauswahl wird automatisch gespeichert</li>
                <li>Alle Daten (Mannschaften, Schützen, Ergebnisse) zeigen nur den aktuell ausgewählten Verein</li>
              </ul>
            </div>

            {/* Der Wizard rendert selbst den „Einführung starten"-Button. */}
            <OnboardingWizard />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Key className="h-5 w-5 mr-2" />
              Passwort ändern
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Ändere dein Passwort, um die Sicherheit deines Kontos zu gewährleisten.</p>
            <Button asChild className="w-full">
              <Link href="/change-password">Passwort ändern</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
