// src/app/dokumente/DocumentCard.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download, Calendar, Info, Eye, Lock, ExternalLink, Share2 } from 'lucide-react';
import Link from 'next/link';
import { Document } from '@/lib/services/document-service';
import { YearBadge } from './YearBadge';
import { FavoriteButton } from './FavoriteButton';
import { DocumentPreview } from './DocumentPreview';
import { isMobileDevice } from '@/lib/utils/is-mobile';
import { openWithAppChooser } from '@/lib/utils/open-external';
import { downloadFile } from '@/lib/utils/download-file';

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

export function DocumentCard({ document }: { document: Document }) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const documentPath = getDocumentPath(document.path);
  
  useEffect(() => {
    setIsMobile(isMobileDevice());
  }, []);
  
  return (
    <>
      <Card className={`hover:shadow-md transition-shadow ${document.restricted ? 'border-amber-300' : ''}`}>
        <CardHeader className="pb-2">
          <div className="flex flex-col md:flex-row md:justify-between md:items-start">
            <div>
              <CardTitle className="text-base md:text-lg flex items-center flex-wrap">
                <FileText className="h-4 w-4 md:h-5 md:w-5 mr-2 text-primary" />
                {document.title}
                {document.restricted && (
                  <Lock className="h-4 w-4 ml-2 text-amber-500" title="Nur für Vereinsvertreter/Mannschaftsführer" />
                )}
                {document.category === 'ligaliste' && (
                  <YearBadge title={document.title} description={document.description} />
                )}
              </CardTitle>
              <CardDescription className="mt-1 text-xs md:text-sm">{document.description}</CardDescription>
            </div>
            <div className="text-xs text-muted-foreground flex items-center mt-2 md:mt-0 gap-2">
              <div className="flex items-center">
                <Calendar className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                {document.date}
              </div>
              <FavoriteButton document={document} />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0">
            <div className="text-xs md:text-sm text-muted-foreground">
              <span className="font-medium">{document.fileType}</span>
              {document.fileSize !== '-' && <span> • {document.fileSize}</span>}
              {document.fileType === 'PDF' && <span> • {document.downloadCount || 0}x heruntergeladen</span>}
              {document.category && (
                <span className="ml-2 bg-muted px-1.5 py-0.5 rounded text-xs">
                  {document.category === 'ausschreibung' && 'Ausschreibung'}
                  {document.category === 'formular' && 'Formular'}
                  {document.category === 'ordnung' && 'Regelwerk'}
                  {document.category === 'archiv' && 'Archiv'}
                  {document.category === 'ligaliste' && 'Ligaliste'}
                </span>
              )}
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              {document.fileType === 'PDF' && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex items-center w-full"
                  onClick={() => setPreviewOpen(true)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  <span className="whitespace-nowrap">Ansehen</span>
                </Button>
              )}
              {document.fileType === 'PDF' ? (
                isMobile ? (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex items-center w-full"
                    onClick={async () => {
                      try {
                        // Tracking zuerst
                        await fetch(`/api/documents/${document.id}/download`, { method: 'POST' })
                          .catch(err => console.warn('Download-Tracking fehlgeschlagen:', err));
                        
                        // Mit App-Chooser öffnen
                        console.log('Starte App-Chooser für:', documentPath);
                        await openWithAppChooser(documentPath);
                      } catch (error) {
                        console.error('Fehler beim Öffnen mit App:', error);
                      }
                    }}
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    <span className="whitespace-nowrap">Mit App öffnen</span>
                  </Button>
                ) : (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex items-center w-full"
                    onClick={() => {
                      downloadFile(documentPath, document.title + '.pdf');
                      fetch(`/api/documents/${document.id}/download`, { method: 'POST' })
                        .catch(err => console.warn('Download-Tracking fehlgeschlagen:', err));
                    }}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    <span className="whitespace-nowrap">Herunterladen</span>
                  </Button>
                )
              ) : (
                <Link href={documentPath} className="w-full sm:w-auto">
                  <Button variant="outline" size="sm" className="flex items-center w-full">
                    <Info className="h-4 w-4 mr-2" />
                    <span className="whitespace-nowrap">Ansehen</span>
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Dokumentenvorschau */}
      {previewOpen && (
        <DocumentPreview 
          document={document} 
          isOpen={previewOpen} 
          onClose={() => setPreviewOpen(false)} 
        />
      )}
    </>
  );
}