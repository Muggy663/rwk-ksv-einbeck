"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sword, Target } from "lucide-react";
import { DuelService } from "@/lib/services/duel-service";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/hooks/use-toast";

interface CreateDuelDialogProps {
  onDuelCreated?: () => void;
}

const DISCIPLINES = [
  { value: 'LG', label: 'Luftgewehr' },
  { value: 'LP', label: 'Luftpistole' },
  { value: 'KK', label: 'Kleinkalibergewehr' },
  { value: 'GK', label: 'Großkalibergewehr' },
  { value: 'SP', label: 'Sportpistole' }
];

const SHOT_COUNTS = [10, 20, 30, 40, 60];

export function CreateDuelDialog({ onDuelCreated }: CreateDuelDialogProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    challengedEmail: '',
    discipline: '',
    shotCount: 40
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);
    try {
      // Hier würde normalerweise eine User-Suche per E-Mail stattfinden
      // Für Demo-Zwecke nehmen wir an, dass die E-Mail zu einer User-ID aufgelöst wird
      const challengedId = 'demo-user-id'; // In echter App: await getUserIdByEmail(formData.challengedEmail)
      
      await DuelService.challengeUser(user.uid, challengedId, {
        discipline: formData.discipline,
        shotCount: formData.shotCount
      });

      toast({
        title: "Duell-Herausforderung gesendet!",
        description: `Die Herausforderung wurde an ${formData.challengedEmail} gesendet.`
      });

      setOpen(false);
      setFormData({ challengedEmail: '', discipline: '', shotCount: 40 });
      onDuelCreated?.();
    } catch (error) {
      toast({
        title: "Fehler",
        description: error instanceof Error ? error.message : "Unbekannter Fehler",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full">
          <Sword className="h-4 w-4 mr-2" />
          Neues Duell starten
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Duell-Herausforderung
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="challengedEmail">Gegner (E-Mail)</Label>
            <Input
              id="challengedEmail"
              type="email"
              placeholder="gegner@example.com"
              value={formData.challengedEmail}
              onChange={(e) => setFormData(prev => ({ ...prev, challengedEmail: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="discipline">Disziplin</Label>
            <Select 
              value={formData.discipline} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, discipline: value }))}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Disziplin wählen" />
              </SelectTrigger>
              <SelectContent>
                {DISCIPLINES.map((discipline) => (
                  <SelectItem key={discipline.value} value={discipline.value}>
                    {discipline.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="shotCount">Schusszahl</Label>
            <Select 
              value={formData.shotCount.toString()} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, shotCount: parseInt(value) }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SHOT_COUNTS.map((count) => (
                  <SelectItem key={count} value={count.toString()}>
                    {count} Schuss
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              Abbrechen
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || !formData.discipline || !formData.challengedEmail}
              className="flex-1"
            >
              {isLoading ? 'Sende...' : 'Herausfordern'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
