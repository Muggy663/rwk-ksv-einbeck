'use client';

// src/app/mitglieder/page.tsx
// Zentrale Mitgliederseite für RWK + KM. EINE Liste, ein Datenbestand.
// RWK und KM greifen auf dieselben Daten zu; die Liste zeigt alle benötigten Spalten.
// Rechte werden clientseitig für die UI abgeleitet; die API entscheidet verbindlich.

import { useMemo, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Info, ChevronLeft } from 'lucide-react';
import { PageHero } from '@/components/layout/PageHero';
import { useAuthContext } from '@/components/auth/AuthContext';
import { useClubContext } from '@/contexts/ClubContext';
import { getMemberPermissions } from '@/lib/permissions/memberPermissions';
import { MemberList } from '@/components/members/MemberList';

export default function MitgliederPage() {
  const { user, userAppPermissions, loading } = useAuthContext();
  const { representedClubs, activeClubId, setActiveClubId } = useClubContext();

  const permissions = useMemo(
    () => getMemberPermissions(userAppPermissions, user?.email),
    [userAppPermissions, user?.email]
  );

  // Admin/KM-Orga sehen alle Vereine -> kein Vereinsfilter nötig.
  // Sportleiter mit mehreren Vereinen -> Vereinsfilter, um gemischte Ansicht zu vermeiden.
  const showClubFilter = !permissions.canViewAllClubs && representedClubs.length > 1;

  // Aktiven Verein absichern: bei genau einem erlaubten Verein diesen setzen.
  useEffect(() => {
    if (permissions.canViewAllClubs) return;
    if (representedClubs.length === 1 && activeClubId !== representedClubs[0].id) {
      setActiveClubId(representedClubs[0].id);
    }
  }, [permissions.canViewAllClubs, representedClubs, activeClubId, setActiveClubId]);

  // Welcher clubId-Filter geht an die Liste?
  // - Admin/KM-Orga: kein Filter (alle Vereine).
  // - sonst: aktiver Verein (bzw. der einzige erlaubte).
  const effectiveClubId = permissions.canViewAllClubs
    ? null
    : activeClubId || representedClubs[0]?.id || null;

  if (loading) {
    return (
      <div className="container mx-auto max-w-5xl py-8">
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
            <p>Lade Mitglieder…</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto max-w-5xl py-8 text-center">
        <h1 className="mb-4 text-2xl font-bold">Nicht angemeldet</h1>
        <Link href="/login" className="text-primary hover:text-primary/80">
          Zur Anmeldung
        </Link>
      </div>
    );
  }

  if (!permissions.canViewMembers) {
    return (
      <div className="container mx-auto max-w-3xl py-8">
        <Card>
          <CardHeader>
            <CardTitle>Kein Zugriff</CardTitle>
            <CardDescription>
              Die Mitgliederverwaltung steht Sportleitern, der KM-Organisation und Administratoren
              zur Verfügung.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard-auswahl">
              <Button variant="outline">Zurück zum Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-6xl px-3 py-6 sm:px-4 sm:py-8">
      <PageHero
        icon={Users}
        title="Mitglieder"
        description="Eine gemeinsame Liste für RWK und Kreismeisterschaft"
        accent="primary"
        actions={
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link href="/dashboard-auswahl" className="flex items-center justify-center">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Zurück zur Auswahl
            </Link>
          </Button>
        }
      />

      <div className="mb-4 flex items-start gap-2 rounded-md border border-primary/20 bg-primary/5 p-3 text-sm text-muted-foreground">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <span>
          Diese Liste gilt für RWK und Kreismeisterschaft gemeinsam. Sie enthält alle Stammdaten
          inkl. Mitgliedsnummer und Altersklassen – jeder Bereich nutzt daraus, was er braucht.
        </span>
      </div>

      {/* Vereinsfilter nur, wenn der Nutzer mehreren Vereinen zugeordnet ist */}
      {showClubFilter && (
        <div className="mb-4">
          <span className="mb-1 block text-sm font-medium">Verein</span>
          <div className="flex flex-wrap gap-2">
            {representedClubs.map((club) => (
              <button
                key={club.id}
                type="button"
                onClick={() => setActiveClubId(club.id)}
                className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                  effectiveClubId === club.id
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                {club.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <MemberList
        permissions={permissions}
        activeClubId={effectiveClubId}
        defaultClubId={effectiveClubId || undefined}
      />
    </div>
  );
}
