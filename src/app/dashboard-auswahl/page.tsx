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

  const isRWKAdmin = userAppPermissions?.role === 'superadmin' || user?.email === 'admin@rwk-einbeck.de';
  // Legacy-Rollen für Rückwärtskompatibilität
  const isLegacyVereinsvertreter = userAppPermissions?.role === 'vereinsvertreter' || userAppPermissions?.role === 'club_representative';
  const isLegacyVereinsvorstand = userAppPermissions?.role === 'vereinsvorstand';
  
  // Neue Club-Rollen
  const hasClubRoles = userAppPermissions?.clubRoles && Object.keys(userAppPermissions.clubRoles).length > 0;
  const clubRolesList = hasClubRoles ? Object.values(userAppPermissions.clubRoles) : [];
  const isSportleiter = clubRolesList.includes('SPORTLEITER');
  const isVorstand = clubRolesList.includes('VORSTAND');
  const isKassenwart = clubRolesList.includes('KASSENWART');
  const isSchriftfuehrer = clubRolesList.includes('SCHRIFTFUEHRER');
  const isJugendwart = clubRolesList.includes('JUGENDWART');
  const isDamenwart = clubRolesList.includes('DAMENWART');
  const isZeugwart = clubRolesList.includes('ZEUGWART');
  const isPressewart = clubRolesList.includes('PRESSEWART');
  const isTrainer = clubRolesList.includes('TRAINER');
  const isAusbilder = clubRolesList.includes('AUSBILDER');
  const isVereinsschuetze = clubRolesList.includes('VEREINSSCHUETZE');
  const isEhrenmitglied = clubRolesList.includes('EHRENMITGLIED');
  
  // Rollen-spezifische Bereiche für Vereinssoftware (Phase 2)
  const getVereinssoftwareBereiche = () => {
    if (isVorstand) {
      return ['👥 Alle Mitgliederverwaltung', '💰 Vollzugriff Finanzen & SEPA', '🎂 Geburtstage & Jubiläen', '🏆 Lizenzen & Ausbildungen', '⚖️ Vereinsrecht & Protokolle', '📋 Aufgaben-Management'];
    }
    if (isKassenwart) {
      return ['👥 Mitgliederverwaltung', '💰 SEPA-Lastschrift & Beiträge', '🎂 Geburtstage & Jubiläen', '📊 Finanz-Statistiken'];
    }
    if (isSchriftfuehrer) {
      return ['👥 Mitglieder (Lesezugriff)', '⚖️ Vereinsrecht & Protokolle', '📋 Sitzungsverwaltung', '🗳️ Wahlen & Beschlüsse'];
    }
    if (isSportleiter) {
      return ['👥 Mitglieder (Lesezugriff)', '🏆 Lizenzen & Ausbildungen', '📊 Sport-Statistiken'];
    }
    // Phase 2 Rollen
    if (isJugendwart) {
      return ['🧒 Jugend-Mitglieder verwalten', '🏆 Jugend-Ausbildungen', '📊 Jugend-Statistiken', '🏅 Jugend-Wettkämpfe'];
    }
    if (isDamenwart) {
      return ['👩 Damen-Mitglieder verwalten', '🎉 Damen-Events organisieren', '📊 Damen-Statistiken', '📅 Damen-Termine'];
    }
    if (isZeugwart) {
      return ['🔧 Waffen & Ausrüstung verwalten', '📊 Inventar führen', '🔍 Wartungspläne', '💰 Anschaffungen'];
    }
    if (isPressewart) {
      return ['📰 Vereins-News schreiben', '📝 Berichte erstellen', '📷 Foto-Verwaltung', '🌐 Öffentlichkeitsarbeit'];
    }
    if (isTrainer) {
      return ['🏃 Training durchführen', '🏆 Lizenzen verwalten', '📊 Trainings-Statistiken', '🎯 Leistungsanalyse'];
    }
    if (isAusbilder) {
      return ['🎓 Fortgeschrittene Schulungen', '📝 Prüfungen abnehmen', '🏆 Ausbilder-Lizenzen', '📊 Ausbildungs-Statistiken'];
    }
    if (isVereinsschuetze) {
      return ['👥 Eigene Daten einsehen', '🏆 Eigene Lizenzen', '📊 Eigene Statistiken', '📅 Termine einsehen'];
    }
    if (isEhrenmitglied) {
      return ['🏅 Vereinsgeschichte einsehen', '📜 Ehrungen verwalten', '📊 Historische Daten', '📅 Jubiläums-Termine'];
    }
    return ['👥 Basis-Funktionen'];
  };
  
  const getRollenBeschreibung = () => {
    if (isVorstand) return 'Vollzugriff auf alle Vereinssoftware-Bereiche';
    if (isKassenwart) return 'Finanz- und Mitgliederverwaltung';
    if (isSchriftfuehrer) return 'Protokolle und Mitglieder-Lesezugriff';
    if (isSportleiter) return 'Sport-Bereiche und Mitglieder-Lesezugriff';
    // Phase 2 Beschreibungen
    if (isJugendwart) return 'Jugendbereich und Nachwuchsförderung';
    if (isDamenwart) return 'Damenbereich und Events';
    if (isZeugwart) return 'Waffen, Ausrüstung und Inventar';
    if (isPressewart) return 'Öffentlichkeitsarbeit und Berichterstattung';
    if (isTrainer) return 'Training und Leistungsentwicklung';
    if (isAusbilder) return 'Ausbildung und Prüfungswesen';
    if (isVereinsschuetze) return 'Eigene Daten und Vereinsinformationen';
    if (isEhrenmitglied) return 'Vereinsgeschichte und Ehrungen';
    return 'Basis-Zugriff auf Vereinssoftware';
  };
  
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
        <Card className={`shadow-lg hover:shadow-xl transition-shadow ${isKMOrganisator && !isRWKAdmin && !isSportleiter && !isVorstand ? 'opacity-50 cursor-not-allowed' : ''}`}>
          <CardHeader className="pb-4">
            <div>
              <CardTitle className="text-xl mb-2">
                <span className="hidden sm:inline">🎯 Rundenwettkampf</span>
                <span className="sm:hidden">🎯 RWK</span>
                {isKMOrganisator && !isRWKAdmin && !isSportleiter && !isVorstand && <span className="text-red-500 ml-2">🚫</span>}
              </CardTitle>
              <div className="flex flex-wrap gap-1">
                {isRWKAdmin && <Badge variant="default">Superadmin</Badge>}
                {isSportleiter && !isRWKAdmin && <Badge variant="secondary">Sportleiter</Badge>}
                {isVorstand && !isRWKAdmin && <Badge variant="secondary">Vorstand</Badge>}
                {isKMOrganisator && !isRWKAdmin && !isSportleiter && !isVorstand && <Badge variant="destructive">Gesperrt für reine KM-Orga</Badge>}
                {!hasClubRoles && !isRWKAdmin && (isLegacyVereinsvertreter || isLegacyVereinsvorstand) && <Badge variant="destructive">Migration erforderlich</Badge>}
              </div>
            </div>
            <CardDescription>
              {isKMOrganisator && !isRWKAdmin && !isSportleiter && !isVorstand ? 
                'Als reiner KM-Organisator haben Sie keinen Zugang zum Rundenwettkampf-System' :
                'Rundenwettkampf-Verwaltung für Ligen und Mannschaften'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isKMOrganisator && !isRWKAdmin && !isSportleiter && !isVorstand ? (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                  <h4 className="font-semibold text-red-900 dark:text-red-100 mb-2">Zugang gesperrt</h4>
                  <div className="text-sm text-red-700 dark:text-red-200">
                    Reine KM-Organisatoren konzentrieren sich auf die Kreismeisterschaften und haben keinen Zugang zum RWK-System.
                  </div>
                </div>
              ) : (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Funktionen</h4>
                  <div className="text-sm text-blue-700 dark:text-blue-200 space-y-1">
                    <div>• Ligatabellen und Ergebnisse</div>
                    <div>• Schützen- und Teamverwaltung</div>
                    <div>• Rundenwettkampf-Organisation</div>
                    {isRWKAdmin && <div>• Admin-Funktionen</div>}
                  </div>
                </div>
              )}
              
              <div className="flex gap-2">
                {isKMOrganisator && !isRWKAdmin && !isSportleiter && !isVorstand ? (
                  <Button className="w-full" disabled>
                    Gesperrt für reine KM-Orga
                  </Button>
                ) : (
                  <Link href={isRWKAdmin ? "/admin" : (isSportleiter || isVorstand || isLegacyVereinsvertreter || isLegacyVereinsvorstand) ? "/verein/dashboard" : "/"} className="flex-1">
                    <Button className="w-full">
                      RWK-Bereich öffnen
                    </Button>
                  </Link>
                )}
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
                {(isKMOrganisator || hasFullAccess) && <Badge variant="secondary">KM-Organisator</Badge>}
                {hasKMAccess && !hasFullAccess && (isSportleiter || isVorstand) && <Badge variant="outline">{isSportleiter ? 'Sportleiter' : 'Vorstand'}</Badge>}
                {hasKMAccess && !hasFullAccess && !hasClubRoles && <Badge variant="outline">Legacy-Benutzer</Badge>}
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
                    {(isKMOrganisator || hasFullAccess) ? (
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

        {/* Vereinssoftware - Mit Lizenz-Check */}
        {(userAppPermissions?.vereinssoftwareLicense === true || userAppPermissions?.vereinssoftwareLicense === 'true' || isRWKAdmin || user?.email === 'admin@rwk-einbeck.de') ? (
          <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="pb-4">
              <div>
                <CardTitle className="text-xl mb-2">
                  👥 Vereinssoftware
                  <Badge className="ml-2 bg-orange-500 text-white text-xs">BETA</Badge>
                </CardTitle>
                <div className="flex flex-wrap gap-1">
                  {isRWKAdmin && <Badge variant="default">Superadmin</Badge>}
                  {(userAppPermissions?.vereinssoftwareLicense === true || userAppPermissions?.vereinssoftwareLicense === 'true') && !isRWKAdmin && <Badge variant="secondary">Lizenziert</Badge>}
                  {!isRWKAdmin && (
                    <>
                      {isVorstand && <Badge variant="outline">Vorstand</Badge>}
                      {isKassenwart && <Badge variant="outline">Kassenwart</Badge>}
                      {isSchriftfuehrer && <Badge variant="outline">Schriftführer</Badge>}
                      {isSportleiter && <Badge variant="outline">Sportleiter</Badge>}
                      {isJugendwart && <Badge variant="outline">Jugendwart</Badge>}
                      {isDamenwart && <Badge variant="outline">Damenwart</Badge>}
                      {isZeugwart && <Badge variant="outline">Zeugwart</Badge>}
                      {isPressewart && <Badge variant="outline">Pressewart</Badge>}
                      {isTrainer && <Badge variant="outline">Trainer</Badge>}
                      {isAusbilder && <Badge variant="outline">Ausbilder</Badge>}
                      {isVereinsschuetze && <Badge variant="outline">Vereinsschütze</Badge>}
                      {isEhrenmitglied && <Badge variant="outline">Ehrenmitglied</Badge>}
                    </>
                  )}
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
                  <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                    Ihre Bereiche ({isVorstand ? 'Vorstand' : isKassenwart ? 'Kassenwart' : isSchriftfuehrer ? 'Schriftführer' : isSportleiter ? 'Sportleiter' : isJugendwart ? 'Jugendwart' : isDamenwart ? 'Damenwart' : isZeugwart ? 'Zeugwart' : isPressewart ? 'Pressewart' : isTrainer ? 'Trainer' : isAusbilder ? 'Ausbilder' : isVereinsschuetze ? 'Vereinsschütze' : isEhrenmitglied ? 'Ehrenmitglied' : 'Benutzer'})
                  </h4>
                  <div className="text-sm text-green-700 dark:text-green-200 space-y-1">
                    {getVereinssoftwareBereiche().map((bereich, index) => (
                      <div key={index}>• {bereich}</div>
                    ))}
                  </div>
                  <div className="mt-2 pt-2 border-t border-green-200 dark:border-green-700">
                    <p className="text-xs text-green-600 dark:text-green-300 italic">
                      {getRollenBeschreibung()}
                    </p>
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
                    🔒 Lizenz erforderlich
                  </Badge>
                </div>
              </div>
              <CardDescription className="text-gray-400">
                Vollständige Vereinsverwaltung für moderne Schützenvereine
                <br />
                <span className="text-orange-500 text-sm font-medium">
                  💰 Kostenpflichtiges Zusatzmodul
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Funktionen</h4>
                  <div className="text-sm text-blue-700 dark:text-blue-200 space-y-1">
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
                    Lizenz erforderlich
                  </Button>
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    Kontakt: <strong>rwk-leiter-ksve@gmx.de</strong>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Support-Bereich */}
      <div className="mt-8 pt-6 border-t">
        <h2 className="text-xl font-semibold text-center mb-4 text-muted-foreground">🛠️ Support & Hilfe</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
          {/* Support anfordern - Für Vereine */}
          {!isRWKAdmin && (
            <Card className="border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-red-800 dark:text-red-200">🆘 Support anfordern</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-red-700 dark:text-red-300 mb-3">
                  Temporären Support-Zugang für das Support-Team generieren
                </p>
                <Link href="/vereinssoftware/support">
                  <Button className="w-full bg-red-600 hover:bg-red-700">
                    Support-Code generieren
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
          
          {/* Support-Zugang - Für Admin */}
          {isRWKAdmin && (
            <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-blue-800 dark:text-blue-200">🔑 Support-Zugang</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                  Support-Code eingeben für temporären Vereinszugang
                </p>
                <Link href="/admin/support-access">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700">
                    Support-Code eingeben
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

    </div>
  );
}
