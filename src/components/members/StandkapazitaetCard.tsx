"use client";

// src/components/members/StandkapazitaetCard.tsx
// Kleines Feld über der Mitgliederliste: Welche Disziplinen kann der (aktive) Verein
// an eigenen Ständen ausrichten? Wird für den Ausrichter-Vorschlag (1. Durchgang) genutzt.
// Sichtbar/änderbar für den Sportleiter/Vorstand des eigenen Vereins (und Admin).

import { useEffect, useState } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useToast } from '@/hooks/use-toast';
import { logError } from '@/lib/utils/secure-logger';

const OPTIONEN: { key: string; label: string }[] = [
  { key: 'LG', label: 'Luftdruck (10m)' },
  { key: 'KKG', label: 'KK-Gewehr (50m)' },
  { key: 'KKP', label: 'KK-Pistole (25m)' },
];

export function StandkapazitaetCard({ clubId, canEdit }: { clubId: string | null; canEdit: boolean }) {
  const { toast } = useToast();
  const [disziplinen, setDisziplinen] = useState<string[]>([]);
  const [clubName, setClubName] = useState<string>('');
  const [keineStaende, setKeineStaende] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [geladen, setGeladen] = useState(false);

  useEffect(() => {
    if (!clubId) { setLoading(false); return; }
    setLoading(true);
    setGeladen(false);
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'clubs', clubId));
        if (snap.exists()) {
          const d = snap.data() as any;
          setDisziplinen(Array.isArray(d.ausrichterDisziplinen) ? d.ausrichterDisziplinen : []);
          setClubName(d.name || '');
          setKeineStaende(!!d.keineEigenenStaende);
        }
      } catch (e) {
        logError('Standkapazität laden fehlgeschlagen:', e);
      } finally {
        setLoading(false);
        setGeladen(true);
      }
    })();
  }, [clubId]);

  if (!clubId || loading) return null;

  const toggle = async (key: string) => {
    if (!canEdit || saving) return;
    const neu = new Set(disziplinen);
    if (neu.has(key)) neu.delete(key); else neu.add(key);
    const arr = Array.from(neu);
    setDisziplinen(arr); // optimistisch
    setSaving(true);
    try {
      await updateDoc(doc(db, 'clubs', clubId), { ausrichterDisziplinen: arr });
    } catch (e) {
      logError('Standkapazität speichern fehlgeschlagen:', e);
      toast({ title: 'Fehler', description: 'Konnte nicht gespeichert werden (fehlende Berechtigung?).', variant: 'destructive' });
      // zurückrollen
      setDisziplinen(disziplinen);
    } finally {
      setSaving(false);
    }
  };

  // Verein ohne eigene Stände (z. B. SSG): Standkapazität entfällt.
  if (keineStaende) {
    return (
      <div className="mb-4 rounded-md border p-3 text-sm bg-card">
        <span className="font-medium">🏠 Ausrichten{clubName ? ` (${clubName})` : ''}:</span>{' '}
        <span className="text-muted-foreground">entfällt (keine eigenen Stände)</span>
      </div>
    );
  }

  const unpflegt = geladen && disziplinen.length === 0;

  return (
    <div className={`mb-4 rounded-md border p-3 text-sm ${unpflegt ? 'border-amber-300 bg-amber-50 dark:bg-amber-950/20' : 'bg-card'}`}>
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
        <span className="font-medium whitespace-nowrap">
          🏠 Ausrichten{clubName ? ` (${clubName})` : ''}:
        </span>
        <div className="flex flex-wrap gap-3">
          {OPTIONEN.map(({ key, label }) => (
            <label key={key} className={`flex items-center gap-1.5 ${canEdit ? 'cursor-pointer' : 'opacity-70'}`}>
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={disziplinen.includes(key)}
                disabled={!canEdit || saving}
                onChange={() => toggle(key)}
              />
              {label}
            </label>
          ))}
        </div>
        {unpflegt && <span className="text-xs text-amber-700 dark:text-amber-300">Bitte auswählen, was euer Verein ausrichten kann.</span>}
      </div>
    </div>
  );
}
