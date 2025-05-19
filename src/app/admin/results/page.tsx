// src/app/admin/results/page.tsx
"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckSquare, Save, PlusCircle, Trash2, Send } from 'lucide-react';
import type { Season, League, Team, Shooter, PendingScoreEntry } from '@/types/rwk'; // Import PendingScoreEntry
import { useAuth } from '@/hooks/use-auth'; // Für Benutzerinfos
import { useToast } from '@/hooks/use-toast';

// Dummy data for selection - sollte später aus Firestore geladen werden
const dummySeasons: Season[] = [
  { id: 's2025kk', name: 'RWK 2025 Kleinkaliber', type: 'KK', year: 2025, status: 'Geplant' },
  { id: 's2025ld', name: 'RWK 2025 Luftdruck', type: 'LD', year: 2025, status: 'Geplant' },
];
const dummyLeagues: League[] = [
  { id: 'l_kol_kk25', seasonId: 's2025kk', name: 'Kreisoberliga (KK)', competitionYear: 2025, type: 'KK' },
  { id: 'l_kl_kk25', seasonId: 's2025kk', name: 'Kreisliga (KK)', competitionYear: 2025, type: 'KK' },
  { id: 'l_lg_a_ld25', seasonId: 's2025ld', name: 'Luftgewehr Auflage A (LD)', competitionYear: 2025, type: 'LD' },
];
const dummyTeams: Team[] = [
    { id: 't_naensen1_kol_kk25', name: 'SC Naensen I', leagueId: 'l_kol_kk25', clubId: 'c_naensen', competitionYear: 2025 },
    { id: 't_esgi1_kol_kk25', name: 'Einbecker SGi I', leagueId: 'l_kol_kk25', clubId: 'c_einbeck', competitionYear: 2025 },
    { id: 't_naensen_lg_a_ld25', name: 'SC Naensen LG', leagueId: 'l_lg_a_ld25', clubId: 'c_naensen', competitionYear: 2025 },
];
const dummyShooters: Shooter[] = [ 
  { id: 'sh_m_b', name: 'Max Mustermann', teamIds: ['t_naensen1_kol_kk25'], clubId: 'c_naensen' },
  { id: 'sh_e_m', name: 'Erika Musterfrau', teamIds: ['t_esgi1_kol_kk25'], clubId: 'c_einbeck' },
  { id: 'sh_h_f', name: 'Holger Fesser', teamIds: ['t_naensen1_kol_kk25'], clubId: 'c_naensen' },
  { id: 'sh_x_y', name: 'Xaver Ypsilon', teamIds: ['t_naensen_lg_a_ld25'], clubId: 'c_naensen' },
];

const NUM_ROUNDS = 5;

export default function AdminResultsPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [selectedSeasonId, setSelectedSeasonId] = useState<string>('');
  const [availableLeagues, setAvailableLeagues] = useState<League[]>([]);
  const [selectedLeagueId, setSelectedLeagueId] = useState<string>('');
  const [availableTeams, setAvailableTeams] = useState<Team[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  
  const [selectedRound, setSelectedRound] = useState<string>('');
  const [allShootersForTeam, setAllShootersForTeam] = useState<Shooter[]>([]); // Alle Schützen des Teams
  const [availableShootersForDropdown, setAvailableShootersForDropdown] = useState<Shooter[]>([]); // Gefiltert für Dropdown
  const [selectedShooterId, setSelectedShooterId] = useState<string>('');
  
  const [resultType, setResultType] = useState<'regular' | 'pre' | 'post'>("regular");
  const [score, setScore] = useState<string>('');

  const [pendingScores, setPendingScores] = useState<PendingScoreEntry[]>([]);

  // Effekt für Saison -> Ligen
  useEffect(() => {
    if (selectedSeasonId) {
      // TODO: Fetch leagues for selectedSeasonId from Firestore
      setAvailableLeagues(dummyLeagues.filter(l => l.seasonId === selectedSeasonId));
      setSelectedLeagueId(''); 
      setAvailableTeams([]);
      setSelectedTeamId('');
    } else {
      setAvailableLeagues([]);
    }
  }, [selectedSeasonId]);

  // Effekt für Liga -> Teams
  useEffect(() => {
    if (selectedLeagueId) {
      // TODO: Fetch teams for selectedLeagueId from Firestore
      setAvailableTeams(dummyTeams.filter(t => t.leagueId === selectedLeagueId));
      setSelectedTeamId('');
    } else {
      setAvailableTeams([]);
    }
  }, [selectedLeagueId]);
  
  // Effekt für Team -> Schützen laden (einmalig)
  useEffect(() => {
    if (selectedTeamId) {
        // TODO: Fetch shooters for selectedTeamId from Firestore
        const teamShooterIds = dummyTeams.find(t => t.id === selectedTeamId)?.shooterIds || [];
        // Annahme: teamIds in dummyShooters ist Array von Team-IDs, denen der Schütze angehört
        const shootersOfTeam = dummyShooters.filter(sh => sh.teamIds?.includes(selectedTeamId));
        setAllShootersForTeam(shootersOfTeam);
    } else {
        setAllShootersForTeam([]);
    }
  }, [selectedTeamId]);

  // Effekt für Filterung der Schützen im Dropdown (basierend auf Runde und pendingScores)
  useEffect(() => {
    if (selectedTeamId && selectedRound) {
      const shootersInPendingForRound = pendingScores
        .filter(ps => ps.teamId === selectedTeamId && ps.durchgang === parseInt(selectedRound))
        .map(ps => ps.shooterId);
      
      setAvailableShootersForDropdown(
        allShootersForTeam.filter(sh => !shootersInPendingForRound.includes(sh.id))
      );
      setSelectedShooterId(''); // Reset shooter selection when round or pending scores change
    } else {
      setAvailableShootersForDropdown([]);
    }
  }, [selectedTeamId, selectedRound, allShootersForTeam, pendingScores]);


  const handleAddToList = () => {
    if (!selectedShooterId || !selectedRound || !score || !selectedSeasonId || !selectedLeagueId || !selectedTeamId ) {
      toast({ title: "Fehlende Eingabe", description: "Bitte alle Felder (Saison, Liga, Team, Runde, Schütze, Ergebnis) ausfüllen.", variant: "destructive" });
      return;
    }
    if (isNaN(parseInt(score)) || parseInt(score) < 0 || parseInt(score) > 600) { // Annahme: max 600 Ringe
      toast({ title: "Ungültiges Ergebnis", description: "Bitte eine gültige Ringzahl eingeben.", variant: "destructive" });
      return;
    }

    const season = dummySeasons.find(s => s.id === selectedSeasonId);
    const league = availableLeagues.find(l => l.id === selectedLeagueId);
    const team = availableTeams.find(t => t.id === selectedTeamId);
    const shooter = allShootersForTeam.find(sh => sh.id === selectedShooterId);

    if (!season || !league || !team || !shooter) {
      toast({ title: "Fehler", description: "Ausgewählte Daten konnten nicht gefunden werden.", variant: "destructive" });
      return;
    }

    const newPendingEntry: PendingScoreEntry = {
      tempId: new Date().toISOString() + Math.random(), // Eindeutige temporäre ID
      seasonId: selectedSeasonId,
      seasonName: season.name,
      leagueId: selectedLeagueId,
      leagueName: league.name,
      teamId: selectedTeamId,
      teamName: team.name,
      shooterId: selectedShooterId,
      shooterName: shooter.name,
      durchgang: parseInt(selectedRound),
      totalRinge: parseInt(score),
      scoreInputType: resultType,
      competitionYear: season.year,
    };

    setPendingScores(prev => [...prev, newPendingEntry]);
    toast({ title: "Ergebnis hinzugefügt", description: `${shooter.name} - Runde ${selectedRound}: ${score} Ringe zur Liste hinzugefügt.` });
    
    // Reset für nächste Eingabe
    setSelectedShooterId('');
    setScore('');
    // Die anderen Dropdowns (Saison, Liga, Team, Runde) bleiben ausgewählt
  };

  const handleRemoveFromList = (tempId: string) => {
    setPendingScores(prev => prev.filter(p => p.tempId !== tempId));
    toast({ title: "Eintrag entfernt", description: "Ergebnis aus der Liste entfernt.", variant: "destructive" });
  };

  const handleFinalSave = async () => {
    if (pendingScores.length === 0) {
      toast({ title: "Keine Ergebnisse", description: "Es gibt keine Ergebnisse zum Speichern.", variant: "destructive" });
      return;
    }

    // TODO: Implement actual save logic to Firestore
    // For each entry in pendingScores, create a document in 'rwk_scores'
    // Add enteredByUserId, enteredByUserName, entryTimestamp (serverTimestamp)
    console.log("Folgende Ergebnisse würden jetzt gespeichert:", pendingScores.map(p => ({
      ...p,
      enteredByUserId: user?.uid,
      enteredByUserName: user?.email,
      // entryTimestamp: "Firestore.FieldValue.serverTimestamp()" // Pseudo-Code
    })));

    // --- SIMULATION START ---
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
    // --- SIMULATION END ---
    
    toast({ title: "Ergebnisse gespeichert (Simuliert)", description: `${pendingScores.length} Ergebnisse wurden erfolgreich in der Datenbank gespeichert.` });
    setPendingScores([]); // Liste leeren nach dem Speichern
  };

  const selectedSeasonName = dummySeasons.find(s => s.id === selectedSeasonId)?.name;
  const selectedLeagueName = availableLeagues.find(l => l.id === selectedLeagueId)?.name;
  const selectedTeamName = availableTeams.find(t => t.id === selectedTeamId)?.name;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-primary">Ergebniserfassung</h1>
      </div>
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Einzelergebnis zur Liste hinzufügen</CardTitle>
          <CardDescription>
            Wählen Sie die notwendigen Parameter und fügen Sie Ergebnisse hinzu. Gesammelte Ergebnisse können dann gesamt gespeichert werden.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Auswahlfelder */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="season">Saison</Label>
              <Select value={selectedSeasonId} onValueChange={setSelectedSeasonId}>
                <SelectTrigger id="season"><SelectValue placeholder="Saison wählen" /></SelectTrigger>
                <SelectContent>
                  {dummySeasons.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="league">Liga</Label>
              <Select value={selectedLeagueId} onValueChange={setSelectedLeagueId} disabled={!selectedSeasonId}>
                <SelectTrigger id="league"><SelectValue placeholder="Liga wählen" /></SelectTrigger>
                <SelectContent>
                  {availableLeagues.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
             <div className="space-y-2">
              <Label htmlFor="team">Mannschaft</Label>
              <Select value={selectedTeamId} onValueChange={setSelectedTeamId} disabled={!selectedLeagueId}>
                <SelectTrigger id="team"><SelectValue placeholder="Mannschaft wählen" /></SelectTrigger>
                <SelectContent>
                  {availableTeams.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="round">Durchgang</Label>
              <Select value={selectedRound} onValueChange={setSelectedRound} disabled={!selectedTeamId}>
                <SelectTrigger id="round"><SelectValue placeholder="Durchgang wählen" /></SelectTrigger>
                <SelectContent>
                  {[...Array(NUM_ROUNDS)].map((_, i) => (
                    <SelectItem key={i + 1} value={(i + 1).toString()}>Durchgang {i + 1}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="shooter">Schütze</Label>
              <Select value={selectedShooterId} onValueChange={setSelectedShooterId} disabled={!selectedRound || availableShootersForDropdown.length === 0}>
                <SelectTrigger id="shooter">
                  <SelectValue placeholder={availableShootersForDropdown.length === 0 && selectedTeamId && selectedRound ? "Alle Schützen erfasst" : "Schütze wählen"} />
                </SelectTrigger>
                <SelectContent>
                  {availableShootersForDropdown.map(sh => <SelectItem key={sh.id} value={sh.id}>{sh.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="score">Ergebnis (Ringe)</Label>
              <Input 
                id="score" 
                type="number" 
                value={score} 
                onChange={(e) => setScore(e.target.value)} 
                placeholder="z.B. 285" 
                disabled={!selectedShooterId}
              />
            </div>
          </div>

          {/* Ergebnistyp */}
          <div className="space-y-3 pt-2">
            <Label>Ergebnistyp</Label>
            <RadioGroup value={resultType} onValueChange={(value) => setResultType(value as "regular" | "pre" | "post")} className="flex space-x-4">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="regular" id="r-regular" />
                <Label htmlFor="r-regular">Regulär</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pre" id="r-pre" />
                <Label htmlFor="r-pre">Vorschießen</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="post" id="r-post" />
                <Label htmlFor="r-post">Nachschießen</Label>
              </div>
            </RadioGroup>
          </div>
          
          {/* Button zum Hinzufügen zur Liste */}
          <div className="flex justify-end pt-4">
            <Button onClick={handleAddToList} disabled={!selectedShooterId || !selectedRound || !score}>
                <PlusCircle className="mr-2 h-5 w-5" /> Zur Liste hinzufügen
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Anzeige der zwischengespeicherten Ergebnisse */}
      {pendingScores.length > 0 && (
        <Card className="shadow-md mt-6">
          <CardHeader>
            <CardTitle>Vorgemerkte Ergebnisse ({pendingScores.length})</CardTitle>
            <CardDescription>
              Diese Ergebnisse werden beim Klick auf "Alle Ergebnisse speichern" in die Datenbank übernommen.
              Aktuelle Auswahl: {selectedSeasonName || 'Keine Saison'} &gt; {selectedLeagueName || 'Keine Liga'} &gt; {selectedTeamName || 'Kein Team'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Schütze</TableHead>
                  <TableHead className="text-center">DG</TableHead>
                  <TableHead className="text-center">Ringe</TableHead>
                  <TableHead>Typ</TableHead>
                  <TableHead className="text-right">Aktion</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingScores.map((entry) => (
                  <TableRow key={entry.tempId}>
                    <TableCell>{entry.shooterName}</TableCell>
                    <TableCell className="text-center">{entry.durchgang}</TableCell>
                    <TableCell className="text-center">{entry.totalRinge}</TableCell>
                    <TableCell>{entry.scoreInputType === 'pre' ? 'Vorschuss' : entry.scoreInputType === 'post' ? 'Nachschuss' : 'Regulär'}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleRemoveFromList(entry.tempId)} className="text-destructive hover:text-destructive/80">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="flex justify-end pt-6">
              <Button onClick={handleFinalSave} size="lg">
                  <Send className="mr-2 h-5 w-5" /> Alle {pendingScores.length} Ergebnisse speichern
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
       {pendingScores.length === 0 && (
         <div className="mt-8 p-6 text-center text-muted-foreground bg-secondary/30 rounded-md">
            <CheckSquare className="mx-auto h-10 w-10 mb-3 text-primary/70" />
            <p className="text-base">Noch keine Ergebnisse zur Speicherung vorgemerkt.</p>
            <p className="mt-1 text-sm">Fügen Sie Ergebnisse über das Formular oben hinzu.</p>
          </div>
       )}
    </div>
  );
}
