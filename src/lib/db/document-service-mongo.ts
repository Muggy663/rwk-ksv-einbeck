import { ObjectId } from 'mongodb';
import { getMongoDb } from './mongodb';
import { Document, DocumentFormData } from '../services/document-service';

const COLLECTION_NAME = 'documents';

// Konvertiert ein MongoDB-Dokument in ein Document-Objekt
function mapDocumentFromMongo(doc: any): Document {
  return {
    id: doc._id.toString(),
    title: doc.title,
    description: doc.description,
    path: doc.path,
    category: doc.category,
    date: doc.date,
    fileType: doc.fileType,
    fileSize: doc.fileSize,
    active: doc.active,
    restricted: doc.restricted || false,
    downloadCount: doc.downloadCount || 0,
    lastDownload: doc.lastDownload
  };
}

// Lädt alle Dokumente aus der MongoDB
export async function getAllDocumentsFromMongo(): Promise<Document[]> {
  try {
    const db = await getMongoDb();
    const collection = db.collection(COLLECTION_NAME);
    
    const documents = await collection.find({}).toArray();
    return documents.map(mapDocumentFromMongo);
  } catch (error) {
    console.error('Fehler beim Laden der Dokumente aus MongoDB:', error);
    return [];
  }
}

// Lädt nur aktive Dokumente
export async function getActiveDocumentsFromMongo(): Promise<Document[]> {
  try {
    const db = await getMongoDb();
    const collection = db.collection(COLLECTION_NAME);
    
    const documents = await collection.find({ active: true }).toArray();
    return documents.map(mapDocumentFromMongo);
  } catch (error) {
    console.error('Fehler beim Laden der aktiven Dokumente aus MongoDB:', error);
    return [];
  }
}

// Lädt Dokumente nach Kategorie
export async function getDocumentsByCategoryFromMongo(category: string): Promise<Document[]> {
  try {
    const db = await getMongoDb();
    const collection = db.collection(COLLECTION_NAME);
    
    const documents = await collection.find({ category, active: true }).toArray();
    return documents.map(mapDocumentFromMongo);
  } catch (error) {
    console.error(`Fehler beim Laden der Dokumente der Kategorie ${category} aus MongoDB:`, error);
    return [];
  }
}

// Lädt ein einzelnes Dokument anhand seiner ID
export async function getDocumentByIdFromMongo(id: string): Promise<Document | null> {
  try {
    const db = await getMongoDb();
    const collection = db.collection(COLLECTION_NAME);
    
    const document = await collection.findOne({ _id: new ObjectId(id) });
    return document ? mapDocumentFromMongo(document) : null;
  } catch (error) {
    console.error(`Fehler beim Laden des Dokuments mit ID ${id} aus MongoDB:`, error);
    return null;
  }
}

// Fügt ein neues Dokument hinzu
export async function addDocumentToMongo(document: DocumentFormData): Promise<Document | null> {
  try {
    const db = await getMongoDb();
    const collection = db.collection(COLLECTION_NAME);
    
    const result = await collection.insertOne({
      ...document,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    if (result.acknowledged) {
      return {
        id: result.insertedId.toString(),
        ...document
      };
    }
    
    return null;
  } catch (error) {
    console.error('Fehler beim Hinzufügen des Dokuments zu MongoDB:', error);
    return null;
  }
}

// Aktualisiert ein bestehendes Dokument
export async function updateDocumentInMongo(id: string, document: Partial<DocumentFormData>): Promise<Document | null> {
  try {
    const db = await getMongoDb();
    const collection = db.collection(COLLECTION_NAME);
    
    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { 
        $set: {
          ...document,
          updatedAt: new Date()
        } 
      },
      { returnDocument: 'after' }
    );
    
    return result ? mapDocumentFromMongo(result) : null;
  } catch (error) {
    console.error(`Fehler beim Aktualisieren des Dokuments mit ID ${id} in MongoDB:`, error);
    return null;
  }
}

// Löscht ein Dokument
export async function deleteDocumentFromMongo(id: string): Promise<boolean> {
  try {
    const db = await getMongoDb();
    const collection = db.collection(COLLECTION_NAME);
    
    const result = await collection.deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount === 1;
  } catch (error) {
    console.error(`Fehler beim Löschen des Dokuments mit ID ${id} aus MongoDB:`, error);
    return false;
  }
}

// Ändert den Aktivierungsstatus eines Dokuments
export async function toggleDocumentActiveInMongo(id: string, active: boolean): Promise<Document | null> {
  return updateDocumentInMongo(id, { active });
}

// Migriert Dokumente von JSON zu MongoDB
export async function migrateDocumentsToMongo(documents: Document[]): Promise<boolean> {
  try {
    const db = await getMongoDb();
    const collection = db.collection(COLLECTION_NAME);
    
    // Lösche alle vorhandenen Dokumente
    await collection.deleteMany({});
    
    // Füge die neuen Dokumente hinzu
    const docsToInsert = documents.map(doc => ({
      title: doc.title,
      description: doc.description,
      path: doc.path,
      category: doc.category,
      date: doc.date,
      fileType: doc.fileType,
      fileSize: doc.fileSize,
      active: doc.active,
      restricted: doc.restricted || false,
      createdAt: new Date(),
      updatedAt: new Date()
    }));
    
    const result = await collection.insertMany(docsToInsert);
    return result.acknowledged;
  } catch (error) {
    console.error('Fehler bei der Migration der Dokumente zu MongoDB:', error);
    return false;
  }
}
