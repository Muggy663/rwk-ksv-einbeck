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

// Dummy data
const dummySeasons = [
  { id: 's2025kk', name: 'RWK 2025 Kleinkaliber' },
  { id: 's2025ld', name: 'RWK 2025 Luftdruck' },
];
const dummyLeagues = [
  { id: 'l_kol_kk25', seasonId: 's2025kk', name: 'Kreisoberliga (KK)' },
  { id: 'l_kl_kk25', seasonId: 's2025kk', name: 'Kreisliga (KK)' },
  { id: 'l_lg_a_ld25', seasonId: 's2025ld', name: 'Luftgewehr Auflage A (LD)' },
];
const dummyClubs = [
  { id: 'c_naensen', name: 'SC Naensen' },
  { id: 'c_einbeck', name: 'Einbecker SGi' },
];

const initialTeams = [
  { id: 't_naensen1_kol_kk25', name: 'SC Naensen I', leagueId: 'l_kol_kk25', clubId: 'c_naensen', competitionYear: 2025 },
  { id: 't_esgi1_kol_kk25', name: 'Einbecker SGi I', leagueId: 'l_kol_kk25', clubId: 'c_einbeck', competitionYear: 2025 },
  { id: 't_naensen_lg_a_ld25', name: 'SC Naensen LG', leagueId: 'l_lg_a_ld25', clubId: 'c_naensen', competitionYear: 2025 },
];

type Team = typeof initialTeams[0];

export default function AdminTeamsPage() {
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>('');
  const [availableLeagues, setAvailableLeagues] = useState<(typeof dummyLeagues[0])[]>([]);
  const [selectedLeagueId, setSelectedLeagueId] = useState<string>('');
  
  const [teams, setTeams] = useState<Team[]>(initialTeams);
  const [filteredTeams, setFilteredTeams] = useState<Team[]>([]);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentTeam, setCurrentTeam] = useState<Partial<Team> | null>(null);
  const [formMode, setFormMode] = useState<'new' | 'edit'>('new');

  useEffect(() => {
    if (selectedSeasonId) {
      setAvailableLeagues(dummyLeagues.filter(l => l.seasonId === selectedSeasonId));
      setSelectedLeagueId(''); // Reset league selection when season changes
    } else {
      setAvailableLeagues([]);
      setSelectedLeagueId('');
    }
  }, [selectedSeasonId]);

  useEffect(() => {
    if (selectedLeagueId) {
      const compYear = dummySeasons.find(s => s.id === selectedSeasonId)?.name.includes('2025') ? 2025 : 0; // simplified
      setFilteredTeams(teams.filter(t => t.leagueId === selectedLeagueId && t.competitionYear === compYear));
    } else {
      setFilteredTeams([]);
    }
  }, [selectedLeagueId, teams, selectedSeasonId]);

  const handleAddNew = () => {
    if (!selectedLeagueId) {
        alert("Bitte zuerst eine Saison und Liga auswählen.");
        return;
    }
    const compYear = dummySeasons.find(s => s.id === selectedSeasonId)?.name.includes('2025') ? 2025 : 0;
    setFormMode('new');
    setCurrentTeam({ leagueId: selectedLeagueId, competitionYear: compYear, name: '', clubId: '' });
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
    if (formMode === 'new' && currentTeam && currentTeam.name && currentTeam.clubId) {
      const newTeam = { ...currentTeam, id: `t_${currentTeam.name.replace(/\s+/g, '_').toLowerCase()}_${Math.random().toString(36).substr(2,5)}` } as Team;
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-primary">Mannschaftsverwaltung</h1>
        <div className="flex items-center gap-4">
          <Select value={selectedSeasonId} onValueChange={setSelectedSeasonId}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Saison wählen" />
            </SelectTrigger>
            <SelectContent>
              {dummySeasons.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={selectedLeagueId} onValueChange={setSelectedLeagueId} disabled={!selectedSeasonId}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Liga wählen" />
            </SelectTrigger>
            <SelectContent>
              {availableLeagues.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={handleAddNew} disabled={!selectedLeagueId}>
            <PlusCircle className="mr-2 h-5 w-5" /> Neue Mannschaft
          </Button>
        </div>
      </div>
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Mannschaften in {dummyLeagues.find(l=>l.id===selectedLeagueId)?.name || 'ausgewählter Liga'}</CardTitle>
          <CardDescription>
            Verwalten Sie hier die Mannschaften.
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
                    <TableCell>{dummyClubs.find(c => c.id === team.clubId)?.name || 'N/A'}</TableCell>
                    <TableCell className="text-right space-x-2">
                       <Button variant="outline" size="sm" onClick={() => alert(`Schützen für ${team.name} verwalten (TODO)`)}>
                        <Users className="mr-1 h-4 w-4" /> Schützen
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(team)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(team.id)} className="text-destructive hover:text-destructive/80">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="p-8 text-center text-muted-foreground bg-secondary/30 rounded-md">
              <p className="text-lg">{selectedLeagueId ? 'Keine Mannschaften für diese Liga angelegt.' : 'Bitte wählen Sie zuerst Saison und Liga aus.'}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{formMode === 'new' ? 'Neue Mannschaft anlegen' : 'Mannschaft bearbeiten'}</DialogTitle>
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
                    <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Verein wählen"/>
                    </SelectTrigger>
                    <SelectContent>
                        {dummyClubs.map(club => <SelectItem key={club.id} value={club.id}>{club.name}</SelectItem>)}
                    </SelectContent>
                </Select>
              </div>
               {/* Liga und Saison werden automatisch von der Auswahl übernommen */}
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
