// src/app/admin/shooters/page.tsx
"use client";
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
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

// Dummy data - In a real app, these would be fetched or passed appropriately
const dummyClubs = [
  { id: 'c_naensen', name: 'SC Naensen' },
  { id: 'c_einbeck', name: 'Einbecker SGi' },
  { id: 'c_doerrigsen', name: 'SV Dörrigsen'},
];
// Example teams, this would be more complex in reality, filtered by season/league
const dummyTeams = [ 
    { id: 't_naensen1_kol_kk25', name: 'SC Naensen I (KOL KK 2025)', clubId: 'c_naensen', leagueId: 'l_kol_kk25', seasonId: 's2025kk'},
    { id: 't_esgi1_kol_kk25', name: 'Einbecker SGi I (KOL KK 2025)', clubId: 'c_einbeck', leagueId: 'l_kol_kk25', seasonId: 's2025kk'},
    { id: 't_naensen_lg_a_ld25', name: 'SC Naensen LG (LG A LD 2025)', clubId: 'c_naensen', leagueId: 'l_lg_a_ld25', seasonId: 's2025ld'},
];

const initialShooters = [
  { id: 'sh_m_b', name: 'Max Mustermann', firstName: 'Max', lastName: 'Mustermann', clubId: 'c_naensen', gender: 'male', teamIds: ['t_naensen1_kol_kk25'] },
  { id: 'sh_e_m', name: 'Erika Musterfrau', firstName: 'Erika', lastName: 'Musterfrau', clubId: 'c_einbeck', gender: 'female', teamIds: ['t_esgi1_kol_kk25'] },
  { id: 'sh_h_f', name: 'Holger Fesser', firstName: 'Holger', lastName: 'Fesser', clubId: 'c_naensen', gender: 'male', teamIds: ['t_naensen1_kol_kk25', 't_naensen_lg_a_ld25']},
];

type Shooter = Omit<typeof initialShooters[0], 'teamIds'> & { teamIds?: string[] }; // teamIds is optional
type Club = typeof dummyClubs[0];
type Team = typeof dummyTeams[0];


export default function AdminShootersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Query params can be used to pre-filter, e.g., by teamId
  const queryTeamId = searchParams.get('teamId'); 
  const queryClubId = searchParams.get('clubId'); 


  const [allClubs] = useState<Club[]>(dummyClubs);
  // const [allTeams] = useState<Team[]>(dummyTeams); // If needed for team selection in form

  const [selectedClubId, setSelectedClubId] = useState<string>('');
  // const [selectedTeamIdForFilter, setSelectedTeamIdForFilter] = useState<string>('');


  const [shooters, setShooters] = useState<Shooter[]>(initialShooters);
  const [filteredShooters, setFilteredShooters] = useState<Shooter[]>([]);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentShooter, setCurrentShooter] = useState<Partial<Shooter> | null>(null);
  const [formMode, setFormMode] = useState<'new' | 'edit'>('new');
  
  useEffect(() => {
    // Pre-select club if queryClubId is present
    if (queryClubId && allClubs.some(c => c.id === queryClubId)) {
      setSelectedClubId(queryClubId);
    }
     // TODO: Pre-select team for filter if queryTeamId is present
     // This would require fetching teams based on season/league first if not passed
  }, [queryClubId, allClubs, queryTeamId]);
  
  useEffect(() => {
    // TODO: Implement more sophisticated filtering if teamId is also used
    // For now, simple club filter
    let tempFiltered = shooters;
    if (selectedClubId) {
      tempFiltered = tempFiltered.filter(s => s.clubId === selectedClubId);
    }
    // if (selectedTeamIdForFilter) { // If filtering by team
    //   tempFiltered = tempFiltered.filter(s => s.teamIds?.includes(selectedTeamIdForFilter));
    // }
    setFilteredShooters(tempFiltered);
  }, [selectedClubId, shooters /*, selectedTeamIdForFilter */]);

  const handleAddNew = () => {
    setFormMode('new');
    setCurrentShooter({ 
      firstName: '', 
      lastName: '', 
      clubId: selectedClubId || (allClubs.length > 0 ? allClubs[0].id : ''), 
      gender: 'male',
      teamIds: queryTeamId ? [queryTeamId] : [] // Pre-assign to team if coming from team page
    });
    setIsFormOpen(true);
  };

  const handleEdit = (shooter: Shooter) => {
    setFormMode('edit');
    setCurrentShooter(shooter);
    setIsFormOpen(true);
  };

  const handleDelete = (shooterId: string) => {
    setShooters(prev => prev.filter(s => s.id !== shooterId));
     console.log(`Schütze ${shooterId} zum Löschen markiert.`);
  };

  const handleSubmit = () => {
    // TODO: Implement actual save/update logic to Firestore
    if (formMode === 'new' && currentShooter && currentShooter.firstName && currentShooter.lastName) {
      const newShooter = { ...currentShooter, id: `sh_${currentShooter.firstName?.toLowerCase()}_${currentShooter.lastName?.toLowerCase()}_${Math.random().toString(36).substr(2,5)}`, name: `${currentShooter.firstName} ${currentShooter.lastName}` } as Shooter;
      setShooters(prev => [...prev, newShooter]);
      console.log("Neuer Schütze (simuliert):", newShooter);
    } else if (formMode === 'edit' && currentShooter?.id && currentShooter.firstName && currentShooter.lastName) {
      setShooters(prev => prev.map(s => s.id === currentShooter.id ? {...s, ...currentShooter, name: `${currentShooter.firstName} ${currentShooter.lastName}`} as Shooter : s));
      console.log("Schütze bearbeitet (simuliert):", currentShooter);
    }
    setIsFormOpen(false);
    setCurrentShooter(null);
  };

  const handleFormInputChange = (field: keyof Shooter, value: string | string[]) => {
    if (currentShooter) {
        setCurrentShooter(prev => ({ ...prev, [field]: value } as Partial<Shooter>));
    }
  };
  
  const getTeamNamesForShooter = (teamIds?: string[]): string => {
    if (!teamIds || teamIds.length === 0) return '-';
    return teamIds.map(tid => dummyTeams.find(t => t.id === tid)?.name || tid).join(', ');
  };


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-primary">Schützenverwaltung</h1>
        <div className="flex items-center gap-4">
           <Select value={selectedClubId} onValueChange={setSelectedClubId}>
            <SelectTrigger className="w-[220px]" aria-label="Verein filtern">
              <SelectValue placeholder="Verein filtern" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Alle Vereine</SelectItem>
              {allClubs.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          {/* TODO: Add Team Filter if necessary, requires season/league context first */}
          {/* <Select value={selectedTeamIdForFilter} onValueChange={setSelectedTeamIdForFilter} disabled={!selectedClubId}>...</Select> */}
          <Button onClick={handleAddNew}>
            <PlusCircle className="mr-2 h-5 w-5" /> Neuen Schützen anlegen
          </Button>
        </div>
      </div>
       <Card className="shadow-md">
        <CardHeader>
          <CardTitle>
            Schützen {selectedClubId ? `für ${allClubs.find(c=>c.id === selectedClubId)?.name}` : 'aller Vereine'}
            {queryTeamId ? ` (Vorauswahl für Team: ${dummyTeams.find(t=>t.id === queryTeamId)?.name || queryTeamId})` : ''}
          </CardTitle>
          <CardDescription>
            Verwalten Sie hier alle Schützen.
          </CardDescription>
        </CardHeader>
        <CardContent>
           {filteredShooters.length > 0 ? (
             <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Verein</TableHead>
                  <TableHead>Geschlecht</TableHead>
                  <TableHead>Mannschaften (Dummy)</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredShooters.map((shooter) => (
                  <TableRow key={shooter.id}>
                    <TableCell>{shooter.name}</TableCell>
                    <TableCell>{allClubs.find(c => c.id === shooter.clubId)?.name || 'N/A'}</TableCell>
                    <TableCell>{shooter.gender === 'male' ? 'Männlich' : (shooter.gender === 'female' ? 'Weiblich' : 'N/A')}</TableCell>
                    <TableCell className="text-xs">{getTeamNamesForShooter(shooter.teamIds)}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(shooter)} aria-label="Schütze bearbeiten">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(shooter.id)} className="text-destructive hover:text-destructive/80" aria-label="Schütze löschen">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="p-8 text-center text-muted-foreground bg-secondary/30 rounded-md">
              <p className="text-lg">{selectedClubId ? 'Keine Schützen für diesen Filter gefunden.' : 'Keine Schützen angelegt.'}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{formMode === 'new' ? 'Neuen Schützen anlegen' : 'Schütze bearbeiten'}</DialogTitle>
             <DialogDescription>
                {queryTeamId && formMode === 'new' ? `Schütze wird Team "${dummyTeams.find(t=>t.id === queryTeamId)?.name || queryTeamId}" zugeordnet.` : ''}
             </DialogDescription>
          </DialogHeader>
          {currentShooter && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="firstName" className="text-right">Vorname</Label>
                <Input id="firstName" value={currentShooter.firstName || ''} onChange={(e) => handleFormInputChange('firstName', e.target.value)} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="lastName" className="text-right">Nachname</Label>
                <Input id="lastName" value={currentShooter.lastName || ''} onChange={(e) => handleFormInputChange('lastName', e.target.value)} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="clubId" className="text-right">Verein</Label>
                <Select value={currentShooter.clubId || ''} onValueChange={(value) => handleFormInputChange('clubId', value)}>
                    <SelectTrigger id="clubId" className="col-span-3" aria-label="Verein auswählen">
                        <SelectValue placeholder="Verein wählen"/>
                    </SelectTrigger>
                    <SelectContent>
                        {allClubs.map(club => <SelectItem key={club.id} value={club.id}>{club.name}</SelectItem>)}
                    </SelectContent>
                </Select>
              </div>
               <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="gender" className="text-right">Geschlecht</Label>
                <Select value={currentShooter.gender || 'male'} onValueChange={(value) => handleFormInputChange('gender', value)}>
                    <SelectTrigger id="gender" className="col-span-3" aria-label="Geschlecht auswählen">
                        <SelectValue placeholder="Geschlecht wählen"/>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="male">Männlich</SelectItem>
                        <SelectItem value="female">Weiblich</SelectItem>
                        {/* <SelectItem value="diverse">Divers</SelectItem> */}
                    </SelectContent>
                </Select>
              </div>
              {/* TODO: Teamzuweisung - komplexer, da ein Schütze in mehreren Teams sein kann.
                  Könnte eine Multi-Select Komponente oder eine separate Verwaltungsansicht erfordern.
                  Fürs Erste: Wenn queryTeamId da ist, wird es in `teamIds` gesetzt.
              */}
               <p className="col-span-4 text-xs text-muted-foreground p-2 rounded-md bg-secondary/30">
                Aktuelle Dummy-Teamzuweisungen: {getTeamNamesForShooter(currentShooter.teamIds)}
               </p>
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
