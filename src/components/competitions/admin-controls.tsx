'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, RotateCcw, Settings } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { CompetitionsService, Competition } from '@/lib/services/competitions-service';

interface AdminControlsProps {
  competition: Competition;
  onCompetitionUpdated: () => void;
}

export function AdminControls({ competition, onCompetitionUpdated }: AdminControlsProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const isAdmin = competition.createdBy === user?.uid;

  if (!isAdmin) return null;

  const handleResetResults = async () => {
    if (!confirm('Alle Ergebnisse löschen? Diese Aktion kann nicht rückgängig gemacht werden.')) {
      return;
    }

    setLoading(true);
    try {
      await CompetitionsService.resetCompetitionResults(competition.id!);
      toast({ title: 'Ergebnisse gelöscht', description: 'Alle Wettkampf-Ergebnisse wurden zurückgesetzt.' });
      onCompetitionUpdated();
    } catch (error) {
      toast({ title: 'Fehler', description: 'Ergebnisse konnten nicht gelöscht werden.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCompetition = async () => {
    if (!confirm('Wettkampf komplett löschen? Diese Aktion kann nicht rückgängig gemacht werden.')) {
      return;
    }

    setLoading(true);
    try {
      await CompetitionsService.deleteCompetition(competition.id!);
      toast({ title: 'Wettkampf gelöscht', description: 'Der Wettkampf wurde komplett entfernt.' });
      onCompetitionUpdated();
    } catch (error) {
      toast({ title: 'Fehler', description: 'Wettkampf konnte nicht gelöscht werden.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-red-200 bg-red-50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Admin-Kontrollen
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button
          onClick={handleResetResults}
          disabled={loading}
          variant="outline"
          className="w-full"
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Alle Ergebnisse löschen
        </Button>
        
        <Button
          onClick={handleDeleteCompetition}
          disabled={loading}
          variant="destructive"
          className="w-full"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Wettkampf löschen
        </Button>
        
        <p className="text-xs text-muted-foreground">
          Nur als Wettkampf-Ersteller sichtbar
        </p>
      </CardContent>
    </Card>
  );
}