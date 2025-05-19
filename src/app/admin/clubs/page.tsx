// src/app/admin/clubs/page.tsx
"use client";
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
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

// Dummy data for now
const initialClubs = [
  { id: 'c_naensen', name: 'SC Naensen', shortName: 'SCN', contactName: 'Max Mustermann', contactEmail: 'max@naensen.de' },
  { id: 'c_einbeck', name: 'Einbecker Schützengilde', shortName: 'ESGi', contactName: 'Erika Musterfrau', contactEmail: 'erika@esgi.de' },
  { id: 'c_doerrigsen', name: 'SV Dörrigsen', shortName: 'SVD', contactName: '', contactEmail: '' },
];

type Club = typeof initialClubs[0];

export default function AdminClubsPage() {
  const [clubs, setClubs] = useState<Club[]>(initialClubs);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentClub, setCurrentClub] = useState<Partial<Club> | null>(null);
  const [formMode, setFormMode] = useState<'new' | 'edit'>('new');

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

  const handleDelete = (clubId: string) => {
    // TODO: Implement actual delete logic
    setClubs(prev => prev.filter(c => c.id !== clubId));
    console.log(`Verein ${clubId} zum Löschen markiert.`);
  };
  
  const handleSubmit = () => {
    // TODO: Implement actual save/update logic to Firestore
    if (formMode === 'new' && currentClub && currentClub.name) {
      const newClubToAdd = { ...currentClub, id: `c_${currentClub.name.replace(/\s+/g, '_').toLowerCase()}_${Math.random().toString(36).substr(2,5)}` } as Club;
      setClubs(prev => [...prev, newClubToAdd]);
      console.log("Neuer Verein (simuliert):", newClubToAdd);
    } else if (formMode === 'edit' && currentClub?.id && currentClub.name) {
      setClubs(prev => prev.map(c => c.id === currentClub.id ? {...c, ...currentClub} as Club : c));
      console.log("Verein bearbeitet (simuliert):", currentClub);
    }
    setIsFormOpen(false);
    setCurrentClub(null);
  };

  const handleFormInputChange = (field: keyof Club, value: string) => {
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
           {clubs.length > 0 ? (
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
                    <TableCell>{club.shortName}</TableCell>
                    <TableCell>{club.contactName || '-'}</TableCell>
                    <TableCell>{club.contactEmail || '-'}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(club)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(club.id)} className="text-destructive hover:text-destructive/80">
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
