// src/app/api/documents/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { Document } from '@/lib/services/document-service';

const documentsPath = path.join(process.cwd(), 'public', 'data', 'documents.json');

// GET /api/documents/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const fileContents = fs.readFileSync(documentsPath, 'utf8');
    const data = JSON.parse(fileContents);
    
    const document = data.documents.find((doc: Document) => doc.id === params.id);
    
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
    
    // Lese aktuelle Dokumente
    const fileContents = fs.readFileSync(documentsPath, 'utf8');
    const data = JSON.parse(fileContents);
    
    // Finde das zu aktualisierende Dokument
    const index = data.documents.findIndex((doc: Document) => doc.id === params.id);
    
    if (index === -1) {
      return NextResponse.json(
        { error: 'Dokument nicht gefunden' },
        { status: 404 }
      );
    }
    
    // Aktualisiere das Dokument
    data.documents[index] = {
      ...data.documents[index],
      ...updatedDocument,
      id: params.id // Stelle sicher, dass die ID nicht geändert wird
    };
    
    // Schreibe zurück in die Datei
    fs.writeFileSync(documentsPath, JSON.stringify(data, null, 2));
    
    return NextResponse.json(data.documents[index]);
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
    // Lese aktuelle Dokumente
    const fileContents = fs.readFileSync(documentsPath, 'utf8');
    const data = JSON.parse(fileContents);
    
    // Finde das zu löschende Dokument
    const index = data.documents.findIndex((doc: Document) => doc.id === params.id);
    
    if (index === -1) {
      return NextResponse.json(
        { error: 'Dokument nicht gefunden' },
        { status: 404 }
      );
    }
    
    // Entferne das Dokument
    const deletedDocument = data.documents[index];
    data.documents.splice(index, 1);
    
    // Schreibe zurück in die Datei
    fs.writeFileSync(documentsPath, JSON.stringify(data, null, 2));
    
    return NextResponse.json(deletedDocument);
  } catch (error) {
    console.error('Fehler beim Löschen des Dokuments:', error);
    return NextResponse.json(
      { error: 'Fehler beim Löschen des Dokuments' },
      { status: 500 }
    );
  }
}