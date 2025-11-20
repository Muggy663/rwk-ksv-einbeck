'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Swords, Trophy, Clock, Users } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { DuelsService, Duel } from '@/lib/services/duels-service';
import { CreateDuelDialog } from '@/components/duels/create-duel-dialog';
import { ScoreInputDialog } from '@/components/duels/score-input-dialog';

export default function DuelsPage({ params }: { params: { id: string } }) {
  const { user } = useAuth();
  const [duels, setDuels] = useState<Duel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDuels();
  }, []);

  const loadDuels = async () => {
    try {
      const groupDuels = await DuelsService.getGroupDuels(params.id);
      setDuels(groupDuels);
    } catch (error) {
      console.error('Error loading duels:', error);
    } finally {
      setLoading(false);
    }
  };

  const activeDuels = duels.filter(d => d.status === 'active' || d.status === 'pending');
  const completedDuels = duels.filter(d => d.status === 'completed');

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center gap-2">
        <Swords className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Duelle</h1>
      </div>

      {/* Neues Duell Button */}
      <Card>
        <CardContent className="p-4">
          <CreateDuelDialog groupId={params.id} onDuelCreated={loadDuels} />
        </CardContent>
      </Card>

      {/* Aktive Duelle */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Aktive Duelle
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <p className="text-center text-muted-foreground">Lade Duelle...</p>
          ) : activeDuels.length === 0 ? (
            <p className="text-center text-muted-foreground">Keine aktiven Duelle</p>
          ) : (
            activeDuels.map((duel) => (
              <div key={duel.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-medium">{duel.challengerName} vs {duel.opponentName}</p>
                    <p className="text-sm text-muted-foreground">{duel.discipline}</p>
                  </div>
                  <Badge variant={duel.status === 'pending' ? 'outline' : 'secondary'}>
                    {duel.status === 'pending' ? 'Ausstehend' : 'Aktiv'}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                  <div>
                    <p className="text-muted-foreground">Herausforderer</p>
                    <p className="font-medium">{duel.challengerScore ?? 'Ausstehend'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Gegner</p>
                    <p className="font-medium">{duel.opponentScore ?? 'Ausstehend'}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <ScoreInputDialog duel={duel} onScoreSubmitted={loadDuels} />
                  {duel.status === 'pending' && (duel.opponentId === user?.uid) && (
                    <Button size="sm" variant="outline" onClick={async () => {
                      await DuelsService.acceptDuel(duel.id!);
                      loadDuels();
                    }}>
                      Annehmen
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Abgeschlossene Duelle */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Abgeschlossene Duelle
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {completedDuels.length === 0 ? (
            <p className="text-center text-muted-foreground">Keine abgeschlossenen Duelle</p>
          ) : (
            completedDuels.map((duel) => (
              <div key={duel.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-medium">{duel.challengerName} vs {duel.opponentName}</p>
                    <p className="text-sm text-muted-foreground">{duel.discipline}</p>
                  </div>
                  <Badge variant="default">Abgeschlossen</Badge>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm mb-2">
                  <div>
                    <p className="text-muted-foreground">Herausforderer</p>
                    <p className="font-medium">{duel.challengerScore}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Gegner</p>
                    <p className="font-medium">{duel.opponentScore}</p>
                  </div>
                </div>
                {duel.winner && (
                  <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-yellow-500" />
                    <p className="text-sm font-medium">Gewinner: {duel.winner}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex items-center gap-2 mb-6">
          <Swords className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Duelle</h1>
        </div>
        <p className="text-center">Lade Duelle...</p>
      </div>
    );
  }
}