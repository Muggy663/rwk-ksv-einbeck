"use client";

import { useState, useEffect } from "react";
import { logError, logWarn, logInfo, logDebug } from '@/lib/utils/secure-logger';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Users, Target, Trophy, Calendar, Mail } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { InviteToGroupDialog } from "@/components/social/InviteToGroupDialog";

interface UserProfile {
  id: string;
  displayName: string;
  email?: string;
  clubName?: string;
  isPublic: boolean;
  shareResults: boolean;
  availableForCompetitions: boolean;
  statistics?: {
    totalTrainings: number;
    totalCompetitions: number;
    favoriteDiscipline: string;
    bestResult: {
      discipline: string;
      score: number;
      date: Date;
    };
    recentActivity: Date;
  };
  lastActive: Date;
}

export default function ProfilePage({ params }: { params: { userId: string } }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, [params.userId]);

  const loadProfile = async () => {
    try {
      const { db } = await import('@/lib/firebase/config');
      const { doc, getDoc } = await import('firebase/firestore');
      
      const profileRef = doc(db, 'public_profiles', params.userId);
      const profileDoc = await getDoc(profileRef);
      
      if (profileDoc.exists()) {
        setProfile({ id: profileDoc.id, ...profileDoc.data() } as UserProfile);
      }
    } catch (error) {
      logError('Fehler beim Laden des Profils:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4 sm:p-6 max-w-4xl">
        <div className="text-center py-8">Lade Profil...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto p-4 sm:p-6 max-w-4xl">
        <Card>
          <CardContent className="p-8 text-center">
            <h3 className="text-lg font-semibold mb-2">Profil nicht gefunden</h3>
            <p className="text-muted-foreground mb-4">
              Dieses Profil existiert nicht oder ist nicht öffentlich.
            </p>
            <Button asChild>
              <Link href="/social/discover">Zurück zur Suche</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-4xl">
      <div className="mb-6">
        <Button asChild variant="ghost" className="mb-4">
          <Link href="/social/discover">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück zur Community
          </Link>
        </Button>
        
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-2">
          <div className="flex items-center gap-3">
            <Users className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 dark:text-blue-400" />
            <h1 className="text-2xl sm:text-3xl font-bold">{profile.displayName}</h1>
          </div>
          {profile.availableForCompetitions && (
            <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 w-fit">Verfügbar</Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profil-Info */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Profil-Informationen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Verein</div>
                <div className="font-medium">{profile.clubName || 'Nicht angegeben'}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Hauptdisziplin</div>
                <div className="font-medium">{profile.statistics?.favoriteDiscipline || 'Keine Daten'}</div>
              </div>
            </div>
            
            {profile.shareResults && profile.statistics && (
              <div className="pt-4 border-t">
                <h3 className="font-semibold mb-3">Leistungsstatistiken</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{profile.statistics.totalTrainings}</div>
                    <div className="text-sm text-muted-foreground">Trainings</div>
                  </div>
                  <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{profile.statistics.totalCompetitions}</div>
                    <div className="text-sm text-muted-foreground">Wettkämpfe</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">{profile.statistics.bestResult?.score || 0}</div>
                    <div className="text-sm text-muted-foreground">Beste Leistung</div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Aktionen */}
        <Card>
          <CardHeader>
            <CardTitle>Aktionen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-col gap-3">
              {profile.availableForCompetitions && (
                <Button className="w-full" onClick={() => {
                  const message = `Hallo ${profile.displayName}, möchten Sie an einem Wettkampf teilnehmen?`;
                  window.open(`mailto:${profile.email}?subject=Wettkampf-Einladung&body=${encodeURIComponent(message)}`);
                }}>
                  <Mail className="h-4 w-4 mr-2" />
                  Kontaktieren
                </Button>
              )}
              
              <InviteToGroupDialog targetUserId={profile.id} targetUserName={profile.displayName}>
                <Button variant="outline" className="w-full">
                  <Users className="h-4 w-4 mr-2" />
                  Zu Gruppe einladen
                </Button>
              </InviteToGroupDialog>
            </div>
            
            <div className="pt-3 border-t text-center">
              <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                Zuletzt aktiv: {new Date(profile.lastActive).toLocaleDateString('de-DE')}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}