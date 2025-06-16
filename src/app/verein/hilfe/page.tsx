"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';
import Link from 'next/link';
import { ArrowLeft, HelpCircle, Key } from 'lucide-react';

export default function HilfePage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-primary">Hilfe & Einstellungen</h1>
          <p className="text-muted-foreground">
            Hier finden Sie Hilfe und können Ihre Einstellungen ändern.
          </p>
        </div>
        <Link href="/verein/dashboard" className="flex items-center text-primary hover:underline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Zurück zum Dashboard
        </Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <HelpCircle className="h-5 w-5 mr-2" />
              Erste Schritte & App-Einführung
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Starten Sie die Einführung, um die wichtigsten Funktionen der App kennenzulernen. Der "Erste Schritte"-Assistent führt Sie durch die grundlegenden Funktionen für Vereinsvertreter und Mannschaftsführer.</p>
            <Button 
              onClick={() => {
                // Finde den OnboardingWizard-Button und klicke ihn
                const onboardingButtons = document.querySelectorAll('button');
                let found = false;
                onboardingButtons.forEach(button => {
                  if (button.textContent && button.textContent.includes('Einführung starten')) {
                    button.click();
                    found = true;
                  }
                });
                
                if (!found) {
                  // Fallback: Erstelle ein neues OnboardingWizard-Element
                  const wizardContainer = document.getElementById('onboarding-container');
                  if (wizardContainer) {
                    // OnboardingWizard sollte bereits vorhanden sein
                    const wizardButton = wizardContainer.querySelector('button');
                    if (wizardButton) {
                      wizardButton.click();
                    }
                  }
                }
              }}
              className="w-full mb-4"
            >
              Erste Schritte starten
            </Button>
            <div id="onboarding-container">
              <OnboardingWizard />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Key className="h-5 w-5 mr-2" />
              Passwort ändern
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Ändern Sie Ihr Passwort, um die Sicherheit Ihres Kontos zu gewährleisten.</p>
            <Button 
              onClick={() => {
                const passwordPrompt = document.querySelector('dialog[role="dialog"]');
                if (passwordPrompt) {
                  const dialogOpenEvent = new CustomEvent('dialog-open');
                  passwordPrompt.dispatchEvent(dialogOpenEvent);
                }
              }}
              className="w-full"
            >
              Passwort ändern
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}