"use client";
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ClipboardList, Mail, Phone, Search, Loader2, Download } from 'lucide-react';
import { db } from '@/lib/firebase/config';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import type { Season, Team, Club } from '@/types/rwk';

interface CaptainInfo extends Team {
  clubName: string;
  leagueName?: string;
}

export default function AdminCaptainsPage() {
  const { toast } = useToast();
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<string>('');
  const [captains, setCaptains] = useState<CaptainInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredCaptains, setFilteredCaptains] = useState<CaptainInfo[]>([]);

  // Fetch seasons on component mount
  useEffect(() => {
    const fetchSeasons = async () => {
      try {
        const seasonsSnapshot = await getDocs(collection(db, 'seasons'));
        const seasonsData = seasonsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Season[];
        
        // Sort seasons by year (descending)
        seasonsData.sort((a, b) => b.competitionYear - a.competitionYear);
        setSeasons(seasonsData);
        
        // Auto-select the most recent season
        if (seasonsData.length > 0) {
          setSelectedSeason(seasonsData[0].id);
        }
      } catch (error) {
        console.error('Error fetching seasons:', error);
        toast({
          title: 'Fehler beim Laden der Saisons',
          description: 'Bitte versuchen Sie es später erneut.',
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
      }
    };

    fetchSeasons();
    fetchClubs();
  }, [toast]);

  // Fetch captains when season changes
  useEffect(() => {
    if (!selectedSeason) return;
    
    const fetchCaptains = async () => {
      setLoading(true);
      try {
        const teamsQuery = query(
          collection(db, 'rwk_teams'),
          where('seasonId', '==', selectedSeason)
        );
        
        const teamsSnapshot = await getDocs(teamsQuery);
        const teamsData = teamsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Team[];
        
        // Filter teams that have captain information
        const captainsData = teamsData
          .filter(team => team.captainName || team.captainEmail || team.captainPhone)
          .map(team => {
            const clubInfo = clubs.find(club => club.id === team.clubId);
            return {
              ...team,
              clubName: clubInfo?.name || 'Unbekannter Verein'
            };
          });
        
        setCaptains(captainsData);
        setFilteredCaptains(captainsData);
      } catch (error) {
        console.error('Error fetching captains:', error);
        toast({
          title: 'Fehler beim Laden der Mannschaftsführer',
          description: 'Bitte versuchen Sie es später erneut.',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCaptains();
  }, [selectedSeason, clubs, toast]);

  // Filter captains when search term changes
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredCaptains(captains);
      return;
    }

    const lowerSearchTerm = searchTerm.toLowerCase();
    const filtered = captains.filter(
      captain => 
        captain.name.toLowerCase().includes(lowerSearchTerm) ||
        captain.clubName.toLowerCase().includes(lowerSearchTerm) ||
        (captain.captainName && captain.captainName.toLowerCase().includes(lowerSearchTerm)) ||
        (captain.captainEmail && captain.captainEmail.toLowerCase().includes(lowerSearchTerm))
    );
    
    setFilteredCaptains(filtered);
  }, [searchTerm, captains]);

  // Export captains list as CSV
  const exportCaptainsCSV = () => {
    if (filteredCaptains.length === 0) return;

    const headers = ['Verein', 'Mannschaft', 'Mannschaftsführer', 'E-Mail', 'Telefon'];
    const csvContent = [
      headers.join(','),
      ...filteredCaptains.map(captain => [
        `"${captain.clubName}"`,
        `"${captain.name}"`,
        `"${captain.captainName || ''}"`,
        captain.captainEmail || '',
        `"${captain.captainPhone || ''}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `mannschaftsfuehrer_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const selectedSeasonName = seasons.find(s => s.id === selectedSeason)?.name || '';

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <ClipboardList className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold text-primary">Mannschaftsführer-Übersicht</h1>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl text-accent">Mannschaftsführer nach Saison</CardTitle>
          <CardDescription>
            Übersicht aller Mannschaftsführer mit Kontaktdaten für die ausgewählte Saison.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="seasonSelect">Saison auswählen</Label>
                <Select 
                  value={selectedSeason} 
                  onValueChange={setSelectedSeason}
                  disabled={seasons.length === 0}
                >
                  <SelectTrigger id="seasonSelect">
                    <SelectValue placeholder="Saison wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {seasons.map(season => (
                      <SelectItem key={season.id} value={season.id}>
                        {season.name} ({season.competitionYear})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="searchInput">Suche</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="searchInput"
                    placeholder="Nach Verein, Mannschaft oder Mannschaftsführer suchen"
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-end">
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={exportCaptainsCSV}
                  disabled={filteredCaptains.length === 0}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Als CSV exportieren
                </Button>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary mr-3" />
                <p>Mannschaftsführer werden geladen...</p>
              </div>
            ) : filteredCaptains.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-lg text-muted-foreground">
                  {selectedSeason 
                    ? 'Keine Mannschaftsführer für diese Saison gefunden.' 
                    : 'Bitte wählen Sie eine Saison aus.'}
                </p>
                {selectedSeason && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Möglicherweise wurden noch keine Mannschaftsführer-Kontaktdaten eingetragen.
                  </p>
                )}
              </div>
            ) : (
              <>
                <h3 className="text-lg font-medium mb-2">
                  {filteredCaptains.length} Mannschaftsführer für {selectedSeasonName}
                </h3>
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Verein</TableHead>
                        <TableHead>Mannschaft</TableHead>
                        <TableHead>Mannschaftsführer</TableHead>
                        <TableHead>Kontakt</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCaptains.map((captain) => (
                        <TableRow key={captain.id}>
                          <TableCell className="font-medium">{captain.clubName}</TableCell>
                          <TableCell>{captain.name}</TableCell>
                          <TableCell>{captain.captainName || <span className="text-muted-foreground italic">Nicht angegeben</span>}</TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {captain.captainEmail && (
                                <div className="flex items-center text-sm">
                                  <Mail className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                                  <a href={`mailto:${captain.captainEmail}`} className="hover:underline">
                                    {captain.captainEmail}
                                  </a>
                                </div>
                              )}
                              {captain.captainPhone && (
                                <div className="flex items-center text-sm">
                                  <Phone className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                                  <a href={`tel:${captain.captainPhone}`} className="hover:underline">
                                    {captain.captainPhone}
                                  </a>
                                </div>
                              )}
                              {!captain.captainEmail && !captain.captainPhone && (
                                <span className="text-muted-foreground italic text-sm">Keine Kontaktdaten</span>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
