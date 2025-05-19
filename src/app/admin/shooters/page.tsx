
// src/app/admin/shooters/page.tsx
"use client";
import React, { useState, useEffect, FormEvent, useMemo } from 'react';
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
import { useSearchParams, useRouter } from 'next/navigation';
import type { Shooter, Club, Team } from '@/types/rwk';
import { db } from '@/lib/firebase/config';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where, orderBy, documentId, getDoc as getFirestoreDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

const SHOOTERS_COLLECTION = "rwk_shooters";
const CLUBS_COLLECTION = "clubs";
const TEAMS_COLLECTION = "rwk_teams";
const ALL_CLUBS_FILTER_VALUE = "__ALL_CLUBS__";


export default function AdminShootersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryTeamId = searchParams.get('teamId');
  const queryClubIdFromParams = searchParams.get('clubId');

  const { toast } = useToast();

  const [allClubs, setAllClubs] = useState<Club[]>([]);
  const [shooters, setShooters] = useState<Shooter[]>([]);
  const [filteredShooters, setFilteredShooters] = useState<Shooter[]>([]);
  const [contextTeamName, setContextTeamName] = useState<string | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentShooter, setCurrentShooter] = useState<Partial<Shooter> & { id?: string } | null>(null);
  const [formMode, setFormMode] = useState<'new' | 'edit'>('new');
  
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [shooterToDelete, setShooterToDelete] = useState<Shooter | null>(null);

  const [selectedClubIdFilter, setSelectedClubIdFilter] = useState<string>(ALL_CLUBS_FILTER_VALUE);

  useEffect(() => {
    const fetchContextTeamName = async () => {
      if (queryTeamId) {
        try {
          const teamDocRef = doc(db, TEAMS_COLLECTION, queryTeamId);
          const teamSnap = await getFirestoreDoc(teamDocRef);
          if (teamSnap.exists()) {
            setContextTeamName((teamSnap.data() as Team).name);
          } else {
            setContextTeamName(`Team ID: ${queryTeamId}`);
          }
        } catch (error) {
          console.error("Error fetching context team name: ", error);
          setContextTeamName(`Team ID: ${queryTeamId}`);
        }
      } else {
        setContextTeamName(null);
      }
    };
    fetchContextTeamName();
  }, [queryTeamId]);

  useEffect(() => {
    const fetchClubs = async () => {
      setIsLoading(true);
      try {
        const clubsSnapshot = await getDocs(query(collection(db, CLUBS_COLLECTION), orderBy("name", "asc")));
        const fetchedClubs: Club[] = clubsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Club));
        setAllClubs(fetchedClubs);
        if (queryClubIdFromParams && fetchedClubs.some(c => c.id === queryClubIdFromParams)) {
          setSelectedClubIdFilter(queryClubIdFromParams);
        }
      } catch (error) {
        console.error("Error fetching clubs: ", error);
        toast({ title: "Fehler beim Laden der Vereine", description: (error as Error).message, variant: "destructive" });
      } finally {
        // Loading will be set to false after shooters are also fetched
      }
    };
    fetchClubs();
  }, [queryClubIdFromParams, toast]);

  const fetchShooters = async () => {
    setIsLoading(true);
    try {
      const shootersSnapshot = await getDocs(query(collection(db, SHOOTERS_COLLECTION), orderBy("lastName", "asc"), orderBy("firstName", "asc")));
      const fetchedShooters: Shooter[] = shootersSnapshot.docs.map(docData => ({ id: docData.id, ...docData.data() } as Shooter));
      setShooters(fetchedShooters);
    } catch (error) {
      console.error("Error fetching shooters: ", error);
      toast({ title: "Fehler beim Laden der Schützen", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchShooters();
  }, []);

  useEffect(() => {
    if (selectedClubIdFilter === ALL_CLUBS_FILTER_VALUE) {
      setFilteredShooters(shooters);
    } else {
      setFilteredShooters(shooters.filter(s => s.clubId === selectedClubIdFilter));
    }
  }, [selectedClubIdFilter, shooters]);

  const handleAddNew = () => {
    if (allClubs.length === 0) {
      toast({ title: "Keine Vereine", description: "Bitte zuerst Vereine anlegen, um Schützen erstellen zu können.", variant: "destructive"});
      return;
    }
    setFormMode('new');
    const initialClub = selectedClubIdFilter !== ALL_CLUBS_FILTER_VALUE 
      ? selectedClubIdFilter 
      : (queryClubIdFromParams || (allClubs.length > 0 ? allClubs[0].id : ''));
      
    setCurrentShooter({ 
      firstName: '', 
      lastName: '', 
      clubId: initialClub, 
      gender: 'male',
      teamIds: queryTeamId ? [queryTeamId] : [] 
    });
    setIsFormOpen(true);
  };

  const handleEdit = (shooter: Shooter) => {
     if (allClubs.length === 0 && !shooter.clubId) {
      toast({ title: "Keine Vereine", description: "Vereinsauswahl nicht möglich. Bitte Vereine anlegen.", variant: "destructive"});
    }
    setFormMode('edit');
    setCurrentShooter(shooter);
    setIsFormOpen(true);
  };

  const handleDeleteConfirmation = (shooter: Shooter) => {
    setShooterToDelete(shooter);
    setIsAlertOpen(true);
  };

  const handleDeleteShooter = async () => {
    if (!shooterToDelete || !shooterToDelete.id) {
      toast({ title: "Fehler", description: "Kein Schütze zum Löschen ausgewählt.", variant: "destructive" });
      setIsAlertOpen(false);
      return;
    }
    setIsLoading(true);
    try {
      await deleteDoc(doc(db, SHOOTERS_COLLECTION, shooterToDelete.id));
      toast({ title: "Schütze gelöscht", description: `${shooterToDelete.firstName} ${shooterToDelete.lastName} wurde erfolgreich entfernt.` });
      fetchShooters(); 
    } catch (error) {
      console.error("Error deleting shooter: ", error);
      toast({ title: "Fehler beim Löschen", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsLoading(false);
      setIsAlertOpen(false);
      setShooterToDelete(null);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!currentShooter || !currentShooter.firstName?.trim() || !currentShooter.lastName?.trim() || !currentShooter.clubId) {
      toast({ title: "Ungültige Eingabe", description: "Vorname, Nachname und Verein sind erforderlich.", variant: "destructive" });
      return;
    }

    const shooterDataToSave: Omit<Shooter, 'id' | 'name'> & { name: string } = {
      firstName: currentShooter.firstName.trim(),
      lastName: currentShooter.lastName.trim(),
      name: `${currentShooter.firstName.trim()} ${currentShooter.lastName.trim()}`,
      clubId: currentShooter.clubId,
      gender: currentShooter.gender || 'male',
      teamIds: currentShooter.teamIds || [],
    };

    setIsLoading(true);
    try {
      const shootersCollectionRef = collection(db, SHOOTERS_COLLECTION);
      const q = query(shootersCollectionRef, 
        where("name", "==", shooterDataToSave.name),
        where("clubId", "==", shooterDataToSave.clubId)
      );
      const querySnapshot = await getDocs(q);
      
      let isDuplicate = false;
      if (formMode === 'new' && !querySnapshot.empty) {
        isDuplicate = true;
      } else if (formMode === 'edit' && currentShooter.id) {
        querySnapshot.forEach((doc) => {
          if (doc.id !== currentShooter.id) {
            isDuplicate = true;
          }
        });
      }

      if (isDuplicate) {
        toast({
          title: "Doppelter Schütze",
          description: `Ein Schütze mit dem Namen "${shooterDataToSave.name}" existiert bereits in diesem Verein.`,
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      if (formMode === 'new') {
        await addDoc(shootersCollectionRef, shooterDataToSave);
        toast({ title: "Schütze erstellt", description: `${shooterDataToSave.name} wurde erfolgreich angelegt.` });
      } else if (formMode === 'edit' && currentShooter.id) {
        await updateDoc(doc(db, SHOOTERS_COLLECTION, currentShooter.id), shooterDataToSave);
        toast({ title: "Schütze aktualisiert", description: `${shooterDataToSave.name} wurde erfolgreich aktualisiert.` });
      }
      setIsFormOpen(false);
      setCurrentShooter(null);
      fetchShooters();
    } catch (error) {
      console.error("Error saving shooter: ", error);
      toast({ title: `Fehler beim ${formMode === 'new' ? 'Erstellen' : 'Aktualisieren'}`, description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormInputChange = (field: keyof Pick<Shooter, 'firstName' | 'lastName' | 'clubId' | 'gender'>, value: string) => {
     setCurrentShooter(prev => prev ? ({ ...prev, [field]: value }) : null);
  };
  
  const getClubName = (clubId: string): string => {
    return allClubs.find(c => c.id === clubId)?.name || 'Unbekannt';
  };

  const getTeamInfoForShooter = (teamIds?: string[]): string => {
    if (!teamIds || teamIds.length === 0) return '-';
    // For simplicity, not fetching all team names here to display.
    // This could be enhanced if needed by fetching team data.
    if (queryTeamId && teamIds.includes(queryTeamId) && contextTeamName) {
        return teamIds.length > 1 ? `${contextTeamName} (+${teamIds.length -1} weitere)`: contextTeamName;
    }
    return `${teamIds.length} Team(s) zugeordnet`;
  };

  const selectedClubNameForTitle = selectedClubIdFilter !== ALL_CLUBS_FILTER_VALUE 
    ? allClubs.find(c => c.id === selectedClubIdFilter)?.name 
    : 'aller Vereine';
  

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-primary">Schützenverwaltung</h1>
        <div className="flex items-center gap-4">
           <Select value={selectedClubIdFilter} onValueChange={setSelectedClubIdFilter} disabled={allClubs.length === 0 && isLoading}>
            <SelectTrigger className="w-[220px]" aria-label="Verein filtern">
              <SelectValue placeholder={isLoading && allClubs.length === 0 ? "Lade Vereine..." : "Verein filtern"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_CLUBS_FILTER_VALUE}>Alle Vereine</SelectItem>
              {allClubs.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={handleAddNew} disabled={allClubs.length === 0 && !isLoading}>
            <PlusCircle className="mr-2 h-5 w-5" /> Neuen Schützen anlegen
          </Button>
        </div>
      </div>
       <Card className="shadow-md">
        <CardHeader>
          <CardTitle>
            Schützen {selectedClubNameForTitle}
            {contextTeamName ? ` (Kontext: ${contextTeamName})` : ''}
          </CardTitle>
          <CardDescription>
            Verwalten Sie hier alle Schützen.
            {allClubs.length === 0 && !isLoading && <span className="text-destructive block mt-1"> Hinweis: Keine Vereine angelegt. Bitte zuerst Vereine erstellen.</span>}
          </CardDescription>
        </CardHeader>
        <CardContent>
           {isLoading ? (
            <div className="flex justify-center items-center py-10">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="ml-3">Lade Schützen...</p>
            </div>
           ) : filteredShooters.length > 0 ? (
             <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Verein</TableHead>
                  <TableHead>Geschlecht</TableHead>
                  <TableHead>Teams (Info)</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredShooters.map((shooter) => (
                  <TableRow key={shooter.id}>
                    <TableCell>{shooter.firstName} {shooter.lastName}</TableCell>
                    <TableCell>{getClubName(shooter.clubId)}</TableCell>
                    <TableCell>{shooter.gender === 'male' ? 'Männlich' : (shooter.gender === 'female' ? 'Weiblich' : 'N/A')}</TableCell>
                    <TableCell className="text-xs">{getTeamInfoForShooter(shooter.teamIds)}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(shooter)} aria-label="Schütze bearbeiten">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteConfirmation(shooter)} className="text-destructive hover:text-destructive/80" aria-label="Schütze löschen">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="p-8 text-center text-muted-foreground bg-secondary/30 rounded-md">
              <p className="text-lg">{selectedClubIdFilter !== ALL_CLUBS_FILTER_VALUE ? 'Keine Schützen für diesen Verein gefunden.' : 'Keine Schützen angelegt.'}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={(open) => { setIsFormOpen(open); if (!open) setCurrentShooter(null); }}>
        <DialogContent className="sm:max-w-[480px]"> {/* Increased width for better layout */}
          <form onSubmit={handleSubmit}>
            <DialogHeader>
                <DialogTitle>{formMode === 'new' ? 'Neuen Schützen anlegen' : 'Schütze bearbeiten'}</DialogTitle>
                <DialogDescription>
                    {queryTeamId && formMode === 'new' && contextTeamName ? `Schütze wird initial Team "${contextTeamName}" zugeordnet.` : 'Tragen Sie die Daten des Schützen ein.'}
                </DialogDescription>
            </DialogHeader>
            {currentShooter && (
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="firstName" className="text-right col-span-1">Vorname</Label>
                      <Input id="firstName" value={currentShooter.firstName || ''} onChange={(e) => handleFormInputChange('firstName', e.target.value)} className="col-span-3" required />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="lastName" className="text-right col-span-1">Nachname</Label>
                      <Input id="lastName" value={currentShooter.lastName || ''} onChange={(e) => handleFormInputChange('lastName', e.target.value)} className="col-span-3" required />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="clubIdForm" className="text-right col-span-1">Verein</Label>
                      <Select 
                          value={currentShooter.clubId || ''} 
                          onValueChange={(value) => handleFormInputChange('clubId', value)}
                          required
                          disabled={allClubs.length === 0}
                      >
                          <SelectTrigger id="clubIdForm" className="col-span-3" aria-label="Verein auswählen">
                              <SelectValue placeholder={allClubs.length === 0 ? "Keine Vereine" : "Verein wählen"}/>
                          </SelectTrigger>
                          <SelectContent>
                              {allClubs.map(club => <SelectItem key={club.id} value={club.id}>{club.name}</SelectItem>)}
                          </SelectContent>
                      </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="gender" className="text-right col-span-1">Geschlecht</Label>
                      <Select 
                          value={currentShooter.gender || 'male'} 
                          onValueChange={(value) => handleFormInputChange('gender', value as 'male' | 'female')}
                      >
                          <SelectTrigger id="gender" className="col-span-3" aria-label="Geschlecht auswählen">
                              <SelectValue placeholder="Geschlecht wählen"/>
                          </SelectTrigger>
                          <SelectContent>
                              <SelectItem value="male">Männlich</SelectItem>
                              <SelectItem value="female">Weiblich</SelectItem>
                          </SelectContent>
                      </Select>
                  </div>
                  {currentShooter.teamIds && currentShooter.teamIds.length > 0 && (
                      <div className="col-span-4 text-xs text-muted-foreground p-2 rounded-md bg-secondary/30">
                          Aktuelle Team-Zuordnungen (Info): {getTeamInfoForShooter(currentShooter.teamIds)}
                      </div>
                  )}
                </div>
            )}
            <DialogFooter>
                <Button type="button" variant="outline" onClick={() => { setIsFormOpen(false); setCurrentShooter(null);}}>Abbrechen</Button>
                <Button type="submit" disabled={isLoading && isFormOpen}>
                    {(isLoading && isFormOpen) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Speichern
                </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {shooterToDelete && (
        <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Schütze löschen bestätigen</AlertDialogTitle>
              <AlertDialogDescription>
                Möchten Sie den Schützen "{shooterToDelete.firstName} {shooterToDelete.lastName}" wirklich endgültig löschen? Diese Aktion kann nicht rückgängig gemacht werden.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => { setIsAlertOpen(false); setShooterToDelete(null); }}>Abbrechen</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteShooter}
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

