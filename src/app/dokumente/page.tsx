// src/app/dokumente/page.tsx
"use client";
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { FileText, Download, Calendar, Info, Eye } from 'lucide-react';
import Link from 'next/link';

interface Document {
  id: string;
  title: string;
  description: string;
  url: string;
  category: 'ausschreibung' | 'formular' | 'ordnung' | 'archiv';
  date: string;
  fileType: string;
  fileSize: string;
}

// Beispieldokumente - später durch Firestore-Daten ersetzen
const documents: Document[] = [
  {
    id: '1',
    title: 'Ausschreibung RWK Luftdruck 2025',
    description: 'Offizielle Ausschreibung für den Rundenwettkampf Luftdruck der Saison 2025',
    url: '#',
    category: 'ausschreibung',
    date: '15. April 2025',
    fileType: 'PDF',
    fileSize: '245 KB'
  },
  {
    id: '2',
    title: 'Ausschreibung RWK Kleinkaliber 2025',
    description: 'Offizielle Ausschreibung für den Rundenwettkampf Kleinkaliber der Saison 2025',
    url: '#',
    category: 'ausschreibung',
    date: '15. März 2025',
    fileType: 'PDF',
    fileSize: '230 KB'
  },
  {
    id: '3',
    title: 'Mannschaftsmeldebogen',
    description: 'Formular zur Meldung von Mannschaften für den Rundenwettkampf',
    url: '#',
    category: 'formular',
    date: '10. Januar 2025',
    fileType: 'PDF',
    fileSize: '125 KB'
  },
  {
    id: '4',
    title: 'Ergebnismeldebogen (Papierform)',
    description: 'Formular zur manuellen Erfassung von Wettkampfergebnissen',
    url: '#',
    category: 'formular',
    date: '10. Januar 2025',
    fileType: 'PDF',
    fileSize: '110 KB'
  },
  {
    id: '5',
    title: 'RWK-Ordnung KSV Einbeck',
    description: 'Aktuelle Rundenwettkampfordnung des Kreisschützenverbandes Einbeck',
    url: '/rwk-ordnung',
    category: 'ordnung',
    date: '1. Januar 2025',
    fileType: 'Webseite',
    fileSize: '-'
  },
  {
    id: '6',
    title: 'Benutzerhandbuch RWK Einbeck App',
    description: 'Ausführliche Anleitung zur Nutzung der RWK Einbeck App',
    url: '/handbuch',
    category: 'ordnung',
    date: '24. Mai 2025',
    fileType: 'Webseite',
    fileSize: '-'
  },
  {
    id: '7',
    title: 'Ausschreibung RWK Luftdruck 2024',
    description: 'Archivierte Ausschreibung für den Rundenwettkampf Luftdruck der Saison 2024',
    url: '#',
    category: 'archiv',
    date: '15. April 2024',
    fileType: 'PDF',
    fileSize: '240 KB'
  },
  {
    id: '8',
    title: 'Ausschreibung RWK Kleinkaliber 2024',
    description: 'Archivierte Ausschreibung für den Rundenwettkampf Kleinkaliber der Saison 2024',
    url: '#',
    category: 'archiv',
    date: '15. März 2024',
    fileType: 'PDF',
    fileSize: '225 KB'
  }
];

export default function DokumentePage() {
  const [activeTab, setActiveTab] = useState<string>('ausschreibungen');

  const ausschreibungen = documents.filter(doc => doc.category === 'ausschreibung');
  const formulare = documents.filter(doc => doc.category === 'formular');
  const ordnungen = documents.filter(doc => doc.category === 'ordnung');
  const archiv = documents.filter(doc => doc.category === 'archiv');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-primary">Dokumente & Ausschreibungen</h1>
          <p className="text-muted-foreground">Offizielle Dokumente und Formulare des KSV Einbeck</p>
        </div>
      </div>

      <Tabs defaultValue="ausschreibungen" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-4 mb-8">
          <TabsTrigger value="ausschreibungen">Ausschreibungen</TabsTrigger>
          <TabsTrigger value="formulare">Formulare</TabsTrigger>
          <TabsTrigger value="ordnungen">Regelwerke & Hilfen</TabsTrigger>
          <TabsTrigger value="archiv">Archiv</TabsTrigger>
        </TabsList>

        <TabsContent value="ausschreibungen" className="space-y-4">
          <h2 className="text-xl font-semibold mb-4">Aktuelle Ausschreibungen</h2>
          {ausschreibungen.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                Keine aktuellen Ausschreibungen verfügbar.
              </CardContent>
            </Card>
          ) : (
            ausschreibungen.map(doc => (
              <DocumentCard key={doc.id} document={doc} />
            ))
          )}
        </TabsContent>

        <TabsContent value="formulare" className="space-y-4">
          <h2 className="text-xl font-semibold mb-4">Formulare</h2>
          {formulare.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                Keine Formulare verfügbar.
              </CardContent>
            </Card>
          ) : (
            formulare.map(doc => (
              <DocumentCard key={doc.id} document={doc} />
            ))
          )}
        </TabsContent>

        <TabsContent value="ordnungen" className="space-y-4">
          <h2 className="text-xl font-semibold mb-4">Regelwerke & Hilfen</h2>
          {ordnungen.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                Keine Ordnungen verfügbar.
              </CardContent>
            </Card>
          ) : (
            ordnungen.map(doc => (
              <DocumentCard key={doc.id} document={doc} />
            ))
          )}
        </TabsContent>

        <TabsContent value="archiv" className="space-y-4">
          <h2 className="text-xl font-semibold mb-4">Archivierte Dokumente</h2>
          {archiv.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                Keine archivierten Dokumente verfügbar.
              </CardContent>
            </Card>
          ) : (
            archiv.map(doc => (
              <DocumentCard key={doc.id} document={doc} />
            ))
          )}
        </TabsContent>
      </Tabs>

      <Card className="mt-8 bg-muted/30">
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <Info className="h-5 w-5 mr-2" />
            Hinweis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>
            Alle offiziellen Dokumente werden hier zentral bereitgestellt. Bei Fragen zu den Dokumenten wenden Sie sich bitte an den Rundenwettkampfleiter oder nutzen Sie das <Link href="/support" className="text-primary hover:underline">Support-Formular</Link>.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function DocumentCard({ document }: { document: Document }) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg flex items-center">
              <FileText className="h-5 w-5 mr-2 text-primary" />
              {document.title}
            </CardTitle>
            <CardDescription className="mt-1">{document.description}</CardDescription>
          </div>
          <div className="text-xs text-muted-foreground flex items-center">
            <Calendar className="h-4 w-4 mr-1" />
            {document.date}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            <span className="font-medium">{document.fileType}</span>
            {document.fileSize !== '-' && <span> • {document.fileSize}</span>}
          </div>
          <div className="flex gap-2">
            {document.fileType === 'PDF' && (
              <Link href={`${document.url}?view=true`} target="_blank">
                <Button variant="outline" size="sm" className="flex items-center">
                  <Eye className="h-4 w-4 mr-2" />
                  Ansehen
                </Button>
              </Link>
            )}
            <Link href={document.url} target={document.url.startsWith('http') ? "_blank" : "_self"}>
              <Button variant="outline" size="sm" className="flex items-center">
                {document.fileType === 'Webseite' ? (
                  <>
                    <Info className="h-4 w-4 mr-2" />
                    Ansehen
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Herunterladen
                  </>
                )}
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}