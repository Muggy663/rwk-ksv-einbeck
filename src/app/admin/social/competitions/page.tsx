// src/app/admin/social/competitions/page.tsx
"use client";
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BackButton } from '@/components/ui/back-button';
import { Trophy, Users, Clock, AlertTriangle, Play, Pause, Square } from 'lucide-react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { toast } from '@/hooks/use-toast';

interface LiveCompetition {
  id: string;
  name: string;
  groupId: string;
  groupName: string;
  status: 'active' | 'paused' | 'finished';
  createdAt: any;
  createdBy: string;
  participants: number;
  rounds: number;
  currentRound: number;
}

export default function AdminLiveCompetitionsPage() {
  const [competitions, setCompetitions] = useState<LiveCompetition[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'live_competitions'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const competitionsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as LiveCompetition[];
      
      setCompetitions(competitionsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleStatusChange = async (competitionId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'live_competitions', competitionId), {
        status: newStatus,
        updatedAt: new Date()
      });
      toast({
        title: "Status geändert",
        description: `Wettkampf-Status wurde auf "${newStatus}" gesetzt.`
      });
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Status konnte nicht geändert werden.",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Aktiv</Badge>;
      case 'paused':
        return <Badge className="bg-yellow-100 text-yellow-800">Pausiert</Badge>;
      case 'finished':
        return <Badge className="bg-gray-100 text-gray-800">Beendet</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center mb-6">
          <BackButton className="mr-2" fallbackHref="/admin" />
          <h1 className="text-2xl font-bold">Live-Wettkämpfe verwalten</h1>
        </div>
        <div className="text-center py-8">Lade Wettkämpfe...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center mb-6">
        <BackButton className="mr-2" fallbackHref="/admin" />
        <div>
          <h1 className="text-2xl font-bold">Live-Wettkämpfe verwalten</h1>
          <p className="text-muted-foreground">Überwachung und Verwaltung aller Live-Wettkämpfe</p>
        </div>
      </div>

      <div className="grid gap-4">
        {competitions.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Trophy className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Keine Live-Wettkämpfe vorhanden</p>
            </CardContent>
          </Card>
        ) : (
          competitions.map((competition) => (
            <Card key={competition.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Trophy className="h-5 w-5" />
                      {competition.name}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Gruppe: {competition.groupName}
                    </p>
                  </div>
                  {getStatusBadge(competition.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{competition.participants} Teilnehmer</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Runde {competition.currentRound}/{competition.rounds}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Erstellt: {competition.createdAt?.toDate?.()?.toLocaleDateString() || 'Unbekannt'}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    ID: {competition.id.slice(0, 8)}...
                  </div>
                </div>

                <div className="flex gap-2 flex-wrap">
                  {competition.status === 'active' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStatusChange(competition.id, 'paused')}
                    >
                      <Pause className="h-4 w-4 mr-1" />
                      Pausieren
                    </Button>
                  )}
                  
                  {competition.status === 'paused' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStatusChange(competition.id, 'active')}
                    >
                      <Play className="h-4 w-4 mr-1" />
                      Fortsetzen
                    </Button>
                  )}
                  
                  {competition.status !== 'finished' && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleStatusChange(competition.id, 'finished')}
                    >
                      <Square className="h-4 w-4 mr-1" />
                      Beenden
                    </Button>
                  )}
                  
                  {competition.status === 'finished' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStatusChange(competition.id, 'active')}
                    >
                      <Play className="h-4 w-4 mr-1" />
                      Reaktivieren
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}