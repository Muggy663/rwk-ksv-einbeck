'use client';

// src/app/mitglieder/page.tsx
// Zentrale Mitgliederseite für RWK + KM. Eine Liste, ein Datenbestand.
// Rechte werden clientseitig für die UI abgeleitet; die API entscheidet verbindlich.

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Info } from 'lucide-react';
import { PageHero } from '@/components/layout/PageHero';
import { useAuthContext } from '@/components/auth/AuthContext';
import { getMemberPermissions } from '@/lib/permissions/memberPermissions';
import { MemberList, type MemberListMode } from '@/components/members/MemberList';

export default function MitgliederPage() {
  const { user, userAppPermissions, loading } = useAuthContext();
  const [mode, setMode] = useState<MemberListMode>('km');

  const permissions = useMemo(
    () => getMemberPermissions(userAppPermissions, user?.email),
    [userAppPermissions, user?.email]
  );

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
        description="Zentrale Liste für RWK und Kreismeisterschaft"
        accent="primary"
      />


      {/* Ansicht-Umschalter: gleiche Daten, unterschiedlicher Spaltensatz */}
      <div className="mb-4 inline-flex rounded-lg border p-1">
        <button
          type="button"
          onClick={() => setMode('km')}
          className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
            mode === 'km' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          KM-Ansicht
        </button>
        <button
          type="button"
          onClick={() => setMode('rwk')}
          className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
            mode === 'rwk' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          RWK-Ansicht
        </button>
      </div>

      <div className="mb-4 flex items-start gap-2 rounded-md border border-primary/20 bg-primary/5 p-3 text-sm text-muted-foreground">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <span>
          Diese Liste ist für RWK und Kreismeisterschaft gemeinsam. Die KM-Ansicht zeigt zusätzlich
          Mitgliedsnummer und Altersklassen.
        </span>
      </div>

      <MemberList mode={mode} permissions={permissions} />
    </div>
  );
}
