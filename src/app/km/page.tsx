"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';
import { useKMAuth } from '@/hooks/useKMAuth';
import { useAuthContext } from '@/components/auth/AuthContext';

export default function KMDashboard() {
  const { hasKMAccess, userRole, loading } = useKMAuth();
  const { user } = useAuthContext();
  const [isInstructionOpen, setIsInstructionOpen] = useState(false);
  const [stats, setStats] = useState({ vereine: 0, meldungen: 0, mitglieder: 0, rwkTeilnehmer: 0 });
  const [selectedYear, setSelectedYear] = useState(2026);
  
  React.useEffect(() => {
    loadDashboardData();
  }, [selectedYear]);
  
  const loadDashboardData = async () => {
    try {
      const meldungenRes = await fetch(`/api/km/meldungen?jahr=${selectedYear}`);
      if (meldungenRes.ok) {
        const data = await meldungenRes.json();
        const meldungen = data.data || [];
        
        const uniqueVereine = new Set();
        meldungen.forEach(meldung => {
          const schuetze = meldung.schuetzeId;
          if (schuetze) uniqueVereine.add(schuetze);
        });
        
        setStats({
          vereine: uniqueVereine.size,
          meldungen: meldungen.length,
          mitglieder: 0,
          rwkTeilnehmer: 0
        });
      }
    } catch (error) {
      console.error('Dashboard-Fehler:', error);
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

  const isVerein = userRole === 'verein';
  
  return (
    <div className="container py-4 px-2 max-w-full mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-primary">🏆 KM-Dashboard</h1>
        <p className="text-muted-foreground">
          Hallo {user?.displayName || user?.email}! Kreismeisterschafts-Meldungen für Ihren Verein
          {userRole && <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">{userRole === 'admin' ? 'Admin' : userRole === 'km_organisator' ? 'KM-Organisator' : 'Vereinsvertreter'}</span>}
        </p>
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
              className="text-blue-700 hover:text-blue-900"
            >
              {isInstructionOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              {isInstructionOpen ? 'Einklappen' : 'Anleitung anzeigen'}
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
              <li>• Meldeschluss: 15. Dezember 2025</li>
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
              📊 Statistiken & Übersicht
            </CardTitle>
            <CardDescription>
              Aktuelle Zahlen zur Kreismeisterschaft {selectedYear}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="bg-orange-50 p-3 rounded border border-orange-100">
                <div className="text-orange-700 space-y-2">
                  <div className="flex items-center gap-2 font-medium">
                    <span>📊</span>
                    <span>{stats.meldungen} Schützen gemeldet</span>
                  </div>
                  <div className="flex items-center gap-2 font-medium">
                    <span>🏆</span>
                    <span>{stats.vereine} Vereine aktiv</span>
                  </div>
                  <div className="flex items-center gap-2 font-medium text-orange-700">
                    <span>⏰</span>
                    <span>Meldeschluss: 15.12.2025</span>
                  </div>
                </div>
              </div>
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