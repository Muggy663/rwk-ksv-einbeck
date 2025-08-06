"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Settings, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase/config';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export default function EmailSettingsPage() {
  const { toast } = useToast();
  const [signature, setSignature] = useState(`---
WICHTIGER HINWEIS: 
Bitte antworten Sie NICHT auf diese E-Mail.
Bei Fragen oder Rückmeldungen schreiben Sie an: rwk-leiter-ksve@gmx.de

Mit sportlichen Grüßen
Marcel Bünger
Rundenwettkampfleiter KSVE Einbeck`);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const settingsDoc = await getDoc(doc(db, 'admin_settings', 'email_signature'));
      if (settingsDoc.exists()) {
        setSignature(settingsDoc.data().signature || signature);
      }
    } catch (error) {
      console.error('Fehler beim Laden der E-Mail-Einstellungen:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      await setDoc(doc(db, 'admin_settings', 'email_signature'), {
        signature: signature,
        updatedAt: new Date(),
        updatedBy: 'admin@rwk-einbeck.de'
      });

      toast({
        title: 'Einstellungen gespeichert',
        description: 'E-Mail-Signatur wurde aktualisiert.',
      });
    } catch (error) {
      console.error('Fehler beim Speichern:', error);
      toast({
        title: 'Fehler',
        description: 'Einstellungen konnten nicht gespeichert werden.',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Lade Einstellungen...</div>;
  }

  return (
    <div className="container py-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
          <Settings className="h-8 w-8" />
          E-Mail-Einstellungen
        </h1>
        <p className="text-muted-foreground mt-2">
          Passen Sie die E-Mail-Signatur für alle ausgehenden E-Mails an.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>E-Mail-Signatur</CardTitle>
          <CardDescription>
            Diese Signatur wird automatisch an alle E-Mails angehängt, die über das E-Mail-System versendet werden.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="signature">Signatur-Text</Label>
            <Textarea
              id="signature"
              value={signature}
              onChange={(e) => setSignature(e.target.value)}
              rows={8}
              placeholder="Ihre E-Mail-Signatur..."
            />
            <p className="text-xs text-muted-foreground">
              Die Signatur wird automatisch nach jeder E-Mail-Nachricht eingefügt.
            </p>
          </div>

          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-medium mb-2">Vorschau:</h4>
            <div className="text-sm whitespace-pre-line bg-white p-3 rounded border">
              [Ihre E-Mail-Nachricht]
              
              {signature}
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={saveSettings} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Save className="mr-2 h-4 w-4 animate-spin" />
                  Speichert...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Signatur speichern
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
