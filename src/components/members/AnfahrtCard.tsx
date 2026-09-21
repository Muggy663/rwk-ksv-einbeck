"use client";

// src/components/members/AnfahrtCard.tsx
// Kleines Feld über der Mitgliederliste: Google-Maps-Link zur Anfahrt des Vereins
// (Schützenhaus/Stand). Wird an Terminen als klickbarer Ort angezeigt, damit auch
// ortsunkundige Schützen den Weg finden.
// Sichtbar/änderbar für Sportleiter/Vorstand des eigenen Vereins (und Admin).
// Ändern und Löschen erfolgen mit doppelter Sicherheitsabfrage.

import { useEffect, useState } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useToast } from '@/hooks/use-toast';
import { logError } from '@/lib/utils/secure-logger';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function AnfahrtCard({ clubId, canEdit }: { clubId: string | null; canEdit: boolean }) {
  const { toast } = useToast();
  const [mapsUrl, setMapsUrl] = useState<string>('');
  const [entwurf, setEntwurf] = useState<string>('');
  const [clubName, setClubName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [bearbeiten, setBearbeiten] = useState(false);
  const [geladen, setGeladen] = useState(false);

  useEffect(() => {
    if (!clubId) { setLoading(false); return; }
    setLoading(true);
    setGeladen(false);
    setBearbeiten(false);
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'clubs', clubId));
        if (snap.exists()) {
          const d = snap.data() as any;
          setMapsUrl(typeof d.mapsUrl === 'string' ? d.mapsUrl : '');
          setEntwurf(typeof d.mapsUrl === 'string' ? d.mapsUrl : '');
          setClubName(d.name || '');
        }
      } catch (e) {
        logError('Anfahrt-Link laden fehlgeschlagen:', e);
      } finally {
        setLoading(false);
        setGeladen(true);
      }
    })();
  }, [clubId]);

  if (!clubId || loading) return null;

  const istGueltigerLink = (v: string) => /^https?:\/\/\S+/i.test(v.trim());

  const speichern = async () => {
    if (!canEdit || saving) return;
    const wert = entwurf.trim();
    if (wert && !istGueltigerLink(wert)) {
      toast({ title: 'Ungültiger Link', description: 'Bitte einen vollständigen Link eingeben (beginnt mit http:// oder https://).', variant: 'destructive' });
      return;
    }
    // Doppelte Nachfrage beim Ändern eines bereits vorhandenen Links.
    if (mapsUrl && wert && wert !== mapsUrl) {
      const ok = typeof window !== 'undefined'
        ? window.confirm('Anfahrt-Link wirklich ändern? Der bisherige Link wird überschrieben.')
        : true;
      if (!ok) return;
    }
    setSaving(true);
    try {
      await updateDoc(doc(db, 'clubs', clubId), { mapsUrl: wert });
      setMapsUrl(wert);
      setBearbeiten(false);
      toast({ title: 'Gespeichert', description: 'Anfahrt-Link aktualisiert.' });
    } catch (e) {
      logError('Anfahrt-Link speichern fehlgeschlagen:', e);
      toast({ title: 'Fehler', description: 'Konnte nicht gespeichert werden (fehlende Berechtigung?).', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const loeschen = async () => {
    if (!canEdit || saving || !mapsUrl) return;
    // Doppelte Nachfrage beim Löschen.
    const ok1 = typeof window !== 'undefined'
      ? window.confirm('Anfahrt-Link löschen?')
      : true;
    if (!ok1) return;
    const ok2 = typeof window !== 'undefined'
      ? window.confirm('Wirklich endgültig entfernen? An Terminen wird dann kein Kartenlink mehr angezeigt.')
      : true;
    if (!ok2) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'clubs', clubId), { mapsUrl: '' });
      setMapsUrl('');
      setEntwurf('');
      setBearbeiten(false);
      toast({ title: 'Entfernt', description: 'Anfahrt-Link gelöscht.' });
    } catch (e) {
      logError('Anfahrt-Link löschen fehlgeschlagen:', e);
      toast({ title: 'Fehler', description: 'Konnte nicht gelöscht werden (fehlende Berechtigung?).', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const unpflegt = geladen && !mapsUrl;

  return (
    <div className={`mb-4 rounded-md border p-3 text-sm ${unpflegt ? 'border-amber-300 bg-amber-50 dark:bg-amber-950/20' : 'bg-card'}`}>
      <div className="flex flex-col gap-2">
        <span className="font-medium">
          📍 Anfahrt{clubName ? ` (${clubName})` : ''}:
        </span>

        {/* Anzeige-Modus */}
        {!bearbeiten && (
          <div className="flex flex-wrap items-center gap-3">
            {mapsUrl ? (
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline break-all"
              >
                📍 Karte öffnen
              </a>
            ) : (
              <span className="text-xs text-amber-700 dark:text-amber-300">
                Noch kein Anfahrt-Link hinterlegt. Google-Maps-Link zum Schützenhaus eintragen, damit Gäste den Weg finden.
              </span>
            )}
            {canEdit && (
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => { setEntwurf(mapsUrl); setBearbeiten(true); }}>
                  {mapsUrl ? 'Ändern' : 'Hinzufügen'}
                </Button>
                {mapsUrl && (
                  <Button type="button" variant="ghost" size="sm" className="text-red-600" onClick={loeschen} disabled={saving}>
                    Löschen
                  </Button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Bearbeiten-Modus */}
        {bearbeiten && canEdit && (
          <div className="flex flex-col gap-2">
            <Input
              type="url"
              inputMode="url"
              placeholder="https://maps.app.goo.gl/… (in Google Maps: Teilen → Link kopieren)"
              value={entwurf}
              onChange={(e) => setEntwurf(e.target.value)}
              disabled={saving}
            />
            <div className="flex gap-2">
              <Button type="button" size="sm" onClick={speichern} disabled={saving}>
                Speichern
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => { setEntwurf(mapsUrl); setBearbeiten(false); }} disabled={saving}>
                Abbrechen
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Tipp: In Google Maps den Verein/das Schützenhaus suchen, auf „Teilen" → „Link kopieren" und hier einfügen. Kurze und lange Links funktionieren beide.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
