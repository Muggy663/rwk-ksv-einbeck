// src/app/verein/schuetzen/page.tsx
"use client";
import React, { useState, useEffect, FormEvent, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Edit, Trash2, UserCircle, Loader2, AlertTriangle } from 'lucide-react';
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
import { useVereinAuth } from '@/app/verein/layout';
import type { Shooter, Club, Team, FirestoreLeagueSpecificDiscipline, League, UserPermission, TeamValidationInfo } from '@/types/rwk';
import { MAX_SHOOTERS_PER_TEAM, getDisciplineCategory, GEWEHR_DISCIPLINES, PISTOL_DISCIPLINES, leagueDisciplineOptions } from '@/types/rwk';
import { db } from '@/lib/firebase/config';
import { 
  collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, 
  where, orderBy, documentId, writeBatch, getDoc as getFirestoreDoc, arrayRemove, arrayUnion
} from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useRouter, useSearchParams } from 'next/navigation'; 

const SHOOTERS_COLLECTION = "rwk_shooters";
const TEAMS_COLLECTION = "rwk_teams";
const CLUBS_COLLECTION = "clubs";
const LEAGUES_COLLECTION = "rwk_leagues";

export default function VereinSchuetzenPage() {
  const { user, userPermission, loadingPermissions, permissionError } = useVereinAuth();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryTeamId = searchParams.get('teamId');

  const [activeClubId, setActiveClubId] = useState<string | null>(null);
  const [activeClubName, setActiveClubName] = useState<string | null>(null);
  const [assignedClubsForSelect, setAssignedClubsForSelect] = useState<Array<{ id: string; name: string }>>([]);
  const [isLoadingAssignedClubDetails, setIsLoadingAssignedClubDetails] = useState(true);
  
  const [shootersOfActiveClub, setShootersOfActiveClub] = useState<Shooter[]>([]);
  const [allTeamsOfActiveClub, setAllTeamsOfActiveClub] = useState<Team[]>([]);
  const [allLeagues, setAllLeagues] = useState<League[]>([]);


  const [isLoadingPageData, setIsLoadingPageData] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentShooter, setCurrentShooter] = useState<Partial<Shooter> & { id?: string } | null>(null);
  const [formMode, setFormMode] = useState<'new' | 'edit'>('new');
  
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [shooterToDelete, setShooterToDelete] = useState<Shooter | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);

  const [contextTeamName, setContextTeamName] = useState<string | null>(null);
  const [isContextTeamNameLoading, setIsContextTeamNameLoading] = useState(false);

  const [teamsOfSelectedClubInDialog, setTeamsOfSelectedClubInDialog] = useState<Array<Team & { leagueType?: FirestoreLeagueSpecificDiscipline, leagueCompetitionYear?: number, currentShooterCount?: number }>>([]);
  const [isLoadingTeamsForDialog, setIsLoadingTeamsForDialog] = useState(false);
  const [selectedTeamIdsInForm, setSelectedTeamIdsInForm] = useState<string[]>([]);

  useEffect(() => {
    if (loadingPermissions) {
      setIsLoadingAssignedClubDetails(true);
      return;
    }
    if (permissionError || !userPermission) {
      setIsLoadingAssignedClubDetails(false);
      return;
    }

    if (userPermission.clubIds && userPermission.clubIds.length > 0) {
      setIsLoadingAssignedClubDetails(true);
      const fetchClubNames = async () => {
        try {
          const clubPromises = userPermission.clubIds!.map(id => getFirestoreDoc(doc(db, CLUBS_COLLECTION, id)));
          const clubSnaps = await Promise.all(clubPromises);
          const clubsData = clubSnaps.filter(snap => snap.exists()).map(snap => ({ id: snap.id, name: (snap.data() as Club).name || "Unbek. Verein" }));
          setAssignedClubsForSelect(clubsData);
          if (clubsData.length === 1) {
            setActiveClubId(clubsData[0].id);
            setActiveClubName(clubsData[0].name);
          } else if (clubsData.length > 0 && !activeClubId && queryTeamId) {
            const teamDoc = await getFirestoreDoc(doc(db, TEAMS_COLLECTION, queryTeamId));
            if (teamDoc.exists()) {
              const teamClubId = teamDoc.data().clubId;
              if (userPermission.clubIds.includes(teamClubId)) {
                const club = clubsData.find(c => c.id === teamClubId);
                setActiveClubId(teamClubId);
                setActiveClubName(club?.name || null);
              }
            }
          } else if (activeClubId) {
            const currentActive = clubsData.find(c => c.id === activeClubId);
            setActiveClubName(currentActive?.name || null);
          }
        } catch (err) {
          console.error("VereinSchuetzenPage: Error fetching assigned club names:", err);
          toast({ title: "Fehler", description: "Vereinsinformationen konnten nicht geladen werden.", variant: "destructive" });
        } finally {
          setIsLoadingAssignedClubDetails(false);
        }
      };
      fetchClubNames();
    } else {
      setAssignedClubsForSelect([]);
      setActiveClubId(null);
      setActiveClubName(null);
      setIsLoadingAssignedClubDetails(false);
    }
  }, [userPermission, loadingPermissions, permissionError, toast, queryTeamId, activeClubId]);

  useEffect(() => {
    const fetchLeagues = async () => {
        setIsLoadingPageData(true); // Mit InitialData kombinieren
        try {
            const leaguesSnapshot = await getDocs(query(collection(db, LEAGUES_COLLECTION), orderBy("name", "asc")));
            const fetchedLeagues = leaguesSnapshot.docs.map(d => ({id: d.id, ...d.data()} as League))
                                    .filter(l => l.id && typeof l.id === 'string' && l.id.trim() !== "");
            setAllLeagues(fetchedLeagues);
        } catch (error) {
            console.error("VereinSchuetzenPage: Error fetching all leagues:", error);
            toast({ title: "Fehler", description: "Ligen konnten nicht geladen werden.", variant: "destructive" });
        } finally {
            // setIsLoadingPageData wird im kombinierten fetch gesetzt
        }
    };
    fetchLeagues();
  }, [toast]);


  const fetchShootersAndTeamsForActiveClub = useCallback(async () => {
    if (!activeClubId) {
      setShootersOfActiveClub([]);
      setAllTeamsOfActiveClub([]);
      setIsLoadingPageData(false);
      return;
    }
    setIsLoadingPageData(true);
    try {
      const shootersQuery = query(collection(db, SHOOTERS_COLLECTION), where("clubId", "==", activeClubId), orderBy("lastName", "asc"), orderBy("firstName", "asc"));
      const teamsQuery = query(collection(db, TEAMS_COLLECTION), where("clubId", "==", activeClubId));

      const [shootersSnapshot, teamsSnapshot] = await Promise.all([
        getDocs(shootersQuery),
        getDocs(teamsQuery),
      ]);
      
      const fetchedShooters = shootersSnapshot.docs.map(d => ({ id: d.id, ...d.data(), teamIds: d.data().teamIds || [] } as Shooter))
                                .filter(s => s.id && typeof s.id === 'string' && s.id.trim() !== "");
      setShootersOfActiveClub(fetchedShooters);

      const fetchedTeams = teamsSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as Team))
                                .filter(t => t.id && typeof t.id === 'string' && t.id.trim() !== "");
      setAllTeamsOfActiveClub(fetchedTeams);

    } catch (error) {
      console.error("VereinSchuetzenPage: Error fetching shooters/teams for active club:", error);
      toast({ title: "Fehler beim Laden der Vereinsdaten", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsLoadingPageData(false);
    }
  }, [activeClubId, toast]);

  useEffect(() => {
    if (activeClubId) {
      fetchShootersAndTeamsForActiveClub();
    }
  }, [activeClubId, fetchShootersAndTeamsForActiveClub]);
  
  useEffect(() => {
    const fetchContextTeam = async () => {
      if (queryTeamId) {
        setIsContextTeamNameLoading(true);
        const team = allTeamsOfActiveClub.find(t => t.id === queryTeamId);
        if (team) {
          setContextTeamName(team.name);
        } else {
          // Versuch, direkt aus DB zu laden, falls noch nicht in allTeamsOfActiveClub
          try {
            const teamDoc = await getFirestoreDoc(doc(db, TEAMS_COLLECTION, queryTeamId));
            if (teamDoc.exists()) {
              setContextTeamName(teamDoc.data().name);
            } else {
              setContextTeamName(null);
            }
          } catch (error) {
            setContextTeamName(null);
            console.error("Error fetching context team name directly:", error);
          }
        }
        setIsContextTeamNameLoading(false);
      } else {
        setContextTeamName(null);
      }
    };
    fetchContextTeam();
  }, [queryTeamId, allTeamsOfActiveClub]);


  const fetchTeamsForClubInDialog = useCallback(async () => {
    if (!isFormOpen || formMode !== 'new' || !activeClubId || allLeagues.length === 0) {
      setTeamsOfSelectedClubInDialog([]);
      return;
    }
    setIsLoadingTeamsForDialog(true);
    try {
      // allTeamsOfActiveClub sollte bereits die Teams des aktuellen Vereins enthalten
      const teamsData = allTeamsOfActiveClub.map(team => {
        const league = allLeagues.find(l => l.id === team.leagueId);
        return {
          ...team,
          leagueType: league?.type,
          leagueCompetitionYear: league?.competitionYear,
          currentShooterCount: (team.shooterIds || []).length,
        };
      }).sort((a,b) => a.name.localeCompare(b.name));
      setTeamsOfSelectedClubInDialog(teamsData);
    } catch (error) {
      console.error("VereinSchuetzenPage: Error preparing teams for dialog:", error);
      toast({ title: "Fehler", description: "Mannschaften für Dialog konnten nicht vorbereitet werden.", variant: "destructive" });
    } finally {
      setIsLoadingTeamsForDialog(false);
    }
  }, [isFormOpen, formMode, activeClubId, allLeagues, allTeamsOfActiveClub, toast]);

  useEffect(() => {
    if(isFormOpen && formMode === 'new' && activeClubId) {
        fetchTeamsForClubInDialog();
    }
  }, [isFormOpen, formMode, activeClubId, fetchTeamsForClubInDialog]);


  const handleAddNewShooter = () => {
    if (!activeClubId) {
      toast({ title: "Kein Verein ausgewählt", variant: "destructive" }); return;
    }
    setFormMode('new');
    let initialTeamIds: string[] = [];
    if (queryTeamId && teamsOfSelectedClubInDialog.some(t => t.id === queryTeamId && t.clubId === activeClubId)) {
        const teamContext = teamsOfSelectedClubInDialog.find(t => t.id === queryTeamId);
        if (teamContext && (teamContext.currentShooterCount || 0) < MAX_SHOOTERS_PER_TEAM) {
            initialTeamIds = [queryTeamId];
        } else if (teamContext) {
            toast({ title: "Mannschaft voll", description: `Kontext-Team "${teamContext.name}" ist voll.`, variant: "warning" });
        }
    }
    setCurrentShooter({ clubId: activeClubId, gender: 'male', teamIds: initialTeamIds });
    setSelectedTeamIdsInForm(initialTeamIds);
    setIsFormOpen(true);
  };

  const handleEditShooter = (shooter: Shooter) => {
     if (shooter.clubId !== activeClubId) {
      toast({ title: "Nicht autorisiert", variant: "destructive" }); return;
    }
    setFormMode('edit');
    setCurrentShooter(shooter);
    setSelectedTeamIdsInForm(shooter.teamIds || []); // Im Edit-Modus keine Team-Auswahl-Box
    setIsFormOpen(true);
  };

  const handleDeleteConfirmation = (shooter: Shooter) => {
     if (shooter.clubId !== activeClubId) {
      toast({ title: "Nicht autorisiert", variant: "destructive" }); return;
    }
    setShooterToDelete(shooter);
    setIsAlertOpen(true);
  };

  const handleDeleteShooter = async () => {
    if (!shooterToDelete || !shooterToDelete.id || !user || shooterToDelete.clubId !== activeClubId) {
      toast({ title: "Fehler", variant: "destructive" }); setIsAlertOpen(false); setShooterToDelete(null); return;
    }
    setIsDeleting(true);
    try {
      const batch = writeBatch(db);
      batch.delete(doc(db, SHOOTERS_COLLECTION, shooterToDelete.id));
      (shooterToDelete.teamIds || []).forEach(teamId => {
        const teamDocInActiveClub = allTeamsOfActiveClub.find(t => t.id === teamId);
        if (teamDocInActiveClub) batch.update(doc(db, TEAMS_COLLECTION, teamId), { shooterIds: arrayRemove(shooterToDelete.id) });
      });
      await batch.commit();
      toast({ title: "Schütze gelöscht", description: `"${shooterToDelete.name}" wurde entfernt.` });
      fetchShootersAndTeamsForActiveClub(); 
    } catch (error) {
      console.error("VereinSchuetzenPage: Error deleting shooter:", error);
      toast({ title: "Fehler beim Löschen", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsDeleting(false); setIsAlertOpen(false); setShooterToDelete(null);
    }
  };

  const handleSubmitShooterForm = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!currentShooter || !currentShooter.firstName?.trim() || !currentShooter.lastName?.trim() || !user || !activeClubId) {
      toast({ title: "Ungültige Eingabe", variant: "destructive" }); return;
    }
    
    setIsFormSubmitting(true);
    const combinedName = `${currentShooter.firstName.trim()} ${currentShooter.lastName.trim()}`;
    
    try {
      const shootersColRef = collection(db, SHOOTERS_COLLECTION);
      let qDuplicate = query(shootersColRef, where("name", "==", combinedName), where("clubId", "==", activeClubId));
      if (formMode === 'edit' && currentShooter.id) {
        qDuplicate = query(shootersColRef, where("name", "==", combinedName), where("clubId", "==", activeClubId), where(documentId(), "!=", currentShooter.id));
      }
      const duplicateSnap = await getDocs(qDuplicate);
      if (!duplicateSnap.empty) {
        toast({ title: "Doppelter Schütze", description: `"${combinedName}" existiert bereits in ${activeClubName}.`, variant: "destructive" });
        setIsFormSubmitting(false); return;
      }

      const batch = writeBatch(db);
      if (formMode === 'new') {
        const assignedTeamsByYearAndCategory: Record<string, { teamId: string, category: 'Gewehr' | 'Pistole' }> = {};
        let validNewTeamAssignments = true;

        for (const teamId of selectedTeamIdsInForm) {
            const teamInfo = teamsOfSelectedClubInDialog.find(t => t.id === teamId);
            if (!teamInfo || teamInfo.leagueCompetitionYear === undefined || !teamInfo.leagueType) continue;
            const category = getDisciplineCategory(teamInfo.leagueType);
            if (!category) continue;
            const yearCategoryKey = `${teamInfo.leagueCompetitionYear}_${category}`;
            if (assignedTeamsByYearAndCategory[yearCategoryKey] && assignedTeamsByYearAndCategory[yearCategoryKey].teamId !== teamId) {
                toast({title: "Regelverstoß", description: `Schütze kann nicht zwei ${category}-Mannschaften im Jahr ${teamInfo.leagueCompetitionYear} zugewiesen werden.`, variant: "destructive", duration: 7000});
                validNewTeamAssignments = false; break;
            }
            assignedTeamsByYearAndCategory[yearCategoryKey] = { teamId, category };
        }

        if (!validNewTeamAssignments) { setIsFormSubmitting(false); return; }
        
        const newShooterRef = doc(collection(db, SHOOTERS_COLLECTION));
        const shooterDataForSave: Omit<Shooter, 'id'> = {
          firstName: currentShooter.firstName.trim(), lastName: currentShooter.lastName.trim(), name: combinedName,
          clubId: activeClubId, gender: currentShooter.gender || 'male', teamIds: selectedTeamIdsInForm,
        };
        batch.set(newShooterRef, shooterDataForSave);

        selectedTeamIdsInForm.forEach(teamId => {
          const teamInfo = teamsOfSelectedClubInDialog.find(t => t.id === teamId);
          if (teamInfo && (teamInfo.currentShooterCount || 0) < MAX_SHOOTERS_PER_TEAM) {
            batch.update(doc(db, TEAMS_COLLECTION, teamId), { shooterIds: arrayUnion(newShooterRef.id) });
          } else if (teamInfo) {
            toast({title:"Mannschaft voll", description:`Schütze konnte Team "${teamInfo.name}" nicht zugewiesen werden (voll).`, variant: "warning", duration: 5000});
          }
        });
        toast({ title: "Schütze erstellt" });
      } else if (formMode === 'edit' && currentShooter.id) {
        const shooterDocRef = doc(db, SHOOTERS_COLLECTION, currentShooter.id);
        batch.update(shooterDocRef, {
          firstName: currentShooter.firstName.trim(), lastName: currentShooter.lastName.trim(), name: combinedName,
          gender: currentShooter.gender || 'male',
        });
        toast({ title: "Schütze aktualisiert" });
      }
      await batch.commit();
      setIsFormOpen(false); setCurrentShooter(null); setSelectedTeamIdsInForm([]);
      fetchShootersAndTeamsForActiveClub();
    } catch (error) {
      console.error("VereinSchuetzenPage: Error saving shooter:", error);
      toast({ title: `Fehler`, description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsFormSubmitting(false);
    }
  };

  const handleFormInputChange = (field: keyof Pick<Shooter, 'firstName' | 'lastName' | 'gender'>, value: string) => {
     setCurrentShooter(prev => prev ? ({ ...prev, [field]: value }) : null);
  };

  const handleTeamSelectionChangeInForm = (teamId: string, checked: boolean) => {
    const teamInfo = teamsOfSelectedClubInDialog.find(t => t.id === teamId);
    if (!teamInfo) return;

    const newSelectedTeamIds = checked 
        ? [...selectedTeamIdsInForm, teamId]
        : selectedTeamIdsInForm.filter(id => id !== teamId);

    let conflict = false;
    const categoryAssignments: Record<string, string> = {}; // 'year_category' -> teamId

    for (const selectedId of newSelectedTeamIds) {
        const currentSelectedTeam = teamsOfSelectedClubInDialog.find(t => t.id === selectedId);
        if (!currentSelectedTeam || currentSelectedTeam.leagueCompetitionYear === undefined || !currentSelectedTeam.leagueType) continue;
        const category = getDisciplineCategory(currentSelectedTeam.leagueType);
        if (!category) continue;
        const key = `${currentSelectedTeam.leagueCompetitionYear}_${category}`;
        if (categoryAssignments[key] && categoryAssignments[key] !== selectedId) {
            toast({ title: "Regelverstoß", description: `Ein Schütze darf pro Jahr nur einem ${category}-Team angehören.`, variant: "destructive", duration: 7000 });
            conflict = true; break;
        }
        categoryAssignments[key] = selectedId;
    }

    if (!conflict) setSelectedTeamIdsInForm(newSelectedTeamIds);
  };
  
  const getTeamInfoForShooter = useCallback((shooter: Shooter): string => {
    const teamIds = shooter.teamIds || [];
    if (teamIds.length === 0) return '-';
    if (contextTeamName && teamIds.includes(queryTeamId || '')) {
      return teamIds.length > 1 ? `${contextTeamName} (+${teamIds.length - 1} weitere)` : contextTeamName;
    }
    if (teamIds.length === 1 && allTeamsOfActiveClub.length > 0) {
      const team = allTeamsOfActiveClub.find(t => t.id === teamIds[0]);
      return team ? team.name : "1 Mannschaft";
    }
    return `${teamIds.length} Mannschaften`;
  }, [allTeamsOfActiveClub, queryTeamId, contextTeamName]);

  const isVV = userPermission?.role === 'vereinsvertreter';

  if (loadingPermissions || isLoadingAssignedClubDetails) { 
    return <div className="flex justify-center items-center py-12"><Loader2 className="h-12 w-12 animate-spin text-primary" /> <p className="ml-2">Lade Benutzer- & Vereinsdaten...</p></div>;
  }
  if (permissionError) {
    return <div className="p-6"><Card className="border-destructive bg-destructive/10"><CardHeader><CardTitle className="text-destructive flex items-center"><AlertTriangle className="mr-2 h-5 w-5" /> Zugriffsproblem</CardTitle></CardHeader><CardContent><p>{permissionError}</p></CardContent></Card></div>;
  }
   if (!userPermission || (!userPermission.clubIds || userPermission.clubIds.length === 0)) {
     return <div className="p-6"><Card className="border-amber-500 bg-amber-50/50"><CardHeader><CardTitle className="text-amber-700">Keine Vereinszuweisung</CardTitle></CardHeader><CardContent><p>Ihrem Konto ist kein Verein für die Schützenverwaltung zugewiesen.</p></CardContent></Card></div>;
   }
  if (assignedClubsForSelect.length > 1 && !activeClubId) {
    return (
      <div className="space-y-6">
         <div className="flex justify-between items-center"><h1 className="text-2xl font-semibold text-primary">Meine Schützen</h1></div>
        <Card className="shadow-md">
          <CardHeader><CardTitle>Verein auswählen</CardTitle><CardDescription>Wählen Sie den Verein, dessen Schützen Sie verwalten möchten.</CardDescription></CardHeader>
          <CardContent>
            <Select onValueChange={(value) => { setActiveClubId(value); const c = assignedClubsForSelect.find(cl => cl.id === value); setActiveClubName(c?.name || null); setShootersOfActiveClub([]); setAllTeamsOfActiveClub([]); }}>
              <SelectTrigger className="w-full sm:w-[300px]"><SelectValue placeholder="Verein wählen..." /></SelectTrigger>
              <SelectContent>
                {assignedClubsForSelect.filter(c => c.id && c.id.trim() !== "").map(club => (<SelectItem key={club.id} value={club.id}>{club.name}</SelectItem>))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>
    );
  }
   if (!activeClubId && !isLoadingAssignedClubDetails) { // Fallback, falls kein Verein aktiv werden konnte
    return <div className="p-6 text-center text-muted-foreground"><AlertTriangle className="mx-auto h-10 w-10 mb-2 text-destructive" /><p>Kein Verein aktiv für die Verwaltung. Bitte kontaktieren Sie den Administrator, falls Ihnen Vereine zugewiesen sein sollten.</p></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-primary">Meine Schützen</h1>
          {activeClubName && <p className="text-muted-foreground">Verein: <span className="font-semibold">{activeClubName}</span></p>}
          {queryTeamId && contextTeamName && !isContextTeamNameLoading && <p className="text-xs text-muted-foreground">Kontext: Schützen für Mannschaft "{contextTeamName}"</p>}
          {queryTeamId && isContextTeamNameLoading && <p className="text-xs text-muted-foreground">Lade Team-Kontext...</p>}
        </div>
         {isVV && activeClubId && (
            <Button onClick={handleAddNewShooter} disabled={isLoadingPageData || isLoadingAssignedClubDetails}>
                <PlusCircle className="mr-2 h-5 w-5" /> Neuen Schützen anlegen
            </Button>
         )}
      </div>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Schützenliste für {activeClubName || "ausgewählten Verein"}</CardTitle>
          <CardDescription>Verwalten Sie hier die Schützen Ihres Vereins.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingPageData ? (
            <div className="flex justify-center items-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /><p className="ml-2">Lade Schützen...</p></div>
          ) : !activeClubId && assignedClubsForSelect.length > 1 ? (
             <div className="p-6 text-center text-muted-foreground"><p>Bitte wählen Sie oben einen Verein aus.</p></div>
          ): shootersOfActiveClub.length === 0 && activeClubId ? (
            <div className="p-6 text-center text-muted-foreground bg-secondary/30 rounded-md">
              <p>{`Keine Schützen für "${activeClubName || 'diesen Verein'}" gefunden.`}</p>
              {isVV && <p className="text-sm mt-1">Klicken Sie auf "Neuen Schützen anlegen".</p>}
            </div>
          ) : shootersOfActiveClub.length > 0 && activeClubId ? (
            <Table>
              <TableHeader><TableRow><TableHead>Nachname</TableHead><TableHead>Vorname</TableHead><TableHead>Geschlecht</TableHead><TableHead>Mannschaften (Info)</TableHead>
                {isVV && <TableHead className="text-right">Aktionen</TableHead>}
              </TableRow></TableHeader>
              <TableBody>
                {shootersOfActiveClub.map((shooter) => (
                  <TableRow key={shooter.id}>
                    <TableCell>{shooter.lastName}</TableCell><TableCell>{shooter.firstName}</TableCell>
                    <TableCell>{shooter.gender === 'female' ? 'Weiblich' : (shooter.gender === 'male' ? 'Männlich' : 'N/A')}</TableCell>
                    <TableCell className="text-xs">{getTeamInfoForShooter(shooter)}</TableCell>
                    {isVV && (
                        <TableCell className="text-right space-x-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEditShooter(shooter)}><Edit className="h-4 w-4" /></Button>
                        <AlertDialog open={isAlertOpen && shooterToDelete?.id === shooter.id} onOpenChange={(open) => {if(!open) setShooterToDelete(null); setIsAlertOpen(open);}}>
                            <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/80" onClick={() => handleDeleteConfirmation(shooter)}><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader><AlertDialogTitle>Schütze löschen?</AlertDialogTitle><AlertDialogDescription>Möchten Sie "{shooterToDelete?.name}" wirklich löschen? Dies entfernt den Schützen auch aus allen zugeordneten Mannschaften.</AlertDialogDescription></AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel onClick={() => {setIsAlertOpen(false); setShooterToDelete(null);}}>Abbrechen</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDeleteShooter} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
                                    {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Löschen
                                </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                        </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : null }
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={(open) => { if (!open) {setCurrentShooter(null); setSelectedTeamIdsInForm([]);} setIsFormOpen(open); }}>
        <DialogContent className="sm:max-w-lg">
          <form onSubmit={handleSubmitShooterForm}>
            <DialogHeader>
              <DialogTitle>{formMode === 'new' ? 'Neuen Schützen anlegen' : 'Schütze bearbeiten'}</DialogTitle>
              <DialogDescriptionComponent>Für Verein: {activeClubName || 'Ihr Verein'}</DialogDescriptionComponent>
            </DialogHeader>
            {currentShooter && (
              <div className="space-y-4 py-4">
                <div className="space-y-1.5"><Label htmlFor="vv-shooter-lastName">Nachname</Label><Input id="vv-shooter-lastName" value={currentShooter.lastName || ''} onChange={(e) => handleFormInputChange('lastName', e.target.value)} required /></div>
                <div className="space-y-1.5"><Label htmlFor="vv-shooter-firstName">Vorname</Label><Input id="vv-shooter-firstName" value={currentShooter.firstName || ''} onChange={(e) => handleFormInputChange('firstName', e.target.value)} required /></div>
                <div className="space-y-1.5">
                  <Label htmlFor="vv-shooter-gender">Geschlecht</Label>
                  <Select value={currentShooter.gender || 'male'} onValueChange={(v) => handleFormInputChange('gender', v as 'male' | 'female')}>
                    <SelectTrigger id="vv-shooter-gender"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="male">Männlich</SelectItem><SelectItem value="female">Weiblich</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5"><Label htmlFor="vv-shooter-clubDisplay">Verein (Zugewiesen)</Label><Input id="vv-shooter-clubDisplay" value={activeClubName || ''} disabled className="bg-muted/50" /></div>
                 
                {formMode === 'new' && activeClubId && (
                  <div className="space-y-2 pt-3 border-t mt-3">
                    <Label className="text-base font-medium">Mannschaften für "{activeClubName}" zuordnen</Label>
                    <p className="text-xs text-muted-foreground">Ein Schütze darf pro Saison und pro Disziplinkategorie (Gewehr/Pistole) nur einem Team angehören. Max. {MAX_SHOOTERS_PER_TEAM} Schützen pro Team.</p>
                    {isLoadingTeamsForDialog ? (
                      <div className="flex items-center justify-center p-4 h-32 border rounded-md bg-muted/30"><Loader2 className="h-6 w-6 animate-spin text-primary" /><p className="ml-2">Lade Mannschaften...</p></div>
                    ): teamsOfSelectedClubInDialog.length > 0 ? (
                      <ScrollArea className="h-32 rounded-md border p-3 bg-muted/20">
                        <div className="space-y-1">
                          {teamsOfSelectedClubInDialog.map(team => {
                            if(!team || !team.id) return null;
                            const isSelected = selectedTeamIdsInForm.includes(team.id);
                            let isDisabled = (team.currentShooterCount || 0) >= MAX_SHOOTERS_PER_TEAM && !isSelected;
                            let disableReason = isDisabled ? "(Voll)" : "";
                            if (!isDisabled && team.leagueCompetitionYear !== undefined && team.leagueType) {
                                const categoryOfThisTeam = getDisciplineCategory(team.leagueType);
                                if (categoryOfThisTeam) {
                                    const conflictExists = selectedTeamIdsInForm.some(selectedId => {
                                        if (selectedId === team.id) return false;
                                        const otherSelectedTeam = teamsOfSelectedClubInDialog.find(t => t.id === selectedId);
                                        return otherSelectedTeam && otherSelectedTeam.leagueCompetitionYear === team.leagueCompetitionYear && getDisciplineCategory(otherSelectedTeam.leagueType) === categoryOfThisTeam;
                                    });
                                    if (conflictExists && !isSelected) {
                                        isDisabled = true;
                                        disableReason = `(Bereits ${categoryOfThisTeam}-Team ${team.leagueCompetitionYear} gewählt)`;
                                    }
                                }
                            }
                            const leagueTypeLabel = leagueDisciplineOptions.find(opt => opt.value === team.leagueType)?.label || team.leagueType;
                            return (
                              <div key={team.id} className="flex items-center space-x-3 p-1.5 hover:bg-background/80 rounded-md">
                                <Checkbox id={`team-select-vv-${team.id}`} checked={isSelected} onCheckedChange={(checkedState) => handleTeamSelectionChangeInForm(team.id, !!checkedState)} disabled={isDisabled} className="h-4 w-4"/>
                                <Label htmlFor={`team-select-vv-${team.id}`} className={`font-normal text-sm ${isDisabled ? 'text-muted-foreground line-through' : 'cursor-pointer'}`}>
                                  {team.name}
                                  {team.leagueType && <span className="text-xs text-muted-foreground ml-1">({leagueTypeLabel}, {team.leagueCompetitionYear})</span>}
                                  {team.currentShooterCount !== undefined && <span className="text-xs text-muted-foreground ml-1">({team.currentShooterCount}/{MAX_SHOOTERS_PER_TEAM})</span>}
                                  {isDisabled && <span className="text-xs text-destructive ml-1">{disableReason}</span>}
                                </Label>
                              </div>
                            );
                          })}
                        </div>
                      </ScrollArea>
                    ) : (
                      <p className="text-sm text-muted-foreground p-4 h-32 border rounded-md flex items-center justify-center">Keine Mannschaften für diesen Verein gefunden oder alle sind voll/nicht zuweisbar.</p>
                    )}
                  </div>
                )}
                 {formMode === 'edit' && (
                  <div className="text-xs text-muted-foreground pt-2 border-t mt-3">
                    <p className="font-medium mb-1">Aktuelle Mannschafts-Zugehörigkeiten:</p>
                    <p>{getTeamInfoForShooter(currentShooter as Shooter)}</p>
                    <p className="mt-1">Die Zuordnung zu Mannschaften erfolgt primär über die Seite "Meine Mannschaften".</p>
                  </div>
                )}
              </div>
            )}
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => {setIsFormOpen(false); setCurrentShooter(null); setSelectedTeamIdsInForm([]);}}>Abbrechen</Button>
              <Button type="submit" disabled={isFormSubmitting || (formMode === 'new' && isLoadingTeamsForDialog)}>
                {(isFormSubmitting || (formMode === 'new' && isLoadingTeamsForDialog))&& <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Speichern
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
