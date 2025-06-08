"use client";

import React from 'react';
import { useForm } from 'react-hook-form';
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { DocumentFormData } from '@/lib/services/document-service';

interface DocumentFormProps {
  initialData?: Partial<DocumentFormData>;
  onSubmit: (data: DocumentFormData) => void;
  isSubmitting: boolean;
}

export function DocumentForm({ initialData, onSubmit, isSubmitting }: DocumentFormProps) {
  const form = useForm<DocumentFormData>({
    defaultValues: {
      title: initialData?.title || '',
      description: initialData?.description || '',
      path: initialData?.path || '',
      category: initialData?.category || 'ausschreibung',
      date: initialData?.date || new Date().toLocaleDateString('de-DE'),
      fileType: initialData?.fileType || 'PDF',
      fileSize: initialData?.fileSize || '',
      active: initialData?.active !== undefined ? initialData.active : true,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Titel</FormLabel>
              <FormControl>
                <Input placeholder="Titel des Dokuments" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Beschreibung</FormLabel>
              <FormControl>
                <Textarea placeholder="Beschreibung des Dokuments" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="path"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Dateipfad</FormLabel>
              <FormControl>
                <Input placeholder="/documents/ausschreibungen/dokument.pdf" {...field} />
              </FormControl>
              <FormDescription>
                Pfad zur Datei im public-Ordner, z.B. /documents/ausschreibungen/dokument.pdf
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Kategorie</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Kategorie auswählen" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="ausschreibung">Ausschreibung</SelectItem>
                    <SelectItem value="formular">Formular</SelectItem>
                    <SelectItem value="ordnung">Regelwerk</SelectItem>
                    <SelectItem value="archiv">Archiv</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Datum</FormLabel>
                <FormControl>
                  <Input placeholder="z.B. 15. April 2025" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="fileType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Dateityp</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Dateityp auswählen" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="PDF">PDF</SelectItem>
                    <SelectItem value="Webseite">Webseite</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="fileSize"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Dateigröße</FormLabel>
                <FormControl>
                  <Input placeholder="z.B. 245 KB" {...field} />
                </FormControl>
                <FormDescription>
                  Leer lassen für Webseiten
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="active"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Aktiv</FormLabel>
                <FormDescription>
                  Aktivieren Sie dieses Dokument, um es auf der Dokumentenseite anzuzeigen.
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Wird gespeichert...' : 'Speichern'}
        </Button>
      </form>
    </Form>
  );
}