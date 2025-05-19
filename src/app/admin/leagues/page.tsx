// src/app/admin/leagues/page.tsx
"use client";
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Edit, Trash2, Eye } from 'lucide-react';
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
import { useSearchParams, useRouter } from 'next/navigation'; // Import useRouter and useSearchParams

// Dummy data
const dummySeasons = [
  { id: 's2025kk', name: 'RWK 2025 Kleinkaliber', type: 'KK', year: 2025 },
  { id: 's2025ld', name: 'RWK 2025 Luftdruck', type: 'LD', year: 2025 },
  { id: 's2024kk', name: 'RWK 2024 Kleinkaliber', type: 'KK', year: 2024 },
];

const initialLeagues = [
  { id: 'l_kol_kk25', seasonId: 's2025kk', name: 'Kreisoberliga', shortName: 'KOL', type: 'KK', order: 1 },
  { id: 'l_kl_kk25', seasonId: 's2025kk', name: 'Kreisliga', shortName: 'KL', type: 'KK', order: 2 },
  { id: 'l_1kl_kk25', seasonId: 's2025kk', name: '1. Kreisklasse', shortName: '1.KK', type: 'KK', order: 3 },
  { id: 'l_2kl_kk25', seasonId: 's2025kk', name: '2. Kreisklasse', shortName: '2.KK', type: 'KK', order: 4 },
  { id: 'l_lg_a_ld25', seasonId: 's2025ld', name: 'Luftgewehr Auflage A', shortName: 'LG A', type: 'LD', order: 1 },
];

type League = typeof initialLeagues[0];
type Season = typeof dummySeasons[0];

export default function AdminLeaguesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const querySeasonId = searchParams.get('seasonId');

  const [allSeasons] = useState<Season[]>(dummySeasons); // In a real app, fetch this
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>('');
  
  const [leagues, setLeagues] = useState<League[]>(initialLeagues); // All leagues, later fetched
  const [filteredLeagues, setFilteredLeagues] = useState<League[]>([]);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentLeague, setCurrentLeague] = useState<Partial<League> | null>(null);
  const [formMode, setFormMode] = useState<'new' | 'edit'>('new');

  useEffect(() => {
    // Set initial selected season from query param or first available
    if (querySeasonId && allSeasons.some(s => s.id === querySeasonId)) {
      setSelectedSeasonId(querySeasonId);
    } else if (allSeasons.length > 0) {
      setSelectedSeasonId(allSeasons[0].id);
    }
  }, [querySeasonId, allSeasons]);

  useEffect(() => {
    // Filter leagues when selectedSeasonId changes
    // TODO: In a real app, fetch leagues for the selectedSeasonId
    if (selectedSeasonId) {
      setFilteredLeagues(leagues.filter(l => l.seasonId === selectedSeasonId).sort((a,b) => (a.order || 0) - (b.order || 0)));
    } else {
      setFilteredLeagues([]);
    }
  }, [selectedSeasonId, leagues]);
  
  const handleAddNew = () => {
    if (!selectedSeasonId) {
        // This should ideally not happen if a season is always selected
        alert("Bitte zuerst eine Saison auswählen.");
        return;
    }
    const seasonType = allSeasons.find(s => s.id === selectedSeasonId)?.type || 'KK';
    setFormMode('new');
    setCurrentLeague({ 
      seasonId: selectedSeasonId, 
      name: '', 
      shortName: '', 
      type: seasonType, 
      order: (filteredLeagues.length + 1) * 10 
    });
    setIsFormOpen(true);
  };

  const handleEdit = (league: League) => {
    setFormMode('edit');
    setCurrentLeague(league);
    setIsFormOpen(true);
  };

  const handleDelete = (leagueId: string) => {
    // TODO: Implement actual delete logic
    setLeagues(prev => prev.filter(l => l.id !== leagueId));
     console.log(`Liga ${leagueId} zum Löschen markiert.`);
  };
  
  const handleSubmit = () => {
    // TODO: Implement actual save/update logic to Firestore
    if (formMode === 'new' && currentLeague && currentLeague.name) {
      const newLeagueToAdd = { ...currentLeague, id: `l_${currentLeague.name?.replace(/\s+/g, '_').toLowerCase()}_${Math.random().toString(36).substr(2,5)}` } as League;
      setLeagues(prev => [...prev, newLeagueToAdd]);
      console.log("Neue Liga (simuliert):", newLeagueToAdd);
    } else if (formMode === 'edit' && currentLeague?.id && currentLeague.name) {
      setLeagues(prev => prev.map(l => l.id === currentLeague.id ? {...l, ...currentLeague} as League : l));
      console.log("Liga bearbeitet (simuliert):", currentLeague);
    }
    setIsFormOpen(false);
    setCurrentLeague(null);
  };

  const handleFormInputChange = (field: keyof League, value: string | number) => {
    if (currentLeague) {
        setCurrentLeague(prev => ({ ...prev, [field]: value } as Partial<League>));
    }
  };

  const navigateToTeams = (leagueId: string) => {
    router.push(`/admin/teams?seasonId=${selectedSeasonId}&leagueId=${leagueId}`);
  };

  const selectedSeasonName = allSeasons.find(s => s.id === selectedSeasonId)?.name || 'ausgewählte Saison';

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-primary">Ligenverwaltung</h1>
        <div className="flex items-center gap-4">
          <Select value={selectedSeasonId} onValueChange={setSelectedSeasonId}>
            <SelectTrigger className="w-[250px]" aria-label="Saison auswählen">
              <SelectValue placeholder="Saison wählen" />
            </SelectTrigger>
            <SelectContent>
              {allSeasons.map(season => (
                <SelectItem key={season.id} value={season.id}>{season.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleAddNew} disabled={!selectedSeasonId}>
            <PlusCircle className="mr-2 h-5 w-5" /> Neue Liga anlegen
          </Button>
        </div>
      </div>
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Ligen für {selectedSeasonName}</CardTitle>
          <CardDescription>
            Verwalten Sie hier die Ligen für die ausgewählte Saison. Klicken Sie auf 'Teams', um die Mannschaften einer Liga zu bearbeiten.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredLeagues.length > 0 ? (
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
                {filteredLeagues.map((league) => (
                  <TableRow key={league.id}>
                    <TableCell>{league.name}</TableCell>
                    <TableCell>{league.shortName}</TableCell>
                    <TableCell>{league.type}</TableCell>
                    <TableCell>{league.order}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="outline" size="sm" onClick={() => navigateToTeams(league.id)} disabled={!selectedSeasonId}>
                        <Eye className="mr-1 h-4 w-4" /> Teams
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(league)} aria-label="Liga bearbeiten">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(league.id)} className="text-destructive hover:text-destructive/80" aria-label="Liga löschen">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
             <div className="p-8 text-center text-muted-foreground bg-secondary/30 rounded-md">
              <p className="text-lg">{selectedSeasonId ? `Keine Ligen für ${selectedSeasonName} angelegt.` : 'Bitte wählen Sie zuerst eine Saison aus.'}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{formMode === 'new' ? 'Neue Liga anlegen' : 'Liga bearbeiten'}</DialogTitle>
            <DialogDescription>
              {formMode === 'new' ? `Erstellen Sie eine neue Liga für ${selectedSeasonName}.` : `Bearbeiten Sie die Details für ${currentLeague?.name}.`}
            </DialogDescription>
          </DialogHeader>
          {currentLeague && (
            <div className="grid gap-4 py-4">
               <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="seasonDisplay" className="text-right">Saison</Label>
                <Input id="seasonDisplay" value={selectedSeasonName} disabled className="col-span-3 bg-muted/50" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">Name</Label>
                <Input id="name" value={currentLeague.name || ''} onChange={(e) => handleFormInputChange('name', e.target.value)} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="shortName" className="text-right">Kürzel</Label>
                <Input id="shortName" value={currentLeague.shortName || ''} onChange={(e) => handleFormInputChange('shortName', e.target.value)} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="order" className="text-right">Reihenf.</Label>
                <Input id="order" type="number" value={currentLeague.order || 0} onChange={(e) => handleFormInputChange('order', parseInt(e.target.value))} className="col-span-3" />
              </div>
               <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="type" className="text-right">Typ</Label>
                <Input id="type" value={currentLeague.type || ''} disabled className="col-span-3 bg-muted/50" title="Wird von der Saison übernommen"/>
              </div>
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
