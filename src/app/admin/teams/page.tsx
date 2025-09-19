// src/app/admin/teams/page.tsx
"use client";
import React, { useState, useEffect, FormEvent, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Edit, Trash2, Users, Loader2, AlertTriangle, InfoIcon, UserPlus, ChevronDown, ChevronRight } from 'lucide-react';
import { TeamStatusBadge } from '@/components/ui/team-status-badge';
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
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from '@/hooks/use-auth';
import type { Season, League, Club, Team, Shooter, TeamValidationInfo, FirestoreLeagueSpecificDiscipline } from '@/types/rwk';
import { MAX_SHOOTERS_PER_TEAM, leagueDisciplineOptions } from '@/types/rwk';
import { db } from '@/lib/firebase/config';
import {
  collection, getDocs, doc, updateDoc, deleteDoc, query,
  where, orderBy, documentId, writeBatch, getDoc as getFirestoreDoc, arrayUnion, arrayRemove,
  setDoc
} from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { SubstitutionDialog } from '@/components/admin/SubstitutionDialog';
import { BackButton } from '@/components/ui/back-button';

const SEASONS_COLLECTION = "seasons";
const LEAGUES_COLLECTION = "rwk_leagues";
const CLUBS_COLLECTION = "clubs";
const TEAMS_COLLECTION = "rwk_teams";
const SHOOTERS_COLLECTION = "shooters";
const ALL_CLUBS_FILTER_VALUE = "__ALL_CLUBS__";
const ALL_LEAGUES_FILTER_VALUE = "__ALL_LEAGUES__";

export default function AdminTeamsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [allSeasons, setAllSeasons] = useState<Season[]>([]);
  const [allLeagues, setAllLeagues] = useState<League[]>([]);
  const [allClubs, setAllClubs] = useState<Club[]>([]);
  
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>('');
  const [selectedClubIdFilter, setSelectedClubIdFilter] = useState<string>(ALL_CLUBS_FILTER_VALUE);
  const [selectedLeagueIdFilter, setSelectedLeagueIdFilter] = useState<string>(ALL_LEAGUES_FILTER_VALUE);
  
  const [teamsForDisplay, setTeamsForDisplay] = useState<Team[]>([]);
  const [availableClubShooters, setAvailableClubShooters] = useState<Shooter[]>([]);
  const [allTeamsForYearValidation, setAllTeamsForYearValidation] = useState<TeamValidationInfo[]>([]);
  
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isLoadingTeams, setIsLoadingTeams] = useState(false);
  const [isLoadingShootersForDialog, setIsLoadingShootersForDialog] = useState(false);
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  const [isDeletingTeam, setIsDeletingTeam] = useState(false);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentTeam, setCurrentTeam] = useState<Partial<Team> & { id?: string } | null>(null);
  const [formMode, setFormMode] = useState<'new' | 'edit'>('new');
  
  const [persistedShooterIdsForTeam, setPersistedShooterIdsForTeam] = useState<string[]>([]);
  const [selectedShooterIdsInForm, setSelectedShooterIdsInForm] = useState<string[]>([]);
  const [shooterSearchTerm, setShooterSearchTerm] = useState<string>('');
  
  const [teamToDelete, setTeamToDelete] = useState<Team | null>(null);
  const [substitutionDialogOpen, setSubstitutionDialogOpen] = useState(false);
  const [selectedTeamForSubstitution, setSelectedTeamForSubstitution] = useState<Team | null>(null);
  
  // Aufklappbare Schützen-Anzeige
  const [expandedTeams, setExpandedTeams] = useState<Set<string>>(new Set());
  const [teamShooters, setTeamShooters] = useState<Map<string, Shooter[]>>(new Map());
  const [loadingShooters, setLoadingShooters] = useState<Set<string>>(new Set());

  // Lade Basisdaten
  const fetchInitialData = useCallback(async () => {
    setIsLoadingData(true);
    try {
      const [seasonsSnapshot, leaguesSnapshot, clubsSnapshot] = await Promise.all([
        getDocs(query(collection(db, SEASONS_COLLECTION), orderBy("competitionYear", "desc"))),
        getDocs(query(collection(db, LEAGUES_COLLECTION), orderBy("name", "asc"))),
        getDocs(query(collection(db, CLUBS_COLLECTION), orderBy("name", "asc")))
      ]);
      
      const fetchedSeasons = seasonsSnapshot.docs.map(sDoc => ({ id: sDoc.id, ...sDoc.data() } as Season))
        .filter(s => s.id && typeof s.id === 'string' && s.id.trim() !== "");
      setAllSeasons(fetchedSeasons);

      const fetchedLeagues = leaguesSnapshot.docs.map(lDoc => ({ id: lDoc.id, ...lDoc.data() } as League))
        .filter(l => l.id && typeof l.id === 'string' && l.id.trim() !== "");
      setAllLeagues(fetchedLeagues);

      const fetchedClubs = clubsSnapshot.docs.map(cDoc => ({ id: cDoc.id, ...cDoc.data() } as Club))
        .filter(c => c.id && typeof c.id === 'string' && c.id.trim() !== "");
      setAllClubs(fetchedClubs);

      // Auto-select first season if available
      if (fetchedSeasons.length > 0 && !selectedSeasonId) {
        setSelectedSeasonId(fetchedSeasons[0].id);
      }
    } catch (error) {
      console.error("Error fetching initial data:", error);
      toast({ title: "Fehler beim Laden der Basisdaten", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsLoadingData(false);
    }
  }, [toast, selectedSeasonId]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // Lade Mannschaften basierend auf Filtern
  const handleSearchTeams = useCallback(async () => {
    if (!selectedSeasonId) {
      toast({ title: "Saison fehlt", description: "Bitte wählen Sie eine Saison aus.", variant: "warning" });
      setTeamsForDisplay([]);
      return;
    }
    
    setIsLoadingTeams(true);
    try {
      const selectedSeasonData = allSeasons.find(s => s.id === selectedSeasonId);
      if (!selectedSeasonData) {
        toast({ title: "Saisondaten nicht gefunden", variant: "destructive" });
        setIsLoadingTeams(false);
        return;
      }

      let qConstraints: any[] = [
        where("seasonId", "==", selectedSeasonId),
      ];
      
      if (selectedClubIdFilter !== ALL_CLUBS_FILTER_VALUE) {
        qConstraints.push(where("clubId", "==", selectedClubIdFilter));
      }
      if (selectedLeagueIdFilter === "NO_LEAGUE_ASSIGNED") {
        qConstraints.push(where("leagueId", "==", null));
      } else if (selectedLeagueIdFilter !== ALL_LEAGUES_FILTER_VALUE) {
        qConstraints.push(where("leagueId", "==", selectedLeagueIdFilter));
      }
      
      const teamsQuery = query(
        collection(db, TEAMS_COLLECTION), 
        ...qConstraints, 
        orderBy("name", "asc")
      );
      
      const querySnapshot = await getDocs(teamsQuery);
      const fetchedTeams = querySnapshot.docs.map(d => ({ 
        id: d.id, 
        ...d.data(), 
        shooterIds: d.data().shooterIds || [] 
      } as Team));
      
      setTeamsForDisplay(fetchedTeams);
      
      if (fetchedTeams.length === 0) {
        toast({title: "Keine Mannschaften", description: "Für die gewählten Filter wurden keine Mannschaften gefunden."});
      }
    } catch (error) {
      console.error("Error fetching teams:", error);
      toast({ title: "Fehler beim Laden der Mannschaften", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsLoadingTeams(false);
    }
  }, [selectedSeasonId, selectedClubIdFilter, selectedLeagueIdFilter, allSeasons, toast]);

  // Neue Mannschaft anlegen
  const handleAddNewTeam = () => {
    if (!selectedSeasonId) { 
      toast({ title: "Saison fehlt", description: "Bitte zuerst eine Saison auswählen.", variant: "destructive" }); 
      return;
    }
    const currentSeasonData = allSeasons.find(s => s.id === selectedSeasonId);
    if (!currentSeasonData) {
      toast({ title: "Saisonfehler", description: "Ausgewählte Saisondaten nicht gefunden.", variant: "destructive" }); 
      return;
    }

    setCurrentTeam({ 
      clubId: selectedClubIdFilter !== ALL_CLUBS_FILTER_VALUE ? selectedClubIdFilter : '',
      competitionYear: currentSeasonData.competitionYear,
      seasonId: selectedSeasonId, 
      name: '', 
      shooterIds: [],
      leagueId: selectedLeagueIdFilter !== ALL_LEAGUES_FILTER_VALUE ? selectedLeagueIdFilter : null, 
      captainName: '',
      captainEmail: '',
      captainPhone: '',
      outOfCompetition: false,
    });
    setFormMode('new');
    setIsFormOpen(true);
  };

  // Mannschaft bearbeiten
  const handleEditTeam = (team: Team) => {
    setFormMode('edit');
    const teamWithSeasonId = {
      ...team,
      seasonId: team.seasonId || selectedSeasonId
    };
    setCurrentTeam(teamWithSeasonId);
    setIsFormOpen(true);
  };

  // Mannschaft löschen
  const handleDeleteTeam = async () => {
    if (!teamToDelete || !teamToDelete.id || !user) {
      toast({ title: "Fehler", description: "Keine Mannschaft zum Löschen ausgewählt.", variant: "destructive" });
      setTeamToDelete(null); 
      return;
    }
    
    setIsDeletingTeam(true);
    try {
      const batch = writeBatch(db);
      const teamDocRef = doc(db, TEAMS_COLLECTION, teamToDelete.id);
      batch.delete(teamDocRef);

      const shooterIdsInDeletedTeam = teamToDelete.shooterIds || [];
      shooterIdsInDeletedTeam.forEach(shooterId => {
        if (shooterId && typeof shooterId === 'string' && shooterId.trim() !== '') {
          const shooterDocRef = doc(db, SHOOTERS_COLLECTION, shooterId);
          batch.update(shooterDocRef, { teamIds: arrayRemove(teamToDelete.id) });
        }
      });
      
      await batch.commit();
      toast({ title: "Mannschaft gelöscht", description: `"${teamToDelete.name}" wurde erfolgreich entfernt.` });
      handleSearchTeams(); 
    } catch (error) {
      console.error("Error deleting team:", error);
      toast({ title: "Fehler beim Löschen", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsDeletingTeam(false);
      setTeamToDelete(null); 
    }
  };

  if (isLoadingData) { 
    return <div className="flex justify-center items-center py-12"><Loader2 className="h-12 w-12 animate-spin text-primary" /> <p className="ml-2">Lade Basisdaten...</p></div>;
  }

  return (
    <div className="px-2 md:px-4 space-y-6">
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <BackButton className="mr-2" fallbackHref="/admin" />
            <h1 className="text-xl md:text-2xl font-semibold text-primary">Mannschaftsverwaltung</h1>
          </div>
          <Link href="/admin" className="md:hidden">
            <Button variant="outline" size="sm">
              Zurück
            </Button>
          </Link>
        </div>
        
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="saison-select-admin-teams">Saison</Label>
              <Select value={selectedSeasonId} onValueChange={(val) => { setSelectedSeasonId(val); setSelectedLeagueIdFilter(ALL_LEAGUES_FILTER_VALUE); setTeamsForDisplay([]); }}>
                <SelectTrigger id="saison-select-admin-teams">
                   <SelectValue placeholder={allSeasons.length === 0 ? "Keine Saisons" : "Saison wählen"} />
                </SelectTrigger>
                <SelectContent>
                  {allSeasons.filter(s => s && typeof s.id === 'string' && s.id.trim() !== "").map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  {allSeasons.filter(s => s.id && typeof s.id === 'string' && s.id.trim() !== "").length === 0 && 
                    <SelectItem value="NO_SEASONS_PLACEHOLDER_ADMIN_TEAMS" disabled>Keine Saisons verfügbar</SelectItem>
                  }
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-1.5">
              <Label htmlFor="club-filter-admin-teams">Verein</Label>
              <Select value={selectedClubIdFilter} onValueChange={(val) => {setSelectedClubIdFilter(val); setTeamsForDisplay([]);}}>
                  <SelectTrigger id="club-filter-admin-teams">
                      <SelectValue placeholder="Alle Vereine filtern" />
                  </SelectTrigger>
                  <SelectContent>
                      <SelectItem value={ALL_CLUBS_FILTER_VALUE}>Alle Vereine</SelectItem>
                      {allClubs.filter(c => c && typeof c.id === 'string' && c.id.trim() !== "").map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-1.5">
              <Label htmlFor="liga-filter-admin-teams">Liga</Label>
              <Select value={selectedLeagueIdFilter} onValueChange={(val) => {setSelectedLeagueIdFilter(val); setTeamsForDisplay([]);}} disabled={!selectedSeasonId}>
                  <SelectTrigger id="liga-filter-admin-teams">
                      <SelectValue placeholder={!selectedSeasonId ? "Saison wählen" : "Alle Ligen"} />
                  </SelectTrigger>
                  <SelectContent>
                      <SelectItem value={ALL_LEAGUES_FILTER_VALUE}>Alle Ligen</SelectItem>
                      <SelectItem value="NO_LEAGUE_ASSIGNED">Nicht zugewiesen</SelectItem>
                      {allLeagues.filter(l => l && typeof l.id === 'string' && l.id.trim() !== "" && l.seasonId === selectedSeasonId).map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
                  </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row gap-2">
            <Button onClick={handleSearchTeams} disabled={!selectedSeasonId || isLoadingTeams} className="w-full">
              {isLoadingTeams ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Users className="h-4 w-4 mr-2" />} Mannschaften suchen
            </Button>
            <Button onClick={handleAddNewTeam} disabled={!selectedSeasonId || selectedClubIdFilter === ALL_CLUBS_FILTER_VALUE} className="w-full">
              <PlusCircle className="mr-2 h-5 w-5" /> Neue Mannschaft
            </Button>
          </div>
        </div>
      </div>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>
            Gefundene Mannschaften ({teamsForDisplay.length})
          </CardTitle>
          <CardDescription>
            {selectedSeasonId ? `Für Saison: ${allSeasons.find(s=>s.id === selectedSeasonId)?.name}` : "Bitte Saison wählen."}
            {selectedClubIdFilter !== ALL_CLUBS_FILTER_VALUE && ` / Verein: ${allClubs.find(c=>c.id===selectedClubIdFilter)?.name}`}
            {selectedLeagueIdFilter !== ALL_LEAGUES_FILTER_VALUE && ` / Liga: ${allLeagues.find(l=>l.id===selectedLeagueIdFilter)?.name}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingTeams ? (
            <div className="flex justify-center items-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /><p className="ml-2">Lade Mannschaften...</p></div>
          ) : (!selectedSeasonId) ? (
             <div className="p-6 text-center text-muted-foreground bg-secondary/30 rounded-md">
                <AlertTriangle className="mx-auto h-10 w-10 mb-3 text-primary/70" />
                <p>Bitte wählen Sie Filter aus und klicken Sie auf "Mannschaften suchen".</p>
             </div>
          ) : teamsForDisplay.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Verein</TableHead>
                  <TableHead>Liga</TableHead>
                  <TableHead>Jahr</TableHead>
                  <TableHead className="text-center">Schützen</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teamsForDisplay.map((team) => (
                  <TableRow key={team.id}>
                    <TableCell className="font-medium">{team.name}</TableCell>
                    <TableCell>{allClubs.find(c => c.id === team.clubId)?.name || 'Unbekannt'}</TableCell>
                    <TableCell>{allLeagues.find(l => l.id === team.leagueId)?.name || 'Nicht zugewiesen'}</TableCell>
                    <TableCell>{team.competitionYear}</TableCell>
                    <TableCell className="text-center">{team.shooterIds?.length || 0} / {MAX_SHOOTERS_PER_TEAM}</TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEditTeam(team)}><Edit className="h-4 w-4" /></Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/80" onClick={() => setTeamToDelete(team)}><Trash2 className="h-4 w-4" /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Mannschaft löschen?</AlertDialogTitle>
                            <AlertDialogDescription>Möchten Sie "{teamToDelete?.name}" wirklich löschen?</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setTeamToDelete(null)}>Abbrechen</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDeleteTeam} disabled={isDeletingTeam} className="bg-destructive hover:bg-destructive/90">
                              {isDeletingTeam && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Löschen
                            </AlertDialogAction>
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
              <AlertTriangle className="mx-auto h-10 w-10 mb-3 text-primary/70" />
              <p>Keine Mannschaften für die gewählten Filter gefunden.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}