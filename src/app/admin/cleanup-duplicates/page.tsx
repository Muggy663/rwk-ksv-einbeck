"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BackButton } from '@/components/ui/back-button';
import { Trash2, CheckCircle } from 'lucide-react';
import { cleanupDuplicatesAllClubs, cleanupDuplicatesForClub } from '@/lib/services/cleanup-duplicates';
import { fixGenderFieldsAllClubs } from '@/lib/services/fix-gender';

export default function CleanupDuplicatesPage() {
  const [loading, setLoading] = useState(false);
  const [genderLoading, setGenderLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [genderResult, setGenderResult] = useState(null);

  const cleanup = async () => {
    setLoading(true);
    try {
      const result = await cleanupDuplicatesAllClubs();
      setResult(result);
    } catch (error) {
      console.error('Cleanup failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const fixGender = async () => {
    setGenderLoading(true);
    try {
      const updated = await fixGenderFieldsAllClubs();
      setGenderResult({ updated });
    } catch (error) {
      console.error('Gender fix failed:', error);
    } finally {
      setGenderLoading(false);
    }
  };

  return (
    <div className="container py-4 px-2 max-w-4xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center mb-2">
          <BackButton className="mr-2" fallbackHref="/admin" />
          <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
            <Trash2 className="h-8 w-8" />
            Duplikat-Bereinigung
          </h1>
        </div>
        <p className="text-muted-foreground">
          Entfernt doppelte Mitglieder-Einträge aus der Datenbank
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Duplikate aller Vereine bereinigen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Entfernt alle doppelten Mitglieder-Einträge aus allen 16 Vereinen und behält nur einen pro Schütze.
            </p>
            
            <Button 
              onClick={cleanup}
              disabled={loading}
              className="w-full mb-4"
            >
              {loading ? 'Bereinige...' : 'Duplikate bereinigen'}
            </Button>
            
            <Button 
              onClick={fixGender}
              disabled={genderLoading}
              variant="outline"
              className="w-full"
            >
              {genderLoading ? 'Korrigiere Gender...' : 'Gender-Felder korrigieren'}
            </Button>
            
            {result && (
              <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <h3 className="font-semibold text-green-900">Bereinigung abgeschlossen</h3>
                </div>
                <div className="text-sm text-green-800">
                  <p>• {result.deleted} Duplikate aus allen Vereinen gelöscht</p>
                  <p>• {result.remaining} Mitglieder verbleiben insgesamt</p>
                </div>
              </div>
            )}
            
            {genderResult && (
              <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <h3 className="font-semibold text-green-900">Gender-Korrektur abgeschlossen</h3>
                </div>
                <div className="text-sm text-green-800">
                  <p>• {genderResult.updated} Mitglieder aus allen Vereinen aktualisiert</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}