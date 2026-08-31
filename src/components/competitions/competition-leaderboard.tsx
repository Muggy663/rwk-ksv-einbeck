'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Target } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { CompetitionsService, Competition } from '@/lib/services/competitions-service';
import { AdminControls } from '@/components/competitions/admin-controls';
import { UserService, UserProfile } from '@/lib/services/user-service';

interface CompetitionLeaderboardProps {
  competition: Competition;
  onResultSubmitted: () => void;
}

export function CompetitionLeaderboard({ competition, onResultSubmitted }: CompetitionLeaderboardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [currentRound, setCurrentRound] = useState(1);
  const [score, setScore] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [userProfiles, setUserProfiles] = useState<{ [userId: string]: UserProfile }>({});

  const userResults = competition.results[user?.uid || ''] || [];
  const canSubmitRound = currentRound <= competition.rounds && !userResults[currentRound - 1];
  
  useEffect(() => {
    // Lade Benutzer-Profile für alle Teilnehmer
    UserService.getUserProfiles(competition.participants).then(setUserProfiles);
  }, [competition.participants]);

  const handleSubmitScore = async () => {
    if (!score || isNaN(parseFloat(score))) {
      toast({ title: 'Fehler', description: 'Bitte geben Sie eine gültige Ringzahl ein.', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      await CompetitionsService.submitResult(competition.id!, user!.uid, currentRound, parseFloat(score));
      toast({ title: 'Ergebnis eingereicht!', description: `Runde ${currentRound}: ${score} Ringe` });
      setScore('');
      setCurrentRound(prev => prev + 1);
      onResultSubmitted();
    } catch (error) {
      toast({ title: 'Fehler', description: 'Ergebnis konnte nicht gespeichert werden.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  // Berechne Rangliste
  const leaderboard = competition.participants.map(participantId => {
    const results = competition.results[participantId] || [];
    let totalScore = results.reduce((sum, score) => sum + (score || 0), 0);
    
    // Bei "Ganze Ringe" Wertung: Jede Runde einzeln runden, dann summieren
    if (competition.scoreType === 'whole') {
      totalScore = results.reduce((sum, score) => sum + Math.floor(score || 0), 0);
    }
    
    const completedRounds = results.filter(score => score !== undefined).length;
    
    // Name aus user_permissions laden
    let displayName = `Schütze ${participantId.slice(-4)}`;
    if (participantId === user?.uid) {
      displayName = user?.displayName || user?.email?.split('@')[0] || 'Sie';
    } else if (userProfiles[participantId]) {
      const profile = userProfiles[participantId];
      displayName = profile.displayName || profile.email?.split('@')[0] || `Schütze ${participantId.slice(-4)}`;
    }
    
    return {
      userId: participantId,
      name: displayName,
      results,
      totalScore,
      completedRounds,
      average: completedRounds > 0 ? totalScore / completedRounds : 0
    };
  }).sort((a, b) => {
    switch (competition.sortBy) {
      case 'total':
        return b.totalScore - a.totalScore;
      case 'average':
        return b.average - a.average;
      case 'best':
        const aBest = Math.max(...(competition.results[a.userId] || [0]));
        const bBest = Math.max(...(competition.results[b.userId] || [0]));
        return bBest - aBest;
      default:
        return b.totalScore - a.totalScore;
    }
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Trophy className="h-4 w-4 mr-2" />
          Rangliste
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{competition.name} - Rangliste</DialogTitle>
          <DialogDescription>
            Live-Rangliste und Ergebnis-Eingabe für den Wettkampf
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Wettkampf-Info */}
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Disziplin</div>
                  <div className="font-medium">{competition.discipline}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Schüsse pro Runde</div>
                  <div className="font-medium">{competition.shots}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Runden</div>
                  <div className="font-medium">{competition.rounds}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Wertung</div>
                  <div className="font-medium">{competition.scoreType === 'whole' ? 'Ganze Ringe' : 'Mit Zehntel'}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Ergebnis eingeben */}
          {competition.participants.includes(user?.uid || '') && canSubmitRound && (
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Runde {currentRound} eingeben</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label>Ringzahl ({competition.shots} Schuss)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="z.B. 95.5"
                    value={score}
                    onChange={(e) => setScore(e.target.value)}
                  />
                </div>
                <Button onClick={handleSubmitScore} disabled={submitting} className="w-full">
                  {submitting ? 'Speichere...' : `Runde ${currentRound} einreichen`}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Admin-Kontrollen */}
          {competition.createdBy === user?.uid && (
            <AdminControls 
              competition={competition} 
              onCompetitionUpdated={onResultSubmitted}
            />
          )}

          {/* Rangliste */}
          <Card>
            <CardHeader>
              <CardTitle>Aktuelle Rangliste</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {leaderboard.map((participant, index) => (
                  <div key={participant.userId} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium">{participant.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {participant.completedRounds}/{competition.rounds} Runden
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold">
                        {competition.scoreType === 'whole' 
                          ? participant.totalScore
                          : participant.totalScore.toFixed(1)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        ∅ {competition.scoreType === 'whole' 
                          ? participant.average.toFixed(0)
                          : participant.average.toFixed(1)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}