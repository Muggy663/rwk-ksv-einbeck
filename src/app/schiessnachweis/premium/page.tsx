"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Crown, Check, ArrowLeft, CreditCard, Calendar, Zap, Cloud, BarChart3, Shield } from "lucide-react";
import Link from "next/link";
import { PremiumService } from "@/lib/services/premium-service";
import { auth } from '@/lib/firebase/config';
import { useToast } from "@/hooks/use-toast";

export default function PremiumPage() {
  const { toast } = useToast();
  const [subscription, setSubscription] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadSubscription();
  }, []);

  const loadSubscription = async () => {
    setIsLoading(true);
    try {
      const sub = await PremiumService.getSubscription();
      setSubscription(sub);
    } catch (error) {
      console.error('Fehler beim Laden der Subscription:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayPalPayment = async (months: number) => {
    if (!auth.currentUser) {
      toast({
        title: "Anmeldung erforderlich",
        description: "Bitte melden Sie sich an, um Premium zu aktivieren.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      const amount = months === 12 ? 20 : months * 2;
      
      // PayPal Checkout erstellen
      const response = await fetch('/api/premium/create-paypal-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: auth.currentUser.uid,
          months: months,
          amount: amount,
          currency: 'EUR'
        })
      });
      
      const { orderId, approvalUrl } = await response.json();
      
      if (approvalUrl) {
        // Weiterleitung zu PayPal
        window.location.href = approvalUrl;
      } else {
        throw new Error('PayPal-Order konnte nicht erstellt werden');
      }
      
    } catch (error) {
      toast({
        title: "Zahlung fehlgeschlagen",
        description: "Die PayPal-Zahlung konnte nicht verarbeitet werden.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const features = [
    {
      icon: <Cloud className="h-5 w-5" />,
      title: "Cloud-Synchronisation",
      description: "Automatische Sicherung in der Cloud"
    },
    {
      icon: <BarChart3 className="h-5 w-5" />,
      title: "Erweiterte Statistiken",
      description: "Detaillierte Leistungsanalysen"
    },
    {
      icon: <Zap className="h-5 w-5" />,
      title: "Multi-Device-Zugriff",
      description: "Zugriff von allen Geräten"
    },
    {
      icon: <Shield className="h-5 w-5" />,
      title: "Prioritäts-Support",
      description: "Bevorzugter Kundensupport"
    }
  ];

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="text-center py-8">
          <p className="text-muted-foreground">Lade Premium-Status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <Button asChild variant="ghost" className="mb-4">
          <Link href="/schiessnachweis">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück zum Schießnachweis
          </Link>
        </Button>
        
        <div className="text-center mb-8">
          <div className="flex justify-center items-center gap-3 mb-4">
            <Crown className="h-12 w-12 text-yellow-600" />
            <div>
              <h1 className="text-3xl font-bold">Premium Schießnachweis</h1>
              <p className="text-muted-foreground">Erweiterte Features für Sportschützen</p>
            </div>
          </div>
        </div>
      </div>

      {subscription?.isActive ? (
        // Premium aktiv
        <Card className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800 dark:text-green-200">
              <Crown className="h-5 w-5" />
              Premium aktiv
              <Badge variant="default" className="bg-green-600">Aktiv</Badge>
            </CardTitle>
            <CardDescription className="text-green-700 dark:text-green-300">
              Sie haben Zugriff auf alle Premium-Features
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-green-700 dark:text-green-300">Läuft ab am:</div>
                <div className="font-semibold text-lg">
                  {subscription.expiresAt?.toLocaleDateString('de-DE')} um 00:00
                </div>
              </div>
              <div>
                <div className="text-sm text-green-700 dark:text-green-300">Verbleibende Zeit:</div>
                <div className="font-semibold text-lg">
                  {PremiumService.getDaysRemaining()} Tage
                </div>
              </div>
            </div>
            {subscription.autoRenew && (
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
                  <Calendar className="h-4 w-4" />
                  <span className="font-medium">Automatische Verlängerung aktiv</span>
                </div>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  Ihr Premium-Zugang wird automatisch verlängert
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        // Premium nicht aktiv
        <div className="space-y-6">
          {/* Features */}
          <Card>
            <CardHeader>
              <CardTitle>Premium-Features</CardTitle>
              <CardDescription>
                Erweitern Sie Ihren Schießnachweis mit professionellen Funktionen
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                    <div className="text-yellow-600 mt-1">
                      {feature.icon}
                    </div>
                    <div>
                      <div className="font-medium">{feature.title}</div>
                      <div className="text-sm text-muted-foreground">{feature.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Testphase Banner */}
          <Card className="border-orange-200 bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-950/20 dark:to-yellow-950/20 mb-6">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-800 dark:text-orange-200 mb-2">🚧 Testphase</div>
                <p className="text-orange-700 dark:text-orange-300 mb-4">
                  Premium ist aktuell kostenlos verfügbar! Schreiben Sie uns eine E-Mail für die Aktivierung.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button asChild className="bg-orange-600 hover:bg-orange-700">
                    <a href="mailto:marcel.buenger@gmx.de?subject=Premium Testphase - Aktivierung&body=Hallo,%0D%0A%0D%0Aich möchte gerne Premium für die Testphase aktivieren.%0D%0A%0D%0AMeine E-Mail: %0D%0AUser-ID (falls bekannt): %0D%0A%0D%0AVielen Dank!">
                      📧 Premium kostenlos anfordern
                    </a>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="border-orange-300 text-orange-700 hover:bg-orange-100"
                    onClick={() => {
                      window.open('https://paypal.me/marcel.buenger@gmx.de/2EUR', '_blank');
                    }}
                  >
                    ☕ Trinkgeld (2€)
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Zukünftige Preise */}
          <Card className="opacity-60">
            <CardHeader>
              <CardTitle className="text-center">Geplante Preise (nach Testphase)</CardTitle>
              <CardDescription className="text-center">Voraussichtlich ab Sommer 2025</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-muted/30 rounded-lg">
                  <div className="text-xl font-bold">2,00€</div>
                  <div className="text-sm text-muted-foreground">pro Monat</div>
                </div>
                <div className="text-center p-4 bg-muted/30 rounded-lg">
                  <div className="text-xl font-bold">6,00€</div>
                  <div className="text-sm text-muted-foreground">3 Monate</div>
                </div>
                <div className="text-center p-4 bg-muted/30 rounded-lg">
                  <div className="text-xl font-bold">20,00€</div>
                  <div className="text-sm text-muted-foreground">12 Monate</div>
                </div>
              </div>
            </CardContent>
          </Card>



          {/* Testphase Hinweise */}
          <Card className="bg-green-50 dark:bg-green-950/20 border-green-200">
            <CardContent className="pt-6">
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>Kostenlos während der Testphase</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>Alle Premium-Features verfügbar</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>Feedback hilft bei der Entwicklung</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>Trinkgeld (2€) freiwillig - keine Steuern, kein Gewerbe</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}