"use client";

import React, { useState } from 'react';
import { logError } from '@/lib/utils/secure-logger';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, FileSpreadsheet } from 'lucide-react';
import Link from 'next/link';
import { useKMAuth } from '@/hooks/useKMAuth';
import { useAuthContext } from '@/components/auth/AuthContext';
import { BackButton } from '@/components/ui/back-button';
import { KMProvider } from '@/contexts/KMContext';
import { KMClubSwitcher } from '@/components/ui/km-club-switcher';

function KMDashboardContent() {
  const { hasKMAccess, userRole, loading } = useKMAuth();
  const { user, userAppPermissions } = useAuthContext();
  const [isInstructionOpen, setIsInstructionOpen] = useState(false);
  const [aktiveSaisons, setAktiveSaisons] = useState<Array<{ id: string; jahr?: number; name?: string; status?: string; meldeschluss?: string; aktivAb?: string; [key: string]: any }>>([]);
  const [, setIsLoadingSaisons] = useState(true);
  
  React.useEffect(() => {
    loadAktiveSaisons();
  }, []);
  
  const loadAktiveSaisons = async () => {
    try {
      const response = await fetch('/api/km/saisons');
      if (response.ok) {
        const data = await response.json();
        const aktiveSaisons = data.data
          .filter((s: { status?: string }) => s.status === 'aktiv')
          .sort((a: { jahr?: number }, b: { jahr?: number }) => (b.jahr || 0) - (a.jahr || 0)); // Neueste zuerst
        setAktiveSaisons(aktiveSaisons);
      }
    } catch (error) {
      logError('Fehler beim Laden der Saisons:', error);
    } finally {
      setIsLoadingSaisons(false);
    }
  };

  if (loading) {
    return (
      <div className="container py-8 max-w-6xl mx-auto">
        <div className="flex flex-col items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-lg text-gray-600">Lade KM-Dashboard...</p>
        </div>
      </div>
    );
  }

  if (!hasKMAccess) {
    return (
      <div className="container py-8 max-w-6xl mx-auto">
        <div className="text-center py-10">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Zugriff verweigert</h1>
          <p className="text-gray-600 mb-4">Sie haben keine Berechtigung für das KM-System.</p>
          <Link href="/" className="text-primary hover:text-primary/80">← Zur Startseite</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4 px-2 max-w-full mx-auto">
      <div className="mb-6">
        <div className="flex items-center mb-2">
          <BackButton className="mr-2" fallbackHref="/dashboard-auswahl" />
          <h1 className="text-3xl font-bold text-primary">🏆 Kreismeisterschaften</h1>
        </div>
        <p className="text-muted-foreground">
          Hallo {userAppPermissions?.displayName || user?.displayName || user?.email}! Kreismeisterschafts-Meldungen für deinen Verein
          {userRole && <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">{userRole === 'admin' ? 'Admin' : userRole === 'km_organisator' ? 'KM-Organisator' : userRole === 'verein' ? 'Sportleiter' : 'Vereinsvertreter'}</span>}
        </p>
        <div className="mt-4 max-w-md">
          <KMClubSwitcher />
        </div>
      </div>

      {/* Anleitung für Vereinsvertreter */}
      <Card className="mb-6 bg-gradient-to-r from-blue-50 to-green-50 border-blue-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-blue-800 flex items-center gap-2">
                📚 Anleitung: KM-Meldungen für Ihren Verein
              </CardTitle>
              <CardDescription className="text-blue-700">
                So melden Sie Ihre Schützen zur Kreismeisterschaft an - einfach und digital!
              </CardDescription>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsInstructionOpen(!isInstructionOpen)}
              className="text-blue-700 hover:text-blue-900 flex-shrink-0 min-w-fit"
            >
              {isInstructionOpen ? <ChevronUp className="h-4 w-4 mr-1" /> : <ChevronDown className="h-4 w-4 mr-1" />}
              <span className="whitespace-nowrap">{isInstructionOpen ? 'Einklappen' : 'Anleitung anzeigen'}</span>
            </Button>
          </div>
        </CardHeader>
        {isInstructionOpen && (
        <CardContent>
          <div className="space-y-4">
            <div className="bg-white p-3 rounded-lg border border-blue-200">
              <div className="flex items-start gap-4">
                <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-lg font-bold flex-shrink-0">1</div>
                <div className="flex-1">
                  <h3 className="font-bold text-blue-900 mb-2">📝 Schützen melden</h3>
                  <p className="text-sm text-blue-700 mb-3">
                    Melden Sie Ihre Schützen für die verschiedenen Disziplinen an. Das System berechnet automatisch die Altersklassen.
                  </p>
                  <Link href="/km/meldungen">
                    <Button size="sm" className="w-full md:w-auto">📋 Schützen melden</Button>
                  </Link>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-3 rounded-lg border border-green-200">
              <div className="flex items-start gap-4">
                <div className="bg-green-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-lg font-bold flex-shrink-0">2</div>
                <div className="flex-1">
                  <h3 className="font-bold text-green-900 mb-2">👥 Mannschaften verwalten</h3>
                  <p className="text-sm text-green-700 mb-3">
                    Erstellen Sie Mannschaften für Ihre gemeldeten Schützen. Pro Mannschaft sind 3 Schützen erforderlich.
                  </p>
                  <Link href="/km/mannschaften">
                    <Button size="sm" className="w-full md:w-auto bg-green-600 hover:bg-green-700">👥 Mannschaften</Button>
                  </Link>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-3 rounded-lg border border-orange-200">
              <div className="flex items-start gap-4">
                <div className="bg-orange-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-lg font-bold flex-shrink-0">3</div>
                <div className="flex-1">
                  <h3 className="font-bold text-orange-900 mb-2">📊 Übersicht behalten</h3>
                  <p className="text-sm text-orange-700 mb-3">
                    Behalten Sie den Überblick über alle Ihre Meldungen und prüfen Sie die Altersklassen-Einteilung.
                  </p>
                  <Link href="/km/uebersicht">
                    <Button size="sm" className="w-full md:w-auto bg-orange-600 hover:bg-orange-700">📊 Alle Meldungen</Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-green-100 border border-green-300 rounded-lg">
            <h4 className="font-semibold text-green-800 mb-2">✅ Wichtige Hinweise</h4>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• VM-Ergebnisse (Vereinsmeisterschaft) können nachgetragen werden</li>
              <li>• Altersklassen werden automatisch nach Geburtsjahr berechnet</li>
              <li>• Bei Fragen wenden Sie sich an die KM-Organisatoren</li>
            </ul>
          </div>
        </CardContent>
        )}
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Meldungen & Verwaltung */}
        <Card className="hover:shadow-md transition-shadow border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              📋 Meldungen & Verwaltung
            </CardTitle>
            <CardDescription>
              Schützen für die Kreismeisterschaft melden und verwalten
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Link href="/km/meldungen">
                <Button className="w-full">📄 Schützen melden</Button>
              </Link>
              <Link href="/km/uebersicht">
                <Button variant="outline" className="w-full">📊 Alle Meldungen</Button>
              </Link>
              <Link href="/km/mannschaften">
                <Button variant="outline" className="w-full">👥 Mannschaften</Button>
              </Link>
              <Link href="/km/altersklassen">
                <Button variant="outline" className="w-full">📋 Altersklassen</Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Mitgliederverwaltung */}
        <Card className="hover:shadow-md transition-shadow border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              👥 Mitgliederverwaltung
            </CardTitle>
            <CardDescription>
              Schützen und Vereinsmitglieder verwalten
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Link href="/km/mitglieder">
                <Button className="w-full bg-green-600 hover:bg-green-700">👥 Mitglieder verwalten</Button>
              </Link>
              <Link href="/verein/mitglieder-import">
                <Button variant="outline" className="w-full">
                  <FileSpreadsheet className="mr-2 h-4 w-4" />Mitcom-Import
                </Button>
              </Link>
              {(userRole === 'admin' || userRole === 'km_organisator') && (
                <>
                  <Link href="/km/mannschaftsregeln">
                    <Button variant="outline" className="w-full">⚙️ Mannschaftsregeln</Button>
                  </Link>
                  <Link href="/km/init">
                    <Button variant="outline" className="w-full">⚙️ System Init</Button>
                  </Link>
                  <Link href="/change-password">
                    <Button variant="outline" className="w-full">🔑 Passwort ändern</Button>
                  </Link>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Statistiken */}
        <Card className="hover:shadow-md transition-shadow border-orange-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              📊 Aktuelle Kreismeisterschaften
            </CardTitle>
            <CardDescription>
              Aktive Kreismeisterschaften - Wichtige Informationen
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {aktiveSaisons.length > 0 ? (
                aktiveSaisons
                  .sort((a, b) => {
                    // Aktive Meldeschlüsse zuerst, dann nach Jahr sortiert
                    const today = new Date();
                    const getDeadline = (s: { meldeschluss?: string }) => {
                      if (!s.meldeschluss) return new Date(0);
                      if (s.meldeschluss.includes('.') && s.meldeschluss.length > 6) {
                        const [day, month, year] = s.meldeschluss.split('.');
                        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                      } else {
                        const [day, month] = s.meldeschluss.split('.');
                        return new Date(today.getFullYear(), parseInt(month) - 1, parseInt(day));
                      }
                    };
                    
                    const aExpired = today > getDeadline(a);
                    const bExpired = today > getDeadline(b);
                    
                    if (aExpired !== bExpired) {
                      return aExpired ? 1 : -1; // Aktive zuerst
                    }
                    return (b.jahr || 0) - (a.jahr || 0); // Dann nach Jahr
                  })
                  .map((saison) => {
                  // Prüfe ob Meldeschluss abgelaufen ist
                  const today = new Date();
                  let isExpired = false;
                  
                  if (saison.meldeschluss) {
                    let deadline;
                    if (saison.meldeschluss.includes('.') && saison.meldeschluss.length > 6) {
                      // Vollständiges Datum: "01.11.2025"
                      const [day, month, year] = saison.meldeschluss.split('.');
                      deadline = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                    } else {
                      // Kurzes Format: "15.12." - nehme aktuelles Jahr
                      const [day, month] = saison.meldeschluss.split('.');
                      deadline = new Date(today.getFullYear(), parseInt(month) - 1, parseInt(day));
                    }
                    isExpired = today > deadline;
                  }
                  
                  return (
                    <div key={saison.id} className={`p-3 rounded border ${
                      isExpired 
                        ? 'bg-red-50 border-red-200' 
                        : 'bg-green-50 border-green-200'
                    }`}>
                      <div className={`space-y-2 ${
                        isExpired ? 'text-red-700' : 'text-green-700'
                      }`}>
                        <div className={`flex items-center gap-2 font-medium ${
                          isExpired ? 'text-red-800' : 'text-green-800'
                        }`}>
                          <span>🎯</span>
                          <span>KM {saison.jahr} - {saison.name}</span>
                        </div>
                        <div className={`flex items-center gap-2 font-medium ${
                          isExpired ? 'text-red-700' : 'text-green-700'
                        }`}>
                          <span>{isExpired ? '⚠️' : '✅'}</span>
                          <span>Meldeschluss: {saison.meldeschluss}</span>
                          {isExpired ? (
                            <Badge variant="destructive" className="ml-2 text-xs">
                              Abgelaufen
                            </Badge>
                          ) : (
                            <Badge className="ml-2 text-xs bg-green-600">
                              Aktiv
                            </Badge>
                          )}
                        </div>
                        {saison.status === 'vorbereitung' && saison.aktivAb && (
                          <div className={`flex items-center gap-2 text-sm ${
                            isExpired ? 'text-red-600' : 'text-green-600'
                          }`}>
                            <span>📅</span>
                            <span>Meldungen ab: {saison.aktivAb}</span>
                          </div>
                        )}
                        {isExpired && (
                          <div className="flex items-center gap-2 text-sm text-red-600 font-medium">
                            <span>🚫</span>
                            <span>Neue Meldungen nicht mehr möglich</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="bg-gray-50 p-3 rounded border border-gray-200">
                  <div className="text-gray-600 text-sm">
                    Keine aktiven Kreismeisterschaften vorhanden.
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Admin-Funktionen */}
        {(userRole === 'admin' || userRole === 'km_organisator') && (
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                ⚙️ Admin-Funktionen
              </CardTitle>
              <CardDescription>
                Erweiterte Verwaltungsfunktionen
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {userRole === 'admin' && (
                  <Link href="/admin">
                    <Button variant="outline" className="w-full">🎯 RWK Admin</Button>
                  </Link>
                )}
                {(userRole === 'admin' || userRole === 'km_organisator') && (
                  <Link href="/km-orga">
                    <Button variant="outline" className="w-full">🏆 KM-Orga</Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default function KMDashboard() {
  return (
    <KMProvider>
      <KMDashboardContent />
    </KMProvider>
  );
}
