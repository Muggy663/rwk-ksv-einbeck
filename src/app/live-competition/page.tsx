"use client";

import { useState, useEffect } from "react";
import { logError } from '@/lib/utils/secure-logger';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trophy, Plus, ArrowLeft, Users, Clock, Target, Play, Calendar } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";

interface Competition {
  id: string;
  name: string;
  discipline: string;
  shots: number;
  rounds: number;
  status: 'active' | 'completed';
  participants: string[];
  createdBy: string;
  createdByName: string;
  groupId: string;
  createdAt: any;
}

export default function LiveCompetitionPage() {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [activeCompetitions, setActiveCompetitions] = useState<Competition[]>([]);
  const [myCompetitions, setMyCompetitions] = useState<Competition[]>([]);
  const [userGroups, setUserGroups] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);
  
  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    
    try {
      await loadCompetitions();
    } catch (error) {
      logError('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const loadCompetitions = async () => {
    if (!user) return;
    
    try {
      // Load user's training groups
      const { TrainingGroupsService } = await import('@/lib/services/training-groups-service');
      const groups = await TrainingGroupsService.getUserGroups(user.uid);
      setUserGroups(groups);
      
      // Load competitions from all groups
      const { CompetitionsService } = await import('@/lib/services/competitions-service');
      const allCompetitions: Competition[] = [];
      
      for (const group of groups) {
        const groupCompetitions = await CompetitionsService.getGroupCompetitions(group.id);
        allCompetitions.push(...groupCompetitions);
      }
      
      const active = allCompetitions.filter(c => c.status === 'active');
      const mine = allCompetitions.filter(c => c.createdBy === user.uid);
      
      setActiveCompetitions(active);
      setMyCompetitions(mine);
    } catch (error) {
      logError('Error loading competitions:', error);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4 sm:p-6 max-w-4xl">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Clock className="h-8 w-8 mx-auto mb-2 animate-spin" />
            <p>Lade Live-Wettkämpfe...</p>
          </div>
        </div>
      </div>
    );
  }



  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-6xl">
      <div className="mb-6">
        <Button asChild variant="ghost" className="mb-4">
          <Link href="/social">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück zu Social Training
          </Link>
        </Button>
        
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-2">
          <div className="flex items-center gap-3">
            <Trophy className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-600 dark:text-yellow-400" />
            <h1 className="text-2xl sm:text-3xl font-bold">Live-Wettkämpfe</h1>
          </div>

        </div>
        <p className="text-muted-foreground">
          Nehmen Sie an Echtzeit-Wettkämpfen teil oder erstellen Sie eigene
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        
        {/* Neuen Wettkampf erstellen */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Wettkampf erstellen
            </CardTitle>
            <CardDescription>
              Starten Sie einen neuen Live-Wettkampf
            </CardDescription>
          </CardHeader>
          <CardContent>
            {userGroups.length === 0 ? (
              <div className="text-center py-2">
                <p className="text-sm text-muted-foreground mb-3">
                  Sie benötigen eine Trainingsgruppe
                </p>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/social">
                    Gruppe beitreten
                  </Link>
                </Button>
              </div>
            ) : (
              <Button asChild className="w-full">
                <Link href={`/training-groups/${userGroups[0].id}`}>
                  Neuen Wettkampf starten
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Aktive Wettkämpfe */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-green-600" />
              Aktive Wettkämpfe
            </CardTitle>
            <CardDescription>
              Laufende Wettkämpfe in Ihren Gruppen
            </CardDescription>
          </CardHeader>
          <CardContent>
            {activeCompetitions.length === 0 ? (
              <div className="text-center py-4">
                <Target className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Keine aktiven Wettkämpfe</p>
                {userGroups.length === 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Treten Sie einer Trainingsgruppe bei
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {activeCompetitions.slice(0, 3).map((comp) => (
                  <Link key={comp.id} href={`/training-groups/${comp.groupId}`}>
                    <div className="p-3 border rounded hover:bg-muted/50 transition-colors cursor-pointer">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-sm">{comp.name}</div>
                          <div className="text-xs text-muted-foreground">{comp.discipline} • {comp.shots} Schuss</div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          <span className="text-xs">{comp.participants?.length || 0}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
                {activeCompetitions.length > 3 && (
                  <p className="text-xs text-muted-foreground text-center pt-2">
                    +{activeCompetitions.length - 3} weitere
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Meine Wettkämpfe */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Meine Wettkämpfe
            </CardTitle>
            <CardDescription>
              Wettkämpfe, die Sie erstellt haben
            </CardDescription>
          </CardHeader>
          <CardContent>
            {myCompetitions.length === 0 ? (
              <div className="text-center py-4">
                <Trophy className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Noch keine Wettkämpfe erstellt</p>
              </div>
            ) : (
              <div className="space-y-2">
                {myCompetitions.slice(0, 3).map((comp) => (
                  <Link key={comp.id} href={`/training-groups/${comp.groupId}`}>
                    <div className="p-3 border rounded hover:bg-muted/50 transition-colors cursor-pointer">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-sm">{comp.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {comp.discipline} • {comp.participants?.length || 0} Teilnehmer
                          </div>
                        </div>
                        <Badge variant={comp.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                          {comp.status === 'active' ? 'Aktiv' : 'Beendet'}
                        </Badge>
                      </div>
                    </div>
                  </Link>
                ))}
                {myCompetitions.length > 3 && (
                  <p className="text-xs text-muted-foreground text-center pt-2">
                    +{myCompetitions.length - 3} weitere
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Alle Wettkämpfe */}
      {(activeCompetitions.length > 0 || myCompetitions.length > 0) && (
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Alle Wettkämpfe</h2>
          
          <div className="grid gap-4">
            {[...activeCompetitions, ...myCompetitions.filter(c => !activeCompetitions.find(a => a.id === c.id))]
              .sort((a, b) => new Date(b.createdAt?.seconds * 1000 || 0).getTime() - new Date(a.createdAt?.seconds * 1000 || 0).getTime())
              .map((comp) => {
                const groupName = userGroups.find(g => g.id === comp.groupId)?.name || 'Unbekannte Gruppe';
                return (
                  <Card key={comp.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                        <div className="flex-1">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                            <h3 className="font-semibold">{comp.name}</h3>
                            <div className="flex gap-2">
                              <Badge variant={comp.status === 'active' ? 'default' : 'secondary'}>
                                {comp.status === 'active' ? 'Aktiv' : 'Beendet'}
                              </Badge>
                              {comp.createdBy === user?.uid && (
                                <Badge variant="outline" className="text-xs">Mein Wettkampf</Badge>
                              )}
                            </div>
                          </div>
                          <div className="text-sm text-muted-foreground mb-2">
                            {comp.discipline} • {comp.shots} Schuss • {groupName}
                          </div>
                          <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {comp.participants?.length || 0} Teilnehmer
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {comp.createdAt?.seconds ? 
                                new Date(comp.createdAt.seconds * 1000).toLocaleDateString('de-DE') : 
                                'Unbekannt'
                              }
                            </div>
                          </div>
                        </div>
                        <Button asChild variant="outline" size="sm" className="w-full sm:w-auto">
                          <Link href={`/training-groups/${comp.groupId}`}>
                            <Play className="h-4 w-4 mr-1" />
                            Öffnen
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            }
          </div>
        </div>
      )}
      
      {/* Keine Wettkämpfe */}
      {activeCompetitions.length === 0 && myCompetitions.length === 0 && (
        <div className="mt-8">
          <Card>
            <CardContent className="p-8 text-center">
              <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Noch keine Wettkämpfe</h3>
              <p className="text-muted-foreground mb-4">
                {userGroups.length === 0 ? 
                  'Treten Sie einer Trainingsgruppe bei, um an Live-Wettkämpfen teilzunehmen.' :
                  'Erstellen Sie Ihren ersten Live-Wettkampf in einer Ihrer Trainingsgruppen.'
                }
              </p>
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                {userGroups.length > 0 && (
                  <Button asChild className="w-full sm:w-auto">
                    <Link href={`/training-groups/${userGroups[0].id}`}>
                      Wettkampf erstellen
                    </Link>
                  </Button>
                )}
                <Button asChild variant="outline" className="w-full sm:w-auto">
                  <Link href="/social">
                    Trainingsgruppen
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
