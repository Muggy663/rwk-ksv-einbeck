"use client";
import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useClubContext } from '@/contexts/ClubContext';

export default function ClubSelectionPage() {
  const router = useRouter();
  // Vereine + aktiver Verein kommen aus der Single Source of Truth.
  const { representedClubs: clubs, isLoading: loading, setActiveClubId } = useClubContext();

  // Bei höchstens einem Verein gibt es nichts auszuwählen → zurück ins Dashboard.
  useEffect(() => {
    if (!loading && clubs.length <= 1) {
      router.push('/verein/dashboard');
    }
  }, [loading, clubs.length, router]);

  const selectClub = (clubId: string) => {
    setActiveClubId(clubId);
    // Full reload, damit alle Kontexte den neuen aktiven Verein übernehmen.
    window.location.href = '/verein/dashboard';
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
