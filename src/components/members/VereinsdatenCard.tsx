"use client";

// src/components/members/VereinsdatenCard.tsx
// Gebündelte Vereinsdaten-Karte über der Mitgliederliste: Ausrichter-Stände
// (Standkapazität), Anfahrt-Link (Google Maps) und Vereins-Homepage.
// Ersetzt die früheren Einzelkarten StandkapazitaetCard + AnfahrtCard.
// Sichtbar/änderbar für Sportleiter/Vorstand des eigenen Vereins (und Admin).

import { useEffect, useState } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useToast } from '@/hooks/use-toast';
import { logError } from '@/lib/utils/secure-logger';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Target, MapPin, Globe, Loader2 } from 'lucide-react';

const STAND_OPTIONEN: { key: string; label: string }[] = [
  { key: 'LG', label: 'Luftdruck (10m)' },
  { key: 'KKG', label: 'KK-Gewehr (50m)' },
  { key: 'KKP', label: 'KK-Pistole (25m)' },
];

const istLink = (v: string) => /^https?:\/\/\S+/i.test(v.trim());

export function VereinsdatenCard({ clubId, canEdit }: { clubId: string | null; canEdit: boolean }) {
  const { toast } = useToast();
  const [clubName, setClubName] = useState('');
  const [disziplinen, setDisziplinen] = useState<string[]>([]);
  const [keineStaende, setKeineStaende] = useState(false);
  const [mapsUrl, setMapsUrl] = useState('');
  const [homepageUrl, setHomepageUrl] = useState('');
  const [mapsDraft, setMapsDraft] = useState('');
  const [homepageDraft, setHomepageDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingStand, setSavingStand] = useState(false);
  const [savingMaps, setSavingMaps] = useState(false);
  const [savingHomepage, setSavingHomepage] = useState(false);

  useEffect(() => {
    if (!clubId) { setLoading(false); return; }
    setLoading(true);
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'clubs', clubId));
        if (snap.exists()) {
          const d = snap.data() as any;
          setClubName(d.name || '');
          setDisziplinen(Array.isArray(d.ausrichterDisziplinen) ? d.ausrichterDisziplinen : []);
          setKeineStaende(!!d.keineEigenenStaende);
          setMapsUrl(typeof d.mapsUrl === 'string' ? d.mapsUrl : '');
          setMapsDraft(typeof d.mapsUrl === 'string' ? d.mapsUrl : '');
          setHomepageUrl(typeof d.homepageUrl === 'string' ? d.homepageUrl : '');
          setHomepageDraft(typeof d.homepageUrl === 'string' ? d.homepageUrl : '');
        }
      } catch (e) {
        logError('Vereinsdaten laden fehlgeschlagen:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [clubId]);

  if (!clubId || loading) return null;

  const toggleStand = async (key: string) => {
    if (!canEdit || savingStand || keineStaende) return;
    const neu = new Set(disziplinen);
    if (neu.has(key)) neu.delete(key); else neu.add(key);
    const arr = Array.from(neu);
    setDisziplinen(arr);
    setSavingStand(true);
    try {
      await updateDoc(doc(db, 'clubs', clubId), { ausrichterDisziplinen: arr });
    } catch (e) {
      logError('Standkapazität speichern fehlgeschlagen:', e);
      toast({ title: 'Fehler', description: 'Konnte nicht gespeichert werden.', variant: 'destructive' });
      setDisziplinen(disziplinen);
    } finally {
      setSavingStand(false);
    }
  };

  const speichereMaps = async () => {
    if (!canEdit || savingMaps) return;
    const wert = mapsDraft.trim();
    if (wert && !istLink(wert)) {
      toast({ title: 'Ungültiger Link', description: 'Bitte vollständigen Link eingeben (http:// oder https://).', variant: 'destructive' });
      return;
    }
    setSavingMaps(true);
    try {
      await updateDoc(doc(db, 'clubs', clubId), { mapsUrl: wert });
      setMapsUrl(wert);
      toast({ title: 'Gespeichert', description: 'Anfahrt-Link aktualisiert.' });
    } catch (e) {
      logError('Anfahrt speichern fehlgeschlagen:', e);
      toast({ title: 'Fehler', description: 'Konnte nicht gespeichert werden.', variant: 'destructive' });
    } finally {
      setSavingMaps(false);
    }
  };

  const speichereHomepage = async () => {
    if (!canEdit || savingHomepage) return;
    const wert = homepageDraft.trim();
    if (wert && !istLink(wert)) {
      toast({ title: 'Ungültiger Link', description: 'Bitte vollständigen Link eingeben (http:// oder https://).', variant: 'destructive' });
      return;
    }
    setSavingHomepage(true);
    try {
      await updateDoc(doc(db, 'clubs', clubId), { homepageUrl: wert });
      setHomepageUrl(wert);
      toast({ title: 'Gespeichert', description: 'Homepage aktualisiert.' });
    } catch (e) {
      logError('Homepage speichern fehlgeschlagen:', e);
      toast({ title: 'Fehler', description: 'Konnte nicht gespeichert werden.', variant: 'destructive' });
    } finally {
      setSavingHomepage(false);
    }
  };

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          🏠 Vereinsdaten{clubName ? ` – ${clubName}` : ''}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5 text-sm">
        {/* Ausrichter-Stände */}
        <div>
          <div className="flex items-center gap-2 font-medium mb-2">
            <Target className="h-4 w-4 text-emerald-600" /> Ausrichter-Stände
          </div>
          {keineStaende ? (
            <span className="text-muted-foreground">entfällt (keine eigenen Stände)</span>
          ) : (
            <div className="flex flex-wrap gap-3">
              {STAND_OPTIONEN.map(({ key, label }) => (
                <label key={key} className={`flex items-center gap-1.5 ${canEdit ? 'cursor-pointer' : 'opacity-70'}`}>
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={disziplinen.includes(key)}
                    disabled={!canEdit || savingStand}
                    onChange={() => toggleStand(key)}
                  />
                  {label}
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Anfahrt */}
        <div>
          <div className="flex items-center gap-2 font-medium mb-2">
            <MapPin className="h-4 w-4 text-indigo-600" /> Anfahrt (Google Maps)
          </div>
          {canEdit ? (
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                type="url"
                inputMode="url"
                placeholder="https://maps.app.goo.gl/…"
                value={mapsDraft}
                onChange={(e) => setMapsDraft(e.target.value)}
                disabled={savingMaps}
              />
              <Button size="sm" onClick={speichereMaps} disabled={savingMaps || mapsDraft.trim() === mapsUrl.trim()}>
                {savingMaps ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Speichern'}
              </Button>
            </div>
          ) : mapsUrl ? (
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline break-all">📍 Karte öffnen</a>
          ) : (
            <span className="text-muted-foreground">kein Link hinterlegt</span>
          )}
        </div>

        {/* Homepage */}
        <div>
          <div className="flex items-center gap-2 font-medium mb-2">
            <Globe className="h-4 w-4 text-sky-600" /> Homepage
          </div>
          {canEdit ? (
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                type="url"
                inputMode="url"
                placeholder="https://www.euer-verein.de"
                value={homepageDraft}
                onChange={(e) => setHomepageDraft(e.target.value)}
                disabled={savingHomepage}
              />
              <Button size="sm" onClick={speichereHomepage} disabled={savingHomepage || homepageDraft.trim() === homepageUrl.trim()}>
                {savingHomepage ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Speichern'}
              </Button>
            </div>
          ) : homepageUrl ? (
            <a href={homepageUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline break-all">🌐 Website öffnen</a>
          ) : (
            <span className="text-muted-foreground">keine Homepage hinterlegt</span>
          )}
        </div>

        {canEdit && (
          <p className="text-xs text-muted-foreground">
            Diese Angaben erscheinen öffentlich in der Vereins-Übersicht. Tipp für Maps: in Google Maps „Teilen → Link kopieren".
          </p>
        )}
      </CardContent>
    </Card>
  );
}
