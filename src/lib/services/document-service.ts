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

/**
 * Lädt alle Dokumente aus der JSON-Datei
 */
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

/**
 * Lädt nur aktive Dokumente
 */
export async function getActiveDocuments(): Promise<Document[]> {
  const documents = await getAllDocuments();
  return documents.filter(doc => doc.active);
}

/**
 * Lädt Dokumente nach Kategorie
 */
export async function getDocumentsByCategory(category: string): Promise<Document[]> {
  const documents = await getActiveDocuments();
  return documents.filter(doc => doc.category === category);
}

/**
 * Speichert alle Dokumente in der JSON-Datei
 * Diese Funktion kann nur serverseitig verwendet werden
 */
export async function saveDocuments(documents: Document[]): Promise<boolean> {
  // Diese Funktion würde in einer echten Implementierung
  // die JSON-Datei auf dem Server aktualisieren
  // In dieser clientseitigen Implementierung können wir das nicht direkt tun
  console.warn('saveDocuments kann nur serverseitig verwendet werden');
  return false;
}

/**
 * Fügt ein neues Dokument hinzu
 * Diese Funktion kann nur serverseitig verwendet werden
 */
export async function addDocument(document: DocumentFormData): Promise<Document | null> {
  // Diese Funktion würde in einer echten Implementierung
  // die JSON-Datei auf dem Server aktualisieren
  console.warn('addDocument kann nur serverseitig verwendet werden');
  return null;
}

/**
 * Aktualisiert ein bestehendes Dokument
 * Diese Funktion kann nur serverseitig verwendet werden
 */
export async function updateDocument(id: string, document: Partial<DocumentFormData>): Promise<boolean> {
  // Diese Funktion würde in einer echten Implementierung
  // die JSON-Datei auf dem Server aktualisieren
  console.warn('updateDocument kann nur serverseitig verwendet werden');
  return false;
}

/**
 * Löscht ein Dokument
 * Diese Funktion kann nur serverseitig verwendet werden
 */
export async function deleteDocument(id: string): Promise<boolean> {
  // Diese Funktion würde in einer echten Implementierung
  // die JSON-Datei auf dem Server aktualisieren
  console.warn('deleteDocument kann nur serverseitig verwendet werden');
  return false;
}