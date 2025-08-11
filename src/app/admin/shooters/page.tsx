
// src/app/admin/shooters/page.tsx
"use client";
import React, { useState, useEffect, FormEvent, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Edit, Trash2, UserCircle as UserIcon, Loader2, AlertTriangle, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
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
  DialogClose,
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useRouter } from 'next/navigation';
import type { Shooter, Club, Team, FirestoreLeagueSpecificDiscipline, TeamValidationInfo } from '@/types/rwk';
import { MAX_SHOOTERS_PER_TEAM, leagueDisciplineOptions, GEWEHR_DISCIPLINES, PISTOL_DISCIPLINES, calculateAgeClass } from '@/types/rwk';
import { db } from '@/lib/firebase/config';
import { 
  collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, 
  where, orderBy, documentId, writeBatch, getDoc as getFirestoreDoc, arrayRemove, arrayUnion, Timestamp
} from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

const SHOOTERS_COLLECTION = "shooters";
const TEAMS_COLLECTION = "rwk_teams";
const CLUBS_COLLECTION = "clubs";
const LEAGUES_COLLECTION = "rwk_leagues"; // Used to get league types for validation
const ALL_CLUBS_FILTER_VALUE = "__ALL_CLUBS__";

export default function AdminShootersPage() {
  const router = useRouter();
  const [queryParams, setQueryParams] = useState<{teamId: string | null, clubId: string | null}>({
    teamId: null,
    clubId: null
  });
  
  // Extrahiere URL-Parameter auf Client-Seite
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      setQueryParams({
        teamId: urlParams.get('teamId'),
        clubId: urlParams.get('clubId')
      });
    }
  }, []);
  
  const queryTeamId = queryParams.teamId;
  const queryClubIdFromParams = queryParams.clubId;

  const { toast } = useToast();

  const [allClubsGlobal, setAllClubsGlobal] = useState<Club[]>([]);
  const [allLeaguesGlobal, setAllLeaguesGlobal] = useState<League[]>([]); // For league type lookup
  const [shootersOfActiveClub, setShootersOfActiveClub] = useState<Shooter[]>([]);
  const [allTeamsData, setAllTeamsData] = useState<Team[]>([]); // All teams for info column

  const [contextTeamName, setContextTeamName] = useState<string | null>(null);
  const [isContextTeamNameLoading, setIsContextTeamNameLoading] = useState<boolean>(false);

  const [isLoading, setIsLoading] = useState(true); // Combined loading state
  const [isLoadingClubSpecificData, setIsLoadingClubSpecificData] = useState(false);
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [shooterToDelete, setShooterToDelete] = useState<Shooter | null>(null);
  const [selectedShootersForDelete, setSelectedShootersForDelete] = useState<string[]>([]);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentShooter, setCurrentShooter] = useState<Partial<Shooter> & { id?: string } | null>(null);
  const [formMode, setFormMode] = useState<'new' | 'edit'>('new');

  const [selectedClubIdFilter, setSelectedClubIdFilter] = useState<string>(queryClubIdFromParams || ALL_CLUBS_FILTER_VALUE);

  // For "New Shooter" dialog's team assignment section
  const [teamsOfSelectedClubInDialog, setTeamsOfSelectedClubInDialog] = useState<TeamValidationInfo[]>([]);
  const [isLoadingTeamsForDialog, setIsLoadingTeamsForDialog] = useState(false);
  const [selectedTeamIdsInForm, setSelectedTeamIdsInForm] = useState<string[]>([]);

  // Sortierung
  const [sortField, setSortField] = useState<'lastName' | 'firstName' | 'clubId' | 'gender' | 'birthYear' | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');


  const fetchInitialData = useCallback(async () => {

    setIsLoading(true);
    try {
      const clubsSnapshotPromise = getDocs(query(collection(db, CLUBS_COLLECTION), orderBy("name", "asc")));
      const teamsSnapshotPromise = getDocs(query(collection(db, TEAMS_COLLECTION), orderBy("name", "asc"))); // Fetch all teams
      const leaguesSnapshotPromise = getDocs(query(collection(db, LEAGUES_COLLECTION), orderBy("name", "asc"))); // Fetch all leagues

      const [clubsSnapshot, teamsSnapshot, leaguesSnapshot] = await Promise.all([
        clubsSnapshotPromise, 
        teamsSnapshotPromise,
        leaguesSnapshotPromise
      ]);

      const fetchedClubs = clubsSnapshot.docs
        .map(docData => ({ id: docData.id, ...docData.data() } as Club))
        .filter(c => c && typeof c.id === 'string' && c.id.trim() !== "");
      setAllClubsGlobal(fetchedClubs);


      const fetchedTeams = teamsSnapshot.docs
        .map(d => ({ id: d.id, ...d.data() } as Team))
        .filter(t => t && typeof t.id === 'string' && t.id.trim() !== "");
      setAllTeamsData(fetchedTeams);

      
      const fetchedLeagues = leaguesSnapshot.docs
        .map(lDoc => ({ id: lDoc.id, ...lDoc.data() } as League))
        .filter(l => l && typeof l.id === 'string' && l.id.trim() !== "");
      setAllLeaguesGlobal(fetchedLeagues);

      
      if (queryClubIdFromParams && fetchedClubs.some(c => c.id === queryClubIdFromParams)) {
        setSelectedClubIdFilter(queryClubIdFromParams);
      } else if (queryTeamId && !queryClubIdFromParams) {
        const teamForContext = fetchedTeams.find(t => t.id === queryTeamId);
        if (teamForContext?.clubId && fetchedClubs.some(c => c.id === teamForContext.clubId)) {
          setSelectedClubIdFilter(teamForContext.clubId);
        }
      }

    } catch (error) {
      console.error("ASP DEBUG: Error fetching initial page data:", error);
      toast({ title: "Fehler", description: "Basisdaten konnten nicht geladen werden.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast, queryClubIdFromParams, queryTeamId]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const fetchPageDataForActiveClub = useCallback(async () => {
    if (!selectedClubIdFilter) {
      setShootersOfActiveClub([]);
      return;
    }

    setIsLoadingClubSpecificData(true);
    try {
      // Lade alle Schützen da wir mehrere clubId Felder haben
      const shootersQuery = query(collection(db, SHOOTERS_COLLECTION), orderBy("lastName", "asc"), orderBy("firstName", "asc"));
      const shootersSnapshot = await getDocs(shootersQuery);
      let fetchedShooters = shootersSnapshot.docs.map(d => ({ id: d.id, ...d.data(), teamIds: (d.data().teamIds || []) } as Shooter));
      
      // Client-seitige Filterung
      if (selectedClubIdFilter !== ALL_CLUBS_FILTER_VALUE) {
        fetchedShooters = fetchedShooters.filter(shooter => {
          const clubId = shooter.clubId || shooter.rwkClubId || (shooter as any).kmClubId;
          return clubId === selectedClubIdFilter;
        });
      }
      
      setShootersOfActiveClub(fetchedShooters);

    } catch (error) {
      console.error(`ASP DEBUG: Error fetching shooters for club ${selectedClubIdFilter}:`, error);
      toast({ title: "Fehler", description: "Schützendaten konnten nicht geladen werden.", variant: "destructive" });
    } finally {
      setIsLoadingClubSpecificData(false);
    }
  }, [selectedClubIdFilter, toast]);

  useEffect(() => {
    fetchPageDataForActiveClub();
  }, [fetchPageDataForActiveClub]);

  const fetchContextTeamName = useCallback(async () => {
    if (queryTeamId) {
      setIsContextTeamNameLoading(true);
      try {
        const teamDocRef = doc(db, TEAMS_COLLECTION, queryTeamId);
        const teamSnap = await getFirestoreDoc(teamDocRef);
        if (teamSnap.exists()) {
          setContextTeamName((teamSnap.data() as Team).name);
        } else {
          setContextTeamName(null);
        }
      } catch (err) {
        console.error("ASP DEBUG: Error fetching context team name:", err);
        setContextTeamName(null);
      }
      setIsContextTeamNameLoading(false);
    } else {
      setContextTeamName(null);
    }
  }, [queryTeamId]);

  useEffect(() => {
    fetchContextTeamName();
  }, [fetchContextTeamName]);
  
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
        const leagueInfo = allLeaguesGlobal.find(l => l.id === teamData.leagueId);
        return {
          ...teamData,
          id: teamDoc.id,
          leagueType: leagueInfo?.type, // This can be undefined if team has no league or league not found
          leagueCompetitionYear: leagueInfo?.competitionYear,
          currentShooterCount: (teamData.shooterIds || []).length,
        } as TeamValidationInfo;
      });
      setTeamsOfSelectedClubInDialog(teamsData);


      if (queryTeamId && teamsData.some(t => t.id === queryTeamId)) {
        const contextTeam = teamsData.find(t => t.id === queryTeamId);
        if (contextTeam && (contextTeam.currentShooterCount || 0) < MAX_SHOOTERS_PER_TEAM) {
          setSelectedTeamIdsInForm([queryTeamId]);
        } else if (contextTeam) {
          toast({ title: "Mannschaft voll", description: `Kontext-Mannschaft "${contextTeam.name}" ist bereits voll.`, variant: "warning", duration: 4000 });
          setSelectedTeamIdsInForm([]);
        }
      } else {
        setSelectedTeamIdsInForm([]);
      }

    } catch (error) {
      console.error("ASP DIALOG DEBUG: Error fetching teams for dialog:", error);
      toast({ title: "Fehler", description: "Mannschaften für Dialog konnten nicht geladen werden.", variant: "destructive" });
    } finally {
      setIsLoadingTeamsForDialog(false);
    }
  }, [allLeaguesGlobal, queryTeamId, toast]);


  const handleAddNewShooter = () => {
    if (allClubsGlobal.length === 0) {
      toast({ title: "Keine Vereine", description: "Bitte zuerst Vereine anlegen.", variant: "destructive"});
      return;
    }
    setFormMode('new');
    let initialClubIdForNewShooter = '';
    if (selectedClubIdFilter !== ALL_CLUBS_FILTER_VALUE && allClubsGlobal.some(c => c.id === selectedClubIdFilter)) {
        initialClubIdForNewShooter = selectedClubIdFilter;
    } else if (queryClubIdFromParams && allClubsGlobal.some(c => c.id === queryClubIdFromParams)) {
        initialClubIdForNewShooter = queryClubIdFromParams;
    }
    
    setCurrentShooter({
      firstName: '',
      lastName: '',
      clubId: initialClubIdForNewShooter,
      gender: 'male',
      birthYear: undefined,
      teamIds: [], // Initial leer, wird durch Auswahl befüllt
    });
    setSelectedTeamIdsInForm(queryTeamId && initialClubIdForNewShooter ? [queryTeamId] : []); // Korrektur hier
    
    if (initialClubIdForNewShooter) {
      fetchTeamsForNewShooterDialog(initialClubIdForNewShooter);
    } else {
      setTeamsOfSelectedClubInDialog([]);
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
    if (!shooterToDelete || !shooterToDelete.id) {
      toast({ title: "Fehler", description: "Kein Schütze zum Löschen ausgewählt.", variant: "destructive" });
      setIsAlertOpen(false); setShooterToDelete(null); return;
    }
    setIsDeleting(true);
    try {
      const batch = writeBatch(db);
      const shooterDocRef = doc(db, SHOOTERS_COLLECTION, shooterToDelete.id);
      batch.delete(shooterDocRef);

      (shooterToDelete.teamIds || []).forEach(teamId => {
        if (teamId && typeof teamId === 'string' && teamId.trim() !== '') {
            const teamDocRef = doc(db, TEAMS_COLLECTION, teamId);
            batch.update(teamDocRef, { shooterIds: arrayRemove(shooterToDelete.id) });
        }
      });
      
      await batch.commit();
      toast({ title: "Schütze gelöscht", description: `"${shooterToDelete.name}" wurde erfolgreich entfernt.` });
      fetchPageDataForActiveClub(); 
    } catch (error: any) {
      console.error("ASP DELETE DEBUG: Error deleting shooter:", error);
      toast({ title: "Fehler beim Löschen", description: error.message || "Der Schütze konnte nicht gelöscht werden.", variant: "destructive" });
    } finally {
      setIsDeleting(false); setIsAlertOpen(false); setShooterToDelete(null);
    }
  };
  
  const handleSubmitShooterForm = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!currentShooter || !currentShooter.lastName?.trim() || !currentShooter.firstName?.trim() || !currentShooter.clubId) {
      toast({ title: "Ungültige Eingabe", description: "Nachname, Vorname und Verein sind erforderlich.", variant: "destructive" });
      return;
    }
    setIsFormSubmitting(true);
    const combinedName = `${currentShooter.firstName.trim()} ${currentShooter.lastName.trim()}`;

    try {
      const shootersColRef = collection(db, SHOOTERS_COLLECTION);
      // Prüfe Duplikate sowohl mit clubId als auch rwkClubId
      let qDuplicateName = query(shootersColRef, where("name", "==", combinedName));
      if (formMode === 'edit' && currentShooter.id) {
        qDuplicateName = query(shootersColRef, where("name", "==", combinedName), where(documentId(), "!=", currentShooter.id));
      }
      const duplicateSnap = await getDocs(qDuplicateName);
      const duplicateInSameClub = duplicateSnap.docs.some(doc => {
        const data = doc.data();
        const shooterClubId = data.clubId || data.rwkClubId;
        return shooterClubId === currentShooter.clubId;
      });
      if (duplicateInSameClub) {
        toast({ title: "Doppelter Schütze", description: `Ein Schütze mit dem Namen "${combinedName}" existiert bereits in diesem Verein.`, variant: "destructive"});
        setIsFormSubmitting(false); return;
      }


      const batch = writeBatch(db);
      if (formMode === 'new') {
        if (selectedTeamIdsInForm.length > 0) { // Check before saving
          let assignedGewehrCount = 0;
          let assignedPistoleCount = 0;
          const yearCategoryMap = new Map<string, string>(); // key: "year_category", value: teamName

          for (const teamId of selectedTeamIdsInForm) {
            const teamInfo = teamsOfSelectedClubInDialog.find(t => t.id === teamId);
            if (!teamInfo) continue;

            if ((teamInfo.currentShooterCount || 0) >= MAX_SHOOTERS_PER_TEAM) {
              toast({ title: "Mannschaft voll", description: `Mannschaft "${teamInfo.name}" ist bereits voll. Schütze kann nicht hinzugefügt werden.`, variant: "destructive", duration: 7000 });
              setIsFormSubmitting(false); return;
            }
            
            const category = teamInfo.leagueType;
            if (category && teamInfo.leagueCompetitionYear !== undefined) {
              const key = `${teamInfo.leagueCompetitionYear}_${category}`;
              if (yearCategoryMap.has(key)) {
                toast({ title: "Regelverstoß", description: `Ein Schütze darf pro Saison (${teamInfo.leagueCompetitionYear}) und Disziplinkategorie ('${category}') nur einer Mannschaft angehören. Konflikt mit Team "${yearCategoryMap.get(key)}" und "${teamInfo.name}".`, variant: "destructive", duration: 10000 });
                setIsFormSubmitting(false); return;
              }
              yearCategoryMap.set(key, teamInfo.name);
            }
          }
        }

        const newShooterRef = doc(collection(db, SHOOTERS_COLLECTION));
        const shooterDataForSave: any = {
          firstName: currentShooter.firstName.trim(),
          lastName: currentShooter.lastName.trim(),
          name: combinedName,
          clubId: currentShooter.clubId,
          gender: currentShooter.gender || 'male',
          teamIds: selectedTeamIdsInForm,
        };
        
        // Debug: Prüfe ob clubId gesetzt ist
        console.log('DEBUG: Speichere Schütze mit clubId:', currentShooter.clubId);
        
        // Nur birthYear hinzufügen wenn es einen Wert hat
        if (currentShooter.birthYear && !isNaN(parseInt(currentShooter.birthYear.toString()))) {
          shooterDataForSave.birthYear = parseInt(currentShooter.birthYear.toString());
        }
        // Speichere in shooters Collection
        batch.set(newShooterRef, shooterDataForSave);
        
        selectedTeamIdsInForm.forEach(teamId => {
          batch.update(doc(db, TEAMS_COLLECTION, teamId), { shooterIds: arrayUnion(newShooterRef.id) });
        });
        toast({ title: "Schütze erstellt", description: `${shooterDataForSave.name} wurde angelegt.` });

      } else if (formMode === 'edit' && currentShooter.id) {
        const shooterDocRef = doc(db, SHOOTERS_COLLECTION, currentShooter.id);
        const updateData: any = {
          firstName: currentShooter.firstName.trim(),
          lastName: currentShooter.lastName.trim(),
          name: combinedName,
          gender: currentShooter.gender || 'male',
        };
        
        // Nur birthYear hinzufügen wenn es einen Wert hat
        if (currentShooter.birthYear && !isNaN(parseInt(currentShooter.birthYear.toString()))) {
          updateData.birthYear = parseInt(currentShooter.birthYear.toString());
        }
        
        batch.update(shooterDocRef, updateData);
        toast({ title: "Schütze aktualisiert", description: `Daten für "${combinedName}" aktualisiert.` });
      }
      
      await batch.commit();
      setIsFormOpen(false); setCurrentShooter(null); setSelectedTeamIdsInForm([]);
      fetchPageDataForActiveClub();
    } catch (error: any) {
      console.error("ASP SUBMIT DEBUG: Error saving shooter:", error);
      toast({ title: `Fehler beim Speichern`, description: error.message || "Unbekannter Fehler.", variant: "destructive" });
    } finally {
      setIsFormSubmitting(false);
    }
  };
  
  const handleFormInputChange = (field: keyof Pick<Shooter, 'lastName' | 'firstName' | 'clubId' | 'gender' | 'birthYear'>, value: string) => {
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
    if (isFormSubmitting || isLoadingTeamsForDialog) return;
    
    const teamBeingChanged = teamsOfSelectedClubInDialog.find(t => t.id === teamId);
    if (!teamBeingChanged) return;

    const currentSelectedTeamsData = selectedTeamIdsInForm
      .map(id => teamsOfSelectedClubInDialog.find(t => t.id === id))
      .filter(t => !!t) as TeamValidationInfo[];

    if (checked) { 
      if (selectedTeamIdsInForm.length >= 3 && !selectedTeamIdsInForm.includes(teamId)) { 
          toast({ title: "Maximal 3 Mannschaften", description: "Ein Schütze kann maximal 3 Mannschaften gleichzeitig zugeordnet werden.", variant: "warning" });
          return;
      }
      if ((teamBeingChanged.currentShooterCount || 0) >= MAX_SHOOTERS_PER_TEAM) {
        toast({ title: "Mannschaft voll", description: `Mannschaft "${teamBeingChanged.name}" ist bereits voll.`, variant: "warning" });
        return; 
      }
      
      const categoryOfTeamBeingChanged = teamBeingChanged.leagueType;
      const yearOfTeamBeingChanged = teamBeingChanged.leagueCompetitionYear;

      if (categoryOfTeamBeingChanged && yearOfTeamBeingChanged !== undefined) {
        const conflict = currentSelectedTeamsData.some(selectedTeam => {
            if (selectedTeam.id === teamId) return false; // Don't check against itself if it were already there
            const selectedTeamCategory = selectedTeam.leagueType;
            return selectedTeamCategory === categoryOfTeamBeingChanged && 
                   selectedTeam.leagueCompetitionYear === yearOfTeamBeingChanged;
        });

        if (conflict) {
            toast({ title: "Regelverstoß", description: `Ein Schütze darf pro Saison (${yearOfTeamBeingChanged}) und Disziplinkategorie ('${categoryOfTeamBeingChanged}') nur einer Mannschaft angehören.`, variant: "destructive", duration: 8000 });
            return; 
        }
      }
    }
    setSelectedTeamIdsInForm(prev =>
      checked ? [...prev, teamId] : prev.filter(id => id !== teamId)
    );
  };

  const getClubName = useCallback((shooter: Shooter): string => {
    const clubId = shooter.clubId || shooter.rwkClubId || (shooter as any).kmClubId;
    if (!clubId) return 'Kein Verein';
    return allClubsGlobal.find(c => c.id === clubId)?.name || 'Unbekannter Verein';
  }, [allClubsGlobal]);

  const getTeamInfoForShooter = useCallback((shooter: Shooter): string => {
    const teamIds = shooter.teamIds || [];
    if (teamIds.length === 0) return '-';
    
    // Prioritize context team name if available
    if (contextTeamName && queryTeamId && teamIds.includes(queryTeamId)) {
      const otherTeamCount = teamIds.filter(id => id !== queryTeamId && allTeamsData.find(t => t.id === id)).length;
      return otherTeamCount > 0 ? `${contextTeamName} (+${otherTeamCount} weitere)` : contextTeamName;
    }
    
    const assignedTeamNames = teamIds
        .map(tid => allTeamsData.find(t => t.id === tid)?.name)
        .filter(name => !!name);

    if (assignedTeamNames.length === 0 && teamIds.length > 0) return `${teamIds.length} (Lade Teaminfo...)`;
    if (assignedTeamNames.length === 1) return assignedTeamNames[0]!;
    if (assignedTeamNames.length > 1) return `${assignedTeamNames.length} Mannschaften`;
    
    return '-';
  }, [allTeamsData, queryTeamId, contextTeamName]);

  const selectedClubNameForTitle = useMemo(() => {
    if (selectedClubIdFilter === ALL_CLUBS_FILTER_VALUE) return 'aller Vereine';
    return allClubsGlobal.find(c => c.id === selectedClubIdFilter)?.name || 'Unbekannt';
  }, [selectedClubIdFilter, allClubsGlobal]);

  // Sortierte Schützen
  const sortedShooters = useMemo(() => {
    if (!sortField) return shootersOfActiveClub;
    
    return [...shootersOfActiveClub].sort((a, b) => {
      let aValue: string | number = '';
      let bValue: string | number = '';
      
      switch (sortField) {
        case 'lastName':
          aValue = a.lastName || '';
          bValue = b.lastName || '';
          break;
        case 'firstName':
          aValue = a.firstName || '';
          bValue = b.firstName || '';
          break;
        case 'clubId':
          aValue = getClubName(a);
          bValue = getClubName(b);
          break;
        case 'gender':
          aValue = a.gender === 'male' ? 'M' : (a.gender === 'female' ? 'W' : 'N/A');
          bValue = b.gender === 'male' ? 'M' : (b.gender === 'female' ? 'W' : 'N/A');
          break;
        case 'birthYear':
          aValue = a.birthYear || 0;
          bValue = b.birthYear || 0;
          break;
      }
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comparison = aValue.localeCompare(bValue);
        return sortDirection === 'asc' ? comparison : -comparison;
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      return 0;
    });
  }, [shootersOfActiveClub, sortField, sortDirection, getClubName]);

  const handleSort = (field: 'lastName' | 'firstName' | 'clubId' | 'gender' | 'birthYear') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: 'lastName' | 'firstName' | 'clubId' | 'gender' | 'birthYear') => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4" />;
    return sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
  };

  if (isLoading) {
    return <div className="flex justify-center items-center py-10"><Loader2 className="h-12 w-12 animate-spin text-primary" /> <p className="ml-3">Lade Basisdaten...</p></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
            <h1 className="text-2xl font-semibold text-primary">Schützenverwaltung</h1>
            {contextTeamName && !isContextTeamNameLoading && <p className="text-sm text-muted-foreground">Kontext: Schützen für Mannschaft "{contextTeamName}"</p>}
            {queryTeamId && isContextTeamNameLoading && <p className="text-sm text-muted-foreground"><Loader2 className="inline h-4 w-4 mr-1 animate-spin" /> Lade Teamkontext...</p>}
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto">
          <Link href="/admin">
            <Button variant="outline" size="sm">
              Zurück zum Dashboard
            </Button>
          </Link>
           <Select
            value={selectedClubIdFilter}
            onValueChange={(value) => {
              setSelectedClubIdFilter(value);
              const newPath = value === ALL_CLUBS_FILTER_VALUE ? '/admin/shooters' : `/admin/shooters?clubId=${value}${queryTeamId ? `&teamId=${queryTeamId}`: ''}`;
              router.push(newPath, {scroll: false});
            }}
            disabled={allClubsGlobal.length === 0}
           >
            <SelectTrigger className="w-full sm:w-[220px]" aria-label="Verein filtern">
              <SelectValue placeholder={allClubsGlobal.length > 0 ? "Verein filtern" : "Keine Vereine"}/>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_CLUBS_FILTER_VALUE}>Alle Vereine</SelectItem>
              {allClubsGlobal.filter(c => c && typeof c.id === 'string' && c.id.trim() !== "").map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              {allClubsGlobal.filter(c => c && typeof c.id === 'string' && c.id.trim() !== "").length === 0 &&
                <SelectItem value="NO_CLUBS_PLACEHOLDER_ADMIN_SHOOTERS" disabled>Keine Vereine verfügbar</SelectItem>
              }
            </SelectContent>
          </Select>
          <Button onClick={handleAddNewShooter} disabled={allClubsGlobal.length === 0}>
            <PlusCircle className="mr-2 h-5 w-5" /> Neuen Schützen anlegen
          </Button>
          {selectedShootersForDelete.length > 0 && (
            <Button 
              variant="destructive" 
              onClick={() => setIsBulkDeleteOpen(true)}
              disabled={isFormSubmitting || isDeleting}
            >
              <Trash2 className="mr-2 h-4 w-4" /> 
              {selectedShootersForDelete.length} Schützen löschen
            </Button>
          )}
        </div>
      </div>
       <Card className="shadow-md">
        <CardHeader>
          <CardTitle>
            Schützen für {selectedClubNameForTitle} ({shootersOfActiveClub.length})
          </CardTitle>
          <CardDescription>
            Verwalten Sie hier die Schützen. Die Zuweisung zu Mannschaften kann hier beim Anlegen oder über die Mannschaftsverwaltung erfolgen.
            {allClubsGlobal.length === 0 && <span className="text-destructive block mt-1"> Hinweis: Keine Vereine angelegt.</span>}
          </CardDescription>
        </CardHeader>
        <CardContent>
           {isLoadingClubSpecificData ? (
             <div className="flex justify-center items-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /><p className="ml-2">Lade Schützen...</p></div>
           ) : shootersOfActiveClub.length > 0 ? (
             <Table>
              <TableHeader><TableRow>
                  <TableHead>
                    <Button variant="ghost" onClick={() => handleSort('lastName')} className="h-auto p-0 font-semibold hover:bg-transparent">
                      Nachname {getSortIcon('lastName')}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" onClick={() => handleSort('firstName')} className="h-auto p-0 font-semibold hover:bg-transparent">
                      Vorname {getSortIcon('firstName')}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" onClick={() => handleSort('clubId')} className="h-auto p-0 font-semibold hover:bg-transparent">
                      Verein {getSortIcon('clubId')}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" onClick={() => handleSort('gender')} className="h-auto p-0 font-semibold hover:bg-transparent">
                      Geschlecht {getSortIcon('gender')}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" onClick={() => handleSort('birthYear')} className="h-auto p-0 font-semibold hover:bg-transparent">
                      Jahrgang {getSortIcon('birthYear')}
                    </Button>
                  </TableHead>
                  <TableHead>AK Auflage 2026</TableHead>
                  <TableHead>AK Freihand 2026</TableHead>
                  <TableHead>Mannschaften</TableHead>
                  <TableHead className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Checkbox 
                        checked={selectedShootersForDelete.length === sortedShooters.length && sortedShooters.length > 0}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedShootersForDelete(sortedShooters.map(s => s.id));
                          } else {
                            setSelectedShootersForDelete([]);
                          }
                        }}
                        disabled={isFormSubmitting || isDeleting || sortedShooters.length === 0}
                      />
                      Aktionen
                    </div>
                  </TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {sortedShooters.map((shooter) => (
                  <TableRow key={shooter.id}>
                    <TableCell>{shooter.lastName}</TableCell><TableCell>{shooter.firstName}</TableCell>
                    <TableCell>{getClubName(shooter)}</TableCell>
                    <TableCell>{shooter.gender === 'male' ? 'M' : (shooter.gender === 'female' ? 'W' : 'N/A')}</TableCell>
                    <TableCell>{shooter.birthYear || '-'}</TableCell>
                    <TableCell className="text-xs">{shooter.birthYear && shooter.gender ? calculateAgeClass(shooter.birthYear, shooter.gender as 'male' | 'female', 2026, 'auflage') : '-'}</TableCell>
                    <TableCell className="text-xs">{shooter.birthYear && shooter.gender ? calculateAgeClass(shooter.birthYear, shooter.gender as 'male' | 'female', 2026, 'freihand') : '-'}</TableCell>
                    <TableCell className="text-xs">{getTeamInfoForShooter(shooter)}</TableCell>
                    <TableCell className="text-right space-x-1">
                      <Checkbox 
                        checked={selectedShootersForDelete.includes(shooter.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedShootersForDelete(prev => [...prev, shooter.id]);
                          } else {
                            setSelectedShootersForDelete(prev => prev.filter(id => id !== shooter.id));
                          }
                        }}
                        disabled={isFormSubmitting || isDeleting}
                      />
                      <Button variant="ghost" size="icon" onClick={() => handleEditShooter(shooter)} disabled={isFormSubmitting || isDeleting} aria-label="Schütze bearbeiten"><Edit className="h-4 w-4" /></Button>
                       <AlertDialog open={isAlertOpen && shooterToDelete?.id === shooter.id} onOpenChange={(open) => {if(!open)setShooterToDelete(null); setIsAlertOpen(open);}}>
                          <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/80" onClick={() => handleDeleteConfirmation(shooter)} disabled={isFormSubmitting || isDeleting} aria-label="Schütze löschen"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
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
              <UserIcon className="mx-auto h-10 w-10 text-primary/70 mb-3" />
              <p className="text-lg">{selectedClubIdFilter !== ALL_CLUBS_FILTER_VALUE && selectedClubIdFilter !== "" ? `Keine Schützen für "${selectedClubNameForTitle}" gefunden.` : (allClubsGlobal.length === 0 ? 'Bitte zuerst Vereine anlegen.' : 'Keine Schützen angelegt oder Filter aktiv.')}</p>
               {allClubsGlobal.length > 0 && <p className="text-sm mt-1">Klicken Sie auf "Neuen Schützen anlegen".</p>}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={(open) => { if (!open) { setCurrentShooter(null); setTeamsOfSelectedClubInDialog([]); setSelectedTeamIdsInForm([]); } setIsFormOpen(open); }}>
        <DialogContent className="sm:max-w-lg">
          <form onSubmit={handleSubmitShooterForm}>
            <DialogHeader>
                <DialogTitle>{formMode === 'new' ? 'Neuen Schützen anlegen' : 'Schütze bearbeiten'}</DialogTitle>
                <DialogDescriptionComponent>
                    {formMode === 'new'
                        ? 'Tragen Sie die Daten des Schützen ein. Optional können Sie ihn direkt Mannschaften zuordnen.'
                        : `Bearbeiten Sie die Daten für ${currentShooter?.name || 'den Schützen'}.`
                    }
                    {formMode === 'new' && queryTeamId && contextTeamName &&
                        ` Kontext: Schütze wird initial der Mannschaft "${contextTeamName}" zugeordnet, falls Kapazität vorhanden und unten ausgewählt.`
                    }
                </DialogDescriptionComponent>
            </DialogHeader>
            {currentShooter && (
              <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
                <div className="space-y-1.5">
                  <Label htmlFor="lastNameFormDialogShooterAdmin">Nachname</Label>
                  <Input id="lastNameFormDialogShooterAdmin" value={currentShooter.lastName || ''} onChange={(e) => handleFormInputChange('lastName', e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="firstNameFormDialogShooterAdmin">Vorname</Label>
                  <Input id="firstNameFormDialogShooterAdmin" value={currentShooter.firstName || ''} onChange={(e) => handleFormInputChange('firstName', e.target.value)} required />
                </div>
                
                <div className="space-y-1.5">
                  <Label htmlFor="clubIdFormShooterAdmin">Verein</Label>
                  <Select 
                    value={currentShooter.clubId || ''} 
                    onValueChange={(value) => handleFormInputChange('clubId', value)} 
                    required 
                    disabled={allClubsGlobal.length === 0 || formMode === 'edit'}
                  >
                    <SelectTrigger id="clubIdFormShooterAdmin" aria-label="Verein auswählen">
                        <SelectValue placeholder={allClubsGlobal.length === 0 ? "Keine Vereine" : "Verein wählen"}/>
                    </SelectTrigger>
                    <SelectContent>
                      {allClubsGlobal.filter(c => c && typeof c.id === 'string' && c.id.trim() !== "").map(club => <SelectItem key={club.id} value={club.id}>{club.name}</SelectItem>)}
                       {allClubsGlobal.filter(c => c && typeof c.id === 'string' && c.id.trim() !== "").length === 0 &&
                         <SelectItem value="NO_CLUBS_DIALOG_ADMIN_SHOOTERS" disabled>Keine Vereine verfügbar</SelectItem>
                       }
                    </SelectContent>
                  </Select>
                   {formMode === 'edit' && currentShooter.clubId && <p className="text-xs text-muted-foreground pt-1">Der Verein eines bestehenden Schützen kann hier nicht geändert werden.</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="genderFormDialogShooterAdmin">Geschlecht</Label>
                  <Select value={currentShooter.gender || 'male'} onValueChange={(value) => handleFormInputChange('gender', value as 'male' | 'female')}>
                    <SelectTrigger id="genderFormDialogShooterAdmin" aria-label="Geschlecht auswählen"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="male">Männlich</SelectItem><SelectItem value="female">Weiblich</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="birthYearFormDialogShooterAdmin">Geburtsjahr (für Altersklassen)</Label>
                  <Input 
                    id="birthYearFormDialogShooterAdmin" 
                    type="number" 
                    min="1920" 
                    max="2020" 
                    value={currentShooter.birthYear || ''} 
                    onChange={(e) => handleFormInputChange('birthYear', e.target.value)} 
                    placeholder="z.B. 1990"
                  />
                  {currentShooter.birthYear && currentShooter.gender && (
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>AK Auflage 2026: {calculateAgeClass(currentShooter.birthYear, currentShooter.gender as 'male' | 'female', 2026, 'auflage')}</p>
                      <p>AK Freihand 2026: {calculateAgeClass(currentShooter.birthYear, currentShooter.gender as 'male' | 'female', 2026, 'freihand')}</p>
                    </div>
                  )}
                </div>

                {formMode === 'new' && currentShooter.clubId && (
                  <div className="space-y-2 pt-3 border-t mt-3">
                    <Label className="text-base font-medium">Mannschaften für "{allClubsGlobal.find(c => c.id === currentShooter!.clubId)?.name || 'ausgewählten Verein'}" zuordnen (Optional)</Label>
                    <p className="text-xs text-muted-foreground">Ein Schütze darf pro Saison und Disziplinkategorie (Gewehr/Pistole) nur einer Mannschaft angehören. Max. {MAX_SHOOTERS_PER_TEAM} Schützen pro Team.</p>
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
                            } else if (!isSelected) {
                                const categoryOfCurrentTeamDialog = team.leagueType;
                                const yearOfCurrentTeamDialog = team.leagueCompetitionYear;
                                if (categoryOfCurrentTeamDialog && yearOfCurrentTeamDialog !== undefined) {
                                    const conflictExists = selectedTeamIdsInForm.some(selectedTeamIdInForm => {
                                        const otherSelectedTeamData = teamsOfSelectedClubInDialog.find(t => t.id === selectedTeamIdInForm);
                                        if (!otherSelectedTeamData) return false;
                                        const otherSelectedTeamCategory = otherSelectedTeamData.leagueType;
                                        return otherSelectedTeamCategory === categoryOfCurrentTeamDialog &&
                                               otherSelectedTeamData.leagueCompetitionYear === yearOfCurrentTeamDialog;
                                    });
                                    if (conflictExists) {
                                        isDisabled = true;
                                        disableReason = `(bereits ${categoryOfCurrentTeamDialog}-Team ${yearOfCurrentTeamDialog} gewählt)`;
                                    }
                                }
                            }
                            const leagueTypeLabel = team.leagueType ? (leagueDisciplineOptions.find(opt => opt.value === team.leagueType)?.label || team.leagueType) : "Liga-los";
                            return (
                              <div key={team.id} className="flex items-center space-x-3 p-1.5 hover:bg-muted/50 rounded-md">
                                <Checkbox 
                                  id={`team-select-admin-shooter-${team.id}`} 
                                  checked={isSelected} 
                                  onCheckedChange={(checkedState) => handleTeamSelectionChangeInForm(team.id, !!checkedState)} 
                                  disabled={isDisabled} 
                                />
                                <Label htmlFor={`team-select-admin-shooter-${team.id}`} className={`font-normal text-sm leading-tight ${isDisabled ? 'text-muted-foreground line-through' : 'cursor-pointer'}`}>
                                  {team.name}
                                  {(team.leagueType || team.leagueCompetitionYear !== undefined) && <span className="text-xs text-muted-foreground ml-1">({leagueTypeLabel}, {team.leagueCompetitionYear || 'Jahr N/A'})</span>}
                                  {team.currentShooterCount !== undefined && <span className="text-xs text-muted-foreground ml-1">({team.currentShooterCount}/{MAX_SHOOTERS_PER_TEAM})</span>}
                                  {isDisabled && disableReason && <span className="text-xs text-destructive block mt-0.5">{disableReason}</span>}
                                </Label>
                              </div>
                            );
                          })}
                        </div>
                      </ScrollArea>
                    ) : (
                      <p className="text-sm text-muted-foreground p-4 h-32 border rounded-md flex items-center justify-center bg-muted/30">
                        Keine Mannschaften für diesen Verein gefunden oder alle sind voll/ungeeignet.
                      </p>
                    )}
                  </div>
                )}
                 {formMode === 'edit' && (
                  <div className="text-xs text-muted-foreground pt-2 border-t mt-3">
                    <p className="font-medium mb-1">Aktuelle Mannschafts-Zugehörigkeiten:</p>
                    <p>{currentShooter.id ? getTeamInfoForShooter(currentShooter as Shooter) : '-'}</p>
                    <p className="mt-1">Die Zuordnung zu Mannschaften erfolgt primär über die Mannschaftsverwaltung auf der Seite "/admin/teams".</p>
                  </div>
                )}
              </div>
            )}
            <DialogFooter className="pt-4">
              <DialogClose asChild><Button type="button" variant="outline">Abbrechen</Button></DialogClose>
              <Button type="submit" disabled={isFormSubmitting || isLoadingTeamsForDialog}>
                {(isFormSubmitting || isLoadingTeamsForDialog) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Speichern
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Dialog */}
      <AlertDialog open={isBulkDeleteOpen} onOpenChange={setIsBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mehrere Schützen löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie wirklich {selectedShootersForDelete.length} Schützen löschen? 
              Dies entfernt sie auch aus allen zugeordneten Mannschaften.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsBulkDeleteOpen(false)}>Abbrechen</AlertDialogCancel>
            <AlertDialogAction 
              onClick={async () => {
                setIsDeleting(true);
                try {
                  const batch = writeBatch(db);
                  
                  for (const shooterId of selectedShootersForDelete) {
                    const shooter = shootersOfActiveClub.find(s => s.id === shooterId);
                    if (!shooter) continue;
                    
                    const shooterDocRef = doc(db, SHOOTERS_COLLECTION, shooterId);
                    batch.delete(shooterDocRef);
                    
                    (shooter.teamIds || []).forEach(teamId => {
                      if (teamId && typeof teamId === 'string' && teamId.trim() !== '') {
                        const teamDocRef = doc(db, TEAMS_COLLECTION, teamId);
                        batch.update(teamDocRef, { shooterIds: arrayRemove(shooterId) });
                      }
                    });
                  }
                  
                  await batch.commit();
                  toast({ 
                    title: "Schützen gelöscht", 
                    description: `${selectedShootersForDelete.length} Schützen wurden erfolgreich entfernt.` 
                  });
                  setSelectedShootersForDelete([]);
                  fetchPageDataForActiveClub();
                } catch (error: any) {
                  console.error('Bulk delete error:', error);
                  toast({ 
                    title: "Fehler beim Löschen", 
                    description: error.message || "Die Schützen konnten nicht gelöscht werden.", 
                    variant: "destructive" 
                  });
                } finally {
                  setIsDeleting(false);
                  setIsBulkDeleteOpen(false);
                }
              }}
              disabled={isDeleting} 
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} 
              {selectedShootersForDelete.length} Schützen löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
