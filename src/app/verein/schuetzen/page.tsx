// src/app/verein/schuetzen/page.tsx
"use client";
import React, { useState, useEffect, FormEvent, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Edit, Trash2, Loader2, AlertTriangle, UserCircle } from 'lucide-react';
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
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from "@/components/ui/checkbox"; // Beibehalten für Konsistenz, falls später gebraucht
import { ScrollArea } from "@/components/ui/scroll-area"; // Beibehalten für Konsistenz
import { useVereinAuth } from '@/app/verein/layout';
import type { Shooter, Club, Team, FirestoreLeagueSpecificDiscipline, League, UserPermission } from '@/types/rwk';
import { MAX_SHOOTERS_PER_TEAM, getDisciplineCategory, leagueDisciplineOptions } from '@/types/rwk';
import { db } from '@/lib/firebase/config';
import { 
  collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, 
  where, orderBy, documentId, writeBatch, getDoc as getFirestoreDoc, arrayRemove, arrayUnion
} from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useRouter, useSearchParams } from 'next/navigation'; // useSearchParams für queryTeamId

const SHOOTERS_COLLECTION = "rwk_shooters";
const TEAMS_COLLECTION = "rwk_teams";
const CLUBS_COLLECTION = "clubs";
const LEAGUES_COLLECTION = "rwk_leagues"; // Benötigt für Team-Validierungsdaten

export default function VereinSchuetzenPage() {
  const { user, loading: authLoading } = useVereinAuth(); // 'user' vom Context für UID
  const { userPermission, loadingPermissions, permissionError } = useVereinAuth();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryTeamId = searchParams.get('teamId');

  const [activeClubId, setActiveClubId] = useState<string | null>(null);
  const [activeClubName, setActiveClubName] = useState<string | null>(null);
  const [assignedClubsForSelect, setAssignedClubsForSelect] = useState<Array<{ id: string; name: string }>>([]);
  
  const [shootersOfActiveClub, setShootersOfActiveClub] = useState<Shooter[]>([]);
  const [allTeamsOfActiveClub, setAllTeamsOfActiveClub] = useState<Team[]>([]); // Für Anzeige "Mannschaften (Info)"
  const [allLeagues, setAllLeagues] = useState<League[]>([]); // Für Team-Validierungsdaten

  const [isLoadingPageData, setIsLoadingPageData] = useState(true);
  const [isLoadingAssignedClubDetails, setIsLoadingAssignedClubDetails] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentShooter, setCurrentShooter] = useState<Partial<Shooter> & { id?: string } | null>(null);
  const [formMode, setFormMode] = useState<'new' | 'edit'>('new');
  
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [shooterToDelete, setShooterToDelete] = useState<Shooter | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);

  const [contextTeamName, setContextTeamName] = useState<string | null>(null);
  const [isContextTeamNameLoading, setIsContextTeamNameLoading] = useState(false);

   // Effekt zur Ermittlung des aktiven Vereins basierend auf userPermission
  useEffect(() => {
    if (loadingPermissions) {
      setIsLoadingAssignedClubDetails(true);
      return;
    }
    if (permissionError) {
      setIsLoadingAssignedClubDetails(false);
      return;
    }

    if (userPermission && userPermission.clubIds && userPermission.clubIds.length > 0) {
      setIsLoadingAssignedClubDetails(true);
      const fetchClubNames = async () => {
        try {
          const clubPromises = userPermission.clubIds!.map(id => getFirestoreDoc(doc(db, CLUBS_COLLECTION, id)));
          const clubSnaps = await Promise.all(clubPromises);
          const clubsData = clubSnaps
            .filter(snap => snap.exists())
            .map(snap => ({ id: snap.id, name: (snap.data() as Club).name || "Unbek. Verein" }));
          
          setAssignedClubsForSelect(clubsData);

          if (clubsData.length === 1) {
            setActiveClubId(clubsData[0].id);
            setActiveClubName(clubsData[0].name);
          } else if (clubsData.length > 1 && !activeClubId && clubsData[0]?.id) {
            // setActiveClubId(clubsData[0].id); 
            // setActiveClubName(clubsData[0].name);
          } else if (activeClubId) { // Wenn schon einer aktiv war (z.B. durch Auswahl), Namen aktualisieren
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
  }, [userPermission, loadingPermissions, permissionError, activeClubId, toast]);

  // Lade alle Ligen einmalig für die Validierungslogik der Teamzuweisung (Disziplinkategorie)
  useEffect(() => {
    const fetchAllLeagues = async () => {
      try {
        const leaguesSnapshot = await getDocs(query(collection(db, LEAGUES_COLLECTION), orderBy("name", "asc")));
        setAllLeagues(leaguesSnapshot.docs.map(d => ({id: d.id, ...d.data()} as League)));
      } catch (error) {
        console.error("VereinSchuetzenPage: Error fetching all leagues for validation:", error);
      }
    };
    fetchAllLeagues();
  }, []);
  
  // Lade Schützen und Teams des aktiven Vereins
  const fetchShootersAndTeamsForActiveClub = useCallback(async () => {
    if (!activeClubId) {
      setShootersOfActiveClub([]);
      setAllTeamsOfActiveClub([]); // Wichtig für getTeamInfoForShooter
      return;
    }
    setIsLoadingPageData(true);
    try {
      const shootersQuery = query(collection(db, SHOOTERS_COLLECTION), where("clubId", "==", activeClubId), orderBy("lastName", "asc"), orderBy("firstName", "asc"));
      const teamsQuery = query(collection(db, TEAMS_COLLECTION), where("clubId", "==", activeClubId)); // Alle Teams des aktiven Vereins

      const [shootersSnapshot, teamsSnapshot] = await Promise.all([
        getDocs(shootersQuery),
        getDocs(teamsQuery),
      ]);
      
      setShootersOfActiveClub(shootersSnapshot.docs.map(d => ({ id: d.id, ...d.data(), teamIds: d.data().teamIds || [] } as Shooter)));
      setAllTeamsOfActiveClub(teamsSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as Team)));
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

  // Lade Kontext-Team-Namen, falls queryTeamId vorhanden
  useEffect(() => {
    const fetchContextTeam = async () => {
      if (queryTeamId && allTeamsOfActiveClub.length > 0) {
        setIsContextTeamNameLoading(true);
        const team = allTeamsOfActiveClub.find(t => t.id === queryTeamId);
        setContextTeamName(team?.name || null);
        setIsContextTeamNameLoading(false);
      } else if (!queryTeamId) {
        setContextTeamName(null);
      }
    };
    fetchContextTeam();
  }, [queryTeamId, allTeamsOfActiveClub]);


  const handleAddNewShooter = () => {
    if (!activeClubId) {
      toast({ title: "Kein Verein ausgewählt", description: "Bitte zuerst einen Verein auswählen.", variant: "destructive" });
      return;
    }
    setFormMode('new');
    let initialTeamIds: string[] = [];
    // Wenn im Kontext eines Teams, dieses Team initial zuweisen (wird später validiert)
    if (queryTeamId && allTeamsOfActiveClub.some(t => t.id === queryTeamId && t.clubId === activeClubId)) {
      initialTeamIds = [queryTeamId];
    }
    setCurrentShooter({ clubId: activeClubId, gender: 'male', teamIds: initialTeamIds });
    setSelectedTeamIdsInForm(initialTeamIds); // Für den Dialog
    // fetchTeamsForClubInDialog(); // Wird durch useEffect auf isFormOpen und activeClubId ausgelöst
    setIsFormOpen(true);
  };

  const handleEditShooter = (shooter: Shooter) => {
     if (shooter.clubId !== activeClubId) {
      toast({ title: "Nicht autorisiert", description: "Sie können nur Schützen Ihres aktuell ausgewählten Vereins bearbeiten.", variant: "destructive" });
      return;
    }
    setFormMode('edit');
    setCurrentShooter(shooter);
    // Teamzuweisung erfolgt nicht hier, sondern in der Mannschaftsverwaltung
    setSelectedTeamIdsInForm(shooter.teamIds || []); // Nur für Anzeige/Info
    setIsFormOpen(true);
  };

  const handleDeleteConfirmation = (shooter: Shooter) => {
     if (shooter.clubId !== activeClubId) {
      toast({ title: "Nicht autorisiert", description: "Sie können nur Schützen Ihres aktuell ausgewählten Vereins löschen.", variant: "destructive" });
      return;
    }
    setShooterToDelete(shooter);
    setIsAlertOpen(true);
  };

  const handleDeleteShooter = async () => {
    if (!shooterToDelete || !shooterToDelete.id || !user || shooterToDelete.clubId !== activeClubId) {
      toast({ title: "Fehler", description: "Aktion nicht möglich oder nicht autorisiert.", variant: "destructive" });
      setIsAlertOpen(false);
      setShooterToDelete(null); 
      return;
    }
    setIsDeleting(true);
    const shooterIdToDelete = shooterToDelete.id;
    const shooterName = shooterToDelete.name;
    try {
      const batch = writeBatch(db);
      const shooterDocRef = doc(db, SHOOTERS_COLLECTION, shooterIdToDelete);
      batch.delete(shooterDocRef);

      // Entferne Schütze aus allen Teams (des aktuellen Vereins, um sicher zu gehen)
      const teamsToUpdate = allTeamsOfActiveClub.filter(team => (team.shooterIds || []).includes(shooterIdToDelete));
      teamsToUpdate.forEach(team => {
        if (team.id) { 
            batch.update(doc(db, TEAMS_COLLECTION, team.id), { shooterIds: arrayRemove(shooterIdToDelete) });
        }
      });
      
      await batch.commit();
      toast({ title: "Schütze gelöscht", description: `"${shooterName}" wurde erfolgreich entfernt.` });
      fetchShootersAndTeamsForActiveClub(); 
    } catch (error) {
      console.error("VereinSchuetzenPage: Error deleting shooter:", error);
      toast({ title: "Fehler beim Löschen", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsDeleting(false);
      setIsAlertOpen(false);
      setShooterToDelete(null);
    }
  };

  const handleSubmitShooterForm = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!currentShooter || !currentShooter.firstName?.trim() || !currentShooter.lastName?.trim() || !user || !activeClubId) {
      toast({ title: "Ungültige Eingabe", description: "Vorname, Nachname sind erforderlich und ein Verein muss aktiv sein.", variant: "destructive" });
      return;
    }
    
    setIsFormSubmitting(true);
    const combinedName = `${currentShooter.firstName.trim()} ${currentShooter.lastName.trim()}`;
    
    const shooterDataForSave: Partial<Shooter> & { clubId: string } = {
      firstName: currentShooter.firstName.trim(),
      lastName: currentShooter.lastName.trim(),
      name: combinedName,
      clubId: activeClubId, 
      gender: currentShooter.gender || 'male',
    };
    
    try {
      const shootersColRef = collection(db, SHOOTERS_COLLECTION);
      let qDuplicate = query(shootersColRef, where("name", "==", combinedName), where("clubId", "==", activeClubId));
      if (formMode === 'edit' && currentShooter.id) {
        qDuplicate = query(shootersColRef, where("name", "==", combinedName), where("clubId", "==", activeClubId), where(documentId(), "!=", currentShooter.id));
      }
      const duplicateSnap = await getDocs(qDuplicate);
      if (!duplicateSnap.empty) {
        toast({ title: "Doppelter Schütze", description: `Ein Schütze namens "${combinedName}" existiert bereits in diesem Verein.`, variant: "destructive" });
        setIsFormSubmitting(false);
        return;
      }

      const batch = writeBatch(db);

      if (formMode === 'new') {
        // Da VVs Schützen hier nur anlegen und nicht komplex Teams zuweisen:
        // teamIds wird initial leer sein, Zuordnung über /app/verein/mannschaften
        const newShooterRef = doc(collection(db, SHOOTERS_COLLECTION));
        batch.set(newShooterRef, { ...shooterDataForSave, teamIds: [] }); // Initial leere teamIds
        toast({ title: "Schütze erstellt", description: `"${shooterDataForSave.name}" wurde erfolgreich für ${activeClubName} angelegt.` });

      } else if (formMode === 'edit' && currentShooter.id) {
        const shooterDocRef = doc(db, SHOOTERS_COLLECTION, currentShooter.id);
        // teamIds werden hier nicht geändert, nur Stammdaten
        const { teamIds, ...updateData } = shooterDataForSave; 
        batch.update(shooterDocRef, updateData);
        toast({ title: "Schütze aktualisiert", description: `"${combinedName}" wurde erfolgreich aktualisiert.` });
      }
      
      await batch.commit();
      setIsFormOpen(false);
      setCurrentShooter(null);
      fetchShootersAndTeamsForActiveClub();
    } catch (error) {
      console.error("VereinSchuetzenPage: Error saving shooter:", error);
      const action = formMode === 'new' ? 'Erstellen' : 'Aktualisieren';
      toast({ title: `Fehler beim ${action}`, description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsFormSubmitting(false);
    }
  };

  const handleFormInputChange = (field: keyof Pick<Shooter, 'firstName' | 'lastName' | 'gender'>, value: string) => {
     setCurrentShooter(prev => prev ? ({ ...prev, [field]: value }) : null);
  };
  
  const getTeamInfoForShooter = useCallback((shooter: Shooter): string => {
    const teamIds = shooter.teamIds || [];
    if (teamIds.length === 0) return '-';
    
    if (queryTeamId && contextTeamName && teamIds.includes(queryTeamId)) {
      const otherTeamCount = teamIds.filter(id => id !== queryTeamId).length;
      return otherTeamCount > 0 ? `${contextTeamName} (+${otherTeamCount} weitere)` : contextTeamName;
    }
    
    if (teamIds.length === 1 && allTeamsOfActiveClub.length > 0) {
      const team = allTeamsOfActiveClub.find(t => t.id === teamIds[0]);
      return team ? team.name : "1 Mannschaft zugeordnet";
    }
    return `${teamIds.length} Mannschaften zugeordnet`;
  }, [allTeamsOfActiveClub, queryTeamId, contextTeamName]);


  if (loadingPermissions || isLoadingAssignedClubDetails) { 
    return <div className="flex justify-center items-center py-12"><Loader2 className="h-12 w-12 animate-spin text-primary" /> <p className="ml-2">Lade Benutzer- & Vereinsdaten...</p></div>;
  }
  if (permissionError) {
    return <div className="p-6"><Card className="border-destructive"><CardHeader><CardTitle className="text-destructive flex items-center"><AlertTriangle className="mr-2 h-5 w-5" /> Zugriffsproblem</CardTitle></CardHeader><CardContent><p>{permissionError}</p></CardContent></Card></div>;
  }
   if (!userPermission || (userPermission.role !== 'vereinsvertreter' && userPermission.role !== 'mannschaftsfuehrer')) {
     return <div className="p-6"><Card className="border-amber-500"><CardHeader><CardTitle className="text-amber-700">Keine ausreichende Berechtigung</CardTitle></CardHeader><CardContent><p>Sie haben nicht die Rolle 'vereinsvertreter' oder 'mannschaftsfuehrer'.</p></CardContent></Card></div>;
   }
  if (!activeClubId && assignedClubsForSelect.length > 0) { // VV hat mehrere Vereine, aber noch keinen ausgewählt
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h1 className="text-2xl font-semibold text-primary">Meine Schützen</h1>
        </div>
        <Card className="shadow-sm bg-muted/30">
          <CardHeader><CardTitle>Verein auswählen</CardTitle><CardDescription>Bitte wählen Sie den Verein aus, für den Sie Schützen verwalten möchten.</CardDescription></CardHeader>
          <CardContent>
             <Select
                onValueChange={(value) => {
                  setActiveClubId(value);
                  const selectedC = assignedClubsForSelect.find(c => c.id === value);
                  setActiveClubName(selectedC?.name || null);
                }}
              >
                <SelectTrigger className="w-full sm:w-[300px]">
                  <SelectValue placeholder="Verein für Verwaltung wählen..." />
                </SelectTrigger>
                <SelectContent>
                  {assignedClubsForSelect.map(club => (
                    <SelectItem key={club.id} value={club.id}>{club.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
          </CardContent>
        </Card>
      </div>
    );
  }
  if (!activeClubId && assignedClubsForSelect.length === 0 && !loadingPermissions && !isLoadingAssignedClubDetails) {
     return <div className="p-6"><Card className="border-amber-500"><CardHeader><CardTitle className="text-amber-700 flex items-center"><AlertTriangle className="mr-2 h-5 w-5" /> Kein Verein zugewiesen</CardTitle></CardHeader><CardContent><p>Ihrem Konto ist kein spezifischer Verein für die Schützenverwaltung zugewiesen. Bitte kontaktieren Sie den Administrator.</p></CardContent></Card></div>;
  }


  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-primary">Meine Schützen</h1>
          {activeClubName && <p className="text-muted-foreground">Verein: <span className="font-semibold">{activeClubName}</span></p>}
          {queryTeamId && contextTeamName && <p className="text-xs text-muted-foreground">Kontext: Schützen für Mannschaft "{contextTeamName}"</p>}
        </div>
         {userPermission?.role === 'vereinsvertreter' && activeClubId && (
            <Button onClick={handleAddNewShooter} disabled={isLoadingPageData}>
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
          {isLoadingPageData && activeClubId ? (
            <div className="flex justify-center items-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /><p className="ml-2">Lade Schützen...</p></div>
          ) : !activeClubId ? (
             <div className="p-6 text-center text-muted-foreground"><p>Bitte wählen Sie zuerst einen Verein aus (falls mehrere zugewiesen sind).</p></div>
          ) : shootersOfActiveClub.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground bg-secondary/30 rounded-md">
              <p>{`Keine Schützen für "${activeClubName || 'diesen Verein'}" gefunden oder angelegt.`}</p>
              {userPermission?.role === 'vereinsvertreter' && <p className="text-sm mt-1">Klicken Sie auf "Neuen Schützen anlegen", um zu beginnen.</p>}
            </div>
          ) : (
            <Table>
              <TableHeader><TableRow><TableHead>Nachname</TableHead><TableHead>Vorname</TableHead><TableHead>Geschlecht</TableHead><TableHead>Mannschaften (Info)</TableHead>
                {userPermission?.role === 'vereinsvertreter' && <TableHead className="text-right">Aktionen</TableHead>}
              </TableRow></TableHeader>
              <TableBody>
                {shootersOfActiveClub.map((shooter) => (
                  <TableRow key={shooter.id}>
                    <TableCell>{shooter.lastName}</TableCell>
                    <TableCell>{shooter.firstName}</TableCell>
                    <TableCell>{shooter.gender === 'female' ? 'Weiblich' : (shooter.gender === 'male' ? 'Männlich' : 'N/A')}</TableCell>
                    <TableCell className="text-xs">{getTeamInfoForShooter(shooter)}</TableCell>
                    {userPermission?.role === 'vereinsvertreter' && (
                        <TableCell className="text-right space-x-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEditShooter(shooter)} aria-label="Schütze bearbeiten"><Edit className="h-4 w-4" /></Button>
                        <AlertDialog open={isAlertOpen && shooterToDelete?.id === shooter.id} onOpenChange={(open) => {if(!open) setShooterToDelete(null); setIsAlertOpen(open);}}>
                            <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/80" onClick={() => handleDeleteConfirmation(shooter)} aria-label="Schütze löschen"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
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
          )}
        </CardContent>
      </Card>

      {/* Dialog for New/Edit Shooter */}
      <Dialog open={isFormOpen} onOpenChange={(open) => { if (!open) {setCurrentShooter(null);} setIsFormOpen(open); }}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleSubmitShooterForm}>
            <DialogHeader>
              <DialogTitle>{formMode === 'new' ? 'Neuen Schützen anlegen' : 'Schütze bearbeiten'}</DialogTitle>
              <DialogDescriptionComponent>Für Verein: {activeClubName || 'Ihr Verein'}</DialogDescriptionComponent>
            </DialogHeader>
            {currentShooter && (
              <div className="space-y-4 py-4">
                <div className="space-y-1.5">
                    <Label htmlFor="vv-shooter-firstName">Vorname</Label>
                    <Input id="vv-shooter-firstName" value={currentShooter.firstName || ''} onChange={(e) => handleFormInputChange('firstName', e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="vv-shooter-lastName">Nachname</Label>
                    <Input id="vv-shooter-lastName" value={currentShooter.lastName || ''} onChange={(e) => handleFormInputChange('lastName', e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="vv-shooter-gender">Geschlecht</Label>
                  <Select value={currentShooter.gender || 'male'} onValueChange={(v) => handleFormInputChange('gender', v as 'male' | 'female')}>
                    <SelectTrigger id="vv-shooter-gender"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="male">Männlich</SelectItem><SelectItem value="female">Weiblich</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="vv-shooter-clubDisplay">Verein (Zugewiesen)</Label>
                  <Input id="vv-shooter-clubDisplay" value={activeClubName || ''} disabled className="bg-muted/50" />
                </div>
                 {formMode === 'edit' && currentShooter.teamIds && currentShooter.teamIds.length > 0 && (
                  <div className="text-xs text-muted-foreground pt-2 border-t mt-3">
                    <p className="font-medium mb-1">Aktuelle Mannschafts-Zugehörigkeiten:</p>
                    <p>{getTeamInfoForShooter(currentShooter as Shooter)}</p>
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-1">Die Zuordnung zu Mannschaften erfolgt über die Seite "Meine Mannschaften".</p>
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => {setIsFormOpen(false); setCurrentShooter(null);}}>Abbrechen</Button>
              <Button type="submit" disabled={isFormSubmitting}>
                {isFormSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Speichern
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
