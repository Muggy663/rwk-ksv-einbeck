"use client";
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Info, ArrowDownUp, Settings } from 'lucide-react';

type TabValue = 'info' | 'rules' | 'transition';

export default function SeasonTransitionPage() {
  const [activeTab, setActiveTab] = useState<TabValue>('info');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-primary">Saisonwechsel</h1>
          <p className="text-muted-foreground">
            Verwaltung des Saisonwechsels und der Auf-/Abstiegsregeln
          </p>
        </div>
      </div>

      <Alert variant="warning">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Hinweis</AlertTitle>
        <AlertDescription>
          Diese Funktion befindet sich noch in der Entwicklung und wird in Version 0.9.0 vollständig implementiert.
          Hier sehen Sie eine Vorschau der geplanten Funktionalität.
        </AlertDescription>
      </Alert>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabValue)} className="w-full">
        <TabsList className="grid grid-cols-3 mb-8">
          <TabsTrigger value="info">Übersicht</TabsTrigger>
          <TabsTrigger value="rules">Auf-/Abstiegsregeln</TabsTrigger>
          <TabsTrigger value="transition">Saisonwechsel</TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Info className="mr-2 h-5 w-5" />
                Informationen zum Saisonwechsel
              </CardTitle>
              <CardDescription>
                Überblick über den Prozess des Saisonwechsels und der Auf-/Abstiegsregeln
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Was ist der Saisonwechsel?</h3>
                <p>
                  Der Saisonwechsel ist der Prozess, bei dem eine Saison abgeschlossen und eine neue Saison erstellt wird.
                  Dabei werden die Ergebnisse der abgeschlossenen Saison archiviert und die neuen Ligen und Mannschaften
                  für die kommende Saison basierend auf den Auf- und Abstiegsregeln erstellt.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Ablauf des Saisonwechsels</h3>
                <ol className="list-decimal pl-5 space-y-2">
                  <li>
                    <strong>Vorbereitung:</strong> Überprüfung der Vollständigkeit aller Ergebnisse der aktuellen Saison
                  </li>
                  <li>
                    <strong>Archivierung:</strong> Sicherung aller Daten der aktuellen Saison
                  </li>
                  <li>
                    <strong>Auf-/Abstiegsberechnung:</strong> Anwendung der definierten Regeln auf die Abschlusstabellen
                  </li>
                  <li>
                    <strong>Neue Saison erstellen:</strong> Erstellung der neuen Saison mit aktualisierten Ligen
                  </li>
                  <li>
                    <strong>Mannschaftszuordnung:</strong> Zuordnung der Mannschaften zu den neuen Ligen
                  </li>
                </ol>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Wichtige Hinweise</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Der Saisonwechsel sollte nur durchgeführt werden, wenn alle Ergebnisse vollständig sind</li>
                  <li>Vor dem Saisonwechsel wird eine Sicherung der Datenbank erstellt</li>
                  <li>Der Prozess kann nicht rückgängig gemacht werden</li>
                  <li>Manuelle Anpassungen der automatischen Zuordnungen sind möglich</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rules">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="mr-2 h-5 w-5" />
                Auf- und Abstiegsregeln
              </CardTitle>
              <CardDescription>
                Definition der Regeln für den Auf- und Abstieg zwischen den Ligen
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted p-4 rounded-md">
                <h3 className="text-lg font-semibold mb-2">Standardregeln</h3>
                <p className="mb-4">
                  Die folgenden Standardregeln werden angewendet, wenn keine spezifischen Regeln definiert sind:
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Der Erstplatzierte jeder Liga steigt in die nächsthöhere Liga auf</li>
                  <li>Der Letztplatzierte jeder Liga steigt in die nächstniedrigere Liga ab</li>
                  <li>Bei gleicher Punktzahl entscheidet der direkte Vergleich</li>
                  <li>Bei gleichem direkten Vergleich entscheidet die Gesamtringzahl</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Spezifische Regeln (in Entwicklung)</h3>
                <p className="text-muted-foreground mb-4">
                  In der vollständigen Version können hier spezifische Regeln für jede Liga definiert werden:
                </p>
                <div className="border rounded-md p-4">
                  <p className="text-center text-muted-foreground">
                    Formular zur Definition spezifischer Auf-/Abstiegsregeln (in Entwicklung)
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Sonderregeln</h3>
                <p className="mb-2">
                  Folgende Sonderregeln können bei Bedarf angewendet werden:
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Relegation zwischen dem Vorletzten einer höheren Liga und dem Zweiten einer niedrigeren Liga</li>
                  <li>Mehrfachauf- oder -abstieg bei Ligaerweiterung oder -verkleinerung</li>
                  <li>Verzicht auf Aufstieg mit Nachrücken des Zweitplatzierten</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transition">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <ArrowDownUp className="mr-2 h-5 w-5" />
                Saisonwechsel durchführen
              </CardTitle>
              <CardDescription>
                Assistent zur Durchführung des Saisonwechsels
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Achtung</AlertTitle>
                <AlertDescription>
                  Diese Funktion ist noch nicht implementiert und wird in Version 0.9.0 verfügbar sein.
                  Der Saisonwechsel kann derzeit nur manuell durchgeführt werden.
                </AlertDescription>
              </Alert>

              <div className="border rounded-md p-6 bg-muted/50">
                <h3 className="text-lg font-semibold mb-4">Vorschau: Saisonwechsel-Assistent</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">1</div>
                    <div>
                      <h4 className="font-medium">Aktuelle Saison abschließen</h4>
                      <p className="text-sm text-muted-foreground">Überprüfung der Vollständigkeit aller Ergebnisse</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">2</div>
                    <div>
                      <h4 className="font-medium">Auf- und Abstieg berechnen</h4>
                      <p className="text-sm text-muted-foreground">Anwendung der definierten Regeln auf die Abschlusstabellen</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">3</div>
                    <div>
                      <h4 className="font-medium">Neue Saison erstellen</h4>
                      <p className="text-sm text-muted-foreground">Definition der neuen Saison und Ligen</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">4</div>
                    <div>
                      <h4 className="font-medium">Mannschaften zuordnen</h4>
                      <p className="text-sm text-muted-foreground">Automatische und manuelle Zuordnung der Mannschaften zu den neuen Ligen</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">5</div>
                    <div>
                      <h4 className="font-medium">Abschluss und Aktivierung</h4>
                      <p className="text-sm text-muted-foreground">Aktivierung der neuen Saison und Archivierung der alten Saison</p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end">
                  <Button disabled>Saisonwechsel starten</Button>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Manuelle Schritte für den Saisonwechsel</h3>
                <p className="mb-4">
                  Bis zur vollständigen Implementierung des Assistenten können Sie den Saisonwechsel mit folgenden manuellen Schritten durchführen:
                </p>
                <ol className="list-decimal pl-5 space-y-2">
                  <li>Erstellen Sie eine neue Saison unter &quot;Admin &gt; Saisons&quot;</li>
                  <li>Erstellen Sie die Ligen für die neue Saison</li>
                  <li>Erstellen Sie die Mannschaften für die neue Saison basierend auf den Ergebnissen der Vorsaison</li>
                  <li>Weisen Sie die Schützen den neuen Mannschaften zu</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}