"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { NativeSelect } from "@/components/ui/native-select";
import { ArrowLeft, Trophy, Clock, Users } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { DISZIPLINEN, getDisziplinConfig } from "@/types/schiessnachweis";

export default function CreateCompetitionPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [userGroups, setUserGroups] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    name: "",
    groupId: "",
    discipline: "",
    shotCount: "",
    timeLimit: "",
    allowLateJoin: true,
    showLiveResults: true
  });

  useEffect(() => {
    if (user) {
      loadUserGroups();
    }
  }, [user]);
  
  const loadUserGroups = async () => {
    if (!user) return;
    try {
      const { TrainingGroupsService } = await import('@/lib/services/training-groups-service');
      const groups = await TrainingGroupsService.getUserGroups(user.uid);
      setUserGroups(groups);
    } catch (error) {
      console.error('Error loading groups:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: "Fehler",
        description: "Bitte geben Sie einen Wettkampf-Namen ein.",
        variant: "destructive"
      });
      return;
    }

    if (!formData.groupId) {
      toast({
        title: "Fehler", 
        description: "Bitte wählen Sie eine Trainingsgruppe aus.",
        variant: "destructive"
      });
      return;
    }

    if (!formData.discipline) {
      toast({
        title: "Fehler",
        description: "Bitte wählen Sie eine Disziplin aus.",
        variant: "destructive"
      });
      return;
    }

    setIsCreating(true);
    
    try {
      const { LiveCompetitionService } = await import('@/lib/services/live-competition-service');
      
      if (!user) {
        throw new Error('Nicht angemeldet');
      }
      
      const competitionId = await LiveCompetitionService.createCompetition(user.uid, {
        name: formData.name,
        groupId: formData.groupId,
        discipline: formData.discipline,
        shotCount: parseInt(formData.shotCount),
        timeLimit: formData.timeLimit ? parseInt(formData.timeLimit) : undefined,
        allowLateJoin: formData.allowLateJoin,
        showLiveResults: formData.showLiveResults
      });
      
      toast({
        title: "Wettkampf erstellt!",
        description: `Live-Wettkampf "${formData.name}" wurde erfolgreich erstellt.`,
      });
      
      // Redirect zum Wettkampf
      window.location.href = `/live-competition/${competitionId}`;
    } catch (error: any) {
      toast({
        title: "Fehler",
        description: error.message || "Der Wettkampf konnte nicht erstellt werden.",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  const selectedDiscipline = getDisziplinConfig(formData.discipline);

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-2xl">
      <div className="mb-6">
        <Button asChild variant="ghost" className="mb-4">
          <Link href="/live-competition">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück zu Live-Wettkämpfen
          </Link>
        </Button>
        
        <div className="flex items-center gap-3 mb-2">
          <Trophy className="h-8 w-8 text-yellow-600" />
          <h1 className="text-3xl font-bold">Live-Wettkampf erstellen</h1>
        </div>
        <p className="text-muted-foreground">
          Erstellen Sie einen neuen Echtzeit-Wettkampf für Ihre Trainingsgruppe
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Wettkampf-Details</CardTitle>
            <CardDescription>
              Grundlegende Informationen über Ihren Live-Wettkampf
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Wettkampf-Name */}
            <div>
              <Label htmlFor="name">Wettkampf-Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="z.B. Luftgewehr Training Duell"
                required
              />
            </div>

            {/* Trainingsgruppe */}
            <div>
              <Label htmlFor="groupId">Trainingsgruppe *</Label>
              {userGroups.length > 0 ? (
                <NativeSelect
                  value={formData.groupId}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, groupId: value }))}
                  placeholder="Gruppe auswählen..."
                  options={userGroups.map(group => ({
                    value: group.id,
                    label: group.name
                  }))}
                />
              ) : (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-sm text-yellow-800">
                    Sie sind noch keiner Trainingsgruppe beigetreten.
                  </p>
                  <Button asChild variant="link" className="p-0 h-auto text-yellow-700">
                    <Link href="/training-groups">
                      Trainingsgruppe erstellen oder beitreten
                    </Link>
                  </Button>
                </div>
              )}
            </div>

            {/* Disziplin */}
            <div>
              <Label htmlFor="discipline">Disziplin *</Label>
              <NativeSelect
                value={formData.discipline}
                onValueChange={(value) => setFormData(prev => ({ ...prev, discipline: value }))}
                placeholder="Disziplin auswählen..."
                options={DISZIPLINEN.map(disziplin => ({
                  value: disziplin.name,
                  label: `${disziplin.name} (${disziplin.kategorie})`
                }))}
              />
            </div>

            {/* Schussanzahl */}
            {selectedDiscipline && (
              <div>
                <Label htmlFor="shotCount">Anzahl Schüsse *</Label>
                {selectedDiscipline.schussAnzahl.length > 1 ? (
                  <NativeSelect
                    value={formData.shotCount}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, shotCount: value }))}
                    placeholder="Schussanzahl wählen..."
                    options={selectedDiscipline.schussAnzahl.map(anzahl => ({
                      value: anzahl.toString(),
                      label: `${anzahl} Schuss`
                    }))}
                  />
                ) : (
                  <Input
                    id="shotCount"
                    type="number"
                    min="1"
                    max="200"
                    value={formData.shotCount}
                    onChange={(e) => setFormData(prev => ({ ...prev, shotCount: e.target.value }))}
                    placeholder={selectedDiscipline.schussAnzahl[0].toString()}
                  />
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Max. {selectedDiscipline.maxRinge} Ringe pro Schuss
                </p>
              </div>
            )}

            {/* Zeitlimit */}
            <div>
              <Label htmlFor="timeLimit">Zeitlimit (optional)</Label>
              <Input
                id="timeLimit"
                type="number"
                min="5"
                max="180"
                value={formData.timeLimit}
                onChange={(e) => setFormData(prev => ({ ...prev, timeLimit: e.target.value }))}
                placeholder="Minuten (leer = unbegrenzt)"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Automatischer Abschluss nach Ablauf der Zeit
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Wettkampf-Einstellungen
            </CardTitle>
            <CardDescription>
              Konfigurieren Sie die Regeln für Ihren Live-Wettkampf
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Spätes Beitreten */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="allowLateJoin">Spätes Beitreten erlauben</Label>
                <p className="text-xs text-muted-foreground">
                  Teilnehmer können auch nach dem Start noch beitreten
                </p>
              </div>
              <Switch
                id="allowLateJoin"
                checked={formData.allowLateJoin}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, allowLateJoin: checked }))}
              />
            </div>

            {/* Live-Ergebnisse */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="showLiveResults">Live-Ergebnisse anzeigen</Label>
                <p className="text-xs text-muted-foreground">
                  Rangliste wird in Echtzeit für alle Teilnehmer aktualisiert
                </p>
              </div>
              <Switch
                id="showLiveResults"
                checked={formData.showLiveResults}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, showLiveResults: checked }))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Erstellen Button */}
        <div className="flex flex-col sm:flex-row gap-3 mt-6">
          <Button 
            type="submit" 
            disabled={isCreating || !formData.name.trim() || !formData.groupId || !formData.discipline}
            className="flex items-center gap-2"
          >
            <Trophy className="h-4 w-4" />
            {isCreating ? 'Erstelle Wettkampf...' : 'Live-Wettkampf erstellen'}
          </Button>
          <Button asChild variant="outline">
            <Link href="/live-competition">
              Abbrechen
            </Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
