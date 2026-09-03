'use client';

// src/components/members/MemberList.tsx
// Zentrale Mitgliederliste für RWK + KM.
// Datenquelle ausschließlich die abgesicherte API /api/members.
// Props steuern Modus (Spaltensatz) und übergeben die (Client-)Rechte für die UI.

import type React from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  PlusCircle,
  Edit,
  Trash2,
  Search,
  Loader2,
} from 'lucide-react';
import { calculateAgeClass } from '@/types/rwk';
import type { MemberPermissions } from '@/lib/permissions/memberPermissions';

interface MemberListProps {
  permissions: MemberPermissions;
  /** Wenn gesetzt: nur Mitglieder dieses Vereins laden/anzeigen (Vereinsfilter). */
  activeClubId?: string | null;
  /** Vorbelegter Verein im Anlegen-Dialog. */
  defaultClubId?: string;
}

interface Member {
  id: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  gender?: 'male' | 'female' | 'unknown';
  birthYear?: number;
  clubId?: string;
  mitgliedsnummer?: string;
  email?: string;
  telefon?: string;
  mobil?: string;
  strasse?: string;
  plz?: string;
  ort?: string;
  isActive?: boolean;
  [key: string]: any;
}

interface ClubOption {
  id: string;
  name?: string;
}

const EMPTY_FORM = {
  firstName: '',
  lastName: '',
  gender: 'male' as 'male' | 'female' | 'unknown',
  birthYear: '',
  clubId: '',
  mitgliedsnummer: '',
  email: '',
  telefon: '',
  mobil: '',
  strasse: '',
  plz: '',
  ort: '',
};

type FormState = typeof EMPTY_FORM;

// Schlanker Select-Wrapper mit einheitlichem Styling (dynamische Optionen als children).
function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  const { className, ...rest } = props;
  return (
    <select
      className={cn(
        'w-full h-10 px-3 py-2 text-sm border border-input bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>option]:bg-background [&>option]:text-foreground',
        className
      )}
      {...rest}
    />
  );
}

// Sportjahr: ab 1. Juli gilt das Folgejahr.
function currentSportjahr(): number {
  const now = new Date();
  return now.getMonth() >= 6 ? now.getFullYear() + 1 : now.getFullYear();
}

async function getToken(): Promise<string | null> {
  const { auth } = await import('@/lib/firebase/config');
  const user = auth.currentUser;
  if (!user) return null;
  return user.getIdToken();
}

export function MemberList({ permissions, activeClubId, defaultClubId }: MemberListProps) {
  const { toast } = useToast();
  const sportjahr = currentSportjahr();

  const [members, setMembers] = useState<Member[]>([]);
  const [clubs, setClubs] = useState<ClubOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<string>('lastName');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Formular-Dialog
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'new' | 'edit'>('new');
  const [form, setForm] = useState<FormState>({ ...EMPTY_FORM });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Löschen-Dialog
  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const clubName = useCallback(
    (clubId?: string) => clubs.find((c) => c.id === clubId)?.name || '—',
    [clubs]
  );

  const loadMembers = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getToken();
      if (!token) {
        toast({ title: 'Nicht angemeldet', description: 'Bitte neu einloggen.', variant: 'destructive' });
        setMembers([]);
        return;
      }

      // Bei gesetztem Vereinsfilter nur diesen Verein laden (kein gemischtes Ergebnis).
      const membersUrl = activeClubId
        ? `/api/members?clubId=${encodeURIComponent(activeClubId)}`
        : '/api/members';

      // Vereine (für Namen/Dropdown) parallel laden – Lesezugriff clientseitig unkritisch.
      const [membersRes, clubsSnap] = await Promise.all([
        fetch(membersUrl, { headers: { Authorization: `Bearer ${token}` } }),
        getDocs(collection(db, 'clubs')),
      ]);

      const clubList = clubsSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as ClubOption[];
      setClubs(clubList);

      const json = await membersRes.json();
      if (!membersRes.ok || !json.success) {
        throw new Error(json.error || 'Laden fehlgeschlagen');
      }
      setMembers(json.data as Member[]);
    } catch (error: any) {
      toast({
        title: 'Fehler',
        description: error?.message || 'Mitglieder konnten nicht geladen werden',
        variant: 'destructive',
      });
      setMembers([]);
    } finally {
      setLoading(false);
    }
  }, [toast, activeClubId]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  // Vereins-Optionen fürs Formular je nach Rechten.
  const clubOptions = useMemo(() => {
    if (permissions.canViewAllClubs) return clubs;
    return clubs.filter((c) => permissions.allowedClubIds.includes(c.id));
  }, [clubs, permissions]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortIcon = (field: string) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4" />;
    return sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
  };

  const filteredSorted = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const filtered = members.filter((m) => {
      if (!term) return true;
      const hay = `${m.name || ''} ${m.firstName || ''} ${m.lastName || ''} ${m.mitgliedsnummer || ''}`.toLowerCase();
      return hay.includes(term);
    });

    const sorted = [...filtered].sort((a, b) => {
      let aVal: any = a[sortField] ?? '';
      let bVal: any = b[sortField] ?? '';
      if (sortField === 'clubName') {
        aVal = clubName(a.clubId);
        bVal = clubName(b.clubId);
      }
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }
      const cmp = String(aVal).localeCompare(String(bVal), 'de');
      return sortDirection === 'asc' ? cmp : -cmp;
    });
    return sorted;
  }, [members, searchTerm, sortField, sortDirection, clubName]);

  const ageClasses = useCallback(
    (m: Member) => {
      if (!m.birthYear || !m.gender || m.gender === 'unknown') return { auflage: '—', freihand: '—' };
      const g = m.gender as 'male' | 'female';
      return {
        auflage: calculateAgeClass(m.birthYear, g, sportjahr, 'auflage'),
        freihand: calculateAgeClass(m.birthYear, g, sportjahr, 'freihand'),
      };
    },
    [sportjahr]
  );

  // ---- Formular öffnen ----
  const openNew = () => {
    setFormMode('new');
    setEditingId(null);
    setForm({
      ...EMPTY_FORM,
      clubId: defaultClubId || (clubOptions.length === 1 ? clubOptions[0].id : ''),
    });
    setIsFormOpen(true);
  };

  const openEdit = (m: Member) => {
    setFormMode('edit');
    setEditingId(m.id);
    setForm({
      firstName: m.firstName || '',
      lastName: m.lastName || '',
      gender: (m.gender as any) || 'male',
      birthYear: m.birthYear ? String(m.birthYear) : '',
      clubId: m.clubId || '',
      mitgliedsnummer: m.mitgliedsnummer || '',
      email: m.email || '',
      telefon: m.telefon || m.phone || '',
      mobil: m.mobil || '',
      strasse: m.strasse || '',
      plz: m.plz || '',
      ort: m.ort || '',
    });
    setIsFormOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.firstName.trim() || !form.lastName.trim()) {
      toast({ title: 'Pflichtfeld', description: 'Vor- und Nachname sind erforderlich.', variant: 'destructive' });
      return;
    }
    if (!form.clubId) {
      toast({ title: 'Pflichtfeld', description: 'Bitte einen Verein auswählen.', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);
    try {
      const token = await getToken();
      if (!token) throw new Error('Nicht angemeldet');

      const payload: Record<string, any> = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        gender: form.gender,
        birthYear: form.birthYear === '' ? null : Number(form.birthYear),
        clubId: form.clubId,
        mitgliedsnummer: form.mitgliedsnummer.trim(),
        email: form.email.trim(),
        telefon: form.telefon.trim(),
        mobil: form.mobil.trim(),
        strasse: form.strasse.trim(),
        plz: form.plz.trim(),
        ort: form.ort.trim(),
      };

      const url = formMode === 'new' ? '/api/members' : `/api/members/${editingId}`;
      const method = formMode === 'new' ? 'POST' : 'PATCH';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Speichern fehlgeschlagen');

      toast({
        title: formMode === 'new' ? 'Mitglied angelegt' : 'Mitglied aktualisiert',
        description: `${payload.firstName} ${payload.lastName}`,
      });
      setIsFormOpen(false);
      await loadMembers();
    } catch (error: any) {
      toast({ title: 'Fehler', description: error?.message || 'Speichern fehlgeschlagen', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!memberToDelete) return;
    setIsDeleting(true);
    try {
      const token = await getToken();
      if (!token) throw new Error('Nicht angemeldet');
      const res = await fetch(`/api/members/${memberToDelete.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Löschen fehlgeschlagen');
      toast({ title: 'Mitglied entfernt', description: memberToDelete.name || 'Mitglied wurde deaktiviert.' });
      setMemberToDelete(null);
      await loadMembers();
    } catch (error: any) {
      toast({ title: 'Fehler', description: error?.message || 'Löschen fehlgeschlagen', variant: 'destructive' });
    } finally {
      setIsDeleting(false);
    }
  };

  const canEdit = permissions.canEdit;
  // Einheitliche Liste: Mitgliedsnummer und Altersklassen immer anzeigen.
  const showMitgliedsnummer = true;

  return (
    <div className="space-y-4">
      {/* Anzahl-Anzeige oben */}
      {!loading && (
        <div className="flex items-center gap-2 text-sm">
          <span className="inline-flex items-center rounded-full bg-primary px-3 py-1 font-semibold text-primary-foreground">
            {filteredSorted.length}
          </span>
          <span className="text-muted-foreground">
            {filteredSorted.length === 1 ? 'Mitglied' : 'Mitglieder'}
            {searchTerm && members.length !== filteredSorted.length ? ` (von ${members.length})` : ''}
          </span>
        </div>
      )}

      {/* Kopfzeile: Suche + Anlegen */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Name oder Mitgliedsnummer…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        {canEdit && (
          <Button onClick={openNew} className="w-full sm:w-auto">
            <PlusCircle className="mr-2 h-4 w-4" /> Mitglied anlegen
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Lade Mitglieder…
        </div>
      ) : filteredSorted.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {searchTerm ? 'Keine Treffer für die Suche.' : 'Noch keine Mitglieder vorhanden.'}
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Desktop: Tabelle */}
          <div className="hidden overflow-x-auto rounded-md border md:block">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="cursor-pointer px-3 py-2 text-left" onClick={() => handleSort('lastName')}>
                    <span className="inline-flex items-center gap-1">Name {sortIcon('lastName')}</span>
                  </th>
                  {showMitgliedsnummer && (
                    <th className="cursor-pointer px-3 py-2 text-left" onClick={() => handleSort('mitgliedsnummer')}>
                      <span className="inline-flex items-center gap-1">Mitgl.-Nr. {sortIcon('mitgliedsnummer')}</span>
                    </th>
                  )}
                  <th className="cursor-pointer px-3 py-2 text-left" onClick={() => handleSort('birthYear')}>
                    <span className="inline-flex items-center gap-1">Jg. {sortIcon('birthYear')}</span>
                  </th>
                  <th className="px-3 py-2 text-left">Geschl.</th>
                  <th className="cursor-pointer px-3 py-2 text-left" onClick={() => handleSort('clubName')}>
                    <span className="inline-flex items-center gap-1">Verein {sortIcon('clubName')}</span>
                  </th>
                  <th className="px-3 py-2 text-left">AK Auflage</th>
                  <th className="px-3 py-2 text-left">AK Freihand</th>
                  <th className="px-3 py-2 text-left">E-Mail</th>
                  <th className="px-3 py-2 text-left">Telefon</th>
                  <th className="px-3 py-2 text-left">Ort</th>
                  {canEdit && <th className="px-3 py-2 text-right">Aktionen</th>}
                </tr>
              </thead>
              <tbody>
                {filteredSorted.map((m) => {
                  const ak = ageClasses(m);
                  return (
                    <tr key={m.id} className="border-t hover:bg-muted/30">
                      <td className="px-3 py-2 font-medium">{m.name || `${m.firstName || ''} ${m.lastName || ''}`.trim()}</td>
                      {showMitgliedsnummer && <td className="px-3 py-2">{m.mitgliedsnummer || '—'}</td>}
                      <td className="px-3 py-2">{m.birthYear || '—'}</td>
                      <td className="px-3 py-2">{m.gender === 'male' ? 'm' : m.gender === 'female' ? 'w' : '—'}</td>
                      <td className="px-3 py-2">{clubName(m.clubId)}</td>
                      <td className="px-3 py-2">{ak.auflage}</td>
                      <td className="px-3 py-2">{ak.freihand}</td>
                      <td className="px-3 py-2">{m.email || '—'}</td>
                      <td className="px-3 py-2">{m.telefon || m.mobil || m.phone || '—'}</td>
                      <td className="px-3 py-2">{m.ort ? `${m.plz || ''} ${m.ort}`.trim() : '—'}</td>
                      {canEdit && (
                        <td className="px-3 py-2 text-right">
                          <div className="inline-flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => openEdit(m)} aria-label="Bearbeiten">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setMemberToDelete(m)}
                              aria-label="Löschen"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobil: Karten */}
          <div className="space-y-3 md:hidden">
            {filteredSorted.map((m) => {
              const ak = ageClasses(m);
              return (
                <Card key={m.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-semibold">
                          {m.name || `${m.firstName || ''} ${m.lastName || ''}`.trim()}
                        </div>
                        <div className="text-sm text-muted-foreground">{clubName(m.clubId)}</div>
                      </div>
                      {canEdit && (
                        <div className="flex shrink-0 gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(m)} aria-label="Bearbeiten">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setMemberToDelete(m)} aria-label="Löschen">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      )}
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                      <div>
                        <span className="text-muted-foreground">Jahrgang: </span>
                        {m.birthYear || '—'}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Geschl.: </span>
                        {m.gender === 'male' ? 'm' : m.gender === 'female' ? 'w' : '—'}
                      </div>
                      {showMitgliedsnummer && (
                        <div className="col-span-2">
                          <span className="text-muted-foreground">Mitgl.-Nr.: </span>
                          {m.mitgliedsnummer || '—'}
                        </div>
                      )}
                      <div>
                        <span className="text-muted-foreground">AK Auflage: </span>
                        {ak.auflage}
                      </div>
                      <div>
                        <span className="text-muted-foreground">AK Freihand: </span>
                        {ak.freihand}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <p className="text-xs text-muted-foreground">
            {filteredSorted.length} {filteredSorted.length === 1 ? 'Mitglied' : 'Mitglieder'}
            {` · Altersklassen für Sportjahr ${sportjahr}`}
          </p>
        </>
      )}

      {/* Anlegen/Bearbeiten-Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{formMode === 'new' ? 'Mitglied anlegen' : 'Mitglied bearbeiten'}</DialogTitle>
            <DialogDescription>
              Die Änderung gilt zentral für RWK und Kreismeisterschaft.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="firstName">Vorname *</Label>
                <Input
                  id="firstName"
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="lastName">Nachname *</Label>
                <Input
                  id="lastName"
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="gender">Geschlecht *</Label>
                <Select
                  id="gender"
                  value={form.gender}
                  onChange={(e) => setForm({ ...form, gender: e.target.value as any })}
                >
                  <option value="male">männlich</option>
                  <option value="female">weiblich</option>
                  <option value="unknown">unbekannt</option>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="birthYear">Geburtsjahr</Label>
                <Input
                  id="birthYear"
                  type="number"
                  inputMode="numeric"
                  value={form.birthYear}
                  onChange={(e) => setForm({ ...form, birthYear: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="clubId">Verein *</Label>
              <Select
                id="clubId"
                value={form.clubId}
                onChange={(e) => setForm({ ...form, clubId: e.target.value })}
              >
                <option value="">— Verein wählen —</option>
                {clubOptions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name || c.id}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="mitgliedsnummer">Mitgliedsnummer</Label>
              <Input
                id="mitgliedsnummer"
                value={form.mitgliedsnummer}
                onChange={(e) => setForm({ ...form, mitgliedsnummer: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="email">E-Mail</Label>
                <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="telefon">Telefon</Label>
                <Input id="telefon" value={form.telefon} onChange={(e) => setForm({ ...form, telefon: e.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="mobil">Mobil</Label>
                <Input id="mobil" value={form.mobil} onChange={(e) => setForm({ ...form, mobil: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="strasse">Straße</Label>
                <Input id="strasse" value={form.strasse} onChange={(e) => setForm({ ...form, strasse: e.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="plz">PLZ</Label>
                <Input id="plz" value={form.plz} onChange={(e) => setForm({ ...form, plz: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="ort">Ort</Label>
                <Input id="ort" value={form.ort} onChange={(e) => setForm({ ...form, ort: e.target.value })} />
              </div>
            </div>

            {formMode === 'new' && (
              <p className="rounded-md bg-muted/50 p-2 text-xs text-muted-foreground">
                Hinweis: Die Zuordnung zu einer RWK-Mannschaft erfolgt über die
                Mannschaftsverwaltung. Hier werden nur die Stammdaten angelegt.
              </p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormOpen(false)} disabled={isSubmitting}>
              Abbrechen
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Löschen-Dialog (Soft-Delete) */}
      <AlertDialog open={!!memberToDelete} onOpenChange={(open) => !open && setMemberToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mitglied entfernen?</AlertDialogTitle>
            <AlertDialogDescription>
              {memberToDelete?.name || 'Dieses Mitglied'} wird deaktiviert und aus allen aktiven
              Mannschaften (RWK und KM) entfernt. Bereits erfasste Ergebnisse und Meldungen bleiben
              erhalten. Der Vorgang wird protokolliert.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Entfernen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default MemberList;
