// src/app/admin/teams/page.tsx
"use client";
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Edit, Trash2, Users } from 'lucide-react';
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSearchParams, useRouter } from 'next/navigation';

// Dummy data
const dummySeasons = [
  { id: 's2025kk', name: 'RWK 2025 Kleinkaliber', type: 'KK', year: 2025 },
  { id: 's2025ld', name: 'RWK 2025 Luftdruck', type: 'LD', year: 2025 },
  { id: 's2024kk', name: 'RWK 2024 Kleinkaliber', type: 'KK', year: 2024 },
];
const dummyLeagues = [ // Leagues for ALL seasons for simplicity in dummy data
  { id: 'l_kol_kk25', seasonId: 's2025kk', name: 'Kreisoberliga (KK 2025)', type: 'KK'},
  { id: 'l_kl_kk25', seasonId: 's2025kk', name: 'Kreisliga (KK 2025)', type: 'KK'},
  { id: 'l_lg_a_ld25', seasonId: 's2025ld', name: 'Luftgewehr Auflage A (LD 2025)', type: 'LD'},
  { id: 'l_kol_kk24', seasonId: 's2024kk', name: 'Kreisoberliga (KK 2024)', type: 'KK'},
];
const dummyClubs = [
  { id: 'c_naensen', name: 'SC Naensen' },
  { id: 'c_einbeck', name: 'Einbecker SGi' },
  { id: 'c_doerrigsen', name: 'SV Dörrigsen'},
];

const initialTeams = [
  { id: 't_naensen1_kol_kk25', name: 'SC Naensen I', leagueId: 'l_kol_kk25', clubId: 'c_naensen', competitionYear: 2025 },
  { id: 't_esgi1_kol_kk25', name: 'Einbecker SGi I', leagueId: 'l_kol_kk25', clubId: 'c_einbeck', competitionYear: 2025 },
  { id: 't_naensen_lg_a_ld25', name: 'SC Naensen LG', leagueId: 'l_lg_a_ld25', clubId: 'c_naensen', competitionYear: 2025 },
  { id: 't_doer_kol_kk24', name: 'SV Dörrigsen I', leagueId: 'l_kol_kk24', clubId: 'c_doerrigsen', competitionYear: 2024 },
];

type Team = typeof initialTeams[0];
type Season = typeof dummySeasons[0];
type League = typeof dummyLeagues[0];
type Club = typeof dummyClubs[0];

export default function AdminTeamsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const querySeasonId = searchParams.get('seasonId');
  const queryLeagueId = searchParams.get('leagueId');

  const [allSeasons] = useState<Season[]>(dummySeasons);
  const [allLeagues] = useState<League[]>(dummyLeagues);
  const [allClubs] = useState<Club[]>(dummyClubs);

  const [selectedSeasonId, setSelectedSeasonId] = useState<string>('');
  const [availableLeaguesForSeason, setAvailableLeaguesForSeason] = useState<League[]>([]);
  const [selectedLeagueId, setSelectedLeagueId] = useState<string>('');
  
  const [teams, setTeams] = useState<Team[]>(initialTeams); // All teams, later fetched
  const [filteredTeams, setFilteredTeams] = useState<Team[]>([]);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentTeam, setCurrentTeam] = useState<Partial<Team> | null>(null);
  const [formMode, setFormMode] = useState<'new' | 'edit'>('new');

  // Effect to set initial season and league from query params or defaults
  useEffect(() => {
    if (querySeasonId && allSeasons.some(s => s.id === querySeasonId)) {
      setSelectedSeasonId(querySeasonId);
    } else if (allSeasons.length > 0) {
      setSelectedSeasonId(allSeasons[0].id);
    }
  }, [querySeasonId, allSeasons]);

  useEffect(() => {
    // Update available leagues when selectedSeasonId changes
    if (selectedSeasonId) {
      const leaguesForSeason = allLeagues.filter(l => l.seasonId === selectedSeasonId);
      setAvailableLeaguesForSeason(leaguesForSeason);
      // Try to set league from query param if it belongs to current season, else first available or none
      if (queryLeagueId && leaguesForSeason.some(l => l.id === queryLeagueId)) {
        setSelectedLeagueId(queryLeagueId);
      } else if (leaguesForSeason.length > 0) {
        setSelectedLeagueId(leaguesForSeason[0].id);
      } else {
        setSelectedLeagueId('');
      }
    } else {
      setAvailableLeaguesForSeason([]);
      setSelectedLeagueId('');
    }
  }, [selectedSeasonId, allLeagues, queryLeagueId]);


  useEffect(() => {
    // Filter teams when selectedLeagueId or selectedSeasonId (via competitionYear) changes
    // TODO: In a real app, fetch teams for the selectedLeagueId and season's year
    if (selectedLeagueId && selectedSeasonId) {
      const currentSeason = allSeasons.find(s => s.id === selectedSeasonId);
      if (currentSeason) {
        setFilteredTeams(teams.filter(t => t.leagueId === selectedLeagueId && t.competitionYear === currentSeason.year));
      } else {
        setFilteredTeams([]);
      }
    } else {
      setFilteredTeams([]);
    }
  }, [selectedLeagueId, selectedSeasonId, teams, allSeasons]);

  const handleAddNew = () => {
    if (!selectedLeagueId || !selectedSeasonId) {
        alert("Bitte zuerst eine Saison und Liga auswählen.");
        return;
    }
    const currentSeason = allSeasons.find(s => s.id === selectedSeasonId);
    if (!currentSeason) return;

    setFormMode('new');
    setCurrentTeam({ 
      leagueId: selectedLeagueId, 
      competitionYear: currentSeason.year, 
      name: '', 
      clubId: allClubs.length > 0 ? allClubs[0].id : '' 
    });
    setIsFormOpen(true);
  };

  const handleEdit = (team: Team) => {
    setFormMode('edit');
    setCurrentTeam(team);
    setIsFormOpen(true);
  };

  const handleDelete = (teamId: string) => {
    setTeams(prev => prev.filter(t => t.id !== teamId));
    console.log(`Mannschaft ${teamId} zum Löschen markiert.`);
  };
  
  const handleSubmit = () => {
    // TODO: Implement actual save/update logic to Firestore
    if (formMode === 'new' && currentTeam && currentTeam.name && currentTeam.clubId) {
      const newTeam = { ...currentTeam, id: `t_${currentTeam.name?.replace(/\s+/g, '_').toLowerCase()}_${Math.random().toString(36).substr(2,5)}` } as Team;
      setTeams(prev => [...prev, newTeam]);
      console.log("Neue Mannschaft (simuliert):", newTeam);
    } else if (formMode === 'edit' && currentTeam?.id && currentTeam.name && currentTeam.clubId) {
      setTeams(prev => prev.map(t => t.id === currentTeam.id ? {...t, ...currentTeam} as Team : t));
      console.log("Mannschaft bearbeitet (simuliert):", currentTeam);
    }
    setIsFormOpen(false);
    setCurrentTeam(null);
  };

  const handleFormInputChange = (field: keyof Team, value: string | number) => {
    if (currentTeam) {
        setCurrentTeam(prev => ({ ...prev, [field]: value } as Partial<Team>));
    }
  };
  
  const navigateToShooters = (teamId: string) => {
    router.push(`/admin/shooters?clubId=${filteredTeams.find(t=>t.id === teamId)?.clubId}&teamId=${teamId}`);
  };

  const selectedSeasonName = allSeasons.find(s => s.id === selectedSeasonId)?.name || 'Saison';
  const selectedLeagueName = availableLeaguesForSeason.find(l=>l.id===selectedLeagueId)?.name || 'Liga';

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-primary">Mannschaftsverwaltung</h1>
        <div className="flex items-center gap-2"> {/* Reduced gap */}
          <Select value={selectedSeasonId} onValueChange={setSelectedSeasonId}>
            <SelectTrigger className="w-[200px] sm:w-[220px]" aria-label="Saison auswählen">
              <SelectValue placeholder="Saison wählen" />
            </SelectTrigger>
            <SelectContent>
              {allSeasons.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={selectedLeagueId} onValueChange={setSelectedLeagueId} disabled={!selectedSeasonId || availableLeaguesForSeason.length === 0}>
            <SelectTrigger className="w-[200px] sm:w-[220px]" aria-label="Liga auswählen">
              <SelectValue placeholder="Liga wählen" />
            </SelectTrigger>
            <SelectContent>
              {availableLeaguesForSeason.length > 0 ? 
                availableLeaguesForSeason.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>) :
                <SelectItem value="no-league" disabled>Keine Ligen für Saison</SelectItem>
              }
            </SelectContent>
          </Select>
          <Button onClick={handleAddNew} disabled={!selectedLeagueId} className="whitespace-nowrap">
            <PlusCircle className="mr-2 h-5 w-5" /> Neue Mannschaft
          </Button>
        </div>
      </div>
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Mannschaften in {selectedLeagueName} ({selectedSeasonName})</CardTitle>
          <CardDescription>
            Verwalten Sie hier die Mannschaften für die ausgewählte Liga und Saison.
          </CardDescription>
        </CardHeader>
        <CardContent>
           {filteredTeams.length > 0 ? (
             <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Verein</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTeams.map((team) => (
                  <TableRow key={team.id}>
                    <TableCell>{team.name}</TableCell>
                    <TableCell>{allClubs.find(c => c.id === team.clubId)?.name || 'N/A'}</TableCell>
                    <TableCell className="text-right space-x-2">
                       <Button variant="outline" size="sm" onClick={() => navigateToShooters(team.id)}>
                        <Users className="mr-1 h-4 w-4" /> Schützen
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(team)} aria-label="Mannschaft bearbeiten">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(team.id)} className="text-destructive hover:text-destructive/80" aria-label="Mannschaft löschen">
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
                {selectedLeagueId ? `Keine Mannschaften für ${selectedLeagueName} in ${selectedSeasonName} angelegt.` : 
                (selectedSeasonId ? 'Bitte wählen Sie eine Liga aus.' : 'Bitte wählen Sie zuerst Saison und Liga aus.')}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{formMode === 'new' ? 'Neue Mannschaft anlegen' : 'Mannschaft bearbeiten'}</DialogTitle>
             <DialogDescription>
              Für Liga: {selectedLeagueName} ({selectedSeasonName})
            </DialogDescription>
          </DialogHeader>
          {currentTeam && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">Name</Label>
                <Input id="name" value={currentTeam.name || ''} onChange={(e) => handleFormInputChange('name', e.target.value)} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="clubId" className="text-right">Verein</Label>
                <Select value={currentTeam.clubId || ''} onValueChange={(value) => handleFormInputChange('clubId', value)}>
                    <SelectTrigger id="clubId" className="col-span-3" aria-label="Verein auswählen">
                        <SelectValue placeholder="Verein wählen"/>
                    </SelectTrigger>
                    <SelectContent>
                        {allClubs.map(club => <SelectItem key={club.id} value={club.id}>{club.name}</SelectItem>)}
                    </SelectContent>
                </Select>
              </div>
               {/* Liga und Saison (competitionYear) werden automatisch von der Auswahl übernommen und sind im currentTeam Objekt */}
                <Input type="hidden" value={currentTeam.leagueId || ''} />
                <Input type="hidden" value={currentTeam.competitionYear || 0} />
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Abbrechen</Button>
            <Button type="submit" onClick={handleSubmit}>Speichern</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
