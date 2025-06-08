// src/lib/services/document-service.ts

export interface Document {
  id: string;
  title: string;
  description: string;
  path: string;
  category: 'ausschreibung' | 'formular' | 'ordnung' | 'archiv';
  date: string;
  fileType: 'PDF' | 'Webseite';
  fileSize: string;
  active: boolean;
}

export type DocumentFormData = Omit<Document, 'id'>;

// Lädt alle Dokumente aus der JSON-Datei
export async function getAllDocuments(): Promise<Document[]> {
  try {
    const response = await fetch('/data/documents.json');
    if (!response.ok) {
      throw new Error('Fehler beim Laden der Dokumente');
    }
    const data = await response.json();
    return data.documents;
  } catch (error) {
    console.error('Fehler beim Laden der Dokumente:', error);
    return [];
  }
}

// Lädt nur aktive Dokumente
export async function getActiveDocuments(): Promise<Document[]> {
  const documents = await getAllDocuments();
  return documents.filter(doc => doc.active);
}

// Lädt Dokumente nach Kategorie
export async function getDocumentsByCategory(category: string): Promise<Document[]> {
  const documents = await getActiveDocuments();
  return documents.filter(doc => doc.category === category);
}

// Lädt ein einzelnes Dokument anhand seiner ID
export async function getDocumentById(id: string): Promise<Document | null> {
  try {
    const documents = await getAllDocuments();
    const document = documents.find(doc => doc.id === id);
    return document || null;
  } catch (error) {
    console.error(`Fehler beim Laden des Dokuments mit ID ${id}:`, error);
    return null;
  }
}

// Fügt ein neues Dokument hinzu
export async function addDocument(document: DocumentFormData): Promise<Document | null> {
  try {
    const response = await fetch('/api/documents', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(document),
    });
    
    if (!response.ok) {
      throw new Error('Fehler beim Hinzufügen des Dokuments');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Fehler beim Hinzufügen des Dokuments:', error);
    return null;
  }
}

// Aktualisiert ein bestehendes Dokument
export async function updateDocument(id: string, document: Partial<DocumentFormData>): Promise<Document | null> {
  try {
    const response = await fetch(`/api/documents/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(document),
    });
    
    if (!response.ok) {
      throw new Error('Fehler beim Aktualisieren des Dokuments');
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Fehler beim Aktualisieren des Dokuments mit ID ${id}:`, error);
    return null;
  }
}

// Löscht ein Dokument
export async function deleteDocument(id: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/documents/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error('Fehler beim Löschen des Dokuments');
    }
    
    return true;
  } catch (error) {
    console.error(`Fehler beim Löschen des Dokuments mit ID ${id}:`, error);
    return false;
  }
}

// Ändert den Aktivierungsstatus eines Dokuments
export async function toggleDocumentActive(id: string, active: boolean): Promise<Document | null> {
  return updateDocument(id, { active });
}