"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Loader2, Trash2, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase/config';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { cleanupAllDeletedTeamReferencesForClub } from '@/lib/services/team-cleanup';
import type { Club } from '@/types/rwk';

export default function CleanupPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [selectedClubId, setSelectedClubId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const [cleanupResult, setCleanupResult] = useState<string | null>(null);

  useEffect(() => {
    const fetchClubs = async () => {
      setIsLoading(true);
      try {
        const clubsQuery = query(collection(db, 'clubs'), orderBy('name', 'asc'));
        const snapshot = await getDocs(clubsQuery);
        const fetchedClubs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Club[];
        
        setClubs(fetchedClubs);
      } catch (error) {
        console.error('Error fetching clubs:', error);
        toast({
          title: 'Fehler beim Laden der Vereine',
          description: 'Die Vereinsliste konnte nicht geladen werden.',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchClubs();
  }, [toast]);

  const handleCleanup = async () => {
    if (!user) {
      toast({
        title: 'Nicht angemeldet',
        description: 'Sie müssen angemeldet sein, um diese Funktion zu nutzen.',
        variant: 'destructive'
      });
      return;
    }
    
    if (!selectedClubId) {
      toast({
        title: 'Kein Verein ausgewählt',
        description: 'Bitte wählen Sie einen Verein aus.',
        variant: 'destructive'
      });
      return;
    }

    setIsCleaningUp(true);
    setCleanupResult(null);
    
    try {
      const deletedCount = await cleanupAllDeletedTeamReferencesForClub(selectedClubId);
      
      if (deletedCount > 0) {
        setCleanupResult(`${deletedCount} verwaiste Referenzen wurden erfolgreich bereinigt.`);
        toast({
          title: 'Bereinigung abgeschlossen',
          description: `${deletedCount} verwaiste Referenzen wurden erfolgreich bereinigt.`,
          variant: 'default'
        });
      } else {
        setCleanupResult('Keine verwaisten Referenzen gefunden. Alles ist bereits sauber.');
        toast({
          title: 'Keine Änderungen notwendig',
          description: 'Es wurden keine verwaisten Referenzen gefunden.',
          variant: 'default'
        });
      }
    } catch (error: any) {
      console.error('Error during cleanup:', error);
      setCleanupResult(`Fehler bei der Bereinigung: ${error.message}`);
      toast({
        title: 'Fehler bei der Bereinigung',
        description: error.message || 'Bei der Bereinigung ist ein Fehler aufgetreten.',
        variant: 'destructive'
      });
    } finally {
      setIsCleaningUp(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <RefreshCw className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold text-primary">Datenbereinigung</h1>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl text-primary">Mannschaftsreferenzen bereinigen</CardTitle>
          <CardDescription>
            Bereinigt verwaiste Referenzen auf gelöschte Mannschaften in der Datenbank.
            Dies behebt Probleme mit Mannschaften, die in der Einzelschützenwertung oder im Vereinsvertreterbereich noch angezeigt werden, obwohl sie bereits gelöscht wurden.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="clubSelect">Verein auswählen</Label>
            <Select
              value={selectedClubId}
              onValueChange={setSelectedClubId}
              disabled={isLoading || isCleaningUp}
            >
              <SelectTrigger id="clubSelect">
                <SelectValue placeholder="Verein auswählen" />
              </SelectTrigger>
              <SelectContent>
                {clubs.map(club => (
                  <SelectItem key={club.id} value={club.id}>
                    {club.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleCleanup}
            disabled={!selectedClubId || isCleaningUp || !user}
            className="w-full"
          >
            {isCleaningUp ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Bereinigung läuft...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Verwaiste Referenzen bereinigen
              </>
            )}
          </Button>

          {cleanupResult && (
            <div className={`p-4 rounded-md ${cleanupResult.includes('Fehler') ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
              {cleanupResult}
            </div>
          )}
        </CardContent>
        <CardFooter className="text-sm text-muted-foreground">
          <p>
            Diese Funktion entfernt verwaiste Referenzen auf gelöschte Mannschaften in der Datenbank.
            Sie sollte ausgeführt werden, wenn Mannschaften gelöscht wurden, aber noch in der Einzelschützenwertung oder im Vereinsvertreterbereich angezeigt werden.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}