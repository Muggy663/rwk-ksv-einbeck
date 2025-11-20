"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Bell, Mail, Smartphone, Users, Trophy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface NotificationPreferences {
  // E-Mail Benachrichtigungen
  emailGroupInvites: boolean;
  emailCompetitionInvites: boolean;
  emailCompetitionResults: boolean;
  emailWeeklyDigest: boolean;
  
  // Browser Push-Benachrichtigungen
  pushGroupActivity: boolean;
  pushCompetitionUpdates: boolean;
  pushDirectMessages: boolean;
  
  // In-App Benachrichtigungen
  inAppAll: boolean;
}

export function NotificationSettings() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    // E-Mail (Opt-in erforderlich)
    emailGroupInvites: false,
    emailCompetitionInvites: false,
    emailCompetitionResults: false,
    emailWeeklyDigest: false,
    
    // Push (Opt-in erforderlich)
    pushGroupActivity: false,
    pushCompetitionUpdates: false,
    pushDirectMessages: false,
    
    // In-App (Standard aktiviert)
    inAppAll: true,
  });
  
  useEffect(() => {
    if (user) {
      loadNotificationSettings();
    }
  }, [user]);
  
  const loadNotificationSettings = async () => {
    if (!user) return;
    
    try {
      const { doc, getDoc } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase/config');
      
      const userPermissionsRef = doc(db, 'user_permissions', user.uid);
      const userPermissions = await getDoc(userPermissionsRef);
      
      if (userPermissions.exists()) {
        const userData = userPermissions.data();
        const notificationSettings = userData.notificationSettings;
        
        if (notificationSettings) {
          setPreferences(notificationSettings);
          console.log('📥 Loaded notification settings:', notificationSettings);
        }
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
    }
  };
  
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      console.log('🔔 Saving notification settings:', preferences);
      
      const { useAuth } = await import('@/hooks/use-auth');
      const { SocialService } = await import('@/lib/services/social-service');
      
      if (!user) {
        throw new Error('Nicht angemeldet');
      }
      
      // Save to user_permissions
      const { doc, updateDoc } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase/config');
      
      const userPermissionsRef = doc(db, 'user_permissions', user.uid);
      await updateDoc(userPermissionsRef, {
        'notificationSettings': preferences,
        updatedAt: new Date()
      });
      
      console.log('✅ Notification settings saved');
      
      toast({
        title: "Einstellungen gespeichert",
        description: "Ihre Benachrichtigungs-Einstellungen wurden aktualisiert.",
      });
    } catch (error: any) {
      console.error('❌ Notification save error:', error);
      toast({
        title: "Fehler",
        description: error.message || "Einstellungen konnten nicht gespeichert werden.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const updatePreference = (key: keyof NotificationPreferences, value: boolean) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      
      {/* E-Mail Benachrichtigungen */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            E-Mail-Benachrichtigungen
          </CardTitle>
          <CardDescription>
            Erhalten Sie wichtige Updates per E-Mail (nur mit Ihrer Zustimmung)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Gruppen-Einladungen</Label>
              <p className="text-xs text-muted-foreground">
                E-Mail wenn Sie zu einer Trainingsgruppe eingeladen werden
              </p>
            </div>
            <Switch
              checked={preferences.emailGroupInvites}
              onCheckedChange={(checked) => updatePreference('emailGroupInvites', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Wettkampf-Einladungen</Label>
              <p className="text-xs text-muted-foreground">
                E-Mail bei Live-Wettkampf-Einladungen
              </p>
            </div>
            <Switch
              checked={preferences.emailCompetitionInvites}
              onCheckedChange={(checked) => updatePreference('emailCompetitionInvites', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Wettkampf-Ergebnisse</Label>
              <p className="text-xs text-muted-foreground">
                E-Mail mit Ihren Wettkampf-Ergebnissen und Platzierungen
              </p>
            </div>
            <Switch
              checked={preferences.emailCompetitionResults}
              onCheckedChange={(checked) => updatePreference('emailCompetitionResults', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Wöchentliche Zusammenfassung</Label>
              <p className="text-xs text-muted-foreground">
                Wöchentlicher Überblick über Ihre Aktivitäten
              </p>
            </div>
            <Switch
              checked={preferences.emailWeeklyDigest}
              onCheckedChange={(checked) => updatePreference('emailWeeklyDigest', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Browser Push-Benachrichtigungen */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Browser-Benachrichtigungen
          </CardTitle>
          <CardDescription>
            Sofortige Benachrichtigungen im Browser (auch wenn App geschlossen ist)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              💡 <strong>Browser-Berechtigung erforderlich:</strong> Ihr Browser wird Sie um Erlaubnis fragen, 
              Benachrichtigungen anzuzeigen.
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Gruppen-Aktivitäten</Label>
              <p className="text-xs text-muted-foreground">
                Neue Mitglieder, Nachrichten in Ihren Gruppen
              </p>
            </div>
            <Switch
              checked={preferences.pushGroupActivity}
              onCheckedChange={(checked) => updatePreference('pushGroupActivity', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Wettkampf-Updates</Label>
              <p className="text-xs text-muted-foreground">
                Start, Ende und Ergebnisse von Live-Wettkämpfen
              </p>
            </div>
            <Switch
              checked={preferences.pushCompetitionUpdates}
              onCheckedChange={(checked) => updatePreference('pushCompetitionUpdates', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Direkte Nachrichten</Label>
              <p className="text-xs text-muted-foreground">
                Persönliche Nachrichten und Einladungen
              </p>
            </div>
            <Switch
              checked={preferences.pushDirectMessages}
              onCheckedChange={(checked) => updatePreference('pushDirectMessages', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* In-App Benachrichtigungen */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            In-App-Benachrichtigungen
          </CardTitle>
          <CardDescription>
            Benachrichtigungen innerhalb der App (empfohlen)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Alle In-App-Benachrichtigungen</Label>
              <p className="text-xs text-muted-foreground">
                Zeigt Benachrichtigungen im Notification-Center der App
              </p>
            </div>
            <Switch
              checked={preferences.inAppAll}
              onCheckedChange={(checked) => updatePreference('inAppAll', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* DSGVO-Hinweis */}
      <Card className="border-gray-200 bg-gray-50">
        <CardHeader>
          <CardTitle className="text-gray-900">🔒 Datenschutz & Kontrolle</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>• <strong>Opt-in Prinzip:</strong> Alle Benachrichtigungen sind standardmäßig deaktiviert</li>
            <li>• <strong>Jederzeit änderbar:</strong> Sie können diese Einstellungen jederzeit anpassen</li>
            <li>• <strong>Keine Spam-E-Mails:</strong> Wir senden nur relevante, von Ihnen gewünschte Nachrichten</li>
            <li>• <strong>Einfaches Abbestellen:</strong> Jede E-Mail enthält einen Abmelde-Link</li>
            <li>• <strong>DSGVO-konform:</strong> Ihre Daten werden nicht an Dritte weitergegeben</li>
          </ul>
        </CardContent>
      </Card>

      {/* Speichern Button */}
      <div className="flex justify-end">
        <Button 
          onClick={handleSave} 
          disabled={isSaving}
          className="flex items-center gap-2"
        >
          <Bell className="h-4 w-4" />
          {isSaving ? 'Speichere...' : 'Einstellungen speichern'}
        </Button>
      </div>
    </div>
  );
}
