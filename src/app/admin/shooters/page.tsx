// src/app/admin/shooters/page.tsx
"use client";
import React, { useState, useEffect } from 'react';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

// Dummy data
const dummyClubs = [
  { id: 'c_naensen', name: 'SC Naensen' },
  { id: 'c_einbeck', name: 'Einbecker SGi' },
];
const dummyTeams = [ // Simulating teams for selection, in real app this would be dynamic based on club
    { id: 't_naensen1_kol_kk25', name: 'SC Naensen I (KOL KK 2025)', clubId: 'c_naensen'},
    { id: 't_esgi1_kol_kk25', name: 'Einbecker SGi I (KOL KK 2025)', clubId: 'c_einbeck'},
];

const initialShooters = [
  { id: 'sh_m_b', name: 'Max Mustermann', firstName: 'Max', lastName: 'Mustermann', clubId: 'c_naensen', gender: 'male', teamId: 't_naensen1_kol_kk25' },
  { id: 'sh_e_m', name: 'Erika Musterfrau', firstName: 'Erika', lastName: 'Musterfrau', clubId: 'c_einbeck', gender: 'female', teamId: 't_esgi1_kol_kk25' },
];

type Shooter = typeof initialShooters[0];

export default function AdminShootersPage() {
  const [selectedClubId, setSelectedClubId] = useState<string>('');
  const [shooters, setShooters] = useState<Shooter[]>(initialShooters);
  const [filteredShooters, setFilteredShooters] = useState<Shooter[]>([]);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentShooter, setCurrentShooter] = useState<Partial<Shooter> | null>(null);
  const [formMode, setFormMode] = useState<'new' | 'edit'>('new');
  
  useEffect(() => {
    if (selectedClubId) {
      setFilteredShooters(shooters.filter(s => s.clubId === selectedClubId));
    } else {
      setFilteredShooters(shooters); // Show all if no club selected
    }
  }, [selectedClubId, shooters]);

  const handleAddNew = () => {
    setFormMode('new');
    setCurrentShooter({ firstName: '', lastName: '', clubId: selectedClubId || '', gender: 'male' });
    setIsFormOpen(true);
  };

  const handleEdit = (shooter: Shooter) => {
    setFormMode('edit');
    setCurrentShooter(shooter);
    setIsFormOpen(true);
  };

  const handleDelete = (shooterId: string) => {
    setShooters(prev => prev.filter(s => s.id !== shooterId));
     console.log(`Schütze ${shooterId} zum Löschen markiert.`);
  };

  const handleSubmit = () => {
    if (formMode === 'new' && currentShooter && currentShooter.firstName && currentShooter.lastName) {
      const newShooter = { ...currentShooter, id: `sh_${currentShooter.firstName?.toLowerCase()}_${Math.random().toString(36).substr(2,5)}`, name: `${currentShooter.firstName} ${currentShooter.lastName}` } as Shooter;
      setShooters(prev => [...prev, newShooter]);
      console.log("Neuer Schütze (simuliert):", newShooter);
    } else if (formMode === 'edit' && currentShooter?.id && currentShooter.firstName && currentShooter.lastName) {
      setShooters(prev => prev.map(s => s.id === currentShooter.id ? {...s, ...currentShooter, name: `${currentShooter.firstName} ${currentShooter.lastName}`} as Shooter : s));
      console.log("Schütze bearbeitet (simuliert):", currentShooter);
    }
    setIsFormOpen(false);
    setCurrentShooter(null);
  };

  const handleFormInputChange = (field: keyof Shooter, value: string) => {
    if (currentShooter) {
        setCurrentShooter(prev => ({ ...prev, [field]: value } as Partial<Shooter>));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-primary">Schützenverwaltung</h1>
        <div className="flex items-center gap-4">
           <Select value={selectedClubId} onValueChange={setSelectedClubId}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Verein filtern" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Alle Vereine</SelectItem>
              {dummyClubs.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={handleAddNew}>
            <PlusCircle className="mr-2 h-5 w-5" /> Neuen Schützen anlegen
          </Button>
        </div>
      </div>
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Vorhandene Schützen</CardTitle>
          <CardDescription>
            Verwalten Sie hier alle Schützen.
          </CardDescription>
        </CardHeader>
        <CardContent>
           {filteredShooters.length > 0 ? (
             <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Verein</TableHead>
                  <TableHead>Geschlecht</TableHead>
                  {/* <TableHead>Mannschaft (optional)</TableHead> */}
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredShooters.map((shooter) => (
                  <TableRow key={shooter.id}>
                    <TableCell>{shooter.name}</TableCell>
                    <TableCell>{dummyClubs.find(c => c.id === shooter.clubId)?.name || 'N/A'}</TableCell>
                    <TableCell>{shooter.gender === 'male' ? 'Männlich' : 'Weiblich'}</TableCell>
                    {/* <TableCell>{dummyTeams.find(t=>t.id === shooter.teamId)?.name || '-'}</TableCell> */}
                    <TableCell className="text-right space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(shooter)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(shooter.id)} className="text-destructive hover:text-destructive/80">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="p-8 text-center text-muted-foreground bg-secondary/30 rounded-md">
              <p className="text-lg">{selectedClubId ? 'Keine Schützen für diesen Verein gefunden.' : 'Keine Schützen angelegt.'}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{formMode === 'new' ? 'Neuen Schützen anlegen' : 'Schütze bearbeiten'}</DialogTitle>
          </DialogHeader>
          {currentShooter && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="firstName" className="text-right">Vorname</Label>
                <Input id="firstName" value={currentShooter.firstName || ''} onChange={(e) => handleFormInputChange('firstName', e.target.value)} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="lastName" className="text-right">Nachname</Label>
                <Input id="lastName" value={currentShooter.lastName || ''} onChange={(e) => handleFormInputChange('lastName', e.target.value)} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="clubId" className="text-right">Verein</Label>
                <Select value={currentShooter.clubId || ''} onValueChange={(value) => handleFormInputChange('clubId', value)}>
                    <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Verein wählen"/>
                    </SelectTrigger>
                    <SelectContent>
                        {dummyClubs.map(club => <SelectItem key={club.id} value={club.id}>{club.name}</SelectItem>)}
                    </SelectContent>
                </Select>
              </div>
               <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="gender" className="text-right">Geschlecht</Label>
                <Select value={currentShooter.gender || 'male'} onValueChange={(value) => handleFormInputChange('gender', value)}>
                    <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Geschlecht wählen"/>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="male">Männlich</SelectItem>
                        <SelectItem value="female">Weiblich</SelectItem>
                    </SelectContent>
                </Select>
              </div>
              {/* Optional: Teamzuweisung - könnte komplexer sein */}
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
