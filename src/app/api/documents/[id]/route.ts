// src/app/api/documents/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { 
  getDocumentByIdFromMongo, 
  updateDocumentInMongo, 
  deleteDocumentFromMongo 
} from '@/lib/db/document-service-mongo';

// GET /api/documents/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const document = await getDocumentByIdFromMongo(params.id);
    
    if (!document) {
      return NextResponse.json(
        { error: 'Dokument nicht gefunden' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(document);
  } catch (error) {
    console.error('Fehler beim Lesen des Dokuments:', error);
    return NextResponse.json(
      { error: 'Fehler beim Lesen des Dokuments' },
      { status: 500 }
    );
  }
}

// PUT /api/documents/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const updatedDocument = await request.json();
    
    const document = await updateDocumentInMongo(params.id, updatedDocument);
    
    if (!document) {
      return NextResponse.json(
        { error: 'Dokument nicht gefunden' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(document);
  } catch (error) {
    console.error('Fehler beim Aktualisieren des Dokuments:', error);
    return NextResponse.json(
      { error: 'Fehler beim Aktualisieren des Dokuments' },
      { status: 500 }
    );
  }
}

// DELETE /api/documents/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const success = await deleteDocumentFromMongo(params.id);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Dokument nicht gefunden' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Fehler beim Löschen des Dokuments:', error);
    return NextResponse.json(
      { error: 'Fehler beim Löschen des Dokuments' },
      { status: 500 }
    );
  }
}