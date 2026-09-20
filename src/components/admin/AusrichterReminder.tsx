"use client";

// src/components/admin/AusrichterReminder.tsx
// Erinnert Admin/KV-Orga nach dem Login daran, die Standkapazität der Vereine
// (welche Disziplinen ein Verein ausrichten kann) zu pflegen — solange es Vereine
// ohne diese Angabe gibt. Ohne diese Info kann der Ausrichter-Vorschlag für den
// 1. Durchgang (v. a. bei KK/KK-Pistole) nicht sauber rechnen.

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuthContext } from '@/components/auth/AuthContext';
import { logError } from '@/lib/utils/secure-logger';
import { Button } from '@/components/ui/button';

export function AusrichterReminder() {
  const { user, userAppPermissions } = useAuthContext();
  const [offeneVereine, setOffeneVereine] = useState<string[] | null>(null);
  const [sichtbar, setSichtbar] = useState(false);

  // Wer die Erinnerung sehen soll: Admin sowie Sportleiter/Vorstand/Mannschaftsführer
  // (Vereins-Ebene). KV-Orga ist hier bewusst NICHT dabei.
  const istZustaendig =
    userAppPermissions?.role === 'superadmin' ||
    user?.email === 'admin@rwk-einbeck.de' ||
    !!(userAppPermissions?.clubRoles && Object.values(userAppPermissions.clubRoles).some(r => ['SPORTLEITER', 'VORSTAND', 'MANNSCHAFTSFUEHRER'].includes(r as string))) ||
    userAppPermissions?.role === 'vereinsvertreter' ||
    userAppPermissions?.role === 'mannschaftsfuehrer';

  useEffect(() => {
    // Warten bis Nutzer + Berechtigungen geladen sind (Permissions kommen asynchron).
    if (!user || !userAppPermissions || !istZustaendig) return;

    const pruefe = async () => {
      try {
        const snap = await getDocs(collection(db, 'clubs'));
        const offen = snap.docs
          .filter(d => {
            const arr = (d.data() as any).ausrichterDisziplinen;
            return !Array.isArray(arr) || arr.length === 0;
          })
          .map(d => (d.data() as any).name || d.id);
        if (offen.length > 0) {
          setOffeneVereine(offen);
          setSichtbar(true);
        }
      } catch (e) {
        logError('AusrichterReminder: clubs konnten nicht geladen werden', e);
      }
    };
    pruefe();
    // userAppPermissions in den Dependencies, da es nach dem Login asynchron nachlädt
  }, [user, userAppPermissions, istZustaendig]);

  if (!sichtbar || !offeneVereine || offeneVereine.length === 0) return null;

  // Schlichter Banner oben auf dem Dashboard – nur die Aufforderung, keine Details.
  return (
    <div className="mb-6 rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="font-semibold text-amber-800 dark:text-amber-200 flex items-center gap-2">
          <span className="text-lg">🏠</span> Stände pflegen
        </div>
        <Link href="/admin/clubs" className="shrink-0">
          <Button size="sm">Jetzt pflegen</Button>
        </Link>
      </div>
    </div>
  );
}
