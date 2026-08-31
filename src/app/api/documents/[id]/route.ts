// src/app/api/documents/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { logError } from '@/lib/utils/secure-logger';
import { 
  getDocumentByIdFromMongo, 
  updateDocumentInMongo, 
  deleteDocumentFromMongo 
} from '@/lib/db/document-service-mongo';

// GET /api/documents/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const document = await getDocumentByIdFromMongo(id);
    
    if (!document) {
      return NextResponse.json(
        { error: 'Dokument nicht gefunden' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(document);
  } catch (error) {
    logError('Fehler beim Lesen des Dokuments:', error);
    return NextResponse.json(
      { error: 'Fehler beim Lesen des Dokuments' },
      { status: 500 }
    );
  }
}

// PUT /api/documents/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const updatedDocument = await request.json();
    
    const document = await updateDocumentInMongo(id, updatedDocument);
    
    if (!document) {
      return NextResponse.json(
        { error: 'Dokument nicht gefunden' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(document);
  } catch (error) {
    logError('Fehler beim Aktualisieren des Dokuments:', error);
    return NextResponse.json(
      { error: 'Fehler beim Aktualisieren des Dokuments' },
      { status: 500 }
    );
  }
}

// DELETE /api/documents/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const success = await deleteDocumentFromMongo(id);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Dokument nicht gefunden' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    logError('Fehler beim Löschen des Dokuments:', error);
    return NextResponse.json(
      { error: 'Fehler beim Löschen des Dokuments' },
      { status: 500 }
    );
  }
}