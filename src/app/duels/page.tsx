"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Swords, Trophy, Clock, Users, Target, Plus } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { DuelService, Duel } from "@/lib/services/duel-service";
import { DuelCard } from "@/components/duels/DuelCard";
import { CreateDuelDialog } from "@/components/duels/CreateDuelDialog";
import { toast } from "@/hooks/use-toast";

export default function DuelsPage() {
  const { user } = useAuth();
  const [duels, setDuels] = useState<Duel[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadDuels();
    }
  }, [user]);

  const loadDuels = async () => {
    if (!user) return;
    
    try {
      const userDuels = await DuelService.getUserDuels(user.uid);
      setDuels(userDuels);
    } catch (error) {
      console.error('Fehler beim Laden der Duelle:', error);
      toast({
        title: "Fehler",
        description: "Duelle konnten nicht geladen werden.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptDuel = async (duelId: string) => {
    if (!user) return;
    
    try {
      await DuelService.acceptDuel(duelId, user.uid);
      toast({
        title: "Duell angenommen!",
        description: "Das Duell wurde erfolgreich angenommen."
      });
      loadDuels();
    } catch (error) {
      toast({
        title: "Fehler",
        description: error instanceof Error ? error.message : "Unbekannter Fehler",
        variant: "destructive"
      });
    }
  };

  const handleDeclineDuel = async (duelId: string) => {
    if (!user) return;
    
    try {
      await DuelService.declineDuel(duelId, user.uid);
      toast({
        title: "Duell abgelehnt",
        description: "Das Duell wurde abgelehnt."
      });
      loadDuels();
    } catch (error) {
      toast({
        title: "Fehler",
        description: error instanceof Error ? error.message : "Unbekannter Fehler",
        variant: "destructive"
      });
    }
  };

  const handleSubmitResult = (duelId: string) => {
    toast({
      title: "Ergebnis-Eingabe",
      description: "Ergebnis-Eingabe wird in Kürze verfügbar sein."
    });
  };



  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-6xl">
      <div className="mb-6">
        <Button asChild variant="ghost" className="mb-4">
          <Link href="/social">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück zu Social Training
          </Link>
        </Button>
        
        <div className="flex items-center gap-3 mb-2">
          <Swords className="h-8 w-8 text-red-600" />
          <h1 className="text-3xl font-bold">Duelle</h1>
        </div>
        <p className="text-muted-foreground">
          Fordern Sie andere Schützen zu 1vs1 Duellen heraus
        </p>
      </div>

      {/* Header mit Aktion */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Swords className="h-8 w-8" />
            Duelle
          </h1>
          <p className="text-muted-foreground mt-2">
            Fordern Sie andere Schützen zu spannenden Duellen heraus!
          </p>
        </div>
        
        <CreateDuelDialog onDuelCreated={loadDuels} />
      </div>

      {/* Statistiken */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm text-muted-foreground">Siege</p>
                <p className="text-2xl font-bold">
                  {duels.filter(d => d.winner === user?.uid).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Aktive Duelle</p>
                <p className="text-2xl font-bold">
                  {duels.filter(d => ['pending', 'accepted', 'active'].includes(d.status)).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Ausstehend</p>
                <p className="text-2xl font-bold">
                  {duels.filter(d => d.status === 'pending' && d.challengedId === user?.uid).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-muted-foreground">Gesamt</p>
                <p className="text-2xl font-bold">{duels.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Duelle-Tabs */}
      <Tabs defaultValue="active">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="active" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Aktive Duelle ({duels.filter(d => ['pending', 'accepted', 'active'].includes(d.status)).length})
          </TabsTrigger>
          <TabsTrigger value="finished" className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            Beendete Duelle ({duels.filter(d => ['finished', 'declined'].includes(d.status)).length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8">
              <Clock className="h-8 w-8 mx-auto mb-2 text-muted-foreground animate-spin" />
              <p>Lade Duelle...</p>
            </div>
          ) : duels.filter(d => ['pending', 'accepted', 'active'].includes(d.status)).length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Keine aktiven Duelle</h3>
                <p className="text-muted-foreground mb-4">
                  Starten Sie Ihr erstes Duell und fordern Sie andere Schützen heraus!
                </p>
                <CreateDuelDialog onDuelCreated={loadDuels} />
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {duels.filter(d => ['pending', 'accepted', 'active'].includes(d.status)).map((duel) => (
                <DuelCard 
                  key={duel.id} 
                  duel={duel} 
                  currentUserId={user?.uid || ''}
                  onAccept={handleAcceptDuel}
                  onDecline={handleDeclineDuel}
                  onSubmitResult={handleSubmitResult}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="finished" className="space-y-4">
          {duels.filter(d => ['finished', 'declined'].includes(d.status)).length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Keine beendeten Duelle</h3>
                <p className="text-muted-foreground">
                  Hier erscheinen Ihre abgeschlossenen Duelle.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {duels.filter(d => ['finished', 'declined'].includes(d.status)).map((duel) => (
                <DuelCard 
                  key={duel.id} 
                  duel={duel} 
                  currentUserId={user?.uid || ''}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
