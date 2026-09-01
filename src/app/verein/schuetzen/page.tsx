'use client';

// Diese Seite wurde in die zentrale Mitgliederverwaltung /mitglieder überführt.
// Alt-Einstieg bleibt als Redirect erhalten. Die Zuordnung von Schützen zu
// RWK-Mannschaften erfolgt weiterhin in der Mannschaftsverwaltung.

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function VereinSchuetzenRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/mitglieder');
  }, [router]);

  return (
    <div className="container mx-auto max-w-3xl py-16 text-center text-muted-foreground">
      Weiterleitung zur zentralen Mitgliederliste…
    </div>
  );
}
