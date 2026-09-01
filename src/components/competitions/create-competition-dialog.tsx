'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trophy } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { DISZIPLINEN, getDisziplinConfig } from '@/types/schiessnachweis';
import { CompetitionsService } from '@/lib/services/competitions-service';

interface CreateCompetitionDialogProps {
  groupId: string;
  onCompetitionCreated: () => void;
}

export function CreateCompetitionDialog({ groupId, onCompetitionCreated }: CreateCompetitionDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [discipline, setDiscipline] = useState('');
  const [rounds, setRounds] = useState('3');
  const [shots, setShots] = useState('');
  const [scoreType, setScoreType] = useState<'whole' | 'decimal'>('whole');
  const [sortBy, setSortBy] = useState<'total' | 'average' | 'best'>('total');

  const disciplines = DISZIPLINEN.map(d => d.name);

  const handleSubmit = async () => {
    if (!name || !discipline || !shots) {
      toast({ title: 'Fehler', description: 'Bitte füllen Sie alle Felder aus.', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      await CompetitionsService.createCompetition({
        groupId,
        name,
        discipline,
        shots: parseInt(shots),
        rounds: parseInt(rounds),
        scoreType,
        sortBy,
        createdBy: user!.uid,
        createdByName: user!.displayName || user!.email?.split('@')[0] || 'Unbekannt'
      });
      
      toast({ title: 'Wettkampf gestartet!', description: `${name} wurde erfolgreich erstellt.` });
      setOpen(false);
      setName('');
      setDiscipline('');
      setRounds('3');
      setShots('');
      setScoreType('whole');
      setSortBy('total');
      onCompetitionCreated();
    } catch (error) {
      toast({ title: 'Fehler', description: 'Wettkampf konnte nicht erstellt werden.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Trophy className="h-4 w-4 mr-2" />
          Wettkampf erstellen
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Neuen Live-Wettkampf erstellen</DialogTitle>
          <DialogDescription>
            Erstellen Sie einen Live-Wettkampf für Ihre Trainingsgruppe
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Wettkampf-Name</Label>
            <Input
              placeholder="z.B. Abendtraining Wettkampf"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
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

          <div>
            <Label>Schussanzahl</Label>
            {discipline && (() => {
              const config = getDisziplinConfig(discipline);
              return config && config.schussAnzahl.length > 1 ? (
                <Select value={shots} onValueChange={setShots}>
                  <SelectTrigger>
                    <SelectValue placeholder="Schussanzahl wählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    {config.schussAnzahl.map(anzahl => (
                      <SelectItem key={anzahl} value={anzahl.toString()}>
                        {anzahl} Schuss
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  type="number"
                  min="1"
                  max="1000"
                  value={shots}
                  onChange={(e) => setShots(e.target.value)}
                  placeholder={config ? config.schussAnzahl[0].toString() : "z.B. 40"}
                />
              );
            })() || (
              <Input
                type="number"
                min="1"
                max="1000"
                value={shots}
                onChange={(e) => setShots(e.target.value)}
                placeholder="z.B. 40"
              />
            )}
          </div>
          
          <div>
            <Label>Anzahl Runden</Label>
            <Select value={rounds} onValueChange={setRounds}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 Runde</SelectItem>
                <SelectItem value="3">3 Runden</SelectItem>
                <SelectItem value="5">5 Runden</SelectItem>
                <SelectItem value="10">10 Runden</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label>Wertung</Label>
            <Select value={scoreType} onValueChange={(value: 'whole' | 'decimal') => setScoreType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="whole">Ganze Ringe</SelectItem>
                <SelectItem value="decimal">Mit Zehntel</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label>Ranglisten-Sortierung</Label>
            <Select value={sortBy} onValueChange={(value: 'total' | 'average' | 'best') => setSortBy(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="total">Gesamt-Ringzahl</SelectItem>
                <SelectItem value="average">Durchschnitt pro Runde</SelectItem>
                <SelectItem value="best">Beste Einzelrunde</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleSubmit} disabled={loading} className="w-full">
            {loading ? 'Erstelle...' : 'Wettkampf starten'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}