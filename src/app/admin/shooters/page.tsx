
// src/app/admin/shooters/page.tsx
"use client";
import React, { useState, useEffect, FormEvent, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Edit, Trash2, UserCircle as UserIcon, Loader2, AlertTriangle } from 'lucide-react';
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
  DialogDescription as DialogDescriptionComponent,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSearchParams, useRouter } from 'next/navigation';
import type { Shooter, Club, Team, FirestoreLeagueSpecificDiscipline, League, TeamValidationInfo } from '@/types/rwk';
import { MAX_SHOOTERS_PER_TEAM, getDisciplineCategory, leagueDisciplineOptions, GEWEHR_DISCIPLINES, PISTOL_DISCIPLINES } from '@/types/rwk';
import { db } from '@/lib/firebase/config';
import { 
  collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, 
  where, orderBy, documentId, writeBatch, getDoc as getFirestoreDoc, arrayRemove, arrayUnion, Timestamp
} from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

const SHOOTERS_COLLECTION = "rwk_shooters";
const TEAMS_COLLECTION = "rwk_teams";
const CLUBS_COLLECTION = "clubs";
const LEAGUES_COLLECTION = "rwk_leagues"; // Für das Laden von Liga-Typen
const ALL_CLUBS_FILTER_VALUE = "__ALL_CLUBS__";

export default function AdminShootersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryTeamId = searchParams.get('teamId');
  const queryClubIdFromParams = searchParams.get('clubId');

  const { toast } = useToast();

  const [allClubs, setAllClubs] = useState<Club[]>([]);
  const [allLeagues, setAllLeagues] = useState<League[]>([]); 
  const [allTeamsData, setAllTeamsData] = useState<Team[]>([]); 
  const [shooters, setShooters] = useState<Shooter[]>([]);
  const [filteredShooters, setFilteredShooters] = useState<Shooter[]>([]);

  const [contextTeamName, setContextTeamName] = useState<string | null>(null);
  const [isContextTeamNameLoading, setIsContextTeamNameLoading] = useState<boolean>(false);

  const [isLoading, setIsLoading] = useState(true); 
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [shooterToDelete, setShooterToDelete] = useState<Shooter | null>(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentShooter, setCurrentShooter] = useState<Partial<Shooter> & { id?: string } | null>(null);
  const [formMode, setFormMode] = useState<'new' | 'edit'>('new');

  const [selectedClubIdFilter, setSelectedClubIdFilter] = useState<string>(ALL_CLUBS_FILTER_VALUE);

  const [teamsOfSelectedClubInDialog, setTeamsOfSelectedClubInDialog] = useState<TeamValidationInfo[]>([]);
  const [isLoadingTeamsForDialog, setIsLoadingTeamsForDialog] = useState(false);
  const [selectedTeamIdsInForm, setSelectedTeamIdsInForm] = useState<string[]>([]);


  const fetchInitialData = useCallback(async () => {
    console.log("AdminShootersPage: Fetching initial data (clubs, shooters, all leagues, all teams)...");
    setIsLoading(true);
    try {
      const clubsSnapshotPromise = getDocs(query(collection(db, CLUBS_COLLECTION), orderBy("name", "asc")));
      const shootersSnapshotPromise = getDocs(query(collection(db, SHOOTERS_COLLECTION), orderBy("lastName", "asc"), orderBy("firstName", "asc")));
      const allTeamsSnapshotPromise = getDocs(query(collection(db, TEAMS_COLLECTION), orderBy("name", "asc")));
      const allLeaguesSnapshotPromise = getDocs(query(collection(db, LEAGUES_COLLECTION), orderBy("name", "asc"))); 

      const [clubsSnapshot, shootersSnapshot, allTeamsSnapshot, allLeaguesSnapshot] = await Promise.all([
        clubsSnapshotPromise, shootersSnapshotPromise, allTeamsSnapshotPromise, allLeaguesSnapshotPromise
      ]);

      const fetchedClubs = clubsSnapshot.docs.map(docData => ({ id: docData.id, ...docData.data() } as Club));
      setAllClubs(fetchedClubs);

      const fetchedShooters = shootersSnapshot.docs.map(docData => ({ id: docData.id, ...docData.data(), teamIds: docData.data().teamIds || [] } as Shooter));
      setShooters(fetchedShooters);
      
      const fetchedAllTeams = allTeamsSnapshot.docs.map(docData => ({ id: docData.id, ...docData.data() } as Team));
      setAllTeamsData(fetchedAllTeams);

      const fetchedAllLeagues = allLeaguesSnapshot.docs.map(docData => ({ id: docData.id, ...docData.data() } as League));
      setAllLeagues(fetchedAllLeagues);


      let initialClubFilter = ALL_CLUBS_FILTER_VALUE;
      if (queryClubIdFromParams && fetchedClubs.some(c => c.id === queryClubIdFromParams)) {
        initialClubFilter = queryClubIdFromParams;
      } else if (queryTeamId && !queryClubIdFromParams) {
        const teamForContext = fetchedAllTeams.find(t => t.id === queryTeamId);
        if (teamForContext?.clubId && fetchedClubs.some(c => c.id === teamForContext.clubId)) {
           initialClubFilter = teamForContext.clubId;
        }
      }
      setSelectedClubIdFilter(initialClubFilter);
      console.log("AdminShootersPage: Initial data fetched. Club filter set to:", initialClubFilter);

    } catch (error) {
      console.error("AdminShootersPage: Error fetching initial data: ", error);
      toast({ title: "Fehler beim Laden der Daten", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast, queryClubIdFromParams, queryTeamId]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const fetchContextTeamName = useCallback(async () => {
    if (queryTeamId) {
      setIsContextTeamNameLoading(true);
      const teamFromState = allTeamsData.find(t => t.id === queryTeamId);
      if (teamFromState) {
        setContextTeamName(teamFromState.name);
      } else {
         try {
            const teamDocRef = doc(db, TEAMS_COLLECTION, queryTeamId);
            const teamSnap = await getFirestoreDoc(teamDocRef);
            if (teamSnap.exists()) {
              setContextTeamName((teamSnap.data() as Team).name);
            } else {
              setContextTeamName(null);
            }
         } catch (err) {
            setContextTeamName(null);
         }
      }
      setIsContextTeamNameLoading(false);
    } else {
      setContextTeamName(null);
    }
  }, [queryTeamId, allTeamsData]);

  useEffect(() => {
    fetchContextTeamName();
  }, [fetchContextTeamName]);


  useEffect(() => {
    if (selectedClubIdFilter === ALL_CLUBS_FILTER_VALUE) {
      setFilteredShooters(shooters);
    } else {
      setFilteredShooters(shooters.filter(s => s.clubId === selectedClubIdFilter));
    }
  }, [selectedClubIdFilter, shooters]);

  const fetchTeamsForNewShooterDialog = useCallback(async (clubId: string) => {
    if (!clubId) {
      setTeamsOfSelectedClubInDialog([]);
      return;
    }
    setIsLoadingTeamsForDialog(true);
    try {
      const teamsQuery = query(collection(db, TEAMS_COLLECTION), where("clubId", "==", clubId), orderBy("name", "asc"));
      const snapshot = await getDocs(teamsQuery);
      
      const teamsData = snapshot.docs.map(teamDoc => {
        const teamData = teamDoc.data() as Team;
        const leagueInfo = allLeagues.find(l => l.id === teamData.leagueId);
        return {
          id: teamDoc.id,
          name: teamData.name,
          clubId: teamData.clubId,
          leagueId: teamData.leagueId,
          competitionYear: teamData.competitionYear,
          shooterIds: teamData.shooterIds || [],
          currentShooterCount: (teamData.shooterIds || []).length,
          leagueType: leagueInfo?.type, 
          leagueCompetitionYear: leagueInfo?.competitionYear, 
        } as TeamValidationInfo;
      });
      setTeamsOfSelectedClubInDialog(teamsData);

      // Vorselektion des Kontext-Teams, falls vorhanden und nicht voll
      if (queryTeamId) {
        const contextTeamForDialog = teamsData.find(t => t.id === queryTeamId);
        if (contextTeamForDialog && (contextTeamForDialog.currentShooterCount || 0) < MAX_SHOOTERS_PER_TEAM) {
             setSelectedTeamIdsInForm([queryTeamId]);
        } else if (contextTeamForDialog) { // Kontext-Team ist voll
             toast({title: "Mannschaft voll", description: `Die Kontext-Mannschaft "${contextTeamForDialog.name}" hat bereits die maximale Anzahl an Schützen.`, variant: "warning", duration: 5000});
             setSelectedTeamIdsInForm([]); // Keine Vorselektion
        }
      } else {
        setSelectedTeamIdsInForm([]); // Kein Kontext-Team, keine Vorselektion
      }

    } catch (error) {
      console.error("AdminShootersPage: DIALOG - Error fetching teams for club:", error);
      toast({ title: "Fehler", description: "Mannschaften für Dialog konnten nicht geladen werden.", variant: "destructive" });
    } finally {
      setIsLoadingTeamsForDialog(false);
    }
  }, [allLeagues, queryTeamId, toast]); 

  useEffect(() => {
    if (isFormOpen && formMode === 'new' && currentShooter?.clubId) {
      fetchTeamsForNewShooterDialog(currentShooter.clubId);
    } else if (isFormOpen && formMode === 'new' && !currentShooter?.clubId) {
      setTeamsOfSelectedClubInDialog([]);
      setSelectedTeamIdsInForm([]);
    }
  }, [isFormOpen, formMode, currentShooter?.clubId, fetchTeamsForNewShooterDialog]);


  const handleAddNewShooter = () => {
    if (allClubs.length === 0) {
      toast({ title: "Keine Vereine", description: "Bitte zuerst Vereine anlegen.", variant: "destructive"});
      return;
    }
    setFormMode('new');
    let initialClubIdForNewShooter = '';
    if (selectedClubIdFilter !== ALL_CLUBS_FILTER_VALUE && allClubs.some(c => c.id === selectedClubIdFilter)) {
        initialClubIdForNewShooter = selectedClubIdFilter;
    } else if (queryClubIdFromParams && allClubs.some(c => c.id === queryClubIdFromParams)) {
        initialClubIdForNewShooter = queryClubIdFromParams;
    }
    
    setCurrentShooter({
      firstName: '',
      lastName: '',
      clubId: initialClubIdForNewShooter,
      gender: 'male',
      teamIds: [], 
    });
    
    if (initialClubIdForNewShooter) {
      fetchTeamsForNewShooterDialog(initialClubIdForNewShooter);
    } else {
      setTeamsOfSelectedClubInDialog([]);
    }
    // Kontext Team nur vorselektieren, wenn der initialClubForNewShooter auch der Club des Kontext-Teams ist.
    const teamForContext = queryTeamId ? allTeamsData.find(t => t.id === queryTeamId) : null;
    if (teamForContext && teamForContext.clubId === initialClubIdForNewShooter && (teamForContext.shooterIds?.length || 0) < MAX_SHOOTERS_PER_TEAM) {
        setSelectedTeamIdsInForm([queryTeamId]);
    } else {
        setSelectedTeamIdsInForm([]);
    }
    setIsFormOpen(true);
  };

  const handleEditShooter = (shooter: Shooter) => {
    setFormMode('edit');
    setCurrentShooter(shooter);
    setSelectedTeamIdsInForm([]); 
    setTeamsOfSelectedClubInDialog([]); 
    setIsFormOpen(true);
  };

  const handleDeleteConfirmation = (shooter: Shooter) => {
    setShooterToDelete(shooter);
    setIsAlertOpen(true);
  };

  const handleDeleteShooter = async () => {
    if (!shooterToDelete || !shooterToDelete.id) return;
    setIsDeleting(true);
    try {
      const batch = writeBatch(db);
      batch.delete(doc(db, SHOOTERS_COLLECTION, shooterToDelete.id));
      (shooterToDelete.teamIds || []).forEach(teamId => {
        batch.update(doc(db, TEAMS_COLLECTION, teamId), { shooterIds: arrayRemove(shooterToDelete.id) });
      });
      await batch.commit();
      toast({ title: "Schütze gelöscht", description: `${shooterToDelete.name} wurde entfernt.` });
      fetchInitialData(); 
    } catch (error) {
      toast({ title: "Fehler beim Löschen", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsDeleting(false); setIsAlertOpen(false); setShooterToDelete(null);
    }
  };

  const handleSubmitShooterForm = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!currentShooter || !currentShooter.firstName?.trim() || !currentShooter.lastName?.trim() || !currentShooter.clubId) {
      toast({ title: "Ungültige Eingabe", description: "Vorname, Nachname und Verein sind erforderlich.", variant: "destructive" });
      return;
    }
    setIsFormSubmitting(true);
    const combinedName = `${currentShooter.firstName.trim()} ${currentShooter.lastName.trim()}`;

    try {
      const shootersColRef = collection(db, SHOOTERS_COLLECTION);
      let qDuplicate = query(shootersColRef, where("name", "==", combinedName), where("clubId", "==", currentShooter.clubId));
      if (formMode === 'edit' && currentShooter.id) {
        qDuplicate = query(shootersColRef, where("name", "==", combinedName), where("clubId", "==", currentShooter.clubId), where(documentId(), "!=", currentShooter.id));
      }
      const duplicateSnap = await getDocs(qDuplicate);
      if (!duplicateSnap.empty) {
        toast({ title: "Doppelter Schütze", description: `"${combinedName}" existiert bereits in diesem Verein.`, variant: "destructive"});
        setIsFormSubmitting(false); return;
      }

      const batch = writeBatch(db);
      if (formMode === 'new') {
        const assignedCategoriesPerYear: Record<string, { teamId: string; teamName: string; category: 'Gewehr' | 'Pistole' | 'UNKNOWN_DISCIPLINE_CATEGORY' }> = {};
        for (const teamId of selectedTeamIdsInForm) {
          const teamInfo = teamsOfSelectedClubInDialog.find(t => t.id === teamId);
          if (!teamInfo) continue; 
          
          // Wichtig: Nur validieren, wenn Team Liga-Infos hat
          if (teamInfo.leagueType && teamInfo.leagueCompetitionYear !== undefined) {
            const category = getDisciplineCategory(teamInfo.leagueType);
            if (!category) {
               // Wenn eine Liga zugeordnet ist, aber der Typ nicht bekannt ist, ist das ein Datenproblem
               // Wir sollten hier vielleicht einen Fehler werfen oder eine Warnung ausgeben.
               // Fürs Erste: Disziplin-Validierung für dieses Team überspringen, wenn Kategorie nicht ermittelbar.
               console.warn(`AdminShootersPage: handleSubmit (NEW) - Could not determine category for league type ${teamInfo.leagueType} of team ${teamInfo.name}. Skipping discipline validation for it.`);
            } else {
                const yearCategoryKey = `${teamInfo.leagueCompetitionYear}_${category}`;
                if (assignedCategoriesPerYear[yearCategoryKey]) {
                   toast({ title: "Regelverstoß", description: `Schütze kann nicht mehreren Teams der Kategorie '${category}' im Jahr ${teamInfo.leagueCompetitionYear} zugeordnet werden (Konflikt mit Team "${assignedCategoriesPerYear[yearCategoryKey].teamName}").`, variant: "destructive", duration: 8000 });
                   setIsFormSubmitting(false); return;
                }
                assignedCategoriesPerYear[yearCategoryKey] = {teamId, teamName: teamInfo.name, category};
            }
          }
        }

        const newShooterRef = doc(collection(db, SHOOTERS_COLLECTION));
        const shooterDataForSave: Omit<Shooter, 'id'> = {
          firstName: currentShooter.firstName.trim(), lastName: currentShooter.lastName.trim(), name: combinedName,
          clubId: currentShooter.clubId as string, gender: currentShooter.gender || 'male', teamIds: selectedTeamIdsInForm,
        };
        batch.set(newShooterRef, shooterDataForSave);
        selectedTeamIdsInForm.forEach(teamId => {
           batch.update(doc(db, TEAMS_COLLECTION, teamId), { shooterIds: arrayUnion(newShooterRef.id) });
        });
        toast({ title: "Schütze erstellt", description: `${shooterDataForSave.name} wurde angelegt.` });

      } else if (formMode === 'edit' && currentShooter.id) {
        const shooterDocRef = doc(db, SHOOTERS_COLLECTION, currentShooter.id);
        batch.update(shooterDocRef, {
          firstName: currentShooter.firstName.trim(), lastName: currentShooter.lastName.trim(), name: combinedName,
          gender: currentShooter.gender || 'male', 
        });
        toast({ title: "Schütze aktualisiert", description: `${combinedName} wurde aktualisiert.` });
      }
      await batch.commit();
      setIsFormOpen(false); setCurrentShooter(null); setSelectedTeamIdsInForm([]);
      fetchInitialData();
    } catch (error) {
      toast({ title: `Fehler beim Speichern`, description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsFormSubmitting(false);
    }
  };

  const handleFormInputChange = (field: keyof Pick<Shooter, 'firstName' | 'lastName' | 'clubId' | 'gender'>, value: string) => {
     setCurrentShooter(prev => {
        if (!prev) return null;
        const updatedShooter = { ...prev, [field]: value };
        if (field === 'clubId' && prev.clubId !== value && formMode === 'new') { 
            setSelectedTeamIdsInForm([]); 
            if (value) { 
              fetchTeamsForNewShooterDialog(value);
            } else {
              setTeamsOfSelectedClubInDialog([]);
            }
        }
        return updatedShooter;
     });
  };
  
  const handleTeamSelectionChangeInForm = (teamId: string, checked: boolean) => {
    const teamBeingChanged = teamsOfSelectedClubInDialog.find(t => t.id === teamId);

    // Wenn teamBeingChanged nicht gefunden wird ODER Liga-Infos fehlen, aber eine Zuweisung versucht wird,
    // dann ist das ein Indikator für unvollständige Daten für die Validierung.
    if (!teamBeingChanged) {
      toast({title: "Fehler", description: "Team-Informationen für Validierung nicht gefunden.", variant: "destructive"});
      return;
    }
    
    const categoryOfTeamBeingChanged = teamBeingChanged.leagueType ? getDisciplineCategory(teamBeingChanged.leagueType) : null; 
    
    if (checked) {
      if ((teamBeingChanged.currentShooterCount || 0) >= MAX_SHOOTERS_PER_TEAM) {
        toast({title: "Mannschaft voll", description: `Mannschaft "${teamBeingChanged.name}" ist bereits voll.`, variant: "warning"});
        return;
      }
      
      // Disziplin-Konflikt-Prüfung nur durchführen, wenn das aktuelle Team eine klare Kategorie und ein Wettkampfjahr hat
      if (categoryOfTeamBeingChanged && teamBeingChanged.leagueCompetitionYear !== undefined) {
          const conflict = selectedTeamIdsInForm.some(id => {
            if (id === teamId) return false;
            const otherTeam = teamsOfSelectedClubInDialog.find(t => t.id === id);
            // Nur prüfen, wenn otherTeam auch Liga-Infos hat und eine Kategorie hat
            return otherTeam && otherTeam.leagueType && getDisciplineCategory(otherTeam.leagueType) &&
                   otherTeam.leagueCompetitionYear === teamBeingChanged.leagueCompetitionYear &&
                   getDisciplineCategory(otherTeam.leagueType) === categoryOfTeamBeingChanged;
          });
          if (conflict) {
            toast({title: "Regelverstoß", description: `Schütze kann nicht mehreren Teams der Kategorie '${categoryOfTeamBeingChanged}' im Jahr ${teamBeingChanged.leagueCompetitionYear} zugeordnet werden.`, variant: "destructive", duration: 7000});
            return; 
          }
      } else if (teamBeingChanged.leagueId && !categoryOfTeamBeingChanged) {
          // Team ist einer Liga zugeordnet, aber Typ ist unbekannt. Warnung, aber keine Blockade.
          console.warn(`AdminShootersPage: Disziplinkonflikt für Team "${teamBeingChanged.name}" (Liga-ID: ${teamBeingChanged.leagueId}) nicht prüfbar, da der Ligatyp '${teamBeingChanged.leagueType}' keiner Kategorie (Gewehr/Pistole) zugeordnet werden konnte.`);
          // Hier keine Toast-Meldung für den User, da es ein Datenproblem sein könnte, aber die Zuweisung nicht zwingend blockieren.
      }
      // Wenn keine Liga zugeordnet (leagueId ist null/undefined), ist categoryOfTeamBeingChanged auch null, die Prüfung oben greift nicht.
      // Schütze kann Teams ohne Liga-Zuordnung hinzugefügt werden, solange nicht voll.
    }
    setSelectedTeamIdsInForm(prev =>
      checked ? [...prev, teamId] : prev.filter(id => id !== teamId)
    );
  };

  const getClubName = useCallback((clubId: string): string => {
    return allClubs.find(c => c.id === clubId)?.name || 'Unbekannt';
  }, [allClubs]);

  const getTeamInfoForShooter = useCallback((shooter: Shooter): string => {
    const teamIds = shooter.teamIds || [];
    if (teamIds.length === 0) return '-';

    if (contextTeamName && queryTeamId && teamIds.includes(queryTeamId)) {
      const otherTeamCount = teamIds.filter(id => id !== queryTeamId && allTeamsData.find(t => t.id === id)).length;
      return otherTeamCount > 0 ? `${contextTeamName} (+${otherTeamCount} weitere)` : contextTeamName;
    }
    
    const assignedTeamNames = teamIds
        .map(tid => allTeamsData.find(t => t.id === tid)?.name)
        .filter(name => !!name);

    if (assignedTeamNames.length === 1) return assignedTeamNames[0]!;
    if (assignedTeamNames.length > 1) return `${assignedTeamNames.length} Mannschaften`;
    
    return teamIds.length > 0 ? `${teamIds.length} (IDs nicht aufgelöst)` : '-';
  }, [allTeamsData, queryTeamId, contextTeamName]);

  const selectedClubNameForTitle = useMemo(() => {
    if (selectedClubIdFilter === ALL_CLUBS_FILTER_VALUE) return 'aller Vereine';
    return allClubs.find(c => c.id === selectedClubIdFilter)?.name || 'Unbekannt';
  }, [selectedClubIdFilter, allClubs]);


  if (isLoading) {
    return <div className="flex justify-center items-center py-10"><Loader2 className="h-12 w-12 animate-spin text-primary" /> <p className="ml-3">Lade Schützendaten...</p></div>;
  }

  return (
    <div className="space-y-6">
      {/* Header und Filter-UI */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h1 className="text-2xl font-semibold text-primary">Schützenverwaltung</h1>
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto">
           <Select
            value={selectedClubIdFilter}
            onValueChange={(value) => {
              setSelectedClubIdFilter(value);
              const newPath = value === ALL_CLUBS_FILTER_VALUE ? '/admin/shooters' : `/admin/shooters?clubId=${value}`;
              router.push(newPath, {scroll: false});
            }}
            disabled={allClubs.length === 0}
           >
            <SelectTrigger className="w-full sm:w-[220px]" aria-label="Verein filtern">
              <SelectValue placeholder={allClubs.length > 0 ? "Verein filtern" : "Keine Vereine"}/>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_CLUBS_FILTER_VALUE}>Alle Vereine</SelectItem>
              {allClubs.filter(c => c && typeof c.id === 'string' && c.id.trim() !== "").map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={handleAddNewShooter} disabled={allClubs.length === 0}>
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
            Verwalten Sie hier die Schützen. 
            {isContextTeamNameLoading && ` (Lade Kontext-Mannschaft Namen...)`}
            {!isContextTeamNameLoading && queryTeamId && contextTeamName && ` (Aktueller Kontext: Mannschaft "${contextTeamName}")`}
            {!isContextTeamNameLoading && queryTeamId && !contextTeamName && ` (Kontext-Team ID ${queryTeamId} nicht gefunden)`}
            {allClubs.length === 0 && <span className="text-destructive block mt-1"> Hinweis: Keine Vereine angelegt.</span>}
          </CardDescription>
        </CardHeader>
        <CardContent>
           {filteredShooters.length > 0 ? (
             <Table>
              <TableHeader><TableRow>
                  <TableHead>Nachname</TableHead><TableHead>Vorname</TableHead>
                  <TableHead>Verein</TableHead><TableHead>Geschlecht</TableHead>
                  <TableHead>Mannschaften (Info)</TableHead><TableHead className="text-right">Aktionen</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {filteredShooters.map((shooter) => (
                  <TableRow key={shooter.id}>
                    <TableCell>{shooter.lastName}</TableCell><TableCell>{shooter.firstName}</TableCell>
                    <TableCell>{getClubName(shooter.clubId)}</TableCell>
                    <TableCell>{shooter.gender === 'male' ? 'Männlich' : (shooter.gender === 'female' ? 'Weiblich' : 'N/A')}</TableCell>
                    <TableCell className="text-xs">{getTeamInfoForShooter(shooter)}</TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEditShooter(shooter)} disabled={isFormSubmitting || isDeleting}><Edit className="h-4 w-4" /></Button>
                      <AlertDialog open={isAlertOpen && shooterToDelete?.id === shooter.id} onOpenChange={(open) => {if(!open)setShooterToDelete(null); setIsAlertOpen(open);}}>
                          <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/80" onClick={() => handleDeleteConfirmation(shooter)} disabled={isFormSubmitting || isDeleting}><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader><AlertDialogTitle>Schütze löschen?</AlertDialogTitle><AlertDialogDescription>Möchten Sie "{shooterToDelete?.name}" wirklich löschen? Dies entfernt den Schützen auch aus allen zugeordneten Mannschaften dieses Vereins.</AlertDialogDescription></AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel onClick={() => {setIsAlertOpen(false); setShooterToDelete(null);}}>Abbrechen</AlertDialogCancel>
                              <AlertDialogAction onClick={handleDeleteShooter} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">{isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Löschen</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="p-6 text-center text-muted-foreground bg-secondary/30 rounded-md">
              <p className="text-lg">{selectedClubIdFilter !== ALL_CLUBS_FILTER_VALUE ? `Keine Schützen für "${selectedClubNameForTitle}" gefunden.` : 'Keine Schützen angelegt.'}</p>
               {allClubs.length > 0 && <p className="text-sm mt-1">Klicken Sie auf "Neuen Schützen anlegen".</p>}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog zum Anlegen/Bearbeiten von Schützen */}
      <Dialog open={isFormOpen} onOpenChange={(open) => { if (!open) { setCurrentShooter(null); setTeamsOfSelectedClubInDialog([]); setSelectedTeamIdsInForm([]); } setIsFormOpen(open); }}>
        <DialogContent className="sm:max-w-lg">
          <form onSubmit={handleSubmitShooterForm}>
            <DialogHeader>
                <DialogTitle>{formMode === 'new' ? 'Neuen Schützen anlegen' : 'Schütze bearbeiten'}</DialogTitle>
                <DialogDescriptionComponent>
                    {formMode === 'new'
                        ? 'Tragen Sie die Daten des Schützen ein. Optional können Sie ihn direkt Mannschaften zuordnen.'
                        : `Bearbeiten Sie die Daten für ${currentShooter?.name || 'den Schützen'}. Die Mannschaftszuordnung erfolgt über die Mannschaftsverwaltung.`
                    }
                    {formMode === 'new' && queryTeamId && contextTeamName &&
                        ` Kontext: Schütze wird initial der Mannschaft "${contextTeamName}" zugeordnet, falls Kapazität vorhanden und unten ausgewählt.`
                    }
                </DialogDescriptionComponent>
            </DialogHeader>
            {currentShooter && (
              <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
                {/* Reihenfolge Vorname, dann Nachname */}
                <div className="space-y-1.5"><Label htmlFor="firstNameFormDialog">Vorname</Label><Input id="firstNameFormDialog" value={currentShooter.firstName || ''} onChange={(e) => handleFormInputChange('firstName', e.target.value)} required /></div>
                <div className="space-y-1.5"><Label htmlFor="lastNameFormDialog">Nachname</Label><Input id="lastNameFormDialog" value={currentShooter.lastName || ''} onChange={(e) => handleFormInputChange('lastName', e.target.value)} required /></div>
                
                <div className="space-y-1.5">
                  <Label htmlFor="clubIdFormShooterDialog">Verein</Label>
                  <Select value={currentShooter.clubId || ''} onValueChange={(value) => handleFormInputChange('clubId', value)} required disabled={allClubs.length === 0 || formMode === 'edit'}>
                    <SelectTrigger id="clubIdFormShooterDialog" aria-label="Verein auswählen"><SelectValue placeholder={allClubs.length === 0 ? "Keine Vereine" : "Verein wählen"}/></SelectTrigger>
                    <SelectContent>
                      {allClubs.filter(c => c && typeof c.id === 'string' && c.id.trim() !== "").map(club => <SelectItem key={club.id} value={club.id}>{club.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="genderFormDialog">Geschlecht</Label>
                  <Select value={currentShooter.gender || 'male'} onValueChange={(value) => handleFormInputChange('gender', value as 'male' | 'female')}>
                    <SelectTrigger id="genderFormDialog" aria-label="Geschlecht auswählen"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="male">Männlich</SelectItem><SelectItem value="female">Weiblich</SelectItem></SelectContent>
                  </Select>
                </div>

                {formMode === 'new' && currentShooter.clubId && (
                  <div className="space-y-2 pt-3 border-t mt-3">
                    <Label className="text-base font-medium">Mannschaften für "{allClubs.find(c => c.id === currentShooter!.clubId)?.name || 'ausgewählten Verein'}" zuordnen (Optional)</Label>
                    <p className="text-xs text-muted-foreground">Ein Schütze darf pro Saison und pro Disziplinkategorie (Gewehr/Pistole) nur einem Team angehören. Max. {MAX_SHOOTERS_PER_TEAM} Schützen pro Team.</p>
                    {isLoadingTeamsForDialog ? (
                      <div className="flex items-center justify-center p-4 h-32 border rounded-md bg-muted/30"><Loader2 className="h-6 w-6 animate-spin text-primary" /><p className="ml-2">Lade Mannschaften...</p></div>
                    ): teamsOfSelectedClubInDialog.length > 0 ? (
                      <ScrollArea className="h-40 rounded-md border p-3 bg-background">
                        <div className="space-y-1">
                          {teamsOfSelectedClubInDialog.map(team => {
                            if(!team || !team.id) return null;
                            const isSelected = selectedTeamIdsInForm.includes(team.id);
                            let isDisabled = false;
                            let disableReason = "";
                            const teamIsFull = (team.currentShooterCount || 0) >= MAX_SHOOTERS_PER_TEAM;

                            if (teamIsFull && !isSelected) {
                                isDisabled = true; disableReason = "(Voll)";
                            } else if (team.leagueType && team.leagueCompetitionYear !== undefined) {
                                const categoryOfCurrentTeam = getDisciplineCategory(team.leagueType);
                                if (categoryOfCurrentTeam) { 
                                    const conflictExists = selectedTeamIdsInForm.some(selectedId => {
                                        if (selectedId === team.id) return false;
                                        const otherSelectedTeam = teamsOfSelectedClubInDialog.find(t => t.id === selectedId);
                                        return otherSelectedTeam && otherSelectedTeam.leagueType && getDisciplineCategory(otherSelectedTeam.leagueType) && // Stelle sicher, dass otherTeam auch eine Kategorie hat
                                               otherSelectedTeam.leagueCompetitionYear === team.leagueCompetitionYear && 
                                               getDisciplineCategory(otherSelectedTeam.leagueType) === categoryOfCurrentTeam;
                                    });
                                    if (conflictExists && !isSelected) {
                                        isDisabled = true; disableReason = `(bereits ${categoryOfCurrentTeam}-Team ${team.leagueCompetitionYear} gewählt)`;
                                    }
                                }
                            } else if (team.leagueId && !team.leagueType) {
                                console.warn(`AdminShootersPage: Team ${team.name} (ID: ${team.id}) hat leagueId ${team.leagueId}, aber leagueType ist '${team.leagueType}'. Disziplinkonflikt nicht exakt prüfbar.`);
                            }
                            const leagueTypeLabel = team.leagueType ? (leagueDisciplineOptions.find(opt => opt.value === team.leagueType)?.label || team.leagueType) : "Liga-los";
                            return (
                              <div key={team.id} className="flex items-center space-x-3 p-1.5 hover:bg-muted/50 rounded-md">
                                <Checkbox id={`team-select-admin-shooter-${team.id}`} checked={isSelected} onCheckedChange={(checkedState) => handleTeamSelectionChangeInForm(team.id, !!checkedState)} disabled={isDisabled} className="h-4 w-4"/>
                                <Label htmlFor={`team-select-admin-shooter-${team.id}`} className={`font-normal text-sm leading-tight ${isDisabled ? 'text-muted-foreground line-through' : 'cursor-pointer'}`}>
                                  {team.name}
                                  <span className="text-xs text-muted-foreground ml-1">({leagueTypeLabel}, {team.leagueCompetitionYear || 'Jahr offen'})</span>
                                  {team.currentShooterCount !== undefined && <span className="text-xs text-muted-foreground ml-1">({team.currentShooterCount}/{MAX_SHOOTERS_PER_TEAM})</span>}
                                  {isDisabled && disableReason && <span className="text-xs text-destructive block mt-0.5">{disableReason}</span>}
                                </Label>
                              </div>
                            );
                          })}
                        </div>
                      </ScrollArea>
                    ) : (
                      <p className="text-sm text-muted-foreground p-4 h-32 border rounded-md flex items-center justify-center">Keine Mannschaften für diesen Verein gefunden oder alle sind voll/ungeeignet.</p>
                    )}
                  </div>
                )}
                 {formMode === 'edit' && (
                  <div className="text-xs text-muted-foreground pt-2 border-t mt-3">
                    <p className="font-medium mb-1">Aktuelle Mannschafts-Zugehörigkeiten:</p>
                    <p>{currentShooter.id ? getTeamInfoForShooter(currentShooter as Shooter) : '-'}</p>
                    <p className="mt-1">Die Zuordnung zu Mannschaften erfolgt primär über die Mannschaftsverwaltung.</p>
                  </div>
                )}
              </div>
            )}
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => {setIsFormOpen(false); setCurrentShooter(null); setSelectedTeamIdsInForm([]); setTeamsOfSelectedClubInDialog([]);}}>Abbrechen</Button>
              <Button type="submit" disabled={isFormSubmitting || isLoadingTeamsForDialog}>
                {(isFormSubmitting || isLoadingTeamsForDialog) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Speichern
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
    
