"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Info } from 'lucide-react';
import Link from 'next/link';
import { DocumentCard } from './DocumentCard';
import { Document, getActiveDocuments } from '@/lib/services/document-service';

export default function DokumentePage() {
  const [activeTab, setActiveTab] = useState<string>('ausschreibungen');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDocuments();
  }, []);

  async function loadDocuments() {
    try {
      setLoading(true);
      setError(null);
      const docs = await getActiveDocuments();
      setDocuments(docs);
    } catch (err) {
      console.error('Fehler beim Laden der Dokumente:', err);
      setError('Die Dokumente konnten nicht geladen werden.');
    } finally {
      setLoading(false);
    }
  }

  const ausschreibungen = documents.filter(doc => doc.category === 'ausschreibung');
  const formulare = documents.filter(doc => doc.category === 'formular');
  const ordnungen = documents.filter(doc => doc.category === 'ordnung');
  const archiv = documents.filter(doc => doc.category === 'archiv');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-primary">Dokumente & Ausschreibungen</h1>
          <p className="text-sm md:text-base text-muted-foreground">Offizielle Dokumente und Formulare des KSV Einbeck</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <p>Dokumente werden geladen...</p>
        </div>
      ) : error ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            {error}
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="ausschreibungen" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-8">
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
      )}

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
