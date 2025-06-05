"use client";
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle2, ChevronRight, ChevronLeft, X } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import Link from 'next/link';

export function FirstStepsWizard() {
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const { user } = useAuth();
  
  const isAdmin = user && user.email === 'admin@rwk-einbeck.de';
  const isVereinsvertreter = user && user.email !== 'admin@rwk-einbeck.de';
  
  const steps = [
    {
      title: "Willkommen bei der RWK App Einbeck",
      description: "Diese kurze Einführung hilft Ihnen, die wichtigsten Funktionen kennenzulernen.",
      content: (
        <div className="space-y-4">
          <div className="mx-auto rounded-lg shadow-md w-[120px] h-[120px] bg-primary/10 flex items-center justify-center">
            <span className="text-4xl font-bold text-primary">RWK</span>
          </div>
          <p>
            Die RWK App Einbeck ist die digitale Plattform für die Rundenwettkämpfe des Kreisschützenverbandes Einbeck.
            Hier können Sie Ergebnisse einsehen, Statistiken analysieren und Termine verwalten.
          </p>
          <p>
            Je nach Ihrer Rolle haben Sie unterschiedliche Berechtigungen und Funktionen zur Verfügung.
          </p>
        </div>
      )
    },
    {
      title: "Navigation und Hauptfunktionen",
      description: "Die wichtigsten Bereiche der Anwendung im Überblick",
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="border rounded-md p-3">
              <h3 className="font-medium mb-1">RWK-Tabellen</h3>
              <p className="text-sm text-muted-foreground">Aktuelle Ergebnisse und Tabellen aller Ligen</p>
            </div>
            <div className="border rounded-md p-3">
              <h3 className="font-medium mb-1">Statistik</h3>
              <p className="text-sm text-muted-foreground">Detaillierte Auswertungen und Visualisierungen</p>
            </div>
            <div className="border rounded-md p-3">
              <h3 className="font-medium mb-1">Termine</h3>
              <p className="text-sm text-muted-foreground">Kalender mit allen Wettkämpfen und Veranstaltungen</p>
            </div>
            <div className="border rounded-md p-3">
              <h3 className="font-medium mb-1">Dokumente</h3>
              <p className="text-sm text-muted-foreground">Wichtige Formulare und Regelwerke</p>
            </div>
          </div>
          <p>
            In der oberen Navigationsleiste finden Sie alle Hauptbereiche der Anwendung.
            Über das Benutzermenü können Sie Ihr Passwort ändern oder sich abmelden.
          </p>
        </div>
      )
    },
    isAdmin ? {
      title: "Admin-Bereich",
      description: "Verwaltung von Saisons, Ligen, Vereinen und mehr",
      content: (
        <div className="space-y-4">
          <p>
            Als Administrator haben Sie Zugriff auf den Admin-Bereich, in dem Sie alle Aspekte der Rundenwettkämpfe verwalten können:
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="border rounded-md p-3">
              <h3 className="font-medium mb-1">Saisons & Ligen</h3>
              <p className="text-sm text-muted-foreground">Erstellen und verwalten Sie Saisons und Ligen</p>
            </div>
            <div className="border rounded-md p-3">
              <h3 className="font-medium mb-1">Vereine & Mannschaften</h3>
              <p className="text-sm text-muted-foreground">Verwalten Sie Vereine und deren Mannschaften</p>
            </div>
            <div className="border rounded-md p-3">
              <h3 className="font-medium mb-1">Schützen</h3>
              <p className="text-sm text-muted-foreground">Verwalten Sie alle Schützen im System</p>
            </div>
            <div className="border rounded-md p-3">
              <h3 className="font-medium mb-1">Ergebnisse</h3>
              <p className="text-sm text-muted-foreground">Erfassen und bearbeiten Sie Wettkampfergebnisse</p>
            </div>
          </div>
          <p>
            Über den Admin-Bereich können Sie auch Benutzerberechtigungen verwalten und Support-Anfragen bearbeiten.
          </p>
        </div>
      )
    } : isVereinsvertreter ? {
      title: "Vereinsbereich",
      description: "Verwaltung Ihres Vereins und seiner Mannschaften",
      content: (
        <div className="space-y-4">
          <p>
            Als Vereinsvertreter haben Sie Zugriff auf den Vereinsbereich, in dem Sie Ihren Verein verwalten können:
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="border rounded-md p-3">
              <h3 className="font-medium mb-1">Mannschaften</h3>
              <p className="text-sm text-muted-foreground">Verwalten Sie die Mannschaften Ihres Vereins</p>
            </div>
            <div className="border rounded-md p-3">
              <h3 className="font-medium mb-1">Schützen</h3>
              <p className="text-sm text-muted-foreground">Verwalten Sie die Schützen Ihres Vereins</p>
            </div>
            <div className="border rounded-md p-3">
              <h3 className="font-medium mb-1">Ergebnisse</h3>
              <p className="text-sm text-muted-foreground">Erfassen Sie Wettkampfergebnisse</p>
            </div>
            <div className="border rounded-md p-3">
              <h3 className="font-medium mb-1">Handtabellen</h3>
              <p className="text-sm text-muted-foreground">Drucken Sie Handtabellen für Wettkämpfe</p>
            </div>
          </div>
          <p>
            Im Vereinsbereich können Sie auch Mannschaftsführer zuweisen und Termine verwalten.
          </p>
        </div>
      )
    } : {
      title: "Allgemeine Funktionen",
      description: "Die wichtigsten Funktionen für alle Benutzer",
      content: (
        <div className="space-y-4">
          <p>
            Als angemeldeter Benutzer haben Sie Zugriff auf folgende Funktionen:
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="border rounded-md p-3">
              <h3 className="font-medium mb-1">RWK-Tabellen</h3>
              <p className="text-sm text-muted-foreground">Aktuelle Ergebnisse und Tabellen aller Ligen</p>
            </div>
            <div className="border rounded-md p-3">
              <h3 className="font-medium mb-1">Statistik</h3>
              <p className="text-sm text-muted-foreground">Detaillierte Auswertungen und Visualisierungen</p>
            </div>
            <div className="border rounded-md p-3">
              <h3 className="font-medium mb-1">Termine</h3>
              <p className="text-sm text-muted-foreground">Kalender mit allen Wettkämpfen und Veranstaltungen</p>
            </div>
            <div className="border rounded-md p-3">
              <h3 className="font-medium mb-1">Dokumente</h3>
              <p className="text-sm text-muted-foreground">Wichtige Formulare und Regelwerke</p>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Passwort ändern",
      description: "Erhöhen Sie die Sicherheit Ihres Kontos",
      content: (
        <div className="space-y-4">
          <p>
            Aus Sicherheitsgründen empfehlen wir Ihnen, Ihr Passwort regelmäßig zu ändern.
            Dies können Sie über den "Passwort ändern"-Button im Vereinsbereich tun.
          </p>
          <div className="border rounded-md p-4 bg-muted/50">
            <h3 className="font-medium mb-2">Tipps für ein sicheres Passwort:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Mindestens 8 Zeichen lang</li>
              <li>Groß- und Kleinbuchstaben verwenden</li>
              <li>Zahlen und Sonderzeichen einbauen</li>
              <li>Keine persönlichen Informationen verwenden</li>
              <li>Für jeden Dienst ein anderes Passwort nutzen</li>
            </ul>
          </div>
          <p className="text-sm text-muted-foreground">
            Wenn Sie Ihr Passwort vergessen haben, können Sie über die Login-Seite die "Passwort vergessen"-Funktion nutzen.
          </p>
        </div>
      )
    },
    {
      title: "Hilfe und Support",
      description: "Wo Sie weitere Unterstützung finden",
      content: (
        <div className="space-y-4">
          <p>
            Wenn Sie Fragen zur Nutzung der RWK App haben oder auf Probleme stoßen, stehen Ihnen folgende Hilfsquellen zur Verfügung:
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="border rounded-md p-3">
              <h3 className="font-medium mb-1">Handbuch</h3>
              <p className="text-sm text-muted-foreground">Ausführliche Dokumentation aller Funktionen</p>
              <Link href="/handbuch" className="text-sm text-primary hover:underline mt-2 inline-block">
                Zum Handbuch
              </Link>
            </div>
            <div className="border rounded-md p-3">
              <h3 className="font-medium mb-1">Support</h3>
              <p className="text-sm text-muted-foreground">Kontaktformular für direkte Hilfe</p>
              <Link href="/support" className="text-sm text-primary hover:underline mt-2 inline-block">
                Zum Support
              </Link>
            </div>
          </div>
          <p>
            Bei technischen Problemen oder Fragen zur Bedienung können Sie jederzeit den Support kontaktieren.
            Wir helfen Ihnen gerne weiter!
          </p>
        </div>
      )
    },
    {
      title: "Fertig!",
      description: "Sie sind bereit für die Nutzung der RWK App Einbeck",
      content: (
        <div className="space-y-4 text-center">
          <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
          <p className="text-lg font-medium">
            Herzlichen Glückwunsch! Sie haben die Einführung abgeschlossen.
          </p>
          <p>
            Sie können diese Einführung jederzeit über den "Erste Schritte"-Button im Vereinsbereich erneut aufrufen.
          </p>
          <p className="text-sm text-muted-foreground mt-6">
            Wir wünschen Ihnen viel Erfolg bei der Nutzung der RWK App Einbeck!
          </p>
        </div>
      )
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setOpen(false);
      setCurrentStep(0);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setCurrentStep(0);
  };

  // Nur für eingeloggte Benutzer anzeigen
  if (!user) return null;

  return (
    <>
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center">
            Erste Schritte
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CardDescription className="mb-4">
            Neu hier? Lernen Sie die wichtigsten Funktionen der RWK App Einbeck kennen.
          </CardDescription>
          <Button 
            variant="default" 
            className="w-full"
            onClick={() => setOpen(true)}
          >
            Erste Schritte starten
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{steps[currentStep].title}</DialogTitle>
            <DialogDescription>{steps[currentStep].description}</DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            {steps[currentStep].content}
          </div>
          
          <DialogFooter className="flex justify-between">
            <div>
              {currentStep > 0 && (
                <Button variant="outline" onClick={handlePrevious}>
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Zurück
                </Button>
              )}
            </div>
            <div className="flex space-x-2">
              <Button variant="ghost" onClick={handleClose}>
                <X className="mr-2 h-4 w-4" />
                Schließen
              </Button>
              <Button onClick={handleNext}>
                {currentStep < steps.length - 1 ? (
                  <>
                    Weiter
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </>
                ) : (
                  'Fertigstellen'
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}