"use client";

import { useState, useEffect } from 'react';
import { logError } from '@/lib/utils/secure-logger';
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
  Lock,
  Loader2
} from 'lucide-react';
import { 
  getAllDocuments, 
  toggleDocumentActive, 
  deleteDocument 
} from '@/lib/services/document-service';
import { Document } from '@/lib/services/document-service';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { EmptyState } from '@/components/ui/empty-state';

export default function DocumentsAdminPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
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
      logError('Fehler beim Laden der Dokumente:', error);
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
      setActionLoading(id);
      await toggleDocumentActive(id, !currentActive);
      toast({
        title: 'Gespeichert',
        description: `Dokument wurde ${!currentActive ? 'aktiviert' : 'deaktiviert'}.`
      });
      loadDocuments();
    } catch (error) {
      logError('Fehler beim Ändern des Status:', error);
      toast({
        title: 'Fehler',
        description: 'Der Status konnte nicht geändert werden.',
        variant: 'destructive'
      });
    } finally {
      setActionLoading(null);
    }
  }

  function openDeleteDialog(id: string) {
    setDocumentToDelete(id);
    setDeleteDialogOpen(true);
  }

  async function handleDelete() {
    if (!documentToDelete) return;

    try {
      setActionLoading(documentToDelete);
      const success = await deleteDocument(documentToDelete);
      if (success) {
        toast({
          title: 'Gelöscht',
          description: 'Dokument wurde erfolgreich gelöscht.'
        });
        loadDocuments();
      } else {
        throw new Error('Löschen fehlgeschlagen');
      }
    } catch (error) {
      logError('Fehler beim Löschen des Dokuments:', error);
      toast({
        title: 'Fehler',
        description: 'Das Dokument konnte nicht gelöscht werden.',
        variant: 'destructive'
      });
    } finally {
      setActionLoading(null);
      setDeleteDialogOpen(false);
      setDocumentToDelete(null);
    }
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[
        { label: 'Admin', href: '/admin' },
        { label: 'Dokumente' }
      ]} />
      
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
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : documents.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="Keine Dokumente vorhanden"
              description="Erstellen Sie Ihr erstes Dokument"
              action={
                <Link href="/admin/documents/add">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Neues Dokument
                  </Button>
                </Link>
              }
            />
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
                            <span title="Nur für Vereinsvertreter/Mannschaftsführer" className="inline-flex">
                              <Lock className="h-4 w-4 ml-2 text-amber-500" />
                            </span>
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
                            disabled={actionLoading === doc.id}
                          >
                            {actionLoading === doc.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : doc.active ? (
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
                            onClick={() => openDeleteDialog(doc.id)}
                            disabled={actionLoading === doc.id}
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

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
        title="Dokument löschen?"
        description="Möchten Sie dieses Dokument wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden."
        confirmText="Löschen"
        cancelText="Abbrechen"
      />
    </div>
  );
}
