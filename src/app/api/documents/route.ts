// src/app/api/documents/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { 
  getAllDocumentsFromMongo, 
  addDocumentToMongo 
} from '@/lib/db/document-service-mongo';

// GET /api/documents
export async function GET() {
  try {
    const documents = await getAllDocumentsFromMongo();
    return NextResponse.json({ documents });
  } catch (error) {
    console.error('Fehler beim Lesen der Dokumente:', error);
    return NextResponse.json(
      { error: 'Fehler beim Lesen der Dokumente' },
      { status: 500 }
    );
  }
}

// POST /api/documents
export async function POST(request: NextRequest) {
  try {
    const document = await request.json();
    
    const newDocument = await addDocumentToMongo(document);
    
    if (!newDocument) {
      return NextResponse.json(
        { error: 'Fehler beim Hinzufügen des Dokuments' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(newDocument);
  } catch (error) {
    console.error('Fehler beim Hinzufügen des Dokuments:', error);
    return NextResponse.json(
      { error: 'Fehler beim Hinzufügen des Dokuments' },
      { status: 500 }
    );
  }
}
