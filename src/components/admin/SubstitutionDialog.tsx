// src/components/admin/SubstitutionDialog.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase/config';
import { collection, getDocs, query, where, addDoc, serverTimestamp, updateDoc, doc, writeBatch, arrayRemove, arrayUnion } from 'firebase/firestore';
import type { Team, Shooter, TeamSubstitution, UserPermission } from '@/types/rwk';
import { UserCircle, Users, AlertCircle } from 'lucide-react';

interface SubstitutionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  team: Team;
  userPermission: UserPermission;
  onSubstitutionCreated: () => void;
}

export function SubstitutionDialog({ 
  isOpen, 
  onClose, 
  team, 
  userPermission, 
  onSubstitutionCreated 
}: SubstitutionDialogProps) {
  const { toast } = useToast();
  
  const [currentShooters, setCurrentShooters] = useState<Shooter[]>([]);
  const [availableShooters, setAvailableShooters] = useState<Shooter[]>([]);
  const [selectedOriginalShooter, setSelectedOriginalShooter] = useState<string>('');
  const [selectedReplacementShooter, setSelectedReplacementShooter] = useState<string>('');
  const [fromRound, setFromRound] = useState<number>(1);
  const [substitutionType, setSubstitutionType] = useState<'individual_to_team' | 'new_shooter'>('new_shooter');
  const [reason, setReason] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Lade aktuelle Mannschaftsschützen und verfügbare Ersatzschützen
  useEffect(() => {
    if (isOpen && team.id) {
      loadShootersData();
    }
  }, [isOpen, team.id]);

  const loadShootersData = async () => {
    setIsLoadingData(true);
    try {
      // Lade aktuelle Mannschaftsschützen
      if (team.shooterIds && team.shooterIds.length > 0) {
        const shootersQuery = query(
          collection(db, 'shooters'),
          where('__name__', 'in', team.shooterIds)
        );
        const shootersSnapshot = await getDocs(shootersQuery);
        const teamShooters = shootersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Shooter));
        setCurrentShooters(teamShooters);
      }

      // Lade verfügbare Schützen (alle Schützen des Vereins, die nicht in der Mannschaft sind)
      const allShootersQuery = query(
        collection(db, 'shooters'),
        where('clubId', '==', team.clubId)
      );
      const allShootersSnapshot = await getDocs(allShootersQuery);
      const allShooters = allShootersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Shooter));

      // Filtere Schützen, die nicht bereits in der Mannschaft sind
      const available = allShooters.filter(shooter => 
        !team.shooterIds.includes(shooter.id)
      );
      setAvailableShooters(available);

    } catch (error) {
      console.error('Fehler beim Laden der Schützen:', error);
      toast({
        title: 'Fehler',
        description: 'Schützen konnten nicht geladen werden.',
        variant: 'destructive'
      });
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedOriginalShooter || !selectedReplacementShooter || !fromRound || !reason.trim()) {
      toast({
        title: 'Fehlende Angaben',
        description: 'Bitte füllen Sie alle Pflichtfelder aus.',
        variant: 'destructive'
      });
      return;
    }

    if (selectedOriginalShooter === selectedReplacementShooter) {
      toast({
        title: 'Ungültige Auswahl',
        description: 'Ursprünglicher und Ersatzschütze können nicht identisch sein.',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    try {
      const originalShooter = currentShooters.find(s => s.id === selectedOriginalShooter);
      const replacementShooter = availableShooters.find(s => s.id === selectedReplacementShooter);

      if (!originalShooter || !replacementShooter) {
        throw new Error('Schützen nicht gefunden');
      }

      // Erstelle Substitution-Eintrag
      const substitution: Omit<TeamSubstitution, 'id'> = {
        teamId: team.id,
        teamName: team.name,
        leagueId: team.leagueId,
        competitionYear: team.competitionYear,
        originalShooterId: selectedOriginalShooter,
        originalShooterName: originalShooter.name,
        replacementShooterId: selectedReplacementShooter,
        replacementShooterName: replacementShooter.name,
        substitutionDate: new Date(),
        fromRound: fromRound,
        type: substitutionType,
        reason: reason.trim(),
        createdByUserId: userPermission.uid,
        createdByUserName: userPermission.displayName || userPermission.email,
        createdAt: new Date()
      };

      // Bei Einzelschütze → Team: Übertrage Ergebnisse
      if (substitutionType === 'individual_to_team') {
        try {
          // Lade Einzelschützen-Ergebnisse vor dem angegebenen Durchgang
          const individualScoresQuery = query(
            collection(db, 'rwk_scores'),
            where('shooterId', '==', selectedReplacementShooter),
            where('competitionYear', '==', team.competitionYear),
            where('durchgang', '<', fromRound)
          );
          const individualScoresSnapshot = await getDocs(individualScoresQuery);
          
          if (!individualScoresSnapshot.empty) {
            // Übertrage Ergebnisse auf Team
            const batch = writeBatch(db);
            const transferredResults: any[] = [];
            
            individualScoresSnapshot.docs.forEach(scoreDoc => {
              const scoreData = scoreDoc.data();
              const newTeamScoreRef = doc(collection(db, 'rwk_scores'));
              
              const transferredScore = {
                ...scoreData,
                teamId: team.id,
                teamName: team.name,
                leagueId: team.leagueId,
                originalIndividualScoreId: scoreDoc.id,
                transferredAt: serverTimestamp(),
                transferredBy: userPermission.uid,
                scoreInputType: 'transferred' // Markiere als übertragen
              };
              
              batch.set(newTeamScoreRef, transferredScore);
              transferredResults.push({ id: scoreDoc.id, ...scoreData });
            });
            
            await batch.commit();
            substitution.transferredResults = transferredResults;
            

          } else {

          }
        } catch (transferError) {
          console.error('Error transferring individual scores:', transferError);
          throw new Error('Fehler beim Übertragen der Einzelschützen-Ergebnisse');
        }
      }

      // Speichere Substitution
      await addDoc(collection(db, 'team_substitutions'), {
        ...substitution,
        substitutionDate: serverTimestamp(),
        createdAt: serverTimestamp()
      });

      // Aktualisiere Team: Ersetze Schützen-ID
      const updatedShooterIds = team.shooterIds.map(id => 
        id === selectedOriginalShooter ? selectedReplacementShooter : id
      );

      await updateDoc(doc(db, 'rwk_teams', team.id), {
        shooterIds: updatedShooterIds
      });
      
      // Aktualisiere Schützen teamIds
      const shooterBatch = writeBatch(db);
      
      // Entferne Team-ID vom ursprünglichen Schützen
      const originalShooterRef = doc(db, 'shooters', selectedOriginalShooter);
      shooterBatch.update(originalShooterRef, {
        teamIds: arrayRemove(team.id)
      });
      
      // Füge Team-ID zum Ersatzschützen hinzu
      const replacementShooterRef = doc(db, 'shooters', selectedReplacementShooter);
      shooterBatch.update(replacementShooterRef, {
        teamIds: arrayUnion(team.id)
      });
      

      await shooterBatch.commit();

      const successMessage = substitutionType === 'individual_to_team' 
        ? `${replacementShooter.name} ersetzt ${originalShooter.name} ab DG${fromRound}. Ergebnisse wurden übertragen.`
        : `${replacementShooter.name} ersetzt ${originalShooter.name} ab DG${fromRound}.`;
      
      toast({
        title: 'Ersatzschütze hinzugefügt',
        description: successMessage
      });

      onSubstitutionCreated();
      onClose();
      resetForm();

    } catch (error) {
      console.error('Fehler beim Erstellen der Substitution:', error);
      toast({
        title: 'Fehler',
        description: 'Ersatzschütze konnte nicht hinzugefügt werden.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedOriginalShooter('');
    setSelectedReplacementShooter('');
    setFromRound(1);
    setSubstitutionType('new_shooter');
    setReason('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Users className="mr-2 h-5 w-5" />
            Ersatzschütze hinzufügen
          </DialogTitle>
          <DialogDescription>
            Mannschaft: {team.name}
          </DialogDescription>
        </DialogHeader>

        {isLoadingData ? (
          <div className="flex justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">Lade Schützen...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <Label htmlFor="originalShooter">Ausfallender Schütze *</Label>
              <Select value={selectedOriginalShooter} onValueChange={setSelectedOriginalShooter}>
                <SelectTrigger>
                  <SelectValue placeholder="Schütze auswählen" />
                </SelectTrigger>
                <SelectContent>
                  {currentShooters.map(shooter => (
                    <SelectItem key={shooter.id} value={shooter.id}>
                      <div className="flex items-center">
                        <UserCircle className="mr-2 h-4 w-4" />
                        {shooter.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="replacementShooter">Ersatzschütze *</Label>
              <Select value={selectedReplacementShooter} onValueChange={setSelectedReplacementShooter}>
                <SelectTrigger>
                  <SelectValue placeholder="Ersatzschütze auswählen" />
                </SelectTrigger>
                <SelectContent>
                  {availableShooters.map(shooter => (
                    <SelectItem key={shooter.id} value={shooter.id}>
                      <div className="flex items-center">
                        <UserCircle className="mr-2 h-4 w-4" />
                        {shooter.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {availableShooters.length === 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  Keine verfügbaren Schützen im Verein gefunden.
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="fromRound">Ab Durchgang *</Label>
              <Input
                type="number"
                min="1"
                max="5"
                value={fromRound}
                onChange={(e) => setFromRound(parseInt(e.target.value) || 1)}
                placeholder="z.B. 3"
              />
            </div>

            <div>
              <Label>Ersatztyp *</Label>
              <RadioGroup value={substitutionType} onValueChange={(value) => setSubstitutionType(value as any)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="new_shooter" id="new_shooter" />
                  <Label htmlFor="new_shooter" className="text-sm">
                    Neuer Schütze (alte Ergebnisse bleiben)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="individual_to_team" id="individual_to_team" />
                  <Label htmlFor="individual_to_team" className="text-sm">
                    Einzelschütze → Mannschaft (Ergebnisse übertragen)
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label htmlFor="reason">Grund *</Label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="z.B. Krankheit, Umzug, etc."
                rows={2}
              />
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <div className="flex items-start">
                <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 mr-2 flex-shrink-0" />
                <div className="text-xs text-amber-800">
                  <p className="font-medium mb-1">Wichtiger Hinweis:</p>
                  <p>
                    Der Ersatzschütze wird ab dem gewählten Durchgang in der Mannschaft geführt. 
                    Bereits vorhandene Ergebnisse werden je nach Typ behandelt.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={handleClose} disabled={isLoading}>
                Abbrechen
              </Button>
              <Button onClick={handleSubmit} disabled={isLoading}>
                {isLoading ? 'Wird hinzugefügt...' : 'Ersatzschütze hinzufügen'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
