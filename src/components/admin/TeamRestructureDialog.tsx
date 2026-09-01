// src/components/admin/TeamRestructureDialog.tsx
"use client";

import { useState, useEffect } from 'react';
import { logError } from '@/lib/utils/secure-logger';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase/config';
import {
  collection, getDocs, query, where, doc,
  writeBatch, serverTimestamp, addDoc, arrayRemove, arrayUnion, getDoc
} from 'firebase/firestore';
import type { Team, Shooter } from '@/types/rwk';
import { AlertCircle, ArrowRight, Users } from 'lucide-react';
import { getSeasonSpecificScoresCollection } from '@/lib/utils/collection-names';

interface ShooterAction {
  shooter: Shooter;
  targetTeamId: string; // 'einzelschuetze' | 'entfernen' | teamId
  selectedScores: Set<number>; // Durchgänge die übertragen werden sollen
  existingScores: { durchgang: number; totalRinge: number; scoreId: string }[];
}

interface TeamRestructureDialogProps {
  isOpen: boolean;
  onClose: () => void;
  sourceTeam: Team;
  allTeams: Team[]; // Alle Teams der Liga
  competitionYear: number;
  numRounds: number;
  onRestructured: () => void;
}

export function TeamRestructureDialog({
  isOpen,
  onClose,
  sourceTeam,
  allTeams,
  competitionYear,
  onRestructured,
}: TeamRestructureDialogProps) {
  const { toast } = useToast();
  const [shooterActions, setShooterActions] = useState<ShooterAction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [dissolveTeam, setDissolveTeam] = useState(false);

  useEffect(() => {
    if (isOpen && sourceTeam.id) {
      loadData();
    }
  }, [isOpen, sourceTeam.id]);

  const loadData = async () => {
    setIsLoadingData(true);
    try {
      if (!sourceTeam.shooterIds?.length) {
        setShooterActions([]);
        setIsLoadingData(false);
        return;
      }

      // Lade Schützen
      const shootersSnap = await getDocs(
        query(collection(db, 'shooters'), where('__name__', 'in', sourceTeam.shooterIds))
      );
      const shooters = shootersSnap.docs.map(d => ({ id: d.id, ...d.data() } as Shooter));

      // Lade bestehende Scores für jeden Schützen
      const actions: ShooterAction[] = [];
      for (const shooter of shooters) {
        let allScores: any[] = [];
        try {
          const col = getSeasonSpecificScoresCollection(competitionYear, sourceTeam.leagueType as any);
          const snap = await getDocs(query(
            collection(db, col),
            where('teamId', '==', sourceTeam.id),
            where('shooterId', '==', shooter.id),
            where('competitionYear', '==', competitionYear)
          ));
          allScores = snap.docs.map(d => ({ scoreId: d.id, ...d.data() }));
        } catch {
          const snap = await getDocs(query(
            collection(db, 'rwk_scores'),
            where('teamId', '==', sourceTeam.id),
            where('shooterId', '==', shooter.id),
            where('competitionYear', '==', competitionYear)
          ));
          allScores = snap.docs.map(d => ({ scoreId: d.id, ...d.data() }));
        }

        const existingScores = allScores.map(s => ({
          durchgang: s.durchgang,
          totalRinge: s.totalRinge,
          scoreId: s.scoreId,
        })).sort((a, b) => a.durchgang - b.durchgang);

        actions.push({
          shooter,
          targetTeamId: 'entfernen',
          selectedScores: new Set(existingScores.map(s => s.durchgang)),
          existingScores,
        });
      }
      setShooterActions(actions);
    } catch (err) {
      logError('Fehler beim Laden:', err);
      toast({ title: 'Fehler', description: 'Daten konnten nicht geladen werden.', variant: 'destructive' });
    } finally {
      setIsLoadingData(false);
    }
  };

  const updateAction = (shooterId: string, field: keyof ShooterAction, value: any) => {
    setShooterActions(prev => prev.map(a =>
      a.shooter.id === shooterId ? { ...a, [field]: value } : a
    ));
  };

  const toggleScore = (shooterId: string, durchgang: number) => {
    setShooterActions(prev => prev.map(a => {
      if (a.shooter.id !== shooterId) return a;
      const newSelected = new Set(a.selectedScores);
      if (newSelected.has(durchgang)) newSelected.delete(durchgang);
      else newSelected.add(durchgang);
      return { ...a, selectedScores: newSelected };
    }));
  };

  const handleExecute = async () => {
    setIsLoading(true);
    try {
      const batch = writeBatch(db);
      let col: string;
      try {
        col = getSeasonSpecificScoresCollection(competitionYear, sourceTeam.leagueType as any);
      } catch {
        col = 'rwk_scores';
      }

      for (const action of shooterActions) {
        const { shooter, targetTeamId, selectedScores, existingScores } = action;

        if (targetTeamId === 'entfernen') {
          // Schütze wird einfach aus dem Team entfernt, Scores bleiben
          // Substitutions-Eintrag: "ersetzt" ab DG nach letztem vorhandenen Score
          const lastDg = existingScores.length > 0
            ? Math.max(...existingScores.map(s => s.durchgang))
            : 1;
          await addDoc(collection(db, 'team_substitutions'), {
            teamId: sourceTeam.id,
            teamName: sourceTeam.name,
            leagueId: sourceTeam.leagueId,
            competitionYear,
            originalShooterId: shooter.id,
            originalShooterName: shooter.firstName && shooter.lastName
              ? `${shooter.firstName} ${shooter.lastName}` : shooter.name,
            replacementShooterId: shooter.id, // selbst als Platzhalter
            replacementShooterName: '—',
            fromRound: lastDg + 1,
            type: 'replaced_shooter',
            reason: 'Mannschaftsumbau',
            createdByUserId: 'admin',
            createdByUserName: 'Admin',
            substitutionDate: serverTimestamp(),
            createdAt: serverTimestamp(),
          });
          // Schütze aus Team entfernen
          batch.update(doc(db, 'rwk_teams', sourceTeam.id), {
            shooterIds: arrayRemove(shooter.id)
          });
          batch.update(doc(db, 'shooters', shooter.id), {
            teamIds: arrayRemove(sourceTeam.id)
          });

        } else if (targetTeamId === 'einzelschuetze') {
          // Neue Einzelschützen-Mannschaft anlegen
          const newTeamRef = doc(collection(db, 'rwk_teams'));
          const shooterName = shooter.firstName && shooter.lastName
            ? `${shooter.firstName} ${shooter.lastName}` : shooter.name;
          batch.set(newTeamRef, {
            name: `${shooterName} (Einzel)`,
            clubId: sourceTeam.clubId,
            leagueId: sourceTeam.leagueId,
            leagueType: sourceTeam.leagueType,
            seasonId: sourceTeam.seasonId,
            competitionYear,
            shooterIds: [shooter.id],
            createdAt: serverTimestamp(),
            teamSize: 'einzel',
          });

          // Ausgewählte Scores auf neues Team übertragen
          for (const score of existingScores) {
            if (!selectedScores.has(score.durchgang)) continue;
            const newScoreRef = doc(collection(db, col));
            // Lade originalen Score für alle Felder
            const origRef = doc(db, col, score.scoreId);
            const origSnap = await getDoc(origRef);
            if (origSnap.exists()) {
              batch.set(newScoreRef, {
                ...origSnap.data(),
                teamId: newTeamRef.id,
                teamName: `${shooterName} (Einzel)`,
                transferredFrom: sourceTeam.id,
                transferredAt: serverTimestamp(),
                scoreInputType: 'transferred',
              });
            }
          }

          // Schütze aus altem Team entfernen, in neuem Team eintragen
          batch.update(doc(db, 'rwk_teams', sourceTeam.id), {
            shooterIds: arrayRemove(shooter.id)
          });
          batch.update(doc(db, 'shooters', shooter.id), {
            teamIds: arrayRemove(sourceTeam.id)
          });
          batch.update(doc(db, 'shooters', shooter.id), {
            teamIds: arrayUnion(newTeamRef.id)
          });

        } else {
          // Schütze in bestehendes Team verschieben
          const targetTeam = allTeams.find(t => t.id === targetTeamId);
          if (!targetTeam) continue;

          // Ausgewählte Scores auf Ziel-Team übertragen
          for (const score of existingScores) {
            if (!selectedScores.has(score.durchgang)) continue;
            const newScoreRef = doc(collection(db, col));
            const origRef = doc(db, col, score.scoreId);
            const origSnap = await getDoc(origRef);
            if (origSnap.exists()) {
              batch.set(newScoreRef, {
                ...origSnap.data(),
                teamId: targetTeamId,
                teamName: targetTeam.name,
                leagueId: targetTeam.leagueId,
                transferredFrom: sourceTeam.id,
                transferredAt: serverTimestamp(),
                scoreInputType: 'transferred',
              });
            }
          }

          // Substitutions-Eintrag
          const fromDg = selectedScores.size > 0 ? Math.min(...Array.from(selectedScores)) : 1;
          await addDoc(collection(db, 'team_substitutions'), {
            teamId: targetTeamId,
            teamName: targetTeam.name,
            leagueId: targetTeam.leagueId,
            competitionYear,
            originalShooterId: shooter.id,
            originalShooterName: shooter.firstName && shooter.lastName
              ? `${shooter.firstName} ${shooter.lastName}` : shooter.name,
            replacementShooterId: shooter.id,
            replacementShooterName: shooter.firstName && shooter.lastName
              ? `${shooter.firstName} ${shooter.lastName}` : shooter.name,
            fromRound: fromDg,
            type: 'individual_to_team',
            reason: 'Mannschaftsumbau',
            createdByUserId: 'admin',
            createdByUserName: 'Admin',
            substitutionDate: serverTimestamp(),
            createdAt: serverTimestamp(),
          });

          // Schütze in neues Team verschieben
          batch.update(doc(db, 'rwk_teams', sourceTeam.id), {
            shooterIds: arrayRemove(shooter.id)
          });
          batch.update(doc(db, 'rwk_teams', targetTeamId), {
            shooterIds: arrayUnion(shooter.id)
          });
          batch.update(doc(db, 'shooters', shooter.id), {
            teamIds: arrayRemove(sourceTeam.id)
          });
          batch.update(doc(db, 'shooters', shooter.id), {
            teamIds: arrayUnion(targetTeamId)
          });
        }
      }

      // Mannschaft auflösen (außer Konkurrenz setzen)
      if (dissolveTeam) {
        batch.update(doc(db, 'rwk_teams', sourceTeam.id), {
          outOfCompetition: true,
          outOfCompetitionReason: 'Mannschaft aufgelöst',
          shooterIds: [],
        });
      }

      await batch.commit();

      toast({
        title: '✅ Umbau abgeschlossen',
        description: `${shooterActions.length} Schütze(n) wurden neu zugeordnet.`,
      });
      onRestructured();
      onClose();
    } catch (err) {
      logError('Fehler beim Umbau:', err);
      toast({ title: 'Fehler', description: 'Der Umbau konnte nicht abgeschlossen werden.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

        const targetTeamOptions = allTeams.filter(t =>
          t.id !== sourceTeam.id &&
          t.leagueType === sourceTeam.leagueType // Gleiche Disziplin
        ).map(t => ({
          ...t,
          isFull: (t.shooterIds?.length || 0) >= 3,
        }));
  const shooterDisplayName = (s: Shooter) =>
    s.firstName && s.lastName ? `${s.firstName} ${s.lastName}` : s.name;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Mannschaft umbauen: {sourceTeam.name}
          </DialogTitle>
          <DialogDescription>
            Ordne Schützen neu zu und übertrage selektiv Ergebnisse.
          </DialogDescription>
        </DialogHeader>

        {isLoadingData ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : (
          <div className="space-y-5">
            {shooterActions.length === 0 && (
              <p className="text-muted-foreground text-center py-4">Keine Schützen in dieser Mannschaft.</p>
            )}

            {shooterActions.map((action) => (
              <div key={action.shooter.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-medium">{shooterDisplayName(action.shooter)}</div>
                  <Badge variant="outline">
                    {action.shooter.gender === 'male' ? 'M' : action.shooter.gender === 'female' ? 'W' : '?'}
                    {action.shooter.birthYear ? ` • ${action.shooter.birthYear}` : ''}
                  </Badge>
                </div>

                {/* Ziel auswählen */}
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Wohin?</Label>
                  <Select
                    value={action.targetTeamId}
                    onValueChange={(v) => updateAction(action.shooter.id, 'targetTeamId', v)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="entfernen">
                        🚫 Aus Mannschaft entfernen (bleibt in Tabelle mit —)
                      </SelectItem>
                      <SelectItem value="einzelschuetze">
                        👤 Neue Einzelschützen-Mannschaft
                      </SelectItem>
                      {targetTeamOptions.map(t => (
                        <SelectItem key={t.id} value={t.id}>
                          <div className="flex items-center gap-2">
                            <ArrowRight className="h-3 w-3" />
                            {t.name}
                            <span className="text-xs text-muted-foreground">
                              ({t.shooterIds?.length || 0}/3)
                            </span>
                            {t.isFull && (
                              <span className="text-xs text-orange-600">⚠ voll</span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Ergebnisse auswählen (nur wenn Ziel nicht "entfernen") */}
                {action.targetTeamId !== 'entfernen' && action.existingScores.length > 0 && (
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Ergebnisse übertragen:</Label>
                    <div className="flex flex-wrap gap-2">
                      {action.existingScores.map(score => (
                        <label
                          key={score.durchgang}
                          className="flex items-center gap-1.5 cursor-pointer bg-muted rounded px-2 py-1 text-sm"
                        >
                          <Checkbox
                            checked={action.selectedScores.has(score.durchgang)}
                            onCheckedChange={() => toggleScore(action.shooter.id, score.durchgang)}
                          />
                          DG{score.durchgang}: <span className="font-medium">{score.totalRinge}</span>
                        </label>
                      ))}
                    </div>
                    {action.existingScores.length === 0 && (
                      <p className="text-xs text-muted-foreground">Keine Ergebnisse vorhanden.</p>
                    )}
                  </div>
                )}

                {action.targetTeamId === 'entfernen' && (
                  <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 rounded p-2 text-xs text-amber-800 dark:text-amber-200 flex gap-2">
                    <AlertCircle className="h-3 w-3 mt-0.5 shrink-0" />
                    Schütze bleibt in der Tabelle — offene Durchgänge werden als — angezeigt.
                  </div>
                )}
              </div>
            ))}

            {/* Mannschaft auflösen */}
            <div className="border rounded-lg p-4 bg-red-50 dark:bg-red-950/20 border-red-200">
              <label className="flex items-center gap-3 cursor-pointer">
                <Checkbox
                  checked={dissolveTeam}
                  onCheckedChange={(v) => setDissolveTeam(v === true)}
                />
                <div>
                  <div className="font-medium text-red-800 dark:text-red-200">Mannschaft auflösen</div>
                  <div className="text-xs text-red-700 dark:text-red-300">
                    Setzt die Mannschaft auf "Außer Konkurrenz" — bisherige Ergebnisse bleiben sichtbar.
                  </div>
                </div>
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={onClose} disabled={isLoading}>
                Abbrechen
              </Button>
              <Button
                onClick={handleExecute}
                disabled={isLoading || shooterActions.length === 0}
                className="bg-primary"
              >
                {isLoading ? 'Wird ausgeführt...' : 'Umbau ausführen'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
