"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Bell, BellOff, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { pushNotificationService } from '@/lib/services/push-notification-service';
import { useAuth } from '@/hooks/use-auth';

export function NotificationSettings() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission | null>(null);
  const [subscriptionTypes, setSubscriptionTypes] = useState({
    results: true,
    events: true,
    news: true,
    protests: false
  });

  useEffect(() => {
    checkNotificationStatus();
  }, []);

  const checkNotificationStatus = () => {
    const status = pushNotificationService.getPermissionStatus();
    setPermissionStatus(status);
    setIsSubscribed(status === 'granted');
  };

  const handleSubscribe = async () => {
    setIsLoading(true);
    try {
      const activeTypes = Object.entries(subscriptionTypes)
        .filter(([_, enabled]) => enabled)
        .map(([type, _]) => type);

      await pushNotificationService.subscribe(user?.email || undefined, activeTypes);
      
      setIsSubscribed(true);
      setPermissionStatus('granted');
      
      toast({
        title: 'Benachrichtigungen aktiviert',
        description: 'Sie erhalten jetzt Push-Benachrichtigungen für ausgewählte Ereignisse.',
      });
    } catch (error) {
      console.error('Subscription error:', error);
      toast({
        title: 'Fehler',
        description: 'Benachrichtigungen konnten nicht aktiviert werden.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    setIsLoading(true);
    try {
      await pushNotificationService.unsubscribe(user?.email || undefined);
      
      setIsSubscribed(false);
      
      toast({
        title: 'Benachrichtigungen deaktiviert',
        description: 'Sie erhalten keine Push-Benachrichtigungen mehr.',
      });
    } catch (error) {
      console.error('Unsubscription error:', error);
      toast({
        title: 'Fehler',
        description: 'Benachrichtigungen konnten nicht deaktiviert werden.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubscriptionTypeChange = (type: string, enabled: boolean) => {
    setSubscriptionTypes(prev => ({
      ...prev,
      [type]: enabled
    }));
  };

  if (!pushNotificationService.isNotificationSupported()) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellOff className="h-5 w-5" />
            Push-Benachrichtigungen
          </CardTitle>
          <CardDescription>
            Ihr Browser unterstützt keine Push-Benachrichtigungen.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Push-Benachrichtigungen
        </CardTitle>
        <CardDescription>
          Erhalten Sie sofortige Benachrichtigungen über neue Ergebnisse, Termine und wichtige Mitteilungen.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium">Benachrichtigungen</h4>
            <p className="text-sm text-muted-foreground">
              {isSubscribed ? 'Aktiviert' : 'Deaktiviert'}
            </p>
          </div>
          <Button
            onClick={isSubscribed ? handleUnsubscribe : handleSubscribe}
            disabled={isLoading}
            variant={isSubscribed ? 'outline' : 'default'}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubscribed ? 'Deaktivieren' : 'Aktivieren'}
          </Button>
        </div>

        {(isSubscribed || permissionStatus === 'granted') && (
          <div className="space-y-4">
            <h4 className="font-medium">Benachrichtigungstypen</h4>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="results-notifications">Neue Ergebnisse</Label>
                  <p className="text-sm text-muted-foreground">
                    Benachrichtigung bei neuen Wettkampfergebnissen
                  </p>
                </div>
                <Switch
                  id="results-notifications"
                  checked={subscriptionTypes.results}
                  onCheckedChange={(checked) => handleSubscriptionTypeChange('results', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="events-notifications">Termine</Label>
                  <p className="text-sm text-muted-foreground">
                    Benachrichtigung bei neuen Terminen und Erinnerungen
                  </p>
                </div>
                <Switch
                  id="events-notifications"
                  checked={subscriptionTypes.events}
                  onCheckedChange={(checked) => handleSubscriptionTypeChange('events', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="news-notifications">News</Label>
                  <p className="text-sm text-muted-foreground">
                    Benachrichtigung bei wichtigen Mitteilungen
                  </p>
                </div>
                <Switch
                  id="news-notifications"
                  checked={subscriptionTypes.news}
                  onCheckedChange={(checked) => handleSubscriptionTypeChange('news', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="protests-notifications">Proteste</Label>
                  <p className="text-sm text-muted-foreground">
                    Benachrichtigung bei neuen Einsprüchen (für Rundenwettkampfleiter)
                  </p>
                </div>
                <Switch
                  id="protests-notifications"
                  checked={subscriptionTypes.protests}
                  onCheckedChange={(checked) => handleSubscriptionTypeChange('protests', checked)}
                />
              </div>
            </div>
          </div>
        )}

        {permissionStatus === 'denied' && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              Benachrichtigungen wurden blockiert. Bitte aktivieren Sie sie in den Browser-Einstellungen.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}