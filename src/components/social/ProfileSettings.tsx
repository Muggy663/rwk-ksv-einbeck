"use client";

import { useState, useEffect } from "react";
import { logError, logDebug } from '@/lib/utils/secure-logger';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Users, Eye, Trophy, Building } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SocialService } from "@/lib/services/social-service";
import { useAuth } from "@/hooks/use-auth";
import { NotificationSettings } from "./NotificationSettings";

interface SocialSettings {
  isPublic: boolean;
  shareResults: boolean;
  availableForCompetitions: boolean;
  showClubAffiliation: boolean;
}

export function ProfileSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [settings, setSettings] = useState<SocialSettings>({
    isPublic: false,
    shareResults: false,
    availableForCompetitions: false,
    showClubAffiliation: false
  });
  const [, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      loadSettings();
    }
  }, [user]);
  
  const loadSettings = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { doc, getDoc } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase/config');
      
      const userPermissionsRef = doc(db, 'user_permissions', user.uid);
      const userPermissions = await getDoc(userPermissionsRef);
      
      if (userPermissions.exists()) {
        const userData = userPermissions.data();
        const socialSettings = userData.socialSettings || {};
        
        setSettings({
          isPublic: socialSettings.isPublic || false,
          shareResults: socialSettings.shareResults || false,
          availableForCompetitions: socialSettings.availableForCompetitions || false,
          showClubAffiliation: socialSettings.showClubAffiliation || false
        });
      }
    } catch (error) {
      logError('Error loading settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      logDebug('🔍 Saving settings:', settings);
      await SocialService.updateProfileSettings(user.uid, settings);
      logDebug('✅ Settings saved successfully');
      
      toast({
        title: "Einstellungen gespeichert",
        description: settings.isPublic 
          ? "Ihr Profil ist jetzt öffentlich sichtbar."
          : "Ihre Privatsphäre-Einstellungen wurden aktualisiert.",
      });
    } catch (error: any) {
      logError('❌ Save error:', error);
      toast({
        title: "Fehler",
        description: error.message || "Einstellungen konnten nicht gespeichert werden.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const updateSetting = (key: keyof SocialSettings, value: boolean) => {
    setSettings(prev => {
      const newSettings = { ...prev, [key]: value };
      
      // Logik: Wenn Profil nicht öffentlich, andere Optionen deaktivieren
      if (key === 'isPublic' && !value) {
        newSettings.shareResults = false;
        newSettings.availableForCompetitions = false;
        newSettings.showClubAffiliation = false;
      }
      
      // Logik: Für Wettkämpfe verfügbar erfordert öffentliches Profil
      if (key === 'availableForCompetitions' && value) {
        newSettings.isPublic = true;
      }
      
      return newSettings;
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Social Training Einstellungen
        </CardTitle>
        <CardDescription>
          Verwalten Sie Ihre Sichtbarkeit und Teilnahme an der Trainings-Community
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Profil öffentlich */}
        <div className="flex items-center justify-between space-x-2">
          <div className="flex items-center space-x-3">
            <Eye className="h-4 w-4 text-muted-foreground" />
            <div className="space-y-1">
              <Label htmlFor="isPublic" className="text-sm font-medium">
                Profil öffentlich sichtbar
              </Label>
              <p className="text-xs text-muted-foreground">
                Andere Schützen können Ihr Profil finden und sehen
              </p>
            </div>
          </div>
          <Switch
            id="isPublic"
            checked={settings.isPublic}
            onCheckedChange={(checked) => updateSetting('isPublic', checked)}
          />
        </div>

        {/* Ergebnisse teilen */}
        <div className="flex items-center justify-between space-x-2">
          <div className="flex items-center space-x-3">
            <Trophy className="h-4 w-4 text-muted-foreground" />
            <div className="space-y-1">
              <Label htmlFor="shareResults" className="text-sm font-medium">
                Trainingsergebnisse teilen
              </Label>
              <p className="text-xs text-muted-foreground">
                Zeigen Sie Ihre Statistiken und besten Ergebnisse
              </p>
            </div>
          </div>
          <Switch
            id="shareResults"
            checked={settings.shareResults}
            onCheckedChange={(checked) => updateSetting('shareResults', checked)}
            disabled={!settings.isPublic}
          />
        </div>

        {/* Für Wettkämpfe verfügbar */}
        <div className="flex items-center justify-between space-x-2">
          <div className="flex items-center space-x-3">
            <Trophy className="h-4 w-4 text-green-600" />
            <div className="space-y-1">
              <Label htmlFor="availableForCompetitions" className="text-sm font-medium">
                Für Live-Wettkämpfe verfügbar
              </Label>
              <p className="text-xs text-muted-foreground">
                Andere können Sie zu Trainingsgruppen und Wettkämpfen einladen
              </p>
            </div>
          </div>
          <Switch
            id="availableForCompetitions"
            checked={settings.availableForCompetitions}
            onCheckedChange={(checked) => updateSetting('availableForCompetitions', checked)}
            disabled={!settings.isPublic}
          />
        </div>

        {/* Vereinszugehörigkeit */}
        <div className="flex items-center justify-between space-x-2">
          <div className="flex items-center space-x-3">
            <Building className="h-4 w-4 text-muted-foreground" />
            <div className="space-y-1">
              <Label htmlFor="showClubAffiliation" className="text-sm font-medium">
                Vereinszugehörigkeit anzeigen
              </Label>
              <p className="text-xs text-muted-foreground">
                Zeigen Sie Ihren Verein in Ihrem öffentlichen Profil
              </p>
            </div>
          </div>
          <Switch
            id="showClubAffiliation"
            checked={settings.showClubAffiliation}
            onCheckedChange={(checked) => updateSetting('showClubAffiliation', checked)}
            disabled={!settings.isPublic}
          />
        </div>

        {/* Info-Box */}
        {settings.isPublic && (
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
            <h4 className="text-sm font-semibold text-blue-900 mb-2">
              🎯 Ihr Profil wird sichtbar für:
            </h4>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• Andere Schützen in der Community</li>
              {settings.shareResults && <li>• Ihre Trainingsstatistiken und Fortschritte</li>}
              {settings.availableForCompetitions && <li>• Einladungen zu Trainingsgruppen und Live-Wettkämpfen</li>}
              {settings.showClubAffiliation && <li>• Ihre Vereinszugehörigkeit</li>}
            </ul>
          </div>
        )}

        {/* Datenschutz-Hinweis */}
        <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
          <h4 className="text-sm font-semibold text-gray-900 mb-2">
            🔒 Datenschutz & Kontrolle
          </h4>
          <ul className="text-xs text-gray-700 space-y-1">
            <li>• Sie können diese Einstellungen jederzeit ändern</li>
            <li>• Ihre Schießnachweis-Daten bleiben immer privat</li>
            <li>• Nur freigegebene Informationen werden geteilt</li>
            <li>• Sie können Trainingsgruppen jederzeit verlassen</li>
          </ul>
        </div>

        {/* Speichern Button */}
        <div className="flex justify-end pt-4">
          <Button 
            onClick={handleSave} 
            disabled={isSaving}
            className="flex items-center gap-2"
          >
            {isSaving ? 'Speichere...' : 'Einstellungen speichern'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function SocialSettingsPage() {
  return (
    <div className="space-y-6">
      <ProfileSettings />
      <NotificationSettings />
    </div>
  );
}
