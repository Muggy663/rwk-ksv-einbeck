"use client";

import { useState } from 'react';
import { ResultEntry } from '@/components/social/ResultEntry';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { SocialTrainingService } from '@/lib/services/social-training-service';

export default function ResultEntryPage() {
  const { toast } = useToast();

  const handleResultSubmit = async (result: any) => {
    try {
      // Speichere lokal (ohne Firebase für jetzt)
      const resultData = {
        userId: 'current-user-id',
        discipline: result.discipline,
        shots: result.shots,
        rings: result.rings,
        average: result.average,
        date: result.date,
        proofType: result.proofType,
        verified: result.proofType === 'verified'
      };
      
      // TODO: Firebase Integration später
      console.log('Social Training Ergebnis:', resultData);
      
      toast({
        title: "Ergebnis gespeichert!",
        description: `${result.shots} Schuss, ${result.rings} Ringe (Ø ${result.average.toFixed(1)})`,
      });
    } catch (error) {
      toast({
        title: "Fehler beim Speichern",
        description: "Ergebnis konnte nicht gespeichert werden",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-2xl">
      <div className="mb-6">
        <Button asChild variant="ghost" className="mb-4">
          <Link href="/social">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück zu Social Training
          </Link>
        </Button>
        
        <h1 className="text-3xl font-bold mb-2">Ergebnis eingeben</h1>
        <p className="text-muted-foreground">
          Trage deine Trainingsergebnisse ein und wähle die Art des Nachweises
        </p>
      </div>

      <ResultEntry onSubmit={handleResultSubmit} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
          <h3 className="font-semibold mb-2">📋 Nachweis-Arten:</h3>
          <div className="text-sm space-y-1">
            <div>• <strong>Vertrauen:</strong> Ehrensystem</div>
            <div>• <strong>Foto-Beweis:</strong> KI-Analyse möglich</div>
            <div>• <strong>Verifiziert:</strong> Trainer bestätigt</div>
          </div>
        </div>
        
        <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
          <h3 className="font-semibold mb-2">🔗 Schießnachweis:</h3>
          <div className="text-sm space-y-1">
            <div>• Ergebnisse auch für Behörden speichern</div>
            <div>• PDF-Export möglich</div>
            <div>• Erweiterte Statistiken</div>
          </div>
        </div>
      </div>
    </div>
  );
}
