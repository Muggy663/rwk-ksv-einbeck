"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { User, Target, Users, CheckCircle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

interface OnboardingData {
  displayName: string;
  clubName: string;
  disciplines: string[];
  isPublic: boolean;
  birthYear?: number;
}

interface OnboardingWizardProps {
  onComplete: () => void;
}

export function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<OnboardingData>({
    displayName: "",
    clubName: "",
    disciplines: [],
    isPublic: false,
    birthYear: undefined
  });

  const totalSteps = 3;
  const progress = (step / totalSteps) * 100;

  const handleSave = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      const { db, auth } = await import('@/lib/firebase/config');
      const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');
      
      // Ensure user is authenticated
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('Benutzer nicht authentifiziert');
      }
      
      // Save to user_permissions with server timestamp
      const userPermissionsRef = doc(db, 'user_permissions', currentUser.uid);
      await setDoc(userPermissionsRef, {
        displayName: data.displayName,
        clubName: data.clubName,
        disciplines: data.disciplines,
        birthYear: data.birthYear,
        email: currentUser.email,
        socialSettings: {
          isPublic: data.isPublic,
          shareResults: data.isPublic,
          availableForCompetitions: data.isPublic,
          showClubAffiliation: data.isPublic
        },
        onboardingCompleted: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true });

      // Create public profile if public
      if (data.isPublic) {
        const publicProfileRef = doc(db, 'public_profiles', currentUser.uid);
        await setDoc(publicProfileRef, {
          displayName: data.displayName,
          clubName: data.clubName,
          disciplines: data.disciplines,
          birthYear: data.birthYear,
          isPublic: true,
          shareResults: true,
          availableForCompetitions: true,
          lastActive: serverTimestamp(),
          createdAt: serverTimestamp()
        });
      }

      toast({
        title: "Willkommen bei Social Training!",
        description: "Ihr Profil wurde erfolgreich eingerichtet."
      });
      
      onComplete();
    } catch (error: any) {
      console.error('Fehler beim Speichern:', error);
      
      let errorMessage = "Profil konnte nicht gespeichert werden.";
      if (error.code === 'permission-denied') {
        errorMessage = "Keine Berechtigung. Bitte melden Sie sich erneut an.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Fehler",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1: return data.displayName.trim().length > 0;
      case 2: return data.disciplines.length > 0;
      case 3: return true;
      default: return false;
    }
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-2xl">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <CardTitle>Willkommen bei Social Training!</CardTitle>
          </div>
          <Progress value={progress} className="w-full" />
          <p className="text-sm text-muted-foreground">Schritt {step} von {totalSteps}</p>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <User className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold">Persönliche Informationen</h3>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="displayName">
                  Anzeigename *
                </Label>
                <Input
                  id="displayName"
                  value={data.displayName}
                  onChange={(e) => setData(prev => ({ ...prev, displayName: e.target.value }))}
                  placeholder="Wie sollen andere Sie sehen?"
                />
                <p className="text-xs text-muted-foreground">
                  Dieser Name wird in Trainingsgruppen angezeigt
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="clubName">
                  Verein (optional)
                </Label>
                <Input
                  id="clubName"
                  value={data.clubName}
                  onChange={(e) => setData(prev => ({ ...prev, clubName: e.target.value }))}
                  placeholder="Name Ihres Schützenvereins"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="birthYear">
                  Geburtsjahr (optional)
                </Label>
                <Input
                  id="birthYear"
                  type="number"
                  min="1920"
                  max={new Date().getFullYear()}
                  value={data.birthYear || ""}
                  onChange={(e) => setData(prev => ({ 
                    ...prev, 
                    birthYear: e.target.value ? parseInt(e.target.value) : undefined 
                  }))}
                  placeholder="z.B. 1985"
                />
                <p className="text-xs text-muted-foreground">
                  Wichtig für Wettkampfklassen (Schüler, Jugend, Senioren)
                </p>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Target className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold">Ihre Disziplinen</h3>
              </div>
              
              <p className="text-sm text-muted-foreground mb-4">
                Wählen Sie die Disziplinen aus, die Sie schießen. Das hilft anderen, passende Trainingspartner zu finden.
              </p>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'KK', label: 'Kleinkaliber' },
                  { id: 'LG', label: 'Luftgewehr' },
                  { id: 'LP', label: 'Luftpistole' },
                  { id: 'GK', label: 'Großkaliber' },
                  { id: 'Pistole', label: 'Pistole' },
                  { id: 'Bogen', label: 'Bogen' },
                  { id: 'Blasrohr', label: 'Blasrohr' }
                ].map((discipline) => (
                  <div key={discipline.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={discipline.id}
                      checked={data.disciplines.includes(discipline.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setData(prev => ({
                            ...prev,
                            disciplines: [...prev.disciplines, discipline.id]
                          }));
                        } else {
                          setData(prev => ({
                            ...prev,
                            disciplines: prev.disciplines.filter(d => d !== discipline.id)
                          }));
                        }
                      }}
                    />
                    <Label htmlFor={discipline.id} className="text-sm cursor-pointer">
                      {discipline.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Users className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold">Community-Teilnahme</h3>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="isPublic"
                    checked={data.isPublic}
                    onCheckedChange={(checked) => setData(prev => ({ ...prev, isPublic: !!checked }))}
                  />
                  <div className="space-y-1">
                    <Label htmlFor="isPublic" className="cursor-pointer">
                      Profil öffentlich machen
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Andere Schützen können Sie finden und zu Trainingsgruppen einladen
                    </p>
                  </div>
                </div>

                {data.isPublic && (
                  <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                    <h4 className="text-sm font-semibold text-blue-900 mb-1">
                      ✅ Ihr öffentliches Profil wird enthalten:
                    </h4>
                    <ul className="text-xs text-blue-800 space-y-1">
                      <li>• Anzeigename: {data.displayName}</li>
                      {data.clubName && <li>• Verein: {data.clubName}</li>}
                      {data.birthYear && <li>• Geburtsjahr: {data.birthYear}</li>}
                      <li>• Disziplinen: {data.disciplines.join(', ')}</li>
                      <li>• Verfügbarkeit für Trainingsgruppen</li>
                    </ul>
                  </div>
                )}

                <div className="bg-gray-50 border border-gray-200 p-3 rounded-lg">
                  <h4 className="text-sm font-semibold text-gray-900 mb-1">
                    🔒 Sie können jederzeit:
                  </h4>
                  <ul className="text-xs text-gray-700 space-y-1">
                    <li>• Diese Einstellungen ändern</li>
                    <li>• Ihr Profil privat machen</li>
                    <li>• Trainingsgruppen verlassen</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between pt-4">
            {step > 1 && (
              <Button variant="outline" onClick={() => setStep(step - 1)}>
                Zurück
              </Button>
            )}
            
            <div className="ml-auto">
              {step < totalSteps ? (
                <Button 
                  onClick={() => setStep(step + 1)}
                  disabled={!canProceed()}
                >
                  Weiter
                </Button>
              ) : (
                <Button 
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? 'Speichere...' : 'Profil erstellen'}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}