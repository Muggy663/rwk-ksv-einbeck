"use client"; // Ganz wichtig für Next.js App Router, damit React Hooks funktionieren

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Users, Mail, Phone, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';

interface TeamManager {
  id: string;
  teamId: string;
  teamName: string;
  leagueId: string;
  leagueName: string;
  captainName?: string;
  captainEmail?: string;
  captainPhone?: string;
  managerName?: string;
  managerEmail?: string;
  managerPhone?: string;
}

export default function TeamManagersPage() {
  const { toast } = useToast();
  const { user, userPermissions } = useAuth();
  const [seasons, setSeasons] = useState<Array<{ id: string; name: string; year: number }>>([]);
  const [selectedSeason, setSelectedSeason] = useState<string>('');
  const [leagues, setLeagues] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedLeague, setSelectedLeague] = useState<string>(''); // Leerstring bedeutet "Alle Ligen"
  const [teamManagers, setTeamManagers] = useState<TeamManager[]>([]);
  const [filteredManagers, setFilteredManagers] = useState<TeamManager[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // --- Effekt zum Laden der verfügbaren Saisons ---
  useEffect(() => {
    const fetchSeasons = async () => {
      try {
        const seasonsQuery = query(
          collection(db, 'seasons'),
          where('status', '==', 'Laufend'),
          orderBy('competitionYear', 'desc')
        );

        const snapshot = await getDocs(seasonsQuery);
        const seasonsData = snapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name,
          year: doc.data().competitionYear
        }));

        setSeasons(seasonsData);

        // Automatisch die neueste Saison auswählen und dabei den Liga-Filter zurücksetzen
        if (seasonsData.length > 0) {
          setSelectedSeason(seasonsData[0].id);
          setSelectedLeague(''); // Wichtig: Liga-Auswahl zurücksetzen beim Saisonwechsel
        }
      } catch (error) {
        console.error('Fehler beim Laden der Saisons:', error);
        toast({
          title: 'Fehler',
          description: 'Die Saisons konnten nicht geladen werden.',
          variant: 'destructive'
        });
      }
    };

    fetchSeasons();
  }, [toast]);

  // --- Effekt zum Laden von Ligen und Mannschaftsführern für die ausgewählte Saison/Liga ---
  useEffect(() => {
    if (!selectedSeason) return; // Nur ausführen, wenn eine Saison ausgewählt ist

    const fetchLeaguesAndManagers = async () => {
      setIsLoading(true);
      try {
        // 1. Ligen für die ausgewählte Saison laden
        const leaguesQuery = query(
          collection(db, 'rwk_leagues'),
          where('seasonId', '==', selectedSeason)
        );

        const leaguesSnapshot = await getDocs(leaguesQuery);
        const leaguesData = leaguesSnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name
        }));
        setLeagues(leaguesData);

        const leagueIds = leaguesData.map(league => league.id);
        const leaguesMap = new Map(
          leaguesData.map(league => [league.id, league.name])
        );

        if (leagueIds.length === 0) {
          setTeamManagers([]);
          setFilteredManagers([]);
          setIsLoading(false);
          return;
        }

        // 2. Erst eigene Teams finden, um die Ligen zu ermitteln, in denen der Verein schießt
        let ownTeamsQuery = query(
          collection(db, 'rwk_teams'),
          where('leagueId', 'in', leagueIds)
        );
        
        if (userPermissions && userPermissions.clubId) {
          ownTeamsQuery = query(
            collection(db, 'rwk_teams'),
            where('leagueId', 'in', leagueIds),
            where('clubId', '==', userPermissions.clubId)
          );
        }
        
        const ownTeamsSnapshot = await getDocs(ownTeamsQuery);
        const ownLeagueIds = [...new Set(ownTeamsSnapshot.docs.map(doc => doc.data().leagueId))];
        
        if (ownLeagueIds.length === 0) {
          setTeamManagers([]);
          setFilteredManagers([]);
          setIsLoading(false);
          return;
        }
        
        // 3. Alle Teams in den Ligen laden, in denen der eigene Verein auch schießt
        let teamsQuery;
        if (selectedLeague) {
          // Wenn eine spezifische Liga ausgewählt ist, prüfe ob der Verein in dieser Liga schießt
          if (ownLeagueIds.includes(selectedLeague)) {
            teamsQuery = query(
              collection(db, 'rwk_teams'),
              where('leagueId', '==', selectedLeague)
            );
          } else {
            // Verein schießt nicht in dieser Liga
            setTeamManagers([]);
            setFilteredManagers([]);
            setIsLoading(false);
            return;
          }
        } else {
          // Alle Teams in Ligen, in denen der Verein schießt
          teamsQuery = query(
            collection(db, 'rwk_teams'),
            where('leagueId', 'in', ownLeagueIds)
          );
        }

        const teamsSnapshot = await getDocs(teamsQuery);
        const managersData: TeamManager[] = [];

        teamsSnapshot.forEach(doc => {
          const teamData = doc.data();
          const leagueName = leaguesMap.get(teamData.leagueId) || 'Unbekannte Liga';

          // Keine Berechtigungsprüfung mehr - zeige alle Teams in den relevanten Ligen

          const managerInfo: TeamManager = {
            id: doc.id,
            teamId: doc.id,
            teamName: teamData.name || 'Unbenanntes Team',
            leagueId: teamData.leagueId,
            leagueName,
            captainName: teamData.captainName,
            captainEmail: teamData.captainEmail,
            captainPhone: teamData.captainPhone,
            managerName: teamData.managerName,
            managerEmail: teamData.managerEmail,
            managerPhone: teamData.managerPhone
          };

          managersData.push(managerInfo);
        });

        setTeamManagers(managersData);
        setFilteredManagers(managersData); // Initial alle geladenen Manager anzeigen
      } catch (error) {
        console.error('Fehler beim Laden der Mannschaftsführer:', error);
        toast({
          title: 'Fehler',
          description: 'Die Mannschaftsführer konnten nicht geladen werden.',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaguesAndManagers();
    // Abhängigkeiten: Führt diesen Effekt bei Änderungen der Saison oder der Liga aus
  }, [selectedSeason, selectedLeague, userPermissions, toast]);

  // --- Effekt zur clientseitigen Filterung (Suche) ---
  useEffect(() => {
    let currentFilteredManagers = teamManagers;

    // Filter nach Suchbegriff (wird auf die bereits von der Datenbank vor-gefilterten Manager angewendet)
    if (searchTerm.trim()) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      currentFilteredManagers = currentFilteredManagers.filter(manager => {
        const nameMatch = (manager.captainName || manager.managerName || '').toLowerCase().includes(lowerSearchTerm);
        const teamMatch = manager.teamName.toLowerCase().includes(lowerSearchTerm);
        const leagueMatch = manager.leagueName.toLowerCase().includes(lowerSearchTerm);
        return nameMatch || teamMatch || leagueMatch;
      });
    }

    setFilteredManagers(currentFilteredManagers);
    // Abhängigkeiten: Führt diesen Effekt bei Änderungen des Suchbegriffs oder der TeamManager (z.B. nach Saison/Liga-Wechsel) aus
  }, [searchTerm, teamManagers]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary">Mannschaftsführer</h1>
          <p className="text-muted-foreground">
            Übersicht aller Mannschaftsführer in Ligen, in denen Ihr Verein auch schießt.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {/* Saison-Filter */}
        <div>
          <Label htmlFor="season-select">Saison</Label>
          <Select
            value={selectedSeason}
            onValueChange={setSelectedSeason}
            disabled={seasons.length === 0}
          >
            <SelectTrigger id="season-select" className="w-full">
              <SelectValue placeholder="Saison auswählen" />
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

        {/* Liga-Filter */}
        <div>
          <Label htmlFor="league-select">Liga</Label>
          <Select
            value={selectedLeague}
            // Beim Ändern: Wenn 'all' vom SelectItem kommt, setze selectedLeague auf leeren String
            onValueChange={(value) => setSelectedLeague(value === 'all' ? '' : value)}
            disabled={leagues.length === 0}
          >
            <SelectTrigger id="league-select" className="w-full">
              <SelectValue placeholder="Alle Ligen" />
            </SelectTrigger>
            <SelectContent>
              {/* 'value="all"' ist der spezielle Wert für "Alle Ligen", um den Radix-Fehler zu umgehen */}
              <SelectItem value="all">Alle Ligen</SelectItem>
              {leagues.map(league => (
                <SelectItem key={league.id} value={league.id}>
                  {league.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Suchfeld */}
        <div>
          <Label htmlFor="search">Suche</Label>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="search"
              placeholder="Nach Name, Team oder Liga suchen"
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Ladeanzeige oder Tabelle der Mannschaftsführer */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p>Lade Mannschaftsführer...</p>
        </div>
      ) : filteredManagers.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Mannschaftsführer</CardTitle>
            <CardDescription>
              {filteredManagers.length} Mannschaftsführer gefunden
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Team</TableHead>
                  <TableHead>Liga</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Kontakt</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredManagers.map(manager => (
                  <TableRow key={manager.id}>
                    <TableCell className="font-medium">{manager.teamName}</TableCell>
                    <TableCell>{manager.leagueName}</TableCell>
                    <TableCell>
                      {manager.captainName || manager.managerName || 'Nicht angegeben'}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {(manager.captainEmail || manager.managerEmail) && (
                          <div className="flex items-center text-sm">
                            <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                            <span>{manager.captainEmail || manager.managerEmail}</span>
                          </div>
                        )}
                        {(manager.captainPhone || manager.managerPhone) && (
                          <div className="flex items-center text-sm">
                            <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                            <span>{manager.captainPhone || manager.managerPhone}</span>
                          </div>
                        )}
                        {!manager.captainEmail && !manager.managerEmail && !manager.captainPhone && !manager.managerPhone && (
                          <span className="text-sm text-muted-foreground">Keine Kontaktdaten</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Keine Mannschaftsführer gefunden</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Für die ausgewählte Saison {selectedLeague && `und Liga ${leagues.find(l => l.id === selectedLeague)?.name}`} wurden keine Mannschaftsführer gefunden oder es sind keine Mannschaften in aktiven Ligen vorhanden.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
