// src/components/Onboarding.tsx
"use client";
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Users, ListChecks, UserCog, MessagesSquare, FileText, X } from 'lucide-react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { useAuth } from '@/hooks/use-auth';

export function Onboarding() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('welcome');
  const [hasSeenOnboarding, setHasSeenOnboarding] = useLocalStorage('hasSeenOnboarding', false);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const { user, userAppPermissions } = useAuth();

  // Prüfen, ob der Benutzer ein Vereinsvertreter oder Mannschaftsführer ist
  const isRegularUser = () => {
    if (!user) return false;
    
    // Admin-E-Mail überspringen (keine Einführung anzeigen)
    if (user.email === "admin@rwk-einbeck.de") return false;
    
    // Prüfen, ob Benutzer Vereinsvertreter oder Mannschaftsführer ist
    if (userAppPermissions) {
      return userAppPermissions.role === 'vereinsvertreter' || 
             userAppPermissions.role === 'mannschaftsfuehrer';
    }
    
    return false;
  };

  useEffect(() => {
    // Zeige Onboarding nur, wenn es noch nicht gesehen wurde UND der Benutzer ein regulärer Benutzer ist
    if (!hasSeenOnboarding && isRegularUser()) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 1000); // Verzögerung für bessere Benutzererfahrung
      return () => clearTimeout(timer);
    }
  }, [hasSeenOnboarding, user, userAppPermissions]);

  const handleClose = () => {
    setIsOpen(false);
    if (dontShowAgain) {
      setHasSeenOnboarding(true);
    }
  };

  const handleNext = (nextTab: string) => {
    setActiveTab(nextTab);
  };

  // Wenn kein regulärer Benutzer, dann nichts rendern
  if (!isRegularUser()) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-3xl max-h-[75vh] overflow-hidden">
        <div className="onboarding-content">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle className="text-2xl font-bold text-primary">Willkommen zur RWK App v0.6.3</DialogTitle>
            <Button variant="ghost" size="icon" onClick={handleClose} className="rounded-full">
              <X className="h-4 w-4" />
            </Button>
          </div>
          <DialogDescription>
            Die digitale Plattform für die Rundenwettkämpfe des Kreisschützenverbandes Einbeck
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-4 mb-6">
            <TabsTrigger value="welcome">Willkommen</TabsTrigger>
            <TabsTrigger value="features">Funktionen</TabsTrigger>
            <TabsTrigger value="roles">Benutzerrollen</TabsTrigger>
            <TabsTrigger value="start">Loslegen</TabsTrigger>
          </TabsList>
          
          <TabsContent value="welcome" className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold text-primary mb-2">Herzlich willkommen!</h2>
              <p className="text-muted-foreground">
                Diese App wurde entwickelt, um die Verwaltung und Anzeige der Rundenwettkämpfe zu vereinfachen.
                Lassen Sie sich kurz durch die wichtigsten Funktionen führen.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Trophy className="mr-2 h-5 w-5 text-primary" />
                    Aktuelle Tabellen
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Sehen Sie aktuelle Mannschafts- und Einzelranglisten mit detaillierten Ergebnissen.</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="mr-2 h-5 w-5 text-primary" />
                    Vereinsverwaltung
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Verwalten Sie Ihre Mannschaften und Schützen als Vereinsvertreter.</p>
                </CardContent>
              </Card>
            </div>
            <div className="flex justify-end mt-4">
              <Button onClick={() => handleNext('features')}>Weiter</Button>
            </div>
          </TabsContent>
          
          <TabsContent value="features" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <ListChecks className="mr-2 h-5 w-5 text-primary" />
                    Ergebniserfassung
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Einfache Eingabe von Wettkampfergebnissen mit automatischer Validierung und Berechnung.</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="mr-2 h-5 w-5 text-primary" />
                    Dokumente
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Zugriff auf wichtige Dokumente wie Ausschreibungen, Formulare und die RWK-Ordnung.</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <UserCog className="mr-2 h-5 w-5 text-primary" />
                    Benutzerverwaltung
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Administratoren können Benutzerrollen und -berechtigungen verwalten.</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MessagesSquare className="mr-2 h-5 w-5 text-primary" />
                    Support
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Bei Fragen oder Problemen können Sie über das Support-Formular Hilfe anfordern.</p>
                </CardContent>
              </Card>
            </div>
            <div className="flex justify-between mt-4">
              <Button variant="outline" onClick={() => handleNext('welcome')}>Zurück</Button>
              <Button onClick={() => handleNext('roles')}>Weiter</Button>
            </div>
          </TabsContent>
          
          <TabsContent value="roles" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-primary">Vereinsvertreter</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    <li>Verwaltung der Mannschaften des Vereins</li>
                    <li>Verwaltung der Schützen des Vereins</li>
                    <li>Ergebniserfassung für Mannschaften</li>
                    <li>Zugriff auf Vereinsdaten</li>
                  </ul>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-primary">Mannschaftsführer</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    <li>Ergebniserfassung für eigene Mannschaft</li>
                    <li>Einsicht in Mannschafts- und Schützendaten</li>
                    <li>Keine Bearbeitungsrechte für Stammdaten</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
            <div className="flex justify-between mt-4">
              <Button variant="outline" onClick={() => handleNext('features')}>Zurück</Button>
              <Button onClick={() => handleNext('start')}>Weiter</Button>
            </div>
          </TabsContent>
          
          <TabsContent value="start" className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold text-primary mb-2">Bereit zum Loslegen!</h2>
              <p className="text-muted-foreground">
                Sie können jetzt die RWK App nutzen. Bei Fragen oder Problemen nutzen Sie bitte das Support-Formular.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Neues in Version 0.6.3</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Automatischer Logout nach 10 Minuten Inaktivität</li>
                    <li>Gesamtrangliste aller Einzelschützen mit Geschlechterfilter</li>
                    <li>Urkunden-Generator für Schützen und Mannschaften</li>
                    <li>Passwort-Sichtbarkeits-Toggle für einfachere Anmeldung</li>
                    <li>Optimierte PDF-Layouts mit neuem Kreisverbandslogo</li>
                  </ul>
                  <div className="mt-2">
                    <a href="/updates" className="text-primary hover:underline text-sm">Alle Versionen anzeigen →</a>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Hilfreiche Links</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc pl-5 space-y-1">
                    <li><a href="/handbuch" className="text-primary hover:underline">Benutzerhandbuch</a></li>
                    <li><a href="/rwk-ordnung" className="text-primary hover:underline">RWK-Ordnung</a></li>
                    <li><a href="/updates" className="text-primary hover:underline">Updates & Changelog</a></li>
                    <li><a href="/support" className="text-primary hover:underline">Support-Formular</a></li>
                  </ul>
                </CardContent>
              </Card>
            </div>
            <div className="flex items-center mt-2">
              <input
                type="checkbox"
                id="dontShowAgain"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
                className="mr-2"
              />
              <label htmlFor="dontShowAgain" className="text-sm text-muted-foreground">
                Diese Einführung nicht mehr anzeigen
              </label>
            </div>
          </TabsContent>
        </Tabs>
        
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            {activeTab === 'start' ? 'Fertig' : 'Überspringen'}
          </Button>
        </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
