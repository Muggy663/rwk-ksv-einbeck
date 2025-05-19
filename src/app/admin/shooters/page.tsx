
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
const MAX_SHOOTERS_PER_TEAM = 3;

type TeamWithShooterCount = Team & { currentShooterCount: number };

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
  const [isContextTeamNameLoading, setIsContextTeamNameLoading] = useState<boolean>(false);
  
  const [isLoading, setIsLoading] = useState(true); 
  const [isFormLoading, setIsFormLoading] = useState(false); 
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentShooter, setCurrentShooter] = useState<Partial<Shooter> & { id?: string } | null>(null);
  const [formMode, setFormMode] = useState<'new' | 'edit'>('new');
  
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [shooterToDelete, setShooterToDelete] = useState<Shooter | null>(null);

  const [selectedClubIdFilter, setSelectedClubIdFilter] = useState<string>(ALL_CLUBS_FILTER_VALUE);

  const [teamsOfSelectedClubInDialog, setTeamsOfSelectedClubInDialog] = useState<TeamWithShooterCount[]>([]);
  const [isLoadingTeamsForDialog, setIsLoadingTeamsForDialog] = useState(false);
  const [selectedTeamIdsInForm, setSelectedTeamIdsInForm] = useState<string[]>([]);

  useEffect(() => {
    const fetchContextTeamName = async () => {
      if (queryTeamId) {
        console.log(">>> shooters/useEffect.fetchContextTeamName: Fetching team name for teamId:", queryTeamId);
        setIsContextTeamNameLoading(true);
        setContextTeamName(null); 
        try {
          const teamDocRef = doc(db, TEAMS_COLLECTION, queryTeamId);
          const teamSnap = await getFirestoreDoc(teamDocRef);
          if (teamSnap.exists()) {
            const teamName = (teamSnap.data() as Team).name;
            setContextTeamName(teamName);
            console.log(">>> shooters/useEffect.fetchContextTeamName: Context team name set to:", teamName);
          } else {
            setContextTeamName(null); 
            console.warn(">>> shooters/useEffect.fetchContextTeamName: Team not found for ID:", queryTeamId);
            // toast({ title: "Fehler", description: `Kontext-Mannschaft mit ID ${queryTeamId} nicht gefunden.`, variant: "destructive" });
          }
        } catch (error) {
          console.error(">>> shooters/useEffect.fetchContextTeamName: Error fetching context team name: ", error);
          setContextTeamName(null);
          // toast({ title: "Fehler", description: "Name der Kontext-Mannschaft konnte nicht geladen werden.", variant: "destructive" });
        } finally {
          setIsContextTeamNameLoading(false);
        }
      } else {
        setContextTeamName(null);
        setIsContextTeamNameLoading(false);
      }
    };
    fetchContextTeamName();
  }, [queryTeamId, toast]);

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
      } else if (queryTeamId && !queryClubIdFromParams) {
        const teamDocRef = doc(db, TEAMS_COLLECTION, queryTeamId);
        const teamSnap = await getFirestoreDoc(teamDocRef);
        if (teamSnap.exists() && teamSnap.data()?.clubId) {
          const teamClubId = teamSnap.data()?.clubId;
          if (fetchedClubs.some(c => c.id === teamClubId)) {
             setSelectedClubIdFilter(teamClubId);
          }
        }
      }

      const shootersSnapshot = await getDocs(query(collection(db, SHOOTERS_COLLECTION), orderBy("lastName", "asc"), orderBy("firstName", "asc")));
      const fetchedShooters: Shooter[] = shootersSnapshot.docs.map(docData => ({ id: docData.id, ...docData.data(), teamIds: docData.data().teamIds || [] } as Shooter));
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
          console.log(`>>> shooters/dialog.fetchTeams: Fetching teams for clubId ${currentShooter.clubId}`);
          const teamsQuery = query(collection(db, TEAMS_COLLECTION), where("clubId", "==", currentShooter.clubId), orderBy("name", "asc"));
          const snapshot = await getDocs(teamsQuery);
          
          const fetchedTeamsPromises = snapshot.docs.map(async (d) => {
            const teamData = d.data() as Team;
            const currentShooterIds = (teamData.shooterIds || []) as string[];
            return { id: d.id, ...teamData, currentShooterCount: currentShooterIds.length };
          });
          const fetchedTeams = await Promise.all(fetchedTeamsPromises);

          setTeamsOfSelectedClubInDialog(fetchedTeams);
          console.log(`>>> shooters/dialog.fetchTeams: Fetched ${fetchedTeams.length} teams for club ${currentShooter.clubId}.`);
          
          if (queryTeamId && fetchedTeams.some(t => t.id === queryTeamId)) {
            const contextTeam = fetchedTeams.find(t => t.id === queryTeamId);
            if (contextTeam && contextTeam.currentShooterCount < MAX_SHOOTERS_PER_TEAM) {
                 setSelectedTeamIdsInForm([queryTeamId]);
            } else if (contextTeam) { 
                 toast({title: "Mannschaft voll", description: `Die Kontext-Mannschaft "${contextTeam.name}" hat bereits die maximale Anzahl von ${MAX_SHOOTERS_PER_TEAM} Schützen.`, variant: "warning", duration: 5000});
                 setSelectedTeamIdsInForm([]);
            } else { 
                setSelectedTeamIdsInForm([]);
            }
          } else {
             setSelectedTeamIdsInForm([]); 
          }
        } catch (error) {
          console.error(">>> shooters/dialog.fetchTeams: Error fetching teams for club in dialog:", error);
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
    
    let resolvedInitialClubId = '';
    if (selectedClubIdFilter !== ALL_CLUBS_FILTER_VALUE && allClubs.some(c => c.id === selectedClubIdFilter)) {
        resolvedInitialClubId = selectedClubIdFilter;
    } else if (queryClubIdFromParams && allClubs.some(c => c.id === queryClubIdFromParams)) {
        resolvedInitialClubId = queryClubIdFromParams;
    }
      
    setCurrentShooter({ 
      firstName: '', 
      lastName: '', 
      clubId: resolvedInitialClubId, 
      gender: 'male',
      teamIds: queryTeamId ? [queryTeamId] : [],
    });
    setSelectedTeamIdsInForm(queryTeamId ? [queryTeamId] : []);
    setTeamsOfSelectedClubInDialog([]); 
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
    
    const shooterIdToDelete = shooterToDelete.id;
    console.log(`>>> shooters/handleDeleteShooter: Attempting to delete shooter ${shooterIdToDelete}`);
    setIsFormLoading(true); 
    try {
      const batch = writeBatch(db);
      const shooterDocRef = doc(db, SHOOTERS_COLLECTION, shooterIdToDelete);

      const shooterData = (await getFirestoreDoc(shooterDocRef)).data() as Shooter | undefined;
      const teamsToUpdate = shooterData?.teamIds || [];

      if (teamsToUpdate.length > 0) {
        console.log(`>>> shooters/handleDeleteShooter: Removing shooter ${shooterIdToDelete} from ${teamsToUpdate.length} teams.`);
        teamsToUpdate.forEach(teamId => {
          const teamDocRef = doc(db, TEAMS_COLLECTION, teamId);
          batch.update(teamDocRef, { shooterIds: arrayRemove(shooterIdToDelete) }); 
        });
      }
      
      batch.delete(shooterDocRef); 
      console.log(`>>> shooters/handleDeleteShooter: Scheduled deletion of shooter document ${shooterIdToDelete} and updates to teams.`);
      
      await batch.commit();
      console.log(`>>> shooters/handleDeleteShooter: Batch committed. Shooter ${shooterIdToDelete} deleted and team associations removed.`);
      toast({ title: "Schütze gelöscht", description: `${shooterToDelete.firstName} ${shooterToDelete.lastName} wurde erfolgreich entfernt.` });
      await fetchClubsAndShooters(); 
    } catch (error) {
      console.error(">>> shooters/handleDeleteShooter: Error deleting shooter: ", error);
      toast({ title: "Fehler beim Löschen", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsFormLoading(false);
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
    
    const combinedName = `${currentShooter.firstName.trim()} ${currentShooter.lastName.trim()}`;
    
    const finalTeamIdsForShooterDoc = formMode === 'new' ? selectedTeamIdsInForm : (currentShooter.teamIds || []);

    const shooterDataToSave: Omit<Shooter, 'id'> = {
      firstName: currentShooter.firstName.trim(),
      lastName: currentShooter.lastName.trim(),
      name: combinedName,
      clubId: currentShooter.clubId,
      gender: currentShooter.gender || 'male',
      teamIds: finalTeamIdsForShooterDoc, 
    };
    console.log(">>> shooters/handleSubmit: Shooter data to save:", shooterDataToSave);

    setIsFormLoading(true);
    const batch = writeBatch(db);
    try {
      const shootersCollectionRef = collection(db, SHOOTERS_COLLECTION);
      let duplicateQuery = query(shootersCollectionRef, 
        where("name", "==", shooterDataToSave.name), 
        where("clubId", "==", shooterDataToSave.clubId)
      );
      if (formMode === 'edit' && currentShooter.id) {
        duplicateQuery = query(shootersCollectionRef, 
          where("name", "==", shooterDataToSave.name), 
          where("clubId", "==", shooterDataToSave.clubId),
          where(documentId(), "!=", currentShooter.id)
        );
      }
      const duplicateSnapshot = await getDocs(duplicateQuery);
      if (!duplicateSnapshot.empty) {
        toast({ title: "Doppelter Schütze", description: `Ein Schütze mit dem Namen "${shooterDataToSave.name}" existiert bereits in diesem Verein.`, variant: "destructive"});
        console.warn(">>> shooters/handleSubmit: Duplicate shooter name found.");
        setIsFormLoading(false);
        return;
      }

      if (formMode === 'new') {
        const newShooterRef = doc(collection(db, SHOOTERS_COLLECTION));
        
        // Rule: A shooter can only be in one team for this season/type (implicitly handled by UI for now)
        // Rule: Max 3 shooters per team
        let actualTeamIdsForShooter = [];
        for (const teamId of finalTeamIdsForShooterDoc) {
          const teamDocRef = doc(db, TEAMS_COLLECTION, teamId);
          const teamSnap = await getFirestoreDoc(teamDocRef); 
          if (teamSnap.exists()) {
            const teamData = teamSnap.data() as Team;
            const currentTeamShooterIds = teamData.shooterIds || [];
            if (currentTeamShooterIds.length < MAX_SHOOTERS_PER_TEAM) {
              batch.update(teamDocRef, { shooterIds: arrayUnion(newShooterRef.id) });
              actualTeamIdsForShooter.push(teamId);
              console.log(`>>> shooters/handleSubmit (new): Adding shooter ${newShooterRef.id} to team ${teamId}`);
            } else {
               console.warn(`>>> shooters/handleSubmit (new): Team ${teamId} ("${teamData.name}") is full. Shooter ${newShooterRef.id} not added.`);
               toast({title: "Mannschaft voll", description: `Schütze konnte Mannschaft "${teamData.name}" nicht hinzugefügt werden (bereits ${MAX_SHOOTERS_PER_TEAM} Schützen).`, variant: "warning", duration: 5000});
            }
          } else {
            console.warn(`>>> shooters/handleSubmit (new): Team ${teamId} not found. Shooter ${newShooterRef.id} not added to this team.`);
          }
        }
        const finalShooterData = { ...shooterDataToSave, teamIds: actualTeamIdsForShooter };
        batch.set(newShooterRef, finalShooterData); 

        toast({ title: "Schütze erstellt", description: `${finalShooterData.name} wurde erfolgreich angelegt.` });

      } else if (formMode === 'edit' && currentShooter.id) {
        const shooterDocRef = doc(db, SHOOTERS_COLLECTION, currentShooter.id);
        const { teamIds, ...editableShooterData } = shooterDataToSave; 
        const dataForUpdate: Partial<Shooter> = {
            firstName: editableShooterData.firstName,
            lastName: editableShooterData.lastName,
            name: editableShooterData.name,
            gender: editableShooterData.gender,
        };
        if (currentShooter.clubId !== editableShooterData.clubId && formMode === 'edit') {
          toast({ title: "Vereinswechsel nicht erlaubt", description: "Der Verein eines bestehenden Schützen kann hier nicht geändert werden. Legen Sie ggf. einen neuen Schützen an.", variant: "warning" });
        } else {
           batch.update(shooterDocRef, dataForUpdate); 
           toast({ title: "Schütze aktualisiert", description: `${shooterDataToSave.name} wurde erfolgreich aktualisiert.` });
        }
      }

      console.log(">>> shooters/handleSubmit: Committing batch...");
      await batch.commit();
      console.log(">>> shooters/handleSubmit: Batch committed.");
      setIsFormOpen(false);
      setCurrentShooter(null);
      setSelectedTeamIdsInForm([]); 
      setTeamsOfSelectedClubInDialog([]); 
      await fetchClubsAndShooters(); 
    } catch (error) {
      console.error(">>> shooters/handleSubmit: Error saving shooter: ", error);
      const action = formMode === 'new' ? 'Erstellen' : 'Aktualisieren';
      toast({ title: `Fehler beim ${action}`, description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsFormLoading(false);
      console.log(">>> shooters/handleSubmit: Finished.");
    }
  };

  const handleFormInputChange = (field: keyof Pick<Shooter, 'firstName' | 'lastName' | 'clubId' | 'gender'>, value: string) => {
     setCurrentShooter(prev => {
        if (!prev) return null;
        const updatedShooter = { ...prev, [field]: value };
        if (field === 'clubId' && prev.clubId !== value) {
            setSelectedTeamIdsInForm([]); 
            console.log(">>> shooters/handleFormInputChange: ClubId changed in form, resetting selected team IDs.");
        }
        return updatedShooter;
     });
  };

  const handleTeamSelectionChangeInForm = (teamId: string, checked: boolean) => {
    const team = teamsOfSelectedClubInDialog.find(t => t.id === teamId);
    if (checked && team && team.currentShooterCount >= MAX_SHOOTERS_PER_TEAM && !selectedTeamIdsInForm.includes(teamId) ) {
        toast({
            title: "Mannschaft voll",
            description: `Die Mannschaft "${team.name}" hat bereits die maximale Anzahl von ${MAX_SHOOTERS_PER_TEAM} Schützen.`,
            variant: "destructive"
        });
        return; 
    }

    setSelectedTeamIdsInForm(prev =>
      checked ? [...prev, teamId] : prev.filter(id => id !== teamId)
    );
  };
  
  const getClubName = (clubId: string): string => {
    return allClubs.find(c => c.id === clubId)?.name || 'Unbekannt';
  };

 const getTeamInfoForShooter = (shooter: Shooter): string => {
    const teamIds = shooter.teamIds || [];
    
    if (isContextTeamNameLoading && queryTeamId) {
        return "Lädt Team-Info...";
    }

    if (queryTeamId && contextTeamName) {
        if (teamIds.includes(queryTeamId)) {
            const otherTeamCount = teamIds.filter(id => id !== queryTeamId).length;
            return otherTeamCount > 0 ? `${contextTeamName} (+${otherTeamCount} weitere)` : contextTeamName;
        } else {
             // Context teamId is present, but shooter is not in this specific context team
             if (teamIds.length === 0) return '-';
             if (teamIds.length === 1) return `1 andere Mannschaft zugeordnet`;
             return `${teamIds.length} andere Mannschaften zugeordnet`;
        }
    }
    
    // General view (no queryTeamId or contextTeamName not resolved yet)
    if (teamIds.length === 0) return '-';
    if (teamIds.length === 1) return "1 Mannschaft zugeordnet"; // Could potentially fetch name here in future
    return `${teamIds.length} Mannschaften zugeordnet`; 
  };

  const selectedClubObject = allClubs.find(c => c.id === selectedClubIdFilter);
  const selectedClubNameForTitle = selectedClubObject ? selectedClubObject.name : 'aller Vereine';
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
        <h1 className="text-2xl font-semibold text-primary">Schützenverwaltung</h1>
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto">
           <Select value={selectedClubIdFilter} onValueChange={setSelectedClubIdFilter} disabled={allClubs.length === 0 && isLoading}>
            <SelectTrigger className="w-full sm:w-[220px]" aria-label="Verein filtern">
              <SelectValue placeholder={isLoading && allClubs.length === 0 ? "Lade Vereine..." : "Verein filtern"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_CLUBS_FILTER_VALUE}>Alle Vereine</SelectItem>
              {allClubs.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={handleAddNew} disabled={allClubs.length === 0 && !isLoading} className="w-full sm:w-auto whitespace-nowrap">
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
            {queryTeamId && contextTeamName && ` (Aktueller Kontext: Mannschaft "${contextTeamName}")`}
            {queryTeamId && isContextTeamNameLoading && ` (Lade Kontext für Mannschaft ID ${queryTeamId}...)`}
            {queryTeamId && !contextTeamName && !isContextTeamNameLoading && ` (Kontext-Mannschaft ID ${queryTeamId} nicht gefunden oder Name nicht geladen)`}
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
                  <TableHead>Nachname</TableHead>
                  <TableHead>Vorname</TableHead>
                  <TableHead>Verein</TableHead>
                  <TableHead>Geschlecht</TableHead>
                  <TableHead>Mannschaften (Info)</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredShooters.map((shooter) => (
                  <TableRow key={shooter.id}>
                    <TableCell>{shooter.lastName}</TableCell>
                    <TableCell>{shooter.firstName}</TableCell>
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
                        : 'Bearbeiten Sie die Daten des Schützen.'
                    }
                    {formMode === 'new' && queryTeamId && contextTeamName && 
                        ` Der Schütze wird initial der Mannschaft "${contextTeamName}" zugeordnet, falls diese unten ausgewählt wird und zum gewählten Verein passt.`
                    }
                    {formMode === 'new' && queryTeamId && isContextTeamNameLoading &&
                        ` Lade Infos für Kontext-Mannschaft ID ${queryTeamId}...`
                    }
                </DialogDescription>
            </DialogHeader>
            {currentShooter && (
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="lastName">Nachname</Label>
                  <Input id="lastName" value={currentShooter.lastName || ''} onChange={(e) => handleFormInputChange('lastName', e.target.value)} required className="mt-1.5" />
                </div>
                <div>
                  <Label htmlFor="firstName">Vorname</Label>
                  <Input id="firstName" value={currentShooter.firstName || ''} onChange={(e) => handleFormInputChange('firstName', e.target.value)} required className="mt-1.5" />
                </div>
                <div>
                  <Label htmlFor="clubIdForm">Verein</Label>
                  <Select 
                    value={currentShooter.clubId || ''} 
                    onValueChange={(value) => handleFormInputChange('clubId', value)}
                    required
                    disabled={allClubs.length === 0 || (formMode === 'edit' && !!currentShooter.clubId && currentShooter.clubId !== '')} 
                  >
                    <SelectTrigger id="clubIdForm" aria-label="Verein auswählen" className="mt-1.5">
                      <SelectValue placeholder={allClubs.length === 0 ? "Keine Vereine" : "Verein wählen"}/>
                    </SelectTrigger>
                    <SelectContent>
                      {allClubs.map(club => <SelectItem key={club.id} value={club.id}>{club.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {formMode === 'edit' && <p className="text-xs text-muted-foreground mt-1">Die Vereinszuordnung kann für bestehende Schützen hier nicht geändert werden.</p>}
                </div>
                <div>
                  <Label htmlFor="gender">Geschlecht</Label>
                  <Select 
                    value={currentShooter.gender || 'male'} 
                    onValueChange={(value) => handleFormInputChange('gender', value as 'male' | 'female')}
                    className="mt-1.5"
                  >
                    <SelectTrigger id="gender" aria-label="Geschlecht auswählen">
                      <SelectValue placeholder="Geschlecht wählen"/>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Männlich</SelectItem>
                      <SelectItem value="female">Weiblich</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formMode === 'new' && currentShooter.clubId && (
                  <div className="space-y-2 mt-3 p-3 border rounded-md bg-muted/30">
                    <Label>Mannschaften für "{allClubs.find(c => c.id === currentShooter.clubId)?.name}" zuordnen (optional, max {MAX_SHOOTERS_PER_TEAM} pro Team)</Label>
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
                              disabled={(team.currentShooterCount >= MAX_SHOOTERS_PER_TEAM && !selectedTeamIdsInForm.includes(team.id))}
                            />
                            <Label htmlFor={`team-assign-${team.id}`} className={`font-normal ${team.currentShooterCount >= MAX_SHOOTERS_PER_TEAM && !selectedTeamIdsInForm.includes(team.id) ? 'text-muted-foreground line-through cursor-not-allowed' : 'cursor-pointer'}`}>
                              {team.name} 
                              <span className='text-xs text-muted-foreground'> ({team.currentShooterCount}/{MAX_SHOOTERS_PER_TEAM})</span>
                              {(team.currentShooterCount >= MAX_SHOOTERS_PER_TEAM && !selectedTeamIdsInForm.includes(team.id)) && <span className="text-xs text-destructive ml-1">(Voll)</span>}
                            </Label>
                          </div>
                        ))}
                      </ScrollArea>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        {currentShooter.clubId && !isLoadingTeamsForDialog 
                          ? "Keine Mannschaften für diesen Verein gefunden."
                          : "Bitte zuerst einen Verein auswählen, um Mannschaften anzuzeigen."}
                      </p>
                    )}
                  </div>
                )}

                {formMode === 'edit' && (
                  <div className="text-xs text-muted-foreground p-3 rounded-md bg-secondary/30 mt-3">
                    <p className="font-medium mb-1">Aktuelle Mannschafts-Zuordnungen:</p>
                    <p>{getTeamInfoForShooter(currentShooter as Shooter)}</p>
                    <p className="mt-1">Die Zuordnung zu Mannschaften erfolgt primär über die Mannschaftsverwaltung.</p>
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

