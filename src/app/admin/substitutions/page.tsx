"use client";
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase/config';
import { collection, getDocs, query, where, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { SubstitutionDialog } from '@/components/admin/SubstitutionDialog';
import { UserPlus, Search, Trash2, Calendar, Users, AlertCircle } from 'lucide-react';
import type { Team, TeamSubstitution, UserPermission } from '@/types/rwk';

export default function SubstitutionsPage() {
  const { toast } = useToast();
  const [substitutions, setSubstitutions] = useState<TeamSubstitution[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState('2025');
  const [isLoading, setIsLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);

  const userPermission: UserPermission = {
    uid: 'admin',
    email: 'admin@rwk-einbeck.de',
    displayName: 'Admin',
    role: 'admin',
    clubId: null
  };

  useEffect(() => {
    loadData();
  }, [selectedYear]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const teamsQuery = query(
        collection(db, 'rwk_teams'),
        where('competitionYear', '==', parseInt(selectedYear))
      );
      const teamsSnapshot = await getDocs(teamsQuery);
      const teamsData = teamsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Team));
      setTeams(teamsData);

      const substitutionsQuery = query(
        collection(db, 'team_substitutions'),
        where('competitionYear', '==', parseInt(selectedYear)),
        orderBy('substitutionDate', 'desc')
      );
      const substitutionsSnapshot = await getDocs(substitutionsQuery);
      const substitutionsData = substitutionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as TeamSubstitution));
      setSubstitutions(substitutionsData);

    } catch (error) {
      console.error('Fehler beim Laden der Daten:', error);
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
      console.error('Fehler beim Löschen:', error);
      toast({
        title: 'Fehler',
        description: 'Eintrag konnte nicht gelöscht werden.',
        variant: 'destructive'
      });
    }
  };

  const filteredSubstitutions = substitutions.filter(sub =>
    sub.teamName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sub.originalShooterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sub.replacementShooterName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredTeams = teams.filter(team =>
    team.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          <div className="flex gap-4">
            <div className="flex-1">
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
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2025">2025</SelectItem>
                <SelectItem value="2024">2024</SelectItem>
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
                            {substitution.substitutionDate?.toDate?.()?.toLocaleDateString() || 'Unbekannt'}
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
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredTeams.map((team) => (
              <div key={team.id} className="border rounded-lg p-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium">{team.name}</h4>
                    <p className="text-sm text-muted-foreground">{team.leagueName}</p>
                    <p className="text-xs text-muted-foreground">
                      {team.shooterIds?.length || 0} Schützen
                    </p>
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
                </div>
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
    </div>
  );
}