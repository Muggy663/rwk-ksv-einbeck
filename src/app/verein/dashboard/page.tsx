// src/app/verein/dashboard/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { logError } from '@/lib/utils/secure-logger';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, FileText, BarChart3, Calendar, Key, Play, Sparkles, Target, Trophy, Shield, HelpCircle } from 'lucide-react';
import { db } from '@/lib/firebase/config';
import { collection, getDocs } from 'firebase/firestore';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { useVereinAuth } from '@/app/verein/layout';
import { useAuthContext } from '@/components/auth/AuthContext';
import { ClubSwitcher } from '@/components/ui/club-switcher';
import { InteractiveGuide } from '@/components/onboarding/InteractiveGuide';
import { BackButton } from '@/components/ui/back-button';

export default function VereinDashboardPage() {
  const { user } = useAuth();
  const { userPermission, currentClubId, assignedClubId } = useVereinAuth();
  const { userAppPermissions } = useAuthContext();
  const [showGuide, setShowGuide] = useState(false);
  const [allClubsGlobal, setAllClubsGlobal] = useState<Array<{ id: string; name?: string; [key: string]: any }>>([]);

  const onboardingSteps = [
    {
      id: 'welcome',
      title: 'Willkommen im RWK-Dashboard! 🎯',
      description: 'Hier verwalten Sie alles für Ihren Verein: Mannschaften erstellen, Schützen hinzufügen und Wettkampfergebnisse eintragen. Das System ist vollständig funktional und wird aktiv genutzt.',
      icon: <Sparkles className="h-6 w-6 text-purple-600" />,
      example: 'Sie sehen 8 Funktionsbereiche - von Mannschaften bis Passwort-Änderung. Jeder Bereich hat eine eigene Farbe.',
      tips: [
        'Grüne und blaue Bereiche sind die wichtigsten für den Start',
        'Orange für Ergebnisse - das machen Sie nach jedem Wettkampf',
        'Alle Funktionen sind sofort verfügbar und einsatzbereit'
      ]
    },
    {
      id: 'teams',
      title: 'Mannschaften - Ihr Team aufstellen 👥',
      description: 'Erstellen Sie Mannschaften für verschiedene Disziplinen. Pro Mannschaft können bis zu 3 Schützen antreten. Das System unterstützt Kleinkaliber, Luftgewehr und Luftpistole.',
      icon: <Users className="h-6 w-6 text-green-600" />,
      example: 'Erstellen Sie "SV Musterverein I" für die 1. Kreisklasse KK und "SV Musterverein II" für die 2. Kreisklasse.',
      tips: [
        'Benennung: "Vereinsname I", "Vereinsname II" - das ist Standard',
        'Der RWK-Leiter weist Ihre Mannschaft der passenden Liga zu',
        'Bei weniger als 3 Schützen: Einzelstarter-Mannschaft erstellen'
      ]
    },
    {
      id: 'shooters',
      title: 'Schützen - Ihre Vereinsmitglieder 🎯',
      description: 'Fügen Sie alle aktiven Schützen hinzu. Mindestens Vor- und Nachname sowie Geschlecht sind erforderlich. Das System berechnet automatisch Altersklassen.',
      icon: <Target className="h-6 w-6 text-blue-600" />,
      example: 'Max Mustermann, männlich, Jahrgang 1985 - wird automatisch als "Herren" eingestuft.',
      tips: [
        'Ein Schütze kann pro Saison nur in einer Mannschaft stehen',
        'Geburtsjahr eingeben für korrekte Altersklassen-Zuordnung',
        'Schützen können später zwischen Mannschaften gewechselt werden'
      ]
    },
    {
      id: 'results',
      title: 'Ergebnisse - Wettkampf eintragen 🏆',
      description: 'Nach jedem Wettkampf tragen Sie die Schießergebnisse ein. Das System validiert automatisch und berechnet Tabellen live. Alle Vereine nutzen diese Funktion aktiv.',
      icon: <Trophy className="h-6 w-6 text-orange-600" />,
      example: 'Saison 2024/25 → 1. Kreisklasse KK → 1. Durchgang → Ihre Mannschaft → Schütze auswählen → 285 Ringe.',
      tips: [
        'KK: max. 300 Ringe, LG: max. 400 Ringe, LP: max. 300 Ringe',
        'Sie können auch Ergebnisse der Gegner-Mannschaften eintragen',
        'Ergebnisse werden sofort in den Live-Tabellen sichtbar'
      ]
    },
    {
      id: 'handtabellen',
      title: 'Meldebögen - Wettkampf-Dokumente 📄',
      description: 'Erstellen Sie professionelle Durchgangs-Meldebögen und Ergebnislisten. Diese Funktion wird von vielen Vereinen für offizielle Wettkämpfe genutzt.',
      icon: <FileText className="h-6 w-6 text-indigo-600" />,
      example: 'Generieren Sie einen Meldebogen für den 3. Durchgang mit allen Mannschaften Ihrer Liga.',
      tips: [
        'PDFs können direkt ausgedruckt oder per E-Mail versendet werden',
        'Alle aktuellen Ergebnisse werden automatisch eingetragen',
        'Ideal für Wettkampfleiter und Schriftführer'
      ]
    },
    {
      id: 'security',
      title: 'Sicherheit & Verwaltung 🔐',
      description: 'Halten Sie Ihr Passwort sicher und nutzen Sie die Terminverwaltung. Bei Fragen steht der Support zur Verfügung.',
      icon: <Shield className="h-6 w-6 text-red-600" />,
      example: 'Passwort alle 3-6 Monate ändern und Wettkampftermine im Kalender prüfen.',
      tips: [
        'Starkes Passwort: Mindestens 8 Zeichen mit Zahlen und Buchstaben',
        'Termine zeigen alle aktuellen Wettkampfdaten',
        'Support: rwk-leiter-ksve@gmx.de - Antwort meist innerhalb 24h'
      ]
    }
  ];

  const startGuide = () => setShowGuide(true);
  const completeGuide = () => setShowGuide(false);
  const skipGuide = () => setShowGuide(false);

  // Lade Clubs für Vereinsanzeige
  useEffect(() => {
    const fetchClubs = async () => {
      try {
        const clubsSnapshot = await getDocs(collection(db, 'clubs'));
        const clubs = clubsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAllClubsGlobal(clubs);
      } catch (error) {
        logError('Fehler beim Laden der Clubs:', error);
      }
    };
    fetchClubs();
  }, []);

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
          <BackButton className="mb-4" fallbackHref="/dashboard-auswahl" />
          <h1 className="text-2xl md:text-3xl font-bold text-primary mb-4">RWK Dashboard</h1>
          {(currentClubId || assignedClubId) && (
            <p className="text-muted-foreground text-base md:text-lg mb-2">
              Verein: <span className="font-semibold text-primary">
                {allClubsGlobal.find(c => c.id === (currentClubId || assignedClubId))?.name || 'Verein wird geladen...'}
              </span>
            </p>
          )}
          <div className="mb-4">
            <ClubSwitcher />
            <p className="text-xs text-muted-foreground mt-1 sm:hidden">
              ℹ️ Tippen Sie hier, um zwischen Ihren Vereinen zu wechseln
            </p>
          </div>
          <p className="text-base md:text-lg text-muted-foreground">
            Willkommen, {userAppPermissions?.displayName || user?.displayName || user?.email}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Verwalte hier deine Mannschaften, Schützen und Ergebnisse
          </p>
          
          {/* Stammdaten-Hinweis */}
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-2">
              <div className="p-1 bg-blue-100 rounded-full flex-shrink-0 mt-0.5">
                <HelpCircle className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-900">Wichtiger Hinweis zu Schützen-Stammdaten</p>
                <p className="text-xs text-blue-800 mt-1">
                  Die Stammdaten der Schützen stammen vom <strong>01.08.2025</strong>. Ab diesem Zeitpunkt bist du für die Pflege und Aktualisierung der Daten selbst verantwortlich.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 border-blue-200 dark:border-blue-800 w-full max-w-md">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-full flex-shrink-0">
                <Sparkles className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-blue-900 dark:text-blue-100">Neu hier?</h3>
                <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                  Interaktive Tour durch alle RWK-Funktionen
                </p>
                <Button onClick={startGuide} className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 w-full sm:w-auto text-sm">
                  <Play className="mr-2 h-4 w-4 flex-shrink-0" />
                  <span className="truncate">Erste Schritte</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Mannschaften - Nur für Sportleiter/Vorstand */}
        {(userPermission?.clubRoles && (Object.values(userPermission.clubRoles).includes('SPORTLEITER') || Object.values(userPermission.clubRoles).includes('VORSTAND')) || userPermission?.role === 'vereinsvertreter' || user?.email === 'admin@rwk-einbeck.de') && (
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
                Erstelle und verwalte deine Mannschaften für die verschiedenen Ligen
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full h-12 text-sm font-semibold">
                <Link href="/verein/mannschaften">
                  <span className="truncate">Mannschaften verwalten</span>
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

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
              Trage die Wettkampfergebnisse für deine Mannschaften ein
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full h-12 text-sm font-semibold">
              <Link href="/verein/ergebnisse">
                <span className="truncate">Ergebnisse erfassen</span>
              </Link>
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
            <CardTitle className="text-xl">Meldezettel</CardTitle>
            <CardDescription className="text-base">
              Erstelle Durchgangs-Handzettel und Gesamtergebnislisten für Wettkämpfe
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full h-12 text-sm font-semibold">
              <Link href="/verein/handtabellen">
                <span className="truncate">Meldezettel erstellen</span>
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
            <CardTitle className="text-xl">Wettkampftermine</CardTitle>
            <CardDescription className="text-base">
              Sieh dir alle aktuellen Wettkampftermine an und füge neue hinzu
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full h-12 text-sm">
              <Link href="/termine">
                <span className="truncate">Termine verwalten</span>
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Mannschaftsführer-Kontakte - Für alle Vereinsrollen */}
        <Card className="shadow-lg hover:shadow-xl transition-shadow border-l-4 border-l-amber-500">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Users className="h-6 w-6 text-amber-600" />
              </div>
              <Badge variant="outline">Kontakte</Badge>
            </div>
            <CardTitle className="text-xl">Mannschaftsführer</CardTitle>
            <CardDescription className="text-base">
              Kontaktdaten aller Mannschaftsführer in deinen Ligen
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full h-12 text-sm">
              <Link href="/verein/team-managers">
                <span className="truncate">Kontakte anzeigen</span>
              </Link>
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
              Ändere dein Passwort für mehr Sicherheit
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full h-12 text-sm">
              <Link href="/change-password">
                <span className="truncate">Passwort ändern</span>
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
