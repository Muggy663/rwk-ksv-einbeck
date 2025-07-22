import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Document } from '@/lib/services/document-service';
import { Button } from '@/components/ui/button';
import { Download, X, ExternalLink, Share2 } from 'lucide-react';
import { isMobileDevice } from '@/lib/utils/is-mobile';
import { openWithAppChooser } from '@/lib/utils/open-external';

interface DocumentPreviewProps {
  document: Document;
  isOpen: boolean;
  onClose: () => void;
}

export function DocumentPreview({ document, isOpen, onClose }: DocumentPreviewProps) {
  // Wir entfernen den Loading-Status komplett, da er Probleme verursacht
  const [isMobile, setIsMobile] = useState(false);
  const [isNativeApp, setIsNativeApp] = useState(false);
  
  useEffect(() => {
    // Prüfe, ob wir auf einem mobilen Gerät sind
    setIsMobile(isMobileDevice());
    
    // Prüfe, ob wir in einer nativen App sind
    setIsNativeApp(window.Capacitor && window.Capacitor.isNativePlatform());
  }, []);
  
  // Funktion zur Generierung des korrekten Pfads
  function getDocumentPath(path: string): string {
    if (!path) return '#';
    
    // Wenn der Pfad bereits mit http beginnt, verwenden wir ihn direkt
    if (path.startsWith('http')) return path;
    
    // Wenn der Pfad mit /api beginnt, verwenden wir ihn direkt (MongoDB GridFS)
    if (path.startsWith('/api')) return path;
    
    // Für relative Pfade verwenden wir den Pfad direkt
    return path;
  }
  
  const documentPath = getDocumentPath(document.path);
  
  // Tracking-Funktion
  const trackDownload = async () => {
    try {
      await fetch(`/api/documents/${document.id}/download`, { method: 'POST' });
    } catch (err) {
      console.warn('Download-Tracking fehlgeschlagen:', err);
    }
  };
  
  const handleDownload = async () => {
    try {
      // Dialog schließen, bevor wir weitere Aktionen ausführen
      onClose();
      
      // Tracking
      await trackDownload();
      
      // Kurze Verzögerung
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Download starten
      if (isNativeApp) {
        // In nativer App: Direkte Methode verwenden
        console.log('Native App erkannt, verwende direkten Download');
        
        // Stelle sicher, dass die URL absolut ist
        let fullPath = documentPath;
        if (!fullPath.startsWith('http')) {
          const baseUrl = window.location.origin;
          fullPath = `${baseUrl}${fullPath.startsWith('/') ? '' : '/'}${fullPath}`;
        }
        
        // Für Android: Versuche Intent-URL direkt
        if (window.Capacitor && window.Capacitor.getPlatform() === 'android') {
          console.log('Android erkannt, verwende Intent-URL');
          window.location.href = `intent:${fullPath}#Intent;action=android.intent.action.VIEW;type=application/pdf;end`;
        } else {
          // Für iOS und andere
          window.open(fullPath, '_system');
        }
      } else if (isMobile) {
        // Auf mobilen Browsern
        await openWithAppChooser(documentPath);
      } else {
        // Auf Desktop-Geräten
        const link = document.createElement('a');
        link.href = documentPath;
        link.download = document.title + '.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error('Fehler beim Herunterladen:', error);
      // Fallback bei Fehler
      window.open(documentPath, '_blank');
    }
  };
  
  const handleExternalOpen = async () => {
    try {
      // Dialog schließen, bevor wir weitere Aktionen ausführen
      onClose();
      
      // Tracking
      await trackDownload();
      
      // Kurze Verzögerung
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Stelle sicher, dass die URL absolut ist
      let fullPath = documentPath;
      if (!fullPath.startsWith('http')) {
        const baseUrl = window.location.origin;
        fullPath = `${baseUrl}${fullPath.startsWith('/') ? '' : '/'}${fullPath}`;
      }
      
      // Im Browser öffnen - spezielle Behandlung für native App
      if (isNativeApp && window.Capacitor) {
        console.log('Native App erkannt, öffne im externen Browser');
        
        try {
          // Versuche mit Capacitor Browser Plugin
          const { Browser } = await import('@capacitor/browser');
          await Browser.open({ url: fullPath });
        } catch (capacitorError) {
          console.error('Capacitor Browser Fehler:', capacitorError);
          // Fallback
          window.open(fullPath, '_system');
        }
      } else {
        // Standard-Browser
        window.open(fullPath, '_blank');
      }
    } catch (error) {
      console.error('Fehler beim Öffnen im Browser:', error);
    }
  };
  
  const handleAppOpen = async () => {
    try {
      // Dialog schließen, bevor wir weitere Aktionen ausführen
      onClose();
      
      // Tracking
      await trackDownload();
      
      // Kurze Verzögerung
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Stelle sicher, dass die URL absolut ist
      let fullPath = documentPath;
      if (!fullPath.startsWith('http')) {
        const baseUrl = window.location.origin;
        fullPath = `${baseUrl}${fullPath.startsWith('/') ? '' : '/'}${fullPath}`;
      }
      
      // Mit App öffnen - direkte Methode für native App
      if (isNativeApp && window.Capacitor) {
        console.log('Native App erkannt, öffne direkt');
        
        if (window.Capacitor.getPlatform() === 'android') {
          // Android: Verwende Intent-URL
          console.log('Android erkannt, verwende Intent-URL für PDF');
          // Direkte Intent-URL für PDF-Viewer
          window.location.href = `intent:${fullPath}#Intent;action=android.intent.action.VIEW;type=application/pdf;end`;
        } else {
          // iOS: Verwende _system
          window.open(fullPath, '_system');
        }
      } else {
        // Mobiler Browser
        await openWithAppChooser(fullPath);
      }
    } catch (error) {
      console.error('Fehler beim Öffnen mit App:', error);
      // Fallback bei Fehler
      window.open(documentPath, '_blank');
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0">
        <DialogHeader className="p-4 border-b flex flex-row justify-between items-center">
          <DialogTitle className="text-sm sm:text-base">{document.title}</DialogTitle>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden flex items-center justify-center">
          {/* Wir zeigen auf allen Geräten nur die Optionen an, keine iframe-Vorschau mehr */}
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <p className="mb-6 text-muted-foreground">
              Wie möchten Sie das Dokument "{document.title}" öffnen?
            </p>
            <div className="flex flex-col gap-4 w-full max-w-xs">
              <Button onClick={handleExternalOpen} className="flex items-center justify-center">
                <ExternalLink className="h-4 w-4 mr-2" />
                Im Browser öffnen
              </Button>
              
              <Button onClick={handleDownload} variant="outline" className="flex items-center justify-center">
                <Download className="h-4 w-4 mr-2" />
                Herunterladen
              </Button>

            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}