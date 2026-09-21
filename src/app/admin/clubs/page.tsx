
// src/app/admin/clubs/page.tsx
"use client";
import { useState, useEffect, FormEvent } from 'react';
import { logError } from '@/lib/utils/secure-logger';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Edit, Trash2, Loader2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Club } from '@/types/rwk';
import { db } from '@/lib/firebase/config';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy, where, documentId } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

const CLUBS_COLLECTION = "clubs";

type ClubWithNumber = Club & { clubNumber?: string };

export default function AdminClubsPage() {
  const [clubs, setClubs] = useState<ClubWithNumber[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentClub, setCurrentClub] = useState<Partial<ClubWithNumber> & { id?: string } | null>(null);
  const [formMode, setFormMode] = useState<'new' | 'edit'>('new');
  
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [clubToDelete, setClubToDelete] = useState<Club | null>(null);

  const { toast } = useToast();

  const fetchClubs = async () => {
    setIsLoading(true);
    try {
      const clubsCollectionRef = collection(db, CLUBS_COLLECTION);
      const q = query(clubsCollectionRef, orderBy("clubNumber", "asc"), orderBy("name", "asc"));
      const querySnapshot = await getDocs(q);
      const fetchedClubs: ClubWithNumber[] = [];
      querySnapshot.forEach((doc) => {
        fetchedClubs.push({ id: doc.id, ...doc.data() } as ClubWithNumber);
      });
      setClubs(fetchedClubs);
    } catch (error) {
      logError("Error fetching clubs: ", error);
      toast({
        title: "Fehler beim Laden der Vereine",
        description: (error as Error).message || "Ein unbekannter Fehler ist aufgetreten.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClubs();
  }, []);

  // Entwurf je Verein für die Anfahrt-Link-Übersicht (clubId -> Eingabewert).
  const [mapsDraft, setMapsDraft] = useState<Record<string, string>>({});
  const [savingMaps, setSavingMaps] = useState<string | null>(null);

  const speichereMapsLink = async (club: ClubWithNumber) => {
    const wert = (mapsDraft[club.id] ?? club.mapsUrl ?? '').trim();
    if (wert && !/^https?:\/\/\S+/i.test(wert)) {
      toast({ title: 'Ungültiger Link', description: 'Bitte einen vollständigen Link eingeben (http:// oder https://).', variant: 'destructive' });
      return;
    }
    setSavingMaps(club.id);
    try {
      await updateDoc(doc(db, CLUBS_COLLECTION, club.id), { mapsUrl: wert });
      setClubs(prev => prev.map(c => c.id === club.id ? { ...c, mapsUrl: wert } : c));
      setMapsDraft(prev => ({ ...prev, [club.id]: wert }));
      toast({ title: 'Gespeichert', description: `Anfahrt-Link für ${club.name} aktualisiert.` });
    } catch (error) {
      logError('Anfahrt-Link speichern fehlgeschlagen:', error);
      toast({ title: 'Fehler', description: 'Konnte nicht gespeichert werden.', variant: 'destructive' });
    } finally {
      setSavingMaps(null);
    }
  };

  const [savingFlag, setSavingFlag] = useState<string | null>(null);

  const toggleKeineEigenenStaende = async (club: ClubWithNumber, checked: boolean) => {
    setSavingFlag(club.id);
    try {
      await updateDoc(doc(db, CLUBS_COLLECTION, club.id), { keineEigenenStaende: checked });
      setClubs(prev => prev.map(c => c.id === club.id ? { ...c, keineEigenenStaende: checked } : c));
      toast({ title: 'Gespeichert', description: checked ? `${club.name}: keine eigenen Stände.` : `${club.name}: hat eigene Stände.` });
    } catch (error) {
      logError('Flag „keine eigenen Stände" speichern fehlgeschlagen:', error);
      toast({ title: 'Fehler', description: 'Konnte nicht gespeichert werden.', variant: 'destructive' });
    } finally {
      setSavingFlag(null);
    }
  };

  const handleAddNew = () => {
    setFormMode('new');
    setCurrentClub({ name: '', shortName: '', clubNumber: '', ausrichterDisziplinen: [] });
    setIsFormOpen(true);
  };

  const handleEdit = (club: Club) => {
    setFormMode('edit');
    setCurrentClub(club);
    setIsFormOpen(true);
  };

  const handleDeleteConfirmation = (club: Club) => {
    if (!club || !club.id) {
      logError("handleDeleteConfirmation: Club oder Club-ID fehlt.", club);
      toast({ title: "Fehler", description: "Vereinsdaten unvollständig, Löschdialog kann nicht geöffnet werden.", variant: "destructive"});
      return;
    }

    setClubToDelete(club);
    setIsAlertOpen(true);
  };

  const handleDeleteClub = async () => {
    if (!clubToDelete || !clubToDelete.id) {
      toast({ title: "Fehler", description: "Kein Verein zum Löschen ausgewählt.", variant: "destructive" });
      setIsAlertOpen(false);
      setClubToDelete(null);
      return;
    }

    const clubId = clubToDelete.id;
    const clubName = clubToDelete.name;

    
    setIsLoading(true); 
    try {

      await deleteDoc(doc(db, CLUBS_COLLECTION, clubId));



      toast({
        title: "Verein gelöscht",
        description: `"${clubName}" wurde erfolgreich entfernt.`,
      });

      
      await fetchClubs(); 
    } catch (error) {
      logError(`--- handleDeleteClub: Error during delete operation for clubId ${clubId}: --- ${error instanceof Error ? error.message : String(error)}`);
      toast({
        title: "Fehler beim Löschen",
        description: (error as Error).message || `Der Verein "${clubName}" konnte nicht gelöscht werden.`,
        variant: "destructive",
      });
    } finally {

      setIsLoading(false);
      setIsAlertOpen(false);
      setClubToDelete(null);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!currentClub || !currentClub.name || currentClub.name.trim() === '') {
      toast({ title: "Ungültige Eingabe", description: "Der Vereinsname darf nicht leer sein.", variant: "destructive" });
      return;
    }

    const clubDataToSave: Omit<ClubWithNumber, 'id'> = {
      name: currentClub.name.trim(),
      shortName: currentClub.shortName?.trim() || '',
      clubNumber: currentClub.clubNumber?.trim() || '',
      ausrichterDisziplinen: currentClub.ausrichterDisziplinen || [],
    };

    setIsLoading(true);
    try {
      const clubsCollectionRef = collection(db, CLUBS_COLLECTION);
      let duplicateQuery;

      if (formMode === 'edit' && currentClub?.id) {
        duplicateQuery = query(
          clubsCollectionRef,
          where("name", "==", clubDataToSave.name),
          where(documentId(), "!=", currentClub.id) 
        );
      } else {
        duplicateQuery = query(
          clubsCollectionRef,
          where("name", "==", clubDataToSave.name)
        );
      }

      const duplicateSnapshot = await getDocs(duplicateQuery);

      if (!duplicateSnapshot.empty) {
        toast({
          title: "Doppelter Vereinsname",
          description: `Ein Verein mit dem Namen &quot;${clubDataToSave.name}&quot; existiert bereits.`,
          variant: "destructive",
        });
        setIsLoading(false);
        return; 
      }

      if (formMode === 'new') {
        await addDoc(collection(db, CLUBS_COLLECTION), clubDataToSave);
        toast({ title: "Verein erstellt", description: `${clubDataToSave.name} wurde erfolgreich angelegt.` });
      } else if (formMode === 'edit' && currentClub.id) {
        await updateDoc(doc(db, CLUBS_COLLECTION, currentClub.id), clubDataToSave);
        toast({ title: "Verein aktualisiert", description: `${clubDataToSave.name} wurde erfolgreich aktualisiert.` });
      }
      setIsFormOpen(false);
      setCurrentClub(null);
      await fetchClubs();
    } catch (error) {
      logError("Error saving club: ", error);
      const action = formMode === 'new' ? 'erstellen' : 'aktualisieren';
      toast({
        title: `Fehler beim ${action}`,
        description: (error as Error).message || `Der Verein konnte nicht ${action} werden.`,
        variant: "destructive",
      });
    } finally {
        setIsLoading(false);
    }
  };

  const handleFormInputChange = (field: keyof Pick<ClubWithNumber, 'name' | 'shortName' | 'clubNumber'>, value: string) => {
    setCurrentClub(prev => prev ? ({ ...prev, [field]: value }) : null);
  };

  return (
    <div className="px-2 md:px-4 space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl md:text-2xl font-semibold text-primary">Vereinsverwaltung</h1>
          <Link href="/admin" className="md:hidden">
            <Button variant="outline" size="sm">
              Zurück
            </Button>
          </Link>
        </div>
        <div className="flex flex-col md:flex-row gap-2">
          <Link href="/admin" className="hidden md:block">
            <Button variant="outline" size="sm">
              Zurück zum Dashboard
            </Button>
          </Link>
          <Button onClick={handleAddNew} variant="default" className="w-full md:w-auto">
            <PlusCircle className="mr-2 h-5 w-5" /> Neuen Verein anlegen
          </Button>
        </div>
      </div>

      {/* Übersicht: Ausrichter-Standkapazität je Verein (LG / KKG / KKP) */}
      {clubs.length > 0 && (
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Ausrichter-Stände (Übersicht)</CardTitle>
            <CardDescription>
              Welche Disziplinen jeder Verein ausrichten kann. Ungepflegte Vereine sind hervorgehoben.
              Vereine ohne eigene Stände (z. B. Schießsportgemeinschaft) können per Kästchen gekennzeichnet werden.
              {(() => {
                const offen = clubs.filter(c => !c.keineEigenenStaende && (!Array.isArray(c.ausrichterDisziplinen) || c.ausrichterDisziplinen.length === 0)).length;
                return offen > 0 ? ` (${offen} noch offen)` : ' (alle gepflegt ✓)';
              })()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b text-left">
                    <th className="py-2 pr-4">Verein</th>
                    <th className="py-2 px-3 text-center">Luftdruck</th>
                    <th className="py-2 px-3 text-center">KK-Gewehr</th>
                    <th className="py-2 px-3 text-center">KK-Pistole</th>
                    <th className="py-2 px-3 text-center whitespace-nowrap">Keine eigenen Stände</th>
                  </tr>
                </thead>
                <tbody>
                  {[...clubs].sort((a, b) => a.name.localeCompare(b.name)).map(club => {
                    const d = Array.isArray(club.ausrichterDisziplinen) ? club.ausrichterDisziplinen : [];
                    const ohneStaende = !!club.keineEigenenStaende;
                    const ungepflegt = !ohneStaende && d.length === 0;
                    const zelle = (key: string) => ohneStaende
                      ? <span className="text-muted-foreground">–</span>
                      : d.includes(key)
                        ? <span className="text-green-600 font-bold">✓</span>
                        : <span className="text-muted-foreground">–</span>;
                    return (
                      <tr key={club.id} className={`border-b ${ungepflegt ? 'bg-amber-50 dark:bg-amber-950/20' : ''}`}>
                        <td className="py-1.5 pr-4">
                          {club.name}
                          {ungepflegt && <span className="ml-2 text-xs text-amber-700 dark:text-amber-300">nicht gepflegt</span>}
                          {ohneStaende && <span className="ml-2 text-xs text-muted-foreground">keine eigenen Stände</span>}
                        </td>
                        <td className="py-1.5 px-3 text-center">{zelle('LG')}</td>
                        <td className="py-1.5 px-3 text-center">{zelle('KKG')}</td>
                        <td className="py-1.5 px-3 text-center">{zelle('KKP')}</td>
                        <td className="py-1.5 px-3 text-center">
                          <input
                            type="checkbox"
                            className="h-4 w-4"
                            checked={ohneStaende}
                            disabled={savingFlag === club.id}
                            onChange={(e) => toggleKeineEigenenStaende(club, e.target.checked)}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Übersicht: Anfahrt (Google-Maps-Link) je Verein */}
      {clubs.length > 0 && (
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Anfahrt (Google-Maps-Links)</CardTitle>
            <CardDescription>
              Link zum Schützenhaus/Stand je Verein. Wird an Terminen als klickbarer Ort angezeigt, damit Gäste den Weg finden. Tipp: In Google Maps „Teilen" → „Link kopieren".
              {(() => {
                const offen = clubs.filter(c => !c.keineEigenenStaende && !c.mapsUrl).length;
                return offen > 0 ? ` (${offen} noch offen)` : ' (alle gepflegt ✓)';
              })()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[...clubs].sort((a, b) => a.name.localeCompare(b.name)).map(club => {
                const wert = mapsDraft[club.id] ?? club.mapsUrl ?? '';
                const geaendert = wert.trim() !== (club.mapsUrl ?? '').trim();
                const ohneStaende = !!club.keineEigenenStaende;
                const ungepflegt = !ohneStaende && !club.mapsUrl;

                // Vereine ohne eigene Stände: kein Eingabefeld, nur "entfällt".
                if (ohneStaende) {
                  return (
                    <div key={club.id} className="flex items-center gap-2 rounded-md border p-2">
                      <div className="md:w-56 shrink-0 font-medium">{club.name}</div>
                      <span className="text-sm text-muted-foreground">entfällt (keine eigenen Stände)</span>
                    </div>
                  );
                }

                return (
                  <div key={club.id} className={`flex flex-col gap-2 rounded-md border p-2 md:flex-row md:items-center ${ungepflegt ? 'border-amber-300 bg-amber-50 dark:bg-amber-950/20' : ''}`}>
                    <div className="md:w-56 shrink-0 font-medium">
                      {club.name}
                      {ungepflegt && <span className="ml-2 text-xs text-amber-700 dark:text-amber-300">offen</span>}
                    </div>
                    <Input
                      type="url"
                      inputMode="url"
                      placeholder="https://maps.app.goo.gl/…"
                      value={wert}
                      onChange={(e) => setMapsDraft(prev => ({ ...prev, [club.id]: e.target.value }))}
                      className="flex-1"
                    />
                    <div className="flex items-center gap-2">
                      {club.mapsUrl && (
                        <a href={club.mapsUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:text-blue-800 underline whitespace-nowrap">
                          Öffnen
                        </a>
                      )}
                      <Button size="sm" variant={geaendert ? 'default' : 'outline'} onClick={() => speichereMapsLink(club)} disabled={savingMaps === club.id || !geaendert}>
                        {savingMaps === club.id ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Speichern'}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Vorhandene Vereine</CardTitle>
          <CardDescription>Übersicht aller angelegten Vereine. Hier können Sie Vereine bearbeiten oder löschen.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && !isFormOpen && !isAlertOpen ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
          ) : clubs.length > 0 ? (
            <>
              {/* Mobile Card Layout */}
              <div className="block md:hidden space-y-4">
                {clubs.map((club) => (
                  <Card key={club.id} className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium">{club.name}</h3>
                        <span className="text-sm text-muted-foreground">{club.clubNumber || 'Keine Nr.'}</span>
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">Kürzel:</span> {club.shortName || '-'}
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(club)} className="flex-1">
                          <Edit className="h-4 w-4 mr-2" /> Bearbeiten
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (club.id) {
                              handleDeleteConfirmation(club);
                            } else {
                              logError("FEHLER: club.id ist undefined beim Klick auf Löschen-Button für Club:", club);
                              toast({ title: "Fehler", description: "Vereins-ID nicht gefunden, Löschen nicht möglich.", variant: "destructive"});
                            }
                          }}
                          className="flex-1 text-destructive hover:text-destructive/80"
                        >
                          <Trash2 className="h-4 w-4 mr-2" /> Löschen
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
              
              {/* Desktop Table Layout */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vereinsnr.</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Kürzel</TableHead>
                      <TableHead className="text-right">Aktionen</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clubs.map((club) => (
                      <TableRow key={club.id}>
                        <TableCell>{club.clubNumber || '-'}</TableCell>
                        <TableCell>{club.name}</TableCell>
                        <TableCell>{club.shortName || '-'}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end">
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(club)} aria-label="Verein bearbeiten">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (club.id) {
                                  handleDeleteConfirmation(club);
                                } else {
                                  logError("FEHLER: club.id ist undefined beim Klick auf Löschen-Button für Club:", club);
                                  toast({ title: "Fehler", description: "Vereins-ID nicht gefunden, Löschen nicht möglich.", variant: "destructive"});
                                }
                              }}
                              className="text-destructive hover:text-destructive/80"
                              aria-label="Verein löschen"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          ) : (
            <div className="p-8 text-center text-muted-foreground bg-secondary/30 rounded-md">
              <p className="text-lg">Noch keine Vereine angelegt.</p>
              <p className="text-sm">Klicken Sie auf "Neuen Verein anlegen", um zu beginnen.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={(open) => { setIsFormOpen(open); if (!open) setCurrentClub(null); }}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{formMode === 'new' ? 'Neuen Verein anlegen' : 'Verein bearbeiten'}</DialogTitle>
              <DialogDescription>
                {formMode === 'new' ? 'Erstellen Sie einen neuen Verein.' : `Bearbeiten Sie die Details für ${currentClub?.name || 'den Verein'}.`}
              </DialogDescription>
            </DialogHeader>
            {currentClub && (
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="clubNumber" className="text-right">Vereinsnr.</Label>
                  <Input
                    id="clubNumber"
                    value={currentClub.clubNumber || ''}
                    onChange={(e) => handleFormInputChange('clubNumber', e.target.value)}
                    className="col-span-3"
                    placeholder="Format: 08-XXX"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">Name</Label>
                  <Input
                    id="name"
                    value={currentClub.name || ''}
                    onChange={(e) => handleFormInputChange('name', e.target.value)}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="shortName" className="text-right">Kürzel</Label>
                  <Input
                    id="shortName"
                    value={currentClub.shortName || ''}
                    onChange={(e) => handleFormInputChange('shortName', e.target.value)}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label className="text-right pt-1">Kann ausrichten</Label>
                  <div className="col-span-3 space-y-2">
                    {([
                      { key: 'LG', label: 'Luftdruck (10m – Gewehr/Pistole)' },
                      { key: 'KKG', label: 'Kleinkaliber Gewehr (50m)' },
                      { key: 'KKP', label: 'Kleinkaliber Pistole (25m)' },
                    ] as const).map(({ key, label }) => {
                      const aktiv = (currentClub?.ausrichterDisziplinen || []).includes(key);
                      return (
                        <label key={key} className="flex items-center gap-2 text-sm cursor-pointer">
                          <input
                            type="checkbox"
                            className="h-4 w-4"
                            checked={aktiv}
                            onChange={(e) => {
                              setCurrentClub(prev => {
                                if (!prev) return prev;
                                const vorhanden = new Set(prev.ausrichterDisziplinen || []);
                                if (e.target.checked) vorhanden.add(key); else vorhanden.delete(key);
                                return { ...prev, ausrichterDisziplinen: Array.from(vorhanden) };
                              });
                            }}
                          />
                          {label}
                        </label>
                      );
                    })}
                    <p className="text-xs text-muted-foreground">
                      Welche Wettkämpfe der Verein an eigenen Ständen ausrichten kann. Wird für den Vorschlag genutzt, wer den 1. Durchgang einlädt.
                    </p>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setIsFormOpen(false); setCurrentClub(null); }}>Abbrechen</Button>
              <Button type="submit" disabled={isLoading && isFormOpen}>
                {(isLoading && isFormOpen) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Speichern
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {clubToDelete && (
        <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Verein löschen bestätigen</AlertDialogTitle>
              <AlertDialogDescription>
                Möchten Sie den Verein &quot;{clubToDelete.name}&quot; wirklich endgültig löschen? Diese Aktion kann nicht rückgängig gemacht werden.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => { setIsAlertOpen(false); setClubToDelete(null); }}>Abbrechen</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteClub}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={isLoading && isAlertOpen} 
              >
                {(isLoading && isAlertOpen) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Endgültig löschen
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}

