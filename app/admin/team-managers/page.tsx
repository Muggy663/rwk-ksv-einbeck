"use client";
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Mail, Phone, Download, Search, Users } from 'lucide-react';
import { db } from '@/lib/firebase/config';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

interface Season {
  id: string;
  year: string;
  discipline: string;
  status: string;
  competitionYear?: number;
  name?: string;
}

interface League {
  id: string;
  name: string;
  seasonId: string;
  disciplineType: string;
}

interface Club {
  id: string;
  name: string;
  shortName: string;
  clubNumber: string;
}

interface TeamManager {
  teamId: string;
  teamName: string;
  clubId: string;
  clubName: string;
  leagueId: string;
  leagueName: string;
  seasonId: string;
  seasonName: string;
  managerName: string;
  managerEmail: string;
  managerPhone: string;
}

export default function TeamManagersPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [teamManagers, setTeamManagers] = useState<TeamManager[]>([]);
  const [filteredManagers, setFilteredManagers] = useState<TeamManager[]>([]);
  
  // Filter states
  const [selectedSeason, setSelectedSeason] = useState<string>('');
  const [selectedLeague, setSelectedLeague] = useState<string>('all');
  const [selectedClub, setSelectedClub] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Load seasons on component mount
  useEffect(() => {
    const fetchSeasons = async () => {
      try {
        const seasonsSnapshot = await getDocs(collection(db, 'seasons'));
        const seasonsData = seasonsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Season[];
        
        // Sort seasons by year (descending)
        seasonsData.sort((a, b) => (b.competitionYear || 0) - (a.competitionYear || 0));
        setSeasons(seasonsData);
        
        // Auto-select the most recent season
        if (seasonsData.length > 0) {
          setSelectedSeason(seasonsData[0].id);
        }
      } catch (error) {
        console.error('Error fetching seasons:', error);
        toast({
          title: 'Fehler beim Laden der Saisons',
          description: 'Die Saisons konnten nicht geladen werden.',
          variant: 'destructive'
        });
      }
    };
    
    const fetchClubs = async () => {
      try {
        const clubsSnapshot = await getDocs(collection(db, 'clubs'));
        const clubsData = clubsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Club[];
        
        setClubs(clubsData);
      } catch (error) {
        console.error('Error fetching clubs:', error);
        toast({
          title: 'Fehler beim Laden der Vereine',
          description: 'Die Vereine konnten nicht geladen werden.',
          variant: 'destructive'
        });
      }
    };
    
    fetchSeasons();
    fetchClubs();
  }, [toast]);
  
  // Load leagues when season changes
  useEffect(() => {
    const fetchLeagues = async () => {
      if (!selectedSeason) return;
      
      try {
        const leaguesQuery = query(
          collection(db, 'rwk_leagues'),
          where('seasonId', '==', selectedSeason)
        );
        const leaguesSnapshot = await getDocs(leaguesQuery);
        const leaguesData = leaguesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as League[];
        
        setLeagues(leaguesData);
        setSelectedLeague('all'); // Reset league selection
      } catch (error) {
        console.error('Error fetching leagues:', error);
        toast({
          title: 'Fehler beim Laden der Ligen',
          description: 'Die Ligen konnten nicht geladen werden.',
          variant: 'destructive'
        });
      }
    };
    
    fetchLeagues();
  }, [selectedSeason, toast]);
  
  // Load team managers when filters change
  useEffect(() => {
    const fetchTeamManagers = async () => {
      if (!selectedSeason) return;
      
      setLoading(true);
      try {
        // Query teams for the selected season
        let teamsQuery = query(
          collection(db, 'rwk_teams'),
          where('seasonId', '==', selectedSeason)
        );
        
        // Add league filter if selected
        if (selectedLeague && selectedLeague !== 'all') {
          teamsQuery = query(
            collection(db, 'rwk_teams'),
            where('seasonId', '==', selectedSeason),
            where('leagueId', '==', selectedLeague)
          );
        }
        
        const teamsSnapshot = await getDocs(teamsQuery);
        
        // Process teams to extract manager information
        const managersData: TeamManager[] = [];
        
        for (const teamDoc of teamsSnapshot.docs) {
          const teamData = teamDoc.data();
          
          // Skip if club filter is active and doesn't match
          if (selectedClub && selectedClub !== 'all' && teamData.clubId !== selectedClub) continue;
          
          // Find club name
          const club = clubs.find(c => c.id === teamData.clubId);
          
          // Find league name
          const league = leagues.find(l => l.id === teamData.leagueId);
          
          // Find season name
          const season = seasons.find(s => s.id === teamData.seasonId);
          
          // Konsistente Verwendung der Feldnamen für Mannschaftsführer
          // Prüfen, ob die Felder captainName, captainEmail und captainPhone existieren und verwenden sie falls ja
          const managerName = teamData.captainName || teamData.managerName || '';
          const managerEmail = teamData.captainEmail || teamData.managerEmail || '';
          const managerPhone = teamData.captainPhone || teamData.managerPhone || '';
          
          managersData.push({
            teamId: teamDoc.id,
            teamName: teamData.name || 'Unbenannt',
            clubId: teamData.clubId,
            clubName: club?.name || 'Unbekannter Verein',
            leagueId: teamData.leagueId || '',
            leagueName: league?.name || 'Keine Liga zugewiesen',
            seasonId: teamData.seasonId,
            seasonName: `${season?.year || ''} ${season?.discipline || ''}`,
            managerName: managerName,
            managerEmail: managerEmail,
            managerPhone: managerPhone
          });
        }
        
        setTeamManagers(managersData);
        setFilteredManagers(managersData);
      } catch (error) {
        console.error('Error fetching team managers:', error);
        toast({
          title: 'Fehler beim Laden der Mannschaftsführer',
          description: 'Die Mannschaftsführer konnten nicht geladen werden.',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchTeamManagers();
  }, [selectedSeason, selectedLeague, selectedClub, clubs, leagues, seasons, toast]);
  
  // Filter managers when search query changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredManagers(teamManagers);
      return;
    }
    
    const query = searchQuery.toLowerCase().trim();
    const filtered = teamManagers.filter(manager => 
      manager.managerName.toLowerCase().includes(query) ||
      manager.teamName.toLowerCase().includes(query) ||
      manager.clubName.toLowerCase().includes(query) ||
      manager.managerEmail.toLowerCase().includes(query) ||
      manager.managerPhone.includes(query)
    );
    
    setFilteredManagers(filtered);
  }, [searchQuery, teamManagers]);
  
  // Export to CSV
  const exportToCSV = () => {
    if (filteredManagers.length === 0) {
      toast({
        title: 'Keine Daten zum Exportieren',
        description: 'Es sind keine Mannschaftsführer vorhanden, die exportiert werden können.',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      // Create CSV content
      const headers = ['Verein', 'Mannschaft', 'Liga', 'Name', 'E-Mail', 'Telefon'];
      const rows = filteredManagers.map(manager => [
        manager.clubName,
        manager.teamName,
        manager.leagueName,
        manager.managerName,
        manager.managerEmail,
        manager.managerPhone
      ]);
      
      const csvContent = [
        headers.join(';'),
        ...rows.map(row => row.join(';'))
      ].join('\n');
      
      // Create download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `Mannschaftsfuehrer_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: 'Export erfolgreich',
        description: 'Die Mannschaftsführer wurden erfolgreich exportiert.'
      });
    } catch (error) {
      console.error('Fehler beim Exportieren der Daten:', error);
      toast({
        title: 'Export fehlgeschlagen',
        description: 'Beim Exportieren der Daten ist ein Fehler aufgetreten.',
        variant: 'destructive'
      });
    }
  };
  
  const getSeasonName = (seasonId: string) => {
    const season = seasons.find(s => s.id === seasonId);
    return season ? `${season.year} ${season.discipline}` : 'Unbekannte Saison';
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-primary">Mannschaftsführer</h1>
          <p className="text-muted-foreground">Übersicht aller Mannschaftsführer nach Saison und Liga.</p>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Filter</CardTitle>
          <CardDescription>Wählen Sie eine Saison und optional eine Liga oder einen Verein.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="season">Saison</Label>
              <Select value={selectedSeason} onValueChange={setSelectedSeason}>
                <SelectTrigger>
                  <SelectValue placeholder="Saison auswählen" />
                </SelectTrigger>
                <SelectContent>
                  {seasons.map(season => (
                    <SelectItem key={season.id} value={season.id}>
                      {season.year} {season.discipline} {season.competitionYear && `(${season.competitionYear})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="league">Liga (optional)</Label>
              <Select value={selectedLeague} onValueChange={setSelectedLeague}>
                <SelectTrigger>
                  <SelectValue placeholder="Alle Ligen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Ligen</SelectItem>
                  {leagues.map(league => (
                    <SelectItem key={league.id} value={league.id}>
                      {league.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="club">Verein (optional)</Label>
              <Select value={selectedClub} onValueChange={setSelectedClub}>
                <SelectTrigger>
                  <SelectValue placeholder="Alle Vereine" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Vereine</SelectItem>
                  {clubs.map(club => (
                    <SelectItem key={club.id} value={club.id}>
                      {club.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="search">Suche</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Name, Verein, E-Mail..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Mannschaftsführer {selectedSeason && `- ${getSeasonName(selectedSeason)}`}</CardTitle>
            <CardDescription>
              {filteredManagers.length} {filteredManagers.length === 1 ? 'Mannschaftsführer' : 'Mannschaftsführer'} gefunden
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={exportToCSV}
            disabled={filteredManagers.length === 0}
          >
            <Download className="h-4 w-4" />
            CSV Export
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary mr-3" />
              <p>Daten werden geladen...</p>
            </div>
          ) : filteredManagers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg text-muted-foreground">Keine Mannschaftsführer gefunden.</p>
              <p className="text-sm text-muted-foreground mt-2">
                Bitte wählen Sie eine andere Saison oder passen Sie die Filter an.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Verein</TableHead>
                  <TableHead>Mannschaft</TableHead>
                  <TableHead>Liga</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Kontakt</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredManagers.map((manager) => (
                  <TableRow key={manager.teamId}>
                    <TableCell>{manager.clubName}</TableCell>
                    <TableCell>{manager.teamName}</TableCell>
                    <TableCell>{manager.leagueName}</TableCell>
                    <TableCell>{manager.managerName || '-'}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {manager.managerEmail && (
                          <div className="flex items-center text-sm">
                            <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                            <a href={`mailto:${manager.managerEmail}`} className="hover:underline">
                              {manager.managerEmail}
                            </a>
                          </div>
                        )}
                        {manager.managerPhone && (
                          <div className="flex items-center text-sm">
                            <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                            <a href={`tel:${manager.managerPhone}`} className="hover:underline">
                              {manager.managerPhone}
                            </a>
                          </div>
                        )}
                        {!manager.managerEmail && !manager.managerPhone && (
                          <span className="text-muted-foreground text-sm">Keine Kontaktdaten</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}