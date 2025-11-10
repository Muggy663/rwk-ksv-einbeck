"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Check, Crown, Zap } from "lucide-react";
import Link from "next/link";
import { PremiumService } from "@/lib/services/premium-service";
import { RealPremiumService } from "@/lib/services/real-premium-service";
import { auth } from '@/lib/firebase/config';
import { useToast } from "@/hooks/use-toast";

export default function PremiumPage() {
  const { toast } = useToast();
  const [subscription, setSubscription] = useState(PremiumService.getSubscription());
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setSubscription(PremiumService.getSubscription());
  }, []);

  const handleUpgrade = async (plan: 'monthly' | 'yearly') => {
    if (!auth.currentUser) {
      toast({
        title: "Anmeldung erforderlich",
        description: "Bitte melden Sie sich an, um Premium zu aktivieren.",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const idToken = await auth.currentUser.getIdToken();
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken, plan })
      });
      
      if (response.ok) {
        const { url } = await response.json();
        window.location.href = url;
      } else {
        throw new Error('Checkout failed');
      }
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Checkout konnte nicht gestartet werden.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDemoActivation = () => {
    PremiumService.activatePremium(30); // 30 Tage Demo
    setSubscription(PremiumService.getSubscription());
    
    toast({
      title: "🎆 Demo-Modus aktiviert!",
      description: "Testen Sie alle Premium-Features 30 Tage kostenlos.",
    });
  };

  const handleCancel = () => {
    PremiumService.cancelSubscription();
    setSubscription(PremiumService.getSubscription());
    
    toast({
      title: "Premium gekündigt",
      description: "Sie nutzen jetzt wieder die kostenlose Version.",
      variant: "destructive"
    });
  };

  const daysRemaining = PremiumService.getDaysRemaining();

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-4xl">
      <div className="mb-6">
        <Button asChild variant="ghost" className="mb-4">
          <Link href="/schiessnachweis">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück zum Schießnachweis
          </Link>
        </Button>
        
        <div className="flex items-center gap-3 mb-2">
          <Crown className="h-8 w-8 text-yellow-600" />
          <h1 className="text-2xl font-bold">Premium Features</h1>
        </div>
        <p className="text-muted-foreground">
          Erweitern Sie Ihren Schießnachweis mit Premium-Features
        </p>
      </div>

      {/* Aktueller Status */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Ihr aktueller Plan</span>
            <Badge variant={subscription.isActive ? "default" : "secondary"}>
              {subscription.plan === 'premium' ? '👑 Premium' : '🆓 Kostenlos'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {subscription.isActive ? (
            <div className="space-y-2">
              <p className="text-green-600 font-medium">✅ Premium ist aktiv</p>
              {daysRemaining !== null && (
                <p className="text-sm text-muted-foreground">
                  Noch {daysRemaining} Tage verbleibend
                </p>
              )}
              <Button variant="destructive" size="sm" onClick={handleCancel}>
                Premium kündigen
              </Button>
            </div>
          ) : (
            <p className="text-muted-foreground">
              Sie nutzen derzeit die kostenlose Version des Schießnachweis.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Feature-Vergleich */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Kostenlos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🆓 Kostenlos
              <Badge variant="secondary">Aktuell</Badge>
            </CardTitle>
            <CardDescription>Für den Einstieg</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-600" />
              <span className="text-sm">Offline-Speicherung</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-600" />
              <span className="text-sm">PDF-Export für Behörden</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-600" />
              <span className="text-sm">Basis-Statistiken</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-600" />
              <span className="text-sm">Import von digitalen Anlagen</span>
            </div>
          </CardContent>
        </Card>

        {/* Premium */}
        <Card className="border-yellow-200 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              👑 Premium
              <Badge variant="default">~2€/Monat</Badge>
            </CardTitle>
            <CardDescription>Für Profis</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-xs text-muted-foreground mb-2">Alles aus Kostenlos, plus:</div>
            
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Cloud-Synchronisation</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Multi-Gerät-Zugang</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Erweiterte Statistiken</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Leistungsanalyse</span>
            </div>
            
            {!subscription.isActive && (
              <div className="space-y-2 mt-4">
                <div className="space-y-2">
                  <Button 
                    className="w-full" 
                    onClick={() => window.open('https://paypal.me/marcelbuenger/2EUR', '_blank')}
                  >
                    💳 Monatlich - 2€/Monat (PayPal)
                  </Button>
                  <Button 
                    variant="outline"
                    className="w-full" 
                    onClick={() => window.open('https://paypal.me/marcelbuenger/20EUR', '_blank')}
                  >
                    💰 Jährlich - 20€/Jahr (2 Monate gratis)
                  </Button>
                </div>
                <Button 
                  variant="outline"
                  className="w-full" 
                  onClick={handleDemoActivation}
                >
                  🎆 30 Tage kostenlos testen
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* PayPal Anleitung */}
      <Card className="bg-green-50 dark:bg-green-950/20 border-green-200">
        <CardHeader>
          <CardTitle className="text-lg text-green-800 dark:text-green-200">💳 So funktioniert's</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <ol className="text-sm text-green-700 dark:text-green-300 space-y-2 list-decimal list-inside">
              <li>PayPal-Zahlung durchführen (Button oben)</li>
              <li>Screenshot oder Transaktions-ID per E-Mail senden</li>
              <li>Premium wird innerhalb 24h manuell aktiviert</li>
              <li>Cloud-Sync & erweiterte Features verfügbar</li>
            </ol>
            <div className="bg-white dark:bg-gray-800 p-3 rounded border">
              <p className="text-sm font-medium">📧 E-Mail für Premium-Aktivierung:</p>
              <p className="text-sm text-blue-600 font-mono">rwk-leiter-ksve@gmx.de</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}