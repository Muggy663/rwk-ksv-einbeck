"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, UserCog } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createSampleUserLogins } from '@/lib/services/create-sample-user-logins';
import Link from 'next/link';

export default function CreateSampleUserLoginsPage() {
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateSamples = async () => {
    setIsCreating(true);
    try {
      const count = await createSampleUserLogins();
      toast({
        title: 'Login-Daten erstellt',
        description: `Login-Daten für ${count} Benutzer wurden erfolgreich erstellt.`,
        variant: 'default'
      });
    } catch (error) {
      console.error('Fehler beim Erstellen der Login-Daten:', error);
      toast({
        title: 'Fehler',
        description: 'Die Login-Daten konnten nicht erstellt werden.',
        variant: 'destructive'
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <UserCog className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold text-primary">Beispiel-Login-Daten erstellen</h1>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl text-primary">Beispiel-Login-Daten für Benutzer</CardTitle>
          <CardDescription>
            Erstellt Beispiel-Login-Daten für Benutzer, damit der letzte Login angezeigt werden kann.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            Diese Funktion erstellt für jeden Benutzer in der user_permissions-Collection einen Eintrag in der users-Collection mit einem zufälligen letzten Login-Datum in den letzten 30 Tagen.
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
                Erstelle Login-Daten...
              </>
            ) : (
              'Login-Daten erstellen'
            )}
          </Button>
          <Button variant="outline" asChild>
            <Link href="/admin/user-management">Zurück zur Benutzerverwaltung</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
