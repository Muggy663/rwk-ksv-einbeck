"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useKMAuth } from '@/hooks/useKMAuth';
import { useAuthContext } from '@/components/auth/AuthContext';

export default function KMAdminDashboard() {
  const { hasKMAccess, userRole, loading } = useKMAuth();
  const { user } = useAuthContext();

  if (loading) {
    return (
      <div className="container py-8 max-w-6xl mx-auto">
        <div className="flex flex-col items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-lg text-gray-600">Lade KM-Admin-Dashboard...</p>
        </div>
      </div>
    );
  }

  if (!hasKMAccess || (userRole !== 'admin' && userRole !== 'km_organisator')) {
    return (
      <div className="container py-8 max-w-6xl mx-auto">
        <div className="text-center py-10">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Zugriff verweigert</h1>
          <p className="text-gray-600 mb-4">Sie haben keine Berechtigung für das KM-Admin-Dashboard.</p>
          <Link href="/admin" className="text-primary hover:text-primary/80">← Zurück zum Admin-Bereich</Link>
        </div>
      </div>
    );
  }

  const isOrganisator = userRole === 'km_organisator';

  return (
    <div className="container py-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-primary">🏆 KM-Orga-Dashboard</h1>
        <p className="text-muted-foreground">
          Hallo {user?.displayName || user?.email}! Kreismeisterschafts-Verwaltung für alle Vereine
          {isOrganisator && <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">KM-Organisator</span>}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Meldungen verwalten */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📋 Meldungen verwalten
            </CardTitle>
            <CardDescription>
              Alle KM-Meldungen aller Vereine einsehen und bearbeiten
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Link href="/km-orga/meldungen">
                <Button className="w-full">Alle Meldungen anzeigen</Button>
              </Link>
              <Link href="/km-orga/meldungen/statistik">
                <Button variant="outline" className="w-full">Meldungs-Statistiken</Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Mitglieder verwalten */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              👥 Mitglieder verwalten
            </CardTitle>
            <CardDescription>
              Schützen aller Vereine anlegen, bearbeiten und verwalten
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Link href="/km-orga/mitglieder">
                <Button className="w-full">Alle Mitglieder</Button>
              </Link>
              {!isOrganisator && (
                <Link href="/km-orga/mitglieder/import">
                  <Button variant="outline" className="w-full">Mitglieder importieren</Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Mannschaften verwalten */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🏆 Mannschaften verwalten
            </CardTitle>
            <CardDescription>
              Teams aller Vereine generieren und bearbeiten
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Link href="/km-orga/mannschaften">
                <Button className="w-full">Alle Mannschaften</Button>
              </Link>
              <Link href="/km-orga/mannschaften/generator">
                <Button variant="outline" className="w-full">Mannschaften generieren</Button>
              </Link>
              <Button disabled className="w-full bg-gray-100 text-gray-500 cursor-not-allowed">
                📄 Startlisten generieren (bald)
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* System-Verwaltung - nur für echte Admins */}
        {!isOrganisator && (
          <Card className="hover:shadow-md transition-shadow border-orange-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-700">
                ⚙️ System-Verwaltung
              </CardTitle>
              <CardDescription>
                Erweiterte Admin-Funktionen (nur für System-Admins)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Link href="/km-orga/benutzer">
                  <Button variant="outline" className="w-full">Benutzer verwalten</Button>
                </Link>
                <Link href="/km-orga/system">
                  <Button variant="outline" className="w-full">System-Einstellungen</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}