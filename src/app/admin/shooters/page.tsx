
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
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSearchParams, useRouter } from 'next/navigation';
import type { Shooter, Club, Team } from '@/types/rwk';
import { db } from '@/lib/firebase/config';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where, orderBy, documentId, getDoc as getFirestoreDoc, writeBatch, arrayUnion, arrayRemove } from 'firebase/firestore';
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
  const [isFormLoading, setIsFormLoading] = useState(false); 
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentShooter, setCurrentShooter] = useState<Partial<Shooter> & { id?: string } | null>(null);
  const [formMode, setFormMode] = useState<'new' | 'edit'>('new');
  
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [shooterToDelete, setShooterToDelete] = useState<Shooter | null>(null);

  const [selectedClubIdFilter, setSelectedClubIdFilter] = useState<string>(ALL_CLUBS_FILTER_VALUE);

  const [teamsOfSelectedClubInDialog, setTeamsOfSelectedClubInDialog] = useState<Team[]>([]);
  const [isLoadingTeamsForDialog, setIsLoadingTeamsForDialog] = useState(false);
  const [selectedTeamIdsInForm, setSelectedTeamIdsInForm] = useState<string[]>([]);


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
    }
  };

  useEffect(() => {
    fetchClubsAndShooters();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  useEffect(() => {
    console.log(">>> shooters/useEffect[selectedClubIdFilter, shooters]: Filtering shooters. Selected clubId:", selectedClubIdFilter);
    if (selectedClubIdFilter === ALL_CLUBS_FILTER_VALUE) {
      setFilteredShooters(shooters);
    } else {
      const newFiltered = shooters.filter(s => s.clubId === selectedClubIdFilter);
      setFilteredShooters(newFiltered);
    }
  }, [selectedClubIdFilter, shooters]);

  useEffect(() => {
    const fetchTeamsForNewShooterDialog = async () => {
      if (isFormOpen && formMode === 'new' && currentShooter?.clubId) {
        setIsLoadingTeamsForDialog(true);
        setTeamsOfSelectedClubInDialog([]); 
        try {
          console.log(`>>> shooters/dialog: Fetching teams for clubId ${currentShooter.clubId}`);
          const teamsQuery = query(collection(db, TEAMS_COLLECTION), where("clubId", "==", currentShooter.clubId), orderBy("name", "asc"));
          const snapshot = await getDocs(teamsQuery);
          const fetchedTeams = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Team));
          setTeamsOfSelectedClubInDialog(fetchedTeams);
          console.log(`>>> shooters/dialog: Fetched ${fetchedTeams.length} teams for club ${currentShooter.clubId}.`);
          
          if (queryTeamId && fetchedTeams.some(t => t.id === queryTeamId)) {
            setSelectedTeamIdsInForm([queryTeamId]);
          } else {
             setSelectedTeamIdsInForm([]); 
          }
        } catch (error) {
          console.error(">>> shooters/dialog: Error fetching teams for club in dialog:", error);
          toast({ title: "Fehler", description: "Mannschaften für Vereinsauswahl konnten nicht geladen werden.", variant: "destructive" });
        } finally {
          setIsLoadingTeamsForDialog(false);
        }
      } else {
        setTeamsOfSelectedClubInDialog([]);
        if (formMode !== 'edit') { 
            setSelectedTeamIdsInForm([]);
        }
      }
    };

    fetchTeamsForNewShooterDialog();
  }, [isFormOpen, formMode, currentShooter?.clubId, queryTeamId, toast]);


  const handleAddNew = () => {
    if (allClubs.length === 0) {
      toast({ title: "Keine Vereine", description: "Bitte zuerst Vereine anlegen, um Schützen erstellen zu können.", variant: "destructive"});
      return;
    }
    setFormMode('new');
    const initialClubId = selectedClubIdFilter !== ALL_CLUBS_FILTER_VALUE 
      ? selectedClubIdFilter 
      : (queryClubIdFromParams || (allClubs.length > 0 ? allClubs[0].id : ''));
      
    setCurrentShooter({ 
      firstName: '', 
      lastName: '', 
      clubId: initialClubId, 
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
    setSelectedTeamIdsInForm(shooter.teamIds || []); 
    setTeamsOfSelectedClubInDialog([]); 
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
    
    setIsFormLoading(true); 
    try {
      const batch = writeBatch(db);
      const shooterDocRef = doc(db, SHOOTERS_COLLECTION, shooterToDelete.id);

      if (shooterToDelete.teamIds && shooterToDelete.teamIds.length > 0) {
        shooterToDelete.teamIds.forEach(teamId => {
          const teamDocRef = doc(db, TEAMS_COLLECTION, teamId);
          batch.update(teamDocRef, { shooterIds: arrayRemove(shooterToDelete.id) }); 
        });
      }
      
      batch.delete(shooterDocRef); 
      
      await batch.commit();
      toast({ title: "Schütze gelöscht", description: `${shooterToDelete.firstName} ${shooterToDelete.lastName} wurde erfolgreich entfernt.` });
      await fetchClubsAndShooters(); 
    } catch (error) {
      console.error(">>> shooters/handleDeleteShooter: Error deleting shooter: ", error);
      toast({ title: "Fehler beim Löschen", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsFormLoading(false);
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
    
    const shooterDataToSave: Omit<Shooter, 'id'> = {
      firstName: currentShooter.firstName.trim(),
      lastName: currentShooter.lastName.trim(),
      name: `${currentShooter.firstName.trim()} ${currentShooter.lastName.trim()}`,
      clubId: currentShooter.clubId,
      gender: currentShooter.gender || 'male',
      teamIds: selectedTeamIdsInForm, // In new mode, this comes from the form; in edit mode, it's not changed here.
    };

    setIsFormLoading(true);
    const batch = writeBatch(db);
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
          if (doc.id !== currentShooter.id) isDuplicate = true;
        });
      }

      if (isDuplicate) {
        toast({ title: "Doppelter Schütze", description: `Ein Schütze mit dem Namen "${shooterDataToSave.name}" existiert bereits in diesem Verein.`, variant: "destructive"});
        setIsFormLoading(false);
        return;
      }

      if (formMode === 'new') {
        const newShooterRef = doc(collection(db, SHOOTERS_COLLECTION));
        // For new shooter, save all fields including teamIds from the form
        batch.set(newShooterRef, { ...shooterDataToSave, id: newShooterRef.id }); 
        
        selectedTeamIdsInForm.forEach(teamId => {
          const teamDocRef = doc(db, TEAMS_COLLECTION, teamId);
          batch.update(teamDocRef, { shooterIds: arrayUnion(newShooterRef.id) });
        });
        toast({ title: "Schütze erstellt", description: `${shooterDataToSave.name} wurde erfolgreich angelegt.` });

      } else if (formMode === 'edit' && currentShooter.id) {
        const shooterDocRef = doc(db, SHOOTERS_COLLECTION, currentShooter.id);
        // For edit mode, only update core shooter data, teamIds are managed via team admin page
        const { teamIds, ...editableShooterData } = shooterDataToSave; 
        batch.update(shooterDocRef, editableShooterData); 
        toast({ title: "Schütze aktualisiert", description: `${shooterDataToSave.name} wurde erfolgreich aktualisiert.` });
      }

      await batch.commit();
      setIsFormOpen(false);
      setCurrentShooter(null);
      setSelectedTeamIdsInForm([]);
      setTeamsOfSelectedClubInDialog([]);
      await fetchClubsAndShooters(); 
    } catch (error) {
      console.error(">>> shooters/handleSubmit: Error saving shooter: ", error);
      toast({ title: `Fehler beim ${formMode === 'new' ? 'Erstellen' : 'Aktualisieren'}`, description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsFormLoading(false);
    }
  };

  const handleFormInputChange = (field: keyof Pick<Shooter, 'firstName' | 'lastName' | 'clubId' | 'gender'>, value: string) => {
     setCurrentShooter(prev => {
        if (!prev) return null;
        const updatedShooter = { ...prev, [field]: value };
        if (field === 'clubId' && formMode === 'new' && prev.clubId !== value) {
            setSelectedTeamIdsInForm([]); 
        }
        return updatedShooter;
     });
  };

  const handleTeamSelectionChangeInForm = (teamId: string, checked: boolean) => {
    setSelectedTeamIdsInForm(prev =>
      checked ? [...prev, teamId] : prev.filter(id => id !== teamId)
    );
  };
  
  const getClubName = (clubId: string): string => {
    return allClubs.find(c => c.id === clubId)?.name || 'Unbekannt';
  };

  const getTeamInfoForShooter = (shooter: Shooter): string => {
    const teamIds = shooter.teamIds || [];
    if (teamIds.length === 0) return '-';
    
    if (contextTeamName && queryTeamId && teamIds.includes(queryTeamId)) {
        const otherTeamCount = teamIds.filter(id => id !== queryTeamId).length;
        return otherTeamCount > 0 ? `${contextTeamName} (+${otherTeamCount} weitere)` : contextTeamName;
    }
    // Fallback if no specific context or shooter not in context team
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
            {contextTeamName ? ` (Aktueller Kontext: Team "${contextTeamName}")` : (queryTeamId && !contextTeamName ? ` (Kontext: Team ID ${queryTeamId} - Name lädt...)` : '')}
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
                    <TableCell>{shooter.name}</TableCell>
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

      <Dialog open={isFormOpen} onOpenChange={(open) => { setIsFormOpen(open); if (!open) { setCurrentShooter(null); setTeamsOfSelectedClubInDialog([]); setSelectedTeamIdsInForm([]); } }}>
        <DialogContent className="sm:max-w-lg"> 
          <form onSubmit={handleSubmit}>
            <DialogHeader>
                <DialogTitle>{formMode === 'new' ? 'Neuen Schützen anlegen' : 'Schütze bearbeiten'}</DialogTitle>
                <DialogDescription>
                    {formMode === 'new' 
                        ? 'Tragen Sie die Daten des Schützen ein und wählen Sie optional Mannschaften aus.'
                        : 'Bearbeiten Sie die Daten des Schützen. Mannschaftszuordnungen erfolgen über die Mannschaftsverwaltung.'
                    }
                    {formMode === 'new' && contextTeamName && 
                        ` Der Schütze wird initial der Mannschaft "${contextTeamName}" zugeordnet.`
                    }
                </DialogDescription>
            </DialogHeader>
            {currentShooter && (
                <div className="grid gap-4 py-4"> {/* Main container for form rows with vertical gap */}
                  <div className="grid grid-cols-4 items-center gap-4"> {/* Row for Vorname */}
                      <Label htmlFor="firstName" className="text-right col-span-1">Vorname</Label>
                      <Input id="firstName" value={currentShooter.firstName || ''} onChange={(e) => handleFormInputChange('firstName', e.target.value)} className="col-span-3" required />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4"> {/* Row for Nachname */}
                      <Label htmlFor="lastName" className="text-right col-span-1">Nachname</Label>
                      <Input id="lastName" value={currentShooter.lastName || ''} onChange={(e) => handleFormInputChange('lastName', e.target.value)} className="col-span-3" required />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4"> {/* Row for Verein */}
                      <Label htmlFor="clubIdForm" className="text-right col-span-1">Verein</Label>
                      <Select 
                          value={currentShooter.clubId || ''} 
                          onValueChange={(value) => handleFormInputChange('clubId', value)}
                          required
                          disabled={allClubs.length === 0 || (formMode === 'edit' && !!currentShooter.clubId)}
                      >
                          <SelectTrigger id="clubIdForm" className="col-span-3" aria-label="Verein auswählen">
                              <SelectValue placeholder={allClubs.length === 0 ? "Keine Vereine" : "Verein wählen"}/>
                          </SelectTrigger>
                          <SelectContent>
                              {allClubs.map(club => <SelectItem key={club.id} value={club.id}>{club.name}</SelectItem>)}
                          </SelectContent>
                      </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4"> {/* Row for Geschlecht */}
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

                  {formMode === 'new' && currentShooter.clubId && (
                    <div className="col-span-4 space-y-2 mt-2 p-3 border rounded-md bg-muted/30">
                        <Label>Mannschaften für "{allClubs.find(c => c.id === currentShooter.clubId)?.name}" zuordnen (optional)</Label>
                        {isLoadingTeamsForDialog ? (
                            <div className="flex items-center"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Lade Mannschaften...</div>
                        ) : teamsOfSelectedClubInDialog.length > 0 ? (
                            <ScrollArea className="h-32">
                                {teamsOfSelectedClubInDialog.map(team => (
                                    <div key={team.id} className="flex items-center space-x-2 py-1">
                                        <Checkbox
                                            id={`team-assign-${team.id}`}
                                            checked={selectedTeamIdsInForm.includes(team.id)}
                                            onCheckedChange={(checked) => handleTeamSelectionChangeInForm(team.id, !!checked)}
                                        />
                                        <Label htmlFor={`team-assign-${team.id}`} className="font-normal">{team.name}</Label>
                                    </div>
                                ))}
                            </ScrollArea>
                        ) : (
                            <p className="text-sm text-muted-foreground">Keine Mannschaften für diesen Verein gefunden oder Verein noch nicht ausgewählt.</p>
                        )}
                    </div>
                  )}

                  {formMode === 'edit' && (
                      <div className="col-span-4 text-xs text-muted-foreground p-2 rounded-md bg-secondary/30 mt-2">
                          Aktuelle Mannschafts-Zuordnungen: {getTeamInfoForShooter(currentShooter as Shooter)}. 
                          Die Zuordnung zu Mannschaften erfolgt primär über die Mannschaftsverwaltung.
                      </div>
                  )}
                </div>
            )}
            <DialogFooter>
                <Button type="button" variant="outline" onClick={() => { setIsFormOpen(false); setCurrentShooter(null); setTeamsOfSelectedClubInDialog([]); setSelectedTeamIdsInForm([]);}}>Abbrechen</Button>
                <Button type="submit" disabled={isFormLoading || (formMode === 'new' && isLoadingTeamsForDialog)}>
                    {(isFormLoading || (formMode === 'new' && isLoadingTeamsForDialog)) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
                disabled={isFormLoading && isAlertOpen} 
              >
                {(isFormLoading && isAlertOpen) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Endgültig löschen
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}

