"use client";

// 🚧 WORK IN PROGRESS – Nicht öffentlich verlinkt
// Erreichbar unter: /ausbildung

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  GraduationCap, Calendar, MapPin, Users, Clock,
  ChevronRight, BookOpen, Award, AlertCircle,
  Target, CheckCircle2, Info, Mail
} from 'lucide-react';

// ─── Typen ───────────────────────────────────────────────────────────────────

type KursKategorie = 'jubali' | 'luftgewehr' | 'luftpistole' | 'grundlagen' | 'sonstiges';

interface Kurs {
  id: string;
  kursNummer: string;
  titel: string;
  beschreibung: string;
  inhalte: string[];
  datum: string;
  datumBis?: string; // für mehrtägige Kurse
  startzeit: string;
  endzeit: string;
  ort: string;
  adresse: string;
  maxTeilnehmer: number;
  aktuelleAnmeldungen: number;
  preis: number;
  anmeldeschluss: string;
  referenten: string[];
  zielgruppe: string;
  voraussetzungen?: string;
  umfangLE: number;
  kategorie: KursKategorie;
  status: 'offen' | 'ausgebucht' | 'warteliste' | 'abgeschlossen' | 'entwurf';
}

// ─── Beispieldaten ───────────────────────────────────────────────────────────

const KURSE: Kurs[] = [
  {
    id: '1',
    kursNummer: 'KSV-2026-JuBaLi',
    titel: 'Jugendbasislizenz (JuBaLi) 2026',
    beschreibung: 'Zweitägige Grundausbildung für Übungsleiter in der Jugendarbeit des Schießsports gemäß DSB/NSSV-Qualifizierungsplan. Nach erfolgreichem Abschluss berechtigt die Lizenz zur Leitung von Jugendgruppen im Schießsport. Ohne Waffensachkundelehrgang gilt die Lizenz nur für Luft- und Federdruckwaffen.',
    inhalte: [
      'Rechtliche Grundlagen & Aufsichtspflicht (gem. DSB/NSSV-Qualifizierungsplan)',
      'Aktuelles Waffenrecht – Zulassungsvoraussetzungen',
      'Sicherheitsvorschriften im Schießsport',
      'Pädagogische Grundlagen für die Jugendarbeit',
      'Praktische Übungsleitung an der Schießanlage',
      'Lizenzvereinbarung (wird beim Lehrgang ausgefüllt)',
      'Prüfung am Lehrgangsort',
    ],
    datum: '2026-11-28',
    datumBis: '2026-11-29',
    startzeit: '09:00',
    endzeit: '17:00',
    ort: 'Schützenhaus Einbeck',
    adresse: 'Schützenstraße 1, 37574 Einbeck',
    maxTeilnehmer: 20,
    aktuelleAnmeldungen: 0,
    preis: 60,
    anmeldeschluss: '2026-11-20',
    referenten: ['Marcel Bünger'],
    zielgruppe: 'Vereinsmitglieder die in der Jugendarbeit tätig sind oder werden möchten',
    voraussetzungen: 'Erweitertes Führungszeugnis (vor Lehrgangsbeginn beantragen) · Erste-Hilfe-Nachweis nicht älter als 2 Jahre · Mindestalter gem. NSSV-Qualifizierungsplan',
    umfangLE: 17,
    kategorie: 'jubali',
    status: 'offen',
  },
  {
    id: '2',
    kursNummer: 'KSV-2026-02',
    titel: 'Luftgewehr Freihand – Grundkurs',
    beschreibung: 'Einführung in die Disziplin Luftgewehr Freihand. Von der richtigen Körperhaltung über Atemtechnik bis zur Schussauslösung – alles was Einsteiger und Fortgeschrittene wissen müssen.',
    inhalte: [
      'Grundhaltung und Standtechnik',
      'Atemtechnik und Entspannung',
      'Zielaufnahme und Kimme-Korn-Ziel',
      'Schussauslösung und Nachhalten',
      'Häufige Fehler und Korrekturen',
      'Trainingsplanung für Einsteiger',
    ],
    datum: '2026-10-04',
    startzeit: '10:00',
    endzeit: '16:00',
    ort: 'Schützenhaus Einbeck',
    adresse: 'Schützenstraße 1, 37574 Einbeck',
    maxTeilnehmer: 12,
    aktuelleAnmeldungen: 4,
    preis: 15,
    anmeldeschluss: '2026-09-27',
    referenten: ['Marcel Bünger'],
    zielgruppe: 'Einsteiger und Schützen bis ca. 2 Jahre Erfahrung',
    voraussetzungen: 'Vereinsmitgliedschaft oder Gastschützen-Status',
    umfangLE: 8,
    kategorie: 'luftgewehr',
    status: 'offen',
  },
  {
    id: '3',
    kursNummer: 'KSV-2026-03',
    titel: 'Luftpistole – Einführung & Technik',
    beschreibung: 'Technikkurs für die Disziplin Luftpistole. Schwerpunkt auf Haltung, Grifftechnik und mentalem Training. Geeignet für Einsteiger und Schützen die ihre Technik verbessern möchten.',
    inhalte: [
      'Grifftechnik und Pistolenführung',
      'Einarmige Haltung und Balance',
      'Zielaufnahme mit offener Visierung',
      'Mentales Training und Konzentration',
      'Analyse häufiger Fehlerbilder',
      'Wettkampfvorbereitung',
    ],
    datum: '2026-11-08',
    startzeit: '10:00',
    endzeit: '16:00',
    ort: 'Schützenhaus Einbeck',
    adresse: 'Schützenstraße 1, 37574 Einbeck',
    maxTeilnehmer: 10,
    aktuelleAnmeldungen: 2,
    preis: 15,
    anmeldeschluss: '2026-11-01',
    referenten: ['Marcel Bünger'],
    zielgruppe: 'Einsteiger und Schützen mit Grundkenntnissen',
    voraussetzungen: 'Vereinsmitgliedschaft oder Gastschützen-Status',
    umfangLE: 8,
    kategorie: 'luftpistole',
    status: 'offen',
  },
  {
    id: '4',
    kursNummer: 'KSV-2026-04',
    titel: 'Schießsport Grundlagen',
    beschreibung: 'Allgemeiner Einführungskurs für alle Disziplinen. Ideal für Neumitglieder und Interessierte die den Schießsport kennenlernen möchten. Theorie und Praxis an verschiedenen Disziplinen.',
    inhalte: [
      'Geschichte und Grundlagen des Schießsports',
      'Sicherheitsregeln und Schießstandordnung',
      'Überblick über alle Disziplinen (LG, LP, KK)',
      'Erste Schüsse unter Aufsicht',
      'Vereinsstruktur und Wettkampfbetrieb',
      'Ausrüstung und Pflege',
    ],
    datum: '2026-08-22',
    startzeit: '09:00',
    endzeit: '15:00',
    ort: 'Schützenhaus Einbeck',
    adresse: 'Schützenstraße 1, 37574 Einbeck',
    maxTeilnehmer: 15,
    aktuelleAnmeldungen: 15,
    preis: 0,
    anmeldeschluss: '2026-08-15',
    referenten: ['Marcel Bünger'],
    zielgruppe: 'Neumitglieder und Interessierte ohne Vorkenntnisse',
    umfangLE: 8,
    kategorie: 'grundlagen',
    status: 'ausgebucht',
  },
];

// ─── Hilfsfunktionen ─────────────────────────────────────────────────────────

const KATEGORIEN: { value: KursKategorie | 'alle'; label: string; icon: string }[] = [
  { value: 'alle',        label: 'Alle Kurse',    icon: '🎯' },
  { value: 'jubali',      label: 'JuBaLi',        icon: '🎓' },
  { value: 'luftgewehr',  label: 'Luftgewehr',    icon: '🔫' },
  { value: 'luftpistole', label: 'Luftpistole',   icon: '🎯' },
  { value: 'grundlagen',  label: 'Grundlagen',    icon: '📚' },
  { value: 'sonstiges',   label: 'Sonstiges',     icon: '➕' },
];

const KATEGORIE_FARBEN: Record<KursKategorie, string> = {
  jubali:      'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  luftgewehr:  'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  luftpistole: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
  grundlagen:  'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
  sonstiges:   'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
};

function formatDatum(d: string) {
  return new Date(d).toLocaleDateString('de-DE', {
    weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

function formatDatumKurz(d: string) {
  return new Date(d).toLocaleDateString('de-DE', {
    weekday: 'short', day: '2-digit', month: '2-digit',
  });
}

function datumAnzeige(kurs: Kurs) {
  if (kurs.datumBis) {
    return `${formatDatumKurz(kurs.datum)} & ${formatDatumKurz(kurs.datumBis)} ${new Date(kurs.datum).getFullYear()}`;
  }
  return formatDatum(kurs.datum);
}

function freie(k: Kurs) { return k.maxTeilnehmer - k.aktuelleAnmeldungen; }

function StatusBadge({ kurs }: { kurs: Kurs }) {
  const f = freie(kurs);
  if (kurs.status === 'abgeschlossen') return <Badge variant="secondary">Abgeschlossen</Badge>;
  if (kurs.status === 'entwurf')       return <Badge variant="outline" className="border-orange-400 text-orange-600">Entwurf</Badge>;
  if (f <= 0)  return <Badge variant="destructive">Ausgebucht</Badge>;
  if (f <= 3)  return <Badge className="bg-orange-500 hover:bg-orange-500 text-white">{f} Platz{f === 1 ? '' : 'e'} frei</Badge>;
  return <Badge className="bg-green-600 hover:bg-green-600 text-white">{f} Plätze frei</Badge>;
}

function KatBadge({ kat }: { kat: KursKategorie }) {
  const label = KATEGORIEN.find(k => k.value === kat)?.label ?? kat;
  return <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${KATEGORIE_FARBEN[kat]}`}>{label}</span>;
}

// ─── Kurs-Karte ───────────────────────────────────────────────────────────────

function KursKarte({ kurs, onDetails }: { kurs: Kurs; onDetails: (k: Kurs) => void }) {
  return (
    <Card
      className="hover:shadow-md transition-shadow cursor-pointer border-l-4"
      style={{ borderLeftColor: kurs.kategorie === 'jubali' ? '#3b82f6' : kurs.kategorie === 'luftgewehr' ? '#22c55e' : kurs.kategorie === 'luftpistole' ? '#a855f7' : kurs.kategorie === 'grundlagen' ? '#f97316' : '#6b7280' }}
      onClick={() => onDetails(kurs)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <KatBadge kat={kurs.kategorie} />
              <span className="text-xs text-muted-foreground">{kurs.kursNummer}</span>
            </div>
            <CardTitle className="text-base leading-tight">{kurs.titel}</CardTitle>
          </div>
          <StatusBadge kurs={kurs} />
        </div>
      </CardHeader>
      <CardContent className="space-y-1.5 pt-0">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-3.5 w-3.5 shrink-0" />
          <span>{datumAnzeige(kurs)}, {kurs.startzeit}–{kurs.endzeit} Uhr</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          <span>{kurs.ort}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="h-3.5 w-3.5 shrink-0" />
          <span>{kurs.aktuelleAnmeldungen} / {kurs.maxTeilnehmer} Teilnehmer</span>
        </div>
        <div className="flex items-center justify-between pt-1 border-t">
          <div className="flex items-center gap-3 text-sm">
            <span className="flex items-center gap-1 text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />{kurs.umfangLE} LE
            </span>
            <span className="font-semibold text-primary">
              {kurs.preis === 0 ? '✓ Kostenlos' : `${kurs.preis} €`}
            </span>
          </div>
          <Button size="sm" variant="ghost" className="gap-1 h-7 text-xs">
            Details <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Anmeldeformular ─────────────────────────────────────────────────────────

function AnmeldeFormular({ kurs, onClose }: { kurs: Kurs; onClose: () => void }) {
  const [form, setForm] = useState({ vorname: '', nachname: '', email: '', telefon: '', verein: '', mitgliedsnummer: '', anmerkung: '' });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [warteliste, setWarteliste] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/ausbildung/anmelden', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kursId: kurs.id, ...form }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Fehler bei der Anmeldung');
      setWarteliste(data.status === 'warteliste');
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="text-center py-8">
        <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold mb-2">
          {warteliste ? 'Auf Warteliste gesetzt!' : 'Anmeldung erfolgreich!'}
        </h3>
        <p className="text-muted-foreground mb-1">
          {warteliste
            ? 'Du bist auf der Warteliste. Wir melden uns wenn ein Platz frei wird.'
            : `Bestätigung wurde an ${form.email} gesendet.`}
        </p>
        <p className="text-sm text-muted-foreground mb-6">Bei Fragen: rwk-leiter-ksve@gmx.de</p>
        <Button onClick={onClose}>Schließen</Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-muted rounded-lg p-3 text-sm">
        <p className="font-medium">{kurs.titel}</p>
        <p className="text-muted-foreground">{datumAnzeige(kurs)} · {kurs.startzeit}–{kurs.endzeit} Uhr</p>
        <p className="text-muted-foreground">{kurs.ort}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="vorname">Vorname *</Label>
          <Input id="vorname" required value={form.vorname} onChange={e => setForm(p => ({...p, vorname: e.target.value}))} />
        </div>
        <div>
          <Label htmlFor="nachname">Nachname *</Label>
          <Input id="nachname" required value={form.nachname} onChange={e => setForm(p => ({...p, nachname: e.target.value}))} />
        </div>
      </div>
      <div>
        <Label htmlFor="email">E-Mail *</Label>
        <Input id="email" type="email" required value={form.email} onChange={e => setForm(p => ({...p, email: e.target.value}))} />
      </div>
      <div>
        <Label htmlFor="telefon">Telefon</Label>
        <Input id="telefon" value={form.telefon} onChange={e => setForm(p => ({...p, telefon: e.target.value}))} />
      </div>
      <div>
        <Label htmlFor="verein">Verein *</Label>
        <Input id="verein" required value={form.verein} onChange={e => setForm(p => ({...p, verein: e.target.value}))} />
      </div>
      <div>
        <Label htmlFor="mitgliedsnummer">Mitgliedsnummer</Label>
        <Input id="mitgliedsnummer" placeholder="optional" value={form.mitgliedsnummer} onChange={e => setForm(p => ({...p, mitgliedsnummer: e.target.value}))} />
      </div>
      <div>
        <Label htmlFor="anmerkung">Anmerkungen / Erfahrungsstand</Label>
        <Input id="anmerkung" placeholder="z.B. Anfänger, Fragen zur Ausrüstung..." value={form.anmerkung} onChange={e => setForm(p => ({...p, anmerkung: e.target.value}))} />
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-950/30 rounded p-3">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}      <div className="bg-blue-50 dark:bg-blue-950/30 rounded p-3 text-xs text-blue-700 dark:text-blue-300 flex gap-2">
        <Info className="h-4 w-4 shrink-0 mt-0.5 text-blue-500" />
        <span>Deine Daten werden nur für die Kursverwaltung verwendet und nicht an Dritte weitergegeben.</span>
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="button" variant="outline" className="flex-1" onClick={onClose} disabled={loading}>Abbrechen</Button>
        <Button type="submit" className="flex-1" disabled={loading}>
          {loading ? 'Wird gesendet...' : 'Verbindlich anmelden'}
        </Button>
      </div>
    </form>
  );
}

// ─── Detail-Modal ─────────────────────────────────────────────────────────────

function KursDetail({ kurs, onClose }: { kurs: Kurs; onClose: () => void }) {
  const [showAnmeldung, setShowAnmeldung] = useState(false);
  const f = freie(kurs);

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-background rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          {showAnmeldung ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">Anmeldung</h2>
                <button onClick={() => setShowAnmeldung(false)} className="text-muted-foreground hover:text-foreground text-2xl leading-none">×</button>
              </div>
              <AnmeldeFormular kurs={kurs} onClose={onClose} />
            </>
          ) : (
            <>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <KatBadge kat={kurs.kategorie} />
                    <span className="text-xs text-muted-foreground">{kurs.kursNummer}</span>
                  </div>
                  <h2 className="text-xl font-bold">{kurs.titel}</h2>
                </div>
                <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-2xl leading-none ml-2">×</button>
              </div>

              <p className="text-sm text-muted-foreground mb-5">{kurs.beschreibung}</p>

              {/* Kursinhalte */}
              <div className="mb-5">
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-2"><BookOpen className="h-4 w-4 text-primary" /> Kursinhalte</h3>
                <ul className="space-y-1">
                  {kurs.inhalte.map((inhalt, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                      <span>{inhalt}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Details */}
              <div className="space-y-2.5 mb-5">
                <div className="flex gap-3">
                  <Calendar className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <div>
                    <div className="text-sm font-medium">{datumAnzeige(kurs)}</div>
                    <div className="text-xs text-muted-foreground">
                      {kurs.datumBis
                        ? `Sa. & So. jeweils ${kurs.startzeit}–${kurs.endzeit} Uhr`
                        : `${kurs.startzeit}–${kurs.endzeit} Uhr`
                      } · {kurs.umfangLE} Lerneinheiten (à 45 Min.)
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <MapPin className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <div>
                    <div className="text-sm font-medium">{kurs.ort}</div>
                    <div className="text-xs text-muted-foreground">{kurs.adresse}</div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Users className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <div>
                    <div className="text-sm font-medium">{kurs.aktuelleAnmeldungen} / {kurs.maxTeilnehmer} Teilnehmer · <StatusBadge kurs={kurs} /></div>
                    <div className="text-xs text-muted-foreground">Anmeldeschluss: {formatDatum(kurs.anmeldeschluss)}</div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Award className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <div>
                    <div className="text-sm font-medium">Referent: {kurs.referenten.join(', ')}</div>
                    <div className="text-xs text-muted-foreground">{kurs.zielgruppe}</div>
                  </div>
                </div>
                {kurs.voraussetzungen && (
                  <div className="flex gap-3">
                    <Info className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <div className="text-sm text-muted-foreground"><span className="font-medium text-foreground">Voraussetzungen: </span>{kurs.voraussetzungen}</div>
                  </div>
                )}
              </div>

              {/* Preis + CTA */}
              <div className="bg-muted rounded-lg p-3 mb-4 flex items-center justify-between">
                <span className="text-sm font-medium">Lehrgangsgebühr:</span>
                <span className="text-lg font-bold text-primary">{kurs.preis === 0 ? 'Kostenlos' : `${kurs.preis} €`}</span>
              </div>

              {f > 0 && kurs.status !== 'abgeschlossen' ? (
                <Button className="w-full" onClick={() => setShowAnmeldung(true)}>
                  Jetzt anmelden →
                </Button>
              ) : kurs.status !== 'abgeschlossen' ? (
                <Button className="w-full" variant="outline" onClick={() => setShowAnmeldung(true)}>
                  Auf Warteliste setzen
                </Button>
              ) : (
                <Button className="w-full" disabled variant="secondary">Kurs abgeschlossen</Button>
              )}

              <p className="text-xs text-center text-muted-foreground mt-2">
                Fragen? <a href="mailto:rwk-leiter-ksve@gmx.de" className="underline">rwk-leiter-ksve@gmx.de</a>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Hauptseite ───────────────────────────────────────────────────────────────

export default function AusbildungPage() {
  const [kurse, setKurse] = useState<Kurs[]>([]);
  const [, setLoadingKurse] = useState(true);
  const [selectedKurs, setSelectedKurs] = useState<Kurs | null>(null);
  const [filter, setFilter] = useState<KursKategorie | 'alle'>('alle');

  // Kurse aus Firestore laden, Fallback auf Beispieldaten
  useEffect(() => {
    import('@/lib/services/ausbildung-service').then(({ getKurse }) => {
      getKurse().then(data => {
        if (data.length > 0) {
          setKurse(data.filter(k => k.status !== 'entwurf') as Kurs[]);
        } else {
          // Fallback: Beispieldaten solange Firestore leer ist
          setKurse(KURSE.filter(k => k.status !== 'entwurf'));
        }
        setLoadingKurse(false);
      }).catch(() => {
        setKurse(KURSE.filter(k => k.status !== 'entwurf'));
        setLoadingKurse(false);
      });
    });
  }, []);

  const gefilterteKurse = filter === 'alle'
    ? kurse
    : kurse.filter(k => k.kategorie === filter);

  const naechsterKurs = kurse
    .filter(k => k.status === 'offen' && new Date(k.datum) >= new Date())
    .sort((a, b) => new Date(a.datum).getTime() - new Date(b.datum).getTime())[0];

  return (
    <div className="container py-8 max-w-4xl mx-auto px-4">

      {/* WIP-Banner */}
      <div className="mb-6 flex items-center gap-3 bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-lg px-4 py-3">
        <AlertCircle className="h-5 w-5 text-orange-500 shrink-0" />
        <div className="text-sm">
          <span className="font-semibold text-orange-700 dark:text-orange-400">Work in Progress</span>
          <span className="text-orange-600 dark:text-orange-300"> – Buchungssystem in Entwicklung. Anmeldungen werden per E-Mail bestätigt.</span>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="p-3 bg-primary/10 rounded-xl">
          <GraduationCap className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-primary">Ausbildung & Kurse</h1>
          <p className="text-muted-foreground">KSV Einbeck – Schießsport-Ausbildung für alle Levels</p>
        </div>
      </div>

      {/* Ausbilder-Info */}
      <Card className="mb-6 bg-primary/5 border-primary/20">
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex-1">
              <p className="font-semibold text-sm">Ihr Ausbilder</p>
              <p className="text-lg font-bold">Marcel Bünger</p>
              <p className="text-sm text-muted-foreground">
                RWK-Leiter KSV Einbeck · Jugendbasislizenz-Ausbilder im NSSV · Trainer C Basis
              </p>
            </div>
            <div className="flex flex-col gap-1 text-sm">
              <a href="mailto:rwk-leiter-ksve@gmx.de" className="flex items-center gap-2 text-primary hover:underline">
                <Mail className="h-4 w-4" /> rwk-leiter-ksve@gmx.de
              </a>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistik-Kacheln */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Kurse 2026', value: kurse.length, icon: BookOpen, color: 'text-blue-600' },
          { label: 'Freie Plätze', value: kurse.reduce((s, k) => s + Math.max(0, freie(k)), 0), icon: Users, color: 'text-green-600' },
          { label: 'Anmeldungen', value: kurse.reduce((s, k) => s + k.aktuelleAnmeldungen, 0), icon: Award, color: 'text-purple-600' },
          { label: 'Nächster Kurs', value: naechsterKurs ? new Date(naechsterKurs.datum).toLocaleDateString('de-DE', { day: '2-digit', month: 'short' }) : '–', icon: Calendar, color: 'text-orange-600' },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="text-center p-4">
            <Icon className={`h-5 w-5 mx-auto mb-1 ${color}`} />
            <div className="text-2xl font-bold">{value}</div>
            <div className="text-xs text-muted-foreground">{label}</div>
          </Card>
        ))}
      </div>

      {/* Wichtige Hinweise JuBaLi */}
      <Card className="mb-6 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2 text-blue-800 dark:text-blue-300">
            <Info className="h-4 w-4" /> Wichtige Hinweise zur Jugendbasislizenz
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-700 dark:text-blue-300 space-y-1 pt-0">
          <p>• <strong className="text-blue-900 dark:text-blue-200">Erweitertes Führungszeugnis</strong> vor Lehrgangsbeginn beantragen und mitbringen</p>
          <p>• <strong className="text-blue-900 dark:text-blue-200">Erste-Hilfe-Nachweis</strong> nicht älter als 2 Jahre ist in Kopie abzugeben</p>
          <p>• <strong className="text-blue-900 dark:text-blue-200">Mindestteilnehmer:</strong> 8 Personen · <strong className="text-blue-900 dark:text-blue-200">Höchstteilnehmer:</strong> 20 Personen</p>
          <p>• Berücksichtigung nach Eingangsdatum der Anmeldungen</p>
          <p>• Teilnahme ohne Waffensachkundelehrgang möglich – Lizenz gilt dann nur für Luft- und Federdruckwaffen</p>
          <p>• NSSV Qualifizierungsplan vor Lehrgangsbeginn lesen (Seiten 41 ff.)</p>
        </CardContent>
      </Card>

      {/* Filter */}
      <div className="flex flex-wrap gap-2 mb-5">
        {KATEGORIEN.map(({ value, label, icon }) => (
          <button
            key={value}
            onClick={() => setFilter(value as KursKategorie | 'alle')}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5 ${
              filter === value
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            <span>{icon}</span> {label}
          </button>
        ))}
      </div>

      {/* Kursliste */}
      {gefilterteKurse.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Target className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Keine Kurse in dieser Kategorie.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {gefilterteKurse.map(kurs => (
            <KursKarte key={kurs.id} kurs={kurs} onDetails={setSelectedKurs} />
          ))}
        </div>
      )}

      {/* Kontakt-Footer */}
      <Card className="mt-8 bg-muted/50">
        <CardContent className="pt-4 pb-4 text-sm text-center text-muted-foreground">
          <p className="font-medium text-foreground mb-1">Fragen zu Kursen oder Anmeldungen?</p>
          <p>Schreib uns: <a href="mailto:rwk-leiter-ksve@gmx.de" className="text-primary underline">rwk-leiter-ksve@gmx.de</a></p>
          <p className="text-xs mt-1">Deine Daten werden nur für die Kursverwaltung verwendet und nicht an Dritte weitergegeben (DSGVO).</p>
        </CardContent>
      </Card>

      {/* Detail-Modal */}
      {selectedKurs && (
        <KursDetail kurs={selectedKurs} onClose={() => setSelectedKurs(null)} />
      )}
    </div>
  );
}
