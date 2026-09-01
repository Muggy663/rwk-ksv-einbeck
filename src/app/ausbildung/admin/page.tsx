"use client";

// Admin-Seite für Kursverwaltung – nur für admin@rwk-einbeck.de
// Erreichbar unter: /ausbildung/admin

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  GraduationCap, Plus, Pencil, Trash2, Users, ChevronDown,
  ChevronUp, CheckCircle2, AlertCircle, Download
} from 'lucide-react';
import {
  getKurse, getAnmeldungenFuerKurs, updateAnmeldungStatus, deleteKurs,
  createKurs, updateKurs,
  type Kurs, type Anmeldung, type KursKategorie, type KursStatus
} from '@/lib/services/ausbildung-service';

// ─── Kurs-Formular ────────────────────────────────────────────────────────────

const LEER_KURS: Omit<Kurs, 'id'> = {
  kursNummer: '',
  titel: '',
  beschreibung: '',
  inhalte: [],
  datum: '',
  datumBis: '',
  startzeit: '09:00',
  endzeit: '17:00',
  ort: 'Schützenhaus Einbeck',
  adresse: 'Schützenstraße 1, 37574 Einbeck',
  maxTeilnehmer: 20,
  preis: 0,
  anmeldeschluss: '',
  referenten: ['Marcel Bünger'],
  zielgruppe: '',
  voraussetzungen: '',
  umfangLE: 8,
  kategorie: 'grundlagen',
  status: 'entwurf',
};

function KursFormular({ initial, onSave, onCancel }: {
  initial: Omit<Kurs, 'id'>;
  onSave: (data: Omit<Kurs, 'id'>) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState(initial);
  const [inhalteText, setInhalteText] = useState(initial.inhalte.join('\n'));
  const [saving, setSaving] = useState(false);

  const set = (field: string, value: any) => setForm(p => ({ ...p, [field]: value }));

  const handleSave = async () => {
    setSaving(true);
    await onSave({ ...form, inhalte: inhalteText.split('\n').map(s => s.trim()).filter(Boolean) });
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Kursnummer</Label>
          <Input value={form.kursNummer} onChange={e => set('kursNummer', e.target.value)} placeholder="KSV-2026-01" />
        </div>
        <div>
          <Label>Kategorie</Label>
          <select className="w-full border rounded px-3 py-2 text-sm bg-background" value={form.kategorie} onChange={e => set('kategorie', e.target.value as KursKategorie)}>
            <option value="jubali">JuBaLi</option>
            <option value="luftgewehr">Luftgewehr</option>
            <option value="luftpistole">Luftpistole</option>
            <option value="grundlagen">Grundlagen</option>
            <option value="sonstiges">Sonstiges</option>
          </select>
        </div>
      </div>
      <div>
        <Label>Titel *</Label>
        <Input value={form.titel} onChange={e => set('titel', e.target.value)} placeholder="z.B. Jugendbasislizenz 2026" />
      </div>
      <div>
        <Label>Beschreibung</Label>
        <textarea className="w-full border rounded px-3 py-2 text-sm bg-background min-h-[80px]" value={form.beschreibung} onChange={e => set('beschreibung', e.target.value)} />
      </div>
      <div>
        <Label>Kursinhalte (eine Zeile pro Inhalt)</Label>
        <textarea className="w-full border rounded px-3 py-2 text-sm bg-background min-h-[100px] font-mono" value={inhalteText} onChange={e => setInhalteText(e.target.value)} placeholder="Rechtliche Grundlagen&#10;Sicherheitsvorschriften&#10;..." />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Datum (von) *</Label>
          <Input type="date" value={form.datum} onChange={e => set('datum', e.target.value)} />
        </div>
        <div>
          <Label>Datum (bis, optional)</Label>
          <Input type="date" value={form.datumBis || ''} onChange={e => set('datumBis', e.target.value)} />
        </div>
        <div>
          <Label>Startzeit</Label>
          <Input type="time" value={form.startzeit} onChange={e => set('startzeit', e.target.value)} />
        </div>
        <div>
          <Label>Endzeit</Label>
          <Input type="time" value={form.endzeit} onChange={e => set('endzeit', e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Ort</Label>
          <Input value={form.ort} onChange={e => set('ort', e.target.value)} />
        </div>
        <div>
          <Label>Adresse</Label>
          <Input value={form.adresse} onChange={e => set('adresse', e.target.value)} />
        </div>
        <div>
          <Label>Max. Teilnehmer</Label>
          <Input type="number" value={form.maxTeilnehmer} onChange={e => set('maxTeilnehmer', parseInt(e.target.value))} min={1} max={50} />
        </div>
        <div>
          <Label>Preis (€, 0 = kostenlos)</Label>
          <Input type="number" value={form.preis} onChange={e => set('preis', parseInt(e.target.value))} min={0} />
        </div>
        <div>
          <Label>Anmeldeschluss *</Label>
          <Input type="date" value={form.anmeldeschluss} onChange={e => set('anmeldeschluss', e.target.value)} />
        </div>
        <div>
          <Label>Lerneinheiten (LE)</Label>
          <Input type="number" value={form.umfangLE} onChange={e => set('umfangLE', parseInt(e.target.value))} min={1} />
        </div>
      </div>
      <div>
        <Label>Zielgruppe</Label>
        <Input value={form.zielgruppe} onChange={e => set('zielgruppe', e.target.value)} />
      </div>
      <div>
        <Label>Voraussetzungen</Label>
        <Input value={form.voraussetzungen || ''} onChange={e => set('voraussetzungen', e.target.value)} />
      </div>
      <div>
        <Label>Status</Label>
        <select className="w-full border rounded px-3 py-2 text-sm bg-background" value={form.status} onChange={e => set('status', e.target.value as KursStatus)}>
          <option value="entwurf">Entwurf (nicht sichtbar)</option>
          <option value="offen">Offen</option>
          <option value="ausgebucht">Ausgebucht</option>
          <option value="abgeschlossen">Abgeschlossen</option>
        </select>
      </div>
      <div className="flex gap-2 pt-2">
        <Button variant="outline" className="flex-1" onClick={onCancel} disabled={saving}>Abbrechen</Button>
        <Button className="flex-1" onClick={handleSave} disabled={saving || !form.titel || !form.datum}>
          {saving ? 'Speichern...' : 'Kurs speichern'}
        </Button>
      </div>
    </div>
  );
}

// ─── Anmeldungsliste ─────────────────────────────────────────────────────────

function AnmeldungsListe({ kursId, kursTitel }: { kursId: string; kursTitel: string }) {
  const [anmeldungen, setAnmeldungen] = useState<Anmeldung[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAnmeldungenFuerKurs(kursId).then(data => {
      setAnmeldungen(data);
      setLoading(false);
    });
  }, [kursId]);

  const statusAendern = async (id: string, status: Anmeldung['status']) => {
    await updateAnmeldungStatus(id, status);
    setAnmeldungen(prev => prev.map(a => a.id === id ? { ...a, status } : a));
  };

  const exportCSV = () => {
    const aktive = anmeldungen.filter(a => a.status !== 'storniert');
    const header = 'Vorname;Nachname;E-Mail;Telefon;Verein;Mitgliedsnummer;Status;Angemeldet am';
    const rows = aktive.map(a =>
      `${a.vorname};${a.nachname};${a.email};${a.telefon || ''};${a.verein};${a.mitgliedsnummer || ''};${a.status};${a.angemeldetAm?.toDate?.()?.toLocaleDateString('de-DE') || ''}`
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Anmeldungen_${kursTitel.replace(/\s+/g, '_')}.csv`;
    a.click();
  };

  if (loading) return <p className="text-sm text-muted-foreground py-4">Lade Anmeldungen...</p>;

  const aktive = anmeldungen.filter(a => ['angemeldet', 'anwesend'].includes(a.status));
  const warteliste = anmeldungen.filter(a => a.status === 'warteliste');
  const storniert = anmeldungen.filter(a => a.status === 'storniert');

  return (
    <div className="mt-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-3 text-sm">
          <span className="text-green-600 font-medium">✅ {aktive.length} angemeldet</span>
          {warteliste.length > 0 && <span className="text-orange-600 font-medium">⏳ {warteliste.length} Warteliste</span>}
          {storniert.length > 0 && <span className="text-muted-foreground">❌ {storniert.length} storniert</span>}
        </div>
        {anmeldungen.length > 0 && (
          <Button size="sm" variant="outline" onClick={exportCSV} className="gap-1">
            <Download className="h-3.5 w-3.5" /> CSV Export
          </Button>
        )}
      </div>

      {anmeldungen.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">Noch keine Anmeldungen.</p>
      ) : (
        <div className="space-y-2">
          {anmeldungen.map(a => (
            <div key={a.id} className={`flex items-center gap-3 p-3 rounded-lg border text-sm ${
              a.status === 'storniert' ? 'opacity-50 bg-muted' :
              a.status === 'warteliste' ? 'bg-orange-50 dark:bg-orange-950/20 border-orange-200' :
              a.status === 'anwesend' ? 'bg-green-50 dark:bg-green-950/20 border-green-200' :
              'bg-background'
            }`}>
              <div className="flex-1 min-w-0">
                <div className="font-medium">{a.vorname} {a.nachname}</div>
                <div className="text-muted-foreground text-xs truncate">{a.verein} · {a.email}</div>
                {a.anmerkung && <div className="text-xs text-blue-600 mt-0.5">💬 {a.anmerkung}</div>}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {a.status === 'angemeldet' && (
                  <Button size="sm" variant="outline" className="h-7 text-xs gap-1 text-green-600 border-green-300"
                    onClick={() => statusAendern(a.id!, 'anwesend')}>
                    <CheckCircle2 className="h-3 w-3" /> Anwesend
                  </Button>
                )}
                {a.status === 'warteliste' && (
                  <Button size="sm" variant="outline" className="h-7 text-xs gap-1"
                    onClick={() => statusAendern(a.id!, 'angemeldet')}>
                    Nachrücken
                  </Button>
                )}
                {a.status !== 'storniert' && a.status !== 'abgeschlossen' && (
                  <Button size="sm" variant="ghost" className="h-7 text-xs text-red-500"
                    onClick={() => statusAendern(a.id!, 'storniert')}>
                    ✕
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Hauptseite ───────────────────────────────────────────────────────────────

export default function AusbildungAdminPage() {
  const { user } = useAuth();
  const [kurse, setKurse] = useState<Kurs[]>([]);
  const [loading, setLoading] = useState(true);
  const [neuerKurs, setNeuerKurs] = useState(false);
  const [editKurs, setEditKurs] = useState<Kurs | null>(null);
  const [offeneAnmeldungen, setOffeneAnmeldungen] = useState<string | null>(null);

  const isAdmin = user?.email === 'admin@rwk-einbeck.de';

  useEffect(() => {
    if (isAdmin) {
      getKurse().then(data => { setKurse(data); setLoading(false); });
    } else {
      setLoading(false);
    }
  }, [isAdmin]);

  if (!user || !isAdmin) {
    return (
      <div className="container py-16 max-w-md mx-auto text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Zugriff verweigert</h1>
        <p className="text-muted-foreground">Diese Seite ist nur für Administratoren zugänglich.</p>
      </div>
    );
  }

  const handleCreate = async (data: Omit<Kurs, 'id'>) => {
    await createKurs(data);
    const updated = await getKurse();
    setKurse(updated);
    setNeuerKurs(false);
  };

  const handleUpdate = async (data: Omit<Kurs, 'id'>) => {
    if (!editKurs?.id) return;
    await updateKurs(editKurs.id, data);
    const updated = await getKurse();
    setKurse(updated);
    setEditKurs(null);
  };

  const handleDelete = async (id: string, titel: string) => {
    if (!confirm(`Kurs "${titel}" wirklich löschen? Alle Anmeldungen bleiben erhalten.`)) return;
    await deleteKurs(id);
    setKurse(prev => prev.filter(k => k.id !== id));
  };

  return (
    <div className="container py-8 max-w-4xl mx-auto px-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <GraduationCap className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Ausbildung – Admin</h1>
            <p className="text-sm text-muted-foreground">Kursverwaltung & Anmeldungen</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <a href="/ausbildung" target="_blank">Vorschau ↗</a>
          </Button>
          <Button size="sm" onClick={() => setNeuerKurs(true)} className="gap-1">
            <Plus className="h-4 w-4" /> Neuer Kurs
          </Button>
        </div>
      </div>

      {/* Neuer Kurs */}
      {neuerKurs && (
        <Card className="mb-6 border-primary/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Neuen Kurs anlegen</CardTitle>
          </CardHeader>
          <CardContent>
            <KursFormular initial={LEER_KURS} onSave={handleCreate} onCancel={() => setNeuerKurs(false)} />
          </CardContent>
        </Card>
      )}

      {/* Kursliste */}
      {loading ? (
        <p className="text-muted-foreground">Lade Kurse...</p>
      ) : kurse.length === 0 ? (
        <Card className="text-center py-12">
          <GraduationCap className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-muted-foreground">Noch keine Kurse angelegt.</p>
          <Button className="mt-4" onClick={() => setNeuerKurs(true)}>Ersten Kurs anlegen</Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {kurse.map(kurs => (
            <Card key={kurs.id} className={kurs.status === 'entwurf' ? 'opacity-70 border-dashed' : ''}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-xs text-muted-foreground">{kurs.kursNummer}</span>
                      <Badge variant={kurs.status === 'offen' ? 'default' : kurs.status === 'entwurf' ? 'outline' : 'secondary'}>
                        {kurs.status}
                      </Badge>
                    </div>
                    <CardTitle className="text-base">{kurs.titel}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(kurs.datum).toLocaleDateString('de-DE')}
                      {kurs.datumBis ? ` – ${new Date(kurs.datumBis).toLocaleDateString('de-DE')}` : ''}
                      {' · '}{kurs.ort} · {kurs.preis === 0 ? 'Kostenlos' : `${kurs.preis} €`}
                    </p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0"
                      onClick={() => setEditKurs(editKurs?.id === kurs.id ? null : kurs)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-500"
                      onClick={() => handleDelete(kurs.id!, kurs.titel)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8 px-2 gap-1 text-xs"
                      onClick={() => setOffeneAnmeldungen(offeneAnmeldungen === kurs.id ? null : kurs.id!)}>
                      <Users className="h-3.5 w-3.5" />
                      {offeneAnmeldungen === kurs.id ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {/* Kurs bearbeiten */}
              {editKurs?.id === kurs.id && (
                <CardContent className="border-t pt-4">
                  <KursFormular
                    initial={{ ...kurs }}
                    onSave={handleUpdate}
                    onCancel={() => setEditKurs(null)}
                  />
                </CardContent>
              )}

              {/* Anmeldungen */}
              {offeneAnmeldungen === kurs.id && (
                <CardContent className="border-t pt-0">
                  <AnmeldungsListe kursId={kurs.id!} kursTitel={kurs.titel} />
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
