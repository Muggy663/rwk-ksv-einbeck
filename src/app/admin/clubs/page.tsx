
// src/app/admin/clubs/page.tsx
"use client";
import React, { useState, useEffect, FormEvent } from 'react';
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
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

const CLUBS_COLLECTION = "clubs";

export default function AdminClubsPage() {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentClub, setCurrentClub] = useState<Partial<Club> & { id?: string } | null>(null);
  const [formMode, setFormMode] = useState<'new' | 'edit'>('new');
  
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [clubToDelete, setClubToDelete] = useState<Club | null>(null);

  const { toast } = useToast();

  const fetchClubs = async () => {
    setIsLoading(true);
    try {
      const clubsCollectionRef = collection(db, CLUBS_COLLECTION);
      const q = query(clubsCollectionRef, orderBy("name", "asc"));
      const querySnapshot = await getDocs(q);
      const fetchedClubs: Club[] = [];
      querySnapshot.forEach((doc) => {
        fetchedClubs.push({ id: doc.id, ...doc.data() } as Club);
      });
      setClubs(fetchedClubs);
    } catch (error) {
      console.error("Error fetching clubs: ", error);
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

  const handleAddNew = () => {
    setFormMode('new');
    setCurrentClub({ name: '', shortName: '' });
    setIsFormOpen(true);
  };

  const handleEdit = (club: Club) => {
    setFormMode('edit');
    setCurrentClub(club);
    setIsFormOpen(true);
  };

  const handleDeleteConfirmation = (club: Club) => {
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
    console.log(`--- handleDeleteClub: Attempting to delete club: ${clubName} (ID: ${clubId}) ---`);
    
    setIsLoading(true);
    try {
      console.log(`--- handleDeleteClub: Calling deleteDoc for ${clubId} ---`);
      await deleteDoc(doc(db, CLUBS_COLLECTION, clubId));
      console.log(`--- handleDeleteClub: deleteDoc successful for ${clubId}. ---`);

      console.log(`--- handleDeleteClub: About to call SUCCESS toast for ${clubId}. ---`);
      toast({
        title: "Verein gelöscht",
        description: `"${clubName}" wurde erfolgreich entfernt.`,
      });
      console.log(`--- handleDeleteClub: SUCCESS toast call for ${clubId} has been made. ---`);

      console.log(`--- handleDeleteClub: About to call fetchClubs() for ${clubId}. ---`);
      await fetchClubs(); // Refresh the list
      console.log(`--- handleDeleteClub: fetchClubs() completed for ${clubId}. ---`);
    } catch (error) {
      console.error("--- handleDeleteClub: Error during delete operation: ---", clubId, error);
      toast({
        title: "Fehler beim Löschen",
        description: (error as Error).message || `Der Verein "${clubName}" konnte nicht gelöscht werden.`,
        variant: "destructive",
      });
    } finally {
      console.log(`--- handleDeleteClub: Finally block. Setting isLoading to false for ${clubId}. ---`);
      setIsLoading(false);
      setIsAlertOpen(false);
      setClubToDelete(null);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!currentClub || !currentClub.name) {
      toast({ title: "Ungültige Eingabe", description: "Der Vereinsname darf nicht leer sein.", variant: "destructive" });
      return;
    }

    const clubDataToSave: Omit<Club, 'id'> = {
      name: currentClub.name,
      shortName: currentClub.shortName || '',
    };

    setIsLoading(true);
    try {
      if (formMode === 'new') {
        await addDoc(collection(db, CLUBS_COLLECTION), clubDataToSave);
        toast({ title: "Verein erstellt", description: `${currentClub.name} wurde erfolgreich angelegt.` });
      } else if (formMode === 'edit' && currentClub.id) {
        await updateDoc(doc(db, CLUBS_COLLECTION, currentClub.id), clubDataToSave);
        toast({ title: "Verein aktualisiert", description: `${currentClub.name} wurde erfolgreich aktualisiert.` });
      }
      setIsFormOpen(false);
      setCurrentClub(null);
      await fetchClubs();
    } catch (error) {
      console.error("Error saving club: ", error);
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

  const handleFormInputChange = (field: keyof Pick<Club, 'name' | 'shortName'>, value: string) => {
    setCurrentClub(prev => prev ? ({ ...prev, [field]: value }) : null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-primary">Vereinsverwaltung</h1>
        <Button onClick={handleAddNew} variant="default">
          <PlusCircle className="mr-2 h-5 w-5" /> Neuen Verein anlegen
        </Button>
      </div>
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Kürzel</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clubs.map((club) => (
                  <TableRow key={club.id}>
                    <TableCell>{club.name}</TableCell>
                    <TableCell>{club.shortName || '-'}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(club)} aria-label="Verein bearbeiten">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          console.log(`Löschen-Button geklickt für Verein ID: ${club.id}, Name: ${club.name}`);
                          if (club.id) {
                            handleDeleteConfirmation(club);
                          } else {
                            console.error("FEHLER: club.id ist undefined beim Klick auf Löschen-Button für Club:", club);
                            toast({ title: "Fehler", description: "Vereins-ID nicht gefunden, Löschen nicht möglich.", variant: "destructive"});
                          }
                        }}
                        className="text-destructive hover:text-destructive/80"
                        aria-label="Verein löschen"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
                Möchten Sie den Verein "{clubToDelete.name}" wirklich endgültig löschen? Diese Aktion kann nicht rückgängig gemacht werden.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setClubToDelete(null)}>Abbrechen</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteClub}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Endgültig löschen
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
