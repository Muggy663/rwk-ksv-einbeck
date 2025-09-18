
// src/app/admin/seasons/page.tsx
"use client";
import React, { useState, useEffect, FormEvent } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Edit, Trash2, Eye, Loader2 } from 'lucide-react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Season, UIDisciplineSelection } from '@/types/rwk';
import { db } from '@/lib/firebase/config';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where, orderBy, documentId } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

const SEASONS_COLLECTION = "seasons";

const getSeasonName = (year: number, type: UIDisciplineSelection): string => {
  const typeName = type === 'KK' ? 'Kleinkaliber' : 'Luftdruck';
  return `RWK ${year} ${typeName}`;
};

export default function AdminSeasonsPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [seasons, setSeasons] = useState<Season[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentSeason, setCurrentSeason] = useState<Partial<Season> & { id?: string } | null>(null);
  const [formMode, setFormMode] = useState<'new' | 'edit'>('new');
  
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [seasonToDelete, setSeasonToDelete] = useState<Season | null>(null);

  const fetchSeasons = async () => {
    setIsLoading(true);
    try {
      const seasonsCollectionRef = collection(db, SEASONS_COLLECTION);
      const q = query(seasonsCollectionRef, orderBy("competitionYear", "desc"), orderBy("type", "asc"));
      const querySnapshot = await getDocs(q);
      const fetchedSeasons: Season[] = [];
      querySnapshot.forEach((doc) => {
        fetchedSeasons.push({ id: doc.id, ...doc.data() } as Season);
      });
      setSeasons(fetchedSeasons);
    } catch (error) {
      console.error("Error fetching seasons: ", error);
      toast({
        title: "Fehler beim Laden der Saisons",
        description: (error as Error).message || "Ein unbekannter Fehler ist aufgetreten.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSeasons();
  }, []);

  const handleAddNew = () => {
    setFormMode('new');
    setCurrentSeason({ competitionYear: new Date().getFullYear() + 1, type: 'KK', status: 'Geplant' });
    setIsFormOpen(true);
  };

  const handleEdit = (season: Season) => {
    setFormMode('edit');
    setCurrentSeason(season);
    setIsFormOpen(true);
  };

  const handleDeleteConfirmation = (season: Season) => {
    setSeasonToDelete(season);
    setIsAlertOpen(true);
  };

  const handleDeleteSeason = async () => {
    if (!seasonToDelete || !seasonToDelete.id) {
      toast({ title: "Fehler", description: "Keine Saison zum Löschen ausgewählt.", variant: "destructive" });
      setIsAlertOpen(false);
      return;
    }
    
    setIsLoading(true); 
    try {
      await deleteDoc(doc(db, SEASONS_COLLECTION, seasonToDelete.id));
      toast({ title: "Saison gelöscht", description: `"${seasonToDelete.name}" wurde erfolgreich entfernt.` });
      fetchSeasons(); 
    } catch (error) {
      console.error("Error deleting season: ", error);
      toast({
        title: "Fehler beim Löschen",
        description: (error as Error).message || `Die Saison "${seasonToDelete.name}" konnte nicht gelöscht werden.`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsAlertOpen(false);
      setSeasonToDelete(null);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!currentSeason || !currentSeason.competitionYear || !currentSeason.type || !currentSeason.status) {
      toast({ title: "Ungültige Eingabe", description: "Bitte alle Felder ausfüllen.", variant: "destructive" });
      return;
    }

    const seasonName = getSeasonName(currentSeason.competitionYear, currentSeason.type);
    const seasonDataToSave: Omit<Season, 'id'> = {
      competitionYear: currentSeason.competitionYear,
      type: currentSeason.type,
      status: currentSeason.status,
      name: seasonName,
    };

    setIsLoading(true);
    try {
      const seasonsCollectionRef = collection(db, SEASONS_COLLECTION);
      let duplicateQuery;

      const baseDuplicateConditions = [
        where("competitionYear", "==", seasonDataToSave.competitionYear),
        where("type", "==", seasonDataToSave.type)
      ];

      if (formMode === 'edit' && currentSeason?.id) {
        duplicateQuery = query(seasonsCollectionRef, ...baseDuplicateConditions, where(documentId(), "!=", currentSeason.id));
      } else {
        duplicateQuery = query(seasonsCollectionRef, ...baseDuplicateConditions);
      }
      
      const duplicateSnapshot = await getDocs(duplicateQuery);
      if (!duplicateSnapshot.empty) {
        toast({
          title: "Doppelte Saison",
          description: `Eine Saison für ${seasonDataToSave.competitionYear} ${seasonDataToSave.type} existiert bereits.`,
          variant: "destructive",
        });
        setIsLoading(false);
        return; 
      }

      if (formMode === 'new') {
        await addDoc(collection(db, SEASONS_COLLECTION), seasonDataToSave);
        toast({ title: "Saison erstellt", description: `${seasonDataToSave.name} wurde erfolgreich angelegt.` });
      } else if (formMode === 'edit' && currentSeason.id) {
        await updateDoc(doc(db, SEASONS_COLLECTION, currentSeason.id), seasonDataToSave);
        toast({ title: "Saison aktualisiert", description: `${seasonDataToSave.name} wurde erfolgreich aktualisiert.` });
      }
      setIsFormOpen(false);
      setCurrentSeason(null);
      await fetchSeasons();
    } catch (error) {
      console.error("Error saving season: ", error);
      const action = formMode === 'new' ? 'erstellen' : 'aktualisieren';
      toast({
        title: `Fehler beim ${action}`,
        description: (error as Error).message || `Die Saison konnte nicht ${action} werden.`,
        variant: "destructive",
      });
    } finally {
        setIsLoading(false);
    }
  };
  
  const handleFormInputChange = (field: keyof Pick<Season, 'competitionYear' | 'type' | 'status'>, value: string | number) => {
    setCurrentSeason(prev => {
      if (!prev) return null;
      if (field === 'competitionYear') {
        return { ...prev, [field]: parseInt(value as string, 10) };
      }
      return { ...prev, [field]: value as UIDisciplineSelection | Season['status'] };
    });
  };

  const navigateToLeagues = (seasonId: string) => {
    router.push(`/admin/leagues?seasonId=${seasonId}`);
  };

  return (
    <div className="px-2 md:px-4 space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl md:text-2xl font-semibold text-primary">Saisonverwaltung</h1>
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
            <PlusCircle className="mr-2 h-5 w-5" /> Neue Saison anlegen
          </Button>
        </div>
      </div>
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Vorhandene Saisons</CardTitle>
          <CardDescription>Übersicht aller angelegten Wettkampfsaisons. Verwalten Sie von hier aus die zugehörigen Ligen.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
          ) : seasons.length > 0 ? (
            <>
              {/* Mobile Card Layout */}
              <div className="block md:hidden space-y-4">
                {seasons.map((season) => (
                  <Card key={season.id} className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium">{season.name}</h3>
                        <span className="text-sm px-2 py-1 bg-blue-100 text-blue-700 rounded">{season.status}</span>
                      </div>
                      <div className="space-y-1 text-sm">
                        <div><span className="font-medium">Jahr:</span> {season.competitionYear}</div>
                        <div><span className="font-medium">Typ:</span> {season.type}</div>
                      </div>
                      <div className="flex flex-col gap-2 pt-2">
                        <Button variant="outline" size="sm" onClick={() => navigateToLeagues(season.id)} className="w-full">
                          <Eye className="mr-2 h-4 w-4" /> Ligen anzeigen
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => router.push(`/admin/seasons/zeitungsbericht?seasonId=${season.id}`)} className="w-full">
                          📰 Zeitungsbericht
                        </Button>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleEdit(season)} className="flex-1">
                            <Edit className="h-4 w-4 mr-2" /> Bearbeiten
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleDeleteConfirmation(season)} className="flex-1 text-destructive hover:text-destructive/80">
                            <Trash2 className="h-4 w-4 mr-2" /> Löschen
                          </Button>
                        </div>
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
                        <TableCell>{season.competitionYear}</TableCell>
                        <TableCell>{season.type}</TableCell>
                        <TableCell>{season.name}</TableCell>
                        <TableCell>{season.status}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button variant="outline" size="sm" onClick={() => navigateToLeagues(season.id)} className="text-xs">
                              <Eye className="mr-1 h-3 w-3" /> Ligen
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => router.push(`/admin/seasons/zeitungsbericht?seasonId=${season.id}`)} className="text-xs">
                              📰 Zeitungsbericht
                            </Button>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="sm" onClick={() => handleEdit(season)} aria-label="Saison bearbeiten">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleDeleteConfirmation(season)} className="text-destructive hover:text-destructive/80" aria-label="Saison löschen">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
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
              <p className="text-lg">Noch keine Saisons angelegt.</p>
              <p className="text-sm">Klicken Sie auf "Neue Saison anlegen", um zu beginnen.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={(open) => { setIsFormOpen(open); if (!open) setCurrentSeason(null); }}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{formMode === 'new' ? 'Neue Saison anlegen' : 'Saison bearbeiten'}</DialogTitle>
              <DialogDescription>
                {formMode === 'new' ? 'Erstellen Sie ein neues Wettkampfjahr mit Disziplin.' : `Bearbeiten Sie die Details für ${currentSeason?.name || 'die Saison'}.`}
              </DialogDescription>
            </DialogHeader>
            {currentSeason && (
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="year" className="text-right">Jahr</Label>
                  <Input 
                      id="year" 
                      type="number" 
                      value={currentSeason.competitionYear || ''} 
                      onChange={(e) => handleFormInputChange('competitionYear', e.target.value)}
                      className="col-span-3" 
                      required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="type" className="text-right">Disziplin</Label>
                  <Select 
                      value={currentSeason.type || 'KK'} 
                      onValueChange={(value: UIDisciplineSelection) => handleFormInputChange('type', value)}
                      required
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
                      onValueChange={(value: Season['status']) => handleFormInputChange('status', value)}
                      required
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
              <Button type="button" variant="outline" onClick={() => { setIsFormOpen(false); setCurrentSeason(null); }}>Abbrechen</Button>
              <Button type="submit" disabled={isLoading && isFormOpen}>
                {(isLoading && isFormOpen) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Speichern
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {seasonToDelete && (
        <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Saison löschen bestätigen</AlertDialogTitle>
              <AlertDialogDescription>
                Möchten Sie die Saison "{seasonToDelete.name}" wirklich endgültig löschen? Diese Aktion kann nicht rückgängig gemacht werden und kann Auswirkungen auf zugehörige Ligen und Ergebnisse haben.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => { setIsAlertOpen(false); setSeasonToDelete(null); }}>Abbrechen</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteSeason}
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

    
