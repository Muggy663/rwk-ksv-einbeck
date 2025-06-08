"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DocumentForm } from '../DocumentForm';
import { DocumentFormData, addDocument } from '@/lib/services/document-service';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AddDocumentPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  async function handleSubmit(data: DocumentFormData) {
    try {
      setIsSubmitting(true);
      const newDocument = await addDocument(data);
      
      if (newDocument) {
        toast({
          title: 'Erfolg',
          description: 'Dokument wurde erfolgreich hinzugefügt.'
        });
        router.push('/admin/documents');
      } else {
        throw new Error('Hinzufügen fehlgeschlagen');
      }
    } catch (error) {
      console.error('Fehler beim Hinzufügen des Dokuments:', error);
      toast({
        title: 'Fehler',
        description: 'Das Dokument konnte nicht hinzugefügt werden.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Link href="/admin/documents" className="mr-4">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-3xl font-bold text-primary">Neues Dokument hinzufügen</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dokumentdetails</CardTitle>
          <CardDescription>
            Fügen Sie die Details des neuen Dokuments hinzu.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DocumentForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
        </CardContent>
      </Card>
    </div>
  );
}