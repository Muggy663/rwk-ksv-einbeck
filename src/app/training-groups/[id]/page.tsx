"use client";

import { useState, useEffect } from "react";
import { logError, logDebug, getErrorMessage } from '@/lib/utils/secure-logger';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Users, Crown, Settings, Copy, Trophy, LogOut, Target, BarChart3, Plus, Swords } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

import { TrainingGroupsService } from "@/lib/services/training-groups-service";
import { SocialTrainingService } from "@/lib/services/social-training-service";
import { TrainingGroup } from "@/types/social";
import { CreateCompetitionDialog } from "@/components/competitions/create-competition-dialog";
import { CompetitionsService, Competition } from "@/lib/services/competitions-service";
import { CompetitionLeaderboard } from "@/components/competitions/competition-leaderboard";
import { UserService } from "@/lib/services/user-service";

// Separate component for group results to avoid hooks in map
function GroupResultCard({ result }: { result: any }) {
  const [fullResult, setFullResult] = useState<any>(null);
  
  useEffect(() => {
    if (result.resultId) {
      SocialTrainingService.getResultById(result.resultId)
        .then(setFullResult)
        .catch((error) => logError('Error loading result:', error));
    }
  }, [result.resultId]);
  
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h4 className="font-medium">{result.discipline}</h4>
            <p className="text-sm text-muted-foreground">
              {new Date(result.date?.toDate?.() || result.date).toLocaleDateString('de-DE')}
              {fullResult?.location && ` • ${fullResult.location}`}
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{result.rings}</div>
            <div className="text-sm text-muted-foreground">
              {result.shots} Schuss • ∅ {result.average?.toFixed(1)}
            </div>
          </div>
        </div>
        
        {fullResult && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            {fullResult.shootingRange && (
              <div>
                <div className="text-muted-foreground">Schießstand</div>
                <div className="font-medium">{fullResult.shootingRange}</div>
              </div>
            )}
            {fullResult.weather && (
              <div>
                <div className="text-muted-foreground">Wetter</div>
                <div className="font-medium">{fullResult.weather}</div>
              </div>
            )}
            {fullResult.ringsWithDecimals && (
              <div>
                <div className="text-muted-foreground">Mit Zehntel</div>
                <div className="font-medium">{fullResult.ringsWithDecimals}</div>
              </div>
            )}
            {fullResult.series && (
              <div>
                <div className="text-muted-foreground">Serien</div>
                <div className="font-medium">{fullResult.series.length} erfasst</div>
              </div>
            )}
          </div>
        )}
        
        {fullResult?.notes && (
          <div className="mt-3 p-2 bg-muted rounded text-sm">
            <strong>Notizen:</strong> {fullResult.notes}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function GroupDetailPage({ params }: { params: { id: string } }) {
  const { user } = useAuth();
  const { toast } = useToast();
  // TODO: Premium check - PremiumProvider nicht verfügbar in diesem Kontext
  const isPremium = true; // Temporär: Annahme dass User Premium hat
  const [group, setGroup] = useState<TrainingGroup | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState('competitions'); // Starte mit Wettkämpfe Tab für Debug
  const [groupResults, setGroupResults] = useState<any[]>([]);
  const [loadingResults, setLoadingResults] = useState(false);
  const [userProfiles, setUserProfiles] = useState<{ [userId: string]: any }>({});
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [loadingCompetitions, setLoadingCompetitions] = useState(false);
  
  // Lade Benutzer-Profile für Mitglieder-Anzeige
  useEffect(() => {
    if (group?.members && group.members.length > 0) {
      loadMemberProfiles();
    }
  }, [group?.members]);
  
  const loadMemberProfiles = async () => {
    if (!group?.members) return;
    try {
      const profiles = await UserService.getUserProfiles(group.members);
      setUserProfiles(profiles);
    } catch (error) {
      logError('Error loading member profiles:', error);
    }
  };

  useEffect(() => {
    loadGroup();
    if (activeTab === 'results') {
      loadGroupResults();
    }
    if (activeTab === 'competitions') {
      loadCompetitions();
    }
    if (activeTab === 'stats') {
      loadGroupResults(); // Lade auch für Statistiken
    }
  }, [params.id, activeTab]);
  
  // Lade Wettkämpfe beim ersten Laden
  useEffect(() => {
    loadCompetitions();
  }, [params.id]);

  const loadGroup = async () => {
    try {
      const groupData = await TrainingGroupsService.getGroupDetails(params.id);
      setGroup(groupData);
    } catch (error) {
      logError('Error loading group:', error);
      toast({ 
        title: "Fehler", 
        description: "Gruppe konnte nicht geladen werden. Möglicherweise haben Sie keine Berechtigung.", 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };
  
  const loadGroupResults = async () => {
    setLoadingResults(true);
    try {
      const results = await SocialTrainingService.getGroupResults(params.id);
      setGroupResults(results);
      
      // Lade Benutzer-Profile für Namen
      const userIds = [...new Set(results.map(r => r.userId).filter(Boolean))];
      if (userIds.length > 0) {
        const profiles = await UserService.getUserProfiles(userIds);
        setUserProfiles(profiles);
      }
    } catch (error) {
      logError('Error loading group results:', error);
    } finally {
      setLoadingResults(false);
    }
  };
  
  const loadCompetitions = async () => {
    setLoadingCompetitions(true);
    try {
      logDebug('Loading competitions for group:', params.id);
      const groupCompetitions = await CompetitionsService.getGroupCompetitions(params.id);
      logDebug('Loaded competitions:', groupCompetitions);
      setCompetitions(groupCompetitions);
    } catch (error) {
      logError('Error loading competitions:', error);
    } finally {
      setLoadingCompetitions(false);
    }
  };

  if (loading) {
    return <div className="container mx-auto p-4 text-center">Lade Gruppe...</div>;
  }

  if (!group) {
    return <div className="container mx-auto p-4 text-center">Gruppe nicht gefunden</div>;
  }

  if (!group.isActive) {
    return (
      <div className="container mx-auto p-4 text-center">
        <h2 className="text-xl font-bold mb-2">Gruppe archiviert</h2>
        <p className="text-muted-foreground mb-4">Diese Gruppe wurde archiviert: {group.archiveReason}</p>
        <Button asChild>
          <Link href="/training-groups">Zurück zur Übersicht</Link>
        </Button>
      </div>
    );
  }

  const isAdmin = group.admins?.includes(user?.uid || '');
  const isMember = group.members?.includes(user?.uid || '');
  const isCreator = group.createdBy === user?.uid || group.ownerId === user?.uid || isAdmin; // Fallback: ownerId oder Admin

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-4xl">
      <div className="mb-6">
        <Button asChild variant="ghost" className="mb-4">
          <Link href="/training-groups">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück zur Übersicht
          </Link>
        </Button>
        
        <div className="flex items-center gap-3 mb-2">
          <Users className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold">{group.name}</h1>
          {isAdmin && <Crown className="h-6 w-6 text-yellow-500" />}
        </div>
        <p className="text-muted-foreground">
          {group.description || 'Keine Beschreibung verfügbar'}
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Übersicht</TabsTrigger>
          <TabsTrigger value="results">Ergebnisse</TabsTrigger>
          <TabsTrigger value="stats">Statistiken</TabsTrigger>
          <TabsTrigger value="competitions">Wettkämpfe</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Gruppen-Info */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Gruppen-Informationen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Mitglieder</p>
                    <p className="font-medium">{group.members?.length || 0} / {group.maxMembers}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Beitritts-Code</p>
                    <p className="font-mono font-medium">{group.joinCode}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Live-Wettkämpfe</p>
                    <p className="font-medium">{group.settings?.allowCompetitions ? 'Aktiviert' : 'Deaktiviert'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Öffentliche Ergebnisse</p>
                    <p className="font-medium">{group.settings?.publicResults ? 'Ja' : 'Nein'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Mitglieder-Liste */}
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Mitglieder ({group.members?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {group.members && group.members.length > 0 ? (
                  <div className="space-y-3">
                    {group.members.map((memberId, index) => {
                      const isCurrentUser = memberId === user?.uid;
                      const isGroupAdmin = group.admins?.includes(memberId);
                      const memberProfile = userProfiles[memberId];
                      
                      return (
                        <div key={memberId} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center font-bold text-sm">
                              {index + 1}
                            </div>
                            <div>
                              <div className="font-medium flex items-center gap-2">
                                {isCurrentUser ? (
                                  <span>Sie ({user?.displayName || user?.email?.split('@')[0] || 'Unbekannt'})</span>
                                ) : (
                                  <span>
                                    {memberProfile?.displayName || 
                                     memberProfile?.email?.split('@')[0] || 
                                     `Schütze ${memberId.slice(-4)}`}
                                  </span>
                                )}
                                {isGroupAdmin && <Crown className="h-4 w-4 text-yellow-500" />}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {isCurrentUser ? 'Das sind Sie' : 
                                 isGroupAdmin ? 'Administrator' : 'Mitglied'}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge variant={isGroupAdmin ? 'default' : 'secondary'}>
                              {isGroupAdmin ? 'Admin' : 'Mitglied'}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4" />
                    <p>Noch keine Mitglieder in der Gruppe</p>
                  </div>
                )}
              </CardContent>
            </Card>

        {/* Aktionen */}
        <Card>
          <CardHeader>
            <CardTitle>Aktionen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            
            {/* Einladen */}
            <div className="space-y-2">
              <Label>Beitritts-Code teilen</Label>
              <div className="flex gap-2">
                <Input value={group.joinCode} readOnly className="font-mono" />
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => {
                    navigator.clipboard.writeText(group.joinCode);
                    toast({ title: "Code kopiert!", description: "Beitritts-Code wurde in die Zwischenablage kopiert." });
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Teilen Sie diesen Code mit anderen Schützen zum Beitreten
              </p>
            </div>

            {/* Mitglieder-Aktionen */}
            {isMember && (
              <>
                <Button asChild className="w-full" variant="outline">
                  <Link href={`/training-groups/${params.id}/duels`}>
                    <Swords className="h-4 w-4 mr-2" />
                    Duelle
                  </Link>
                </Button>
              </>
            )}

            {/* Admin-Aktionen */}
            {isAdmin && (
              <>
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={() => setShowSettings(!showSettings)}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  {showSettings ? 'Einstellungen ausblenden' : 'Gruppe verwalten'}
                </Button>
                
                {group.settings?.allowCompetitions ? (
                  <CreateCompetitionDialog 
                    groupId={params.id} 
                    onCompetitionCreated={() => {
                      toast({ title: "Wettkampf erstellt!", description: "Der Live-Wettkampf wurde gestartet." });
                      loadCompetitions();
                    }} 
                  />
                ) : (
                  <Button className="w-full" variant="outline" disabled>
                    <Trophy className="h-4 w-4 mr-2" />
                    Live-Wettkämpfe deaktiviert
                  </Button>
                )}
              </>
            )}

            {/* Gruppe verlassen */}
            {isMember && !isAdmin && (
              <Button 
                className="w-full" 
                variant="destructive"
                onClick={async () => {
                  if (confirm('Möchten Sie die Gruppe wirklich verlassen?')) {
                    try {
                      await TrainingGroupsService.leaveGroup(user!.uid, params.id);
                      toast({ title: "Gruppe verlassen", description: "Sie haben die Gruppe erfolgreich verlassen." });
                      window.location.href = '/training-groups';
                    } catch (error) {
                      toast({ title: "Fehler", description: "Gruppe konnte nicht verlassen werden.", variant: "destructive" });
                    }
                  }
                }}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Gruppe verlassen
              </Button>
            )}
          </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="results" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Gruppen-Ergebnisse</h3>
              <p className="text-sm text-muted-foreground">
                Alle Ergebnisse der Gruppenmitglieder (Training + Live-Wettkämpfe)
              </p>
            </div>
            <Button asChild>
              <Link href={`/schiessnachweis/neuer-eintrag?group=${params.id}&social=true`}>
                <Plus className="h-4 w-4 mr-2" />
                Ergebnis hinzufügen
              </Link>
            </Button>
          </div>
          
          {loadingResults ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p>Lade Ergebnisse...</p>
              </CardContent>
            </Card>
          ) : groupResults.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Noch keine Ergebnisse</h3>
                <p className="text-muted-foreground mb-4">
                  Fügen Sie Ihr erstes Trainingsergebnis hinzu, um Vergleiche mit anderen Gruppenmitgliedern zu sehen.
                </p>
                <Button asChild>
                  <Link href={`/schiessnachweis/neuer-eintrag?group=${params.id}&social=true`}>
                    Erstes Ergebnis hinzufügen
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {groupResults.map((result) => (
                <GroupResultCard key={result.id} result={result} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="stats" className="space-y-6">
          <h3 className="text-lg font-semibold">Gruppen-Statistiken</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Durchschnitt (Gruppe)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {groupResults.length > 0 
                    ? (groupResults.reduce((sum, r) => sum + r.rings, 0) / groupResults.length).toFixed(1)
                    : '-'}
                </div>
                <p className="text-xs text-muted-foreground">Ringe</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Beste Leistung</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {groupResults.length > 0 
                    ? Math.max(...groupResults.map(r => r.rings))
                    : '-'}
                </div>
                <p className="text-xs text-muted-foreground">Ringe</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Trainingseinheiten</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{groupResults.length}</div>
                <p className="text-xs text-muted-foreground">Gesamt</p>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Rangliste</CardTitle>
              <CardDescription>Basierend auf den letzten 30 Tagen</CardDescription>
            </CardHeader>
            <CardContent>
              {groupResults.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4" />
                  <p>Noch keine Daten für Rangliste verfügbar</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {groupResults
                    .sort((a, b) => b.rings - a.rings)
                    .slice(0, 10)
                    .map((result, index) => (
                    <div key={result.id || index} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center font-bold text-sm">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium">
                            {userProfiles[result.userId] 
                              ? (userProfiles[result.userId].displayName || userProfiles[result.userId].email?.split('@')[0] || `Schütze ${result.userId?.slice(-4)}`)
                              : result.userId === user?.uid 
                                ? (user?.displayName || user?.email?.split('@')[0] || 'Sie')
                                : `Schütze ${result.userId?.slice(-4) || 'Unbekannt'}`}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {result.discipline}
                            {result.isLiveCompetition && ' • Live-Wettkampf'}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">{result.rings}</div>
                        <div className="text-sm text-muted-foreground">
                          {result.shots} Schuss • ∅ {result.average?.toFixed(1)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="competitions" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Live-Wettkämpfe</h3>
            {isAdmin && group.settings?.allowCompetitions && (
              <CreateCompetitionDialog 
                groupId={params.id} 
                onCompetitionCreated={() => {
                  toast({ title: "Wettkampf erstellt!", description: "Der Live-Wettkampf wurde gestartet." });
                  loadCompetitions();
                }} 
              />
            )}
          </div>
          
          {loadingCompetitions ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p>Lade Wettkämpfe...</p>
              </CardContent>
            </Card>
          ) : competitions.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">
                  {group.settings?.allowCompetitions ? 'Keine aktiven Wettkämpfe' : 'Live-Wettkämpfe deaktiviert'}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {group.settings?.allowCompetitions 
                    ? 'Erstellen Sie einen Live-Wettkampf für Echtzeit-Vergleiche mit anderen Gruppenmitgliedern.'
                    : 'Live-Wettkämpfe sind für diese Gruppe deaktiviert. Kontaktieren Sie einen Admin.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {competitions.map((competition) => (
                <Card key={competition.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-medium">{competition.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {competition.discipline} • {competition.shots} Schuss • {competition.rounds} Runden
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Erstellt von {competition.createdByName || user?.displayName || user?.email?.split('@')[0] || 'Admin'}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant={competition.status === 'active' ? 'default' : 'secondary'}>
                          {competition.status === 'active' ? 'Aktiv' : 'Beendet'}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {competition.participants.length} Teilnehmer
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={async () => {
                          try {
                            logDebug('Joining competition:', competition.id, 'User:', user?.uid);
                            await CompetitionsService.joinCompetition(competition.id!, user!.uid);
                            toast({ title: "Beigetreten!", description: "Sie nehmen jetzt am Wettkampf teil." });
                            loadCompetitions();
                          } catch (error) {
                            logError('Join competition error:', error);
                            toast({ title: "Fehler", description: `Beitritt fehlgeschlagen: ${getErrorMessage(error)}`, variant: "destructive" });
                          }
                        }}
                        disabled={competition.participants.includes(user?.uid || '')}
                      >
                        {competition.participants.includes(user?.uid || '') ? 'Teilgenommen' : 'Teilnehmen'}
                      </Button>
                      <CompetitionLeaderboard 
                        competition={competition} 
                        onResultSubmitted={loadCompetitions}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Admin-Einstellungen */}
      {showSettings && isAdmin && activeTab === 'overview' && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Gruppen-Einstellungen</CardTitle>
            <CardDescription>
              Verwalten Sie die Einstellungen Ihrer Trainingsgruppe
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            
            <div className="flex items-center justify-between">
              <div>
                <Label>Live-Wettkämpfe erlauben</Label>
                <p className="text-xs text-muted-foreground">Mitglieder können Echtzeit-Wettkämpfe erstellen</p>
              </div>
              <Switch
                checked={group.settings?.allowCompetitions || false}
                onCheckedChange={async (checked) => {
                  try {
                    await TrainingGroupsService.updateGroupSettings(params.id, user!.uid, { allowCompetitions: checked });
                    setGroup(prev => prev ? { ...prev, settings: { ...prev.settings, allowCompetitions: checked } } : null);
                    toast({ title: "Einstellung gespeichert" });
                  } catch (error) {
                    toast({ title: "Fehler", description: "Einstellung konnte nicht gespeichert werden.", variant: "destructive" });
                  }
                }}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Öffentliche Ergebnisse</Label>
                <p className="text-xs text-muted-foreground">Wettkampf-Ergebnisse sind für alle sichtbar</p>
              </div>
              <Switch
                checked={group.settings?.publicResults || false}
                onCheckedChange={async (checked) => {
                  try {
                    await TrainingGroupsService.updateGroupSettings(params.id, user!.uid, { publicResults: checked });
                    setGroup(prev => prev ? { ...prev, settings: { ...prev.settings, publicResults: checked } } : null);
                    toast({ title: "Einstellung gespeichert" });
                  } catch (error) {
                    toast({ title: "Fehler", description: "Einstellung konnte nicht gespeichert werden.", variant: "destructive" });
                  }
                }}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Automatische Aufnahme</Label>
                <p className="text-xs text-muted-foreground">Neue Mitglieder werden automatisch aufgenommen</p>
              </div>
              <Switch
                checked={group.settings?.autoAcceptMembers || false}
                onCheckedChange={async (checked) => {
                  try {
                    await TrainingGroupsService.updateGroupSettings(params.id, user!.uid, { autoAcceptMembers: checked });
                    setGroup(prev => prev ? { ...prev, settings: { ...prev.settings, autoAcceptMembers: checked } } : null);
                    toast({ title: "Einstellung gespeichert" });
                  } catch (error) {
                    toast({ title: "Fehler", description: "Einstellung konnte nicht gespeichert werden.", variant: "destructive" });
                  }
                }}
              />
            </div>

            {isCreator && (
              <div className="pt-4 border-t">
                <Button 
                  variant="destructive" 
                  className="w-full"
                  onClick={async () => {
                    if (confirm('Möchten Sie die Gruppe wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.')) {
                      try {
                        await TrainingGroupsService.deleteGroup(params.id, user!.uid);
                        toast({ title: "Gruppe gelöscht", description: "Die Gruppe wurde erfolgreich gelöscht." });
                        window.location.href = '/training-groups';
                      } catch (error) {
                        toast({ title: "Fehler", description: "Gruppe konnte nicht gelöscht werden.", variant: "destructive" });
                      }
                    }
                  }}
                >
                  Gruppe löschen
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}