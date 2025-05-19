// src/app/admin/results/page.tsx
"use client";
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CheckSquare, Save } from 'lucide-react';

// Dummy data for selection
const dummySeasons = [
  { id: 's2025kk', name: 'RWK 2025 Kleinkaliber' },
  { id: 's2025ld', name: 'RWK 2025 Luftdruck' },
];
const dummyLeagues = [
  { id: 'l_kol_kk25', seasonId: 's2025kk', name: 'Kreisoberliga (KK)' },
  { id: 'l_kl_kk25', seasonId: 's2025kk', name: 'Kreisliga (KK)' },
  { id: 'l_lg_a_ld25', seasonId: 's2025ld', name: 'Luftgewehr Auflage A (LD)' },
];
const dummyTeams = [
    { id: 't_naensen1_kol_kk25', name: 'SC Naensen I', leagueId: 'l_kol_kk25'},
    { id: 't_esgi1_kol_kk25', name: 'Einbecker SGi I', leagueId: 'l_kol_kk25'},
    { id: 't_naensen_lg_a_ld25', name: 'SC Naensen LG', leagueId: 'l_lg_a_ld25'},
];
const dummyShooters = [ // Should be filtered by team
  { id: 'sh_m_b', name: 'Max Mustermann', teamId: 't_naensen1_kol_kk25' },
  { id: 'sh_e_m', name: 'Erika Musterfrau', teamId: 't_esgi1_kol_kk25' },
  { id: 'sh_h_f', name: 'Holger Fesser', teamId: 't_naensen1_kol_kk25' },
];

const NUM_ROUNDS = 5;

export default function AdminResultsPage() {
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>('');
  const [availableLeagues, setAvailableLeagues] = useState<(typeof dummyLeagues[0])[]>([]);
  const [selectedLeagueId, setSelectedLeagueId] = useState<string>('');
  const [availableTeams, setAvailableTeams] = useState<(typeof dummyTeams[0])[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [availableShooters, setAvailableShooters] = useState<(typeof dummyShooters[0])[]>([]);
  const [selectedShooterId, setSelectedShooterId] = useState<string>('');
  const [selectedRound, setSelectedRound] = useState<string>('');
  const [resultType, setResultType] = useState<"regular" | "pre" | "post">("regular");
  const [score, setScore] = useState<string>('');

  useEffect(() => {
    if (selectedSeasonId) {
      setAvailableLeagues(dummyLeagues.filter(l => l.seasonId === selectedSeasonId));
      setSelectedLeagueId(''); 
      setAvailableTeams([]);
      setSelectedTeamId('');
    } else {
      setAvailableLeagues([]);
    }
  }, [selectedSeasonId]);

  useEffect(() => {
    if (selectedLeagueId) {
      setAvailableTeams(dummyTeams.filter(t => t.leagueId === selectedLeagueId));
      setSelectedTeamId('');
    } else {
      setAvailableTeams([]);
    }
  }, [selectedLeagueId]);
  
  useEffect(() => {
    if (selectedTeamId) {
        // Filter shooters based on selectedTeamId
        // Also, consider filtering out shooters who already have a score for the selectedRound
        setAvailableShooters(dummyShooters.filter(s => s.teamId === selectedTeamId));
        setSelectedShooterId('');
    } else {
        setAvailableShooters([]);
    }
  }, [selectedTeamId, selectedRound]);


  const handleSaveResult = () => {
    if (!selectedShooterId || !selectedRound || !score) {
      alert("Bitte alle Felder ausfüllen.");
      return;
    }
    // TODO: Implement actual save logic to Firestore (collection 'rwk_scores')
    console.log({
      season: selectedSeasonId,
      league: selectedLeagueId,
      team: selectedTeamId,
      shooter: selectedShooterId,
      round: selectedRound,
      type: resultType,
      score: parseInt(score),
      enteredBy: "admin@rwk-einbeck.de", // Later from auth user
      timestamp: new Date().toISOString(),
    });
    alert(`Ergebnis für ${selectedShooterId} in DG ${selectedRound} gespeichert: ${score} (${resultType}) (Simuliert)`);
    // Reset form or specific fields (e.g., selectedShooterId, score)
    // Potentially remove shooter from dropdown if successful (advanced)
    setSelectedShooterId('');
    setScore('');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-primary">Ergebniserfassung</h1>
      </div>
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Einzelergebnis eintragen</CardTitle>
          <CardDescription>
            Wählen Sie Saison, Liga, Mannschaft, Schütze und Durchgang, um ein Ergebnis einzutragen.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
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
              <Label htmlFor="round">Durchgang</Label>
              <Select value={selectedRound} onValueChange={setSelectedRound} disabled={!selectedLeagueId}>
                <SelectTrigger id="round"><SelectValue placeholder="Durchgang wählen" /></SelectTrigger>
                <SelectContent>
                  {[...Array(NUM_ROUNDS)].map((_, i) => (
                    <SelectItem key={i + 1} value={(i + 1).toString()}>Durchgang {i + 1}</SelectItem>
                  ))}
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
              <Label htmlFor="shooter">Schütze</Label>
              <Select value={selectedShooterId} onValueChange={setSelectedShooterId} disabled={!selectedTeamId || !selectedRound}>
                <SelectTrigger id="shooter"><SelectValue placeholder="Schütze wählen" /></SelectTrigger>
                <SelectContent>
                  {availableShooters.map(sh => <SelectItem key={sh.id} value={sh.id}>{sh.name}</SelectItem>)}
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

          <div className="space-y-3 pt-2">
            <Label>Ergebnistyp</Label>
            <RadioGroup defaultValue="regular" value={resultType} onValueChange={(value) => setResultType(value as "regular" | "pre" | "post")} className="flex space-x-4">
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
          
          <div className="flex justify-end pt-4">
            <Button onClick={handleSaveResult} disabled={!selectedShooterId || !selectedRound || !score}>
                <Save className="mr-2 h-5 w-5" /> Ergebnis speichern
            </Button>
          </div>

          <div className="mt-8 p-6 text-center text-muted-foreground bg-secondary/30 rounded-md">
            <CheckSquare className="mx-auto h-10 w-10 mb-3 text-primary/70" />
            <p className="text-base">Hier werden die bereits erfassten Ergebnisse für den ausgewählten Durchgang und die Mannschaft angezeigt (TODO).</p>
            <p className="mt-1 text-sm">(Platzhalter für Ergebnisübersicht)</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
