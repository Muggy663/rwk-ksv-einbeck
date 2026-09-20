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

const DISMISS_KEY = 'ausrichter_reminder_dismissed_v1';

export function AusrichterReminder() {
  const { user, userAppPermissions } = useAuthContext();
  const [offeneVereine, setOffeneVereine] = useState<string[] | null>(null);
  const [sichtbar, setSichtbar] = useState(false);

  // Nur Admin / KV-Orga sollen die Stände pflegen.
  const istZustaendig =
    userAppPermissions?.role === 'superadmin' ||
    user?.email === 'admin@rwk-einbeck.de' ||
    (userAppPermissions?.kvRoles && Object.values(userAppPermissions.kvRoles).some(r => ['KV_KM_ORGA', 'KV_WETTKAMPFLEITER'].includes(r as string)));

  useEffect(() => {
    if (!user || !istZustaendig) return;
    // In dieser Session bereits weggeklickt?
    if (typeof window !== 'undefined' && sessionStorage.getItem(DISMISS_KEY)) return;

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
  }, [user, istZustaendig]);

  if (!sichtbar || !offeneVereine || offeneVereine.length === 0) return null;

  const schliessen = () => {
    setSichtbar(false);
    if (typeof window !== 'undefined') sessionStorage.setItem(DISMISS_KEY, '1');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
      <div className="bg-background rounded-lg shadow-xl max-w-md w-full p-5 space-y-4">
        <h2 className="text-lg font-semibold text-primary">🏠 Ausrichter-Stände pflegen</h2>
        <p className="text-sm text-muted-foreground">
          Bei <strong>{offeneVereine.length}</strong> {offeneVereine.length === 1 ? 'Verein' : 'Vereinen'} ist noch nicht hinterlegt,
          welche Disziplinen sie ausrichten können (Luftdruck / KK-Gewehr / KK-Pistole). Diese Angabe wird gebraucht,
          damit der Vorschlag „wer lädt zum 1. Durchgang ein" fair und korrekt rechnet – gerade bei Kleinkaliber und KK-Pistole.
        </p>
        <div className="max-h-32 overflow-y-auto text-xs text-muted-foreground border rounded p-2">
          {offeneVereine.slice(0, 20).join(', ')}
          {offeneVereine.length > 20 ? ` … und ${offeneVereine.length - 20} weitere` : ''}
        </div>
        <div className="flex flex-col sm:flex-row gap-2 justify-end">
          <Button variant="ghost" size="sm" onClick={schliessen}>Später</Button>
          <Link href="/admin/clubs" onClick={schliessen}>
            <Button size="sm">Jetzt pflegen</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
