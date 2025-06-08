// src/app/dokumente/DocumentCard.tsx
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download, Calendar, Info, Eye } from 'lucide-react';
import Link from 'next/link';
import { Document } from '@/lib/services/document-service';

export function DocumentCard({ document }: { document: Document }) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex flex-col md:flex-row md:justify-between md:items-start">
          <div>
            <CardTitle className="text-base md:text-lg flex items-center">
              <FileText className="h-4 w-4 md:h-5 md:w-5 mr-2 text-primary" />
              {document.title}
            </CardTitle>
            <CardDescription className="mt-1 text-xs md:text-sm">{document.description}</CardDescription>
          </div>
          <div className="text-xs text-muted-foreground flex items-center mt-2 md:mt-0">
            <Calendar className="h-3 w-3 md:h-4 md:w-4 mr-1" />
            {document.date}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0">
          <div className="text-xs md:text-sm text-muted-foreground">
            <span className="font-medium">{document.fileType}</span>
            {document.fileSize !== '-' && <span> • {document.fileSize}</span>}
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            {document.fileType === 'PDF' && (
              <a 
                href={document.path} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-1/2 sm:w-auto"
              >
                <Button variant="outline" size="sm" className="flex items-center w-full">
                  <Eye className="h-4 w-4 mr-2" />
                  <span className="whitespace-nowrap">Ansehen</span>
                </Button>
              </a>
            )}
            {document.fileType === 'PDF' ? (
              <a 
                href={document.path} 
                download 
                className="w-1/2 sm:w-auto"
              >
                <Button variant="outline" size="sm" className="flex items-center w-full">
                  <Download className="h-4 w-4 mr-2" />
                  <span className="whitespace-nowrap">Herunterladen</span>
                </Button>
              </a>
            ) : (
              <Link href={document.path || '#'} className="w-full sm:w-auto">
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
  );
}