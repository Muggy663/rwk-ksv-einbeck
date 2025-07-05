"use client";
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase/config';
import { doc, getDoc } from 'firebase/firestore';

interface Club {
  id: string;
  name: string;
}

export default function ClubSelectionPage() {
  const { user, userAppPermissions } = useAuth();
  const router = useRouter();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadClubs = async () => {
      if (!userAppPermissions?.representedClubs) {
        router.push('/verein/dashboard');
        return;
      }

      const clubData: Club[] = [];
      for (const clubId of userAppPermissions.representedClubs) {
        const clubDoc = await getDoc(doc(db, 'clubs', clubId));
        if (clubDoc.exists()) {
          clubData.push({ id: clubDoc.id, name: clubDoc.data().name });
        }
      }
      setClubs(clubData);
      setLoading(false);
    };

    if (userAppPermissions) {
      loadClubs();
    }
  }, [userAppPermissions, router]);

  const selectClub = (clubId: string) => {
    localStorage.setItem('currentClubId', clubId);
    router.push('/verein/dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Building2 className="h-6 w-6" />
            Verein auswählen
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-muted-foreground">
            Sie sind mehreren Vereinen zugeordnet. Bitte wählen Sie einen aus:
          </p>
          {clubs.map(club => (
            <Button
              key={club.id}
              onClick={() => selectClub(club.id)}
              variant="outline"
              className="w-full h-auto p-4 text-left"
            >
              <div>
                <div className="font-medium">{club.name}</div>
              </div>
            </Button>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}