"use client";

import { useState } from "react";
import { logError, logDebug, getErrorMessage } from '@/lib/utils/secure-logger';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Users, Settings } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { TrainingGroupsService } from "@/lib/services/training-groups-service";

export default function CreateGroupPage() {
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    maxMembers: 10,
    allowCompetitions: true,
    publicResults: true,
    autoAcceptMembers: false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: "Fehler",
        description: "Bitte geben Sie einen Gruppennamen ein.",
        variant: "destructive"
      });
      return;
    }

    setIsCreating(true);
    
    try {
      logDebug('📎 Gruppen-Erstellung gestartet');
      
      const { auth } = await import('@/lib/firebase/config');
      
      if (!auth.currentUser) {
        throw new Error('Nicht angemeldet');
      }
      
      const groupId = await TrainingGroupsService.createGroup(auth.currentUser.uid, {
        name: formData.name.trim(),
        description: formData.description.trim(),
        maxMembers: formData.maxMembers,
        allowCompetitions: formData.allowCompetitions,
        publicResults: formData.publicResults,
        autoAcceptMembers: formData.autoAcceptMembers
      });
      
      toast({
        title: "Gruppe erstellt!",
        description: `Trainingsgruppe "${formData.name}" wurde erstellt.`,
      });
      
      // Redirect zur Gruppen-Übersicht
      window.location.href = '/training-groups';
    } catch (error) {
      logError('Fehler beim Erstellen der Gruppe:', error);
      toast({
        title: "Fehler",
        description: `Die Gruppe konnte nicht erstellt werden: ${getErrorMessage(error) || error}`,
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-2xl">
      <div className="mb-6">
        <Button asChild variant="ghost" className="mb-4">
          <Link href="/training-groups">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück zu Trainingsgruppen
          </Link>
        </Button>
        
        <div className="flex items-center gap-3 mb-2">
          <Users className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold">Trainingsgruppe erstellen</h1>
        </div>
        <p className="text-muted-foreground">
          Erstellen Sie eine neue Trainingsgruppe für gemeinsame Übungen und Wettkämpfe
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Gruppen-Details</CardTitle>
            <CardDescription>
              Grundlegende Informationen über Ihre Trainingsgruppe
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Gruppenname */}
            <div>
              <Label htmlFor="name">Gruppenname *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="z.B. Luftgewehr Training Einbeck"
                required
              />
            </div>

            {/* Beschreibung */}
            <div>
              <Label htmlFor="description">Beschreibung (optional)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Beschreiben Sie Ihre Trainingsgruppe..."
                rows={3}
              />
            </div>

            {/* Maximale Mitglieder */}
            <div>
              <Label htmlFor="maxMembers">Maximale Mitgliederzahl</Label>
              <Input
                id="maxMembers"
                type="number"
                min="2"
                max="50"
                value={formData.maxMembers}
                onChange={(e) => setFormData(prev => ({ ...prev, maxMembers: parseInt(e.target.value) || 10 }))}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Bis zu 50 Mitglieder möglich
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Gruppen-Einstellungen
            </CardTitle>
            <CardDescription>
              Konfigurieren Sie die Funktionen Ihrer Trainingsgruppe
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Live-Wettkämpfe erlauben */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="allowCompetitions">Live-Wettkämpfe erlauben</Label>
                <p className="text-xs text-muted-foreground">
                  Mitglieder können Echtzeit-Wettkämpfe erstellen
                </p>
              </div>
              <Switch
                id="allowCompetitions"
                checked={formData.allowCompetitions}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, allowCompetitions: checked }))}
              />
            </div>

            {/* Öffentliche Ergebnisse */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="publicResults">Öffentliche Ergebnisse</Label>
                <p className="text-xs text-muted-foreground">
                  Wettkampf-Ergebnisse sind für alle Gruppenmitglieder sichtbar
                </p>
              </div>
              <Switch
                id="publicResults"
                checked={formData.publicResults}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, publicResults: checked }))}
              />
            </div>

            {/* Automatische Aufnahme */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="autoAcceptMembers">Automatische Aufnahme</Label>
                <p className="text-xs text-muted-foreground">
                  Neue Mitglieder werden automatisch aufgenommen (ohne Bestätigung)
                </p>
              </div>
              <Switch
                id="autoAcceptMembers"
                checked={formData.autoAcceptMembers}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, autoAcceptMembers: checked }))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Erstellen Button */}
        <div className="flex flex-col sm:flex-row gap-3 mt-6">
          <Button 
            type="submit" 
            disabled={isCreating || !formData.name.trim()}
            className="flex items-center gap-2"
          >
            <Users className="h-4 w-4" />
            {isCreating ? 'Erstelle Gruppe...' : 'Trainingsgruppe erstellen'}
          </Button>
          <Button asChild variant="outline">
            <Link href="/training-groups">
              Abbrechen
            </Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
