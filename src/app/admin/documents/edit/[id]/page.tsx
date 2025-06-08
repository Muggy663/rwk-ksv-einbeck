"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DocumentForm } from '../../DocumentForm';
import { DocumentFormData, Document } from '@/lib/services/document-service';
import { getDocumentById, updateDocument } from '@/lib/services/document-service-client';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface EditDocumentPageProps {
  params: {
    id: string;
  };
}

export default function EditDocumentPage({ params }: EditDocumentPageProps) {
  const [document, setDocument] = useState<Document | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { id } = params;

  useEffect(() => {
    async function loadDocument() {
      try {
        setIsLoading(true);
        const doc = await getDocumentById(id);
        if (doc) {
          setDocument(doc);
        } else {
          toast({
            title: 'Fehler',
            description: 'Dokument nicht gefunden.',
            variant: 'destructive'
          });
          router.push('/admin/documents');
        }
      } catch (error) {
        console.error('Fehler beim Laden des Dokuments:', error);
        toast({
          title: 'Fehler',
          description: 'Das Dokument konnte nicht geladen werden.',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    }

    loadDocument();
  }, [id, router, toast]);

  async function handleSubmit(data: DocumentFormData) {
    try {
      setIsSubmitting(true);
      const updatedDocument = await updateDocument(id, data);
      
      if (updatedDocument) {
        toast({
          title: 'Erfolg',
          description: 'Dokument wurde erfolgreich aktualisiert.'
        });
        router.push('/admin/documents');
      } else {
        throw new Error('Aktualisierung fehlgeschlagen');
      }
    } catch (error) {
      console.error('Fehler beim Aktualisieren des Dokuments:', error);
      toast({
        title: 'Fehler',
        description: 'Das Dokument konnte nicht aktualisiert werden.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>Dokument wird geladen...</p>
      </div>
    );
  }

  if (!document) {
    return null;
  }

  const initialData: Partial<DocumentFormData> = {
    title: document.title,
    description: document.description,
    path: document.path,
    category: document.category,
    date: document.date,
    fileType: document.fileType,
    fileSize: document.fileSize,
    active: document.active
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Link href="/admin/documents" className="mr-4">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-3xl font-bold text-primary">Dokument bearbeiten</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dokumentdetails</CardTitle>
          <CardDescription>
            Bearbeiten Sie die Details des Dokuments.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DocumentForm 
            initialData={initialData} 
            onSubmit={handleSubmit} 
            isSubmitting={isSubmitting} 
          />
        </CardContent>
      </Card>
    </div>
  );
}