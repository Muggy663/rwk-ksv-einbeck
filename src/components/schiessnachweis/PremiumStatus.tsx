"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Crown, Clock } from "lucide-react";
import { PremiumService } from "@/lib/services/premium-service";

interface PremiumStatusProps {
  className?: string;
}

export function PremiumStatus({ className }: PremiumStatusProps) {
  const [subscription, setSubscription] = useState(PremiumService.getSubscription());
  const [timeRemaining, setTimeRemaining] = useState(PremiumService.getTimeRemaining());

  useEffect(() => {
    const interval = setInterval(() => {
      const newSubscription = PremiumService.getSubscription();
      const newTimeRemaining = PremiumService.getTimeRemaining();
      
      setSubscription(newSubscription);
      setTimeRemaining(newTimeRemaining);
    }, 60000); // Update jede Minute

    return () => clearInterval(interval);
  }, []);

  if (!subscription.isActive) {
    return null;
  }

  return (
    <Card className={`border-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Crown className="h-4 w-4 text-yellow-600" />
          Premium Status
          <Badge variant="default" className="ml-auto bg-yellow-600">
            Aktiv
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-yellow-600" />
            <div className="text-sm">
              {timeRemaining ? (
                <div className="text-yellow-700 dark:text-yellow-300">
                  <div className="font-medium">
                    {timeRemaining.days > 0 ? `${timeRemaining.days} Tag${timeRemaining.days !== 1 ? 'e' : ''}` : 'Heute'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    verbleibend
                  </div>
                </div>
              ) : (
                <span className="text-yellow-700 dark:text-yellow-300">Läuft ab</span>
              )}
            </div>
          </div>
          {subscription.expiresAt && (
            <div className="text-xs text-muted-foreground">
              bis {subscription.expiresAt.toLocaleDateString('de-DE')} 00:00
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}