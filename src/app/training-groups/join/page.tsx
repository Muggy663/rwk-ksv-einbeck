"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Users, Hash } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";

export default function JoinGroupPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [joinCode, setJoinCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!joinCode.trim() || joinCode.length !== 6) {
      toast({
        title: "Ungültiger Code",
        description: "Bitte geben Sie einen 6-stelligen Gruppen-Code ein.",
        variant: "destructive"
      });
      return;
    }

    setIsJoining(true);
    
    try {
      const { TrainingGroupsService } = await import('@/lib/services/training-groups-service');
      
      if (!user) {
        throw new Error('Nicht angemeldet');
      }
      
      console.log('🔍 Joining group with code:', joinCode);
      const groupId = await TrainingGroupsService.joinGroup(user.uid, joinCode);
      console.log('✅ Joined group:', groupId);
      
      toast({
        title: "Erfolgreich beigetreten!",
        description: `Sie sind der Trainingsgruppe beigetreten.`,
      });
      
      // Redirect zur Gruppen-Seite
      window.location.href = `/training-groups/${groupId}`;
    } catch (error: any) {
      console.error('❌ Join error:', error);
      toast({
        title: "Fehler",
        description: "Der Gruppen-Code ist ungültig oder die Gruppe existiert nicht.",
        variant: "destructive"
      });
    } finally {
      setIsJoining(false);
    }
  };

  const formatJoinCode = (value: string) => {
    // Nur Buchstaben und Zahlen, max 6 Zeichen, Großbuchstaben
    const cleaned = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 6);
    setJoinCode(cleaned);
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
          <Users className="h-8 w-8 text-green-600" />
          <h1 className="text-3xl font-bold">Trainingsgruppe beitreten</h1>
        </div>
        <p className="text-muted-foreground">
          Treten Sie einer bestehenden Trainingsgruppe mit einem 6-stelligen Code bei
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Hash className="h-5 w-5" />
              Gruppen-Code eingeben
            </CardTitle>
            <CardDescription>
              Geben Sie den 6-stelligen Code ein, den Sie vom Gruppen-Administrator erhalten haben
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Gruppen-Code */}
            <div>
              <Label htmlFor="joinCode">Gruppen-Code *</Label>
              <Input
                id="joinCode"
                value={joinCode}
                onChange={(e) => formatJoinCode(e.target.value)}
                placeholder="ABC123"
                className="text-center text-2xl font-mono tracking-widest"
                maxLength={6}
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Der Code besteht aus 6 Buchstaben und Zahlen (z.B. ABC123)
              </p>
            </div>

            {/* Beispiel */}
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <h4 className="text-sm font-semibold text-blue-900 mb-2">
                💡 So funktioniert's:
              </h4>
              <ul className="text-xs text-blue-800 space-y-1">
                <li>• Lassen Sie sich den Gruppen-Code vom Administrator geben</li>
                <li>• Geben Sie den 6-stelligen Code hier ein</li>
                <li>• Nach dem Beitritt können Sie an Trainings und Wettkämpfen teilnehmen</li>
                <li>• Sie können die Gruppe jederzeit wieder verlassen</li>
              </ul>
            </div>

            {/* Beitreten Button */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                type="submit" 
                disabled={isJoining || joinCode.length !== 6}
                className="flex items-center gap-2"
              >
                <Users className="h-4 w-4" />
                {isJoining ? 'Trete bei...' : 'Gruppe beitreten'}
              </Button>
              <Button asChild variant="outline">
                <Link href="/training-groups">
                  Abbrechen
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>

      {/* Alternative Optionen */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Keine Gruppe gefunden?</CardTitle>
          <CardDescription>
            Weitere Möglichkeiten, einer Trainingsgruppe beizutreten
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button asChild variant="outline" className="w-full">
            <Link href="/training-groups/create">
              Eigene Gruppe erstellen
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/social/discover">
              Öffentliche Profile durchsuchen
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
