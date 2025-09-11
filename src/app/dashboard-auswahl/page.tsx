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
  const { hasKMAccess, isKMAdmin, isKMOrganisator, hasFullAccess, loading: authLoading } = useKMAuth();

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
  const isVereinsvorstand = userAppPermissions?.role === 'vereinsvorstand';
  
  // Debug entfernt - verhindert Endlosschleife
  
  // Debug Auth reduziert
  if (!hasKMAccess) {

  }

  return (
    <div className="container py-8 max-w-6xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-primary mb-2">Arbeitsbereich auswählen</h1>
        <p className="text-muted-foreground">
          Willkommen {user.displayName || user.email}! Wählen Sie Ihren Arbeitsbereich:
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* RWK Dashboard */}
        <Card className={`shadow-lg hover:shadow-xl transition-shadow ${isKMOrganisator && !isRWKAdmin ? 'opacity-50' : ''}`}>
          <CardHeader className="pb-4">
            <div>
              <CardTitle className="text-xl mb-2">
                🎯 Rundenwettkampf
              </CardTitle>
              <div className="flex flex-wrap gap-1">
                {isRWKAdmin && <Badge variant="default">Admin</Badge>}
                {isVereinsvertreter && <Badge variant="secondary">Vereinsvertreter</Badge>}
                {isVereinsvorstand && <Badge variant="secondary">Vereinsvorstand</Badge>}
              </div>
            </div>
            <CardDescription>
              Rundenwettkampf-Verwaltung für Ligen und Mannschaften
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Funktionen</h4>
                <div className="text-sm text-blue-700 dark:text-blue-200 space-y-1">
                  <div>• Ligatabellen und Ergebnisse</div>
                  <div>• Schützen- und Teamverwaltung</div>
                  <div>• Rundenwettkampf-Organisation</div>
                  {isRWKAdmin && <div>• Admin-Funktionen</div>}
                </div>
              </div>
              
              <div className="flex gap-2">
                <Link href={isRWKAdmin ? "/admin" : "/verein/dashboard"} className="flex-1">
                  <Button className="w-full" disabled={isKMOrganisator && !isRWKAdmin}>
                    RWK-Bereich öffnen
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
            <div>
              <CardTitle className="text-xl mb-2">
                🏆 Kreismeisterschaften
              </CardTitle>
              <div className="flex flex-wrap gap-1">
                {isKMAdmin && <Badge variant="default">KM-Admin</Badge>}
                {isKMOrganisator && <Badge variant="secondary">KM-Organisator</Badge>}
                {hasKMAccess && !hasFullAccess && <Badge variant="outline">Vereinsvertreter</Badge>}
              </div>
            </div>
            <CardDescription>
              Kreismeisterschafts-System für Meldungen und Organisation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {hasKMAccess ? (
                <>
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                    <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">Funktionen</h4>
                    <div className="text-sm text-green-700 dark:text-green-200 space-y-1">
                      <div>• KM-Meldungen erstellen</div>
                      <div>• Mannschaftsbildung</div>
                      <div>• VM-Ergebnisse erfassen</div>
                      {hasFullAccess && <div>• Admin-Funktionen & Export</div>}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    {isKMOrganisator ? (
                      <Link href="/km-orga" className="flex-1">
                        <Button className="w-full">
                          KM-Orga Bereich öffnen
                        </Button>
                      </Link>
                    ) : (
                      <Link href="/km" className="flex-1">
                        <Button className="w-full">
                          KM Bereich öffnen
                        </Button>
                      </Link>
                    )}
                    {isKMAdmin && (
                      <Link href="/km-orga">
                        <Button variant="outline" size="sm">
                          Admin
                        </Button>
                      </Link>
                    )}
                  </div>
                </>
              ) : (
                <div className="bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Kein Zugang</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Sie haben derzeit keine Berechtigung für das KM-System.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Vereinssoftware - NUR für Vereinsvorstand und Admin */}
        {(isVereinsvorstand || userAppPermissions?.role === 'vereins_admin' || isRWKAdmin || user?.email === 'admin@rwk-einbeck.de') ? (
          <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="pb-4">
              <div>
                <CardTitle className="text-xl mb-2">
                  👥 Vereinssoftware
                  <Badge className="ml-2 bg-orange-500 text-white text-xs">BETA</Badge>
                </CardTitle>
                <div className="flex flex-wrap gap-1">
                  {(isRWKAdmin || user?.email === 'admin@rwk-einbeck.de') && <Badge variant="default">Super-Admin</Badge>}
                  {isVereinsvorstand && <Badge variant="secondary">Vereinsvorstand</Badge>}
                  {userAppPermissions?.role === 'vereins_admin' && <Badge variant="secondary">Vereins-Admin</Badge>}
                  {isVereinsvertreter && <Badge variant="secondary">Vereinsvertreter</Badge>}
                </div>
              </div>
              <CardDescription>
                Vollständige Vereinsverwaltung für moderne Schützenvereine
                <br />
                <span className="text-orange-600 text-sm font-medium">
                  ⚠️ In aktiver Entwicklung - Neue Features werden laufend hinzugefügt
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                  <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">Verfügbare Funktionen v1.5.8</h4>
                  <div className="text-sm text-green-700 dark:text-green-200 space-y-1">
                    <div>• 👥 Vollständige Mitgliederverwaltung (99 Mitglieder)</div>
                    <div>• 💳 SEPA-Lastschrift & Multi-Bank-Export</div>
                    <div>• 🎂 Geburtstage & Jubiläen-System</div>
                    <div>• 🏆 Lizenzen & Ausbildungen (8 Schießsport-Lizenzen)</div>
                    <div>• 👔 12 Vorstandspositionen mit Ablauf-Überwachung</div>
                    <div>• ⚖️ Vereinsrecht-Modul (Protokolle, Wahlen)</div>
                    <div>• 📋 Aufgaben-Management für Vorstand</div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <a href="/vereinssoftware">
                    <Button className="w-full">
                      Vereinssoftware öffnen
                    </Button>
                  </a>
                  <a href="/demo/vereinssoftware">
                    <Button className="w-full" variant="outline">
                      Demo ansehen
                    </Button>
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="shadow-lg border-2 border-dashed border-gray-300 bg-gray-50 dark:bg-gray-900/20">
            <CardHeader className="pb-4">
              <div>
                <CardTitle className="text-xl mb-2 text-gray-500">
                  👥 Vereinssoftware
                  <Badge className="ml-2 bg-orange-500 text-white text-xs">BETA</Badge>
                </CardTitle>
                <div className="flex flex-wrap gap-1">
                  <Badge variant="outline" className="text-orange-600 border-orange-300">
                    🔒 Freischaltung erforderlich
                  </Badge>
                </div>
              </div>
              <CardDescription className="text-gray-400">
                Vollständige Vereinsverwaltung für moderne Schützenvereine
                <br />
                <span className="text-orange-500 text-sm font-medium">
                  ⚠️ In aktiver Entwicklung - Neue Features werden laufend hinzugefügt
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3">
                  <h4 className="font-semibold text-orange-900 dark:text-orange-100 mb-2">Verfügbare Funktionen v1.5.8</h4>
                  <div className="text-sm text-orange-700 dark:text-orange-200 space-y-1">
                    <div>• 👥 Vollständige Mitgliederverwaltung</div>
                    <div>• 💳 SEPA-Lastschrift & Multi-Bank-Export</div>
                    <div>• 🎂 Geburtstage & Jubiläen-System</div>
                    <div>• 🏆 Lizenzen & Ausbildungen-Management</div>
                    <div>• ⚖️ Vereinsrecht-Modul (Protokolle, Wahlen)</div>
                    <div>• 📋 Aufgaben-Management für Vorstand</div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Button disabled className="w-full bg-gray-300 text-gray-500 cursor-not-allowed">
                    Freischaltung erforderlich
                  </Button>
                  <a href="/demo/vereinssoftware">
                    <Button className="w-full" variant="outline">
                      Demo ansehen
                    </Button>
                  </a>
                  <p className="text-xs text-gray-400 mt-2 text-center">
                    Kontaktieren Sie den Admin für Freischaltung!
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>


    </div>
  );
}
