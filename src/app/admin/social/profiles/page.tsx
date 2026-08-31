// src/app/admin/social/profiles/page.tsx
"use client";
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BackButton } from '@/components/ui/back-button';
import { User, Eye, EyeOff, Shield, AlertTriangle } from 'lucide-react';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { toast } from '@/hooks/use-toast';

interface PublicProfile {
  id: string;
  displayName: string;
  email: string;
  isPublic: boolean;
  createdAt: any;
  lastActive: any;
  groupsCount: number;
  competitionsCount: number;
  averageScore: number;
}

export default function AdminPublicProfilesPage() {
  const [profiles, setProfiles] = useState<PublicProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'user_profiles'),
      where('isPublic', '==', true)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const profilesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as PublicProfile[];
      
      setProfiles(profilesData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const toggleProfileVisibility = async (profileId: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'user_profiles', profileId), {
        isPublic: !currentStatus,
        updatedAt: new Date()
      });
      toast({
        title: "Profil-Sichtbarkeit geändert",
        description: `Profil ist jetzt ${!currentStatus ? 'öffentlich' : 'privat'}.`
      });
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Sichtbarkeit konnte nicht geändert werden.",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center mb-6">
          <BackButton className="mr-2" fallbackHref="/admin" />
          <h1 className="text-2xl font-bold">Öffentliche Profile verwalten</h1>
        </div>
        <div className="text-center py-8">Lade Profile...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center mb-6">
        <BackButton className="mr-2" fallbackHref="/admin" />
        <div>
          <h1 className="text-2xl font-bold">Öffentliche Profile verwalten</h1>
          <p className="text-muted-foreground">Verwaltung der öffentlichen Benutzerprofile</p>
        </div>
      </div>

      <div className="grid gap-4">
        {profiles.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <User className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Keine öffentlichen Profile vorhanden</p>
            </CardContent>
          </Card>
        ) : (
          profiles.map((profile) => (
            <Card key={profile.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      {profile.displayName}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {profile.email}
                    </p>
                  </div>
                  <Badge className={profile.isPublic ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                    {profile.isPublic ? 'Öffentlich' : 'Privat'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-sm">
                    <span className="text-muted-foreground">Gruppen:</span>
                    <div className="font-medium">{profile.groupsCount || 0}</div>
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Wettkämpfe:</span>
                    <div className="font-medium">{profile.competitionsCount || 0}</div>
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Ø Ergebnis:</span>
                    <div className="font-medium">{profile.averageScore?.toFixed(1) || 'N/A'}</div>
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Letzte Aktivität:</span>
                    <div className="font-medium">
                      {profile.lastActive?.toDate?.()?.toLocaleDateString() || 'Unbekannt'}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 flex-wrap">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleProfileVisibility(profile.id, profile.isPublic)}
                  >
                    {profile.isPublic ? (
                      <>
                        <EyeOff className="h-4 w-4 mr-1" />
                        Auf privat setzen
                      </>
                    ) : (
                      <>
                        <Eye className="h-4 w-4 mr-1" />
                        Öffentlich machen
                      </>
                    )}
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-orange-600 hover:text-orange-700"
                  >
                    <AlertTriangle className="h-4 w-4 mr-1" />
                    Melden
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}