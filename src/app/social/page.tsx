"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Trophy, Search, Plus, Target } from "lucide-react";
import { PremiumBadge, PremiumFeatureWrapper } from "@/components/ui/premium-badge";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function SocialPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login?redirect=/social');
    }
  }, [user, loading, router]);

  if (loading) {
    return <div className="container mx-auto p-4 text-center">Laden...</div>;
  }

  if (!user) {
    return null;
  }
  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Social Training</h1>
        <p className="text-muted-foreground">
          Trainieren Sie gemeinsam mit anderen Schützen und nehmen Sie an Live-Wettkämpfen teil
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        


        {/* Mein Profil */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Mein Profil
            </CardTitle>
            <CardDescription>
              Verwalten Sie Ihre öffentliche Sichtbarkeit für andere Schützen
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="text-sm text-muted-foreground">
                <div className="mb-2">🔧 <strong>Profil-Einstellungen:</strong></div>
                <div>• Öffentliche Sichtbarkeit aktivieren/deaktivieren</div>
                <div>• Ergebnisse mit Community teilen</div>
                <div>• Verfügbarkeit für Wettkämpfe festlegen</div>
                <div>• Vereinszugehörigkeit anzeigen</div>
              </div>
              <Button asChild className="w-full">
                <Link href="/einstellungen">
                  Profil-Einstellungen
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Trainingsgruppen */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Trainingsgruppen
            </CardTitle>
            <CardDescription>
              Treten Sie bestehenden Gruppen bei oder erstellen Sie eigene (Premium)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 mb-3">
              <div className="text-sm text-yellow-800 dark:text-yellow-200">
                <div className="font-medium mb-1">💎 Premium (~3€/Monat):</div>
                <div>• <strong>Kostenlos:</strong> Gruppen beitreten, teilnehmen</div>
                <div>• <strong>Premium:</strong> Gruppen erstellen + Schießnachweis Cloud-Sync</div>
              </div>
            </div>
            <Button asChild variant="outline" className="w-full">
              <Link href="/training-groups">
                <Users className="h-4 w-4 mr-2" />
                Gruppenübersicht
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/training-groups/join">
                Gruppe beitreten (Code)
              </Link>
            </Button>
            <Button asChild className="w-full">
              <Link href="/training-groups/create">
                <Plus className="h-4 w-4 mr-2" />
                Neue Gruppe erstellen
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Live-Wettkämpfe */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-600" />
              Live-Wettkämpfe
              <PremiumBadge size="sm" />
            </CardTitle>
            <CardDescription>
              Erstellen Sie Echtzeit-Wettkämpfe (Premium erforderlich)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PremiumFeatureWrapper isPremium={false}>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground p-2 bg-yellow-50 rounded border border-yellow-200">
                  💎 <strong>Premium:</strong> Schießnachweis Cloud-Sync + Social Training Features (~3€/Monat)
                </div>
                <Button asChild className="w-full">
                  <Link href="/live-competition">
                    Wettkämpfe anzeigen
                  </Link>
                </Button>
              </div>
            </PremiumFeatureWrapper>
          </CardContent>
        </Card>

        {/* Öffentliche Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Community entdecken
            </CardTitle>
            <CardDescription>
              Finden Sie andere Schützen und Trainingspartner
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link href="/social/discover">
                Profile durchsuchen
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Statistiken */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Meine Statistiken
            </CardTitle>
            <CardDescription>
              Verfolgen Sie Ihren Fortschritt und Vergleiche
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild variant="outline" className="w-full">
              <Link href="/social/stats">
                Statistiken anzeigen
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/social/rankings">
                Ranglisten & Vergleiche
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Hilfe */}
        <Card>
          <CardHeader>
            <CardTitle>Erste Schritte</CardTitle>
            <CardDescription>
              Neu bei Social Training? Hier erfahren Sie mehr
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p>1. Profil öffentlich machen</p>
              <p>2. Trainingsgruppe erstellen/beitreten</p>
              <p>3. An Live-Wettkämpfen teilnehmen</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
