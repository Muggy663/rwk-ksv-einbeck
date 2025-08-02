"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuthContext } from '@/components/auth/AuthContext';
import { useKMAuth } from '@/hooks/useKMAuth';
import Link from 'next/link';

export default function DashboardAuswahl() {
  const { user, userAppPermissions, loading } = useAuthContext();
  const { hasKMAccess, hasKMAdminAccess, hasKMOrganizerAccess, loading: authLoading } = useKMAuth();

  if (loading || authLoading) {
    return (
      <div className="container py-8 max-w-4xl mx-auto">
        <div className="flex items-center justify-center py-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Lade Dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container py-8 max-w-4xl mx-auto">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Nicht angemeldet</h1>
          <Link href="/login" className="text-primary hover:text-primary/80">
            Zur Anmeldung
          </Link>
        </div>
      </div>
    );
  }

  const isRWKAdmin = userAppPermissions?.role === 'admin' || userAppPermissions?.role === 'superadmin';
  const isVereinsvertreter = userAppPermissions?.role === 'vereinsvertreter' || userAppPermissions?.role === 'club_representative';
  
  // Debug Auth reduziert
  if (!hasKMAccess) {
    console.log('KM Access denied for:', user?.email, 'Role:', userAppPermissions?.role);
  }

  return (
    <div className="container py-8 max-w-6xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-primary mb-2">Dashboard auswählen</h1>
        <p className="text-muted-foreground">
          Willkommen {user.displayName || user.email}! Wählen Sie Ihren Arbeitsbereich:
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* RWK Dashboard */}
        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl flex items-center gap-2">
              🎯 Rundenwettkampf
              {isRWKAdmin && <Badge variant="default">Admin</Badge>}
              {isVereinsvertreter && <Badge variant="secondary">Vereinsvertreter</Badge>}
            </CardTitle>
            <CardDescription>
              Rundenwettkampf-System für Ligabetrieb und Ergebnisse
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <h4 className="font-semibold text-blue-900 mb-2">Funktionen</h4>
                <div className="text-sm text-blue-700 space-y-1">
                  <div>• Ligatabellen und Ergebnisse</div>
                  <div>• Schützen- und Teamverwaltung</div>
                  <div>• Rundenwettkampf-Organisation</div>
                  {isRWKAdmin && <div>• Admin-Funktionen</div>}
                </div>
              </div>
              
              <div className="flex gap-2">
                <Link href={isRWKAdmin ? "/admin" : "/verein/dashboard"} className="flex-1">
                  <Button className="w-full">
                    RWK Dashboard öffnen
                  </Button>
                </Link>
                {isRWKAdmin && (
                  <Link href="/dashboard-auswahl">
                    <Button variant="outline" size="sm">
                      Auswahl
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KM Dashboard */}
        <Card className={`shadow-lg hover:shadow-xl transition-shadow ${!hasKMAccess ? 'opacity-60' : ''}`}>
          <CardHeader className="pb-4">
            <CardTitle className="text-xl flex items-center gap-2">
              🏆 Kreismeisterschaften
              {hasKMAdminAccess && <Badge variant="default">KM-Admin</Badge>}
              {hasKMOrganizerAccess && <Badge variant="secondary">KM-Organizer</Badge>}
              {hasKMAccess && !hasKMOrganizerAccess && <Badge variant="outline">Vereinsvertreter</Badge>}
            </CardTitle>
            <CardDescription>
              Kreismeisterschafts-System für Meldungen und Organisation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {hasKMAccess ? (
                <>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <h4 className="font-semibold text-green-900 mb-2">Funktionen</h4>
                    <div className="text-sm text-green-700 space-y-1">
                      <div>• KM-Meldungen erstellen</div>
                      <div>• Mannschaftsbildung</div>
                      <div>• VM-Ergebnisse erfassen</div>
                      {hasKMOrganizerAccess && <div>• Admin-Funktionen & Export</div>}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Link href="/km" className="flex-1">
                      <Button className="w-full">
                        KM Dashboard öffnen
                      </Button>
                    </Link>
                    {hasKMOrganizerAccess && (
                      <Link href="/km/admin">
                        <Button variant="outline" size="sm">
                          Admin
                        </Button>
                      </Link>
                    )}
                  </div>
                </>
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <h4 className="font-semibold text-gray-900 mb-2">Kein Zugang</h4>
                  <p className="text-sm text-gray-600">
                    Sie haben derzeit keine Berechtigung für das KM-System.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 text-center">
        <Button variant="outline" onClick={() => window.history.back()}>
          ← Zurück
        </Button>
      </div>
    </div>
  );
}