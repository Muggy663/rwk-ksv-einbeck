// src/app/admin/seasons/page.tsx
"use client";
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Edit, Trash2, Eye } from 'lucide-react';
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRouter } from 'next/navigation'; // Import useRouter

// Dummy data for now
const initialSeasons = [
  { id: 's2025kk', year: 2025, type: 'KK', name: 'RWK 2025 Kleinkaliber', status: 'Geplant' },
  { id: 's2025ld', year: 2025, type: 'LD', name: 'RWK 2025 Luftdruck', status: 'Geplant' },
  { id: 's2024kk', year: 2024, type: 'KK', name: 'RWK 2024 Kleinkaliber', status: 'Abgeschlossen' },
];

type Season = typeof initialSeasons[0];

export default function AdminSeasonsPage() {
  const router = useRouter(); // Initialize router
  const [seasons, setSeasons] = useState<Season[]>(initialSeasons);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentSeason, setCurrentSeason] = useState<Partial<Season> | null>(null);
  const [formMode, setFormMode] = useState<'new' | 'edit'>('new');

  const handleAddNew = () => {
    setFormMode('new');
    setCurrentSeason({ year: new Date().getFullYear() + 1, type: 'KK', status: 'Geplant' });
    setIsFormOpen(true);
  };

  const handleEdit = (season: Season) => {
    setFormMode('edit');
    setCurrentSeason(season);
    setIsFormOpen(true);
  };

  const handleDelete = (seasonId: string) => {
    // TODO: Implement actual delete logic with confirmation
    setSeasons(prev => prev.filter(s => s.id !== seasonId));
    console.log(`Saison ${seasonId} zum Löschen markiert.`);
  };

  const handleSubmit = () => {
    // TODO: Implement actual save/update logic to Firestore
    if (formMode === 'new' && currentSeason) {
      const newSeasonToAdd = { ...currentSeason, id: `s${currentSeason.year}${currentSeason.type?.toLowerCase()}_${Math.random().toString(36).substr(2, 5)}`, name: `RWK ${currentSeason.year} ${currentSeason.type === 'KK' ? 'Kleinkaliber' : 'Luftdruck'}` } as Season;
      setSeasons(prev => [...prev, newSeasonToAdd]);
      console.log("Neue Saison (simuliert):", newSeasonToAdd);
    } else if (formMode === 'edit' && currentSeason?.id) {
      setSeasons(prev => prev.map(s => s.id === currentSeason.id ? {...s, ...currentSeason, name: `RWK ${currentSeason.year} ${currentSeason.type === 'KK' ? 'Kleinkaliber' : 'Luftdruck'}`} as Season : s));
      console.log("Saison bearbeitet (simuliert):", currentSeason);
    }
    setIsFormOpen(false);
    setCurrentSeason(null);
  };
  
  const handleFormInputChange = (field: keyof Season, value: string | number) => {
    if (currentSeason) {
        setCurrentSeason(prev => ({ ...prev, [field]: value } as Partial<Season>));
    }
  };

  const navigateToLeagues = (seasonId: string) => {
    router.push(`/admin/leagues?seasonId=${seasonId}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-primary">Saisonverwaltung</h1>
        <Button onClick={handleAddNew}>
          <PlusCircle className="mr-2 h-5 w-5" /> Neue Saison anlegen
        </Button>
      </div>
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Vorhandene Saisons</CardTitle>
          <CardDescription>Übersicht aller angelegten Wettkampfsaisons. Verwalten Sie von hier aus die zugehörigen Ligen.</CardDescription>
        </CardHeader>
        <CardContent>
          {seasons.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Jahr</TableHead>
                  <TableHead>Typ</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {seasons.map((season) => (
                  <TableRow key={season.id}>
                    <TableCell>{season.year}</TableCell>
                    <TableCell>{season.type}</TableCell>
                    <TableCell>{season.name}</TableCell>
                    <TableCell>{season.status}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="outline" size="sm" onClick={() => navigateToLeagues(season.id)}>
                        <Eye className="mr-1 h-4 w-4" /> Ligen verwalten
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(season)} aria-label="Saison bearbeiten">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(season.id)} className="text-destructive hover:text-destructive/80" aria-label="Saison löschen">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="p-8 text-center text-muted-foreground bg-secondary/30 rounded-md">
              <p className="text-lg">Noch keine Saisons angelegt.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{formMode === 'new' ? 'Neue Saison anlegen' : 'Saison bearbeiten'}</DialogTitle>
            <DialogDescription>
              {formMode === 'new' ? 'Erstellen Sie ein neues Wettkampfjahr mit Disziplin.' : `Bearbeiten Sie die Details für ${currentSeason?.name}.`}
            </DialogDescription>
          </DialogHeader>
          {currentSeason && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="year" className="text-right">Jahr</Label>
                <Input 
                    id="year" 
                    type="number" 
                    value={currentSeason.year || ''} 
                    onChange={(e) => handleFormInputChange('year', parseInt(e.target.value))}
                    className="col-span-3" 
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="type" className="text-right">Disziplin</Label>
                <Select 
                    value={currentSeason.type || 'KK'} 
                    onValueChange={(value) => handleFormInputChange('type', value)}
                >
                  <SelectTrigger id="type" className="col-span-3">
                    <SelectValue placeholder="Disziplin wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="KK">Kleinkaliber (KK)</SelectItem>
                    <SelectItem value="LD">Luftdruck (LG/LP)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
               <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="status" className="text-right">Status</Label>
                <Select 
                    value={currentSeason.status || 'Geplant'} 
                    onValueChange={(value) => handleFormInputChange('status', value)}
                >
                  <SelectTrigger id="status" className="col-span-3">
                    <SelectValue placeholder="Status wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Geplant">Geplant</SelectItem>
                    <SelectItem value="Laufend">Laufend</SelectItem>
                    <SelectItem value="Abgeschlossen">Abgeschlossen</SelectItem>
                  </SelectContent>
                </Select>
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
