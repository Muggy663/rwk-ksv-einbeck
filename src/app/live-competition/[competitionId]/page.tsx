"use client";

import { useState, useEffect } from "react";
import { logError } from '@/lib/utils/secure-logger';
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Trophy, Users, Clock, Target, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { LiveCompetitionService } from "@/lib/services/live-competition-service";
import { useToast } from "@/hooks/use-toast";

export default function CompetitionDetailPage() {
  const params = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const competitionId = params.competitionId as string;
  
  const [competition, setCompetition] = useState<any>(null);
  const [results, setResults] = useState<any[]>([]);
  const [myResult, setMyResult] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (competitionId) {
      loadCompetition();
      subscribeToResults();
    }
  }, [competitionId]);

  const loadCompetition = async () => {
    try {
      const comp = await LiveCompetitionService.getCompetitionDetails(competitionId);
      setCompetition(comp);
    } catch (error) {
      logError('Error loading competition:', error);
    }
  };

  const subscribeToResults = () => {
    return LiveCompetitionService.subscribeToLiveRanking(competitionId, (liveResults) => {
      setResults(liveResults);
    });
  };

  const submitResult = async () => {
    if (!user || !myResult) return;
    
    setIsSubmitting(true);
    try {
      const totalScore = parseFloat(myResult);
      await LiveCompetitionService.submitResult(user.uid, competitionId, {
        serien: [],
        totalScore,
        totalRings: Math.floor(totalScore)
      });
      
      toast({
        title: "Ergebnis eingereicht",
        description: `${totalScore} Ringe erfolgreich übermittelt`
      });
      
      setMyResult("");
    } catch (error: any) {
      toast({
        title: "Fehler",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const joinCompetition = async () => {
    if (!user) return;
    
    try {
      await LiveCompetitionService.joinCompetition(user.uid, competitionId);
      toast({
        title: "Beigetreten",
        description: "Sie nehmen jetzt am Wettkampf teil"
      });
      loadCompetition();
    } catch (error: any) {
      toast({
        title: "Fehler",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  if (!competition) {
    return <div className="container mx-auto p-4">Lade Wettkampf...</div>;
  }

  const isParticipant = user && competition.participants?.includes(user.uid);
  const canSubmit = isParticipant && competition.status === 'active';

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <Button asChild variant="ghost" className="mb-4">
        <Link href="/live-competition">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Zurück zu Live-Wettkämpfe
        </Link>
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Wettkampf Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              {competition.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="font-medium">Disziplin</div>
                <div>{competition.discipline}</div>
              </div>
              <div>
                <div className="font-medium">Schüsse</div>
                <div>{competition.shotCount}</div>
              </div>
              <div>
                <div className="font-medium">Status</div>
                <Badge variant={competition.status === 'active' ? 'default' : 'secondary'}>
                  {competition.status === 'active' ? 'Aktiv' : 
                   competition.status === 'waiting' ? 'Wartet' : 'Beendet'}
                </Badge>
              </div>
              <div>
                <div className="font-medium">Teilnehmer</div>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {competition.participants?.length || 0}
                </div>
              </div>
            </div>

            {!isParticipant && competition.status !== 'finished' && (
              <Button onClick={joinCompetition} className="w-full">
                Wettkampf beitreten
              </Button>
            )}

            {canSubmit && (
              <div className="space-y-2">
                <div className="font-medium">Ergebnis eingeben</div>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="Ringe (z.B. 95.5)"
                    value={myResult}
                    onChange={(e) => setMyResult(e.target.value)}
                  />
                  <Button 
                    onClick={submitResult} 
                    disabled={isSubmitting || !myResult}
                  >
                    {isSubmitting ? 'Sende...' : 'Senden'}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Live Rangliste */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Live-Rangliste
            </CardTitle>
          </CardHeader>
          <CardContent>
            {results.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Noch keine Ergebnisse
              </div>
            ) : (
              <div className="space-y-2">
                {results.map((result, index) => (
                  <div key={result.userId} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                        {index + 1}
                      </div>
                      <div className="font-medium">Schütze {result.userId.slice(-4)}</div>
                    </div>
                    <div className="font-bold">{result.totalScore} Ringe</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}