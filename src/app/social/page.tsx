"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Trophy, Search, Plus, Target } from "lucide-react";
import { PremiumBadge, PremiumFeatureWrapper } from "@/components/ui/premium-badge";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { OnboardingWizard } from "@/components/social/OnboardingWizard";

export default function SocialPage() {
  const { user: rwkUser, loading: rwkLoading } = useAuth();
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [firebaseLoading, setFirebaseLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkFirebaseAuth = async () => {
      try {
        const { auth } = await import('@/lib/firebase/config');
        const unsubscribe = auth.onAuthStateChanged((user) => {
          setFirebaseUser(user);
          setFirebaseLoading(false);
        });
        return unsubscribe;
      } catch (error) {
        setFirebaseLoading(false);
      }
    };
    checkFirebaseAuth();
  }, []);

  const isAuthenticated = rwkUser || firebaseUser;
  const isLoading = rwkLoading || firebaseLoading;

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/schiessnachweis/login?redirect=/social');
    } else if (isAuthenticated && (rwkUser || firebaseUser)) {
      checkOnboardingStatus();
    }
  }, [isAuthenticated, isLoading, router, rwkUser, firebaseUser]);

  const checkOnboardingStatus = async () => {
    const currentUser = rwkUser || firebaseUser;
    if (!currentUser) return;
    
    try {
      const { db } = await import('@/lib/firebase/config');
      const { doc, getDoc } = await import('firebase/firestore');
      
      // Check both collections for onboarding status
      const userPermissionsRef = doc(db, 'user_permissions', currentUser.uid);
      const socialProfileRef = doc(db, 'social_profiles', currentUser.uid);
      
      const [userDoc, socialDoc] = await Promise.all([
        getDoc(userPermissionsRef),
        getDoc(socialProfileRef)
      ]);
      
      const hasOnboarding = (userDoc.exists() && userDoc.data()?.onboardingCompleted) ||
                           (socialDoc.exists() && socialDoc.data()?.onboardingCompleted);
      
      if (!hasOnboarding) {
        setNeedsOnboarding(true);
      }
    } catch (error) {
      console.error('Fehler beim Prüfen des Onboarding-Status:', error);
    } finally {
      setCheckingOnboarding(false);
    }
  };

  const handleOnboardingComplete = () => {
    setNeedsOnboarding(false);
  };

  if (isLoading || checkingOnboarding) {
    return <div className="container mx-auto p-4 text-center">Laden...</div>;
  }

  if (needsOnboarding) {
    return <OnboardingWizard onComplete={handleOnboardingComplete} />;
  }

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto p-4 sm:p-6 max-w-4xl text-center">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">Social Training</h1>
          <p className="text-muted-foreground mb-6">
            Trainieren Sie gemeinsam mit anderen Schützen und nehmen Sie an Live-Wettkämpfen teil
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-blue-800 mb-2">🔐 Anmeldung erforderlich</h2>
            <p className="text-blue-700 mb-4">
              Für Social Training benötigen Sie einen kostenlosen Account. 
              Dieser ist der gleiche wie für den Schießnachweis.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild size="lg">
                <Link href="/schiessnachweis/login?redirect=/social">
                  Jetzt anmelden oder registrieren
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/social/welcome">
                  Was ist Social Training?
                </Link>
              </Button>
            </div>
          </div>
          <div className="text-sm text-muted-foreground space-y-2">
            <p>
              💡 <strong>Hinweis:</strong> Dies ist ein anderer Login als für RWK/KM-Bereiche des Kreisverbands
            </p>
            <p>
              🏆 <strong>RWK/KM-Nutzer?</strong> <Link href="/login" className="text-blue-600 hover:text-blue-800 underline">Hier zum Kreisverband-Login</Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Social Training</h1>
        <p className="text-muted-foreground mb-4">
          Trainieren Sie gemeinsam mit anderen Schützen und nehmen Sie an Live-Wettkämpfen teil
        </p>
        <Button asChild variant="outline" size="sm">
          <Link href="/social/welcome">
            🎆 Was ist Social Training?
          </Link>
        </Button>
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
              <div className="space-y-2">
                <Button asChild className="w-full">
                  <Link href="/social/profile/edit">
                    Profil bearbeiten
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/einstellungen">
                    Sichtbarkeits-Einstellungen
                  </Link>
                </Button>
              </div>
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
              Treten Sie bestehenden Gruppen bei oder erstellen Sie eigene
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 mb-3">
              <div className="text-sm text-orange-800 dark:text-orange-200">
                <div className="font-medium mb-1">🚧 Testphase - Feedback willkommen!</div>
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

            </CardTitle>
            <CardDescription>
              Erstellen Sie Echtzeit-Wettkämpfe mit Live-Ranglisten
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground p-2 bg-orange-50 rounded border border-orange-200">
                🚧 <strong>Testphase</strong> - Feedback willkommen!
              </div>
              <Button asChild className="w-full">
                <Link href="/live-competition">
                  Wettkämpfe anzeigen
                </Link>
              </Button>
            </div>
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
            <div className="space-y-3">
              <Button asChild variant="outline" className="w-full">
                <Link href="/social/welcome">
                  🎆 Was ist Social Training?
                </Link>
              </Button>
              <div className="text-sm space-y-1">
                <p>1. Profil öffentlich machen</p>
                <p>2. Trainingsgruppe erstellen/beitreten</p>
                <p>3. An Live-Wettkämpfen teilnehmen</p>
              </div>
              <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200">
                <p className="text-xs text-yellow-800 dark:text-yellow-200 mb-2">
                  💡 <strong>Infrastruktur erhalten:</strong>
                </p>
                <Button asChild variant="outline" size="sm" className="w-full text-xs">
                  <Link href="https://paypal.me/rwkeinbeck" target="_blank">
                    ☕ PayPal Spende
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
