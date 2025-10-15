"use client";
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { HelpCircle, Smartphone, Monitor, AlertTriangle } from 'lucide-react';
import { isSafari, isIOS } from '@/lib/utils/safari-pdf-fix';
import { useNativeApp } from '@/components/ui/native-app-detector';

export function PDFHelpDialog() {
  const [open, setOpen] = useState(false);
  const { isNativeApp } = useNativeApp();
  
  const safariDetected = isSafari();
  const iosDetected = isIOS();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-muted-foreground">
          <HelpCircle className="h-4 w-4 mr-1" />
          PDF-Hilfe
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            PDF-Export Hilfe
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Aktuelle Plattform */}
          <div className="bg-muted/20 p-3 rounded-md">
            <h4 className="font-medium mb-2 flex items-center gap-2">
              {isNativeApp ? (
                <>
                  <Smartphone className="h-4 w-4" />
                  Android App
                </>
              ) : safariDetected ? (
                <>
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  Safari Browser
                </>
              ) : (
                <>
                  <Monitor className="h-4 w-4" />
                  Desktop Browser
                </>
              )}
            </h4>
            
            {isNativeApp && (
              <p className="text-sm text-muted-foreground">
                In der Android App können Sie PDFs über die "Teilen"-Funktion exportieren. 
                Die PDF wird erstellt und kann dann über andere Apps geteilt oder gespeichert werden.
              </p>
            )}
            
            {safariDetected && (
              <div className="space-y-2">
                <p className="text-sm text-amber-700">
                  Safari hat bekannte Probleme mit PDF-Downloads. Das PDF wird in einem neuen Tab geöffnet.
                </p>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>• Zum Speichern: Rechtsklick → "Speichern unter..." oder ⌘+S</p>
                  <p>• Falls nichts passiert: Popups für diese Seite erlauben</p>
                  <p>• Für beste Ergebnisse: Chrome oder Firefox verwenden</p>
                </div>
              </div>
            )}
            
            {!isNativeApp && !safariDetected && (
              <p className="text-sm text-muted-foreground">
                PDFs werden automatisch heruntergeladen. Prüfen Sie Ihren Downloads-Ordner.
              </p>
            )}
          </div>

          {/* Allgemeine Tipps */}
          <div>
            <h4 className="font-medium mb-2">Allgemeine Tipps</h4>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>• PDFs enthalten alle aktuellen Tabellenstände</p>
              <p>• Mannschaften-PDF: Übersicht + Einzelschützen pro Team</p>
              <p>• Einzelschützen-PDF: Komplette Rangliste der Liga</p>
              <p>• Bei Problemen: Seite neu laden und erneut versuchen</p>
            </div>
          </div>

          {/* Browser-Empfehlungen */}
          <div>
            <h4 className="font-medium mb-2">Empfohlene Browser</h4>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>✅ Chrome (beste Unterstützung)</p>
              <p>✅ Firefox (sehr gut)</p>
              <p>✅ Edge (gut)</p>
              <p>⚠️ Safari (eingeschränkt)</p>
              <p>❌ Internet Explorer (nicht unterstützt)</p>
            </div>
          </div>

          <Button 
            onClick={() => setOpen(false)} 
            className="w-full"
          >
            Verstanden
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}