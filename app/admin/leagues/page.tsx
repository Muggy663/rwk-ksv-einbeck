// src/app/admin/leagues/page.tsx
"use client";
import React, { useState, useEffect, FormEvent, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Edit, Trash2, Loader2, Eye } from 'lucide-react';
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
import type { Season, League, FirestoreLeagueSpecificDiscipline } from '@/types/rwk';
import { leagueDisciplineOptions } from '@/types/rwk'; 
import { db } from '@/lib/firebase/config';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where, orderBy, documentId } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

const SEASONS_COLLECTION = "seasons";
const LEAGUES_COLLECTION = "rwk_leagues";

export default function AdminLeaguesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const querySeasonId = searchParams.get('seasonId');

  const { toast } = useToast();

  const [allSeasons, setAllSeasons] = useState<Season[]>([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>('');
  
  const [leagues, setLeagues] = useState<League[]>([]);
  
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isLoadingLeagues, setIsLoadingLeagues] = useState(false);
  const [isLoadingForm, setIsLoadingForm] = useState(false);
  const [isLoadingDelete, setIsLoadingDelete] = useState(false);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentLeague, setCurrentLeague] = useState<Partial<League> & { id?: string } | null>(null);
  const [formMode, setFormMode] = useState<'new' | 'edit'>('new');

  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [leagueToDelete, setLeagueToDelete] = useState<League | null>(null);

  const fetchSeasons = useCallback(async () => {
    console.log(">>> leagues/fetchSeasons: Fetching seasons...");
    setIsLoadingData(true);
    try {
      const seasonsSnapshot = await getDocs(query(collection(db, SEASONS_COLLECTION), orderBy("competitionYear", "desc")));
      const fetchedSeasons: Season[] = seasonsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Season));
      setAllSeasons(fetchedSeasons);
      console.log(">>> leagues/fetchSeasons: Seasons fetched:", fetchedSeasons.length);

      if (fetchedSeasons.length > 0) {
        if (querySeasonId && fetchedSeasons.some(s => s.id === querySeasonId)) {
          setSelectedSeasonId(querySeasonId);
        } else if (fetchedSeasons[0]?.id) {
          setSelectedSeasonId(fetchedSeasons[0].id); 
        } else {
          setSelectedSeasonId('');
        }
      } else {
        setSelectedSeasonId('');
        toast({ title: "Keine Saisons gefunden", description: "Bitte zuerst Saisons anlegen.", variant: "destructive" });
      }
    } catch (error) {
      console.error(">>> leagues/fetchSeasons: Error fetching seasons: ", error);
      toast({ title: "Fehler beim Laden der Saisons", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsLoadingData(false);
      console.log(">>> leagues/fetchSeasons: Finished. isLoadingData:", false);
    }
  }, [querySeasonId, toast]);

  useEffect(() => {
    fetchSeasons();
  }, [fetchSeasons]);

  const fetchLeaguesForSeason = useCallback(async (seasonId: string) => {
    if (!seasonId) {
      setLeagues([]);
      console.log(">>> leagues/fetchLeagues: No season selected, clearing leagues.");
      return;
    }
    console.log(`>>> leagues/fetchLeagues: Fetching leagues for seasonId ${seasonId}`);
    setIsLoadingLeagues(true);
    try {
      const q = query(
        collection(db, LEAGUES_COLLECTION),
        where("seasonId", "==", seasonId),
        orderBy("order", "asc")
      );
      const querySnapshot = await getDocs(q);
      const fetchedLeagues: League[] = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as League));
      setLeagues(fetchedLeagues);
      console.log(">>> leagues/fetchLeagues: Leagues fetched:", fetchedLeagues.length);
    } catch (error) {
      console.error(`>>> leagues/fetchLeagues: Error fetching leagues for season ${seasonId}: `, error);
      toast({ title: "Fehler beim Laden der Ligen", description: (error as Error).message, variant: "destructive" });
      setLeagues([]);
    } finally {
      setIsLoadingLeagues(false);
      console.log(">>> leagues/fetchLeagues: Finished. isLoadingLeagues:", false);
    }
  }, [toast]);

  useEffect(() => {
    if (selectedSeasonId) {
      fetchLeaguesForSeason(selectedSeasonId);
    } else {
      setLeagues([]);
    }
  }, [selectedSeasonId, fetchLeaguesForSeason]);
  
  const handleAddNew = () => {
    if (!selectedSeasonId) {
        toast({ title: "Saison erforderlich", description: "Bitte zuerst eine Saison auswählen.", variant: "destructive" });
        return;
    }
    const selectedSeasonData = allSeasons.find(s => s.id === selectedSeasonId);
    if (!selectedSeasonData) {
        toast({ title: "Saison nicht gefunden", description: "Die ausgewählte Saison konnte nicht geladen werden.", variant: "destructive" });
        return;
    }

    setFormMode('new');
    setCurrentLeague({ 
      seasonId: selectedSeasonId, 
      name: '', 
      shortName: '', 
      type: leagueDisciplineOptions[0]?.value || 'KKG', // Default to first specific discipline or KKG if empty
      competitionYear: selectedSeasonData.competitionYear,
      order: (leagues.length + 1) * 10 
    });
    setIsFormOpen(true);
  };

  const handleEdit = (league: League) => {
    setFormMode('edit');
    setCurrentLeague(league);
    setIsFormOpen(true);
  };

  const handleDeleteConfirmation = (league: League) => {
    setLeagueToDelete(league);
    setIsAlertOpen(true);
  };

  const handleDeleteLeague = async () => {
    if (!leagueToDelete || !leagueToDelete.id) {
      toast({ title: "Fehler", description: "Keine Liga zum Löschen ausgewählt.", variant: "destructive" });
      setIsAlertOpen(false);
      return;
    }
    
    console.log(`>>> leagues/handleDeleteLeague: Attempting to delete league: ${leagueToDelete.name} (ID: ${leagueToDelete.id})`);
    setIsLoadingDelete(true); 
    try {
      await deleteDoc(doc(db, LEAGUES_COLLECTION, leagueToDelete.id));
      console.log(`>>> leagues/handleDeleteLeague: League ${leagueToDelete.id} successfully deleted from Firestore.`);
      toast({ title: "Liga gelöscht", description: `"${leagueToDelete.name}" wurde erfolgreich entfernt.` });
      if (selectedSeasonId) fetchLeaguesForSeason(selectedSeasonId); 
    } catch (error) {
      console.error(`>>> leagues/handleDeleteLeague: Error deleting league ${leagueToDelete.id}: `, error);
      toast({ title: "Fehler beim Löschen", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsLoadingDelete(false);
      setIsAlertOpen(false);
      setLeagueToDelete(null);
      console.log(`>>> leagues/handleDeleteLeague: Finished for league ${leagueToDelete?.id}.`);
    }
  };
  
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    console.log(">>> leagues/handleSubmit: Form submitted.");

    if (!currentLeague || !currentLeague.name?.trim() || !currentLeague.seasonId || !currentLeague.type || currentLeague.competitionYear === undefined) {
      toast({ title: "Ungültige Eingabe", description: "Bitte alle erforderlichen Felder ausfüllen.", variant: "destructive" });
      console.warn(">>> leagues/handleSubmit: Invalid form input.", currentLeague);
      return;
    }
    
    const selectedSeasonData = allSeasons.find(s => s.id === currentLeague.seasonId);
    if (!selectedSeasonData) {
        toast({ title: "Saisonfehler", description: "Zugehörige Saisondaten nicht gefunden.", variant: "destructive" });
        console.error(">>> leagues/handleSubmit: Selected season data not found for seasonId:", currentLeague.seasonId);
        return;
    }

    const leagueDataToSave: Omit<League, 'id'> = {
      name: currentLeague.name.trim(),
      shortName: currentLeague.shortName?.trim() || '',
      order: currentLeague.order || 0,
      seasonId: selectedSeasonData.id,
      competitionYear: selectedSeasonData.competitionYear,
      type: currentLeague.type as FirestoreLeagueSpecificDiscipline, 
    };
    console.log(">>> leagues/handleSubmit: League data to save:", leagueDataToSave);

    setIsLoadingForm(true);
    try {
      const leaguesCollectionRef = collection(db, LEAGUES_COLLECTION);
      let duplicateQuery;

      const baseDuplicateConditions = [
        where("name", "==", leagueDataToSave.name),
        where("seasonId", "==", leagueDataToSave.seasonId)
      ];

      if (formMode === 'edit' && currentLeague?.id) {
        duplicateQuery = query(leaguesCollectionRef, ...baseDuplicateConditions, where(documentId(), "!=", currentLeague.id));
        console.log(">>> leagues/handleSubmit: Checking for duplicates (edit mode). Name:", leagueDataToSave.name, "SeasonId:", leagueDataToSave.seasonId, "Exclude ID:", currentLeague.id);
      } else {
        duplicateQuery = query(leaguesCollectionRef, ...baseDuplicateConditions);
        console.log(">>> leagues/handleSubmit: Checking for duplicates (new mode). Name:", leagueDataToSave.name, "SeasonId:", leagueDataToSave.seasonId);
      }
      
      const duplicateSnapshot = await getDocs(duplicateQuery);
      if (!duplicateSnapshot.empty) {
        toast({
          title: "Doppelter Liganame",
          description: `Eine Liga mit dem Namen "${leagueDataToSave.name}" existiert bereits in dieser Saison.`,
          variant: "destructive",
        });
        console.warn(">>> leagues/handleSubmit: Duplicate league name found.");
        setIsLoadingForm(false);
        return; 
      }

      if (formMode === 'new') {
        console.log(">>> leagues/handleSubmit: Attempting to add new league document...");
        const docRef = await addDoc(leaguesCollectionRef, leagueDataToSave);
        console.log(">>> leagues/handleSubmit: New league document added with ID:", docRef.id);
        toast({ title: "Liga erstellt", description: `"${leagueDataToSave.name}" wurde erfolgreich angelegt.` });
      } else if (formMode === 'edit' && currentLeague.id) {
        console.log(`>>> leagues/handleSubmit: Attempting to update league document ${currentLeague.id}...`);
        await updateDoc(doc(db, LEAGUES_COLLECTION, currentLeague.id), leagueDataToSave as Partial<League>);
        console.log(`>>> leagues/handleSubmit: League document ${currentLeague.id} updated.`);
        toast({ title: "Liga aktualisiert", description: `"${leagueDataToSave.name}" wurde erfolgreich aktualisiert.` });
      }
      setIsFormOpen(false);
      setCurrentLeague(null);
      if(selectedSeasonId) await fetchLeaguesForSeason(selectedSeasonId);
    } catch (error) {
      console.error(">>> leagues/handleSubmit: Error saving league: ", error);
      const action = formMode === 'new' ? 'erstellen' : 'aktualisieren';
      toast({ title: `Fehler beim ${action}`, description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsLoadingForm(false);
      console.log(">>> leagues/handleSubmit: Finished.");
    }
  };

  const handleFormInputChange = (field: keyof Pick<League, 'name' | 'shortName' | 'order' | 'type'>, value: string | number) => {
    setCurrentLeague(prev => {
        if (!prev) return null;
        if (field === 'type') {
          return { ...prev, [field]: value as FirestoreLeagueSpecificDiscipline };
        }
        return { ...prev, [field]: value };
    });
  };
  
  const navigateToTeams = (leagueId: string) => {
    router.push(`/admin/teams?seasonId=${selectedSeasonId}&leagueId=${leagueId}`);
  };

  const selectedSeasonName = allSeasons.find(s => s.id === selectedSeasonId)?.name || (isLoadingData ? 'Lade...' : 'Keine Saison ausgewählt');
  const selectedSeasonForDialog = allSeasons.find(s => s.id === currentLeague?.seasonId);


  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h1 className="text-2xl font-semibold text-primary w-full sm:w-auto">Ligenverwaltung</h1>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <Select 
            value={selectedSeasonId} 
            onValueChange={(value) => {
              setSelectedSeasonId(value);
              router.push(`/admin/leagues?seasonId=${value}`, { scroll: false });
            }} 
            disabled={isLoadingData || allSeasons.length === 0}
          >
            <SelectTrigger className="w-full sm:w-[250px]" aria-label="Saison auswählen">
              <SelectValue placeholder={isLoadingData ? "Lade Saisons..." : (allSeasons.length === 0 ? "Keine Saisons" : "Saison wählen")} />
            </SelectTrigger>
            <SelectContent>
              {allSeasons.length > 0 ? 
                allSeasons.map(season => <SelectItem key={season.id} value={season.id}>{season.name}</SelectItem>) :
                <SelectItem value="no-season" disabled>Keine Saisons verfügbar</SelectItem>
              }
            </SelectContent>
          </Select>
          <Button onClick={handleAddNew} disabled={isLoadingData || !selectedSeasonId} className="whitespace-nowrap w-full sm:w-auto">
            <PlusCircle className="mr-2 h-5 w-5" /> Neue Liga anlegen
          </Button>
        </div>
      </div>
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Ligen für {selectedSeasonName}</CardTitle>
          <CardDescription>
            Verwalten Sie hier die Ligen für die ausgewählte Saison.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingLeagues ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="ml-3">Lade Ligen für {selectedSeasonName}...</p>
            </div>
          ) : leagues.length > 0 ? (
             <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Kürzel</TableHead>
                  <TableHead>Typ</TableHead>
                  <TableHead>Reihenfolge</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leagues.map((league) => (
                  <TableRow key={league.id}>
                    <TableCell>{league.name}</TableCell>
                    <TableCell>{league.shortName}</TableCell>
                    <TableCell>{leagueDisciplineOptions.find(opt => opt.value === league.type)?.label || league.type}</TableCell>
                    <TableCell>{league.order}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="outline" size="sm" onClick={() => navigateToTeams(league.id)} disabled={!selectedSeasonId}>
                        <Eye className="mr-1 h-4 w-4" /> Teams
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(league)} aria-label="Liga bearbeiten">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteConfirmation(league)} className="text-destructive hover:text-destructive/80" aria-label="Liga löschen">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
             <div className="p-8 text-center text-muted-foreground bg-secondary/30 rounded-md">
              <p className="text-lg">
                {isLoadingData ? 'Lade Saisondaten...' : 
                 (!selectedSeasonId ? 'Bitte wählen Sie zuerst eine Saison aus.' : 
                 `Keine Ligen für ${selectedSeasonName} angelegt.`)}
              </p>
              {!isLoadingData && selectedSeasonId && (
                <p className="text-sm mt-1">Klicken Sie auf "Neue Liga anlegen", um zu beginnen.</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={(open) => { setIsFormOpen(open); if (!open) setCurrentLeague(null); }}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{formMode === 'new' ? 'Neue Liga anlegen' : 'Liga bearbeiten'}</DialogTitle>
              <DialogDescription>
                {formMode === 'new' ? `Erstellen Sie eine neue Liga für ${selectedSeasonName}.` : `Bearbeiten Sie die Details für ${currentLeague?.name || 'die Liga'}.`}
              </DialogDescription>
            </DialogHeader>
            {currentLeague && (
              <div className="grid gap-4 py-4">
                <div className="space-y-1.5">
                  <Label htmlFor="seasonDisplay">Saison</Label>
                  <Input id="seasonDisplay" value={selectedSeasonForDialog?.name || selectedSeasonName} disabled className="bg-muted/50" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="leagueType">Typ der Liga</Label>
                   <Select
                    value={currentLeague.type || ''}
                    onValueChange={(value) => handleFormInputChange('type', value as FirestoreLeagueSpecificDiscipline)}
                    required
                  >
                    <SelectTrigger id="leagueType">
                      <SelectValue placeholder="Spezifischen Ligatyp wählen" />
                    </SelectTrigger>
                    <SelectContent>
                      {leagueDisciplineOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="name">Name</Label>
                  <Input 
                    id="name" 
                    value={currentLeague.name || ''} 
                    onChange={(e) => handleFormInputChange('name', e.target.value)} 
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="shortName">Kürzel</Label>
                  <Input 
                    id="shortName" 
                    value={currentLeague.shortName || ''} 
                    onChange={(e) => handleFormInputChange('shortName', e.target.value)} 
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="order">Reihenfolge</Label>
                  <Input 
                    id="order" 
                    type="number" 
                    value={currentLeague.order || 0} 
                    onChange={(e) => handleFormInputChange('order', parseInt(e.target.value, 10) || 0)} 
                    required
                  />
                </div>
                 <div className="space-y-1.5">
                  <Label htmlFor="yearDisplay">Wettkampfjahr</Label>
                  <Input id="yearDisplay" value={currentLeague.competitionYear?.toString() || ''} disabled className="bg-muted/50" title="Wird von der Saison übernommen"/>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setIsFormOpen(false); setCurrentLeague(null); }}>Abbrechen</Button>
              <Button type="submit" disabled={isLoadingForm}>
                {isLoadingForm && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Speichern
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {leagueToDelete && (
        <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Liga löschen bestätigen</AlertDialogTitle>
              <AlertDialogDescription>
                Möchten Sie die Liga "{leagueToDelete.name}" wirklich endgültig löschen? Diese Aktion kann nicht rückgängig gemacht werden.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => { setIsAlertOpen(false); setLeagueToDelete(null); }}>Abbrechen</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteLeague}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={isLoadingDelete}
              >
                {isLoadingDelete && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Endgültig löschen
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
