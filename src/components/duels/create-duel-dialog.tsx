'use client';

import { useState, useEffect } from 'react';
import { logError } from '@/lib/utils/secure-logger';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Swords } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { DuelsService } from '@/lib/services/duels-service';
import { TrainingGroupsService } from '@/lib/services/training-groups-service';

interface CreateDuelDialogProps {
  groupId: string;
  onDuelCreated: () => void;
}

export function CreateDuelDialog({ groupId, onDuelCreated }: CreateDuelDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState<any[]>([]);
  const [selectedOpponent, setSelectedOpponent] = useState('');
  const [discipline, setDiscipline] = useState('');

  const disciplines = [
    'Luftgewehr 10m',
    'Luftpistole 10m',
    'Kleinkalibergewehr 50m',
    'Kleinkaliberpistole 25m',
    'Freie Pistole 50m'
  ];

  useEffect(() => {
    if (open) {
      loadMembers();
    }
  }, [open]);

  const loadMembers = async () => {
    try {
      const group = await TrainingGroupsService.getGroupDetails(groupId);
      // Filter out current user
      const otherMembers = group?.members?.filter((memberId: string) => memberId !== user?.uid) || [];
      setMembers(otherMembers);
    } catch (error) {
      logError('Error loading members:', error);
    }
  };

  const handleSubmit = async () => {
    if (!selectedOpponent || !discipline) {
      toast({ title: 'Fehler', description: 'Bitte wählen Sie einen Gegner und eine Disziplin.', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      await DuelsService.createDuel({
        groupId,
        challengerId: user!.uid,
        challengerName: user!.displayName || 'Unbekannt',
        opponentId: selectedOpponent,
        opponentName: 'Gegner', // TODO: Get actual name
        discipline
      });

      toast({ title: 'Duell erstellt!', description: 'Ihr Gegner wurde herausgefordert.' });
      setOpen(false);
      setSelectedOpponent('');
      setDiscipline('');
      onDuelCreated();
    } catch (error) {
      toast({ title: 'Fehler', description: 'Duell konnte nicht erstellt werden.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full">
          <Swords className="h-4 w-4 mr-2" />
          Neues Duell starten
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Neues Duell erstellen</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Gegner auswählen</Label>
            <Select value={selectedOpponent} onValueChange={setSelectedOpponent}>
              <SelectTrigger>
                <SelectValue placeholder="Wählen Sie einen Gegner" />
              </SelectTrigger>
              <SelectContent>
                {members.map((memberId) => (
                  <SelectItem key={memberId} value={memberId}>
                    Mitglied {memberId.slice(-6)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label>Disziplin</Label>
            <Select value={discipline} onValueChange={setDiscipline}>
              <SelectTrigger>
                <SelectValue placeholder="Wählen Sie eine Disziplin" />
              </SelectTrigger>
              <SelectContent>
                {disciplines.map((disc) => (
                  <SelectItem key={disc} value={disc}>
                    {disc}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleSubmit} disabled={loading} className="w-full">
            {loading ? 'Erstelle...' : 'Duell starten'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}