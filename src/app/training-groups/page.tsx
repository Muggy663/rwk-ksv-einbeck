"use client";

import { useState, useEffect } from "react";
import { logError } from '@/lib/utils/secure-logger';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, Plus, Search, ArrowLeft, Crown, Calendar } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { TrainingGroupsService } from "@/lib/services/training-groups-service";
import { TrainingGroup } from "@/types/social";
import { usePullToRefresh, ScrollToTopButton, SwipeRow } from "@/components/ui/mobile-enhancements";

import { ReportButton } from "@/components/ui/report-button";

export default function TrainingGroupsPage() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [myGroups, setMyGroups] = useState<TrainingGroup[]>([]);
  const [publicGroups, setPublicGroups] = useState<TrainingGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  
  usePullToRefresh(async () => {
    await loadMyGroups();
  });

  useEffect(() => {
    if (user) {
      loadMyGroups();
    }
  }, [user]);

  const loadMyGroups = async () => {
    if (!user) return;
    try {
      const groups = await TrainingGroupsService.getUserGroups(user.uid);
      setMyGroups(groups);
    } catch (error) {
      logError('Error loading groups:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const searchPublicGroups = async () => {
    if (!searchTerm.trim()) return;
    
    setSearching(true);
    try {
      // Suche in allen Gruppen nach Namen
      const { collection, query, where, getDocs } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase/config');
      
      const groupsRef = collection(db, 'training_groups');
      const q = query(groupsRef, where('isActive', '==', true));
      const snapshot = await getDocs(q);
      
      const allGroups = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as TrainingGroup));
      
      // Client-seitige Filterung nach Suchbegriff
      const filtered = allGroups.filter(group => 
        group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        group.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      setPublicGroups(filtered);
    } catch (error) {
      logError('Error searching groups:', error);
    } finally {
      setSearching(false);
    }
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
        
        <h1 className="text-3xl font-bold mb-2">Trainingsgruppen</h1>
        <p className="text-muted-foreground">
          Erstellen Sie neue Gruppen oder treten Sie bestehenden bei
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Neue Gruppe erstellen */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Neue Gruppe erstellen
            </CardTitle>
            <CardDescription>
              Starten Sie Ihre eigene Trainingsgruppe
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/training-groups/create">
                Gruppe erstellen
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Gruppe beitreten */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Gruppe beitreten
            </CardTitle>
            <CardDescription>
              Treten Sie einer bestehenden Gruppe bei
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full" variant="outline">
              <Link href="/training-groups/join">
                Mit Code beitreten
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Gruppen suchen */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Gruppen durchsuchen
            </CardTitle>
            <CardDescription>
              Finden Sie öffentliche Trainingsgruppen
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <Label htmlFor="search">Gruppenname suchen</Label>
                <Input
                  id="search"
                  placeholder="z.B. Luftgewehr Training..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button 
                className="w-full" 
                onClick={searchPublicGroups}
                disabled={!searchTerm.trim() || searching}
              >
                {searching ? 'Suche...' : 'Gruppen suchen'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Meine Gruppen */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Meine Gruppen</h2>
        
        {loading ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p>Lade Gruppen...</p>
            </CardContent>
          </Card>
        ) : myGroups.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Noch keine Gruppen</h3>
              <p className="text-muted-foreground mb-4">
                Sie sind noch keiner Trainingsgruppe beigetreten. Erstellen Sie eine neue Gruppe oder treten Sie einer bestehenden bei.
              </p>
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <Button asChild>
                  <Link href="/training-groups/create">
                    Erste Gruppe erstellen
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/training-groups/join">
                    Gruppe beitreten
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myGroups.map((group) => (
              <SwipeRow 
                key={group.id}
                onSwipeLeft={() => navigator.clipboard.writeText(group.joinCode)}
                rightAction={<span>Code kopieren</span>}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="truncate">{group.name}</span>
                      {group.admins?.includes(user?.uid || '') && (
                        <Crown className="h-4 w-4 text-yellow-500" />
                      )}
                    </CardTitle>
                    <CardDescription className="line-clamp-2">
                      {group.description || 'Keine Beschreibung'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span>{group.members?.length || 0} / {group.maxMembers} Mitglieder</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>Code: {group.joinCode}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button asChild className="flex-1" variant="outline">
                        <Link href={`/training-groups/${group.id}`}>
                          Öffnen
                        </Link>
                      </Button>
                      <ReportButton 
                        targetType="group" 
                        targetId={group.id} 
                        targetName={group.name}
                        size="sm"
                        variant="ghost"
                      />
                    </div>
                  </CardContent>
                </Card>
              </SwipeRow>
            ))}
          </div>
        )}
      </div>
      
      {/* Suchergebnisse */}
      {publicGroups.length > 0 && (
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Suchergebnisse</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {publicGroups.map((group) => (
              <Card key={group.id}>
                <CardHeader>
                  <CardTitle className="truncate">{group.name}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {group.description || 'Keine Beschreibung'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span>{group.members?.length || 0} / {group.maxMembers} Mitglieder</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>Code: {group.joinCode}</span>
                    </div>
                  </div>
                  <Button 
                    className="w-full mt-4" 
                    variant="outline"
                    onClick={() => window.navigator.clipboard.writeText(group.joinCode)}
                  >
                    Code kopieren
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
      <ScrollToTopButton />
    </div>
  );
}
