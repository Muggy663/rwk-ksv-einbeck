"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Plus, Save, Users, Trophy, Target } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase/config';
import { collection, addDoc, getDocs, query, orderBy, doc, setDoc, writeBatch, Timestamp } from 'firebase/firestore';
import type { Club, Season } from '@/types/rwk';

interface QuickShooter {
  name: string;
  clubId: string;
}

interface QuickTeam {
  name: string;
  clubId: string;
  seasonId: string;
  leagueType: string;
  shooterNames: string[];
}

export default function EmergencyDataEntryPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [quickShooters, setQuickShooters] = useState<QuickShooter[]>([{ name: '', clubId: '' }]);
  const [quickTeams, setQuickTeams] = useState<QuickTeam[]>([{
    name: '',
    clubId: '',
    seasonId: '',
    leagueType: '',
    shooterNames: ['', '', '', '', '', '', '', '']
  }]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [clubsSnapshot, seasonsSnapshot] = await Promise.all([
          getDocs(query(collection(db, 'rwk_clubs'), orderBy('name', 'asc'))),
          getDocs(query(collection(db, 'rwk_seasons'), orderBy('competitionYear', 'desc')))
        ]);

        setClubs(clubsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Club)));
        setSeasons(seasonsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Season)));
      } catch (error) {
        toast({
          title: 'Fehler beim Laden der Daten',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  const addQuickShooter = () => {
    setQuickShooters([...quickShooters, { name: '', clubId: '' }]);
  };

  const updateQuickShooter = (index: number, field: keyof QuickShooter, value: string) => {
    const updated = [...quickShooters];
    updated[index] = { ...updated[index], [field]: value };
    setQuickShooters(updated);
  };

  const addQuickTeam = () => {
    setQuickTeams([...quickTeams, {
      name: '',
      clubId: '',
      seasonId: '',
      leagueType: '',
      shooterNames: ['', '', '', '', '', '', '', '']
    }]);
  };

  const updateQuickTeam = (index: number, field: keyof Omit<QuickTeam, 'shooterNames'>, value: string) => {
    const updated = [...quickTeams];
    updated[index] = { ...updated[index], [field]: value };
    setQuickTeams(updated);
  };

  const updateTeamShooter = (teamIndex: number, shooterIndex: number, name: string) => {
    const updated = [...quickTeams];
    updated[teamIndex].shooterNames[shooterIndex] = name;
    setQuickTeams(updated);
  };

  const saveQuickShooters = async () => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      const batch = writeBatch(db);
      const validShooters = quickShooters.filter(s => s.name.trim() && s.clubId);
      
      for (const shooter of validShooters) {
        const shooterRef = doc(collection(db, 'rwk_shooters'));
        batch.set(shooterRef, {
          name: shooter.name.trim(),
          clubId: shooter.clubId,
          teamIds: [],
          createdAt: Timestamp.now(),
          createdBy: user.email,
          emergencyEntry: true
        });
      }
      
      await batch.commit();
      
      toast({
        title: 'Schützen gespeichert',
        description: `${validShooters.length} Schützen wurden erfolgreich angelegt.`
      });
      
      setQuickShooters([{ name: '', clubId: '' }]);
    } catch (error) {
      toast({
        title: 'Fehler beim Speichern',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const saveQuickTeams = async () => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      const batch = writeBatch(db);
      const validTeams = quickTeams.filter(t => t.name.trim() && t.clubId && t.seasonId);
      
      for (const team of validTeams) {
        const season = seasons.find(s => s.id === team.seasonId);
        if (!season) continue;
        
        const teamRef = doc(collection(db, 'rwk_teams'));
        const validShooterNames = team.shooterNames.filter(name => name.trim());
        const shooterIds: string[] = [];
        
        for (const shooterName of validShooterNames) {
          const shooterRef = doc(collection(db, 'rwk_shooters'));
          shooterIds.push(shooterRef.id);
          
          batch.set(shooterRef, {
            name: shooterName.trim(),
            clubId: team.clubId,
            teamIds: [teamRef.id],
            createdAt: Timestamp.now(),
            createdBy: user.email,
            emergencyEntry: true
          });
        }
        
        batch.set(teamRef, {
          name: team.name.trim(),
          clubId: team.clubId,
          seasonId: team.seasonId,
          competitionYear: season.competitionYear,
          leagueType: team.leagueType,
          leagueId: null,
          shooterIds: shooterIds,
          captainName: '',
          captainEmail: '',
          captainPhone: '',
          outOfCompetition: false,
          createdAt: Timestamp.now(),
          createdBy: user.email,
          emergencyEntry: true
        });
      }
      
      await batch.commit();
      
      toast({
        title: 'Teams gespeichert',
        description: `${validTeams.length} Teams wurden erfolgreich angelegt.`
      });
      
      setQuickTeams([{
        name: '',
        clubId: '',
        seasonId: '',
        leagueType: '',
        shooterNames: ['', '', '', '', '', '', '', '']
      }]);
    } catch (error) {
      toast({
        title: 'Fehler beim Speichern',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Lade Daten...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <Target className="h-8 w-8 text-red-600" />
        <div>
          <h1 className="text-3xl font-bold text-primary">Notfall-Dateneingabe</h1>
          <p className="text-sm text-muted-foreground">Schnelle Eingabe von Schützen und Teams nach Datenverlust</p>
        </div>
      </div>

      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="text-sm text-red-800">
          <p className="font-medium mb-2">NOTFALL-EINGABE:</p>
          <p>Diese vereinfachte Eingabemaske ermöglicht die schnelle Wiederherstellung der wichtigsten Daten.</p>
        </div>
      </div>

      <Tabs defaultValue="shooters" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="shooters">
            <Users className="h-4 w-4 mr-2" />
            Schützen
          </TabsTrigger>
          <TabsTrigger value="teams">
            <Trophy className="h-4 w-4 mr-2" />
            Teams
          </TabsTrigger>
        </TabsList>

        <TabsContent value="shooters">
          <Card>
            <CardHeader>
              <CardTitle>Schützen schnell anlegen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {quickShooters.map((shooter, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded">
                  <div>
                    <Label>Name</Label>
                    <Input
                      value={shooter.name}
                      onChange={(e) => updateQuickShooter(index, 'name', e.target.value)}
                      placeholder="Max Mustermann"
                    />
                  </div>
                  <div>
                    <Label>Verein</Label>
                    <Select
                      value={shooter.clubId}
                      onValueChange={(value) => updateQuickShooter(index, 'clubId', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Verein wählen" />
                      </SelectTrigger>
                      <SelectContent>
                        {clubs.map(club => (
                          <SelectItem key={club.id} value={club.id}>
                            {club.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
              
              <div className="flex space-x-2">
                <Button onClick={addQuickShooter} variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Schütze hinzufügen
                </Button>
                <Button onClick={saveQuickShooters} disabled={isSaving}>
                  {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  <Save className="h-4 w-4 mr-2" />
                  Schützen speichern
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="teams">
          <Card>
            <CardHeader>
              <CardTitle>Teams mit Schützen schnell anlegen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {quickTeams.map((team, teamIndex) => (
                <div key={teamIndex} className="p-4 border rounded space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <Label>Teamname</Label>
                      <Input
                        value={team.name}
                        onChange={(e) => updateQuickTeam(teamIndex, 'name', e.target.value)}
                        placeholder="Mannschaft I"
                      />
                    </div>
                    <div>
                      <Label>Verein</Label>
                      <Select
                        value={team.clubId}
                        onValueChange={(value) => updateQuickTeam(teamIndex, 'clubId', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Verein" />
                        </SelectTrigger>
                        <SelectContent>
                          {clubs.map(club => (
                            <SelectItem key={club.id} value={club.id}>
                              {club.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Saison</Label>
                      <Select
                        value={team.seasonId}
                        onValueChange={(value) => updateQuickTeam(teamIndex, 'seasonId', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Saison" />
                        </SelectTrigger>
                        <SelectContent>
                          {seasons.map(season => (
                            <SelectItem key={season.id} value={season.id}>
                              {season.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Disziplin</Label>
                      <Select
                        value={team.leagueType}
                        onValueChange={(value) => updateQuickTeam(teamIndex, 'leagueType', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Disziplin" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="KKG">KK Gewehr</SelectItem>
                          <SelectItem value="KKP">KK Pistole</SelectItem>
                          <SelectItem value="LGA">LG Auflage</SelectItem>
                          <SelectItem value="LGS">LG Freihand</SelectItem>
                          <SelectItem value="LP">Luftpistole</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <Label>Schützen (max. 8)</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 mt-2">
                      {team.shooterNames.map((name, shooterIndex) => (
                        <Input
                          key={shooterIndex}
                          value={name}
                          onChange={(e) => updateTeamShooter(teamIndex, shooterIndex, e.target.value)}
                          placeholder={`Schütze ${shooterIndex + 1}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
              
              <div className="flex space-x-2">
                <Button onClick={addQuickTeam} variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Team hinzufügen
                </Button>
                <Button onClick={saveQuickTeams} disabled={isSaving}>
                  {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  <Save className="h-4 w-4 mr-2" />
                  Teams speichern
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
