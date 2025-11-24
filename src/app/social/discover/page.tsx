'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Search, Users, Target, Trophy, Clock } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { InviteToGroupDialog } from '@/components/social/InviteToGroupDialog';
import { ReportButton } from '@/components/ui/report-button';

interface UserProfile {
  id: string;
  displayName: string;
  clubId?: string;
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

export default function DiscoverPage() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDiscipline, setSelectedDiscipline] = useState('');
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadProfiles();
    }
  }, [user]);

  const loadProfiles = async () => {
    try {
      const { SocialService } = await import('@/lib/services/social-service');
      const publicProfiles = await SocialService.searchPublicProfiles();
      setProfiles(publicProfiles.filter(p => p.id !== user?.uid));
    } catch (error) {
      console.error('Fehler beim Laden der Profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProfiles = profiles.filter(profile => {
    const matchesSearch = profile.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      profile.clubName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      profile.statistics?.favoriteDiscipline?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDiscipline = !selectedDiscipline || 
      profile.statistics?.favoriteDiscipline === selectedDiscipline;
    
    return matchesSearch && matchesDiscipline;
  });

  if (loading) {
    return (
      <div className="container mx-auto p-4 sm:p-6 max-w-4xl">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Clock className="h-8 w-8 mx-auto mb-2 animate-spin" />
            <p>Lade Community-Profile...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-4xl">
      <div className="mb-6">
        <Button asChild variant="ghost" className="mb-4">
          <Link href="/social">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück zu Social Training
          </Link>
        </Button>
        
        <div className="flex items-center gap-3 mb-2">
          <Search className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 dark:text-blue-400" />
          <h1 className="text-2xl sm:text-3xl font-bold">Community entdecken</h1>
        </div>
        <p className="text-muted-foreground">
          Finden Sie andere Schützen und Trainingspartner
        </p>
      </div>

      {/* Suchleiste */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                placeholder="Nach Namen, Verein suchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
              <select
                value={selectedDiscipline}
                onChange={(e) => setSelectedDiscipline(e.target.value)}
                className="px-3 py-2 border rounded-md bg-background"
              >
                <option value="">Alle Disziplinen</option>
                <option value="KK">Kleinkaliber</option>
                <option value="LG">Luftgewehr</option>
                <option value="LP">Luftpistole</option>
                <option value="GK">Großkaliber</option>
                <option value="Pistole">Pistole</option>
                <option value="Bogen">Bogen</option>
                <option value="Blasrohr">Blasrohr</option>
              </select>
            </div>
            <div className="text-xs text-muted-foreground">
              {filteredProfiles.length} von {profiles.length} Profilen gefunden
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile */}
      <div className="space-y-4">
        {filteredProfiles.map((profile) => (
          <Card key={profile.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                    <h3 className="font-semibold text-lg">{profile.displayName || 'Unbekannt'}</h3>
                    {profile.availableForCompetitions && (
                      <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 w-fit">
                        Verfügbar
                      </Badge>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Verein</div>
                      <div className="font-medium">{profile.clubName || 'Nicht angegeben'}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Hauptdisziplin</div>
                      <div className="font-medium">{profile.statistics?.favoriteDiscipline || 'Keine Daten'}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Bestes Ergebnis</div>
                      <div className="font-medium">{profile.statistics?.bestResult?.score || 0} Ringe</div>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Target className="h-3 w-3" />
                      {profile.statistics?.totalTrainings || 0} Trainings
                    </div>
                    <div className="flex items-center gap-1">
                      <Trophy className="h-3 w-3" />
                      {profile.statistics?.totalCompetitions || 0} Wettkämpfe
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-row sm:flex-col gap-2 w-full sm:w-auto sm:ml-4">
                  <Button asChild size="sm" variant="outline" className="flex-1 sm:flex-none">
                    <Link href={`/social/profile/${profile.id}`}>
                      Profil ansehen
                    </Link>
                  </Button>
                  {profile.availableForCompetitions && (
                    <InviteToGroupDialog targetUserId={profile.id} targetUserName={profile.displayName || 'Unbekannt'}>
                      <Button size="sm" variant="outline" className="flex-1 sm:flex-none">
                        <Users className="h-3 w-3 mr-1" />
                        Einladen
                      </Button>
                    </InviteToGroupDialog>
                  )}
                  <ReportButton 
                    targetType="profile" 
                    targetId={profile.id} 
                    targetName={profile.displayName}
                    size="sm"
                    variant="ghost"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProfiles.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Keine Profile gefunden</h3>
            <p className="text-muted-foreground">
              Versuchen Sie andere Suchbegriffe oder erweitern Sie Ihre Suche.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}