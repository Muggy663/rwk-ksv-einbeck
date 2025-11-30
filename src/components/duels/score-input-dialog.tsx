'use client';

import { useState } from 'react';
import { logError, logWarn, logInfo, logDebug } from '@/lib/utils/secure-logger';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Target } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { DuelsService, Duel } from '@/lib/services/duels-service';

interface ScoreInputDialogProps {
  duel: Duel;
  onScoreSubmitted: () => void;
}

export function ScoreInputDialog({ duel, onScoreSubmitted }: ScoreInputDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [score, setScore] = useState('');
  const [loading, setLoading] = useState(false);

  const isChallenger = duel.challengerId === user?.uid;
  const hasSubmitted = isChallenger ? duel.challengerScore !== undefined : duel.opponentScore !== undefined;
  const canSubmit = duel.status === 'active' && !hasSubmitted;

  const handleSubmit = async () => {
    const scoreNum = parseFloat(score);
    if (isNaN(scoreNum) || scoreNum < 0) {
      toast({ title: 'Fehler', description: 'Bitte geben Sie eine gültige Ringzahl ein.', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      await DuelsService.submitScore(duel.id!, user!.uid, scoreNum);
      toast({ title: 'Ergebnis eingereicht!', description: 'Ihr Ergebnis wurde erfolgreich gespeichert.' });
      setOpen(false);
      setScore('');
      onScoreSubmitted();
    } catch (error) {
      toast({ title: 'Fehler', description: 'Ergebnis konnte nicht gespeichert werden.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  if (!canSubmit) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Target className="h-4 w-4 mr-2" />
          Ergebnis eingeben
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ergebnis eingeben</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-2">
              Duell: {duel.challengerName} vs {duel.opponentName}
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Disziplin: {duel.discipline}
            </p>
          </div>
          
          <div>
            <Label>Ringzahl</Label>
            <Input
              type="number"
              step="0.1"
              placeholder="z.B. 95.5"
              value={score}
              onChange={(e) => setScore(e.target.value)}
            />
          </div>

          <Button onClick={handleSubmit} disabled={loading} className="w-full">
            {loading ? 'Speichere...' : 'Ergebnis einreichen'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}