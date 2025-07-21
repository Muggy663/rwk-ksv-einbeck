import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Document } from '@/lib/services/document-service';
import { Button } from '@/components/ui/button';
import { Download, X, ExternalLink } from 'lucide-react';
import { isMobileDevice } from '@/lib/utils/is-mobile';

interface DocumentPreviewProps {
  document: Document;
  isOpen: boolean;
  onClose: () => void;
}

export function DocumentPreview({ document, isOpen, onClose }: DocumentPreviewProps) {
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    setIsMobile(isMobileDevice());
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
  
  const handleDownload = () => {
    // Einfacher Download oder Browser-Öffnung je nach Gerät
    if (isMobileDevice()) {
      window.open(documentPath, '_blank');
    } else {
      const link = document.createElement('a');
      link.href = documentPath;
      link.download = document.title;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    
    // Tracking
    fetch(`/api/documents/${document.id}/download`, { method: 'POST' })
      .catch(err => console.warn('Download-Tracking fehlgeschlagen:', err));
  };
  
  const handleExternalOpen = () => {
    // Im Browser öffnen
    window.open(documentPath, '_blank');
    
    // Tracking
    fetch(`/api/documents/${document.id}/download`, { method: 'POST' })
      .catch(err => console.warn('Download-Tracking fehlgeschlagen:', err));
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0">
        <DialogHeader className="p-4 border-b flex flex-row justify-between items-center">
          <DialogTitle className="text-sm sm:text-base">{document.title}</DialogTitle>
          {!isMobile && (
            <Button variant="outline" size="sm" onClick={handleDownload} className="flex items-center gap-1.5">
              <Download className="h-4 w-4" />
              <span>Herunterladen</span>
            </Button>
          )}
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          )}
          
          {isMobile ? (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
              <p className="mb-6 text-muted-foreground">
                PDF-Vorschau ist auf mobilen Geräten eingeschränkt. Bitte wählen Sie eine der folgenden Optionen:
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
          ) : (
            <iframe 
              src={`${documentPath}#toolbar=0`}
              className="w-full h-full"
              onLoad={() => setLoading(false)}
              title={document.title}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}