import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Document } from '@/lib/services/document-service';
import { Button } from '@/components/ui/button';
import { Download, X } from 'lucide-react';

interface DocumentPreviewProps {
  document: Document;
  isOpen: boolean;
  onClose: () => void;
}

export function DocumentPreview({ document, isOpen, onClose }: DocumentPreviewProps) {
  const [loading, setLoading] = useState(true);
  
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
    const link = document.createElement('a');
    link.href = documentPath;
    link.download = document.title;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0">
        <DialogHeader className="p-4 border-b flex flex-row justify-between items-center">
          <DialogTitle>{document.title}</DialogTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Herunterladen
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          )}
          
          <iframe 
            src={`${documentPath}#toolbar=0`}
            className="w-full h-full"
            onLoad={() => setLoading(false)}
            title={document.title}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}