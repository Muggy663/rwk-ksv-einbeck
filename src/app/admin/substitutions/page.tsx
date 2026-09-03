"use client";
import { useState, useEffect } from 'react';
import { logError } from '@/lib/utils/secure-logger';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase/config';
import { collection, getDocs, query, where, orderBy, deleteDoc, doc, getDoc, updateDoc } from 'firebase/firestore';
import { SubstitutionDialog } from '@/components/admin/SubstitutionDialog';
import { TeamRestructureDialog } from '@/components/admin/TeamRestructureDialog';
import { UserPlus, Search, Trash2, Calendar, AlertCircle, ChevronDown, ChevronRight, Wrench, Pencil, Check, X } from 'lucide-react';
import type { Team, TeamSubstitution, UserPermission, Season, Shooter } from '@/types/rwk';

export default function SubstitutionsPage() {
  const { toast } = useToast();
  const [substitutions, setSubstitutions] = useState<TeamSubstitution[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>('');
  const [selectedLeagueId, setSelectedLeagueId] = useState<string>('');
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>('');
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [leagues, setLeagues] = useState<any[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [expandedTeams, setExpandedTeams] = useState<Set<string>>(new Set());
  const [teamShooters, setTeamShooters] = useState<Map<string, Shooter[]>>(new Map());
  const [showRestructureDialog, setShowRestructureDialog] = useState(false);
  const [restructureTeam, setRestructureTeam] = useState<Team | null>(null);
  const [currentNumRounds] = useState(5);
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [editingTeamName, setEditingTeamName] = useState('');

  const userPermission: UserPermission = {
    uid: 'admin',
    email: 'admin@rwk-einbeck.de',
    displayName: 'Admin',
    role: 'admin',
    clubId: undefined
  };

  useEffect(() => {
    loadSeasons();
  }, []);

  useEffect(() => {
    if (selectedSeasonId) {
      loadData();
    }
  }, [selectedSeasonId]);

  const loadSeasons = async () => {
    try {
      const seasonsQuery = query(
        collection(db, 'seasons'),
        orderBy('competitionYear', 'desc')
      );
      const seasonsSnapshot = await getDocs(seasonsQuery);
      const seasonsData = seasonsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Season));
      setSeasons(seasonsData);
      
      // Automatisch laufende Saison auswählen
      const runningSeason = seasonsData.find(s => s.status === 'Laufend');
      if (runningSeason) {
        setSelectedSeasonId(runningSeason.id);
      } else if (seasonsData.length > 0) {
        setSelectedSeasonId(seasonsData[0].id);
      }
    } catch (error) {
      logError('Fehler beim Laden der Saisons:', error);
    }
  };

  const loadData = async () => {
    if (!selectedSeasonId) return;
    
    setIsLoading(true);
    try {
      const selectedSeason = seasons.find(s => s.id === selectedSeasonId);
      if (!selectedSeason) return;
      
      // Lade Teams
      const teamsQuery = query(
        collection(db, 'rwk_teams'),
        where('seasonId', '==', selectedSeasonId)
      );
      const teamsSnapshot = await getDocs(teamsQuery);
      const teamsData = teamsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Team));
      
      // Sortiere Teams: Normale Teams zuerst, dann Einzelschützen
      const sortedTeams = teamsData.sort((a, b) => {
        const aIsEinzel = a.name.toLowerCase().includes('einzel');
        const bIsEinzel = b.name.toLowerCase().includes('einzel');
        if (aIsEinzel && !bIsEinzel) return 1;
        if (!aIsEinzel && bIsEinzel) return -1;
        return a.name.localeCompare(b.name);
      });
      
      setTeams(sortedTeams);
      
      // Lade Ligen für Filter
      const leaguesQuery = query(
        collection(db, 'rwk_leagues'),
        where('seasonId', '==', selectedSeasonId),
        orderBy('order', 'asc')
      );
      const leaguesSnapshot = await getDocs(leaguesQuery);
      const leaguesData = leaguesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setLeagues(leaguesData);

      const substitutionsQuery = query(
        collection(db, 'team_substitutions'),
        where('competitionYear', '==', selectedSeason.competitionYear),
        orderBy('substitutionDate', 'desc')
      );
      const substitutionsSnapshot = await getDocs(substitutionsQuery);
      const leagueIdsForSeason = new Set(leaguesData.map(l => l.id));
      const substitutionsData = substitutionsSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as TeamSubstitution))
        // Nur Substitutionen anzeigen die zur gewählten Saison gehören
        .filter(s => !s.leagueId || leagueIdsForSeason.has(s.leagueId));
      setSubstitutions(substitutionsData);

    } catch (error) {
      logError('Fehler beim Laden der Daten:', error);
      toast({
        title: 'Fehler',
        description: 'Daten konnten nicht geladen werden.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSubstitution = async (substitution: TeamSubstitution) => {
    if (!confirm(`Ersatzschützen-Eintrag für ${substitution.teamName} wirklich löschen?`)) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'team_substitutions', substitution.id));
      toast({
        title: 'Gelöscht',
        description: 'Ersatzschützen-Eintrag wurde entfernt.'
      });
      loadData();
    } catch (error) {
      logError('Fehler beim Löschen:', error);
      toast({
        title: 'Fehler',
        description: 'Eintrag konnte nicht gelöscht werden.',
        variant: 'destructive'
      });
    }
  };

  const filteredSubstitutions = substitutions.filter(sub => {
    const matchesSearch = sub.teamName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.originalShooterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.replacementShooterName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLeague = !selectedLeagueId || selectedLeagueId === 'all' || sub.leagueId === selectedLeagueId;
    return matchesSearch && matchesLeague;
  });

  const filteredTeams = teams.filter(team => {
    const matchesSearch = team.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLeague = !selectedLeagueId || selectedLeagueId === 'all' || team.leagueId === selectedLeagueId;
    const matchesDiscipline = !selectedDiscipline || selectedDiscipline === 'all' || team.leagueType === selectedDiscipline;
    return matchesSearch && matchesLeague && matchesDiscipline;
  });
  
  const availableDisciplines = [...new Set(teams.map(t => t.leagueType).filter((d): d is NonNullable<typeof d> => Boolean(d)))].sort() as string[];

  const handleRenameTeam = async (teamId: string) => {
    if (!editingTeamName.trim()) return;
    try {
      await updateDoc(doc(db, 'rwk_teams', teamId), { name: editingTeamName.trim() });
      toast({ title: 'Umbenannt', description: `Mannschaft wurde umbenannt.` });
      setEditingTeamId(null);
      setEditingTeamName('');
      loadData();
    } catch (err) {
      logError('Fehler beim Umbenennen:', err);
      toast({ title: 'Fehler', description: 'Umbenennung fehlgeschlagen.', variant: 'destructive' });
    }
  };

  const handleDeleteTeam = async (team: Team) => {
    if (!confirm(`Mannschaft "${team.name}" wirklich löschen? Dies kann nicht rückgängig gemacht werden.`)) return;
    try {
      await deleteDoc(doc(db, 'rwk_teams', team.id));
      toast({ title: 'Gelöscht', description: `"${team.name}" wurde gelöscht.` });
      loadData();
    } catch (err) {
      logError('Fehler beim Löschen:', err);
      toast({ title: 'Fehler', description: 'Löschen fehlgeschlagen.', variant: 'destructive' });
    }
  };

  const toggleTeamExpansion = async (teamId: string, shooterIds: string[]) => {
    const newExpanded = new Set(expandedTeams);
    
    if (expandedTeams.has(teamId)) {
      newExpanded.delete(teamId);
    } else {
      newExpanded.add(teamId);
      
      // Lade Schützen nur wenn noch nicht geladen
      if (!teamShooters.has(teamId) && shooterIds.length > 0) {
        try {
          const shooterPromises = shooterIds.map(async (shooterId) => {
            const shooterDoc = await getDoc(doc(db, 'shooters', shooterId));
            if (shooterDoc.exists()) {
              return { id: shooterDoc.id, ...shooterDoc.data() } as Shooter;
            }
            return null;
          });
          
          const shooters = (await Promise.all(shooterPromises)).filter(Boolean) as Shooter[];
          setTeamShooters(prev => new Map(prev).set(teamId, shooters));
        } catch (error) {
          logError('Fehler beim Laden der Schützen:', error);
        }
      }
    }
    
    setExpandedTeams(newExpanded);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Ersatzschützen-Verwaltung</h1>
          <p className="text-muted-foreground">Ersatzschützen nach RWK-Ordnung §12 verwalten</p>
        </div>
        <Button onClick={() => setShowDialog(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Ersatzschütze hinzufügen
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Team oder Schütze suchen..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedSeasonId} onValueChange={setSelectedSeasonId}>
              <SelectTrigger>
                <SelectValue placeholder="Saison wählen" />
              </SelectTrigger>
              <SelectContent>
                {seasons.map(season => (
                  <SelectItem key={season.id} value={season.id}>
                    {season.name} {season.status === 'Laufend' && '(Laufend)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedLeagueId} onValueChange={setSelectedLeagueId}>
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
            <Select value={selectedDiscipline} onValueChange={setSelectedDiscipline}>
              <SelectTrigger>
                <SelectValue placeholder="Alle Disziplinen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Disziplinen</SelectItem>
                {availableDisciplines.map(discipline => (
                  <SelectItem key={discipline} value={discipline}>
                    {discipline}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="border-amber-200 bg-amber-50">
        <CardHeader>
          <CardTitle className="text-amber-800 flex items-center">
            <AlertCircle className="mr-2 h-5 w-5" />
            RWK-Ordnung §12: Ersatzschützen-Regeln
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-amber-700 space-y-2">
          <p>• Schütze kann nur einmal pro Liga/Klasse starten</p>
          <p>• Bei Ausfall: Ersatzschütze übernimmt bisherige Ergebnisse</p>
          <p>• Neuer Schütze: Alte Ergebnisse bleiben, neue ab Einstieg</p>
          <p>• Einzelschütze → Team: Vorhandene Ergebnisse werden übertragen</p>
          <p>• RWK-Leiter muss informiert werden</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Aktuelle Ersatzschützen ({filteredSubstitutions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p>Lade Daten...</p>
            </div>
          ) : filteredSubstitutions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <UserPlus className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>Keine Ersatzschützen gefunden</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSubstitutions.map((substitution) => (
                <div key={substitution.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{substitution.teamName}</Badge>
                        <Badge variant="secondary">Ab DG{substitution.fromRound}</Badge>
                        {substitution.type === 'individual_to_team' && (
                          <Badge className="bg-blue-100 text-blue-800">Ergebnisse übertragen</Badge>
                        )}
                      </div>
                      <div className="text-sm">
                        <span className="font-medium text-red-600">{substitution.originalShooterName}</span>
                        <span className="mx-2">→</span>
                        <span className="font-medium text-green-600">{substitution.replacementShooterName}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        <div>Grund: {substitution.reason}</div>
                        <div className="flex items-center gap-4 mt-1">
                          <span className="flex items-center">
                            <Calendar className="mr-1 h-3 w-3" />
                            {(substitution.substitutionDate as any)?.toDate?.()?.toLocaleDateString() || 'Unbekannt'}
                          </span>
                          <span>von {substitution.createdByUserName}</span>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteSubstitution(substitution)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Teams ({filteredTeams.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredTeams.map((team) => (
                  <div key={team.id} className="border rounded-lg">
                    <div className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2 flex-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleTeamExpansion(team.id, team.shooterIds || [])}
                            className="h-6 w-6 p-0"
                            disabled={!team.shooterIds?.length}
                          >
                            {expandedTeams.has(team.id) ? 
                              <ChevronDown className="h-4 w-4" /> : 
                              <ChevronRight className="h-4 w-4" />
                            }
                          </Button>
                          <div>
                            {editingTeamId === team.id ? (
                              <div className="flex items-center gap-1">
                                <Input
                                  value={editingTeamName}
                                  onChange={(e) => setEditingTeamName(e.target.value)}
                                  className="h-7 text-sm w-48"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleRenameTeam(team.id);
                                    if (e.key === 'Escape') { setEditingTeamId(null); setEditingTeamName(''); }
                                  }}
                                  autoFocus
                                />
                                <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-green-600" onClick={() => handleRenameTeam(team.id)}><Check className="h-3 w-3" /></Button>
                                <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-500" onClick={() => { setEditingTeamId(null); setEditingTeamName(''); }}><X className="h-3 w-3" /></Button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1">
                                <h4 className="font-medium">{team.name}</h4>
                                <Button size="sm" variant="ghost" className="h-6 w-6 p-0 opacity-50 hover:opacity-100" onClick={() => { setEditingTeamId(team.id); setEditingTeamName(team.name); }}>
                                  <Pencil className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span>{team.shooterIds?.length || 0} Schützen</span>
                              {team.leagueType && <Badge variant="outline">{team.leagueType}</Badge>}
                              {team.outOfCompetition && <Badge variant="secondary">AK</Badge>}
                            </div>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedTeam(team);
                            setShowDialog(true);
                          }}
                        >
                          <UserPlus className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-orange-600 border-orange-300 hover:bg-orange-50"
                          onClick={() => {
                            setRestructureTeam(team);
                            setShowRestructureDialog(true);
                          }}
                          title="Mannschaft umbauen"
                        >
                          <Wrench className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-300 hover:bg-red-50"
                          onClick={() => handleDeleteTeam(team)}
                          title="Mannschaft löschen"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {expandedTeams.has(team.id) && (
                      <div className="border-t bg-muted/30 p-4">
                        {teamShooters.has(team.id) ? (
                          <div className="space-y-2">
                            <h5 className="font-medium text-sm">Gemeldete Schützen ({teamShooters.get(team.id)?.length || 0}):</h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                              {teamShooters.get(team.id)?.map((shooter) => (
                                <div key={shooter.id} className="flex items-center gap-2 p-2 rounded border bg-background">
                                  <div className="text-sm">
                                    <div className="font-medium">
                                      {shooter.firstName && shooter.lastName ? `${shooter.firstName} ${shooter.lastName}` : shooter.name}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {shooter.gender === 'male' ? 'M' : shooter.gender === 'female' ? 'W' : '?'} • {shooter.birthYear || 'Jg. N/A'}
                                    </div>
                                  </div>
                                </div>
                              )) || []}
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm text-muted-foreground text-center py-4">
                            Keine Schützen zugeordnet
                          </div>
                        )}
                      </div>
                    )}
                  </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {showDialog && selectedTeam && (
        <SubstitutionDialog
          isOpen={showDialog}
          onClose={() => {
            setShowDialog(false);
            setSelectedTeam(null);
          }}
          team={selectedTeam}
          userPermission={userPermission}
          onSubstitutionCreated={() => {
            loadData();
            setShowDialog(false);
            setSelectedTeam(null);
          }}
        />
      )}

      {showRestructureDialog && restructureTeam && (
        <TeamRestructureDialog
          isOpen={showRestructureDialog}
          onClose={() => {
            setShowRestructureDialog(false);
            setRestructureTeam(null);
          }}
          sourceTeam={restructureTeam}
          allTeams={teams}
          competitionYear={seasons.find(s => s.id === selectedSeasonId)?.competitionYear || 2026}
          numRounds={currentNumRounds}
          onRestructured={() => {
            loadData();
            setShowRestructureDialog(false);
            setRestructureTeam(null);
          }}
        />
      )}
    </div>
  );
}
