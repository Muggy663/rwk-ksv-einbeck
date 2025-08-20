"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { useKMAuth } from '@/hooks/useKMAuth';
import { useAuthContext } from '@/components/auth/AuthContext';

export default function KMDashboard() {
  const [isClient, setIsClient] = useState(false);
  const { user } = useAuthContext();
  const { hasKMAccess, isKMAdmin, isKMOrganisator, hasFullAccess, userRole, loading: authLoading } = useKMAuth();
  const [stats, setStats] = useState({ vereine: 0, meldungen: 0, mitglieder: 0, rwkTeilnehmer: 0 });
  const [selectedYear, setSelectedYear] = useState(2026);
  const [recentMeldungen, setRecentMeldungen] = useState([]);
  const [schuetzen, setSchuetzen] = useState([]);
  const [disziplinen, setDisziplinen] = useState([]);
  const [loading, setLoading] = useState(true);
  
  React.useEffect(() => {
    setIsClient(true);
    loadDashboardData();
  }, [selectedYear]); // Reload wenn Jahr ändert
  
  const loadDashboardData = async () => {
    try {
      let meldungen = [];
      let schuetzen = [];
      let clubs = [];
      
      // 1. Lade Meldungen für ausgewähltes Jahr
      try {
        const meldungenRes = await fetch(`/api/km/meldungen?jahr=${selectedYear}`);
        if (meldungenRes.ok) {
          const data = await meldungenRes.json();
          meldungen = data.data || [];
          setRecentMeldungen(meldungen.slice(0, 3));

        }
      } catch (error) {

      }
      
      // 2. Lade Schützen (direkt aus Firestore)
      try {
        const { collection, getDocs } = await import('firebase/firestore');
        const { db } = await import('@/lib/firebase/config');
        
        const shootersSnapshot = await getDocs(collection(db, 'shooters'));
        schuetzen = shootersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setSchuetzen(schuetzen);

      } catch (error) {

      }
      
      // 3. Lade Clubs (optional)
      try {
        const clubsRes = await fetch('/api/clubs');
        if (clubsRes.ok) {
          const data = await clubsRes.json();
          clubs = data.data || [];

        }
      } catch (error) {

      }
      
      // 4. Lade Disziplinen (optional)
      try {
        const disziplinenRes = await fetch('/api/km/disziplinen');
        if (disziplinenRes.ok) {
          const data = await disziplinenRes.json();
          setDisziplinen(data.data || []);

        }
      } catch (error) {

      }
      
      // 5. Berechne Statistiken
      const uniqueVereine = new Set();
      meldungen.forEach(meldung => {
        if (meldung.clubId) {
          uniqueVereine.add(meldung.clubId);
        } else {
          const schuetze = schuetzen.find(s => s.id === meldung.schuetzeId);
          if (schuetze) {
            const vereinId = schuetze.clubId || schuetze.kmClubId || schuetze.rwkClubId;
            if (vereinId) uniqueVereine.add(vereinId);
          }
        }
      });
      
      const rwkTeilnehmer = schuetzen.filter(s => s.clubId && !s.kmClubId).length;
      
      setStats({
        vereine: uniqueVereine.size,
        meldungen: meldungen.length,
        mitglieder: schuetzen.length,
        rwkTeilnehmer
      });
    } catch (error) {
      console.error('💥 Dashboard-Fehler:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleCleanup = async () => {
    if (confirm('Excel-Importe löschen? (Nur Schützen mit createdAt werden gelöscht)')) {
      const res = await fetch('/api/shooters?action=cleanup-imports', { method: 'DELETE' });
      if (res.ok) {
        const result = await res.json();
        alert(result.message);
      }
    }
  };
  
  return (
    <div className="container py-4 px-2 max-w-full mx-auto">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-primary">🏆 Kreismeisterschaften {selectedYear}</h1>
          <p className="text-muted-foreground">
            Hallo {user?.displayName || user?.email}! Digitale Meldungen zu den Kreismeisterschaften des KSV Einbeck
          </p>
        </div>
        <div className="flex items-center gap-3">
          {userRole && (
            <Badge variant="outline" className="text-xs py-1 px-2 border-blue-300 bg-blue-50 text-blue-700">
              {userRole === 'admin' ? 'Admin' : 
               userRole === 'km_organisator' ? 'KM-Organisator' : 
               'Vereinsvertreter'}
            </Badge>
          )}
          {isKMAdmin && (
            <Link href="/admin">
              <button className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg font-medium transition-colors">
                🎯 RWK Admin
              </button>
            </Link>
          )}
          {isKMOrganisator && (
            <Link href="/km-orga">
              <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
                🏆 KM-Orga
              </button>
            </Link>
          )}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm font-medium"
          >
            <option value={2026}>KM 2026</option>
            <option value={2027}>KM 2027</option>
            <option value={2028}>KM 2028</option>
          </select>
          <Badge variant="outline" className="text-xs py-1 px-2 border-green-300 bg-green-50 text-green-700">
            <span>✅ Produktiv</span>
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {/* Hauptfunktionen */}
        <Card className="border-2 border-primary/20 shadow-lg hover:shadow-xl transition-all duration-200">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/20">
            <CardTitle className="text-2xl flex items-center gap-3 text-primary">
              📝 Meldungen verwalten
            </CardTitle>
            <CardDescription className="text-base">Schützen für die Kreismeisterschaft melden</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-6">
              <div className="bg-blue-50 dark:bg-blue-950/50 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-4">
                <h4 className="font-bold text-blue-900 dark:text-blue-100 mb-3 text-lg">📊 Status</h4>
                <div className="text-blue-700 dark:text-blue-200 space-y-2">
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span>Lade Statistiken...</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 font-medium">
                        <span className="text-green-600 dark:text-green-400">✓</span>
                        <span>{stats.meldungen} Schützen gemeldet</span>
                      </div>
                      <div className="flex items-center gap-2 font-medium">
                        <span className="text-green-600 dark:text-green-400">✓</span>
                        <span>{stats.vereine} Vereine aktiv</span>
                      </div>
                      <div className="flex items-center gap-2 font-medium text-orange-700 dark:text-orange-300">
                        <span>⏰</span>
                        <span>Meldeschluss: 15.12.2025</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-3">
                <Link href="/km/meldungen" className="bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-lg font-semibold text-center transition-colors shadow-md hover:shadow-lg">
                  📋 Schützen melden
                </Link>
                <Link href="/km/mannschaften" className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold text-center transition-colors shadow-md hover:shadow-lg">
                  👥 Mannschaften
                </Link>
                <Link href="/km/uebersicht" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold text-center transition-colors shadow-md hover:shadow-lg">
                  📊 Alle Meldungen
                </Link>
                <Link href="/km/altersklassen" className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold text-center transition-colors shadow-md hover:shadow-lg">
                  📋 Altersklassen
                </Link>
                {hasFullAccess && (
                  <Link href="/km/init" className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-semibold text-center transition-colors shadow-md hover:shadow-lg">
                    ⚙️ System Init
                  </Link>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-green-200 dark:border-green-800 shadow-lg hover:shadow-xl transition-all duration-200">
          <CardHeader className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-950/50 dark:to-green-900/50">
            <CardTitle className="text-2xl flex items-center gap-3 text-green-700 dark:text-green-300">
              👥 Mitgliederverwaltung
            </CardTitle>
            <CardDescription className="text-base">Schützen und Vereinsmitglieder verwalten</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-6">
              <div className="bg-green-50 dark:bg-green-950/50 border-2 border-green-200 dark:border-green-800 rounded-xl p-4">
                <h4 className="font-bold text-green-900 dark:text-green-100 mb-3 text-lg">🛠️ Funktionen</h4>
                <div className="text-green-700 dark:text-green-200 space-y-2">
                  <div className="flex items-center gap-2 font-medium">
                    <span>📝</span>
                    <span>Mitglieder bearbeiten und verwalten</span>
                  </div>
                  <div className="flex items-center gap-2 font-medium">
                    <span>➕</span>
                    <span>Neue Schützen anlegen</span>
                  </div>
                  <div className="flex items-center gap-2 font-medium">
                    <span>🗑️</span>
                    <span>Schützen löschen</span>
                  </div>
                </div>
              </div>
              
              {hasFullAccess && (
                <div className="bg-red-50 dark:bg-red-950/50 border-2 border-red-200 dark:border-red-800 rounded-xl p-4">
                  <h4 className="font-bold text-red-900 dark:text-red-100 mb-3 text-lg flex items-center gap-2">
                    <span>⚠️</span>
                    <span>Admin-Tools</span>
                  </h4>
                  <div className="text-red-700 dark:text-red-200 mb-4">
                    <p className="font-medium">Datenbereinigung für Duplikate</p>
                  </div>
                  {isClient && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button 
                        onClick={handleCleanup}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors shadow-md hover:shadow-lg"
                      >
                        🗑️ Excel-Importe löschen
                      </button>
                      <button 
                        onClick={async () => {
                          if (confirm('Duplikate entfernen?\n\nRWK-Teilnehmer werden bevorzugt behalten.\nImportierte Duplikate werden gelöscht.')) {
                            const res = await fetch('/api/shooters?action=cleanup-duplicates', { method: 'DELETE' });
                            if (res.ok) {
                              const result = await res.json();
                              alert(`Erfolg: ${result.message}`);
                              loadDashboardData();
                            } else {
                              alert('Fehler beim Entfernen der Duplikate');
                            }
                          }
                        }}
                        className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors shadow-md hover:shadow-lg"
                      >
                        🔄 Duplikate entfernen
                      </button>
                      <button 
                        onClick={async () => {
                          const res = await fetch('/api/km/update-year', { method: 'POST' });
                          const result = await res.json();
                          alert(result.message);
                          loadDashboardData();
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors shadow-md hover:shadow-lg"
                      >
                        📅 Jahr-Fix 2026
                      </button>
                      <button 
                        onClick={async () => {
                          const res = await fetch('/api/km/fix-schuetze-links', { method: 'POST' });
                          const result = await res.json();
                          alert(result.message);
                          loadDashboardData();
                        }}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors shadow-md hover:shadow-lg"
                      >
                        🔗 Namen-Fix
                      </button>
                      <button 
                        onClick={async () => {
                          const res = await fetch('/api/debug/team-shooters', { method: 'GET' });
                          if (res.ok) {
                            const result = await res.json();

                            alert(`Debug-Info in Konsole:\n${result.summary}`);
                          }
                        }}
                        className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors shadow-md hover:shadow-lg"
                      >
                        🔍 Team-Debug
                      </button>
                    </div>
                  )}
                </div>
              )}
              
              <div className="pt-2">
                <Link href="/km/mitglieder" className="w-full bg-green-600 hover:bg-green-700 text-white px-6 py-4 rounded-lg font-bold text-lg text-center transition-colors shadow-md hover:shadow-lg flex items-center justify-center gap-2">
                  <span>👥</span>
                  <span>Mitglieder verwalten</span>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Admin-Bereich */}
        {hasFullAccess && (
          <Card className="border-2 border-purple-200 dark:border-purple-800 shadow-lg hover:shadow-xl transition-all duration-200">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-950/50 dark:to-purple-900/50">
              <CardTitle className="text-2xl flex items-center gap-3 text-purple-700 dark:text-purple-300">
                ⚙️ KM-Administration
              </CardTitle>
              <CardDescription className="text-base">Verwaltung für KM-Organisatoren</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-6">
                <div className="bg-purple-50 dark:bg-purple-950/50 border-2 border-purple-200 dark:border-purple-800 rounded-xl p-4">
                  <h4 className="font-bold text-purple-900 dark:text-purple-100 mb-3 text-lg">📈 Übersicht</h4>
                  <div className="text-purple-700 dark:text-purple-200 space-y-2">
                    <div className="flex items-center gap-2 font-medium">
                      <span>📊</span>
                      <span>8 Vereine gemeldet</span>
                    </div>
                    <div className="flex items-center gap-2 font-medium">
                      <span>🏆</span>
                      <span>127 Gesamtmeldungen</span>
                    </div>
                    <div className="flex items-center gap-2 font-medium">
                      <span>📅</span>
                      <span>Startplan: In Bearbeitung</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Link href="/km/admin" className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold text-center transition-colors shadow-md hover:shadow-lg">
                    🎛️ Admin-Dashboard
                  </Link>
                  <button className="border-2 border-purple-200 dark:border-purple-700 hover:bg-purple-50 dark:hover:bg-purple-950/50 px-6 py-3 rounded-lg font-semibold transition-colors shadow-md hover:shadow-lg">
                    📊 Statistiken
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}


      </div>

      {/* Info-Bereich */}
      <div className="mt-6 grid grid-cols-1 gap-4">
        <Card className="border-2 border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/20">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <div className="text-3xl">✅</div>
              <div>
                <h3 className="font-bold text-green-900 dark:text-green-100 text-lg mb-2">Produktionsreif</h3>
                <p className="text-green-700 dark:text-green-200 leading-relaxed">
                  Das KM-System ist vollständig funktional und produktionsreif. 
                  Alle Meldungen werden korrekt gespeichert und verarbeitet.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-2 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <div className="text-3xl">📋</div>
              <div>
                <h3 className="font-bold text-blue-900 dark:text-blue-100 text-lg mb-2">Sportordnung</h3>
                <p className="text-blue-700 dark:text-blue-200 mb-3 leading-relaxed">
                  Wettkampfklassen und Disziplinen nach DSB-Sportordnung
                </p>
                <a 
                  href="https://dsb.de/fileadmin/dsb/sportordnung/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors shadow-md hover:shadow-lg"
                >
                  <span>📖</span>
                  <span>DSB-Sportordnung öffnen</span>
                  <span>↗</span>
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
