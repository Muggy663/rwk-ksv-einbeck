// src/app/api/documents/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { 
  getAllDocumentsFromMongo, 
  addDocumentToMongo 
} from '@/lib/db/document-service-mongo';
import { secureLogger } from '@/lib/utils/secure-logger';
import { sanitizeInput } from '@/lib/utils/input-validator';

// GET /api/documents
export async function GET() {
  try {
    const documents = await getAllDocumentsFromMongo();
    return NextResponse.json({ documents });
  } catch (error) {
    secureLogger.error('Documents GET failed', 'documents-api');
    return NextResponse.json(
      { error: 'Fehler beim Lesen der Dokumente' },
      { status: 500 }
    );
  }
}

// POST /api/documents
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Sichere Input-Validierung
    const document = {
      title: sanitizeInput(body.title),
      description: sanitizeInput(body.description),
      category: sanitizeInput(body.category),
      fileId: sanitizeInput(body.fileId),
      fileName: sanitizeInput(body.fileName),
      fileSize: sanitizeInput(body.fileSize),
      fileType: sanitizeInput(body.fileType)
    };
    
    // Validiere erforderliche Felder
    if (!document.title || !document.fileId) {
      secureLogger.warn('Missing required fields in document creation', 'documents-api');
      return NextResponse.json(
        { error: 'Titel und Datei-ID sind erforderlich' },
        { status: 400 }
      );
    }
    
    const newDocument = await addDocumentToMongo(document);
    
    if (!newDocument) {
      return NextResponse.json(
        { error: 'Fehler beim Hinzufügen des Dokuments' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(newDocument);
  } catch (error) {
    secureLogger.error('Document creation failed', 'documents-api');
    return NextResponse.json(
      { error: 'Fehler beim Hinzufügen des Dokuments' },
      { status: 500 }
    );
  }
}
