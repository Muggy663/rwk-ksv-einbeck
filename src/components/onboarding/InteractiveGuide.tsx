// src/components/onboarding/InteractiveGuide.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, ArrowRight, ArrowLeft, CheckCircle, Users, Target, Trophy, Shield, HelpCircle } from 'lucide-react';

interface GuideStep {
  id: string;
  title: string;
  description: string;
  icon?: React.ReactNode;
  tips?: string[];
  example?: string;
  target?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

interface InteractiveGuideProps {
  steps: GuideStep[];
  onComplete: () => void;
  onSkip: () => void;
}

export function InteractiveGuide({ steps, onComplete, onSkip }: InteractiveGuideProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

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

  const handleComplete = () => {
    setIsVisible(false);
    onComplete();
  };

  const handleSkip = () => {
    setIsVisible(false);
    onSkip();
  };

  if (!isVisible) return null;

  const step = steps[currentStep];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center gap-3">
            {step.icon && (
              <div className="p-2 bg-primary/10 rounded-full">
                {step.icon}
              </div>
            )}
            <div>
              <CardTitle className="text-xl">{step.title}</CardTitle>
              <Badge variant="outline" className="mt-1">
                Schritt {currentStep + 1} von {steps.length}
              </Badge>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleSkip}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <p className="text-sm leading-relaxed">{step.description}</p>
            
            {step.example && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm font-medium text-blue-800 mb-1">💡 Beispiel:</p>
                <p className="text-sm text-blue-700">{step.example}</p>
              </div>
            )}
            
            {step.tips && step.tips.length > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm font-medium text-green-800 mb-2">✨ Tipps:</p>
                <ul className="space-y-1">
                  {step.tips.map((tip, index) => (
                    <li key={index} className="text-sm text-green-700 flex items-start">
                      <span className="mr-2">•</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevious}
              disabled={currentStep === 0}
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Zurück
            </Button>

            <div className="flex gap-1">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentStep ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              ))}
            </div>

            <Button size="sm" onClick={handleNext}>
              {currentStep === steps.length - 1 ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Fertig
                </>
              ) : (
                <>
                  Weiter
                  <ArrowRight className="h-4 w-4 ml-1" />
                </>
              )}
            </Button>
          </div>

          <div className="pt-2 border-t">
            <Button variant="ghost" size="sm" onClick={handleSkip} className="w-full text-muted-foreground">
              Tour überspringen
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}