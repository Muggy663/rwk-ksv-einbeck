// src/app/updates/v1.7.5.5/page.tsx
"use client";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BackButton } from '@/components/ui/back-button';
import { CheckCircle, FileText, Calendar, Image, Clock } from 'lucide-react';

export default function UpdateV1755Page() {
  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center space-x-3">
        <BackButton className="mr-2" fallbackHref="/updates" />
        <div>
          <h1 className="text-3xl font-bold text-primary">Version 1.7.5.5</h1>
          <p className="text-muted-foreground">Handzettel-Generator Logo-Fix</p>
        </div>
        <Badge variant="secondary" className="ml-auto">
          Aktuell
        </Badge>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Handzettel-Generator Verbesserungen
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <h4 className="font-medium">Logo-Anzeige beim Drucken korrigiert</h4>
                <p className="text-sm text-muted-foreground">
                  Das Logo wird jetzt korrekt in der Druckansicht angezeigt. Timing-Problem behoben durch 500ms Verzögerung.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <h4 className="font-medium">Deutsches Datumsformat</h4>
                <p className="text-sm text-muted-foreground">
                  Datum wird jetzt im deutschen Format (TT.MM.JJJJ) angezeigt statt im amerikanischen Format.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <h4 className="font-medium">Logo-Größe optimiert</h4>
                <p className="text-sm text-muted-foreground">
                  Logo wurde auf 100px vergrößert für bessere Sichtbarkeit in gedruckten Dokumenten.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Technische Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li>• Timing-Fix für Logo-Laden beim Drucken (500ms Verzögerung)</li>
              <li>• Deutsches Datumsformat mit toLocaleDateString('de-DE')</li>
              <li>• Logo-Größe von 80px auf 100px erhöht</li>
              <li>• Vereinfachte Print-Funktion ohne Base64-Konvertierung</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Betroffene Bereiche</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">Handzettel-Generator</Badge>
              <Badge variant="outline">PDF-Export</Badge>
              <Badge variant="outline">Druckfunktion</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}