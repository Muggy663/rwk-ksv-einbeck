"use client";

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  FileText, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff,
  Lock
} from 'lucide-react';
import { 
  getAllDocuments, 
  toggleDocumentActive, 
  deleteDocument 
} from '@/lib/services/document-service';
import { Document } from '@/lib/services/document-service';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

export default function DocumentsAdminPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadDocuments();
  }, []);

  async function loadDocuments() {
    try {
      setLoading(true);
      const docs = await getAllDocuments();
      setDocuments(docs);
    } catch (error) {
      console.error('Fehler beim Laden der Dokumente:', error);
      toast({
        title: 'Fehler',
        description: 'Die Dokumente konnten nicht geladen werden.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleActive(id: string, currentActive: boolean) {
    try {
      await toggleDocumentActive(id, !currentActive);
      toast({
        title: 'Erfolg',
        description: `Dokument wurde ${!currentActive ? 'aktiviert' : 'deaktiviert'}.`
      });
      loadDocuments();
    } catch (error) {
      console.error('Fehler beim Ändern des Status:', error);
      toast({
        title: 'Fehler',
        description: 'Der Status konnte nicht geändert werden.',
        variant: 'destructive'
      });
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Möchten Sie dieses Dokument wirklich löschen?')) {
      return;
    }

    try {
      const success = await deleteDocument(id);
      if (success) {
        toast({
          title: 'Erfolg',
          description: 'Dokument wurde gelöscht.'
        });
        loadDocuments();
      } else {
        throw new Error('Löschen fehlgeschlagen');
      }
    } catch (error) {
      console.error('Fehler beim Löschen des Dokuments:', error);
      toast({
        title: 'Fehler',
        description: 'Das Dokument konnte nicht gelöscht werden.',
        variant: 'destructive'
      });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-primary">Dokumente verwalten</h1>
          <p className="text-muted-foreground">Verwalten Sie die Dokumente der RWK App</p>
        </div>
        <Link href="/admin/documents/add">
          <Button className="flex items-center">
            <Plus className="h-4 w-4 mr-2" />
            Neues Dokument
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Alle Dokumente</CardTitle>
          <CardDescription>
            Hier können Sie alle Dokumente einsehen, bearbeiten und löschen.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">Dokumente werden geladen...</div>
          ) : documents.length === 0 ? (
            <div className="text-center py-4">Keine Dokumente vorhanden.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Titel</TableHead>
                    <TableHead>Kategorie</TableHead>
                    <TableHead>Datum</TableHead>
                    <TableHead>Typ</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          <FileText className="h-4 w-4 mr-2 text-primary" />
                          {doc.title}
                          {doc.restricted && (
                            <Lock className="h-4 w-4 ml-2 text-amber-500" title="Nur für Vereinsvertreter/Mannschaftsführer" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {doc.category === 'ausschreibung' && 'Ausschreibung'}
                        {doc.category === 'formular' && 'Formular'}
                        {doc.category === 'ordnung' && 'Regelwerk'}
                        {doc.category === 'archiv' && 'Archiv'}
                        {doc.category === 'ligaliste' && 'Ligaliste'}
                      </TableCell>
                      <TableCell>{doc.date}</TableCell>
                      <TableCell>{doc.fileType}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs ${doc.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {doc.active ? 'Aktiv' : 'Inaktiv'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleActive(doc.id, doc.active)}
                          >
                            {doc.active ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                          <Link href={`/admin/documents/edit/${doc.id}`}>
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(doc.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}