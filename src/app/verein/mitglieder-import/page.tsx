'use client';

// Der Mitcom-Import ist in die zentrale Mitgliederverwaltung umgezogen.
// Alt-Route bleibt als Redirect erhalten.

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function MitgliederImportRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/mitglieder/import');
  }, [router]);

  return (
    <div className="container mx-auto max-w-3xl py-16 text-center text-muted-foreground">
      Weiterleitung zum Mitcom-Import…
    </div>
  );
}
