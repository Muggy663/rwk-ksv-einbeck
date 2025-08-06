"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, History } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createSampleAuditEntries } from '@/lib/services/create-sample-audit-entries';
import Link from 'next/link';

export default function CreateSampleAuditEntriesPage() {
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateSamples = async () => {
    setIsCreating(true);
    try {
      await createSampleAuditEntries();
      toast({
        title: 'Beispiel-Einträge erstellt',
        description: 'Die Beispiel-Audit-Einträge wurden erfolgreich erstellt.',
        variant: 'default'
      });
    } catch (error) {
      console.error('Fehler beim Erstellen der Beispiel-Audit-Einträge:', error);
      toast({
        title: 'Fehler',
        description: 'Die Beispiel-Audit-Einträge konnten nicht erstellt werden.',
        variant: 'destructive'
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <History className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold text-primary">Beispiel-Audit-Einträge erstellen</h1>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl text-primary">Beispiel-Einträge für das Änderungsprotokoll</CardTitle>
          <CardDescription>
            Erstellt Beispiel-Einträge für das Änderungsprotokoll, damit es nicht leer ist.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            Diese Funktion erstellt Beispiel-Einträge für das Änderungsprotokoll, damit Sie die Funktionalität testen können.
            Es werden verschiedene Arten von Einträgen erstellt (Erstellen, Aktualisieren, Löschen) für verschiedene Entitäten (Mannschaften, Schützen, Ergebnisse).
          </p>
          <p className="text-muted-foreground">
            Hinweis: Diese Funktion ist nur für Testzwecke gedacht und sollte in der Produktivumgebung nicht verwendet werden.
          </p>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            onClick={handleCreateSamples}
            disabled={isCreating}
          >
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Erstelle Beispiel-Einträge...
              </>
            ) : (
              'Beispiel-Einträge erstellen'
            )}
          </Button>
          <Button variant="outline" asChild>
            <Link href="/admin/audit">Zurück zum Änderungsprotokoll</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
