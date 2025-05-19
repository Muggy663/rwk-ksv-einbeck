
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
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where, orderBy, documentId, getDoc as getFirestoreDoc, writeBatch, arrayRemove, arrayUnion } from 'firebase/firestore';
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
        console.log(">>> shooters/fetchContextTeamName: Fetching team name for teamId:", queryTeamId);
        try {
          const teamDocRef = doc(db, TEAMS_COLLECTION, queryTeamId);
          const teamSnap = await getFirestoreDoc(teamDocRef);
          if (teamSnap.exists()) {
            const teamName = (teamSnap.data() as Team).name;
            setContextTeamName(teamName);
            console.log(">>> shooters/fetchContextTeamName: Context team name set to:", teamName);
          } else {
            setContextTeamName(null); 
            console.log(">>> shooters/fetchContextTeamName: Team not found for ID:", queryTeamId);
          }
        } catch (error) {
          console.error(">>> shooters/fetchContextTeamName: Error fetching context team name: ", error);
          setContextTeamName(null);
        }
      } else {
        setContextTeamName(null);
        console.log(">>> shooters/fetchContextTeamName: No queryTeamId provided.");
      }
    };
    fetchContextTeamName();
  }, [queryTeamId]);

  const fetchClubsAndShooters = async () => {
    console.log(">>> shooters/fetchClubsAndShooters: Fetching initial data...");
    setIsLoading(true);
    try {
      const clubsSnapshot = await getDocs(query(collection(db, CLUBS_COLLECTION), orderBy("name", "asc")));
      const fetchedClubs: Club[] = clubsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Club));
      setAllClubs(fetchedClubs);
      console.log(">>> shooters/fetchClubsAndShooters: Clubs fetched:", fetchedClubs.length);

      if (queryClubIdFromParams && fetchedClubs.some(c => c.id === queryClubIdFromParams)) {
        setSelectedClubIdFilter(queryClubIdFromParams);
        console.log(">>> shooters/fetchClubsAndShooters: Club filter set from query param:", queryClubIdFromParams);
      }

      const shootersSnapshot = await getDocs(query(collection(db, SHOOTERS_COLLECTION), orderBy("lastName", "asc"), orderBy("firstName", "asc")));
      const fetchedShooters: Shooter[] = shootersSnapshot.docs.map(docData => ({ id: docData.id, ...docData.data() } as Shooter));
      setShooters(fetchedShooters);
      console.log(">>> shooters/fetchClubsAndShooters: Shooters fetched:", fetchedShooters.length);

    } catch (error) {
      console.error(">>> shooters/fetchClubsAndShooters: Error fetching initial data: ", error);
      toast({ title: "Fehler beim Laden der Daten", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsLoading(false);
      console.log(">>> shooters/fetchClubsAndShooters: Finished. isLoading:", false);
    }
  };

  useEffect(() => {
    fetchClubsAndShooters();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast]);


  useEffect(() => {
    console.log(">>> shooters/useEffect[selectedClubIdFilter, shooters]: Filtering shooters. Selected clubId:", selectedClubIdFilter);
    if (selectedClubIdFilter === ALL_CLUBS_FILTER_VALUE) {
      setFilteredShooters(shooters);
      console.log(">>> shooters/useEffect[selectedClubIdFilter, shooters]: Showing all shooters:", shooters.length);
    } else {
      const newFiltered = shooters.filter(s => s.clubId === selectedClubIdFilter);
      setFilteredShooters(newFiltered);
      console.log(">>> shooters/useEffect[selectedClubIdFilter, shooters]: Filtered shooters for club", selectedClubIdFilter, ":", newFiltered.length);
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
    console.log(">>> shooters/handleAddNew: Opening form for new shooter. Initial clubId:", initialClub, "Initial teamIds:", queryTeamId ? [queryTeamId] : []);
  };

  const handleEdit = (shooter: Shooter) => {
     if (allClubs.length === 0 && !shooter.clubId) {
      toast({ title: "Keine Vereine", description: "Vereinsauswahl nicht möglich. Bitte Vereine anlegen.", variant: "destructive"});
    }
    setFormMode('edit');
    setCurrentShooter(shooter);
    setIsFormOpen(true);
    console.log(">>> shooters/handleEdit: Opening form to edit shooter:", shooter.id);
  };

  const handleDeleteConfirmation = (shooter: Shooter) => {
    setShooterToDelete(shooter);
    setIsAlertOpen(true);
    console.log(">>> shooters/handleDeleteConfirmation: Marked shooter for deletion:", shooter.id);
  };

  const handleDeleteShooter = async () => {
    if (!shooterToDelete || !shooterToDelete.id) {
      toast({ title: "Fehler", description: "Kein Schütze zum Löschen ausgewählt.", variant: "destructive" });
      setIsAlertOpen(false);
      return;
    }
    console.log(`>>> shooters/handleDeleteShooter: Attempting to delete shooter ${shooterToDelete.id}`);
    setIsLoading(true);
    try {
      const batch = writeBatch(db);
      const shooterDocRef = doc(db, SHOOTERS_COLLECTION, shooterToDelete.id);

      if (shooterToDelete.teamIds && shooterToDelete.teamIds.length > 0) {
        console.log(`>>> shooters/handleDeleteShooter: Shooter ${shooterToDelete.id} is in teams:`, shooterToDelete.teamIds, ". Removing from them.");
        for (const teamId of shooterToDelete.teamIds) {
          const teamDocRef = doc(db, TEAMS_COLLECTION, teamId);
          batch.update(teamDocRef, { shooterIds: arrayRemove(shooterToDelete.id) }); 
          console.log(`>>> shooters/handleDeleteShooter: Scheduled removal of shooter ${shooterToDelete.id} from team ${teamId}'s shooterIds`);
        }
      }
      
      batch.delete(shooterDocRef); 
      console.log(`>>> shooters/handleDeleteShooter: Scheduled deletion of shooter document ${shooterToDelete.id}`);
      
      await batch.commit();
      console.log(`>>> shooters/handleDeleteShooter: Batch committed. Shooter ${shooterToDelete.id} and team associations removed.`);

      toast({ title: "Schütze gelöscht", description: `${shooterToDelete.firstName} ${shooterToDelete.lastName} wurde erfolgreich entfernt.` });
      fetchClubsAndShooters(); 
    } catch (error) {
      console.error(">>> shooters/handleDeleteShooter: Error deleting shooter: ", error);
      toast({ title: "Fehler beim Löschen", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsLoading(false);
      setIsAlertOpen(false);
      setShooterToDelete(null);
      console.log(">>> shooters/handleDeleteShooter: Finished for shooter", shooterToDelete?.id);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    console.log(">>> shooters/handleSubmit: Form submitted.");
    if (!currentShooter || !currentShooter.firstName?.trim() || !currentShooter.lastName?.trim() || !currentShooter.clubId) {
      toast({ title: "Ungültige Eingabe", description: "Vorname, Nachname und Verein sind erforderlich.", variant: "destructive" });
      console.warn(">>> shooters/handleSubmit: Invalid form input.", currentShooter);
      return;
    }
    
    const teamIdsToSave = currentShooter.teamIds || [];
    
    const shooterDataToSave: Omit<Shooter, 'id' | 'name'> & { name: string } = {
      firstName: currentShooter.firstName.trim(),
      lastName: currentShooter.lastName.trim(),
      name: `${currentShooter.firstName.trim()} ${currentShooter.lastName.trim()}`,
      clubId: currentShooter.clubId,
      gender: currentShooter.gender || 'male',
      teamIds: teamIdsToSave,
    };
    console.log(">>> shooters/handleSubmit: Shooter data to save:", shooterDataToSave);

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
        console.warn(">>> shooters/handleSubmit: Duplicate shooter found.");
        return;
      }

      const batch = writeBatch(db);

      if (formMode === 'new') {
        console.log(">>> shooters/handleSubmit: Attempting to add new shooter document...");
        const newShooterRef = doc(collection(db, SHOOTERS_COLLECTION));
        
        const initialTeamIds = queryTeamId ? [queryTeamId] : [];
        const finalShooterData = { ...shooterDataToSave, teamIds: initialTeamIds };
        
        batch.set(newShooterRef, finalShooterData);
        console.log(">>> shooters/handleSubmit: New shooter document scheduled for creation with ID:", newShooterRef.id);
        
        if (queryTeamId) {
            const teamDocRef = doc(db, TEAMS_COLLECTION, queryTeamId);
            batch.update(teamDocRef, { shooterIds: arrayUnion(newShooterRef.id) });
            console.log(`>>> shooters/handleSubmit: Scheduled update for team ${queryTeamId} to add new shooter ${newShooterRef.id}`);
        }
        toast({ title: "Schütze erstellt", description: `${finalShooterData.name} wurde erfolgreich angelegt.` });

      } else if (formMode === 'edit' && currentShooter.id) {
        console.log(`>>> shooters/handleSubmit: Attempting to update shooter document ${currentShooter.id}...`);
        const shooterDocRef = doc(db, SHOOTERS_COLLECTION, currentShooter.id);
        batch.update(shooterDocRef, shooterDataToSave); 
        console.log(`>>> shooters/handleSubmit: Shooter document ${currentShooter.id} scheduled for update.`);
        toast({ title: "Schütze aktualisiert", description: `${shooterDataToSave.name} wurde erfolgreich aktualisiert.` });
      }

      await batch.commit();
      console.log(">>> shooters/handleSubmit: Batch committed.");

      setIsFormOpen(false);
      setCurrentShooter(null);
      fetchClubsAndShooters(); 
    } catch (error) {
      console.error(">>> shooters/handleSubmit: Error saving shooter: ", error);
      toast({ title: `Fehler beim ${formMode === 'new' ? 'Erstellen' : 'Aktualisieren'}`, description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsLoading(false);
      console.log(">>> shooters/handleSubmit: Finished.");
    }
  };

  const handleFormInputChange = (field: keyof Pick<Shooter, 'firstName' | 'lastName' | 'clubId' | 'gender'>, value: string) => {
     setCurrentShooter(prev => prev ? ({ ...prev, [field]: value }) : null);
  };
  
  const getClubName = (clubId: string): string => {
    return allClubs.find(c => c.id === clubId)?.name || 'Unbekannt';
  };

  const getTeamInfoForShooter = (shooter: Shooter): string => {
    const teamIds = shooter.teamIds || [];
    if (teamIds.length === 0) return '-';
    
    if (queryTeamId && contextTeamName && teamIds.includes(queryTeamId)) {
        const otherTeamCount = teamIds.filter(id => id !== queryTeamId).length;
        return otherTeamCount > 0 ? `${contextTeamName} (+${otherTeamCount} weitere)` : contextTeamName;
    }
    return `${teamIds.length} Mannschaft(en) zugeordnet`; 
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
            Schützen für {selectedClubNameForTitle}
          </CardTitle>
          <CardDescription>
            Verwalten Sie hier alle Schützen. 
            {contextTeamName ? ` (Aktueller Kontext: Mannschaft "${contextTeamName}")` : (queryTeamId && !contextTeamName ? ` (Aktueller Kontext: Mannschaft ID ${queryTeamId} - Name lädt...)` : '')}
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
                  <TableHead>Mannschaften (Info)</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredShooters.map((shooter) => (
                  <TableRow key={shooter.id}>
                    <TableCell>{shooter.firstName} {shooter.lastName}</TableCell>
                    <TableCell>{getClubName(shooter.clubId)}</TableCell>
                    <TableCell>{shooter.gender === 'male' ? 'Männlich' : (shooter.gender === 'female' ? 'Weiblich' : 'N/A')}</TableCell>
                    <TableCell className="text-xs">{getTeamInfoForShooter(shooter)}</TableCell>
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
               {allClubs.length > 0 && <p className="text-sm">Klicken Sie auf "Neuen Schützen anlegen", um zu beginnen.</p>}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={(open) => { setIsFormOpen(open); if (!open) setCurrentShooter(null); }}>
        <DialogContent className="sm:max-w-lg"> 
          <form onSubmit={handleSubmit}>
            <DialogHeader>
                <DialogTitle>{formMode === 'new' ? 'Neuen Schützen anlegen' : 'Schütze bearbeiten'}</DialogTitle>
                <DialogDescription>
                    {formMode === 'new' && contextTeamName 
                        ? `Schütze wird initial der Mannschaft "${contextTeamName}" zugeordnet.` 
                        : (formMode === 'new' && queryTeamId && !contextTeamName ? `Schütze wird initial der Mannschaft mit ID ${queryTeamId} zugeordnet.` : 'Tragen Sie die Daten des Schützen ein.')
                    }
                </DialogDescription>
            </DialogHeader>
            {currentShooter && (
                <div className="grid gap-y-4 py-4"> 
                  <div className="grid grid-cols-4 items-center gap-x-4"> 
                      <Label htmlFor="firstName" className="text-right col-span-1">Vorname</Label>
                      <Input id="firstName" value={currentShooter.firstName || ''} onChange={(e) => handleFormInputChange('firstName', e.target.value)} className="col-span-3" required />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-x-4"> 
                      <Label htmlFor="lastName" className="text-right col-span-1">Nachname</Label>
                      <Input id="lastName" value={currentShooter.lastName || ''} onChange={(e) => handleFormInputChange('lastName', e.target.value)} className="col-span-3" required />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-x-4"> 
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
                  <div className="grid grid-cols-4 items-center gap-x-4"> 
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
                  {formMode === 'edit' && (
                      <div className="col-span-4 text-xs text-muted-foreground p-2 rounded-md bg-secondary/30 mt-2">
                          Aktuelle Mannschafts-Zuordnungen (Info): {getTeamInfoForShooter(currentShooter as Shooter)}. 
                          Die Zuordnung zu Mannschaften erfolgt über die Mannschaftsverwaltung.
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
                Möchten Sie den Schützen "{shooterToDelete.firstName} {shooterToDelete.lastName}" wirklich endgültig löschen? Diese Aktion kann nicht rückgängig gemacht werden und entfernt den Schützen auch aus allen zugeordneten Mannschaften.
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
