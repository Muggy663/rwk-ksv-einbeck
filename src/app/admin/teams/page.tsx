// src/app/admin/teams/page.tsx
"use client";
import React, { useState, useEffect, FormEvent, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Edit, Trash2, Users as TeamsIcon, Loader2, AlertTriangle, InfoIcon, ChevronDown, ChevronRight } from 'lucide-react';
import { BackButton } from '@/components/ui/back-button';
import { HelpTooltip } from '@/components/ui/help-tooltip';
import {
  MobileTable as Table,
  MobileTableBody as TableBody,
  MobileTableCell as TableCell,
  MobileTableHead as TableHead,
  MobileTableHeader as TableHeader,
  MobileTableRow as TableRow,
} from "@/components/ui/mobile-table";
import {
  MobileSelect as Select,
  MobileSelectContent as SelectContent,
  MobileSelectItem as SelectItem,
  MobileSelectTrigger as SelectTrigger,
  MobileSelectValue as SelectValue,
} from "@/components/ui/mobile-select";
import { GlobalResponsiveDialog } from '@/components/ui/global-responsive-dialog-wrapper';
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
import { Alert, AlertDescription as UiAlertDescription } from "@/components/ui/alert";
import { useAuth } from '@/hooks/use-auth';
import type { Season, League, Club, Team, Shooter, TeamValidationInfo, FirestoreLeagueSpecificDiscipline } from '@/types/rwk';
import { MAX_SHOOTERS_PER_TEAM, getDisciplineCategory } from '@/types/rwk';
import { db } from '@/lib/firebase/config';
import {
  collection, getDocs, doc, updateDoc, deleteDoc, query,
  where, orderBy, documentId, writeBatch, getDoc as getFirestoreDoc, arrayUnion, arrayRemove, setDoc
} from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

const SEASONS_COLLECTION = "seasons";
const LEAGUES_COLLECTION = "rwk_leagues";
const CLUBS_COLLECTION = "clubs";
const TEAMS_COLLECTION = "rwk_teams";
const SHOOTERS_COLLECTION = "shooters";

export default function AdminTeamsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [allSeasons, setAllSeasons] = useState<Season[]>([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>('');

  const [allLeagues, setAllLeagues] = useState<League[]>([]);
  const [selectedLeagueIdFilter, setSelectedLeagueIdFilter] = useState<string>("");
  const [sortBy, setSortBy] = useState<'name' | 'club' | 'league' | 'type'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const [teamsForDisplay, setTeamsForDisplay] = useState<Team[]>([]);
  const [allClubsGlobal, setAllClubsGlobal] = useState<Club[]>([]);

  const [isLoadingPageData, setIsLoadingPageData] = useState(true);
  const [isLoadingTeams, setIsLoadingTeams] = useState(false);
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  const [isDeletingTeam, setIsDeletingTeam] = useState(false);

  const [teamToDelete, setTeamToDelete] = useState<Team | null>(null);
  
  // Edit dialog - full verein functionality
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentTeam, setCurrentTeam] = useState<Partial<Team> & { id?: string } | null>(null);
  const [formMode, setFormMode] = useState<'new' | 'edit'>('new');
  
  const [allClubShootersForDialog, setAllClubShootersForDialog] = useState<Shooter[]>([]);
  const [allTeamsForValidation, setAllTeamsForValidation] = useState<TeamValidationInfo[]>([]);
  const [isLoadingDialogData, setIsLoadingDialogData] = useState(false);
  
  const [persistedShooterIdsForTeam, setPersistedShooterIdsForTeam] = useState<string[]>([]);
  const [selectedShooterIdsInForm, setSelectedShooterIdsInForm] = useState<string[]>([]);
  
  const [teamStrength, setTeamStrength] = useState<string>("");
  const [suggestedTeamName, setSuggestedTeamName] = useState<string>("");
  const [shooterSearchQuery, setShooterSearchQuery] = useState<string>("");
  
  // Aufklappbare Schützen-Anzeige
  const [expandedTeams, setExpandedTeams] = useState<Set<string>>(new Set());
  const [teamShooters, setTeamShooters] = useState<Map<string, Shooter[]>>(new Map());
  const [loadingShooters, setLoadingShooters] = useState<Set<string>>(new Set());

  const isAdmin = user?.email === 'admin@rwk-einbeck.de';

  // Lade Basisdaten
  const fetchInitialData = useCallback(async () => {
    setIsLoadingPageData(true);
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
      setAllClubsGlobal(fetchedClubs);

      // Auto-select first season if available
      if (fetchedSeasons.length > 0 && !selectedSeasonId) {
        setSelectedSeasonId(fetchedSeasons[0].id);
      }
    } catch (error) {
      console.error("Error fetching initial data:", error);
      toast({ title: "Fehler beim Laden der Basisdaten", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsLoadingPageData(false);
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
      
      if (selectedLeagueIdFilter && selectedLeagueIdFilter !== "" && selectedLeagueIdFilter !== "ALL_LEAGUES") {
        if (selectedLeagueIdFilter === "NOT_ASSIGNED") {
          // Für "Nicht zugeordnet" filtern wir client-seitig, da Firestore keine null-Abfragen in where() unterstützt
        } else {
          qConstraints.push(where("leagueId", "==", selectedLeagueIdFilter));
        }
      }
      
      const teamsQuery = query(
        collection(db, TEAMS_COLLECTION), 
        ...qConstraints, 
        orderBy("name", "asc")
      );
      
      const querySnapshot = await getDocs(teamsQuery);
      let fetchedTeams = querySnapshot.docs.map(d => ({ 
        id: d.id, 
        ...d.data(), 
        shooterIds: d.data().shooterIds || [] 
      } as Team));
      
      // Client-seitige Filterung für "Nicht zugeordnet"
      if (selectedLeagueIdFilter === "NOT_ASSIGNED") {
        fetchedTeams = fetchedTeams.filter(team => !team.leagueId);
      }
      
      // Sortierung anwenden
      fetchedTeams.sort((a, b) => {
        let aValue: string, bValue: string;
        
        switch (sortBy) {
          case 'name':
            aValue = a.name || '';
            bValue = b.name || '';
            break;
          case 'club':
            aValue = getClubName(a.clubId);
            bValue = getClubName(b.clubId);
            break;
          case 'league':
            aValue = getLeagueNameDisplay(a.leagueId);
            bValue = getLeagueNameDisplay(b.leagueId);
            break;
          case 'type':
            aValue = getLeagueTypeDisplay(a);
            bValue = getLeagueTypeDisplay(b);
            break;
          default:
            aValue = a.name || '';
            bValue = b.name || '';
        }
        
        const comparison = aValue.localeCompare(bValue);
        return sortOrder === 'asc' ? comparison : -comparison;
      });
      
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
  }, [selectedSeasonId, selectedLeagueIdFilter, allSeasons, toast]);

  // Mannschaft bearbeiten
  const handleEditTeam = (team: Team) => {
    setFormMode('edit');
    setCurrentTeam(team);
    
    // Versuche, die Mannschaftsstärke aus dem Namen zu extrahieren
    const strengthMatch = team.name.match(/\s([IVX]+)$/);
    if (strengthMatch) {
      setTeamStrength(strengthMatch[1]);
    } else {
      setTeamStrength("");
    }
    
    setSuggestedTeamName(team.name);
    setIsFormOpen(true);
  };

  // Dialog data fetching
  const fetchDialogData = useCallback(async () => {
    const clubIdForDialog = currentTeam?.clubId;
    const seasonForDialog = allSeasons.find(s => s.id === (currentTeam?.seasonId || selectedSeasonId));
    const compYearForDialog = currentTeam?.competitionYear || seasonForDialog?.competitionYear;

    if (!isFormOpen || !clubIdForDialog || compYearForDialog === undefined) {
      setAllClubShootersForDialog([]);
      setAllTeamsForValidation([]);
      setIsLoadingDialogData(false);
      return;
    }

    setIsLoadingDialogData(true);
    try {
      const shootersQuery = query(
        collection(db, SHOOTERS_COLLECTION), 
        orderBy("name", "asc")
      );
      const teamsForYearQuery = query(collection(db, TEAMS_COLLECTION), where("competitionYear", "==", compYearForDialog));

      const [shootersSnapshot, teamsForYearSnapshot] = await Promise.all([
        getDocs(shootersQuery),
        getDocs(teamsForYearQuery)
      ]);

      const allShooters = shootersSnapshot.docs.map(d => ({ 
        id: d.id, 
        ...d.data(), 
        teamIds: (d.data().teamIds || []) as string[] 
      } as Shooter));
      
      const clubShooters = allShooters.filter(shooter => {
        const shooterClubId = shooter.clubId || shooter.rwkClubId || (shooter as any).kmClubId;
        return shooterClubId === clubIdForDialog;
      });
      
      setAllClubShootersForDialog(clubShooters);

      const leagueMap = new Map(allLeagues.map(l => [l.id, l]));
      const teamsForValidationData: TeamValidationInfo[] = teamsForYearSnapshot.docs.map(d => {
        const teamData = d.data() as Team;
        const leagueInfo = teamData.leagueId ? leagueMap.get(teamData.leagueId) : null;
        return {
          ...teamData,
          id: d.id,
          shooterIds: teamData.shooterIds || [],
          leagueType: leagueInfo?.type,
          leagueCompetitionYear: leagueInfo?.competitionYear,
          currentShooterCount: (teamData.shooterIds || []).length,
        };
      });
      setAllTeamsForValidation(teamsForValidationData);
    } catch (error) {
      console.error("Error fetching dialog data:", error);
      toast({title: "Fehler Dialogdaten", description: (error as Error).message, variant: "destructive"});
    } finally {
      setIsLoadingDialogData(false);
    }
  }, [isFormOpen, currentTeam?.clubId, selectedSeasonId, currentTeam, allSeasons, allLeagues, toast]);

  useEffect(() => {
    if (isFormOpen) {
      fetchDialogData();
    }
  }, [isFormOpen, fetchDialogData]);

  // Set initial shooter selection for edit mode
  useEffect(() => {
    if (isFormOpen && formMode === 'edit' && currentTeam?.id && !isLoadingDialogData) {
        const persistedIds = currentTeam?.shooterIds || [];
        setPersistedShooterIdsForTeam(persistedIds);
        const validInitialShooterIds = persistedIds.filter(shooterId =>
            allClubShootersForDialog.some(shooter => shooter.id === shooterId)
        );
        setSelectedShooterIdsInForm(validInitialShooterIds);
    } else if (isFormOpen && formMode === 'new') {
        setSelectedShooterIdsInForm([]);
        setPersistedShooterIdsForTeam([]);
    }
  }, [isFormOpen, formMode, currentTeam?.id, currentTeam?.shooterIds, isLoadingDialogData, allClubShootersForDialog]);

  const handleFormInputChange = (
    field: keyof Pick<Team, 'name' | 'captainName' | 'captainEmail' | 'captainPhone'>, 
    value: string | null
  ) => {
    setCurrentTeam(prev => prev ? ({ ...prev, [field]: value }) : null);
  };

  const handleShooterSelectionChange = (shooterId: string, isChecked: boolean) => {
    if (isSubmittingForm || isLoadingDialogData) return;

    if (isChecked) { 
      if (selectedShooterIdsInForm.length >= MAX_SHOOTERS_PER_TEAM) {
          toast({ title: "Maximale Schützenzahl erreicht", description: `Eine Mannschaft darf maximal ${MAX_SHOOTERS_PER_TEAM} Schützen haben.`, variant: "warning" });
          return; 
      }
    } 
    setSelectedShooterIdsInForm(prevSelectedIds =>
      isChecked ? [...prevSelectedIds, shooterId] : prevSelectedIds.filter(id => id !== shooterId)
    );
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

  // Helper functions
  const getLeagueNameDisplay = (leagueId?: string | null): string => {
    if (!leagueId) return 'Nicht zugewiesen';
    const league = allLeagues.find(l => l.id === leagueId);
    if (!league) return 'Unbek. Liga';
    let cleanName = league.name
      .replace(/\s*\(Gruppe\)\s*/g, '')
      .replace(/\s+Gruppe\s*$/g, '')
      .trim();
    return cleanName;
  };
  
  const getLeagueTypeDisplay = (team: Team): string => {
    if (team.leagueId) {
      const league = allLeagues.find(l => l.id === team.leagueId);
      return league?.type || '-';
    }
    return team.leagueType || '-';
  };

  const getClubName = (clubId?: string | null): string => {
    if (!clubId) return 'N/A';
    return allClubsGlobal.find(c => c.id === clubId)?.name || 'Unbek. Verein';
  };

  const toggleTeamExpansion = async (teamId: string, shooterIds: string[]) => {
    const newExpanded = new Set(expandedTeams);
    
    if (expandedTeams.has(teamId)) {
      newExpanded.delete(teamId);
    } else {
      newExpanded.add(teamId);
      
      if (!teamShooters.has(teamId) && shooterIds.length > 0) {
        setLoadingShooters(prev => new Set(prev).add(teamId));
        
        try {
          const shooterPromises = shooterIds.map(async (shooterId) => {
            const rwkShooterDoc = await getFirestoreDoc(doc(db, SHOOTERS_COLLECTION, shooterId));
            if (rwkShooterDoc.exists()) {
              return { id: rwkShooterDoc.id, ...rwkShooterDoc.data() } as Shooter;
            }
            
            return { 
              id: shooterId, 
              name: `Schütze nicht gefunden (ID: ${shooterId.substring(0, 8)}...)`,
              firstName: 'Nicht',
              lastName: 'gefunden',
              gender: 'unknown',
              birthYear: null
            } as Shooter;
          });
          
          const shooters = await Promise.all(shooterPromises);
          setTeamShooters(prev => new Map(prev).set(teamId, shooters));
        } catch (error) {
          console.error('Fehler beim Laden der Schützen:', error);
          toast({ title: "Fehler", description: "Schützen konnten nicht geladen werden.", variant: "destructive" });
        } finally {
          setLoadingShooters(prev => {
            const newSet = new Set(prev);
            newSet.delete(teamId);
            return newSet;
          });
        }
      }
    }
    
    setExpandedTeams(newExpanded);
  };

  if (isLoadingPageData) { 
    return <div className="flex justify-center items-center py-12"><Loader2 className="h-12 w-12 animate-spin text-primary" /> <p className="ml-2">Lade Basisdaten...</p></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="flex items-center">
          <BackButton className="mr-2" fallbackHref="/admin" />
          <h1 className="text-2xl font-semibold text-primary">Admin Mannschaftsverwaltung</h1>
          <HelpTooltip 
            text="Hier können Sie alle Mannschaften verwalten - für alle Vereine." 
            side="right" 
            className="ml-2"
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-end gap-3 mb-4 p-4 border rounded-md shadow-sm bg-card">
        <div className="flex-grow space-y-1.5 w-full sm:w-auto">
          <div className="flex items-center">
            <Label htmlFor="admin-saison-select">Saison auswählen</Label>
            <HelpTooltip 
              text="Wählen Sie die Saison aus, für die Sie Mannschaften anzeigen oder anlegen möchten." 
              className="ml-2"
            />
          </div>
          <Select
            value={selectedSeasonId}
            onValueChange={(value) => { setSelectedSeasonId(value); setSelectedLeagueIdFilter(""); }}
            disabled={allSeasons.length === 0}
          >
            <SelectTrigger id="admin-saison-select" className="w-full">
                <SelectValue placeholder={allSeasons.length === 0 ? "Keine Saisons" : "Saison wählen"} />
            </SelectTrigger>
            <SelectContent>
                {allSeasons
                    .filter(s => s && typeof s.id === 'string' && s.id.trim() !== "")
                    .map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                {allSeasons.filter(s => s && typeof s.id === 'string' && s.id.trim() !== "").length === 0 &&
                    <SelectItem value="NO_SEASONS_ADMIN_PLACEHOLDER" disabled>Keine Saisons verfügbar</SelectItem>}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-grow space-y-1.5 w-full sm:w-auto">
          <div className="flex items-center">
            <Label htmlFor="admin-liga-filter">Nach Liga filtern (Optional)</Label>
            <HelpTooltip 
              text="Filtern Sie optional nach einer bestimmten Liga." 
              className="ml-2"
            />
          </div>
           <Select
            value={selectedLeagueIdFilter}
            onValueChange={(value) => {
              setSelectedLeagueIdFilter(value === "ALL_LEAGUES" ? "" : value);
            }}
            disabled={!selectedSeasonId || isLoadingTeams}
           >
            <SelectTrigger id="admin-liga-filter" className="w-full">
                <SelectValue placeholder={!selectedSeasonId ? "Saison wählen" : "Alle Ligen"} />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="ALL_LEAGUES">Alle Ligen anzeigen</SelectItem>
                <SelectItem value="NOT_ASSIGNED">Nicht zugewiesen</SelectItem>
                {allLeagues
                    .filter(l => l && typeof l.id === 'string' && l.id.trim() !== "" && l.seasonId === selectedSeasonId)
                    .map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)
                }
            </SelectContent>
          </Select>
        </div>
        <Button
            onClick={handleSearchTeams}
            disabled={!selectedSeasonId || isLoadingTeams}
            className="w-full sm:w-auto whitespace-nowrap bg-primary hover:bg-primary/90"
            size="default"
        >
            {isLoadingTeams ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <TeamsIcon className="mr-2 h-5 w-5" />}
            Mannschaften laden
        </Button>
      </div>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>
            Mannschaften ({teamsForDisplay.length})
            {selectedSeasonId && ` - ${allSeasons.find(s => s.id === selectedSeasonId)?.name}`}
          </CardTitle>
          <CardDescription>
            Admin-Bereich: Alle Mannschaften aller Vereine verwalten
            {!selectedSeasonId && " - Bitte wählen Sie zuerst eine Saison."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingTeams && selectedSeasonId && <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /><p className="ml-2">Lade Mannschaften...</p></div>}
          {!isLoadingTeams && teamsForDisplay.length === 0 && selectedSeasonId && (
            <div className="p-4 text-center text-muted-foreground bg-secondary/30 rounded-md">
              <AlertTriangle className="mx-auto h-8 w-8 text-primary/70 mb-2" />
              <p>Keine Mannschaften für die aktuelle Auswahl gefunden.</p>
            </div>
          )}
          {!isLoadingTeams && teamsForDisplay.length > 0 && selectedSeasonId && (
            <Table><TableHeader><TableRow>
                <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => {
                  if (sortBy === 'name') {
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                  } else {
                    setSortBy('name');
                    setSortOrder('asc');
                  }
                  handleSearchTeams();
                }}>Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}</TableHead>
                <TableHead className="hidden sm:table-cell cursor-pointer hover:bg-muted/50" onClick={() => {
                  if (sortBy === 'club') {
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                  } else {
                    setSortBy('club');
                    setSortOrder('asc');
                  }
                  handleSearchTeams();
                }}>Verein {sortBy === 'club' && (sortOrder === 'asc' ? '↑' : '↓')}</TableHead>
                <TableHead className="hidden sm:table-cell cursor-pointer hover:bg-muted/50" onClick={() => {
                  if (sortBy === 'league') {
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                  } else {
                    setSortBy('league');
                    setSortOrder('asc');
                  }
                  handleSearchTeams();
                }}>Liga {sortBy === 'league' && (sortOrder === 'asc' ? '↑' : '↓')}</TableHead>
                <TableHead className="text-center cursor-pointer hover:bg-muted/50" onClick={() => {
                  if (sortBy === 'type') {
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                  } else {
                    setSortBy('type');
                    setSortOrder('asc');
                  }
                  handleSearchTeams();
                }}>Typ {sortBy === 'type' && (sortOrder === 'asc' ? '↑' : '↓')}</TableHead>
                <TableHead className="text-center hidden md:table-cell">Jahr</TableHead>
                <TableHead className="text-center">Schützen</TableHead>
                <TableHead className="text-right">Aktionen</TableHead>
            </TableRow></TableHeader>
            <TableBody>
                {teamsForDisplay.map((team) => (
                  <React.Fragment key={team.id}>
                    <TableRow>
                      <TableCell label="Name" className="font-medium">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleTeamExpansion(team.id, team.shooterIds || [])}
                            className="h-6 w-6 p-0"
                            disabled={!team.shooterIds?.length}
                          >
                            {expandedTeams.has(team.id) ? 
                              <ChevronDown className="h-4 w-4" /> : 
                              <ChevronRight className="h-4 w-4" />
                            }
                          </Button>
                          {team.name}
                        </div>
                      </TableCell>
                    <TableCell label="Verein" hideOnMobile>{getClubName(team.clubId)}</TableCell>
                    <TableCell label="Liga" hideOnMobile>{getLeagueNameDisplay(team.leagueId)}</TableCell>
                    <TableCell label="Typ" className="text-center">
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded font-medium">
                        {getLeagueTypeDisplay(team)}
                      </span>
                    </TableCell>
                    <TableCell label="Jahr" hideOnMobile>{team.competitionYear}</TableCell>
                    <TableCell label="Schützen" className="text-center">
                      {team.shooterIds?.length || 0} / {MAX_SHOOTERS_PER_TEAM}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleEditTeam(team)} 
                          disabled={isSubmittingForm || isDeletingTeam}
                          className="h-8 w-8 hover:bg-primary/10"
                          title="Mannschaft bearbeiten"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog open={!!teamToDelete && teamToDelete.id === team.id} onOpenChange={(open) => { if (!open) setTeamToDelete(null);}}>
                          <AlertDialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-destructive hover:text-destructive/80 hover:bg-destructive/10" 
                                onClick={() => setTeamToDelete(team)} 
                                disabled={isSubmittingForm || isDeletingTeam}
                                title="Mannschaft löschen"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Mannschaft löschen?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Möchten Sie "{teamToDelete?.name}" wirklich löschen? Dies entfernt auch die Zuordnung der Schützen zu dieser Mannschaft.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel onClick={() => setTeamToDelete(null)}>Abbrechen</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={handleDeleteTeam} 
                                disabled={isDeletingTeam} 
                                className="bg-destructive hover:bg-destructive/90"
                              >
                                {isDeletingTeam && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} 
                                Löschen
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                    </TableRow>
                    {expandedTeams.has(team.id) && (
                      <TableRow>
                        <TableCell colSpan={7} className="bg-muted/30 p-4">
                          {loadingShooters.has(team.id) ? (
                            <div className="flex items-center justify-center py-4">
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              <span className="text-sm text-muted-foreground">Lade Schützen...</span>
                            </div>
                          ) : teamShooters.has(team.id) ? (
                            <div className="space-y-2">
                              <h4 className="font-medium text-sm">Gemeldete Schützen ({teamShooters.get(team.id)?.length || 0}):</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                {teamShooters.get(team.id)?.map((shooter) => (
                                  <div key={shooter.id} className={`flex items-center gap-2 p-2 rounded border ${
                                    shooter.name?.includes('nicht gefunden') ? 'bg-red-50 border-red-200' : 'bg-background'
                                  }`}>
                                    <div className="text-sm">
                                      <div className={`font-medium ${
                                        shooter.name?.includes('nicht gefunden') ? 'text-red-600' : ''
                                      }`}>
                                        {shooter.firstName && shooter.lastName ? `${shooter.firstName} ${shooter.lastName}` : shooter.name}
                                      </div>
                                      <div className="text-xs text-muted-foreground">
                                        {shooter.gender === 'male' ? 'M' : shooter.gender === 'female' ? 'W' : '?'} • {shooter.birthYear || 'Jg. N/A'}
                                      </div>
                                    </div>
                                  </div>
                                )) || []}
                              </div>
                            </div>
                          ) : (
                            <div className="text-sm text-muted-foreground text-center py-4">
                              Keine Schützen zugeordnet
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))}
            </TableBody></Table>
          )}
           {!selectedSeasonId && (
                <div className="p-4 text-center text-muted-foreground bg-blue-50/50 rounded-md border border-blue-300">
                    <InfoIcon className="mx-auto h-8 w-8 text-blue-600 mb-2" />
                    <p>Bitte wählen Sie eine Saison aus und klicken Sie auf "Mannschaften laden".</p>
                </div>
            )}
        </CardContent>
      </Card>

      {/* Full Verein Edit Dialog */}
      {isFormOpen && currentTeam && (
        <GlobalResponsiveDialog 
          open={isFormOpen} 
          onOpenChange={(open) => { 
            if (!open) {
              setCurrentTeam(null); 
              setSelectedShooterIdsInForm([]); 
              setPersistedShooterIdsForTeam([]); 
              setAllClubShootersForDialog([]);
              setTeamStrength("");
              setSuggestedTeamName("");
              setShooterSearchQuery("");
            } 
            setIsFormOpen(open); 
          }}
          title={formMode === 'new' ? 'Neue Mannschaft anlegen' : 'Mannschaft bearbeiten'}
          description={`Admin-Bereich: ${getClubName(currentTeam.clubId)}. Saison: ${allSeasons.find(s => s.id === (formMode === 'new' ? selectedSeasonId : currentTeam?.seasonId ))?.name || 'Saison wählen'}`}
          size="lg"
          footer={
            <div className="flex flex-col sm:flex-row gap-2 w-full">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => { 
                  setIsFormOpen(false); 
                  setCurrentTeam(null); 
                  setSelectedShooterIdsInForm([]); 
                  setPersistedShooterIdsForTeam([]); 
                  setAllClubShootersForDialog([]); 
                }}
                className="flex-1 sm:flex-none"
              >
                Abbrechen
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmittingForm || isLoadingDialogData}
                className="flex-1 sm:flex-none"
                form="admin-team-form"
              >
                {(isSubmittingForm || isLoadingDialogData) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} 
                Speichern
              </Button>
            </div>
          }
        >
          <form id="admin-team-form" onSubmit={async (e) => {
            e.preventDefault();
            
            if (!currentTeam || !currentTeam.name?.trim()) {
              toast({ title: "Ungültige Eingabe", description: "Name der Mannschaft ist erforderlich.", variant: "destructive" });
              return;
            }

            if (selectedShooterIdsInForm.length > MAX_SHOOTERS_PER_TEAM) {
                toast({ title: "Zu viele Schützen", description: `Maximal ${MAX_SHOOTERS_PER_TEAM} Schützen ausgewählt. Bitte Auswahl korrigieren.`, variant: "destructive" });
                return;
            }

            setIsSubmittingForm(true);

            const teamDataToSave = {
              name: currentTeam.name.trim(),
              clubId: currentTeam.clubId,
              seasonId: currentTeam.seasonId,
              competitionYear: currentTeam.competitionYear,
              leagueId: currentTeam.leagueId || null,
              leagueType: currentTeam.leagueType,
              shooterIds: selectedShooterIdsInForm,
              captainName: currentTeam.captainName?.trim() || '',
              captainEmail: currentTeam.captainEmail?.trim() || '',
              captainPhone: currentTeam.captainPhone?.trim() || '',
              outOfCompetition: currentTeam.outOfCompetition || false,
              outOfCompetitionReason: currentTeam.outOfCompetitionReason?.trim() || '',
            };
            
            try {
              let teamIdForShooterUpdates: string = currentTeam.id || '';
              
              const originalShooterIds = formMode === 'edit' ? persistedShooterIdsForTeam : [];
              
              const shootersToAdd = selectedShooterIdsInForm.filter(id => !originalShooterIds.includes(id));
              const shootersToRemove = originalShooterIds.filter(id => !selectedShooterIdsInForm.includes(id) && allClubShootersForDialog.some(s => s.id === id));
              
              if (formMode === 'edit' && currentTeam.id) {
                teamIdForShooterUpdates = currentTeam.id;
                const teamDocRef = doc(db, TEAMS_COLLECTION, teamIdForShooterUpdates);
                await updateDoc(teamDocRef, {...teamDataToSave, shooterIds: selectedShooterIdsInForm} as Partial<Team>);
                toast({ 
                  title: "✅ Mannschaft erfolgreich gespeichert!", 
                  description: `"${teamDataToSave.name}" wurde aktualisiert und Änderungen sind sofort sichtbar.`,
                  duration: 5000
                });
              }
              
              // Update shooters
              for (const shooterId of shootersToAdd) {
                try {
                  const shooterDocRef = doc(db, SHOOTERS_COLLECTION, shooterId);
                  await updateDoc(shooterDocRef, { teamIds: arrayUnion(teamIdForShooterUpdates) });
                } catch (error) {
                  console.error(`Error adding team to shooter ${shooterId}:`, error);
                }
              }
              
              for (const shooterId of shootersToRemove) {
                try {
                  const shooterDocRef = doc(db, SHOOTERS_COLLECTION, shooterId);
                  await updateDoc(shooterDocRef, { teamIds: arrayRemove(teamIdForShooterUpdates) });
                } catch (error) {
                  console.error(`Error removing team from shooter ${shooterId}:`, error);
                }
              }
              
              setIsFormOpen(false);
              setCurrentTeam(null);
              setSelectedShooterIdsInForm([]);
              setPersistedShooterIdsForTeam([]);
              handleSearchTeams();
            } catch (error: any) {
              console.error("Error saving team or updating shooters:", error);
              toast({ title: `Fehler beim aktualisieren`, description: error.message || "Unbekannter Fehler", variant: "destructive" });
            } finally {
              setIsSubmittingForm(false);
            }
          }}>
            <div className="space-y-4">
                <Alert variant="default" className="mb-4 bg-blue-50 border-blue-300 text-blue-700">
                    <InfoIcon className="h-4 w-4 text-blue-600" />
                    <UiAlertDescription>
                        Admin-Bereich: Hier können Sie alle Mannschaftsdaten bearbeiten und Schützen zuweisen.
                    </UiAlertDescription>
                </Alert>

                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-4">
                    <div className="space-y-1.5">
                        <div className="flex items-center">
                          <Label htmlFor="admin-teamStrengthDialog">Mannschaftsstärke</Label>
                          <HelpTooltip 
                            text="Wählen Sie die Stärke der Mannschaft (I für die stärkste, II für die zweitstärkste usw.)." 
                            className="ml-2"
                          />
                        </div>
                        <Select
                          value={teamStrength}
                          onValueChange={setTeamStrength}
                        >
                          <SelectTrigger id="admin-teamStrengthDialog" className="w-full">
                            <SelectValue placeholder="Mannschaftsstärke wählen" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="I">I (Erste Mannschaft)</SelectItem>
                            <SelectItem value="II">II (Zweite Mannschaft)</SelectItem>
                            <SelectItem value="III">III (Dritte Mannschaft)</SelectItem>
                            <SelectItem value="IV">IV (Vierte Mannschaft)</SelectItem>
                            <SelectItem value="V">V (Fünfte Mannschaft)</SelectItem>
                          </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1.5">
                        <div className="flex items-center">
                          <Label htmlFor="admin-teamDisciplineDialog">Disziplin</Label>
                          <HelpTooltip 
                            text="Wählen Sie die Disziplin, in der diese Mannschaft antreten soll." 
                            className="ml-2"
                          />
                        </div>
                        <Select
                          value={currentTeam?.leagueType || ""}
                          onValueChange={(value) => setCurrentTeam(prev => prev ? {...prev, leagueType: value as FirestoreLeagueSpecificDiscipline} : null)}
                          required
                        >
                          <SelectTrigger id="admin-teamDisciplineDialog" className="w-full">
                            <SelectValue placeholder="Disziplin wählen" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="KKG">Kleinkaliber Gewehr</SelectItem>
                            <SelectItem value="KKP">Kleinkaliber Pistole</SelectItem>
                            <SelectItem value="LGA">Luftgewehr Auflage</SelectItem>
                            <SelectItem value="LGS">Luftgewehr Freihand</SelectItem>
                            <SelectItem value="LP">Luftpistole</SelectItem>
                          </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1.5">
                        <div className="flex items-center">
                          <Label htmlFor="admin-teamOutOfCompetitionDialog">Außer Konkurrenz</Label>
                          <HelpTooltip 
                            text="Mannschaften außer Konkurrenz nehmen am Wettkampf teil, werden aber nicht in der Tabelle gewertet." 
                            className="ml-2"
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="admin-teamOutOfCompetitionDialog"
                            checked={currentTeam?.outOfCompetition || false}
                            onCheckedChange={(checked) => setCurrentTeam(prev => prev ? {...prev, outOfCompetition: !!checked} : null)}
                          />
                          <Label htmlFor="admin-teamOutOfCompetitionDialog" className="text-sm font-normal">
                            Diese Mannschaft außer Konkurrenz melden
                          </Label>
                        </div>
                        {currentTeam?.outOfCompetition && (
                          <div className="mt-2">
                            <Label htmlFor="admin-teamOutOfCompetitionReasonDialog" className="text-sm">Grund (optional)</Label>
                            <Input
                              id="admin-teamOutOfCompetitionReasonDialog"
                              value={currentTeam?.outOfCompetitionReason || ''}
                              onChange={(e) => setCurrentTeam(prev => prev ? {...prev, outOfCompetitionReason: e.target.value} : null)}
                              placeholder="z.B. Nachwuchsmannschaft, Gastmannschaft"
                              className="mt-1"
                            />
                          </div>
                        )}
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="admin-teamClubDialog">Verein</Label>
                        <Select
                          value={currentTeam.clubId || ''}
                          onValueChange={(value) => setCurrentTeam(prev => prev ? {...prev, clubId: value} : null)}
                        >
                          <SelectTrigger id="admin-teamClubDialog">
                            <SelectValue placeholder="Verein wählen" />
                          </SelectTrigger>
                          <SelectContent>
                            {allClubsGlobal.map(club => (
                              <SelectItem key={club.id} value={club.id}>{club.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                    </div>
                </div>
                
                <div className="space-y-1.5 mt-3">
                    <div className="flex items-center">
                      <Label htmlFor="admin-teamNameDialog">Name der Mannschaft</Label>
                      <HelpTooltip 
                        text="Der Name wird automatisch aus dem Vereinsnamen und der Mannschaftsstärke generiert, kann aber angepasst werden." 
                        className="ml-2"
                      />
                    </div>
                    <Input 
                      id="admin-teamNameDialog" 
                      value={currentTeam?.name || ''} 
                      onChange={(e) => handleFormInputChange('name', e.target.value)} 
                      placeholder={suggestedTeamName || "Mannschaftsname eingeben"}
                      required 
                    />
                </div>
                
                <div className="space-y-1.5 mt-3">
                    <Label htmlFor="admin-teamLeagueDialogDisplay">Zugewiesene Liga</Label>
                    <Select
                      value={currentTeam.leagueId || 'NO_LEAGUE'}
                      onValueChange={(value) => setCurrentTeam(prev => prev ? {...prev, leagueId: value === 'NO_LEAGUE' ? null : value} : null)}
                    >
                      <SelectTrigger id="admin-teamLeagueDialogDisplay">
                        <SelectValue placeholder="Liga wählen (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NO_LEAGUE">Nicht zugewiesen</SelectItem>
                        {allLeagues
                          .filter(l => l.seasonId === selectedSeasonId)
                          .map(league => (
                            <SelectItem key={league.id} value={league.id}>{league.name}</SelectItem>
                          ))
                        }
                      </SelectContent>
                    </Select>
                </div>

                <div className="pt-4 border-t mt-4">
                    <Label className="text-md font-medium text-accent">Kontaktdaten Mannschaftsführer (Optional)</Label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4 mt-2">
                        <div className="space-y-1.5"><Label htmlFor="admin-captainNameDialog">Name MF</Label><Input id="admin-captainNameDialog" value={currentTeam.captainName || ''} onChange={(e) => handleFormInputChange('captainName', e.target.value)} /></div>
                        <div className="space-y-1.5"><Label htmlFor="admin-captainEmailDialog">E-Mail MF</Label><Input id="admin-captainEmailDialog" type="email" value={currentTeam.captainEmail || ''} onChange={(e) => handleFormInputChange('captainEmail', e.target.value)} /></div>
                        <div className="space-y-1.5"><Label htmlFor="admin-captainPhoneDialog">Telefon MF</Label><Input id="admin-captainPhoneDialog" type="tel" value={currentTeam.captainPhone || ''} onChange={(e) => handleFormInputChange('captainPhone', e.target.value)} /></div>
                    </div>
                </div>
                
                <div className="space-y-2 pt-4 border-t mt-4">
                  <div className="flex justify-between items-center mb-1.5">
                    <Label className="text-base font-medium">Schützen für diese Mannschaft auswählen</Label>
                    <span className="text-sm text-muted-foreground">{selectedShooterIdsInForm.length} / {MAX_SHOOTERS_PER_TEAM} ausgewählt</span>
                  </div>
                  
                  {selectedShooterIdsInForm.length > 0 && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                      <h4 className="text-sm font-medium text-blue-800 mb-2">Bereits ausgewählte Schützen ({selectedShooterIdsInForm.length}):</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedShooterIdsInForm.map(shooterId => {
                          const shooter = allClubShootersForDialog.find(s => s.id === shooterId);
                          if (!shooter) return null;
                          return (
                            <div key={shooterId} className="flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                              <span>{shooter.firstName && shooter.lastName ? `${shooter.firstName} ${shooter.lastName}` : shooter.name}</span>
                              <button
                                type="button"
                                onClick={() => handleShooterSelectionChange(shooterId, false)}
                                className="ml-1 text-blue-600 hover:text-blue-800"
                                disabled={isSubmittingForm || isLoadingDialogData}
                              >
                                ×
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  
                  <div className="mb-2">
                    <Input
                      type="search"
                      placeholder="Schützen suchen..."
                      value={shooterSearchQuery}
                      onChange={(e) => setShooterSearchQuery(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  
                  {isLoadingDialogData ? (
                     <div className="flex items-center justify-center p-4 h-40 border rounded-md bg-muted/30">
                       <Loader2 className="h-6 w-6 animate-spin text-primary" />
                       <p className="ml-2">Lade Schützen...</p>
                     </div>
                  ) : allClubShootersForDialog.length > 0 ? (
                      <ScrollArea className="h-40 rounded-md border p-3 bg-background">
                        <div className="space-y-1">
                          {allClubShootersForDialog
                            .filter(shooter => {
                              if (!shooter || !shooter.name) return false;
                              if (!shooterSearchQuery.trim()) return true;
                              return shooter.name.toLowerCase().includes(shooterSearchQuery.toLowerCase());
                            })
                            .map(shooter => {
                              if (!shooter || !shooter.id) return null; 
                              const isSelected = selectedShooterIdsInForm.includes(shooter.id);
                              
                              let isDisabledByMax = !isSelected && selectedShooterIdsInForm.length >= MAX_SHOOTERS_PER_TEAM;
                              let disableReason = "";
                              
                              if (isDisabledByMax) disableReason = "(Max. Schützen erreicht)";
                              
                              const finalIsDisabled = isDisabledByMax || isLoadingDialogData;
                              return (
                                <div key={shooter.id} className="flex items-center space-x-3 p-1.5 hover:bg-muted/50 rounded-md">
                                  <Checkbox
                                    id={`admin-team-shooter-assign-${shooter.id}`}
                                    checked={isSelected}
                                    onCheckedChange={(checkedState) => handleShooterSelectionChange(shooter.id, !!checkedState)}
                                    disabled={finalIsDisabled}
                                  />
                                  <Label htmlFor={`admin-team-shooter-assign-${shooter.id}`} className={`font-normal cursor-pointer flex-grow ${finalIsDisabled ? 'opacity-50 cursor-not-allowed' : '' } ${isSelected ? 'text-primary font-medium' : ''}`}>
                                    <div>
                                      {shooter.title && <span className="text-xs text-gray-500">{shooter.title} </span>}
                                      <span>{(shooter.firstName || '') + ' ' + (shooter.lastName || shooter.name || '')}</span>
                                      {isSelected && ' ✓'}
                                    </div>
                                    <span className='text-xs text-muted-foreground block'>(Verein: {getClubName(shooter.clubId || shooter.rwkClubId)})</span>
                                    {finalIsDisabled && disableReason && <span className="text-xs text-destructive ml-1">{disableReason}</span>}
                                  </Label>
                                </div>
                              );
                            })
                          }
                        </div>
                      </ScrollArea>
                  ) : (
                    <div className="text-sm text-muted-foreground p-4 h-40 border rounded-md flex items-center justify-center bg-muted/30">
                      <p>
                        {shooterSearchQuery.trim() && allClubShootersForDialog.length > 0 
                          ? `Keine Schützen gefunden, die "${shooterSearchQuery}" enthalten.` 
                          : currentTeam?.clubId
                            ? `Keine Schützen für '${getClubName(currentTeam.clubId)}' verfügbar.` 
                            : 'Verein nicht ausgewählt.'
                        }
                      </p>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 pt-3">
                    <div className="space-y-1.5"> 
                        <Label htmlFor="admin-teamSeasonDialogDisplay">Saison (Zugewiesen)</Label>
                        <Input id="admin-teamSeasonDialogDisplay" value={allSeasons.find(s => s.id === (formMode === 'new' ? selectedSeasonId : currentTeam?.seasonId))?.name || ''} disabled className="bg-muted/50" />
                    </div>
                     <div className="space-y-1.5">
                        <Label htmlFor="admin-teamCompYearDialog">Wettkampfjahr</Label>
                        <Input id="admin-teamCompYearDialog" value={currentTeam?.competitionYear?.toString() || allSeasons.find(s => s.id === selectedSeasonId)?.competitionYear?.toString() || ''} disabled className="bg-muted/50" />
                    </div>
                </div>
            </div>
          </form>
        </GlobalResponsiveDialog>
      )}
    </div>
  );
}