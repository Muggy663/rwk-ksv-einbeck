"use client";

import React, { useState, useEffect } from 'react';
import { logError } from '@/lib/utils/secure-logger';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CheckCircle, ChevronRight, ChevronLeft, Users, ListChecks, Trophy, User } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { getMemberPermissions } from '@/lib/permissions/memberPermissions';

interface OnboardingStep {
  title: string;
  description: string;
  content: React.ReactNode;
  icon?: React.ReactNode;
}

// Konstante für den localStorage-Schlüssel
const ONBOARDING_COMPLETED_KEY_PREFIX = 'rwk-onboarding-completed-';

export function OnboardingWizard() {
  const { user, userAppPermissions } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [, setHasSeenOnboarding] = useState(false);
  const [storageError, setStorageError] = useState(false);

  // Überprüfen, ob der Benutzer das Onboarding bereits gesehen hat
  useEffect(() => {
    if (!user?.uid) return;
    
    try {
      const onboardingCompleted = localStorage.getItem(`${ONBOARDING_COMPLETED_KEY_PREFIX}${user.uid}`);
      setHasSeenOnboarding(!!onboardingCompleted);
      
      // Automatisch öffnen, wenn der Benutzer neu ist und das Onboarding noch nicht gesehen hat
      if (!onboardingCompleted) {
        setOpen(true);
      }
    } catch (error) {
      logError('Fehler beim Zugriff auf localStorage:', error);
      setStorageError(true);
      // Fallback: Dialog nicht automatisch öffnen
    }
  }, [user]);

  const role = userAppPermissions?.role || '';
  // Verwaltungs-Schritte (Mannschaften + Mitglieder) für alle, die tatsächlich
  // verwalten dürfen: Sportleiter, KM-Orga und Admin (über die zentrale
  // Rechte-Logik) sowie die Legacy-Rolle "vereinsvertreter" für Bestandsnutzer.
  const memberPerms = getMemberPermissions(userAppPermissions, user?.email);
  const canManage = memberPerms.canEdit || role === 'vereinsvertreter';

  // Gemeinsame Schritte für beide Rollen
  const commonSteps: OnboardingStep[] = [
    {
      title: "Willkommen bei der RWK Einbeck App",
      description: "Wir helfen Ihnen, sich mit den wichtigsten Funktionen vertraut zu machen.",
      icon: <Trophy className="h-8 w-8 text-primary" />,
      content: (
        <div className="space-y-4">
          <p>Die RWK Einbeck App unterstützt Sie bei der Verwaltung und Verfolgung von Rundenwettkämpfen des Kreisschützenverbandes Einbeck.</p>
          <p>In den nächsten Schritten zeigen wir Ihnen die wichtigsten Funktionen für Ihre Rolle.</p>
        </div>
      )
    },
    {
      title: "Ergebniserfassung",
      description: "So erfassen Sie Wettkampfergebnisse",
      icon: <ListChecks className="h-8 w-8 text-primary" />,
      content: (
        <div className="space-y-4">
          <p>Unter dem Menüpunkt "Ergebnisse" können Sie Wettkampfergebnisse für Ihre Mannschaften erfassen:</p>
          <ol className="list-decimal list-inside space-y-2">
            <li>Wählen Sie die Saison, Liga und den Durchgang aus</li>
            <li>Wählen Sie die Mannschaft und den Schützen</li>
            <li>Geben Sie das Ringergebnis ein</li>
            <li>Fügen Sie das Ergebnis zur Liste hinzu</li>
            <li>Speichern Sie alle Ergebnisse, wenn Sie fertig sind</li>
          </ol>
        </div>
      )
    },
    {
      title: "Passwort ändern",
      description: "Sicherheit Ihres Kontos",
      icon: <User className="h-8 w-8 text-primary" />,
      content: (
        <div className="space-y-4">
          <p>Aus Sicherheitsgründen empfehlen wir Ihnen, Ihr Passwort zu ändern:</p>
          <ol className="list-decimal list-inside space-y-2">
            <li>Klicken Sie auf Ihren Namen oben rechts</li>
            <li>Wählen Sie "Passwort ändern"</li>
            <li>Geben Sie Ihr aktuelles und neues Passwort ein</li>
          </ol>
          <p className="text-sm text-muted-foreground">Ein sicheres Passwort sollte mindestens 8 Zeichen lang sein und Zahlen sowie Sonderzeichen enthalten.</p>
        </div>
      )
    }
  ];

  // Verwaltungs-Schritte (für Sportleiter, KM-Orga, Admin und Legacy-Vereinsvertreter)
  const verwaltungSteps: OnboardingStep[] = [
    {
      title: "Mannschaftsverwaltung",
      description: "So verwalten Sie Ihre Mannschaften",
      icon: <Users className="h-8 w-8 text-primary" />,
      content: (
        <div className="space-y-4">
          <p>Unter "Meine Mannschaften" können Sie die Mannschaften Ihres Vereins verwalten:</p>
          <ol className="list-decimal list-inside space-y-2">
            <li>Unter "Meine Mannschaften" können Sie neue Mannschaften anlegen</li>
            <li>Wählen Sie die Saison und geben Sie einen Namen ein</li>
            <li>Weisen Sie Schützen zu (maximal 3 pro Mannschaft)</li>
            <li>Die Zuweisung zu einer Liga erfolgt durch den Administrator</li>
          </ol>
        </div>
      )
    },
    {
      title: "Mitgliederverwaltung",
      description: "So verwalten Sie Ihre Mitglieder",
      icon: <User className="h-8 w-8 text-primary" />,
      content: (
        <div className="space-y-4">
          <p>Mitglieder werden zentral unter „Mitglieder" gepflegt – eine gemeinsame Liste für Rundenwettkampf und Kreismeisterschaft:</p>
          <ol className="list-decimal list-inside space-y-2">
            <li>Unter "Mitglieder" sehen Sie alle Mitglieder Ihrer Vereine</li>
            <li>Neue Mitglieder anlegen (Vorname, Nachname, Geschlecht, Verein; optional Mitgliedsnummer und Kontaktdaten)</li>
            <li>Bestehende Mitglieder bearbeiten oder entfernen (dabei werden sie deaktiviert; Ergebnisse bleiben erhalten)</li>
            <li>Die Zuordnung zu Mannschaften erfolgt in der Mannschaftsverwaltung</li>
          </ol>
        </div>
      )
    }
  ];

  // Zusammenstellen der Schritte basierend auf den tatsächlichen Rechten
  const steps = canManage 
    ? [...commonSteps, ...verwaltungSteps] 
    : commonSteps;

  const handleComplete = () => {
    if (user?.uid) {
      try {
        localStorage.setItem(`${ONBOARDING_COMPLETED_KEY_PREFIX}${user.uid}`, 'true');
        setHasSeenOnboarding(true);
      } catch (error) {
        logError('Fehler beim Speichern in localStorage:', error);
        setStorageError(true);
        // Trotzdem fortfahren, da der Benutzer die Einführung gesehen hat
      }
    }
    
    setOpen(false);
    toast({
      title: "Einführung abgeschlossen",
      description: "Sie können die Einführung jederzeit über das Hilfemenü erneut aufrufen.",
    });
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Wenn localStorage nicht verfügbar ist, zeigen wir eine Warnung an
  if (storageError) {
    toast({
      title: "Hinweis",
      description: "Ihr Browser unterstützt keine lokale Speicherung. Die Einführung wird bei jedem Besuch angezeigt.",
      variant: "destructive",
    });
  }

  return (
    <>
      <Button 
        variant="outline" 
        onClick={() => setOpen(true)}
        className="w-full"
      >
        Einführung starten
      </Button>

      <Dialog open={open} onOpenChange={(newOpen) => {
        // Verhindern, dass der Dialog geschlossen wird, wenn auf den Hintergrund geklickt wird
        // Nur über die Buttons schließen lassen
        if (!newOpen) return;
        setOpen(newOpen);
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {steps[currentStep]?.icon || <Trophy className="h-8 w-8 text-primary" />}
              {steps[currentStep]?.title || "Willkommen"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-4">{steps[currentStep]?.description || ""}</p>
            {steps[currentStep]?.content || (
              <p>Keine Inhalte verfügbar. Bitte versuchen Sie es später erneut.</p>
            )}
          </div>
          
          <div className="flex justify-between mt-4">
            <div>
              {currentStep > 0 && (
                <Button variant="outline" onClick={handlePrevious}>
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Zurück
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {currentStep + 1} von {steps.length}
              </span>
              <Button onClick={handleNext}>
                {currentStep < steps.length - 1 ? (
                  <>
                    Weiter
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </>
                ) : (
                  <>
                    Fertig
                    <CheckCircle className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
