// src/app/admin/clubs/page.tsx
"use client";
import React, { useState, useEffect } from 'react';
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Club } from '@/types/rwk';
import { db } from '@/lib/firebase/config';
import { collection, getDocs, addDoc, doc, setDoc, deleteDoc, updateDoc, query, orderBy } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

const CLUBS_COLLECTION = "clubs"; // Name der Firestore Collection für Vereine

export default function AdminClubsPage() {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentClub, setCurrentClub] = useState<Partial<Club> | null>(null);
  const [formMode, setFormMode] = useState<'new' | 'edit'>('new');
  const { toast } = useToast();

  const fetchClubs = async () => {
    setIsLoading(true);
    try {
      const clubsCollectionRef = collection(db, CLUBS_COLLECTION);
      const q = query(clubsCollectionRef, orderBy("name", "asc")); // Sortiere nach Name
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
    setCurrentClub({ name: '', shortName: '', contactName: '', contactEmail: '' });
    setIsFormOpen(true);
  };

  const handleEdit = (club: Club) => {
    setFormMode('edit');
    setCurrentClub(club);
    setIsFormOpen(true);
  };

  const handleDelete = async (clubId: string, clubName?: string) => {
    if (!window.confirm(`Sind Sie sicher, dass Sie den Verein "${clubName || clubId}" unwiderruflich löschen möchten?`)) {
      return;
    }
    try {
      await deleteDoc(doc(db, CLUBS_COLLECTION, clubId));
      toast({
        title: "Verein gelöscht",
        description: `Der Verein "${clubName || clubId}" wurde erfolgreich gelöscht.`,
      });
      fetchClubs(); // Daten neu laden, um die Liste zu aktualisieren
    } catch (error) {
      console.error("Error deleting club: ", error);
      toast({
        title: "Fehler beim Löschen",
        description: (error as Error).message || "Der Verein konnte nicht gelöscht werden.",
        variant: "destructive",
      });
    }
  };
  
  const handleSubmit = async () => {
    if (!currentClub || !currentClub.name) {
      toast({ title: "Fehlende Eingabe", description: "Der Name des Vereins darf nicht leer sein.", variant: "destructive" });
      return;
    }

    // Daten für Firestore vorbereiten (ohne ID bei 'new', wenn Firestore sie generieren soll, oder mit ID bei 'edit')
    const clubDataToSave: Omit<Club, 'id'> = {
        name: currentClub.name,
        shortName: currentClub.shortName || '',
        contactName: currentClub.contactName || '',
        contactEmail: currentClub.contactEmail || '',
    };

    try {
      if (formMode === 'new') {
        // Eigene ID generieren oder Firestore überlassen. Hier eigene ID-Logik beibehalten:
        const newId = `c_${currentClub.name.replace(/\s+/g, '_').toLowerCase()}_${Math.random().toString(36).substring(2, 5)}`;
        await setDoc(doc(db, CLUBS_COLLECTION, newId), clubDataToSave);
        toast({ title: "Verein erstellt", description: `Der Verein "${currentClub.name}" wurde erfolgreich angelegt.` });
      } else if (formMode === 'edit' && currentClub.id) {
        await updateDoc(doc(db, CLUBS_COLLECTION, currentClub.id), clubDataToSave);
        toast({ title: "Verein aktualisiert", description: `Der Verein "${currentClub.name}" wurde erfolgreich aktualisiert.` });
      }
      setIsFormOpen(false);
      setCurrentClub(null);
      fetchClubs(); // Daten neu laden
    } catch (error) {
      console.error("Error saving club: ", error);
      toast({
        title: "Fehler beim Speichern",
        description: (error as Error).message || "Der Verein konnte nicht gespeichert werden.",
        variant: "destructive",
      });
    }
  };

  const handleFormInputChange = (field: keyof Omit<Club, 'id'>, value: string) => {
    if (currentClub) {
        setCurrentClub(prev => ({ ...prev, [field]: value } as Partial<Club>));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-primary">Vereinsverwaltung</h1>
        <Button onClick={handleAddNew}>
          <PlusCircle className="mr-2 h-5 w-5" /> Neuen Verein anlegen
        </Button>
      </div>
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Vorhandene Vereine</CardTitle>
          <CardDescription>Verwalten Sie hier alle Schützenvereine.</CardDescription>
        </CardHeader>
        <CardContent>
           {isLoading ? (
             <div className="flex justify-center items-center py-10">
               <Loader2 className="h-12 w-12 animate-spin text-primary" />
             </div>
           ) : clubs.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Kürzel</TableHead>
                  <TableHead>Ansprechpartner</TableHead>
                  <TableHead>E-Mail</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clubs.map((club) => (
                  <TableRow key={club.id}>
                    <TableCell>{club.name}</TableCell>
                    <TableCell>{club.shortName || '-'}</TableCell>
                    <TableCell>{club.contactName || '-'}</TableCell>
                    <TableCell>{club.contactEmail || '-'}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(club)} aria-label="Verein bearbeiten">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(club.id, club.name)} className="text-destructive hover:text-destructive/80" aria-label="Verein löschen">
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
              <p className="text-sm">Legen Sie den ersten Verein über den Button oben rechts an.</p>
            </div>
          )}
        </CardContent>
      </Card>

       <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{formMode === 'new' ? 'Neuen Verein anlegen' : 'Verein bearbeiten'}</DialogTitle>
            <DialogDescription>
              {formMode === 'new' ? 'Erstellen Sie einen neuen Verein.' : `Bearbeiten Sie die Details für ${currentClub?.name}.`}
            </DialogDescription>
          </DialogHeader>
          {currentClub && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">Name</Label>
                <Input id="name" value={currentClub.name || ''} onChange={(e) => handleFormInputChange('name', e.target.value)} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="shortName" className="text-right">Kürzel</Label>
                <Input id="shortName" value={currentClub.shortName || ''} onChange={(e) => handleFormInputChange('shortName', e.target.value)} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="contactName" className="text-right">Ansprechp.</Label>
                <Input id="contactName" value={currentClub.contactName || ''} onChange={(e) => handleFormInputChange('contactName', e.target.value)} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="contactEmail" className="text-right">E-Mail</Label>
                <Input id="contactEmail" type="email" value={currentClub.contactEmail || ''} onChange={(e) => handleFormInputChange('contactEmail', e.target.value)} className="col-span-3" />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Abbrechen</Button>
            <Button type="submit" onClick={handleSubmit}>Speichern</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
