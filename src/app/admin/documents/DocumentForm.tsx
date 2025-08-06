"use client";

import React, { useState } from 'react';
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
import { Upload, File, CheckCircle2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface DocumentFormProps {
  initialData?: Partial<DocumentFormData>;
  onSubmit: (data: DocumentFormData) => void;
  isSubmitting: boolean;
}

export function DocumentForm({ initialData, onSubmit, isSubmitting }: DocumentFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

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
      restricted: initialData?.restricted !== undefined ? initialData.restricted : false,
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setUploadSuccess(false);
      setUploadError(null);
    }
  };

  const handleFileUpload = async () => {
    if (!file) return;

    const category = form.getValues('category');
    
    try {
      setUploading(true);
      setUploadError(null);
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', category);
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Fehler beim Hochladen der Datei');
      }
      
      const data = await response.json();
      
      // Aktualisiere die Formularfelder mit den Daten der hochgeladenen Datei
      form.setValue('path', data.path);
      form.setValue('fileSize', data.fileSize);
      form.setValue('fileType', data.fileType);
      
      setUploadSuccess(true);
    } catch (error) {
      console.error('Fehler beim Hochladen:', error);
      setUploadError('Fehler beim Hochladen der Datei. Bitte versuchen Sie es erneut.');
    } finally {
      setUploading(false);
    }
  };

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

        <div className="border rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Datei hochladen</h3>
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem className="w-1/3">
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
                      <SelectItem value="ligaliste">Ligalisten & Handtabellen</SelectItem>
                      <SelectItem value="software">Software</SelectItem>
                      <SelectItem value="archiv">Archiv</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
          </div>
          
          <div className="flex items-center gap-4">
            <Input 
              type="file" 
              accept=".pdf" 
              onChange={handleFileChange}
              className="flex-1"
            />
            <Button 
              type="button" 
              onClick={handleFileUpload} 
              disabled={!file || uploading}
              className="flex items-center gap-2"
            >
              {uploading ? 'Wird hochgeladen...' : 'Hochladen'}
              <Upload className="h-4 w-4" />
            </Button>
          </div>

          {uploadSuccess && (
            <Alert variant="success" className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800">Erfolg</AlertTitle>
              <AlertDescription className="text-green-700">
                Die Datei wurde erfolgreich hochgeladen.
              </AlertDescription>
            </Alert>
          )}

          {uploadError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Fehler</AlertTitle>
              <AlertDescription>
                {uploadError}
              </AlertDescription>
            </Alert>
          )}
        </div>

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
                    <SelectItem value="APK">APK</SelectItem>
                    <SelectItem value="Webseite">Webseite</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
        </div>
        
        <FormField
          control={form.control}
          name="restricted"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 bg-amber-50">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Nur für Vereinsvertreter/Mannschaftsführer</FormLabel>
                <FormDescription>
                  Wenn aktiviert, ist dieses Dokument nur für Vereinsvertreter und Mannschaftsführer sichtbar.
                  Andere Benutzer können dieses Dokument nicht sehen.
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
