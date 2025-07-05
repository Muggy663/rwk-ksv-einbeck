// src/app/verein/dashboard/page.tsx
"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, FileText, BarChart3, Calendar, Key, Play, Sparkles, Target, Trophy, Shield, HelpCircle } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { ClubSwitcher } from '@/components/ui/club-switcher';
import { InteractiveGuide } from '@/components/onboarding/InteractiveGuide';

export default function VereinDashboardPage() {
  const { user } = useAuth();
  const [showGuide, setShowGuide] = useState(false);

  const onboardingSteps = [
    {
      id: 'welcome',
      title: 'Willkommen im Vereinsbereich! 🎯',
      description: 'Hier verwalten Sie alles rund um Ihren Verein: Mannschaften erstellen, Schützen hinzufügen und Wettkampfergebnisse eintragen.',
      icon: <Sparkles className="h-6 w-6 text-purple-600" />,
      example: 'Sie sehen 6 Karten mit verschiedenen Funktionen - jede hat eine andere Farbe und Bedeutung.',
      tips: [
        'Grüne und blaue Karten sind am wichtigsten',
        'Graue Karten sind noch nicht verfügbar',
        'Jede Karte zeigt, was Sie dort machen können'
      ]
    },
    {
      id: 'teams',
      title: 'Mannschaften - Ihr Team aufstellen 👥',
      description: 'Hier erstellen Sie Mannschaften für verschiedene Disziplinen. Jede Mannschaft kann bis zu 3 Schützen haben.',
      icon: <Users className="h-6 w-6 text-green-600" />,
      example: 'Erstellen Sie "SV Musterverein I" für Kleinkaliber und "SV Musterverein II" für eine zweite Mannschaft.',
      tips: [
        'Benennung: "Vereinsname I", "Vereinsname II", etc.',
        'Der Admin muss Ihre Mannschaft einer Liga zuweisen',
        'Für Einzelschützen: "Vereinsname Einzel" verwenden'
      ]
    },
    {
      id: 'shooters',
      title: 'Schützen - Ihre Vereinsmitglieder 🎯',
      description: 'Fügen Sie alle Schützen Ihres Vereins hinzu. Sie brauchen mindestens Vor- und Nachname sowie das Geschlecht.',
      icon: <Target className="h-6 w-6 text-blue-600" />,
      example: 'Max Mustermann, männlich - dann können Sie ihn einer Mannschaft zuweisen.',
      tips: [
        'Ein Schütze kann pro Saison nur in einer Mannschaft stehen',
        'Bei weniger als 3 Schützen: "Einzel"-Mannschaft erstellen',
        'Schützen werden automatisch alphabetisch sortiert'
      ]
    },
    {
      id: 'results',
      title: 'Ergebnisse - Wettkampf eintragen 🏆',
      description: 'Nach jedem Wettkampf tragen Sie hier die Schießergebnisse ein. Das System prüft automatisch die Gültigkeit.',
      icon: <Trophy className="h-6 w-6 text-orange-600" />,
      example: 'Saison wählen → Liga wählen → Durchgang 1 → Mannschaft → Schütze → 285 Ringe eingeben.',
      tips: [
        'Kleinkaliber: max. 300 Ringe, Luftgewehr: max. 400 Ringe',
        'Sie können auch Ergebnisse für Gegner eintragen',
        'Sammeln Sie mehrere Ergebnisse, bevor Sie speichern'
      ]
    },
    {
      id: 'password',
      title: 'Sicherheit - Passwort schützen 🔐',
      description: 'Ändern Sie regelmäßig Ihr Passwort, um die Vereinsdaten zu schützen.',
      icon: <Shield className="h-6 w-6 text-red-600" />,
      example: 'Mindestens 8 Zeichen mit Groß-/Kleinbuchstaben und Zahlen verwenden.',
      tips: [
        'Passwort regelmäßig ändern',
        'Niemals das Passwort weitergeben',
        'Bei Problemen: rwk-leiter-ksve@gmx.de kontaktieren'
      ]
    },
    {
      id: 'help',
      title: 'Hilfe & weitere Funktionen 💡',
      description: 'Termine zeigen Wettkampfdaten, das Handbuch erklärt alles detailliert, und bei Problemen erstellen Sie ein Support-Ticket.',
      icon: <HelpCircle className="h-6 w-6 text-purple-600" />,
      example: 'Nächster Wettkampf am 15.07. um 14:00 Uhr - steht im Terminkalender.',
      tips: [
        'Handbuch hat Screenshots und Schritt-für-Schritt Anleitungen',
        'Support-Tickets werden schnell bearbeitet',
        'Handtabellen kommen in einem späteren Update'
      ]
    }
  ];

  const startGuide = () => setShowGuide(true);
  const completeGuide = () => setShowGuide(false);
  const skipGuide = () => setShowGuide(false);

  return (
    <div className="container py-8 max-w-7xl mx-auto">
      {/* Onboarding-Tour */}
      {showGuide && (
        <InteractiveGuide
          steps={onboardingSteps}
          onComplete={completeGuide}
          onSkip={skipGuide}
        />
      )}

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-bold text-primary mb-4">Vereins-Dashboard</h1>
          <div className="mb-4">
            <ClubSwitcher />
            <p className="text-xs text-muted-foreground mt-1 sm:hidden">
              ℹ️ Tippen Sie hier, um zwischen Ihren Vereinen zu wechseln
            </p>
          </div>
          <p className="text-lg text-muted-foreground">
            Willkommen, {user?.displayName || user?.email}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Verwalten Sie hier Ihre Mannschaften, Schützen und Ergebnisse
          </p>
        </div>
        
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-full">
                <Sparkles className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-900">Neu hier?</h3>
                <p className="text-sm text-blue-700 mb-3">
                  Lassen Sie sich durch die wichtigsten Funktionen führen
                </p>
                <Button onClick={startGuide} className="bg-blue-600 hover:bg-blue-700">
                  <Play className="mr-2 h-4 w-4" />
                  Erste Schritte starten
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="shadow-lg hover:shadow-xl transition-shadow border-l-4 border-l-green-500">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-green-100 rounded-lg">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <Badge variant="secondary">Wichtig</Badge>
            </div>
            <CardTitle className="text-xl">Mannschaften</CardTitle>
            <CardDescription className="text-base">
              Erstellen und verwalten Sie Ihre Mannschaften für die verschiedenen Ligen
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full h-12 text-base font-semibold">
              <Link href="/verein/mannschaften">
                Mannschaften verwalten
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow border-l-4 border-l-blue-500">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <Badge variant="secondary">Wichtig</Badge>
            </div>
            <CardTitle className="text-xl">Schützen</CardTitle>
            <CardDescription className="text-base">
              Fügen Sie neue Schützen hinzu und bearbeiten Sie deren Stammdaten
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full h-12 text-base font-semibold">
              <Link href="/verein/schuetzen">
                Schützen verwalten
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow border-l-4 border-l-orange-500">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-orange-100 rounded-lg">
                <BarChart3 className="h-6 w-6 text-orange-600" />
              </div>
              <Badge variant="secondary">Häufig</Badge>
            </div>
            <CardTitle className="text-xl">Ergebnisse</CardTitle>
            <CardDescription className="text-base">
              Tragen Sie die Wettkampfergebnisse für Ihre Mannschaften ein
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full h-12 text-base font-semibold">
              <Link href="/verein/ergebnisse">Ergebnisse erfassen</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow border-l-4 border-l-indigo-500">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <FileText className="h-6 w-6 text-indigo-600" />
              </div>
              <Badge variant="secondary">Neu</Badge>
            </div>
            <CardTitle className="text-xl">Handtabellen</CardTitle>
            <CardDescription className="text-base">
              Erstellen Sie Durchgangs-Meldebögen und Gesamtergebnislisten für Wettkämpfe
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full h-12 text-base font-semibold">
              <Link href="/verein/handtabellen">
                Handtabellen erstellen
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow border-l-4 border-l-purple-500">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
              <Badge variant="outline">Info</Badge>
            </div>
            <CardTitle className="text-xl">Termine</CardTitle>
            <CardDescription className="text-base">
              Sehen Sie alle aktuellen Wettkampftermine ein
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full h-12 text-base">
              <Link href="/termine">Termine anzeigen</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow border-l-4 border-l-red-500">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-red-100 rounded-lg">
                <Key className="h-6 w-6 text-red-600" />
              </div>
              <Badge variant="outline">Sicherheit</Badge>
            </div>
            <CardTitle className="text-xl">Passwort ändern</CardTitle>
            <CardDescription className="text-base">
              Ändern Sie Ihr Passwort für mehr Sicherheit
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full h-12 text-base">
              <Link href="/change-password">Passwort ändern</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}