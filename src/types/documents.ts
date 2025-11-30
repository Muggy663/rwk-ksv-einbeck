// src/types/documents.ts
import { Timestamp } from 'firebase/firestore';
import { logError, logWarn, logInfo, logDebug } from '@/lib/utils/secure-logger';

export interface DocumentMeta {
  id: string;
  title: string;
  description: string;
  path: string; // Pfad im public-Ordner, z.B. "/documents/ausschreibungen/dokument.pdf"
  category: 'ausschreibung' | 'formular' | 'ordnung' | 'archiv' | 'software';
  date: string;
  fileType: 'PDF' | 'Webseite';
  fileSize: string;
  active: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type DocumentFormData = Omit<DocumentMeta, 'id' | 'createdAt' | 'updatedAt'>;
