"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Trophy, Target, Users, Medal } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { SocialTrainingService } from "@/lib/services/social-training-service";
import { TrainingGroupsService } from "@/lib/services/training-groups-service";

export default function RankingsPage() {
  const { user } = useAuth();
  const [groupRankings, setGroupRankings] = useState<any[]>([]);
  const [userGroups, setUserGroups] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadRankings();
    }
  }, [user]);

  const loadRankings = async () => {
    try {
      if (!user?.uid) return;

      const groups = await TrainingGroupsService.getUserGroups(user.uid);
      setUserGroups(groups);

      const groupRankingData = [];
      for (const group of groups) {
        if (group.id) {
          const results = await SocialTrainingService.getGroupResults(group.id);
          
          const userStats = results.reduce((acc: any, result: any) => {
            if (!acc[result.userId]) {
              acc[result.userId] = {
                userId: result.userId,
                totalRings: 0,
                sessions: 0,
                bestScore: 0
              };
            }
            acc[result.userId].totalRings += result.rings || 0;
            acc[result.userId].sessions += 1;
            acc[result.userId].bestScore = Math.max(acc[result.userId].bestScore, result.rings || 0);
            return acc;
          }, {});

          const ranking = Object.values(userStats)
            .map((stats: any) => ({
              ...stats,
              average: stats.sessions > 0 ? stats.totalRings / stats.sessions : 0,
              groupName: group.name
            }))
            .sort((a: any, b: any) => b.average - a.average);

          groupRankingData.push({
            groupId: group.id,
            groupName: group.name,
            ranking
          });
        }
      }
      
      setGroupRankings(groupRankingData);
    } catch (error) {
      console.error('Error loading rankings:', error);
    }
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 sm:p-6 max-w-6xl">
        <div className="text-center py-8">
          <Trophy className="h-8 w-8 mx-auto mb-2 text-muted-foreground animate-pulse" />
          <p>Lade Ranglisten...</p>
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
        
        <div className="flex items-center gap-3 mb-2">
          <Trophy className="h-8 w-8 text-yellow-600" />
          <h1 className="text-3xl font-bold">Ranglisten & Vergleiche</h1>
        </div>
        <p className="text-muted-foreground">
          Vergleichen Sie Ihre Leistungen mit anderen Schützen
        </p>
      </div>

      {groupRankings.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Keine Gruppen-Ranglisten</h3>
            <p className="text-muted-foreground mb-4">
              Treten Sie Trainingsgruppen bei, um Ranglisten zu sehen.
            </p>
            <Button asChild>
              <Link href="/training-groups">
                Gruppen entdecken
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {groupRankings.map((groupData) => (
            <Card key={groupData.groupId}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  {groupData.groupName}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {groupData.ranking.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    Noch keine Ergebnisse in dieser Gruppe
                  </div>
                ) : (
                  <div className="space-y-2">
                    {groupData.ranking.map((member: any, index: number) => (
                      <div key={member.userId} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            index === 0 ? 'bg-yellow-100 text-yellow-800' :
                            index === 1 ? 'bg-gray-100 text-gray-800' :
                            index === 2 ? 'bg-orange-100 text-orange-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-medium">
                              {member.userId === user?.uid ? 'Sie' : `Schütze ${member.userId.slice(-4)}`}
                              {member.userId === user?.uid && (
                                <Badge variant="outline" className="ml-2">Sie</Badge>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {member.sessions} Sessions
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">{member.average.toFixed(1)} Ø</div>
                          <div className="text-sm text-muted-foreground">
                            Best: {member.bestScore}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}