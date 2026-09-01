"use client";

import { useState, useEffect } from "react";
import { logError, logDebug } from '@/lib/utils/secure-logger';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, BarChart3, Trophy, Target, TrendingUp, Users } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { EnhancedStatsCard } from "@/components/statistics/EnhancedStatsCard";
import { PerformanceChart } from "@/components/statistics/PerformanceChart";

export default function SocialStatsPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadStats();
    }
  }, [user]);

  const loadStats = async () => {
    try {
      // Lade echte Daten aus SocialTrainingService
      const { SocialTrainingService } = await import('@/lib/services/social-training-service');
      
      if (!user?.uid) {
        setStats(null);
        setIsLoading(false);
        return;
      }
      
      // Lade echte Social Training Ergebnisse
      const socialResults = await SocialTrainingService.getUserResults(user.uid);
      logDebug('📊 Loaded social results:', socialResults.length);
      
      // Berechne echte Statistiken
      const totalRings = socialResults.reduce((sum, r) => sum + r.rings, 0);
      const totalShots = socialResults.reduce((sum, r) => sum + r.shots, 0);
      const averageScore = totalShots > 0 ? totalRings / totalShots : 0;
      const bestScore = socialResults.length > 0 ? Math.max(...socialResults.map(r => r.rings)) : 0;
      
      // Performance-Daten für Charts
      const performanceData = socialResults.slice(-7).map(result => {
        const date = (result.date as any)?.toDate ? (result.date as any).toDate() : new Date(result.date as any);
        return {
          date: date.toISOString().split('T')[0],
          score: result.rings,
          rings: result.rings,
          average: averageScore
        };
      });
      
      setStats({
        // Community Stats (Mock - da noch keine Community-Daten)
        totalGroups: 0,
        totalMembers: 1,
        activeCompetitions: 0,
        
        // Personal Stats (Echt)
        groupsJoined: 0,
        competitionsParticipated: socialResults.length,
        duelsWon: 0,
        duelsLost: 0,
        currentRanking: 1,
        
        // Performance (Echt)
        averageScore: Math.round(averageScore * 10) / 10,
        bestScore,
        improvementRate: 0,
        
        // Activity (Echt)
        lastActive: socialResults.length > 0 ? 
          ((socialResults[socialResults.length - 1].date as any)?.toDate ? 
            (socialResults[socialResults.length - 1].date as any).toDate() : 
            new Date(socialResults[socialResults.length - 1].date as any)) : 
          new Date(),
        totalSessions: socialResults.length,
        weeklyActivity: [0, 0, 0, 0, 0, 0, socialResults.length > 0 ? 100 : 0],
        
        // Performance Data for Charts (Echt)
        performanceData: performanceData.length > 0 ? performanceData : [
          { date: new Date().toISOString().split('T')[0], score: 0, rings: 0, average: 0 }
        ]
      });
    } catch (error) {
      logError('Fehler beim Laden der Statistiken:', error);
      setStats({
        totalGroups: 0,
        totalMembers: 0,
        activeCompetitions: 0,
        groupsJoined: 0,
        competitionsParticipated: 0,
        duelsWon: 0,
        duelsLost: 0,
        currentRanking: 0,
        averageScore: 0,
        bestScore: 0,
        improvementRate: 0,
        lastActive: new Date(),
        totalSessions: 0,
        weeklyActivity: [0, 0, 0, 0, 0, 0, 0],
        performanceData: []
      });
    }
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 sm:p-6 max-w-6xl">
        <div className="text-center py-8">
          <BarChart3 className="h-8 w-8 mx-auto mb-2 text-muted-foreground animate-pulse" />
          <p>Lade Statistiken...</p>
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
            <BarChart3 className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600 dark:text-purple-400" />
            <h1 className="text-2xl sm:text-3xl font-bold">Social Training Statistiken</h1>
          </div>

        </div>
        <p className="text-muted-foreground">
          Detaillierte Analysen Ihrer Community-Aktivitäten und Leistungen
        </p>
      </div>

      {/* Enhanced Statistics Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <EnhancedStatsCard
          title="Community-Aktivität"
          stats={[
            {
              label: "Gruppen beigetreten",
              value: stats.groupsJoined,
              previousValue: 1,
              trend: "up" as const,
              trendPercentage: 100,
              icon: <Users className="h-4 w-4" />,
              color: "blue" as const
            },
            {
              label: "Wettkämpfe teilgenommen",
              value: stats.competitionsParticipated,
              previousValue: 6,
              trend: "up" as const,
              trendPercentage: 33.3,
              icon: <Trophy className="h-4 w-4" />,
              color: "yellow" as const
            },
            {
              label: "Community Rang",
              value: `#${stats.currentRanking}`,
              icon: <TrendingUp className="h-4 w-4" />,
              color: "purple" as const
            }
          ]}
        />
        
        <EnhancedStatsCard
          title="Duell-Performance"
          stats={[
            {
              label: "Duelle gewonnen",
              value: stats.duelsWon,
              previousValue: 3,
              trend: "up" as const,
              trendPercentage: 66.7,
              icon: <Target className="h-4 w-4" />,
              color: "green" as const
            },
            {
              label: "Siegesrate",
              value: Math.round((stats.duelsWon / (stats.duelsWon + stats.duelsLost)) * 100),
              unit: "%",
              previousValue: 60,
              trend: "up" as const,
              trendPercentage: 11.4,
              icon: <Trophy className="h-4 w-4" />,
              color: "green" as const
            },
            {
              label: "Durchschnittsergebnis",
              value: stats.averageScore,
              unit: "Ringe",
              previousValue: 380,
              trend: "up" as const,
              trendPercentage: 2.0,
              icon: <BarChart3 className="h-4 w-4" />,
              color: "blue" as const
            }
          ]}
        />
      </div>

      {/* Performance Analysis with Tabs */}
      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="performance">Leistung</TabsTrigger>
          <TabsTrigger value="community">Community</TabsTrigger>
          <TabsTrigger value="activity">Aktivität</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-6">
          <PerformanceChart
            title="Social Training Leistungsentwicklung"
            data={stats.performanceData}
            type="line"
            showAverage={true}
          />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PerformanceChart
              title="Wöchentliche Ergebnisse"
              data={stats.performanceData}
              type="bar"
              showAverage={false}
            />
            
            <Card>
              <CardHeader>
                <CardTitle>Leistungsanalyse</CardTitle>
                <CardDescription>
                  Detaillierte Auswertung Ihrer Social Training Performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <span className="text-sm font-medium">Verbesserung</span>
                    <span className="text-green-700 font-bold">+{stats.improvementRate}% in 4 Wochen</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <span className="text-sm font-medium">Bestes Ergebnis</span>
                    <span className="text-blue-700 font-bold">{stats.bestScore} Ringe</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                    <span className="text-sm font-medium">Duell-Siegesrate</span>
                    <span className="text-yellow-700 font-bold">
                      {Math.round((stats.duelsWon / (stats.duelsWon + stats.duelsLost)) * 100)}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="community">

          <Card>
            <CardHeader>
              <CardTitle>Community-Vergleich</CardTitle>
              <CardDescription>
                Wie Sie im Vergleich zu anderen Schützen abschneiden
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">#{stats.currentRanking}</div>
                  <p className="text-sm text-muted-foreground">Ihr aktueller Rang</p>
                  <p className="text-xs text-muted-foreground mt-1">von {stats.totalMembers} Schützen</p>
                </div>
                
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.totalGroups}</div>
                  <p className="text-sm text-muted-foreground">Aktive Gruppen</p>
                  <p className="text-xs text-muted-foreground mt-1">{stats.totalGroups === 0 ? 'Noch keine Gruppen' : 'in der Community'}</p>
                </div>
                
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.activeCompetitions}</div>
                  <p className="text-sm text-muted-foreground">Laufende Wettkämpfe</p>
                  <p className="text-xs text-muted-foreground mt-1">{stats.activeCompetitions === 0 ? 'Noch keine Wettkämpfe' : 'jetzt teilnehmen'}</p>
                </div>
              </div>
              
              {stats.totalSessions === 0 && (
                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg text-center">
                  <p className="text-blue-800 dark:text-blue-200 font-medium">Noch keine Social Training Daten</p>
                  <p className="text-blue-600 dark:text-blue-400 text-sm mt-1">
                    Speichere Ergebnisse mit aktivierter "Social Training" Checkbox, um Statistiken zu sehen
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity">

          <Card>
            <CardHeader>
              <CardTitle>Wöchentliche Aktivität</CardTitle>
              <CardDescription>
                Ihre Trainingsaktivität der letzten 7 Tage
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between h-32 gap-2">
                {stats.weeklyActivity.map((activity: number, index: number) => (
                  <div key={index} className="flex flex-col items-center flex-1">
                    <div 
                      className="bg-blue-500 rounded-t w-full transition-all hover:bg-blue-600"
                      style={{ height: `${activity}%` }}
                    ></div>
                    <span className="text-xs text-muted-foreground mt-2">
                      {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'][index]}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-4 text-center">
                <p className="text-sm text-muted-foreground">
                  Durchschnittliche Aktivität: {Math.round(stats.weeklyActivity.reduce((a: number, b: number) => a + b, 0) / 7)}%
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>


    </div>
  );
}
