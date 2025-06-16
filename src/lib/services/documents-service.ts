// src/lib/services/documents-service.ts
import { 
  collection, 
  getDocs, 
  doc, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  Timestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { DocumentMeta, DocumentFormData } from '@/types/documents';

const COLLECTION_NAME = 'documents';

/**
 * Holt alle aktiven Dokumente aus Firestore
 */
export async function getActiveDocuments(): Promise<DocumentMeta[]> {
  const q = query(
    collection(db, COLLECTION_NAME),
    where('active', '==', true),
    orderBy('date', 'desc')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as DocumentMeta));
}

/**
 * Holt alle Dokumente für die Admin-Ansicht
 */
export async function getAllDocuments(): Promise<DocumentMeta[]> {
  const q = query(
    collection(db, COLLECTION_NAME),
    orderBy('date', 'desc')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as DocumentMeta));
}

/**
 * Holt ein einzelnes Dokument anhand seiner ID
 */
export async function getDocumentById(id: string): Promise<DocumentMeta | null> {
  const docRef = doc(db, COLLECTION_NAME, id);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return {
      id: docSnap.id,
      ...docSnap.data()
    } as DocumentMeta;
  }
  
  return null;
}

/**
 * Fügt ein neues Dokument hinzu
 */
export async function addDocument(documentData: DocumentFormData): Promise<string> {
  const docRef = await addDoc(collection(db, COLLECTION_NAME), {
    ...documentData,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  });
  
  return docRef.id;
}

/**
 * Aktualisiert ein bestehendes Dokument
 */
export async function updateDocument(id: string, documentData: Partial<DocumentFormData>): Promise<void> {
  const docRef = doc(db, COLLECTION_NAME, id);
  await updateDoc(docRef, {
    ...documentData,
    updatedAt: Timestamp.now()
  });
}

/**
 * Löscht ein Dokument
 */
export async function deleteDocument(id: string): Promise<void> {
  const docRef = doc(db, COLLECTION_NAME, id);
  await deleteDoc(docRef);
}

/**
 * Ändert den Aktivierungsstatus eines Dokuments
 */
export async function toggleDocumentActive(id: string, active: boolean): Promise<void> {
  const docRef = doc(db, COLLECTION_NAME, id);
  await updateDoc(docRef, {
    active,
    updatedAt: Timestamp.now()
  });
}

/**
 * Holt Dokumente nach Kategorie
 */
export async function getDocumentsByCategory(category: string): Promise<DocumentMeta[]> {
  const q = query(
    collection(db, COLLECTION_NAME),
    where('category', '==', category),
    where('active', '==', true),
    orderBy('date', 'desc')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as DocumentMeta));
}