// src/app/admin/documents/page.tsx
"use client";
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { FileText, Upload, Trash2, Edit, Eye, Download, Calendar, AlertCircle, Loader2 } from 'lucide-react';
import { db, storage } from '@/lib/firebase/config';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

interface Document {
  id: string;
  title: string;
  description: string;
  category: 'ausschreibung' | 'formular' | 'ordnung' | 'archiv';
  date: string;
  fileType: string;
  fileSize: string;
  storageUrl?: string;
  webUrl?: string;
  createdAt?: any;
  updatedAt?: any;
}

export default function AdminDocumentsPage() {
  const { toast } = useToast();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'ausschreibung' | 'formular' | 'ordnung' | 'archiv'>('ausschreibung');
  const [file, setFile] = useState<File | null>(null);
  const [webUrl, setWebUrl] = useState('');
  const [isWebLink, setIsWebLink] = useState(false);
  
  // Effekt zum Zurücksetzen des Datei-Inputs beim Umschalten zwischen Weblink und Datei-Upload
  useEffect(() => {
    // Wenn wir zu Weblink wechseln, setzen wir die Datei zurück
    if (isWebLink) {
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } else {
      // Wenn wir zu Datei-Upload wechseln, setzen wir die URL zurück
      setWebUrl('');
    }
  }, [isWebLink]);
  const [openDialog, setOpenDialog] = useState(false);
  
  // Referenz für das Datei-Input-Element
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  // Fetch documents on component mount
  useEffect(() => {
    fetchDocuments();
  }, []);
  
  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'documents'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Document[];
      setDocuments(docs);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast({
        title: 'Fehler beim Laden der Dokumente',
        description: 'Bitte versuchen Sie es später erneut.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    } else {
      setFile(null);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    
    try {
      let fileUrl = '';
      let fileType = '';
      let fileSize = '';
      
      // If it's a web link
      if (isWebLink) {
        fileUrl = webUrl;
        fileType = 'Webseite';
        fileSize = '-';
      } 
      // If it's a file upload
      else if (file) {
        // Upload file to Firebase Storage
        const storageRef = ref(storage, `documents/${category}/${file.name}`);
        const uploadResult = await uploadBytes(storageRef, file);
        fileUrl = await getDownloadURL(uploadResult.ref);
        
        // Determine file type
        const extension = file.name.split('.').pop()?.toLowerCase();
        if (extension === 'pdf') fileType = 'PDF';
        else if (['doc', 'docx'].includes(extension || '')) fileType = 'Word';
        else if (['xls', 'xlsx'].includes(extension || '')) fileType = 'Excel';
        else fileType = extension?.toUpperCase() || 'Unbekannt';
        
        // Format file size
        fileSize = `${Math.round(file.size / 1024)} KB`;
      } else {
        throw new Error('Keine Datei oder URL angegeben');
      }
      
      // Format current date
      const today = new Date();
      const formattedDate = `${today.getDate()}. ${['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'][today.getMonth()]} ${today.getFullYear()}`;
      
      // Add document to Firestore
      await addDoc(collection(db, 'documents'), {
        title,
        description,
        category,
        date: formattedDate,
        fileType,
        fileSize,
        storageUrl: isWebLink ? null : fileUrl,
        webUrl: isWebLink ? fileUrl : null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      // Reset form
      setTitle('');
      setDescription('');
      setCategory('ausschreibung');
      setFile(null);
      setWebUrl('');
      setIsWebLink(false);
      setOpenDialog(false);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Refresh documents list
      fetchDocuments();
      
      toast({
        title: 'Dokument erfolgreich hochgeladen',
        description: 'Das Dokument wurde erfolgreich gespeichert.',
      });
    } catch (error) {
      console.error('Error uploading document:', error);
      toast({
        title: 'Fehler beim Hochladen',
        description: (error as Error).message || 'Bitte versuchen Sie es später erneut.',
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
    }
  };
  
  const handleDelete = async (document: Document) => {
    if (!confirm(`Möchten Sie das Dokument "${document.title}" wirklich löschen?`)) {
      return;
    }
    
    try {
      // Delete from Firestore
      await deleteDoc(doc(db, 'documents', document.id));
      
      // If it's a file (not a web link), delete from Storage
      if (document.storageUrl) {
        const storageRef = ref(storage, document.storageUrl);
        await deleteObject(storageRef);
      }
      
      // Update documents list
      setDocuments(documents.filter(d => d.id !== document.id));
      
      toast({
        title: 'Dokument gelöscht',
        description: 'Das Dokument wurde erfolgreich gelöscht.',
      });
    } catch (error) {
      console.error('Error deleting document:', error);
      toast({
        title: 'Fehler beim Löschen',
        description: 'Das Dokument konnte nicht gelöscht werden.',
        variant: 'destructive'
      });
    }
  };
  
  const filteredDocuments = activeTab === 'all' 
    ? documents 
    : documents.filter(doc => doc.category === activeTab);
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-primary">Dokumentenverwaltung</h1>
          <p className="text-muted-foreground">Verwalten Sie hier alle Dokumente und Ausschreibungen.</p>
        </div>
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Neues Dokument
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>Neues Dokument hinzufügen</DialogTitle>
              <DialogDescription>
                Laden Sie ein neues Dokument hoch oder fügen Sie einen Link zu einer Webseite hinzu.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="title">Titel</Label>
                <Input 
                  id="title" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  placeholder="z.B. Ausschreibung RWK Luftdruck 2025" 
                  required 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Beschreibung</Label>
                <Textarea 
                  id="description" 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                  placeholder="Kurze Beschreibung des Dokuments" 
                  required 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="category">Kategorie</Label>
                <Select 
                  value={category} 
                  onValueChange={(value: 'ausschreibung' | 'formular' | 'ordnung' | 'archiv') => setCategory(value)}
                  defaultValue="ausschreibung"
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Kategorie wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ausschreibung">Ausschreibung</SelectItem>
                    <SelectItem value="formular">Formular</SelectItem>
                    <SelectItem value="ordnung">Regelwerk & Hilfe</SelectItem>
                    <SelectItem value="archiv">Archiv</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input 
                    type="checkbox" 
                    id="isWebLink" 
                    checked={isWebLink} 
                    onChange={() => setIsWebLink(!isWebLink)} 
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <Label htmlFor="isWebLink">Dies ist ein Link zu einer Webseite</Label>
                </div>
              </div>
              
              {isWebLink ? (
                <div className="space-y-2">
                  <Label htmlFor="webUrl">Web-URL</Label>
                  <Input 
                    id="webUrl" 
                    value={webUrl} 
                    onChange={(e) => setWebUrl(e.target.value)} 
                    placeholder="https://..." 
                    required={isWebLink} 
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="file">Datei</Label>
                  <Input 
                    id="file" 
                    type="file" 
                    onChange={handleFileChange} 
                    required={!isWebLink}
                    ref={fileInputRef}
                    key={isWebLink ? 'weblink' : 'file-upload'} // Key hilft React, den Input neu zu rendern
                  />
                </div>
              )}
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpenDialog(false)}>
                  Abbrechen
                </Button>
                <Button type="submit" disabled={uploading}>
                  {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {uploading ? 'Wird hochgeladen...' : 'Dokument speichern'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      
      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-5 mb-8">
          <TabsTrigger value="all">Alle</TabsTrigger>
          <TabsTrigger value="ausschreibung">Ausschreibungen</TabsTrigger>
          <TabsTrigger value="formular">Formulare</TabsTrigger>
          <TabsTrigger value="ordnung">Regelwerke & Hilfen</TabsTrigger>
          <TabsTrigger value="archiv">Archiv</TabsTrigger>
        </TabsList>
        
        <Card>
          <CardContent className="pt-6">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary mr-3" />
                <p>Dokumente werden geladen...</p>
              </div>
            ) : filteredDocuments.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg text-muted-foreground">Keine Dokumente gefunden.</p>
                <p className="text-sm text-muted-foreground mt-2">Klicken Sie auf "Neues Dokument", um ein Dokument hinzuzufügen.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Titel</TableHead>
                    <TableHead>Kategorie</TableHead>
                    <TableHead>Datum</TableHead>
                    <TableHead>Typ</TableHead>
                    <TableHead>Größe</TableHead>
                    <TableHead className="text-right">Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDocuments.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell className="font-medium">{doc.title}</TableCell>
                      <TableCell>
                        {doc.category === 'ausschreibung' && 'Ausschreibung'}
                        {doc.category === 'formular' && 'Formular'}
                        {doc.category === 'ordnung' && 'Regelwerk & Hilfe'}
                        {doc.category === 'archiv' && 'Archiv'}
                      </TableCell>
                      <TableCell>{doc.date}</TableCell>
                      <TableCell>{doc.fileType}</TableCell>
                      <TableCell>{doc.fileSize}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {doc.fileType === 'PDF' && (
                            <Button variant="outline" size="sm" asChild>
                              <a href={doc.storageUrl} target="_blank" rel="noopener noreferrer">
                                <Eye className="h-4 w-4" />
                              </a>
                            </Button>
                          )}
                          {doc.fileType !== 'Webseite' ? (
                            <Button variant="outline" size="sm" asChild>
                              <a href={doc.storageUrl} download>
                                <Download className="h-4 w-4" />
                              </a>
                            </Button>
                          ) : (
                            <Button variant="outline" size="sm" asChild>
                              <a href={doc.webUrl} target="_blank" rel="noopener noreferrer">
                                <Eye className="h-4 w-4" />
                              </a>
                            </Button>
                          )}
                          <Button variant="outline" size="sm" onClick={() => handleDelete(doc)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </Tabs>
      
      <Card className="mt-8 bg-muted/30">
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <AlertCircle className="h-5 w-5 mr-2" />
            Hinweis zur Dokumentenverwaltung
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>
            Hier können Sie alle Dokumente für die RWK Einbeck App verwalten. Dokumente werden in der Kategorie angezeigt, die Sie beim Hochladen auswählen.
            Für Webseiten-Links (z.B. zum Handbuch oder zur RWK-Ordnung) aktivieren Sie bitte die Option "Dies ist ein Link zu einer Webseite".
          </p>
        </CardContent>
      </Card>
    </div>
  );
}